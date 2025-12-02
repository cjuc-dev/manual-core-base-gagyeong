// --- VIEW CONTROL ---
const dashboardView = document.getElementById('dashboardView');
const contentView = document.getElementById('contentView');
const contentArea = document.getElementById('content-area');

function showDashboard() {
    contentView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
}

function showContent() {
    dashboardView.classList.add('hidden');
    contentView.classList.remove('hidden');
}

function toggleModule(selectorId, iconId) {
    const selector = document.getElementById(selectorId);
    const icon = document.getElementById(iconId);
    
    // 다른 열린 모듈 닫기 (선택 사항)
    // document.querySelectorAll('[id$="Selector"]').forEach(el => {
    //     if(el.id !== selectorId) el.classList.add('hidden');
    // });

    selector.classList.toggle('hidden');
    
    if (selector.classList.contains('hidden')) {
        icon.classList.remove('rotate-180');
    } else {
        icon.classList.add('rotate-180');
    }
}

// 초기화: 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // Lucide 아이콘 초기화
    if (window.lucide) {
        lucide.createIcons();
    }
});
