// 🧪 SkillSwap Enhanced System Test Suite
// Run this in browser console to test all enhanced features

// Test Configuration
const TEST_CONFIG = {
  // Test user IDs (replace with actual user IDs from your Firebase Auth)
  USER_A_ID: 'test_user_a_12345',
  USER_B_ID: 'test_user_b_67890',
  USER_A_NAME: 'Alice Johnson',
  USER_B_NAME: 'Bob Smith',
  USER_A_EMAIL: 'alice@skillswap.test',
  USER_B_EMAIL: 'bob@skillswap.test',
  SKILL_NAME: 'React Development',
  TEST_MESSAGE: 'Hello! Ready to start our React session?'
};

// Import our enhanced services
import { ConnectionsService } from '../services/connectionsService.js';
import { MessagingService } from '../services/messagingService.js';
import { SessionService } from '../services/sessionService.js';
import { NotificationsService } from '../services/notificationsService.js';
import { EmailService } from '../lib/emailService.js';
import { MeetingService } from '../lib/meetingService.js';

console.log('🎯 SkillSwap Enhanced System Test Suite');
console.log('=======================================');

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  results: []
};

// Test Helper Functions
function testLog(message, type = 'info') {
  const colors = {
    info: 'color: blue',
    success: 'color: green; font-weight: bold',
    error: 'color: red; font-weight: bold',
    warning: 'color: orange'
  };
  console.log(`%c${message}`, colors[type]);
}

function testResult(testName, success, message) {
  testResults.total++;
  if (success) {
    testResults.passed++;
    testLog(`✅ ${testName}: PASSED - ${message}`, 'success');
  } else {
    testResults.failed++;
    testLog(`❌ ${testName}: FAILED - ${message}`, 'error');
  }
  testResults.results.push({ testName, success, message });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 📋 TEST 1: Connection System
async function testConnectionSystem() {
  testLog('\n📋 TEST 1: Enhanced Connection System', 'info');
  testLog('=====================================');
  
  try {
    // Test 1.1: Create Connection Request
    testLog('1.1 Testing connection request creation...');
    
    const connectionId = await ConnectionsService.createConnectionRequest({
      recipientId: TEST_CONFIG.USER_B_ID,
      senderId: TEST_CONFIG.USER_A_ID,
      skillName: TEST_CONFIG.SKILL_NAME,
      message: `I'd love to learn ${TEST_CONFIG.SKILL_NAME} from you!`
    });
    
    testResult(
      'Connection Creation', 
      connectionId && typeof connectionId === 'string',
      connectionId ? `Connection ID: ${connectionId}` : 'No connection ID returned'
    );
    
    // Test 1.2: Check Connection Status
    testLog('1.2 Testing connection request retrieval...');
    await sleep(1000); // Wait for database to update
    
    const pendingRequests = await ConnectionsService.getPendingConnectionRequests(TEST_CONFIG.USER_B_ID);
    const hasNewRequest = pendingRequests.some(req => req.id === connectionId);
    
    testResult(
      'Connection Retrieval',
      hasNewRequest,
      hasNewRequest ? 'Connection found in pending requests' : 'Connection not found in pending requests'
    );
    
    // Test 1.3: Real-time Connection Updates
    testLog('1.3 Testing real-time connection updates...');
    
    let realtimeWorking = false;
    const unsubscribe = ConnectionsService.subscribeToConnectionRequests(
      TEST_CONFIG.USER_B_ID,
      (connections) => {
        if (connections.find(conn => conn.id === connectionId)) {
          realtimeWorking = true;
          testLog('📡 Real-time update received!', 'success');
        }
      }
    );
    
    await sleep(2000);
    unsubscribe();
    
    testResult(
      'Real-time Updates',
      realtimeWorking,
      realtimeWorking ? 'Real-time listener working' : 'Real-time listener not working'
    );
    
    // Test 1.4: Accept Connection
    testLog('1.4 Testing connection acceptance...');
    
    await ConnectionsService.updateConnectionStatus(connectionId, 'accepted');
    
    await sleep(1000);
    const areFriends = await ConnectionsService.areFriends(TEST_CONFIG.USER_A_ID, TEST_CONFIG.USER_B_ID);
    
    testResult(
      'Connection Acceptance',
      areFriends,
      areFriends ? 'Users are now friends' : 'Users are not friends after acceptance'
    );
    
    return connectionId;
    
  } catch (error) {
    testLog(`❌ Connection test failed: ${error.message}`, 'error');
    testResult('Connection System', false, error.message);
    return null;
  }
}

// 💬 TEST 2: Messaging System
async function testMessagingSystem() {
  testLog('\n💬 TEST 2: Enhanced Messaging System', 'info');
  testLog('==================================');
  
  try {
    // Test 2.1: Create Conversation
    testLog('2.1 Testing conversation creation...');
    
    const conversationId = await MessagingService.createOrGetConversation(
      TEST_CONFIG.USER_A_ID,
      TEST_CONFIG.USER_B_ID,
      TEST_CONFIG.USER_A_NAME,
      '',
      TEST_CONFIG.USER_B_NAME,
      ''
    );
    
    testResult(
      'Conversation Creation',
      conversationId && typeof conversationId === 'string',
      conversationId ? `Conversation ID: ${conversationId}` : 'No conversation ID returned'
    );
    
    // Test 2.2: Send Message
    testLog('2.2 Testing message sending...');
    
    const messageId = await MessagingService.sendMessage({
      senderId: TEST_CONFIG.USER_A_ID,
      receiverId: TEST_CONFIG.USER_B_ID,
      content: TEST_CONFIG.TEST_MESSAGE,
      messageType: 'text'
    });
    
    testResult(
      'Message Sending',
      messageId && typeof messageId === 'string',
      messageId ? `Message ID: ${messageId}` : 'No message ID returned'
    );
    
    // Test 2.3: Real-time Message Updates
    testLog('2.3 Testing real-time message updates...');
    
    let messageReceived = false;
    const unsubscribe = MessagingService.subscribeToConversation(
      TEST_CONFIG.USER_A_ID,
      TEST_CONFIG.USER_B_ID,
      (messages) => {
        if (messages.find(msg => msg.id === messageId)) {
          messageReceived = true;
          testLog('📡 Real-time message received!', 'success');
        }
      }
    );
    
    await sleep(2000);
    unsubscribe();
    
    testResult(
      'Real-time Messaging',
      messageReceived,
      messageReceived ? 'Real-time message updates working' : 'Real-time message updates not working'
    );
    
    // Test 2.4: Mark Messages as Read
    testLog('2.4 Testing message read status...');
    
    await MessagingService.markMessagesAsRead(TEST_CONFIG.USER_B_ID, TEST_CONFIG.USER_A_ID);
    
    const { messages } = await MessagingService.getConversationMessages(
      TEST_CONFIG.USER_A_ID,
      TEST_CONFIG.USER_B_ID,
      10
    );
    
    const readMessage = messages.find(msg => msg.id === messageId);
    
    testResult(
      'Message Read Status',
      readMessage && readMessage.isRead,
      readMessage && readMessage.isRead ? 'Message marked as read' : 'Message read status not updated'
    );
    
    return { conversationId, messageId };
    
  } catch (error) {
    testLog(`❌ Messaging test failed: ${error.message}`, 'error');
    testResult('Messaging System', false, error.message);
    return null;
  }
}

// 🎯 TEST 3: Session & Meeting System
async function testSessionSystem() {
  testLog('\n🎯 TEST 3: Enhanced Session & Meeting System', 'info');
  testLog('==========================================');
  
  try {
    // Test 3.1: Create Session Request
    testLog('3.1 Testing session request creation...');
    
    const sessionRequestId = await SessionService.createSessionRequest({
      hostId: TEST_CONFIG.USER_B_ID,
      requesterId: TEST_CONFIG.USER_A_ID,
      skillName: TEST_CONFIG.SKILL_NAME,
      sessionType: 'video',
      duration: 60,
      message: 'Looking forward to learning React best practices!'
    });
    
    testResult(
      'Session Request Creation',
      sessionRequestId && typeof sessionRequestId === 'string',
      sessionRequestId ? `Session Request ID: ${sessionRequestId}` : 'No session request ID returned'
    );
    
    // Test 3.2: Generate Meeting Link
    testLog('3.2 Testing meeting link generation...');
    
    const meetingRoom = await MeetingService.generateMeetingLink(
      sessionRequestId,
      TEST_CONFIG.USER_B_ID,
      TEST_CONFIG.USER_A_ID,
      'jitsi'
    );
    
    testResult(
      'Meeting Link Generation',
      meetingRoom && meetingRoom.meetingUrl && meetingRoom.meetingUrl.includes('jit.si'),
      meetingRoom ? `Meeting URL: ${meetingRoom.meetingUrl}` : 'No meeting URL generated'
    );
    
    // Test 3.3: Accept Session with Meeting Link
    testLog('3.3 Testing session acceptance with meeting integration...');
    
    const eventId = await SessionService.updateSessionRequestStatus(
      sessionRequestId,
      'approved',
      {
        scheduledDate: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, // Tomorrow
        meetingLink: meetingRoom.meetingUrl,
        notes: 'Looking forward to our React session!'
      }
    );
    
    testResult(
      'Session Acceptance',
      eventId && typeof eventId === 'string',
      eventId ? `Event ID: ${eventId}` : 'No event ID returned'
    );
    
    // Test 3.4: Check Session Event Creation
    testLog('3.4 Testing session event retrieval...');
    
    if (eventId) {
      const sessionEvent = await SessionService.getSessionEvent(eventId);
      
      testResult(
        'Session Event Creation',
        sessionEvent && sessionEvent.meetingLink === meetingRoom.meetingUrl,
        sessionEvent ? 'Session event created with meeting link' : 'Session event not found or incomplete'
      );
    }
    
    return { sessionRequestId, eventId, meetingRoom };
    
  } catch (error) {
    testLog(`❌ Session test failed: ${error.message}`, 'error');
    testResult('Session System', false, error.message);
    return null;
  }
}

// 📧 TEST 4: Email System
async function testEmailSystem() {
  testLog('\n📧 TEST 4: Enhanced Email System', 'info');
  testLog('===============================');
  
  try {
    // Test 4.1: Session Request Email
    testLog('4.1 Testing session request email...');
    
    const sessionEmailData = {
      skillName: TEST_CONFIG.SKILL_NAME,
      sessionType: 'video',
      scheduledDate: { toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
      duration: 60,
      organizerName: TEST_CONFIG.USER_B_NAME,
      participantName: TEST_CONFIG.USER_A_NAME
    };
    
    const emailSent = await EmailService.sendSessionRequestEmail(
      sessionEmailData,
      TEST_CONFIG.USER_B_EMAIL,
      TEST_CONFIG.USER_B_NAME,
      TEST_CONFIG.USER_A_NAME
    );
    
    testResult(
      'Session Request Email',
      emailSent,
      emailSent ? 'Session request email sent successfully' : 'Session request email failed'
    );
    
    // Test 4.2: Session Confirmation Email with Meeting Link
    testLog('4.2 Testing session confirmation email with meeting link...');
    
    const confirmationEmailData = {
      ...sessionEmailData,
      meetingLink: 'https://meet.jit.si/skillswap-test-session-123'
    };
    
    const confirmationSent = await EmailService.sendSessionConfirmationEmail(
      confirmationEmailData,
      TEST_CONFIG.USER_A_EMAIL,
      TEST_CONFIG.USER_A_NAME,
      false // isOrganizer
    );
    
    testResult(
      'Session Confirmation Email',
      confirmationSent,
      confirmationSent ? 'Session confirmation email with meeting link sent' : 'Session confirmation email failed'
    );
    
    // Test 4.3: Session Reminder Email
    testLog('4.3 Testing session reminder email...');
    
    const reminderSent = await EmailService.sendSessionReminderEmail(
      confirmationEmailData,
      TEST_CONFIG.USER_A_EMAIL,
      TEST_CONFIG.USER_A_NAME,
      false, // isOrganizer
      '1h' // reminder type
    );
    
    testResult(
      'Session Reminder Email',
      reminderSent,
      reminderSent ? 'Session reminder email sent' : 'Session reminder email failed'
    );
    
    // Test 4.4: Connection Request Email
    testLog('4.4 Testing connection request email...');
    
    const connectionEmailSent = await EmailService.sendConnectionRequestEmail(
      TEST_CONFIG.USER_A_NAME,
      TEST_CONFIG.USER_B_EMAIL,
      TEST_CONFIG.USER_B_NAME,
      TEST_CONFIG.SKILL_NAME
    );
    
    testResult(
      'Connection Request Email',
      connectionEmailSent,
      connectionEmailSent ? 'Connection request email sent' : 'Connection request email failed'
    );
    
  } catch (error) {
    testLog(`❌ Email test failed: ${error.message}`, 'error');
    testResult('Email System', false, error.message);
  }
}

// 🔔 TEST 5: Notifications System
async function testNotificationsSystem() {
  testLog('\n🔔 TEST 5: Enhanced Notifications System', 'info');
  testLog('=====================================');
  
  try {
    // Test 5.1: Create Connection Request Notification
    testLog('5.1 Testing connection request notification...');
    
    const notificationId = await NotificationsService.createConnectionRequestNotification(
      TEST_CONFIG.USER_B_ID,
      TEST_CONFIG.USER_A_ID,
      TEST_CONFIG.USER_A_NAME,
      TEST_CONFIG.SKILL_NAME,
      'test-connection-123',
      ''
    );
    
    testResult(
      'Connection Notification',
      notificationId && typeof notificationId === 'string',
      notificationId ? `Notification ID: ${notificationId}` : 'No notification ID returned'
    );
    
    // Test 5.2: Real-time Notification Updates
    testLog('5.2 Testing real-time notification updates...');
    
    let notificationReceived = false;
    const unsubscribe = NotificationsService.subscribeToUserNotifications(
      TEST_CONFIG.USER_B_ID,
      (notifications) => {
        if (notifications.find(notif => notif.id === notificationId)) {
          notificationReceived = true;
          testLog('📡 Real-time notification received!', 'success');
        }
      }
    );
    
    await sleep(2000);
    unsubscribe();
    
    testResult(
      'Real-time Notifications',
      notificationReceived,
      notificationReceived ? 'Real-time notifications working' : 'Real-time notifications not working'
    );
    
    // Test 5.3: Mark Notification as Read
    testLog('5.3 Testing notification read status...');
    
    if (notificationId) {
      await NotificationsService.markAsRead(notificationId);
      
      const notifications = await NotificationsService.getUserNotifications(TEST_CONFIG.USER_B_ID);
      const readNotification = notifications.find(notif => notif.id === notificationId);
      
      testResult(
        'Notification Read Status',
        readNotification && readNotification.read,
        readNotification && readNotification.read ? 'Notification marked as read' : 'Notification read status not updated'
      );
    }
    
  } catch (error) {
    testLog(`❌ Notifications test failed: ${error.message}`, 'error');
    testResult('Notifications System', false, error.message);
  }
}

// 🚀 Main Test Runner
async function runAllTests() {
  testLog('\n🚀 Starting SkillSwap Enhanced System Tests', 'info');
  testLog('===========================================\n');
  
  const startTime = Date.now();
  
  try {
    // Run all test suites
    const connectionResult = await testConnectionSystem();
    await sleep(1000);
    
    const messagingResult = await testMessagingSystem();
    await sleep(1000);
    
    const sessionResult = await testSessionSystem();
    await sleep(1000);
    
    await testEmailSystem();
    await sleep(1000);
    
    await testNotificationsSystem();
    
    // Generate test report
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    testLog('\n📊 TEST RESULTS SUMMARY', 'info');
    testLog('=====================');
    testLog(`⏱️ Total Duration: ${duration}s`);
    testLog(`✅ Tests Passed: ${testResults.passed}`);
    testLog(`❌ Tests Failed: ${testResults.failed}`);
    testLog(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
      testLog('\n🎉 ALL TESTS PASSED! 🎉', 'success');
      testLog('Your enhanced SkillSwap system is working perfectly!');
    } else {
      testLog('\n⚠️ Some tests failed. Check the details above.', 'warning');
    }
    
    // Detailed results
    testLog('\n📋 DETAILED RESULTS:', 'info');
    testResults.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      testLog(`${status} ${result.testName}: ${result.message}`);
    });
    
    return {
      success: testResults.failed === 0,
      results: testResults,
      duration
    };
    
  } catch (error) {
    testLog(`❌ Test suite failed: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message,
      duration: (Date.now() - startTime) / 1000
    };
  }
}

// Auto-run tests if this script is executed directly
if (typeof window !== 'undefined') {
  testLog('🎯 SkillSwap Enhanced System Test Suite Ready!');
  testLog('To run tests, execute: runAllTests()');
  
  // Make functions available globally
  window.runAllTests = runAllTests;
  window.testConnectionSystem = testConnectionSystem;
  window.testMessagingSystem = testMessagingSystem;
  window.testSessionSystem = testSessionSystem;
  window.testEmailSystem = testEmailSystem;
  window.testNotificationsSystem = testNotificationsSystem;
} else {
  // Node.js environment - run tests automatically
  runAllTests().then(results => {
    console.log('Test completed:', results);
    process.exit(results.success ? 0 : 1);
  });
}

export { 
  runAllTests, 
  testConnectionSystem, 
  testMessagingSystem, 
  testSessionSystem, 
  testEmailSystem,
  testNotificationsSystem 
};
