const fs = require('fs');
const path = require('path');

// Use current working directory since __dirname might be problematic in some environments
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'search_index.json');

const manualMetadata = [
    { id: 'safety', title: '안전관리 표준매뉴얼 (PDF)', file: 'docs/체육시설 안전관리 표준매뉴얼.pdf', type: 'pdf' }
];

function cleanText(text) {
    return text
        .replace(/#|!|\[|\]|\(|\)|-|\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function buildIndex() {
    console.log('[Search Indexer] Indexing start...');
    const index = [...manualMetadata];

    try {
        if (!fs.existsSync(DATA_DIR)) {
            console.error('[Search Indexer] Data directory not found:', DATA_DIR);
            return;
        }

        const files = fs.readdirSync(DATA_DIR);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        for (const file of mdFiles) {
            const filePath = path.join(DATA_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');

            let id = file.replace('.md', '');
            let title = id.replace(/_/g, ' ');
            
            const titleMap = {
                'gagyeong_sportscenter_guide': '가경국민체육센터 시설 안내',
                'cheongjuSwimming_guide': '청주수영장 시설 안내',
                '행정_매뉴얼_공통': '행정 매뉴얼 (공통)',
                '기술_매뉴얼_공통': '기술 매뉴얼 (공통)',
                '행정_매뉴얼_청주수영장': '청주수영장 행정 매뉴얼',
                'purmi_guide': '푸르미스포츠센터 시설 안내',
                'youngun_sportscenter_guide': '영운국민체육센터 시설 안내',
                'bokdae_sportscenter_guide': '복대국민체육센터 시설 안내'
            };

            index.push({
                id: id.includes('_') && !titleMap[id] ? id.split('_')[0] : id,
                facility: id.includes('_') ? id.split('_').pop() : '공통',
                title: titleMap[id] || title,
                file: `data/${file}`,
                content: cleanText(content),
                type: 'markdown'
            });
            
            console.log(`[Search Indexer] Done: ${file}`);
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf8');
        console.log(`[Search Indexer] Success! Total ${index.length} items.`);
    } catch (error) {
        console.error('[Search Indexer] Error:', error.message);
    }
}

buildIndex();
