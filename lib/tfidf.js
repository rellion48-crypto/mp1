/**
 * [lib/tfidf.js] 순수 JavaScript 기반 고성능 TF-IDF 검색 엔진 & 시나리오 확장기
 * - 4,705건 Q&A 문서에 대한 실시간 TF-IDF 인덱스 및 코사인 유사도(Cosine Similarity) 계산
 * - 시니어 맞춤형 8대 시나리오 쿼리 확장 (Scenario Query Expansion)
 * - 불용어(Stopwords) 필터링 및 형태소 바이그램(Bi-gram) 토크나이저
 */

// 불용어 (흔하게 반복되어 변별력이 없는 단어)
const STOPWORDS = new Set([
    '있나요', '있습니까', '되나요', '되나요유', '알려주세요', '궁금합니다', '어떻게',
    '관련', '대한', '대해', '관한', '대하여', '문의', '질문', '안내', '사항',
    '것인가요', '무엇인가요', '인가요', '어디서', '어디', '어떤', '있는', '없는',
    '입니다', '합니다', '바랍니다', '드립니다', '하는', '하면', '하고'
]);

// 시니어 및 수험자 8대 시나리오 동의어/연관어 확장 매핑
const SCENARIO_EXPANSIONS = {
    // 1. 자격증 종목 시나리오
    '한식': ['한식조리', '한식조리기능사', '한조기', '요리', '조리기능사', '음식'],
    '지게차': ['지게차운전기능사', '지게차면허', '중장비', '운전기능사'],
    '굴착기': ['굴착기운전기능사', '포크레인', '포클레인', '중장비'],
    '포크레인': ['굴착기', '굴착기운전기능사', '포클레인'],
    '전기': ['전기기능사', '전기기사', '정기시험', '4회차'],
    '요양보호사': ['요양사', '요보사', '국시원', '보건의료'],
    '공인중개사': ['공개사', '부동산', '전문자격', '1차시험', '2차시험'],
    '손해평가사': ['손평사', '농어업재해보험', '전문자격'],

    // 2. 비용 및 감면 시나리오
    '응시료': ['접수비', '시험비', '수수료', '비용', '금액', '돈', '결제금액', '등록금', '14500원'],
    '감면': ['50%', '50프로', '할인', '기초생활수급자', '기초수급', '차상위', '국가유공자', '장애인', '반값', '7250원'],
    '환불': ['취소', '돈돌려', '환불규정', '취소환불', '전액환불', '토스페이먼츠', '사후환불', '특별환불'],
    '가상계좌': ['무통장', '입금기한', '계좌이체', '자동취소', '14시'],

    // 3. 접수 방식 및 장소 시나리오
    '동사무소': ['주민센터', '행정복지센터', '우체국', '방문접수', '현장접수', '온라인접수', '큐넷', '대리접수', '무료대행'],
    '사진': ['증명사진', '컬러사진', '사진규격', '사진오류', '사진실패', '3.5x4.5', '여권용'],
    '수험표': ['입장표', '스마트폰', '핸드폰', '모바일', '종이출력', '인쇄'],

    // 4. 시험 일정 및 방식 시나리오
    '상시': ['cbt', '컴퓨터시험', '상시시험', '빈자리', '상시접수', '원하는날짜'],
    '교시': ['몇부', '1부', '2부', '3부', '4부', '5부', '시험시간', '60분', '09:00', '시간표'],
    '합격': ['발표', '합격자', '당일발표', '점수', '결과', '즉시확인', '합격여부', '몇점'],
    '유효기간': ['필기합격', '면제', '2년', '2년간', '실기언제까지'],

    // 5. 차이 및 세부 자격 시나리오
    '소형': ['3톤미만', '소형건설기계', '교육이수증', '면허차이', '소형지게차', '소형굴착기']
};

class TfIdfSearchEngine {
    constructor() {
        this.documents = [];
        this.docCount = 0;
        this.vocab = new Map(); // term -> termId
        this.idf = []; // termId -> idf weight
        this.docVectors = []; // docIndex -> Map(termId -> tfidf)
        this.docLengths = []; // docIndex -> L2 norm
        this.isIndexed = false;
    }

    /**
     * 한국어 형태소 및 단어 단위 토크나이저 (Uni-gram + Bi-gram)
     */
    tokenize(text) {
        if (!text || typeof text !== 'string') return [];
        const clean = text.toLowerCase().replace(/[^가-힣a-zA-Z0-9\s%]/g, ' ');
        const rawWords = clean.split(/\s+/).filter(w => w.length > 0 && !STOPWORDS.has(w));
        
        const tokens = [];
        for (let i = 0; i < rawWords.length; i++) {
            const word = rawWords[i];
            tokens.push(word);

            // 2글자 이상 복합어 Bi-gram 생성
            if (i < rawWords.length - 1) {
                const nextWord = rawWords[i + 1];
                if (word.length >= 2 && nextWord.length >= 2) {
                    tokens.push(`${word}_${nextWord}`);
                }
            }
        }
        return tokens;
    }

    /**
     * 시나리오 기반 쿼리 확장 (Scenario Query Expansion)
     */
    expandQuery(query) {
        if (!query) return '';
        let expanded = query.toLowerCase();
        
        for (const [key, relatedWords] of Object.entries(SCENARIO_EXPANSIONS)) {
            if (expanded.includes(key)) {
                expanded += ' ' + relatedWords.join(' ');
            }
        }
        return expanded;
    }

    /**
     * 4,705건 FAQ 문서 컬렉션 색인 (TF-IDF Indexing)
     */
    buildIndex(docs) {
        this.documents = docs || [];
        this.docCount = this.documents.length;
        if (this.docCount === 0) return;

        this.vocab.clear();
        const docTermFreqs = [];
        const docFreqMap = new Map(); // termId -> doc count

        // 1. 단어 빈도(TF) 수집
        for (let i = 0; i < this.docCount; i++) {
            const doc = this.documents[i];
            const content = `${doc.cert || ''} ${doc.category || ''} ${doc.title || ''} ${doc.question || ''} ${doc.answer || ''} ${doc.keywords || ''}`;
            const tokens = this.tokenize(content);

            const tfMap = new Map();
            const uniqueTermsInDoc = new Set();

            for (const token of tokens) {
                let termId = this.vocab.get(token);
                if (termId === undefined) {
                    termId = this.vocab.size;
                    this.vocab.set(token, termId);
                }

                tfMap.set(termId, (tfMap.get(termId) || 0) + 1);
                uniqueTermsInDoc.add(termId);
            }

            // Document Frequency 갱신
            for (const termId of uniqueTermsInDoc) {
                docFreqMap.set(termId, (docFreqMap.get(termId) || 0) + 1);
            }

            docTermFreqs.push({ tfMap, totalTokens: tokens.length || 1 });
        }

        // 2. 역문서 빈도 (IDF) 계산: Smooth IDF = log((N + 1) / (DF + 1)) + 1
        const vocabSize = this.vocab.size;
        this.idf = new Float32Array(vocabSize);
        for (let termId = 0; termId < vocabSize; termId++) {
            const df = docFreqMap.get(termId) || 0;
            this.idf[termId] = Math.log((this.docCount + 1) / (df + 1)) + 1.0;
        }

        // 3. 각 문서의 TF-IDF 벡터 및 L2 정규화 Norm 사전 계산
        this.docVectors = [];
        this.docLengths = new Float32Array(this.docCount);

        for (let i = 0; i < this.docCount; i++) {
            const { tfMap, totalTokens } = docTermFreqs[i];
            const vec = new Map();
            let sumSq = 0;

            for (const [termId, count] of tfMap.entries()) {
                const tf = count / totalTokens;
                const tfidf = tf * this.idf[termId];
                vec.set(termId, tfidf);
                sumSq += tfidf * tfidf;
            }

            this.docVectors.push(vec);
            this.docLengths[i] = Math.sqrt(sumSq) || 1.0;
        }

        this.isIndexed = true;
    }

    /**
     * 시나리오 확장 TF-IDF + Cosine Similarity 검색
     * @param {string} query 사용자 질문
     * @param {number} topK 반환할 문서 수
     * @param {number} minScore 최소 유사도 컷오프
     * @returns {Array<{score: number, doc: object}>}
     */
    search(query, topK = 4, minScore = 0.03) {
        if (!this.isIndexed || !query) return [];

        // 1. 시나리오 쿼리 확장
        const expandedQuery = this.expandQuery(query);
        const qTokens = this.tokenize(expandedQuery);
        if (qTokens.length === 0) return [];

        // 2. 쿼리 TF-IDF 벡터 생성
        const qTfMap = new Map();
        for (const token of qTokens) {
            const termId = this.vocab.get(token);
            if (termId !== undefined) {
                qTfMap.set(termId, (qTfMap.get(termId) || 0) + 1);
            }
        }

        if (qTfMap.size === 0) return [];

        const qVec = new Map();
        let qSumSq = 0;
        const qTotal = qTokens.length;

        for (const [termId, count] of qTfMap.entries()) {
            const tf = count / qTotal;
            const tfidf = tf * this.idf[termId];
            qVec.set(termId, tfidf);
            qSumSq += tfidf * tfidf;
        }
        const qNorm = Math.sqrt(qSumSq) || 1.0;

        // 3. 코사인 유사도(Cosine Similarity) 계산 및 시나리오 부스팅
        const scored = [];
        const rawQueryLower = query.toLowerCase();

        for (let i = 0; i < this.docCount; i++) {
            const docVec = this.docVectors[i];
            let dotProduct = 0;

            for (const [termId, qVal] of qVec.entries()) {
                const docVal = docVec.get(termId);
                if (docVal !== undefined) {
                    dotProduct += qVal * docVal;
                }
            }

            if (dotProduct <= 0) continue;

            let cosineSim = dotProduct / (qNorm * this.docLengths[i]);

            // 자격종목 일치 시나리오 부스팅 (+15%)
            const doc = this.documents[i];
            if (doc.cert && rawQueryLower.includes(doc.cert.toLowerCase())) {
                cosineSim *= 1.25;
            }
            // 질문 제목에 직접 매칭 부스팅 (+10%)
            if (doc.question && rawQueryLower.includes(doc.question.slice(0, 8).toLowerCase())) {
                cosineSim *= 1.15;
            }

            if (cosineSim >= minScore) {
                scored.push({ score: cosineSim, doc });
            }
        }

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
}

// 싱글톤 인스턴스
const tfidfEngine = new TfIdfSearchEngine();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TfIdfSearchEngine, tfidfEngine, SCENARIO_EXPANSIONS, STOPWORDS };
}
