import csv
import re
import json
import sys
import urllib.request
import urllib.parse
from datetime import datetime

SUPABASE_URL = "https://amlznptemtbkhyuzdkmu.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbHpucHRlbXRia2h5dXpka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNzcxMTQsImV4cCI6MjEwMjY1MzExNH0.DY_P3C5G136AuhSYAn7RvMKQfEOPxKmN-wI__f3fjfg"

def format_date_ymd(d_str):
    if not d_str:
        return None
    d_str = d_str.strip()
    if re.match(r'^\d{4}-\d{2}-\d{2}$', d_str):
        return d_str
    if re.match(r'^\d{4}/\d{2}/\d{2}$', d_str):
        return d_str.replace('/', '-')
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})$', d_str)
    if m:
        day, month, year = m.groups()
        return f"{year}-{month}-{day}"
    return None

def format_datetime(dt_str):
    if not dt_str:
        return datetime.now().isoformat()
    dt_str = dt_str.strip()
    if re.match(r'^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}', dt_str):
        return dt_str.replace(' ', 'T')
    if re.match(r'^\d{4}/\d{2}/\d{2}\s+\d{2}:\d{2}', dt_str):
        return dt_str.replace('/', '-').replace(' ', 'T')
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2}(?::\d{2})?)', dt_str)
    if m:
        day, month, year, time_part = m.groups()
        return f"{year}-{month}-{day}T{time_part}"
    return datetime.now().isoformat()

def format_phone(phone_str):
    if not phone_str:
        return '010-0000-0000'
    p = phone_str.strip().replace('-', '')
    if len(p) == 11 and p.startswith('010'):
        return f"{p[:3]}-{p[3:7]}-{p[7:]}"
    return phone_str.strip()

def format_gender(g):
    if not g: return '기타'
    g = str(g).strip().upper()
    if g in ['남', 'M', '1']: return '남'
    if g in ['여', 'F', '2']: return '여'
    return g

def parse_dataset(folder_path):
    rows = []
    suffix = folder_path.split('_')[-1]
    
    # 1. National Tech CSV
    nat_path = f"{folder_path}/두두넷_국가기술자격_접수_{suffix}.csv"
    with open(nat_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for r in reader:
            fee = int(r.get('수수료') or 14500)
            final_fee = int(r.get('최종결제금액') or fee)
            round_val = r.get('회차')
            rows.append({
                'receipt_number': r.get('접수번호', ''),
                'name': r.get('성명', ''),
                'birth_date': format_date_ymd(r.get('생년월일', '')),
                'gender': format_gender(r.get('성별', '')),
                'phone': format_phone(r.get('연락처', '')),
                'qualification': r.get('자격종목', ''),
                'grade': r.get('등급', '기능사') or '기능사',
                'exam_type': r.get('시험유형', '상시CBT') or '상시CBT',
                'exam_stage': '필기',
                'exam_round': int(round_val) if round_val and round_val.isdigit() else None,
                'exam_region': r.get('시험지역', ''),
                'exam_center': r.get('시험장', ''),
                'exam_date': format_date_ymd(r.get('시험일자', '')),
                'exam_session': str(r.get('교시', '')),
                'fee_amount': fee,
                'fee_discount_type': r.get('감면유형', '없음') or '없음',
                'fee_discount_amount': int(r.get('감면금액') or 0),
                'fee_final': final_fee,
                'payment_method': r.get('결제수단', '신용카드') or '신용카드',
                'payment_status': r.get('결제상태', '완료') or '완료',
                'status': r.get('접수상태', '접수완료') or '접수완료',
                'usage_context': r.get('사용맥락', ''),
                'training_institution': None,
                'training_hours': 0,
                'created_at': format_datetime(r.get('접수일시', ''))
            })

    # 2. Professional CSV
    prof_path = f"{folder_path}/두두넷_전문자격_접수_{suffix}.csv"
    with open(prof_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for r in reader:
            fee = int(r.get('amount') or 30000)
            final_fee = int(r.get('final_amount') or fee)
            raw_pay = r.get('pay_type', 'CARD')
            pay_method = '신용카드' if 'CARD' in raw_pay else ('계좌이체' if 'BANK' in raw_pay else '가상계좌')
            status = '접수완료' if r.get('app_status') == 'CONFIRMED' else '접수대기'
            
            rows.append({
                'receipt_number': r.get('receipt_no', ''),
                'name': r.get('applicant_name', ''),
                'birth_date': format_date_ymd(r.get('date_of_birth', '')),
                'gender': format_gender(r.get('sex', '')),
                'phone': format_phone(r.get('contact_number', '')),
                'qualification': r.get('qualification', ''),
                'grade': '전문자격',
                'exam_type': '연1회',
                'exam_stage': r.get('exam_stage', '1차'),
                'exam_round': None,
                'exam_region': r.get('exam_region', ''),
                'exam_center': r.get('exam_center', ''),
                'exam_date': format_date_ymd(r.get('test_date', '')),
                'exam_session': str(r.get('session_no', '')),
                'fee_amount': fee,
                'fee_discount_type': r.get('discount', 'NONE') or '없음',
                'fee_discount_amount': 0,
                'fee_final': final_fee,
                'payment_method': pay_method,
                'payment_status': '완료',
                'status': status,
                'usage_context': r.get('usage_context', ''),
                'training_institution': None,
                'training_hours': 0,
                'created_at': format_datetime(r.get('registered_at', ''))
            })

    # 3. Health CSV
    health_path = f"{folder_path}/두두보건_접수_{suffix}.csv"
    with open(health_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for r in reader:
            fee = int(r.get('feeAmount') or 32000)
            final_fee = int(r.get('finalFee') or fee)
            raw_pay = (r.get('payment') or '').lower()
            pay_method = '신용카드' if 'card' in raw_pay else ('계좌이체' if 'transfer' in raw_pay else '가상계좌')
            status = '접수완료' if r.get('regStatus') == 'active' else '접수대기'
            th = r.get('trainingHours', '0')
            th_val = int(th) if th and th.isdigit() else 0
            
            rows.append({
                'receipt_number': r.get('examNumber', ''),
                'name': r.get('fullName', ''),
                'birth_date': format_date_ymd(r.get('birthday', '')),
                'gender': format_gender(r.get('genderCode', '')),
                'phone': format_phone(r.get('mobile', '')),
                'qualification': r.get('certType', ''),
                'grade': '보건자격',
                'exam_type': '상시',
                'exam_stage': '필기',
                'exam_round': None,
                'exam_region': r.get('centerName', ''),
                'exam_center': r.get('centerName', ''),
                'exam_date': format_date_ymd(r.get('examDate', '')),
                'exam_session': str(r.get('timeSlot', '')),
                'fee_amount': fee,
                'fee_discount_type': r.get('discountType', '없음') or '없음',
                'fee_discount_amount': 0,
                'fee_final': final_fee,
                'payment_method': pay_method,
                'payment_status': '완료',
                'status': status,
                'usage_context': r.get('usageContext', ''),
                'training_institution': r.get('trainingOrg', ''),
                'training_hours': th_val,
                'created_at': format_datetime(r.get('appliedAt', ''))
            })

    return rows

def upload_batch(table_name, records, batch_size=100):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f"Bearer {SUPABASE_ANON_KEY}",
        'Content-Type': 'application/json; charset=utf-8',
        'Prefer': 'return=minimal'
    }

    total = len(records)
    print(f"Uploading {total} records to '{table_name}' in batches of {batch_size}...")

    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        data_bytes = json.dumps(batch, ensure_ascii=False).encode('utf-8')
        
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  Batch {i+1} ~ {min(i+batch_size, total)} uploaded. (HTTP {resp.status})")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8')
            print(f"  Error on batch {i+1}: HTTP {e.code} - {err_body}")

def clear_table(table_name):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?id=gt.0"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f"Bearer {SUPABASE_ANON_KEY}",
        'Prefer': 'return=minimal'
    }
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Cleared existing records from '{table_name}'. (HTTP {resp.status})")
    except Exception as e:
        print(f"Note on clearing '{table_name}':", e)

def main():
    target = "real_1000"
    if len(sys.argv) > 1:
        target = sys.argv[1].replace('--dataset=', '')

    print(f"=== Supabase Data Upload: Target dataset '{target}' ===")
    
    if target == 'all':
        records = parse_dataset("data/draft_100") + parse_dataset("data/real_1000")
    elif target in ['draft_100', '100']:
        records = parse_dataset("data/draft_100")
    else:
        records = parse_dataset("data/real_1000")
        
    print(f"Total parsed records: {len(records)}")
    
    clear_table("applications")
    upload_batch("applications", records, batch_size=100)
    print("Upload completed successfully!")

if __name__ == '__main__':
    main()
