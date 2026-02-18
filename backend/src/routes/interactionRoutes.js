import express from 'express';
import {
  likePost,
  unlikePost,
  hasUserLiked,
  getPostLikes,
  createComment,
  getPostComments,
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  hasUserBookmarked
} from '../services/interactionService.js';
import { authenticate } from '../middleware/auth.js';
import { commentLimiter } from '../middleware/rateLimiter.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * POST /api/posts/:postId/like
 * Like or unlike a post (toggle behavior)
 * Requirements: 14.1, 14.2, 14.3
 */
router.post('/:postId/like', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await likePost(userId, postId);

    res.json({
      success: true,
      message: 'Post like toggled successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/posts/:postId/like
 * Unlike a post
 * Requirements: 14.2
 */
router.delete('/:postId/like', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await unlikePost(userId, postId);

    res.json({
      success: true,
      message: 'Post unliked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts/:postId/like/status
 * Check if current user has liked the post
 * Requirements: 14.3
 */
router.get('/:postId/like/status', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const liked = await hasUserLiked(userId, postId);

    res.json({
      liked
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts/:postId/likes
 * Get all users who liked the post
 */
router.get('/:postId/likes', async (req, res, next) => {
  try {
    const { postId } = req.params;

    const likes = await getPostLikes(postId);

    res.json({
      likes,
      count: likes.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/posts/:postId/comments
 * Create a comment on a post
 * Requirements: 14.4, 14.5
 */
router.post('/:postId/comments', authenticate, commentLimiter, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Comment content is required'
        }
      });
    }

    const comment = await createComment(userId, postId, content);

    res.status(201).json({
      comment
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
    
    next(error);
  }
});

/**
 * GET /api/posts/:postId/comments
 * Get all comments for a post
 * Requirements: 14.6
 */
router.get('/:postId/comments', async (req, res, next) => {
  try {
    const { postId } = req.params;

    const comments = await getPostComments(postId);

    res.json({
      comments,
      count: comments.length
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    next(error);
  }
});

/**
 * POST /api/posts/:postId/bookmark
 * Add a bookmark to a post
 * Requirements: 10.1, 10.4
 */
router.post('/:postId/bookmark', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await addBookmark(userId, postId);

    res.status(201).json({
      success: true,
      message: 'Post bookmarked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/posts/:postId/bookmark
 * Remove a bookmark from a post
 * Requirements: 10.2
 */
router.delete('/:postId/bookmark', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await removeBookmark(userId, postId);

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts/:postId/bookmark/status
 * Check if current user has bookmarked the post
 * Requirements: 10.4
 */
router.get('/:postId/bookmark/status', authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const bookmarked = await hasUserBookmarked(userId, postId);

    res.json({
      bookmarked
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:userId/bookmarks
 * Get all bookmarked posts for a user
 * Requirements: 10.3
 */
router.get('/users/:userId/bookmarks', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own bookmarks
    if (userId !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own bookmarks'
        }
      });
    }

    const bookmarks = await getUserBookmarks(userId);

    res.json({
      bookmarks,
      count: bookmarks.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
