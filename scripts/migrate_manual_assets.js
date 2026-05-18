// 🚀 [migrate_manual_assets.js]
// 이 파일은 570장의 매뉴얼 이미지를 영문 카테고리별로 자동 분류하고 
// 가경국민체육센터 매뉴얼 HTML의 이미지 경로를 로컬 영문 상대 경로로 100% 자동 치환합니다.

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SRC_IMG_DIR = path.join(ROOT_DIR, 'assets/images/manual');
const ADMIN_DEST_DIR = path.join(SRC_IMG_DIR, 'admin/gagyeong');
const TECH_DEST_DIR = path.join(SRC_IMG_DIR, 'tech/gagyeong');
const PAGES_DIR = path.join(ROOT_DIR, 'pages/gagyeong_sportscenter');

console.log('==================================================');
console.log('[System] 영문 매뉴얼 자산 자동 마이그레이션 시작');
console.log('==================================================');

// 1. 대상 영문 폴더 생성
if (!fs.existsSync(ADMIN_DEST_DIR)) {
    fs.mkdirSync(ADMIN_DEST_DIR, { recursive: true });
    console.log(`[Folder] 행정용 영문 폴더 생성: ${ADMIN_DEST_DIR}`);
}
if (!fs.existsSync(TECH_DEST_DIR)) {
    fs.mkdirSync(TECH_DEST_DIR, { recursive: true });
    console.log(`[Folder] 기술용 영문 폴더 생성: ${TECH_DEST_DIR}`);
}

// 2. 이미지 파일 100% 자동 이동 및 분류 (행정: image_2_1_, 기술: image_2_2_)
if (fs.existsSync(SRC_IMG_DIR)) {
    const files = fs.readdirSync(SRC_IMG_DIR);
    let adminMoved = 0;
    let techMoved = 0;

    files.forEach(file => {
        const srcPath = path.join(SRC_IMG_DIR, file);
        
        // 디렉토리가 아닌 순수 파일만 이동 처리
        if (fs.statSync(srcPath).isFile()) {
            if (file.startsWith('image_2_1_')) {
                fs.renameSync(srcPath, path.join(ADMIN_DEST_DIR, file));
                adminMoved++;
            } else if (file.startsWith('image_2_2_')) {
                fs.renameSync(srcPath, path.join(TECH_DEST_DIR, file));
                techMoved++;
            }
        }
    });

    console.log(`[Move Complete] 행정(admin) 이미지 ${adminMoved}개 이동 완료.`);
    console.log(`[Move Complete] 기술(tech) 이미지 ${techMoved}개 이동 완료.`);
} else {
    console.error(`[Error] 원본 이미지 폴더가 존재하지 않습니다: ${SRC_IMG_DIR}`);
    process.exit(1);
}

// 3. HTML 내 이미지 소스 100% 로컬 영문 상대 경로로 정규식(Regex) 치환 함수
function processHtmlFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // 하위 디렉토리 재귀 탐색
            processHtmlFiles(filePath);
        } else if (stat.isFile() && path.extname(file).toLowerCase() === '.html') {
            let htmlContent = fs.readFileSync(filePath, 'utf8');
            let isModified = false;

            // HTML 파일 위치 기준 동적 영문 이미지 상대 경로 계산
            const fileDir = path.dirname(filePath);
            
            // 행정 상대 경로 계산 및 슬래시 정규화
            const relAdminPath = path.relative(fileDir, ADMIN_DEST_DIR).replace(/\\/g, '/');
            // 기술 상대 경로 계산 및 슬래시 정규화
            const relTechPath = path.relative(fileDir, TECH_DEST_DIR).replace(/\\/g, '/');

            // 3.1 행정 이미지 경로 치환 (GitLab 원격 URL -> 로컬 영문 상대 경로)
            // 예: https://manual-5d03dc.gitlab.io/manual_image/image_2_1_...
            const adminRegex = /https:\/\/manual-5d03dc\.gitlab\.io\/manual_image\/(image_2_1_[a-zA-Z0-9_.-]+)/g;
            if (adminRegex.test(htmlContent)) {
                htmlContent = htmlContent.replace(adminRegex, `${relAdminPath}/$1`);
                isModified = true;
            }

            // 3.2 기술 이미지 경로 치환
            // 예: https://manual-5d03dc.gitlab.io/manual_image/image_2_2_...
            const techRegex = /https:\/\/manual-5d03dc\.gitlab\.io\/manual_image\/(image_2_2_[a-zA-Z0-9_.-]+)/g;
            if (techRegex.test(htmlContent)) {
                htmlContent = htmlContent.replace(techRegex, `${relTechPath}/$1`);
                isModified = true;
            }

            if (isModified) {
                fs.writeFileSync(filePath, htmlContent, 'utf8');
                console.log(`[Replace Complete] 경로 치환 완료: ${path.relative(ROOT_DIR, filePath)}`);
            }
        }
    });
}

console.log('[System] HTML 파일 내 이미지 주소 로컬 영문 경로 치환 중...');
processHtmlFiles(PAGES_DIR);

console.log('==================================================');
console.log('[System] 영문 매뉴얼 자산 자동 마이그레이션 완벽 종료! 🎉');
console.log('==================================================');
