// 🔍 Connection Creation Debug Script
// Run this in the browser console to test connection validation

console.log('🔍 SkillSwap Connection Debug Script');
console.log('=====================================');

// Test scenarios to identify potential issues
const testCases = [
  {
    name: 'Valid connection request',
    data: {
      recipientId: 'test-user-123',
      senderId: 'current-user-456',
      skillName: 'React Development',
      message: 'Hello, I would like to learn React'
    }
  },
  {
    name: 'Missing senderId',
    data: {
      recipientId: 'test-user-123',
      senderId: '',
      skillName: 'React Development',
      message: 'Hello, I would like to learn React'
    }
  },
  {
    name: 'Missing recipientId',
    data: {
      recipientId: '',
      senderId: 'current-user-456',
      skillName: 'React Development',
      message: 'Hello, I would like to learn React'
    }
  },
  {
    name: 'Null senderId',
    data: {
      recipientId: 'test-user-123',
      senderId: null,
      skillName: 'React Development',
      message: 'Hello, I would like to learn React'
    }
  },
  {
    name: 'Undefined recipientId',
    data: {
      recipientId: undefined,
      senderId: 'current-user-456',
      skillName: 'React Development',
      message: 'Hello, I would like to learn React'
    }
  },
  {
    name: 'Self-connection attempt',
    data: {
      recipientId: 'same-user-123',
      senderId: 'same-user-123',
      skillName: 'React Development',
      message: 'Hello, I would like to learn React'
    }
  }
];

// Mock validation function (mirrors the service validation)
function validateConnectionData(data) {
  console.log('📝 Testing data:', data);
  
  const errors = [];
  
  // Check for missing IDs
  if (!data.recipientId || data.recipientId === '') {
    errors.push('recipientId is required and cannot be empty');
  }
  
  if (!data.senderId || data.senderId === '') {
    errors.push('senderId is required and cannot be empty');
  }
  
  // Check for null/undefined values
  if (data.recipientId === null) {
    errors.push('recipientId cannot be null');
  }
  
  if (data.senderId === null) {
    errors.push('senderId cannot be null');
  }
  
  if (data.recipientId === undefined) {
    errors.push('recipientId cannot be undefined');
  }
  
  if (data.senderId === undefined) {
    errors.push('senderId cannot be undefined');
  }
  
  // Check for self-connection
  if (data.senderId === data.recipientId) {
    errors.push('Cannot connect to yourself');
  }
  
  return errors;
}

// Run all test cases
console.log('\n🧪 Running Connection Validation Tests...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('─'.repeat(40));
  
  const errors = validateConnectionData(testCase.data);
  
  if (errors.length === 0) {
    console.log('✅ PASS - No validation errors');
  } else {
    console.log('❌ FAIL - Validation errors:');
    errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('');
});

// Instructions for user testing
console.log('\n📋 Manual Testing Instructions:');
console.log('================================');
console.log('1. Open your SkillSwap app in the browser');
console.log('2. Open browser console (F12)');
console.log('3. Try creating a connection request');
console.log('4. Check the console for error messages');
console.log('5. Look for these specific validation errors:');
console.log('   - "Sender and recipient IDs are required"');
console.log('   - "Cannot connect to yourself"');
console.log('   - "User profiles not found"');
console.log('   - "Connection request already exists"');
console.log('\n📊 Expected Behavior:');
console.log('- Connection requests should work when both senderId and recipientId are valid');
console.log('- System should prevent self-connections');
console.log('- System should prevent duplicate requests');
console.log('- Errors should be clearly logged to console');

// Additional debugging helpers
window.debugConnection = {
  // Helper to test real connection creation (requires actual Firebase setup)
  testRealConnection: async function(recipientId, senderId, skillName = 'Test Skill') {
    console.log('🚀 Testing real connection creation...');
    console.log('Data:', { recipientId, senderId, skillName });
    
    if (typeof ConnectionsService === 'undefined') {
      console.error('❌ ConnectionsService not available. Make sure the service is imported.');
      return;
    }
    
    try {
      const result = await ConnectionsService.createConnectionRequest({
        recipientId,
        senderId,
        skillName,
        message: 'Debug test connection'
      });
      console.log('✅ Connection created successfully:', result);
    } catch (error) {
      console.error('❌ Connection creation failed:', error.message);
      console.error('Full error:', error);
    }
  },
  
  // Helper to check current user authentication
  checkAuth: function() {
    console.log('👤 Checking authentication state...');
    
    if (typeof window.firebase === 'undefined') {
      console.error('❌ Firebase not available');
      return;
    }
    
    const auth = window.firebase.auth();
    const user = auth.currentUser;
    
    if (user) {
      console.log('✅ User authenticated:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
    } else {
      console.log('❌ No authenticated user');
    }
  }
};

console.log('\n🛠️  Debug helpers added to window.debugConnection:');
console.log('- window.debugConnection.testRealConnection(recipientId, senderId)');
console.log('- window.debugConnection.checkAuth()');
