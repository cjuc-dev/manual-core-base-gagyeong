# 🚀 [fetch_notices.py] 
# 해당 파일은 파이썬(Python) 기반의 공지사항 수집 로봇입니다.
# 관리자 안내: 'auto_crawler.js'와 동일한 역할을 수행하며, 시스템 환경에 따라 선택적으로 사용됩니다.
import urllib.request
import urllib.error
import re
import json
import os
import time

def fetch_notice_detail(url):
    """Fetch the content of a specific notice"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
        content_pattern = re.compile(r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>\s*(?:<!--|</div>|<div class="board_btn")', re.DOTALL | re.IGNORECASE)
        match = content_pattern.search(html)
        if match:
            return match.group(1).strip()
        return "<p>본문을 불러올 수 없습니다. 원본 보기를 이용해 주세요.</p>"
    except Exception as e:
        print(f"Error fetching detail {url}: {e}")
        return f"<p>본문 로드 실패: {e}</p>"

def fetch_notices():
    base_url = "https://www.cjuc.or.kr/home/sub?menukey=7401"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    all_notices = []
    max_pages = 2 # 2 pages to save time (approx 20 notices). Change to 5 for 50 items.
    
    print(f"Starting crawler for {max_pages} pages...")
    
    for page in range(1, max_pages + 1):
        try:
            page_url = f"{base_url}&page={page}"
            req = urllib.request.Request(page_url, headers=headers)
            with urllib.request.urlopen(req) as response:
                html = response.read().decode('utf-8')
            
            # Extract table rows
            tbody_pattern = re.compile(r'<tbody>(.*?)</tbody>', re.DOTALL | re.IGNORECASE)
            tbody_match = tbody_pattern.search(html)
            if not tbody_match:
                continue
            
            tbody_html = tbody_match.group(1)
            row_pattern = re.compile(r'<tr>(.*?)</tr>', re.DOTALL | re.IGNORECASE)
            rows = row_pattern.findall(tbody_html)
            
            for row in rows:
                # td extraction
                td_pattern = re.compile(r'<td[^>]*>(.*?)</td>', re.DOTALL | re.IGNORECASE)
                tds = td_pattern.findall(row)
                
                if len(tds) >= 5:
                    # 1. No or Notice marker
                    # 2. Title and Link
                    title_td = tds[1]
                    link_pattern = re.compile(r'<a href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL | re.IGNORECASE)
                    link_match = link_pattern.search(title_td)
                    
                    if not link_match:
                        continue
                        
                    raw_link = link_match.group(1)
                    raw_title = link_match.group(2)
                    
                    clean_title = re.sub(r'<[^>]+>', '', raw_title).strip()
                    clean_link = "https://www.cjuc.or.kr/home/sub" + raw_link.replace('&amp;', '&').replace('?menukey=7401', '')
                    if not clean_link.startswith('https://www.cjuc.or.kr/home/sub?'):
                        clean_link = "https://www.cjuc.or.kr/home/sub" + raw_link.replace('&amp;', '&')
                    
                    # 3. Author
                    author = re.sub(r'<[^>]+>', '', tds[2]).strip()
                    
                    # 4. Date
                    date = re.sub(r'<[^>]+>', '', tds[3]).strip()
                    
                    # 5. Views
                    views = re.sub(r'<[^>]+>', '', tds[4]).strip()
                    
                    # Clean tags like N icon in title if we want, but we can just leave it as is or prepend [공지]
                    if '<img' in title_td and 'notice' in title_td.lower() and not '[공지]' in clean_title:
                        clean_title = f"[공지] {clean_title}"
                        
                    if not clean_title or clean_title == '새글' or clean_title == '첨부파일':
                        continue
                        
                    print(f"Fetching detail for: {clean_title} ({date})")
                    content = fetch_notice_detail(clean_link)
                    
                    all_notices.append({
                        "id": len(all_notices) + 1,
                        "title": clean_title,
                        "url": clean_link,
                        "author": author,
                        "date": date,
                        "views": views,
                        "content": content
                    })
                    
                    time.sleep(0.3) # Polite sleep
                    
            print(f"Page {page} completed.")
            
        except Exception as e:
            print(f"Error on page {page}: {e}")
            
    # Save to JSON
    os.makedirs('../data', exist_ok=True)
    with open('../data/notices.json', 'w', encoding='utf-8') as f:
        json.dump(all_notices, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully saved {len(all_notices)} notices to notices.json")

if __name__ == "__main__":
    fetch_notices()
