/**
 * React Query Client Configuration
 * Task 32.3: Implement caching strategies
 * 
 * Provides centralized query client configuration for data fetching and caching
 * Note: This requires @tanstack/react-query to be installed
 * Run: npm install @tanstack/react-query
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      
      // Retry failed requests 3 times
      retry: 3,
      
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Suspense mode disabled by default
      suspense: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const QueryKeys = {
  // Posts
  posts: ['posts'],
  post: (id) => ['posts', id],
  userPosts: (userId) => ['posts', 'user', userId],
  popularPosts: () => ['posts', 'popular'],
  searchPosts: (params) => ['posts', 'search', params],
  
  // User
  user: (id) => ['users', id],
  currentUser: () => ['users', 'current'],
  followers: (userId) => ['users', userId, 'followers'],
  following: (userId) => ['users', userId, 'following'],
  
  // Interactions
  likes: (postId) => ['likes', postId],
  comments: (postId) => ['comments', postId],
  bookmarks: () => ['bookmarks'],
  
  // Notifications
  notifications: () => ['notifications'],
  unreadCount: () => ['notifications', 'unread-count'],
  
  // Quests & Achievements
  quests: () => ['quests'],
  achievements: () => ['achievements'],
  userAchievements: (userId) => ['achievements', 'user', userId],
  
  // Shop
  shopItems: () => ['shop', 'items'],
  inventory: (userId) => ['shop', 'inventory', userId],
};

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  // Invalidate all post-related queries
  posts: () => queryClient.invalidateQueries({ queryKey: QueryKeys.posts }),
  
  // Invalidate specific post
  post: (id) => queryClient.invalidateQueries({ queryKey: QueryKeys.post(id) }),
  
  // Invalidate user posts
  userPosts: (userId) => queryClient.invalidateQueries({ queryKey: QueryKeys.userPosts(userId) }),
  
  // Invalidate notifications
  notifications: () => queryClient.invalidateQueries({ queryKey: QueryKeys.notifications() }),
  
  // Invalidate quests
  quests: () => queryClient.invalidateQueries({ queryKey: QueryKeys.quests() }),
  
  // Invalidate achievements
  achievements: () => queryClient.invalidateQueries({ queryKey: QueryKeys.achievements() }),
  
  // Invalidate shop
  shop: () => queryClient.invalidateQueries({ queryKey: QueryKeys.shopItems() }),
  
  // Invalidate inventory
  inventory: (userId) => queryClient.invalidateQueries({ queryKey: QueryKeys.inventory(userId) }),
};

/**
 * Prefetch helpers for better UX
 */
export const prefetchQueries = {
  // Prefetch post details
  post: async (id) => {
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.post(id),
      queryFn: () => fetch(`/api/posts/${id}`).then(res => res.json()),
    });
  },
  
  // Prefetch user profile
  user: async (id) => {
    await queryClient.prefetchQuery({
      queryKey: QueryKeys.user(id),
      queryFn: () => fetch(`/api/users/${id}`).then(res => res.json()),
    });
  },
};

export default queryClient;
