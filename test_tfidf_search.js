const fs = require('fs');
const path = require('path');
const { tfidfEngine } = require('./lib/tfidf.js');

console.log('================================================================');
console.log('   시나리오 확장 TF-IDF 검색 엔진 4,705건 색인 및 정밀도 테스트   ');
console.log('================================================================\n');

const dataPath = path.join(__dirname, 'data', 'faq_knowledge_base.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`[1] 4,705건 지식 데이터셋 로딩 완료 (${rawData.length}건)`);
const startTime = Date.now();
tfidfEngine.buildIndex(rawData);
const indexTime = Date.now() - startTime;
console.log(`[2] TF-IDF 인덱스 구축 완료: ${indexTime}ms (단어 사전 크기: ${tfidfEngine.vocab.size}개 단어)\n`);

const TEST_QUERIES = [
    '굴착기 접수비 얼마인가요?',
    '지게차 3톤 미만 면허랑 차이가 뭔가요?',
    '동사무소 가서 접수하면 되나요?',
    '수험표 스마트폰으로 보여줘도 되나요?',
    '가상계좌 입금 기한이 언제까지예요?',
    '사진 등록이 자꾸 실패해요',
    '기초생활수급자 응시료 50% 감면',
    '전기기능사 시험 일정 언제인가요?'
];

console.log('[3] 시나리오별 TF-IDF 검색 결과:\n');

for (const q of TEST_QUERIES) {
    const qStart = process.hrtime.bigint();
    const results = tfidfEngine.search(q, 3);
    const qEnd = process.hrtime.bigint();
    const qLatency = Number(qEnd - qStart) / 1000000;

    console.log(`🔍 질문: "${q}" (검색 소요시간: ${qLatency.toFixed(3)}ms)`);
    results.forEach((r, i) => {
        console.log(`   [TOP ${i + 1}] (유사도: ${r.score.toFixed(4)}) [${r.doc.cert || '공통'}/${r.doc.category || '상담'}] ${r.doc.question || r.doc.title}`);
        console.log(`          ➔ ${r.doc.answer.slice(0, 70)}...`);
    });
    console.log('----------------------------------------------------------------');
}

console.log('\n🎉 시나리오 확장 TF-IDF 검색 엔진 검증 완료!');
