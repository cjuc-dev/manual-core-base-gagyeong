// --- CONTENT LOADING LOGIC ---
function loadContent(section, addHistory = true) {
    // 뷰 전환
    showContent();

    // History API
    if (addHistory) {
        history.pushState({ section: section }, null, `#${section}`);
    }

    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="flex flex-col items-center justify-center h-64 text-gray-500"><i data-lucide="loader" class="w-10 h-10 animate-spin mb-4"></i><p>로딩 중...</p></div>';
    if (window.lucide) lucide.createIcons();

    const contentPaths = {
        update: 'updatecontainer/updatecontainer_main_v2.html',
        facility: 'facility_status/facility_status.html',
        cheongjuSwimming_guide: 'guide/cheongju_swimming_pool_guide.html',
        purmi_guide: 'guide/purmi_guide_v1.html',
        youngun_sportscenter_guide: 'guide/youngun_sportscenter_guide_v1.html',
        bokdae_sportscenter_guide: 'guide/bokdae_sportscenter_guide.html',
        gagyeong_sportscenter_guide: 'guide/gagyeong_sportscenter_guide.html',
        gagyeong_sportscenter_manual_2_2_5: 'gagyeong_sportscenter/manual_2_2_5_main.html',
        voc_swimming_pool: 'voc/voc_swimming_pool.html',
        voc_multipurpose_sports_hall: 'voc/voc_multipurpose_sports_hall.html',
        voc_program_room: 'voc/voc_program_room.html',
        voc_other_information: 'voc/voc_other_information.html',
        phy_manual_1: 'phy_manual/phy_manual_1.html',
        phy_manual_2: 'phy_manual/phy_manual_2.html',
        phy_manual_3: 'phy_manual/phy_manual_3.html',
        phy_manual_4: 'phy_manual/phy_manual_4.html',
        helpdesk: 'helpdesk/system_inquiry.html'
    };

    if (contentPaths[section]) {
        // 로컬 테스트를 위해 상대 경로 사용
        const url = contentPaths[section];
        console.log(`Fetching URL: ${url}`);

        // 캐시 방지를 위한 타임스탬프 추가
        const timestamp = new Date().getTime();
        fetch(`${url}?t=${timestamp}`)
            .then((response) => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then((data) => {
                // HTML 파싱하여 body 내용만 추출 (스타일 충돌 방지)
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const bodyContent = doc.body ? doc.body.innerHTML : data;
                contentArea.innerHTML = bodyContent;
                
                // 동적으로 로드된 콘텐츠 내의 스크립트 실행
                const scripts = contentArea.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
                
                // 아이콘 다시 렌더링
                if (window.lucide) lucide.createIcons();
            })
            .catch((error) => {
                contentArea.innerHTML = '<p class="text-red-500">콘텐츠를 불러오는 데 실패했습니다.</p>';
                console.error('Error loading the content:', error);
            });
    } else {
        contentArea.innerHTML = generateContent(section);
        if (window.lucide) lucide.createIcons();
    }
}

function generateContent(section) {
    const contentTemplates = {
        admin: `
            <h3 class="text-2xl font-bold text-emerald-400 mb-4">행정 (Admin) 매뉴얼</h3>
            <div class="space-y-4">
                <div class="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <h4 class="text-lg font-semibold text-white">2.1.1. 청주수영장 행정분야</h4>
                    <p class="text-gray-400 text-sm mb-2">행정 절차 및 규정 안내</p>
                    <button onclick="location.href='tech2.html'" class="text-emerald-400 hover:underline text-sm">페이지 이동 <i data-lucide="external-link" class="w-3 h-3 inline"></i></button>
                </div>
                <div class="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <h4 class="text-lg font-semibold text-white">2.1.5. 가경국민체육센터 행정분야</h4>
                    <p class="text-gray-400 text-sm mb-2">가경센터 행정 매뉴얼</p>
                    <button onclick="location.href='gagyeong_sportscenter/manual_2_1_5_main.html'" class="text-emerald-400 hover:underline text-sm">페이지 이동 <i data-lucide="external-link" class="w-3 h-3 inline"></i></button>
                </div>
                <p class="text-gray-500 text-xs mt-4">* 일부 항목은 아직 구현되지 않았습니다.</p>
            </div>
        `,
        tech: `
            <h3 class="text-2xl font-bold text-emerald-400 mb-4">기술 (Tech) 매뉴얼</h3>
            <div class="space-y-4">
                <div class="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <h4 class="text-lg font-semibold text-white">2.2.5. 가경국민체육센터 기술분야</h4>
                    <p class="text-gray-400 text-sm mb-2">기계, 전기, 소방 설비 관리</p>
                    <button onclick="location.href='gagyeong_sportscenter/manual_2_2_5_main.html'" class="text-emerald-400 hover:underline text-sm">페이지 이동 <i data-lucide="external-link" class="w-3 h-3 inline"></i></button>
                </div>
            </div>
        `,
        phy: `
            <h3 class="text-2xl font-bold text-emerald-400 mb-4">체육 (Physical) 매뉴얼</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onclick="loadContent('phy_manual_1')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">
                    <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="shield" class="w-5 h-5 mr-2 text-emerald-400"></i> 체육시설 안전관리</h4>
                    <p class="text-gray-400 text-sm mt-1">안전 수칙 및 점검 리스트</p>
                </div>
                <div onclick="loadContent('phy_manual_2')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">
                    <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="heart-pulse" class="w-5 h-5 mr-2 text-red-400"></i> 심폐소생술 (CPR)</h4>
                    <p class="text-gray-400 text-sm mt-1">응급 상황 시 CPR 절차</p>
                </div>
                <div onclick="loadContent('phy_manual_3')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">
                    <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="zap" class="w-5 h-5 mr-2 text-yellow-400"></i> 자동심장충격기 (AED)</h4>
                    <p class="text-gray-400 text-sm mt-1">AED 사용법 및 위치</p>
                </div>
                <div onclick="loadContent('phy_manual_4')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">
                    <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="user-check" class="w-5 h-5 mr-2 text-blue-400"></i> 대상별 하임리히법</h4>
                    <p class="text-gray-400 text-sm mt-1">기도 폐쇄 응급 처치</p>
                </div>
            </div>
        `,
        helpdesk: `
            <h3 class="text-2xl font-bold text-red-400 mb-4">도움말 (Help)</h3>
            <div class="p-6 bg-gray-700/50 rounded-lg border border-gray-600 text-center">
                <i data-lucide="help-circle" class="w-16 h-16 text-red-400 mx-auto mb-4"></i>
                <p class="text-white text-lg mb-4">시스템 이용 중 불편한 점이 있으신가요?</p>
                <a href="https://docs.google.com/spreadsheets/d/1gkFP9ARlFcD6uUwKhKYZTIWMENFj7Hs1k6FgW8fN1uA/edit?usp=sharing" target="_blank" class="inline-block bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-full transition">
                    문의 및 개선 요청하기
                </a>
            </div>
        `
    };
    return contentTemplates[section] || '<p>올바른 섹션이 아닙니다.</p>';
}
