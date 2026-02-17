import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
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
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';

describe('Interaction Service - Like Functionality', () => {
  let testUser;
  let testPost;

  beforeEach(() => {
    // Create test user
    testUser = {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      nickname: `testuser${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser.id, testUser.email, testUser.name, testUser.nickname, testUser.role);

    // Create test post
    testPost = {
      id: uuidv4(),
      author_id: testUser.id,
      cover_image: 'cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      education_level: 'university',
      status: 'active'
    };

    db.prepare(`
      INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testPost.id,
      testPost.author_id,
      testPost.cover_image,
      testPost.title,
      testPost.description,
      testPost.content,
      testPost.education_level,
      testPost.status
    );
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(testPost.id);
    db.prepare('DELETE FROM likes WHERE post_id = ?').run(testPost.id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(testPost.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUser.id);
  });

  describe('likePost', () => {
    test('should successfully like a post', async () => {
      await likePost(testUser.id, testPost.id);

      const liked = await hasUserLiked(testUser.id, testPost.id);
      expect(liked).toBe(true);

      const post = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id);
      expect(post.like_count).toBe(1);
    });

    test('should increment like counter by 1', async () => {
      const initialCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;

      await likePost(testUser.id, testPost.id);

      const finalCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should toggle to unlike if already liked (Requirement 14.3)', async () => {
      // Like the post first
      await likePost(testUser.id, testPost.id);
      expect(await hasUserLiked(testUser.id, testPost.id)).toBe(true);

      // Like again should unlike
      await likePost(testUser.id, testPost.id);
      expect(await hasUserLiked(testUser.id, testPost.id)).toBe(false);
    });

    test('should throw NotFoundError for non-existent post', async () => {
      await expect(likePost(testUser.id, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(likePost(null, testPost.id)).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(likePost(testUser.id, null)).rejects.toThrow(ValidationError);
    });
  });

  describe('unlikePost', () => {
    test('should successfully unlike a post', async () => {
      // Like first
      await likePost(testUser.id, testPost.id);
      expect(await hasUserLiked(testUser.id, testPost.id)).toBe(true);

      // Then unlike
      await unlikePost(testUser.id, testPost.id);
      expect(await hasUserLiked(testUser.id, testPost.id)).toBe(false);
    });

    test('should decrement like counter by 1', async () => {
      // Like first
      await likePost(testUser.id, testPost.id);
      const likedCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;

      // Unlike
      await unlikePost(testUser.id, testPost.id);
      const unlikedCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;

      expect(unlikedCount).toBe(likedCount - 1);
    });

    test('should not decrement below 0', async () => {
      // Unlike without liking first
      await unlikePost(testUser.id, testPost.id);

      const post = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id);
      expect(post.like_count).toBe(0);
    });

    test('should silently ignore if not liked', async () => {
      // Should not throw error
      await expect(unlikePost(testUser.id, testPost.id)).resolves.not.toThrow();
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(unlikePost(null, testPost.id)).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(unlikePost(testUser.id, null)).rejects.toThrow(ValidationError);
    });
  });

  describe('hasUserLiked', () => {
    test('should return true if user has liked the post', async () => {
      await likePost(testUser.id, testPost.id);
      const liked = await hasUserLiked(testUser.id, testPost.id);
      expect(liked).toBe(true);
    });

    test('should return false if user has not liked the post', async () => {
      const liked = await hasUserLiked(testUser.id, testPost.id);
      expect(liked).toBe(false);
    });

    test('should return false for missing userId', async () => {
      const liked = await hasUserLiked(null, testPost.id);
      expect(liked).toBe(false);
    });

    test('should return false for missing postId', async () => {
      const liked = await hasUserLiked(testUser.id, null);
      expect(liked).toBe(false);
    });
  });

  describe('getPostLikes', () => {
    test('should return list of users who liked the post', async () => {
      await likePost(testUser.id, testPost.id);

      const likes = await getPostLikes(testPost.id);
      expect(likes).toHaveLength(1);
      expect(likes[0].id).toBe(testUser.id);
      expect(likes[0].name).toBe(testUser.name);
    });

    test('should return empty array if no likes', async () => {
      const likes = await getPostLikes(testPost.id);
      expect(likes).toHaveLength(0);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(getPostLikes(null)).rejects.toThrow(ValidationError);
    });
  });

  describe('Like Toggle Behavior (Property 54)', () => {
    test('liking then unliking should return like count to original value', async () => {
      const originalCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;

      // Like
      await likePost(testUser.id, testPost.id);
      const likedCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;
      expect(likedCount).toBe(originalCount + 1);

      // Unlike
      await unlikePost(testUser.id, testPost.id);
      const finalCount = db.prepare('SELECT like_count FROM posts WHERE id = ?').get(testPost.id).like_count;
      expect(finalCount).toBe(originalCount);
    });
  });
});

describe('Interaction Service - Comment Functionality', () => {
  let testUser;
  let testUser2;
  let testPost;

  beforeEach(() => {
    // Create test users
    testUser = {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      nickname: `testuser${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser.id, testUser.email, testUser.name, testUser.nickname, testUser.role);

    testUser2 = {
      id: uuidv4(),
      email: `test2-${Date.now()}@example.com`,
      name: 'Test User 2',
      nickname: `testuser2${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser2.id, testUser2.email, testUser2.name, testUser2.nickname, testUser2.role);

    // Create test post
    testPost = {
      id: uuidv4(),
      author_id: testUser.id,
      cover_image: 'cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      education_level: 'university',
      status: 'active'
    };

    db.prepare(`
      INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testPost.id,
      testPost.author_id,
      testPost.cover_image,
      testPost.title,
      testPost.description,
      testPost.content,
      testPost.education_level,
      testPost.status
    );
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(testPost.id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(testPost.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUser.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUser2.id);
  });

  describe('createComment', () => {
    test('should successfully create a comment', async () => {
      const content = 'This is a test comment';
      const comment = await createComment(testUser.id, testPost.id, content);

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.postId).toBe(testPost.id);
      expect(comment.authorId).toBe(testUser.id);
      expect(comment.content).toBe(content);
      expect(comment.createdAt).toBeDefined();
      expect(comment.author).toBeDefined();
      expect(comment.author.name).toBe(testUser.name);
    });

    test('should increment comment counter by 1 (Requirement 14.4)', async () => {
      const initialCount = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id).comment_count;

      await createComment(testUser.id, testPost.id, 'Test comment');

      const finalCount = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id).comment_count;
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should save comment with correct timestamp and user information (Property 55)', async () => {
      const beforeTime = new Date();
      const comment = await createComment(testUser.id, testPost.id, 'Test comment');
      const afterTime = new Date();

      expect(comment.authorId).toBe(testUser.id);
      expect(comment.postId).toBe(testPost.id);
      expect(comment.content).toBe('Test comment');
      
      const commentTime = new Date(comment.createdAt);
      expect(commentTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
      expect(commentTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
    });

    test('should throw NotFoundError for non-existent post', async () => {
      await expect(
        createComment(testUser.id, 'non-existent-id', 'Test comment')
      ).rejects.toThrow(NotFoundError);
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(
        createComment(null, testPost.id, 'Test comment')
      ).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(
        createComment(testUser.id, null, 'Test comment')
      ).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing content', async () => {
      await expect(
        createComment(testUser.id, testPost.id, null)
      ).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for empty content', async () => {
      await expect(
        createComment(testUser.id, testPost.id, '   ')
      ).rejects.toThrow(ValidationError);
    });

    test('should handle multiple comments from different users', async () => {
      await createComment(testUser.id, testPost.id, 'First comment');
      await createComment(testUser2.id, testPost.id, 'Second comment');

      const post = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id);
      expect(post.comment_count).toBe(2);
    });
  });

  describe('getPostComments', () => {
    test('should return comments in chronological order (Requirement 14.6, Property 56)', async () => {
      // Create comments with small delays to ensure different timestamps
      const comment1 = await createComment(testUser.id, testPost.id, 'First comment');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const comment2 = await createComment(testUser2.id, testPost.id, 'Second comment');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const comment3 = await createComment(testUser.id, testPost.id, 'Third comment');

      const comments = await getPostComments(testPost.id);

      expect(comments).toHaveLength(3);
      expect(comments[0].id).toBe(comment1.id);
      expect(comments[1].id).toBe(comment2.id);
      expect(comments[2].id).toBe(comment3.id);
      
      // Verify chronological order
      expect(new Date(comments[0].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(comments[1].createdAt).getTime()
      );
      expect(new Date(comments[1].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(comments[2].createdAt).getTime()
      );
    });

    test('should return empty array if no comments', async () => {
      const comments = await getPostComments(testPost.id);
      expect(comments).toHaveLength(0);
    });

    test('should include author information', async () => {
      await createComment(testUser.id, testPost.id, 'Test comment');

      const comments = await getPostComments(testPost.id);
      expect(comments).toHaveLength(1);
      expect(comments[0].author).toBeDefined();
      expect(comments[0].author.name).toBe(testUser.name);
      expect(comments[0].author.nickname).toBe(testUser.nickname);
    });

    test('should throw NotFoundError for non-existent post', async () => {
      await expect(getPostComments('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(getPostComments(null)).rejects.toThrow(ValidationError);
    });

    test('should return all comments from multiple users', async () => {
      await createComment(testUser.id, testPost.id, 'Comment from user 1');
      await createComment(testUser2.id, testPost.id, 'Comment from user 2');
      await createComment(testUser.id, testPost.id, 'Another comment from user 1');

      const comments = await getPostComments(testPost.id);
      expect(comments).toHaveLength(3);
      
      const user1Comments = comments.filter(c => c.authorId === testUser.id);
      const user2Comments = comments.filter(c => c.authorId === testUser2.id);
      
      expect(user1Comments).toHaveLength(2);
      expect(user2Comments).toHaveLength(1);
    });
  });

  describe('Comment Counter Integration', () => {
    test('should maintain accurate comment count across multiple operations', async () => {
      const initialCount = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id).comment_count;
      expect(initialCount).toBe(0);

      await createComment(testUser.id, testPost.id, 'Comment 1');
      let count = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id).comment_count;
      expect(count).toBe(1);

      await createComment(testUser2.id, testPost.id, 'Comment 2');
      count = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id).comment_count;
      expect(count).toBe(2);

      await createComment(testUser.id, testPost.id, 'Comment 3');
      count = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id).comment_count;
      expect(count).toBe(3);
    });
  });
});

describe('Interaction Service - Bookmark Functionality', () => {
  let testUser;
  let testUser2;
  let testPost;
  let testPost2;

  beforeEach(() => {
    // Create test users
    testUser = {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      nickname: `testuser${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser.id, testUser.email, testUser.name, testUser.nickname, testUser.role);

    testUser2 = {
      id: uuidv4(),
      email: `test2-${Date.now()}@example.com`,
      name: 'Test User 2',
      nickname: `testuser2${Date.now()}`,
      role: 'member'
    };

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUser2.id, testUser2.email, testUser2.name, testUser2.nickname, testUser2.role);

    // Create test posts
    testPost = {
      id: uuidv4(),
      author_id: testUser.id,
      cover_image: 'cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      education_level: 'university',
      status: 'active'
    };

    db.prepare(`
      INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testPost.id,
      testPost.author_id,
      testPost.cover_image,
      testPost.title,
      testPost.description,
      testPost.content,
      testPost.education_level,
      testPost.status
    );

    testPost2 = {
      id: uuidv4(),
      author_id: testUser2.id,
      cover_image: 'cover2.jpg',
      title: 'Test Post 2',
      description: 'Test Description 2',
      content: 'Test Content 2',
      education_level: 'senior_high',
      status: 'unactived'
    };

    db.prepare(`
      INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testPost2.id,
      testPost2.author_id,
      testPost2.cover_image,
      testPost2.title,
      testPost2.description,
      testPost2.content,
      testPost2.education_level,
      testPost2.status
    );
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM bookmarks WHERE user_id IN (?, ?)').run(testUser.id, testUser2.id);
    db.prepare('DELETE FROM posts WHERE id IN (?, ?)').run(testPost.id, testPost2.id);
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(testUser.id, testUser2.id);
  });

  describe('addBookmark', () => {
    test('should successfully add a bookmark (Requirement 10.1, Property 35)', async () => {
      await addBookmark(testUser.id, testPost.id);

      const bookmarked = await hasUserBookmarked(testUser.id, testPost.id);
      expect(bookmarked).toBe(true);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].id).toBe(testPost.id);
    });

    test('should allow bookmarking posts regardless of status (Requirement 10.5, Property 38)', async () => {
      // Bookmark active post
      await addBookmark(testUser.id, testPost.id);
      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(true);

      // Bookmark unactived post
      await addBookmark(testUser.id, testPost2.id);
      expect(await hasUserBookmarked(testUser.id, testPost2.id)).toBe(true);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);
    });

    test('should throw ConflictError for duplicate bookmark (Requirement 10.4, Property 37)', async () => {
      await addBookmark(testUser.id, testPost.id);
      
      await expect(addBookmark(testUser.id, testPost.id)).rejects.toThrow(ConflictError);
      await expect(addBookmark(testUser.id, testPost.id)).rejects.toThrow('already bookmarked');
    });

    test('should throw NotFoundError for non-existent post', async () => {
      await expect(addBookmark(testUser.id, 'non-existent-id')).rejects.toThrow(NotFoundError);
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(addBookmark(null, testPost.id)).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(addBookmark(testUser.id, null)).rejects.toThrow(ValidationError);
    });

    test('should allow different users to bookmark the same post', async () => {
      await addBookmark(testUser.id, testPost.id);
      await addBookmark(testUser2.id, testPost.id);

      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(true);
      expect(await hasUserBookmarked(testUser2.id, testPost.id)).toBe(true);
    });

    test('should allow same user to bookmark multiple posts', async () => {
      await addBookmark(testUser.id, testPost.id);
      await addBookmark(testUser.id, testPost2.id);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);
    });
  });

  describe('removeBookmark', () => {
    test('should successfully remove a bookmark (Requirement 10.2, Property 36)', async () => {
      // Add bookmark first
      await addBookmark(testUser.id, testPost.id);
      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(true);

      // Remove bookmark
      await removeBookmark(testUser.id, testPost.id);
      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(false);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(0);
    });

    test('should throw NotFoundError if bookmark does not exist', async () => {
      await expect(removeBookmark(testUser.id, testPost.id)).rejects.toThrow(NotFoundError);
      await expect(removeBookmark(testUser.id, testPost.id)).rejects.toThrow('Bookmark not found');
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(removeBookmark(null, testPost.id)).rejects.toThrow(ValidationError);
    });

    test('should throw ValidationError for missing postId', async () => {
      await expect(removeBookmark(testUser.id, null)).rejects.toThrow(ValidationError);
    });

    test('should only remove bookmark for specific user', async () => {
      // Both users bookmark the same post
      await addBookmark(testUser.id, testPost.id);
      await addBookmark(testUser2.id, testPost.id);

      // Remove bookmark for user 1
      await removeBookmark(testUser.id, testPost.id);

      // User 1 should not have bookmark, but user 2 should still have it
      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(false);
      expect(await hasUserBookmarked(testUser2.id, testPost.id)).toBe(true);
    });
  });

  describe('getUserBookmarks', () => {
    test('should return all bookmarked posts (Requirement 10.3)', async () => {
      await addBookmark(testUser.id, testPost.id);
      await addBookmark(testUser.id, testPost2.id);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);
      
      const postIds = bookmarks.map(b => b.id);
      expect(postIds).toContain(testPost.id);
      expect(postIds).toContain(testPost2.id);
    });

    test('should return bookmarks in reverse chronological order (most recent first)', async () => {
      await addBookmark(testUser.id, testPost.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      await addBookmark(testUser.id, testPost2.id);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);
      
      // Most recent bookmark should be first
      expect(bookmarks[0].id).toBe(testPost2.id);
      expect(bookmarks[1].id).toBe(testPost.id);
    });

    test('should return empty array if no bookmarks', async () => {
      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(0);
    });

    test('should include post details and author information', async () => {
      await addBookmark(testUser.id, testPost.id);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(1);
      
      const bookmark = bookmarks[0];
      expect(bookmark.id).toBe(testPost.id);
      expect(bookmark.title).toBe(testPost.title);
      expect(bookmark.description).toBe(testPost.description);
      expect(bookmark.content).toBe(testPost.content);
      expect(bookmark.coverImage).toBe(testPost.cover_image);
      expect(bookmark.educationLevel).toBe(testPost.education_level);
      expect(bookmark.status).toBe(testPost.status);
      expect(bookmark.author).toBeDefined();
      expect(bookmark.author.name).toBe(testUser.name);
      expect(bookmark.bookmarkedAt).toBeDefined();
    });

    test('should include posts with all statuses', async () => {
      await addBookmark(testUser.id, testPost.id); // active
      await addBookmark(testUser.id, testPost2.id); // unactived

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);
      
      const statuses = bookmarks.map(b => b.status);
      expect(statuses).toContain('active');
      expect(statuses).toContain('unactived');
    });

    test('should throw ValidationError for missing userId', async () => {
      await expect(getUserBookmarks(null)).rejects.toThrow(ValidationError);
    });

    test('should only return bookmarks for specific user', async () => {
      await addBookmark(testUser.id, testPost.id);
      await addBookmark(testUser2.id, testPost2.id);

      const user1Bookmarks = await getUserBookmarks(testUser.id);
      const user2Bookmarks = await getUserBookmarks(testUser2.id);

      expect(user1Bookmarks).toHaveLength(1);
      expect(user1Bookmarks[0].id).toBe(testPost.id);

      expect(user2Bookmarks).toHaveLength(1);
      expect(user2Bookmarks[0].id).toBe(testPost2.id);
    });

    test('should parse JSON fields correctly', async () => {
      // Update post with tags and content images
      db.prepare(`
        UPDATE posts 
        SET tags = ?, content_images = ?
        WHERE id = ?
      `).run(
        JSON.stringify(['tag1', 'tag2']),
        JSON.stringify(['image1.jpg', 'image2.jpg']),
        testPost.id
      );

      await addBookmark(testUser.id, testPost.id);

      const bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(1);
      
      const bookmark = bookmarks[0];
      expect(Array.isArray(bookmark.tags)).toBe(true);
      expect(bookmark.tags).toEqual(['tag1', 'tag2']);
      expect(Array.isArray(bookmark.contentImages)).toBe(true);
      expect(bookmark.contentImages).toEqual(['image1.jpg', 'image2.jpg']);
    });
  });

  describe('hasUserBookmarked', () => {
    test('should return true if user has bookmarked the post', async () => {
      await addBookmark(testUser.id, testPost.id);
      const bookmarked = await hasUserBookmarked(testUser.id, testPost.id);
      expect(bookmarked).toBe(true);
    });

    test('should return false if user has not bookmarked the post', async () => {
      const bookmarked = await hasUserBookmarked(testUser.id, testPost.id);
      expect(bookmarked).toBe(false);
    });

    test('should return false for missing userId', async () => {
      const bookmarked = await hasUserBookmarked(null, testPost.id);
      expect(bookmarked).toBe(false);
    });

    test('should return false for missing postId', async () => {
      const bookmarked = await hasUserBookmarked(testUser.id, null);
      expect(bookmarked).toBe(false);
    });

    test('should return false after bookmark is removed', async () => {
      await addBookmark(testUser.id, testPost.id);
      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(true);

      await removeBookmark(testUser.id, testPost.id);
      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(false);
    });
  });

  describe('Bookmark Integration Tests', () => {
    test('should maintain bookmark integrity across multiple operations', async () => {
      // Add multiple bookmarks
      await addBookmark(testUser.id, testPost.id);
      await addBookmark(testUser.id, testPost2.id);
      
      let bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);

      // Remove one bookmark
      await removeBookmark(testUser.id, testPost.id);
      
      bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].id).toBe(testPost2.id);

      // Add it back
      await addBookmark(testUser.id, testPost.id);
      
      bookmarks = await getUserBookmarks(testUser.id);
      expect(bookmarks).toHaveLength(2);
    });

    test('should handle concurrent bookmarks from different users', async () => {
      await Promise.all([
        addBookmark(testUser.id, testPost.id),
        addBookmark(testUser2.id, testPost.id)
      ]);

      expect(await hasUserBookmarked(testUser.id, testPost.id)).toBe(true);
      expect(await hasUserBookmarked(testUser2.id, testPost.id)).toBe(true);

      const user1Bookmarks = await getUserBookmarks(testUser.id);
      const user2Bookmarks = await getUserBookmarks(testUser2.id);

      expect(user1Bookmarks).toHaveLength(1);
      expect(user2Bookmarks).toHaveLength(1);
    });
  });
});
