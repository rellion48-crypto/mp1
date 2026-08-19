/**
 * 두두자격지원센터 - 시니어 3대 핵심 국가기술자격 AI 안내 챗봇 (두두봇)
 * - 집중 3종: 한식조리기능사, 지게차운전기능사, 굴착기운전기능사 (상시 CBT)
 * - 사내 안내 규정 문서 기반 정밀 응답
 * - 시니어 맞춤 유의어 사전 (접수비, 포크레인, 1차, 이론 등)
 * - 철저한 환각 방지 (실기 접수 거절, 미확인 항목 단호한 '모르겠습니다' 답변)
 * - Supabase faq_documents 실시간 동기화
 */

const SUPABASE_CONFIG = {
    URL: "https://amlznptemtbkhyuzdkmu.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHpucHRlbXRia2h5dXpka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzcxMTQsImV4cCI6MjEwMjY1MzExNH0.DY_P3C5G136AuhSYAn7RvMKQfEOPxKmN-wI__f3fjfg"
};

// Supabase 전역 클라이언트 인스턴스 초기화 (싱글톤)
if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function' && !window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
}

const DEFAULT_FAQ_KNOWLEDGE = [
    {
        id: 1,
        category: '응시료',
        qualification: '3대 기능사 공통 (한식, 지게차, 굴착기)',
        question: '한식조리, 지게차, 굴착기운전기능사 필기 응시료는 얼마인가요?',
        keywords: '응시료,접수비,시험비,비용,얼마,한식,한식조리,지게차,굴착기,포크레인,수수료,돈,기능사,금액,얼마예요',
        answer: '어르신, 한식조리기능사, 지게차운전기능사, 굴착기운전기능사 3종 모두 필기 응시료는 14,500원으로 동일합니다. (기초수급자/장애인/국가유공자/차상위는 50% 감면된 7,250원입니다.)',
        is_unknown: false
    },
    {
        id: 2,
        category: '일정/방식',
        qualification: '3대 기능사 공통 (상시 CBT)',
        question: '접수 기간과 시험 방식은 어떻게 되나요?',
        keywords: '일정,접수기간,언제,시험일,상시,cbt,컴퓨터,시험방식,기간,접수날짜',
        answer: '한식조리, 지게차, 굴착기 3개 자격증은 정해진 기간 없이 상시로 운영됩니다. 컴퓨터(CBT)로 시험을 치르며 시험장에 자리가 있으면 원하시는 날짜와 교시(1부~5부)를 선택하여 언제든 접수하실 수 있습니다.',
        is_unknown: false
    },
    {
        id: 3,
        category: '합격발표',
        qualification: '3대 기능사 공통',
        question: '합격자 발표는 언제 나오나요?',
        keywords: '합격,발표,합격자,합격발표,당일,언제나와,결과,점수',
        answer: '컴퓨터 CBT 시험이므로 시험 종료 버튼을 누르시는 즉시 모니터 화면에서 본인의 점수와 합격 여부를 그 자리에서 바로 확인하실 수 있습니다.',
        is_unknown: false
    },
    {
        id: 4,
        category: '시험시간',
        qualification: '3대 기능사 공통',
        question: '하루에 몇 부(교시)까지 시험이 있나요?',
        keywords: '시간,시간대,교시,부,몇부,1부,2부,3부,4부,5부,몇시',
        answer: '상시 CBT 시험은 하루 총 5부(1부 09:00, 2부 11:00, 3부 13:00, 4부 15:00, 5부 17:00)로 나누어 진행됩니다. 원서접수 시 편하신 시간대로 선택하실 수 있습니다.',
        is_unknown: false
    },
    {
        id: 5,
        category: '시험준비물',
        qualification: '공통',
        question: '시험 당일 준비물 및 지참물은 무엇인가요?',
        keywords: '준비물,신분증,수험표,필기구,시계,계산기,스마트폰,휴대폰,지참물,가져갈것,안가져가면,신분증안가져가면,신분증없으면,신분증필요',
        answer: '시험 당일 반드시 실물 신분증(주민등록증, 운전면허증, 여권 등), 수험표, 흑색 필기구를 지참하셔야 합니다. 휴대폰, 스마트워치 등 전자기기는 시험실 반입 금지이며 소지 시 시험이 무효 처리됩니다.',
        is_unknown: false
    },
    {
        id: 6,
        category: '유효기간',
        qualification: '3대 기능사 공통',
        question: '필기시험 합격 후 유효기간은 얼마나 되나요?',
        keywords: '유효기간,필기합격,면제,기간,몇년,유효,필기합격후,실기언제',
        answer: '필기시험 합격일로부터 2년간 필기시험이 면제됩니다. 2년 이내에 실기시험에 응시하여 합격하시면 최종 자격증이 발급됩니다.',
        is_unknown: false
    },
    {
        id: 7,
        category: '결제/환불',
        qualification: '공통',
        question: '환불 규정 및 취소 기간은 어떻게 되나요?',
        keywords: '환불,취소,돈돌려,환불금,취소기간,100%,50%,환불규정',
        answer: '원서접수 기간 내 취소 시 100% 전액 환불되며, 접수 마감 후부터 시험 시작 5일 전까지는 50% 환불됩니다. 시험 시작 4일 전부터는 환불이 불가합니다.',
        is_unknown: false
    },
    {
        id: 8,
        category: '접수방법',
        qualification: '공통',
        question: '인터넷 접수가 어려운데 어떻게 접수하나요?',
        keywords: '접수방법,신청방법,인터넷접수어려워,대리접수,대리신청,도와줘요,전화접수신청,원서접수대행',
        answer: '저희 두두자격지원센터에서는 인터넷 사용이 익숙지 않은 어르신들을 위해 성함과 연락처만 남겨주시면 시험장 배정과 원서접수를 무료로 대행해 드립니다.',
        is_unknown: false
    },
    {
        id: 9,
        category: '기타자격증',
        qualification: '기타 종목 문의 (전기/요양/공인중개사 등)',
        question: '전기기능사, 요양보호사, 공인중개사 등 다른 자격증도 접수되나요?',
        keywords: '전기,전기기능사,요양보호사,요양사,위생사,손해평가사,공인중개사,부동산,다른자격증,기타',
        answer: '저희 센터는 현재 중장년 어르신 취업에 가장 수요가 높은 3대 핵심 국가기술자격(한식조리, 지게차운전, 굴착기운전기능사) 필기 원서접수에 집중하여 전문 지원해 드리고 있습니다. (기타 종목은 추후 지원 예정입니다.)',
        is_unknown: false
    },
    {
        id: 10,
        category: '확인불가',
        qualification: '공통',
        question: '시험장에 주차 되나요?',
        keywords: '주차,주차장,차량,주차가능,차,주차되나요',
        answer: '시험장별 주차 가능 여부는 사내 규정 원장에서 확인되지 않아 정확한 안내가 어렵습니다. (모르겠습니다)',
        is_unknown: true
    }
];

// 시니어 어르신 유의어 사전
const SENIOR_SYNONYMS = {
    '접수비': '응시료',
    '시험비': '응시료',
    '돈 얼마': '응시료',
    '얼마예요': '응시료',
    '비용': '응시료',
    '수수료': '응시료',
    '포크레인': '굴착기',
    '요양사': '요양보호사',
    '지게차 면허': '지게차',
    '1차': '필기',
    '이론': '필기',
    '쓰는 거': '필기',
    '2차': '실기',
    '실습': '실기',
    '직접 하는 거': '실기'
};

class DuduChatbot {
    constructor() {
        this.knowledgeBase = [...DEFAULT_FAQ_KNOWLEDGE];
        this.isOpen = false;
        this.fontSize = 16;
        this.init();
    }

    async init() {
        if (typeof document === 'undefined' || !document.body) return;
        this.injectStyles();
        this.injectHTML();
        this.bindEvents();
        await this.syncWithSupabase();
    }

    async syncWithSupabase() {
        try {
            if (typeof window === 'undefined') return;
            const client = window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' 
                ? window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY)
                : null);

            if (client) {
                window.supabaseClient = client;
                const { data, error } = await client
                    .from('faq_documents')
                    .select('*');

                if (!error && data && data.length > 0) {
                    this.knowledgeBase = data;
                    console.log('🤖 챗봇: Supabase FAQ 데이터 동기화 완료 (' + data.length + '건)');
                }
            }
        } catch (e) {
            console.log('챗봇 기본 내장 규정 사용:', e);
        }
    }

    injectStyles() {
        if (typeof document === 'undefined') return;
        if (document.getElementById('duduChatbotStyles')) return;

        const style = document.createElement('style');
        style.id = 'duduChatbotStyles';
        style.textContent = `
            .dudu-chat-fab {
                position: fixed !important;
                bottom: 28px !important;
                right: 28px !important;
                background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
                color: #ffffff !important;
                border: 3px solid #ffffff !important;
                border-radius: 50px !important;
                padding: 16px 24px !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
                cursor: pointer !important;
                z-index: 999999 !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                font-family: 'Noto Sans KR', sans-serif !important;
                user-select: none !important;
            }
            .dudu-chat-fab:hover {
                transform: translateY(-4px) scale(1.04) !important;
                box-shadow: 0 14px 40px rgba(37, 99, 235, 0.7) !important;
                background: linear-gradient(135deg, #1d4ed8, #1e40af) !important;
            }
            .dudu-chat-fab .fab-icon {
                font-size: 26px !important;
                display: flex !important;
                align-items: center !important;
            }
            .dudu-chat-fab .fab-text {
                font-size: 18px !important;
                font-weight: 900 !important;
                letter-spacing: -0.3px !important;
                color: #ffffff !important;
            }
            .dudu-chat-fab .fab-pulse {
                width: 12px !important;
                height: 12px !important;
                background: #34d399 !important;
                border-radius: 50% !important;
                box-shadow: 0 0 12px #34d399 !important;
                animation: duduPulse 1.8s infinite !important;
            }

            @keyframes duduPulse {
                0% { transform: scale(0.9); opacity: 0.8; }
                50% { transform: scale(1.4); opacity: 1; }
                100% { transform: scale(0.9); opacity: 0.8; }
            }

            .dudu-chat-window {
                position: fixed !important;
                bottom: 96px !important;
                right: 28px !important;
                width: 420px !important;
                max-width: calc(100vw - 36px) !important;
                height: 620px !important;
                max-height: calc(100vh - 120px) !important;
                background: #0f172a !important;
                border: 2px solid #3b82f6 !important;
                border-radius: 24px !important;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85) !important;
                display: none;
                flex-direction: column !important;
                z-index: 999999 !important;
                overflow: hidden !important;
                font-family: 'Noto Sans KR', sans-serif !important;
            }
            .dudu-chat-window.open {
                display: flex !important;
                animation: duduSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            @keyframes duduSlideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .dudu-chat-header {
                background: #1e293b !important;
                border-bottom: 2px solid #334155 !important;
                padding: 16px 20px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
            }
            .chat-header-info {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
            }
            .chat-header-badge {
                width: 42px !important;
                height: 42px !important;
                background: #2563eb !important;
                border-radius: 12px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 22px !important;
                font-weight: 900 !important;
                color: #ffffff !important;
            }
            .chat-header-title h4 {
                color: #ffffff !important;
                font-size: 17px !important;
                font-weight: 900 !important;
                margin: 0 !important;
            }
            .chat-header-title p {
                color: #94a3b8 !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                margin: 0 !important;
            }
            .chat-header-tools {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .tool-btn {
                background: #334155 !important;
                border: 1px solid #475569 !important;
                color: #ffffff !important;
                border-radius: 6px !important;
                padding: 5px 10px !important;
                font-size: 13px !important;
                font-weight: 800 !important;
                cursor: pointer !important;
            }
            .tool-btn:hover {
                background: #2563eb !important;
            }

            .dudu-chat-messages {
                flex: 1 !important;
                padding: 18px !important;
                overflow-y: auto !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
                background: #090d16 !important;
            }
            .chat-msg {
                max-width: 88% !important;
                padding: 14px 18px !important;
                border-radius: 18px !important;
                line-height: 1.55 !important;
                font-size: 16px !important;
                word-break: keep-all !important;
                font-weight: 500 !important;
            }
            .chat-msg.bot {
                align-self: flex-start !important;
                background: #1e293b !important;
                color: #ffffff !important;
                border: 2px solid #334155 !important;
                border-bottom-left-radius: 4px !important;
            }
            .chat-msg.user {
                align-self: flex-end !important;
                background: #2563eb !important;
                color: #ffffff !important;
                border-bottom-right-radius: 4px !important;
                font-weight: 700 !important;
            }

            .quick-chips {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                margin-top: 14px !important;
            }
            .quick-chip {
                background: rgba(37, 99, 235, 0.25) !important;
                border: 1.5px solid #3b82f6 !important;
                color: #93c5fd !important;
                border-radius: 14px !important;
                padding: 8px 12px !important;
                font-size: 13px !important;
                font-weight: 800 !important;
                cursor: pointer !important;
                transition: all 0.15s !important;
            }
            .quick-chip:hover {
                background: #2563eb !important;
                color: #ffffff !important;
            }

            .dudu-chat-input-box {
                padding: 16px !important;
                background: #1e293b !important;
                border-top: 2px solid #334155 !important;
                display: flex !important;
                gap: 10px !important;
            }
            .dudu-chat-input {
                flex: 1 !important;
                background: #020617 !important;
                border: 2px solid #475569 !important;
                border-radius: 12px !important;
                padding: 14px 16px !important;
                color: #ffffff !important;
                font-size: 16px !important;
                font-weight: 600 !important;
                outline: none !important;
            }
            .dudu-chat-input:focus {
                border-color: #3b82f6 !important;
            }
            .dudu-chat-send-btn {
                background: #2563eb !important;
                border: none !important;
                color: white !important;
                border-radius: 12px !important;
                padding: 0 22px !important;
                font-weight: 900 !important;
                font-size: 16px !important;
                cursor: pointer !important;
            }
            .dudu-chat-send-btn:hover {
                background: #1d4ed8 !important;
            }
        `;
        document.head.appendChild(style);
    }

    injectHTML() {
        if (typeof document === 'undefined' || !document.body) return;
        if (document.getElementById('duduChatFab')) return;

        const fab = document.createElement('div');
        fab.className = 'dudu-chat-fab';
        fab.id = 'duduChatFab';
        fab.innerHTML = `
            <div class="fab-pulse"></div>
            <div class="fab-icon">🤖</div>
            <div class="fab-text">문의 챗봇</div>
        `;

        const chatWindow = document.createElement('div');
        chatWindow.className = 'dudu-chat-window';
        chatWindow.id = 'duduChatWindow';
        chatWindow.innerHTML = `
            <div class="dudu-chat-header">
                <div class="chat-header-info">
                    <div class="chat-header-badge">두</div>
                    <div class="chat-header-title">
                        <h4>3대 자격증 AI 안내 상담원</h4>
                        <p>한식·지게차·굴착기 상시 CBT 정밀 안내</p>
                    </div>
                </div>
                <div class="chat-header-tools">
                    <button class="tool-btn" id="chatFontDown">가-</button>
                    <button class="tool-btn" id="chatFontUp">가+</button>
                    <button class="tool-btn" id="chatCloseBtn">✕</button>
                </div>
            </div>
            <div class="dudu-chat-messages" id="chatMessages">
                <div class="chat-msg bot">
                    안녕하세요, 어르신! <strong>두두자격지원센터 3대 핵심자격 전문 AI 상담원</strong>입니다.<br>
                    <strong>한식조리, 지게차운전, 굴착기운전기능사</strong>의 응시료, 상시 접수 일정, 당일 합격 발표 등에 대해 편하게 물어보세요.
                    <div class="quick-chips">
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('한식조리 접수비 얼마예요?')">💡 한식조리 응시료</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('포크레인 필기 수수료')">🚜 굴착기(포크레인) 수수료</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('지게차 접수 언제 하나요?')">📅 지게차 상시 접수 일정</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('합격 발표는 언제 나와요?')">⏱️ 당일 합격자 발표</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('실기 시험 접수도 되나요?')">🔍 실기 접수 문의</div>
                    </div>
                </div>
            </div>
            <div class="dudu-chat-input-box">
                <input type="text" class="dudu-chat-input" id="chatInput" placeholder="질문을 입력하세요 (예: 한식조리 접수비 얼마?)">
                <button class="dudu-chat-send-btn" id="chatSendBtn">전송</button>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(chatWindow);
    }

    bindEvents() {
        if (typeof document === 'undefined') return;
        const fab = document.getElementById('duduChatFab');
        const closeBtn = document.getElementById('chatCloseBtn');
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatInput');
        const fontUp = document.getElementById('chatFontUp');
        const fontDown = document.getElementById('chatFontDown');

        if (fab) fab.onclick = () => this.toggleChat();
        if (closeBtn) closeBtn.onclick = () => this.toggleChat(false);
        if (sendBtn) sendBtn.onclick = () => this.handleSend();
        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') this.handleSend();
            };
        }
        if (fontUp) {
            fontUp.onclick = () => {
                this.fontSize = Math.min(22, this.fontSize + 2);
                document.querySelectorAll('.chat-msg').forEach(el => el.style.fontSize = `${this.fontSize}px`);
            };
        }
        if (fontDown) {
            fontDown.onclick = () => {
                this.fontSize = Math.max(13, this.fontSize - 2);
                document.querySelectorAll('.chat-msg').forEach(el => el.style.fontSize = `${this.fontSize}px`);
            };
        }
    }

    toggleChat(forceState) {
        if (typeof document === 'undefined') return;
        const win = document.getElementById('duduChatWindow');
        if (!win) return;
        this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;
        if (this.isOpen) {
            win.classList.add('open');
            const inp = document.getElementById('chatInput');
            if (inp) inp.focus();
        } else {
            win.classList.remove('open');
        }
    }

    askQuestion(text) {
        if (typeof document === 'undefined') return;
        const inp = document.getElementById('chatInput');
        if (inp) inp.value = text;
        this.handleSend();
    }

    handleSend() {
        if (typeof document === 'undefined') return;
        const input = document.getElementById('chatInput');
        if (!input) return;
        const query = input.value.trim();
        if (!query) return;

        this.appendMessage(query, 'user');
        input.value = '';

        setTimeout(() => {
            const answer = this.generateResponse(query);
            this.appendMessage(answer, 'bot');
        }, 150);
    }

    appendMessage(text, sender) {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        msg.style.fontSize = `${this.fontSize}px`;
        msg.innerHTML = text.replace(/\n/g, '<br>');
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    generateResponse(rawQuery) {
        const query = rawQuery.toLowerCase().replace(/\s+/g, ' ');

        // 1. 가드레일: 실기(Practical) 문의 엄격 차단
        if (query.includes('실기') || query.includes('2차') || query.includes('실습') || query.includes('직접 하는')) {
            return '저희는 필기 접수만 도와드립니다. 실기 시험 관련 문의는 해당 시행기관으로 문의해 주시기 바랍니다.';
        }

        // 2. 시니어 유의어 치환 및 정규화
        let normalizedQuery = query;
        for (const [slang, standard] of Object.entries(SENIOR_SYNONYMS)) {
            if (normalizedQuery.includes(slang.toLowerCase())) {
                normalizedQuery += ' ' + standard.toLowerCase();
            }
        }

        // 3. 기타 자격증(전기, 요양, 공인중개사 등) 문의 시 3대 핵심 집중 안내
        if (normalizedQuery.includes('전기') || normalizedQuery.includes('요양') || normalizedQuery.includes('위생사') || normalizedQuery.includes('손해평가사') || normalizedQuery.includes('공인중개사') || normalizedQuery.includes('부동산')) {
            return '저희 센터는 현재 중장년 어르신 취업에 가장 수요가 높은 3대 핵심 국가기술자격(한식조리, 지게차운전, 굴착기운전기능사) 필기 원서접수에 집중하여 전문 지원해 드리고 있습니다. (기타 종목은 추후 지원 예정입니다.)';
        }

        // 4. 의도 가중치 분류
        const isPrepIntent = normalizedQuery.includes('준비물') || normalizedQuery.includes('신분증') || normalizedQuery.includes('수험표') || normalizedQuery.includes('지참물') || normalizedQuery.includes('필기구');
        const isRefundIntent = normalizedQuery.includes('환불') || normalizedQuery.includes('취소') || normalizedQuery.includes('돈돌려');
        const isDurationIntent = normalizedQuery.includes('유효기간') || normalizedQuery.includes('면제') || normalizedQuery.includes('몇년');
        const isScheduleIntent = normalizedQuery.includes('일정') || normalizedQuery.includes('언제') || normalizedQuery.includes('기간') || normalizedQuery.includes('상시') || normalizedQuery.includes('cbt');
        const isFeeIntent = normalizedQuery.includes('응시료') || normalizedQuery.includes('수수료') || normalizedQuery.includes('접수비') || normalizedQuery.includes('비용') || normalizedQuery.includes('얼마') || normalizedQuery.includes('돈');
        const isPassIntent = normalizedQuery.includes('합격') || normalizedQuery.includes('발표') || normalizedQuery.includes('점수') || normalizedQuery.includes('결과');
        const isSessionIntent = normalizedQuery.includes('몇부') || normalizedQuery.includes('교시') || normalizedQuery.includes('시간대');

        let bestMatch = null;
        let highestScore = 0;

        for (const item of this.knowledgeBase) {
            let score = 0;
            const keywords = (item.keywords || '').split(',').map(k => k.trim().toLowerCase());
            const questionWords = (item.question || '').toLowerCase().split(' ');
            const cat = item.category || '';

            if (isPrepIntent && cat.includes('시험준비물')) score += 12;
            if (isRefundIntent && cat.includes('결제/환불')) score += 12;
            if (isDurationIntent && cat.includes('유효기간')) score += 12;
            if (isFeeIntent && cat.includes('응시료')) score += 10;
            if (isScheduleIntent && cat.includes('일정')) score += 10;
            if (isPassIntent && cat.includes('합격발표')) score += 12;
            if (isSessionIntent && cat.includes('시험시간')) score += 12;

            // 키워드 매칭
            keywords.forEach(kw => {
                if (kw && normalizedQuery.includes(kw)) {
                    score += 5;
                }
            });

            // 질문 단어 매칭
            questionWords.forEach(qw => {
                if (qw && qw.length > 1 && normalizedQuery.includes(qw)) {
                    score += 1;
                }
            });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = item;
            }
        }

        // 문턱값 판정
        const THRESHOLD = 3;
        if (!bestMatch || highestScore < THRESHOLD) {
            return '해당 내용은 사내 안내 규정 문서에 나와 있지 않아 정확한 안내가 어렵습니다. (모르겠습니다)';
        }

        return bestMatch.answer;
    }
}

// 안전한 부트스트랩 초기화
function bootDuduChatbot() {
    if (typeof document === 'undefined') return;
    if (!document.body) {
        window.addEventListener('DOMContentLoaded', bootDuduChatbot);
        return;
    }
    if (!window.duduChat) {
        window.duduChat = new DuduChatbot();
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootDuduChatbot);
    } else {
        bootDuduChatbot();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DuduChatbot, DEFAULT_FAQ_KNOWLEDGE, SENIOR_SYNONYMS };
}
