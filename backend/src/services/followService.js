import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { checkAndUnlockAchievements } from './achievementService.js';

/**
 * Follow Service
 * Handles user follow/unfollow functionality
 */

/**
 * Follow a user
 * Requirements: 9.1
 * @param {string} followerId - ID of the user who is following
 * @param {string} followingId - ID of the user to follow
 * @returns {Promise<void>}
 */
export async function followUser(followerId, followingId) {
  if (!followerId || !followingId) {
    throw new ValidationError('Follower ID and Following ID are required');
  }

  // Prevent self-follow
  if (followerId === followingId) {
    throw new ValidationError('Cannot follow yourself');
  }

  // Check if both users exist
  const follower = db.prepare('SELECT id FROM users WHERE id = ?').get(followerId);
  if (!follower) {
    throw new NotFoundError('Follower user not found');
  }

  const following = db.prepare('SELECT id FROM users WHERE id = ?').get(followingId);
  if (!following) {
    throw new NotFoundError('User to follow not found');
  }

  // Requirement 9.4: Check if already following (duplicate prevention)
  const existingFollow = db.prepare(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
  ).get(followerId, followingId);

  if (existingFollow) {
    throw new ConflictError('Already following this user');
  }

  // Requirement 9.1: Create follow relationship
  const followId = uuidv4();
  db.prepare(
    'INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)'
  ).run(followId, followerId, followingId);

  // Requirement 12.1, 12.5: Check and unlock achievements after follow action
  // Check achievements for the user who gained a follower (followingId)
  try {
    await checkAndUnlockAchievements(followingId);
  } catch (error) {
    // Log error but don't fail the follow operation
    console.error('Failed to check achievements:', error);
  }
}

/**
 * Unfollow a user
 * Requirements: 9.2
 * @param {string} followerId - ID of the user who is unfollowing
 * @param {string} followingId - ID of the user to unfollow
 * @returns {Promise<void>}
 */
export async function unfollowUser(followerId, followingId) {
  if (!followerId || !followingId) {
    throw new ValidationError('Follower ID and Following ID are required');
  }

  // Check if follow relationship exists
  const existingFollow = db.prepare(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
  ).get(followerId, followingId);

  if (!existingFollow) {
    throw new NotFoundError('Follow relationship not found');
  }

  // Requirement 9.2: Remove follow relationship
  db.prepare(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
  ).run(followerId, followingId);
}

/**
 * Check if a user is following another user
 * Requirements: 9.4
 * @param {string} followerId - ID of the follower user
 * @param {string} followingId - ID of the user being followed
 * @returns {Promise<boolean>} - True if following
 */
export async function isFollowing(followerId, followingId) {
  if (!followerId || !followingId) {
    return false;
  }

  const follow = db.prepare(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
  ).get(followerId, followingId);

  return !!follow;
}

/**
 * Get follower count for a user
 * Requirements: 9.5
 * @param {string} userId - ID of the user
 * @returns {Promise<number>} - Number of followers
 */
export async function getFollowerCount(userId) {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Requirement 9.5: Count followers
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
  ).get(userId);

  return result.count;
}

/**
 * Get following count for a user
 * Requirements: 9.5
 * @param {string} userId - ID of the user
 * @returns {Promise<number>} - Number of users being followed
 */
export async function getFollowingCount(userId) {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Requirement 9.5: Count following
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?'
  ).get(userId);

  return result.count;
}

export default {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowerCount,
  getFollowingCount
};
