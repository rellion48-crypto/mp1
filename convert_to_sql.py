import csv
import re

def format_date_ymd(d_str):
    if not d_str:
        return 'NULL'
    d_str = d_str.strip()
    if re.match(r'^\d{4}-\d{2}-\d{2}$', d_str):
        return f"'{d_str}'"
    if re.match(r'^\d{4}/\d{2}/\d{2}$', d_str):
        return f"'{d_str.replace('/', '-')}'"
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})$', d_str)
    if m:
        day, month, year = m.groups()
        return f"'{year}-{month}-{day}'"
    return 'NULL'

def format_datetime(dt_str):
    if not dt_str:
        return "TIMEZONE('Asia/Seoul', NOW())"
    dt_str = dt_str.strip()
    if re.match(r'^\d{4}-\d{2}-\d{2}', dt_str):
        return f"'{dt_str}'"
    if re.match(r'^\d{4}/\d{2}/\d{2}', dt_str):
        return f"'{dt_str.replace('/', '-')}'"
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)', dt_str)
    if m:
        day, month, year, time_part = m.groups()
        return f"'{year}-{month}-{day} {time_part}'"
    return "TIMEZONE('Asia/Seoul', NOW())"

def format_phone(phone_str):
    if not phone_str:
        return '010-0000-0000'
    p = phone_str.strip().replace('-', '')
    if len(p) == 11 and p.startswith('010'):
        return f"{p[:3]}-{p[3:7]}-{p[7:]}"
    return phone_str.strip()

def format_gender(g):
    if not g: return 'NULL'
    g = str(g).strip().upper()
    if g in ['남', 'M', '1']: return "'남'"
    if g in ['여', 'F', '2']: return "'여'"
    return f"'{g}'"

def escape_sql(s):
    if s is None or s == '':
        return 'NULL'
    s = str(s).replace("'", "''").strip()
    return f"'{s}'"

def generate_schema():
    rows_to_insert = []

    # 1. National Tech
    with open('data/draft_100/두두넷_국가기술자격_접수_100.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            receipt_no = r.get('접수번호', '')
            name = r.get('성명', '')
            bday = format_date_ymd(r.get('생년월일', ''))
            gender = format_gender(r.get('성별', ''))
            phone = format_phone(r.get('연락처', ''))
            qual = r.get('자격종목', '')
            grade = r.get('등급', '기능사')
            exam_type = r.get('시험유형', '상시CBT')
            round_val = r.get('회차', '')
            round_sql = round_val if round_val.isdigit() else 'NULL'
            region = r.get('시험지역', '')
            center = r.get('시험장', '')
            exam_date = format_date_ymd(r.get('시험일자', ''))
            session_val = r.get('교시', '')
            fee = int(r.get('수수료', 14500) or 14500)
            discount_type = r.get('감면유형', '없음') or '없음'
            discount_amt = int(r.get('감면금액', 0) or 0)
            final_fee = int(r.get('최종결제금액', fee) or fee)
            pay_method = r.get('결제수단', '신용카드') or '신용카드'
            pay_status = r.get('결제상태', '완료') or '완료'
            status = r.get('접수상태', '접수완료') or '접수완료'
            created_at = format_datetime(r.get('접수일시', ''))
            usage = r.get('사용맥락', '')

            rows_to_insert.append((
                escape_sql(receipt_no), escape_sql(name), bday, gender, escape_sql(phone),
                escape_sql(qual), escape_sql(grade), escape_sql(exam_type), escape_sql('필기'),
                round_sql, escape_sql(region), escape_sql(center), exam_date, escape_sql(session_val),
                fee, escape_sql(discount_type), discount_amt, final_fee,
                escape_sql(pay_method), escape_sql(pay_status), escape_sql(status), escape_sql(usage),
                'NULL', 0, created_at
            ))

    # 2. Professional
    with open('data/draft_100/두두넷_전문자격_접수_100.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            receipt_no = r.get('receipt_no', '')
            name = r.get('applicant_name', '')
            bday = format_date_ymd(r.get('date_of_birth', ''))
            gender = format_gender(r.get('sex', ''))
            phone = format_phone(r.get('contact_number', ''))
            qual = r.get('qualification', '')
            stage = r.get('exam_stage', '1차')
            region = r.get('exam_region', '')
            center = r.get('exam_center', '')
            exam_date = format_date_ymd(r.get('test_date', ''))
            session_val = r.get('session_no', '')
            fee = int(r.get('amount', 30000) or 30000)
            discount_type = r.get('discount', 'NONE') or '없음'
            final_fee = int(r.get('final_amount', fee) or fee)
            raw_pay = r.get('pay_type', 'CARD')
            pay_method = '신용카드' if 'CARD' in raw_pay else ('계좌이체' if 'BANK' in raw_pay else '가상계좌')
            status = '접수완료' if r.get('app_status') == 'CONFIRMED' else '접수대기'
            created_at = format_datetime(r.get('registered_at', ''))
            usage = r.get('usage_context', '')

            rows_to_insert.append((
                escape_sql(receipt_no), escape_sql(name), bday, gender, escape_sql(phone),
                escape_sql(qual), escape_sql('전문자격'), escape_sql('연1회'), escape_sql(stage),
                'NULL', escape_sql(region), escape_sql(center), exam_date, escape_sql(session_val),
                fee, escape_sql(discount_type), 0, final_fee,
                escape_sql(pay_method), escape_sql('완료'), escape_sql(status), escape_sql(usage),
                'NULL', 0, created_at
            ))

    # 3. Health
    with open('data/draft_100/두두보건_접수_100.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            receipt_no = r.get('examNumber', '')
            name = r.get('fullName', '')
            bday = format_date_ymd(r.get('birthday', ''))
            gender = format_gender(r.get('genderCode', ''))
            phone = format_phone(r.get('mobile', ''))
            qual = r.get('certType', '')
            region = r.get('centerName', '')
            center = r.get('centerName', '')
            exam_date = format_date_ymd(r.get('examDate', ''))
            session_val = r.get('timeSlot', '')
            fee = int(r.get('feeAmount', 32000) or 32000)
            discount_type = r.get('discountType', '없음') or '없음'
            final_fee = int(r.get('finalFee', fee) or fee)
            raw_pay = (r.get('payment') or '').lower()
            pay_method = '신용카드' if 'card' in raw_pay else ('계좌이체' if 'transfer' in raw_pay else '가상계좌')
            status = '접수완료' if r.get('regStatus') == 'active' else '접수대기'
            created_at = format_datetime(r.get('appliedAt', ''))
            usage = r.get('usageContext', '')
            training_org = r.get('trainingOrg', '')
            training_hours = r.get('trainingHours', '0')
            training_hours_sql = training_hours if training_hours.isdigit() else '0'

            rows_to_insert.append((
                escape_sql(receipt_no), escape_sql(name), bday, gender, escape_sql(phone),
                escape_sql(qual), escape_sql('보건자격'), escape_sql('상시'), escape_sql('필기'),
                'NULL', escape_sql(region), escape_sql(center), exam_date, escape_sql(session_val),
                fee, escape_sql(discount_type), 0, final_fee,
                escape_sql(pay_method), escape_sql('완료'), escape_sql(status), escape_sql(usage),
                escape_sql(training_org), training_hours_sql, created_at
            ))

    sql_header = """-- ============================================================================
-- 미니 프로젝트 1 (MP1) - 두두자격지원센터 Supabase 전체 데이터베이스 스키마
-- (참고 자료: data/01_form_정책.md, data/02_접수DB_필드명세.md, draft_100 데이터셋)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 통합 원서접수 테이블 (applications) : 메인 접수 웹페이지 & 접수 어드민 연동
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id BIGSERIAL PRIMARY KEY,
    receipt_number TEXT,                          -- 접수번호 (예: DN2026772247, DP2026873295, DH2026428626)
    name TEXT NOT NULL,                           -- 성명
    birth_date DATE,                              -- 생년월일
    gender TEXT,                                  -- 성별 (남/여)
    phone TEXT NOT NULL,                          -- 연락처 (010-xxxx-xxxx)
    qualification TEXT NOT NULL,                  -- 자격종목명 (한식조리, 지게차, 굴착기, 전기, 요양보호사, 위생사, 손해평가사, 공인중개사)
    grade TEXT DEFAULT '기능사',                   -- 등급 (기능사/전문자격/보건자격)
    exam_type TEXT DEFAULT '상시CBT',             -- 시험유형 (상시CBT/정기/연1회)
    exam_stage TEXT DEFAULT '필기',               -- 시험구분/차수 (필기/1차/2차)
    exam_round INT,                               -- 정기 회차 (1~4, 상시는 NULL)
    exam_region TEXT,                             -- 시험지역 (서울/부산/대구 등 17개 광역)
    exam_center TEXT,                             -- 시험장 / 시험센터명
    exam_date DATE,                               -- 시험일자
    exam_session TEXT,                            -- 교시/시간대 (1~5교시, AM/PM 등)
    fee_amount INT DEFAULT 14500,                 -- 원 응시수수료
    fee_discount_type TEXT DEFAULT '없음',         -- 감면유형 (없음/장애인/기초수급/국가유공자/차상위)
    fee_discount_amount INT DEFAULT 0,            -- 감면금액
    fee_final INT DEFAULT 14500,                  -- 최종 결제금액
    payment_method TEXT DEFAULT '신용카드',        -- 결제수단 (신용카드/계좌이체/가상계좌)
    payment_status TEXT DEFAULT '완료',            -- 결제상태 (대기/완료/실패/환불)
    status TEXT DEFAULT '접수완료',                -- 접수상태 (접수완료/결제대기/취소/환불)
    usage_context TEXT,                           -- 접수 사용 맥락 (본인단독/가족보조/복지관 등)
    training_institution TEXT,                    -- 교육기관명 (보건자격 수료기관)
    training_hours INT DEFAULT 0,                 -- 교육이수시간 (요양보호사 240 등)
    memo TEXT,                                    -- 어드민 관리자 메모
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Seoul', NOW())
);

-- applications RLS 정책 설정 (공개 접근 허용)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on applications" ON public.applications;
DROP POLICY IF EXISTS "Allow public insert on applications" ON public.applications;
DROP POLICY IF EXISTS "Allow public update on applications" ON public.applications;
DROP POLICY IF EXISTS "Allow public delete on applications" ON public.applications;

CREATE POLICY "Allow public select on applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on applications" ON public.applications FOR DELETE USING (true);


-- ----------------------------------------------------------------------------
-- 2. FAQ 및 사내 안내 규정 테이블 (faq_documents) : AI 챗봇 & FAQ 어드민 연동
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faq_documents (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL,                       -- 구분 (응시료, 일정, 결제/환불, 유효기간, 시험준비물, 접수방법, 실기문의, 확인불가)
    qualification TEXT DEFAULT '공통',            -- 대상 자격종목
    question TEXT NOT NULL,                       -- 질문 / 규정 제목
    keywords TEXT NOT NULL,                       -- 검색 및 시니어 유의어 키워드 (쉼표 구분)
    answer TEXT NOT NULL,                         -- 챗봇 응답 내용 (사내 규정 원장 기반)
    is_unknown BOOLEAN DEFAULT false,             -- 확인 불가 항목 여부 (true 시 '모르겠습니다' 강제 거절)
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Seoul', NOW())
);

-- faq_documents RLS 정책 설정
ALTER TABLE public.faq_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on faq_documents" ON public.faq_documents;
DROP POLICY IF EXISTS "Allow public insert on faq_documents" ON public.faq_documents;
DROP POLICY IF EXISTS "Allow public update on faq_documents" ON public.faq_documents;
DROP POLICY IF EXISTS "Allow public delete on faq_documents" ON public.faq_documents;

CREATE POLICY "Allow public select on faq_documents" ON public.faq_documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on faq_documents" ON public.faq_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on faq_documents" ON public.faq_documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on faq_documents" ON public.faq_documents FOR DELETE USING (true);


-- ----------------------------------------------------------------------------
-- 3. FAQ 규정 원장 데이터 시딩 (01_form_정책.md & 02_안내규정.md 기반 최신 데이터)
-- ----------------------------------------------------------------------------
DELETE FROM public.faq_documents;

INSERT INTO public.faq_documents (category, qualification, question, keywords, answer, is_unknown) VALUES
('응시료', '기능사 4종', '기능사(한식, 지게차, 굴착기, 전기) 필기 응시료는 얼마인가요?', '응시료,접수비,시험비,비용,얼마,한식,지게차,굴착기,전기,포크레인,수수료,돈', '한식조리기능사, 지게차운전기능사, 굴착기운전기능사, 전기기능사 등 4개 기능사 종목의 필기 응시료는 모두 14,500원으로 동일합니다.', false),
('응시료', '요양보호사', '요양보호사 응시 수수료는 얼마인가요?', '요양보호사,요양사,응시료,접수비,시험비,비용,얼마,돈,수수료', '요양보호사 시험 응시 수수료는 32,000원입니다. (교육이수 240시간 수료 필수)', false),
('응시료', '위생사', '위생사 응시 수수료는 얼마인가요?', '위생사,응시료,접수비,시험비,비용,얼마,돈,수수료', '위생사 시험 응시 수수료는 30,000원입니다. (보건관련학과 이수자 대상)', false),
('응시료', '손해평가사', '손해평가사 시험 응시 수수료는 얼마인가요?', '손해평가사,응시료,접수비,시험비,비용,얼마,1차,2차,돈,수수료', '손해평가사 수수료는 1차 30,000원, 2차 30,000원입니다.', false),
('응시료', '공인중개사', '공인중개사 시험 응시 수수료는 얼마인가요?', '공인중개사,부동산,응시료,접수비,시험비,비용,얼마,1차,2차,돈,수수료', '공인중개사 수수료는 1차 13,400원, 2차 15,200원 (1·2차 동시 응시 시 28,600원)입니다.', false),

('일정', '전기기능사', '전기기능사 시험 일정은 언제인가요?', '전기기능사,전기,일정,접수기간,언제,4회,정기,시험일', '전기기능사는 연 4회 정기시험으로 시행됩니다. 현재 가장 가까운 제4회 필기 원서접수는 2026.08.24 ~ 08.27이며, 필기시험일은 09.16 ~ 09.21입니다.', false),
('일정', '상시 3종', '한식조리, 지게차, 굴착기운전기능사 접수 기간은 언제인가요?', '한식,지게차,굴착기,포크레인,상시,일정,언제,접수기간,시험일', '한식조리, 지게차운전, 굴착기운전기능사는 별도의 접수 기간 없이 상시로 운영되며, 시험장에 빈자리가 있으면 언제든 접수 가능합니다. (CBT 시험으로 당일 합격 발표)', false),
('일정', '전문자격 2종', '손해평가사, 공인중개사 접수 기간은 언제인가요?', '손해평가사,공인중개사,부동산,일정,접수기간,언제,1차,마감', '손해평가사(제12회)와 공인중개사(제37회)는 연 1회 시행되며, 올해 2026년 1차 필기 원서접수는 이미 마감되었습니다. 올해는 접수가 불가합니다.', false),

('결제/환불', '공통', '환불 규정 및 취소 기간은 어떻게 되나요?', '환불,취소,돈돌려,환불금,취소기간,100%,50%', '원서접수 기간 내 취소 시 100% 환불되며, 접수 마감 후부터 시험 시작 5일 전까지는 50% 환불됩니다. 시험 시작 4일 전부터는 환불이 불가합니다.', false),
('결제/환불', '공통', '결제 마감 시간과 가상계좌 입금 기한은 어떻게 되나요?', '결제,마감,가상계좌,입금,입금기한,시간', '원서접수 결제 마감은 마감일 18:00까지입니다. 가상계좌의 경우 접수 당일/익일 14:00까지 입금해야 하며 마감일 13:00 이후에는 가상계좌 사용이 불가합니다.', false),

('유효기간', '기능사 4종', '필기시험 합격 후 유효기간은 얼마나 되나요?', '유효기간,필기합격,면제,기간,몇년,유효', '국가기술자격(기능사)은 필기 합격일로부터 2년간 필기시험이 면제됩니다. (2년 이내 실기 응시 가능)', false),
('시험준비물', '공통', '시험 당일 준비물 및 지참물은 무엇인가요?', '준비물,신분증,수험표,필기구,시계,계산기,스마트폰,휴대폰,지참물', '시험 당일 반드시 신분증, 수험표, 흑색 필기구를 지참하셔야 합니다. 휴대폰, 스마트워치 등 전자기기는 시험실 반입 금지이며 소지 시 무효 처리됩니다.', false),

('접수방법', '공통', '방문 접수나 전화 접수가 가능한가요?', '방문,전화,직접,창구,인터넷,대리', '두두넷 공식 원서접수는 온라인(인터넷/모바일)으로만 진행되며 방문 접수는 불가합니다. 저희 센터에서는 온라인 접수가 어려운 어르신들을 위해 대리 신청 접수를 도와드리고 있습니다.', false),
('실기문의', '공통', '실기 시험 안내 및 접수도 가능한가요?', '실기,2차,실습,직접하는거', '저희는 필기 접수만 도와드립니다. 실기 시험 관련 문의는 해당 시행기관으로 문의해 주시기 바랍니다.', false),

('확인불가', '공통', '시험장에 주차 가능한가요?', '주차,주차장,차량,차', '시험장별 주차 가능 여부는 사내 원장에서 확인되지 않아 안내가 어렵습니다. (모르겠습니다)', true);


-- ----------------------------------------------------------------------------
-- 4. draft_100 초기 접수 데이터 시딩 (총 100건 데이터)
-- ----------------------------------------------------------------------------
DELETE FROM public.applications;

INSERT INTO public.applications (
    receipt_number, name, birth_date, gender, phone,
    qualification, grade, exam_type, exam_stage,
    exam_round, exam_region, exam_center, exam_date, exam_session,
    fee_amount, fee_discount_type, fee_discount_amount, fee_final,
    payment_method, payment_status, status, usage_context,
    training_institution, training_hours, created_at
) VALUES
"""

    values_parts = []
    for r in rows_to_insert:
        val_str = f"({r[0]}, {r[1]}, {r[2]}, {r[3]}, {r[4]}, {r[5]}, {r[6]}, {r[7]}, {r[8]}, {r[9]}, {r[10]}, {r[11]}, {r[12]}, {r[13]}, {r[14]}, {r[15]}, {r[16]}, {r[17]}, {r[18]}, {r[19]}, {r[20]}, {r[21]}, {r[22]}, {r[23]}, {r[24]})"
        values_parts.append(val_str)

    full_sql = sql_header + ",\n".join(values_parts) + ";\n"

    with open('supabase_schema.sql', 'w', encoding='utf-8') as out_f:
        out_f.write(full_sql)

    print("supabase_schema.sql successfully generated with 100 sample applications & FAQ seeding!")

if __name__ == '__main__':
    generate_schema()
