import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  createSession, 
  validateSession, 
  logout 
} from '../services/authService.js';
import { 
  createOrUpdateUser, 
  getUser, 
  isNicknameAvailable,
  changeRole
} from '../services/userService.js';
import { db } from '../database/db.js';

describe('Authentication Service', () => {
  beforeEach(() => {
    // Clean up test data
    db.exec('DELETE FROM users');
  });

  afterEach(() => {
    // Clean up test data
    db.exec('DELETE FROM users');
  });

  describe('Session Management', () => {
    test('should create a session token', async () => {
      const userId = 'test-user-id';
      const session = await createSession(userId);

      expect(session).toHaveProperty('token');
      expect(session).toHaveProperty('expiresAt');
      expect(typeof session.token).toBe('string');
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    test('should validate a valid session token', async () => {
      // Create a test user
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);

      // Create session
      const session = await createSession(user.id);

      // Validate session
      const validatedUser = await validateSession(session.token);

      expect(validatedUser).not.toBeNull();
      expect(validatedUser.id).toBe(user.id);
      expect(validatedUser.email).toBe(user.email);
    });

    test('should return null for invalid session token', async () => {
      const validatedUser = await validateSession('invalid-token');
      expect(validatedUser).toBeNull();
    });

    test('should invalidate session on logout', async () => {
      // Create a test user
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);

      // Create session
      const session = await createSession(user.id);

      // Verify session is valid
      let validatedUser = await validateSession(session.token);
      expect(validatedUser).not.toBeNull();

      // Logout
      await logout(session.token);

      // Verify session is now invalid
      validatedUser = await validateSession(session.token);
      expect(validatedUser).toBeNull();
    });
  });

  describe('User Service', () => {
    test('should create a new user from Google profile', async () => {
      const profile = {
        id: 'google-123',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/pic.jpg'
      };

      const user = await createOrUpdateUser(profile);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(profile.email);
      expect(user.name).toBe(profile.name);
      expect(user.profile_picture).toBe(profile.picture);
      expect(user.role).toBe('member');
      expect(user.coins).toBe(0);
    });

    test('should update existing user from Google profile', async () => {
      const profile = {
        id: 'google-123',
        email: 'existing@example.com',
        name: 'Original Name',
        picture: 'https://example.com/pic1.jpg'
      };

      // Create user
      const user1 = await createOrUpdateUser(profile);

      // Update with new profile data
      const updatedProfile = {
        ...profile,
        name: 'Updated Name',
        picture: 'https://example.com/pic2.jpg'
      };

      const user2 = await createOrUpdateUser(updatedProfile);

      // Should be same user ID
      expect(user2.id).toBe(user1.id);
      expect(user2.name).toBe('Updated Name');
      expect(user2.profile_picture).toBe('https://example.com/pic2.jpg');
    });

    test('should check nickname availability', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);

      // Update with nickname
      db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run('testuser', user.id);

      // Check availability
      const available1 = await isNicknameAvailable('testuser');
      expect(available1).toBe(false);

      const available2 = await isNicknameAvailable('newuser');
      expect(available2).toBe(true);

      // Check with exclusion
      const available3 = await isNicknameAvailable('testuser', user.id);
      expect(available3).toBe(true);
    });

    test('should change user role (admin only)', async () => {
      // Create admin user
      const adminProfile = {
        id: 'google-admin',
        email: 'admin@example.com',
        name: 'Admin User',
        picture: 'https://example.com/admin.jpg'
      };
      const admin = await createOrUpdateUser(adminProfile);
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', admin.id);

      // Create regular user
      const userProfile = {
        id: 'google-user',
        email: 'user@example.com',
        name: 'Regular User',
        picture: 'https://example.com/user.jpg'
      };
      const user = await createOrUpdateUser(userProfile);

      // Change role
      const updatedUser = await changeRole(admin.id, user.id, 'moderator');

      expect(updatedUser.role).toBe('moderator');
    });

    test('should reject role change from non-admin', async () => {
      // Create two regular users
      const user1Profile = {
        id: 'google-user1',
        email: 'user1@example.com',
        name: 'User 1',
        picture: 'https://example.com/user1.jpg'
      };
      const user1 = await createOrUpdateUser(user1Profile);

      const user2Profile = {
        id: 'google-user2',
        email: 'user2@example.com',
        name: 'User 2',
        picture: 'https://example.com/user2.jpg'
      };
      const user2 = await createOrUpdateUser(user2Profile);

      // Try to change role
      await expect(changeRole(user1.id, user2.id, 'moderator')).rejects.toThrow('Only admins can change user roles');
    });
  });
});
