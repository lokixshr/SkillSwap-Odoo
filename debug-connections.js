// 🔧 Connection Permission Debugging Script
// Run this in your browser console while logged in to debug connection creation issues

console.log('🔧 SkillSwap Connection Permission Debug Tool');
console.log('=============================================');

// Test configuration
const DEBUG_CONFIG = {
  // Replace with actual user IDs from your app
  SENDER_ID: 'your_user_id_here',
  RECIPIENT_ID: 'target_user_id_here',
  SKILL_NAME: 'JavaScript',
  MESSAGE: 'Test connection request'
};

// Import the service (adjust path as needed)
// import { ConnectionsService } from './src/services/connectionsService';

// Debug helper functions
const debugHelpers = {
  // Check authentication state
  checkAuth: () => {
    console.log('👤 Authentication Check:');
    console.log('======================');
    
    // Check Firebase auth
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) {
        console.log('✅ User authenticated:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        return user.uid;
      } else {
        console.log('❌ No authenticated user');
        return null;
      }
    } else {
      console.log('❌ Firebase auth not available');
      return null;
    }
  },

  // Validate connection data
  validateConnectionData: (senderId, recipientId, skillName, message) => {
    console.log('🔍 Connection Data Validation:');
    console.log('=============================');
    
    const issues = [];
    
    // Check senderId
    if (!senderId) {
      issues.push('❌ senderId is missing/empty');
    } else if (typeof senderId !== 'string') {
      issues.push('❌ senderId is not a string');
    } else if (senderId.trim() === '') {
      issues.push('❌ senderId is empty string');
    } else {
      console.log('✅ senderId is valid:', senderId);
    }
    
    // Check recipientId
    if (!recipientId) {
      issues.push('❌ recipientId is missing/empty');
    } else if (typeof recipientId !== 'string') {
      issues.push('❌ recipientId is not a string');
    } else if (recipientId.trim() === '') {
      issues.push('❌ recipientId is empty string');
    } else {
      console.log('✅ recipientId is valid:', recipientId);
    }
    
    // Check for self-connection
    if (senderId && recipientId && senderId === recipientId) {
      issues.push('❌ Attempting to connect to self');
    } else if (senderId && recipientId) {
      console.log('✅ Not a self-connection attempt');
    }
    
    // Check skill name
    if (skillName) {
      console.log('✅ skillName provided:', skillName);
    } else {
      console.log('ℹ️  skillName is optional and not provided');
    }
    
    // Check message
    if (message) {
      console.log('✅ message provided:', message);
    } else {
      console.log('ℹ️  message is optional and not provided');
    }
    
    // Summary
    if (issues.length === 0) {
      console.log('🎉 No validation issues detected!');
      return true;
    } else {
      console.log('🚨 Validation issues found:');
      issues.forEach(issue => console.log(`  ${issue}`));
      return false;
    }
  },

  // Test Firestore rules manually
  testFirestoreRules: (senderId, recipientId) => {
    console.log('🔒 Firestore Rules Test:');
    console.log('=======================');
    
    // Generate expected document ID
    const [minId, maxId] = [senderId, recipientId].sort();
    const expectedDocId = `${minId}_${maxId}`;
    
    console.log('📄 Expected document details:', {
      senderId,
      recipientId,
      minId,
      maxId,
      expectedDocId,
      path: `connections/${expectedDocId}`
    });
    
    // Check if the document ID matches the canonical pair format
    const canonicalPair = (u1, u2) => {
      return (u1 < u2 ? u1 : u2) + '_' + (u1 < u2 ? u2 : u1);
    };
    
    const canonicalId = canonicalPair(senderId, recipientId);
    
    if (expectedDocId === canonicalId) {
      console.log('✅ Document ID matches canonical pair format');
    } else {
      console.log('❌ Document ID does NOT match canonical pair format');
      console.log(`Expected: ${canonicalId}, Got: ${expectedDocId}`);
    }
    
    return expectedDocId;
  },

  // Test connection creation step by step
  testConnectionCreation: async (senderId, recipientId, skillName, message) => {
    console.log('🚀 Connection Creation Test:');
    console.log('===========================');
    
    // Step 1: Validate data
    console.log('Step 1: Validating data...');
    const isValid = debugHelpers.validateConnectionData(senderId, recipientId, skillName, message);
    if (!isValid) {
      console.log('❌ Validation failed, stopping test');
      return false;
    }
    
    // Step 2: Test Firestore rules
    console.log('Step 2: Testing Firestore rules...');
    const expectedDocId = debugHelpers.testFirestoreRules(senderId, recipientId);
    
    // Step 3: Prepare connection data
    console.log('Step 3: Preparing connection data...');
    const connectionData = {
      senderId,
      recipientId,
      status: 'pending',
      createdAt: new Date(), // Will be replaced with serverTimestamp() in actual call
      skillName: skillName || 'general connection',
      message: message || '',
      // Note: senderName, recipientName, etc. would be fetched from user profiles
    };
    
    console.log('📋 Connection data to be sent:', connectionData);
    
    // Step 4: Check required fields for Firestore rules
    console.log('Step 4: Checking required fields for Firestore rules...');
    const requiredFields = ['senderId', 'recipientId', 'status', 'createdAt'];
    const hasAllRequired = requiredFields.every(field => connectionData[field]);
    
    if (hasAllRequired) {
      console.log('✅ All required fields present:', requiredFields);
    } else {
      console.log('❌ Missing required fields');
      requiredFields.forEach(field => {
        if (!connectionData[field]) {
          console.log(`  ❌ Missing: ${field}`);
        }
      });
    }
    
    return {
      isValid,
      expectedDocId,
      connectionData,
      hasAllRequired
    };
  }
};

// Manual test function you can call
window.debugConnections = {
  // Run all diagnostic checks
  runDiagnostics: async () => {
    console.log('🏁 Running Full Connection Diagnostics');
    console.log('======================================');
    
    // Check auth
    const userId = debugHelpers.checkAuth();
    if (!userId) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    // Use current user as sender
    const senderId = userId;
    const recipientId = DEBUG_CONFIG.RECIPIENT_ID;
    
    if (!recipientId || recipientId === 'target_user_id_here') {
      console.log('❌ Please set a valid RECIPIENT_ID in DEBUG_CONFIG');
      return;
    }
    
    // Run tests
    const result = await debugHelpers.testConnectionCreation(
      senderId,
      recipientId,
      DEBUG_CONFIG.SKILL_NAME,
      DEBUG_CONFIG.MESSAGE
    );
    
    console.log('🎯 Diagnostic Summary:', {
      authUserId: userId,
      testResult: result
    });
    
    return result;
  },

  // Test specific connection data
  testConnection: async (recipientId, skillName = 'Test Skill', message = 'Test message') => {
    const userId = debugHelpers.checkAuth();
    if (!userId) {
      console.log('❌ User not authenticated');
      return;
    }
    
    return await debugHelpers.testConnectionCreation(userId, recipientId, skillName, message);
  },

  // Helper to check current user ID
  getCurrentUserId: () => {
    return debugHelpers.checkAuth();
  }
};

// Instructions
console.log('🛠️ Usage Instructions:');
console.log('====================');
console.log('1. Set DEBUG_CONFIG.RECIPIENT_ID to a valid user ID from your app');
console.log('2. Run: debugConnections.runDiagnostics()');
console.log('3. Or test specific connection: debugConnections.testConnection("user_id_here")');
console.log('4. Check current user: debugConnections.getCurrentUserId()');
console.log('');
console.log('📝 Available functions:');
console.log('- debugConnections.runDiagnostics()');
console.log('- debugConnections.testConnection(recipientId, skillName?, message?)');
console.log('- debugConnections.getCurrentUserId()');

// Auto-run diagnostics if recipient ID is set
if (DEBUG_CONFIG.RECIPIENT_ID !== 'target_user_id_here') {
  console.log('🏃‍♂️ Auto-running diagnostics with configured recipient ID...');
  window.debugConnections.runDiagnostics();
} else {
  console.log('⚠️ Set DEBUG_CONFIG.RECIPIENT_ID to auto-run diagnostics');
}
