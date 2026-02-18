# Achievement Tracking Integration

## Overview

This document describes the integration of automatic achievement tracking throughout the Knowledge Sharing Platform. The integration ensures that achievements are automatically checked and unlocked when users perform relevant actions.

## Requirements

- **Requirement 12.1**: Automatically unlock achievements when criteria are met
- **Requirement 12.5**: Track progress toward achievements continuously

## Integration Points

### 1. Post Service (`src/services/postService.js`)

**Integration Point**: After successful post creation in `createPost()`

**Trigger**: When a user creates a new post

**Achievement Types Affected**:
- `posts_created`: Tracks the number of posts a user has created

**Implementation**:
```javascript
// After post creation and quest progress update
try {
  await checkAndUnlockAchievements(userId);
} catch (error) {
  console.error('Failed to check achievements:', error);
}
```

**Why**: Creating posts is a key achievement criterion. Users can unlock achievements based on the number of posts they've created.

---

### 2. Interaction Service - Comments (`src/services/interactionService.js`)

**Integration Point**: After successful comment creation in `createComment()`

**Trigger**: When a user comments on a post

**Achievement Types Affected**:
- `comments_made`: Tracks the number of comments a user has made
- `posts_read`: Indirectly tracked (commenting implies reading)

**Implementation**:
```javascript
// After comment creation and quest progress update
try {
  await checkAndUnlockAchievements(userId);
} catch (error) {
  console.error('Failed to check achievements:', error);
}
```

**Why**: Commenting is an engagement metric that contributes to achievement progress.

---

### 3. Interaction Service - Likes (`src/services/interactionService.js`)

**Integration Point**: After successful like action in `likePost()`

**Trigger**: When a user likes a post

**Achievement Types Affected**:
- `likes_given`: Tracks the number of likes a user has given
- `posts_read`: Indirectly tracked (liking implies reading)

**Implementation**:
```javascript
// After like action and quest progress update
try {
  await checkAndUnlockAchievements(userId);
} catch (error) {
  console.error('Failed to check achievements:', error);
}
```

**Why**: Liking posts demonstrates engagement and contributes to achievement criteria.

---

### 4. Follow Service (`src/services/followService.js`)

**Integration Point**: After successful follow action in `followUser()`

**Trigger**: When a user follows another user

**Achievement Types Affected**:
- `followers_gained`: Tracks the number of followers a user has gained

**Implementation**:
```javascript
// After follow relationship creation
// Check achievements for the user who GAINED a follower (followingId)
try {
  await checkAndUnlockAchievements(followingId);
} catch (error) {
  console.error('Failed to check achievements:', error);
}
```

**Why**: Gaining followers is a social achievement criterion. Note that we check achievements for the user being followed (`followingId`), not the follower.

---

## Achievement Service

The `checkAndUnlockAchievements()` function in `src/services/achievementService.js` handles:

1. **Progress Tracking**: Calculates current progress for all achievement types
2. **Automatic Unlocking**: Unlocks achievements when criteria are met
3. **Reward Distribution**: Awards coins and badges immediately upon unlock
4. **Notifications**: Sends notifications to users when achievements are unlocked

### Achievement Types

The system tracks five types of achievements:

1. **posts_created**: Number of posts created by the user
2. **posts_read**: Number of unique posts the user has interacted with (liked, commented, or bookmarked)
3. **comments_made**: Number of comments the user has made
4. **likes_given**: Number of likes the user has given
5. **followers_gained**: Number of followers the user has gained

### Progress Calculation

Progress is calculated by querying the database for actual user actions:

```javascript
// Example: posts_created
const postsCreated = db.prepare(`
  SELECT COUNT(*) as count FROM posts
  WHERE author_id = ? AND status != 'deleted'
`).get(userId).count;
```

## Error Handling

All achievement tracking calls are wrapped in try-catch blocks to ensure that:

1. **Non-blocking**: Achievement tracking failures don't prevent the main action from succeeding
2. **Logged**: Errors are logged for debugging purposes
3. **Graceful**: The system continues to function even if achievement tracking fails

Example:
```javascript
try {
  await checkAndUnlockAchievements(userId);
} catch (error) {
  console.error('Failed to check achievements:', error);
}
```

## Testing

### Verification Script

Run the verification script to ensure all integration points are properly implemented:

```bash
node verify-achievement-integration.js
```

This script checks:
- Proper imports of `checkAndUnlockAchievements`
- Correct placement of achievement tracking calls
- All four integration points (post, comment, like, follow)

### Manual Testing

To manually test achievement tracking:

1. Create a user account
2. Perform actions (create posts, comment, like, follow)
3. Check user achievements via the API: `GET /api/users/:id/achievements`
4. Verify that progress is updated and achievements are unlocked when criteria are met

## Performance Considerations

1. **Asynchronous**: Achievement checking is asynchronous and doesn't block the main action
2. **Database Queries**: Progress calculation involves multiple database queries, but they are optimized with proper indexes
3. **Transaction Safety**: Achievement unlocking uses database transactions to ensure atomicity

## Future Enhancements

Potential improvements for achievement tracking:

1. **Batch Processing**: Queue achievement checks and process them in batches
2. **Caching**: Cache user statistics to reduce database queries
3. **Real-time Updates**: Use WebSockets to notify users immediately when achievements are unlocked
4. **Achievement Tiers**: Support multiple tiers for the same achievement type (Bronze, Silver, Gold)

## Related Files

- `backend/src/services/achievementService.js` - Core achievement logic
- `backend/src/services/postService.js` - Post creation integration
- `backend/src/services/interactionService.js` - Comment and like integration
- `backend/src/services/followService.js` - Follow integration
- `backend/verify-achievement-integration.js` - Verification script

## Conclusion

Achievement tracking is now fully integrated throughout the system. Every user action that contributes to achievement criteria automatically triggers progress updates and potential achievement unlocks, providing a seamless gamification experience.
