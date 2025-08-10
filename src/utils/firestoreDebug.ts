import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export class FirestoreDebug {
  /**
   * Test user profile creation
   */
  static async testUserProfileCreation(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    console.log('🧪 Testing user profile creation for:', user.uid);

    try {
      // Test document creation
      const userRef = doc(db, 'users', user.uid);
      
      const testData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Test User',
        photoURL: user.photoURL || undefined,
        skillsToTeach: ['JavaScript', 'React'],
        skillsToLearn: ['Python', 'Machine Learning'],
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📝 Attempting to create user document with data:', testData);
      
      await setDoc(userRef, testData);
      console.log('✅ User document created successfully');

      // Verify creation
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        console.log('✅ User document verified:', docSnap.data());
      } else {
        console.error('❌ User document not found after creation');
      }

    } catch (error) {
      console.error('❌ Error in user profile test:', error);
    }
  }

  /**
   * Test message creation
   */
  static async testMessageCreation(otherUserId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    console.log('🧪 Testing message creation between:', user.uid, 'and', otherUserId);

    try {
      const chatId = [user.uid, otherUserId].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      const testMessage = {
        senderId: user.uid,
        receiverId: otherUserId,
        content: 'Test message from debug utility',
        createdAt: serverTimestamp()
      };

      console.log('📝 Attempting to create message with data:', testMessage);
      console.log('📝 Using chat path: chats/' + chatId + '/messages');
      
      const docRef = await addDoc(messagesRef, testMessage);
      console.log('✅ Message created successfully with ID:', docRef.id);

    } catch (error) {
      console.error('❌ Error in message creation test:', error);
    }
  }

  /**
   * Test Firestore connection
   */
  static async testConnection(): Promise<void> {
    console.log('🧪 Testing Firestore connection...');

    try {
      // Test auth state
      const user = auth.currentUser;
      console.log('🔐 Current auth state:', {
        isAuthenticated: !!user,
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName
      });

      // Test basic read
      const testRef = doc(db, 'test', 'connection');
      const testSnap = await getDoc(testRef);
      console.log('📖 Test read successful, exists:', testSnap.exists());

      // Test basic write (if authenticated)
      if (user) {
        await setDoc(testRef, {
          timestamp: serverTimestamp(),
          user: user.uid,
          test: true
        });
        console.log('✅ Test write successful');
      }

    } catch (error) {
      console.error('❌ Connection test failed:', error);
    }
  }

  /**
   * Check security rules by attempting various operations
   */
  static async testSecurityRules(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found for security test');
      return;
    }

    console.log('🧪 Testing Firestore security rules...');

    // Test user document access (own)
    try {
      const ownUserRef = doc(db, 'users', user.uid);
      const ownUserSnap = await getDoc(ownUserRef);
      console.log('✅ Can read own user document:', ownUserSnap.exists());
    } catch (error) {
      console.error('❌ Cannot read own user document:', error);
    }

    // Test user document write (own)
    try {
      const ownUserRef = doc(db, 'users', user.uid);
      await setDoc(ownUserRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Test User',
        skillsToTeach: [],
        skillsToLearn: [],
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Can write own user document');
    } catch (error) {
      console.error('❌ Cannot write own user document:', error);
    }
  }

  /**
   * Monitor auth state changes
   */
  static monitorAuth(): () => void {
    console.log('🧪 Starting auth state monitor...');
    
    return onAuthStateChanged(auth, (user) => {
      console.log('🔐 Auth state changed:', {
        isAuthenticated: !!user,
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        photoURL: user?.photoURL,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Run all debug tests
   */
  static async runAllTests(otherUserId?: string): Promise<void> {
    console.log('🚀 Running Firestore debug tests...');
    
    await this.testConnection();
    await this.testSecurityRules();
    await this.testUserProfileCreation();
    
    if (otherUserId) {
      await this.testMessageCreation(otherUserId);
    }
    
    console.log('🏁 Debug tests completed');
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  // Set up auth monitor
  setTimeout(() => {
    FirestoreDebug.monitorAuth();
  }, 1000);

  // Expose to window for manual testing
  (window as any).FirestoreDebug = FirestoreDebug;
  console.log('🔧 FirestoreDebug available on window.FirestoreDebug');
}
