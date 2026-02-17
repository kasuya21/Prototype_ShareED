import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { purchaseItem, activateItem, getUserInventory } from '../services/shopService.js';
import { updateProfile, getUser } from '../services/userService.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Integration tests for Shop Service and Profile Customization
 * Requirements: 6.6, 13.6
 */
describe('Shop and Profile Integration', () => {
  let testUserId;
  let themeId1;
  let themeId2;
  let badgeId;
  let frameId;

  beforeEach(() => {
    // Create test user
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, role, coins)
      VALUES (?, ?, ?, 'member', 5000)
    `).run(testUserId, `test-${testUserId}@example.com`, 'Test User');

    // Create test shop items
    themeId1 = uuidv4();
    themeId2 = uuidv4();
    badgeId = uuidv4();
    frameId = uuidv4();

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(themeId1, 'Dark Theme', 'A dark theme', 'theme', 100, 'http://example.com/dark.png');

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(themeId2, 'Light Theme', 'A light theme', 'theme', 150, 'http://example.com/light.png');

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(badgeId, 'Gold Badge', 'A gold badge', 'badge', 200, 'http://example.com/gold.png');

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(frameId, 'Fancy Frame', 'A fancy frame', 'frame', 300, 'http://example.com/frame.png');
  });

  afterEach(() => {
    // Clean up
    db.prepare('DELETE FROM inventory_items WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    db.prepare('DELETE FROM shop_items WHERE id IN (?, ?, ?, ?)').run(themeId1, themeId2, badgeId, frameId);
  });

  describe('Theme Selection Integration', () => {
    it('should allow activating a purchased theme', async () => {
      // Purchase theme
      await purchaseItem(testUserId, themeId1);

      // Activate theme
      await activateItem(testUserId, themeId1);

      // Verify theme is active in inventory
      const inventory = await getUserInventory(testUserId);
      const theme = inventory.find(i => i.itemId === themeId1);
      expect(theme.isActive).toBe(true);

      // Verify user profile has selected theme
      const user = await getUser(testUserId);
      expect(user.selected_theme).toBe(themeId1);
    });

    it('should reject selecting theme not in inventory via updateProfile', async () => {
      // Try to select theme without purchasing
      await expect(
        updateProfile(testUserId, { selected_theme: themeId1 })
      ).rejects.toThrow(ValidationError);
    });

    it('should allow selecting theme in inventory via updateProfile', async () => {
      // Purchase theme
      await purchaseItem(testUserId, themeId1);

      // Select theme via updateProfile
      const updatedUser = await updateProfile(testUserId, { selected_theme: themeId1 });

      expect(updatedUser.selected_theme).toBe(themeId1);
    });

    it('should switch between themes correctly', async () => {
      // Purchase both themes
      await purchaseItem(testUserId, themeId1);
      await purchaseItem(testUserId, themeId2);

      // Activate first theme
      await activateItem(testUserId, themeId1);

      let inventory = await getUserInventory(testUserId);
      let theme1 = inventory.find(i => i.itemId === themeId1);
      let theme2 = inventory.find(i => i.itemId === themeId2);

      expect(theme1.isActive).toBe(true);
      expect(theme2.isActive).toBe(false);

      // Activate second theme
      await activateItem(testUserId, themeId2);

      inventory = await getUserInventory(testUserId);
      theme1 = inventory.find(i => i.itemId === themeId1);
      theme2 = inventory.find(i => i.itemId === themeId2);

      expect(theme1.isActive).toBe(false);
      expect(theme2.isActive).toBe(true);

      // Verify user profile updated
      const user = await getUser(testUserId);
      expect(user.selected_theme).toBe(themeId2);
    });
  });

  describe('Badge and Frame Integration', () => {
    it('should allow activating purchased badge', async () => {
      await purchaseItem(testUserId, badgeId);
      await activateItem(testUserId, badgeId);

      const user = await getUser(testUserId);
      expect(user.selected_badge).toBe(badgeId);
    });

    it('should allow activating purchased frame', async () => {
      await purchaseItem(testUserId, frameId);
      await activateItem(testUserId, frameId);

      const user = await getUser(testUserId);
      expect(user.selected_frame).toBe(frameId);
    });

    it('should reject selecting badge not in inventory', async () => {
      await expect(
        updateProfile(testUserId, { selected_badge: badgeId })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject selecting frame not in inventory', async () => {
      await expect(
        updateProfile(testUserId, { selected_frame: frameId })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Complete Profile Customization Flow', () => {
    it('should handle complete customization workflow', async () => {
      // Purchase all items
      await purchaseItem(testUserId, themeId1);
      await purchaseItem(testUserId, badgeId);
      await purchaseItem(testUserId, frameId);

      // Activate all items
      await activateItem(testUserId, themeId1);
      await activateItem(testUserId, badgeId);
      await activateItem(testUserId, frameId);

      // Verify all items are active
      const inventory = await getUserInventory(testUserId);
      expect(inventory.length).toBe(3);
      expect(inventory.every(item => item.isActive)).toBe(true);

      // Verify user profile has all selections
      const user = await getUser(testUserId);
      expect(user.selected_theme).toBe(themeId1);
      expect(user.selected_badge).toBe(badgeId);
      expect(user.selected_frame).toBe(frameId);
    });

    it('should allow updating profile with owned items', async () => {
      // Purchase items
      await purchaseItem(testUserId, themeId1);
      await purchaseItem(testUserId, badgeId);

      // Update profile with multiple customizations
      const updatedUser = await updateProfile(testUserId, {
        nickname: 'CustomUser',
        bio: 'Test bio',
        selected_theme: themeId1,
        selected_badge: badgeId
      });

      expect(updatedUser.nickname).toBe('CustomUser');
      expect(updatedUser.bio).toBe('Test bio');
      expect(updatedUser.selected_theme).toBe(themeId1);
      expect(updatedUser.selected_badge).toBe(badgeId);
    });

    it('should allow clearing selections by setting to null', async () => {
      // Purchase and activate theme
      await purchaseItem(testUserId, themeId1);
      await activateItem(testUserId, themeId1);

      // Clear selection
      const updatedUser = await updateProfile(testUserId, {
        selected_theme: null
      });

      expect(updatedUser.selected_theme).toBeNull();
    });
  });

  describe('Inventory Ownership Validation', () => {
    it('should validate ownership before applying items', async () => {
      // Try to select items without purchasing
      await expect(
        updateProfile(testUserId, {
          selected_theme: themeId1,
          selected_badge: badgeId,
          selected_frame: frameId
        })
      ).rejects.toThrow(ValidationError);

      // Verify user profile unchanged
      const user = await getUser(testUserId);
      expect(user.selected_theme).toBeNull();
      expect(user.selected_badge).toBeNull();
      expect(user.selected_frame).toBeNull();
    });

    it('should validate each item type independently', async () => {
      // Purchase only theme
      await purchaseItem(testUserId, themeId1);

      // Should succeed for theme
      await updateProfile(testUserId, { selected_theme: themeId1 });

      // Should fail for badge
      await expect(
        updateProfile(testUserId, { selected_badge: badgeId })
      ).rejects.toThrow(ValidationError);

      // Should fail for frame
      await expect(
        updateProfile(testUserId, { selected_frame: frameId })
      ).rejects.toThrow(ValidationError);
    });
  });
});
