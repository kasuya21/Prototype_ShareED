import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { validateBioLength, validateEducationLevel } from '../utils/validators.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';

/**
 * User Service
 * Handles user management, profile updates, and role management
 */

/**
 * Create or update user from Google profile
 * @param {Object} profile - Google profile
 * @returns {Promise<Object>} User object
 */
export async function createOrUpdateUser(profile) {
  const { id, email, name, picture } = profile;

  // Check if user exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (existingUser) {
    // Update existing user
    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `);
    
    stmt.run(name, picture, email);
    
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  } else {
    // Create new user
    const userId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, profile_picture, role, coins)
      VALUES (?, ?, ?, ?, 'member', 0)
    `);
    
    stmt.run(userId, email, name, picture);
    
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId) || null;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated user object
 */
export async function updateProfile(userId, updates) {
  // Validate bio length (Requirement 13.4, 13.5)
  if (updates.bio !== undefined) {
    validateBioLength(updates.bio);
  }

  // Validate education level (Requirement 13.8)
  if (updates.education_level !== undefined) {
    validateEducationLevel(updates.education_level);
  }

  // Validate nickname uniqueness (Requirement 13.1, 13.2)
  if (updates.nickname !== undefined) {
    const available = await isNicknameAvailable(updates.nickname, userId);
    if (!available) {
      throw new ValidationError('Nickname is already taken');
    }
  }

  // Validate theme is in user's inventory (Requirement 13.6)
  if (updates.selected_theme !== undefined && updates.selected_theme !== null) {
    const hasTheme = await checkUserHasItem(userId, updates.selected_theme);
    if (!hasTheme) {
      throw new ValidationError('Theme not found in user inventory');
    }
  }

  // Validate badge is in user's inventory
  if (updates.selected_badge !== undefined && updates.selected_badge !== null) {
    const hasBadge = await checkUserHasItem(userId, updates.selected_badge);
    if (!hasBadge) {
      throw new ValidationError('Badge not found in user inventory');
    }
  }

  // Validate frame is in user's inventory
  if (updates.selected_frame !== undefined && updates.selected_frame !== null) {
    const hasFrame = await checkUserHasItem(userId, updates.selected_frame);
    if (!hasFrame) {
      throw new ValidationError('Frame not found in user inventory');
    }
  }

  const allowedFields = ['nickname', 'profile_picture', 'bio', 'education_level', 'selected_theme', 'selected_badge', 'selected_frame'];
  const updateFields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updateFields.length === 0) {
    return getUser(userId);
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getUser(userId);
}

/**
 * Check if nickname is available
 * @param {string} nickname - Nickname to check
 * @param {string} excludeUserId - User ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if available
 */
export async function isNicknameAvailable(nickname, excludeUserId = null) {
  let stmt;
  let result;

  if (excludeUserId) {
    stmt = db.prepare('SELECT id FROM users WHERE nickname = ? AND id != ?');
    result = stmt.get(nickname, excludeUserId);
  } else {
    stmt = db.prepare('SELECT id FROM users WHERE nickname = ?');
    result = stmt.get(nickname);
  }

  return !result;
}

/**
 * Change user role (Admin only)
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * @param {string} adminId - Admin user ID
 * @param {string} targetUserId - Target user ID
 * @param {string} newRole - New role (member, moderator, admin)
 * @returns {Promise<Object>} Updated user object
 * @throws {AuthorizationError} If the requesting user is not an admin
 * @throws {ValidationError} If the new role is invalid
 */
export async function changeRole(adminId, targetUserId, newRole) {
  // Requirement 2.4: Verify admin has admin role (Admin only restriction)
  const admin = await getUser(adminId);
  if (!admin || admin.role !== 'admin') {
    throw new AuthorizationError('Only admins can change user roles');
  }

  // Validate role
  const validRoles = ['member', 'moderator', 'admin'];
  if (!validRoles.includes(newRole)) {
    throw new ValidationError('Invalid role');
  }

  // Requirements 2.1, 2.2, 2.3: Update role with immediate effect
  const stmt = db.prepare(`
    UPDATE users 
    SET role = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(newRole, targetUserId);

  return getUser(targetUserId);
}

/**
 * Get user followers
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of follower users
 */
export async function getFollowers(userId) {
  const stmt = db.prepare(`
    SELECT u.* FROM users u
    INNER JOIN follows f ON u.id = f.follower_id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `);

  return stmt.all(userId);
}

/**
 * Get users that a user is following
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of following users
 */
export async function getFollowing(userId) {
  const stmt = db.prepare(`
    SELECT u.* FROM users u
    INNER JOIN follows f ON u.id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `);

  return stmt.all(userId);
}

/**
 * Check if user has an item in their inventory
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID
 * @returns {Promise<boolean>} True if user has the item
 */
async function checkUserHasItem(userId, itemId) {
  const stmt = db.prepare(`
    SELECT id FROM inventory_items
    WHERE user_id = ? AND item_id = ?
  `);

  const result = stmt.get(userId, itemId);
  return !!result;
}
