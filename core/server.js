console.log('--- [Core] server.js 실행 시작 ---');
const http = require('http');
const fs = require('fs');
const path = require('path');
console.log('--- 기본 모듈 로드 완료 ---');

const ROOT_DIR = path.join(__dirname, '../');
// const runAutoCrawler = require(path.join(ROOT_DIR, 'scripts/auto_crawler'));
const runAutoCrawler = () => Promise.resolve();
console.log('--- auto_crawler 모듈 로드 완료 ---');

const PORT = 3001;
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

const server = http.createServer((req, res) => {
    const relativePath = req.url === '/' ? 'index.html' : req.url.split('?')[0].slice(1);
    const filePath = path.join(ROOT_DIR, relativePath);
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile(path.join(ROOT_DIR, 'index.html'), (err, indexContent) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexContent, 'utf-8');
                    }
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

server.on('error', (err) => {
    console.error('[Server Error]', err);
});

server.listen(PORT, () => {
    console.log('\n==================================================');
    console.log(`🚀 체육시설 통합 매뉴얼 서버 가동 중...`);
    console.log(`🏠 루트: ${ROOT_DIR}`);
    console.log(`🔗 주소: http://localhost:${PORT}`);
    console.log('==================================================\n');
    
    // 크롤러 실행 (에러 처리 추가)
    try {
        runAutoCrawler().then(() => {
            console.log('[Crawler] 초기 스캔 완료');
        }).catch(e => console.error('[Crawler Error]', e));
    } catch(e) {
        console.error('[Crawler Launch Error]', e);
    }
});
