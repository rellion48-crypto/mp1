const fs = require('fs');
const path = require('path');

// Local fallback file path
const BUBBLE_FILE = path.join(process.cwd(), 'data', 'bubble_settings.json');

const DEFAULT_BUBBLES = [
    { id: 'b1', icon: '🍲', label: '한식조리 응시료 (14,500원)', query: '한식조리 접수비 얼마예요?', active: true, order: 1 },
    { id: 'b2', icon: '🚜', label: '지게차 상시 시험일정', query: '지게차 시험일정 언제예요?', active: true, order: 2 },
    { id: 'b3', icon: '💳', label: '50% 감면 혜택 (7,250원)', query: '기초생활수급자나 유공자 50% 감면 혜택 어떻게 받아요?', active: true, order: 3 },
    { id: 'b4', icon: '🪪', label: '필수 준비물 & 신분증', query: '시험 당일 필수 준비물이 뭐예요?', active: true, order: 4 },
    { id: 'b5', icon: '⏱️', label: 'CBT 당일 합격자 발표', query: '합격자 발표는 언제 나오나요?', active: true, order: 5 },
    { id: 'b6', icon: '📞', label: '어르신 무료 대리접수', query: '인터넷 접수가 어려운데 전화로 대신 접수해 주나요?', active: true, order: 6 }
];

// Ensure data directory and file exist
try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(BUBBLE_FILE)) {
        fs.writeFileSync(BUBBLE_FILE, JSON.stringify(DEFAULT_BUBBLES, null, 2), 'utf-8');
    }
} catch (e) {
    // ignore
}

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL || 'https://amlznptemtbkhyuzdkmu.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHpucHRlbXRia2h5dXpka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTU0MTIsImV4cCI6MjA1Nzg5MTQxMn0.LskNlS36Gv8Nq-lE6u9jS_x_4iB3rS2yJ8y_jL0_1qA';
    return { url, key };
}

async function saveToSupabase(bubbles) {
    const config = getSupabaseConfig();
    if (!config.url || !config.key) return null;

    try {
        const endpoint = `${config.url}/rest/v1/chatbot_bubble_settings?id=eq.global_bubbles`;
        const payload = {
            id: 'global_bubbles',
            bubbles: bubbles,
            updated_at: new Date().toISOString()
        };
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`,
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.warn('Supabase bubble save fallback:', e.message);
    }
    return null;
}

async function fetchFromSupabase() {
    const config = getSupabaseConfig();
    if (!config.url || !config.key) return null;

    try {
        const endpoint = `${config.url}/rest/v1/chatbot_bubble_settings?id=eq.global_bubbles&select=*`;
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': config.key,
                'Authorization': `Bearer ${config.key}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0 && Array.isArray(data[0].bubbles) && data[0].bubbles.length > 0) {
                return data[0].bubbles;
            }
        }
    } catch (e) {
        console.warn('Supabase bubble fetch fallback:', e.message);
    }
    return null;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        try {
            // 1. Try Supabase
            const supaBubbles = await fetchFromSupabase();
            if (supaBubbles && supaBubbles.length > 0) {
                return res.status(200).json({ success: true, bubbles: supaBubbles, source: 'supabase' });
            }

            // 2. Try Local File
            if (fs.existsSync(BUBBLE_FILE)) {
                const raw = fs.readFileSync(BUBBLE_FILE, 'utf-8');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return res.status(200).json({ success: true, bubbles: parsed, source: 'local' });
                }
            }

            // 3. Fallback to default
            return res.status(200).json({ success: true, bubbles: DEFAULT_BUBBLES, source: 'default' });
        } catch (e) {
            return res.status(200).json({ success: true, bubbles: DEFAULT_BUBBLES, source: 'default' });
        }
    }

    if (req.method === 'POST') {
        const { bubbles } = req.body || {};
        if (!Array.isArray(bubbles) || bubbles.length === 0) {
            return res.status(400).json({ error: 'Bubbles array is required' });
        }

        try {
            // 1. Save to Local File
            try {
                fs.writeFileSync(BUBBLE_FILE, JSON.stringify(bubbles, null, 2), 'utf-8');
            } catch (err) {
                // ignore
            }

            // 2. Save to Supabase
            await saveToSupabase(bubbles);

            return res.status(200).json({ success: true, count: bubbles.length });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to save bubbles', details: e.message });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
