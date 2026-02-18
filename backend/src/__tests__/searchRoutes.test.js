import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import postRoutes from '../routes/postRoutes.js';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api/posts', postRoutes);

describe('Search API Routes', () => {
  let testUserId;
  let testPosts;

  beforeAll(() => {
    // Create test user
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role)
      VALUES (?, ?, ?, ?, 'member')
    `).run(testUserId, 'test@example.com', 'Test User', 'testuser');

    // Create test posts
    testPosts = [
      {
        id: uuidv4(),
        title: 'JavaScript Tutorial',
        tags: ['javascript', 'tutorial'],
        educationLevel: 'junior_high',
        status: 'active',
        likeCount: 10
      },
      {
        id: uuidv4(),
        title: 'Python Guide',
        tags: ['python', 'guide'],
        educationLevel: 'university',
        status: 'active',
        likeCount: 20
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO posts (
        id, author_id, cover_image, title, description, content,
        education_level, tags, content_images, status, like_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    testPosts.forEach(post => {
      stmt.run(
        post.id,
        testUserId,
        'cover.jpg',
        post.title,
        'Description',
        'Content',
        post.educationLevel,
        JSON.stringify(post.tags),
        JSON.stringify([]),
        post.status,
        post.likeCount
      );
    });
  });

  afterAll(() => {
    // Clean up
    db.prepare('DELETE FROM posts WHERE author_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('GET /api/posts/search', () => {
    it('should search posts by keyword', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ keyword: 'JavaScript' });

      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      expect(response.body.posts.length).toBeGreaterThan(0);
      expect(response.body.posts[0].title).toContain('JavaScript');
    });

    it('should filter by education level', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ educationLevel: 'university' });

      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      expect(response.body.posts.every(p => p.educationLevel === 'university')).toBe(true);
    });

    it('should sort by popularity', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ sortBy: 'popularity' });

      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      expect(response.body.posts.length).toBeGreaterThan(0);
      
      // Verify descending order
      for (let i = 0; i < response.body.posts.length - 1; i++) {
        expect(response.body.posts[i].likeCount).toBeGreaterThanOrEqual(
          response.body.posts[i + 1].likeCount
        );
      }
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ page: 1, pageSize: 1 });

      expect(response.status).toBe(200);
      expect(response.body.posts.length).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(1);
      expect(response.body.totalCount).toBeGreaterThanOrEqual(1);
    });

    it('should return 400 for invalid sort option', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ sortBy: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid education level', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ educationLevel: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return empty results when no matches found', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ keyword: 'nonexistent12345' });

      expect(response.status).toBe(200);
      expect(response.body.posts).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/posts/search')
        .query({ 
          keyword: 'Python',
          educationLevel: 'university',
          sortBy: 'popularity'
        });

      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      if (response.body.posts.length > 0) {
        expect(response.body.posts[0].educationLevel).toBe('university');
      }
    });
  });
});
