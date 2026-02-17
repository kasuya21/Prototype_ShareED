import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../services/notificationService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 * Query params: unreadOnly (boolean)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await getUserNotifications(userId, unreadOnly);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(error.statusCode || 500).json({
      error: {
        code: error.name || 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch notifications'
      }
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the authenticated user
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(error.statusCode || 500).json({
      error: {
        code: error.name || 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch unread count'
      }
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    await markAsRead(notificationId);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(error.statusCode || 500).json({
      error: {
        code: error.name || 'INTERNAL_ERROR',
        message: error.message || 'Failed to mark notification as read'
      }
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    await markAllAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(error.statusCode || 500).json({
      error: {
        code: error.name || 'INTERNAL_ERROR',
        message: error.message || 'Failed to mark all notifications as read'
      }
    });
  }
});

export default router;
