import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Shop Service
 * Handles shop items, purchases, and user inventory management
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

/**
 * Get all available shop items
 * Requirement 6.1: Display all available items with their coin prices
 * @returns {Promise<Array>} Array of shop items
 */
export async function getAllItems() {
  const stmt = db.prepare(`
    SELECT * FROM shop_items
    ORDER BY type, price
  `);
  
  return stmt.all();
}

/**
 * Purchase an item from the shop
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.8
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID to purchase
 * @returns {Promise<Object>} Purchase result with success status and new coin balance
 * @throws {ValidationError} If user has insufficient coins or already owns the item
 */
export async function purchaseItem(userId, itemId) {
  // Start a transaction for atomicity (Requirement 6.8)
  const transaction = db.transaction(() => {
    // Get user's current coin balance
    const userStmt = db.prepare('SELECT coins FROM users WHERE id = ?');
    const user = userStmt.get(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }
    
    // Get item details
    const itemStmt = db.prepare('SELECT * FROM shop_items WHERE id = ?');
    const item = itemStmt.get(itemId);
    
    if (!item) {
      throw new ValidationError('Item not found');
    }
    
    // Requirement 6.5: Check if user already owns the item (duplicate prevention)
    const hasItemResult = hasItem(userId, itemId);
    if (hasItemResult) {
      throw new ValidationError('Item already owned');
    }
    
    // Requirements 6.2, 6.3: Verify user has sufficient coins
    if (user.coins < item.price) {
      throw new ValidationError('Insufficient coins');
    }
    
    // Requirement 6.4: Deduct coins and add item to inventory atomically
    const newCoinBalance = user.coins - item.price;
    
    // Deduct coins from user
    const updateCoinsStmt = db.prepare(`
      UPDATE users 
      SET coins = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateCoinsStmt.run(newCoinBalance, userId);
    
    // Add item to user's inventory
    const inventoryId = uuidv4();
    const addItemStmt = db.prepare(`
      INSERT INTO inventory_items (id, user_id, item_id, is_active, purchased_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
    `);
    addItemStmt.run(inventoryId, userId, itemId);
    
    return {
      success: true,
      newCoinBalance,
      item
    };
  });
  
  // Execute the transaction
  return transaction();
}

/**
 * Check if user has an item in their inventory
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID
 * @returns {boolean} True if user has the item
 */
export function hasItem(userId, itemId) {
  const stmt = db.prepare(`
    SELECT id FROM inventory_items
    WHERE user_id = ? AND item_id = ?
  `);
  
  const result = stmt.get(userId, itemId);
  return !!result;
}

/**
 * Get user's inventory
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of inventory items with item details
 */
export async function getUserInventory(userId) {
  const stmt = db.prepare(`
    SELECT 
      ii.id,
      ii.item_id,
      ii.is_active,
      ii.purchased_at,
      si.name,
      si.description,
      si.type,
      si.price,
      si.image_url
    FROM inventory_items ii
    INNER JOIN shop_items si ON ii.item_id = si.id
    WHERE ii.user_id = ?
    ORDER BY ii.purchased_at DESC
  `);
  
  return stmt.all(userId);
}

/**
 * Activate an item from user's inventory
 * Requirement 6.6: Apply item to user profile
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID to activate
 * @returns {Promise<Object>} Updated user profile
 * @throws {ValidationError} If user doesn't own the item
 */
export async function activateItem(userId, itemId) {
  // Verify user owns the item
  if (!hasItem(userId, itemId)) {
    throw new ValidationError('Item not found in inventory');
  }
  
  // Get item details to determine type
  const itemStmt = db.prepare('SELECT type FROM shop_items WHERE id = ?');
  const item = itemStmt.get(itemId);
  
  if (!item) {
    throw new ValidationError('Item not found');
  }
  
  // Start transaction to update user profile and inventory
  const transaction = db.transaction(() => {
    // Deactivate all items of the same type for this user
    const deactivateStmt = db.prepare(`
      UPDATE inventory_items
      SET is_active = 0
      WHERE user_id = ? AND item_id IN (
        SELECT id FROM shop_items WHERE type = ?
      )
    `);
    deactivateStmt.run(userId, item.type);
    
    // Activate the selected item
    const activateStmt = db.prepare(`
      UPDATE inventory_items
      SET is_active = 1
      WHERE user_id = ? AND item_id = ?
    `);
    activateStmt.run(userId, itemId);
    
    // Update user profile based on item type
    let updateField;
    switch (item.type) {
      case 'theme':
        updateField = 'selected_theme';
        break;
      case 'badge':
        updateField = 'selected_badge';
        break;
      case 'frame':
        updateField = 'selected_frame';
        break;
      default:
        throw new ValidationError('Invalid item type');
    }
    
    const updateUserStmt = db.prepare(`
      UPDATE users
      SET ${updateField} = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateUserStmt.run(itemId, userId);
    
    // Return updated user
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return userStmt.get(userId);
  });
  
  return transaction();
}
