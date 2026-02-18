import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import postRoutes from '../routes/postRoutes.js';

/**
 * Integration tests for Popular Posts endpoint
 * Requirements: 5.1, 5.3, 5.4
 */

describe('POST Routes - Popular Posts Endpoint', () => {
  let app;
  let testUsers = [];
  let testPosts = [];

  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/posts', postRoutes);

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
      { likes: 200, views: 1000, status: 'unactived', title: 'Unactived Post' },
      { likes: 150, views: 800, status: 'deleted', title: 'Deleted Post' },
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

  describe('GET /api/posts/popular', () => {
    /**
     * Requirement 5.1: Posts should be sorted by like count in descending order
     */
    it('should return posts sorted by like count', async () => {
      const response = await request(app)
        .get('/api/posts/popular')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);

      const posts = response.body.posts;
      
      // Verify sorting
      for (let i = 0; i < posts.length - 1; i++) {
        expect(posts[i].likeCount).toBeGreaterThanOrEqual(posts[i + 1].likeCount);
      }

      // Verify top post
      expect(posts[0].title).toBe('Most Popular');
      expect(posts[0].likeCount).toBe(100);
    });

    /**
     * Requirement 5.4: Exclude unactived and deleted posts
     */
    it('should only return active posts', async () => {
      const response = await request(app)
        .get('/api/posts/popular')
        .expect(200);

      const posts = response.body.posts;

      // Verify all posts are active
      posts.forEach(post => {
        expect(post.status).toBe('active');
      });

      // Verify unactived and deleted posts are not included
      const unactivedPost = posts.find(p => p.title === 'Unactived Post');
      const deletedPost = posts.find(p => p.title === 'Deleted Post');
      
      expect(unactivedPost).toBeUndefined();
      expect(deletedPost).toBeUndefined();
    });

    /**
     * Requirement 5.3: Display view counts
     */
    it('should include view counts for each post', async () => {
      const response = await request(app)
        .get('/api/posts/popular')
        .expect(200);

      const posts = response.body.posts;

      posts.forEach(post => {
        expect(post).toHaveProperty('viewCount');
        expect(typeof post.viewCount).toBe('number');
      });

      const mostPopular = posts.find(p => p.title === 'Most Popular');
      expect(mostPopular.viewCount).toBe(500);
    });

    /**
     * Test limit query parameter
     */
    it('should respect limit query parameter', async () => {
      const response = await request(app)
        .get('/api/posts/popular?limit=2')
        .expect(200);

      const posts = response.body.posts;
      expect(posts.length).toBe(2);
      expect(posts[0].title).toBe('Most Popular');
      expect(posts[1].title).toBe('Second Popular');
    });

    /**
     * Test default limit
     */
    it('should use default limit when not specified', async () => {
      const response = await request(app)
        .get('/api/posts/popular')
        .expect(200);

      const posts = response.body.posts;
      // We have 3 active posts, should return all 3
      expect(posts.length).toBe(3);
    });

    /**
     * Test with invalid limit
     */
    it('should handle invalid limit gracefully', async () => {
      const response = await request(app)
        .get('/api/posts/popular?limit=invalid')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    /**
     * Test response structure
     */
    it('should return posts with complete structure', async () => {
      const response = await request(app)
        .get('/api/posts/popular?limit=1')
        .expect(200);

      const posts = response.body.posts;
      expect(posts.length).toBe(1);

      const post = posts[0];
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('authorId');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('description');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('coverImage');
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
      expect(post.author).toHaveProperty('name');
      expect(post.author).toHaveProperty('nickname');
    });
  });
});
