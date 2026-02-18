import express from 'express';
import postService from '../services/postService.js';
import searchService from '../services/searchService.js';
import db from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { postCreationLimiter, searchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Search posts
router.get('/search', searchLimiter, async (req, res) => {
  try {
    const { keyword, educationLevel, sortBy, page, pageSize } = req.query;
    
    const result = await searchService.searchPosts({
      keyword,
      educationLevel,
      sortBy,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error searching posts:', error);
    
    if (error.message.includes('Invalid')) {
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
        message: 'Failed to search posts' 
      } 
    });
  }
});

// Get popular posts
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const posts = await postService.getPopularPosts(limit);
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching popular posts:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch popular posts' } });
  }
});

// Get all posts with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM posts WHERE status = ?'
    ).get('active');
    
    // Get posts
    const posts = db.prepare(
      `SELECT p.*, u.nickname as author_name, u.profile_picture as author_picture
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.status = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    ).all('active', pageSize, offset);

    res.json({
      posts,
      totalCount: countResult.total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch posts' } });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await postService.getPost(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    // Increment view count
    await postService.incrementViewCount(req.params.id);

    res.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    // Check if it's a NotFoundError
    if (error.status === 404 || error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: error.message || 'Post not found' } });
    }
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch post' } });
  }
});

// Create post (authenticated)
router.post('/', authenticate, postCreationLimiter, async (req, res) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    res.status(201).json({ post });
  } catch (error) {
    console.error('Error creating post:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: error.message } });
    }
    
    if (error.message.includes('required')) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
    }

    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create post' } });
  }
});

// Update post (authenticated)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const post = await postService.updatePost(req.user.id, req.params.id, req.body);
    res.json({ post });
  } catch (error) {
    console.error('Error updating post:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }
    
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to update this post' } });
    }

    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update post' } });
  }
});

// Delete post (authenticated)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await postService.deletePost(req.user.id, req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }
    
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to delete this post' } });
    }

    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete post' } });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await postService.getUserPosts(req.params.userId);
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch user posts' } });
  }
});

export default router;
