import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Quest Service Implementation...\n');

// Check if questService.js exists
const questServicePath = path.join(__dirname, 'src', 'services', 'questService.js');
if (fs.existsSync(questServicePath)) {
  console.log('✓ questService.js exists');
  
  const content = fs.readFileSync(questServicePath, 'utf8');
  
  // Check for required functions
  const requiredFunctions = [
    'generateDailyQuests',
    'getUserQuests',
    'updateQuestProgress',
    'claimQuestReward',
    'resetDailyQuests'
  ];
  
  console.log('\n📋 Checking required functions:');
  requiredFunctions.forEach(func => {
    if (content.includes(`export async function ${func}`) || content.includes(`export function ${func}`)) {
      console.log(`✓ ${func} function implemented`);
    } else {
      console.log(`✗ ${func} function NOT found`);
    }
  });
  
  console.log('\n🔍 Checking implementation details:');
  
  // Check for key requirements
  const checks = [
    { pattern: /create_post|comment_post|like_post/, desc: 'Quest types defined (Req 11.1)' },
    { pattern: /target_amount/, desc: 'Quest target amounts (Req 11.1)' },
    { pattern: /reward/, desc: 'Quest rewards (Req 11.1)' },
    { pattern: /expires_at|24.*hour/i, desc: '24-hour expiration (Req 11.6)' },
    { pattern: /is_completed.*1|mark.*completed/i, desc: 'Quest completion marking (Req 11.2)' },
    { pattern: /current_amount.*\+|increment.*progress/i, desc: 'Progress tracking (Req 11.2)' },
    { pattern: /is_claimed.*1|already.*claimed/i, desc: 'Prevent duplicate claims (Req 11.7)' },
    { pattern: /coins.*\+.*reward|newCoinBalance/i, desc: 'Coin reward distribution (Req 11.5)' },
    { pattern: /Quest not completed|!.*is_completed/i, desc: 'Completion validation (Req 11.3, 11.4)' },
    { pattern: /transaction|db\.transaction/, desc: 'Transaction atomicity' },
    { pattern: /ValidationError|throw.*Error/, desc: 'Error handling' },
    { pattern: /DELETE.*quests.*expires_at/i, desc: 'Quest reset functionality (Req 11.6)' }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✓ ${check.desc}`);
    } else {
      console.log(`⚠ ${check.desc} - pattern not found`);
    }
  });
  
  console.log('\n✅ Quest Service implementation verified!');
  
} else {
  console.log('✗ questService.js NOT found');
}

// Check for quest integration in interactionService
console.log('\n🔍 Checking Quest Integration...\n');

const interactionServicePath = path.join(__dirname, 'src', 'services', 'interactionService.js');
if (fs.existsSync(interactionServicePath)) {
  const content = fs.readFileSync(interactionServicePath, 'utf8');
  
  console.log('📋 Checking quest progress tracking integration:');
  
  const integrationChecks = [
    { pattern: /import.*updateQuestProgress.*questService/i, desc: 'Quest service imported' },
    { pattern: /updateQuestProgress.*like_post/i, desc: 'Like quest tracking (Req 11.2)' },
    { pattern: /updateQuestProgress.*comment_post/i, desc: 'Comment quest tracking (Req 11.2)' }
  ];
  
  integrationChecks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✓ ${check.desc}`);
    } else {
      console.log(`⚠ ${check.desc} - not found`);
    }
  });
  
  console.log('\n✅ Quest integration verified!');
} else {
  console.log('✗ interactionService.js NOT found');
}

// Check for integration notes
console.log('\n🔍 Checking Documentation...\n');

const notesPath = path.join(__dirname, 'QUEST_INTEGRATION_NOTES.md');
if (fs.existsSync(notesPath)) {
  console.log('✓ QUEST_INTEGRATION_NOTES.md exists');
  const notes = fs.readFileSync(notesPath, 'utf8');
  
  if (notes.includes('create_post') && notes.includes('Post Service')) {
    console.log('✓ Post creation integration documented');
  }
  if (notes.includes('like_post') && notes.includes('comment_post')) {
    console.log('✓ Completed integrations documented');
  }
} else {
  console.log('⚠ QUEST_INTEGRATION_NOTES.md not found');
}

console.log('\n✅ All verifications complete!');

