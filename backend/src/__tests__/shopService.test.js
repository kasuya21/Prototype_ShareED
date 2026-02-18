import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  getAllItems,
  purchaseItem,
  hasItem,
  getUserInventory,
  activateItem
} from '../services/shopService.js';
import { createOrUpdateUser } from '../services/userService.js';
import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../utils/errors.js';

describe('Shop Service', () => {
  let testUser;
  let testItem1, testItem2, testItem3;

  beforeEach(async () => {
    // Clean up test data - delete in correct order to avoid foreign key constraints
    db.exec('DELETE FROM inventory_items');
    db.exec('DELETE FROM user_achievements');
    db.exec('DELETE FROM quests');
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM follows');
    db.exec('DELETE FROM bookmarks');
    db.exec('DELETE FROM likes');
    db.exec('DELETE FROM reports');
    db.exec('DELETE FROM comments');
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM shop_items');
    db.exec('DELETE FROM achievements');
    db.exec('DELETE FROM users');

    // Create test user
    const profile = {
      id: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg'
    };
    testUser = await createOrUpdateUser(profile);
    
    // Give user some coins
    db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(1000, testUser.id);

    // Create test shop items
    testItem1 = {
      id: uuidv4(),
      name: 'Dark Theme',
      description: 'A dark theme for your profile',
      type: 'theme',
      price: 50,
      image_url: '/themes/dark.png'
    };

    testItem2 = {
      id: uuidv4(),
      name: 'Expert Badge',
      description: 'Badge for experts',
      type: 'badge',
      price: 100,
      image_url: '/badges/expert.png'
    };

    testItem3 = {
      id: uuidv4(),
      name: 'Gold Frame',
      description: 'A gold frame',
      type: 'frame',
      price: 150,
      image_url: '/frames/gold.png'
    };

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testItem1.id, testItem1.name, testItem1.description, testItem1.type, testItem1.price, testItem1.image_url);

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testItem2.id, testItem2.name, testItem2.description, testItem2.type, testItem2.price, testItem2.image_url);

    db.prepare(`
      INSERT INTO shop_items (id, name, description, type, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testItem3.id, testItem3.name, testItem3.description, testItem3.type, testItem3.price, testItem3.image_url);
  });

  afterEach(() => {
    // Clean up test data - delete in correct order to avoid foreign key constraints
    db.exec('DELETE FROM inventory_items');
    db.exec('DELETE FROM user_achievements');
    db.exec('DELETE FROM quests');
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM follows');
    db.exec('DELETE FROM bookmarks');
    db.exec('DELETE FROM likes');
    db.exec('DELETE FROM reports');
    db.exec('DELETE FROM comments');
    db.exec('DELETE FROM posts');
    db.exec('DELETE FROM shop_items');
    db.exec('DELETE FROM achievements');
    db.exec('DELETE FROM users');
  });

  describe('getAllItems', () => {
    test('should return all shop items', async () => {
      const items = await getAllItems();
      
      expect(items).toHaveLength(3);
      expect(items.map(i => i.id)).toContain(testItem1.id);
      expect(items.map(i => i.id)).toContain(testItem2.id);
      expect(items.map(i => i.id)).toContain(testItem3.id);
    });

    test('should return items with all required fields', async () => {
      const items = await getAllItems();
      
      const item = items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('image_url');
    });

    test('should return empty array when no items exist', async () => {
      db.exec('DELETE FROM shop_items');
      
      const items = await getAllItems();
      expect(items).toEqual([]);
    });

    test('should display coin prices for all items', async () => {
      const items = await getAllItems();
      
      items.forEach(item => {
        expect(typeof item.price).toBe('number');
        expect(item.price).toBeGreaterThan(0);
      });
    });
  });

  describe('purchaseItem', () => {
    test('should successfully purchase an item with sufficient coins', async () => {
      const result = await purchaseItem(testUser.id, testItem1.id);
      
      expect(result.success).toBe(true);
      expect(result.newCoinBalance).toBe(1000 - testItem1.price);
      expect(result.item.id).toBe(testItem1.id);
    });

    test('should deduct correct coin amount from user balance', async () => {
      const initialCoins = 1000;
      await purchaseItem(testUser.id, testItem1.id);
      
      const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUser.id);
      expect(user.coins).toBe(initialCoins - testItem1.price);
    });

    test('should add item to user inventory', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      
      const inventory = await getUserInventory(testUser.id);
      expect(inventory).toHaveLength(1);
      expect(inventory[0].item_id).toBe(testItem1.id);
    });

    test('should reject purchase with insufficient coins', async () => {
      // Set user coins to less than item price
      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(10, testUser.id);
      
      await expect(
        purchaseItem(testUser.id, testItem1.id)
      ).rejects.toThrow(ValidationError);
      
      await expect(
        purchaseItem(testUser.id, testItem1.id)
      ).rejects.toThrow('Insufficient coins');
    });

    test('should reject purchase of already owned item', async () => {
      // Purchase item first time
      await purchaseItem(testUser.id, testItem1.id);
      
      // Try to purchase again
      await expect(
        purchaseItem(testUser.id, testItem1.id)
      ).rejects.toThrow(ValidationError);
      
      await expect(
        purchaseItem(testUser.id, testItem1.id)
      ).rejects.toThrow('Item already owned');
    });

    test('should reject purchase of non-existent item', async () => {
      await expect(
        purchaseItem(testUser.id, 'non-existent-item')
      ).rejects.toThrow(ValidationError);
      
      await expect(
        purchaseItem(testUser.id, 'non-existent-item')
      ).rejects.toThrow('Item not found');
    });

    test('should reject purchase by non-existent user', async () => {
      await expect(
        purchaseItem('non-existent-user', testItem1.id)
      ).rejects.toThrow(ValidationError);
      
      await expect(
        purchaseItem('non-existent-user', testItem1.id)
      ).rejects.toThrow('User not found');
    });

    test('should handle atomic transaction - rollback on failure', async () => {
      const initialCoins = 1000;
      
      // Try to purchase non-existent item
      try {
        await purchaseItem(testUser.id, 'non-existent-item');
      } catch (error) {
        // Expected to fail
      }
      
      // Verify coins were not deducted
      const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUser.id);
      expect(user.coins).toBe(initialCoins);
      
      // Verify no inventory item was added
      const inventory = await getUserInventory(testUser.id);
      expect(inventory).toHaveLength(0);
    });

    test('should allow purchasing multiple different items', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      await purchaseItem(testUser.id, testItem2.id);
      
      const inventory = await getUserInventory(testUser.id);
      expect(inventory).toHaveLength(2);
    });

    test('should calculate correct balance after multiple purchases', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      await purchaseItem(testUser.id, testItem2.id);
      
      const expectedBalance = 1000 - testItem1.price - testItem2.price;
      const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUser.id);
      expect(user.coins).toBe(expectedBalance);
    });

    test('should reject purchase when exact coins but already owned', async () => {
      // Set coins to exact item price
      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(testItem1.price, testUser.id);
      
      // Purchase item
      await purchaseItem(testUser.id, testItem1.id);
      
      // Give user coins again
      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(testItem1.price, testUser.id);
      
      // Try to purchase same item again
      await expect(
        purchaseItem(testUser.id, testItem1.id)
      ).rejects.toThrow('Item already owned');
    });
  });

  describe('hasItem', () => {
    test('should return true when user owns the item', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      
      const result = hasItem(testUser.id, testItem1.id);
      expect(result).toBe(true);
    });

    test('should return false when user does not own the item', () => {
      const result = hasItem(testUser.id, testItem1.id);
      expect(result).toBe(false);
    });

    test('should return false for non-existent item', () => {
      const result = hasItem(testUser.id, 'non-existent-item');
      expect(result).toBe(false);
    });

    test('should return false for non-existent user', () => {
      const result = hasItem('non-existent-user', testItem1.id);
      expect(result).toBe(false);
    });

    test('should correctly distinguish between different users', async () => {
      // Create another user
      const profile2 = {
        id: 'google-456',
        email: 'user2@example.com',
        name: 'User 2',
        picture: 'https://example.com/pic2.jpg'
      };
      const user2 = await createOrUpdateUser(profile2);
      db.prepare('UPDATE users SET coins = ? WHERE id = ?').run(1000, user2.id);
      
      // User 1 purchases item
      await purchaseItem(testUser.id, testItem1.id);
      
      // User 1 should have the item
      expect(hasItem(testUser.id, testItem1.id)).toBe(true);
      
      // User 2 should not have the item
      expect(hasItem(user2.id, testItem1.id)).toBe(false);
    });
  });

  describe('getUserInventory', () => {
    test('should return empty array for user with no items', async () => {
      const inventory = await getUserInventory(testUser.id);
      expect(inventory).toEqual([]);
    });

    test('should return all items in user inventory', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      await purchaseItem(testUser.id, testItem2.id);
      
      const inventory = await getUserInventory(testUser.id);
      expect(inventory).toHaveLength(2);
    });

    test('should include item details in inventory', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      
      const inventory = await getUserInventory(testUser.id);
      const item = inventory[0];
      
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('item_id');
      expect(item).toHaveProperty('is_active');
      expect(item).toHaveProperty('purchased_at');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('image_url');
    });

    test('should show correct item details', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      
      const inventory = await getUserInventory(testUser.id);
      const item = inventory[0];
      
      expect(item.item_id).toBe(testItem1.id);
      expect(item.name).toBe(testItem1.name);
      expect(item.type).toBe(testItem1.type);
      expect(item.price).toBe(testItem1.price);
    });

    test('should order items by purchase date (newest first)', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await purchaseItem(testUser.id, testItem2.id);
      
      const inventory = await getUserInventory(testUser.id);
      
      // Most recent purchase should be first
      expect(inventory[0].item_id).toBe(testItem2.id);
      expect(inventory[1].item_id).toBe(testItem1.id);
    });

    test('should show is_active status correctly', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      
      const inventory = await getUserInventory(testUser.id);
      expect(inventory[0].is_active).toBe(0);
    });
  });

  describe('activateItem', () => {
    test('should activate item in user inventory', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      await activateItem(testUser.id, testItem1.id);
      
      const inventory = await getUserInventory(testUser.id);
      expect(inventory[0].is_active).toBe(1);
    });

    test('should update user profile with theme', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      const result = await activateItem(testUser.id, testItem1.id);
      
      expect(result.selected_theme).toBe(testItem1.id);
    });

    test('should update user profile with badge', async () => {
      await purchaseItem(testUser.id, testItem2.id);
      const result = await activateItem(testUser.id, testItem2.id);
      
      expect(result.selected_badge).toBe(testItem2.id);
    });

    test('should update user profile with frame', async () => {
      await purchaseItem(testUser.id, testItem3.id);
      const result = await activateItem(testUser.id, testItem3.id);
      
      expect(result.selected_frame).toBe(testItem3.id);
    });

    test('should reject activation of item not in inventory', async () => {
      await expect(
        activateItem(testUser.id, testItem1.id)
      ).rejects.toThrow(ValidationError);
      
      await expect(
        activateItem(testUser.id, testItem1.id)
      ).rejects.toThrow('Item not found in inventory');
    });

    test('should deactivate previous item of same type', async () => {
      // Create another theme
      const theme2Id = uuidv4();
      db.prepare(`
        INSERT INTO shop_items (id, name, description, type, price, image_url)
        VALUES (?, 'Light Theme', 'A light theme', 'theme', 50, '/themes/light.png')
      `).run(theme2Id);
      
      // Purchase both themes
      await purchaseItem(testUser.id, testItem1.id);
      await purchaseItem(testUser.id, theme2Id);
      
      // Activate first theme
      await activateItem(testUser.id, testItem1.id);
      
      // Activate second theme
      await activateItem(testUser.id, theme2Id);
      
      // Check that only second theme is active
      const inventory = await getUserInventory(testUser.id);
      const theme1 = inventory.find(i => i.item_id === testItem1.id);
      const theme2 = inventory.find(i => i.item_id === theme2Id);
      
      expect(theme1.is_active).toBe(0);
      expect(theme2.is_active).toBe(1);
    });

    test('should allow different item types to be active simultaneously', async () => {
      await purchaseItem(testUser.id, testItem1.id); // theme
      await purchaseItem(testUser.id, testItem2.id); // badge
      await purchaseItem(testUser.id, testItem3.id); // frame
      
      await activateItem(testUser.id, testItem1.id);
      await activateItem(testUser.id, testItem2.id);
      await activateItem(testUser.id, testItem3.id);
      
      const inventory = await getUserInventory(testUser.id);
      
      inventory.forEach(item => {
        expect(item.is_active).toBe(1);
      });
    });

    test('should return updated user object', async () => {
      await purchaseItem(testUser.id, testItem1.id);
      const result = await activateItem(testUser.id, testItem1.id);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('selected_theme');
      expect(result.id).toBe(testUser.id);
    });
  });
});
