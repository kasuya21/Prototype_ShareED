import express from 'express';
import { 
  reportPost, 
  getReportedPosts, 
  moderatorDeletePost, 
  moderatorRestorePost 
} from '../services/reportService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { reportLimiter, apiLimiter } from '../middleware/rateLimiter.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors.js';

const router = express.Router();

/**
 * POST /api/posts/:id/report
 * Report a post
 * Requirements: 4.1, 4.2
 */
router.post('/:id/report', reportLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Report reason is required'
        }
      });
    }
    
    const report = await reportPost(req.user.id, id, reason);
    
    res.status(201).json({
      success: true,
      message: 'Post reported successfully',
      report: {
        id: report.id,
        postId: report.post_id,
        reason: report.reason,
        createdAt: report.created_at
      }
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
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to report post'
      }
    });
  }
});

/**
 * GET /api/moderation/reported-posts
 * Get all reported posts (Moderator only)
 * Requirements: 4.5
 */
router.get('/reported-posts', apiLimiter, authenticate, authorize('moderator', 'admin'), async (req, res) => {
  try {
    const posts = await getReportedPosts();
    
    res.json({
      posts,
      count: posts.length
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch reported posts'
      }
    });
  }
});

/**
 * DELETE /api/moderation/posts/:id
 * Moderator deletes a post
 * Requirements: 4.6
 */
router.delete('/posts/:id', apiLimiter, authenticate, authorize('moderator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await moderatorDeletePost(req.user.id, id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete post'
      }
    });
  }
});

/**
 * PUT /api/moderation/posts/:id/restore
 * Moderator restores a post
 * Requirements: 4.7
 */
router.put('/posts/:id/restore', apiLimiter, authenticate, authorize('moderator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await moderatorRestorePost(req.user.id, id);
    
    res.json({
      success: true,
      message: 'Post restored successfully'
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to restore post'
      }
    });
  }
});

export default router;
