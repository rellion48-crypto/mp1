const { DuduChatbot } = require('./chatbot.js');

const chatbot = new DuduChatbot();

const testCases = [
    { q: '한식조리 접수비 얼마예요?', expected: '14,500원' },
    { q: '지게차 시험비 얼마?', expected: '14,500원' },
    { q: '포크레인 필기 수수료', expected: '14,500원' },
    { q: '지게차 접수 언제 하나요?', expected: '상시' },
    { q: '합격자 발표는 언제 나와요?', expected: '즉시' },
    { q: '하루에 몇 부까지 시험이 있나요?', expected: '5부' },
    { q: '실기 시험 접수도 되나요?', expected: '필기 접수만' },
    { q: '전기기능사 접수 되나요?', expected: '3대 핵심' },
    { q: '공인중개사 접수 되나요?', expected: '3대 핵심 국가기술자격' },
    { q: '시험장에 주차 되나요?', expected: '안내 규정에 나와 있지 않아' },
    { q: '환불 규정 어떻게 되나요?', expected: '100%' },
    { q: '신분증 안 가져가면 어떻게 되나요?', expected: '신분증' },
    { q: '필기 합격 유효기간이 어떻게 되나요?', expected: '2년간' },
    { q: '동사무소 가서 접수하면 안 되나요?', expected: '온라인 접수만' },
    { q: '수험표 스마트폰으로 보여줘도 돼요?', expected: '종이로 출력' },
    { q: '소형 지게차 면허랑 뭐가 달라요?', expected: '별개의 자격' },
    { q: '사진 등록이 계속 실패해요', expected: '증명사진' }
];

console.log('=== 3-Core Qualification Chatbot Response Tests ===');
let passCount = 0;
for (const tc of testCases) {
    const ans = chatbot.generateResponse(tc.q);
    const passed = ans.includes(tc.expected);
    console.log((passed ? '✅ PASS' : '❌ FAIL') + ' | Q: ' + tc.q + ' | Ans: ' + ans.slice(0, 45) + '...');
    if (passed) passCount++;
}
console.log('Results: ' + passCount + ' / ' + testCases.length + ' passed.');
