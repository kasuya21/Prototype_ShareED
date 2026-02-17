# Notification Service Implementation

## Overview
This document describes the implementation of the Notification Service for the Knowledge Sharing Platform, completing Task 9 from the implementation plan.

## Implemented Components

### 1. Notification Service (`src/services/notificationService.js`)

Core service implementing all notification management functionality:

#### Functions Implemented:
- **createNotification(notificationData)** - Creates a new notification
  - Validates notification type against allowed types
  - Checks user existence
  - Persists notification to database
  - Returns created notification object
  - Requirements: 8.6

- **getUserNotifications(userId, unreadOnly)** - Retrieves user notifications
  - Supports filtering by unread status
  - Returns notifications in chronological order (newest first)
  - Requirements: 8.6

- **markAsRead(notificationId)** - Marks a notification as read
  - Updates read status for specific notification
  - Requirements: 8.7

- **markAllAsRead(userId)** - Marks all user notifications as read
  - Bulk update for all user notifications
  - Requirements: 8.7

- **getUnreadCount(userId)** - Returns count of unread notifications
  - Efficient count query
  - Requirements: 8.7

#### Supported Notification Types:
- `post_liked` - When someone likes a post
- `post_commented` - When someone comments on a post
- `post_status_changed` - When post status changes
- `post_reported` - When a post is reported (for moderators)
- `new_follower_post` - When a followed user creates a post
- `bookmark_removed` - When a bookmark is removed
- `achievement_unlocked` - When an achievement is unlocked

### 2. Notification Triggers (`src/services/notificationTriggers.js`)

Helper functions for triggering notifications from various events:

#### Functions Implemented:
- **notifyPostStatusChange(postId, oldStatus, newStatus)** - Requirement 8.3
  - Notifies post owner when status changes
  - Handles unactived, active, and deleted status changes

- **notifyModeratorsOfReport(postId, reportCount)** - Requirement 8.4
  - Notifies all moderators and admins when a post is reported
  - Includes report count in notification

- **notifyFollowersOfNewPost(authorId, postId, postTitle)** - Requirement 8.5
  - Notifies all followers when a user creates a new post
  - Includes post title in notification

- **notifyAchievementUnlocked(userId, achievementTitle, coinReward)** - Requirement 12.3
  - Notifies user when they unlock an achievement
  - Includes coin reward information

### 3. Integration with Existing Services

#### InteractionService Integration:
Updated `src/services/interactionService.js` to trigger notifications:

- **likePost()** - Sends notification to post owner when liked (Requirement 8.2)
  - Skips notification if user likes their own post
  - Includes liker name and post title

- **createComment()** - Sends notification to post owner when commented (Requirement 8.1)
  - Skips notification if user comments on their own post
  - Includes commenter name and post title

- **removeBookmark()** - Sends notification to user when bookmark is removed (Requirement 10.2)
  - Notifies the user who owned the bookmark
  - Includes post title

### 4. API Routes (`src/routes/notificationRoutes.js`)

RESTful endpoints for notification management:

- **GET /api/notifications** - Get all notifications for authenticated user
  - Query param: `unreadOnly=true` to filter unread only
  - Returns: Array of notification objects

- **GET /api/notifications/unread-count** - Get unread notification count
  - Returns: Count of unread notifications

- **PUT /api/notifications/:id/read** - Mark specific notification as read
  - Param: notification ID
  - Returns: Success message

- **PUT /api/notifications/read-all** - Mark all notifications as read
  - Marks all notifications for authenticated user
  - Returns: Success message

All routes require authentication via the `authenticate` middleware.

### 5. Server Integration

Updated `src/server.js` to mount notification routes:
```javascript
import notificationRoutes from './routes/notificationRoutes.js';
app.use('/api/notifications', notificationRoutes);
```

### 6. Unit Tests (`src/__tests__/notificationService.test.js`)

Comprehensive test suite covering:
- Notification creation with validation
- Retrieving all notifications
- Filtering unread notifications
- Marking individual notifications as read
- Marking all notifications as read
- Getting unread count
- Error handling for invalid inputs

## Requirements Validated

✓ **Requirement 8.1** - Comment notifications integrated in interactionService
✓ **Requirement 8.2** - Like notifications integrated in interactionService
✓ **Requirement 8.3** - Post status change notification helper created
✓ **Requirement 8.4** - Moderator alert notification helper created
✓ **Requirement 8.5** - Follower post notification helper created
✓ **Requirement 8.6** - Notification persistence implemented
✓ **Requirement 8.7** - Read status management implemented
✓ **Requirement 10.2** - Bookmark removal notification integrated

## Database Schema

The implementation uses the existing `notifications` table:
```sql
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
```

## Error Handling

All functions include proper error handling:
- **ValidationError** - For missing or invalid input
- **NotFoundError** - For non-existent resources
- Graceful degradation - Notification failures don't break core operations

## Future Integration Points

The following notification triggers are ready for integration when their respective services are implemented:

1. **Post Service** (Task 4):
   - Call `notifyFollowersOfNewPost()` when a post is created
   - Call `notifyPostStatusChange()` when post status changes

2. **Report Service** (Task 5):
   - Call `notifyModeratorsOfReport()` when a post reaches 10 reports
   - Call `notifyPostStatusChange()` when moderator changes post status

3. **Achievement Service** (Task 13):
   - Call `notifyAchievementUnlocked()` when an achievement is unlocked

## Testing

Run the verification script to validate implementation:
```bash
cd backend
node verify-notification-implementation.js
```

Run unit tests (requires dependencies):
```bash
cd backend
npm test -- notificationService.test.js
```

## API Usage Examples

### Get all notifications
```javascript
GET /api/notifications
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "user-id",
      "type": "post_liked",
      "title": "โพสต์ของคุณถูกถูกใจ",
      "message": "John ถูกใจโพสต์ \"My Post\" ของคุณ",
      "relatedId": "post-id",
      "isRead": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get unread count
```javascript
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response:
{
  "count": 5
}
```

### Mark as read
```javascript
PUT /api/notifications/:id/read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark all as read
```javascript
PUT /api/notifications/read-all
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## Completion Status

✅ **Task 9.1** - Implement Notification Service - COMPLETED
✅ **Task 9.3** - Integrate notification triggers - COMPLETED
⏭️ **Task 9.2** - Write property tests for notification system - OPTIONAL (skipped for MVP)

All required functionality has been implemented and verified.
