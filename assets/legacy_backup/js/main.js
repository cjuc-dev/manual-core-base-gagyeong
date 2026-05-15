let searchData = {};
let contentData = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/manual_data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        searchData = data.searchData;
        contentData = data.contentData;
    } catch (e) {
        console.error('데이터 로드 실패:', e);
        document.getElementById('contentArea').innerHTML = '<div class="content-text"><p>데이터를 불러오는데 실패했습니다.</p></div>';
    }
});

function toggleSidebarSection(element) {
    element.classList.toggle('open');
    element.nextElementSibling.classList.toggle('open');
}

function toggleMenuGroup(element) {
    element.classList.toggle('open');
    element.nextElementSibling.classList.toggle('open');
}

function toggleModule(event) {
    event.stopPropagation();
    const card = event.target.closest('.module-card');
    const content = card.querySelector('.module-content');
    const toggle = card.querySelector('.module-toggle');
    
    content.classList.toggle('expanded');
    toggle.classList.toggle('expanded');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

function toggleSearch() {
    document.getElementById('searchContainer').classList.toggle('active');
    if (document.getElementById('searchContainer').classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

function performSearch(query) {
    const results = document.getElementById('searchResults');
    if (!query.trim()) {
        results.classList.remove('show');
        return;
    }

    const filtered = Object.entries(searchData)
        .filter(([key, value]) => 
            value.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8);

    if (filtered.length === 0) {
        results.classList.remove('show');
        return;
    }

    results.innerHTML = filtered
        .map(([key, value]) => `
            <div class="search-result-item" onclick="loadContent('${key}'); closeSidebar(); toggleSearch();">
                ${value}
            </div>
        `)
        .join('');
    
    results.classList.add('show');
}

function loadContent(contentId) {
    const content = contentData[contentId] || '<div class="content-text"><p>준비 중인 콘텐츠입니다.</p></div>';
    const title = searchData[contentId] || '콘텐츠';
    
    // DOMPurify 적용 (XSS 방어)
    const cleanContent = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(content) : content;
    
    document.getElementById('contentArea').innerHTML = cleanContent;
    document.getElementById('headerTitle').textContent = title;
    document.getElementById('dashboardView').classList.remove('active');
    document.getElementById('contentView').classList.add('active');
    closeSidebar();
    document.getElementById('searchContainer').classList.remove('active');
    window.scrollTo(0, 0);
}

function loadFacility(facilityId) {
    loadContent(facilityId);
}

function backToDashboard() {
    document.getElementById('dashboardView').classList.add('active');
    document.getElementById('contentView').classList.remove('active');
    document.getElementById('headerTitle').textContent = '체육시설 통합 매뉴얼';
    window.scrollTo(0, 0);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton();
}

function updateThemeButton() {
    const btn = document.querySelector('.theme-toggle');
    btn.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeButton();
}

document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        toggleSearch();
    }
});

window.addEventListener('load', loadTheme);