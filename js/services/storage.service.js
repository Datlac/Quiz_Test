window.QuizHub = window.QuizHub || {};

QuizHub.Storage = {
    DB_NAME: 'QuizHubPermanentDB',
    DB_VERSION: 1,
    db: null,
    eventSource: null,
    realtimeCallback: null,

    getCloudUrl() {
        if (window.QuizHub && QuizHub.Config && typeof QuizHub.Config.getFirebaseUrl === 'function') {
            return QuizHub.Config.getFirebaseUrl();
        }
        return localStorage.getItem('quizhub_firebase_url_v1') || '';
    },

    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('quizzes')) {
                    db.createObjectStore('quizzes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'quizId' });
                }
            };
            req.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    },

    // Ghi đè toàn bộ kho cục bộ khớp 100% với dữ liệu Cloud (đồng bộ cả lệnh xóa)
    async replaceLocalQuizzesFromMap(cloudMap) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizzes', 'readwrite');
            const store = tx.objectStore('quizzes');
            store.clear();
            if (cloudMap && typeof cloudMap === 'object') {
                Object.values(cloudMap).forEach(q => {
                    if (q && q.id) store.put(q);
                });
            }
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    async putLocalQuizOnly(quizObj) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizzes', 'readwrite');
            tx.objectStore('quizzes').put(quizObj);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteLocalQuizOnly(quizId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['quizzes', 'progress'], 'readwrite');
            tx.objectStore('quizzes').delete(quizId);
            tx.objectStore('progress').delete(quizId);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    // --- KẾT NỐI LẮNG NGHE REALTIME TỪ FIREBASE (KHÔNG CẦN F5) ---
    startRealtimeSync(onDataChanged) {
        this.realtimeCallback = onDataChanged;
        this.stopRealtimeSync();

        const baseUrl = this.getCloudUrl();
        if (!baseUrl || typeof EventSource === 'undefined') return;

        const streamUrl = `${baseUrl}/quizhub_repos.json`;
        this.eventSource = new EventSource(streamUrl);

        const handleUpdate = async (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (!payload) return;

                if (payload.path === '/') {
                    if (payload.data && typeof payload.data === 'object') {
                        localStorage.setItem('quizhub_seeded_v1', '1');
                        await this.replaceLocalQuizzesFromMap(payload.data);
                    } else if (payload.data === null && localStorage.getItem('quizhub_seeded_v1')) {
                        await this.replaceLocalQuizzesFromMap(null);
                    }
                } else {
                    const quizId = payload.path.replace(/^\/+/, '').split('/')[0];
                    if (quizId) {
                        if (payload.data === null) {
                            await this.deleteLocalQuizOnly(quizId);
                        } else if (payload.data && payload.data.id) {
                            localStorage.setItem('quizhub_seeded_v1', '1');
                            await this.putLocalQuizOnly(payload.data);
                        }
                    }
                }

                if (typeof this.realtimeCallback === 'function') {
                    this.realtimeCallback();
                }
            } catch (err) {
                console.warn('Lỗi xử lý gói tin Realtime:', err);
            }
        };

        this.eventSource.addEventListener('put', handleUpdate);
        this.eventSource.addEventListener('patch', handleUpdate);
        this.eventSource.onerror = () => {
            console.warn('Mất kết nối Realtime tạm thời, trình duyệt đang tự kết nối lại...');
        };
    },

    stopRealtimeSync() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    },

    async getAllQuizzes(skipCloudPull = false) {
        await this.init();
        if (!skipCloudPull) {
            await this.pullFromCloudIfEnabled();
        }

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizzes', 'readonly');
            const req = tx.objectStore('quizzes').getAll();
            req.onsuccess = async () => {
                let list = req.result || [];
                if (list.length === 0 && !localStorage.getItem('quizhub_seeded_v1') && QuizHub.DefaultQuiz) {
                    const def = { ...QuizHub.DefaultQuiz };
                    def.coverImage = QuizHub.Parser.generateCoverDataUrl(
                        def.title,
                        def.topics.length,
                        def.questions.length,
                        0
                    );
                    await this.saveQuiz(def);
                    localStorage.setItem('quizhub_seeded_v1', '1');
                    list = [def];
                }
                list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                resolve(list);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    },

    async getQuizById(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizzes', 'readonly');
            const req = tx.objectStore('quizzes').get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = (e) => reject(e.target.error);
        });
    },

    async saveQuiz(quizObj) {
        await this.putLocalQuizOnly(quizObj);
        localStorage.setItem('quizhub_seeded_v1', '1');
        await this.pushQuizToCloudIfEnabled(quizObj);
    },

    async deleteQuiz(quizId) {
        await this.deleteLocalQuizOnly(quizId);
        localStorage.setItem('quizhub_seeded_v1', '1');
        await this.deleteQuizFromCloudIfEnabled(quizId);
    },

    async getProgress(quizId) {
        await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction('progress', 'readonly');
            const req = tx.objectStore('progress').get(quizId);
            req.onsuccess = () => resolve(req.result || { quizId, answeredIds: {}, wrongBank: [] });
            req.onerror = () => resolve({ quizId, answeredIds: {}, wrongBank: [] });
        });
    },

    async saveProgress(progressObj) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('progress', 'readwrite');
            tx.objectStore('progress').put(progressObj);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    },

    async pushQuizToCloudIfEnabled(quizObj) {
        const baseUrl = this.getCloudUrl();
        if (!baseUrl) return;
        const res = await fetch(`${baseUrl}/quizhub_repos/${encodeURIComponent(quizObj.id)}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quizObj)
        });
        if (!res.ok) {
            throw new Error(`Không thể đồng bộ lên Firebase (HTTP ${res.status}). Hãy kiểm tra lại Database Rules.`);
        }
    },

    async deleteQuizFromCloudIfEnabled(quizId) {
        const baseUrl = this.getCloudUrl();
        if (!baseUrl) return;
        const res = await fetch(`${baseUrl}/quizhub_repos/${encodeURIComponent(quizId)}.json`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            console.warn(`Xóa trên Firebase thất bại (HTTP ${res.status})`);
        }
    },

    async pullFromCloudIfEnabled() {
        const baseUrl = this.getCloudUrl();
        if (!baseUrl) return;
        try {
            const res = await fetch(`${baseUrl}/quizhub_repos.json`);
            if (!res.ok) return;
            const data = await res.json();
            if (data && typeof data === 'object') {
                localStorage.setItem('quizhub_seeded_v1', '1');
                await this.replaceLocalQuizzesFromMap(data);
            } else if (data === null && localStorage.getItem('quizhub_seeded_v1')) {
                await this.replaceLocalQuizzesFromMap(null);
            }
        } catch (err) {
            console.warn('Không thể tải từ Cloud, sử dụng bản lưu cục bộ:', err);
        }
    },

    async exportBackup() {
        const quizzes = await this.getAllQuizzes(true);
        const blob = new Blob([JSON.stringify(quizzes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quizhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importBackup(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error('File backup không hợp lệ.');
            for (const q of arr) {
                const isQuiz = q && q.id && Array.isArray(q.questions);
                const isHtml = q && q.id && q.itemType === 'html' && typeof q.htmlContent === 'string';
                if (isQuiz || isHtml) {
                    await this.saveQuiz(q);
                }
            }
            QuizHub.Home.closeSyncModal();
            await QuizHub.Home.renderGrid(true);
        } catch (err) {
            QuizHub.App.showModal('Lỗi nhập sao lưu', err.message, null, false, 'Đóng');
        } finally {
            event.target.value = '';
        }
    }
};
