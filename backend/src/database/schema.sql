-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT UNIQUE,
    profile_picture TEXT,
    bio TEXT,
    education_level TEXT CHECK(education_level IN ('junior_high', 'senior_high', 'university')),
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member', 'moderator', 'admin')),
    coins INTEGER NOT NULL DEFAULT 0,
    selected_theme TEXT,
    selected_badge TEXT,
    selected_frame TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    education_level TEXT NOT NULL CHECK(education_level IN ('junior_high', 'senior_high', 'university')),
    tags TEXT NOT NULL DEFAULT '[]',
    content_images TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'unactived', 'deleted')),
    like_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    UNIQUE(reporter_id, post_id)
);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE(user_id, post_id)
);

-- Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE(user_id, post_id)
);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (following_id) REFERENCES users(id),
    UNIQUE(follower_id, following_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('post_liked', 'post_commented', 'post_status_changed', 'post_reported', 'new_follower_post', 'bookmark_removed', 'achievement_unlocked')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Quests Table
CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('create_post', 'comment_post', 'like_post')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER NOT NULL DEFAULT 0,
    reward INTEGER NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    is_claimed INTEGER NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_image_url TEXT NOT NULL,
    coin_reward INTEGER NOT NULL,
    criteria TEXT NOT NULL
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    current_progress INTEGER NOT NULL DEFAULT 0,
    is_unlocked INTEGER NOT NULL DEFAULT 0,
    unlocked_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
);

-- Shop Items Table
CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('theme', 'frame', 'badge')),
    price INTEGER NOT NULL,
    image_url TEXT NOT NULL
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES shop_items(id),
    UNIQUE(user_id, item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_education_level ON posts(education_level);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_quests_user_id_expires_at ON quests(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
