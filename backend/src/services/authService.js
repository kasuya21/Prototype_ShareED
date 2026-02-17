import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';

/**
 * Authentication Service
 * Handles Google OAuth 2.0 flow, session management, and user authentication
 */

// In-memory session store (in production, use Redis or database)
const sessions = new Map();

/**
 * Exchange auth code for access token with Google
 * @param {string} code - Authorization code from Google
 * @returns {Promise<string>} Access token
 */
export async function exchangeAuthCode(code) {
  const { config } = await import('../config/config.js');
  
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    code,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    redirect_uri: config.google.callbackUrl,
    grant_type: 'authorization_code'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange auth code: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get user profile from Google
 * @param {string} accessToken - Google access token
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile(accessToken) {
  const profileUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  
  const response = await fetch(profileUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile from Google');
  }

  const profile = await response.json();
  
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    picture: profile.picture
  };
}

/**
 * Create a session token for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Session token and expiry
 */
export async function createSession(userId) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  sessions.set(token, {
    userId,
    expiresAt
  });

  return {
    token,
    expiresAt
  };
}

/**
 * Validate a session token and return the user
 * @param {string} token - Session token
 * @returns {Promise<Object|null>} User object or null if invalid
 */
export async function validateSession(token) {
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }

  // Check if session has expired
  if (new Date() > new Date(session.expiresAt)) {
    sessions.delete(token);
    return null;
  }

  // Get user from database
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(session.userId);

  return user || null;
}

/**
 * Logout and invalidate session
 * @param {string} token - Session token
 * @returns {Promise<void>}
 */
export async function logout(token) {
  if (token) {
    sessions.delete(token);
  }
}

/**
 * Get OAuth redirect URL
 * @returns {string} Google OAuth URL
 */
export function getOAuthRedirectUrl() {
  const { config } = require('../config/config.js');
  
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
