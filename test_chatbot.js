const { DuduChatbot } = require('./chatbot.js');

const chatbot = new DuduChatbot();

const testCases = [
    { q: '한식조리 접수비 얼마예요?', expected: '14,500원' },
    { q: '요양사 시험비 얼마?', expected: '32,000원' },
    { q: '포크레인 필기 수수료', expected: '14,500원' },
    { q: '전기기능사 시험 일정 언제?', expected: '2026.08.24' },
    { q: '공인중개사 접수 마감됐나요?', expected: '마감' },
    { q: '실기 시험 접수도 되나요?', expected: '필기 접수만' },
    { q: '시험장에 주차 되나요?', expected: '모르겠습니다' },
    { q: '합격자 발표 몇 시에 나요?', expected: '모르겠습니다' },
    { q: '환불 규정 어떻게 되나요?', expected: '환불' },
    { q: '신분증 안 가져가면 어떻게 되나요?', expected: '신분증' },
    { q: '필기 합격 유효기간이 어떻게 되나요?', expected: '2년간' }
];

console.log('=== Chatbot Response Tests ===');
let passCount = 0;
for (const tc of testCases) {
    const ans = chatbot.generateResponse(tc.q);
    const passed = ans.includes(tc.expected);
    console.log((passed ? '✅ PASS' : '❌ FAIL') + ' | Q: ' + tc.q + ' | Ans: ' + ans.slice(0, 45) + '...');
    if (passed) passCount++;
}
console.log('Results: ' + passCount + ' / ' + testCases.length + ' passed.');
