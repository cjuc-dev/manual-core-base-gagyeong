# [restore_larger_images.ps1]
# 이 스크립트는 압축 후 용량이 커진 파일들을 백업 폴더에서 감지하여 자동으로 원본으로 롤백합니다.

$rootDir = "assets/images/manual"
$backupDir = "versions/backup_manual_images_260517"

if (-not (Test-Path $backupDir)) {
    Write-Host "[ERROR] 백업 폴더를 찾을 수 없습니다: $backupDir" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $rootDir -Recurse | Where-Object { -not $_.PSIsContainer }
$restoredCount = 0

foreach ($file in $files) {
    # 상대 경로 획득
    $relativePath = $file.FullName.Substring((Get-Item $rootDir).FullName.Length + 1)
    $backupFile = Join-Path $backupDir $relativePath
    
    if (Test-Path $backupFile) {
        $backupLength = (Get-Item $backupFile).Length
        if ($file.Length -gt $backupLength) {
            # 용량이 늘어난 경우 백업본에서 원본 복사 (덮어쓰기)
            Copy-Item -Path $backupFile -Destination $file.FullName -Force
            $restoredCount++
            $oldSizeKb = [Math]::Round($file.Length / 1024, 2)
            $newSizeKb = [Math]::Round($backupLength / 1024, 2)
            Write-Host "[복원] $($file.Name) ($oldSizeKb KB -> 원본 $newSizeKb KB 복원 완료)" -ForegroundColor Yellow
        }
    }
}

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "[완료] 역효과(용량 증가) 파일 복원 최적화 완료!" -ForegroundColor Green
Write-Host "- 총 복원된 파일: $restoredCount 개" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
