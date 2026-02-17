import express from 'express';
import { config } from '../config/config.js';
import { 
  exchangeAuthCode, 
  getUserProfile, 
  createSession, 
  logout 
} from '../services/authService.js';
import { createOrUpdateUser } from '../services/userService.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * GET /api/auth/login
 * Initiate Google OAuth login
 */
router.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  res.json({ 
    authUrl,
    message: 'Redirect user to this URL to initiate OAuth flow'
  });
});

/**
 * GET /api/auth/callback
 * Handle Google OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    // Check for OAuth errors
    if (error) {
      return res.redirect(`${config.frontend.url}/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      throw new ValidationError('Authorization code is required');
    }

    // Exchange code for access token
    const accessToken = await exchangeAuthCode(code);

    // Get user profile from Google
    const profile = await getUserProfile(accessToken);

    // Create or update user in database
    const user = await createOrUpdateUser(profile);

    // Create session token
    const session = await createSession(user.id);

    // Store token in session
    req.session.token = session.token;
    req.session.userId = user.id;

    // Redirect to frontend with success
    res.redirect(`${config.frontend.url}/auth/callback?token=${session.token}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${config.frontend.url}/login?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    await logout(req.token);
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout'
      }
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      nickname: req.user.nickname,
      profilePicture: req.user.profile_picture,
      bio: req.user.bio,
      educationLevel: req.user.education_level,
      role: req.user.role,
      coins: req.user.coins,
      selectedTheme: req.user.selected_theme,
      selectedBadge: req.user.selected_badge,
      selectedFrame: req.user.selected_frame,
      createdAt: req.user.created_at,
      updatedAt: req.user.updated_at
    }
  });
});

/**
 * POST /api/auth/verify
 * Verify session token
 */
router.post('/verify', authenticate, (req, res) => {
  res.json({ 
    valid: true,
    userId: req.user.id 
  });
});

export default router;
