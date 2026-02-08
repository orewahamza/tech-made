/**
 * Admin CLI Tool for tech-made
 * 
 * Usage:
 *   node admin-cli.js make-admin <username>   - Make a user an admin
 *   node admin-cli.js remove-admin <username> - Remove admin from user
 *   node admin-cli.js fix-users               - Add missing fields to all users
 *   node admin-cli.js list-users              - List all users
 *   node admin-cli.js user-info <username>    - Get info about a user
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI.includes('<db_password>') 
    ? process.env.MONGODB_URI.replace('<db_password>', 'hamza123')
    : process.env.MONGODB_URI;

// User Schema (same as server.js)
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    displayName: String,
    photoURL: String,
    username: { type: String, unique: true, sparse: true },
    userType: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    history: [{
        prompt: String,
        imageUrl: String,
        date: { type: Date, default: Date.now }
    }],
    settings: {
        aiTraining: { type: Boolean, default: true },
        notifications: { type: Boolean, default: true }
    },
    credits: { type: Number, default: 5 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function connect() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
}

async function disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
}

// ==================== COMMANDS ====================

async function makeAdmin(username) {
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const user = await User.findOneAndUpdate(
        { username: cleanUsername.toLowerCase() },
        { userType: 'admin' },
        { new: true }
    );
    
    if (!user) {
        console.log(`❌ User with username "${username}" not found.`);
        console.log('   Make sure the user has set their username first.');
        return false;
    }
    
    console.log(`✅ SUCCESS! User "${user.displayName}" (${user.username}) is now an ADMIN.`);
    return true;
}

async function removeAdmin(username) {
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const user = await User.findOneAndUpdate(
        { username: cleanUsername.toLowerCase() },
        { userType: 'user' },
        { new: true }
    );
    
    if (!user) {
        console.log(`❌ User with username "${username}" not found.`);
        return false;
    }
    
    console.log(`✅ User "${user.displayName}" (${user.username}) is no longer an admin.`);
    return true;
}

async function fixUsers() {
    console.log('🔧 Fixing all users with missing fields...\n');
    
    // Loop through all users and fix missing fields
    const users = await User.find({});
    let fixedCount = 0;
    
    for (const user of users) {
        let needsSave = false;
        
        if (user.userType === undefined || user.userType === null) {
            user.userType = 'user';
            needsSave = true;
        }
        if (user.isBlocked === undefined || user.isBlocked === null) {
            user.isBlocked = false;
            needsSave = true;
        }
        if (user.createdAt === undefined || user.createdAt === null) {
            user.createdAt = new Date();
            needsSave = true;
        }
        if (user.credits < 0) {
            user.credits = 0;
            needsSave = true;
        }
        
        if (needsSave) {
            await user.save();
            fixedCount++;
            console.log(`  ✓ Fixed: ${user.displayName || user.firebaseUid}`);
        }
    }
    
    console.log(`\n✅ Done! Fixed ${fixedCount} users.`);
    console.log(`📊 Total users in database: ${users.length}`);
}

async function listUsers() {
    const users = await User.find({}, {
        displayName: 1,
        username: 1,
        userType: 1,
        credits: 1,
        isBlocked: 1,
        createdAt: 1
    }).sort({ createdAt: -1 });
    
    console.log('\n📋 USER LIST\n' + '='.repeat(80));
    console.log(`${'Display Name'.padEnd(20)} | ${'Username'.padEnd(15)} | ${'Type'.padEnd(6)} | ${'Credits'.padEnd(7)} | Blocked`);
    console.log('-'.repeat(80));
    
    for (const user of users) {
        const name = (user.displayName || 'N/A').slice(0, 19).padEnd(20);
        const uname = (user.username || '---').padEnd(15);
        const type = (user.userType || 'user').padEnd(6);
        const credits = String(user.credits ?? 5).padEnd(7);
        const blocked = user.isBlocked ? '🚫 YES' : '---';
        console.log(`${name} | ${uname} | ${type} | ${credits} | ${blocked}`);
    }
    
    console.log('='.repeat(80));
    console.log(`Total: ${users.length} users`);
}

async function getUserInfo(username) {
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    const user = await User.findOne({ username: cleanUsername.toLowerCase() });
    
    if (!user) {
        console.log(`❌ User with username "${username}" not found.`);
        return;
    }
    
    console.log('\n📝 USER INFO\n' + '='.repeat(50));
    console.log(`Display Name: ${user.displayName}`);
    console.log(`Username:     ${user.username}`);
    console.log(`User Type:    ${user.userType}`);
    console.log(`Credits:      ${user.credits}`);
    console.log(`Blocked:      ${user.isBlocked ? 'YES' : 'NO'}`);
    console.log(`Firebase UID: ${user.firebaseUid}`);
    console.log(`Created:      ${user.createdAt?.toLocaleString() || 'Unknown'}`);
    console.log(`History:      ${user.history?.length || 0} generations`);
    console.log('='.repeat(50));
}

// ==================== MAIN ====================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase();
    const param = args[1];
    
    if (!command) {
        console.log(`
🛠️  tech-made ADMIN CLI
========================

Usage:
  node admin-cli.js <command> [parameter]

Commands:
  make-admin <username>   - Make a user an admin
  remove-admin <username> - Remove admin privileges
  fix-users               - Add missing fields to all existing users
  list-users              - Show all users in the database
  user-info <username>    - Get detailed info about a user

Examples:
  node admin-cli.js make-admin hamza
  node admin-cli.js fix-users
  node admin-cli.js list-users
        `);
        process.exit(0);
    }
    
    await connect();
    
    try {
        switch (command) {
            case 'make-admin':
                if (!param) {
                    console.log('❌ Please provide a username: node admin-cli.js make-admin <username>');
                } else {
                    await makeAdmin(param);
                }
                break;
                
            case 'remove-admin':
                if (!param) {
                    console.log('❌ Please provide a username: node admin-cli.js remove-admin <username>');
                } else {
                    await removeAdmin(param);
                }
                break;
                
            case 'fix-users':
                await fixUsers();
                break;
                
            case 'list-users':
                await listUsers();
                break;
                
            case 'user-info':
                if (!param) {
                    console.log('❌ Please provide a username: node admin-cli.js user-info <username>');
                } else {
                    await getUserInfo(param);
                }
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log('   Run "node admin-cli.js" without arguments to see available commands.');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    
    await disconnect();
}

main();
