import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowerCount,
  getFollowingCount
} from '../services/followService.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';

describe('Follow Service', () => {
  let testUser1;
  let testUser2;
  let testUser3;

  beforeEach(() => {
    // Create test users
    testUser1 = {
      id: uuidv4(),
      email: `test1-${Date.now()}@example.com`,
      name: 'Test User 1',
      nickname: `testuser1${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser1.id, testUser1.email, testUser1.name, testUser1.nickname, testUser1.role);

    testUser2 = {
      id: uuidv4(),
      email: `test2-${Date.now()}@example.com`,
      name: 'Test User 2',
      nickname: `testuser2${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser2.id, testUser2.email, testUser2.name, testUser2.nickname, testUser2.role);

    testUser3 = {
      id: uuidv4(),
      email: `test3-${Date.now()}@example.com`,
      name: 'Test User 3',
      nickname: `testuser3${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser3.id, testUser3.email, testUser3.name, testUser3.nickname, testUser3.role);
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM follows WHERE follower_id IN (?, ?, ?) OR following_id IN (?, ?, ?)').run(
      testUser1.id, testUser2.id, testUser3.id,
      testUser1.id, testUser2.id, testUser3.id
    );
    db.prepare('DELETE FROM users WHERE id IN (?, ?, ?)').run(testUser1.id, testUser2.id, testUser3.id);
  });

  describe('followUser', () => {
    test('should successfully follow a user (Requirement 9.1, Property 31)', async () => {
      await followUser(testUser1.id, testUser2.id);

      const following = await isFollowing(testUser1.id, testUser2.id);
      expect(following).toBe(true);

      // Verify follow relationship exists in database
      const follow = db.prepare(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?'
      ).get(testUser1.id, testUser2.id);
      
      expect(follow).toBeDefined();
      expect(follow.follower_id).toBe(testUser1.id);
      expect(follow.following_id).toBe(testUser2.id);
      expect(follow.created_at).toBeDefined();
    });

    test('should throw ConflictError for duplicate follow (Requirement 9.4, Property 33)', async () => {
      // Follow first time
      await followUser(testUser1.id, testUser2.id);
      
      // Try to follow again
      await expect(followUser(testUser1.id, testUser2.id)).rejects.toThrow(ConflictError);
      await expect(followUser(testUser1.id, testUser2.id)).rejects.toThrow('Already following');
    });

    test('should throw ValidationError when trying to follow yourself', async () => {
      await expect(followUser(testUser1.id, testUser1.id)).rejects.toThrow(ValidationError);
      await expect(followUser(testUser1.id, testUser1.id)).rejects.toThrow('Cannot follow yourself');
    });

    test('should throw NotFoundError for non-existent follower', async () => {
      await expect(followUser('non-existent-id', testUser2.id)).rejects.toThrow(NotFoundError);
      await expect(followUser('non-existent-id', testUser2.id)).rejects.toThrow('Follower user not found');
    });

    test('should throw NotFoundError for non-existent user to follow', async () => {
      await expect(followUser(testUser1.id, 'non-existent-id')).rejects.toThrow(NotFoundError);
      await expect(followUser(testUser1.id, 'non-existent-id')).rejects.toThrow('User to follow not found');
    });

    test('should throw ValidationError for missing followerId', async () => {
      await expect(followUser(null, testUser2.id)).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing followingId', async () => {
      await expect(followUser(testUser1.id, null)).rejects.toThrow(ValidationError);
    });

    test('should allow multiple users to follow the same user', async () => {
      await followUser(testUser1.id, testUser3.id);
      await followUser(testUser2.id, testUser3.id);

      expect(await isFollowing(testUser1.id, testUser3.id)).toBe(true);
      expect(await isFollowing(testUser2.id, testUser3.id)).toBe(true);

      const followerCount = await getFollowerCount(testUser3.id);
      expect(followerCount).toBe(2);
    });

    test('should allow one user to follow multiple users', async () => {
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser1.id, testUser3.id);

      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);
      expect(await isFollowing(testUser1.id, testUser3.id)).toBe(true);

      const followingCount = await getFollowingCount(testUser1.id);
      expect(followingCount).toBe(2);
    });

    test('should create bidirectional follows independently', async () => {
      // User 1 follows User 2
      await followUser(testUser1.id, testUser2.id);
      
      // User 2 follows User 1
      await followUser(testUser2.id, testUser1.id);

      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);
      expect(await isFollowing(testUser2.id, testUser1.id)).toBe(true);
    });
  });

  describe('unfollowUser', () => {
    test('should successfully unfollow a user (Requirement 9.2, Property 32)', async () => {
      // Follow first
      await followUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);

      // Then unfollow
      await unfollowUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(false);

      // Verify follow relationship is removed from database
      const follow = db.prepare(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?'
      ).get(testUser1.id, testUser2.id);
      
      expect(follow).toBeUndefined();
    });

    test('should throw NotFoundError if follow relationship does not exist', async () => {
      await expect(unfollowUser(testUser1.id, testUser2.id)).rejects.toThrow(NotFoundError);
      await expect(unfollowUser(testUser1.id, testUser2.id)).rejects.toThrow('Follow relationship not found');
    });

    test('should throw ValidationError for missing followerId', async () => {
      await expect(unfollowUser(null, testUser2.id)).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing followingId', async () => {
      await expect(unfollowUser(testUser1.id, null)).rejects.toThrow(ValidationError);
    });

    test('should only remove specific follow relationship', async () => {
      // User 1 follows User 2 and User 3
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser1.id, testUser3.id);

      // Unfollow User 2
      await unfollowUser(testUser1.id, testUser2.id);

      // User 1 should still follow User 3
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(false);
      expect(await isFollowing(testUser1.id, testUser3.id)).toBe(true);
    });

    test('should handle bidirectional unfollows independently', async () => {
      // Both users follow each other
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser2.id, testUser1.id);

      // User 1 unfollows User 2
      await unfollowUser(testUser1.id, testUser2.id);

      // User 2 should still follow User 1
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(false);
      expect(await isFollowing(testUser2.id, testUser1.id)).toBe(true);
    });
  });

  describe('isFollowing', () => {
    test('should return true if user is following another user (Requirement 9.4)', async () => {
      await followUser(testUser1.id, testUser2.id);
      const following = await isFollowing(testUser1.id, testUser2.id);
      expect(following).toBe(true);
    });

    test('should return false if user is not following another user', async () => {
      const following = await isFollowing(testUser1.id, testUser2.id);
      expect(following).toBe(false);
    });

    test('should return false after unfollowing', async () => {
      await followUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);

      await unfollowUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(false);
    });

    test('should return false for missing followerId', async () => {
      const following = await isFollowing(null, testUser2.id);
      expect(following).toBe(false);
    });

    test('should return false for missing followingId', async () => {
      const following = await isFollowing(testUser1.id, null);
      expect(following).toBe(false);
    });

    test('should distinguish between bidirectional follows', async () => {
      // Only User 1 follows User 2
      await followUser(testUser1.id, testUser2.id);

      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);
      expect(await isFollowing(testUser2.id, testUser1.id)).toBe(false);
    });
  });

  describe('getFollowerCount', () => {
    test('should return correct follower count (Requirement 9.5, Property 34)', async () => {
      // Initially no followers
      let count = await getFollowerCount(testUser3.id);
      expect(count).toBe(0);

      // User 1 follows User 3
      await followUser(testUser1.id, testUser3.id);
      count = await getFollowerCount(testUser3.id);
      expect(count).toBe(1);

      // User 2 also follows User 3
      await followUser(testUser2.id, testUser3.id);
      count = await getFollowerCount(testUser3.id);
      expect(count).toBe(2);
    });

    test('should decrement count after unfollow', async () => {
      await followUser(testUser1.id, testUser3.id);
      await followUser(testUser2.id, testUser3.id);
      
      let count = await getFollowerCount(testUser3.id);
      expect(count).toBe(2);

      await unfollowUser(testUser1.id, testUser3.id);
      count = await getFollowerCount(testUser3.id);
      expect(count).toBe(1);
    });

    test('should return 0 for user with no followers', async () => {
      const count = await getFollowerCount(testUser1.id);
      expect(count).toBe(0);
    });

    test('should throw NotFoundError for non-existent user', async () => {
      await expect(getFollowerCount('non-existent-id')).rejects.toThrow(NotFoundError);
      await expect(getFollowerCount('non-existent-id')).rejects.toThrow('User not found');
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(getFollowerCount(null)).rejects.toThrow(ValidationError);
    });

    test('should match actual number of follow relationships in database', async () => {
      await followUser(testUser1.id, testUser3.id);
      await followUser(testUser2.id, testUser3.id);

      const count = await getFollowerCount(testUser3.id);
      
      const dbCount = db.prepare(
        'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
      ).get(testUser3.id).count;

      expect(count).toBe(dbCount);
      expect(count).toBe(2);
    });
  });

  describe('getFollowingCount', () => {
    test('should return correct following count (Requirement 9.5, Property 34)', async () => {
      // Initially not following anyone
      let count = await getFollowingCount(testUser1.id);
      expect(count).toBe(0);

      // User 1 follows User 2
      await followUser(testUser1.id, testUser2.id);
      count = await getFollowingCount(testUser1.id);
      expect(count).toBe(1);

      // User 1 also follows User 3
      await followUser(testUser1.id, testUser3.id);
      count = await getFollowingCount(testUser1.id);
      expect(count).toBe(2);
    });

    test('should decrement count after unfollow', async () => {
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser1.id, testUser3.id);
      
      let count = await getFollowingCount(testUser1.id);
      expect(count).toBe(2);

      await unfollowUser(testUser1.id, testUser2.id);
      count = await getFollowingCount(testUser1.id);
      expect(count).toBe(1);
    });

    test('should return 0 for user not following anyone', async () => {
      const count = await getFollowingCount(testUser1.id);
      expect(count).toBe(0);
    });

    test('should throw NotFoundError for non-existent user', async () => {
      await expect(getFollowingCount('non-existent-id')).rejects.toThrow(NotFoundError);
      await expect(getFollowingCount('non-existent-id')).rejects.toThrow('User not found');
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(getFollowingCount(null)).rejects.toThrow(ValidationError);
    });

    test('should match actual number of follow relationships in database', async () => {
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser1.id, testUser3.id);

      const count = await getFollowingCount(testUser1.id);
      
      const dbCount = db.prepare(
        'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?'
      ).get(testUser1.id).count;

      expect(count).toBe(dbCount);
      expect(count).toBe(2);
    });
  });

  describe('Follow Integration Tests', () => {
    test('should maintain follow integrity across multiple operations', async () => {
      // User 1 follows User 2 and User 3
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser1.id, testUser3.id);
      
      expect(await getFollowingCount(testUser1.id)).toBe(2);
      expect(await getFollowerCount(testUser2.id)).toBe(1);
      expect(await getFollowerCount(testUser3.id)).toBe(1);

      // User 2 follows User 3
      await followUser(testUser2.id, testUser3.id);
      
      expect(await getFollowingCount(testUser2.id)).toBe(1);
      expect(await getFollowerCount(testUser3.id)).toBe(2);

      // User 1 unfollows User 2
      await unfollowUser(testUser1.id, testUser2.id);
      
      expect(await getFollowingCount(testUser1.id)).toBe(1);
      expect(await getFollowerCount(testUser2.id)).toBe(0);
    });

    test('should handle concurrent follows from different users', async () => {
      await Promise.all([
        followUser(testUser1.id, testUser3.id),
        followUser(testUser2.id, testUser3.id)
      ]);

      expect(await isFollowing(testUser1.id, testUser3.id)).toBe(true);
      expect(await isFollowing(testUser2.id, testUser3.id)).toBe(true);
      expect(await getFollowerCount(testUser3.id)).toBe(2);
    });

    test('should maintain accurate counts with complex follow patterns', async () => {
      // Create a follow network
      await followUser(testUser1.id, testUser2.id);
      await followUser(testUser1.id, testUser3.id);
      await followUser(testUser2.id, testUser1.id);
      await followUser(testUser2.id, testUser3.id);
      await followUser(testUser3.id, testUser1.id);

      // Verify counts
      expect(await getFollowerCount(testUser1.id)).toBe(2); // User 2 and User 3 follow User 1
      expect(await getFollowingCount(testUser1.id)).toBe(2); // User 1 follows User 2 and User 3

      expect(await getFollowerCount(testUser2.id)).toBe(1); // User 1 follows User 2
      expect(await getFollowingCount(testUser2.id)).toBe(2); // User 2 follows User 1 and User 3

      expect(await getFollowerCount(testUser3.id)).toBe(2); // User 1 and User 2 follow User 3
      expect(await getFollowingCount(testUser3.id)).toBe(1); // User 3 follows User 1
    });

    test('should handle follow/unfollow cycles correctly', async () => {
      // Follow
      await followUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);
      expect(await getFollowerCount(testUser2.id)).toBe(1);

      // Unfollow
      await unfollowUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(false);
      expect(await getFollowerCount(testUser2.id)).toBe(0);

      // Follow again
      await followUser(testUser1.id, testUser2.id);
      expect(await isFollowing(testUser1.id, testUser2.id)).toBe(true);
      expect(await getFollowerCount(testUser2.id)).toBe(1);
    });
  });
});
