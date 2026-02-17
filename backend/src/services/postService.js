import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { updateQuestProgress } from './questService.js';

/**
 * Post Service
 * Handles post creation, updates, deletion, and retrieval
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.2
 */

/**
 * Check if user has exceeded rate limit (3 posts per 24 hours)
 * Requirement 3.3: Rate limiting check
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user can create post, false if rate limited
 */
export async function checkRateLimit(userId) {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM posts
    WHERE author_id = ? AND created_at > ?
  `);

  const result = stmt.get(userId, twentyFourHoursAgo.toISOString());
  return result.count < 3;
}

/**
 * Create a new post
 * Requirements: 3.1, 3.2, 3.3, 3.4, 11.2
 * @param {string} userId - User ID
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} - Created post object
 */
export async function createPost(userId, postData) {
  const { coverImage, title, description, content, educationLevel, tags = [], contentImages = [] } = postData;

  // Requirement 3.1: Validate required fields
  if (!coverImage || !title || !description || !content || !educationLevel) {
    throw new ValidationError('Cover image, title, description, content, and education level are required');
  }

  // Validate education level
  const validEducationLevels = ['junior_high', 'senior_high', 'university'];
  if (!validEducationLevels.includes(educationLevel)) {
    throw new ValidationError('Invalid education level');
  }

  // Requirement 3.3, 3.4: Check rate limit
  const canCreate = await checkRateLimit(userId);
  if (!canCreate) {
    throw new ValidationError('Rate limit exceeded. You can only create 3 posts per 24 hours');
  }

  // Create post
  const postId = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO posts (
      id, author_id, cover_image, title, description, content,
      education_level, tags, content_images, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  stmt.run(
    postId,
    userId,
    coverImage,
    title,
    description,
    content,
    educationLevel,
    JSON.stringify(tags),
    JSON.stringify(contentImages)
  );

  // Retrieve created post
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

  // Requirement 11.2: Update quest progress for create_post
  try {
    await updateQuestProgress(userId, 'create_post', 1);
  } catch (error) {
    // Log error but don't fail the post creation
    console.error('Failed to update quest progress:', error);
  }

  return {
    id: post.id,
    authorId: post.author_id,
    coverImage: post.cover_image,
    title: post.title,
    description: post.description,
    content: post.content,
    educationLevel: post.education_level,
    tags: JSON.parse(post.tags),
    contentImages: JSON.parse(post.content_images),
    status: post.status,
    likeCount: post.like_count,
    viewCount: post.view_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
}

/**
 * Update a post
 * Requirement 3.5: Only post owner can edit
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @param {Object} updates - Post updates
 * @returns {Promise<Object>} - Updated post object
 */
export async function updatePost(userId, postId, updates) {
  // Check if post exists
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Requirement 3.5: Verify ownership
  if (post.author_id !== userId) {
    throw new ForbiddenError('You can only edit your own posts');
  }

  // Build update query dynamically
  const allowedFields = ['cover_image', 'title', 'description', 'content', 'education_level', 'tags', 'content_images'];
  const updateFields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(snakeKey)) {
      updateFields.push(`${snakeKey} = ?`);
      if (snakeKey === 'tags' || snakeKey === 'content_images') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    }
  }

  if (updateFields.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(postId);

  const stmt = db.prepare(`
    UPDATE posts
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  // Retrieve updated post
  const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

  return {
    id: updatedPost.id,
    authorId: updatedPost.author_id,
    coverImage: updatedPost.cover_image,
    title: updatedPost.title,
    description: updatedPost.description,
    content: updatedPost.content,
    educationLevel: updatedPost.education_level,
    tags: JSON.parse(updatedPost.tags),
    contentImages: JSON.parse(updatedPost.content_images),
    status: updatedPost.status,
    likeCount: updatedPost.like_count,
    viewCount: updatedPost.view_count,
    commentCount: updatedPost.comment_count,
    createdAt: updatedPost.created_at,
    updatedAt: updatedPost.updated_at
  };
}

/**
 * Delete a post (soft delete)
 * Requirement 3.6: Soft delete
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export async function deletePost(userId, postId) {
  // Check if post exists
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Requirement 3.5: Verify ownership
  if (post.author_id !== userId) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  // Requirement 3.6: Soft delete
  const stmt = db.prepare(`
    UPDATE posts
    SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(postId);
}

/**
 * Get a post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object>} - Post object
 */
export async function getPost(postId) {
  const post = db.prepare(`
    SELECT p.*, u.name as author_name, u.nickname as author_nickname, 
           u.profile_picture as author_picture
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(postId);

  if (!post) {
    throw new NotFoundError('Post not found');
  }

  return {
    id: post.id,
    authorId: post.author_id,
    coverImage: post.cover_image,
    title: post.title,
    description: post.description,
    content: post.content,
    educationLevel: post.education_level,
    tags: JSON.parse(post.tags),
    contentImages: JSON.parse(post.content_images),
    status: post.status,
    likeCount: post.like_count,
    viewCount: post.view_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: {
      name: post.author_name,
      nickname: post.author_nickname,
      profilePicture: post.author_picture
    }
  };
}

/**
 * Get all posts by a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of post objects
 */
export async function getUserPosts(userId) {
  const posts = db.prepare(`
    SELECT p.*, u.name as author_name, u.nickname as author_nickname, 
           u.profile_picture as author_picture
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.author_id = ? AND p.status != 'deleted'
    ORDER BY p.created_at DESC
  `).all(userId);

  return posts.map(post => ({
    id: post.id,
    authorId: post.author_id,
    coverImage: post.cover_image,
    title: post.title,
    description: post.description,
    content: post.content,
    educationLevel: post.education_level,
    tags: JSON.parse(post.tags),
    contentImages: JSON.parse(post.content_images),
    status: post.status,
    likeCount: post.like_count,
    viewCount: post.view_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: {
      name: post.author_name,
      nickname: post.author_nickname,
      profilePicture: post.author_picture
    }
  }));
}

/**
 * Increment view count for a post
 * Requirement 5.2: Increment view counter
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export async function incrementViewCount(postId) {
  const stmt = db.prepare(`
    UPDATE posts
    SET view_count = view_count + 1
    WHERE id = ?
  `);

  stmt.run(postId);
}

/**
 * Get popular posts
 * Requirement 5.1: Display posts sorted by like count
 * @param {number} limit - Number of posts to retrieve
 * @returns {Promise<Array>} - Array of popular post objects
 */
export async function getPopularPosts(limit = 10) {
  const posts = db.prepare(`
    SELECT p.*, u.name as author_name, u.nickname as author_nickname, 
           u.profile_picture as author_picture
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.status = 'active'
    ORDER BY p.like_count DESC, p.created_at DESC
    LIMIT ?
  `).all(limit);

  return posts.map(post => ({
    id: post.id,
    authorId: post.author_id,
    coverImage: post.cover_image,
    title: post.title,
    description: post.description,
    content: post.content,
    educationLevel: post.education_level,
    tags: JSON.parse(post.tags),
    contentImages: JSON.parse(post.content_images),
    status: post.status,
    likeCount: post.like_count,
    viewCount: post.view_count,
    commentCount: post.comment_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    author: {
      name: post.author_name,
      nickname: post.author_nickname,
      profilePicture: post.author_picture
    }
  }));
}

export default {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getUserPosts,
  incrementViewCount,
  getPopularPosts,
  checkRateLimit
};
