-- ============================================================================
-- 미니 프로젝트 1 (MP1) - 두두자격지원센터 Supabase 테이블 스키마 & 초기 데이터
-- ============================================================================

-- 1. applications 테이블 (원서접수 신청 목록)
CREATE TABLE IF NOT EXISTS public.applications (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    qualification TEXT NOT NULL,
    status TEXT DEFAULT '접수완료',
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Seoul', NOW())
);

-- RLS 정책 설정 (공개 접근 허용 for Mini Project)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on applications" 
ON public.applications FOR SELECT USING (true);

CREATE POLICY "Allow public insert on applications" 
ON public.applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on applications" 
ON public.applications FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on applications" 
ON public.applications FOR DELETE USING (true);


-- 2. faq_documents 테이블 (FAQ 및 안내 규정 원장)
CREATE TABLE IF NOT EXISTS public.faq_documents (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL,          -- 예: '응시료', '일정', '환불/결제', '시험시간/준비물', '유효기간'
    qualification TEXT DEFAULT '공통', -- '한식조리기능사', '지게차운전기능사', '굴착기운전기능사', '전기기능사', '요양보호사', '위생사', '손해평가사', '공인중개사', '공통'
    question TEXT NOT NULL,          -- 질문 또는 항목 제목
    keywords TEXT NOT NULL,          -- 검색 및 시니어 유의어 키워드 (쉼표 구분)
    answer TEXT NOT NULL,            -- 챗봇 응답 내용 (근거 문서 기반)
    is_unknown BOOLEAN DEFAULT false,-- 확인 불가 8대 항목 여부 (true인 경우 "모르겠습니다" 강제)
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Seoul', NOW())
);

-- RLS 정책 설정
ALTER TABLE public.faq_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on faq_documents" 
ON public.faq_documents FOR SELECT USING (true);

CREATE POLICY "Allow public insert on faq_documents" 
ON public.faq_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on faq_documents" 
ON public.faq_documents FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on faq_documents" 
ON public.faq_documents FOR DELETE USING (true);


-- 3. 초기 FAQ 안내 규정 데이터 시딩 (02_안내규정.md 기반)
INSERT INTO public.faq_documents (category, qualification, question, keywords, answer, is_unknown) VALUES
('응시료', '기능사 4종', '기능사(한식, 지게차, 굴착기, 전기) 필기 응시료는 얼마인가요?', '응시료,접수비,시험비,비용,얼마,한식,지게차,굴착기,전기,포크레인,수수료', '한식조리기능사, 지게차운전기능사, 굴착기운전기능사, 전기기능사 등 4개 기능사 종목의 필기 응시료는 모두 14,500원으로 동일합니다.', false),
('응시료', '요양보호사', '요양보호사 응시료는 얼마인가요?', '요양보호사,요양사,응시료,접수비,시험비,비용,얼마', '요양보호사 응시료는 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true),
('응시료', '위생사', '위생사 응시료는 얼마인가요?', '위생사,응시료,접수비,시험비,비용,얼마', '위생사 응시료는 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true),
('응시료', '손해평가사', '손해평가사 1차 응시료는 얼마인가요?', '손해평가사,응시료,접수비,시험비,비용,얼마,1차', '손해평가사 1차 응시료는 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true),
('응시료', '공인중개사', '공인중개사 1차 응시료는 얼마인가요?', '공인중개사,응시료,접수비,시험비,비용,얼마,1차', '공인중개사 1차 응시료는 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true),

('일정', '전기기능사', '전기기능사 시험 일정은 언제인가요?', '전기기능사,전기,일정,접수기간,언제,4회,정기', '전기기능사는 연 4회 정기시험으로 시행됩니다. 현재 가장 가까운 제4회 필기 원서접수는 2026.08.24 ~ 08.27이며, 필기시험일은 09.16 ~ 09.21입니다.', false),
('일정', '상시 3종', '한식조리, 지게차, 굴착기운전기능사 접수 기간은 언제인가요?', '한식,지게차,굴착기,포크레인,상시,일정,언제,접수기간', '한식조리, 지게차운전, 굴착기운전기능사는 별도의 접수 기간 없이 상시로 운영되며, 시험장에 빈자리가 있으면 언제든 접수 가능합니다. (CBT 시험으로 당일 합격 발표)', false),
('일정', '전문자격 2종', '손해평가사, 공인중개사 접수 기간은 언제인가요?', '손해평가사,공인중개사,부동산,일정,접수기간,언제,1차', '손해평가사(제12회)와 공인중개사(제37회)는 연 1회 시행되며, 올해 2026년 1차 필기 원서접수는 이미 마감되었습니다.', false),

('결제/환불', '공통', '환불 규정 및 환불 기간은 어떻게 되나요?', '환불,취소,돈돌려,환불금,취소기간', '원서접수 기간 내 취소 시 100% 환불되며, 접수 마감 후부터 시험 시작 5일 전까지는 50% 환불됩니다. 시험 시작 4일 전부터는 환불이 불가합니다.', false),
('결제/환불', '공통', '결제 마감 시간과 가상계좌 입금 기한은 어떻게 되나요?', '결제,마감,가상계좌,입금,입금기한,시간', '원서접수 결제 마감은 마감일 18:00까지입니다. 가상계좌의 경우 접수 당일/익일 14:00까지 입금해야 하며 마감일 13:00 이후에는 가상계좌 사용이 불가합니다.', false),

('유효기간', '기능사 4종', '필기시험 합격 후 유효기간은 얼마나 되나요?', '유효기간,필기합격,면제,기간,몇년', '국가기술자격(기능사)은 필기 합격일로부터 2년간 필기시험이 면제됩니다. (공인중개사 등 전문자격은 별도 규정 적용)', false),
('시험준비물', '공통', '시험 당일 준비물 및 소지품 규정은 어떻게 되나요?', '준비물,신분증,수험표,필기구,시계,계산기,스마트폰,휴대폰', '시험 당일 반드시 신분증, 수험표, 흑색 필기구를 지참하셔야 합니다. 휴대폰, 스마트워치, 통신기기는 반입이 금지되며 소지 시 시험 무효 처리됩니다.', false),

('접수방법', '공통', '방문 접수나 전화 접수가 가능한가요?', '방문,전화,직접,창구,인터넷', '두두넷 공식 원서접수는 온라인(인터넷/모바일)으로만 진행되며 방문 접수는 불가합니다. 저희 센터에서는 온라인 접수가 어려운 어르신들을 위해 대리 신청 접수를 도와드리고 있습니다.', false),
('실기문의', '공통', '실기 시험 안내 및 접수도 가능한가요?', '실기,2차,실습,직접하는거', '저희는 필기 접수만 도와드립니다. 실기 시험 관련 문의는 해당 시행기관으로 문의해 주시기 바랍니다.', false),

('확인불가', '공통', '시험장에 주차 가능한가요?', '주차,주차장,차량,차', '시험장별 주차 가능 여부는 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true),
('확인불가', '요양보호사', '요양보호사 응시 자격 조건이 어떻게 되나요?', '요양보호사자격,응시자격,자격요건,교육이수', '요양보호사 응시자격 세부 기준은 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true);
