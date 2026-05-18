/**
 * 파일명: sidebar_controller.js
 * 경로: core/sidebar_controller.js
 * 기능 설명: 좌측 아코디언 사이드바 제어, 테마 스위처(라이트/다크), 최하단 아코디언 잘림 방지 조상 리사이징 알고리즘, 스크롤 탑 버튼 제어
 * 작성 의도: index.html 본체의 사이드바 및 레이아웃 제어 코드를 격리하여 가독성을 높이고 AI 크레딧 소모를 대폭 줄임
 */

// 1. 초기 테마 설정 자가 분석
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// 2. 모바일/데스크톱 반응형 사이드바 개폐 토글
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// 3. 1단계 아코디언 메뉴 제어 (애니메이션 완료 후 maxHeight 제약 해제로 짤림 영구 방지)
window.toggleAccordion = function(menuId, iconId) {
    const menu = document.getElementById(menuId);
    const icon = document.getElementById(iconId);
    const isMenuExpanded = menu.style.maxHeight && menu.style.maxHeight !== '0px' && menu.style.maxHeight !== 'none';
    
    // 이미 'none'으로 완전히 풀려있는 경우도 확장 상태로 간주
    const isFullyExpanded = menu.style.maxHeight === 'none';
    
    if (isMenuExpanded || isFullyExpanded) {
        menu.style.maxHeight = menu.scrollHeight + 'px';
        menu.offsetHeight; // Reflow 강제 발생시켜 트랜지션 작동 보장
        
        setTimeout(() => {
            menu.style.maxHeight = '0px';
            icon.classList.remove('rotate-180');
            menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        }, 10);
    } else {
        menu.style.maxHeight = menu.scrollHeight + 'px';
        icon.classList.add('rotate-180');
        menu.previousElementSibling.setAttribute('aria-expanded', 'true');
        
        // 애니메이션 트랜지션(300ms)이 완료된 후 maxHeight 제약을 'none'으로 풀어 하부 짤림을 원천 제거!
        setTimeout(() => {
            if (menu.style.maxHeight !== '0px') {
                menu.style.maxHeight = 'none';
            }
        }, 350);
    }
}

// 4. 2단계 서브 아코디언 메뉴 제어 & 지능형 무결점 조상 리사이징 연동
window.toggleSubAccordion = function(menuId, iconId) {
    const menu = document.getElementById(menuId);
    const icon = document.getElementById(iconId);
    
    const isMenuExpanded = menu.style.maxHeight && menu.style.maxHeight !== '0px' && menu.style.maxHeight !== 'none';
    const isFullyExpanded = menu.style.maxHeight === 'none';
    
    // 조상들 중에서 'none'으로 풀린 녀석들을 접기/펴기 트랜지션을 위해 임시 scrollHeight로 환원
    let ancestor = menu.parentElement;
    while (ancestor) {
        if (ancestor.tagName === 'DIV' && ancestor.id && ancestor.style.maxHeight === 'none') {
            ancestor.style.maxHeight = ancestor.scrollHeight + 'px';
        }
        ancestor = ancestor.parentElement;
    }
    
    if (isMenuExpanded || isFullyExpanded) {
        menu.style.maxHeight = menu.scrollHeight + 'px';
        menu.offsetHeight; // Reflow
        
        setTimeout(() => {
            menu.style.maxHeight = '0px';
            icon.classList.remove('rotate-180');
            menu.previousElementSibling.setAttribute('aria-expanded', 'false');
            
            // 조상들 리사이징 재계산 및 다시 none으로 안전하게 영구 해제
            setTimeout(() => {
                let parent = menu.parentElement;
                while (parent) {
                    if (parent.tagName === 'DIV' && parent.id && parent.style.maxHeight !== undefined && parent.style.maxHeight !== '0px') {
                        parent.style.maxHeight = 'none';
                    }
                    parent = parent.parentElement;
                }
            }, 350);
        }, 10);
    } else {
        menu.style.maxHeight = menu.scrollHeight + 'px';
        icon.classList.add('rotate-180');
        menu.previousElementSibling.setAttribute('aria-expanded', 'true');
        
        // 조상들의 maxHeight를 자식이 늘어난 만큼 실시간 동적 확장 시각 보조
        let parent = menu.parentElement;
        while (parent) {
            if (parent.tagName === 'DIV' && parent.id && parent.style.maxHeight !== undefined && parent.style.maxHeight !== '0px') {
                parent.style.maxHeight = (parent.scrollHeight + menu.scrollHeight) + 'px';
            }
            parent = parent.parentElement;
        }
        
        // 트랜지션 완료 후 모든 조상의 maxHeight를 'none'으로 전면 개방해 짤림 영구 소거!
        setTimeout(() => {
            if (menu.style.maxHeight !== '0px') {
                menu.style.maxHeight = 'none';
            }
            let parent = menu.parentElement;
            while (parent) {
                if (parent.tagName === 'DIV' && parent.id && parent.style.maxHeight !== undefined && parent.style.maxHeight !== '0px') {
                    parent.style.maxHeight = 'none';
                }
                parent = parent.parentElement;
            }
        }, 350);
    }
}

// 5. 다크 모드 / 라이트 모드 실시간 반전 토글
window.toggleTheme = function() {
    const htmlClasses = document.documentElement.classList;
    if (htmlClasses.contains('dark')) {
        htmlClasses.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        htmlClasses.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// 6. 스크롤 위치 감지 헤더 플로팅 바 & 탑 버튼 노출 제어
const scrollArea = document.getElementById('mainScrollArea');
const stickyNav = document.getElementById('stickyNav');
if (scrollArea && stickyNav) {
    scrollArea.addEventListener('scroll', () => {
        // 검색 네비게이터가 켜져 있으면 항상 플로팅 바를 강제 노출
        const isNavActive = !document.getElementById('searchNavigator').classList.contains('hidden');
        
        if (scrollArea.scrollTop > 100 || isNavActive) {
            stickyNav.classList.remove('opacity-0', 'invisible', 'translate-y-10');
            stickyNav.classList.add('opacity-100', 'visible', 'translate-y-0');
        } else {
            stickyNav.classList.add('opacity-0', 'invisible', 'translate-y-10');
            stickyNav.classList.remove('opacity-100', 'visible', 'translate-y-0');
        }
    });
}

// 7. 상단 부드러운 스크롤 복원
window.scrollToTop = function() {
    if (scrollArea) { scrollArea.scrollTo({ top: 0, behavior: 'smooth' }); }
}
