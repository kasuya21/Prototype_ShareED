import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import {
  getAllAchievements,
  getUserAchievements,
  checkAndUnlockAchievements,
  unlockAchievement
} from '../services/achievementService.js';

describe('Achievement Service', () => {
  let testUserId;
  let testAchievementId;

  beforeEach(() => {
    // Create a test user
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, role, coins)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, `test-${testUserId}@example.com`, 'Test User', 'member', 100);

    // Create a test achievement
    testAchievementId = uuidv4();
    db.prepare(`
      INSERT INTO achievements (id, title, description, badge_image_url, coin_reward, criteria)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      testAchievementId,
      'Test Achievement',
      'Test Description',
      '/badges/test.png',
      50,
      JSON.stringify({ type: 'posts_created', targetValue: 1 })
    );
  });

  afterEach(() => {
    // Clean up test data - delete in correct order to avoid foreign key constraints
    db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM quests WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM achievements WHERE id = ?').run(testAchievementId);
    db.prepare('DELETE FROM posts WHERE author_id = ?').run(testUserId);
    db.prepare('DELETE FROM comments WHERE author_id = ?').run(testUserId);
    db.prepare('DELETE FROM likes WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM follows WHERE follower_id = ? OR following_id = ?').run(testUserId, testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('getAllAchievements', () => {
    it('should return all achievements with parsed criteria', async () => {
      const achievements = await getAllAchievements();

      expect(achievements.length).toBeGreaterThan(0);
      
      const testAchievement = achievements.find(a => a.id === testAchievementId);
      expect(testAchievement).toBeDefined();
      expect(testAchievement.title).toBe('Test Achievement');
      expect(testAchievement.criteria).toEqual({ type: 'posts_created', targetValue: 1 });
    });

    it('should return achievements sorted by coin reward', async () => {
      const achievements = await getAllAchievements();

      for (let i = 1; i < achievements.length; i++) {
        expect(achievements[i].coin_reward).toBeGreaterThanOrEqual(achievements[i - 1].coin_reward);
      }
    });
  });

  describe('getUserAchievements', () => {
    it('should return all achievements with zero progress for new user', async () => {
      const userAchievements = await getUserAchievements(testUserId);

      expect(userAchievements.length).toBeGreaterThan(0);
      
      const testUserAchievement = userAchievements.find(ua => ua.achievementId === testAchievementId);
      expect(testUserAchievement).toBeDefined();
      expect(testUserAchievement.currentProgress).toBe(0);
      expect(testUserAchievement.isUnlocked).toBe(false);
      expect(testUserAchievement.unlockedAt).toBeNull();
    });

    it('should return achievements with progress when user has records', async () => {
      // Create a user achievement record
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, is_unlocked)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), testUserId, testAchievementId, 5, 0);

      const userAchievements = await getUserAchievements(testUserId);
      
      const testUserAchievement = userAchievements.find(ua => ua.achievementId === testAchievementId);
      expect(testUserAchievement.currentProgress).toBe(5);
      expect(testUserAchievement.isUnlocked).toBe(false);
    });

    it('should show unlocked achievements with unlock date', async () => {
      const unlockedAt = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, is_unlocked, unlocked_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), testUserId, testAchievementId, 10, 1, unlockedAt);

      const userAchievements = await getUserAchievements(testUserId);
      
      const testUserAchievement = userAchievements.find(ua => ua.achievementId === testAchievementId);
      expect(testUserAchievement.isUnlocked).toBe(true);
      expect(testUserAchievement.unlockedAt).toBe(unlockedAt);
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should create achievement records for new user', async () => {
      await checkAndUnlockAchievements(testUserId);

      const records = db.prepare(`
        SELECT * FROM user_achievements WHERE user_id = ?
      `).all(testUserId);

      expect(records.length).toBeGreaterThan(0);
    });

    it('should unlock achievement when criteria are met', async () => {
      // Create a post to meet the criteria
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(postId, testUserId, '/cover.jpg', 'Test Post', 'Description', 'Content', 'university', 'active');

      const unlockedAchievements = await checkAndUnlockAchievements(testUserId);

      expect(unlockedAchievements.length).toBeGreaterThan(0);
      
      const testAchievement = unlockedAchievements.find(a => a.id === testAchievementId);
      expect(testAchievement).toBeDefined();

      // Verify achievement is marked as unlocked
      const userAchievement = db.prepare(`
        SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?
      `).get(testUserId, testAchievementId);

      expect(userAchievement.is_unlocked).toBe(1);
    });

    it('should update progress without unlocking if criteria not met', async () => {
      // Create achievement with higher target
      const highTargetAchievementId = uuidv4();
      db.prepare(`
        INSERT INTO achievements (id, title, description, badge_image_url, coin_reward, criteria)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        highTargetAchievementId,
        'High Target Achievement',
        'Test Description',
        '/badges/high.png',
        100,
        JSON.stringify({ type: 'posts_created', targetValue: 10 })
      );

      // Create only 1 post
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(postId, testUserId, '/cover.jpg', 'Test Post', 'Description', 'Content', 'university', 'active');

      await checkAndUnlockAchievements(testUserId);

      const userAchievement = db.prepare(`
        SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?
      `).get(testUserId, highTargetAchievementId);

      expect(userAchievement.current_progress).toBe(1);
      expect(userAchievement.is_unlocked).toBe(0);

      // Clean up
      db.prepare('DELETE FROM user_achievements WHERE achievement_id = ?').run(highTargetAchievementId);
      db.prepare('DELETE FROM achievements WHERE id = ?').run(highTargetAchievementId);
    });

    it('should track different achievement types correctly', async () => {
      // Create achievements for different types
      const commentAchievementId = uuidv4();
      db.prepare(`
        INSERT INTO achievements (id, title, description, badge_image_url, coin_reward, criteria)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        commentAchievementId,
        'Comment Achievement',
        'Test Description',
        '/badges/comment.png',
        30,
        JSON.stringify({ type: 'comments_made', targetValue: 1 })
      );

      // Create a post and comment
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(postId, testUserId, '/cover.jpg', 'Test Post', 'Description', 'Content', 'university', 'active');

      const commentId = uuidv4();
      db.prepare(`
        INSERT INTO comments (id, post_id, author_id, content)
        VALUES (?, ?, ?, ?)
      `).run(commentId, postId, testUserId, 'Test comment');

      const unlockedAchievements = await checkAndUnlockAchievements(testUserId);

      // Should unlock both post and comment achievements
      expect(unlockedAchievements.length).toBeGreaterThanOrEqual(2);

      // Clean up
      db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
      db.prepare('DELETE FROM user_achievements WHERE achievement_id = ?').run(commentAchievementId);
      db.prepare('DELETE FROM achievements WHERE id = ?').run(commentAchievementId);
    });

    it('should not unlock already unlocked achievements', async () => {
      // Create a post
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(postId, testUserId, '/cover.jpg', 'Test Post', 'Description', 'Content', 'university', 'active');

      // First check - should unlock
      const firstUnlock = await checkAndUnlockAchievements(testUserId);
      expect(firstUnlock.length).toBeGreaterThan(0);

      // Second check - should not unlock again
      const secondUnlock = await checkAndUnlockAchievements(testUserId);
      expect(secondUnlock.length).toBe(0);
    });
  });

  describe('unlockAchievement', () => {
    beforeEach(() => {
      // Create a post to meet criteria
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(postId, testUserId, '/cover.jpg', 'Test Post', 'Description', 'Content', 'university', 'active');

      // Create user achievement record
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, is_unlocked)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), testUserId, testAchievementId, 1, 0);
    });

    it('should unlock achievement and award coins', async () => {
      const userBefore = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUserId);

      const result = await unlockAchievement(testUserId, testAchievementId);

      expect(result.success).toBe(true);
      expect(result.coinsAwarded).toBe(50);
      expect(result.newCoinBalance).toBe(userBefore.coins + 50);
      expect(result.badge).toBe('/badges/test.png');
      expect(result.achievementTitle).toBe('Test Achievement');

      // Verify coins were added
      const userAfter = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUserId);
      expect(userAfter.coins).toBe(userBefore.coins + 50);

      // Verify achievement is marked as unlocked
      const userAchievement = db.prepare(`
        SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?
      `).get(testUserId, testAchievementId);
      expect(userAchievement.is_unlocked).toBe(1);
      expect(userAchievement.unlocked_at).toBeTruthy();
    });

    it('should not unlock already unlocked achievement', async () => {
      // Unlock once
      await unlockAchievement(testUserId, testAchievementId);

      // Try to unlock again
      const result = await unlockAchievement(testUserId, testAchievementId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Achievement already unlocked');
    });

    it('should throw error if achievement not found', async () => {
      const fakeAchievementId = uuidv4();

      await expect(
        unlockAchievement(testUserId, fakeAchievementId)
      ).rejects.toThrow('Achievement not found');
    });

    it('should throw error if user achievement record not found', async () => {
      const newAchievementId = uuidv4();
      db.prepare(`
        INSERT INTO achievements (id, title, description, badge_image_url, coin_reward, criteria)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        newAchievementId,
        'New Achievement',
        'Test Description',
        '/badges/new.png',
        50,
        JSON.stringify({ type: 'posts_created', targetValue: 1 })
      );

      await expect(
        unlockAchievement(testUserId, newAchievementId)
      ).rejects.toThrow('User achievement record not found');

      // Clean up - no user_achievements to delete since none were created
      db.prepare('DELETE FROM achievements WHERE id = ?').run(newAchievementId);
    });

    it('should throw error if criteria not met', async () => {
      // Create achievement with higher target
      const highTargetAchievementId = uuidv4();
      db.prepare(`
        INSERT INTO achievements (id, title, description, badge_image_url, coin_reward, criteria)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        highTargetAchievementId,
        'High Target Achievement',
        'Test Description',
        '/badges/high.png',
        100,
        JSON.stringify({ type: 'posts_created', targetValue: 10 })
      );

      // Create user achievement record with insufficient progress
      db.prepare(`
        INSERT INTO user_achievements (id, user_id, achievement_id, current_progress, is_unlocked)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), testUserId, highTargetAchievementId, 1, 0);

      await expect(
        unlockAchievement(testUserId, highTargetAchievementId)
      ).rejects.toThrow('Achievement criteria not met');

      // Clean up
      db.prepare('DELETE FROM user_achievements WHERE achievement_id = ?').run(highTargetAchievementId);
      db.prepare('DELETE FROM achievements WHERE id = ?').run(highTargetAchievementId);
    });

    it('should handle transaction atomically', async () => {
      const userBefore = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUserId);

      await unlockAchievement(testUserId, testAchievementId);

      // Verify both coins and achievement status were updated
      const userAfter = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUserId);
      const userAchievement = db.prepare(`
        SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?
      `).get(testUserId, testAchievementId);

      expect(userAfter.coins).toBe(userBefore.coins + 50);
      expect(userAchievement.is_unlocked).toBe(1);
    });
  });
});
