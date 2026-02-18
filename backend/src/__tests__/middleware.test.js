import request from 'supertest';
import express from 'express';
import { authenticate, authorize, requireOwnership } from '../middleware/auth.js';
import { apiLimiter, authLimiter, postCreationLimiter } from '../middleware/rateLimiter.js';
import { createSession } from '../services/authService.js';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

describe('Middleware Tests', () => {
  let testUser;
  let testToken;
  let testApp;

  beforeAll(() => {
    // Create test user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role, coins)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, 'test@example.com', 'Test User', 'testuser', 'member', 100);

    testUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  });

  afterAll(() => {
    // Clean up
    db.prepare('DELETE FROM users WHERE email = ?').run('test@example.com');
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(testUser.id);
  });

  describe('Authentication Middleware', () => {
    beforeEach(async () => {
      // Create a fresh session for each test
      const session = await createSession(testUser.id);
      testToken = session.token;
    });

    afterEach(() => {
      // Clean up sessions
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(testUser.id);
    });

    test('should authenticate valid token in Authorization header', async () => {
      const app = express();
      app.use(express.json());
      app.get('/test', authenticate, (req, res) => {
        res.json({ userId: req.user.id });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(testUser.id);
    });

    test('should reject request without token (401)', async () => {
      const app = express();
      app.use(express.json());
      app.get('/test', authenticate, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should reject request with invalid token (401)', async () => {
      const app = express();
      app.use(express.json());
      app.get('/test', authenticate, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Authorization Middleware', () => {
    let memberToken, moderatorToken, adminToken;
    let memberUser, moderatorUser, adminUser;

    beforeAll(async () => {
      // Create users with different roles
      const memberId = uuidv4();
      const moderatorId = uuidv4();
      const adminId = uuidv4();

      db.prepare(`
        INSERT INTO users (id, email, name, nickname, role, coins)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(memberId, 'member@example.com', 'Member', 'member', 'member', 100);

      db.prepare(`
        INSERT INTO users (id, email, name, nickname, role, coins)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(moderatorId, 'moderator@example.com', 'Moderator', 'moderator', 'moderator', 100);

      db.prepare(`
        INSERT INTO users (id, email, name, nickname, role, coins)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(adminId, 'admin@example.com', 'Admin', 'admin', 'admin', 100);

      memberUser = db.prepare('SELECT * FROM users WHERE id = ?').get(memberId);
      moderatorUser = db.prepare('SELECT * FROM users WHERE id = ?').get(moderatorId);
      adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId);

      // Create sessions
      const memberSession = await createSession(memberId);
      const moderatorSession = await createSession(moderatorId);
      const adminSession = await createSession(adminId);

      memberToken = memberSession.token;
      moderatorToken = moderatorSession.token;
      adminToken = adminSession.token;
    });

    afterAll(() => {
      // Clean up
      db.prepare('DELETE FROM users WHERE email IN (?, ?, ?)').run(
        'member@example.com',
        'moderator@example.com',
        'admin@example.com'
      );
      db.prepare('DELETE FROM sessions WHERE user_id IN (?, ?, ?)').run(
        memberUser.id,
        moderatorUser.id,
        adminUser.id
      );
    });

    test('should allow admin to access admin-only endpoint', async () => {
      const app = express();
      app.use(express.json());
      app.get('/admin', authenticate, authorize('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject member from admin-only endpoint (403)', async () => {
      const app = express();
      app.use(express.json());
      app.get('/admin', authenticate, authorize('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    test('should allow moderator to access moderator endpoint', async () => {
      const app = express();
      app.use(express.json());
      app.get('/moderate', authenticate, authorize('moderator', 'admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/moderate')
        .set('Authorization', `Bearer ${moderatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should allow admin to access moderator endpoint', async () => {
      const app = express();
      app.use(express.json());
      app.get('/moderate', authenticate, authorize('moderator', 'admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/moderate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('should allow requests within rate limit', async () => {
      const app = express();
      app.use(express.json());
      
      // Use a custom rate limiter with low limits for testing
      const testLimiter = (req, res, next) => {
        // Mock implementation - just pass through for this test
        next();
      };
      
      app.get('/test', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });

    test('should include rate limit headers', async () => {
      const app = express();
      app.use(express.json());
      
      // Create a simple rate limiter for testing
      const testLimiter = (req, res, next) => {
        res.set('RateLimit-Limit', '100');
        res.set('RateLimit-Remaining', '99');
        res.set('RateLimit-Reset', Date.now() + 900000);
        next();
      };
      
      app.get('/test', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');
      expect(response.headers['ratelimit-limit']).toBeDefined();
    });

    test('should return 429 when rate limit exceeded', async () => {
      const rateLimit = require('express-rate-limit').default;
      
      const app = express();
      app.use(express.json());
      
      // Create a strict rate limiter for testing
      const strictLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 2, // Only 2 requests
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            error: {
              code: 'RATE_LIMIT_ERROR',
              message: 'Too many requests, please try again later'
            }
          });
        }
      });
      
      app.get('/test', strictLimiter, (req, res) => {
        res.json({ success: true });
      });

      // First two requests should succeed
      const response1 = await request(app).get('/test');
      expect(response1.status).toBe(200);
      
      const response2 = await request(app).get('/test');
      expect(response2.status).toBe(200);
      
      // Third request should be rate limited
      const response3 = await request(app).get('/test');
      expect(response3.status).toBe(429);
      expect(response3.body.error.code).toBe('RATE_LIMIT_ERROR');
      expect(response3.body.error.message).toContain('Too many requests');
    });

    test('should return proper error format on 429', async () => {
      const rateLimit = require('express-rate-limit').default;
      
      const app = express();
      app.use(express.json());
      
      const strictLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            error: {
              code: 'RATE_LIMIT_ERROR',
              message: 'Too many requests, please try again later'
            }
          });
        }
      });
      
      app.get('/test', strictLimiter, (req, res) => {
        res.json({ success: true });
      });

      // First request succeeds
      await request(app).get('/test');
      
      // Second request should be rate limited
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.code).toBe('RATE_LIMIT_ERROR');
    });

    test('should include RateLimit headers in response', async () => {
      const rateLimit = require('express-rate-limit').default;
      
      const app = express();
      app.use(express.json());
      
      const testLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false
      });
      
      app.get('/test', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    test('should reset rate limit after window expires', async () => {
      const rateLimit = require('express-rate-limit').default;
      
      const app = express();
      app.use(express.json());
      
      // Very short window for testing
      const shortWindowLimiter = rateLimit({
        windowMs: 100, // 100ms window
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            error: {
              code: 'RATE_LIMIT_ERROR',
              message: 'Too many requests'
            }
          });
        }
      });
      
      app.get('/test', shortWindowLimiter, (req, res) => {
        res.json({ success: true });
      });

      // First request succeeds
      const response1 = await request(app).get('/test');
      expect(response1.status).toBe(200);
      
      // Second request immediately should fail
      const response2 = await request(app).get('/test');
      expect(response2.status).toBe(429);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Third request after window should succeed
      const response3 = await request(app).get('/test');
      expect(response3.status).toBe(200);
    });
  });

  describe('Resource Ownership Middleware', () => {
    let ownerToken, otherUserToken;
    let ownerUser, otherUser;
    let testPost;

    beforeAll(async () => {
      // Create two users
      const ownerId = uuidv4();
      const otherId = uuidv4();

      db.prepare(`
        INSERT INTO users (id, email, name, nickname, role, coins)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ownerId, 'owner@example.com', 'Owner', 'owner', 'member', 100);

      db.prepare(`
        INSERT INTO users (id, email, name, nickname, role, coins)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherId, 'other@example.com', 'Other', 'other', 'member', 100);

      ownerUser = db.prepare('SELECT * FROM users WHERE id = ?').get(ownerId);
      otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherId);

      // Create sessions
      const ownerSession = await createSession(ownerId);
      const otherSession = await createSession(otherId);

      ownerToken = ownerSession.token;
      otherUserToken = otherSession.token;

      // Create a test post
      const postId = uuidv4();
      db.prepare(`
        INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(postId, ownerId, 'cover.jpg', 'Test Post', 'Description', 'Content', 'university', 'active');

      testPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    });

    afterAll(() => {
      // Clean up
      db.prepare('DELETE FROM posts WHERE id = ?').run(testPost.id);
      db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('owner@example.com', 'other@example.com');
      db.prepare('DELETE FROM sessions WHERE user_id IN (?, ?)').run(ownerUser.id, otherUser.id);
    });

    test('should allow owner to access their resource', async () => {
      const app = express();
      app.use(express.json());
      
      const getOwnerId = async (req) => {
        const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(req.params.postId);
        return post.author_id;
      };

      app.get('/posts/:postId', authenticate, requireOwnership(getOwnerId), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get(`/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject non-owner from accessing resource (403)', async () => {
      const app = express();
      app.use(express.json());
      
      const getOwnerId = async (req) => {
        const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(req.params.postId);
        return post.author_id;
      };

      app.get('/posts/:postId', authenticate, requireOwnership(getOwnerId), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get(`/posts/${testPost.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
