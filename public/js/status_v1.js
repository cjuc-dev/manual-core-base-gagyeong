const UPDATE_STORAGE_KEY = 'update_data_v1';

// Helper for timeout
function withTimeout(promise, ms = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out (5s)")), ms))
    ]);
}

async function loadUpdateList() {
    let list = [];
    
    // 1. Try Firestore (Compat)
    try {
        if (window.db) {
            console.log("Fetching updates from Firestore...");
            const querySnapshot = await withTimeout(
                window.db.collection("updates").orderBy("id", "desc").get()
            );
            
            querySnapshot.forEach((doc) => {
                list.push({ firestoreId: doc.id, ...doc.data() });
            });
            console.log("Firestore loaded:", list.length);
        }
    } catch (e) {
        console.error("Error loading from Firestore:", e);
    }

    // 2. Fallback to LocalStorage
    if (list.length === 0) {
        const localData = localStorage.getItem(UPDATE_STORAGE_KEY);
        if (localData) {
            list = JSON.parse(localData);
        }
    }
    return list;
}

function saveUpdateList(list) {
    localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(list));
}

async function renderUpdateList() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Show loading
    contentArea.innerHTML = '<div class="flex flex-col items-center justify-center py-12 text-gray-500">' +
        '<i data-lucide="loader" class="w-8 h-8 animate-spin mb-3 text-emerald-500"></i>' +
        '<p>데이터를 불러오는 중입니다...</p>' +
        '</div>';
    if (window.lucide) window.lucide.createIcons();

    try {
        const list = await loadUpdateList();
        console.log("Updates loaded:", list.length);

        let html = '';
        html += '<div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">';
        html += '    <h2 class="text-2xl font-bold text-indigo-400 m-0">업데이트 현황</h2>';
        html += '    <button onclick="tryOpenWriteModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center transition">';
        html += '        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> 글쓰기';
        html += '    </button>';
        html += '</div>';
        html += '<div class="space-y-4" id="updateList">';

        if (list.length === 0) {
            html += '<div class="text-center py-12 text-gray-500 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">';
            html += '    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>';
            html += '    <p>등록된 업데이트가 없습니다.</p>';
            html += '</div>';
        } else {
            list.forEach(item => {
                html += '<div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition duration-150">';
                html += '    <div class="flex justify-between items-start mb-2">';
                html += '        <h4 class="text-lg font-semibold text-white">' + item.title + '</h4>';
                html += '        <span class="text-xs text-gray-400 bg-slate-800 px-2 py-1 rounded border border-slate-600">' + item.date + '</span>';
                html += '    </div>';
                html += '    <p class="text-gray-300 whitespace-pre-wrap mb-3 text-sm leading-relaxed">' + item.content + '</p>';
                html += '    <div class="flex justify-end space-x-2">';
                html += '        <button onclick="tryEditUpdate(' + item.id + ')" class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center px-2 py-1 rounded hover:bg-slate-700 transition">';
                html += '            <i data-lucide="edit-2" class="w-3 h-3 mr-1"></i> 수정';
                html += '        </button>';
                html += '        <button onclick="tryDeleteUpdate(' + item.id + ')" class="text-xs text-red-400 hover:text-red-300 flex items-center px-2 py-1 rounded hover:bg-slate-700 transition">';
                html += '            <i data-lucide="trash-2" class="w-3 h-3 mr-1"></i> 삭제';
                html += '        </button>';
                html += '    </div>';
                html += '</div>';
            });
        }

        html += '</div>';

        contentArea.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

    } catch (error) {
        console.error("Render error:", error);
        contentArea.innerHTML = '<div class="text-center py-12 text-red-500">오류가 발생했습니다: ' + error.message + '</div>';
    }
}

// Modal handling
function openWriteModal() {
    document.getElementById('updateWriteModal').classList.remove('hidden');
    document.getElementById('update-id').value = '';
    document.getElementById('update-firestore-id').value = '';
    document.getElementById('update-title').value = '';
    document.getElementById('update-date').value = new Date().toISOString().substring(0, 10);
    document.getElementById('update-content').value = '';
    document.getElementById('updateModalTitle').innerText = '새 업데이트 작성';
}

function closeWriteModal() {
    document.getElementById('updateWriteModal').classList.add('hidden');
}

async function openEditModal(id) {
    const list = await loadUpdateList();
    const item = list.find(i => i.id === id);
    if (!item) return;

    document.getElementById('updateWriteModal').classList.remove('hidden');
    document.getElementById('update-id').value = item.id;
    document.getElementById('update-firestore-id').value = item.firestoreId || '';
    // Strip "v " prefix if it exists
    const titleWithoutPrefix = item.title.startsWith('v ') ? item.title.substring(2) : item.title;
    document.getElementById('update-title').value = titleWithoutPrefix;
    document.getElementById('update-date').value = item.date || new Date().toISOString().substring(0, 10);
    document.getElementById('update-content').value = item.content;
    document.getElementById('updateModalTitle').innerText = '업데이트 수정';
}

// Auth wrappers
function tryOpenWriteModal() {
    if (window.isAdminAuthenticated) {
        openWriteModal();
    } else {
        window.pendingAction = 'update_write';
        window.showAdminAuthModal();
    }
}

function tryEditUpdate(id) {
    if (window.isAdminAuthenticated) {
        openEditModal(id);
    } else {
        window.pendingAction = 'update_edit';
        window.pendingTargetId = id;
        window.showAdminAuthModal();
    }
}

async function saveUpdate() {
    const id = document.getElementById('update-id').value;
    const firestoreId = document.getElementById('update-firestore-id').value;
    const titleInput = document.getElementById('update-title').value;
    const content = document.getElementById('update-content').value;
    const date = document.getElementById('update-date').value;

    if (!titleInput || !content || !date) {
        alert('버전, 날짜, 내용을 모두 입력해주세요.');
        return;
    }

    // Add "v " prefix to title
    const title = 'v ' + titleInput;

    try {
        if (window.db) {
            // Firestore Save
            if (firestoreId) {
                // Update
                await withTimeout(
                    window.db.collection("updates").doc(firestoreId).update({
                        title, content, date
                    })
                );
            } else {
                // Add
                await withTimeout(
                    window.db.collection("updates").add({
                        id: Date.now(),
                        title, content, date
                    })
                );
            }
        } else {
            // LocalStorage Fallback
            const list = await loadUpdateList();
            if (id) {
                const idx = list.findIndex(i => i.id == id);
                if (idx !== -1) {
                    list[idx] = { ...list[idx], title, content, date };
                }
            } else {
                list.unshift({ id: Date.now(), title, content, date });
            }
            saveUpdateList(list);
        }

        closeWriteModal();
        renderUpdateList();
        
        // Success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
        successMsg.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i> 저장 완료';
        document.body.appendChild(successMsg);
        if(window.lucide) lucide.createIcons();
        setTimeout(() => successMsg.remove(), 2000);

    } catch (e) {
        console.error("Save failed:", e);
        alert("저장 실패: " + e.message);
    }
}

function tryDeleteUpdate(id) {
    if (window.isAdminAuthenticated) {
        window.showConfirmModal('정말로 삭제하시겠습니까?', async () => {
            try {
                const list = await loadUpdateList();
                const item = list.find(i => i.id === id);
                
                if (window.db && item && item.firestoreId) {
                    await window.db.collection("updates").doc(item.firestoreId).delete();
                } else {
                    const newList = list.filter(i => i.id !== id);
                    saveUpdateList(newList);
                }
                
                renderUpdateList();
                
                const successMsg = document.createElement('div');
                successMsg.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
                successMsg.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i> 삭제 완료';
                document.body.appendChild(successMsg);
                if(window.lucide) lucide.createIcons();
                setTimeout(() => successMsg.remove(), 2000);
            } catch (e) {
                console.error("Delete failed:", e);
                alert("삭제 실패: " + e.message);
            }
        });
    } else {
        window.pendingAction = 'update_delete';
        window.pendingTargetId = id;
        window.showAdminAuthModal();
    }
}

// Make functions globally available
window.loadUpdateList = loadUpdateList;
window.saveUpdateList = saveUpdateList;
window.renderUpdateList = renderUpdateList;
window.openWriteModal = openWriteModal;
window.openEditModal = openEditModal;
window.closeWriteModal = closeWriteModal;
window.saveUpdate = saveUpdate;
window.tryOpenWriteModal = tryOpenWriteModal;
window.tryEditUpdate = tryEditUpdate;
window.tryDeleteUpdate = tryDeleteUpdate;
