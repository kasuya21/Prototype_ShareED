/**
 * Simple in-memory cache for frequently accessed data
 * Task 32.1: Implement query caching
 * 
 * This cache helps reduce database load for frequently accessed data
 * that doesn't change often (e.g., achievements, shop items)
 */

class Cache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  /**
   * Set a value in the cache with optional TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    this.store.set(key, value);
    
    if (ttl > 0) {
      const expiresAt = Date.now() + ttl;
      this.ttls.set(key, expiresAt);
      
      // Auto-cleanup after TTL
      setTimeout(() => {
        this.delete(key);
      }, ttl);
    }
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {*} - Cached value or undefined if not found/expired
   */
  get(key) {
    // Check if expired
    if (this.ttls.has(key)) {
      const expiresAt = this.ttls.get(key);
      if (Date.now() > expiresAt) {
        this.delete(key);
        return undefined;
      }
    }
    
    return this.store.get(key);
  }

  /**
   * Check if a key exists in the cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a value from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear() {
    this.store.clear();
    this.ttls.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  stats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys())
    };
  }

  /**
   * Wrap a function with caching
   * @param {string} key - Cache key
   * @param {Function} fn - Function to execute if cache miss
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<*>} - Cached or fresh value
   */
  async wrap(key, fn, ttl = 5 * 60 * 1000) {
    // Check cache first
    if (this.has(key)) {
      return this.get(key);
    }
    
    // Execute function and cache result
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];
    
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }
}

// Create singleton instance
const cache = new Cache();

// Cache key generators for common queries
export const CacheKeys = {
  // Achievements (rarely change)
  allAchievements: () => 'achievements:all',
  userAchievements: (userId) => `achievements:user:${userId}`,
  
  // Shop items (rarely change)
  allShopItems: () => 'shop:items:all',
  userInventory: (userId) => `shop:inventory:${userId}`,
  
  // Popular posts (can be cached for short time)
  popularPosts: (limit) => `posts:popular:${limit}`,
  
  // User stats (can be cached briefly)
  userStats: (userId) => `user:stats:${userId}`,
  
  // Follower counts (can be cached briefly)
  followerCount: (userId) => `user:followers:count:${userId}`,
  followingCount: (userId) => `user:following:count:${userId}`,
};

// Cache invalidation helpers
export const CacheInvalidation = {
  // Invalidate user-related caches
  user: (userId) => {
    cache.invalidatePattern(`user:${userId}:`);
    cache.invalidatePattern(`achievements:user:${userId}`);
    cache.invalidatePattern(`shop:inventory:${userId}`);
  },
  
  // Invalidate post-related caches
  posts: () => {
    cache.invalidatePattern('posts:');
  },
  
  // Invalidate achievement caches
  achievements: () => {
    cache.delete(CacheKeys.allAchievements());
    cache.invalidatePattern('achievements:user:');
  },
  
  // Invalidate shop caches
  shop: () => {
    cache.delete(CacheKeys.allShopItems());
    cache.invalidatePattern('shop:inventory:');
  },
};

export default cache;
