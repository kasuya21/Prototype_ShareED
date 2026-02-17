import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import {
  generateDailyQuests,
  getUserQuests,
  updateQuestProgress,
  claimQuestReward,
  resetDailyQuests
} from '../services/questService.js';

describe('Quest Service', () => {
  let testUserId;

  beforeEach(() => {
    // Create a test user
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, role, coins)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, `test-${testUserId}@example.com`, 'Test User', 'member', 100);
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM quests WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('generateDailyQuests', () => {
    it('should generate 3 daily quests for a user', async () => {
      const quests = await generateDailyQuests(testUserId);

      expect(quests).toHaveLength(3);
      expect(quests.map(q => q.type)).toContain('create_post');
      expect(quests.map(q => q.type)).toContain('comment_post');
      expect(quests.map(q => q.type)).toContain('like_post');
    });

    it('should set correct target amounts and rewards', async () => {
      const quests = await generateDailyQuests(testUserId);

      const createPostQuest = quests.find(q => q.type === 'create_post');
      const commentQuest = quests.find(q => q.type === 'comment_post');
      const likeQuest = quests.find(q => q.type === 'like_post');

      expect(createPostQuest.target_amount).toBe(1);
      expect(createPostQuest.reward).toBe(50);

      expect(commentQuest.target_amount).toBe(3);
      expect(commentQuest.reward).toBe(30);

      expect(likeQuest.target_amount).toBe(5);
      expect(likeQuest.reward).toBe(20);
    });

    it('should set expiration time to 24 hours from now', async () => {
      const beforeGeneration = new Date();
      const quests = await generateDailyQuests(testUserId);
      const afterGeneration = new Date();

      const quest = quests[0];
      const expiresAt = new Date(quest.expires_at);
      
      // Should expire approximately 24 hours from now
      const expectedExpiration = new Date(beforeGeneration.getTime() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiration.getTime());
      
      // Allow 1 minute tolerance
      expect(timeDiff).toBeLessThan(60 * 1000);
    });

    it('should return existing active quests if they exist', async () => {
      const firstQuests = await generateDailyQuests(testUserId);
      const secondQuests = await generateDailyQuests(testUserId);

      expect(secondQuests).toHaveLength(3);
      expect(secondQuests.map(q => q.id)).toEqual(firstQuests.map(q => q.id));
    });

    it('should initialize quests with zero progress', async () => {
      const quests = await generateDailyQuests(testUserId);

      quests.forEach(quest => {
        expect(quest.current_amount).toBe(0);
        expect(quest.is_completed).toBe(0);
        expect(quest.is_claimed).toBe(0);
      });
    });
  });

  describe('getUserQuests', () => {
    it('should return all quests for a user', async () => {
      await generateDailyQuests(testUserId);
      const quests = await getUserQuests(testUserId);

      expect(quests).toHaveLength(3);
      quests.forEach(quest => {
        expect(quest.user_id).toBe(testUserId);
      });
    });

    it('should return empty array if user has no quests', async () => {
      const quests = await getUserQuests(testUserId);
      expect(quests).toHaveLength(0);
    });

    it('should return quests in descending order by creation date', async () => {
      await generateDailyQuests(testUserId);
      
      // Create an additional quest manually with a later timestamp
      const newQuestId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      db.prepare(`
        INSERT INTO quests (id, user_id, type, title, description, target_amount, reward, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newQuestId, testUserId, 'create_post', 'Test Quest', 'Test', 1, 10, expiresAt.toISOString());

      const quests = await getUserQuests(testUserId);
      
      expect(quests).toHaveLength(4);
      // First quest should be the most recently created
      expect(quests[0].id).toBe(newQuestId);
    });
  });

  describe('updateQuestProgress', () => {
    it('should increment quest progress', async () => {
      await generateDailyQuests(testUserId);
      const questsBefore = await getUserQuests(testUserId);
      const likeQuest = questsBefore.find(q => q.type === 'like_post');

      await updateQuestProgress(testUserId, 'like_post', 1);

      const questsAfter = await getUserQuests(testUserId);
      const updatedQuest = questsAfter.find(q => q.id === likeQuest.id);

      expect(updatedQuest.current_amount).toBe(1);
    });

    it('should mark quest as completed when target is reached', async () => {
      await generateDailyQuests(testUserId);
      const questsBefore = await getUserQuests(testUserId);
      const createPostQuest = questsBefore.find(q => q.type === 'create_post');

      // Target is 1, so updating by 1 should complete it
      await updateQuestProgress(testUserId, 'create_post', 1);

      const questsAfter = await getUserQuests(testUserId);
      const updatedQuest = questsAfter.find(q => q.id === createPostQuest.id);

      expect(updatedQuest.current_amount).toBe(1);
      expect(updatedQuest.is_completed).toBe(1);
    });

    it('should mark quest as completed when progress exceeds target', async () => {
      await generateDailyQuests(testUserId);
      
      // Update progress beyond target
      await updateQuestProgress(testUserId, 'like_post', 10);

      const quests = await getUserQuests(testUserId);
      const likeQuest = quests.find(q => q.type === 'like_post');

      expect(likeQuest.current_amount).toBe(10);
      expect(likeQuest.is_completed).toBe(1);
    });

    it('should not update progress for non-existent quest type', async () => {
      await generateDailyQuests(testUserId);
      
      // This should not throw an error, just silently do nothing
      await updateQuestProgress(testUserId, 'invalid_type', 1);

      const quests = await getUserQuests(testUserId);
      expect(quests).toHaveLength(3);
    });

    it('should not update progress for already claimed quests', async () => {
      await generateDailyQuests(testUserId);
      
      // Complete and claim a quest
      await updateQuestProgress(testUserId, 'create_post', 1);
      const quests = await getUserQuests(testUserId);
      const createPostQuest = quests.find(q => q.type === 'create_post');
      await claimQuestReward(testUserId, createPostQuest.id);

      // Try to update progress again
      await updateQuestProgress(testUserId, 'create_post', 1);

      const questsAfter = await getUserQuests(testUserId);
      const updatedQuest = questsAfter.find(q => q.id === createPostQuest.id);

      // Progress should still be 1, not 2
      expect(updatedQuest.current_amount).toBe(1);
    });
  });

  describe('claimQuestReward', () => {
    it('should award coins and mark quest as claimed', async () => {
      await generateDailyQuests(testUserId);
      
      // Complete a quest
      await updateQuestProgress(testUserId, 'create_post', 1);
      
      const quests = await getUserQuests(testUserId);
      const createPostQuest = quests.find(q => q.type === 'create_post');
      
      const userBefore = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUserId);
      
      const result = await claimQuestReward(testUserId, createPostQuest.id);

      expect(result.success).toBe(true);
      expect(result.coinsAwarded).toBe(50);
      expect(result.newCoinBalance).toBe(userBefore.coins + 50);

      const questAfter = db.prepare('SELECT * FROM quests WHERE id = ?').get(createPostQuest.id);
      expect(questAfter.is_claimed).toBe(1);
    });

    it('should throw error if quest is not completed', async () => {
      await generateDailyQuests(testUserId);
      
      const quests = await getUserQuests(testUserId);
      const incompleteQuest = quests.find(q => q.type === 'like_post');

      await expect(
        claimQuestReward(testUserId, incompleteQuest.id)
      ).rejects.toThrow('Quest not completed');
    });

    it('should throw error if quest is already claimed', async () => {
      await generateDailyQuests(testUserId);
      
      // Complete and claim a quest
      await updateQuestProgress(testUserId, 'create_post', 1);
      const quests = await getUserQuests(testUserId);
      const createPostQuest = quests.find(q => q.type === 'create_post');
      
      await claimQuestReward(testUserId, createPostQuest.id);

      // Try to claim again
      await expect(
        claimQuestReward(testUserId, createPostQuest.id)
      ).rejects.toThrow('Quest reward already claimed');
    });

    it('should throw error if quest does not exist', async () => {
      const fakeQuestId = uuidv4();

      await expect(
        claimQuestReward(testUserId, fakeQuestId)
      ).rejects.toThrow('Quest not found');
    });

    it('should throw error if quest has expired', async () => {
      // Create an expired quest
      const expiredQuestId = uuidv4();
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1); // 1 hour ago

      db.prepare(`
        INSERT INTO quests (id, user_id, type, title, description, target_amount, current_amount, reward, is_completed, is_claimed, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        expiredQuestId,
        testUserId,
        'create_post',
        'Expired Quest',
        'Test',
        1,
        1,
        50,
        1,
        0,
        expiredDate.toISOString()
      );

      await expect(
        claimQuestReward(testUserId, expiredQuestId)
      ).rejects.toThrow('Quest has expired');
    });
  });

  describe('resetDailyQuests', () => {
    it('should delete expired quests', async () => {
      // Create an expired quest
      const expiredQuestId = uuidv4();
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1);

      db.prepare(`
        INSERT INTO quests (id, user_id, type, title, description, target_amount, reward, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        expiredQuestId,
        testUserId,
        'create_post',
        'Expired Quest',
        'Test',
        1,
        50,
        expiredDate.toISOString()
      );

      // Create a non-expired quest
      await generateDailyQuests(testUserId);

      await resetDailyQuests();

      const remainingQuests = await getUserQuests(testUserId);
      
      // Should have 3 active quests, expired one should be deleted
      expect(remainingQuests).toHaveLength(3);
      expect(remainingQuests.find(q => q.id === expiredQuestId)).toBeUndefined();
    });

    it('should not delete active quests', async () => {
      await generateDailyQuests(testUserId);
      const questsBefore = await getUserQuests(testUserId);

      await resetDailyQuests();

      const questsAfter = await getUserQuests(testUserId);
      
      expect(questsAfter).toHaveLength(3);
      expect(questsAfter.map(q => q.id).sort()).toEqual(questsBefore.map(q => q.id).sort());
    });
  });
});
