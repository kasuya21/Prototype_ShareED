import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createPost } from '../services/postService.js';
import { likePost, createComment } from '../services/interactionService.js';
import { generateDailyQuests, getUserQuests } from '../services/questService.js';

/**
 * Quest Integration Tests
 * Tests that quest progress is updated when users perform actions
 * Requirement 11.2: Quest progress tracking integration
 */

describe('Quest Integration Tests', () => {
  let testUserId;
  let testUserId2;
  let testPostId;

  beforeEach(() => {
    // Create test users
    testUserId = uuidv4();
    testUserId2 = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role, coins)
      VALUES (?, ?, ?, ?, 'member', 100)
    `).run(testUserId, `test${testUserId}@example.com`, 'Test User', `testuser${testUserId.slice(0, 8)}`);

    db.prepare(`
      INSERT INTO users (id, email, name, nickname, role, coins)
      VALUES (?, ?, ?, ?, 'member', 100)
    `).run(testUserId2, `test${testUserId2}@example.com`, 'Test User 2', `testuser2${testUserId2.slice(0, 8)}`);
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM quests WHERE user_id IN (?, ?)').run(testUserId, testUserId2);
    db.prepare('DELETE FROM comments WHERE author_id IN (?, ?)').run(testUserId, testUserId2);
    db.prepare('DELETE FROM likes WHERE user_id IN (?, ?)').run(testUserId, testUserId2);
    db.prepare('DELETE FROM posts WHERE author_id IN (?, ?)').run(testUserId, testUserId2);
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(testUserId, testUserId2);
  });

  it('should update quest progress when creating a post', async () => {
    // Generate quests for user
    await generateDailyQuests(testUserId);

    // Get initial quest state
    const questsBefore = await getUserQuests(testUserId);
    const createPostQuest = questsBefore.find(q => q.type === 'create_post');
    expect(createPostQuest.current_amount).toBe(0);
    expect(createPostQuest.is_completed).toBe(0);

    // Create a post
    const post = await createPost(testUserId, {
      coverImage: 'https://example.com/cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      educationLevel: 'university',
      tags: ['test'],
      contentImages: []
    });

    testPostId = post.id;

    // Check quest progress updated
    const questsAfter = await getUserQuests(testUserId);
    const updatedQuest = questsAfter.find(q => q.type === 'create_post');
    expect(updatedQuest.current_amount).toBe(1);
    expect(updatedQuest.is_completed).toBe(1); // Target is 1, so should be completed
  });

  it('should update quest progress when creating a comment', async () => {
    // Create a post first
    const post = await createPost(testUserId, {
      coverImage: 'https://example.com/cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      educationLevel: 'university'
    });

    testPostId = post.id;

    // Generate quests for second user
    await generateDailyQuests(testUserId2);

    // Get initial quest state
    const questsBefore = await getUserQuests(testUserId2);
    const commentQuest = questsBefore.find(q => q.type === 'comment_post');
    expect(commentQuest.current_amount).toBe(0);
    expect(commentQuest.is_completed).toBe(0);

    // Create a comment
    await createComment(testUserId2, testPostId, 'Test comment');

    // Check quest progress updated
    const questsAfter = await getUserQuests(testUserId2);
    const updatedQuest = questsAfter.find(q => q.type === 'comment_post');
    expect(updatedQuest.current_amount).toBe(1);
    expect(updatedQuest.is_completed).toBe(0); // Target is 3, so not completed yet
  });

  it('should update quest progress when liking a post', async () => {
    // Create a post first
    const post = await createPost(testUserId, {
      coverImage: 'https://example.com/cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      educationLevel: 'university'
    });

    testPostId = post.id;

    // Generate quests for second user
    await generateDailyQuests(testUserId2);

    // Get initial quest state
    const questsBefore = await getUserQuests(testUserId2);
    const likeQuest = questsBefore.find(q => q.type === 'like_post');
    expect(likeQuest.current_amount).toBe(0);
    expect(likeQuest.is_completed).toBe(0);

    // Like the post
    await likePost(testUserId2, testPostId);

    // Check quest progress updated
    const questsAfter = await getUserQuests(testUserId2);
    const updatedQuest = questsAfter.find(q => q.type === 'like_post');
    expect(updatedQuest.current_amount).toBe(1);
    expect(updatedQuest.is_completed).toBe(0); // Target is 5, so not completed yet
  });

  it('should complete comment quest after 3 comments', async () => {
    // Create a post first
    const post = await createPost(testUserId, {
      coverImage: 'https://example.com/cover.jpg',
      title: 'Test Post',
      description: 'Test Description',
      content: 'Test Content',
      educationLevel: 'university'
    });

    testPostId = post.id;

    // Generate quests for second user
    await generateDailyQuests(testUserId2);

    // Create 3 comments
    await createComment(testUserId2, testPostId, 'Comment 1');
    await createComment(testUserId2, testPostId, 'Comment 2');
    await createComment(testUserId2, testPostId, 'Comment 3');

    // Check quest is completed
    const quests = await getUserQuests(testUserId2);
    const commentQuest = quests.find(q => q.type === 'comment_post');
    expect(commentQuest.current_amount).toBe(3);
    expect(commentQuest.is_completed).toBe(1);
  });

  it('should complete like quest after 5 likes', async () => {
    // Create 5 posts
    const postIds = [];
    for (let i = 0; i < 5; i++) {
      const post = await createPost(testUserId, {
        coverImage: 'https://example.com/cover.jpg',
        title: `Test Post ${i}`,
        description: 'Test Description',
        content: 'Test Content',
        educationLevel: 'university'
      });
      postIds.push(post.id);
    }

    // Generate quests for second user
    await generateDailyQuests(testUserId2);

    // Like all 5 posts
    for (const postId of postIds) {
      await likePost(testUserId2, postId);
    }

    // Check quest is completed
    const quests = await getUserQuests(testUserId2);
    const likeQuest = quests.find(q => q.type === 'like_post');
    expect(likeQuest.current_amount).toBe(5);
    expect(likeQuest.is_completed).toBe(1);
  });
});
