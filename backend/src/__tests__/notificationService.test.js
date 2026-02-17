import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import db from '../database/db.js';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../services/notificationService.js';
import { v4 as uuidv4 } from 'uuid';

describe('Notification Service', () => {
  let testUserId;

  beforeEach(() => {
    // Create a test user
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, role)
      VALUES (?, ?, ?, ?)
    `).run(testUserId, `test-${testUserId}@example.com`, 'Test User', 'member');
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('createNotification', () => {
    test('should create a notification successfully', async () => {
      const notificationData = {
        userId: testUserId,
        type: 'post_liked',
        title: 'Test Notification',
        message: 'This is a test notification',
        relatedId: 'test-post-id'
      };

      const notification = await createNotification(notificationData);

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(testUserId);
      expect(notification.type).toBe('post_liked');
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('This is a test notification');
      expect(notification.relatedId).toBe('test-post-id');
      expect(notification.isRead).toBe(false);
    });

    test('should throw error for invalid notification type', async () => {
      const notificationData = {
        userId: testUserId,
        type: 'invalid_type',
        title: 'Test',
        message: 'Test'
      };

      await expect(createNotification(notificationData)).rejects.toThrow('Invalid notification type');
    });

    test('should throw error for missing required fields', async () => {
      const notificationData = {
        userId: testUserId,
        type: 'post_liked'
        // Missing title and message
      };

      await expect(createNotification(notificationData)).rejects.toThrow('required');
    });
  });

  describe('getUserNotifications', () => {
    test('should retrieve all notifications for a user', async () => {
      // Create multiple notifications
      await createNotification({
        userId: testUserId,
        type: 'post_liked',
        title: 'Notification 1',
        message: 'Message 1'
      });

      await createNotification({
        userId: testUserId,
        type: 'post_commented',
        title: 'Notification 2',
        message: 'Message 2'
      });

      const notifications = await getUserNotifications(testUserId);

      expect(notifications).toHaveLength(2);
      expect(notifications[0].title).toBe('Notification 2'); // Most recent first
      expect(notifications[1].title).toBe('Notification 1');
    });

    test('should retrieve only unread notifications when unreadOnly is true', async () => {
      // Create notifications
      const notification1 = await createNotification({
        userId: testUserId,
        type: 'post_liked',
        title: 'Notification 1',
        message: 'Message 1'
      });

      await createNotification({
        userId: testUserId,
        type: 'post_commented',
        title: 'Notification 2',
        message: 'Message 2'
      });

      // Mark one as read
      await markAsRead(notification1.id);

      const unreadNotifications = await getUserNotifications(testUserId, true);

      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].title).toBe('Notification 2');
    });
  });

  describe('markAsRead', () => {
    test('should mark a notification as read', async () => {
      const notification = await createNotification({
        userId: testUserId,
        type: 'post_liked',
        title: 'Test',
        message: 'Test'
      });

      expect(notification.isRead).toBe(false);

      await markAsRead(notification.id);

      const notifications = await getUserNotifications(testUserId);
      expect(notifications[0].isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    test('should mark all notifications as read for a user', async () => {
      // Create multiple notifications
      await createNotification({
        userId: testUserId,
        type: 'post_liked',
        title: 'Notification 1',
        message: 'Message 1'
      });

      await createNotification({
        userId: testUserId,
        type: 'post_commented',
        title: 'Notification 2',
        message: 'Message 2'
      });

      await markAllAsRead(testUserId);

      const notifications = await getUserNotifications(testUserId);
      expect(notifications).toHaveLength(2);
      expect(notifications[0].isRead).toBe(true);
      expect(notifications[1].isRead).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    test('should return correct count of unread notifications', async () => {
      // Create notifications
      const notification1 = await createNotification({
        userId: testUserId,
        type: 'post_liked',
        title: 'Notification 1',
        message: 'Message 1'
      });

      await createNotification({
        userId: testUserId,
        type: 'post_commented',
        title: 'Notification 2',
        message: 'Message 2'
      });

      await createNotification({
        userId: testUserId,
        type: 'new_follower_post',
        title: 'Notification 3',
        message: 'Message 3'
      });

      let count = await getUnreadCount(testUserId);
      expect(count).toBe(3);

      // Mark one as read
      await markAsRead(notification1.id);

      count = await getUnreadCount(testUserId);
      expect(count).toBe(2);
    });
  });
});
