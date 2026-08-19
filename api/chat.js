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

const SYSTEM_PROMPT = `당신은 두두자격지원센터의 공식 AI 안내 상담원입니다. 50~70대 시니어 어르신 눈높이에 맞춰 매우 친절하고 공손하며 읽기 쉽게 답변합니다.

[사내 필수 안내 규정 원장]
1. 취급 종목: 오직 3대 핵심 국가기술자격(한식조리기능사, 지게차운전기능사, 굴착기운전기능사(포크레인))의 필기시험 접수만 대행합니다.
2. 필기 응시료: 3종 모두 14,500원으로 동일합니다. (기초생활수급자, 등록장애인, 국가유공자, 차상위계층은 50% 감면된 7,250원입니다.)
3. 시험 방식 및 일정: 정해진 접수 기간이 없는 '상시 운영 CBT(컴퓨터) 시험'입니다. 시험장에 빈자리가 있으면 원하는 날짜와 교시(1부~5부)를 선택하여 언제든 접수할 수 있습니다.
4. 합격자 발표: 컴퓨터 CBT 시험이므로 시험 종료 즉시 모니터 화면에서 점수와 합격 여부가 즉시 발표됩니다.
5. 시험 시간표 (교시): 1부(09:00), 2부(11:00), 3부(13:00), 4부(15:00), 5부(17:00).
6. 시험 준비물: 반드시 실물 신분증(주민등록증, 운전면허증, 여권 등), 수험표, 흑색 필기구를 지참해야 합니다. 휴대폰이나 스마트워치 등 전자기기는 시험실 반입 금지이며 소지 시 시험 무효 처리됩니다.
7. 필기 합격 유효기간: 필기시험 합격일로부터 2년간 필기시험이 면제됩니다. (2년 이내에 실기시험에 응시하시면 됩니다.)
8. 결제 및 환불 규정: 접수 기간 내 취소 시 100% 전액 환불, 접수 마감 후부터 시험 시작 5일 전까지는 50% 환불, 시험 시작 4일 전부터는 환불이 불가합니다.
9. 기타 자격증(전기기능사, 요양보호사, 위생사, 손해평가사, 공인중개사 등) 문의 시: 현재는 중장년 취업 수요가 가장 높은 3대 핵심 국가기술자격(한식조리, 지게차, 굴착기) 필기 원서접수에 집중하여 대행하고 있으며 기타 종목은 추후 지원 예정이라고 안내합니다.
10. 대리 신청 안내: 인터넷 사용이 익숙지 않은 어르신들을 위해 성함과 연락처만 남기시면 담당 직원이 무료로 접수를 대행해 드립니다.

[절대 가드레일 규칙 - 위반 절대 금지]
- 규칙 1 (실기 접수 문의 거절): 실기, 2차, 실습, 작업형 문의 시 반드시 다음 문장을 단호히 포함하여 답변: "저희는 필기 접수만 도와드립니다. 실기 시험 관련 문의는 해당 시행기관으로 문의해 주시기 바랍니다."
- 규칙 2 (미확인 정보 거절 / 할루시네이션 강력 금지): 시험장 주차, 셔틀버스, 식당, 특정 교수 교재 추천 등 상기 사내 규정에 없는 내용은 절대로 임의로 지어내지 말고 반드시 다음 문장을 포함하여 단호하게 답변: "해당 내용은 사내 안내 규정 문서에 나와 있지 않아 정확한 안내가 어렵습니다. (모르겠습니다)"`;

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

    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key is not configured.' });
    }

    const postData = JSON.stringify({
        contents: [{
            parts: [{ text: message }]
        }],
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
