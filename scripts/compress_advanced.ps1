# [compress_advanced.ps1]
# 이 스크립트는 기존 원본 백업(backup_manual_images_260517)을 기준으로
# 더 공격적인 설정(JPG Quality 80, 30KB 이상 전체)으로 재압축합니다.
# 핵심: 이미 압축된 파일에서 다시 압축하는 이중 압축 화질 저하를 방지하기 위해
#       반드시 원본 백업에서 신규 압축을 적용한 뒤 현재 파일과 비교하여
#       더 작은 쪽만 채택합니다.
# 관리자 안내: 프로젝트 루트에서 실행하세요.

Add-Type -AssemblyName System.Drawing

# --- 설정값 (Configurable) ------------------------------------------------
$rootDir       = "assets/images/manual"          # 현재 이미지 디렉토리
$originalBackup= "versions/backup_manual_images_260517" # 원본 백업 (기준)
$newBackupDir  = "versions/backup_advanced_260517"      # 이번 작업 전 안전망 백업
$jpgQuality    = 80    # JPG 품질 (80: 육안 무손실 안전 하한선)
$minSizeKb     = 30    # 30KB 미만 초소형 아이콘은 처리 제외
# -------------------------------------------------------------------------

# 집계 변수
$processedCount = 0
$skippedCount   = 0
$savedBytes     = 0

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "  SOS 이미지 고도화 경량화 스크립트 (Phase 2)" -ForegroundColor Yellow
Write-Host "  JPG Quality: $jpgQuality | 최소 처리: ${minSizeKb}KB 이상 전체" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

# 1. 원본 백업 존재 확인
if (-not (Test-Path $originalBackup)) {
    Write-Host "[오류] 원본 백업 폴더가 없습니다: $originalBackup" -ForegroundColor Red
    Write-Host "       이전 단계의 compress_manual_images.ps1을 먼저 실행하세요." -ForegroundColor Red
    exit 1
}

# 2. 이번 작업 전 현재 상태 안전망 백업 (아직 없는 경우에만)
if (-not (Test-Path $newBackupDir)) {
    New-Item -ItemType Directory -Path $newBackupDir -Force | Out-Null
    Copy-Item -Path "$rootDir/*" -Destination $newBackupDir -Recurse -Force
    Write-Host "[안전망] 현재 이미지 상태 백업 완료 -> $newBackupDir" -ForegroundColor Green
} else {
    Write-Host "[안전망] 기존 안전망 백업 폴더 재사용: $newBackupDir" -ForegroundColor Yellow
}

# 3. 이미지 압축 함수 (원본 백업 파일을 소스로 사용)
function Compress-FromOriginal {
    param (
        [string]$originalPath,  # 원본 백업 파일 경로 (압축 소스)
        [string]$targetPath,    # 현재 실제 이미지 파일 경로 (교체 대상)
        [string]$extension,
        [int]$quality
    )

    $currentSize  = (Get-Item $targetPath).Length
    $tempPath     = $targetPath + ".tmp_adv"

    try {
        # 원본 백업에서 이미지 로드 (이중 압축 방지 핵심)
        $img = [System.Drawing.Image]::FromFile($originalPath)

        if ($extension -eq ".png") {
            # PNG: 무손실 최적화 (투명도 완전 유지)
            $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } else {
            # JPG: Quality 80 손실 압축 (원본 기준, 이중 압축 없음)
            $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageDecoders() |
                     Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid }
            $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
                [System.Drawing.Imaging.Encoder]::Quality, $quality)
            $img.Save($tempPath, $codec, $encoderParams)
        }

        $img.Dispose()

        $newSize = (Get-Item $tempPath).Length

        if ($newSize -lt $currentSize) {
            # 개선됨: 현재 파일보다 작으면 교체
            Remove-Item -Path $targetPath -Force
            Rename-Item -Path $tempPath -NewName (Split-Path $targetPath -Leaf)

            $oldKb  = [Math]::Round($currentSize / 1024, 2)
            $newKb  = [Math]::Round($newSize / 1024, 2)
            $diffKb = [Math]::Round(($currentSize - $newSize) / 1024, 2)
            Write-Host "[압축] $([System.IO.Path]::GetFileName($targetPath)): ${oldKb}KB -> ${newKb}KB (절약: ${diffKb}KB)" -ForegroundColor Cyan
            return ($currentSize - $newSize)
        } else {
            # 현재가 이미 더 작거나 동일: 현재 파일 유지, 임시 파일 삭제
            Remove-Item -Path $tempPath -Force
            return 0
        }
    } catch {
        Write-Host "[오류] $([System.IO.Path]::GetFileName($targetPath)): $_" -ForegroundColor Red
        if (Test-Path $tempPath) { Remove-Item -Path $tempPath -Force }
        return 0
    }
}

# 4. 현재 이미지 디렉토리 전체 순회
$files = Get-ChildItem -Path $rootDir -Recurse |
         Where-Object { -not $_.PSIsContainer -and
                        ($_.Extension -eq ".jpg" -or $_.Extension -eq ".jpeg" -or $_.Extension -eq ".png") }

Write-Host "[스캔] 총 $($files.Count)개 이미지 발견, 압축 시작..." -ForegroundColor White
Write-Host "--------------------------------------------------" -ForegroundColor Yellow

foreach ($file in $files) {
    # 최소 크기 필터 (초소형 아이콘 보호)
    $fileSizeKb = [Math]::Round($file.Length / 1024, 2)
    if ($fileSizeKb -lt $minSizeKb) {
        $skippedCount++
        continue
    }

    # 원본 백업 파일 경로 계산
    $relativePath = $file.FullName.Substring((Get-Item $rootDir).FullName.Length + 1)
    $originalFile = Join-Path $originalBackup $relativePath

    # 원본 백업이 없으면 현재 파일 자체를 소스로 사용 (신규 파일)
    $sourceFile = if (Test-Path $originalFile) { $originalFile } else { $file.FullName }

    $gained = Compress-FromOriginal `
        -originalPath $sourceFile `
        -targetPath   $file.FullName `
        -extension    $file.Extension.ToLower() `
        -quality      $jpgQuality

    if ($gained -gt 0) {
        $processedCount++
        $savedBytes += $gained
    } else {
        $skippedCount++
    }
}

# 5. 최종 결과 출력
$savedMb       = [Math]::Round($savedBytes / (1024 * 1024), 2)
$totalOrigMb   = [Math]::Round(($files | Measure-Object -Property Length -Sum).Sum / (1024 * 1024), 2)

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "[완료] Phase 2 고도화 압축 작업 종료!" -ForegroundColor Green
Write-Host "  추가 압축 성공 파일  : $processedCount 개" -ForegroundColor Cyan
Write-Host "  원본 유지 파일       : $skippedCount 개 (이미 최적 또는 크기 미달)" -ForegroundColor White
Write-Host "  이번 추가 절약 용량  : $savedMb MB" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
