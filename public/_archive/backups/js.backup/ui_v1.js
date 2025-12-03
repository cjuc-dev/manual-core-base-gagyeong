
// --- VIEW CONTROL ---
const dashboardView = document.getElementById('dashboardView');
const contentView = document.getElementById('contentView');
const contentArea = document.getElementById('content-area');

// Global Variables
window.isAdminAuthenticated = false;
window.confirmCallback = null;

// Modal Elements
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');

function showDashboard() {
    contentView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    window.isAdminAuthenticated = false; // Reset auth on exit
}

function showContent() {
    dashboardView.classList.add('hidden');
    contentView.classList.remove('hidden');
}

function toggleModule(selectorId, iconId) {
    const selector = document.getElementById(selectorId);
    const icon = document.getElementById(iconId);
    
    selector.classList.toggle('hidden');
    
    if (selector.classList.contains('hidden')) {
        icon.classList.remove('rotate-180');
    } else {
        icon.classList.add('rotate-180');
    }
}

// --- MODAL FUNCTIONS ---
function showConfirmModal(message, callback) {
    confirmMessage.innerText = message;
    window.confirmCallback = callback;
    confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
    confirmModal.classList.add('hidden');
    window.confirmCallback = null;
}

if (confirmYesBtn) {
    confirmYesBtn.addEventListener('click', function() {
        if (window.confirmCallback) window.confirmCallback();
        closeConfirmModal();
    });
}

// --- ADMIN AUTH ---
window.pendingAction = null; // 'write', 'edit', 'delete', 'voc_write', 'voc_delete'
window.pendingTargetId = null;
window.pendingCategory = null;

const adminAuthModal = document.getElementById('adminAuthModal');
const adminPasswordInput = document.getElementById('adminPassword');
const adminAuthError = document.getElementById('adminAuthError');

function showAdminAuthModal() {
    adminAuthModal.classList.remove('hidden');
    adminPasswordInput.value = '';
    adminAuthError.classList.add('hidden');
    adminPasswordInput.focus();
}

function closeAdminAuthModal() {
    adminAuthModal.classList.add('hidden');
    window.pendingAction = null;
    window.pendingTargetId = null;
    window.pendingCategory = null;
}

function checkAdminPassword() {
    const password = adminPasswordInput.value;
    if (password === 'admin') {
        window.isAdminAuthenticated = true;
        closeAdminAuthModal();
        
        // Execute pending action
        if (window.pendingAction === 'write') {
            window.openWriteModal();
        } else if (window.pendingAction === 'edit') {
            window.openEditModal(window.pendingTargetId);
        } else if (window.pendingAction === 'delete') {
            window.tryDeleteUpdate(window.pendingTargetId);
        } else if (window.pendingAction === 'voc_write') {
            window.openVocWriteModal(window.pendingCategory);
        } else if (window.pendingAction === 'voc_edit') {
            window.openVocEditModal(window.pendingTargetId, window.pendingCategory);
        } else if (window.pendingAction === 'voc_delete') {
            window.deleteVoc(window.pendingTargetId, window.pendingCategory);
        }
    } else {
        adminAuthError.classList.remove('hidden');
        adminPasswordInput.classList.add('border-red-500');
    }
}

function handleAdminPasswordKeydown(event) {
    if (event.key === 'Enter') {
        checkAdminPassword();
    }
}

// --- CONTENT LOADING LOGIC ---
// Global content templates registry
window.contentTemplates = {};

function loadContent(section) {
    showContent();
    contentArea.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-500"><i data-lucide="loader" class="w-10 h-10 animate-spin mb-4"></i><p>콘텐츠를 불러오는 중입니다...</p></div>';
    if (window.lucide) window.lucide.createIcons();

    // Simulate loading or fetch content
    setTimeout(() => {
        if (section.startsWith('voc_')) {
            if (window.renderVocList) window.renderVocList(section);
        } else if (section === 'update') {
            if (window.renderUpdateList) window.renderUpdateList();
        } else {
            contentArea.innerHTML = window.generateContent(section);
            if (window.lucide) window.lucide.createIcons();
        }
    }, 300); // Small delay for effect
}

function generateContent(section) {
    return window.contentTemplates[section] || '<p>올바른 섹션이 아닙니다.</p>';
}

// Make functions globally available
window.showDashboard = showDashboard;
window.showContent = showContent;
window.toggleModule = toggleModule;
window.showConfirmModal = showConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.showAdminAuthModal = showAdminAuthModal;
window.closeAdminAuthModal = closeAdminAuthModal;
window.checkAdminPassword = checkAdminPassword;
window.handleAdminPasswordKeydown = handleAdminPasswordKeydown;
window.loadContent = loadContent;
window.generateContent = generateContent;

console.log("UI Logic Initialized");
