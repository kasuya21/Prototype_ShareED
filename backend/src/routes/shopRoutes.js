import express from 'express';
import { 
  getAllItems, 
  purchaseItem, 
  getUserInventory, 
  activateItem 
} from '../services/shopService.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * GET /api/shop/items
 * Get all available shop items
 * Requirements: 6.1
 */
router.get('/items', apiLimiter, authenticate, async (req, res) => {
  try {
    const items = await getAllItems();
    
    res.json({
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        price: item.price,
        imageUrl: item.image_url
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch shop items'
      }
    });
  }
});

/**
 * POST /api/shop/purchase
 * Purchase an item from the shop
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.8
 */
router.post('/purchase', apiLimiter, authenticate, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    if (!itemId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required'
        }
      });
    }
    
    const result = await purchaseItem(req.user.id, itemId);
    
    res.status(201).json({
      success: true,
      message: 'Item purchased successfully',
      newCoinBalance: result.newCoinBalance,
      item: {
        id: result.item.id,
        name: result.item.name,
        type: result.item.type
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
        message: 'Failed to purchase item'
      }
    });
  }
});

/**
 * GET /api/users/:id/inventory
 * Get user's inventory
 * Requirements: 6.6
 */
router.get('/:id/inventory', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own inventory
    if (id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own inventory'
        }
      });
    }
    
    const inventory = await getUserInventory(id);
    
    res.json({
      inventory: inventory.map(item => ({
        id: item.id,
        itemId: item.item_id,
        name: item.name,
        description: item.description,
        type: item.type,
        price: item.price,
        imageUrl: item.image_url,
        isActive: item.is_active === 1,
        purchasedAt: item.purchased_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch inventory'
      }
    });
  }
});

/**
 * PUT /api/users/:id/inventory/:itemId/activate
 * Activate an item from inventory
 * Requirements: 6.6
 */
router.put('/:id/inventory/:itemId/activate', apiLimiter, authenticate, async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    // Users can only activate items in their own inventory
    if (id !== req.user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only activate items in your own inventory'
        }
      });
    }
    
    const user = await activateItem(id, itemId);
    
    res.json({
      success: true,
      message: 'Item activated successfully',
      user: {
        selectedTheme: user.selected_theme,
        selectedBadge: user.selected_badge,
        selectedFrame: user.selected_frame
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
        message: 'Failed to activate item'
      }
    });
  }
});

export default router;
