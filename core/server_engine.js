// 🚀 [server_engine.js] 
// 해당 파일은 이 시스템의 '핵심 서버 엔진'입니다.
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
    
    // 1. 즉시 실행
    runAutoCrawler().catch(e => console.error('[Crawler Error]', e));
    
    // 2. 주기적 실행 (1시간마다 업데이트)
    setInterval(() => {
        runAutoCrawler().catch(e => console.error('[Crawler Error]', e));
    }, 1000 * 60 * 60);
    
} catch (e) {
    console.error('[System Warning] 크롤러 모듈을 찾을 수 없습니다. 자동 업데이트가 비활성화됩니다.', e.message);
}

const server = http.createServer((req, res) => {
    // URL 디코딩을 추가하여 한글 파일명 요청 처리 (시큐어 코딩: 경로 조작 방지 포함)
    const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
    const relativePath = decodedUrl === '/' ? 'index.html' : decodedUrl.slice(1);
    const filePath = path.join(ROOT_DIR, relativePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 파일을 찾을 수 없는 경우 index.html로 리다이렉트 (SPA 지원)
            fs.readFile(path.join(ROOT_DIR, 'index.html'), (err2, data2) => {
                if (err2) {
                    res.writeHead(404); res.end('Not Found');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end(data2);
                }
            });
        } else {
            // 파일 확장자에 따른 MIME 타입 설정
            const ext = path.extname(filePath).toLowerCase();
            const mimes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
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
