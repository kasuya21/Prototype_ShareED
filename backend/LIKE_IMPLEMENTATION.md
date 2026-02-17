# Like Functionality Implementation

## Overview

This document describes the implementation of the Like functionality for the Knowledge Sharing Platform, completing **Task 7.1** from the implementation plan.

## Requirements Implemented

- **Requirement 14.1**: When a user likes a post, the system increments the post like count by 1
- **Requirement 14.2**: When a user unlikes a post, the system decrements the post like count by 1
- **Requirement 14.3**: When a user attempts to like the same post again, the system treats it as unlike (toggle behavior)

## Implementation Details

### 1. Service Layer (`backend/src/services/interactionService.js`)

#### Functions Implemented:

**`likePost(userId, postId)`**
- Validates input parameters
- Checks if post exists
- Implements toggle behavior: if already liked, calls `unlikePost`
- Creates like record and increments counter atomically using database transaction
- Requirements: 14.1, 14.3

**`unlikePost(userId, postId)`**
- Validates input parameters
- Checks if like exists
- Removes like record and decrements counter atomically using database transaction
- Ensures counter doesn't go below 0
- Silently ignores if post not liked
- Requirements: 14.2

**`hasUserLiked(userId, postId)`**
- Checks if a user has liked a specific post
- Returns boolean value
- Used for UI state management
- Requirements: 14.3

**`getPostLikes(postId)`**
- Retrieves all users who liked a post
- Returns user information with like timestamps
- Ordered by most recent likes first

### 2. Key Implementation Features

#### Transaction Safety
All like/unlike operations use database transactions to ensure atomicity:
```javascript
const transaction = db.transaction(() => {
  // Insert/delete like record
  // Update like counter
});
transaction();
```

This prevents race conditions and ensures data consistency.

#### Toggle Behavior (Requirement 14.3)
When a user likes a post they've already liked:
```javascript
if (existingLike) {
  return unlikePost(userId, postId);
}
```

#### Counter Protection
The unlike operation ensures the counter never goes below zero:
```sql
UPDATE posts SET like_count = MAX(0, like_count - 1) WHERE id = ?
```

#### Error Handling
- `ValidationError`: Missing required parameters
- `NotFoundError`: Post doesn't exist
- Graceful handling of edge cases (unliking non-liked posts)

### 3. API Routes (`backend/src/routes/interactionRoutes.js`)

#### Endpoints:

**POST `/api/posts/:postId/like`**
- Toggles like status (like if not liked, unlike if already liked)
- Requires authentication
- Returns success message

**DELETE `/api/posts/:postId/like`**
- Explicitly unlikes a post
- Requires authentication
- Returns success message

**GET `/api/posts/:postId/like/status`**
- Checks if current user has liked the post
- Requires authentication
- Returns `{ liked: boolean }`

**GET `/api/posts/:postId/likes`**
- Gets list of all users who liked the post
- Public endpoint (no authentication required)
- Returns array of user objects with timestamps

### 4. Database Schema

The implementation uses the existing `likes` table:
```sql
CREATE TABLE likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE(user_id, post_id)
);
```

The `UNIQUE(user_id, post_id)` constraint prevents duplicate likes at the database level.

### 5. Testing

#### Unit Tests (`backend/src/__tests__/interactionService.test.js`)

Test coverage includes:

**likePost tests:**
- ✓ Successfully like a post
- ✓ Increment like counter by 1
- ✓ Toggle to unlike if already liked (Req 14.3)
- ✓ Throw NotFoundError for non-existent post
- ✓ Throw ValidationError for missing parameters

**unlikePost tests:**
- ✓ Successfully unlike a post
- ✓ Decrement like counter by 1
- ✓ Not decrement below 0
- ✓ Silently ignore if not liked
- ✓ Throw ValidationError for missing parameters

**hasUserLiked tests:**
- ✓ Return true if user has liked
- ✓ Return false if user has not liked
- ✓ Handle missing parameters gracefully

**Property 54 test:**
- ✓ Liking then unliking returns like count to original value

#### Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run only interaction service tests
npm test -- interactionService.test.js
```

## Integration

The like functionality is integrated into the main server:

```javascript
// backend/src/server.js
import interactionRoutes from './routes/interactionRoutes.js';
app.use('/api/posts', interactionRoutes);
```

## Usage Examples

### Frontend Integration

```javascript
// Like a post
const response = await fetch(`/api/posts/${postId}/like`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Check if user liked a post
const status = await fetch(`/api/posts/${postId}/like/status`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { liked } = await status.json();

// Get all likes for a post
const likes = await fetch(`/api/posts/${postId}/likes`);
const { likes: userList, count } = await likes.json();
```

## Design Properties Validated

This implementation validates the following correctness properties from the design document:

**Property 53: Like Counter Increment**
- For any post, when a user likes it, the like count increments by exactly 1

**Property 54: Like Toggle Behavior**
- For any post, liking then unliking returns the like count to its original value

## Next Steps

Task 7.1 is complete. The next tasks in the implementation plan are:

- **Task 7.2**: Write property tests for like system (optional)
- **Task 7.3**: Implement Comment functionality
- **Task 7.5**: Implement Bookmark functionality

## Notes

- All operations are atomic and transaction-safe
- The toggle behavior (Req 14.3) provides a better UX than throwing errors
- Counter protection prevents negative values
- The implementation follows the service-route-test pattern established in the codebase
- Error handling is consistent with existing error utilities
