const fs = require('fs');
const path = require('path');
const { DuduChatbot } = require('./chatbot.js');
const { tfidfEngine } = require('./lib/tfidf.js');

console.log('================================================================');
console.log('      두두자격지원센터 전체 시나리오 종합 전수 검증 스위트      ');
console.log('================================================================\n');

const chatbot = new DuduChatbot();

// Load 4,705 FAQ knowledge base for RAG index
const dataPath = path.join(__dirname, 'data', 'faq_knowledge_base.json');
if (fs.existsSync(dataPath)) {
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    tfidfEngine.buildIndex(rawData);
}

let totalTests = 0;
let totalPass = 0;
let totalFail = 0;

function runSection(title, testCases, testerFn) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`▶ ${title} (${testCases.length}개 케이스)`);
    console.log(`----------------------------------------------------------------`);
    
    let secPass = 0;
    let secFail = 0;

    for (let i = 0; i < testCases.length; i++) {
        totalTests++;
        const tc = testCases[i];
        const result = testerFn(tc);
        
        if (result.pass) {
            secPass++;
            totalPass++;
            console.log(`  ✅ [PASS ${i + 1}/${testCases.length}] [${tc.tag}] Q: "${tc.q}"`);
            console.log(`     ➔ Ans: ${result.summary}\n`);
        } else {
            secFail++;
            totalFail++;
            console.error(`  ❌ [FAIL ${i + 1}/${testCases.length}] [${tc.tag}] Q: "${tc.q}"`);
            console.error(`     Reason: ${result.reason}\n`);
        }
    }
    console.log(`결과: ${secPass} / ${testCases.length} PASS (성공률: ${((secPass / testCases.length) * 100).toFixed(1)}%)`);
}

// ----------------------------------------------------------------
// Section 1: 사내 공식 안내규정 8종 원장 전수 검증 (client-docs/02_안내규정.md)
// ----------------------------------------------------------------
const SECTION_1_REGULATIONS = [
    { q: '한식조리 접수비 얼마예요?', expected: ['14,500원'], tag: '수수료_한식' },
    { q: '지게차 필기 응시료 얼마인가요?', expected: ['14,500원'], tag: '수수료_지게차' },
    { q: '포크레인 접수비 얼마예요?', expected: ['14,500원'], tag: '수수료_굴착기' },
    { q: '응시료 50% 감면 대상자', expected: ['7,250원', '기초생활수급자'], tag: '수수료_감면' },
    { q: '지게차 시험일정 언제예요?', expected: ['상시 CBT'], tag: '일정_상시' },
    { q: '전기기능사 접수기간이 언제예요?', expected: ['8월 24일'], tag: '일정_전기기능사' },
    { q: '요양보호사 접수 언제까지 해야 하나요?', expected: ['7일 전'], tag: '일정_요양보호사' },
    { q: '공인중개사 접수 지금 되나요?', expected: ['마감'], tag: '일정_공인중개사' },
    { q: '손해평가사 올해 접수 가능한가요?', expected: ['마감'], tag: '일정_손해평가사' },
    { q: '합격자 발표는 언제 나와요?', expected: ['즉시'], tag: '합격발표_CBT' },
    { q: '필기시험 합격 유효기간이 얼마인가요?', expected: ['2년'], tag: '유효기간_필기' },
    { q: '시험 당일 필수 준비물이 뭐예요?', expected: ['실물 신분증'], tag: '준비물_신분증' },
    { q: '원서접수 취소하면 환불되나요?', expected: ['100%', '50%'], tag: '환불_정규' },
    { q: '병원 입원해서 시험 못 봤는데 환불되나요?', expected: ['100% 전액 환불'], tag: '환불_사후입원' },
    { q: '실기 시험 접수도 여기서 되나요?', expected: ['필기 접수만'], tag: '실기_거절' },
    { q: '시험장에 주차 되나요?', expected: ['안내 규정에 나와 있지 않아'], tag: '거절_주차' },
    { q: '제가 합격할 수 있을까요? 교재 추천해줘요', expected: ['사내 규정 안내 범위를 벗어나'], tag: '거절_교재추천' },
    { q: '동사무소나 우체국에서 접수되나요?', expected: ['방문 접수가 불가능'], tag: '접수_온라인전용' },
    { q: '하루에 몇 부까지 시험이 있나요?', expected: ['5개 교시'], tag: '시험교시' },
    { q: '인터넷 접수가 어려운데 전화로 대신 접수해 주나요?', expected: ['대행'], tag: '대리접수' }
];

runSection('사내 안내규정 원장 검증 (Section 1)', SECTION_1_REGULATIONS, (tc) => {
    const ans = chatbot.generateResponse(tc.q);
    const pass = tc.expected.every(k => ans.includes(k));
    return {
        pass,
        summary: ans.slice(0, 75) + '...',
        reason: `Expected all of [${tc.expected.join(', ')}] in response: "${ans.slice(0, 100)}..."`
    };
});

// ----------------------------------------------------------------
// Section 2: 시니어 페르소나별 실전 시나리오 (US1 ~ US5)
// ----------------------------------------------------------------
const SECTION_2_PERSONAS = [
    { q: '김순자 62세인데 한식조리 접수비 얼마예요?', expected: ['14,500원'], tag: 'US1_김순자_한식접수비' },
    { q: '김순자 62세 한식조리 시험 언제 볼 수 있나요?', expected: ['상시 CBT'], tag: 'US1_김순자_한식일정' },
    { q: '박영수 68세 지게차 시험 다시 보려는데 준비물이 뭐예요?', expected: ['실물 신분증'], tag: 'US2_박영수_지게차준비물' },
    { q: '어르신 접수를 직원이 대신 해줄 수 있나요?', expected: ['대행'], tag: 'US3_대리신청' },
    { q: '지게차 합격률이랑 난이도 알려주세요', expected: ['사내 규정 안내 범위를 벗어나'], tag: 'US4_오답요구_거절' },
    { q: '이말순 71세 한식조리 접수했는데 시험 보고 결과 언제 알 수 있나요?', expected: ['즉시'], tag: 'US5_이말순_합격발표' },
    { q: '나이가 70이 넘었는데 시험 볼 수 있을까요?', expected: ['도전하시고', '어르신'], tag: 'US_고령자_격려' }
];

runSection('시니어 페르소나 시나리오 (Section 2)', SECTION_2_PERSONAS, (tc) => {
    const ans = chatbot.generateResponse(tc.q);
    const pass = tc.expected.every(k => ans.includes(k));
    return {
        pass,
        summary: ans.slice(0, 75) + '...',
        reason: `Expected all of [${tc.expected.join(', ')}] in response: "${ans.slice(0, 100)}..."`
    };
});

// ----------------------------------------------------------------
// Section 3: 시니어 구어체 / 사투리 / 엣지케이스 (Section 3)
// ----------------------------------------------------------------
const SECTION_3_EDGE_CASES = [
    { q: '접수비가 얼마예유?', expected: ['14,500원'], tag: '사투리_접수비' },
    { q: '돈 얼마 내야 돼요?', expected: ['14,500원'], tag: '구어_돈얼마' },
    { q: '등록금 얼마야?', expected: ['14,500원'], tag: '구어_등록금' },
    { q: '장애인인데 할인 돼요?', expected: ['7,250원', '50%'], tag: '감면_장애인' },
    { q: '국가유공자 감면 되나요?', expected: ['7,250원', '50%'], tag: '감면_유공자' },
    { q: '차상위계층 혜택 있나요?', expected: ['7,250원', '50%'], tag: '감면_차상위' },
    { q: '80대도 시험 볼 수 있어요?', expected: ['도전하시고'], tag: '나이_80대' },
    { q: '늙은 사람도 되나요?', expected: ['도전하시고'], tag: '나이_늙은사람' },
    { q: '포클레인 접수비', expected: ['14,500원'], tag: '유의어_포클레인' },
    { q: '주민센터 가면 접수 도와주나요?', expected: ['방문 접수가 불가능'], tag: '접수_주민센터' },
    { q: '2차 시험 접수해주세요', expected: ['필기 접수만'], tag: '실기_2차' },
    { q: '고마워유', expected: ['도움이 되어'], tag: '일상_감사' },
    { q: '날씨가 너무 덥네요', expected: ['건강'], tag: '일상_날씨' },
    { q: '   ', expected: ['말씀해 주세요'], tag: '방어_공백입력' }
];

runSection('구어체 및 엣지케이스 검증 (Section 3)', SECTION_3_EDGE_CASES, (tc) => {
    const ans = chatbot.generateResponse(tc.q);
    const pass = tc.expected.every(k => ans.includes(k));
    return {
        pass,
        summary: ans.slice(0, 75) + '...',
        reason: `Expected all of [${tc.expected.join(', ')}] in response: "${ans.slice(0, 100)}..."`
    };
});

// ----------------------------------------------------------------
// Section 4: TF-IDF RAG Stage 5 벤치마크 9종 (Section 4)
// ----------------------------------------------------------------
const SECTION_4_TFIDF = [
    { q: '한식조리기능사 시험비가 얼마예요?', targetCert: '한식조리', tag: 'TFIDF_한식시험비' },
    { q: '지게차 접수는 어디서 해요?', targetCert: '지게차', tag: 'TFIDF_지게차접수처' },
    { q: '전기기능사 계산기 반입 되나요?', targetCert: '전기기능사', tag: 'TFIDF_전기계산기' },
    { q: '요양보호사 합격 기준이 몇 점이에요?', targetCert: '요양보호사', tag: 'TFIDF_요양합격점' },
    { q: '공인중개사 환불 규정이 어떻게 되나요?', targetCert: '공인중개사', tag: 'TFIDF_공인환불' },
    { q: '위생사 응시 자격이 있나요?', targetCert: '위생사', tag: 'TFIDF_위생응시자격' },
    { q: '손해평가사 접수 기간이 언제예요?', targetCert: '손해평가사', tag: 'TFIDF_손해접수기간' },
    { q: '굴착기 실기시험 준비물이 뭐예요?', targetCert: '굴착기', tag: 'TFIDF_굴착기준비물' },
    { q: '굴착기 접수비', targetCert: '굴착기', tag: 'TFIDF_굴착기응시료' }
];

runSection('TF-IDF RAG Stage 5 검색 정밀도 (Section 4)', SECTION_4_TFIDF, (tc) => {
    const results = tfidfEngine.search(tc.q, 3, 0.05);
    if (!results || results.length === 0) {
        return { pass: false, reason: '검색 결과 없음 (Score < 0.05)' };
    }
    const top1 = results[0];
    const certMatch = (top1.doc.cert || '').includes(tc.targetCert.slice(0, 3));
    const pass = certMatch && top1.score >= 0.05;
    return {
        pass,
        summary: `TOP 1 [점수: ${top1.score.toFixed(4)}] ${top1.doc.cert} - ${top1.doc.question || top1.doc.title}`,
        reason: `Target cert [${tc.targetCert}] mismatched with top1 [${top1.doc.cert}], score=${top1.score}`
    };
});

console.log('\n================================================================');
console.log(`      전체 시나리오 전수 검증 최종 결과: ${totalPass} / ${totalTests} PASS (${((totalPass / totalTests) * 100).toFixed(1)}%)      `);
console.log('================================================================');

if (totalFail > 0) {
    process.exit(1);
} else {
    console.log('🎉 축하합니다! 모든 50개 시나리오 및 규정 검증 케이스가 100% 무결하게 통과되었습니다.');
}
