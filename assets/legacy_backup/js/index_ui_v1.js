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

function toggleCard(cardId, selectorId, iconId) {
    const card = document.getElementById(cardId);
    const selector = document.getElementById(selectorId);
    const icon = document.getElementById(iconId);
    
    // 다른 열린 모듈 닫기 (선택 사항 - 필요 시 주석 해제)
    // document.querySelectorAll('[id$="Selector"]').forEach(el => {
    //     if(el.id !== selectorId && !el.classList.contains('hidden')) {
    //         // 로직 추가 필요: 해당 카드의 col-span 클래스 제거 등
    //     }
    // });

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
