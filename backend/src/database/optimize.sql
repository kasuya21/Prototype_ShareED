-- Database Query Optimization
-- Task 32.1: Optimize database queries
-- This file contains additional indexes and optimizations for better query performance

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Likes table - optimize checking if user has liked a post
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

-- Bookmarks table - optimize bookmark lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);

-- Follows table - optimize follower/following queries
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Comments table - optimize author lookups
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Reports table - optimize reporter lookups
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);

-- Notifications table - optimize by type and created_at for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Quests table - optimize by type and completion status
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type);
CREATE INDEX IF NOT EXISTS idx_quests_is_completed ON quests(is_completed);
CREATE INDEX IF NOT EXISTS idx_quests_is_claimed ON quests(is_claimed);

-- User achievements table - optimize by achievement_id
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_is_unlocked ON user_achievements(is_unlocked);

-- Inventory items table - optimize by item_id and active status
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_id ON inventory_items(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Posts: Optimize popular posts query (status + like_count + created_at)
CREATE INDEX IF NOT EXISTS idx_posts_status_like_count ON posts(status, like_count, created_at);

-- Posts: Optimize search by status and education level
CREATE INDEX IF NOT EXISTS idx_posts_status_education ON posts(status, education_level);

-- Posts: Optimize view count sorting
CREATE INDEX IF NOT EXISTS idx_posts_status_view_count ON posts(status, view_count, created_at);

-- Posts: Optimize author posts query
CREATE INDEX IF NOT EXISTS idx_posts_author_status ON posts(author_id, status, created_at);

-- Notifications: Optimize unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);

-- Quests: Optimize active quests query
CREATE INDEX IF NOT EXISTS idx_quests_user_expires_completed ON quests(user_id, expires_at, is_completed);

-- User achievements: Optimize progress tracking
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked ON user_achievements(user_id, is_unlocked);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for the query planner to make better decisions
ANALYZE;
