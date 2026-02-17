import db from './src/database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createComment, getPostComments } from './src/services/interactionService.js';

console.log('🧪 Testing Comment Implementation...\n');

// Create test user
const testUser = {
  id: uuidv4(),
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  nickname: `testuser${Date.now()}`,
  role: 'member'
};

db.prepare(`
  INSERT INTO users (id, email, name, nickname, role)
  VALUES (?, ?, ?, ?, ?)
`).run(testUser.id, testUser.email, testUser.name, testUser.nickname, testUser.role);

console.log('✅ Created test user:', testUser.name);

// Create test post
const testPost = {
  id: uuidv4(),
  author_id: testUser.id,
  cover_image: 'cover.jpg',
  title: 'Test Post',
  description: 'Test Description',
  content: 'Test Content',
  education_level: 'university',
  status: 'active'
};

db.prepare(`
  INSERT INTO posts (id, author_id, cover_image, title, description, content, education_level, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testPost.id,
  testPost.author_id,
  testPost.cover_image,
  testPost.title,
  testPost.description,
  testPost.content,
  testPost.education_level,
  testPost.status
);

console.log('✅ Created test post:', testPost.title);

// Test 1: Create a comment
console.log('\n📝 Test 1: Creating a comment...');
try {
  const comment = await createComment(testUser.id, testPost.id, 'This is a test comment');
  console.log('✅ Comment created successfully');
  console.log('   - Comment ID:', comment.id);
  console.log('   - Content:', comment.content);
  console.log('   - Author:', comment.author.name);
  console.log('   - Created at:', comment.createdAt);
} catch (error) {
  console.error('❌ Failed to create comment:', error.message);
}

// Test 2: Check comment counter
console.log('\n📊 Test 2: Checking comment counter...');
const post = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id);
console.log('✅ Comment count:', post.comment_count);
if (post.comment_count === 1) {
  console.log('✅ Comment counter incremented correctly');
} else {
  console.log('❌ Comment counter is incorrect. Expected 1, got', post.comment_count);
}

// Test 3: Create multiple comments
console.log('\n📝 Test 3: Creating multiple comments...');
try {
  await createComment(testUser.id, testPost.id, 'Second comment');
  await createComment(testUser.id, testPost.id, 'Third comment');
  console.log('✅ Multiple comments created');
} catch (error) {
  console.error('❌ Failed to create multiple comments:', error.message);
}

// Test 4: Get comments in chronological order
console.log('\n📋 Test 4: Getting comments in chronological order...');
try {
  const comments = await getPostComments(testPost.id);
  console.log('✅ Retrieved', comments.length, 'comments');
  
  if (comments.length === 3) {
    console.log('✅ Correct number of comments');
  } else {
    console.log('❌ Expected 3 comments, got', comments.length);
  }
  
  // Check chronological order
  let isChronological = true;
  for (let i = 1; i < comments.length; i++) {
    const prevTime = new Date(comments[i - 1].createdAt).getTime();
    const currTime = new Date(comments[i].createdAt).getTime();
    if (prevTime > currTime) {
      isChronological = false;
      break;
    }
  }
  
  if (isChronological) {
    console.log('✅ Comments are in chronological order');
  } else {
    console.log('❌ Comments are NOT in chronological order');
  }
  
  console.log('\n   Comments:');
  comments.forEach((comment, index) => {
    console.log(`   ${index + 1}. "${comment.content}" - ${comment.createdAt}`);
  });
} catch (error) {
  console.error('❌ Failed to get comments:', error.message);
}

// Test 5: Verify comment counter after multiple comments
console.log('\n📊 Test 5: Verifying final comment counter...');
const finalPost = db.prepare('SELECT comment_count FROM posts WHERE id = ?').get(testPost.id);
console.log('✅ Final comment count:', finalPost.comment_count);
if (finalPost.comment_count === 3) {
  console.log('✅ Comment counter is correct');
} else {
  console.log('❌ Comment counter is incorrect. Expected 3, got', finalPost.comment_count);
}

// Test 6: Test validation - empty content
console.log('\n🔒 Test 6: Testing validation (empty content)...');
try {
  await createComment(testUser.id, testPost.id, '   ');
  console.log('❌ Should have thrown ValidationError for empty content');
} catch (error) {
  if (error.name === 'ValidationError') {
    console.log('✅ Correctly rejected empty content');
  } else {
    console.log('❌ Wrong error type:', error.name);
  }
}

// Test 7: Test validation - non-existent post
console.log('\n🔒 Test 7: Testing validation (non-existent post)...');
try {
  await createComment(testUser.id, 'non-existent-id', 'Test comment');
  console.log('❌ Should have thrown NotFoundError for non-existent post');
} catch (error) {
  if (error.name === 'NotFoundError') {
    console.log('✅ Correctly rejected non-existent post');
  } else {
    console.log('❌ Wrong error type:', error.name);
  }
}

// Cleanup
console.log('\n🧹 Cleaning up test data...');
db.prepare('DELETE FROM comments WHERE post_id = ?').run(testPost.id);
db.prepare('DELETE FROM posts WHERE id = ?').run(testPost.id);
db.prepare('DELETE FROM users WHERE id = ?').run(testUser.id);
console.log('✅ Cleanup complete');

console.log('\n✨ All tests completed!');
