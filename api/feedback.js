const fs = require('fs');
const path = require('path');
const https = require('https');

// Local fallback file path
const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback_logs.json');

// Ensure data directory exists
try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(FEEDBACK_FILE)) {
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
} catch (e) {
    // ignore
}

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL || 'https://amlznptemtbkhyuzdkmu.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHpucHRlbXRia2h5dXpka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTU0MTIsImV4cCI6MjA1Nzg5MTQxMn0.LskNlS36Gv8Nq-lE6u9jS_x_4iB3rS2yJ8y_jL0_1qA';
    return { url, key };
}

async function saveToSupabase(payload) {
    const config = getSupabaseConfig();
    if (!config.url || !config.key) return null;

    try {
        const endpoint = `${config.url}/rest/v1/chatbot_feedback`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.warn('Supabase feedback save fallback:', e.message);
    }
    return null;
}

async function fetchFromSupabase() {
    const config = getSupabaseConfig();
    if (!config.url || !config.key) return null;

    try {
        const endpoint = `${config.url}/rest/v1/chatbot_feedback?select=*&order=created_at.desc&limit=200`;
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`
            }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.warn('Supabase feedback fetch fallback:', e.message);
    }
    return null;
}

function readLocalFeedback() {
    try {
        if (fs.existsSync(FEEDBACK_FILE)) {
            return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
        }
    } catch (e) {
        // ignore
    }
    return [];
}

function appendLocalFeedback(item) {
    try {
        const list = readLocalFeedback();
        list.unshift(item);
        if (list.length > 500) list.length = 500;
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
        // ignore
    }
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        let list = await fetchFromSupabase();
        if (!list || list.length === 0) {
            list = readLocalFeedback();
        }
        return res.status(200).json({ success: true, data: list || [] });
    }

    if (req.method === 'POST') {
        const body = req.body || {};
        const { question, answer, rating, mode, details } = body;

        if (!question || !rating) {
            return res.status(400).json({ success: false, error: 'question and rating are required' });
        }

        const feedbackItem = {
            id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            question: String(question).slice(0, 500),
            answer: String(answer || '').slice(0, 1000),
            rating: rating === 'positive' || rating === 1 ? 'positive' : 'negative',
            mode: mode || 'AI',
            details: details || '',
            created_at: new Date().toISOString()
        };

        // 1. Supabase 저장 시도
        const sbResult = await saveToSupabase(feedbackItem);

        // 2. 로컬 파일 저장
        appendLocalFeedback(feedbackItem);

        return res.status(200).json({
            success: true,
            data: sbResult || feedbackItem,
            message: '피드백이 성공적으로 등록되었습니다.'
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
