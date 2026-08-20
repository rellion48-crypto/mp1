const fs = require('fs');
const path = require('path');
const { tfidfEngine } = require('./lib/tfidf.js');

console.log('================================================================');
console.log('   [Stage 5 기준] TF-IDF 8대 표준 예제 질문 전수 정밀도 점검    ');
console.log('================================================================\n');

const dataPath = path.join(__dirname, 'data', 'faq_knowledge_base.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

tfidfEngine.buildIndex(rawData);
console.log(`총 ${rawData.length}건 색인 완료. min_score 기준: 0.05, top_k: 3\n`);

const STAGE5_BENCHMARK_CASES = [
    {
        q: "한식조리기능사 시험비가 얼마예요?",
        targetCert: "한식조리기능사",
        keyword: "14,500",
        desc: "한식조리 시험비"
    },
    {
        q: "지게차 접수는 어디서 해요?",
        targetCert: "지게차운전기능사",
        keyword: "큐넷",
        desc: "지게차 접수처"
    },
    {
        q: "전기기능사 계산기 반입 되나요?",
        targetCert: "전기기능사",
        keyword: "계산기",
        desc: "전기기능사 계산기 반입"
    },
    {
        q: "요양보호사 합격 기준이 몇 점이에요?",
        targetCert: "요양보호사",
        keyword: "60",
        desc: "요양보호사 합격점수"
    },
    {
        q: "공인중개사 환불 규정이 어떻게 되나요?",
        targetCert: "공인중개사",
        keyword: "환불",
        desc: "공인중개사 환불 규정"
    },
    {
        q: "위생사 응시 자격이 있나요?",
        targetCert: "위생사",
        keyword: "응시",
        desc: "위생사 응시자격"
    },
    {
        q: "손해평가사 접수 기간이 언제예요?",
        targetCert: "손해평가사",
        keyword: "접수",
        desc: "손해평가사 접수기간"
    },
    {
        q: "굴착기 실기시험 준비물이 뭐예요?",
        targetCert: "굴착기운전기능사",
        keyword: "신분증",
        desc: "굴착기 실기 준비물"
    },
    {
        q: "굴착기 접수비",
        targetCert: "굴착기운전기능사",
        keyword: "14,500",
        desc: "굴착기 높은 IDF 종목 구분력 (S4 실패 -> S5 성공 핵심 기준)"
    }
];

let passCount = 0;

for (let i = 0; i < STAGE5_BENCHMARK_CASES.length; i++) {
    const tc = STAGE5_BENCHMARK_CASES[i];
    const results = tfidfEngine.search(tc.q, 3, 0.05);

    console.log(`[테스트 ${i + 1}/9] Q: "${tc.q}" (${tc.desc})`);

    if (!results || results.length === 0) {
        console.error(`  ❌ [FAIL] 검색 결과 없음 (score < 0.05)\n`);
        continue;
    }

    const top1 = results[0];
    const certMatch = (top1.doc.cert || '').includes(tc.targetCert.slice(0, 3));
    const isAboveMinScore = top1.score >= 0.05;

    console.log(`  ➔ TOP 1 [유사도: ${top1.score.toFixed(4)}] [${top1.doc.cert || '공통'}/${top1.doc.category || '상담'}] ${top1.doc.question || top1.doc.title}`);
    console.log(`     답변: ${top1.doc.answer.slice(0, 75)}...`);

    if (isAboveMinScore && certMatch) {
        passCount++;
        console.log(`  ✅ [PASS] Stage 5 기준 충족 (종목 정확도 일치 & score >= 0.05)\n`);
    } else {
        console.log(`  ⚠️ [주의] 종목 불일치 또는 점수 미달\n`);
    }
}

console.log('================================================================');
console.log(`Stage 5 TF-IDF 기준 점검 결과: ${passCount} / ${STAGE5_BENCHMARK_CASES.length} PASS (${((passCount / STAGE5_BENCHMARK_CASES.length) * 100).toFixed(1)}%)`);
console.log('================================================================');
