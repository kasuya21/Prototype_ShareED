import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { createNotification } from './notificationService.js';
import { updateQuestProgress } from './questService.js';

/**
 * Interaction Service
 * Handles likes, comments, and bookmarks for posts
 */

/**
 * Like a post
 * Requirements: 14.1
 * @param {string} userId - ID of the user liking the post
 * @param {string} postId - ID of the post to like
 * @returns {Promise<void>}
 */
export async function likePost(userId, postId) {
  if (!userId || !postId) {
    throw new ValidationError('User ID and Post ID are required');
  }

  // Check if post exists and get author info
  const post = db.prepare('SELECT id, status, author_id, title FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Check if user already liked the post
  const existingLike = db.prepare(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);

  if (existingLike) {
    // Requirement 14.3: If already liked, treat as unlike
    return unlikePost(userId, postId);
  }

  // Create like and increment counter in a transaction
  const transaction = db.transaction(() => {
    const likeId = uuidv4();
    db.prepare(
      'INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)'
    ).run(likeId, userId, postId);

    // Increment like count
    db.prepare(
      'UPDATE posts SET like_count = like_count + 1 WHERE id = ?'
    ).run(postId);
  });

  transaction();

  // Requirement 8.2: Send notification to post owner (if not liking own post)
  if (post.author_id !== userId) {
    try {
      const liker = db.prepare('SELECT name, nickname FROM users WHERE id = ?').get(userId);
      const likerName = liker.nickname || liker.name;
      
      await createNotification({
        userId: post.author_id,
        type: 'post_liked',
        title: 'โพสต์ของคุณถูกถูกใจ',
        message: `${likerName} ถูกใจโพสต์ "${post.title}" ของคุณ`,
        relatedId: postId
      });
    } catch (error) {
      // Log error but don't fail the like operation
      console.error('Failed to create like notification:', error);
    }
  }

  // Requirement 11.2: Update quest progress for like_post
  try {
    await updateQuestProgress(userId, 'like_post', 1);
  } catch (error) {
    // Log error but don't fail the like operation
    console.error('Failed to update quest progress:', error);
  }
}

/**
 * Unlike a post
 * Requirements: 14.2
 * @param {string} userId - ID of the user unliking the post
 * @param {string} postId - ID of the post to unlike
 * @returns {Promise<void>}
 */
export async function unlikePost(userId, postId) {
  if (!userId || !postId) {
    throw new ValidationError('User ID and Post ID are required');
  }

  // Check if like exists
  const existingLike = db.prepare(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);

  if (!existingLike) {
    // Silently ignore if not liked
    return;
  }

  // Remove like and decrement counter in a transaction
  const transaction = db.transaction(() => {
    db.prepare(
      'DELETE FROM likes WHERE user_id = ? AND post_id = ?'
    ).run(userId, postId);

    // Decrement like count (ensure it doesn't go below 0)
    db.prepare(
      'UPDATE posts SET like_count = MAX(0, like_count - 1) WHERE id = ?'
    ).run(postId);
  });

  transaction();
}

/**
 * Check if a user has liked a post
 * Requirements: 14.3
 * @param {string} userId - ID of the user
 * @param {string} postId - ID of the post
 * @returns {Promise<boolean>} - True if user has liked the post
 */
export async function hasUserLiked(userId, postId) {
  if (!userId || !postId) {
    return false;
  }

  const like = db.prepare(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);

  return !!like;
}

/**
 * Get all users who liked a post
 * @param {string} postId - ID of the post
 * @returns {Promise<Array>} - Array of user objects
 */
export async function getPostLikes(postId) {
  if (!postId) {
    throw new ValidationError('Post ID is required');
  }

  const likes = db.prepare(`
    SELECT u.id, u.name, u.nickname, u.profile_picture, l.created_at
    FROM likes l
    JOIN users u ON l.user_id = u.id
    WHERE l.post_id = ?
    ORDER BY l.created_at DESC
  `).all(postId);

  return likes;
}

/**
 * Create a comment on a post
 * Requirements: 14.4
 * @param {string} userId - ID of the user creating the comment
 * @param {string} postId - ID of the post to comment on
 * @param {string} content - Content of the comment
 * @returns {Promise<Object>} - Created comment object
 */
export async function createComment(userId, postId, content) {
  if (!userId || !postId || !content) {
    throw new ValidationError('User ID, Post ID, and content are required');
  }

  // Validate content is not empty after trimming
  if (content.trim().length === 0) {
    throw new ValidationError('Comment content cannot be empty');
  }

  // Check if post exists and get author info
  const post = db.prepare('SELECT id, status, author_id, title FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Create comment and increment counter in a transaction
  const commentId = uuidv4();
  const transaction = db.transaction(() => {
    db.prepare(
      'INSERT INTO comments (id, post_id, author_id, content) VALUES (?, ?, ?, ?)'
    ).run(commentId, postId, userId, content);

    // Increment comment count - Requirement 14.4
    db.prepare(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?'
    ).run(postId);
  });

  transaction();

  // Retrieve and return the created comment
  const comment = db.prepare(`
    SELECT c.id, c.post_id, c.author_id, c.content, c.created_at,
           u.name as author_name, u.nickname as author_nickname, u.profile_picture as author_picture
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).get(commentId);

  // Requirement 8.1: Send notification to post owner (if not commenting on own post)
  if (post.author_id !== userId) {
    try {
      const commenter = db.prepare('SELECT name, nickname FROM users WHERE id = ?').get(userId);
      const commenterName = commenter.nickname || commenter.name;
      
      await createNotification({
        userId: post.author_id,
        type: 'post_commented',
        title: 'มีคอมเมนต์ใหม่',
        message: `${commenterName} แสดงความคิดเห็นในโพสต์ "${post.title}" ของคุณ`,
        relatedId: postId
      });
    } catch (error) {
      // Log error but don't fail the comment operation
      console.error('Failed to create comment notification:', error);
    }
  }

  // Requirement 11.2: Update quest progress for comment_post
  try {
    await updateQuestProgress(userId, 'comment_post', 1);
  } catch (error) {
    // Log error but don't fail the comment operation
    console.error('Failed to update quest progress:', error);
  }

  return {
    id: comment.id,
    postId: comment.post_id,
    authorId: comment.author_id,
    content: comment.content,
    createdAt: comment.created_at,
    author: {
      name: comment.author_name,
      nickname: comment.author_nickname,
      profilePicture: comment.author_picture
    }
  };
}

/**
 * Get all comments for a post in chronological order
 * Requirements: 14.6
 * @param {string} postId - ID of the post
 * @returns {Promise<Array>} - Array of comment objects sorted chronologically
 */
export async function getPostComments(postId) {
  if (!postId) {
    throw new ValidationError('Post ID is required');
  }

  // Check if post exists
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Requirement 14.6: Display comments in chronological order
  const comments = db.prepare(`
    SELECT c.id, c.post_id, c.author_id, c.content, c.created_at,
           u.name as author_name, u.nickname as author_nickname, u.profile_picture as author_picture
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(postId);

  return comments.map(comment => ({
    id: comment.id,
    postId: comment.post_id,
    authorId: comment.author_id,
    content: comment.content,
    createdAt: comment.created_at,
    author: {
      name: comment.author_name,
      nickname: comment.author_nickname,
      profilePicture: comment.author_picture
    }
  }));
}

/**
 * Add a bookmark to a post
 * Requirements: 10.1, 10.4
 * @param {string} userId - ID of the user bookmarking the post
 * @param {string} postId - ID of the post to bookmark
 * @returns {Promise<void>}
 */
export async function addBookmark(userId, postId) {
  if (!userId || !postId) {
    throw new ValidationError('User ID and Post ID are required');
  }

  // Check if post exists (Requirement 10.5: allow bookmarking regardless of status)
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
  if (!post) {
    throw new NotFoundError('Post not found');
  }

  // Requirement 10.4: Check if bookmark already exists
  const existingBookmark = db.prepare(
    'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);

  if (existingBookmark) {
    throw new ConflictError('Post is already bookmarked');
  }

  // Create bookmark
  const bookmarkId = uuidv4();
  db.prepare(
    'INSERT INTO bookmarks (id, user_id, post_id) VALUES (?, ?, ?)'
  ).run(bookmarkId, userId, postId);
}

/**
 * Remove a bookmark from a post
 * Requirements: 10.2
 * @param {string} userId - ID of the user removing the bookmark
 * @param {string} postId - ID of the post to remove bookmark from
 * @returns {Promise<void>}
 */
export async function removeBookmark(userId, postId) {
  if (!userId || !postId) {
    throw new ValidationError('User ID and Post ID are required');
  }

  // Check if bookmark exists
  const existingBookmark = db.prepare(
    'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);

  if (!existingBookmark) {
    throw new NotFoundError('Bookmark not found');
  }

  // Remove bookmark
  db.prepare(
    'DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?'
  ).run(userId, postId);

  // Requirement 10.2: Send notification when bookmark is removed
  try {
    const post = db.prepare('SELECT title FROM posts WHERE id = ?').get(postId);
    
    await createNotification({
      userId: userId,
      type: 'bookmark_removed',
      title: 'บุ๊กมาร์กถูกลบ',
      message: `บุ๊กมาร์กของโพสต์ "${post?.title || 'ไม่ทราบชื่อ'}" ถูกลบแล้ว`,
      relatedId: postId
    });
  } catch (error) {
    // Log error but don't fail the remove operation
    console.error('Failed to create bookmark removal notification:', error);
  }
}

/**
 * Get all bookmarked posts for a user
 * Requirements: 10.3
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} - Array of bookmarked post objects
 */
export async function getUserBookmarks(userId) {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Requirement 10.3: Display all bookmarked posts
  const bookmarks = db.prepare(`
    SELECT p.id, p.author_id, p.cover_image, p.title, p.description, 
           p.content, p.education_level, p.tags, p.content_images, 
           p.status, p.like_count, p.view_count, p.comment_count,
           p.created_at, p.updated_at,
           u.name as author_name, u.nickname as author_nickname, 
           u.profile_picture as author_picture,
           b.created_at as bookmarked_at
    FROM bookmarks b
    JOIN posts p ON b.post_id = p.id
    JOIN users u ON p.author_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId);

  return bookmarks.map(bookmark => ({
    id: bookmark.id,
    authorId: bookmark.author_id,
    coverImage: bookmark.cover_image,
    title: bookmark.title,
    description: bookmark.description,
    content: bookmark.content,
    educationLevel: bookmark.education_level,
    tags: JSON.parse(bookmark.tags),
    contentImages: JSON.parse(bookmark.content_images),
    status: bookmark.status,
    likeCount: bookmark.like_count,
    viewCount: bookmark.view_count,
    commentCount: bookmark.comment_count,
    createdAt: bookmark.created_at,
    updatedAt: bookmark.updated_at,
    bookmarkedAt: bookmark.bookmarked_at,
    author: {
      name: bookmark.author_name,
      nickname: bookmark.author_nickname,
      profilePicture: bookmark.author_picture
    }
  }));
}

/**
 * Check if a user has bookmarked a post
 * Requirements: 10.4
 * @param {string} userId - ID of the user
 * @param {string} postId - ID of the post
 * @returns {Promise<boolean>} - True if user has bookmarked the post
 */
export async function hasUserBookmarked(userId, postId) {
  if (!userId || !postId) {
    return false;
  }

  const bookmark = db.prepare(
    'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?'
  ).get(userId, postId);

  return !!bookmark;
}

export default {
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
};
