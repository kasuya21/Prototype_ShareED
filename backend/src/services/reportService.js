import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';
import { notifyModeratorsOfReport, notifyPostStatusChange } from './notificationTriggers.js';

/**
 * Report Service
 * Handles post reporting and moderation
 */

/**
 * Report a post
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * @param {string} userId - Reporter user ID
 * @param {string} postId - Post ID to report
 * @param {string} reason - Report reason
 * @returns {Promise<Object>} Report object
 */
export async function reportPost(userId, postId, reason) {
  if (!userId || !postId || !reason) {
    throw new ValidationError('User ID, Post ID, and reason are required');
  }

  // Check if post exists
  const post = db.prepare('SELECT id, status, author_id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Requirement 4.2: Check for duplicate report
  const existingReport = db.prepare(
    'SELECT id FROM reports WHERE reporter_id = ? AND post_id = ?'
  ).get(userId, postId);

  if (existingReport) {
    throw new ValidationError('You have already reported this post');
  }

  // Create report
  const reportId = uuidv4();
  db.prepare(
    'INSERT INTO reports (id, post_id, reporter_id, reason) VALUES (?, ?, ?, ?)'
  ).run(reportId, postId, userId, reason);

  // Get report count
  const reportCount = db.prepare(
    'SELECT COUNT(*) as count FROM reports WHERE post_id = ?'
  ).get(postId).count;

  // Requirement 4.3: Automatically deactivate post if it reaches 10 reports
  if (reportCount >= 10 && post.status === 'active') {
    db.prepare(
      'UPDATE posts SET status = ? WHERE id = ?'
    ).run('unactived', postId);

    // Requirement 4.4: Notify all moderators
    await notifyModeratorsOfReport(postId, reportCount);

    // Notify post author
    await notifyPostStatusChange(post.author_id, postId, 'unactived');
  }

  return db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
}

/**
 * Check if user has reported a post
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @returns {Promise<boolean>} True if user has reported
 */
export async function hasUserReported(userId, postId) {
  const report = db.prepare(
    'SELECT id FROM reports WHERE reporter_id = ? AND post_id = ?'
  ).get(userId, postId);

  return !!report;
}

/**
 * Get report count for a post
 * @param {string} postId - Post ID
 * @returns {Promise<number>} Report count
 */
export async function getReportCount(postId) {
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM reports WHERE post_id = ?'
  ).get(postId);

  return result.count;
}

/**
 * Get all reported posts (for Moderators)
 * Requirement 4.5: Display posts with unactived status or with reports
 * @returns {Promise<Array>} Array of posts with reports
 */
export async function getReportedPosts() {
  const posts = db.prepare(`
    SELECT DISTINCT p.*, 
           u.name as author_name, 
           u.nickname as author_nickname,
           (SELECT COUNT(*) FROM reports WHERE post_id = p.id) as report_count
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.status = 'unactived' 
       OR p.id IN (SELECT DISTINCT post_id FROM reports)
    ORDER BY report_count DESC, p.updated_at DESC
  `).all();

  // Get reports for each post
  const postsWithReports = posts.map(post => {
    const reports = db.prepare(`
      SELECT r.*, u.name as reporter_name, u.nickname as reporter_nickname
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.post_id = ?
      ORDER BY r.created_at DESC
    `).all(post.id);

    return {
      post: {
        id: post.id,
        authorId: post.author_id,
        authorName: post.author_nickname || post.author_name,
        coverImage: post.cover_image,
        title: post.title,
        description: post.description,
        content: post.content,
        educationLevel: post.education_level,
        tags: JSON.parse(post.tags || '[]'),
        status: post.status,
        likeCount: post.like_count,
        viewCount: post.view_count,
        commentCount: post.comment_count,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      },
      reports: reports.map(r => ({
        id: r.id,
        reporterId: r.reporter_id,
        reporterName: r.reporter_nickname || r.reporter_name,
        reason: r.reason,
        createdAt: r.created_at
      })),
      reportCount: post.report_count
    };
  });

  return postsWithReports;
}

/**
 * Moderator deletes a post (permanent soft delete)
 * Requirement 4.6
 * @param {string} moderatorId - Moderator user ID
 * @param {string} postId - Post ID to delete
 * @returns {Promise<void>}
 */
export async function moderatorDeletePost(moderatorId, postId) {
  // Verify moderator has moderator or admin role
  const moderator = db.prepare('SELECT role FROM users WHERE id = ?').get(moderatorId);
  if (!moderator || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
    throw new AuthorizationError('Only moderators and admins can delete posts');
  }

  // Check if post exists
  const post = db.prepare('SELECT id, author_id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Soft delete the post
  db.prepare(
    'UPDATE posts SET status = ? WHERE id = ?'
  ).run('deleted', postId);

  // Notify post author
  await notifyPostStatusChange(post.author_id, postId, 'deleted');
}

/**
 * Moderator restores a post
 * Requirement 4.7
 * @param {string} moderatorId - Moderator user ID
 * @param {string} postId - Post ID to restore
 * @returns {Promise<void>}
 */
export async function moderatorRestorePost(moderatorId, postId) {
  // Verify moderator has moderator or admin role
  const moderator = db.prepare('SELECT role FROM users WHERE id = ?').get(moderatorId);
  if (!moderator || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
    throw new AuthorizationError('Only moderators and admins can restore posts');
  }

  // Check if post exists
  const post = db.prepare('SELECT id, author_id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Restore the post
  db.prepare(
    'UPDATE posts SET status = ? WHERE id = ?'
  ).run('active', postId);

  // Notify post author
  await notifyPostStatusChange(post.author_id, postId, 'active');
}
