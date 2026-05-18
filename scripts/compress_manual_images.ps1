# [compress_manual_images.ps1]
# 이 스크립트는 매뉴얼 이미지 자산을 백업하고 선택적으로 고성능 압축을 수행합니다.
# 화질 저하 최소화 (JPEG Quality 85, PNG 무손실 투명도 유지 압축) 및 대용량 파일(>200KB) 타겟 압축 적용

Add-Type -AssemblyName System.Drawing

$rootDir = "assets/images/manual"
$backupDir = "versions/backup_manual_images_260517"
$thresholdBytes = 200 * 1024 # 200 KB

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "   SOS 매뉴얼 이미지 자산 로컬 경량화 스크립트   " -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

# 1. 백업본 저장 (Image Preservation)
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    # 재귀 복사
    Copy-Item -Path "$rootDir/*" -Destination $backupDir -Recurse -Force
    Write-Host "[OK] [안전망] 원본 이미지 자산 전체 백업 완료 -> $backupDir" -ForegroundColor Green
} else {
    Write-Host "[INFO] [안전망] 백업 폴더가 이미 존재하여 추가 백업을 건너뜁니다." -ForegroundColor Yellow
}

# 2. 이미지 압축 처리 함수
function Compress-Image {
    param (
        [string]$filePath,
        [string]$extension,
        [int]$quality = 85
    )
    try {
        # .NET을 이용한 파일 로딩
        $img = [System.Drawing.Image]::FromFile($filePath)
        $tempPath = $filePath + ".tmp"

        if ($extension -eq ".png") {
            # PNG는 무손실 압축 포맷이므로 투명도를 100% 유지하며 구조만 최적화하여 저장
            $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } else {
            # JPEG/JPG는 화질 저하가 육안으로 불가능한 Quality 85 수준으로 압축 저장
            $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageDecoders() | Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid }
            $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
            $img.Save($tempPath, $codec, $encoderParams)
        }
        
        # 객체 메모리 해제 (파일 잠금 방지)
        $img.Dispose()
        
        # 원본 제거 및 임시 파일 교체
        Remove-Item -Path $filePath -Force
        Rename-Item -Path $tempPath -NewName (Split-Path $filePath -Leaf)
        
        return $true
    } catch {
        Write-Host "❌ $filePath 압축 중 오류 발생: $_" -ForegroundColor Red
        if (Test-Path $tempPath) { Remove-Item -Path $tempPath -Force }
        return $false
    }
}

# 3. 매뉴얼 폴더 내 타겟 순회 및 선택 압축 수행
$files = Get-ChildItem -Path $rootDir -Recurse | Where-Object { -not $_.PSIsContainer }
$processedCount = 0
$savedBytes = 0

foreach ($file in $files) {
    $ext = $file.Extension.ToLower()
    if ($ext -eq ".jpg" -or $ext -eq ".jpeg" -or $ext -eq ".png") {
        if ($file.Length -gt $thresholdBytes) {
            $oldSizeKb = [Math]::Round($file.Length / 1024, 2)
            
            # 압축 실행
            $success = Compress-Image -filePath $file.FullName -extension $ext -quality 85
            
            if ($success) {
                $newSize = (Get-Item $file.FullName).Length
                $newSizeKb = [Math]::Round($newSize / 1024, 2)
                $diffKb = $oldSizeKb - $newSizeKb
                $savedBytes += ($file.Length - $newSize)
                $processedCount++
                
                Write-Host "[SUCCESS] 압축 성공: $($file.Name) ($oldSizeKb KB -> $newSizeKb KB, 절약: -$diffKb KB)" -ForegroundColor Cyan
            }
        }
    }
}

$savedMb = [Math]::Round($savedBytes / (1024 * 1024), 2)
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "[완료] 모든 경량화 압축 작업이 종료되었습니다!" -ForegroundColor Green
Write-Host "- 총 압축된 이미지 파일: $processedCount 개" -ForegroundColor Green
Write-Host "- 절약된 용량: $savedMb MB" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
