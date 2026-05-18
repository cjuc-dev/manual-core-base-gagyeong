// [compress_with_jimp.mjs]
// 이 스크립트는 jimp v1 (ESM) 기반으로 매뉴얼 이미지를 화질 저하 최소화 방식으로 경량화합니다.
// JPG: Quality 82 (육안 화질 저하 없는 안전 구간 - 스크린샷 텍스트 선명도 완벽 유지)
// PNG: 무손실 최적화 재인코딩 (투명도 100% 보존)
// 안전망: 압축 후 파일이 원본보다 크면 자동 롤백하여 역효과 파일 0개 보장
// 관리자 안내: node scripts/compress_with_jimp.mjs 로 실행합니다.

import { Jimp } from 'jimp';
import fs        from 'fs';
import path      from 'path';

// ─── 설정값 (Configurable Parameters) ───────────────────────────────────────
const ROOT_DIR    = 'assets/images/manual';
const BACKUP_DIR  = 'versions/backup_sharp_260517';
const JPG_QUALITY = 82;   // JPG 압축 품질 (82: 육안 무손실 안전 최적값)
const MIN_SIZE_KB = 30;   // 30KB 미만 초소형 아이콘은 처리에서 제외
// ─────────────────────────────────────────────────────────────────────────────

// 집계 변수
let totalFiles      = 0;
let compressedCnt   = 0;
let skippedCnt      = 0;
let errorCnt        = 0;
let totalSavedBytes = 0;

/**
 * 디렉토리 내 모든 이미지 파일 경로를 재귀적으로 수집합니다.
 */
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

/**
 * 백업 폴더에 원본 파일을 복사합니다 (이미 백업된 파일은 스킵).
 */
function backupFile(srcPath, backupRoot, imageRoot) {
  const relativePath = path.relative(imageRoot, srcPath);
  const destPath     = path.join(backupRoot, relativePath);
  const destDir      = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  // 이미 백업 존재하면 덮어쓰지 않고 원본 보호
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
}

/**
 * 단일 이미지 파일을 jimp로 압축합니다.
 * - JPG: Quality 82 손실 압축
 * - PNG: 무손실 최적화 저장 (메타데이터 제거, 필터 최적화)
 * - 압축 후 더 크면 임시 파일 삭제 후 원본 자동 유지 (롤백)
 */
async function compressImage(filePath, ext) {
  const originalSize = fs.statSync(filePath).size;
  const tempPath     = filePath + '.tmp_jimp';

  try {
    const image = await Jimp.read(filePath);

    if (ext === '.png') {
      // PNG: 무손실 최적화 재인코딩 (알파 채널/투명도 완전 유지)
      await image.write(tempPath);
    } else {
      // JPG: Quality 82 손실 압축
      // jimp v1: jpeg quality는 write 옵션으로 전달
      await image.write(tempPath, { quality: JPG_QUALITY });
    }

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
      // 역효과 방지: 임시 파일 삭제, 원본 그대로 유지
      fs.unlinkSync(tempPath);
      return 0;
    }
  } catch (err) {
    // 예외 발생 시 임시 파일 정리 후 오류 리포트
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error(`[오류] ${path.basename(filePath)}: ${err.message}`);
    return -1;
  }
}

async function main() {
  console.log('==================================================');
  console.log(' SOS 매뉴얼 이미지 스마트 경량화 v2 (jimp ESM)');
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
    const ext        = path.extname(filePath).toLowerCase();

    // 최소 크기 미만 스킵 (아이콘류 보호)
    if (fileSizeKb < MIN_SIZE_KB) {
      skippedCnt++;
      continue;
    }

    // 백업 수행
    backupFile(filePath, BACKUP_DIR, ROOT_DIR);

    // 압축 실행
    const savedBytes = await compressImage(filePath, ext);
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
