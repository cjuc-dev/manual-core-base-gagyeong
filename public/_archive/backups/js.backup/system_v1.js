// System Request (Helpdesk) Content Logic

if (window.contentTemplates) {
    window.contentTemplates.helpdesk = '' +
        '<h3 class="text-2xl font-bold text-red-400 mb-4">도움말 (Help)</h3>' +
        '<div class="p-6 bg-gray-700/50 rounded-lg border border-gray-600 text-center">' +
        '    <i data-lucide="help-circle" class="w-16 h-16 text-red-400 mx-auto mb-4"></i>' +
        '    <p class="text-white text-lg mb-4">시스템 이용 중 불편한 점이 있으신가요?</p>' +
        '    <a href="https://docs.google.com/spreadsheets/d/1gkFP9ARlFcD6uUwKhKYZTIWMENFj7Hs1k6FgW8fN1uA/edit?usp=sharing" target="_blank" class="inline-block bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-full transition">' +
        '        문의 및 개선 요청하기' +
        '    </a>' +
        '</div>';
}
