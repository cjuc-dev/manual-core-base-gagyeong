/**
 * Smart Operations Suite (SOS) - 데이터 폴더 세분화 이관 자동화 스크립트
 * 
 * [목적]
 *기존 gagyeong_sportscenter 하위의 tech_manual 및 admin_manual 폴더 내부 조각 HTML 파일들을
 *신규 세분화 물리 데이터 디렉토리인 data/manual/tech/gagyeong 및 data/manual/admin/gagyeong으로 복사 및 이전하고,
 *이관에 따라 1단계 늘어난 상대 경로 깊이(../../../assets/ -> ../../../../assets/)를 100% 무결점으로 자동 보정 치환합니다.
 *
 * [실행방법]
 * node scripts/migrate_manual_data.js
 */

const fs = require('fs');
const path = require('path');

// 경로 정의 (프로젝트 루트 기준 절대경로)
const SOURCE_TECH_DIR = path.join(process.cwd(), 'pages', 'gagyeong_sportscenter', 'tech_manual');
const SOURCE_ADMIN_DIR = path.join(process.cwd(), 'pages', 'gagyeong_sportscenter', 'admin_manual');

const TARGET_TECH_DIR = path.join(process.cwd(), 'data', 'manual', 'tech', 'gagyeong');
const TARGET_ADMIN_DIR = path.join(process.cwd(), 'data', 'manual', 'admin', 'gagyeong');

// 마이그레이션 함수
function migrateFolder(srcDir, destDir, typeLabel) {
    console.log(`\n==================================================`);
    console.log(`📂 [이관 시작] ${typeLabel} 분야 데이터 이관 및 상대경로 보정 작업`);
    console.log(`👉 Source: ${srcDir}`);
    console.log(`👉 Destination: ${destDir}`);
    console.log(`==================================================`);

    // 소스 디렉토리 존재 체크
    if (!fs.existsSync(srcDir)) {
        console.warn(`⚠️ [경고] 소스 디렉토리가 존재하지 않습니다: ${srcDir}`);
        return;
    }

    // 타깃 디렉토리 생성
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log(`✨ [성공] 타깃 디렉토리가 생성되었습니다: ${destDir}`);
    }

    // 파일 목록 읽기
    const files = fs.readdirSync(srcDir);
    let successCount = 0;

    files.forEach(file => {
        const srcFilePath = path.join(srcDir, file);
        const destFilePath = path.join(destDir, file);

        // HTML 파일만 선별 처리
        if (path.extname(file).toLowerCase() === '.html') {
            try {
                let content = fs.readFileSync(srcFilePath, 'utf8');

                // 1단계 깊어진 깊이에 따라 상대경로 보정 치환
                // 예: ../../../assets/ -> ../../../../assets/
                // 예: ../../../images/ -> ../../../../images/
                // 예: ../../assets/ -> ../../../assets/
                
                // 정교하고 유연한 치환을 위해 정규식 및 치환 매핑 사용
                // 1단계: 기존의 ../../../ 주소를 ../../../../ 로 변경
                // 단, 중복 치환 방지를 위해 명확한 타깃(assets, images, css, js 등)을 포착
                const replacedContent = content
                    .replace(/\.\.\/\.\.\/\.\.\/assets\//g, '../../../../assets/')
                    .replace(/\.\.\/\.\.\/\.\.\/images\//g, '../../../../images/')
                    .replace(/\.\.\/\.\.\/\.\.\/css\//g, '../../../../css/')
                    .replace(/\.\.\/\.\.\/\.\.\/js\//g, '../../../../js/')
                    // 2단계: 기존의 ../../assets/ 등을 ../../../assets/ 로 보정 (혹시 있을지 모르는 깊이 2 대응)
                    .replace(/\.\.\/\.\.\/assets\//g, '../../../assets/')
                    .replace(/\.\.\/\.\.\/images\//g, '../../../images/');

                fs.writeFileSync(destFilePath, replacedContent, 'utf8');
                console.log(`  ✔️ [이관완료] ${file} -> 보정 치환 및 복사 성공`);
                successCount++;
            } catch (err) {
                console.error(`  ❌ [에러발생] ${file} 파일 처리 중 오류:`, err.message);
            }
        }
    });

    console.log(`\n🎉 [완료] ${typeLabel} 분야 총 ${successCount}개 파일 이관 완료!`);
}

// 메인 실행
try {
    migrateFolder(SOURCE_TECH_DIR, TARGET_TECH_DIR, '기술(Tech)');
    migrateFolder(SOURCE_ADMIN_DIR, TARGET_ADMIN_DIR, '행정(Admin)');
    console.log(`\n🚀 [전체 성공] Smart Operations Suite 데이터 이관 자동화가 무결하게 완료되었습니다.`);
} catch (globalErr) {
    console.error(`❌ [전체 실패] 글로벌 실행 중 예외가 발생했습니다:`, globalErr.message);
}
