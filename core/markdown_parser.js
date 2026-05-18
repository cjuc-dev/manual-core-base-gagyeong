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
    
    if (safeId === 'admin_dashboard') {
        contentArea.innerHTML = `<div class='w-full h-[800px] rounded-2xl overflow-hidden shadow-lg bg-white'><iframe src='pages/admin_dashboard.html' class='w-full h-full border-0'></iframe></div>`;
        return;
    }
    if (safeId === 'safety') {
        contentArea.innerHTML = `<div class="w-full h-[700px] rounded-lg overflow-hidden border border-gray-200"><embed src="docs/체육시설 안전관리 표준매뉴얼.pdf" type="application/pdf" width="100%" height="100%" /></div>`;
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
