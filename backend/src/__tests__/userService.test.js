import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  createOrUpdateUser, 
  getUser, 
  updateProfile,
  isNicknameAvailable,
  changeRole,
  getFollowers,
  getFollowing
} from '../services/userService.js';
import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

describe('User Service', () => {
  beforeEach(() => {
    // Clean up test data
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM follows');
    db.exec('DELETE FROM inventory_items');
    db.exec('DELETE FROM shop_items');
  });

  afterEach(() => {
    // Clean up test data
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM follows');
    db.exec('DELETE FROM inventory_items');
    db.exec('DELETE FROM shop_items');
  });

  describe('createOrUpdateUser', () => {
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

      const user1 = await createOrUpdateUser(profile);

      const updatedProfile = {
        ...profile,
        name: 'Updated Name',
        picture: 'https://example.com/pic2.jpg'
      };

      const user2 = await createOrUpdateUser(updatedProfile);

      expect(user2.id).toBe(user1.id);
      expect(user2.name).toBe('Updated Name');
      expect(user2.profile_picture).toBe('https://example.com/pic2.jpg');
    });
  });

  describe('getUser', () => {
    test('should retrieve user by ID', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };

      const created = await createOrUpdateUser(profile);
      const retrieved = await getUser(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.email).toBe(created.email);
    });

    test('should return null for non-existent user', async () => {
      const user = await getUser('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('updateProfile', () => {
    let testUser;

    beforeEach(async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      testUser = await createOrUpdateUser(profile);
    });

    test('should update nickname successfully', async () => {
      const updated = await updateProfile(testUser.id, {
        nickname: 'testnick'
      });

      expect(updated.nickname).toBe('testnick');
    });

    test('should reject duplicate nickname', async () => {
      // Create another user with a nickname
      const profile2 = {
        id: 'google-456',
        email: 'other@example.com',
        name: 'Other User',
        picture: 'https://example.com/pic2.jpg'
      };
      const user2 = await createOrUpdateUser(profile2);
      await updateProfile(user2.id, { nickname: 'takennick' });

      // Try to use the same nickname
      await expect(
        updateProfile(testUser.id, { nickname: 'takennick' })
      ).rejects.toThrow('Nickname is already taken');
    });

    test('should update bio successfully', async () => {
      const bio = 'This is my bio';
      const updated = await updateProfile(testUser.id, { bio });

      expect(updated.bio).toBe(bio);
    });

    test('should reject bio exceeding 512 characters', async () => {
      const longBio = 'a'.repeat(513);

      await expect(
        updateProfile(testUser.id, { bio: longBio })
      ).rejects.toThrow('Bio must not exceed 512 characters');
    });

    test('should accept bio with exactly 512 characters', async () => {
      const bio = 'a'.repeat(512);
      const updated = await updateProfile(testUser.id, { bio });

      expect(updated.bio).toBe(bio);
    });

    test('should update education level successfully', async () => {
      const updated = await updateProfile(testUser.id, {
        education_level: 'university'
      });

      expect(updated.education_level).toBe('university');
    });

    test('should reject invalid education level', async () => {
      await expect(
        updateProfile(testUser.id, { education_level: 'invalid' })
      ).rejects.toThrow('Invalid education level');
    });

    test('should accept all valid education levels', async () => {
      const levels = ['junior_high', 'senior_high', 'university'];

      for (const level of levels) {
        const updated = await updateProfile(testUser.id, {
          education_level: level
        });
        expect(updated.education_level).toBe(level);
      }
    });

    test('should update profile picture successfully', async () => {
      const newPicture = 'https://example.com/newpic.jpg';
      const updated = await updateProfile(testUser.id, {
        profile_picture: newPicture
      });

      expect(updated.profile_picture).toBe(newPicture);
    });

    test('should accept profile picture with .png extension', async () => {
      const newPicture = 'https://example.com/newpic.png';
      const updated = await updateProfile(testUser.id, {
        profile_picture: newPicture
      });

      expect(updated.profile_picture).toBe(newPicture);
    });

    test('should accept profile picture with .jpeg extension', async () => {
      const newPicture = 'https://example.com/newpic.jpeg';
      const updated = await updateProfile(testUser.id, {
        profile_picture: newPicture
      });

      expect(updated.profile_picture).toBe(newPicture);
    });

    test('should accept profile picture with uppercase extension', async () => {
      const newPicture = 'https://example.com/newpic.JPG';
      const updated = await updateProfile(testUser.id, {
        profile_picture: newPicture
      });

      expect(updated.profile_picture).toBe(newPicture);
    });

    test('should reject profile picture with invalid format', async () => {
      await expect(
        updateProfile(testUser.id, { profile_picture: 'https://example.com/pic.gif' })
      ).rejects.toThrow('Profile picture must be in JPG or PNG format');
    });

    test('should reject profile picture with .pdf extension', async () => {
      await expect(
        updateProfile(testUser.id, { profile_picture: 'https://example.com/pic.pdf' })
      ).rejects.toThrow('Profile picture must be in JPG or PNG format');
    });

    test('should reject profile picture with .webp extension', async () => {
      await expect(
        updateProfile(testUser.id, { profile_picture: 'https://example.com/pic.webp' })
      ).rejects.toThrow('Profile picture must be in JPG or PNG format');
    });

    test('should reject theme not in inventory', async () => {
      await expect(
        updateProfile(testUser.id, { selected_theme: 'non-existent-theme' })
      ).rejects.toThrow('Theme not found in user inventory');
    });

    test('should accept theme in inventory', async () => {
      // Create a shop item
      const themeId = uuidv4();
      db.prepare(`
        INSERT INTO shop_items (id, name, description, type, price, image_url)
        VALUES (?, 'Dark Theme', 'A dark theme', 'theme', 50, '/themes/dark.png')
      `).run(themeId);

      // Add to user inventory
      db.prepare(`
        INSERT INTO inventory_items (id, user_id, item_id, is_active, purchased_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(uuidv4(), testUser.id, themeId);

      const updated = await updateProfile(testUser.id, {
        selected_theme: themeId
      });

      expect(updated.selected_theme).toBe(themeId);
    });

    test('should reject badge not in inventory', async () => {
      await expect(
        updateProfile(testUser.id, { selected_badge: 'non-existent-badge' })
      ).rejects.toThrow('Badge not found in user inventory');
    });

    test('should accept badge in inventory', async () => {
      // Create a shop item
      const badgeId = uuidv4();
      db.prepare(`
        INSERT INTO shop_items (id, name, description, type, price, image_url)
        VALUES (?, 'Expert Badge', 'An expert badge', 'badge', 100, '/badges/expert.png')
      `).run(badgeId);

      // Add to user inventory
      db.prepare(`
        INSERT INTO inventory_items (id, user_id, item_id, is_active, purchased_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(uuidv4(), testUser.id, badgeId);

      const updated = await updateProfile(testUser.id, {
        selected_badge: badgeId
      });

      expect(updated.selected_badge).toBe(badgeId);
    });

    test('should reject frame not in inventory', async () => {
      await expect(
        updateProfile(testUser.id, { selected_frame: 'non-existent-frame' })
      ).rejects.toThrow('Frame not found in user inventory');
    });

    test('should accept frame in inventory', async () => {
      // Create a shop item
      const frameId = uuidv4();
      db.prepare(`
        INSERT INTO shop_items (id, name, description, type, price, image_url)
        VALUES (?, 'Gold Frame', 'A gold frame', 'frame', 150, '/frames/gold.png')
      `).run(frameId);

      // Add to user inventory
      db.prepare(`
        INSERT INTO inventory_items (id, user_id, item_id, is_active, purchased_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(uuidv4(), testUser.id, frameId);

      const updated = await updateProfile(testUser.id, {
        selected_frame: frameId
      });

      expect(updated.selected_frame).toBe(frameId);
    });

    test('should update multiple fields at once', async () => {
      const updates = {
        nickname: 'newnick',
        bio: 'New bio',
        education_level: 'university'
      };

      const updated = await updateProfile(testUser.id, updates);

      expect(updated.nickname).toBe(updates.nickname);
      expect(updated.bio).toBe(updates.bio);
      expect(updated.education_level).toBe(updates.education_level);
    });

    test('should return unchanged user if no valid updates', async () => {
      const updated = await updateProfile(testUser.id, {});
      expect(updated.id).toBe(testUser.id);
    });

    test('should allow null values for optional theme/badge/frame', async () => {
      const updated = await updateProfile(testUser.id, {
        selected_theme: null,
        selected_badge: null,
        selected_frame: null
      });

      expect(updated.selected_theme).toBeNull();
      expect(updated.selected_badge).toBeNull();
      expect(updated.selected_frame).toBeNull();
    });
  });

  describe('isNicknameAvailable', () => {
    test('should return true for available nickname', async () => {
      const available = await isNicknameAvailable('availablenick');
      expect(available).toBe(true);
    });

    test('should return false for taken nickname', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);
      await updateProfile(user.id, { nickname: 'takennick' });

      const available = await isNicknameAvailable('takennick');
      expect(available).toBe(false);
    });

    test('should return true when excluding current user', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);
      await updateProfile(user.id, { nickname: 'mynick' });

      const available = await isNicknameAvailable('mynick', user.id);
      expect(available).toBe(true);
    });
  });

  describe('changeRole', () => {
    let admin, regularUser;

    beforeEach(async () => {
      const adminProfile = {
        id: 'google-admin',
        email: 'admin@example.com',
        name: 'Admin User',
        picture: 'https://example.com/admin.jpg'
      };
      admin = await createOrUpdateUser(adminProfile);
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', admin.id);

      const userProfile = {
        id: 'google-user',
        email: 'user@example.com',
        name: 'Regular User',
        picture: 'https://example.com/user.jpg'
      };
      regularUser = await createOrUpdateUser(userProfile);
    });

    test('should allow admin to change user role to moderator', async () => {
      const updated = await changeRole(admin.id, regularUser.id, 'moderator');
      expect(updated.role).toBe('moderator');
    });

    test('should allow admin to change user role to member', async () => {
      // First make user a moderator
      await changeRole(admin.id, regularUser.id, 'moderator');
      
      // Then change back to member
      const updated = await changeRole(admin.id, regularUser.id, 'member');
      expect(updated.role).toBe('member');
    });

    test('should allow admin to change user role to admin', async () => {
      const updated = await changeRole(admin.id, regularUser.id, 'admin');
      expect(updated.role).toBe('admin');
    });

    test('should reject role change from non-admin', async () => {
      const user2Profile = {
        id: 'google-user2',
        email: 'user2@example.com',
        name: 'User 2',
        picture: 'https://example.com/user2.jpg'
      };
      const user2 = await createOrUpdateUser(user2Profile);

      await expect(
        changeRole(regularUser.id, user2.id, 'moderator')
      ).rejects.toThrow(AuthorizationError);
      
      await expect(
        changeRole(regularUser.id, user2.id, 'moderator')
      ).rejects.toThrow('Only admins can change user roles');
    });

    test('should reject role change from moderator', async () => {
      // Make regularUser a moderator
      await changeRole(admin.id, regularUser.id, 'moderator');
      
      const user2Profile = {
        id: 'google-user2',
        email: 'user2@example.com',
        name: 'User 2',
        picture: 'https://example.com/user2.jpg'
      };
      const user2 = await createOrUpdateUser(user2Profile);

      await expect(
        changeRole(regularUser.id, user2.id, 'moderator')
      ).rejects.toThrow(AuthorizationError);
    });

    test('should reject invalid role', async () => {
      await expect(
        changeRole(admin.id, regularUser.id, 'invalid')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        changeRole(admin.id, regularUser.id, 'invalid')
      ).rejects.toThrow('Invalid role');
    });

    test('should apply new permissions immediately', async () => {
      // Change role to moderator
      const updated = await changeRole(admin.id, regularUser.id, 'moderator');
      expect(updated.role).toBe('moderator');
      
      // Verify the change is immediately reflected
      const retrieved = await getUser(regularUser.id);
      expect(retrieved.role).toBe('moderator');
    });
  });

  describe('getFollowers', () => {
    test('should return empty array for user with no followers', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);

      const followers = await getFollowers(user.id);
      expect(followers).toEqual([]);
    });

    test('should return list of followers', async () => {
      // Create users
      const user1 = await createOrUpdateUser({
        id: 'google-1',
        email: 'user1@example.com',
        name: 'User 1',
        picture: 'https://example.com/pic1.jpg'
      });

      const user2 = await createOrUpdateUser({
        id: 'google-2',
        email: 'user2@example.com',
        name: 'User 2',
        picture: 'https://example.com/pic2.jpg'
      });

      const user3 = await createOrUpdateUser({
        id: 'google-3',
        email: 'user3@example.com',
        name: 'User 3',
        picture: 'https://example.com/pic3.jpg'
      });

      // Create follow relationships (user2 and user3 follow user1)
      db.prepare(`
        INSERT INTO follows (id, follower_id, following_id, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(uuidv4(), user2.id, user1.id);

      db.prepare(`
        INSERT INTO follows (id, follower_id, following_id, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(uuidv4(), user3.id, user1.id);

      const followers = await getFollowers(user1.id);
      expect(followers).toHaveLength(2);
      expect(followers.map(f => f.id)).toContain(user2.id);
      expect(followers.map(f => f.id)).toContain(user3.id);
    });
  });

  describe('getFollowing', () => {
    test('should return empty array for user not following anyone', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg'
      };
      const user = await createOrUpdateUser(profile);

      const following = await getFollowing(user.id);
      expect(following).toEqual([]);
    });

    test('should return list of users being followed', async () => {
      // Create users
      const user1 = await createOrUpdateUser({
        id: 'google-1',
        email: 'user1@example.com',
        name: 'User 1',
        picture: 'https://example.com/pic1.jpg'
      });

      const user2 = await createOrUpdateUser({
        id: 'google-2',
        email: 'user2@example.com',
        name: 'User 2',
        picture: 'https://example.com/pic2.jpg'
      });

      const user3 = await createOrUpdateUser({
        id: 'google-3',
        email: 'user3@example.com',
        name: 'User 3',
        picture: 'https://example.com/pic3.jpg'
      });

      // Create follow relationships (user1 follows user2 and user3)
      db.prepare(`
        INSERT INTO follows (id, follower_id, following_id, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(uuidv4(), user1.id, user2.id);

      db.prepare(`
        INSERT INTO follows (id, follower_id, following_id, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(uuidv4(), user1.id, user3.id);

      const following = await getFollowing(user1.id);
      expect(following).toHaveLength(2);
      expect(following.map(f => f.id)).toContain(user2.id);
      expect(following.map(f => f.id)).toContain(user3.id);
    });
  });
});
