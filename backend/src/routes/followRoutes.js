import express from 'express';
import { followUser, unfollowUser, isFollowing } from '../services/followService.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * POST /api/users/:id/follow
 * Follow a user
 * Requirements: 9.1
 */
router.post('/:id/follow', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;
    
    // Prevent self-follow
    if (followerId === id) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'You cannot follow yourself'
        }
      });
    }
    
    await followUser(followerId, id);
    
    res.status(201).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to follow user'
      }
    });
  }
});

/**
 * DELETE /api/users/:id/follow
 * Unfollow a user
 * Requirements: 9.2
 */
router.delete('/:id/follow', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;
    
    await unfollowUser(followerId, id);
    
    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to unfollow user'
      }
    });
  }
});

/**
 * GET /api/users/:id/follow/status
 * Check if current user is following a user
 * Requirements: 9.4
 */
router.get('/:id/follow/status', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;
    
    const following = await isFollowing(followerId, id);
    
    res.json({
      following
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check follow status'
      }
    });
  }
});

export default router;
