# 복대 파일을 가경으로 복사
Copy-Item -Path "guide\bokdae_sportscenter_guide_v1.html" -Destination "guide\gagyeong_sportscenter_guide_v1_new.html" -Force

# 파일 읽기
$content = Get-Content "guide\gagyeong_sportscenter_guide_v1_new.html" -Raw -Encoding UTF8

# 기본 정보 치환
$content = $content -replace 'bokdae', 'gagyeong'
$content = $content -replace '복대국민체육센터', '가경국민체육센터'
$content = $content -replace '화~금 06:00~22:00', '화~금 06:00~21:30'
$content = $content -replace '토일 06:00~17:00', '토일 06:00~16:30'
$content = $content -replace '043-820-7221', '043-820-7250'
$content = $content -replace '대관: 043-820-7223', '대관: 043-820-7250'

# 주차장 수량
$content = $content -replace '(<td>일반</td>\s*<td class="font-bold text-white">)-(<)', '$131$2'
$content = $content -replace '(<td>장애인</td>\s*<td class="font-bold text-white">)-(<)', '$12$2'
$content = $content -replace '(<td>총계</td>\s*<td class="accent-color">)-(<)', '$133$2'

# 정수기 7대
$content = $content -replace '(<td>정수기</td>\s*<td class="font-bold text-white">)-(<)', '$17$2'

# 승강기 1대
$content = $content -replace '(<td>승강기</td>\s*<td class="font-bold text-white">)-(<)', '$11$2'

# 파일 저장
Set-Content "guide\gagyeong_sportscenter_guide_v1_new.html" -Value $content -Encoding UTF8 -NoNewline

Write-Host "파일 생성 완료: gagyeong_sportscenter_guide_v1_new.html"
