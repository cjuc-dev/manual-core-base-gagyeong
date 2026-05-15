const runAutoCrawler = (function() { const module = { exports: {} }; const exports = module.exports; const https = require('https');
const fs = require('fs');
const path = require('path');

// Extract details from specific URL
function fetchNoticeDetail(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const contentRegex = /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<!--|<\/div>|<div class="board_btn")/i;
                const match = data.match(contentRegex);
                if (match) {
                    resolve(match[1].trim());
                } else {
                    resolve('<p>Î≥∏Î¨∏??Î∂àÎü¨?????ÜÏäµ?àÎã§. ?êÎ≥∏ Î≥¥Í∏∞Î•??¥Ïö©??Ï£ºÏÑ∏??</p>');
                }
            });
        }).on('error', (err) => {
            console.error(`[Crawler] Î≥∏Î¨∏ Î°úÎìú ?§Ìå® (${url}):`, err.message);
            resolve(`<p>Î≥∏Î¨∏ Î°úÎìú ?§Ìå®: ${err.message}</p>`);
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAutoCrawler() {
    const baseUrl = 'https://www.cjuc.or.kr/home/sub?menukey=7401';
    const allNotices = [];
    const maxPages = 2; // ?àÏ†Ñ???ÑÌï¥ 2?òÏù¥ÏßÄÎß??¨Î°§Îß?(??20Í∞?

    console.log(`[Crawler] ?? ?¨Î°§Îß?Î°úÎ¥á Í∞Ä???úÏûë... (?úÍ∞Ñ: ${new Date().toLocaleString()})`);

    for (let page = 1; page <= maxPages; page++) {
        const pageUrl = `${baseUrl}&page=${page}`;
        
        try {
            const html = await new Promise((resolve, reject) => {
                https.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(data));
                }).on('error', reject);
            });

            // Extract tbody
            const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
            if (!tbodyMatch) continue;

            // Extract rows
            const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(tbodyMatch[1])) !== null) {
                const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
                const tds = [];
                let tdMatch;
                while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) {
                    tds.push(tdMatch[1]);
                }

                if (tds.length >= 5) {
                    const linkMatch = tds[1].match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
                    if (!linkMatch) continue;

                    let rawLink = linkMatch[1];
                    let rawTitle = linkMatch[2];

                    let cleanTitle = rawTitle.replace(/<[^>]+>/g, '').trim();
                    let cleanLink = rawLink.replace(/&amp;/g, '&');
                    if (!cleanLink.startsWith('http')) {
                        cleanLink = "https://www.cjuc.or.kr/home/sub" + cleanLink.replace('?menukey=7401', '');
                        if (!cleanLink.includes('?')) {
                            cleanLink = "https://www.cjuc.or.kr/home/sub" + rawLink.replace(/&amp;/g, '&');
                        }
                    }

                    const author = tds[2].replace(/<[^>]+>/g, '').trim();
                    const date = tds[3].replace(/<[^>]+>/g, '').trim();
                    const views = tds[4].replace(/<[^>]+>/g, '').trim();

                    if (tds[1].toLowerCase().includes('<img') && tds[1].toLowerCase().includes('notice') && !cleanTitle.includes('[Í≥µÏ?]')) {
                        cleanTitle = `[Í≥µÏ?] ${cleanTitle}`;
                    }

                    if (!cleanTitle || cleanTitle === '?àÍ?' || cleanTitle === 'Ï≤®Î??åÏùº') continue;

                    console.log(`[Crawler] ?ìÑ ?ÅÏÑ∏?ïÎ≥¥ ?òÏßë Ï§? ${cleanTitle}`);
                    const content = await fetchNoticeDetail(cleanLink);
                    await delay(300); // 0.3Ï¥??ÄÍ∏?(?úÎ≤Ñ Î∂Ä??Î∞©Ï? Îß§ÎÑà)

                    allNotices.push({
                        id: allNotices.length + 1,
                        title: cleanTitle,
                        url: cleanLink,
                        author: author,
                        date: date,
                        views: views,
                        content: content
                    });
                }
            }
            console.log(`[Crawler] ??${page}?òÏù¥ÏßÄ ?òÏßë ?ÑÎ£å`);
        } catch (error) {
            console.error(`[Crawler] ??${page}?òÏù¥ÏßÄ ?òÏßë ?§Ìå®:`, error.message);
        }
    }

    if (allNotices.length > 0) {
        const dataPath = path.join(__dirname, '../data/notices.json');
        fs.writeFileSync(dataPath, JSON.stringify(allNotices, null, 4), 'utf8');
        console.log(`[Crawler] ?éâ Ï¥?${allNotices.length}Í∞úÏùò ?∞Ïù¥??Í∞±Ïã† ?ÑÎ£å! (Í≤ΩÎ°ú: ${dataPath})`);
    } else {
        console.log(`[Crawler] ?†Ô∏è ?òÏßë???∞Ïù¥?∞Í? ?ÜÏñ¥ Í∞±Ïã†???ùÎûµ?©Îãà??`);
    }
}

module.exports = runAutoCrawler;

// ÏßÅÏ†ë ?§Ìñâ?òÏóà??Í≤ΩÏö∞ (node auto_crawler.js)
if (require.main === module) {
    runAutoCrawler();
}
; return module.exports; })(); console.log('--- server.js ?§Ìñâ ?úÏûë ---');
const http = require('http');
const fs = require('fs');
const path = require('path');
console.log('--- Í∏∞Î≥∏ Î™®Îìà Î°úÎìú ?ÑÎ£å ---');

console.log('--- auto_crawler Î™®Îìà Î°úÎìú ?ÑÎ£å ---');

const PORT = 3000;
const CRAWL_INTERVAL_MS = 60 * 60 * 1000; // 1?úÍ∞Ñ (Î∞ÄÎ¶¨Ï¥à)

// MIME ?Ä??ÎßµÌïë
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

// Í∞ÄÎ≤ºÏö¥ ?ïÏ†Å ?åÏùº ?úÎ≤Ñ ?ùÏÑ± (Express ?ÜÏù¥ Node.js Í∏∞Î≥∏ Î™®ÎìàÎ°úÎßå Íµ¨ÌòÑ)
const server = http.createServer((req, res) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    
    // Í∏∞Î≥∏ Í≤ΩÎ°ú??index.htmlÎ°??ºÏö∞??    let filePath = req.url === '/' ? './index.html' : `.${req.url.split('?')[0]}`;
    
    // ?àÎ? Í≤ΩÎ°ú Î≥Ä??    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // SPA ?ºÏö∞?ÖÏùÑ ?ÑÌï¥ 404 Î∞úÏÉù ??Î¨¥Ï°∞Í±?index.html Î∞òÌôò (?µÏÖò)
                fs.readFile('./index.html', (err, indexContent) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(indexContent, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end(`?úÎ≤Ñ ?êÎü¨ Î∞úÏÉù: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// ?úÎ≤Ñ Í∞Ä??server.listen(PORT, () => {
    console.log('\n==================================================');
    console.log(`?? Ï≤¥Ïú°?úÏÑ§ ?µÌï© Îß§Îâ¥??(?Ä?úÎ≥¥?? ?úÎ≤ÑÍ∞Ä ÏºúÏ°å?µÎãà??`);
    console.log(`?ëâ ?ëÏÜç Ï£ºÏÜå: http://localhost:${PORT}`);
    console.log('==================================================\n');
    
    console.log(`[AutoUpdater] ?ïí ?êÎèô ?ÖÎç∞?¥Ìä∏ ?§Ï?Ï§ÑÎü¨ ?±Î°ù ?ÑÎ£å (Ï£ºÍ∏∞: 1?úÍ∞Ñ)`);
    
    // ?úÎ≤ÑÍ∞Ä ÏºúÏßà ??ÏµúÏ¥à 1???¨Î°§Îß??§Ìñâ
    runAutoCrawler().then(() => {
        // ?¥ÌõÑ 1?úÍ∞ÑÎßàÎã§ Î∞òÎ≥µ ?§Ìñâ
        setInterval(runAutoCrawler, CRAWL_INTERVAL_MS);
    });
});

