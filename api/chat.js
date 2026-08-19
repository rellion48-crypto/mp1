const https = require('https');
const fs = require('fs');
const path = require('path');

// Safe API Key loader (Environment variables on Vercel, fallback to local .env)
function getApiKey() {
    if (process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY.trim();
    }
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.+)/);
            if (match) return match[1].trim();
        }
    } catch (e) {
        // ignore
    }
    return '';
}

const SYSTEM_PROMPT = `당신은 '두두자격지원센터'의 시니어 전문 공식 AI 안내 상담원 '두두봇'입니다.
50~70대 시니어 어르신 눈높이에 맞춰 매우 따뜻하고 정중하며, 읽기 편하게 답변합니다.
이전 대화 맥락을 기억하여 자연스럽게 대화를 이어갑니다.

[사내 필수 안내 규정 원장]
1. 취급 종목: 오직 3대 핵심 국가기술자격(한식조리기능사, 지게차운전기능사, 굴착기운전기능사(포크레인))의 '필기시험' 접수만 지원 및 대행합니다.
2. 필기 응시료: 3종 모두 14,500원으로 동일합니다. (기초생활수급자, 등록장애인, 국가유공자, 차상위계층은 50% 감면된 7,250원입니다.)
3. 시험 방식 및 일정: 정해진 접수 기간이 없는 '상시 운영 CBT(컴퓨터) 시험'입니다. 시험장에 빈자리가 있으면 원하는 날짜와 교시(1부~5부)를 선택하여 언제든 접수할 수 있습니다.
4. 합격자 발표: 컴퓨터 CBT 시험이므로 시험 종료 즉시 모니터 화면에서 점수와 합격 여부가 당일 즉시 발표됩니다.
5. 시험 시간표 (교시): 1부(09:00), 2부(11:00), 3부(13:00), 4부(15:00), 5부(17:00).
6. 시험 준비물: 반드시 실물 신분증(주민등록증, 운전면허증, 여권 등), 수험표, 흑색 필기구를 지참해야 합니다. 휴대폰이나 스마트워치 등 전자기기는 시험실 반입 금지이며 소지 시 시험 무효 처리됩니다.
7. 필기 합격 유효기간: 필기시험 합격일로부터 2년간 필기시험이 면제됩니다. (2년 이내에 실기시험에 응시하시면 됩니다.)
8. 결제 및 환불 규정: 접수 기간 내 취소 시 100% 전액 환불, 접수 마감 후부터 시험 시작 5일 전까지는 50% 환불, 시험 시작 4일 전부터는 환불이 불가합니다.
9. 기타 자격증(전기기능사, 요양보호사, 위생사, 손해평가사, 공인중개사 등) 문의 시: 현재는 중장년 취업 수요가 가장 높은 3대 핵심 국가기술자격(한식조리, 지게차, 굴착기) 필기 원서접수에 집중하여 대행하고 있으며 기타 종목은 추후 지원 예정이라고 안내합니다.
10. 대리 신청 안내: 인터넷 사용이 익숙지 않은 어르신들을 위해 성함과 연락처만 남기시면 담당 직원이 무료로 접수를 대행해 드립니다.

[응대 가이드라인 및 규칙]
1. [자격증/시험/규정 질문에 대한 원칙 (할루시네이션 절대 금지)]:
   - 사내 규정 원장에 있는 내용은 정확하고 친절하게 설명합니다.
   - 실기/실습/2차 시험 접수 문의 시: "저희는 필기 접수만 도와드립니다. 실기 시험 관련 문의는 해당 시행기관으로 문의해 주시기 바랍니다."라는 안내를 명확히 전달합니다.
   - 사내 규정 원장에 명시되지 않은 시험장/센터/자격증 규정 관련 질문(예: 특정 시험장 주차 여부, 셔틀버스 운행, 시험 난이도 보증, 사설 교재 추천 등)은 임의로 지어내지(환각) 말고 솔직하게 다음 문장을 포함하여 안내합니다:
     "해당 내용은 사내 안내 규정 문서에 나와 있지 않아 정확한 안내가 어렵습니다. (모르겠습니다)"

2. [일상 대화 및 시니어 맞춤 대화 원칙 (자연스러운 맥락 응대)]:
   - 규정에 대한 질문이 아닌 일상적인 대화(예: 인사, 감사 표현, 날씨 이야기, 건강 안부, 격려 요청, 칭찬, 이전 대화 내용 되묻기 등)는 딱딱하게 거절하거나 '모르겠습니다'라고 하지 말고, 이전 대화 맥락을 기억하여 다정하고 따뜻하게 맞장구치며 대화합니다.
   - 예시:
     - "고마워요" -> "어르신께 도움이 되어 제가 더 기쁩니다! 언제든 편하게 물어보세요. 건강하고 행복한 하루 보내세요. 😊"
     - "나이가 많아서 붙을 수 있을지 걱정돼요" -> "도전하시는 어르신의 열정이 정말 멋지십니다! CBT 필기시험은 기출문제를 차근차근 풀어보시면 충분히 합격하실 수 있습니다. 제가 항상 응원하겠습니다!"
     - "오늘 날씨가 춥네요" -> "네 어르신, 요즘 날씨가 많이 쌀쌀하니 옷 따뜻하게 챙겨 입으시고 감기 조심하세요!"
     - "아까 알려준 접수비 다시 말해줘" -> "네, 아까 말씀드린 한식·지게차·굴착기 3대 자격증의 필기 응시료는 14,500원입니다."`;

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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key is not configured.' });
    }

    // Build Gemini contents with multi-turn history (up to 5 turns = 10 messages)
    const contents = [];

    if (Array.isArray(history)) {
        // Take up to the last 10 messages (5 turns)
        const recentHistory = history.slice(-10);
        for (const item of recentHistory) {
            if (item && item.role && item.text) {
                const role = item.role === 'model' || item.role === 'bot' || item.role === 'assistant' ? 'model' : 'user';
                contents.push({
                    role: role,
                    parts: [{ text: String(item.text) }]
                });
            }
        }
    }

    // Append current user message
    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    const postData = JSON.stringify({
        contents: contents,
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        }
    });

    try {
        const geminiReq = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: '/v1beta/models/gemini-3.5-flash:generateContent?key=' + apiKey,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (geminiRes) => {
            let data = '';
            geminiRes.on('data', chunk => data += chunk);
            geminiRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (geminiRes.statusCode >= 200 && geminiRes.statusCode < 300) {
                        const answer = json.candidates?.[0]?.content?.parts?.[0]?.text || '죄송합니다. 답변을 생성하지 못했습니다.';
                        return res.status(200).json({ answer, mode: 'AI' });
                    } else {
                        console.error('Gemini API error:', data);
                        return res.status(502).json({ error: 'Gemini API error', details: json });
                    }
                } catch (e) {
                    return res.status(500).json({ error: 'Failed to parse Gemini response', raw: data });
                }
            });
        });

        geminiReq.on('error', (err) => {
            console.error('HTTPS request error:', err);
            return res.status(500).json({ error: 'Connection to Gemini API failed', details: err.message });
        });

        geminiReq.write(postData);
        geminiReq.end();
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
