// 🚀 [server_engine.js] 
// 이 파일은 SOS 통합 매뉴얼 시스템의 '핵심 서버 엔진' (All-in-One 버전)입니다.
// 관리자 안내: 보안 환경 최적화를 위해 공지사항 수집 엔진을 내장하였습니다.

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 3000;
const ROOT_DIR = process.cwd();

console.log('[System] 서버 엔진 초기화 중...');

// ---------------------------------------------------------
// 🛠️ [내장 엔진] 공지사항 자동 수집기 (Crawler Logic)
// ---------------------------------------------------------
function fetchNoticeDetail(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const contentRegex = /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<!--|<\/div>|<div class="board_btn")/i;
                const match = data.match(contentRegex);
                if (match) { resolve(match[1].trim()); } else { resolve('<p>본문을 불러올 수 없습니다. 원본 보기를 이용해 주세요.</p>'); }
            });
        }).on('error', (err) => {
            console.error(`[Crawler] 본문 로드 실패 (${url}):`, err.message);
            resolve(`<p>본문 로드 실패: ${err.message}</p>`);
        });
    });
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runAutoCrawler() {
    const baseUrl = 'https://www.cjuc.or.kr/home/sub?menukey=7401';
    const allNotices = [];
    const maxPages = 2;

    console.log(`[Crawler] 🚀 공지사항 수집 시작...`);

    for (let page = 1; page <= maxPages; page++) {
        const pageUrl = `${baseUrl}&page=${page}`;
        try {
            const html = await new Promise((resolve, reject) => {
                const options = {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                    rejectUnauthorized: false 
                };
                https.get(pageUrl, options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(data));
                }).on('error', reject);
            });

            const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
            if (!tbodyMatch) continue;

            const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(tbodyMatch[1])) !== null) {
                const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
                const tds = [];
                let tdMatch;
                while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) { tds.push(tdMatch[1]); }

                if (tds.length >= 5) {
                    const linkMatch = tds[1].match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
                    if (!linkMatch) continue;

                    let rawLink = linkMatch[1];
                    let cleanTitle = linkMatch[2].replace(/<[^>]+>/g, '').trim();
                    let cleanLink = rawLink.replace(/&amp;/g, '&');
                    if (!cleanLink.startsWith('http')) {
                        cleanLink = "https://www.cjuc.or.kr/home/sub" + cleanLink.replace('?menukey=7401', '');
                    }

                    const author = tds[2].replace(/<[^>]+>/g, '').trim();
                    const date = tds[3].replace(/<[^>]+>/g, '').trim();
                    const views = tds[4].replace(/<[^>]+>/g, '').trim();

                    if (tds[1].toLowerCase().includes('<img') && tds[1].toLowerCase().includes('notice') && !cleanTitle.includes('[공지]')) {
                        cleanTitle = `[공지] ${cleanTitle}`;
                    }

                    if (!cleanTitle || cleanTitle === '새글' || cleanTitle === '첨부파일') continue;

                    console.log(`[Crawler] 📄 수집 중: ${cleanTitle}`);
                    const content = await fetchNoticeDetail(cleanLink);
                    await delay(300);

                    allNotices.push({
                        id: allNotices.length + 1,
                        title: cleanTitle, url: cleanLink, author: author, date: date, views: views, content: content
                    });
                }
            }
        } catch (error) { console.error(`[Crawler] ❌ 수집 실패:`, error.message); }
    }

    if (allNotices.length > 0) {
        const dataPath = path.join(ROOT_DIR, 'data/system/notices.json');
        fs.writeFileSync(dataPath, JSON.stringify(allNotices, null, 4), 'utf8');
        console.log(`[Crawler] 🎉 총 ${allNotices.length}개의 데이터 갱신 완료!`);
    }
}

// ---------------------------------------------------------
// 🌐 웹 서버 구동 및 요청 처리 (Server Logic)
// ---------------------------------------------------------
const server = http.createServer((req, res) => {
    const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
    const relativePath = decodedUrl === '/' ? 'index.html' : decodedUrl.slice(1);
    const filePath = path.join(ROOT_DIR, relativePath);
    
    if (relativePath.startsWith('data/')) { console.log(`[Request] ${decodedUrl}`); }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (relativePath.endsWith('.md')) {
                res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
                res.end('File Not Found');
                return;
            }
            fs.readFile(path.join(ROOT_DIR, 'index.html'), (err2, data2) => {
                if (err2) { res.writeHead(404); res.end('Not Found'); } 
                else { res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); res.end(data2); }
            });
        } else {
            const ext = path.extname(filePath).toLowerCase();
            const mimes = {
                '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
                '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
                '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf'
            };
            res.writeHead(200, {'Content-Type': mimes[ext] || 'application/octet-stream'});
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('--- SOS ALL-IN-ONE SERVER STARTED ---');
    console.log('URL: http://localhost:' + PORT);
    
    // 초기 실행 및 주기적 수집 설정
    runAutoCrawler().catch(e => console.error('[Crawler Error]', e));
    setInterval(() => { runAutoCrawler().catch(e => console.error('[Crawler Error]', e)); }, 1000 * 60 * 60);
});
