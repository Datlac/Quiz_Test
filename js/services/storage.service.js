window.QuizHub = window.QuizHub || {};

QuizHub.Storage = {
    DB_NAME: 'QuizHubPermanentDB',
    DB_VERSION: 1,
    db: null,

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

    async getAllQuizzes() {
        await this.init();
        await this.pullFromCloudIfEnabled();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizzes', 'readonly');
            const store = tx.objectStore('quizzes');
            const req = store.getAll();
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
        await this.init();
        await new Promise((resolve, reject) => {
            const tx = this.db.transaction('quizzes', 'readwrite');
            tx.objectStore('quizzes').put(quizObj);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
        localStorage.setItem('quizhub_seeded_v1', '1');
        await this.pushQuizToCloudIfEnabled(quizObj);
    },

    async deleteQuiz(quizId) {
        await this.init();
        await new Promise((resolve, reject) => {
            const tx = this.db.transaction(['quizzes', 'progress'], 'readwrite');
            tx.objectStore('quizzes').delete(quizId);
            tx.objectStore('progress').delete(quizId);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
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
        try {
            await fetch(`${baseUrl}/quizhub_repos/${encodeURIComponent(quizObj.id)}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizObj)
            });
        } catch (err) {
            console.warn('Đồng bộ Cloud thất bại (đã lưu cục bộ):', err);
        }
    },

    async deleteQuizFromCloudIfEnabled(quizId) {
        const baseUrl = this.getCloudUrl();
        if (!baseUrl) return;
        try {
            await fetch(`${baseUrl}/quizhub_repos/${encodeURIComponent(quizId)}.json`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.warn('Xóa trên Cloud thất bại:', err);
        }
    },

    async pullFromCloudIfEnabled() {
        const baseUrl = this.getCloudUrl();
        if (!baseUrl) return;
        try {
            const res = await fetch(`${baseUrl}/quizhub_repos.json`);
            if (!res.ok) return;
            const data = await res.json();
            if (!data || typeof data !== 'object') return;
            const tx = this.db.transaction('quizzes', 'readwrite');
            const store = tx.objectStore('quizzes');
            Object.values(data).forEach(q => {
                if (q && q.id) store.put(q);
            });
            await new Promise(r => { tx.oncomplete = r; });
        } catch (err) {
            console.warn('Không thể tải từ Cloud, sử dụng bản lưu cục bộ:', err);
        }
    },

    async exportBackup() {
        const quizzes = await this.getAllQuizzes();
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
                if (q && q.id && Array.isArray(q.questions)) {
                    await this.saveQuiz(q);
                }
            }
            QuizHub.Home.closeSyncModal();
            await QuizHub.Home.renderGrid();
        } catch (err) {
            QuizHub.App.showModal('Lỗi nhập sao lưu', err.message, null, false, 'Đóng');
        } finally {
            event.target.value = '';
        }
    }
};
