/**
 * 파일명: markdown_parser.js
 * 경로: core/markdown_parser.js
 * 기능 설명: 마크다운 파일(SOP, VOC, 안내문) 패치 및 marked.js를 활용한 렌더링, DOMPurify 보안 정화, 지능형 3단계 브레드크럼 빌더, 마크다운 내 특정 태그 캡슐 배지화 및 앵커 타겟 하이라이팅 스크롤
 * 작성 의도: index.html에 혼재되어 있던 500줄 이상의 비동기 라우터 및 마크다운 처리부를 단독 모듈화하여 크레딧 소모를 절감하고 유지보수를 용이하게 함
 */

// 1. 전역 카테고리 클릭 이동 및 브레드크럼 내비게이터 바인딩
window.navigateToCategory = function(category) {
    // 1. 대시보드로 안전하게 전환
    window.showDashboard();
    
    // 2. 해당하는 카테고리 아코디언 자동 개방 및 스크롤 포커싱
    let targetMenuId = '';
    let targetIconId = '';
    
    if (category === 'manual') {
        targetMenuId = 'dbManual';
        targetIconId = 'dbManualIcon';
    } else if (category === 'status') {
        targetMenuId = 'dbStatus';
        targetIconId = 'dbStatusIcon';
    } else if (category === 'voc') {
        targetMenuId = 'dbVoc';
        targetIconId = 'dbVocIcon';
    } else if (category === 'system') {
        // 시스템 문의는 페이지 단위이므로, 직접 재열람 처리
        window.loadContent('system_inquiry', 'system');
        return;
    }
    
    if (targetMenuId && targetIconId) {
        const menu = document.getElementById(targetMenuId);
        if (menu && (menu.style.maxHeight === '0px' || !menu.style.maxHeight)) {
            toggleAccordion(targetMenuId, targetIconId);
        }
        
        // 부드럽게 대시보드 뷰 영역으로 이동
        const dashboard = document.getElementById('dashboardView');
        if (dashboard) {
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// 2. 메인 대시보드 화면 전환 처리
window.showDashboard = function(isPopState = false) {
    document.getElementById('contentView').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    if (!isPopState) { history.pushState({ page: 'dashboard' }, '', window.location.pathname); }
    
    // 글로벌 서브헤더 경로 초기화 및 닫기/인쇄 버튼 숨김 (홈은 상시 노출 상태 유지)
    const breadcrumbPath = document.getElementById('breadcrumbPath');
    const closeBtn = document.getElementById('globalCloseBtn');
    const printBtn = document.getElementById('globalPrintBtn');
    if (breadcrumbPath) breadcrumbPath.innerHTML = '';
    if (closeBtn) closeBtn.classList.add('hidden');
    if (printBtn) printBtn.classList.add('hidden');
}

// 3. 브라우저 뒤로가기 / 앞으로가기(popstate) 라우팅 연동
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page === 'content') { 
        window.loadContent(e.state.id, e.state.facility || '공통', e.state.sub || null, true); 
    } else { 
        window.showDashboard(true); 
    }
});

// 4. 핵심 SPA 콘텐츠 비동기 마운트 및 마크다운 파싱 렌더링 엔진
window.loadContent = async function(contentId, facility = '공통', subCategory = null, isPopState = false, searchQuery = null) {
    if(window.innerWidth < 1024) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    }
    
    // 경로 동기화: 업데이트 히스토리는 항상 'data' 폴더에서 로드
    if (contentId === 'update') { facility = 'data'; }
    
    // 네비게이터 상태 업데이트
    if (typeof updateSearchNav === 'function') {
        updateSearchNav(contentId);
    }
    
    const isVoc = (facility === 'voc');
    const contentArea = document.getElementById('content-area');
    if (isVoc) {
        contentArea.classList.add('voc-content');
    } else {
        contentArea.classList.remove('voc-content');
    }

    document.getElementById('dashboardView').classList.add('hidden');
    document.getElementById('contentView').classList.remove('hidden');
    if (!isPopState) {
        let pushUrl = '?doc=' + encodeURIComponent(contentId) + '&facility=' + encodeURIComponent(facility);
        if (subCategory) pushUrl += '&sub=' + encodeURIComponent(subCategory);
        history.pushState({ page: 'content', id: contentId, facility: facility, sub: subCategory }, '', pushUrl);
    }
    
    const safeId = DOMPurify.sanitize(contentId);
    
    // 🚀 [v5.50] 지능형 다단계 경로 빌더 (중간 경로 클릭 및 포커싱 연동)
    let pathParts = [];
    
    // 1단계: 대분류 판별 및 카테고리 매핑
    let mainCategory = '';
    let categoryType = '';
    if (isVoc) {
        mainCategory = '시민의 소리 (VOC)';
        categoryType = 'voc';
    } else if (['cheongjuSwimming_guide', 'purmi_guide', 'youngun_sportscenter_guide', 'bokdae_sportscenter_guide', 'gagyeong_sportscenter_guide', 'sannam_sportscenter_guide'].includes(safeId)) {
        mainCategory = '시설 안내';
        categoryType = 'manual';
    } else if (['행정_매뉴얼', '기술_매뉴얼', 'safety', 'admin_fields', 'tech_fields'].includes(safeId)) {
        mainCategory = safeId === 'admin_fields' ? '행정 분야' : (safeId === 'tech_fields' ? '기술 분야' : '시설 매뉴얼');
        categoryType = 'manual';
    } else if (['update'].includes(safeId)) {
        mainCategory = '운영 현황';
        categoryType = 'status';
    } else if (safeId === 'system_inquiry') {
        mainCategory = '시스템 문의';
        categoryType = 'system';
    }
    
    if (mainCategory) {
        pathParts.push({
            label: mainCategory,
            action: `window.navigateToCategory('${categoryType}')`
        });
    }

    // 2단계: 중분류 판별 (문서 공식 한글 타이틀 매핑)
    const titleMap = {
        '행정_매뉴얼': '행정 매뉴얼', '기술_매뉴얼': '기술 매뉴얼', 'safety': '안전 표준매뉴얼',
        'cheongjuSwimming_guide': '청주수영장 안내', 'purmi_guide': '푸르미스포츠센터 안내', 
        'youngun_sportscenter_guide': '영운국민체육센터 안내', 'bokdae_sportscenter_guide': '복대국민체육센터 안내', 
        'gagyeong_sportscenter_guide': '가경국민체육센터 안내', 'sannam_sportscenter_guide': '산남국민체육센터 안내', 
        'update': '업데이트 히스토리', 'system_inquiry': '시스템 문의/요청',
        'swimming': '수영장 VOC', 'gym': '다목적체육관 VOC', 'program': '프로그램실 VOC', 'other': '기타 VOC'
    };
    
    const isFields = ['admin_fields', 'tech_fields'].includes(safeId);
    const docTitle = isFields ? DOMPurify.sanitize(facility) : (titleMap[safeId] || safeId);
    
    if (docTitle && docTitle !== mainCategory) {
        const hasTabs = ['행정_매뉴얼', '기술_매뉴얼', 'admin_fields', 'tech_fields'].includes(safeId);
        pathParts.push({
            label: docTitle,
            action: isFields ? null : (hasTabs ? `window.loadContent('${safeId}', '공통')` : `window.loadContent('${safeId}', '${facility}')`)
        });
    }

    // 3단계: 소분류 판별 (3rd-Depth 세분류 추가 및 기존 레거시 호환)
    const legacyHasTabs = ['행정_매뉴얼', '기술_매뉴얼'].includes(safeId);
    if (subCategory) {
        if (pathParts.length > 1) {
            pathParts[pathParts.length - 1].action = `window.loadContent('${safeId}', '${facility}')`;
        }
        pathParts.push({
            label: DOMPurify.sanitize(subCategory),
            action: null
        });
    } else if (legacyHasTabs && facility && facility !== '공통') {
        pathParts.push({
            label: DOMPurify.sanitize(facility),
            action: null
        });
    }

    // 4단계: 경로 및 닫기/인쇄 버튼 렌더링
    const breadcrumbPath = document.getElementById('breadcrumbPath');
    const closeBtn = document.getElementById('globalCloseBtn');
    const printBtn = document.getElementById('globalPrintBtn');
    if (breadcrumbPath && closeBtn) {
        if (pathParts.length > 0) {
            breadcrumbPath.innerHTML = pathParts.map((part, idx) => {
                const isLast = (idx === pathParts.length - 1);
                const separator = `<span class="mx-2 text-gray-300 dark:text-gray-700 shrink-0" aria-hidden="true">/</span>`;
                const element = isLast || !part.action
                    ? `<span class="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">${part.label}</span>`
                    : `<button onclick="${part.action}" class="text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-cyan-400 font-bold transition-colors focus:outline-none shrink-0" aria-label="${part.label} 바로가기">${part.label}</button>`;
                return separator + element;
            }).join('');
            closeBtn.classList.remove('hidden');
            if (printBtn) printBtn.classList.remove('hidden');
        } else {
            breadcrumbPath.innerHTML = '';
            closeBtn.classList.add('hidden');
            if (printBtn) printBtn.classList.add('hidden');
        }
    }
    
    // 검색 결과에서 왔을 경우 하단 버튼 보이기
    if (typeof lastSearchQuery !== 'undefined' && lastSearchQuery && contentId !== 'admin_dashboard') {
        document.getElementById('reopenSearchBtn').classList.replace('hidden', 'flex');
        document.getElementById('reopenSearchDivider').classList.replace('hidden', 'block');
    }
    
    let tabsHtml = '';
    const allHasTabs = ['행정_매뉴얼', '기술_매뉴얼', 'admin_fields', 'tech_fields'].includes(safeId);
    if (allHasTabs) {
        const facilitiesList = ['청주수영장', '푸르미스포츠센터', '영운국민체육센터', '복대국민체육센터', '가경국민체육센터', '산남국민체육센터'];
        
        tabsHtml = '<div class="flex flex-wrap gap-2 mb-6" role="tablist">';
        for(let fac of facilitiesList) {
            const isActive = (fac === facility);
            const isGagyeong = (fac === '가경국민체육센터');
            
            let activeClass = '';
            let badgeHtml = '';
            
            if (isActive) {
                if (isGagyeong) {
                    activeClass = 'bg-emerald-600 text-white shadow-md font-semibold';
                } else {
                    activeClass = 'bg-amber-600 text-white shadow-md font-semibold';
                    badgeHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/30 ml-1.5 align-middle">준비중</span>`;
                }
            } else {
                if (isGagyeong) {
                    activeClass = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 hover:bg-emerald-100';
                } else {
                    activeClass = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200';
                    badgeHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40 ml-1.5 align-middle">준비중</span>`;
                }
            }
            
            tabsHtml += `<button onclick="window.loadContent('${safeId}', '${fac}')" class="px-4 py-2 rounded-lg text-sm transition-all flex items-center ${activeClass}">${fac}${badgeHtml}</button>`;
        }
        tabsHtml += '</div>';
    }
    contentArea.innerHTML = tabsHtml + '<div class="py-20 text-center text-gray-400"><i class="ph ph-spinner-gap animate-spin text-4xl mb-4"></i><p>로딩 중...</p></div>';
    
    // 🚀 [v5.99] iframe 동적 높이 팽창 리사이징 엔진 (이중 스크롤 완벽 소멸)
    window.resizeAdminIframe = function(iframe) {
        if (!iframe) return;
        try {
            const setHeight = () => {
                const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (innerDoc && innerDoc.body) {
                    const newHeight = Math.max(
                        innerDoc.body.scrollHeight, 
                        innerDoc.documentElement.scrollHeight,
                        innerDoc.body.offsetHeight,
                        innerDoc.documentElement.offsetHeight
                    );
                    iframe.style.height = (newHeight + 40) + 'px';
                }
            };
            setHeight();
            iframe.addEventListener('load', setHeight);
            
            const innerWindow = iframe.contentWindow;
            const innerDoc = iframe.contentDocument || innerWindow.document;
            if (innerDoc && innerDoc.body && innerWindow.MutationObserver) {
                const observer = new innerWindow.MutationObserver(() => {
                    setHeight();
                });
                observer.observe(innerDoc.body, { attributes: true, childList: true, subtree: true });
                innerWindow.addEventListener('unload', () => observer.disconnect(), { once: true });
            }
        } catch (e) {
            console.warn("[SOS Resizer] 크로스 도메인 보안 제약 또는 오버라이드 통과:", e);
        }
    };

    if (safeId === 'admin_dashboard') {
        contentArea.innerHTML = `
        <div class='w-full rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80'>
            <iframe id='adminDashboardFrame' src='pages/admin_dashboard.html' class='w-full border-0 transition-all duration-300' style='height: 850px; min-height: 800px;' onload='window.resizeAdminIframe(this)'></iframe>
        </div>`;
        return;
    }
    if (safeId === 'safety') {
        contentArea.innerHTML = `
        <div class="w-full flex flex-col gap-6 my-4">
            <!-- 1. 숨겨진 인라인 Canvas 및 검색 통합 영역 (이제 위쪽에 전면 배치되어 즉시 읽기 가능) -->
            <div id="inlinePDFContainer" class="hidden w-full transition-all duration-300">
                <div class="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 w-full gap-4">
                    <!-- PDF 컨트롤러 및 본문 검색 통합 바 (Sticky 고정형, -mx-4 -mt-4 및 rounded-t-xl로 패딩 영역 완벽 커버) -->
                    <div class="sticky top-0 z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 -mx-4 -mt-4 p-4 rounded-t-xl bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur shadow-sm transition-all duration-300">
                        <!-- 1. 페이지 탐색 및 넓게 보기 컨트롤 -->
                        <div class="flex flex-wrap items-center gap-3">
                            <button id="prevPageBtn" onclick="window.pdfViewerPrevPage()" class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50" disabled>
                                <i class="ph ph-caret-left font-bold text-slate-700 dark:text-slate-200"></i>
                            </button>
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                                <span id="pdfCurrentPage" class="text-emerald-600 dark:text-emerald-400 font-bold">1</span> / <span id="pdfTotalPages" class="text-slate-400 dark:text-slate-500">--</span> 페이지
                            </span>
                            <button id="nextPageBtn" onclick="window.pdfViewerNextPage()" class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50" disabled>
                                <i class="ph ph-caret-right font-bold text-slate-700 dark:text-slate-200"></i>
                            </button>

                            <!-- ↔ 넓은 화면으로 보기 토글 버튼 -->
                            <button onclick="window.togglePDFWideMode()" id="pdfWideModeBtn" class="h-10 px-4 flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all whitespace-nowrap">
                                <i class="ph ph-arrows-out-line text-sm" id="pdfWideModeBtnIcon"></i>
                                <span id="pdfWideModeBtnText" class="whitespace-nowrap">넓은 화면으로 보기</span>
                            </button>

                            <!-- ❌ 뷰어 닫기 버튼 (사용자 편의성 향상) -->
                            <button onclick="window.toggleInlinePDFViewer()" class="h-10 px-4 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-xl shadow-sm border border-rose-200 dark:border-rose-900/50 transition-all whitespace-nowrap">
                                <i class="ph ph-x-circle text-sm"></i>
                                <span class="whitespace-nowrap">뷰어 닫기</span>
                            </button>
                        </div>
                        
                        <!-- 2. 실시간 초고속 본문 검색창 (인풋박스와 버튼 높이를 h-10으로 동일하게 설계하여 수평 완벽 일치) -->
                        <div class="flex items-center gap-2 flex-1 max-w-md w-full h-10">
                            <div class="relative w-full h-10 flex items-center">
                                <input type="text" id="pdfSearchInput" placeholder="매뉴얼 전체 210페이지 본문 검색..." 
                                    class="block w-full h-full pl-10 pr-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                                    onkeypress="if(event.key === 'Enter') window.searchPDFText()">
                                <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></i>
                            </div>
                            <button onclick="window.searchPDFText()" class="h-10 px-5 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-emerald-600/10 transition-all shrink-0 whitespace-nowrap">
                                검색
                            </button>
                        </div>
                    </div>

                    <!-- 3. 검색 결과 영역 (기본 숨김) -->
                    <div id="pdfSearchResultsArea" class="hidden bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 max-h-[250px] overflow-y-auto">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <i class="ph ph-list-bullets text-sm"></i>
                                본문 검색 결과 (<span id="pdfSearchCount" class="text-emerald-600 dark:text-emerald-400 font-black">0</span>건)
                            </h4>
                            <button onclick="window.closePDFSearchResults()" class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold whitespace-nowrap">결과 닫기</button>
                        </div>
                        <div id="pdfSearchResultsList" class="flex flex-col gap-2"></div>
                    </div>

                    <!-- 4. PDF 캔버스 렌더링 영역 (로딩바 포함, items-start 추가로 캔버스가 수직으로 늘어나는 현상 방지) -->
                    <div class="relative w-full overflow-auto bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800/80 flex justify-center items-start p-4 shadow-inner" style="max-height: 800px; min-height: 500px;">
                        <div id="pdfViewerLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10">
                            <i class="ph ph-spinner-gap animate-spin text-4xl text-emerald-500 mb-2"></i>
                            <p id="pdfViewerLoadingText" class="text-sm font-bold text-slate-600 dark:text-slate-300">PDF.js 스마트 렌더러 로딩 및 캔버스 드로잉 중...</p>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">대용량 파일이므로 최초 기동 시 2~3초 가량 소요될 수 있습니다.</p>
                        </div>
                        <canvas id="pdfViewerCanvas" class="shadow-xl max-w-full h-auto rounded border border-slate-300 dark:border-slate-800" style="height: auto !important;"></canvas>
                    </div>
                </div>
            </div>

            <!-- 2. 프리미엄 메인 안내 및 조작 카드 (w-full로 확장하여 주황색 영역 가득 채움) -->
            <div class="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-xl w-full transition-all hover:shadow-2xl">
                <!-- PDF 아이콘 애니메이션 헤더 -->
                <div class="relative w-20 h-20 mb-6 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400 group">
                    <i class="ph ph-file-pdf text-5xl transition-transform group-hover:scale-110 animate-pulse"></i>
                    <div class="absolute -top-1 -right-1 flex h-4 w-4">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </div>
                </div>
                
                <!-- 타이틀 & 메타데이터 -->
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">체육시설 안전관리 표준매뉴얼 (PDF)</h3>
                <p class="text-xs text-slate-400 dark:text-slate-500 mb-6 flex gap-3">
                    <span>파일 크기: 19.1 MB</span>
                    <span>|</span>
                    <span>형식: PDF Document</span>
                    <span>|</span>
                    <span>권장 사항: 새 창 열람</span>
                </p>
                
                <!-- 프리미엄 안내 텍스트 -->
                <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-100 dark:border-slate-700 rounded-xl p-5 mb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center shadow-inner">
                    본 매뉴얼은 <strong>대용량 공식 행정 문서</strong>로, 사용하시는 브라우저(Microsoft Edge 등)의 보안 및 차단 정책에 따라 화면 내 뷰어가 원활히 열리지 않을 수 있습니다. 
                    <br>
                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">아래의 프리미엄 버튼을 사용해 안전하고 신속하게 열람하세요.</span>
                </div>
                
                <!-- 조작 버튼 그룹 (프리미엄 3-버튼 배치 전환, whitespace-nowrap 추가로 한 줄 정렬 보장) -->
                <div class="flex flex-col md:flex-row gap-3.5 w-full justify-center px-4">
                    <!-- 새 창에서 바로보기 -->
                    <a href="data/manual/sports/sports_facility_safety_standards_manual.pdf" target="_blank"
                        class="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 text-center flex-1 whitespace-nowrap">
                        <i class="ph ph-arrow-square-out text-lg"></i>
                        <span class="whitespace-nowrap">새 창에서 열기 (추천)</span>
                    </a>
                    
                    <!-- 이 페이지 안에서 바로 보기 -->
                    <button onclick="window.toggleInlinePDFViewer()" id="mainTogglePDFBtn"
                        class="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 text-center flex-1 whitespace-nowrap">
                        <i class="ph ph-book-open text-lg" id="mainTogglePDFBtnIcon"></i>
                        <span id="mainTogglePDFBtnText" class="whitespace-nowrap">화면 내에서 바로 읽기</span>
                    </button>

                    <!-- 즉시 다운로드 -->
                    <a href="data/manual/sports/sports_facility_safety_standards_manual.pdf" download="체육시설_안전관리_표준매뉴얼.pdf"
                        class="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 text-center flex-1 whitespace-nowrap">
                        <i class="ph ph-download-simple text-lg"></i>
                        <span class="whitespace-nowrap">다운로드 받기</span>
                    </a>
                </div>
        </div>`;
        return;
    }
    
    // 🚀 [v5.52] 시스템 문의/요청 단독 마크업 HTML 인젝션 및 자바스크립트 동적 리이벨류에이터
    if (safeId === 'system_inquiry') {
        try {
            const response = await fetch('pages/helpdesk/system_inquiry.html', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`시스템 문의 화면 로드 실패 (${response.status})`);
            }
            const html = await response.text();
            contentArea.innerHTML = tabsHtml + html;
            
            // HTML 내부에 수록된 스크립트 요소들을 브라우저가 실행하도록 동적 재평가 기동
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const scriptTags = tempDiv.querySelectorAll('script');
            scriptTags.forEach(script => {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
                newScript.remove(); // 메모리 해제 및 노출 방지
            });
            return;
        } catch (err) {
            throw new Error(`시스템 문의 모듈 연동 실패: ${err.message}`);
        }
    }
    
    try {
        let fetchPath = '';
        if (isVoc) {
            fetchPath = `data/voc/${safeId}.md`;
        } else if (facility === 'system') {
            fetchPath = `data/system/${safeId}.md`;
        } else if (facility === 'data') {
            fetchPath = `data/${safeId}.md`;
        } else if (safeId === 'admin_fields') {
            const folderMap = { '가경국민체육센터': 'gagyeong' };
            const folder = folderMap[facility] || 'gagyeong';
            fetchPath = `data/manual/admin/${folder}/0. ${facility}_행정분야_인덱스.md`;
        } else if (safeId === 'tech_fields') {
            const folderMap = { '가경국민체육센터': 'gagyeong' };
            const folder = folderMap[facility] || 'gagyeong';
            fetchPath = `data/manual/tech/${folder}/0. ${facility}_기술분야_인덱스.md`;
        } else {
            fetchPath = legacyHasTabs ? `data/facilities/${safeId}_${facility}.md` : `data/facilities/${safeId}.md`;
        }
        const safeFetchPath = encodeURI(fetchPath);
        const response = await fetch(safeFetchPath, { cache: 'no-store' });
        
        let markdownText = '';
        if (!response.ok) {
            if (isFields) {
                const fieldName = safeId === 'admin_fields' ? '행정분야' : '기술분야';
                markdownText = `# 🏢 ${facility} ${fieldName} 매뉴얼\n\n•   •   •\n\n> [!NOTE]\n> **Smart Operations Suite (SOS) 안내**\n> 현재 **${facility}**의 **${fieldName}** 상세 지침 및 마스터 업무 데이터는 **이관 준비 중**입니다.\n> 공사 산하 각 시설별 표준 운영 절차(SOP) 통합 검증 작업이 완료되는 대로 순차적으로 탑재될 예정이오니 참고해 주시기 바랍니다.\n\n---\n*청주도시공사 Smart Operations Suite (SOS) 개발단*`;
            } else {
                throw new Error(`서버 응답 오류 (${response.status}): ${fetchPath} 파일을 찾을 수 없습니다.`);
            }
        } else {
            markdownText = await response.text();
        }
        
        // 최종 업데이트 일자 자동화 및 버저닝 노이즈 제거
        try {
            let updateDateStr = '2026-05-14';
            const lastModified = response.headers.get('Last-Modified');
            if (lastModified) {
                const modDate = new Date(lastModified);
                if (!isNaN(modDate.getTime())) {
                    const yyyy = modDate.getFullYear();
                    const mm = String(modDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(modDate.getDate()).padStart(2, '0');
                    updateDateStr = `${yyyy}-${mm}-${dd}`;
                }
            }
            markdownText = markdownText.replace(/최종 업데이트:\s*\d{4}[-./]\d{2}[-./]\d{2}(?:\s*\([^)]*\))?/g, `최종 업데이트: ${updateDateStr}`);
        } catch (e) {
            console.error("최종 업데이트 날짜 동적 파싱 실패:", e);
        }
        
        // 🚀 [구글 Firestore 실시간 연동 문의 게시판 렌더러]
        if (contentId === 'system_inquiry') {
            let inquiryHtml = `<div class="mb-10">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <i class="ph ph-chat-circle-dots text-emerald-500"></i>
                        시스템 문의/요청 <span class="text-sm font-normal text-slate-400 ml-2">(System Inquiry)</span>
                    </h1>
                    <button onclick="openInquiryModal()" class="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0"><i class="ph ph-pencil-line"></i> 문의하기</button>
                </div>
                <p class="info-notice-box">
                    <i class="ph ph-info text-emerald-500 text-lg"></i>
                    시스템 이용 중 불편한 점이나 개선 요청사항을 남겨주세요. 관리자가 확인 후 성실히 답변해 드립니다.
                </p>
            </div>`;

            try {
                if (window.db) {
                    const snap = await db.collection('manual').doc('system_info').collection('inquiries').orderBy('id', 'desc').get();
                    
                    if (snap.empty) {
                        inquiryHtml += `<div class="px-6 py-12 text-center bg-gray-50 dark:bg-gray-800/10 rounded-2xl border border-gray-100 dark:border-gray-800/60 text-gray-400 dark:text-gray-500">등록된 문의사항이 없습니다. 첫 문의를 등록해 보세요!</div>`;
                    } else {
                        snap.forEach(doc => {
                            const req = doc.data();
                            const firestoreId = doc.id;
                            
                            const statusBadge = req.status === '완료' ? '<span class="badge-complete">완료</span>' : 
                                                (req.status === '처리중' ? '<span class="badge-processing">처리중</span>' : 
                                                '<span class="badge-received">접수중</span>');
                            
                            const cleanTitle = DOMPurify.sanitize(req.title || '제목 없음');
                            const cleanAuthor = DOMPurify.sanitize(req.author || '익명');
                            const cleanContent = DOMPurify.sanitize(req.content || '').replace(/\n/g, '<br>');
                            const cleanDate = DOMPurify.sanitize(req.date || '');
                            const cleanCategory = DOMPurify.sanitize(req.category || '기타');
                            
                            let replyBoxHtml = '';
                            if (req.adminResponse) {
                                replyBoxHtml = `
                                    <div class="admin-reply-box">
                                        <div class="admin-reply-header">
                                            <i class="ph ph-shield-check"></i>
                                            <span>SOS 시스템 관리자 답변</span>
                                        </div>
                                        <div class="admin-reply-content">
                                            ${DOMPurify.sanitize(req.adminResponse).replace(/\n/g, '<br>')}
                                        </div>
                                    </div>
                                `;
                            }
                            
                            inquiryHtml += `
                                <div class="inquiry-card">
                                    <div class="inquiry-header">
                                        <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10.5px] font-black rounded-lg border border-slate-200/50 dark:border-slate-700/50">${cleanCategory}</span>
                                        <div class="flex items-center gap-2">
                                            ${statusBadge}
                                            <button onclick="openAdminReplyModalDirect('${firestoreId}')" class="text-xs font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 hover:underline px-2 py-1">답변</button>
                                            <button onclick="deleteInquiryDirect('${firestoreId}')" class="text-xs font-bold text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:underline px-2 py-1">삭제</button>
                                        </div>
                                    </div>
                                    <div class="inquiry-body">
                                        <div class="inquiry-meta">
                                            <span><i class="ph ph-user"></i> ${cleanAuthor}</span>
                                            <span><i class="ph ph-calendar"></i> ${cleanDate}</span>
                                        </div>
                                        <h4 class="text-lg font-black text-slate-800 dark:text-white mb-3">${cleanTitle}</h4>
                                        <p class="inquiry-content">${cleanContent}</p>
                                        ${replyBoxHtml}
                                    </div>
                                </div>
                            `;
                        });
                    }
                } else {
                    inquiryHtml += `<div class="p-6 text-center text-red-500 font-bold">클라우드 DB 서버 연결 실패</div>`;
                }
            } catch (err) {
                console.error("Firestore 실시간 문의 목록 패치 실패:", err);
                inquiryHtml += `<div class="p-6 text-center text-red-500 font-bold">데이터 로드 실패: ${err.message}</div>`;
            }

            contentArea.innerHTML = inquiryHtml;
            return;
        }

        // 일반 마크다운 파싱 렌더링
        let rawHtml = marked.parse(markdownText);
        let safeHtml = DOMPurify.sanitize(rawHtml);
        
        // 🚀 [지능형 다목적 업데이트 구분 배지화 엔진]
        if (safeId === 'update') {
            const badgeStyles = {
                '시스템/UI': 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30',
                '대시보드/UI': 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-900/30',
                '시스템/운영': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30',
                'UI/UX': 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30',
                '보안/인프라': 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30',
                '성능/최적화': 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30',
                '피드백/패치': 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-900/30'
            };

            safeHtml = safeHtml.replace(/\[([^\]]+)\]/g, (match, tag) => {
                const style = badgeStyles[tag] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700';
                return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-black tracking-wide border shadow-sm mr-1.5 align-middle select-none ${style}">${tag}</span>`;
            });
        }
        
        // 검색 하이라이팅 마킹
        if (searchQuery && searchQuery.trim().length >= 2) {
            const regex = new RegExp(`(${searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
            safeHtml = safeHtml.replace(/(<[^>]+>)|([^<]+)/g, (match, g1, g2) => {
                if (g1) return g1;
                return g2.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-white rounded px-0.5 font-bold search-match">$1</mark>');
            });
        }

        // 공감(좋아요) 컴포넌트 비동기 호출 & 마운트
        let likeSectionHtml = '';
        if (typeof generateLikeSectionHTML === 'function') {
            likeSectionHtml = await generateLikeSectionHTML(safeId);
        }

        contentArea.innerHTML = tabsHtml + `
            <div id="markdown-body" class="prose dark:prose-invert max-w-none prose-emerald lg:prose-lg">
                ${safeHtml}
            </div>
            ${likeSectionHtml}
        `;

        // 🚀 [시민의 소리 아코디언 매핑 엔진]
        if (isVoc) {
            const mdBody = document.getElementById('markdown-body');
            const mainTitle = mdBody.querySelector('h1');
            if (mainTitle) {
                mainTitle.className = 'text-sm font-semibold mb-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b pb-2';
            }

            const headers = mdBody.querySelectorAll('h2');
            headers.forEach((h, idx) => {
                const content = [];
                let curr = h.nextElementSibling;
                while (curr && curr.tagName !== 'H2') {
                    content.push(curr.outerHTML);
                    const next = curr.nextElementSibling;
                    curr.remove();
                    curr = next;
                }
                
                let hTitle = h.innerHTML;
                let tagClass = 'tag-default';
                
                if (hTitle.includes('[청주수영장]')) {
                    tagClass = 'tag-swimming';
                    hTitle = hTitle.replace('[청주수영장]', `<span class="voc-tag ${tagClass}">청주수영장</span>`);
                } else if (hTitle.includes('[가경국민체육센터]')) {
                    tagClass = 'tag-gagyeong';
                    hTitle = hTitle.replace('[가경국민체육센터]', `<span class="voc-tag ${tagClass}">가경국민체육센터</span>`);
                } else if (hTitle.includes('[복대국민체육센터]')) {
                    tagClass = 'tag-bokdae';
                    hTitle = hTitle.replace('[복대국민체육센터]', `<span class="voc-tag ${tagClass}">복대국민체육센터</span>`);
                } else if (hTitle.includes('[영운국민체육센터]')) {
                    tagClass = 'tag-youngun';
                    hTitle = hTitle.replace('[영운국민체육센터]', `<span class="voc-tag ${tagClass}">영운국민체육센터</span>`);
                } else if (hTitle.includes('[공통]')) {
                    tagClass = 'tag-common';
                    hTitle = hTitle.replace('[공통]', `<span class="voc-tag ${tagClass}">공통</span>`);
                } else if (hTitle.match(/\[(.*?)\]/)) {
                    hTitle = hTitle.replace(/\[(.*?)\]/, `<span class="voc-tag ${tagClass}">$1</span>`);
                }
                
                const wrapper = document.createElement('div');
                wrapper.className = 'mb-2.5 overflow-hidden';
                h.className = 'w-full text-left px-5 py-3.5 bg-gray-50/70 dark:bg-gray-800/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 flex justify-between items-center cursor-pointer text-base font-bold text-gray-800 dark:text-white transition-all rounded-xl border border-gray-100 dark:border-gray-800/80 focus:outline-none';
                h.style.setProperty('margin', '0', 'important');
                h.innerHTML = `<span>${hTitle}</span><i class="ph ph-caret-down transition-transform"></i>`;
                
                const body = document.createElement('div');
                body.className = 'hidden mt-2 p-6 bg-emerald-50/15 dark:bg-emerald-950/10 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/5 text-gray-700 dark:text-gray-300';
                body.innerHTML = content.join('');
                
                h.onclick = () => {
                    body.classList.toggle('hidden');
                    h.querySelector('i').classList.toggle('rotate-180');
                };
                
                body.querySelectorAll('table').forEach(tbl => tbl.classList.add('voc-table'));
                
                h.parentNode.insertBefore(wrapper, h);
                wrapper.appendChild(h);
                wrapper.appendChild(body);
            });
        }

        // 🚀 [3단계 앵커 스크롤 & 글로우 이펙트]
        if (subCategory) {
            let attempts = 0;
            const maxAttempts = 30;
            
            const scrollInterval = setInterval(() => {
                const headers = document.querySelectorAll('#content-area h1, #content-area h2, #content-area h3, #content-area h4, #content-area h5, #content-area h6');
                let targetEl = null;
                
                for (let el of headers) {
                    const cleanText = el.textContent.replace(/[\s#\d.ㆍ•*-]/g, '').trim();
                    const cleanSub = subCategory.replace(/[\s]/g, '').trim();
                    if (cleanText && cleanSub && (cleanText.includes(cleanSub) || cleanSub.includes(cleanText))) {
                        targetEl = el;
                        break;
                    }
                }
                
                attempts++;
                
                if (targetEl) {
                    clearInterval(scrollInterval);
                    
                    setTimeout(() => {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        targetEl.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                        const originalBg = targetEl.style.backgroundColor || '';
                        const originalShadow = targetEl.style.boxShadow || '';
                        
                        targetEl.style.backgroundColor = 'rgba(251, 191, 36, 0.15)'; 
                        targetEl.style.boxShadow = '0 0 0 6px rgba(251, 191, 36, 0.25)';
                        targetEl.style.borderRadius = '8px';
                        
                        setTimeout(() => {
                            targetEl.style.backgroundColor = originalBg;
                            targetEl.style.boxShadow = originalShadow;
                        }, 1500);
                    }, 50);
                } else if (attempts >= maxAttempts) {
                    clearInterval(scrollInterval);
                    console.warn(`[SOS Router] 3단계 앵커 탐색 실패: ${subCategory}`);
                }
            }, 100);
        } else if (searchQuery) {
            setTimeout(() => {
                const firstMatch = document.querySelector('.search-match');
                if (firstMatch) {
                    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }

        // 🚀 [v5.93] 실시간 사용성 인텔리전스 분석 조회수(Views) 수집 필터 탑재
        if (window.db && safeId !== 'system_inquiry') {
            try {
                const today = new Date().toLocaleDateString();
                const viewKey = `sos_view_${safeId}_${facility}`;
                const lastViewedDate = localStorage.getItem(viewKey);
                
                if (lastViewedDate !== today) {
                    localStorage.setItem(viewKey, today);
                    const viewRef = window.db.collection('manual').doc('system_info').collection('analytics_views').doc(safeId);
                    
                    window.db.runTransaction(async (transaction) => {
                        const sfDoc = await transaction.get(viewRef);
                        const cleanTitle = docTitle || safeId;
                        if (!sfDoc.exists) {
                            transaction.set(viewRef, {
                                contentId: safeId,
                                title: cleanTitle,
                                facility: facility,
                                viewCount: 1,
                                lastViewed: new Date()
                            });
                        } else {
                            const newCount = (sfDoc.data().viewCount || 0) + 1;
                            transaction.update(viewRef, {
                                viewCount: newCount,
                                lastViewed: new Date(),
                                title: cleanTitle
                            });
                        }
                    }).catch(err => console.warn("[Analytics] Views transaction failed:", err));
                }
            } catch (analyticsErr) {
                console.warn("[Analytics] Views gathering error:", analyticsErr);
            }
        }
    } catch (err) {
        contentArea.innerHTML = tabsHtml + `
            <div class="text-center py-20 text-gray-500">
                <i class="ph ph-warning-circle text-5xl mb-4 text-amber-500"></i>
                <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">문서 로딩 실패</h2>
                <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700 max-w-xl mx-auto">
                    <p class="font-mono text-left break-all text-red-500">${err.message}</p>
                    <p class="mt-2 text-xs text-gray-400 text-left">※ 원인: 서버 미작동, 파일 경로 불일치, 또는 네트워크 연결 오류</p>
                </div>
                <button onclick="location.reload()" class="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg">페이지 새로고침</button>
            </div>
        `;
    }
    document.getElementById('mainScrollArea').scrollTop = 0;
}

// 🚀 [v6.00] 대용량 PDF 문서 브라우저 보안 우회 토글러 및 JS 엔진 구동부
window.pdfViewerScale = 1.3; // 전역 스케일 설정 (넓은 화면 토글 대응)

window.toggleInlinePDFViewer = function() {
    const container = document.getElementById('inlinePDFContainer');
    const mainBtnText = document.getElementById('mainTogglePDFBtnText');
    const mainBtnIcon = document.getElementById('mainTogglePDFBtnIcon');
    const mainBtn = document.getElementById('mainTogglePDFBtn');
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        if (mainBtnText) mainBtnText.innerText = '인라인 뷰어 접기';
        if (mainBtnIcon) mainBtnIcon.className = 'ph ph-eye-closed text-lg';
        if (mainBtn) {
            mainBtn.classList.remove('from-slate-700', 'to-slate-800', 'hover:from-slate-600', 'hover:to-slate-700');
            mainBtn.classList.add('from-rose-600', 'to-rose-700', 'hover:from-rose-500', 'hover:to-rose-600');
        }
        
        // PDF.js 캔버스 뷰어 초기화 작동
        window.initPDFJSViewer();
        
        // 스무스 스크롤 이동
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    } else {
        container.classList.add('hidden');
        if (mainBtnText) mainBtnText.innerText = '화면 내에서 바로 읽기';
        if (mainBtnIcon) mainBtnIcon.className = 'ph ph-book-open text-lg';
        if (mainBtn) {
            mainBtn.classList.remove('from-rose-600', 'to-rose-700', 'hover:from-rose-500', 'hover:to-rose-600');
            mainBtn.classList.add('from-slate-700', 'to-slate-800', 'hover:from-slate-600', 'hover:to-slate-700');
        }
    }
};

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;

// ↔ 🚀 [v6.00] 넓은 화면 Breakout 모드 토글러 및 고해상도 리스케일링 제어
window.togglePDFWideMode = function() {
    const container = document.getElementById('inlinePDFContainer');
    const inner = container.querySelector('.flex.flex-col');
    const btn = document.getElementById('pdfWideModeBtn');
    const btnText = document.getElementById('pdfWideModeBtnText');
    const btnIcon = document.getElementById('pdfWideModeBtnIcon');
    
    if (inner.classList.contains('breakout-wide')) {
        // 기본 뷰로 축소
        inner.classList.remove('breakout-wide');
        inner.style.width = '';
        inner.style.maxWidth = '';
        inner.style.position = '';
        inner.style.left = '';
        inner.style.right = '';
        inner.style.transform = '';
        
        if (btnText) btnText.innerText = '넓은 화면으로 보기';
        if (btnIcon) btnIcon.className = 'ph ph-arrows-out-line text-sm';
        
        window.pdfViewerScale = 1.3; // 기본 배율
        if (pdfDoc) window.renderPDFPage(pageNum);
    } else {
        // 와이드 뷰 확장 (CSS Breakout 기법 적용)
        inner.classList.add('breakout-wide');
        inner.style.width = '95vw';
        inner.style.maxWidth = '1420px';
        inner.style.position = 'relative';
        inner.style.left = '50%';
        inner.style.right = '50%';
        inner.style.transform = 'translateX(-50%)';
        
        if (btnText) btnText.innerText = '기본 화면으로 보기';
        if (btnIcon) btnIcon.className = 'ph ph-arrows-in-line text-sm';
        
        window.pdfViewerScale = 1.85; // 와이드 배율 (초고해상도 메이저 증가)
        if (pdfDoc) window.renderPDFPage(pageNum);
    }
};

// 🔍 [v6.00] HWP 변환 PDF 한글 자모 깨짐 복구 필터 엔진
window.cleanKoreanPDFText = function(text) {
    if (!text) return "";
    return text
        // 깨진 특정 명사 단어 복구
        .replace(/체육[bp]설/g, "체육시설")
        .replace(/체육[eè]시설/g, "체육시설")
        .replace(/체[eè]시설/g, "체육시설")
        .replace(/체[eè]관광부/g, "체육관광부")
        .replace(/체[eè]육/g, "체육")
        .replace(/소[çc]자/g, "소유자")
        .replace(/관[bp]자/g, "관리자")
        
        // 캐릭터 단위 복합 교정
        .replace(/ç/g, "유")
        .replace(/è/g, "육")
        .replace(/[bp]설/g, "시설")
        .replace(/체e/g, "체육")
        .replace(/관p/g, "관리")
        
        // HWP 변환 깨진 특수 한자(중국어 글자) 제거
        .replace(/[毅毂贴縿絿]/g, "")
        // 자음 단독 분리 오류 보정 (문맥상 어색한 ㄷ, ㄹ 단독 노출 제거)
        .replace(/\s*[ㄷㄹd]\s*/g, " ")
        .trim();
};

window.initPDFJSViewer = function() {
    const url = 'data/manual/sports/sports_facility_safety_standards_manual.pdf';
    
    // 1. PDF.js 라이브러리 및 워커 동적 로딩
    if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
        script.onload = () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            window.loadPDFDocument(url);
        };
        script.onerror = () => {
            document.getElementById('pdfViewerLoading').innerHTML = `
                <i class="ph ph-warning-circle text-4xl text-red-500 mb-2"></i>
                <p class="text-sm text-red-500 font-bold">인라인 뷰어 로드 실패 (CDN 연결 오류)</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">네트워크가 끊겼거나 방화벽에 의해 스크립트가 차단되었습니다. 상단 [새 창에서 바로 읽기] 버튼을 사용하십시오.</p>
            `;
        };
        document.head.appendChild(script);
    } else {
        window.loadPDFDocument(url);
    }
};

window.loadPDFDocument = function(url) {
    const loadingEl = document.getElementById('pdfViewerLoading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdfDoc = pdf;
        document.getElementById('pdfTotalPages').innerText = pdf.numPages;
        
        // 페이지 렌더링 시작
        pageNum = 1;
        window.renderPDFPage(pageNum);
    }).catch(err => {
        console.error("PDF.js load failed:", err);
        if (loadingEl) {
            loadingEl.innerHTML = `
                <i class="ph ph-warning-circle text-4xl text-red-500 mb-2"></i>
                <p class="text-sm text-red-500 font-bold">PDF 파일 로드 오류</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">${err.message}</p>
            `;
        }
    });
};

window.renderPDFPage = function(num) {
    pageRendering = true;
    const loadingEl = document.getElementById('pdfViewerLoading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    document.getElementById('pdfCurrentPage').innerText = num;
    
    pdfDoc.getPage(num).then(page => {
        const canvas = document.getElementById('pdfViewerCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: window.pdfViewerScale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(() => {
            pageRendering = false;
            if (loadingEl) loadingEl.classList.add('hidden');
            
            // 버튼 활성화/비활성화
            document.getElementById('prevPageBtn').disabled = (num <= 1);
            document.getElementById('nextPageBtn').disabled = (num >= pdfDoc.numPages);
            
            if (pageNumPending !== null) {
                window.renderPDFPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
};

window.pdfViewerPrevPage = function() {
    if (pageNum <= 1 || pageRendering) return;
    pageNum--;
    window.renderPDFPage(pageNum);
};

window.pdfViewerNextPage = function() {
    if (pageNum >= pdfDoc.numPages || pageRendering) return;
    pageNum++;
    window.renderPDFPage(pageNum);
};

// 🔍 🚀 [v6.00] 초고속 PDF 병렬 본문 검색 엔진 구현 + 자동 글자 깨짐 보정 스캔
window.searchPDFText = async function() {
    const input = document.getElementById('pdfSearchInput');
    const query = input.value.trim();
    if (!query) {
        alert('검색어를 입력해 주세요.');
        return;
    }
    
    const resultsArea = document.getElementById('pdfSearchResultsArea');
    const resultsList = document.getElementById('pdfSearchResultsList');
    const countEl = document.getElementById('pdfSearchCount');
    
    resultsArea.classList.remove('hidden');
    resultsList.innerHTML = `<div class="py-4 text-center text-sm text-slate-400 dark:text-slate-500"><i class="ph ph-spinner-gap animate-spin text-xl mr-2 inline-block align-middle"></i>전체 ${pdfDoc.numPages}페이지 본문 초고속 검색 및 깨짐 보정 중...</div>`;
    
    try {
        let results = [];
        const promises = [];
        
        // 병렬 비동기 본문 텍스트 마이닝 기법 적용
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            promises.push(
                pdfDoc.getPage(i).then(async (page) => {
                    const textContent = await page.getTextContent();
                    const rawPageText = textContent.items.map(item => item.str).join(' ');
                    
                    // 1. 원본 텍스트에 한글 깨짐 복구 필터 주입
                    const pageText = window.cleanKoreanPDFText(rawPageText);
                    
                    if (pageText.toLowerCase().includes(query.toLowerCase())) {
                        const idx = pageText.toLowerCase().indexOf(query.toLowerCase());
                        let snippet = pageText.substring(Math.max(0, idx - 45), Math.min(pageText.length, idx + 45)).trim();
                        
                        // 안전한 HTML 이스케이프 및 하이라이팅 마크 주입
                        snippet = snippet.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                        snippet = snippet.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark class="bg-yellow-200 dark:bg-amber-800 text-slate-900 dark:text-white px-0.5 rounded font-bold">$1</mark>');
                        
                        return {
                            pageNum: i,
                            snippet: snippet
                        };
                    }
                    return null;
                })
            );
        }
        
        const allResults = await Promise.all(promises);
        results = allResults.filter(r => r !== null);
        
        countEl.innerText = results.length;
        
        if (results.length === 0) {
            resultsList.innerHTML = `<div class="py-4 text-center text-sm text-slate-400 dark:text-slate-500">검색 결과가 없습니다.</div>`;
        } else {
            resultsList.innerHTML = results.map(r => `
                <button onclick="window.gotoPDFPageAndHighlight(${r.pageNum})" 
                    class="w-full text-left p-3 hover:bg-emerald-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 transition-all flex items-start gap-4">
                    <span class="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-md shrink-0">${r.pageNum}페이지</span>
                    <span class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">${r.snippet}</span>
                </button>
            `).join('');
        }
    } catch (err) {
        console.error("PDF Search failed:", err);
        resultsList.innerHTML = `<div class="py-4 text-center text-sm text-red-500 font-bold">검색 중 오류가 발생했습니다: ${err.message}</div>`;
    }
};

window.closePDFSearchResults = function() {
    document.getElementById('pdfSearchResultsArea').classList.add('hidden');
};

window.gotoPDFPageAndHighlight = function(pageNum) {
    pageNum = parseInt(pageNum);
    if (isNaN(pageNum)) return;
    pageNum = Math.max(1, Math.min(pageNum, pdfDoc.numPages));
    window.renderPDFPage(pageNum);
};
