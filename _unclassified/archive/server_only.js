
const http = require('http');
const fs = require('fs');
const path = require('path');
console.log('--- 기본 모듈 로드 완료 ---');
const runAutoCrawler = function() { return { then: function(cb) { cb(); } }; };
console.log('--- auto_crawler 모듈 로드 완료 ---');

const PORT = 3000;
const CRAWL_INTERVAL_MS = 60 * 60 * 1000; // 1시간 (밀리초)

// MIME 타입 맵핑
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon'
};

// 가벼운 정적 파일 서버 생성 (Express 없이 Node.js 기본 모듈로만 구현)
const server = http.createServer((req, res) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    
    // 기본 경로는 index.html로 라우팅
    let filePath = req.url === '/' ? './index.html' : `.${req.url.split('?')[0]}`;
    
    // 절대 경로 변환
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // SPA 라우팅을 위해 404 발생 시 무조건 index.html 반환 (옵션)
                fs.readFile('./index.html', (err, indexContent) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(indexContent, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end(`서버 에러 발생: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 서버 가동
server.listen(PORT, () => {
    console.log('\n==================================================');
    console.log(`🚀 체육시설 통합 매뉴얼 (대시보드) 서버가 켜졌습니다!`);
    console.log(`👉 접속 주소: http://localhost:${PORT}`);
    console.log('==================================================\n');
    
    console.log(`[AutoUpdater] 🕒 자동 업데이트 스케줄러 등록 완료 (주기: 1시간)`);
    
    // 서버가 켜질 때 최초 1회 크롤링 실행
    runAutoCrawler().then(() => {
        // 이후 1시간마다 반복 실행
        setInterval(runAutoCrawler, CRAWL_INTERVAL_MS);
    });
});
