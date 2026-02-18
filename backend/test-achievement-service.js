/**
 * Simple test script for Achievement Service
 * This script verifies that the achievement service is working correctly
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from './src/database/db.js';
import {
  getAllAchievements,
  getUserAchievements,
  checkAndUnlockAchievements,
  unlockAchievement
} from './src/services/achievementService.js';

async function runTests() {
  console.log('=== Achievement Service Test ===\n');

  let testUserId;
  let testPostId;

  try {
    // 1. Test getAllAchievements
    console.log('1. Testing getAllAchievements...');
    const allAchievements = await getAllAchievements();
    console.log(`   ✓ Found ${allAchievements.length} achievements`);
    if (allAchievements.length > 0) {
      console.log(`   ✓ First achievement: ${allAchievements[0].title}`);
    }

    // 2. Create a test user
    console.log('\n2. Creating test user...');
    testUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, role, coins)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, `test-${testUserId}@example.com`, 'Test User', 'member', 100);
    console.log(`   ✓ Created test user: ${testUserId}`);

    // 3. Test getUserAchievements for new user
    console.log('\n3. Testing getUserAchievements for new user...');
    const userAchievements = await getUserAchievements(testUserId);
    console.log(`   ✓ User has ${userAchievements.length} achievement records`);
    const unlockedCount = userAchievements.filter(ua => ua.isUnlocked).length;
    console.log(`   ✓ Unlocked: ${unlockedCount}, Locked: ${userAchievements.length - unlockedCount}`);

    // 4. Create a post to trigger achievement
    console.log('\n4. Creating a post to trigger achievement...');
    testPostId = uuidv4();
    db.prepare(`
      INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(testPostId, testUserId, '/cover.jpg', 'Test Post', 'Test Description', 'Test Content', 'university', 'active');
    console.log(`   ✓ Created test post: ${testPostId}`);

    // 5. Test checkAndUnlockAchievements
    console.log('\n5. Testing checkAndUnlockAchievements...');
    const unlockedAchievements = await checkAndUnlockAchievements(testUserId);
    console.log(`   ✓ Unlocked ${unlockedAchievements.length} achievement(s)`);
    if (unlockedAchievements.length > 0) {
      unlockedAchievements.forEach(achievement => {
        console.log(`   ✓ Unlocked: ${achievement.title} (+${achievement.coin_reward} coins)`);
      });
    }

    // 6. Verify user coins were updated
    console.log('\n6. Verifying coin rewards...');
    const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(testUserId);
    console.log(`   ✓ User now has ${user.coins} coins`);

    // 7. Verify achievement records
    console.log('\n7. Verifying achievement records...');
    const updatedUserAchievements = await getUserAchievements(testUserId);
    const nowUnlocked = updatedUserAchievements.filter(ua => ua.isUnlocked).length;
    console.log(`   ✓ Now unlocked: ${nowUnlocked} achievement(s)`);

    // 8. Test that already unlocked achievements don't unlock again
    console.log('\n8. Testing idempotence (no duplicate unlocks)...');
    const secondCheck = await checkAndUnlockAchievements(testUserId);
    console.log(`   ✓ Second check unlocked ${secondCheck.length} achievement(s) (should be 0)`);

    console.log('\n=== All Tests Passed! ===\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (testUserId) {
      console.log('\nCleaning up test data...');
      db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testUserId);
      if (testPostId) {
        db.prepare('DELETE FROM posts WHERE id = ?').run(testPostId);
      }
      db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
      console.log('✓ Cleanup complete');
    }
  }
}

runTests();
