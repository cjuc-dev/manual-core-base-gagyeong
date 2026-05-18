# [compare_folders.ps1]
# 이미지 폴더의 압축 전/후 용량을 비교하여 결과를 출력합니다.

$original = "versions/backup_manual_images_260517"
$current  = "assets/images/manual"

function Get-FolderStats {
    param ([string]$folderPath)
    $files     = Get-ChildItem -Path $folderPath -Recurse -File
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    return @{
        FileCount = $files.Count
        TotalMB   = [Math]::Round($totalSize / 1MB, 2)
        TotalBytes= $totalSize
    }
}

Write-Host "======================================================" -ForegroundColor Yellow
Write-Host "   SOS 이미지 폴더 압축 전/후 용량 비교 리포트" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Yellow

# 원본 백업 폴더
Write-Host ""
Write-Host "[압축 전] 원본 백업: $original" -ForegroundColor Cyan
$origStats = Get-FolderStats -folderPath $original
Write-Host ("  파일 수  : {0} 개" -f $origStats.FileCount)
Write-Host ("  총 용량  : {0} MB" -f $origStats.TotalMB)

# 현재 압축 후 폴더
Write-Host ""
Write-Host "[압축 후] 현재 상태: $current" -ForegroundColor Cyan
$curStats = Get-FolderStats -folderPath $current
Write-Host ("  파일 수  : {0} 개" -f $curStats.FileCount)
Write-Host ("  총 용량  : {0} MB" -f $curStats.TotalMB)

# 비교 결과
$savedMb = [Math]::Round(($origStats.TotalBytes - $curStats.TotalBytes) / 1MB, 2)
$ratio   = [Math]::Round((1 - $curStats.TotalBytes / $origStats.TotalBytes) * 100, 1)

Write-Host ""
Write-Host "======================================================" -ForegroundColor Yellow
Write-Host "  [최종 결과]" -ForegroundColor Green
Write-Host ("  압축 전 용량  : {0} MB" -f $origStats.TotalMB) -ForegroundColor White
Write-Host ("  압축 후 용량  : {0} MB" -f $curStats.TotalMB) -ForegroundColor White
Write-Host ("  절약된 용량   : {0} MB" -f $savedMb) -ForegroundColor Green
Write-Host ("  전체 압축률   : {0}% 감소" -f $ratio) -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Yellow
