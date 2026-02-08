import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// Note: You should place your serviceAccountKey.json in the project root
try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin Initialized');
} catch (error) {
    console.warn('⚠️ Firebase Admin initialization failed. Admin routes and token verification will be disabled until serviceAccountKey.json is provided.');
    console.error('Error details:', error.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.static(__dirname));



// MongoDB Connection (set MONGODB_URI in .env; do not commit real credentials)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes('<db_password>')) {
    console.warn('⚠️ MONGODB_URI missing or has placeholder. Set it in .env to enable database.');
}
if (MONGODB_URI && !MONGODB_URI.includes('<')) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ Connected to MongoDB Atlas'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// Dev-only health and debug endpoints to help diagnose API availability
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API OK' });
});

// Dev debug: return user count and sample list (ONLY enabled in non-production)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/users', async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();
            const users = await User.find({}, { firebaseUid: 1, displayName: 1, userType: 1 }).limit(20).sort({ createdAt: -1 });
            res.json({ success: true, totalUsers, users });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });
}

// Public (localhost-only) endpoint to return user count when admin APIs are unreachable
app.get('/api/public/users/count', async (req, res) => {
    try {
        const host = req.hostname || req.ip || '';
        // Only allow from localhost for safety
        if (!['localhost', '127.0.0.1'].some(h => host.includes(h))) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        const totalUsers = await User.countDocuments();
        res.json({ success: true, totalUsers });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// MongoDB Schemas
const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    displayName: String,
    photoURL: String,
    username: { type: String, unique: true, sparse: true }, // Unique username for admin commands
    userType: { type: String, enum: ['user', 'admin'], default: 'user' }, // User role
    isBlocked: { type: Boolean, default: false }, // Block status
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
    chats: [{
        id: String,
        title: String,
        messages: [{
            role: String,
            content: String
        }],
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// OpenRouter Config
const OPENROUTER_CONFIG = {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "black-forest-labs/flux.2-max",
    url: "https://openrouter.ai/api/v1/chat/completions"
};

/**
 * 🎨 API: Generate Image
 */
app.post('/api/generate', async (req, res) => {
    const { prompt, userId, model, ratio } = req.body;
    let user = null;
    
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });

    try {
        // 1. SECURITY FIX: Deduct credit FIRST to prevent race conditions
        if (userId) {
            // Find user and deduct credit, or create user with 4 credits (5 starting - 1 for this gen) if new
            user = await User.findOneAndUpdate(
                { firebaseUid: userId, credits: { $gt: 0 } },
                { $inc: { credits: -1 } },
                { new: true }
            );

            // If user doesn't exist yet in DB, create them with starting credits (minus this one)
            if (!user) {
                const checkUser = await User.findOne({ firebaseUid: userId });
                if (!checkUser) {
                    user = await User.create({
                        firebaseUid: userId,
                        credits: 4, // 5 starting - 1 used now
                        userType: 'user',
                        createdAt: new Date()
                    });
                } else {
                    return res.status(403).json({ success: false, error: 'Insufficient credits or account issue' });
                }
            }
        }

        const targetModel = model || OPENROUTER_CONFIG.model;
        const finalPrompt = ratio ? `${prompt} --ar ${ratio}` : prompt;

        // High-compatibility request format
        const response = await fetch(OPENROUTER_CONFIG.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': `${req.protocol}://${req.get('host')}`,
                'X-Title': 'Tech-Image AI Studio'
            },
            body: JSON.stringify({
                model: targetModel,
                messages: [
                    {
                        role: "user",
                        content: `Generate a ultra-high-definition professional image of: ${finalPrompt}`
                    }
                ],
                modalities: ["image"]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            // REFUND credit if AI fails
            if (userId) {
                await User.updateOne({ firebaseUid: userId }, { $inc: { credits: 1 } });
            }
            console.error('OpenRouter Error:', JSON.stringify(data.error, null, 2));
            const errMsg = data.error.message || 'AI Generation Engine Error';
            return res.status(data.error.code || 500).json({ 
                success: false, 
                error: `[AI Engine] ${errMsg}` 
            });
        }
        
        // Comprehensive Extraction Logic
        let imageUrl = null;
        const message = data.choices?.[0]?.message;

        // Strategy A: Standard Images Array
        imageUrl = message?.images?.[0]?.url || message?.images?.[0]?.image_url?.url;
        
        // Strategy B: OpenAI Data Array
        if (!imageUrl && data.data?.[0]?.url) {
            imageUrl = data.data[0].url;
        }

        // Strategy C: Markdown/Plaintext URL Detection
        if (!imageUrl && message?.content) {
            const urlMatch = message.content.match(/https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?/i);
            if (urlMatch) imageUrl = urlMatch[0];
            else {
                // Last ditch effort: find any http link
                const fallbackMatch = message.content.match(/https?:\/\/[^\s)]+/);
                if (fallbackMatch) imageUrl = fallbackMatch[0].replace(/[()]/g, '');
            }
        }

        if (imageUrl) {
            // Save to history (credit was already deducted)
            if (userId) {
                const updatedUser = await User.findOneAndUpdate(
                    { firebaseUid: userId },
                    { 
                        $push: { history: { $each: [{ prompt, imageUrl }], $position: 0, $slice: 20 } }
                    },
                    { new: true }
                );
                return res.json({ success: true, imageUrl, credits: updatedUser.credits });
            }
            return res.json({ success: true, imageUrl });
        } else {
            // REFUND credit if extraction fails
            if (userId) {
                await User.updateOne({ firebaseUid: userId }, { $inc: { credits: 1 } });
            }
            console.error('Extraction Failed. Full Data Received:', JSON.stringify(data, null, 2));
            return res.status(500).json({ 
                success: false, 
                error: '[Tech-Image] The AI model responded but No image URL was found. Please try again or change the prompt.' 
            });
        }
    } catch (error) {
        // REFUND credit if fatal error
        if (userId) {
            await User.updateOne({ firebaseUid: userId }, { $inc: { credits: 1 } });
        }
        console.error('Fatal API Error:', error);
        res.status(500).json({ success: false, error: 'Lost connection to AI engine. Check your internet or API key balance.' });
    }
});

/**
 * 💬 API: Chat with AI (Text Generation)
 */
app.post('/api/chat', async (req, res) => {
    const { message, history = [], userId } = req.body;
    
    if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

    try {
        // Build conversation messages from history
        const messages = [
            {
                role: "system",
                content: "You are a helpful, friendly AI assistant on Tech-Image, an AI image generation platform. You can help users with their questions, provide creative suggestions for image prompts, discuss art and technology, and assist with general inquiries. Be conversational, helpful, and engaging. Keep responses concise but informative."
            },
            ...history.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: "user",
                content: message
            }
        ];

        const response = await fetch(OPENROUTER_CONFIG.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': `${req.protocol}://${req.get('host')}`,
                'X-Title': 'Tech-Image AI Chat'
            },
            body: JSON.stringify({
                // Chat model (free tier) via OpenRouter
                model: "google/gemini-2.0-flash-exp:free",
                messages: messages,
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Chat API Error:', JSON.stringify(data.error, null, 2));
            const errMsg = data.error.message || 'Chat AI Engine Error';
            return res.status(data.error.code || 500).json({ 
                success: false, 
                error: `[Chat Engine] ${errMsg}` 
            });
        }

        const aiResponse = data.choices?.[0]?.message?.content;
        
        if (aiResponse) {
            return res.json({ 
                success: true, 
                response: aiResponse,
                model: "openai/gpt-oss-120b:free"
            });
        } else {
            console.error('No response content:', JSON.stringify(data, null, 2));
            return res.status(500).json({ 
                success: false, 
                error: 'AI did not generate a response. Please try again.' 
            });
        }
    } catch (error) {
        console.error('Chat API Fatal Error:', error);
        res.status(500).json({ success: false, error: 'Lost connection to chat AI. Check your internet connection.' });
    }
});

/**
 * 👤 API: Sync User Data
 */
app.post('/api/user/sync', async (req, res) => {
    const { uid, displayName, photoURL } = req.body;
    try {
        // First, ensure existing users don't have negative credits
        await User.updateOne(
            { firebaseUid: uid, credits: { $lt: 0 } },
            { $set: { credits: 0 } }
        );

        // Find existing user record
        const existingUser = await User.findOne({ firebaseUid: uid });
        
        const updateData = {};
        
        // 1. Name Sync: Only update from Firebase if DB name is missing
        if (!existingUser || !existingUser.displayName) {
            if (displayName) {
                updateData.displayName = displayName;
                console.log(`[Sync] Initializing Name for ${uid}: ${displayName}`);
            }
        }

        // 2. PFP Sync: Only update from Firebase if DB photo is missing
        if (!existingUser || !existingUser.photoURL) {
            if (photoURL) {
                updateData.photoURL = photoURL;
                console.log(`[Sync] Initializing PFP for ${uid}: Found existing external image.`);
            }
        }

        // Apply updates if any
        let user = existingUser;
        if (Object.keys(updateData).length > 0 || !existingUser) {
            user = await User.findOneAndUpdate(
                { firebaseUid: uid },
                { 
                    $set: updateData,
                    $setOnInsert: { 
                        credits: 5,
                        userType: 'user',
                        isBlocked: false,
                        createdAt: new Date()
                    } 
                },
                { upsert: true, new: true }
            );
        }

        // Triple-safety: Clamp credits in the response object
        if (user && user.credits < 0) {
            user.credits = 0;
        }

        res.json({ success: true, user });
    } catch (err) {
        console.error('[Sync] Fatal error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🛠️ API: Update Profile
 */
app.post('/api/user/update', async (req, res) => {
    const { uid, displayName, photoURL } = req.body;
    try {
        console.log(`[Update] Saving profile for ${uid}. Name: ${displayName}, Photo size: ${photoURL ? photoURL.length : 0} bytes`);
        
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (photoURL !== undefined && photoURL !== null) updateData.photoURL = photoURL;

        const user = await User.findOneAndUpdate(
            { firebaseUid: uid },
            { $set: updateData },
            { new: true, upsert: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Update] Failed to save profile:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * ⚙️ API: Update Settings
 */
app.post('/api/user/settings', async (req, res) => {
    const { uid, settings } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid: uid },
            { settings },
            { new: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 💰 API: Deduct Credit
 */
app.post('/api/user/credits/deduct', async (req, res) => {
    const { uid } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid: uid, credits: { $gt: 0 } },
            { $inc: { credits: -1 } },
            { new: true }
        );
        if (!user) {
            return res.status(403).json({ success: false, error: 'Insufficient credits' });
        }
        res.json({ success: true, credits: user.credits });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 📜 API: Get History
 */
app.get('/api/user/history/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.uid });
        res.json({ 
            success: true, 
            history: user?.history || [], 
            settings: user?.settings,
            credits: Math.max(0, user?.credits ?? 5),
            username: user?.username,
            userType: user?.userType || 'user',
            displayName: user?.displayName,
            photoURL: user?.photoURL
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🔖 API: Check Username Availability
 */
app.get('/api/user/check-username/:username', async (req, res) => {
    try {
        const existing = await User.findOne({ username: req.params.username.toLowerCase() });
        res.json({ success: true, available: !existing });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🔖 API: Set Username (One-time only)
 */
app.post('/api/user/set-username', async (req, res) => {
    const { uid, username } = req.body;
    try {
        const user = await User.findOne({ firebaseUid: uid });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        if (user.username) return res.status(400).json({ success: false, error: 'Username already set. It cannot be changed.' });
        
        const cleanUsername = username.toLowerCase().trim();
        if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
            return res.status(400).json({ success: false, error: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only.' });
        }
        
        const existing = await User.findOne({ username: cleanUsername });
        if (existing) return res.status(400).json({ success: false, error: 'Username is already taken.' });
        
        user.username = cleanUsername;
        await user.save();
        res.json({ success: true, username: user.username });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🛡️ API: Get User Info (for admin check)
 */
app.get('/api/user/info/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.uid });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ 
            success: true, 
            userType: user.userType || 'user',
            username: user.username,
            isBlocked: user.isBlocked || false
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 💬 API: Save Chat Session
 */
app.post('/api/user/chats/save', async (req, res) => {
    const { uid, session } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid: uid },
            { 
                $setOnInsert: { credits: 5, userType: 'user', createdAt: new Date() }
            },
            { upsert: true, new: true }
        );

        // Update existing session or add new one
        const sessionIndex = user.chats.findIndex(s => s.id === session.id);
        if (sessionIndex >= 0) {
            user.chats[sessionIndex] = session;
        } else {
            user.chats.unshift(session);
            if (user.chats.length > 20) user.chats = user.chats.slice(0, 20);
        }

        await user.save();
        res.json({ success: true, chats: user.chats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 💬 API: Delete Chat Session
 */
app.post('/api/user/chats/delete', async (req, res) => {
    const { uid, sessionId } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid: uid },
            { $pull: { chats: { id: sessionId } } },
            { new: true }
        );
        res.json({ success: true, chats: user.chats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 💬 API: Get Chat Sessions
 */
app.get('/api/user/chats/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.uid });
        res.json({ success: true, chats: user?.chats || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==================== ADMIN APIs ====================

/**
 * 🛡️ Middleware: Check if user is admin
 */
/**
 * 🛡️ Middleware: Verify Firebase ID Token and check if user is admin
 */
async function isAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // Verify the ID token using Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;

        // Check user type in MongoDB
        const user = await User.findOne({ firebaseUid });
        if (!user || user.userType !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        req.admin = user;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ success: false, error: 'Unauthorized or invalid token' });
    }
}

/**
 * 📊 API: Admin Dashboard Stats
 */
app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ userType: 'admin' });
        const blockedUsers = await User.countDocuments({ isBlocked: true });
        const totalCreditsUsed = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$credits' } } }
        ]);
        console.log('Admin stats computed:', { totalUsers, totalAdmins, blockedUsers, totalCreditsInSystem: totalCreditsUsed[0]?.total || 0 });
        res.json({ 
            success: true, 
            stats: {
                totalUsers,
                totalAdmins,
                blockedUsers,
                totalCreditsInSystem: totalCreditsUsed[0]?.total || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 📋 API: Get All Users (Admin)
 */
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, {
            firebaseUid: 1,
            displayName: 1,
            username: 1,
            userType: 1,
            credits: 1,
            isBlocked: 1,
            createdAt: 1,
            photoURL: 1
        }).sort({ createdAt: -1 });
        
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🚫 API: Block/Unblock User
 */
app.post('/api/admin/user/block', isAdmin, async (req, res) => {
    const { targetUid, block } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid: targetUid },
            { isBlocked: block },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, isBlocked: user.isBlocked });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🗑️ API: Delete User
 */
app.post('/api/admin/user/delete', isAdmin, async (req, res) => {
    const { targetUid } = req.body;
    try {
        const result = await User.deleteOne({ firebaseUid: targetUid });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 💰 API: Modify User Credits
 */
app.post('/api/admin/user/credits', isAdmin, async (req, res) => {
    const { targetUid, action, amount } = req.body;
    try {
        let update;
        if (action === 'add') update = { $inc: { credits: amount } };
        else if (action === 'set') update = { $set: { credits: Math.max(0, amount) } };
        else if (action === 'reset') update = { $set: { credits: 0 } };
        else return res.status(400).json({ success: false, error: 'Invalid action' });
        
        const user = await User.findOneAndUpdate({ firebaseUid: targetUid }, update, { new: true });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, credits: user.credits });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 👑 API: Promote to Admin
 */
app.post('/api/admin/user/promote', isAdmin, async (req, res) => {
    const { targetUid } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { firebaseUid: targetUid },
            { userType: 'admin' },
            { new: true }
        );
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, userType: user.userType });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ========= SPA Fallback =========
// Allow clean client-side routes like /home, /chat, /image-generations, etc.
// Any non-API route that isn't a static asset will serve index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Tech-Image Server at http://localhost:${PORT}`);
});
