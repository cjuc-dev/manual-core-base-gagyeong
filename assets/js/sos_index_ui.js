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
    
    // 접근성: aria-expanded 업데이트
    const isHidden = selector.classList.contains('hidden');
    const button = icon.closest('[role="button"]');
    if (button) {
        button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    }

    selector.classList.toggle('hidden');
    
    if (selector.classList.contains('hidden')) {
        icon.classList.remove('rotate-180');
    } else {
        icon.classList.add('rotate-180');
    }
}

function toggleCard(cardId, selectorId, iconId) {
    const card = document.getElementById(cardId);
    const selector = document.getElementById(selectorId);
    const icon = document.getElementById(iconId);
    
    selector.classList.toggle('hidden');
    
    // 카드 너비 확장 토글
    if (selector.classList.contains('hidden')) {
        icon.classList.remove('rotate-180');
        // 원래 크기로 복귀
        card.classList.remove('md:col-span-2', 'lg:col-span-3');
    } else {
        icon.classList.add('rotate-180');
        // 전체 너비로 확장
        card.classList.add('md:col-span-2', 'lg:col-span-3');
    }
}

// Sticky 검색바 스크롤 효과
function handleSearchScroll() {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer) return;
    
    if (window.scrollY > 50) {
        searchContainer.classList.add('scrolled');
    } else {
        searchContainer.classList.remove('scrolled');
    }
}

// 키보드 네비게이션 지원
function handleKeyboardNavigation(event, selectorId, iconId) {
    // Enter 또는 Space 키로 토글
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleModule(selectorId, iconId);
    }
}

// 초기화: 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // Lucide 아이콘 초기화
    if (window.lucide) {
        lucide.createIcons();
    }

    // Sticky 검색바 스크롤 이벤트
    window.addEventListener('scroll', handleSearchScroll);

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

    // 모든 모듈 카드에 키보드 네비게이션 추가
    document.querySelectorAll('[data-toggle-module]').forEach(element => {
        element.addEventListener('keydown', (e) => {
            const selectorId = element.getAttribute('data-selector-id');
            const iconId = element.getAttribute('data-icon-id');
            if (selectorId && iconId) {
                handleKeyboardNavigation(e, selectorId, iconId);
            }
        });
    });
});
