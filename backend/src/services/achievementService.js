import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { ValidationError } from '../utils/errors.js';
import { notifyAchievementUnlocked } from './notificationTriggers.js';
import cache, { CacheKeys, CacheInvalidation } from '../utils/cache.js';

/**
 * Achievement Service
 * Handles achievements, progress tracking, and automatic unlocking
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

/**
 * Get all achievements
 * @returns {Promise<Array>} Array of all achievements
 */
export async function getAllAchievements() {
  // Use cache for achievements (they rarely change)
  return cache.wrap(CacheKeys.allAchievements(), async () => {
    const stmt = db.prepare(`
      SELECT * FROM achievements
      ORDER BY coin_reward ASC
    `);
  
    const achievements = stmt.all();
  
    // Parse criteria JSON for each achievement
    return achievements.map(achievement => ({
      ...achievement,
      criteria: JSON.parse(achievement.criteria)
    }));
  }, 10 * 60 * 1000); // Cache for 10 minutes
}

/**
 * Get user's achievements with progress
 * Requirement 12.6: Display both locked and unlocked achievements with progress
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user achievements with progress
 */
export async function getUserAchievements(userId) {
  // Get all achievements
  const allAchievements = await getAllAchievements();
  
  // Get user's achievement records
  const stmt = db.prepare(`
    SELECT * FROM user_achievements
    WHERE user_id = ?
  `);
  
  const userAchievementRecords = stmt.all(userId);
  const userAchievementMap = new Map(
    userAchievementRecords.map(ua => [ua.achievement_id, ua])
  );
  
  // Combine all achievements with user progress
  return allAchievements.map(achievement => {
    const userRecord = userAchievementMap.get(achievement.id);
    
    return {
      achievementId: achievement.id,
      achievement: achievement,
      currentProgress: userRecord ? userRecord.current_progress : 0,
      isUnlocked: userRecord ? Boolean(userRecord.is_unlocked) : false,
      unlockedAt: userRecord?.unlocked_at || null
    };
  });
}

/**
 * Check and unlock achievements for a user
 * Requirement 12.1: Automatically unlock achievements when criteria are met
 * Requirement 12.5: Track progress toward achievements continuously
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of newly unlocked achievements
 */
export async function checkAndUnlockAchievements(userId) {
  const newlyUnlocked = [];
  
  // Get all achievements
  const allAchievements = await getAllAchievements();
  
  // Get current user stats
  const userStats = await getUserStats(userId);
  
  // Check each achievement
  for (const achievement of allAchievements) {
    const { type, targetValue } = achievement.criteria;
    
    // Get current progress value based on achievement type
    let currentProgress = 0;
    switch (type) {
      case 'posts_created':
        currentProgress = userStats.postsCreated;
        break;
      case 'posts_read':
        currentProgress = userStats.postsRead;
        break;
      case 'comments_made':
        currentProgress = userStats.commentsMade;
        break;
      case 'likes_given':
        currentProgress = userStats.likesGiven;
        break;
      case 'followers_gained':
        currentProgress = userStats.followersGained;
        break;
      default:
        continue;
    }
    
    // Check if user already has this achievement record
    const existingRecord = db.prepare(`
      SELECT * FROM user_achievements
      WHERE user_id = ? AND achievement_id = ?
    `).get(userId, achievement.id);
    
    if (existingRecord) {
      // Update progress if not unlocked
      if (!existingRecord.is_unlocked) {
        db.prepare(`
          UPDATE user_achievements
          SET current_progress = ?
          WHERE user_id = ? AND achievement_id = ?
        `).run(currentProgress, userId, achievement.id);
        
        // Check if should unlock now
        if (currentProgress >= targetValue) {
          const unlockResult = await unlockAchievement(userId, achievement.id);
          if (unlockResult.success) {
            newlyUnlocked.push(achievement);
          }
        }
      }
    } else {
      // Create new achievement record
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, is_unlocked)
        VALUES (?, ?, ?, ?, 0)
      `).run(uuidv4(), userId, achievement.id, currentProgress);
      
      // Check if should unlock immediately
      if (currentProgress >= targetValue) {
        const unlockResult = await unlockAchievement(userId, achievement.id);
        if (unlockResult.success) {
          newlyUnlocked.push(achievement);
        }
      }
    }
  }
  
  return newlyUnlocked;
}

/**
 * Unlock a specific achievement and distribute rewards
 * Requirements: 12.2, 12.3, 12.4
 * @param {string} userId - User ID
 * @param {string} achievementId - Achievement ID
 * @returns {Promise<Object>} Unlock result with coins awarded and badge
 */
export async function unlockAchievement(userId, achievementId) {
  // Start transaction for atomicity
  const transaction = db.transaction(() => {
    // Get achievement details
    const achievementStmt = db.prepare(`
      SELECT * FROM achievements
      WHERE id = ?
    `);
    
    const achievement = achievementStmt.get(achievementId);
    
    if (!achievement) {
      throw new ValidationError('Achievement not found');
    }
    
    // Parse criteria
    achievement.criteria = JSON.parse(achievement.criteria);
    
    // Get user achievement record
    const userAchievementStmt = db.prepare(`
      SELECT * FROM user_achievements
      WHERE user_id = ? AND achievement_id = ?
    `);
    
    const userAchievement = userAchievementStmt.get(userId, achievementId);
    
    if (!userAchievement) {
      throw new ValidationError('User achievement record not found');
    }
    
    // Check if already unlocked
    if (userAchievement.is_unlocked) {
      return {
        success: false,
        error: 'Achievement already unlocked'
      };
    }
    
    // Verify user meets criteria
    const userStats = getUserStatsSync(userId);
    const { type, targetValue } = achievement.criteria;
    
    let currentProgress = 0;
    switch (type) {
      case 'posts_created':
        currentProgress = userStats.postsCreated;
        break;
      case 'posts_read':
        currentProgress = userStats.postsRead;
        break;
      case 'comments_made':
        currentProgress = userStats.commentsMade;
        break;
      case 'likes_given':
        currentProgress = userStats.likesGiven;
        break;
      case 'followers_gained':
        currentProgress = userStats.followersGained;
        break;
    }
    
    if (currentProgress < targetValue) {
      throw new ValidationError('Achievement criteria not met');
    }
    
    // Requirement 12.2: Award coins immediately
    const userStmt = db.prepare('SELECT coins FROM users WHERE id = ?');
    const user = userStmt.get(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }
    
    const newCoinBalance = user.coins + achievement.coin_reward;
    
    // Update user coins
    const updateCoinsStmt = db.prepare(`
      UPDATE users
      SET coins = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateCoinsStmt.run(newCoinBalance, userId);
    
    // Mark achievement as unlocked
    const updateAchievementStmt = db.prepare(`
      UPDATE user_achievements
      SET is_unlocked = 1, unlocked_at = CURRENT_TIMESTAMP, current_progress = ?
      WHERE user_id = ? AND achievement_id = ?
    `);
    updateAchievementStmt.run(currentProgress, userId, achievementId);
    
    // Requirement 12.4: Award badge (badge is the achievement itself)
    // The badge is represented by the achievement's badge_image_url
    
    return {
      success: true,
      coinsAwarded: achievement.coin_reward,
      newCoinBalance,
      badge: achievement.badge_image_url,
      achievementTitle: achievement.title
    };
  });
  
  const result = transaction();
  
  // Requirement 12.3: Send notification after successful unlock
  if (result.success) {
    await notifyAchievementUnlocked(userId, result.achievementTitle, result.coinsAwarded);
  }
  
  return result;
}

/**
 * Get user statistics for achievement tracking
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
async function getUserStats(userId) {
  // Count posts created
  const postsCreated = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE author_id = ? AND status != 'deleted'
  `).get(userId).count;
  
  // Count posts read (based on likes given as proxy, since we don't track individual reads)
  // For posts_read, we'll use view counts from posts table
  // But since we don't have a separate table tracking which posts a user has read,
  // we'll use a different approach: count distinct posts the user has interacted with
  const postsRead = db.prepare(`
    SELECT COUNT(DISTINCT post_id) as count FROM (
      SELECT post_id FROM likes WHERE user_id = ?
      UNION
      SELECT post_id FROM comments WHERE author_id = ?
      UNION
      SELECT post_id FROM bookmarks WHERE user_id = ?
    )
  `).get(userId, userId, userId).count;
  
  // Count comments made
  const commentsMade = db.prepare(`
    SELECT COUNT(*) as count FROM comments
    WHERE author_id = ?
  `).get(userId).count;
  
  // Count likes given
  const likesGiven = db.prepare(`
    SELECT COUNT(*) as count FROM likes
    WHERE user_id = ?
  `).get(userId).count;
  
  // Count followers gained
  const followersGained = db.prepare(`
    SELECT COUNT(*) as count FROM follows
    WHERE following_id = ?
  `).get(userId).count;
  
  return {
    postsCreated,
    postsRead,
    commentsMade,
    likesGiven,
    followersGained
  };
}

/**
 * Get user statistics synchronously (for use within transactions)
 * @param {string} userId - User ID
 * @returns {Object} User statistics
 */
function getUserStatsSync(userId) {
  // Count posts created
  const postsCreated = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE author_id = ? AND status != 'deleted'
  `).get(userId).count;
  
  // Count posts read
  const postsRead = db.prepare(`
    SELECT COUNT(DISTINCT post_id) as count FROM (
      SELECT post_id FROM likes WHERE user_id = ?
      UNION
      SELECT post_id FROM comments WHERE author_id = ?
      UNION
      SELECT post_id FROM bookmarks WHERE user_id = ?
    )
  `).get(userId, userId, userId).count;
  
  // Count comments made
  const commentsMade = db.prepare(`
    SELECT COUNT(*) as count FROM comments
    WHERE author_id = ?
  `).get(userId).count;
  
  // Count likes given
  const likesGiven = db.prepare(`
    SELECT COUNT(*) as count FROM likes
    WHERE user_id = ?
  `).get(userId).count;
  
  // Count followers gained
  const followersGained = db.prepare(`
    SELECT COUNT(*) as count FROM follows
    WHERE following_id = ?
  `).get(userId).count;
  
  return {
    postsCreated,
    postsRead,
    commentsMade,
    likesGiven,
    followersGained
  };
}
