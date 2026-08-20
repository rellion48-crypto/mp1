import json
import urllib.request
import urllib.error
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://amlznptemtbkhyuzdkmu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHpucHRlbXRia2h5dXpka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzcxMTQsImV4cCI6MjEwMjY1MzExNH0.DY_P3C5G136AuhSYAn7RvMKQfEOPxKmN-wI__f3fjfg"

# 23건 사내 규정 원장
REGULATION_23 = [
    {"id": 1, "category": "응시료", "qualification": "3대 기능사 공통 (한식, 지게차, 굴착기)", "question": "한식조리, 지게차, 굴착기운전기능사 필기 응시료는 얼마인가요?", "keywords": "응시료,접수비,시험비,비용,얼마,한식,한식조리,지게차,굴착기,포크레인,수수료,돈,기능사,금액,얼마예요", "answer": "어르신, 한식조리기능사, 지게차운전기능사, 굴착기운전기능사 3종 모두 필기 응시료는 14,500원으로 동일합니다. (기초생활수급자, 등록장애인, 국가유공자, 차상위계층 대상자는 50% 감면된 7,250원입니다.)", "is_unknown": False},
    {"id": 2, "category": "응시료", "qualification": "국가기술자격 실기 수수료", "question": "기능사 실기시험 응시료(수수료)는 얼마인가요?", "keywords": "실기,실기비용,실기응시료,실기수수료,2차비용,실습비,전기기능사실기,한식실기,지게차실기,굴착기실기", "answer": "국가기술자격 실기시험 수수료는 종목마다 다릅니다. 한식조리기능사는 26,900원, 지게차운전기능사는 25,200원, 굴착기운전기능사는 27,800원이며, 전기기능사 실기는 재료비 등으로 인해 106,200원입니다.", "is_unknown": False},
    {"id": 3, "category": "응시료", "qualification": "사회적 배려계층 감면", "question": "응시료 50% 감면 대상자는 누구이고 얼마를 내나요?", "keywords": "감면,50%,할인,기초수급자,차상위,국가유공자,장애인,면제,혜택", "answer": "기초생활수급자, 등록장애인, 국가유공자, 차상위계층에 해당하시는 어르신께서는 정규 필기 응시료(14,500원)의 50%가 감면되어 7,250원만 결제하시면 됩니다.", "is_unknown": False},
    {"id": 4, "category": "일정/방식", "qualification": "3대 기능사 공통 (상시 CBT)", "question": "한식, 지게차, 굴착기 시험 접수 기간과 시험 방식은 어떻게 되나요?", "keywords": "접수기간,언제접수,상시,CBT,컴퓨터시험,시험방식,신청기간,날짜,시험일정", "answer": "한식조리, 지게차, 굴착기 3대 종목은 별도의 정기 접수 기간 없이 상시 CBT(컴퓨터 시험)로 운영됩니다. 시험장에 빈자리가 있으면 원하시는 날짜와 교시를 선택해 언제든 접수하실 수 있습니다.", "is_unknown": False},
    {"id": 5, "category": "일정/방식", "qualification": "전기기능사 (정기 회차)", "question": "전기기능사 시험 일정과 접수 기간은 어떻게 되나요?", "keywords": "전기기능사,전기,정기시험,정기회차,4회,전기일정,전기접수", "answer": "전기기능사는 연 4회 정기 시험으로 진행됩니다. 2026년 기준 가장 가까운 제4회 필기 원서접수는 8월 24일부터 8월 27일까지이며, 필기시험은 9월 16일부터 9월 21일까지 치러집니다. (빈자리 추가접수는 9월 10일~11일)", "is_unknown": False},
    {"id": 6, "category": "일정/방식", "qualification": "요양보호사 (국시원 상시)", "question": "요양보호사 시험 접수는 언제까지 해야 하나요?", "keywords": "요양보호사,요양사,국시원,요양접수,요양일정,요양보호사접수", "answer": "요양보호사 시험은 국시원 상시시험 사이트에서 접수하며, 원하시는 시험일 기준 7일 전까지 접수를 마치셔야 합니다. 합격자 발표는 시험 다음 날 오전 10시 이후(주말·공휴일 제외)에 공지됩니다.", "is_unknown": False},
    {"id": 7, "category": "일정/방식", "qualification": "손해평가사 / 공인중개사 (연 1회)", "question": "손해평가사, 공인중개사 올해 1차 시험 접수할 수 있나요?", "keywords": "손해평가사,공인중개사,부동산,1차,올해접수,전문자격", "answer": "손해평가사(제12회 1차, 4월 마감)와 공인중개사(제37회 1차, 8월 마감)는 모두 연 1회 시행되는 시험으로 올해 1차 원서접수가 이미 마감되었습니다. 따라서 올해는 접수가 불가능하며 내년 시험에 응시하셔야 합니다.", "is_unknown": False},
    {"id": 8, "category": "일정/방식", "qualification": "접수 시작 시간", "question": "원서접수 시작 시각은 몇 시인가요?", "keywords": "접수시간,몇시,시작시간,오전9시,오전10시,오픈시간", "answer": "국가기술자격 기능사(한식, 지게차, 굴착기, 전기)는 첫날 오전 10:00에 접수가 시작되며, 전문자격(손해평가사, 공인중개사)은 전용 사이트에서 오전 09:00에 시작됩니다. 선착순 마감이므로 시간을 잘 확인하셔야 합니다.", "is_unknown": False},
    {"id": 9, "category": "합격발표", "qualification": "3대 기능사 공통 (상시 CBT)", "question": "합격자 발표는 언제 나오나요?", "keywords": "합격,발표,언제나와,결과,점수,당일,합격자,합격여부", "answer": "한식조리, 지게차, 굴착기운전기능사 상시 CBT 시험은 컴퓨터로 치러지므로, 시험 종료 버튼을 누르면 그 자리에서 즉시 점수와 합격 여부를 확인하실 수 있습니다.", "is_unknown": False},
    {"id": 10, "category": "유효기간", "qualification": "국가기술자격 기능사 공통", "question": "필기시험에 합격하면 유효기간이 얼마나 되나요?", "keywords": "유효기간,필기면제,면제기간,2년,필기합격,실기언제까지", "answer": "국가기술자격(기능사)은 필기시험 합격일로부터 2년간 필기시험이 면제됩니다. 2년 이내에 원하시는 실기시험에 접수하여 응시하시면 됩니다.", "is_unknown": False},
    {"id": 11, "category": "시험시간", "qualification": "상시 CBT 교시 안내", "question": "하루에 몇 부(교시)까지 시험이 있고 시간은 얼마나 걸리나요?", "keywords": "교시,몇부,시간,시험시간,1부,2부,3부,4부,5부,60분,소요시간", "answer": "상시 CBT 시험은 기능사 기준 시험시간이 60분이며, 하루에 1부(09:00), 2부(11:00), 3부(13:00), 4부(15:00), 5부(17:00) 총 5개 교시로 나뉘어 진행됩니다.", "is_unknown": False},
    {"id": 12, "category": "시험준비물", "qualification": "시험장 지참물 및 반입 규정", "question": "시험 당일 준비물과 시험실에 가지고 들어갈 수 있는 물품은 무엇인가요?", "keywords": "준비물,신분증,수험표,필기도구,스마트폰,휴대폰,스마트워치,시계,계산기,지참물", "answer": "시험 당일에는 실물 신분증(주민등록증·운전면허증 등), 수험표, 흑색 필기구를 반드시 지참하셔야 합니다. 시험실에는 신분증, 수험표, 필기구, 수정테이프, 일반시계, 계산기, 간식 등 8가지만 허용되며, 스마트폰·스마트워치 등 전자기기는 소지 시 즉시 시험이 무효 처리됩니다.", "is_unknown": False},
    {"id": 13, "category": "결제/환불", "qualification": "정규 환불 규정", "question": "접수 후 취소하면 환불을 얼마나 받을 수 있나요?", "keywords": "환불,취소,환불금액,전액환불,50%환불,환불기간,토스페이먼츠", "answer": "원서접수 기간 내 취소 시에는 100% 전액 환불되며, 접수 마감 후부터 해당 시험 시작 5일 전까지는 50%가 환불됩니다. (시험 시작 4일 전부터는 환불 불가). 환불금은 최대 7일 이내 '토스페이먼츠' 명의로 입금됩니다.", "is_unknown": False},
    {"id": 14, "category": "결제/환불", "qualification": "사후 특별 환불 (100%)", "question": "시험을 못 보게 되었는데 사후 환불(100%)을 받을 수 있는 사유가 있나요?", "keywords": "사후환불,입원,사망,상,전염병,격리,천재지변,교통두절,특별환불", "answer": "접수기간 이후라도 직계가족(부모·배우자·자녀 등) 사망, 본인의 질병·사고 입원, 국가 전염병 격리, 천재지변으로 인한 교통 두절 등의 불가피한 사유가 있을 경우 증빙서류를 제출하시면 100% 전액 환불받으실 수 있습니다.", "is_unknown": False},
    {"id": 15, "category": "결제/환불", "qualification": "가상계좌 입금 기한", "question": "가상계좌로 결제할 때 언제까지 입금해야 하나요?", "keywords": "가상계좌,무통장,입금기한,언제까지입금,자동취소", "answer": "가상계좌는 접수 시점에 따라 기한이 다릅니다. 마감일 전날 13시 이전 접수는 당일 14시까지, 13시 이후 접수는 익일 14시까지 입금하셔야 합니다. 마감일 당일 13시 이후에는 가상계좌 채번이 불가하므로 카드나 실시간 계좌이체를 이용하셔야 합니다.", "is_unknown": False},
    {"id": 16, "category": "접수방법", "qualification": "공통 (시니어 무료 대행)", "question": "컴퓨터나 스마트폰 사용이 어려운데 전화나 방문으로도 접수가 가능한가요?", "keywords": "전화접수,방문접수,접수대행,도와줘,신청해줘,어려워,인터넷못해", "answer": "네 어르신, 인터넷 접수가 어려우신 경우 성함과 연락처를 남겨주시면 저희 두두자격지원센터 상담 직원이 친절하게 무료로 원서접수 대행을 도와드립니다.", "is_unknown": False},
    {"id": 17, "category": "확인불가", "qualification": "요양보호사", "question": "요양보호사 자격증 응시료는 얼마인가요?", "keywords": "요양보호사응시료,요양보호사비용,요양사수수료,요양보호사돈", "answer": "죄송합니다. 요양보호사 응시료 금액은 사내 안내 규정 문서에 명시되어 있지 않아 정확한 안내가 어렵습니다. (국시원 홈페이지를 통해 확인해 주시기 바랍니다.)", "is_unknown": True},
    {"id": 18, "category": "확인불가", "qualification": "위생사", "question": "위생사 자격증 시험 일정과 응시료는 어떻게 되나요?", "keywords": "위생사,위생사일정,위생사응시료,위생사비용,위생사수수료", "answer": "죄송합니다. 위생사 시험 일정 및 응시료는 사내 안내 규정에 기재되어 있지 않아 답변드릴 수 없습니다. (국시원 대표 홈페이지에서 확인 부탁드립니다.)", "is_unknown": True},
    {"id": 19, "category": "확인불가", "qualification": "손해평가사 / 공인중개사", "question": "손해평가사 또는 공인중개사 1차 시험 응시료는 얼마인가요?", "keywords": "손해평가사응시료,공인중개사응시료,손해평가사비용,공인중개사비용,손해평가사수수료,공인중개사수수료", "answer": "죄송합니다. 손해평가사 및 공인중개사 1차 응시료 금액은 사내 규정 원장에 등록되어 있지 않아 안내가 불가합니다. (큐넷 전문자격 홈페이지를 참조해 주십시오.)", "is_unknown": True},
    {"id": 20, "category": "확인불가", "qualification": "요양보호사 교육 이수", "question": "요양보호사 응시자격 교육 이수 시간은 몇 시간인가요?", "keywords": "요양보호사이수시간,요양보호사교육시간,요양보호사자격조건,요양보호사이수", "answer": "죄송합니다. 요양보호사 교육 이수 시간 및 상세 응시자격 요건은 사내 규정 문서에 확인되지 않아 안내가 어렵습니다.", "is_unknown": True},
    {"id": 21, "category": "확인불가", "qualification": "공인중개사 1차 면제", "question": "공인중개사 1차 시험에 합격하면 2차 면제 기간이 정말 1년인가요?", "keywords": "공인중개사면제,공인중개사1년,공인중개사유효기간", "answer": "죄송합니다. 공인중개사 1차 합격에 따른 면제 기간은 사내 규정 원장에서 공식 확인되지 않았으므로 정확한 답변을 드릴 수 없습니다.", "is_unknown": True},
    {"id": 22, "category": "확인불가", "qualification": "시험장 시설/주차", "question": "시험장에 주차장이 있나요? 주차나 셔틀버스가 지원되나요?", "keywords": "주차,주차장,차댈곳,셔틀버스,대중교통,주차비", "answer": "죄송합니다. 시험장별 주차 가능 여부나 셔틀버스 운행 정보는 사내 안내 규정에 나와 있지 않아 안내가 어렵습니다. 시험장 본부로 직접 문의해 주시기 바랍니다.", "is_unknown": True},
    {"id": 23, "category": "확인불가", "qualification": "개인 상담", "question": "제가 이번 시험에 합격할 수 있을까요? 교재나 강의를 추천해 주세요.", "keywords": "합격할까요,붙을수있나요,교재추천,학원추천,강의추천,난이도", "answer": "죄송합니다. 개인의 시험 합격 가능성이나 사설 교재/강의 추천은 사내 규정 안내 범위를 벗어나 답변드릴 수 없습니다. 어르신의 도전을 진심으로 응원합니다!", "is_unknown": True}
]

def clear_faq_table():
    url = f"{SUPABASE_URL}/rest/v1/faq_documents?id=gt.0"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f"Bearer {SUPABASE_ANON_KEY}",
        'Prefer': 'return=minimal'
    }
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Cleared existing records from 'faq_documents'. (HTTP {resp.status})")
    except Exception as e:
        print("Clear note:", e)

def upload_all_faq():
    input_path = 'data/faq_knowledge_base.json'
    with open(input_path, 'r', encoding='utf-8') as f:
        knowledge_data = json.load(f)
        
    print(f"Total knowledge records loaded: {len(knowledge_data)}")
    
    # 1. 23건 사내 규정
    all_records = []
    current_id = 1
    for reg in REGULATION_23:
        all_records.append({
            'id': current_id,
            'category': reg['category'],
            'qualification': reg['qualification'],
            'question': reg['question'],
            'keywords': reg['keywords'],
            'answer': reg['answer'],
            'is_unknown': reg['is_unknown']
        })
        current_id += 1
        
    # 2. 4,705건 상담 Q&A
    for item in knowledge_data:
        cert = item.get('cert', '공통')
        category = item.get('category', '상담')
        question = item.get('question', '')
        answer = item.get('answer', '')
        channel = item.get('channel', '상담')
        keywords = f"{cert},{category},{channel},{item.get('caller_type', '')}"
        
        all_records.append({
            'id': current_id,
            'category': category,
            'qualification': cert,
            'question': f"[{channel}] {question}",
            'keywords': keywords,
            'answer': answer,
            'is_unknown': False
        })
        current_id += 1
        
    print(f"Total prepared records: {len(all_records)} (23 Regulations + 4,705 Q&A)")
    
    clear_faq_table()
    time.sleep(1)
    
    url = f"{SUPABASE_URL}/rest/v1/faq_documents"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f"Bearer {SUPABASE_ANON_KEY}",
        'Content-Type': 'application/json; charset=utf-8',
        'Prefer': 'return=minimal'
    }
    
    batch_size = 200
    total = len(all_records)
    print(f"Uploading {total} records to 'faq_documents' in batches of {batch_size}...")
    
    success_count = 0
    for i in range(0, total, batch_size):
        batch = all_records[i:i+batch_size]
        data_bytes = json.dumps(batch, ensure_ascii=False).encode('utf-8')
        
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as resp:
                success_count += len(batch)
                print(f"  Batch {i+1} ~ {min(i+batch_size, total)} uploaded. (HTTP {resp.status}) - 누적 {success_count}건")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            print(f"  Error on batch {i+1}: HTTP {e.code} - {err_body}")
            time.sleep(1)
            
    print(f"\nUpload complete! Total {success_count} / {total} records successfully stored in Supabase 'faq_documents' table.")

if __name__ == '__main__':
    upload_all_faq()
