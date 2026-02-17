/**
 * Quest Integration Verification Script
 * Verifies that quest progress tracking is integrated with:
 * - Post creation
 * - Comment creation  
 * - Like actions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Quest Integration...\n');

// Check 1: Post Service Integration
console.log('1️⃣ Checking Post Service Integration...');
const postServicePath = path.join(__dirname, 'src/services/postService.js');
const postServiceContent = fs.readFileSync(postServicePath, 'utf-8');

const hasPostImport = postServiceContent.includes("import { updateQuestProgress } from './questService.js'");
const hasPostTracking = postServiceContent.includes("await updateQuestProgress(userId, 'create_post', 1)");

if (hasPostImport && hasPostTracking) {
  console.log('   ✅ Post creation quest tracking is integrated');
  console.log('   - Import statement found');
  console.log('   - Quest progress update call found in createPost function');
} else {
  console.log('   ❌ Post creation quest tracking is NOT properly integrated');
  if (!hasPostImport) console.log('   - Missing import statement');
  if (!hasPostTracking) console.log('   - Missing quest progress update call');
}

// Check 2: Interaction Service - Comment Integration
console.log('\n2️⃣ Checking Comment Integration...');
const interactionServicePath = path.join(__dirname, 'src/services/interactionService.js');
const interactionServiceContent = fs.readFileSync(interactionServicePath, 'utf-8');

const hasCommentImport = interactionServiceContent.includes("import { updateQuestProgress } from './questService.js'");
const hasCommentTracking = interactionServiceContent.includes("await updateQuestProgress(userId, 'comment_post', 1)");

if (hasCommentImport && hasCommentTracking) {
  console.log('   ✅ Comment creation quest tracking is integrated');
  console.log('   - Import statement found');
  console.log('   - Quest progress update call found in createComment function');
} else {
  console.log('   ❌ Comment creation quest tracking is NOT properly integrated');
  if (!hasCommentImport) console.log('   - Missing import statement');
  if (!hasCommentTracking) console.log('   - Missing quest progress update call');
}

// Check 3: Interaction Service - Like Integration
console.log('\n3️⃣ Checking Like Integration...');
const hasLikeTracking = interactionServiceContent.includes("await updateQuestProgress(userId, 'like_post', 1)");

if (hasLikeTracking) {
  console.log('   ✅ Like action quest tracking is integrated');
  console.log('   - Quest progress update call found in likePost function');
} else {
  console.log('   ❌ Like action quest tracking is NOT properly integrated');
  console.log('   - Missing quest progress update call');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 INTEGRATION SUMMARY');
console.log('='.repeat(60));

const allIntegrated = hasPostImport && hasPostTracking && 
                      hasCommentImport && hasCommentTracking && 
                      hasLikeTracking;

if (allIntegrated) {
  console.log('✅ All quest progress tracking integrations are complete!');
  console.log('\nIntegrated actions:');
  console.log('  • Post creation → updates "create_post" quest');
  console.log('  • Comment creation → updates "comment_post" quest');
  console.log('  • Like action → updates "like_post" quest');
  console.log('\n✨ Task 12.3 is successfully implemented!');
} else {
  console.log('❌ Some integrations are missing. Please review the checks above.');
}

console.log('='.repeat(60) + '\n');
