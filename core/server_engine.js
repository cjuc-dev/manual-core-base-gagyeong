/**
 * Smart Operations Suite - Core Server Engine
 * This file contains the primary server logic.
 * Note: Running via piping (type core\server_engine.js | node) 
 * ensures stability across different Windows environments.
 */
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
