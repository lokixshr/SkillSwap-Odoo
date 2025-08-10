// Debug Guide for SkillSwap Messaging System
// Available in browser console as window.DebugGuide

export const DebugGuide = {
  /**
   * Print debugging commands
   */
  help() {
    console.log(`
🔧 SkillSwap Debug Guide
========================

🧪 Available Commands:
window.FirestoreDebug.runAllTests()     - Run all Firestore tests
window.FirestoreDebug.testConnection()  - Test Firestore connection
window.FirestoreDebug.testUserProfileCreation() - Test user profile creation
window.FirestoreDebug.testMessageCreation('USER_ID') - Test messaging with user ID

📊 Check Current Status:
DebugGuide.checkUserStatus()           - Check current user info
DebugGuide.checkMessagingIssues()      - Diagnose messaging problems
DebugGuide.getOtherUsers()             - Find users to chat with

🚀 Quick Fixes:
DebugGuide.refreshPage()               - Reload page
DebugGuide.clearLocalStorage()         - Clear storage and refresh
DebugGuide.testWithDemoUser()          - Create a demo user for testing

📱 Navigate to Test Page:
- Click "Test Messaging" button in Dashboard header
- Or visit: http://localhost:8080/test-messaging

🔍 Common Issues Fixed:
✅ User profile creation errors
✅ Self-chat issue (senderId = receiverId) 
✅ Message timestamp handling
✅ Real-time message updates
✅ Firestore security rules
✅ Import errors in debug utilities
    `);
  },

  /**
   * Check current user status
   */
  checkUserStatus() {
    const auth = (window as any).firebase?.auth?.() || null;
    const user = auth?.currentUser;
    
    console.log('👤 Current User Status:', {
      isLoggedIn: !!user,
      uid: user?.uid,
      email: user?.email,
      displayName: user?.displayName,
      timestamp: new Date().toISOString()
    });

    return user;
  },

  /**
   * Diagnose messaging issues
   */
  checkMessagingIssues() {
    console.log('🔍 Diagnosing messaging issues...');
    
    const user = this.checkUserStatus();
    if (!user) {
      console.error('❌ No user logged in - please sign in first');
      return;
    }

    // Check for self-chat issue
    const currentPath = window.location.pathname;
    console.log('📍 Current page:', currentPath);
    
    if (currentPath.includes('messages') || currentPath.includes('test-messaging')) {
      console.log('✅ On messaging page');
    } else {
      console.log('ℹ️  Navigate to /test-messaging for proper testing');
    }

    // Check console for errors
    console.log('🔎 Check console for any errors above this message');
    console.log('💡 Most common issue: Trying to chat with yourself (same user ID)');
  },

  /**
   * Get other users for testing
   */
  async getOtherUsers() {
    try {
      const UserService = (window as any).UserService;
      if (!UserService) {
        console.error('❌ UserService not available');
        return [];
      }

      const users = await UserService.searchUsers('', 10);
      console.log('👥 Available users for chat testing:', users);
      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }
  },

  /**
   * Create demo user for testing
   */
  createDemoUser() {
    const demoUserId = `demo_user_${Date.now()}`;
    const demoUser = {
      uid: demoUserId,
      displayName: `Demo User ${Math.floor(Math.random() * 100)}`,
      email: `${demoUserId}@demo.com`,
      photoURL: null,
      isDemo: true
    };

    console.log('🎭 Created demo user for testing:', demoUser);
    console.log('💬 You can now use this ID for chat testing:', demoUserId);
    
    return demoUser;
  },

  /**
   * Refresh the page
   */
  refreshPage() {
    console.log('🔄 Refreshing page...');
    window.location.reload();
  },

  /**
   * Clear local storage and refresh
   */
  clearLocalStorage() {
    console.log('🧹 Clearing localStorage and refreshing...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },

  /**
   * Navigate to test messaging page
   */
  goToTestPage() {
    console.log('🚀 Navigating to test messaging page...');
    window.location.href = '/test-messaging';
  }
};

// Make available globally in development
if (import.meta.env.DEV) {
  (window as any).DebugGuide = DebugGuide;
  
  // Auto-show help after a delay
  setTimeout(() => {
    console.log('🔧 SkillSwap Debug Tools Loaded!');
    console.log('Type "DebugGuide.help()" for available commands');
  }, 2000);
}
