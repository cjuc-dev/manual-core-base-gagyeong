// Firebase SDK 동적 로딩 및 초기화
(function() {
    console.log('🔄 Loading Firebase SDK...');
    
    // Firebase App SDK 로드
    var appScript = document.createElement('script');
    appScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
    appScript.onload = function() {
        console.log('✅ Firebase App SDK loaded');
        
        // Firebase Firestore SDK 로드
        var firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js';
        firestoreScript.onload = function() {
            console.log('✅ Firebase Firestore SDK loaded');
            
            // Firebase 초기화
            try {
                firebase.initializeApp({
                    apiKey: "AIzaSyAN3tBx_SCvQaiKeDTjGwaUWNOtmINwv4k",
                    authDomain: "voc-data-b7f07.firebaseapp.com",
                    projectId: "voc-data-b7f07",
                    storageBucket: "voc-data-b7f07.firebasestorage.app",
                    messagingSenderId: "750066755264",
                    appId: "1:750066755264:web:bf23a4bd56a9aae4276f25"
                });
                window.db = firebase.firestore();
                console.log('✅ Firebase initialized successfully');
            } catch (error) {
                console.error('❌ Firebase initialization failed:', error);
            }
        };
        firestoreScript.onerror = function() {
            console.error('❌ Failed to load Firebase Firestore SDK');
        };
        document.head.appendChild(firestoreScript);
    };
    appScript.onerror = function() {
        console.error('❌ Failed to load Firebase App SDK');
    };
    document.head.appendChild(appScript);
})();

// Firebase 연결 테스트 함수
function testFirebaseConnection(button) {
    if (!window.db) {
        alert('⚠️ Firebase가 아직 로드되지 않았습니다.\n잠시 후 다시 시도하세요.');
        return;
    }

    // 버튼 참조
    const originalText = button.innerHTML;
    
    // 로딩 표시
    button.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> 테스트 중...';
    button.disabled = true;
    if (window.lucide) lucide.createIcons();

    // Firestore에 테스트 데이터 쓰기
    window.db.collection('connection_test').add({
        timestamp: Date.now(),
        test: true,
        message: 'Firebase connection test from index_renewal.html'
    })
    .then(function(docRef) {
        console.log('✅ Firebase connection test successful. Document ID:', docRef.id);
        alert('✅ Firebase 연결 성공!\n\n문서 ID: ' + docRef.id + '\n시간: ' + new Date().toLocaleString('ko-KR'));
        button.innerHTML = originalText;
        button.disabled = false;
        if (window.lucide) lucide.createIcons();
    })
    .catch(function(error) {
        console.error('❌ Firebase connection test failed:', error);
        alert('❌ Firebase 연결 실패!\n\n에러 메시지:\n' + error.message + '\n\n콘솔을 확인하세요.');
        button.innerHTML = originalText;
        button.disabled = false;
        if (window.lucide) lucide.createIcons();
    });
}
