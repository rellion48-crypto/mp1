import json
import os
import re

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', str(text)).strip()

def build_faq_dataset():
    input_path = 'FAQ_chatBOT/data/faq_combined.jsonl'
    output_path = 'data/faq_knowledge_base.json'
    
    records = []
    
    with open(input_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            item = json.loads(line)
            channel = item.get('channel', '')
            cert = item.get('cert', '공통')
            category = item.get('category', '일반')
            caller_type = item.get('caller_type', 'senior')
            
            # Standardization of cert names
            cert_standard = cert
            if cert == '한식조리': cert_standard = '한식조리기능사'
            elif cert == '지게차': cert_standard = '지게차운전기능사'
            elif cert == '굴착기': cert_standard = '굴착기운전기능사'
            elif cert == '전기': cert_standard = '전기기능사'
            
            if channel == 'qna_board':
                title = clean_text(item.get('title', ''))
                body = clean_text(item.get('body', ''))
                reply = clean_text(item.get('reply', ''))
                resolution = clean_text(item.get('resolution', ''))
                
                # Combine search text
                search_text = f"{cert} {cert_standard} {category} {title} {body} {resolution}".lower()
                
                records.append({
                    'id': item.get('id'),
                    'channel': 'Q&A게시판',
                    'cert': cert_standard,
                    'category': category,
                    'caller_type': caller_type,
                    'question': body if body else title,
                    'title': title,
                    'answer': reply,
                    'search_text': search_text
                })
                
            elif channel == 'phone':
                opening = clean_text(item.get('opening', ''))
                exchanges = item.get('exchanges', [])
                resolution = clean_text(item.get('resolution', ''))
                
                # Extract main questions & replies from phone conversation
                q_list = [clean_text(ex.get('caller', '')) for ex in exchanges if ex.get('caller')]
                a_list = [clean_text(ex.get('staff', '')) for ex in exchanges if ex.get('staff')]
                topics = [clean_text(ex.get('topic', '')) for ex in exchanges if ex.get('topic')]
                
                full_q = " / ".join(q_list)
                full_a = " ".join(a_list)
                
                search_text = f"{cert} {cert_standard} {category} {opening} {full_q} {' '.join(topics)} {resolution}".lower()
                
                records.append({
                    'id': item.get('id'),
                    'channel': '전화상담',
                    'cert': cert_standard,
                    'category': category,
                    'caller_type': caller_type,
                    'question': full_q if full_q else opening,
                    'title': f"{cert_standard} {category} 전화 상담 ({opening})",
                    'answer': full_a,
                    'search_text': search_text
                })
    
    os.makedirs('data', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as out:
        json.dump(records, out, ensure_ascii=False, indent=2)
        
    print(f"Successfully processed {len(records)} FAQ knowledge records into '{output_path}'.")

if __name__ == '__main__':
    build_faq_dataset()
