# [verify_compression.ps1]
# 이 스크립트는 현재 이미지 파일 크기와 백업 원본 크기를 정밀 비교하여
# 이전 압축 작업이 올바르게 적용되었는지 검증하고 결과 보고서를 출력합니다.
# 관리자 안내: 백업 폴더(versions/backup_manual_images_260517)가 반드시 존재해야 합니다.

$rootDir    = "assets/images/manual"
$backupDir  = "versions/backup_manual_images_260517"
$reportPath = "docs/30. 이미지_경량화_검증_보고서.md"

# 백업 폴더 존재 확인
if (-not (Test-Path $backupDir)) {
    Write-Host "[ERROR] 백업 폴더가 존재하지 않습니다: $backupDir" -ForegroundColor Red
    exit 1
}

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "  SOS 이미지 경량화 압축 결과 검증 스크립트" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

# 집계 변수 초기화
$totalFiles       = 0
$compressedCount  = 0
$restoredCount    = 0
$unchangedCount   = 0
$missingBackup    = 0
$totalOriginalBytes  = 0
$totalCurrentBytes   = 0

# 결과 행 저장 배열 (보고서용)
$reportRows = @()

# 현재 이미지 파일 전체 순회
$files = Get-ChildItem -Path $rootDir -Recurse | Where-Object { -not $_.PSIsContainer -and ($_.Extension -eq ".jpg" -or $_.Extension -eq ".jpeg" -or $_.Extension -eq ".png") }

foreach ($file in $files) {
    $totalFiles++
    $relativePath = $file.FullName.Substring((Get-Item $rootDir).FullName.Length + 1)
    $backupFile   = Join-Path $backupDir $relativePath

    $currentKb = [Math]::Round($file.Length / 1024, 2)

    if (Test-Path $backupFile) {
        $backupLength = (Get-Item $backupFile).Length
        $backupKb     = [Math]::Round($backupLength / 1024, 2)
        $diffKb       = [Math]::Round($backupKb - $currentKb, 2)
        $totalOriginalBytes += $backupLength
        $totalCurrentBytes  += $file.Length

        if ($file.Length -lt $backupLength) {
            # 압축 성공 (용량 감소)
            $compressedCount++
            $status = "압축됨"
            Write-Host "[압축] $($file.Name) : $backupKb KB -> $currentKb KB (절약: $diffKb KB)" -ForegroundColor Cyan
        } elseif ($file.Length -eq $backupLength) {
            # 원본과 동일 (압축 불필요 혹은 복원 완료)
            $unchangedCount++
            $status = "원본유지"
        } else {
            # 압축 후 오히려 커진 경우 (복원이 안 된 이상 케이스)
            $restoredCount++
            $status = "[경고] 압축 역효과"
            Write-Host "[경고] $($file.Name) : 백업($backupKb KB) 보다 현재($currentKb KB)가 더 큼! 복원 필요." -ForegroundColor Red
        }

        $reportRows += [PSCustomObject]@{
            파일명     = $file.Name
            원본KB     = $backupKb
            현재KB     = $currentKb
            절약KB     = $diffKb
            상태       = $status
        }
    } else {
        # 백업이 없는 신규 파일
        $missingBackup++
        $totalCurrentBytes += $file.Length
        Write-Host "[신규] $($file.Name) : 백업 없음 (신규 추가 파일)" -ForegroundColor Yellow
    }
}

# 최종 집계 계산
$totalSavedMb    = [Math]::Round(($totalOriginalBytes - $totalCurrentBytes) / (1024 * 1024), 2)
$totalOriginalMb = [Math]::Round($totalOriginalBytes / (1024 * 1024), 2)
$totalCurrentMb  = [Math]::Round($totalCurrentBytes  / (1024 * 1024), 2)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "[검증 결과 요약]" -ForegroundColor Green
Write-Host "- 검사 대상 총 파일 수 : $totalFiles 개" -ForegroundColor White
Write-Host "- 압축 성공 파일       : $compressedCount 개" -ForegroundColor Cyan
Write-Host "- 원본 유지 파일       : $unchangedCount 개" -ForegroundColor White
Write-Host "- 역효과 경고 파일     : $restoredCount 개" -ForegroundColor Red
Write-Host "- 신규(백업없음) 파일  : $missingBackup 개" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "- 원본 총 용량         : $totalOriginalMb MB" -ForegroundColor White
Write-Host "- 현재 총 용량         : $totalCurrentMb MB" -ForegroundColor White
Write-Host "- 순 절약 용량         : $totalSavedMb MB" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow

# 보고서 마크다운 파일 자동 생성 (지침 1 - 기획 및 보고서 산출물 동시 생성 규칙)
$today = Get-Date -Format "yyyy-MM-dd"
$mdContent = @"
# 이미지 경량화 압축 검증 보고서

> 본 보고서는 ``verify_compression.ps1`` 스크립트에 의해 자동 생성되었습니다.

## 검증 개요

| 항목 | 값 |
|:---|:---|
| 검증 일시 | $today |
| 검사 대상 경로 | ``assets/images/manual/`` |
| 비교 기준 백업 | ``versions/backup_manual_images_260517/`` |
| 검사 대상 총 파일 수 | $totalFiles 개 |

## 집계 결과

| 구분 | 파일 수 |
|:---|:---:|
| 압축 성공 (용량 감소) | $compressedCount 개 |
| 원본 유지 (동일) | $unchangedCount 개 |
| 역효과 경고 (복원 필요) | $restoredCount 개 |
| 신규 파일 (백업 없음) | $missingBackup 개 |

## 용량 절감 성과

| 항목 | 용량 |
|:---|:---:|
| 원본 총 용량 | $totalOriginalMb MB |
| 경량화 후 현재 용량 | $totalCurrentMb MB |
| **순 절약 용량** | **$totalSavedMb MB** |

---
최종 업데이트: $today
"@

$mdContent | Out-File -FilePath $reportPath -Encoding utf8
Write-Host "[보고서] 검증 결과가 $reportPath 에 자동 저장되었습니다." -ForegroundColor Green
