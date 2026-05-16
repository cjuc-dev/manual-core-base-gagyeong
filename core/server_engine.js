// 🚀 [server_engine.js] 
// 해당 파일은 이 시스템의 '핵심 서버 엔진'입니다.
// 관리자 안내: Node.js 기반의 웹 서버 역할을 하며, 파일 가동 시 3000번 포트를 사용합니다.
// 윈도우 환경의 안정성을 위해 'type core\server_engine.js | node' 방식으로 실행하는 것을 권장합니다.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = process.cwd();

const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    const relativePath = url === '/' ? 'index.html' : url.slice(1);
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
