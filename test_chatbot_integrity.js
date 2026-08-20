const { DuduChatbot } = require('./chatbot.js');

const chatbot = new DuduChatbot();

const INTEGRITY_TEST_CASES = [
    // 1. 50% 감면 vs 나이 50대 분리 검증 (핵심 수정 포인트!)
    { q: '응시료 50% 감면 기준', expected: '7,250원', tag: '감면_기준' },
    { q: '응시료 50% 감면 대상자', expected: '7,250원', tag: '감면_대상자' },
    { q: '50프로 할인 받으려면?', expected: '7,250원', tag: '감면_할인' },
    { q: '기초생활수급자 감면 혜택', expected: '7,250원', tag: '감면_수급자' },
    { q: '나이가 50대인데 가능할까요?', expected: '도전하시고', tag: '나이_50대' },
    { q: '60대인데 딸 수 있을까요?', expected: '도전하시고', tag: '나이_60대' },
    { q: '70살인데 시험 볼 수 있나요?', expected: '도전하시고', tag: '나이_70살' },
    
    // 2. 단독 키워드 및 3대 핵심자격증 우선순위 검증
    { q: '응시료', expected: '14,500원', tag: '응시료_단독' },
    { q: '한식조리 접수비 얼마예요?', expected: '14,500원', tag: '응시료_한식' },
    { q: '지게차 시험비 얼마?', expected: '14,500원', tag: '응시료_지게차' },
    { q: '포크레인 필기 수수료', expected: '14,500원', tag: '응시료_굴착기' },
    { q: '기능사 실기 수수료는 얼마예요?', expected: '26,900원', tag: '수수료_실기' },
    { q: '실기 시험 접수도 되나요?', expected: '필기 접수만', tag: '실기_거절' },
    
    // 3. 일정 및 시험 방식
    { q: '지게차 접수 언제 하나요?', expected: '상시 CBT', tag: '일정_지게차' },
    { q: '전기기능사 접수 기간이 언제예요?', expected: '8월 24일', tag: '일정_전기' },
    { q: '요양보호사 접수 언제까지예요?', expected: '7일 전', tag: '일정_요양' },
    { q: '공인중개사 올해 1차 시험 접수되나요?', expected: '이미 마감', tag: '일정_공인중개사' },
    { q: '원서접수 시작 시간은 몇 시예요?', expected: '10:00', tag: '일정_시작시각' },
    
    // 4. 합격, 유효기간, 시험시간
    { q: '합격자 발표는 언제 나와요?', expected: '즉시', tag: '합격_발표' },
    { q: '필기시험 합격 유효기간', expected: '2년간', tag: '유효기간' },
    { q: '하루에 몇 부까지 시험이 있나요?', expected: '5개 교시', tag: '시험시간' },
    
    // 5. 준비물 및 환불
    { q: '시험 당일 준비물', expected: '실물 신분증', tag: '준비물' },
    { q: '신분증 안 가져가면 어떻게 되나요?', expected: '실물 신분증', tag: '신분증' },
    { q: '환불 규정이 어떻게 되나요?', expected: '100%', tag: '환불_정규' },
    { q: '병원 입원해서 시험 못 보면 환불되나요?', expected: '100% 전액 환불', tag: '환불_사후' },
    { q: '가상계좌 언제까지 입금해야 하나요?', expected: '14시', tag: '환불_가상계좌' },
    
    // 6. 접수방법 및 보조 상담 지식
    { q: '동사무소 가서 접수하면 되나요?', expected: '방문 접수가 불가능', tag: '접수_동사무소' },
    { q: '수험표 핸드폰으로 보여줘도 되나요?', expected: '종이로 출력', tag: '수험표_스마트폰' },
    { q: '소형 지게차 면허랑 뭐가 달라요?', expected: '별개의 자격', tag: '소형면허_차이' },
    { q: '사진 등록이 계속 실패해요', expected: '3.5cm x 4.5cm', tag: '사진_등록' },
    
    // 7. 확인불가(거절) 항목
    { q: '시험장에 주차 되나요?', expected: '안내 규정에 나와 있지 않아', tag: '거절_주차' },
    { q: '요양보호사 응시료 얼마예요?', expected: '국시원', tag: '거절_요양응시료' },
    { q: '제가 합격할 수 있을까요? 교재 추천해줘요', expected: '사내 규정 안내 범위를 벗어나', tag: '거절_교재추천' },
    
    // 8. 일상 감사 및 인사
    { q: '고마워유', expected: '도움이 되어', tag: '일상_감사' },
    { q: '안녕하세요', expected: '반갑습니다', tag: '일상_인사' }
];

console.log('================================================================');
console.log('   두두자격지원센터 챗봇 룰베이스 엔진 전수 무결성(Integrity) 테스트   ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

for (let i = 0; i < INTEGRITY_TEST_CASES.length; i++) {
    const tc = INTEGRITY_TEST_CASES[i];
    const answer = chatbot.generateResponse(tc.q);
    const passed = answer.includes(tc.expected);

    if (passed) {
        passCount++;
        console.log(`[PASS ${i + 1}/${INTEGRITY_TEST_CASES.length}] [${tc.tag}] Q: "${tc.q}"`);
        console.log(`       ➔ Ans: ${answer.slice(0, 75)}...\n`);
    } else {
        failCount++;
        console.error(`❌ [FAIL ${i + 1}/${INTEGRITY_TEST_CASES.length}] [${tc.tag}] Q: "${tc.q}"`);
        console.error(`       Expected keyword: "${tc.expected}"`);
        console.error(`       Actual response : "${answer}"\n`);
    }
}

console.log('================================================================');
console.log(`전체 테스트 결과: ${passCount} / ${INTEGRITY_TEST_CASES.length} PASS (성공률: ${((passCount / INTEGRITY_TEST_CASES.length) * 100).toFixed(1)}%)`);
console.log('================================================================');

if (failCount > 0) {
    process.exit(1);
} else {
    console.log('🎉 모든 35개 무결성 테스트 케이스 100% 통과 완료!');
}
