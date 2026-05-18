/**
 * 💖 likes_manager.js
 * 
 * [기능 정의]
 * Smart Operations Suite (SOS) 매뉴얼에 대한 실시간 공감(좋아요) 햅틱 피드백 엔진 및 
 * 소셜 공유/인쇄 등 부가적인 유틸리티 기능을 제어하는 코어 매니저입니다.
 * 
 * [왜 이렇게 설계했는가?]
 * - Firestore NoSQL manual/likes 문서와의 실시간 필드 트랜잭션을 처리하여 전사적인 만족도를 통합 계측합니다.
 * - LocalStorage와 원자적 increment 연산을 결합하여 개인 중복 좋아요 토글 행위를 정확하고 가볍게 통제합니다.
 * - 프리미엄 햅틱 연출 UI 및 텍스트 정화(DOMPurify) 보안 수칙을 성실히 수행합니다.
 * 
 * @author Smart Operations Suite Development Team
 * @version 5.55
 */

/**
 * 🚀 [실시간 공감 데이터 로드]
 * 로컬스토리지 토글 상태와 Firestore 실시간 서버 수치를 결합하여 가져옵니다.
 */
window.getLikeData = async function(contentId) {
    const userLikeKey = `sos_liked_v1_${contentId}`;
    const isUserLiked = localStorage.getItem(userLikeKey) === 'true';
    
    let count = 10; // 기본 수치
    try {
        if (window.db) {
            const docSnap = await db.collection('manual').doc('likes').get();
            if (docSnap.exists) {
                const data = docSnap.data();
                if (data[contentId] !== undefined) {
                    count = data[contentId];
                } else {
                    // Firestore 상에 존재하지 않을 경우 기본값 10으로 즉시 서버 등재
                    await db.collection('manual').doc('likes').update({
                        [contentId]: 10
                    });
                }
            }
        }
    } catch (e) {
        console.warn("[Firestore Likes] 실시간 공감수 획득 실패 (기본값 작동):", e);
    }
    
    return { liked: isUserLiked, count: count };
};

/**
 * 🚀 [공감 섹션 동적 마크업 생성 엔진]
 * 네이버 블로그 프리미엄 알약 캡슐형 UI 및 햅틱 호버 이펙트를 완벽 구현합니다.
 */
window.generateLikeSectionHTML = async function(contentId) {
    const data = await window.getLikeData(contentId);
    const heartIconClass = data.liked ? "ph-heart-fill text-rose-500 scale-105" : "ph-heart text-gray-400 dark:text-gray-500";
    
    return `
    <div id="like-container-box" class="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800/80 flex justify-center pb-8 print:hidden">
        <!-- 블로그형 알약 캡슐형 묶음 패널 -->
        <div class="inline-flex items-center gap-5 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-full shadow-lg transition-transform hover:scale-[1.02] duration-300">
            
            <!-- 공감(좋아요) 토글 단추 -->
            <button id="like-toggle-btn" onclick="toggleLike('${contentId}')" 
                class="flex items-center gap-2 text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 font-bold text-sm transition-all focus:outline-none select-none group" 
                title="이 매뉴얼에 공감하기">
                <i id="like-icon" class="ph ${heartIconClass} text-xl transition-all duration-300 group-hover:scale-120"></i>
                <span>공감</span>
                <span id="like-count" class="font-black text-xs text-slate-800 dark:text-slate-100 min-w-[12px] text-center">${data.count}</span>
            </button>
            
            <div class="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
            
            <!-- 공유(내보내기) 단추 -->
            <button onclick="shareDocument('${contentId}')" 
                class="text-gray-400 hover:text-emerald-500 dark:hover:text-cyan-400 transition-all focus:outline-none select-none group" 
                title="이 매뉴얼 주소 복사하기">
                <i class="ph ph-share-network text-lg transition-transform group-hover:scale-120 duration-200"></i>
            </button>
            
            <div class="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
            
            <!-- 더보기 단추 -->
            <button onclick="toggleMoreMenu('${contentId}')" 
                class="text-gray-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all focus:outline-none select-none group" 
                title="더보기">
                <i class="ph ph-dots-three text-lg font-bold transition-transform group-hover:scale-125 duration-200"></i>
            </button>
        </div>
    </div>
    `;
};

/**
 * 🚀 [공감(좋아요) 실시간 토글 및 Firestore 원자적 증감 트랜잭션 집행]
 */
window.toggleLike = async function(contentId) {
    const userLikeKey = `sos_liked_v1_${contentId}`;
    const isUserLiked = localStorage.getItem(userLikeKey) === 'true';
    
    const icon = document.getElementById('like-icon');
    const countSpan = document.getElementById('like-count');
    const btn = document.getElementById('like-toggle-btn');
    
    const nextLikedState = !isUserLiked;
    let incrementVal = nextLikedState ? 1 : -1;
    
    // UI 낙관적 햅틱 모션 연출
    if (btn) {
        btn.classList.add('scale-95');
        setTimeout(() => btn.classList.remove('scale-95'), 150);
    }

    if (nextLikedState) {
        if (icon) icon.className = "ph ph-heart-fill text-rose-500 scale-120";
    } else {
        if (icon) icon.className = "ph ph-heart text-gray-400 dark:text-gray-500 scale-90";
    }
    
    try {
        if (window.db) {
            // Firestore 원자적 필드 증감 연산(increment) 활용
            await db.collection('manual').doc('likes').update({
                [contentId]: firebase.firestore.FieldValue.increment(incrementVal)
            });

            // 🚀 [v5.93] 실시간 사용성 인텔리전스 분석 공감(Likes) 랭킹 컬렉션 동시 업데이트
            const likeRef = db.collection('manual').doc('system_info').collection('analytics_likes').doc(contentId);
            const titleEl = document.querySelector('#content-area h1') || document.querySelector('#markdown-body h1');
            const cleanTitle = titleEl ? titleEl.textContent.trim() : contentId;
            
            db.runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(likeRef);
                if (!sfDoc.exists) {
                    transaction.set(likeRef, {
                        contentId: contentId,
                        title: cleanTitle,
                        likeCount: Math.max(0, 10 + incrementVal),
                        lastLiked: new Date()
                    });
                } else {
                    const newCount = Math.max(0, (sfDoc.data().likeCount || 0) + incrementVal);
                    transaction.update(likeRef, {
                        likeCount: newCount,
                        lastLiked: new Date(),
                        title: cleanTitle
                    });
                }
            }).catch(err => console.warn("[Analytics] Likes transaction failed:", err));
            
            // 상태 기록 확정
            localStorage.setItem(userLikeKey, String(nextLikedState));
            
            // 최신 데이터 획득 후 화면 재갱신
            const freshData = await window.getLikeData(contentId);
            if (countSpan) countSpan.innerText = freshData.count;
            if (icon) {
                icon.className = freshData.liked ? "ph ph-heart-fill text-rose-500" : "ph ph-heart text-gray-400 dark:text-gray-500";
            }
            
            if (nextLikedState) {
                window.showToast("💖 소중한 공감이 전사 실시간 서버에 안전하게 기록되었습니다!");
            } else {
                window.showToast("💔 공감이 취소되었습니다.");
            }
        }
    } catch (e) {
        console.error("좋아요 동기화 실패:", e);
        window.showToast("⚠️ 실시간 좋아요 전송 실패: 인터넷 연결을 확인해 주세요.");
    }
};

/**
 * 🚀 [프리미엄 알림 토스트 메시지 작동 엔진]
 */
window.showToast = function(message) {
    let toast = document.getElementById('toast-alert');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-alert';
        toast.className = 'px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl';
        document.body.appendChild(toast);
    }
    
    const sanitizedMsg = DOMPurify.sanitize(message);
    toast.innerHTML = `
        <div class="w-2 h-2 rounded-full bg-emerald-500 dark:bg-cyan-400 animate-ping"></div>
        <i class="ph ph-check-circle-fill text-emerald-500 dark:text-cyan-400 text-lg"></i>
        <span class="text-xs font-black text-slate-800 dark:text-white">${sanitizedMsg}</span>
    `;
    
    setTimeout(() => toast.classList.add('show'), 50);
    
    // 2.5초 후 자동 안전 제거
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
};

/**
 * 🚀 [문서 고유 링크 클립보드 복사 공유]
 */
window.shareDocument = function(contentId) {
    const params = new URLSearchParams(window.location.search);
    const facility = params.get('facility') || '공통';
    const sub = params.get('sub');
    
    let shareUrl = `${window.location.origin}${window.location.pathname}?doc=${encodeURIComponent(contentId)}&facility=${encodeURIComponent(facility)}`;
    if (sub) {
        shareUrl += `&sub=${encodeURIComponent(sub)}`;
    }
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        window.showToast("클립보드에 매뉴얼 공유 주소가 안전하게 복사되었습니다!");
    }).catch(err => {
        console.error("클립보드 복사 실패:", err);
        alert("주소 복사에 실패했습니다. 수동으로 주소창의 링크를 복사해 주세요.");
    });
};

/**
 * 🚀 [더보기 컨텍스트 메뉴 단축 가이드]
 */
window.toggleMoreMenu = function(contentId) {
    const confirmPrint = confirm("인쇄하기(Print) 기능을 단축 실행할까요?\n(인쇄 시 매뉴얼 본문만 깨끗하게 최적화 인쇄됩니다.)");
    if (confirmPrint) {
        window.print();
    }
};
