/**
 * 🔍 search_engine.js
 * 
 * [기능 정의]
 * Smart Operations Suite (SOS)의 강력한 지능형 전역 검색 및 실시간 자동완성(Autocomplete) 엔진 코어입니다.
 * 
 * [왜 이렇게 설계했는가?]
 * - index.html의 메인 로드를 극도로 가볍게 유지하고, 검색 리소스를 독자적인 생명주기로 관리하기 위함입니다.
 * - PC와 모바일 뷰어 간 자동완성 제어 상태 및 검색 상세 결과 마진을 상호 유기적으로 완벽하게 통제합니다.
 * - Firestore 연동 및 마크다운 키워드 앵커 네비게이션 간의 브릿지 역할을 수행합니다.
 * 
 * @author Smart Operations Suite Development Team
 * @version 5.55
 */

// 전역 상태 변수 관리
window.searchIndex = [];
window.currentSearchResults = [];
window.lastSearchQuery = null;
window.currentSearchIndex = -1;
window.autocompleteIndex = -1;

/**
 * 🚀 [검색 인덱스 초기화]
 * 로컬 JSON 검색 인덱스 파일로부터 정밀 검색 메타데이터를 실시간 로드합니다.
 */
window.initSearchEngine = async function() {
    try {
        const response = await fetch('data/system/search_index.json');
        if (response.ok) {
            window.searchIndex = await response.json();
        }
    } catch (e) {
        console.error('[Search] 인덱스 로드 실패:', e);
    }
};

// 즉시 검색 엔진 초기화 구동
window.initSearchEngine();

/**
 * 🚀 [검색] 자동완성 구현 (데스크탑 및 모바일 완벽 동기화 지원)
 */
window.handleAutocomplete = function(query, inputId) {
    const isMobile = inputId === 'searchInputMobile';
    const list = document.getElementById(isMobile ? 'autocompleteListMobile' : 'autocompleteList');
    const searchResults = document.getElementById(isMobile ? 'searchResultsMobile' : 'searchResults');
    
    if (!query.trim() || query.length < 2) {
        list.classList.add('hidden');
        window.autocompleteIndex = -1;
        if (searchResults) {
            searchResults.style.setProperty('margin-top', '8px', 'important');
        }
        return;
    }

    const safeQuery = query.toLowerCase();
    const suggestions = window.searchIndex
        .filter(item => item.title && item.title.toLowerCase().includes(safeQuery))
        .slice(0, 10); // 10개까지 추천하되 5개 이후로는 스크롤 적용

    if (suggestions.length > 0) {
        let html = suggestions.map((item, idx) => {
            let displayFacility = "";
            const f = item.facility || "";
            
            // 🚀 [보안/가독성] 카테고리-시설명 형식으로 고도화
            if (f === 'guide') displayFacility = '시설 안내';
            else if (f === 'data') displayFacility = '시스템';
            else if (f === 'voc') displayFacility = '시민의 소리';
            else if (f === 'index') displayFacility = '통합 인덱스';
            else displayFacility = '매뉴얼';

            // 🚀 [명칭 정합성 강화] 시설 축약어를 사용하지 않고 본래의 공식 전체 명칭을 100% 그대로 표기
            let subInfo = "";
            if (item.id && item.id.includes('Swimming')) subInfo = "청주수영장";
            else if (item.id && item.id.includes('bokdae')) subInfo = "복대국민체육센터";
            else if (item.id && item.id.includes('gagyeong')) subInfo = "가경국민체육센터";
            else if (item.id && item.id.includes('youngun')) subInfo = "영운국민체육센터";
            else if (item.id && item.id.includes('purmi')) subInfo = "푸르미스포츠센터";
            else if (item.id && item.id.includes('sannam')) subInfo = "산남국민체육센터";

            const finalLabel = subInfo ? `${displayFacility}-${subInfo}` : displayFacility;

            const escapedQuery = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return `
            <div class="autocomplete-item" onclick="selectAutocomplete('${item.title.replace(/'/g, "\\'")}', '${inputId}')" data-idx="${idx}">
                <div class="flex items-center gap-2 overflow-hidden mr-2">
                    <i class="ph ph-magnifying-glass text-emerald-500 text-xs flex-shrink-0"></i>
                    <span class="autocomplete-keyword truncate">${item.title.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<b class="text-emerald-600 dark:text-emerald-400">$1</b>')}</span>
                </div>
                <span class="autocomplete-category">${finalLabel}</span>
            </div>`;
        }).join('');
        list.innerHTML = html;
        list.classList.remove('hidden');
        list.style.display = 'block'; // 명시적으로 보이도록 설정
        
        // 🚀 [동적 높이 겹침 방지 알고리즘] 자동완성 박스의 실시간 높이를 동적 추적하여 상세 결과를 아래로 정밀하게 밀어냄
        if (searchResults) {
            // 브라우저 렌더링 갱신 주기 내에서 정확한 높이 측정 보장
            requestAnimationFrame(() => {
                const listHeight = list.offsetHeight || 0;
                searchResults.style.setProperty('margin-top', (listHeight + 8) + 'px', 'important');
                searchResults.classList.remove('hidden');
            });
        }
    } else {
        list.classList.add('hidden');
        list.style.display = 'none';
        
        // 🚀 [PC/모바일 통합] 자동완성 비활성화 시 상세 결과창 마진을 8px로 밀착 복원
        if (searchResults) {
            searchResults.style.setProperty('margin-top', '8px', 'important');
        }
    }
};

/**
 * 🚀 [자동완성 선택 처리]
 */
window.selectAutocomplete = function(title, inputId = 'searchInput') {
    const input = document.getElementById(inputId);
    input.value = title;
    const isMobile = inputId === 'searchInputMobile';
    document.getElementById(isMobile ? 'autocompleteListMobile' : 'autocompleteList').classList.add('hidden');
    
    // 자동완성 선택 후 닫혔으므로 마진을 8px로 복구
    const searchResults = document.getElementById(isMobile ? 'searchResultsMobile' : 'searchResults');
    if (searchResults) {
        searchResults.style.setProperty('margin-top', '8px', 'important');
    }
    
    // 선택 시 상세 검색 결과창 노출
    window.performSearch(title, isMobile ? 'searchResultsMobile' : 'searchResults');
};

/**
 * 🚀 [검색 실행 본체]
 */
window.performSearch = function(query, resultContainerId) {
    window.lastSearchQuery = query;
    const container = document.getElementById(resultContainerId);
    if (!query.trim() || query.length < 2) { 
        container.classList.add('hidden'); 
        document.getElementById('reopenSearchBtn').classList.replace('flex', 'hidden');
        document.getElementById('reopenSearchDivider').classList.replace('flex', 'hidden');
        document.getElementById('searchNavigator').classList.replace('flex', 'hidden');
        return; 
    }
    const safeQuery = DOMPurify.sanitize(query.toLowerCase());
    const results = window.searchIndex.map(item => {
        let score = 0;
        const title = (item.title || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        if (title.includes(safeQuery)) score += 50;
        if (title.startsWith(safeQuery)) score += 30;
        const matches = (content.match(new RegExp(safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += matches * 2;
        return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, 10);
    
    window.currentSearchResults = results; // 네비게이션용 데이터 보관
    
    if (results.length > 0) {
        let html = `<div class="sticky top-0 z-10 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex justify-between">
            <span>검색 결과 ${results.length}건</span>
            <span class="text-emerald-500">최적 결과순</span>
        </div>`;
        html += results.map(item => {
            let snippet = item.title;
            if (item.content) {
                const idx = item.content.toLowerCase().indexOf(safeQuery);
                if (idx > -1) {
                    const start = Math.max(0, idx - 25); const end = Math.min(item.content.length, idx + 50);
                    snippet = (start > 0 ? '...' : '') + item.content.substring(start, end).replace(new RegExp(`(${safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<b class="text-emerald-600 dark:text-emerald-400">$1</b>') + (end < item.content.length ? '...' : '');
                }
            }
            return `
            <button onclick="loadContent('${item.id}', '${item.facility || '공통'}', false, '${safeQuery}'); document.getElementById('${resultContainerId}').classList.add('hidden'); document.getElementById('reopenSearchBtn').classList.replace('hidden', 'flex'); document.getElementById('reopenSearchDivider').classList.replace('hidden', 'block');" 
                class="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all focus:outline-none group">
                <div class="flex justify-between items-center mb-1">
                    <div class="font-bold text-gray-800 dark:text-gray-200 text-sm group-hover:text-emerald-600 transition-colors">${DOMPurify.sanitize(item.title)}</div>
                    <div class="flex items-center gap-2">
                        <i class="ph ph-arrow-square-out text-emerald-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0"></i>
                    </div>
                </div>
                <div class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-1">${DOMPurify.sanitize(snippet, { ALLOWED_TAGS: ['b'], ALLOWED_ATTR: ['class'] })}</div>
                <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                    <i class="ph ph-link"></i> 상세 내용 보기
                </div>
            </button>`;
        }).join('');
        container.innerHTML = html;
    } else {
        container.innerHTML = `<div class="px-4 py-8 text-center text-sm text-gray-500">결과가 없습니다.</div>`;
    }
    container.classList.remove('hidden');

    // 🚀 [v5.93] 실시간 사용성 인텔리전스 분석 검색어(Keywords) 500ms 디바운스 수집 필터 탑재
    if (window.db && query.trim().length >= 2) {
        if (!window.searchAnalyticsTimer) { window.searchAnalyticsTimer = null; }
        clearTimeout(window.searchAnalyticsTimer);
        window.searchAnalyticsTimer = setTimeout(() => {
            const cleanQuery = query.trim().toLowerCase();
            const sessionSearchKey = `sos_search_logged_${cleanQuery}`;
            
            if (!sessionStorage.getItem(sessionSearchKey)) {
                sessionStorage.setItem(sessionSearchKey, 'true');
                const keywordRef = db.collection('manual').doc('system_info').collection('analytics_keywords').doc(cleanQuery);
                
                db.runTransaction(async (transaction) => {
                    const sfDoc = await transaction.get(keywordRef);
                    if (!sfDoc.exists) {
                        transaction.set(keywordRef, {
                            keyword: cleanQuery,
                            searchCount: 1,
                            lastSearched: new Date(),
                            rankChange: 0
                        });
                    } else {
                        const newCount = (sfDoc.data().searchCount || 0) + 1;
                        transaction.update(keywordRef, {
                            searchCount: newCount,
                            lastSearched: new Date()
                        });
                    }
                }).catch(err => console.warn("[Analytics] Keywords transaction failed:", err));
            }
        }, 500);
    }
};

/**
 * 🚀 [검색 결과 재열람]
 */
window.reopenSearch = function() {
    if (window.lastSearchQuery) {
        const isMobile = window.innerWidth < 640;
        const inputId = isMobile ? 'searchInputMobile' : 'searchInput';
        const resultId = isMobile ? 'searchResultsMobile' : 'searchResults';
        const input = document.getElementById(inputId);
        input.value = window.lastSearchQuery;
        window.performSearch(window.lastSearchQuery, resultId);
        input.focus();
        input.select(); // 기존 텍스트 전체 선택 (편의성)
    }
};

/**
 * 🚀 [검색 네비게이터 상태 갱신]
 */
window.updateSearchNav = function(currentId) {
    if (window.currentSearchResults.length > 0) {
        window.currentSearchIndex = window.currentSearchResults.findIndex(item => item.id === currentId);
        const nav = document.getElementById('searchNavigator');
        const sticky = document.getElementById('stickyNav');
        
        if (window.currentSearchIndex > -1) {
            nav.classList.replace('hidden', 'flex');
            document.getElementById('prevSearchBtn').disabled = (window.currentSearchIndex === 0);
            document.getElementById('nextSearchBtn').disabled = (window.currentSearchIndex === window.currentSearchResults.length - 1);
            
            // 🚀 [피드백 반영] 네비게이터 활성화 시 하단 바 즉시 노출
            if (sticky) {
                sticky.classList.remove('opacity-0', 'invisible', 'translate-y-10');
                sticky.classList.add('opacity-100', 'visible', 'translate-y-0');
            }
        } else {
            nav.classList.replace('flex', 'hidden');
        }
    }
};

/**
 * 🚀 [검색 결과 내 키보드/터치 이동 내비게이터]
 */
window.navSearchResult = function(direction) {
    const nextIdx = window.currentSearchIndex + direction;
    if (nextIdx >= 0 && nextIdx < window.currentSearchResults.length) {
        const item = window.currentSearchResults[nextIdx];
        window.loadContent(item.id, item.facility || '공통', false, window.lastSearchQuery);
    }
};
