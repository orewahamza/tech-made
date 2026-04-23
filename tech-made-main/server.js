import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Supabase ──────────────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY   // service key → bypasses RLS
);
console.log('✅ Supabase client initialized');

// ── Firebase Admin ────────────────────────────────────────
try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Firebase Admin via env variable');
    } else {
        const p = path.join(__dirname, 'serviceAccountKey.json');
        serviceAccount = JSON.parse(readFileSync(p, 'utf8'));
        console.log('✅ Firebase Admin via local file');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) {
    console.warn('⚠️  Firebase Admin not initialized:', e.message);
}

// ── Express ───────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ── OpenRouter ────────────────────────────────────────────
const OR_URL        = 'https://openrouter.ai/api/v1/chat/completions';
const OR_KEY        = process.env.OPENROUTER_API_KEY;
const OR_IMG_MODEL  = process.env.OPENROUTER_IMAGE_MODEL || 'black-forest-labs/flux.2-max';
const OR_CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL  || 'meta-llama/llama-4-maverick:free';

if (!OR_KEY) console.warn('⚠️  OPENROUTER_API_KEY not set');

// ── Helpers ───────────────────────────────────────────────
async function getUser(firebaseUid) {
    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();
    return data;
}

async function upsertUser(firebaseUid, fields = {}) {
    const { data, error } = await supabase
        .from('users')
        .upsert({ firebase_uid: firebaseUid, ...fields }, { onConflict: 'firebase_uid' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ── Health ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API OK' }));

// ── Generate Image ────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
    const { prompt, userId, model, ratio } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });

    let user = null;

    try {
        if (userId) {
            // Deduct credit atomically
            const { data: u } = await supabase
                .from('users')
                .select('id, credits')
                .eq('firebase_uid', userId)
                .single();

            if (!u) {
                // New user – create with 4 credits (5 - 1 for this gen)
                user = await upsertUser(userId, { credits: 4 });
            } else if (u.credits <= 0) {
                return res.status(403).json({ success: false, error: 'Insufficient credits' });
            } else {
                const { data: updated } = await supabase
                    .from('users')
                    .update({ credits: u.credits - 1 })
                    .eq('firebase_uid', userId)
                    .select()
                    .single();
                user = updated;
            }
        }

        const targetModel  = model || OR_IMG_MODEL;
        const finalPrompt  = ratio ? `${prompt} --ar ${ratio}` : prompt;

        const response = await fetch(OR_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OR_KEY}`,
                'Content-Type':  'application/json',
                'HTTP-Referer':  `${req.protocol}://${req.get('host')}`,
                'X-Title':       'tech-made AI Studio'
            },
            body: JSON.stringify({
                model: targetModel,
                messages: [{ role: 'user', content: `Generate a ultra-high-definition professional image of: ${finalPrompt}` }],
                modalities: ['image']
            })
        });

        const data = await response.json();

        if (data.error) {
            if (userId && user) await supabase.from('users').update({ credits: user.credits }).eq('firebase_uid', userId);
            return res.status(data.error.code || 500).json({ success: false, error: `[AI Engine] ${data.error.message}` });
        }

        // Extract image URL
        let imageUrl = null;
        const msg = data.choices?.[0]?.message;
        imageUrl = msg?.images?.[0]?.url || msg?.images?.[0]?.image_url?.url;
        if (!imageUrl && data.data?.[0]?.url) imageUrl = data.data[0].url;
        if (!imageUrl && msg?.content) {
            const m = msg.content.match(/https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?/i);
            if (m) imageUrl = m[0];
            else {
                const fb = msg.content.match(/https?:\/\/[^\s)]+/);
                if (fb) imageUrl = fb[0].replace(/[()]/g, '');
            }
        }

        if (!imageUrl) {
            if (userId && user) await supabase.from('users').update({ credits: user.credits }).eq('firebase_uid', userId);
            return res.status(500).json({ success: false, error: '[tech-made] No image URL found. Try again.' });
        }

        // Save to history
        if (userId && user) {
            await supabase.from('history').insert({ user_id: user.id, prompt, image_url: imageUrl });
            const { data: fresh } = await supabase.from('users').select('credits').eq('firebase_uid', userId).single();
            return res.json({ success: true, imageUrl, credits: fresh?.credits ?? user.credits - 1 });
        }

        return res.json({ success: true, imageUrl });

    } catch (error) {
        if (userId && user) await supabase.from('users').update({ credits: user.credits }).eq('firebase_uid', userId).catch(() => {});
        console.error('Generate error:', error);
        res.status(500).json({ success: false, error: 'Lost connection to AI engine.' });
    }
});

// ── Chat ──────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

    try {
        const messages = [
            { role: 'system', content: 'You are a helpful, friendly AI assistant on tech-made, an AI image generation platform. Help users with creative image prompts, art styles, and general questions. Be concise and engaging.' },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        const response = await fetch(OR_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OR_KEY}`,
                'Content-Type':  'application/json',
                'HTTP-Referer':  `${req.protocol}://${req.get('host')}`,
                'X-Title':       'tech-made AI Chat'
            },
            body: JSON.stringify({ model: OR_CHAT_MODEL, messages, max_tokens: 1024, temperature: 0.7 })
        });

        const data = await response.json();
        if (data.error) return res.status(500).json({ success: false, error: `[Chat] ${data.error.message}` });

        const aiResponse = data.choices?.[0]?.message?.content;
        if (!aiResponse) return res.status(500).json({ success: false, error: 'No response from AI.' });

        res.json({ success: true, response: aiResponse });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Chat connection error.' });
    }
});

// ── Sync User ─────────────────────────────────────────────
app.post('/api/user/sync', async (req, res) => {
    const { uid, displayName, photoURL } = req.body;
    try {
        const existing = await getUser(uid);
        const fields = {};

        if (!existing?.display_name && displayName) fields.display_name = displayName;
        if (!existing?.photo_url    && photoURL)    fields.photo_url    = photoURL;

        const user = await upsertUser(uid, fields);
        if (user.credits < 0) {
            await supabase.from('users').update({ credits: 0 }).eq('firebase_uid', uid);
            user.credits = 0;
        }

        res.json({ success: true, user: toClientUser(user) });
    } catch (e) {
        console.error('[Sync]', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Update Profile ────────────────────────────────────────
app.post('/api/user/update', async (req, res) => {
    const { uid, displayName, photoURL } = req.body;
    try {
        const fields = {};
        if (displayName !== undefined) fields.display_name = displayName;
        if (photoURL    !== undefined && photoURL !== null) fields.photo_url = photoURL;

        const { data, error } = await supabase
            .from('users')
            .update(fields)
            .eq('firebase_uid', uid)
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, user: toClientUser(data) });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Settings ──────────────────────────────────────────────
app.post('/api/user/settings', async (req, res) => {
    const { uid, settings } = req.body;
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ settings })
            .eq('firebase_uid', uid)
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, user: toClientUser(data) });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── History ───────────────────────────────────────────────
app.get('/api/user/history/:uid', async (req, res) => {
    try {
        const user = await getUser(req.params.uid);
        if (!user) return res.json({ success: true, history: [], credits: 5, settings: null });

        const { data: hist } = await supabase
            .from('history')
            .select('prompt, image_url, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        res.json({
            success:     true,
            history:     (hist || []).map(h => ({ prompt: h.prompt, imageUrl: h.image_url, date: h.created_at })),
            settings:    user.settings,
            credits:     Math.max(0, user.credits ?? 5),
            username:    user.username,
            userType:    user.user_type || 'user',
            displayName: user.display_name,
            photoURL:    user.photo_url
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Check Username ────────────────────────────────────────
app.get('/api/user/check-username/:username', async (req, res) => {
    try {
        const { data } = await supabase
            .from('users')
            .select('id')
            .eq('username', req.params.username.toLowerCase())
            .maybeSingle();
        res.json({ success: true, available: !data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Set Username ──────────────────────────────────────────
app.post('/api/user/set-username', async (req, res) => {
    const { uid, username } = req.body;
    try {
        const user = await getUser(uid);
        if (!user)          return res.status(404).json({ success: false, error: 'User not found' });
        if (user.username)  return res.status(400).json({ success: false, error: 'Username already set and cannot be changed.' });

        const clean = username.toLowerCase().trim();
        if (!/^[a-z0-9_]{3,20}$/.test(clean))
            return res.status(400).json({ success: false, error: 'Username must be 3-20 chars: lowercase letters, numbers, underscores.' });

        const { data: taken } = await supabase.from('users').select('id').eq('username', clean).maybeSingle();
        if (taken) return res.status(400).json({ success: false, error: 'Username is already taken.' });

        const { data, error } = await supabase
            .from('users')
            .update({ username: clean })
            .eq('firebase_uid', uid)
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, username: data.username });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── User Info ─────────────────────────────────────────────
app.get('/api/user/info/:uid', async (req, res) => {
    try {
        const user = await getUser(req.params.uid);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, userType: user.user_type || 'user', username: user.username, isBlocked: user.is_blocked || false });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Chat Sessions ─────────────────────────────────────────
app.post('/api/user/chats/save', async (req, res) => {
    const { uid, session } = req.body;
    try {
        const user = await upsertUser(uid);
        const { error } = await supabase
            .from('chat_sessions')
            .upsert({ id: session.id, user_id: user.id, title: session.title, messages: session.messages, updated_at: new Date() }, { onConflict: 'id' });
        if (error) throw error;

        const { data: chats } = await supabase
            .from('chat_sessions')
            .select('id, title, messages, created_at, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(20);

        res.json({ success: true, chats: chats || [] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/user/chats/delete', async (req, res) => {
    const { uid, sessionId } = req.body;
    try {
        const user = await getUser(uid);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        await supabase.from('chat_sessions').delete().eq('id', sessionId).eq('user_id', user.id);

        const { data: chats } = await supabase
            .from('chat_sessions')
            .select('id, title, messages, created_at, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        res.json({ success: true, chats: chats || [] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/user/chats/:uid', async (req, res) => {
    try {
        const user = await getUser(req.params.uid);
        if (!user) return res.json({ success: true, chats: [] });

        const { data: chats } = await supabase
            .from('chat_sessions')
            .select('id, title, messages, created_at, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(20);

        res.json({ success: true, chats: chats || [] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Admin Middleware ──────────────────────────────────────
async function isAdmin(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'No token' });

    try {
        const decoded = await admin.auth().verifyIdToken(auth.split('Bearer ')[1]);
        const user    = await getUser(decoded.uid);
        if (!user || user.user_type !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required' });
        req.adminUser = user;
        next();
    } catch (e) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

// ── Admin Stats ───────────────────────────────────────────
app.get('/api/admin/stats', isAdmin, async (_req, res) => {
    try {
        const [{ count: total }, { count: admins }, { count: blocked }, { data: credits }] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('user_type', 'admin'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
            supabase.from('users').select('credits')
        ]);
        const totalCredits = (credits || []).reduce((s, u) => s + (u.credits || 0), 0);
        res.json({ success: true, stats: { totalUsers: total, totalAdmins: admins, blockedUsers: blocked, totalCreditsInSystem: totalCredits } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Admin Users ───────────────────────────────────────────
app.get('/api/admin/users', isAdmin, async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('firebase_uid, display_name, username, user_type, credits, is_blocked, created_at, photo_url')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, users: (data || []).map(toAdminUser) });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/admin/user/block', isAdmin, async (req, res) => {
    const { targetUid, block } = req.body;
    try {
        const { error } = await supabase.from('users').update({ is_blocked: block }).eq('firebase_uid', targetUid);
        if (error) throw error;
        res.json({ success: true, isBlocked: block });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/admin/user/delete', isAdmin, async (req, res) => {
    const { targetUid } = req.body;
    try {
        const { error } = await supabase.from('users').delete().eq('firebase_uid', targetUid);
        if (error) throw error;
        res.json({ success: true, message: 'User deleted' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/admin/user/credits', isAdmin, async (req, res) => {
    const { targetUid, action, amount } = req.body;
    try {
        const user = await getUser(targetUid);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        let newCredits;
        if      (action === 'add')   newCredits = user.credits + amount;
        else if (action === 'set')   newCredits = Math.max(0, amount);
        else if (action === 'reset') newCredits = 0;
        else return res.status(400).json({ success: false, error: 'Invalid action' });

        const { data, error } = await supabase.from('users').update({ credits: newCredits }).eq('firebase_uid', targetUid).select().single();
        if (error) throw error;
        res.json({ success: true, credits: data.credits });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/admin/user/promote', isAdmin, async (req, res) => {
    const { targetUid } = req.body;
    try {
        const { data, error } = await supabase.from('users').update({ user_type: 'admin' }).eq('firebase_uid', targetUid).select().single();
        if (error) throw error;
        res.json({ success: true, userType: data.user_type });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Helpers: shape DB rows for client ────────────────────
function toClientUser(u) {
    if (!u) return null;
    return {
        displayName: u.display_name,
        photoURL:    u.photo_url,
        username:    u.username,
        userType:    u.user_type || 'user',
        isBlocked:   u.is_blocked || false,
        credits:     Math.max(0, u.credits ?? 5),
        settings:    u.settings || { aiTraining: true, notifications: true }
    };
}

function toAdminUser(u) {
    return {
        firebaseUid: u.firebase_uid,
        displayName: u.display_name,
        username:    u.username,
        userType:    u.user_type || 'user',
        credits:     u.credits ?? 5,
        isBlocked:   u.is_blocked || false,
        createdAt:   u.created_at,
        photoURL:    u.photo_url
    };
}

// ── SPA Fallback ──────────────────────────────────────────
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, error: 'Not found' });
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 tech-made on http://localhost:${PORT}`));
