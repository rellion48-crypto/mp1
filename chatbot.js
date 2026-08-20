/**
 * 두두자격지원센터 - 시니어 3대 핵심 국가기술자격 AI 챗봇 (두두봇)
 * - AI 정밀상담 모드 (Gemini 3.5 Flash /api/chat RAG 연동)
 * - 사내규정 빠른검색 모드 (무결성 4단계 계층형 룰베이스 엔진)
 * - 4.5초 타임아웃 및 무중단 자동 폴백
 * - IIFE로 감싸서 인라인 스크립트와 충돌 방지
 */
(function() {
'use strict';

const SUPABASE_CONFIG = {
    URL: "https://amlznptemtbkhyuzdkmu.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHpucHRlbXRia2h5dXpka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzcxMTQsImV4cCI6MjEwMjY1MzExNH0.DY_P3C5G136AuhSYAn7RvMKQfEOPxKmN-wI__f3fjfg"
};

if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function' && !window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
}

/**
 * 사내 23종 공식 안내 규정 원장 (Master Source of Truth - 불변 1순위)
 */
const MASTER_OFFICIAL_REGULATIONS = [
    {
        id: 1,
        category: '응시료',
        qualification: '3대 기능사 공통 (한식, 지게차, 굴착기)',
        question: '한식조리, 지게차, 굴착기운전기능사 필기 응시료는 얼마인가요?',
        keywords: '응시료,접수비,시험비,비용,얼마,한식,한식조리,지게차,굴착기,포크레인,수수료,돈,기능사,금액,얼마예요,필기응시료,필기비용',
        answer: '어르신, 한식조리기능사, 지게차운전기능사, 굴착기운전기능사 3종 모두 필기 응시료는 14,500원으로 동일합니다. (기초생활수급자, 등록장애인, 국가유공자, 차상위계층 대상자는 50% 감면된 7,250원입니다.)',
        is_unknown: false
    },
    {
        id: 2,
        category: '응시료',
        qualification: '국가기술자격 실기 수수료',
        question: '기능사 실기시험 응시료(수수료)는 얼마인가요?',
        keywords: '실기,실기비용,실기응시료,실기수수료,2차비용,실습비,전기기능사실기,한식실기,지게차실기,굴착기실기,실기시험비',
        answer: '국가기술자격 실기시험 수수료는 종목마다 다릅니다. 한식조리기능사는 26,900원, 지게차운전기능사는 25,200원, 굴착기운전기능사는 27,800원이며, 전기기능사 실기는 재료비 등으로 인해 106,200원입니다.',
        is_unknown: false
    },
    {
        id: 3,
        category: '응시료',
        qualification: '사회적 배려계층 감면',
        question: '응시료 50% 감면 대상자는 누구이고 얼마를 내나요?',
        keywords: '감면,50%,50프로,할인,기초수급자,차상위,국가유공자,장애인,면제,혜택,감면대상,감면기준,감면혜택,반값',
        answer: '기초생활수급자, 등록장애인, 국가유공자, 차상위계층에 해당하시는 어르신께서는 정규 필기 응시료(14,500원)의 50%가 감면되어 7,250원만 결제하시면 됩니다.',
        is_unknown: false
    },
    {
        id: 4,
        category: '일정/방식',
        qualification: '3대 기능사 공통 (상시 CBT)',
        question: '한식, 지게차, 굴착기 시험 접수 기간과 시험 방식은 어떻게 되나요?',
        keywords: '접수기간,언제접수,상시,cbt,컴퓨터시험,시험방식,신청기간,날짜,시험일정,언제,일정,접수날짜',
        answer: '한식조리, 지게차, 굴착기 3대 종목은 별도의 정기 접수 기간 없이 상시 CBT(컴퓨터 시험)로 운영됩니다. 시험장에 빈자리가 있으면 원하시는 날짜와 교시를 선택해 언제든 접수하실 수 있습니다.',
        is_unknown: false
    },
    {
        id: 5,
        category: '일정/방식',
        qualification: '전기기능사 (정기 회차)',
        question: '전기기능사 시험 일정과 접수 기간은 어떻게 되나요?',
        keywords: '전기기능사,전기,정기시험,정기회차,4회,전기일정,전기접수,전기시험',
        answer: '전기기능사는 연 4회 정기 시험으로 진행됩니다. 2026년 기준 가장 가까운 제4회 필기 원서접수는 8월 24일부터 8월 27일까지이며, 필기시험은 9월 16일부터 9월 21일까지 치러집니다. (빈자리 추가접수는 9월 10일~11일)',
        is_unknown: false
    },
    {
        id: 6,
        category: '일정/방식',
        qualification: '요양보호사 (국시원 상시)',
        question: '요양보호사 시험 접수는 언제까지 해야 하나요?',
        keywords: '요양보호사,요양사,국시원,요양접수,요양일정,요양보호사접수',
        answer: '요양보호사 시험은 국시원 상시시험 사이트에서 접수하며, 원하시는 시험일 기준 7일 전까지 접수를 마치셔야 합니다. 합격자 발표는 시험 다음 날 오전 10시 이후(주말·공휴일 제외)에 공지됩니다.',
        is_unknown: false
    },
    {
        id: 7,
        category: '일정/방식',
        qualification: '손해평가사 / 공인중개사 (연 1회)',
        question: '손해평가사, 공인중개사 올해 1차 시험 접수할 수 있나요?',
        keywords: '손해평가사,공인중개사,부동산,1차,올해접수,전문자격,손평사,공개사',
        answer: '손해평가사(제12회 1차, 4월 마감)와 공인중개사(제37회 1차, 8월 마감)는 모두 연 1회 시행되는 시험으로 올해 1차 원서접수가 이미 마감되었습니다. 따라서 올해는 접수가 불가능하며 내년 시험에 응시하셔야 합니다.',
        is_unknown: false
    },
    {
        id: 8,
        category: '일정/방식',
        qualification: '접수 시작 시간',
        question: '원서접수 시작 시각은 몇 시인가요?',
        keywords: '접수시간,몇시,시작시간,오전9시,오전10시,오픈시간,몇시에시작',
        answer: '국가기술자격 기능사(한식, 지게차, 굴착기, 전기)는 첫날 오전 10:00에 접수가 시작되며, 전문자격(손해평가사, 공인중개사)은 전용 사이트에서 오전 09:00에 시작됩니다. 선착순 마감이므로 시간을 잘 확인하셔야 합니다.',
        is_unknown: false
    },
    {
        id: 9,
        category: '합격발표',
        qualification: '3대 기능사 공통 (상시 CBT)',
        question: '합격자 발표는 언제 나오나요?',
        keywords: '합격,발표,언제나와,결과,점수,당일,합격자,합격여부,몇점합격,합격점수',
        answer: '한식조리, 지게차, 굴착기운전기능사 상시 CBT 시험은 컴퓨터로 치러지므로, 시험 종료 버튼을 누르면 그 자리에서 즉시 점수와 합격 여부를 확인하실 수 있습니다.',
        is_unknown: false
    },
    {
        id: 10,
        category: '유효기간',
        qualification: '국가기술자격 기능사 공통',
        question: '필기시험에 합격하면 유효기간이 얼마나 되나요?',
        keywords: '유효기간,필기면제,면제기간,2년,필기합격,실기언제까지,면제',
        answer: '국가기술자격(기능사)은 필기시험 합격일로부터 2년간 필기시험이 면제됩니다. 2년 이내에 원하시는 실기시험에 접수하여 응시하시면 됩니다.',
        is_unknown: false
    },
    {
        id: 11,
        category: '시험시간',
        qualification: '상시 CBT 교시 안내',
        question: '하루에 몇 부(교시)까지 시험이 있고 시간은 얼마나 걸리나요?',
        keywords: '교시,몇부,시간,시험시간,1부,2부,3부,4부,5부,60분,소요시간,몇교시',
        answer: '상시 CBT 시험은 기능사 기준 시험시간이 60분이며, 하루에 1부(09:00), 2부(11:00), 3부(13:00), 4부(15:00), 5부(17:00) 총 5개 교시로 나뉘어 진행됩니다.',
        is_unknown: false
    },
    {
        id: 12,
        category: '시험준비물',
        qualification: '시험장 지참물 및 반입 규정',
        question: '시험 당일 준비물과 시험실에 가지고 들어갈 수 있는 물품은 무엇인가요?',
        keywords: '준비물,신분증,수험표,필기도구,스마트폰,휴대폰,스마트워치,시계,계산기,지참물,가져갈것,신분증없으면,신분증안가져가면',
        answer: '시험 당일에는 실물 신분증(주민등록증·운전면허증 등), 수험표, 흑색 필기구를 반드시 지참하셔야 합니다. 시험실에는 신분증, 수험표, 필기구, 수정테이프, 일반시계, 계산기, 간식 등 8가지만 허용되며, 스마트폰·스마트워치 등 전자기기는 소지 시 즉시 시험이 무효 처리됩니다.',
        is_unknown: false
    },
    {
        id: 13,
        category: '결제/환불',
        qualification: '정규 환불 규정',
        question: '접수 후 취소하면 환불을 얼마나 받을 수 있나요?',
        keywords: '환불,취소,환불금액,전액환불,50%환불,환불기간,토스페이먼츠,돈돌려,취소환불',
        answer: '원서접수 기간 내 취소 시에는 100% 전액 환불되며, 접수 마감 후부터 해당 시험 시작 5일 전까지는 50%가 환불됩니다. (시험 시작 4일 전부터는 환불 불가). 환불금은 최대 7일 이내 \'토스페이먼츠\' 명의로 입금됩니다.',
        is_unknown: false
    },
    {
        id: 14,
        category: '결제/환불',
        qualification: '사후 특별 환불 (100%)',
        question: '시험을 못 보게 되었는데 사후 환불(100%)을 받을 수 있는 사유가 있나요?',
        keywords: '사후환불,입원,사망,상,전염병,격리,천재지변,교통두절,특별환불,병원,다쳐서',
        answer: '접수기간 이후라도 직계가족(부모·배우자·자녀 등) 사망, 본인의 질병·사고 입원, 국가 전염병 격리, 천재지변으로 인한 교통 두절 등의 불가피한 사유가 있을 경우 증빙서류를 제출하시면 100% 전액 환불받으실 수 있습니다.',
        is_unknown: false
    },
    {
        id: 15,
        category: '결제/환불',
        qualification: '가상계좌 입금 기한',
        question: '가상계좌로 결제할 때 언제까지 입금해야 하나요?',
        keywords: '가상계좌,무통장,입금기한,언제까지입금,자동취소,입금시간,계좌이체',
        answer: '가상계좌는 접수 시점에 따라 기한이 다릅니다. 마감일 전날 13시 이전 접수는 당일 14시까지, 13시 이후 접수는 익일 14시까지 입금하셔야 합니다. 마감일 당일 13시 이후에는 가상계좌 채번이 불가하므로 카드나 실시간 계좌이체를 이용하셔야 합니다.',
        is_unknown: false
    },
    {
        id: 16,
        category: '접수방법',
        qualification: '공통 (시니어 무료 대행)',
        question: '컴퓨터나 스마트폰 사용이 어려운데 전화나 방문으로도 접수가 가능한가요? (동사무소 방문 등)',
        keywords: '전화접수,방문접수,접수대행,도와줘,신청해줘,어려워,인터넷못해,동사무소,주민센터,우체국,현장접수',
        answer: '국가기술자격은 동사무소나 우체국 방문 접수가 불가능하며 큐넷 온라인 접수만 가능합니다. 인터넷 사용이 어려우신 어르신들을 위해 저희 두두자격지원센터에서 성함과 연락처만 남겨주시면 무료로 원서접수를 대행해 드립니다.',
        is_unknown: false
    },
    {
        id: 17,
        category: '확인불가',
        qualification: '요양보호사',
        question: '요양보호사 자격증 응시료는 얼마인가요?',
        keywords: '요양보호사응시료,요양보호사비용,요양사수수료,요양보호사돈',
        answer: '죄송합니다. 요양보호사 응시료 금액은 사내 안내 규정 문서에 명시되어 있지 않아 정확한 안내가 어렵습니다. (국시원 홈페이지를 통해 확인해 주시기 바랍니다.)',
        is_unknown: true
    },
    {
        id: 18,
        category: '확인불가',
        qualification: '위생사',
        question: '위생사 자격증 시험 일정과 응시료는 어떻게 되나요?',
        keywords: '위생사,위생사일정,위생사응시료,위생사비용,위생사수수료',
        answer: '죄송합니다. 위생사 시험 일정 및 응시료는 사내 안내 규정에 기재되어 있지 않아 답변드릴 수 없습니다. (국시원 대표 홈페이지에서 확인 부탁드립니다.)',
        is_unknown: true
    },
    {
        id: 19,
        category: '확인불가',
        qualification: '손해평가사 / 공인중개사',
        question: '손해평가사 또는 공인중개사 1차 시험 응시료는 얼마인가요?',
        keywords: '손해평가사응시료,공인중개사응시료,손해평가사비용,공인중개사비용,손해평가사수수료,공인중개사수수료',
        answer: '죄송합니다. 손해평가사 및 공인중개사 1차 응시료 금액은 사내 규정 원장에 등록되어 있지 않아 안내가 불가합니다. (큐넷 전문자격 홈페이지를 참조해 주십시오.)',
        is_unknown: true
    },
    {
        id: 20,
        category: '확인불가',
        qualification: '요양보호사 교육 이수',
        question: '요양보호사 응시자격 교육 이수 시간은 몇 시간인가요?',
        keywords: '요양보호사이수시간,요양보호사교육시간,요양보호사자격조건,요양보호사이수',
        answer: '죄송합니다. 요양보호사 교육 이수 시간 및 상세 응시자격 요건은 사내 규정 문서에 확인되지 않아 안내가 어렵습니다.',
        is_unknown: true
    },
    {
        id: 21,
        category: '확인불가',
        qualification: '공인중개사 1차 면제',
        question: '공인중개사 1차 시험에 합격하면 2차 면제 기간이 정말 1년인가요?',
        keywords: '공인중개사면제,공인중개사1년,공인중개사유효기간',
        answer: '죄송합니다. 공인중개사 1차 합격에 따른 면제 기간은 사내 규정 원장에서 공식 확인되지 않았으므로 정확한 답변을 드릴 수 없습니다.',
        is_unknown: true
    },
    {
        id: 22,
        category: '확인불가',
        qualification: '시험장 시설/주차',
        question: '시험장에 주차장이 있나요? 주차나 셔틀버스가 지원되나요?',
        keywords: '주차,주차장,차댈곳,셔틀버스,대중교통,주차비',
        answer: '죄송합니다. 시험장별 주차 가능 여부나 셔틀버스 운행 정보는 사내 안내 규정에 나와 있지 않아 안내가 어렵습니다. 시험장 본부로 직접 문의해 주시기 바랍니다.',
        is_unknown: true
    },
    {
        id: 23,
        category: '확인불가',
        qualification: '개인 상담',
        question: '제가 이번 시험에 합격할 수 있을까요? 교재나 강의를 추천해 주세요.',
        keywords: '합격할까요,붙을수있나요,교재추천,학원추천,강의추천,난이도',
        answer: '죄송합니다. 개인의 시험 합격 가능성이나 사설 교재/강의 추천은 사내 규정 안내 범위를 벗어나 답변드릴 수 없습니다. 어르신의 도전을 진심으로 응원합니다!',
        is_unknown: true
    }
];

/**
 * 보조 상담 지식 (Tier 2 보강)
 */
const AUXILIARY_KNOWLEDGE = [
    {
        id: 101,
        category: '수험표',
        qualification: '공통',
        question: '수험표를 스마트폰으로 보여줘도 되나요?',
        keywords: '수험표스마트폰,수험표핸드폰,수험표모바일,수험표출력,수험표인쇄,수험표어디서,입장표',
        answer: '수험표는 큐넷 홈페이지에서 미리 종이로 출력해서 지참하시는 것을 권장드립니다. 시험장 본부나 수험자 마이페이지에서 출력이 가능합니다.'
    },
    {
        id: 102,
        category: '소형면허차이',
        qualification: '지게차/굴착기',
        question: '소형건설기계 조종면허와 국가기술자격 기능사의 차이는 무엇인가요?',
        keywords: '소형면허,소형지게차,소형굴착기,작은거면허,차이,소형면허차이,3톤미만',
        answer: '3톤 미만 소형건설기계 조종교육 이수증(면허)과 한국산업인력공단의 국가기술자격 기능사는 별개의 자격입니다. 소형 면허가 있더라도 기능사 자격 취득을 위해서는 필기시험부터 응시하셔야 합니다.'
    },
    {
        id: 103,
        category: '사진등록',
        qualification: '공통',
        question: '원서접수 사진 규격과 등록 오류 해결법은 무엇인가요?',
        keywords: '사진등록,사진규격,증명사진,사진오류,사진실패,셀카,사진크기',
        answer: '최근 6개월 이내 촬영한 3.5cm x 4.5cm 컬러 증명사진 파일(JPG)이어야 등록이 가능합니다. 배경이 깔끔하고 정면을 응시한 사진이어야 하며 셀카나 흐린 사진은 등록 오류가 발생할 수 있습니다.'
    },
    {
        id: 104,
        category: '기타자격증',
        qualification: '기타 종목 안내',
        question: '전기기능사, 요양보호사, 공인중개사 등 다른 자격증도 접수되나요?',
        keywords: '다른자격증,기타자격증,위생사접수,손해평가사접수,공인중개사접수',
        answer: '저희 센터는 현재 중장년 어르신 취업에 가장 수요가 높은 3대 핵심 국가기술자격(한식조리, 지게차운전, 굴착기운전기능사) 필기 원서접수에 집중하여 전문 지원해 드리고 있습니다. (기타 종목은 추후 지원 예정입니다.)'
    }
];

let SENIOR_SYNONYMS = {
    // 비용 & 수수료
    '접수비': '응시료',
    '시험비': '응시료',
    '돈 얼마': '응시료',
    '얼마예요': '응시료',
    '비용': '응시료',
    '수수료': '응시료',
    '등록금': '응시료',

    // 자격증 명칭 / 통칭
    '굴삭기': '굴착기',
    '포크레인': '굴착기',
    '포클레인': '굴착기',
    '포크래인': '굴착기',
    '한식요리사': '한식조리기능사',
    '한식조리사': '한식조리기능사',
    '한식요리': '한식조리',
    '한조기': '한식조리기능사',
    '지게차 면허': '지게차',
    '지게차면허': '지게차',
    '지게차기능사': '지게차',
    '요양사': '요양보호사',
    '요보사': '요양보호사',
    '노인돌봄': '요양보호사',
    '공개사': '공인중개사',
    '손평사': '손해평가사',
    '전기기사': '전기기능사',

    // 감면 / 복지 서류
    '복지카드': '감면',
    '유공자증': '감면',
    '수급자증명서': '감면',
    '기초생활수급': '감면',
    '기초수급': '감면',
    '차상위계층': '감면',
    '반값': '감면',

    // 시험 방식 (구어체)
    '1차': '필기',
    '이론': '필기',
    '쓰는 거': '필기',
    '2차': '실기',
    '실습': '실기',
    '직접 하는 거': '실기',

    // 나이 / 합격 / 신분증
    '늙어서': '나이제한',
    '나이많은데': '나이제한',
    '칠순': '나이제한',
    '환갑': '나이제한',
    '글씨 몰라도': '나이제한',
    '몇 개 맞아야': '합격',
    '당일날 나와': '합격',
    '주민증': '신분증',
    '운전면허': '신분증',
    '신분증 깜빡': '신분증',

    // 접수처 / 방식
    '동사무소': '접수방법',
    '주민센터': '접수방법',
    '우체국': '접수방법',
    '전화신청': '접수방법',
    '대신신청': '접수방법',

    // 사투리 / 감사
    '고마워유': '고마워',
    '감사유': '감사',
    '고맙구먼': '고마워'
};

/**
 * 브라우저 & Node.js 겸용 시나리오 확장 TF-IDF 검색 엔진
 */
class ClientTfIdfEngine {
    constructor() {
        this.documents = [];
        this.docCount = 0;
        this.vocab = new Map();
        this.idf = [];
        this.docVectors = [];
        this.docLengths = [];
        this.isIndexed = false;
    }

    tokenize(text) {
        if (!text || typeof text !== 'string') return [];
        const clean = text.toLowerCase().replace(/[^가-힣a-zA-Z0-9\s%]/g, ' ');
        return clean.split(/\s+/).filter(w => w.length > 1);
    }

    buildIndex(docs) {
        this.documents = docs || [];
        this.docCount = this.documents.length;
        if (this.docCount === 0) return;

        this.vocab.clear();
        const docTermFreqs = [];
        const docFreqMap = new Map();

        for (let i = 0; i < this.docCount; i++) {
            const doc = this.documents[i];
            const content = `${doc.qualification || doc.cert || ''} ${doc.category || ''} ${doc.question || doc.title || ''} ${doc.keywords || ''} ${doc.answer || ''}`;
            const tokens = this.tokenize(content);

            const tfMap = new Map();
            const uniqueTerms = new Set();

            for (const token of tokens) {
                let termId = this.vocab.get(token);
                if (termId === undefined) {
                    termId = this.vocab.size;
                    this.vocab.set(token, termId);
                }
                tfMap.set(termId, (tfMap.get(termId) || 0) + 1);
                uniqueTerms.add(termId);
            }

            for (const termId of uniqueTerms) {
                docFreqMap.set(termId, (docFreqMap.get(termId) || 0) + 1);
            }
            docTermFreqs.push({ tfMap, total: tokens.length || 1 });
        }

        const vocabSize = this.vocab.size;
        this.idf = new Float32Array(vocabSize);
        for (let termId = 0; termId < vocabSize; termId++) {
            const df = docFreqMap.get(termId) || 0;
            this.idf[termId] = Math.log((this.docCount + 1) / (df + 1)) + 1.0;
        }

        this.docVectors = [];
        this.docLengths = new Float32Array(this.docCount);

        for (let i = 0; i < this.docCount; i++) {
            const { tfMap, total } = docTermFreqs[i];
            const vec = new Map();
            let sumSq = 0;

            for (const [termId, count] of tfMap.entries()) {
                const tf = count / total;
                const val = tf * this.idf[termId];
                vec.set(termId, val);
                sumSq += val * val;
            }
            this.docVectors.push(vec);
            this.docLengths[i] = Math.sqrt(sumSq) || 1.0;
        }

        this.isIndexed = true;
    }

    search(query, topK = 2, minScore = 0.05) {
        if (!this.isIndexed || !query) return [];
        const tokens = this.tokenize(query);
        if (tokens.length === 0) return [];

        const qTfMap = new Map();
        for (const token of tokens) {
            const termId = this.vocab.get(token);
            if (termId !== undefined) {
                qTfMap.set(termId, (qTfMap.get(termId) || 0) + 1);
            }
        }
        if (qTfMap.size === 0) return [];

        const qVec = new Map();
        let sumSq = 0;
        const total = tokens.length;
        for (const [termId, count] of qTfMap.entries()) {
            const tf = count / total;
            const val = tf * this.idf[termId];
            qVec.set(termId, val);
            sumSq += val * val;
        }
        const qNorm = Math.sqrt(sumSq) || 1.0;

        const scored = [];
        for (let i = 0; i < this.docCount; i++) {
            const docVec = this.docVectors[i];
            let dot = 0;
            for (const [termId, qVal] of qVec.entries()) {
                const dVal = docVec.get(termId);
                if (dVal !== undefined) dot += qVal * dVal;
            }
            if (dot > 0) {
                const sim = dot / (qNorm * this.docLengths[i]);
                if (sim >= minScore) {
                    scored.push({ score: sim, doc: this.documents[i] });
                }
            }
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
}

const DEFAULT_RECOMMENDED_BUBBLES = [
    { id: 'b1', icon: '🍲', label: '한식조리 응시료 (14,500원)', query: '한식조리 접수비 얼마예요?', active: true, order: 1 },
    { id: 'b2', icon: '🚜', label: '지게차 상시 시험일정', query: '지게차 시험일정 언제예요?', active: true, order: 2 },
    { id: 'b3', icon: '💳', label: '50% 감면 혜택 (7,250원)', query: '기초생활수급자나 유공자 50% 감면 혜택 어떻게 받아요?', active: true, order: 3 },
    { id: 'b4', icon: '🪪', label: '필수 준비물 & 신분증', query: '시험 당일 필수 준비물이 뭐예요?', active: true, order: 4 },
    { id: 'b5', icon: '⏱️', label: 'CBT 당일 합격자 발표', query: '합격자 발표는 언제 나오나요?', active: true, order: 5 },
    { id: 'b6', icon: '📞', label: '어르신 무료 대리접수', query: '인터넷 접수가 어려운데 전화로 대신 접수해 주나요?', active: true, order: 6 }
];

class DuduChatbot {
    constructor() {
        this.masterRegulations = [...MASTER_OFFICIAL_REGULATIONS];
        this.auxiliaryKnowledge = [...AUXILIARY_KNOWLEDGE];
        this.knowledgeBase = [...MASTER_OFFICIAL_REGULATIONS, ...AUXILIARY_KNOWLEDGE];
        this.tfidfEngine = new ClientTfIdfEngine();
        this.tfidfEngine.buildIndex(this.knowledgeBase);
        this.isOpen = false;
        const storedSize = typeof localStorage !== 'undefined' ? localStorage.getItem('dudu_chat_font_size') : null;
        const storedMode = typeof localStorage !== 'undefined' ? localStorage.getItem('dudu_ai_mode') : null;
        const storedBubbles = typeof localStorage !== 'undefined' ? localStorage.getItem('dudu_custom_bubbles') : null;
        this.fontSize = parseInt(storedSize || '16', 10);
        this.isAIMode = storedMode !== 'false';
        this.recommendedBubbles = storedBubbles ? JSON.parse(storedBubbles) : [...DEFAULT_RECOMMENDED_BUBBLES];
        this.conversationHistory = []; // Up to 5 turns (10 messages: 5 user, 5 model)
        this.isListening = false;
        this.recognition = null;
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.activeTTSButton = null;
        this.lastBotResponseText = null;
        this.lastTTSButton = null;
        this.init();
    }

    async init() {
        if (typeof document === 'undefined' || !document.body) return;
        this.injectStyles();
        this.initSpeechRecognition();
        this.bindEvents();
        this.adjustChatFontSize(0);

        // 초기 웰컴 메시지 렌더링
        const container = document.getElementById('chatMessages');
        if (container && (!container.querySelector('.welcome-chips') || container.children.length <= 1)) {
            container.innerHTML = this.getWelcomeMessageHTML();
        }

        await Promise.all([
            this.syncWithSupabase(),
            this.syncRecommendedBubbles(),
            this.syncSeniorSynonyms()
        ]);
    }

    syncSeniorSynonyms() {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem('dudu_senior_synonyms');
                if (stored) {
                    const list = JSON.parse(stored);
                    if (Array.isArray(list)) {
                        this.updateCustomSynonyms(list);
                    }
                }
            }
        } catch (e) {
            console.log('시니어 동의어 사전 동기화 알림:', e);
        }
    }

    updateCustomSynonyms(customList) {
        if (!Array.isArray(customList)) return;
        customList.forEach(item => {
            if (item && item.input && item.target) {
                SENIOR_SYNONYMS[item.input.trim()] = item.target.trim();
            }
        });
    }

    initSpeechRecognition() {
        if (typeof window === 'undefined') return;
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.log('이 브라우저는 Web Speech API를 지원하지 않습니다.');
            return;
        }

        try {
            this.recognition = new SpeechRec();
            this.recognition.lang = 'ko-KR';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI(true);
            };

            this.recognition.onresult = (event) => {
                const input = document.getElementById('chatInput');
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                if (input) input.value = transcript;
                this.updateVoiceUI(true, transcript);
            };

            this.recognition.onend = () => {
                const wasListening = this.isListening;
                this.isListening = false;
                this.updateVoiceUI(false);

                const input = document.getElementById('chatInput');
                if (wasListening && input && input.value.trim()) {
                    setTimeout(() => {
                        this.handleSend();
                    }, 350);
                }
            };

            this.recognition.onerror = (event) => {
                console.log('Speech recognition event/notice:', event.error);
                this.isListening = false;
                this.updateVoiceUI(false);

                if (event.error === 'not-allowed') {
                    alert('마이크 접근 권한이 허용되지 않았습니다. 브라우저 주소창 좌측의 마이크 권한을 허용해 주시거나 키보드로 입력해 주세요.');
                }
            };
        } catch (e) {
            console.log('STT init notice:', e);
        }
    }

    toggleSpeechRecognition() {
        if (!this.recognition) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                alert('사용 중이신 브라우저가 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 이용해 주세요.');
                return;
            }
            this.initSpeechRecognition();
        }

        if (this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
            this.isListening = false;
            this.updateVoiceUI(false);
        } else {
            const input = document.getElementById('chatInput');
            if (input) input.value = '';
            try {
                this.recognition.start();
            } catch (err) {
                console.log('Recognition start retry:', err);
                try {
                    this.recognition.stop();
                    setTimeout(() => this.recognition.start(), 150);
                } catch (e) {}
            }
        }
    }

    updateVoiceUI(listening, transcript = '') {
        const voiceBtn = document.getElementById('chatVoiceBtn');
        const input = document.getElementById('chatInput');
        const container = document.getElementById('chatMessages');

        if (voiceBtn) {
            if (listening) {
                voiceBtn.classList.add('listening');
                voiceBtn.innerHTML = '🛑 <span>듣는 중...</span>';
                voiceBtn.title = '음성 인식 중 (클릭 시 전송/중지)';
            } else {
                voiceBtn.classList.remove('listening');
                voiceBtn.innerHTML = '🎤 <span style="font-weight:900;">음성</span>';
                voiceBtn.title = '음성으로 질문하기 (클릭 후 말씀하세요)';
            }
        }

        // 실시간 음성 파형 카드 관리
        let waveCard = document.getElementById('voiceWaveCard');
        if (listening) {
            if (!waveCard && container) {
                waveCard = document.createElement('div');
                waveCard.id = 'voiceWaveCard';
                waveCard.className = 'voice-wave-card';
                waveCard.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px; color:#f87171; font-weight:800; font-size:14px;">
                        <span style="font-size:18px;">🎙️</span> 어르신, 편하게 말씀해 주세요...
                    </div>
                    <div class="voice-wave-bars">
                        <div class="voice-wave-bar"></div>
                        <div class="voice-wave-bar"></div>
                        <div class="voice-wave-bar"></div>
                        <div class="voice-wave-bar"></div>
                        <div class="voice-wave-bar"></div>
                        <div class="voice-wave-bar"></div>
                    </div>
                    <div id="voiceLiveTranscript" style="color:#ffffff; font-size:15px; font-weight:700; text-align:center; min-height:22px; word-break:keep-all;">
                        ${transcript ? `“<span style="color:#60a5fa;">${transcript}</span>”` : '(말씀하시는 내용을 듣고 있습니다...)'}
                    </div>
                `;
                container.appendChild(waveCard);
                container.scrollTop = container.scrollHeight;
            } else if (waveCard) {
                const liveText = document.getElementById('voiceLiveTranscript');
                if (liveText) {
                    liveText.innerHTML = transcript 
                        ? `“<span style="color:#60a5fa;">${transcript}</span>”`
                        : '(말씀하시는 내용을 듣고 있습니다...)';
                }
            }
        } else {
            if (waveCard && waveCard.parentNode) {
                waveCard.parentNode.removeChild(waveCard);
            }
        }

        if (input) {
            if (listening) {
                input.placeholder = '🎤 어르신, 편하게 말씀해 주세요 (듣고 있습니다...)';
            } else {
                input.placeholder = this.isAIMode 
                    ? '궁금하신 점을 편하게 말씀해 주세요 (예: 한식조리 접수비 얼마?)' 
                    : '⚡ 사내 규정 즉시 검색 (예: 지게차 준비물, 환불 규정)';
            }
        }
    }

    bindEvents() {
        if (typeof document === 'undefined') return;
        const fab = document.getElementById('duduChatFab');
        const closeBtn = document.getElementById('chatCloseBtn');
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatInput');
        const fontUp = document.getElementById('chatFontUp');
        const fontDown = document.getElementById('chatFontDown');
        const modeBtn = document.getElementById('chatModeToggleBtn');
        let resetBtn = document.getElementById('chatResetBtn');
        let voiceBtn = document.getElementById('chatVoiceBtn');

        // 만약 헤더에 resetBtn이 없으면 closeBtn 바로 앞에 동적 주입
        if (!resetBtn && closeBtn && closeBtn.parentNode) {
            resetBtn = document.createElement('button');
            resetBtn.id = 'chatResetBtn';
            resetBtn.className = 'chat-header-btn';
            resetBtn.type = 'button';
            resetBtn.title = '대화 내용 전체 지우기 (초기화)';
            resetBtn.innerHTML = '🧹 지우기';
            resetBtn.style.cssText = 'background: rgba(239, 68, 68, 0.2) !important; border: 1px solid #ef4444 !important; color: #fca5a5 !important; border-radius: 6px !important; padding: 5px 9px !important; font-size: 12px !important; font-weight: 800 !important; cursor: pointer !important; margin-right: 4px !important; transition: all 0.2s ease !important;';
            closeBtn.parentNode.insertBefore(resetBtn, closeBtn);
        }

        // 만약 정적 DOM에 chatVoiceBtn이 없으면 input과 sendBtn 사이에 동적 주입
        if (!voiceBtn && input && sendBtn && input.parentNode) {
            voiceBtn = document.createElement('button');
            voiceBtn.id = 'chatVoiceBtn';
            voiceBtn.className = 'chat-voice-btn';
            voiceBtn.type = 'button';
            voiceBtn.title = '음성으로 질문하기 (클릭 후 말씀하세요)';
            voiceBtn.innerHTML = '🎤 음성';
            input.parentNode.insertBefore(voiceBtn, sendBtn);
        }

        // 챗봇 하단 스페이스바 TTS 단축키 안내 배너
        let hotkeyHint = document.getElementById('chatHotkeyHint');
        if (!hotkeyHint && input && input.parentNode) {
            const inputContainer = input.parentNode;
            hotkeyHint = document.createElement('div');
            hotkeyHint.id = 'chatHotkeyHint';
            hotkeyHint.style.cssText = 'padding: 6px 16px; background: #0b1329; border-top: 1px solid #1e293b; font-size: 12px; color: #94a3b8; display: flex; align-items: center; justify-content: space-between; user-select: none; flex-shrink: 0;';
            hotkeyHint.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #60a5fa;">🔊</span>
                    <span>마지막 답변 듣기 단축키:</span>
                    <kbd style="background: #1e293b; color: #93c5fd; border: 1px solid #3b82f6; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 800; font-family: monospace;">Space (스페이스바)</kbd>
                </div>
                <span id="chatTTSIndicator" style="font-size: 11px; color: #34d399; font-weight: 800; display: none;">● 음성 낭독 중</span>
            `;
            if (inputContainer.parentNode) {
                inputContainer.parentNode.appendChild(hotkeyHint);
            }
        }

        if (fab) fab.onclick = () => this.toggleChat();
        if (closeBtn) closeBtn.onclick = () => this.toggleChat(false);
        if (resetBtn) resetBtn.onclick = () => {
            if (confirm('대화 내용을 모두 지우고 처음 상태로 초기화하시겠습니까?')) {
                this.resetChat();
            }
        };
        if (sendBtn) sendBtn.onclick = () => this.handleSend();
        if (modeBtn) modeBtn.onclick = () => this.toggleAIMode();
        if (voiceBtn) voiceBtn.onclick = () => this.toggleSpeechRecognition();

        if (input) {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSend();
                }
            };
        }
        if (fontUp) fontUp.onclick = () => this.adjustChatFontSize(2);
        if (fontDown) fontDown.onclick = () => this.adjustChatFontSize(-2);

        // 스페이스바(Space) 누르면 가장 마지막 봇 답변 음성(TTS) 즉시 재생/정지
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                if (!this.isOpen) return;

                const activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
                const isInputActive = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);

                // 사용자가 채팅 입력창에 글자를 작성 중일 때는 띄어쓰기 입력을 방해하지 않음
                if (isInputActive) {
                    const chatInput = document.getElementById('chatInput');
                    if (document.activeElement === chatInput && chatInput.value.length > 0) {
                        return;
                    }
                    if (document.activeElement !== chatInput) {
                        return;
                    }
                }

                if (this.lastBotResponseText) {
                    e.preventDefault();
                    this.toggleTTS(this.lastBotResponseText, this.lastTTSButton);
                }
            }
        });

        this.updateModeUI();
    }

    getWelcomeMessageHTML() {
        const activeBubbles = (this.recommendedBubbles || DEFAULT_RECOMMENDED_BUBBLES)
            .filter(b => b && b.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const bubblesHtml = activeBubbles.map(b => `
            <button type="button" class="quick-chip welcome-bubble-btn" onclick="window.duduChat && window.duduChat.askQuestion('${(b.query || '').replace(/'/g, "\\'")}')">
                <span class="bubble-icon">${b.icon || '💡'}</span>
                <span class="bubble-txt">${b.label || b.query}</span>
            </button>
        `).join('');

        return `
            <div class="chat-msg bot welcome-msg" style="align-self: flex-start; background: #1e293b; color: #ffffff; border: 2px solid #3b82f6; border-bottom-left-radius: 4px; padding: 16px 20px; border-radius: 20px; line-height: 1.6; font-size: ${this.fontSize}px; word-break: keep-all; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.4);">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:900; color:#60a5fa; font-size:1.08em;">
                    <div style="width: 26px; height: 26px; background: #ffffff; border: 1.5px solid #60a5fa; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; padding: 2px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        <img src="/chatbot.png" alt="두두" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <span>안녕하세요, 어르신!</span>
                </div>
                <div>
                    <strong>두두자격지원센터 상담원</strong>입니다.<br>
                    시험비, 접수 일정, 준비물 등 <strong>무엇이든 편하게 물어보세요!</strong>
                </div>
                <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.15);">
                    <div style="font-size: 13px; font-weight: 800; color: #34d399; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                        <span>✨</span> 자주 묻는 질문 (버블을 누르시면 바로 답변해 드려요):
                    </div>
                    <div class="quick-chips welcome-chips" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        ${bubblesHtml}
                    </div>
                </div>
                <div style="margin-top: 14px; padding: 10px 14px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 13px; color: #93c5fd; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span>🔊</span>
                        <span>답변 음성 듣기 단축키:</span>
                        <kbd style="background: #1e293b; color: #60a5fa; border: 1px solid #3b82f6; padding: 2px 7px; border-radius: 6px; font-size: 12px; font-weight: 900;">Space (스페이스바)</kbd>
                    </div>
                </div>
            </div>
        `;
    }

    async syncRecommendedBubbles() {
        try {
            if (typeof window === 'undefined') return;
            const res = await fetch('/api/bubbles');
            if (res.ok) {
                const data = await res.json();
                if (data && data.success && Array.isArray(data.bubbles) && data.bubbles.length > 0) {
                    this.recommendedBubbles = data.bubbles;
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('dudu_custom_bubbles', JSON.stringify(data.bubbles));
                    }
                    // 화면에 웰컴 메시지가 있는 상태라면 실시간 갱신
                    const welcomeCard = document.querySelector('.welcome-msg');
                    if (welcomeCard && welcomeCard.parentNode && welcomeCard.parentNode.children.length === 1) {
                        welcomeCard.parentNode.innerHTML = this.getWelcomeMessageHTML();
                    }
                }
            }
        } catch (e) {
            console.log('버블 동기화 알림 (기본 버블 사용):', e.message);
        }
    }

    resetChat() {
        this.stopTTS();
        if (this.isListening && this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
            this.isListening = false;
            this.updateVoiceUI(false);
        }
        this.conversationHistory = [];
        const container = document.getElementById('chatMessages');
        if (container) {
            container.innerHTML = this.getWelcomeMessageHTML();
        }
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = '';
            input.focus();
        }
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
                    .select('*')
                    .range(0, 4999);

                if (!error && data && data.length > 0) {
                    // ID 1~23번은 사내 공식 규정으로 마스터 업데이트
                    const masters = data.filter(d => d.id <= 23);
                    if (masters.length > 0) {
                        this.masterRegulations = masters;
                    }
                    this.knowledgeBase = data;
                    this.tfidfEngine.buildIndex(this.knowledgeBase);
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
            #duduChatWindow {
                --chat-font-size: 16px;
                position: fixed !important;
                bottom: 95px !important;
                right: 25px !important;
                width: 580px !important;
                max-width: calc(100vw - 32px) !important;
                height: 720px !important;
                max-height: calc(100vh - 110px) !important;
                background: #0f172a !important;
                border: 3px solid #3b82f6 !important;
                border-radius: 24px !important;
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95) !important;
                display: none;
                flex-direction: column !important;
                z-index: 2147483647 !important;
                overflow: hidden !important;
                font-family: 'Noto Sans KR', sans-serif !important;
            }
            #duduChatWindow.open {
                display: flex !important;
                animation: duduSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            @keyframes duduSlideUp {
                from { opacity: 0; transform: translateY(25px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .chat-msg {
                max-width: 88% !important;
                padding: 14px 18px !important;
                border-radius: 18px !important;
                line-height: 1.55 !important;
                font-size: var(--chat-font-size, 16px) !important;
                word-break: keep-all !important;
                font-weight: 500 !important;
                transition: font-size 0.15s ease !important;
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
                font-size: calc(var(--chat-font-size, 16px) * 0.85) !important;
                font-weight: 800 !important;
                cursor: pointer !important;
                transition: all 0.15s !important;
            }
            .quick-chip:hover {
                background: #2563eb !important;
                color: #ffffff !important;
            }
            .welcome-chips {
                margin-top: 6px !important;
            }
            .welcome-bubble-btn {
                background: linear-gradient(135deg, rgba(30, 58, 138, 0.45), rgba(15, 23, 42, 0.75)) !important;
                border: 1.5px solid #3b82f6 !important;
                color: #e2e8f0 !important;
                border-radius: 14px !important;
                padding: 10px 12px !important;
                font-size: calc(var(--chat-font-size, 16px) * 0.85) !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                text-align: left !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            }
            .welcome-bubble-btn:hover {
                background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
                border-color: #60a5fa !important;
                color: #ffffff !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45) !important;
            }
            .welcome-bubble-btn .bubble-icon {
                font-size: 18px !important;
                flex-shrink: 0 !important;
            }
            .welcome-bubble-btn .bubble-txt {
                flex: 1 !important;
                line-height: 1.3 !important;
            }
            .chat-feedback-bar {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                gap: 6px !important;
                margin-top: 8px !important;
                padding-top: 6px !important;
                border-top: 1px dashed rgba(255, 255, 255, 0.12) !important;
            }
            .feedback-prompt-text {
                font-size: calc(var(--chat-font-size, 16px) * 0.72) !important;
                color: #94a3b8 !important;
                margin-right: auto !important;
                font-weight: 600 !important;
            }
            .feedback-btn {
                background: rgba(255, 255, 255, 0.06) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #cbd5e1 !important;
                border-radius: 12px !important;
                padding: 3px 8px !important;
                font-size: calc(var(--chat-font-size, 16px) * 0.78) !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                transition: all 0.15s ease !important;
            }
            .feedback-btn:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.15) !important;
                color: #ffffff !important;
                transform: translateY(-1px) !important;
            }
            .feedback-btn.btn-tts {
                background: rgba(59, 130, 246, 0.15) !important;
                border: 1px solid #3b82f6 !important;
                color: #93c5fd !important;
                font-weight: 800 !important;
                padding: 3px 10px !important;
            }
            .feedback-btn.btn-tts.active-tts {
                background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
                border-color: #60a5fa !important;
                color: #ffffff !important;
                animation: pulseTTS 1.2s infinite ease-in-out !important;
            }
            @keyframes pulseTTS {
                0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
                50% { box-shadow: 0 0 10px 3px rgba(37, 99, 235, 0.5); }
                100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
            }
            .feedback-btn.active-pos {
                background: rgba(16, 185, 129, 0.25) !important;
                border-color: #10b981 !important;
                color: #34d399 !important;
                font-weight: 800 !important;
            }
            .feedback-btn.active-neg {
                background: rgba(239, 68, 68, 0.25) !important;
                border-color: #ef4444 !important;
                color: #f87171 !important;
                font-weight: 800 !important;
            }
            .feedback-thanks {
                font-size: calc(var(--chat-font-size, 16px) * 0.75) !important;
                color: #34d399 !important;
                font-weight: 700 !important;
                animation: fadeIn 0.3s ease !important;
            }
            .chat-voice-btn {
                background: linear-gradient(135deg, rgba(30, 58, 138, 0.8), rgba(37, 99, 235, 0.7)) !important;
                border: 2px solid #3b82f6 !important;
                color: #ffffff !important;
                border-radius: 14px !important;
                padding: 0 16px !important;
                font-size: 15px !important;
                font-weight: 900 !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                white-space: nowrap !important;
                user-select: none !important;
                box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3) !important;
            }
            .chat-voice-btn:hover {
                background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
                border-color: #60a5fa !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5) !important;
            }
            .chat-voice-btn.listening {
                background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
                border-color: #f87171 !important;
                color: #ffffff !important;
                animation: pulseMic 1.2s infinite ease-in-out !important;
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.8) !important;
            }
            @keyframes pulseMic {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            .voice-wave-card {
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)) !important;
                border: 2px solid #ef4444 !important;
                border-radius: 18px !important;
                padding: 16px 20px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 10px !important;
                box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25) !important;
                animation: duduSlideUp 0.25s ease !important;
                margin: 4px 0 !important;
                align-self: center !important;
                width: 90% !important;
            }
            .voice-wave-bars {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 5px !important;
                height: 28px !important;
            }
            .voice-wave-bar {
                width: 4px !important;
                background: #f87171 !important;
                border-radius: 4px !important;
                animation: waveAnim 0.8s ease-in-out infinite alternate !important;
            }
            .voice-wave-bar:nth-child(1) { height: 8px; animation-delay: 0.1s; }
            .voice-wave-bar:nth-child(2) { height: 18px; animation-delay: 0.2s; }
            .voice-wave-bar:nth-child(3) { height: 26px; animation-delay: 0.3s; }
            .voice-wave-bar:nth-child(4) { height: 14px; animation-delay: 0.4s; }
            .voice-wave-bar:nth-child(5) { height: 22px; animation-delay: 0.15s; }
            .voice-wave-bar:nth-child(6) { height: 10px; animation-delay: 0.35s; }
            @keyframes waveAnim {
                0% { transform: scaleY(0.4); opacity: 0.5; }
                100% { transform: scaleY(1.2); opacity: 1; }
            }
            #chatInput {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                width: auto !important;
                box-sizing: border-box !important;
            }
            #chatVoiceBtn, .chat-voice-btn {
                flex-shrink: 0 !important;
                height: 48px !important;
                padding: 0 14px !important;
                font-size: 15px !important;
            }
            #chatSendBtn {
                flex-shrink: 0 !important;
                height: 48px !important;
                padding: 0 20px !important;
                font-size: 16px !important;
                font-weight: 900 !important;
                white-space: nowrap !important;
            }
            @media (max-width: 640px) {
                #duduChatWindow {
                    width: calc(100vw - 16px) !important;
                    right: 8px !important;
                    bottom: 70px !important;
                    height: calc(100vh - 85px) !important;
                    max-height: calc(100vh - 85px) !important;
                    border-radius: 18px !important;
                }
                #duduChatFab {
                    bottom: 16px !important;
                    right: 12px !important;
                    padding: 10px 16px !important;
                    font-size: 14px !important;
                }
                #chatVoiceBtn, .chat-voice-btn {
                    padding: 0 10px !important;
                    font-size: 13px !important;
                    height: 44px !important;
                }
                #chatSendBtn {
                    padding: 0 14px !important;
                    font-size: 14px !important;
                    height: 44px !important;
                }
                .chat-msg {
                    max-width: 92% !important;
                    padding: 12px 14px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    adjustChatFontSize(delta) {
        this.fontSize = Math.max(13, Math.min(26, this.fontSize + delta));
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('dudu_chat_font_size', this.fontSize);
        }

        const win = document.getElementById('duduChatWindow');
        if (win) {
            win.style.setProperty('--chat-font-size', `${this.fontSize}px`);
        }

        document.querySelectorAll('#chatMessages .chat-msg').forEach(el => {
            el.style.setProperty('font-size', `${this.fontSize}px`, 'important');
        });

        const input = document.getElementById('chatInput');
        if (input) {
            input.style.setProperty('font-size', `${this.fontSize}px`, 'important');
        }
    }

    toggleAIMode() {
        this.isAIMode = !this.isAIMode;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('dudu_ai_mode', this.isAIMode);
        }
        this.updateModeUI();
        const notice = this.isAIMode 
            ? '🤖 <strong>[자세한 상담 모드]</strong>로 전환되었습니다.<br><span style="font-size: 13px; color: #93c5fd;">※ 더 자세히 설명해 드리고, 대화 내용을 기억합니다.</span>'
            : '⚡ <strong>[빠른 답변 모드]</strong>로 전환되었습니다.<br><span style="font-size: 13px; color: #6ee7b7;">※ 사내 규정 그대로 빠르고 정확하게 답변합니다.</span>';
        this.appendMessage(notice, 'bot');
    }

    updateModeUI() {
        const banner = document.getElementById('chatModeBanner');
        const label = document.getElementById('chatModeStatusLabel');
        const desc = document.getElementById('chatModeDesc');
        const btn = document.getElementById('chatModeToggleBtn');
        const win = document.getElementById('duduChatWindow');
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatInput');

        if (this.isAIMode) {
            if (banner) {
                banner.style.background = 'linear-gradient(135deg, rgba(30, 58, 138, 0.75), rgba(37, 99, 235, 0.5))';
                banner.style.borderBottom = '2px solid #3b82f6';
            }
            if (label) {
                label.innerHTML = '🤖 <span style="color:#ffffff; font-weight:900;">자세한 상담 모드</span> <span style="background:#2563eb; color:#ffffff; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:800; border:1px solid #60a5fa;">작동중</span>';
            }
            if (desc) {
                desc.textContent = '더 자세히 설명해 드립니다';
                desc.style.color = '#93c5fd';
            }
            if (btn) {
                btn.innerHTML = '⚡ 빠른 답변으로';
                btn.style.background = 'rgba(16, 185, 129, 0.3)';
                btn.style.borderColor = '#10b981';
                btn.style.color = '#6ee7b7';
            }
            if (win) {
                win.style.borderColor = '#3b82f6';
            }
            if (sendBtn) {
                sendBtn.style.background = '#2563eb';
            }
            if (input) {
                input.placeholder = '궁금한 점을 입력하세요';
            }
        } else {
            if (banner) {
                banner.style.background = 'linear-gradient(135deg, rgba(6, 78, 59, 0.8), rgba(5, 150, 105, 0.6))';
                banner.style.borderBottom = '2px solid #10b981';
            }
            if (label) {
                label.innerHTML = '⚡ <span style="color:#ffffff; font-weight:900;">빠른 답변 모드</span> <span style="background:#059669; color:#ffffff; font-size:11px; padding:2px 8px; border-radius:12px; font-weight:800; border:1px solid #34d399;">작동중</span>';
            }
            if (desc) {
                desc.textContent = '사내 규정 그대로 빠르게 답변';
                desc.style.color = '#a7f3d0';
            }
            if (btn) {
                btn.innerHTML = '🤖 자세한 상담으로';
                btn.style.background = 'rgba(37, 99, 235, 0.3)';
                btn.style.borderColor = '#3b82f6';
                btn.style.color = '#93c5fd';
            }
            if (win) {
                win.style.borderColor = '#10b981';
            }
            if (sendBtn) {
                sendBtn.style.background = '#059669';
            }
            if (input) {
                input.placeholder = '궁금한 점을 입력하세요';
            }
        }
    }

    toggleChat(forceState) {
        if (typeof document === 'undefined') return;
        const win = document.getElementById('duduChatWindow');
        if (!win) return;
        this.isOpen = (forceState !== undefined) ? forceState : !this.isOpen;
        if (this.isOpen) {
            win.style.display = 'flex';
            win.classList.add('open');
            this.syncWithSupabase();
            const inp = document.getElementById('chatInput');
            if (inp) {
                setTimeout(() => inp.focus(), 100);
            }
        } else {
            this.stopTTS();
            win.style.display = 'none';
            win.classList.remove('open');
        }
    }

    askQuestion(text) {
        if (typeof document === 'undefined') return;
        const inp = document.getElementById('chatInput');
        if (inp) inp.value = text;
        this.handleSend();
    }

    async handleSend() {
        if (typeof document === 'undefined') return;
        const input = document.getElementById('chatInput');
        if (!input) return;
        const query = input.value.trim();
        if (!query) return;

        this.appendMessage(query, 'user');
        input.value = '';

        if (this.isAIMode) {
            const loadingMsg = this.appendLoadingMessage();
            let aiSuccess = false;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4500);

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: query,
                        history: this.conversationHistory.slice(-10),
                        faqDocuments: this.masterRegulations
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.answer) {
                        this.removeLoadingMessage(loadingMsg);
                        this.appendMessage(data.answer, 'bot', query);

                        this.conversationHistory.push({ role: 'user', text: query });
                        this.conversationHistory.push({ role: 'model', text: data.answer });
                        if (this.conversationHistory.length > 10) {
                            this.conversationHistory = this.conversationHistory.slice(-10);
                        }

                        this.recordInquiryLog(query, data.answer, 'AI');
                        aiSuccess = true;
                        return;
                    }
                }
            } catch (err) {
                console.log('AI fetch timeout/fallback:', err);
            }

            if (!aiSuccess) {
                this.removeLoadingMessage(loadingMsg);
            }
        }

        setTimeout(() => {
            const answer = this.generateResponse(query);
            this.appendMessage(answer, 'bot', query);

            this.conversationHistory.push({ role: 'user', text: query });
            this.conversationHistory.push({ role: 'model', text: answer });
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            this.recordInquiryLog(query, answer, 'RULE');
        }, 80);
    }

    recordInquiryLog(query, answer, mode) {
        try {
            if (typeof localStorage === 'undefined') return;
            let category = '기타/일반';
            const q = query.toLowerCase();
            if (q.includes('감면') || q.includes('50%') || q.includes('50프로') || q.includes('기초수급') || q.includes('차상위') || q.includes('장애인') || q.includes('유공자')) {
                category = '응시료/감면';
            } else if (q.includes('응시료') || q.includes('접수비') || q.includes('시험비') || q.includes('비용') || q.includes('수수료') || q.includes('얼마') || q.includes('돈')) {
                category = '응시료/수수료';
            } else if (q.includes('일정') || q.includes('언제') || q.includes('기간') || q.includes('상시') || q.includes('시간') || q.includes('교시')) {
                category = '시험일정/교시';
            } else if (q.includes('준비물') || q.includes('신분증') || q.includes('수험표') || q.includes('필기구')) {
                category = '시험준비물/신분증';
            } else if (q.includes('실기') || q.includes('2차') || q.includes('실습')) {
                category = '실기문의(거절)';
            } else if (q.includes('환불') || q.includes('취소')) {
                category = '결제/환불';
            } else if (q.includes('고마워') || q.includes('감사') || q.includes('안녕') || q.includes('가능할까')) {
                category = '일상대화/시니어공감';
            } else if (q.includes('주차') || q.includes('식당') || q.includes('버스') || q.includes('교재')) {
                category = '사내미확인(무환각)';
            }

            const logItem = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                timestamp: new Date().toISOString(),
                question: query,
                category: category,
                mode: mode,
                answer_snippet: (answer || '').replace(/<[^>]*>?/gm, '').slice(0, 120)
            };

            const existing = JSON.parse(localStorage.getItem('dudu_chat_inquiries') || '[]');
            existing.unshift(logItem);
            if (existing.length > 500) existing.length = 500;
            localStorage.setItem('dudu_chat_inquiries', JSON.stringify(existing));
        } catch (e) {
            // ignore
        }
    }

    appendLoadingMessage() {
        const container = document.getElementById('chatMessages');
        if (!container) return null;
        const msg = document.createElement('div');
        msg.className = 'chat-msg bot loading-msg';
        msg.style.setProperty('font-size', `${this.fontSize}px`, 'important');
        msg.innerHTML = '🤖 <em>답변을 확인하고 있습니다...</em>';
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        return msg;
    }

    removeLoadingMessage(msg) {
        if (msg && msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    }

    formatBotResponse(text) {
        if (!text || typeof text !== 'string') return '';
        
        let formatted = text
            // Markdown bold **text**
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #93c5fd; font-weight: 800;">$1</strong>')
            // Markdown italic *text*
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Headings
            .replace(/^### (.*$)/gim, '<div style="font-weight: 900; color: #60a5fa; font-size: 1.05em; margin: 8px 0 4px;">📌 $1</div>')
            .replace(/^## (.*$)/gim, '<div style="font-weight: 900; color: #ffffff; font-size: 1.1em; margin: 10px 0 6px;">💡 $1</div>')
            // Bullet points
            .replace(/^\s*-\s+(.*$)/gim, '<div style="display: flex; gap: 6px; margin: 3px 0; align-items: flex-start;"><span style="color: #3b82f6; font-size: 12px; margin-top: 2px;">●</span><div>$1</div></div>')
            // Numbered lists
            .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div style="display: flex; gap: 6px; margin: 3px 0; align-items: flex-start;"><span style="color: #34d399; font-weight: 800; font-size: 13px;">$1.</span><div>$2</div></div>')
            // Newlines
            .replace(/\n\n/g, '<div style="height: 6px;"></div>')
            .replace(/\n/g, '<br>');

        // 응시료 금액 배지 자동 강조
        formatted = formatted.replace(/(14,500원|7,250원)/g, '<span style="background: rgba(37, 99, 235, 0.35); color: #93c5fd; border: 1.5px solid #3b82f6; border-radius: 6px; padding: 2px 7px; font-weight: 900; font-size: 0.95em;">$1</span>');
        // 환불/일정/신분증 핵심 키워드 배지
        formatted = formatted.replace(/(상시 CBT|실물 신분증|100% 환불|50% 환불|필기 유효기간 2년|60점 이상)/g, '<span style="background: rgba(16, 185, 129, 0.25); color: #6ee7b7; border: 1px solid #10b981; border-radius: 6px; padding: 1px 6px; font-weight: 800;">$1</span>');

        return formatted;
    }

    generateQuickChips(query, answer) {
        const q = (query || '').toLowerCase();
        const a = (answer || '').toLowerCase();
        const chips = [];

        if (q.includes('비용') || q.includes('응시료') || q.includes('수수료') || q.includes('얼마') || q.includes('감면') || a.includes('14,500원')) {
            chips.push({ text: '💳 50% 감면 대상 확인', query: '기초수급자나 유공자 50% 감면 혜택 어떻게 받아요?' });
            chips.push({ text: '📅 상시 시험 일정', query: '상시 CBT 시험 일정 언제인가요?' });
            chips.push({ text: '🎒 시험 준비물', query: '시험 당일 준비물이 뭐예요?' });
        } else if (q.includes('일정') || q.includes('언제') || q.includes('시간') || q.includes('교시') || a.includes('상시')) {
            chips.push({ text: '💳 응시료 얼마예요?', query: '기능사 필기 응시료 얼마인가요?' });
            chips.push({ text: '⏰ 입실 시간/교시 안내', query: '시험 당일 몇 시까지 가야 하나요?' });
            chips.push({ text: '🎒 신분증 안 가져가면?', query: '신분증 없으면 시험 못 보나요?' });
        } else if (q.includes('준비물') || q.includes('신분증') || q.includes('계산기') || a.includes('신분증')) {
            chips.push({ text: '🪪 모바일 신분증 되나요?', query: '스마트폰 모바일 신분증 인정되나요?' });
            chips.push({ text: '💳 응시료 및 환불 규정', query: '취소하면 전액 환불되나요?' });
            chips.push({ text: '🏆 합격 발표 언제?', query: '시험 결과 발표는 언제 나와요?' });
        } else if (q.includes('환불') || q.includes('취소') || a.includes('환불')) {
            chips.push({ text: '💳 응시료 확인', query: '시험 접수비 얼마인가요?' });
            chips.push({ text: '📅 다음 시험 일정', query: '다음 시험 일정 언제인가요?' });
            chips.push({ text: '📞 전화 상담 요청', query: '전화로 상담 받고 싶어요' });
        } else {
            chips.push({ text: '🍲 한식조리 접수비', query: '한식조리기능사 접수비 얼마예요?' });
            chips.push({ text: '🚜 지게차 시험일정', query: '지게차운전기능사 시험일정 알려주세요' });
            chips.push({ text: '🎒 신분증 지참 규정', query: '시험 당일 필수 준비물이 뭐예요?' });
        }

        return chips;
    }

    appendMessage(text, sender, originQuery = '') {
        if (typeof document === 'undefined') return;
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        msg.style.setProperty('font-size', `${this.fontSize}px`, 'important');
        
        const contentDiv = document.createElement('div');
        if (sender === 'bot') {
            contentDiv.innerHTML = this.formatBotResponse(text);
        } else {
            contentDiv.innerHTML = text.replace(/\n/g, '<br>');
        }
        msg.appendChild(contentDiv);

        // 봇 답변이고 사용자 질문이 연결되어 있을 때 리치 액션 추가 (추천 질문 칩스 + 피드백 바)
        if (sender === 'bot' && originQuery) {
            // 1. 추천 질문 퀵 칩스 바
            const chips = this.generateQuickChips(originQuery, text);
            if (chips && chips.length > 0) {
                const chipContainer = document.createElement('div');
                chipContainer.className = 'quick-chips';
                chipContainer.style.marginTop = '10px';
                chipContainer.innerHTML = chips.map(c => `
                    <button type="button" class="quick-chip" onclick="window.duduChat && window.duduChat.askQuestion('${c.query.replace(/'/g, "\\'")}')">
                        ${c.text}
                    </button>
                `).join('');
                msg.appendChild(chipContainer);
            }

            // 2. 피드백 액션 바 (TTS 음성 듣기 + 평가)
            const feedbackBar = document.createElement('div');
            feedbackBar.className = 'chat-feedback-bar';
            feedbackBar.innerHTML = `
                <button type="button" class="feedback-btn btn-tts" title="어르신을 위해 답변을 또박또박 음성으로 들려드립니다 (단축키: Space)">🔊 소리로 듣기 <span style="opacity:0.75; font-size:0.85em; font-weight:700;">(Space)</span></button>
                <span class="feedback-prompt-text" style="margin-left: auto;">도움되었나요?</span>
                <button type="button" class="feedback-btn btn-thumbs-up" title="도움이 되었어요">👍 도움됨</button>
                <button type="button" class="feedback-btn btn-thumbs-down" title="아쉬워요">👎 아쉬움</button>
            `;

            const btnTTS = feedbackBar.querySelector('.btn-tts');
            const btnUp = feedbackBar.querySelector('.btn-thumbs-up');
            const btnDown = feedbackBar.querySelector('.btn-thumbs-down');

            this.lastBotResponseText = text;
            this.lastTTSButton = btnTTS;

            btnTTS.onclick = () => this.toggleTTS(text, btnTTS);
            btnUp.onclick = () => this.sendFeedback(originQuery, text, 'positive', feedbackBar);
            btnDown.onclick = () => this.sendFeedback(originQuery, text, 'negative', feedbackBar);

            msg.appendChild(feedbackBar);
        } else if (sender === 'bot') {
            this.lastBotResponseText = text;
        }

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    toggleTTS(rawText, btnElement) {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            alert('사용 중이신 브라우저가 음성 듣기(TTS) 기능을 지원하지 않습니다.');
            return;
        }

        // 현재 재생 중이고 같은 버튼을 누른 경우 -> 정지
        if (this.isSpeaking && this.activeTTSButton === btnElement) {
            this.stopTTS();
            return;
        }

        // 다른 음성이 재생 중이면 먼저 정지
        this.stopTTS();

        // 텍스트 정제 (HTML 태그, 마크다운 기호, 이모지 필터링)
        const cleanText = (rawText || '')
            .replace(/<[^>]*>?/gm, '')
            .replace(/[#*●💡📌✨🍲🚜💳🪪⏱️📞🤖⚡👋]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText) return;

        try {
            const utter = new SpeechSynthesisUtterance(cleanText);
            utter.lang = 'ko-KR';
            utter.rate = 0.92; // 어르신 눈높이의 차분하고 또박또박한 속도
            utter.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const koVoice = voices.find(v => v.lang.includes('ko') || v.lang.includes('KO'));
            if (koVoice) {
                utter.voice = koVoice;
            }

            utter.onstart = () => {
                this.isSpeaking = true;
                this.activeTTSButton = btnElement;
                this.currentUtterance = utter;
                if (btnElement) {
                    btnElement.innerHTML = '⏹️ 낭독 중지 <span style="opacity:0.85; font-size:0.85em; font-weight:700;">(Space)</span>';
                    btnElement.classList.add('active-tts');
                }
                const ind = document.getElementById('chatTTSIndicator');
                if (ind) ind.style.display = 'inline';
            };

            utter.onend = () => {
                this.stopTTS();
            };

            utter.onerror = () => {
                this.stopTTS();
            };

            window.speechSynthesis.speak(utter);
        } catch (e) {
            console.log('TTS playback error:', e);
            this.stopTTS();
        }
    }

    stopTTS() {
        if (typeof window !== 'undefined' && ('speechSynthesis' in window)) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }
        if (this.activeTTSButton) {
            this.activeTTSButton.innerHTML = '🔊 소리로 듣기 <span style="opacity:0.75; font-size:0.85em; font-weight:700;">(Space)</span>';
            this.activeTTSButton.classList.remove('active-tts');
            this.activeTTSButton = null;
        }
        const ind = document.getElementById('chatTTSIndicator');
        if (ind) ind.style.display = 'none';

        this.isSpeaking = false;
        this.currentUtterance = null;
    }

    async sendFeedback(question, answer, rating, feedbackBar) {
        if (!feedbackBar) return;
        const btnUp = feedbackBar.querySelector('.btn-thumbs-up');
        const btnDown = feedbackBar.querySelector('.btn-thumbs-down');
        const promptText = feedbackBar.querySelector('.feedback-prompt-text');

        if (btnUp) btnUp.disabled = true;
        if (btnDown) btnDown.disabled = true;

        if (rating === 'positive') {
            if (btnUp) btnUp.classList.add('active-pos');
            if (btnDown) btnDown.style.opacity = '0.3';
            if (promptText) promptText.innerHTML = '✨ <span class="feedback-thanks">소중한 의견 감사합니다!</span>';
        } else {
            if (btnDown) btnDown.classList.add('active-neg');
            if (btnUp) btnUp.style.opacity = '0.3';
            if (promptText) promptText.innerHTML = '📝 <span class="feedback-thanks" style="color:#fca5a5 !important;">더 나은 답변을 위해 규정을 보강하겠습니다!</span>';

            // 빠른 규정 모드(!this.isAIMode)에서 아쉬움 피드백을 받은 경우: AI 정밀상담 모드 전환 제안 버튼 노출
            if (!this.isAIMode) {
                const suggestContainer = document.createElement('div');
                suggestContainer.className = 'ai-switch-suggestion';
                suggestContainer.style.cssText = 'margin-top: 10px; padding: 12px 14px; background: linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(59, 130, 246, 0.2)); border: 1.5px solid #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; animation: fadeIn 0.3s ease; flex-wrap: wrap; box-shadow: 0 4px 14px rgba(0,0,0,0.3);';
                suggestContainer.innerHTML = `
                    <div style="font-size: 12.5px; color: #93c5fd; font-weight: 700; line-height: 1.45; min-width: 200px; flex: 1;">
                        💡 <strong>답변이 부족하셨나요?</strong><br>
                        <span style="color: #e2e8f0;">자세한 상담 모드로 전환하면 더 상세하게 설명해 드려요.</span>
                    </div>
                    <button type="button" class="btn-switch-to-ai" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; border: 1.5px solid #60a5fa; border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.4); white-space: nowrap; transition: all 0.2s;">
                        🤖 자세한 상담으로 다시 질문 ➔
                    </button>
                `;

                const btnSwitch = suggestContainer.querySelector('.btn-switch-to-ai');
                btnSwitch.onclick = () => {
                    this.isAIMode = true;
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('dudu_ai_mode', 'true');
                    }
                    this.updateModeUI();
                    btnSwitch.disabled = true;
                    btnSwitch.innerHTML = '⚡ 자세한 상담 질문 중...';
                    this.askQuestion(question);
                };

                if (feedbackBar.parentNode) {
                    feedbackBar.parentNode.appendChild(suggestContainer);
                    const chatMessages = document.getElementById('chatMessages');
                    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        }

        const payload = {
            id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            question: question,
            answer: (answer || '').replace(/<[^>]*>?/gm, '').slice(0, 300),
            rating: rating,
            mode: this.isAIMode ? 'AI' : 'RULE',
            created_at: new Date().toISOString()
        };

        // 1. LocalStorage 피드백 리스트 저장
        try {
            if (typeof localStorage !== 'undefined') {
                const existing = JSON.parse(localStorage.getItem('dudu_chatbot_feedback') || '[]');
                existing.unshift(payload);
                if (existing.length > 300) existing.length = 300;
                localStorage.setItem('dudu_chatbot_feedback', JSON.stringify(existing));
            }
        } catch (e) {
            // ignore
        }

        // 2. Supabase / API 서버 비동기 전송
        try {
            // API 서버 전송
            fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});

            // 브라우저 Supabase 직접 저장
            const client = window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' 
                ? window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY) 
                : null);
            if (client) {
                client.from('chatbot_feedback').insert([payload]).then(() => {}).catch(() => {});
            }
        } catch (err) {
            console.log('Feedback send complete (local fallback):', err);
        }
    }

    /**
     * 무결성 4단계 계층형 룰베이스 응답 생성기
     */
    generateResponse(rawQuery) {
        if (!rawQuery || typeof rawQuery !== 'string') {
            return '궁금하신 자격증 시험 관련 내용을 말씀해 주세요.';
        }

        const query = rawQuery.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!query) {
            return '궁금하신 자격증 시험 관련 내용을 말씀해 주세요.';
        }

        // 1. 시니어 유의어 사전 치환 및 정규화
        let normalizedQuery = query;
        for (const [slang, standard] of Object.entries(SENIOR_SYNONYMS)) {
            if (normalizedQuery.includes(slang.toLowerCase())) {
                normalizedQuery += ' ' + standard.toLowerCase();
            }
        }

        const getMaster = (id) => this.masterRegulations.find(m => m.id === id) || MASTER_OFFICIAL_REGULATIONS.find(m => m.id === id);

        // 2. 의도(Intent) 플래그 정밀 분석
        const hasDiscountIntent = normalizedQuery.includes('감면') || 
                                  normalizedQuery.includes('50%') || 
                                  normalizedQuery.includes('50프로') || 
                                  normalizedQuery.includes('반값') || 
                                  normalizedQuery.includes('할인') || 
                                  normalizedQuery.includes('기초수급') || 
                                  normalizedQuery.includes('차상위') || 
                                  normalizedQuery.includes('유공자') || 
                                  normalizedQuery.includes('장애인');

        const isRecommendIntent = normalizedQuery.includes('교재') || normalizedQuery.includes('학원') || normalizedQuery.includes('강의') || normalizedQuery.includes('책 추천') || normalizedQuery.includes('난이도');
        const isDurationIntent = normalizedQuery.includes('유효기간') || normalizedQuery.includes('면제기간') || (normalizedQuery.includes('필기합격') && normalizedQuery.includes('면제')) || normalizedQuery.includes('몇년');
        const isPracticalIntent = normalizedQuery.includes('실기') || normalizedQuery.includes('2차') || normalizedQuery.includes('실습') || normalizedQuery.includes('직접 하는');
        const isFeeWord = normalizedQuery.includes('응시료') || normalizedQuery.includes('접수비') || normalizedQuery.includes('시험비') || normalizedQuery.includes('비용') || normalizedQuery.includes('수수료') || normalizedQuery.includes('얼마') || normalizedQuery.includes('돈') || normalizedQuery.includes('등록금');
        const isScheduleWord = normalizedQuery.includes('일정') || normalizedQuery.includes('언제') || normalizedQuery.includes('기간') || normalizedQuery.includes('상시') || normalizedQuery.includes('cbt') || normalizedQuery.includes('날짜');
        const isPassWord = normalizedQuery.includes('결과') || normalizedQuery.includes('합격') || normalizedQuery.includes('점수') || normalizedQuery.includes('발표');
        const isTimeWord = normalizedQuery.includes('교시') || /몇\s*부|1부|2부|3부|4부|5부|시험\s*시간|소요시간/.test(normalizedQuery);
        const isPrepWord = normalizedQuery.includes('준비물') || normalizedQuery.includes('신분증') || normalizedQuery.includes('지참물') || normalizedQuery.includes('필기구') || normalizedQuery.includes('가져갈');
        const isRefundWord = normalizedQuery.includes('환불') || normalizedQuery.includes('취소') || normalizedQuery.includes('돈돌려');

        // 3. 확인불가(거절) 항목 최우선 방어 (규정 외 개인상담, 주차, 타종목, 합격률 등)
        if (isRecommendIntent || normalizedQuery.includes('합격률') || normalizedQuery.includes('합격률이')) {
            return getMaster(23).answer;
        }
        if (normalizedQuery.includes('주차') || normalizedQuery.includes('셔틀') || normalizedQuery.includes('주차장')) {
            return getMaster(22).answer;
        }
        if (normalizedQuery.includes('요양') && (normalizedQuery.includes('응시료') || normalizedQuery.includes('수수료') || normalizedQuery.includes('비용') || normalizedQuery.includes('얼마') || normalizedQuery.includes('돈'))) {
            return getMaster(17).answer;
        }
        if (normalizedQuery.includes('위생사') && (isFeeWord || isScheduleWord)) {
            return getMaster(18).answer;
        }
        if ((normalizedQuery.includes('손해평가사') || normalizedQuery.includes('공인중개사') || normalizedQuery.includes('부동산')) && (normalizedQuery.includes('응시료') || normalizedQuery.includes('수수료') || normalizedQuery.includes('비용') || normalizedQuery.includes('얼마') || normalizedQuery.includes('돈'))) {
            return getMaster(19).answer;
        }
        if (normalizedQuery.includes('요양') && (normalizedQuery.includes('이수') || normalizedQuery.includes('교육시간') || normalizedQuery.includes('자격조건'))) {
            return getMaster(20).answer;
        }
        if ((normalizedQuery.includes('공인중개사') || normalizedQuery.includes('공개사')) && normalizedQuery.includes('면제') && (normalizedQuery.includes('1년') || normalizedQuery.includes('일년'))) {
            return getMaster(21).answer;
        }

        // 4. 접수방법 및 어르신 무료 대리접수 지원 안내 (나이 격려보다 우선)
        const isProxyOrOffline = normalizedQuery.includes('동사무소') || 
                                 normalizedQuery.includes('주민센터') || 
                                 normalizedQuery.includes('우체국') || 
                                 normalizedQuery.includes('방문') || 
                                 normalizedQuery.includes('대리접수') || 
                                 normalizedQuery.includes('대리') || 
                                 normalizedQuery.includes('대신') || 
                                 normalizedQuery.includes('직원이') || 
                                 normalizedQuery.includes('도와줘') || 
                                 normalizedQuery.includes('도와주') || 
                                 normalizedQuery.includes('신청방법') || 
                                 normalizedQuery.includes('어떻게 접수') || 
                                 normalizedQuery.includes('현장접수');
        if (isProxyOrOffline && !isFeeWord && !isScheduleWord && !isPassWord && !isPrepWord) {
            return getMaster(16).answer;
        }

        // 5. 일상 대화 및 시니어 공감/격려
        if (!hasDiscountIntent && !isFeeWord && !isScheduleWord && !isPrepWord && !isRefundWord && !isDurationIntent && !isPassWord) {
            // 나이 공감/격려 정규식 매칭 (50대, 60살, 70세, 볼 수 있나요 등)
            const isAgeEncourage = /(?:50|60|70|80)(?:대|살|세)|나이.*(?:50|60|70|많|먹|늙)|늙은|늙어서|환갑|칠순|어르신도|딸\s*수\s*있|할\s*수\s*있|볼\s*수\s*있|합격할\s*수|도전|가능할까/.test(normalizedQuery);
            if (isAgeEncourage) {
                return '그럼요, 어르신! 60대, 70대 어르신들도 용기 내어 도전하시고 당당하게 합격하고 계십니다. 컴퓨터(CBT) 시험도 기출문제를 몇 번 풀어보시면 금방 익숙해지십니다. 어르신의 멋진 도전을 제가 온 마음으로 응원하겠습니다! 접수가 어려우시면 성함과 전화번호만 남겨주시면 무료로 접수를 도와드립니다. 👍';
            }

            // 감사 인사
            if (/(고마|감사|수고|덕분)/.test(normalizedQuery)) {
                return '어르신께 도움이 되어 제가 더 기쁩니다! 언제든 편하게 물어보세요. 늘 건강하시고 행복한 하루 보내세요! 😊';
            }

            // 인사
            if (/(안녕|반가|처음)/.test(normalizedQuery)) {
                return '반갑습니다, 어르신! 두두자격지원센터 공식 AI 상담원입니다. 한식조리, 지게차, 굴착기운전기능사 시험 관련해 무엇이든 편하게 물어보세요!';
            }

            // 날씨/건강 안부
            if (/(날씨|춥|더워|비와|감기|건강)/.test(normalizedQuery)) {
                return '네 어르신, 날씨 변화에 항상 건강 유의하시고 따뜻하고 편안한 하루 보내세요!';
            }
        }

        // 6. [Tier 1] 사내 23종 Master 공식 규정 매칭

        // A. 50% 감면 규정 (ID 3)
        if (hasDiscountIntent) {
            return getMaster(3).answer;
        }

        // B. 유효기간 (ID 10) - 합격 발표보다 우선 매칭
        if (isDurationIntent) {
            return getMaster(10).answer;
        }

        // C. 실기 관련 문의 (ID 2 또는 거절)
        if (isPracticalIntent) {
            if (isFeeWord) {
                return getMaster(2).answer; // 실기 수수료 안내 (한식 26,900원, 지게차 25,200원...)
            }
            return '저희는 필기 접수만 도와드립니다. 실기 시험 관련 문의는 해당 시행기관으로 문의해 주시기 바랍니다.';
        }

        // D. 수험표 스마트폰/모바일 질문 (Tier 2 보조 지식)
        if (normalizedQuery.includes('수험표') && (normalizedQuery.includes('스마트폰') || normalizedQuery.includes('핸드폰') || normalizedQuery.includes('모바일') || normalizedQuery.includes('화면'))) {
            return this.auxiliaryKnowledge.find(k => k.id === 101).answer;
        }

        // E. 소형 면허 차이 (Tier 2 보조 지식)
        if (normalizedQuery.includes('소형') || normalizedQuery.includes('3톤') || normalizedQuery.includes('작은 거') || normalizedQuery.includes('소형면허')) {
            return this.auxiliaryKnowledge.find(k => k.id === 102).answer;
        }

        // F. 사진 등록 오류 / 규격 (Tier 2 보조 지식)
        if (normalizedQuery.includes('사진') && (normalizedQuery.includes('등록') || normalizedQuery.includes('규격') || normalizedQuery.includes('오류') || normalizedQuery.includes('실패') || normalizedQuery.includes('크기') || normalizedQuery.includes('셀카'))) {
            return this.auxiliaryKnowledge.find(k => k.id === 103).answer;
        }

        // G. 타 종목 대리접수 지원 여부 질의 (Tier 2 보조 지식 ID 104)
        if ((normalizedQuery.includes('접수 되') || normalizedQuery.includes('접수되') || normalizedQuery.includes('신청 되') || normalizedQuery.includes('신청되') || normalizedQuery.includes('대행 되') || normalizedQuery.includes('다른 자격증') || normalizedQuery.includes('기타 자격증')) &&
            (normalizedQuery.includes('전기') || normalizedQuery.includes('요양') || normalizedQuery.includes('공인중개사') || normalizedQuery.includes('손해평가사') || normalizedQuery.includes('위생사') || normalizedQuery.includes('부동산')) &&
            !normalizedQuery.includes('올해') && !normalizedQuery.includes('1차') && !normalizedQuery.includes('마감') && !normalizedQuery.includes('일정') && !normalizedQuery.includes('기간')) {
            return this.auxiliaryKnowledge.find(k => k.id === 104).answer;
        }

        // H. 타 종목 일정 및 접수
        if ((normalizedQuery.includes('손해평가사') || normalizedQuery.includes('공인중개사') || normalizedQuery.includes('부동산')) && (normalizedQuery.includes('올해') || normalizedQuery.includes('1차') || normalizedQuery.includes('마감') || normalizedQuery.includes('언제') || normalizedQuery.includes('지금') || isScheduleWord)) {
            return getMaster(7).answer;
        }
        if (normalizedQuery.includes('전기') && (isScheduleWord || normalizedQuery.includes('회차') || normalizedQuery.includes('정기'))) {
            return getMaster(5).answer;
        }
        if (normalizedQuery.includes('요양') && isScheduleWord) {
            return getMaster(6).answer;
        }
        if ((normalizedQuery.includes('접수 되') || normalizedQuery.includes('접수되') || normalizedQuery.includes('신청 되') || normalizedQuery.includes('신청되') || normalizedQuery.includes('대행 되') || normalizedQuery.includes('다른 자격증') || normalizedQuery.includes('기타 자격증')) &&
            (normalizedQuery.includes('전기') || normalizedQuery.includes('요양') || normalizedQuery.includes('공인중개사') || normalizedQuery.includes('손해평가사') || normalizedQuery.includes('위생사') || normalizedQuery.includes('부동산'))) {
            return this.auxiliaryKnowledge.find(k => k.id === 104).answer;
        }

        // H. 접수 시작 시각 (ID 8)
        if (/시작\s*시간|시작\s*시각|오픈\s*시간|몇\s*시에\s*시작|접수\s*시간/.test(normalizedQuery) && !normalizedQuery.includes('시험시간') && !normalizedQuery.includes('몇부')) {
            return getMaster(8).answer;
        }

        // I. 환불 규정 (사후 특별 환불 vs 가상계좌 vs 정규 환불)
        if (normalizedQuery.includes('사후환불') || normalizedQuery.includes('입원') || normalizedQuery.includes('사망') || normalizedQuery.includes('격리') || normalizedQuery.includes('천재지변') || normalizedQuery.includes('병원') || normalizedQuery.includes('다쳐')) {
            return getMaster(14).answer;
        }
        if (normalizedQuery.includes('가상계좌') || normalizedQuery.includes('무통장') || normalizedQuery.includes('입금기한') || normalizedQuery.includes('입금시간')) {
            return getMaster(15).answer;
        }
        if (isRefundWord) {
            return getMaster(13).answer;
        }

        // J. 접수방법은 이미 위(step 4)에서 처리됨

        // K. 준비물 / 신분증 (ID 12)
        if (isPrepWord) {
            return getMaster(12).answer;
        }

        // L. 합격자 발표 (ID 9)
        if (isPassWord) {
            return getMaster(9).answer;
        }

        // M. 시험시간 / 교시 (ID 11)
        if (isTimeWord) {
            return getMaster(11).answer;
        }

        // N. 응시료 (단독 또는 3대 자격증 질문) (ID 1)
        if (isFeeWord) {
            return getMaster(1).answer;
        }

        // O. 상시 접수 일정 (ID 4)
        if (isScheduleWord) {
            return getMaster(4).answer;
        }

        // 6. [Tier 2] 시나리오 확장 TF-IDF 검색으로 보조 지식 베이스 질의
        if (this.tfidfEngine && this.tfidfEngine.isIndexed) {
            const tfidfResults = this.tfidfEngine.search(normalizedQuery, 1, 0.12);
            if (tfidfResults && tfidfResults.length > 0 && tfidfResults[0].doc && tfidfResults[0].doc.answer) {
                return tfidfResults[0].doc.answer;
            }
        }

        // 7. [Tier 3] 사내 미확인 규정 무환각 거절
        return '해당 내용은 사내 안내 규정 문서에 나와 있지 않아 정확한 안내가 어렵습니다. (모르겠습니다)';
    }
}

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

// Expose class globally for inline onclick handlers and Node.js testing
if (typeof window !== 'undefined') {
    window.DuduChatbot = DuduChatbot;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DuduChatbot, MASTER_OFFICIAL_REGULATIONS, AUXILIARY_KNOWLEDGE, SENIOR_SYNONYMS };
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootDuduChatbot);
    } else {
        bootDuduChatbot();
    }
    setTimeout(bootDuduChatbot, 100);
}

})(); // End IIFE
