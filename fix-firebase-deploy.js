#!/usr/bin/env node

/**
 * Firebase Rules and Indexes Deployment Script
 * 
 * This script helps deploy the updated Firestore security rules and indexes
 * to fix the permission errors in the console.
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('🔧 Firebase Rules & Indexes Deployment Helper');
console.log('='.repeat(50));

console.log('\n📋 Issues Fixed:');
console.log('• Updated connections collection permissions');
console.log('• Fixed duplicate notification rules');
console.log('• Added proper indexes for connections');
console.log('• Updated NotificationBell component imports');

console.log('\n🚀 To deploy the fixes, run these commands:');
console.log('');
console.log('1. Deploy Firestore rules:');
console.log('   firebase deploy --only firestore:rules');
console.log('');
console.log('2. Deploy Firestore indexes:');
console.log('   firebase deploy --only firestore:indexes');
console.log('');
console.log('3. Or deploy both at once:');
console.log('   firebase deploy --only firestore');

console.log('\n⚠️  Important Notes:');
console.log('• Make sure you are logged into Firebase CLI');
console.log('• Ensure you are in the project root directory');
console.log('• Firestore indexes may take a few minutes to build');
console.log('• Test the connection functionality after deployment');

// Check if firebase CLI is available
function checkFirebaseCLI() {
    return new Promise((resolve) => {
        const firebase = spawn('firebase', ['--version'], { stdio: 'pipe' });
        firebase.on('close', (code) => {
            resolve(code === 0);
        });
    });
}

// Auto-deploy if requested
async function autoDeploy() {
    const cliAvailable = await checkFirebaseCLI();
    
    if (!cliAvailable) {
        console.log('\n❌ Firebase CLI not found. Please install it first:');
        console.log('   npm install -g firebase-tools');
        return;
    }

    console.log('\n🤖 Auto-deploying Firestore rules and indexes...');
    
    const deploy = spawn('firebase', ['deploy', '--only', 'firestore'], {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    deploy.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ Deployment completed successfully!');
            console.log('🔄 Please refresh your app to test the fixes.');
        } else {
            console.log('\n❌ Deployment failed. Please run manually.');
        }
    });
}

// Check command line args
const args = process.argv.slice(2);
if (args.includes('--deploy') || args.includes('-d')) {
    autoDeploy();
} else {
    console.log('\n💡 To auto-deploy, run: node fix-firebase-deploy.js --deploy');
}
