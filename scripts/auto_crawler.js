// 🚀 [auto_crawler.js] 
// 해당 파일은 청주도시공사 홈페이지에서 실시간 공지사항을 수집하는 '크롤링 로봇'입니다.
// 관리자 안내: 이 스크립트는 백그라운드에서 실행되며, 수집된 데이터는 'data/notices.json'에 자동으로 저장됩니다.
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
                // SSL 인증서 오류 무시 및 실제 브라우저처럼 보이도록 User-Agent 강화
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
        // process.cwd()를 사용하여 실행 위치와 상관없이 절대 경로 확보
        const dataPath = path.join(process.cwd(), 'data/system/notices.json');
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
