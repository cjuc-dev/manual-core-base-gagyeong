// [compress_with_jimp.js]
// 이 스크립트는 jimp v1을 dynamic import로 로드하여 매뉴얼 이미지를 경량화합니다.
// JPG: Quality 82 (육안 화질 저하 없는 안전 최적값 - 스크린샷 텍스트 완전 보존)
// PNG: 무손실 최적화 재인코딩 (알파 채널/투명도 100% 보존)
// 안전망: 압축 후 파일이 원본보다 크면 자동 롤백 (역효과 파일 0개 보장)
// 관리자 안내: node scripts/compress_with_jimp.js 로 실행합니다.

'use strict';
const fs   = require('fs');
const path = require('path');

// ─── 설정값 ──────────────────────────────────────────────────────────────────
const ROOT_DIR    = 'assets/images/manual';
const BACKUP_DIR  = 'versions/backup_sharp_260517';
const JPG_QUALITY = 82;
const MIN_SIZE_KB = 30;
// ─────────────────────────────────────────────────────────────────────────────

let totalFiles      = 0;
let compressedCnt   = 0;
let skippedCnt      = 0;
let errorCnt        = 0;
let totalSavedBytes = 0;

/** 재귀적으로 이미지 파일 경로를 수집합니다. */
function getAllImageFiles(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllImageFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/** 백업 폴더에 원본 파일을 복사합니다 (이미 있으면 스킵). */
function backupFile(srcPath) {
  const relativePath = path.relative(ROOT_DIR, srcPath);
  const destPath     = path.join(BACKUP_DIR, relativePath);
  const destDir      = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(destPath)) fs.copyFileSync(srcPath, destPath);
}

/**
 * jimp로 단일 이미지를 압축합니다.
 * @param {object} Jimp     - jimp 클래스
 * @param {string} filePath - 압축할 파일 경로
 * @returns {Promise<number>} 절약 바이트 수 (0이면 원본 유지, -1이면 오류)
 */
async function compressImage(Jimp, filePath) {
  const originalSize = fs.statSync(filePath).size;
  const tempPath     = filePath + '.tmp_jimp';
  const ext          = path.extname(filePath).toLowerCase();

  try {
    const image = await Jimp.read(filePath);

    if (ext === '.png') {
      // PNG: 무손실 최적화 재인코딩 (투명도 완전 유지)
      await image.writeAsync(tempPath);
    } else {
      // JPG: Quality 82 손실 압축 (육안 무손실 안전 구간)
      image.quality(JPG_QUALITY);
      await image.writeAsync(tempPath);
    }

    if (!fs.existsSync(tempPath)) return 0;
    const newSize = fs.statSync(tempPath).size;

    if (newSize < originalSize) {
      // 압축 성공: 원본을 압축본으로 교체
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      const savedKb = ((originalSize - newSize) / 1024).toFixed(2);
      const origKb  = (originalSize / 1024).toFixed(2);
      const newKb   = (newSize / 1024).toFixed(2);
      console.log(`[압축] ${path.basename(filePath)}: ${origKb}KB -> ${newKb}KB (절약: ${savedKb}KB)`);
      return originalSize - newSize;
    } else {
      // 역효과 방지: 임시 파일 삭제, 원본 유지
      fs.unlinkSync(tempPath);
      return 0;
    }
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error(`[오류] ${path.basename(filePath)}: ${err.message}`);
    return -1;
  }
}

async function main() {
  // jimp v1을 dynamic import로 로드
  let Jimp;
  try {
    const jimpModule = await import('jimp');
    Jimp = jimpModule.Jimp || jimpModule.default?.Jimp || jimpModule.default;
    if (!Jimp) throw new Error('Jimp 클래스를 찾을 수 없습니다.');
    console.log('[초기화] jimp 로드 성공');
  } catch (e) {
    console.error('[오류] jimp 로드 실패:', e.message);
    process.exit(1);
  }

  console.log('==================================================');
  console.log(' SOS 매뉴얼 이미지 스마트 경량화 v2 (jimp 기반)');
  console.log(`  JPG 품질: ${JPG_QUALITY} | 최소 처리 크기: ${MIN_SIZE_KB}KB`);
  console.log('==================================================');

  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`[오류] 이미지 디렉토리 없음: ${ROOT_DIR}`);
    process.exit(1);
  }

  // 백업 디렉토리 준비 (지침 4.1 준수)
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[백업] 신규 백업 디렉토리 생성: ${BACKUP_DIR}`);
  } else {
    console.log(`[백업] 기존 백업 디렉토리 재사용: ${BACKUP_DIR}`);
  }

  const allFiles = getAllImageFiles(ROOT_DIR);
  console.log(`[스캔] 총 ${allFiles.length}개 이미지 발견`);
  console.log('--------------------------------------------------');

  for (const filePath of allFiles) {
    totalFiles++;
    const fileSizeKb = fs.statSync(filePath).size / 1024;

    // 최소 크기 미만 초소형 아이콘 제외
    if (fileSizeKb < MIN_SIZE_KB) {
      skippedCnt++;
      continue;
    }

    // 백업 수행
    backupFile(filePath);

    // 압축 실행
    const savedBytes = await compressImage(Jimp, filePath);
    if (savedBytes > 0) {
      compressedCnt++;
      totalSavedBytes += savedBytes;
    } else if (savedBytes === 0) {
      skippedCnt++;
    } else {
      errorCnt++;
    }
  }

  const savedMb = (totalSavedBytes / (1024 * 1024)).toFixed(2);
  console.log('==================================================');
  console.log('[완료] 이미지 경량화 작업 종료!');
  console.log(`  총 처리 대상 파일  : ${totalFiles} 개`);
  console.log(`  압축 성공 파일     : ${compressedCnt} 개`);
  console.log(`  원본 유지 파일     : ${skippedCnt} 개 (역효과 방지 포함)`);
  console.log(`  오류 파일          : ${errorCnt} 개`);
  console.log(`  총 절약 용량       : ${savedMb} MB`);
  console.log('==================================================');
}

main().catch(err => {
  console.error('[치명적 오류]', err);
  process.exit(1);
});
