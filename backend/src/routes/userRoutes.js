import express from 'express';
import { 
  getUser, 
  getAllUsers,
  updateProfile, 
  changeRole, 
  getFollowers, 
  getFollowing 
} from '../services/userService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', apiLimiter, authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await getAllUsers();
    
    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        profile_picture: user.profile_picture,
        bio: user.bio,
        education_level: user.education_level,
        role: user.role,
        coins: user.coins,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch users'
      }
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await getUser(id);
    
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        profilePicture: user.profile_picture,
        bio: user.bio,
        educationLevel: user.education_level,
        role: user.role,
        coins: user.coins,
        selectedTheme: user.selected_theme,
        selectedBadge: user.selected_badge,
        selectedFrame: user.selected_frame,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch user'
      }
    });
  }
});

/**
 * PUT /api/users/:id/profile
 * Update user profile
 */
router.put('/:id/profile', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user is updating their own profile
    if (req.user.id !== id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own profile'
        }
      });
    }
    
    const updates = {
      nickname: req.body.nickname,
      profile_picture: req.body.profilePicture,
      bio: req.body.bio,
      education_level: req.body.educationLevel,
      selected_theme: req.body.selectedTheme,
      selected_badge: req.body.selectedBadge,
      selected_frame: req.body.selectedFrame
    };
    
    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });
    
    const user = await updateProfile(id, updates);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        profilePicture: user.profile_picture,
        bio: user.bio,
        educationLevel: user.education_level,
        role: user.role,
        coins: user.coins,
        selectedTheme: user.selected_theme,
        selectedBadge: user.selected_badge,
        selectedFrame: user.selected_frame,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update profile'
      }
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Change user role (Admin only)
 */
router.put('/:id/role', apiLimiter, authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role is required'
        }
      });
    }
    
    const user = await changeRole(req.user.id, id, role);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: error.message
        }
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to change role'
      }
    });
  }
});

/**
 * GET /api/users/:id/followers
 * Get user followers
 */
router.get('/:id/followers', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const followers = await getFollowers(id);
    
    res.json({
      followers: followers.map(user => ({
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        profilePicture: user.profile_picture,
        bio: user.bio,
        educationLevel: user.education_level
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch followers'
      }
    });
  }
});

/**
 * GET /api/users/:id/following
 * Get users that a user is following
 */
router.get('/:id/following', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const following = await getFollowing(id);
    
    res.json({
      following: following.map(user => ({
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        profilePicture: user.profile_picture,
        bio: user.bio,
        educationLevel: user.education_level
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch following'
      }
    });
  }
});

export default router;
