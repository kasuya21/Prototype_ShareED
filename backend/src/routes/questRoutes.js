import express from 'express';
import { 
  generateDailyQuests, 
  getUserQuests, 
  claimQuestReward 
} from '../services/questService.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * GET /api/quests
 * Get user's quests (generates new ones if needed)
 * Requirements: 11.1, 11.2
 */
router.get('/', apiLimiter, authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get existing quests
    let quests = await getUserQuests(userId);
    
    // Filter active quests (not expired)
    const activeQuests = quests.filter(q => new Date(q.expires_at) > new Date());
    
    // If no active quests, generate new ones
    if (activeQuests.length === 0) {
      quests = await generateDailyQuests(userId);
    } else {
      quests = activeQuests;
    }
    
    res.json({
      quests: quests.map(quest => ({
        id: quest.id,
        type: quest.type,
        title: quest.title,
        description: quest.description,
        targetAmount: quest.target_amount,
        currentAmount: quest.current_amount,
        reward: quest.reward,
        isCompleted: quest.is_completed === 1,
        isClaimed: quest.is_claimed === 1,
        expiresAt: quest.expires_at,
        createdAt: quest.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch quests'
      }
    });
  }
});

/**
 * POST /api/quests/:id/claim
 * Claim quest reward
 * Requirements: 11.3, 11.4, 11.5, 11.7
 */
router.post('/:id/claim', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await claimQuestReward(userId, id);
    
    res.json({
      success: true,
      message: 'Quest reward claimed successfully',
      coinsAwarded: result.coinsAwarded,
      newCoinBalance: result.newCoinBalance
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
        message: 'Failed to claim quest reward'
      }
    });
  }
});

export default router;
