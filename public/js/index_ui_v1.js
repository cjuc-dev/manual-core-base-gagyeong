// --- VIEW CONTROL ---
const dashboardView = document.getElementById('dashboardView');
const contentView = document.getElementById('contentView');
const contentArea = document.getElementById('content-area');

function showDashboard(addHistory = true) {
    contentView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    if (addHistory) {
        history.pushState(null, null, window.location.pathname);
    }
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

    // History API: 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.section) {
            // loadContent가 정의되어 있는지 확인
            if (typeof loadContent === 'function') {
                loadContent(event.state.section, false);
            }
        } else {
            showDashboard(false);
        }
    });

    // 초기 로드 시 해시 확인 및 상태 설정
    const hash = window.location.hash.substring(1);
    if (hash && typeof loadContent === 'function') {
        loadContent(hash, false);
        history.replaceState({ section: hash }, null, window.location.href);
    } else {
        history.replaceState(null, null, window.location.pathname);
    }
});
