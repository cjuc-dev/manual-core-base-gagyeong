// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAN3tBx_SCvQaiKeDTjGwaUWNOtmINwv4k",
    authDomain: "voc-data-b7f07.firebaseapp.com",
    projectId: "voc-data-b7f07",
    storageBucket: "voc-data-b7f07.firebasestorage.app",
    messagingSenderId: "750066755264",
    appId: "1:750066755264:web:bf23a4bd56a9aae4276f25",
    measurementId: "G-3MQHVD7W33"
};

// Wait for Firebase SDK to load
(function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.log("Waiting for Firebase SDK...");
        setTimeout(initFirebase, 100);
        return;
    }
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    console.log("Firebase initialized successfully");
    
    // Check connection after 1 second
    setTimeout(function() {
        window.db.collection('voc_swimming').limit(1).get()
            .then(function() {
                updateStatusUI('connected', 'Firebase 연결됨');
                console.log("Firebase connected");
            })
            .catch(function(err) {
                updateStatusUI('error', 'Firebase 오프라인');
                console.error("Firebase connection failed:", err);
            });
    }, 1000);
})();

// Status UI
function updateStatusUI(status, message) {
    var dot = document.getElementById('statusDot');
    var text = document.getElementById('statusText');
    if (!dot || !text) return;
    
    if (status === 'connected') {
        dot.className = 'w-3 h-3 rounded-full bg-green-500';
        text.textContent = message;
        text.className = 'text-sm text-green-400 font-semibold';
    } else if (status === 'error') {
        dot.className = 'w-3 h-3 rounded-full bg-red-500';
        text.textContent = message;
        text.className = 'text-sm text-red-400 font-semibold';
    }
}

// Test function
function testConnection() {
    if (!window.db) {
        alert("Firebase가 초기화되지 않았습니다.");
        return;
    }
    window.db.collection('connection_test').add({timestamp: Date.now()})
        .then(function() { alert("✅ 연결 성공!"); })
        .catch(function(e) { alert("❌ 연결 실패: " + e.message); });
}

window.testConnection = testConnection;
