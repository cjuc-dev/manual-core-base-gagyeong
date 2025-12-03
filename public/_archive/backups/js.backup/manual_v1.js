// Manual Content Logic
// This module populates the contentTemplates object defined in common_v1.js

if (window.contentTemplates) {
    window.contentTemplates.admin = '' +
        '<h3 class="text-2xl font-bold text-emerald-400 mb-4">행정 (Admin) 매뉴얼</h3>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '    <div onclick="loadContent(\'admin_manual_1\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="file-text" class="w-5 h-5 mr-2 text-emerald-400"></i> 문서 관리 규정</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">공문서 작성 및 보관 가이드라인</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'admin_manual_2\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="users" class="w-5 h-5 mr-2 text-blue-400"></i> 인사 관리</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">채용, 근태, 평가 관련 매뉴얼</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'admin_manual_3\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="credit-card" class="w-5 h-5 mr-2 text-yellow-400"></i> 예산 및 회계</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">지출 품의 및 정산 절차</p>' +
        '    </div>' +
        '</div>';

    window.contentTemplates.tech = '' +
        '<h3 class="text-2xl font-bold text-emerald-400 mb-4">기술 (Tech) 매뉴얼</h3>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '    <div onclick="loadContent(\'tech_manual_1\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="server" class="w-5 h-5 mr-2 text-emerald-400"></i> 서버 점검 체크리스트</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">일일/주간/월간 서버 점검 항목</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'tech_manual_2\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="wifi" class="w-5 h-5 mr-2 text-blue-400"></i> 네트워크 장애 대응</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">네트워크 연결 불량 시 조치 방법</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'tech_manual_3\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="monitor" class="w-5 h-5 mr-2 text-purple-400"></i> 키오스크 관리</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">무인 발권기 오류 해결 및 용지 교체</p>' +
        '    </div>' +
        '</div>';

    window.contentTemplates.phy = '' +
        '<h3 class="text-2xl font-bold text-emerald-400 mb-4">체육 (Physical) 매뉴얼</h3>' +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '    <div onclick="loadContent(\'phy_manual_1\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="shield" class="w-5 h-5 mr-2 text-emerald-400"></i> 체육시설 안전관리</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">안전 수칙 및 점검 리스트</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'phy_manual_2\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="heart-pulse" class="w-5 h-5 mr-2 text-red-400"></i> 심폐소생술 (CPR)</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">응급 상황 시 CPR 절차</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'phy_manual_3\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="zap" class="w-5 h-5 mr-2 text-yellow-400"></i> 자동심장충격기 (AED)</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">AED 사용법 및 위치</p>' +
        '    </div>' +
        '    <div onclick="loadContent(\'phy_manual_4\')" class="p-4 bg-gray-700/50 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600/50 transition">' +
        '        <h4 class="text-lg font-semibold text-white flex items-center"><i data-lucide="user-check" class="w-5 h-5 mr-2 text-blue-400"></i> 대상별 하임리히법</h4>' +
        '        <p class="text-gray-400 text-sm mt-1">기도 폐쇄 응급 처치</p>' +
        '    </div>' +
        '</div>';
}
