/**
 * Verification script for achievement tracking integration
 * This script verifies that checkAndUnlockAchievements is called in the right places
 */

import { readFileSync } from 'fs';

const files = [
  'src/services/postService.js',
  'src/services/interactionService.js',
  'src/services/followService.js'
];

console.log('Verifying achievement tracking integration...\n');

let allPassed = true;

for (const file of files) {
  console.log(`Checking ${file}...`);
  const content = readFileSync(file, 'utf-8');
  
  // Check if checkAndUnlockAchievements is imported
  const hasImport = content.includes('import { checkAndUnlockAchievements }') || 
                    content.includes('checkAndUnlockAchievements');
  
  // Check if checkAndUnlockAchievements is called
  const hasCalls = content.match(/await checkAndUnlockAchievements\(/g);
  
  if (!hasImport) {
    console.log(`  ❌ Missing import for checkAndUnlockAchievements`);
    allPassed = false;
  } else {
    console.log(`  ✓ Import found`);
  }
  
  if (!hasCalls || hasCalls.length === 0) {
    console.log(`  ❌ No calls to checkAndUnlockAchievements found`);
    allPassed = false;
  } else {
    console.log(`  ✓ Found ${hasCalls.length} call(s) to checkAndUnlockAchievements`);
  }
  
  console.log('');
}

// Verify specific integration points
console.log('Verifying specific integration points...\n');

// Post Service - after createPost
const postService = readFileSync('src/services/postService.js', 'utf-8');
if (postService.includes('await checkAndUnlockAchievements(userId)') && 
    postService.includes('// Requirement 12.1, 12.5')) {
  console.log('✓ Post Service: Achievement tracking after post creation');
} else {
  console.log('❌ Post Service: Missing achievement tracking after post creation');
  allPassed = false;
}

// Interaction Service - after createComment
const interactionService = readFileSync('src/services/interactionService.js', 'utf-8');
const commentSection = interactionService.substring(
  interactionService.indexOf('export async function createComment'),
  interactionService.indexOf('export async function getPostComments')
);
if (commentSection.includes('await checkAndUnlockAchievements(userId)')) {
  console.log('✓ Interaction Service: Achievement tracking after comment creation');
} else {
  console.log('❌ Interaction Service: Missing achievement tracking after comment creation');
  allPassed = false;
}

// Interaction Service - after likePost
const likeSection = interactionService.substring(
  interactionService.indexOf('export async function likePost'),
  interactionService.indexOf('export async function unlikePost')
);
if (likeSection.includes('await checkAndUnlockAchievements(userId)')) {
  console.log('✓ Interaction Service: Achievement tracking after like action');
} else {
  console.log('❌ Interaction Service: Missing achievement tracking after like action');
  allPassed = false;
}

// Follow Service - after followUser
const followService = readFileSync('src/services/followService.js', 'utf-8');
const followSection = followService.substring(
  followService.indexOf('export async function followUser'),
  followService.indexOf('export async function unfollowUser')
);
if (followSection.includes('await checkAndUnlockAchievements(followingId)')) {
  console.log('✓ Follow Service: Achievement tracking after follow action');
} else {
  console.log('❌ Follow Service: Missing achievement tracking after follow action');
  allPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All verifications passed!');
  console.log('Achievement tracking is properly integrated.');
  process.exit(0);
} else {
  console.log('❌ Some verifications failed!');
  console.log('Please review the integration.');
  process.exit(1);
}
