import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Notification Service
 * Handles notification creation, retrieval, and read status management
 */

/**
 * Valid notification types
 */
const NOTIFICATION_TYPES = [
  'post_liked',
  'post_commented',
  'post_status_changed',
  'post_reported',
  'new_follower_post',
  'bookmark_removed',
  'achievement_unlocked'
];

/**
 * Create a notification
 * Requirements: 8.6
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.userId - ID of the user to receive the notification
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.relatedId] - Optional related entity ID (post ID, comment ID, etc.)
 * @returns {Promise<Object>} - Created notification object
 */
export async function createNotification(notificationData) {
  const { userId, type, title, message, relatedId } = notificationData;

  // Validate required fields
  if (!userId || !type || !title || !message) {
    throw new ValidationError('User ID, type, title, and message are required');
  }

  // Validate notification type
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new ValidationError(`Invalid notification type. Must be one of: ${NOTIFICATION_TYPES.join(', ')}`);
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Create notification
  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(notificationId, userId, type, title, message, relatedId || null);

  // Retrieve and return the created notification
  const notification = db.prepare(`
    SELECT id, user_id, type, title, message, related_id, is_read, created_at
    FROM notifications
    WHERE id = ?
  `).get(notificationId);

  return {
    id: notification.id,
    userId: notification.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.related_id,
    isRead: !!notification.is_read,
    createdAt: notification.created_at
  };
}

/**
 * Get notifications for a user
 * Requirements: 8.6
 * @param {string} userId - ID of the user
 * @param {boolean} [unreadOnly=false] - If true, only return unread notifications
 * @returns {Promise<Array>} - Array of notification objects
 */
export async function getUserNotifications(userId, unreadOnly = false) {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Build query based on unreadOnly parameter
  let query = `
    SELECT id, user_id, type, title, message, related_id, is_read, created_at
    FROM notifications
    WHERE user_id = ?
  `;

  if (unreadOnly) {
    query += ' AND is_read = 0';
  }

  query += ' ORDER BY created_at DESC';

  const notifications = db.prepare(query).all(userId);

  return notifications.map(notification => ({
    id: notification.id,
    userId: notification.user_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.related_id,
    isRead: !!notification.is_read,
    createdAt: notification.created_at
  }));
}

/**
 * Mark a notification as read
 * Requirements: 8.7
 * @param {string} notificationId - ID of the notification
 * @returns {Promise<void>}
 */
export async function markAsRead(notificationId) {
  if (!notificationId) {
    throw new ValidationError('Notification ID is required');
  }

  // Check if notification exists
  const notification = db.prepare('SELECT id FROM notifications WHERE id = ?').get(notificationId);
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Mark as read
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);
}

/**
 * Mark all notifications as read for a user
 * Requirements: 8.7
 * @param {string} userId - ID of the user
 * @returns {Promise<void>}
 */
export async function markAllAsRead(userId) {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Mark all notifications as read
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
}

/**
 * Get count of unread notifications for a user
 * Requirements: 8.7
 * @param {string} userId - ID of the user
 * @returns {Promise<number>} - Count of unread notifications
 */
export async function getUnreadCount(userId) {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Count unread notifications
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId);

  return result.count;
}

export default {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
