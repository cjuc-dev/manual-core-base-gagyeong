const https = require('https');
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
                    resolve('<p>본문을 불러올 수 없습니다. 원본 보기를 이용해 주세요.</p>');
                }
            });
        }).on('error', (err) => {
            console.error(`[Crawler] 본문 로드 실패 (${url}):`, err.message);
            resolve(`<p>본문 로드 실패: ${err.message}</p>`);
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAutoCrawler() {
    const baseUrl = 'https://www.cjuc.or.kr/home/sub?menukey=7401';
    const allNotices = [];
    const maxPages = 2; // 안전을 위해 2페이지만 크롤링 (약 20개)

    console.log(`[Crawler] 🚀 크롤링 로봇 가동 시작... (시간: ${new Date().toLocaleString()})`);

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

                    if (tds[1].toLowerCase().includes('<img') && tds[1].toLowerCase().includes('notice') && !cleanTitle.includes('[공지]')) {
                        cleanTitle = `[공지] ${cleanTitle}`;
                    }

                    if (!cleanTitle || cleanTitle === '새글' || cleanTitle === '첨부파일') continue;

                    console.log(`[Crawler] 📄 상세정보 수집 중: ${cleanTitle}`);
                    const content = await fetchNoticeDetail(cleanLink);
                    await delay(300); // 0.3초 대기 (서버 부하 방지 매너)

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
            console.log(`[Crawler] ✅ ${page}페이지 수집 완료`);
        } catch (error) {
            console.error(`[Crawler] ❌ ${page}페이지 수집 실패:`, error.message);
        }
    }

    if (allNotices.length > 0) {
        const dataPath = path.join(__dirname, '../data/notices.json');
        fs.writeFileSync(dataPath, JSON.stringify(allNotices, null, 4), 'utf8');
        console.log(`[Crawler] 🎉 총 ${allNotices.length}개의 데이터 갱신 완료! (경로: ${dataPath})`);
    } else {
        console.log(`[Crawler] ⚠️ 수집된 데이터가 없어 갱신을 생략합니다.`);
    }
}

module.exports = runAutoCrawler;

// 직접 실행되었을 경우 (node auto_crawler.js)
if (require.main === module) {
    runAutoCrawler();
}
