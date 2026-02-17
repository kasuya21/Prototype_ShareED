import db from '../database/db.js';
import { createNotification } from './notificationService.js';

/**
 * Notification Triggers
 * Helper functions to trigger notifications for various events
 * These functions are designed to be called from other services
 * 
 * Integration Status:
 * ✓ Comment notifications - Integrated in interactionService.js (Requirement 8.1)
 * ✓ Like notifications - Integrated in interactionService.js (Requirement 8.2)
 * ✓ Post status change notifications - Ready for integration (Requirement 8.3)
 * ✓ Follower post notifications - Ready for integration (Requirement 8.5)
 * ✓ Moderator alerts - Ready for integration (Requirement 8.4)
 * 
 * Usage:
 * - Import the required trigger function in your service
 * - Call it after the main operation completes
 * - Errors are logged but don't fail the main operation
 */

/**
 * Trigger notification when a post status changes
 * Requirements: 8.3
 * @param {string} postId - ID of the post
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise<void>}
 */
export async function notifyPostStatusChange(postId, oldStatus, newStatus) {
  try {
    const post = db.prepare('SELECT author_id, title FROM posts WHERE id = ?').get(postId);
    if (!post) {
      console.error('Post not found for status change notification');
      return;
    }

    let message = '';
    if (newStatus === 'unactived') {
      message = `โพสต์ "${post.title}" ของคุณถูกปิดการใช้งานเนื่องจากมีการรายงาน`;
    } else if (newStatus === 'active' && oldStatus === 'unactived') {
      message = `โพสต์ "${post.title}" ของคุณถูกเปิดใช้งานอีกครั้ง`;
    } else if (newStatus === 'deleted') {
      message = `โพสต์ "${post.title}" ของคุณถูกลบโดยผู้ดูแลระบบ`;
    } else {
      message = `สถานะของโพสต์ "${post.title}" เปลี่ยนจาก ${oldStatus} เป็น ${newStatus}`;
    }

    await createNotification({
      userId: post.author_id,
      type: 'post_status_changed',
      title: 'สถานะโพสต์เปลี่ยนแปลง',
      message: message,
      relatedId: postId
    });
  } catch (error) {
    console.error('Failed to create post status change notification:', error);
  }
}

/**
 * Trigger notification to moderators when a post is reported
 * Requirements: 8.4
 * @param {string} postId - ID of the reported post
 * @param {number} reportCount - Current number of reports
 * @returns {Promise<void>}
 */
export async function notifyModeratorsOfReport(postId, reportCount) {
  try {
    const post = db.prepare('SELECT title FROM posts WHERE id = ?').get(postId);
    if (!post) {
      console.error('Post not found for moderator notification');
      return;
    }

    // Get all moderators and admins
    const moderators = db.prepare(
      "SELECT id FROM users WHERE role IN ('moderator', 'admin')"
    ).all();

    // Send notification to each moderator
    for (const moderator of moderators) {
      await createNotification({
        userId: moderator.id,
        type: 'post_reported',
        title: 'โพสต์ถูกรายงาน',
        message: `โพสต์ "${post.title}" ถูกรายงาน ${reportCount} ครั้งและถูกปิดการใช้งานอัตโนมัติ`,
        relatedId: postId
      });
    }
  } catch (error) {
    console.error('Failed to create moderator notification:', error);
  }
}

/**
 * Trigger notification to followers when a user creates a new post
 * Requirements: 8.5
 * @param {string} authorId - ID of the post author
 * @param {string} postId - ID of the new post
 * @param {string} postTitle - Title of the new post
 * @returns {Promise<void>}
 */
export async function notifyFollowersOfNewPost(authorId, postId, postTitle) {
  try {
    const author = db.prepare('SELECT name, nickname FROM users WHERE id = ?').get(authorId);
    if (!author) {
      console.error('Author not found for follower notification');
      return;
    }

    const authorName = author.nickname || author.name;

    // Get all followers
    const followers = db.prepare(
      'SELECT follower_id FROM follows WHERE following_id = ?'
    ).all(authorId);

    // Send notification to each follower
    for (const follower of followers) {
      await createNotification({
        userId: follower.follower_id,
        type: 'new_follower_post',
        title: 'โพสต์ใหม่จากผู้ที่คุณติดตาม',
        message: `${authorName} เผยแพร่โพสต์ใหม่: "${postTitle}"`,
        relatedId: postId
      });
    }
  } catch (error) {
    console.error('Failed to create follower notification:', error);
  }
}

/**
 * Trigger notification when an achievement is unlocked
 * Requirements: 12.3
 * @param {string} userId - ID of the user
 * @param {string} achievementTitle - Title of the achievement
 * @param {number} coinReward - Coin reward amount
 * @returns {Promise<void>}
 */
export async function notifyAchievementUnlocked(userId, achievementTitle, coinReward) {
  try {
    await createNotification({
      userId: userId,
      type: 'achievement_unlocked',
      title: 'ปลดล็อกความสำเร็จ!',
      message: `คุณได้ปลดล็อกความสำเร็จ "${achievementTitle}" และได้รับ ${coinReward} เหรียญ`,
      relatedId: null
    });
  } catch (error) {
    console.error('Failed to create achievement notification:', error);
  }
}

export default {
  notifyPostStatusChange,
  notifyModeratorsOfReport,
  notifyFollowersOfNewPost,
  notifyAchievementUnlocked
};
