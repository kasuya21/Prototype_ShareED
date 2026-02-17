# Quest Integration Notes

## Quest Progress Tracking Integration

Quest progress tracking has been integrated into the following services:

### ✅ Completed Integrations

1. **Like Actions** (`interactionService.js`)
   - Quest type: `like_post`
   - Triggered in: `likePost()` function
   - Updates quest progress when a user likes a post

2. **Comment Actions** (`interactionService.js`)
   - Quest type: `comment_post`
   - Triggered in: `createComment()` function
   - Updates quest progress when a user creates a comment

### ⚠️ Pending Integration

3. **Post Creation** (Post Service - Not Yet Implemented)
   - Quest type: `create_post`
   - **TODO**: When implementing the Post Service's `createPost()` function, add the following code after successful post creation:
   
   ```javascript
   import { updateQuestProgress } from './questService.js';
   
   // After post is created successfully
   try {
     await updateQuestProgress(userId, 'create_post', 1);
   } catch (error) {
     console.error('Failed to update quest progress:', error);
   }
   ```

## Quest Service Functions

The Quest Service (`questService.js`) provides the following functions:

- `generateDailyQuests(userId)` - Generate daily quests for a user
- `getUserQuests(userId)` - Get all quests for a user
- `updateQuestProgress(userId, questType, amount)` - Update progress for a quest type
- `claimQuestReward(userId, questId)` - Claim rewards for a completed quest
- `resetDailyQuests()` - Reset expired quests (scheduled task)

## Quest Types

- `create_post` - Create a new post (target: 1, reward: 50 coins)
- `comment_post` - Comment on posts (target: 3, reward: 30 coins)
- `like_post` - Like posts (target: 5, reward: 20 coins)

## Requirements Satisfied

- Requirement 11.2: Quest progress tracking integrated with user actions
- Quest updates are non-blocking (errors are logged but don't fail the main operation)
- Progress is automatically tracked when users perform relevant actions
