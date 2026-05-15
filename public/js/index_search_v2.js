// 검색 기능 스크립트 - 모바일 최적화 및 키보드 네비게이션 추가
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let selectedIndex = -1;
    let currentResults = [];
    
    // 검색 데이터 정의
    const searchData = [
        // --- 1. 청주수영장 ---
        { title: '청주수영장 바로가기', category: '시설', id: 'cheongjuSwimming_guide', keywords: '수영장, 청주, 안내, 메인' },
        { title: '청주수영장 운영 시간', category: '운영시간', id: 'cheongjuSwimming_guide', keywords: '시간, 오픈, 마감, 평일, 주말' },
        { title: '청주수영장 휴장일 안내', category: '휴장일', id: 'cheongjuSwimming_guide', keywords: '휴관, 쉬는날, 공휴일, 정기휴장' },
        { title: '청주수영장 연락처', category: '연락처', id: 'cheongjuSwimming_guide', keywords: '전화번호, 문의, 팩스, 데스크' },
        { title: '청주수영장 시설 상세', category: '시설안내', id: 'cheongjuSwimming_guide', keywords: '주차장, 샤워실, 락커, 화장실, 편의시설' },
        { title: '청주수영장 이용 안내', category: '이용안내', id: 'cheongjuSwimming_guide', keywords: '입장, 규칙, 복장, 준비물, 유의사항' },
        { title: '청주수영장 강습 프로그램', category: '프로그램', id: 'cheongjuSwimming_guide', keywords: '강습, 수영교실, 아쿠아로빅, 반편성, 진도' },
        { title: '청주수영장 이용 요금', category: '이용요금', id: 'cheongjuSwimming_guide', keywords: '가격, 비용, 일일입장, 월회원' },
        { title: '청주수영장 감면/할인', category: '할인안내', id: 'cheongjuSwimming_guide', keywords: '감면, 할인, 국가유공자, 다자녀, 경로' },

        // --- 2. 푸르미스포츠센터 ---
        { title: '푸르미스포츠센터 바로가기', category: '시설', id: 'purmi_guide', keywords: '푸르미, 스포츠, 센터, 수영, 찜질방' },
        { title: '푸르미 운영 시간', category: '운영시간', id: 'purmi_guide', keywords: '시간, 오픈, 마감' },
        { title: '푸르미 휴장일 안내', category: '휴장일', id: 'purmi_guide', keywords: '휴관, 쉬는날' },
        { title: '푸르미 연락처', category: '연락처', id: 'purmi_guide', keywords: '전화번호, 문의' },
        { title: '푸르미 시설 상세', category: '시설안내', id: 'purmi_guide', keywords: '주차, 샤워, 락커' },
        { title: '푸르미 이용 안내', category: '이용안내', id: 'purmi_guide', keywords: '입장, 규칙' },
        { title: '푸르미 강습 프로그램', category: '프로그램', id: 'purmi_guide', keywords: '강습, 수영, 헬스, 배드민턴' },
        { title: '푸르미 이용 요금', category: '이용요금', id: 'purmi_guide', keywords: '가격, 비용' },
        { title: '푸르미 감면/할인', category: '할인안내', id: 'purmi_guide', keywords: '감면, 할인' },

        // --- 3. 영운국민체육센터 ---
        { title: '영운국민체육센터 바로가기', category: '시설', id: 'youngun_sportscenter_guide', keywords: '영운, 국민, 체육, 배드민턴' },
        { title: '영운센터 운영 시간', category: '운영시간', id: 'youngun_sportscenter_guide', keywords: '시간, 오픈, 마감' },
        { title: '영운센터 휴장일 안내', category: '휴장일', id: 'youngun_sportscenter_guide', keywords: '휴관, 쉬는날' },
        { title: '영운센터 연락처', category: '연락처', id: 'youngun_sportscenter_guide', keywords: '전화번호, 문의' },
        { title: '영운센터 시설 상세', category: '시설안내', id: 'youngun_sportscenter_guide', keywords: '주차, 샤워, 락커' },
        { title: '영운센터 이용 안내', category: '이용안내', id: 'youngun_sportscenter_guide', keywords: '입장, 규칙' },
        { title: '영운센터 강습 프로그램', category: '프로그램', id: 'youngun_sportscenter_guide', keywords: '강습, 배드민턴, 탁구' },
        { title: '영운센터 이용 요금', category: '이용요금', id: 'youngun_sportscenter_guide', keywords: '가격, 비용' },
        { title: '영운센터 감면/할인', category: '할인안내', id: 'youngun_sportscenter_guide', keywords: '감면, 할인' },

        // --- 4. 복대국민체육센터 ---
        { title: '복대국민체육센터 바로가기', category: '시설', id: 'bokdae_sportscenter_guide', keywords: '복대, 국민, 체육, 수영' },
        { title: '복대센터 운영 시간', category: '운영시간', id: 'bokdae_sportscenter_guide', keywords: '시간, 오픈, 마감' },
        { title: '복대센터 휴장일 안내', category: '휴장일', id: 'bokdae_sportscenter_guide', keywords: '휴관, 쉬는날' },
        { title: '복대센터 연락처', category: '연락처', id: 'bokdae_sportscenter_guide', keywords: '전화번호, 문의' },
        { title: '복대센터 시설 상세', category: '시설안내', id: 'bokdae_sportscenter_guide', keywords: '주차, 샤워, 락커' },
        { title: '복대센터 이용 안내', category: '이용안내', id: 'bokdae_sportscenter_guide', keywords: '입장, 규칙' },
        { title: '복대센터 강습 프로그램', category: '프로그램', id: 'bokdae_sportscenter_guide', keywords: '강습, 수영' },
        { title: '복대센터 이용 요금', category: '이용요금', id: 'bokdae_sportscenter_guide', keywords: '가격, 비용' },
        { title: '복대센터 감면/할인', category: '할인안내', id: 'bokdae_sportscenter_guide', keywords: '감면, 할인' },

        // --- 5. 가경국민체육센터 ---
        { title: '가경국민체육센터 바로가기', category: '시설', id: 'gagyeong_sportscenter_guide', keywords: '가경, 국민, 체육, 수영' },
        { title: '가경센터 운영 시간', category: '운영시간', id: 'gagyeong_sportscenter_guide', keywords: '시간, 오픈, 마감' },
        { title: '가경센터 휴장일 안내', category: '휴장일', id: 'gagyeong_sportscenter_guide', keywords: '휴관, 쉬는날' },
        { title: '가경센터 연락처', category: '연락처', id: 'gagyeong_sportscenter_guide', keywords: '전화번호, 문의' },
        { title: '가경센터 시설 상세', category: '시설안내', id: 'gagyeong_sportscenter_guide', keywords: '주차, 샤워, 락커' },
        { title: '가경센터 이용 안내', category: '이용안내', id: 'gagyeong_sportscenter_guide', keywords: '입장, 규칙' },
        { title: '가경센터 강습 프로그램', category: '프로그램', id: 'gagyeong_sportscenter_guide', keywords: '강습, 수영' },
        { title: '가경센터 이용 요금', category: '이용요금', id: 'gagyeong_sportscenter_guide', keywords: '가격, 비용' },
        { title: '가경센터 감면/할인', category: '할인안내', id: 'gagyeong_sportscenter_guide', keywords: '감면, 할인' },

        // --- 매뉴얼 & VOC & 기타 ---
        { title: '행정 매뉴얼', category: '매뉴얼', id: 'admin', keywords: '행정, 서류, 절차, admin' },
        { title: '기술 매뉴얼', category: '매뉴얼', id: 'tech', keywords: '기술, 설비, 유지보수, tech' },
        { title: '체육 매뉴얼', category: '매뉴얼', id: 'phy', keywords: '체육, 강습, 프로그램, physical' },
        
        { title: '수영장 VOC', category: 'VOC', id: 'voc_swimming_pool', keywords: '민원, 수영장, 질문, 답변' },
        { title: '다목적체육관 VOC', category: 'VOC', id: 'voc_multipurpose_sports_hall', keywords: '민원, 체육관, 배드민턴, 농구' },
        { title: '프로그램실 VOC', category: 'VOC', id: 'voc_program_room', keywords: '민원, 요가, 댄스, 프로그램' },
        { title: '기타 VOC', category: 'VOC', id: 'voc_other_information', keywords: '민원, 기타, 문의' },
        
        { title: '업데이트 현황', category: '현황', id: 'update', keywords: '공지, 업데이트, 소식, 뉴스' },
        { title: '시설 현황', category: '현황', id: 'facility', keywords: '상태, 운영, 시간, 휴관' },
        { title: '시스템 문의', category: '문의', id: 'helpdesk', keywords: '오류, 버그, 개선, 요청' }
    ];

    // 검색 입력 이벤트 리스너
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim().toLowerCase();
        selectedIndex = -1; // 검색어 변경 시 선택 초기화
        
        if (query.length === 0) {
            searchResults.classList.add('hidden');
            return;
        }

        const filteredData = searchData.filter(item => {
            return item.title.toLowerCase().includes(query) || 
                   item.keywords.toLowerCase().includes(query) ||
                   item.category.toLowerCase().includes(query);
        });

        currentResults = filteredData;
        displayResults(filteredData);
    });

    // 키보드 네비게이션
    searchInput.addEventListener('keydown', function(e) {
        const items = searchResults.querySelectorAll('.search-result-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < currentResults.length) {
            e.preventDefault();
            navigateToResult(currentResults[selectedIndex]);
        } else if (e.key === 'Escape') {
            searchResults.classList.add('hidden');
            searchInput.blur();
        }
    });

    // 포커스 아웃 시 결과창 숨기기 (지연 시간 줌 - 클릭 가능하게)
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            searchResults.classList.add('hidden');
        }, 200);
    });
    
    // 포커스 시 검색어 있으면 결과창 보이기
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim().length > 0) {
            searchResults.classList.remove('hidden');
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('bg-gray-800');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('bg-gray-800');
            }
        });
    }

    function navigateToResult(item) {
        if (typeof loadContent === 'function') {
            loadContent(item.id);
            searchInput.value = '';
            searchResults.classList.add('hidden');
        } else {
            console.error('loadContent function not found');
        }
    }

    function displayResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="p-4 text-center text-gray-400">
                    <i data-lucide="alert-circle" class="w-6 h-6 mx-auto mb-2 opacity-50"></i>
                    <p class="text-sm">검색 결과가 없습니다.</p>
                </div>
            `;
        } else {
            results.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'search-result-item p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0 transition-colors duration-150 group';
                div.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-gray-700 text-gray-300 mr-2 group-hover:bg-cyan-900/50 group-hover:text-cyan-300 transition-colors">${item.category}</span>
                            <span class="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">${item.title}</span>
                        </div>
                        <i data-lucide="arrow-right" class="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                `;
                
                div.addEventListener('click', function() {
                    navigateToResult(item);
                });
                
                searchResults.appendChild(div);
            });
        }
        
        searchResults.classList.remove('hidden');
        
        // 아이콘 다시 렌더링 (동적 추가된 요소)
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
});
