# Notification Integration Guide

This document describes how notification triggers are integrated throughout the Knowledge Sharing Platform.

## Integration Status

### ✅ Completed Integrations

#### 1. Comment Notifications (Requirement 8.1)
**Location:** `backend/src/services/interactionService.js` - `createComment()` function

When a user comments on a post, the post owner receives a notification (unless commenting on their own post).

```javascript
// Integrated at line 207-220 in interactionService.js
if (post.author_id !== userId) {
  const commenter = db.prepare('SELECT name, nickname FROM users WHERE id = ?').get(userId);
  const commenterName = commenter.nickname || commenter.name;
  
  await createNotification({
    userId: post.author_id,
    type: 'post_commented',
    title: 'มีคอมเมนต์ใหม่',
    message: `${commenterName} แสดงความคิดเห็นในโพสต์ "${post.title}" ของคุณ`,
    relatedId: postId
  });
}
```

#### 2. Like Notifications (Requirement 8.2)
**Location:** `backend/src/services/interactionService.js` - `likePost()` function

When a user likes a post, the post owner receives a notification (unless liking their own post).

```javascript
// Integrated at line 56-69 in interactionService.js
if (post.author_id !== userId) {
  const liker = db.prepare('SELECT name, nickname FROM users WHERE id = ?').get(userId);
  const likerName = liker.nickname || liker.name;
  
  await createNotification({
    userId: post.author_id,
    type: 'post_liked',
    title: 'โพสต์ของคุณถูกถูกใจ',
    message: `${likerName} ถูกใจโพสต์ "${post.title}" ของคุณ`,
    relatedId: postId
  });
}
```

#### 3. Bookmark Removal Notifications (Requirement 10.2)
**Location:** `backend/src/services/interactionService.js` - `removeBookmark()` function

When a user removes a bookmark, they receive a notification.

```javascript
// Integrated at line 330-343 in interactionService.js
const post = db.prepare('SELECT title FROM posts WHERE id = ?').get(postId);

await createNotification({
  userId: userId,
  type: 'bookmark_removed',
  title: 'บุ๊กมาร์กถูกลบ',
  message: `บุ๊กมาร์กของโพสต์ "${post?.title || 'ไม่ทราบชื่อ'}" ถูกลบแล้ว`,
  relatedId: postId
});
```

### 🔄 Ready for Integration (Pending Service Implementation)

The following notification triggers are implemented in `backend/src/services/notificationTriggers.js` and ready to be integrated once the corresponding services are created:

#### 4. Post Status Change Notifications (Requirement 8.3)
**Trigger Function:** `notifyPostStatusChange(postId, oldStatus, newStatus)`

**When to call:** After changing a post's status (active → unactived, unactived → active, etc.)

**Integration Example for Post Service:**
```javascript
// In postService.js - updatePostStatus() or moderatorDeletePost()
import { notifyPostStatusChange } from './notificationTriggers.js';

export async function updatePostStatus(postId, newStatus) {
  const post = db.prepare('SELECT status FROM posts WHERE id = ?').get(postId);
  const oldStatus = post.status;
  
  // Update status
  db.prepare('UPDATE posts SET status = ? WHERE id = ?').run(newStatus, postId);
  
  // Trigger notification
  await notifyPostStatusChange(postId, oldStatus, newStatus);
}
```

#### 5. Moderator Alert Notifications (Requirement 8.4)
**Trigger Function:** `notifyModeratorsOfReport(postId, reportCount)`

**When to call:** When a post reaches 10 reports and is automatically deactivated

**Integration Example for Report Service:**
```javascript
// In reportService.js - reportPost()
import { notifyModeratorsOfReport } from './notificationTriggers.js';

export async function reportPost(userId, postId, reason) {
  // ... create report ...
  
  // Count reports
  const reportCount = db.prepare(
    'SELECT COUNT(*) as count FROM reports WHERE post_id = ?'
  ).get(postId).count;
  
  // If 10 reports, deactivate and notify moderators
  if (reportCount >= 10) {
    db.prepare('UPDATE posts SET status = ? WHERE id = ?').run('unactived', postId);
    await notifyModeratorsOfReport(postId, reportCount);
  }
}
```

#### 6. Follower Post Notifications (Requirement 8.5)
**Trigger Function:** `notifyFollowersOfNewPost(authorId, postId, postTitle)`

**When to call:** After a user successfully creates a new post

**Integration Example for Post Service:**
```javascript
// In postService.js - createPost()
import { notifyFollowersOfNewPost } from './notificationTriggers.js';

export async function createPost(userId, postData) {
  // ... create post ...
  const postId = uuidv4();
  
  db.prepare(`
    INSERT INTO posts (id, author_id, title, ...)
    VALUES (?, ?, ?, ...)
  `).run(postId, userId, postData.title, ...);
  
  // Notify followers
  await notifyFollowersOfNewPost(userId, postId, postData.title);
  
  return postId;
}
```

## Notification Types

All notification types are defined in the system:

| Type | Description | Requirement |
|------|-------------|-------------|
| `post_commented` | Someone commented on user's post | 8.1 |
| `post_liked` | Someone liked user's post | 8.2 |
| `post_status_changed` | Post status changed (deactivated/restored/deleted) | 8.3 |
| `post_reported` | Post reached 10 reports (moderators only) | 8.4 |
| `new_follower_post` | Someone user follows created a new post | 8.5 |
| `bookmark_removed` | User removed a bookmark | 10.2 |
| `achievement_unlocked` | User unlocked an achievement | 12.3 |

## Error Handling

All notification triggers follow this pattern:
- Wrapped in try-catch blocks
- Errors are logged but don't fail the main operation
- Notifications are "fire and forget" - they shouldn't block user actions

```javascript
try {
  await createNotification({...});
} catch (error) {
  console.error('Failed to create notification:', error);
  // Don't throw - notification failure shouldn't fail the main operation
}
```

## Testing Notifications

When testing services that trigger notifications:

1. **Unit Tests:** Mock the notification service
2. **Integration Tests:** Verify notifications are created in the database
3. **Property Tests:** Verify notification properties hold across all inputs

Example test:
```javascript
test('liking a post creates notification for post owner', async () => {
  const postOwner = await createTestUser();
  const liker = await createTestUser();
  const post = await createTestPost(postOwner.id);
  
  await likePost(liker.id, post.id);
  
  const notifications = await getUserNotifications(postOwner.id);
  expect(notifications).toHaveLength(1);
  expect(notifications[0].type).toBe('post_liked');
  expect(notifications[0].relatedId).toBe(post.id);
});
```

## Future Integrations

When implementing new services that should trigger notifications:

1. Check if a trigger function exists in `notificationTriggers.js`
2. If not, create a new trigger function following the existing pattern
3. Import and call the trigger after the main operation completes
4. Wrap in try-catch to prevent notification failures from affecting the main operation
5. Update this guide with the integration details

## Verification Checklist

- [x] Comment notifications working
- [x] Like notifications working
- [x] Bookmark removal notifications working
- [ ] Post status change notifications (pending post service)
- [ ] Moderator alert notifications (pending report service)
- [ ] Follower post notifications (pending post service)
- [ ] Achievement unlock notifications (pending achievement service)
