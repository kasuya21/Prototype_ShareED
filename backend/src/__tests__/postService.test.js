import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { getPopularPosts, incrementViewCount } from '../services/postService.js';

/**
 * Test suite for Post Service - Popular Posts functionality
 * Requirements: 5.1, 5.3, 5.4
 */

describe('Post Service - Popular Posts', () => {
  let testUsers = [];
  let testPosts = [];

  beforeEach(() => {
    // Create test users
    for (let i = 0; i < 3; i++) {
      const userId = uuidv4();
      db.prepare(`
        INSERT INTO users (id, email, name, nickname, role)
        VALUES (?, ?, ?, ?, 'member')
      `).run(userId, `test${i}@example.com`, `Test User ${i}`, `testuser${i}`);
      testUsers.push(userId);
    }

    // Create test posts with different like counts and statuses
    const postData = [
      { likes: 100, views: 500, status: 'active', title: 'Most Popular' },
      { likes: 50, views: 300, status: 'active', title: 'Second Popular' },
      { likes: 25, views: 200, status: 'active', title: 'Third Popular' },
      { likes: 10, views: 100, status: 'active', title: 'Fourth Popular' },
      { likes: 200, views: 1000, status: 'unactived', title: 'Unactived Post' },
      { likes: 150, views: 800, status: 'deleted', title: 'Deleted Post' },
      { likes: 5, views: 50, status: 'active', title: 'Fifth Popular' },
    ];

    postData.forEach((data, index) => {
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (
          id, author_id, cover_image, title, description, content,
          education_level, tags, content_images, status, like_count, view_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        postId,
        testUsers[index % testUsers.length],
        'cover.jpg',
        data.title,
        'Test description',
        'Test content',
        'university',
        '[]',
        '[]',
        data.status,
        data.likes,
        data.views
      );
      testPosts.push({ id: postId, ...data });
    });
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM posts WHERE id IN (' + testPosts.map(() => '?').join(',') + ')').run(...testPosts.map(p => p.id));
    db.prepare('DELETE FROM users WHERE id IN (' + testUsers.map(() => '?').join(',') + ')').run(...testUsers);
    testUsers = [];
    testPosts = [];
  });

  describe('getPopularPosts', () => {
    /**
     * Requirement 5.1: Posts should be sorted by like count in descending order
     */
    it('should return posts sorted by like count in descending order', async () => {
      const posts = await getPopularPosts(10);

      // Verify posts are sorted by like count
      for (let i = 0; i < posts.length - 1; i++) {
        expect(posts[i].likeCount).toBeGreaterThanOrEqual(posts[i + 1].likeCount);
      }

      // Verify the order matches expected
      expect(posts[0].title).toBe('Most Popular');
      expect(posts[0].likeCount).toBe(100);
      expect(posts[1].title).toBe('Second Popular');
      expect(posts[1].likeCount).toBe(50);
    });

    /**
     * Requirement 5.4: Exclude posts with unactived status
     */
    it('should exclude unactived posts from results', async () => {
      const posts = await getPopularPosts(10);

      // Verify no unactived posts are included
      const unactivedPost = posts.find(p => p.status === 'unactived');
      expect(unactivedPost).toBeUndefined();

      // Verify the unactived post with 200 likes is not in results
      const highLikeUnactivedPost = posts.find(p => p.title === 'Unactived Post');
      expect(highLikeUnactivedPost).toBeUndefined();
    });

    /**
     * Requirement 5.4: Exclude posts with deleted status
     */
    it('should exclude deleted posts from results', async () => {
      const posts = await getPopularPosts(10);

      // Verify no deleted posts are included
      const deletedPost = posts.find(p => p.status === 'deleted');
      expect(deletedPost).toBeUndefined();

      // Verify the deleted post with 150 likes is not in results
      const highLikeDeletedPost = posts.find(p => p.title === 'Deleted Post');
      expect(highLikeDeletedPost).toBeUndefined();
    });

    /**
     * Requirement 5.4: Only active posts should be included
     */
    it('should only include active posts', async () => {
      const posts = await getPopularPosts(10);

      // Verify all posts have active status
      posts.forEach(post => {
        expect(post.status).toBe('active');
      });
    });

    /**
     * Requirement 5.3: Display view counts for each post
     */
    it('should include view count for each post', async () => {
      const posts = await getPopularPosts(10);

      // Verify all posts have viewCount property
      posts.forEach(post => {
        expect(post).toHaveProperty('viewCount');
        expect(typeof post.viewCount).toBe('number');
        expect(post.viewCount).toBeGreaterThanOrEqual(0);
      });

      // Verify specific view counts
      const mostPopular = posts.find(p => p.title === 'Most Popular');
      expect(mostPopular.viewCount).toBe(500);
    });

    /**
     * Test limit parameter
     */
    it('should respect the limit parameter', async () => {
      const posts = await getPopularPosts(3);

      expect(posts.length).toBe(3);
      expect(posts[0].title).toBe('Most Popular');
      expect(posts[1].title).toBe('Second Popular');
      expect(posts[2].title).toBe('Third Popular');
    });

    /**
     * Test default limit
     */
    it('should use default limit of 10 when not specified', async () => {
      const posts = await getPopularPosts();

      // We have 5 active posts, so should return all 5
      expect(posts.length).toBe(5);
    });

    /**
     * Test with no posts
     */
    it('should return empty array when no active posts exist', async () => {
      // Delete all test posts first
      db.prepare('DELETE FROM posts WHERE id IN (' + testPosts.map(() => '?').join(',') + ')').run(...testPosts.map(p => p.id));

      const posts = await getPopularPosts(10);

      expect(posts).toEqual([]);
    });

    /**
     * Test post structure
     */
    it('should return posts with complete data structure', async () => {
      const posts = await getPopularPosts(1);

      expect(posts.length).toBe(1);
      const post = posts[0];

      // Verify all required fields are present
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('authorId');
      expect(post).toHaveProperty('coverImage');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('description');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('educationLevel');
      expect(post).toHaveProperty('tags');
      expect(post).toHaveProperty('contentImages');
      expect(post).toHaveProperty('status');
      expect(post).toHaveProperty('likeCount');
      expect(post).toHaveProperty('viewCount');
      expect(post).toHaveProperty('commentCount');
      expect(post).toHaveProperty('createdAt');
      expect(post).toHaveProperty('updatedAt');
      expect(post).toHaveProperty('author');

      // Verify author object structure
      expect(post.author).toHaveProperty('name');
      expect(post.author).toHaveProperty('nickname');
      expect(post.author).toHaveProperty('profilePicture');
    });

    /**
     * Test secondary sorting by created_at when like counts are equal
     */
    it('should sort by created_at DESC when like counts are equal', async () => {
      // Create two posts with same like count
      const postId1 = uuidv4();
      const postId2 = uuidv4();

      // Insert first post (older)
      db.prepare(`
        INSERT INTO posts (
          id, author_id, cover_image, title, description, content,
          education_level, tags, content_images, status, like_count, view_count,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))
      `).run(
        postId1,
        testUsers[0],
        'cover.jpg',
        'Older Post',
        'Test description',
        'Test content',
        'university',
        '[]',
        '[]',
        'active',
        75,
        100
      );

      // Insert second post (newer)
      db.prepare(`
        INSERT INTO posts (
          id, author_id, cover_image, title, description, content,
          education_level, tags, content_images, status, like_count, view_count,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        postId2,
        testUsers[0],
        'cover.jpg',
        'Newer Post',
        'Test description',
        'Test content',
        'university',
        '[]',
        '[]',
        'active',
        75,
        100
      );

      const posts = await getPopularPosts(10);

      // Find the two posts with 75 likes
      const postsWithSameLikes = posts.filter(p => p.likeCount === 75);
      expect(postsWithSameLikes.length).toBe(2);

      // Newer post should come first
      expect(postsWithSameLikes[0].title).toBe('Newer Post');
      expect(postsWithSameLikes[1].title).toBe('Older Post');

      // Clean up
      db.prepare('DELETE FROM posts WHERE id IN (?, ?)').run(postId1, postId2);
    });
  });

  describe('incrementViewCount', () => {
    /**
     * Requirement 5.2: Increment view counter by 1
     */
    it('should increment view count by exactly 1', async () => {
      const post = testPosts.find(p => p.status === 'active');
      const initialViewCount = post.views;

      await incrementViewCount(post.id);

      const updatedPost = db.prepare('SELECT view_count FROM posts WHERE id = ?').get(post.id);
      expect(updatedPost.view_count).toBe(initialViewCount + 1);
    });

    /**
     * Test multiple increments
     */
    it('should correctly increment view count multiple times', async () => {
      const post = testPosts.find(p => p.status === 'active');
      const initialViewCount = post.views;

      // Increment 5 times
      for (let i = 0; i < 5; i++) {
        await incrementViewCount(post.id);
      }

      const updatedPost = db.prepare('SELECT view_count FROM posts WHERE id = ?').get(post.id);
      expect(updatedPost.view_count).toBe(initialViewCount + 5);
    });
  });
});
