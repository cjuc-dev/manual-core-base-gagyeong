// 🚀 [server_engine.js] 
// 이 파일은 SOS 통합 매뉴얼 시스템의 '핵심 서버 엔진'입니다.
// 관리자 안내: Node.js 기반의 웹 서버 역할을 하며, 파일 가동 시 3000번 포트를 사용합니다.
// 윈도우 환경의 안정성을 위해 'type core\server_engine.js | node' 방식으로 실행하는 것을 권장합니다.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = process.cwd();

// [자동 업데이트] 서버 가동 시 공지사항 크롤러 실행
try {
    const runAutoCrawler = require(path.join(ROOT_DIR, 'scripts/auto_crawler.js'));
    console.log('[System] 🚀 공지사항 자동 수집 엔진을 가동합니다...');
    runAutoCrawler().catch(e => console.error('[Crawler Error]', e));
    setInterval(() => {
        runAutoCrawler().catch(e => console.error('[Crawler Error]', e));
    }, 1000 * 60 * 60);
} catch (e) {
    console.error('[System Warning] 크롤러 모듈을 찾을 수 없습니다.', e.message);
}

const server = http.createServer((req, res) => {
    // 📌 지능형 경로 처리 및 로그 기록
    const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
    const relativePath = decodedUrl === '/' ? 'index.html' : decodedUrl.slice(1);
    const filePath = path.join(ROOT_DIR, relativePath);
    
    // [Debug] 서버가 접근하려는 실제 경로를 터미널에 출력
    if (relativePath.startsWith('data/')) {
        console.log(`[Request] ${decodedUrl} -> ${filePath}`);
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 마크다운 파일 요청인데 없는 경우는 404를 명확히 반환
            if (relativePath.endsWith('.md')) {
                console.error(`[Error 404] File Not Found: ${filePath}`);
                res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
                res.end('File Not Found');
                return;
            }

            // 그 외(페이지 이동 등)는 SPA 지원을 위해 index.html 반환
            fs.readFile(path.join(ROOT_DIR, 'index.html'), (err2, data2) => {
                if (err2) {
                    res.writeHead(404); res.end('Not Found');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end(data2);
                }
            });
        } else {
            const ext = path.extname(filePath).toLowerCase();
            const mimes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.md': 'text/markdown; charset=utf-8',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.pdf': 'application/pdf',
                '.ico': 'image/x-icon'
            };
            res.writeHead(200, {'Content-Type': mimes[ext] || 'application/octet-stream'});
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('--- SOS SERVER ENGINE STARTED ---');
    console.log('Root Directory: ' + ROOT_DIR);
    console.log('URL: http://localhost:' + PORT);
});
