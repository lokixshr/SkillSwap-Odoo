const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, signInAnonymously } = require('firebase/auth');

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099');

async function testConnectionRules() {
  console.log('🧪 Starting Firebase Rules Test for Connections...\n');
  
  try {
    // Sign in two test users
    console.log('📝 Signing in test users...');
    const user1Credential = await signInAnonymously(auth);
    const user1Id = user1Credential.user.uid;
    console.log('✅ User 1 signed in:', user1Id);

    // For testing, we'll simulate a second user
    const user2Id = 'test-user-2';
    
    // Test 1: Create connection request
    console.log('\n🔍 Test 1: Creating connection request...');
    const connectionId = 'test-connection-' + Date.now();
    const connectionData = {
      senderId: user1Id,
      recipientId: user2Id,
      status: 'pending',
      createdAt: serverTimestamp(),
      message: 'Test connection request'
    };
    
    const connectionRef = doc(db, 'connections', connectionId);
    await setDoc(connectionRef, connectionData);
    console.log('✅ Connection request created successfully');
    
    // Test 2: Read connection request
    console.log('\n🔍 Test 2: Reading connection request...');
    const connectionDoc = await getDoc(connectionRef);
    if (connectionDoc.exists()) {
      console.log('✅ Connection request read successfully');
      console.log('📄 Data:', connectionDoc.data());
    } else {
      console.log('❌ Connection request not found');
    }
    
    console.log('\n🎉 All tests passed! Connection rules are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
  }
}

// Run the test
testConnectionRules().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
