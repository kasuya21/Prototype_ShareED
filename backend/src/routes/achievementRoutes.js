import express from 'express';
import { 
  getAllAchievements, 
  getUserAchievements 
} from '../services/achievementService.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/achievements
 * Get all achievements
 * Requirements: 12.6
 */
router.get('/', apiLimiter, authenticate, async (req, res) => {
  try {
    const achievements = await getAllAchievements();
    
    res.json({
      achievements: achievements.map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        badgeImageUrl: achievement.badge_image_url,
        coinReward: achievement.coin_reward,
        criteria: JSON.parse(achievement.criteria)
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch achievements'
      }
    });
  }
});

/**
 * GET /api/users/:id/achievements
 * Get user's achievements (both locked and unlocked)
 * Requirements: 12.6
 */
router.get('/:id/achievements', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userAchievements = await getUserAchievements(id);
    
    res.json({
      achievements: userAchievements.map(ua => ({
        achievementId: ua.achievement_id,
        title: ua.title,
        description: ua.description,
        badgeImageUrl: ua.badge_image_url,
        coinReward: ua.coin_reward,
        criteria: JSON.parse(ua.criteria),
        currentProgress: ua.current_progress,
        isUnlocked: ua.is_unlocked === 1,
        unlockedAt: ua.unlocked_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch user achievements'
      }
    });
  }
});

export default router;
