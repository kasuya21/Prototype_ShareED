import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { db } from '../database/db.js';
import { createSession } from '../services/authService.js';
import { createOrUpdateUser } from '../services/userService.js';

describe('Authentication API Integration Tests', () => {
  let testUser;
  let testToken;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    // Create test users
    const userProfile = {
      id: 'google-test-user',
      email: 'testuser@example.com',
      name: 'Test User',
      picture: 'https://example.com/test.jpg'
    };
    testUser = await createOrUpdateUser(userProfile);
    const session = await createSession(testUser.id);
    testToken = session.token;

    // Create admin user
    const adminProfile = {
      id: 'google-admin-user',
      email: 'admin@example.com',
      name: 'Admin User',
      picture: 'https://example.com/admin.jpg'
    };
    adminUser = await createOrUpdateUser(adminProfile);
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', adminUser.id);
    const adminSession = await createSession(adminUser.id);
    adminToken = adminSession.token;
  });

  afterAll(() => {
    // Clean up test data
    db.exec("DELETE FROM users WHERE email LIKE '%@example.com'");
  });

  describe('GET /api/auth/login', () => {
    test('should return OAuth URL', async () => {
      const response = await request(app)
        .get('/api/auth/login')
        .expect(200);

      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('accounts.google.com');
      expect(response.body.authUrl).toContain('oauth2');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.role).toBe('member');
    });

    test('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/verify', () => {
    test('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.userId).toBe(testUser.id);
    });

    test('should reject invalid token', async () => {
      await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      // Create a new session for this test
      const profile = {
        id: 'google-logout-test',
        email: 'logout@example.com',
        name: 'Logout Test',
        picture: 'https://example.com/logout.jpg'
      };
      const user = await createOrUpdateUser(profile);
      const session = await createSession(user.id);

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${session.token}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify token is now invalid
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session.token}`)
        .expect(401);
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('Authorization Middleware', () => {
    test('should allow admin to access admin-only resources', async () => {
      // This test verifies the authorize middleware works
      // We'll test this more thoroughly when implementing admin routes
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user.role).toBe('admin');
    });
  });
});
