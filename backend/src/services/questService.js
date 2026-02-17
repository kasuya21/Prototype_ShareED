import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Quest Service
 * Handles daily quests, progress tracking, and reward claiming
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7
 */

/**
 * Generate daily quests for a user
 * Requirement 11.1: Generate daily quests for creating posts, commenting, and liking posts
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of generated quests
 */
export async function generateDailyQuests(userId) {
  // Check if user already has active quests
  const existingQuests = await getUserQuests(userId);
  const activeQuests = existingQuests.filter(q => new Date(q.expires_at) > new Date());
  
  if (activeQuests.length > 0) {
    return activeQuests;
  }
  
  // Define quest templates
  const questTemplates = [
    {
      type: 'create_post',
      title: 'สร้างโพสต์',
      description: 'สร้างโพสต์ใหม่ 1 โพสต์',
      target_amount: 1,
      reward: 50
    },
    {
      type: 'comment_post',
      title: 'แสดงความคิดเห็น',
      description: 'แสดงความคิดเห็นในโพสต์ 3 ครั้ง',
      target_amount: 3,
      reward: 30
    },
    {
      type: 'like_post',
      title: 'กดไลค์โพสต์',
      description: 'กดไลค์โพสต์ 5 โพสต์',
      target_amount: 5,
      reward: 20
    }
  ];
  
  // Calculate expiration time (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  const quests = [];
  
  // Create quests in a transaction
  const transaction = db.transaction(() => {
    for (const template of questTemplates) {
      const questId = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO quests (
          id, user_id, type, title, description, 
          target_amount, current_amount, reward, 
          is_completed, is_claimed, expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0, 0, ?)
      `);
      
      stmt.run(
        questId,
        userId,
        template.type,
        template.title,
        template.description,
        template.target_amount,
        template.reward,
        expiresAt.toISOString()
      );
      
      quests.push({
        id: questId,
        user_id: userId,
        type: template.type,
        title: template.title,
        description: template.description,
        target_amount: template.target_amount,
        current_amount: 0,
        reward: template.reward,
        is_completed: 0,
        is_claimed: 0,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
    }
    
    return quests;
  });
  
  return transaction();
}

/**
 * Get user's quests
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's quests
 */
export async function getUserQuests(userId) {
  const stmt = db.prepare(`
    SELECT * FROM quests
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  
  return stmt.all(userId);
}

/**
 * Update quest progress
 * Requirement 11.2: Mark quest as completable when objective is met
 * @param {string} userId - User ID
 * @param {string} questType - Quest type (create_post, comment_post, like_post)
 * @param {number} amount - Amount to increment (default 1)
 * @returns {Promise<void>}
 */
export async function updateQuestProgress(userId, questType, amount = 1) {
  // Get active quests of this type
  const stmt = db.prepare(`
    SELECT * FROM quests
    WHERE user_id = ? 
      AND type = ? 
      AND is_claimed = 0
      AND expires_at > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `);
  
  const quest = stmt.get(userId, questType);
  
  if (!quest) {
    return; // No active quest of this type
  }
  
  // Update progress
  const newAmount = quest.current_amount + amount;
  const isCompleted = newAmount >= quest.target_amount ? 1 : 0;
  
  const updateStmt = db.prepare(`
    UPDATE quests
    SET current_amount = ?, is_completed = ?
    WHERE id = ?
  `);
  
  updateStmt.run(newAmount, isCompleted, quest.id);
}

/**
 * Claim quest reward
 * Requirements: 11.3, 11.4, 11.5, 11.7
 * @param {string} userId - User ID
 * @param {string} questId - Quest ID
 * @returns {Promise<Object>} Claim result with coins awarded and new balance
 * @throws {ValidationError} If quest is not completed or already claimed
 */
export async function claimQuestReward(userId, questId) {
  // Start transaction for atomicity
  const transaction = db.transaction(() => {
    // Get quest details
    const questStmt = db.prepare(`
      SELECT * FROM quests
      WHERE id = ? AND user_id = ?
    `);
    
    const quest = questStmt.get(questId, userId);
    
    if (!quest) {
      throw new ValidationError('Quest not found');
    }
    
    // Requirement 11.7: Reject if already claimed
    if (quest.is_claimed) {
      throw new ValidationError('Quest reward already claimed');
    }
    
    // Requirements 11.3, 11.4: Verify quest is completed
    if (!quest.is_completed) {
      throw new ValidationError('Quest not completed');
    }
    
    // Check if quest has expired
    if (new Date(quest.expires_at) < new Date()) {
      throw new ValidationError('Quest has expired');
    }
    
    // Requirement 11.5: Add coins to user account
    const userStmt = db.prepare('SELECT coins FROM users WHERE id = ?');
    const user = userStmt.get(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }
    
    const newCoinBalance = user.coins + quest.reward;
    
    // Update user coins
    const updateCoinsStmt = db.prepare(`
      UPDATE users
      SET coins = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateCoinsStmt.run(newCoinBalance, userId);
    
    // Mark quest as claimed
    const updateQuestStmt = db.prepare(`
      UPDATE quests
      SET is_claimed = 1
      WHERE id = ?
    `);
    updateQuestStmt.run(questId);
    
    return {
      success: true,
      coinsAwarded: quest.reward,
      newCoinBalance
    };
  });
  
  return transaction();
}

/**
 * Reset daily quests (called by scheduler every 24 hours)
 * Requirement 11.6: Reset all daily quests
 * @returns {Promise<void>}
 */
export async function resetDailyQuests() {
  // Delete expired quests
  const stmt = db.prepare(`
    DELETE FROM quests
    WHERE expires_at < datetime('now')
  `);
  
  stmt.run();
}
