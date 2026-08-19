/**
 * 두두자격지원센터 - 시니어 맞춤 AI 안내 챗봇 (두두봇)
 * - 사내 안내 규정 문서 기반 정밀 응답
 * - 시니어 맞춤 유의어 사전 (접수비, 포크레인, 1차, 요양사 등)
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
        qualification: '기능사 4종 (한식, 지게차, 굴착기, 전기)',
        question: '기능사(한식, 지게차, 굴착기, 전기) 필기 응시료는 얼마인가요?',
        keywords: '응시료,접수비,시험비,비용,얼마,한식,한식조리,지게차,굴착기,전기,포크레인,수수료,돈,기능사',
        answer: '어르신, 한식조리기능사, 지게차운전기능사, 굴착기운전기능사, 전기기능사 등 4개 기능사 종목의 필기 응시료는 모두 14,500원으로 동일합니다.',
        is_unknown: false
    },
    {
        id: 2,
        category: '응시료',
        qualification: '요양보호사',
        question: '요양보호사 시험 응시료는 얼마인가요?',
        keywords: '요양보호사,요양사,응시료,접수비,시험비,비용,얼마,돈,수수료,금액',
        answer: '어르신, 요양보호사 시험 응시 수수료는 32,000원입니다. (사전에 교육이수 240시간 수료 필수입니다.)',
        is_unknown: false
    },
    {
        id: 3,
        category: '응시료',
        qualification: '위생사',
        question: '위생사 시험 응시료는 얼마인가요?',
        keywords: '위생사,응시료,접수비,시험비,비용,얼마,돈,수수료,금액',
        answer: '어르신, 위생사 시험 응시 수수료는 30,000원입니다. (보건관련학과 이수자 대상입니다.)',
        is_unknown: false
    },
    {
        id: 4,
        category: '응시료',
        qualification: '손해평가사',
        question: '손해평가사 시험 응시료는 얼마인가요?',
        keywords: '손해평가사,응시료,접수비,시험비,비용,얼마,1차,2차,돈,수수료,금액',
        answer: '어르신, 손해평가사 응시 수수료는 1차 30,000원, 2차 30,000원입니다.',
        is_unknown: false
    },
    {
        id: 5,
        category: '응시료',
        qualification: '공인중개사',
        question: '공인중개사 시험 응시료는 얼마인가요?',
        keywords: '공인중개사,부동산,응시료,접수비,시험비,비용,얼마,1차,2차,돈,수수료,금액',
        answer: '어르신, 공인중개사 수수료는 1차 13,400원, 2차 15,200원이며, 1차와 2차 동시 응시 시 28,600원입니다.',
        is_unknown: false
    },
    {
        id: 6,
        category: '일정',
        qualification: '전기기능사',
        question: '전기기능사 시험 일정은 언제인가요?',
        keywords: '전기기능사,전기,일정,접수기간,언제,4회,정기,시험일,원서접수기간',
        answer: '전기기능사는 연 4회 정기시험으로 시행됩니다. 현재 가장 가까운 제4회 필기 원서접수는 2026.08.24 ~ 08.27이며, 필기시험일은 09.16 ~ 09.21입니다.',
        is_unknown: false
    },
    {
        id: 7,
        category: '일정',
        qualification: '한식조리, 지게차, 굴착기 (상시 3종)',
        question: '한식조리, 지게차, 굴착기운전기능사 접수 기간은 언제인가요?',
        keywords: '한식,한식조리,지게차,굴착기,포크레인,상시,일정,언제,접수기간,시험일,접수',
        answer: '한식조리, 지게차운전, 굴착기운전기능사는 별도의 접수 기간 없이 상시로 운영되며, 시험장에 빈자리가 있으면 언제든 접수 가능합니다. (컴퓨터 CBT 시험으로 시험 당일 바로 합격이 발표됩니다.)',
        is_unknown: false
    },
    {
        id: 8,
        category: '일정',
        qualification: '손해평가사, 공인중개사 (전문자격 2종)',
        question: '손해평가사, 공인중개사 접수 기간은 언제인가요?',
        keywords: '손해평가사,공인중개사,부동산,일정,접수기간,언제,1차,마감,접수마감,끝났나요,마감됐나요',
        answer: '손해평가사(제12회)와 공인중개사(제37회)는 연 1회 시행되며, 올해 2026년 1차 필기 원서접수는 이미 마감되었습니다. 올해는 접수가 불가합니다.',
        is_unknown: false
    },
    {
        id: 9,
        category: '결제/환불',
        qualification: '공통',
        question: '환불 규정 및 취소 기간은 어떻게 되나요?',
        keywords: '환불,취소,돈돌려,환불금,취소기간,100%,50%,환불규정',
        answer: '원서접수 기간 내 취소 시 100% 전액 환불되며, 접수 마감 후부터 시험 시작 5일 전까지는 50% 환불됩니다. 시험 시작 4일 전부터는 환불이 불가합니다.',
        is_unknown: false
    },
    {
        id: 10,
        category: '유효기간',
        qualification: '기능사 4종 (한식, 지게차, 굴착기, 전기)',
        question: '필기시험 합격 후 유효기간은 얼마나 되나요?',
        keywords: '유효기간,필기합격,면제,기간,몇년,유효,필기합격후',
        answer: '국가기술자격(기능사)은 필기 합격일로부터 2년간 필기시험이 면제됩니다. (2년 이내에 실기시험에 응시하시면 됩니다.)',
        is_unknown: false
    },
    {
        id: 11,
        category: '시험준비물',
        qualification: '공통',
        question: '시험 당일 준비물 및 지참물은 무엇인가요?',
        keywords: '준비물,신분증,수험표,필기구,시계,계산기,스마트폰,휴대폰,지참물,가져갈것',
        answer: '시험 당일 반드시 신분증, 수험표, 흑색 필기구를 지참하셔야 합니다. 휴대폰, 스마트워치 등 전자기기는 시험실 반입 금지이며 소지 시 시험이 무효 처리됩니다.',
        is_unknown: false
    },
    {
        id: 12,
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
        this.fontSize = 15;
        if (typeof document !== 'undefined') {
            this.init();
        }
    }

    async init() {
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
        const style = document.createElement('style');
        style.textContent = `
            .dudu-chat-fab {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: #ffffff;
                border: 2px solid rgba(255, 255, 255, 0.25);
                border-radius: 36px;
                padding: 14px 22px;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 10px 30px rgba(37, 99, 235, 0.5);
                cursor: pointer;
                z-index: 9999;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Noto Sans KR', sans-serif;
            }
            .dudu-chat-fab:hover {
                transform: translateY(-3px) scale(1.03);
                box-shadow: 0 14px 35px rgba(37, 99, 235, 0.7);
            }
            .dudu-chat-fab .fab-icon {
                font-size: 24px;
                display: flex;
                align-items: center;
            }
            .dudu-chat-fab .fab-text {
                font-size: 16px;
                font-weight: 800;
                letter-spacing: -0.3px;
            }
            .dudu-chat-fab .fab-pulse {
                width: 10px;
                height: 10px;
                background: #34d399;
                border-radius: 50%;
                box-shadow: 0 0 10px #34d399;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(0.95); opacity: 0.8; }
                50% { transform: scale(1.3); opacity: 1; }
                100% { transform: scale(0.95); opacity: 0.8; }
            }

            .dudu-chat-window {
                position: fixed;
                bottom: 88px;
                right: 24px;
                width: 390px;
                max-width: calc(100vw - 32px);
                height: 580px;
                max-height: calc(100vh - 120px);
                background: #0f172a;
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 24px;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75);
                display: none;
                flex-direction: column;
                z-index: 9999;
                overflow: hidden;
                backdrop-filter: blur(18px);
                font-family: 'Noto Sans KR', sans-serif;
            }
            .dudu-chat-window.open {
                display: flex;
                animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .dudu-chat-header {
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                padding: 16px 18px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .chat-header-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .chat-header-badge {
                width: 38px;
                height: 38px;
                background: #2563eb;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            .chat-header-title h4 {
                color: #f8fafc;
                font-size: 16px;
                font-weight: 800;
                margin: 0;
            }
            .chat-header-title p {
                color: #94a3b8;
                font-size: 11px;
                margin: 0;
            }
            .chat-header-tools {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .tool-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #cbd5e1;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
            }
            .tool-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .dudu-chat-messages {
                flex: 1;
                padding: 18px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .chat-msg {
                max-width: 86%;
                padding: 13px 16px;
                border-radius: 16px;
                line-height: 1.55;
                font-size: 15px;
                word-break: keep-all;
            }
            .chat-msg.bot {
                align-self: flex-start;
                background: #1e293b;
                color: #f1f5f9;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-bottom-left-radius: 4px;
            }
            .chat-msg.user {
                align-self: flex-end;
                background: #2563eb;
                color: #ffffff;
                border-bottom-right-radius: 4px;
            }

            .quick-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 10px;
            }
            .quick-chip {
                background: rgba(59, 130, 246, 0.15);
                border: 1px solid rgba(59, 130, 246, 0.4);
                color: #93c5fd;
                border-radius: 12px;
                padding: 6px 10px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .quick-chip:hover {
                background: rgba(59, 130, 246, 0.3);
                border-color: #60a5fa;
            }

            .dudu-chat-input-box {
                padding: 14px;
                background: #1e293b;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 8px;
            }
            .dudu-chat-input {
                flex: 1;
                background: #090d16;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 12px 14px;
                color: #f8fafc;
                font-size: 15px;
                outline: none;
            }
            .dudu-chat-input:focus {
                border-color: #3b82f6;
            }
            .dudu-chat-send-btn {
                background: #2563eb;
                border: none;
                color: white;
                border-radius: 12px;
                padding: 0 18px;
                font-weight: 700;
                font-size: 15px;
                cursor: pointer;
            }
            .dudu-chat-send-btn:hover {
                background: #1d4ed8;
            }
        `;
        document.head.appendChild(style);
    }

    injectHTML() {
        if (typeof document === 'undefined') return;
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
                        <h4>두두 AI 안내 상담원</h4>
                        <p>사내 규정 문서 기반 정밀 안내</p>
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
                    안녕하세요, 어르신! <strong>두두자격지원센터 AI 상담원</strong>입니다.<br>
                    자격증 응시료, 시험 일정, 환불 규정 등에 대해 궁금하신 점을 편하게 물어보세요.
                    <div class="quick-chips">
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('한식조리 접수비 얼마예요?')">💡 한식조리 접수비</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('요양보호사 수수료 얼마예요?')">💡 요양보호사 수수료</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('전기기능사 시험 일정')">📅 전기기능사 일정</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('실기 시험 접수도 되나요?')">🔍 실기 접수 문의</div>
                        <div class="quick-chip" onclick="window.duduChat.askQuestion('시험장에 주차 되나요?')">🚗 시험장 주차 문의</div>
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

        if (fab) fab.addEventListener('click', () => this.toggleChat());
        if (closeBtn) closeBtn.addEventListener('click', () => this.toggleChat(false));
        if (sendBtn) sendBtn.addEventListener('click', () => this.handleSend());
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSend();
            });
        }
        if (fontUp) {
            fontUp.addEventListener('click', () => {
                this.fontSize = Math.min(20, this.fontSize + 2);
                document.querySelectorAll('.chat-msg').forEach(el => el.style.fontSize = `${this.fontSize}px`);
            });
        }
        if (fontDown) {
            fontDown.addEventListener('click', () => {
                this.fontSize = Math.max(13, this.fontSize - 2);
                document.querySelectorAll('.chat-msg').forEach(el => el.style.fontSize = `${this.fontSize}px`);
            });
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
        }, 200);
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

        // 3. 자격증별 감지
        const qualNames = ['한식조리', '지게차', '굴착기', '전기', '요양보호사', '위생사', '손해평가사', '공인중개사'];
        let detectedQual = null;
        for (const q of qualNames) {
            if (normalizedQuery.includes(q.toLowerCase())) {
                detectedQual = q;
                break;
            }
        }

        // 질문 의도 감지 (일정/마감 vs 수수료/응시료 vs 환불 vs 준비물)
        const isScheduleIntent = normalizedQuery.includes('일정') || normalizedQuery.includes('언제') || normalizedQuery.includes('마감') || normalizedQuery.includes('기간') || normalizedQuery.includes('날짜');
        const isFeeIntent = normalizedQuery.includes('응시료') || normalizedQuery.includes('수수료') || normalizedQuery.includes('접수비') || normalizedQuery.includes('비용') || normalizedQuery.includes('얼마') || normalizedQuery.includes('돈');

        let bestMatch = null;
        let highestScore = 0;

        for (const item of this.knowledgeBase) {
            let score = 0;
            const keywords = (item.keywords || '').split(',').map(k => k.trim().toLowerCase());
            const questionWords = (item.question || '').toLowerCase().split(' ');
            const itemQual = (item.qualification || '').toLowerCase();
            const itemCat = (item.category || '').toLowerCase();

            // 특정 자격증 질문인 경우 가중치
            if (detectedQual) {
                if (itemQual.includes(detectedQual.toLowerCase())) {
                    score += 10;
                } else if (itemQual.includes('기능사') && ['한식조리', '지게차', '굴착기', '전기'].includes(detectedQual)) {
                    score += 8;
                } else if (itemQual.includes('공통')) {
                    score += 1;
                } else {
                    score -= 5;
                }
            }

            // 의도 카테고리 보너스
            if (isScheduleIntent && itemCat.includes('일정')) {
                score += 8;
            }
            if (isFeeIntent && itemCat.includes('응시료')) {
                score += 8;
            }

            // 키워드 매칭
            keywords.forEach(kw => {
                if (kw && normalizedQuery.includes(kw)) {
                    score += 4;
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

        // 4. 문턱값 판정
        const THRESHOLD = 3;
        if (!bestMatch || highestScore < THRESHOLD) {
            return '해당 내용은 사내 안내 규정 문서에 나와 있지 않아 정확한 안내가 어렵습니다. (모르겠습니다)';
        }

        return bestMatch.answer;
    }
}

// 전역 등록
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.duduChat = new DuduChatbot();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DuduChatbot, DEFAULT_FAQ_KNOWLEDGE, SENIOR_SYNONYMS };
}
