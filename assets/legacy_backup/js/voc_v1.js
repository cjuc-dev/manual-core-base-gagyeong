// VOC Feature Logic (Firebase Compat SDK)

const VOC_STORAGE_KEY = 'voc_data_v3';

function getCollectionName(category) {
    const map = {
        'voc_swimming_pool': 'voc_swimming',
        'voc_multipurpose_sports_hall': 'voc_gym',
        'voc_program_room': 'voc_program',
        'voc_other_information': 'voc_other',
        // Legacy support (in case old format is still used)
        'swimming_pool': 'voc_swimming',
        'multipurpose_sports_hall': 'voc_gym',
        'program_room': 'voc_program',
        'other_information': 'voc_other'
    };
    return map[category] || 'voc_other';
}

async function loadVocList(category) {
    console.log("loadVocList called for:", category);
    let list = [];
    
    // 1. Try to load from Firestore with Timeout (Compat SDK)
    try {
        if (window.db) {
            const collectionName = getCollectionName(category);
            console.log("Fetching from Firestore collection:", collectionName);
            
            // Create a timeout promise (2 seconds)
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Firestore timeout")), 2000)
            );

            // Race between fetch and timeout - COMPAT SDK SYNTAX
            const querySnapshot = await Promise.race([
                window.db.collection(collectionName).orderBy("id", "desc").get(),
                timeout
            ]);

            querySnapshot.forEach((doc) => {
                list.push({ firestoreId: doc.id, ...doc.data(), category: category });
            });
            console.log("Firestore loaded:", list.length);
        } else {
            console.warn("Firebase not initialized or db not available.");
        }
    } catch (e) {
        console.error("Error loading from Firestore (or timeout): ", e);
        // Fallback will happen below
    }

    // 2. Fallback to LocalStorage / Legacy Data
    if (list.length === 0) {
        console.log("Firestore empty or failed, checking LocalStorage/Legacy");
        const localData = localStorage.getItem(VOC_STORAGE_KEY);
        if (localData) {
            const parsed = JSON.parse(localData);
            list = parsed.filter(item => item.category === category);
        } else if (typeof vocDataFile !== 'undefined' && Array.isArray(vocDataFile)) {
            list = vocDataFile.filter(item => item.category === category);
        }
    }

    return list;
}

function saveVocList(list) {
    // Get all existing data from localStorage
    const allData = localStorage.getItem(VOC_STORAGE_KEY) ? JSON.parse(localStorage.getItem(VOC_STORAGE_KEY)) : [];
    
    // If list has items, get the category from the first item
    if (list.length > 0 && list[0].category) {
        const category = list[0].category;
        
        // Remove all items of this category from allData
        const otherCategoryData = allData.filter(item => item.category !== category);
        
        // Merge: other categories' data + current category's new data
        const mergedData = [...otherCategoryData, ...list];
        
        localStorage.setItem(VOC_STORAGE_KEY, JSON.stringify(mergedData));
    } else {
        // If no category info, just save as-is (legacy behavior)
        localStorage.setItem(VOC_STORAGE_KEY, JSON.stringify(list));
    }
}

async function renderVocList(category) {
    console.log("renderVocList called for:", category);
    const contentArea = document.getElementById('content-area');
    
    // Show Loading
    contentArea.innerHTML = '<div class="flex flex-col items-center justify-center py-12 text-gray-500">' +
        '<i data-lucide="loader" class="w-8 h-8 animate-spin mb-3 text-emerald-500"></i>' +
        '<p>데이터를 불러오는 중입니다...</p>' +
        '</div>';
    lucide.createIcons();

    try {
        const list = await loadVocList(category);
        console.log("List loaded for render:", list.length);
        
        const filtered = list; 
        filtered.sort((a, b) => b.id - a.id);

        const categoryTitles = {
            // New format (with voc_ prefix)
            'voc_swimming_pool': '수영장 VOC(시민의 소리)',
            'voc_multipurpose_sports_hall': '다목적체육관 VOC(시민의 소리)',
            'voc_program_room': '프로그램실 VOC(시민의 소리)',
            'voc_other_information': '기타 VOC(시민의 소리)',
            // Legacy format (without voc_ prefix)
            'swimming_pool': '수영장 VOC(시민의 소리)',
            'multipurpose_sports_hall': '다목적체육관 VOC(시민의 소리)',
            'program_room': '프로그램실 VOC(시민의 소리)',
            'other_information': '기타 VOC(시민의 소리)'
        };
        
        let displayTitle = categoryTitles[category] || category;

        let html = '';
        html += '<div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">';
        html += '    <h2 class="text-2xl font-bold text-indigo-400 m-0">' + displayTitle + '</h2>';
        html += '    <button onclick="tryOpenVocWriteModal(\'' + category + '\')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center transition">';
        html += '        <i data-lucide="plus" class="w-4 h-4 mr-2"></i> 글쓰기';
        html += '    </button>';
        html += '</div>';
        html += '<div class="space-y-4" id="vocList">';

        if (filtered.length === 0) {
            html += '<div class="text-center py-12 text-gray-500 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">';
            html += '    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>';
            html += '    <p>등록된 게시글이 없습니다.</p>';
            html += '</div>';
        } else {
            filtered.forEach(item => {
                const editId = item.firestoreId ? '\'' + item.firestoreId + '\'' : item.id;
                const deleteId = item.firestoreId ? '\'' + item.firestoreId + '\'' : item.id;
                
                let adminButtons = '';
                adminButtons += '<button onclick="tryEditVoc(' + editId + ', \'' + category + '\')" class="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="수정">';
                adminButtons += '    <i data-lucide="edit-2" class="w-4 h-4"></i>';
                adminButtons += '</button>';
                adminButtons += '<button onclick="deleteVoc(' + deleteId + ', \'' + category + '\')" class="p-2 text-gray-400 hover:text-red-400 transition-colors" title="삭제">';
                adminButtons += '    <i data-lucide="trash-2" class="w-4 h-4"></i>';
                adminButtons += '</button>';

                html += '<details class="group bg-gray-800 rounded-lg border border-gray-700 overflow-hidden transition-all duration-200 hover:border-gray-600">';
                html += '    <summary class="flex items-center justify-between p-5 cursor-pointer select-none bg-gray-800 hover:bg-gray-750">';
                html += '        <div class="flex items-center space-x-4 flex-1">';
                html += '            <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-900/50 text-indigo-400 font-bold text-sm">Q</span>';
                html += '            <div class="flex-1 min-w-0">';
                html += '                <h3 class="text-lg font-medium text-gray-200 group-open:text-indigo-400 transition-colors truncate pr-4">' + item.title + '</h3>';
                html += '                <div class="flex items-center text-xs text-gray-500 mt-1 space-x-3">';
                html += '                    <span>' + item.author + '</span>';
                html += '                    <span>•</span>';
                html += '                    <span>' + item.date + '</span>';
                html += '                </div>';
                html += '            </div>';
                html += '        </div>';
                html += '        <div class="flex items-center space-x-3">';
                html += '            ' + adminButtons;
                html += '            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-500 transition-transform duration-300 group-open:rotate-180"></i>';
                html += '        </div>';
                html += '    </summary>';
                html += '    <div class="p-5 pt-0 border-t border-gray-700/50 bg-gray-800/50">';
                html += '        <div class="mt-4 space-y-4">';
                html += '            <div class="bg-gray-900/50 p-4 rounded-lg">';
                html += '                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">내용</span>';
                html += '                <p class="text-gray-300 whitespace-pre-wrap leading-relaxed">' + item.content + '</p>';
                html += '            </div>';
                
                if (item.answer) {
                    html += '            <div class="bg-indigo-900/20 p-4 rounded-lg border border-indigo-800/30">';
                    html += '                <div class="flex items-center mb-2">';
                    html += '                    <span class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-900/50 text-indigo-400 font-bold text-sm mr-3">A</span>';
                    html += '                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">답변</span>';
                    html += '                </div>';
                    html += '                <p class="text-indigo-200 whitespace-pre-wrap leading-relaxed ml-11">' + item.answer + '</p>';
                    html += '            </div>';
                }
                
                html += '        </div>';
                html += '    </div>';
                html += '</details>';
            });
        }

        html += '</div>';
        
        contentArea.innerHTML = html;
        lucide.createIcons();
        
    } catch (error) {
        console.error("Render error:", error);
        contentArea.innerHTML = '<div class="text-center py-12 text-red-500">오류가 발생했습니다: ' + error.message + '</div>';
    }
}

function toggleVocContent(id) {
    const content = document.getElementById('voc-content-' + id);
    if (content) {
        content.classList.toggle('hidden');
    }
}

function tryOpenVocWriteModal(category) {
    if (window.isAdminAuthenticated) {
        window.openVocWriteModal(category);
    } else {
        window.pendingAction = 'voc_write';
        window.pendingCategory = category;
        window.showAdminAuthModal();
    }
}

function openVocWriteModal(category) {
    const modal = document.getElementById('vocWriteModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.getElementById('voc-id').value = '';
    document.getElementById('voc-firestore-id').value = '';
    document.getElementById('voc-category').value = category;
    document.getElementById('voc-title').value = '';
    document.getElementById('voc-author').value = '';
    document.getElementById('voc-content').value = '';
    document.getElementById('voc-answer').value = '';
    document.getElementById('vocModalTitle').innerText = 'VOC 작성';
}

async function openVocEditModal(firestoreId, category) {
    const list = await loadVocList(category);
    const item = list.find(i => i.firestoreId === firestoreId || i.id == firestoreId);
    if (!item) return;

    const modal = document.getElementById('vocWriteModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    document.getElementById('voc-id').value = item.id || '';
    document.getElementById('voc-firestore-id').value = item.firestoreId || '';
    document.getElementById('voc-category').value = category;
    document.getElementById('voc-title').value = item.title || '';
    document.getElementById('voc-author').value = item.author || '';
    document.getElementById('voc-content').value = item.content || '';
    document.getElementById('voc-answer').value = item.answer || '';
    document.getElementById('vocModalTitle').innerText = 'VOC 수정';
}

function tryEditVoc(firestoreId, category) {
    if (window.isAdminAuthenticated) {
        openVocEditModal(firestoreId, category);
    } else {
        window.pendingAction = 'voc_edit';
        window.pendingTargetId = firestoreId;
        window.pendingCategory = category;
        window.showAdminAuthModal();
    }
}

function closeVocWriteModal() {
    const modal = document.getElementById('vocWriteModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function saveVoc() {
    const id = document.getElementById('voc-id').value;
    const firestoreId = document.getElementById('voc-firestore-id').value;
    const category = document.getElementById('voc-category').value;
    const title = document.getElementById('voc-title').value;
    const author = document.getElementById('voc-author').value;
    const content = document.getElementById('voc-content').value;
    const answer = document.getElementById('voc-answer').value;
    const date = new Date().toISOString().substring(0, 10);

    if (!title || !author || !content) {
        alert('제목, 작성자, 내용을 입력해주세요.');
        return;
    }

    const saveBtn = document.querySelector('#vocWriteModal button[onclick="saveVoc()"]');
    const originalBtnText = saveBtn ? saveBtn.innerText : '';
    if (saveBtn) {
        saveBtn.innerText = '저장 중...';
        saveBtn.disabled = true;
    }

    try {
        const collectionName = getCollectionName(category);
        
        if (window.db) {
            // Firestore Save (Compat SDK)
            if (firestoreId) {
                // Update existing
                await window.db.collection(collectionName).doc(firestoreId).update({
                    title, author, content, answer, date
                });
            } else {
                // Add new
                await window.db.collection(collectionName).add({
                    id: Date.now(),
                    title, author, content, answer, date, category
                });
            }
            
            closeVocWriteModal();
            renderVocList(category);
            alert('✅ Firebase에 저장되었습니다!');
            
        } else {
            throw new Error("Firebase not available");
        }
        
    } catch (e) {
        console.error("Firebase save failed:", e);
        
        // Fallback to LocalStorage
        try {
            const list = await loadVocList(category);
            const newItem = {
                id: id ? parseInt(id) : Date.now(),
                firestoreId: firestoreId || null,
                title, author, content, answer, date, category
            };
            
            if (id || firestoreId) {
                const idx = list.findIndex(i => i.id == id || i.firestoreId === firestoreId);
                if (idx !== -1) {
                    list[idx] = newItem;
                } else {
                    list.push(newItem);
                }
            } else {
                list.push(newItem);
            }
            
            saveVocList(list);
            alert("⚠️ Firebase 연결에 실패하여 '로컬 저장소'에 저장되었습니다.\\n(인터넷 연결이나 방화벽 설정을 확인해주세요.)");
            
            closeVocWriteModal();
            renderVocList(category);
            
        } catch (localError) {
            console.error("Local Save failed:", localError);
            alert("저장 실패 (로컬 저장소 오류): " + localError.message);
        }
    } finally {
        if (saveBtn) {
            saveBtn.innerText = originalBtnText;
            saveBtn.disabled = false;
        }
    }
}

function deleteVoc(firestoreId, category) {
    if (window.isAdminAuthenticated) {
        window.showConfirmModal('정말로 삭제하시겠습니까?', async () => {
            try {
                const collectionName = getCollectionName(category);
                
                if (window.db && typeof firestoreId === 'string') {
                    // Firestore deletion (Compat SDK)
                    await window.db.collection(collectionName).doc(firestoreId).delete();
                    console.log("Deleted from Firestore");
                } else {
                    // Legacy delete from local storage
                    const list = await loadVocList(category);
                    const newList = list.filter(i => i.id != firestoreId && i.firestoreId !== firestoreId);
                    saveVocList(newList);
                }
                
                renderVocList(category);
                alert('삭제되었습니다.');
                
            } catch (e) {
                console.error("Delete failed:", e);
                alert("삭제 실패: " + e.message);
            }
        });
    } else {
        window.pendingAction = 'voc_delete';
        window.pendingTargetId = firestoreId;
        window.pendingCategory = category;
        window.showAdminAuthModal();
    }
}

// Make functions globally available
window.loadVocList = loadVocList;
window.renderVocList = renderVocList;
window.toggleVocContent = toggleVocContent;
window.tryOpenVocWriteModal = tryOpenVocWriteModal;
window.openVocWriteModal = openVocWriteModal;
window.openVocEditModal = openVocEditModal;
window.tryEditVoc = tryEditVoc;
window.deleteVoc = deleteVoc;
window.closeVocWriteModal = closeVocWriteModal;
window.saveVoc = saveVoc;
