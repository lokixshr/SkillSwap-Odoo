// Firebase Fixes Test Script
// Run this to verify Firebase permissions and connection handling

import { auth } from './src/lib/firebase.js';
import { ConnectionService, SkillPostService, NotificationService } from './src/lib/database.js';

async function testFirebaseIntegration() {
  console.log('🔍 Testing Firebase Integration...');
  
  try {
    // Test 1: Check authentication
    if (!auth.currentUser) {
      console.log('⚠️  User not authenticated - this is expected in test environment');
      console.log('   In production, ensure user is logged in before testing');
      return;
    }
    
    console.log('✅ User authenticated:', auth.currentUser.uid);
    
    // Test 2: Test connection creation (will show duplicate handling)
    try {
      const testConnection = await ConnectionService.createConnection({
        recipientId: 'test-user-123',
        skillName: 'JavaScript',
        message: 'Test connection request'
      });
      console.log('✅ Connection created:', testConnection);
    } catch (error) {
      if (error.message.includes('already connected')) {
        console.log('✅ Duplicate connection prevention working:', error.message);
      } else {
        console.log('❌ Connection error:', error.message);
      }
    }
    
    // Test 3: Test skill post creation
    try {
      const testPost = await SkillPostService.createSkillPost({
        userId: auth.currentUser.uid,
        userDisplayName: 'Test User',
        skillName: 'Python Programming',
        description: 'Test skill post',
        type: 'teach',
        level: 'intermediate',
        isActive: true
      });
      console.log('✅ Skill post created:', testPost);
    } catch (error) {
      console.log('❌ Skill post error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('Starting Firebase integration tests...');
testFirebaseIntegration();
