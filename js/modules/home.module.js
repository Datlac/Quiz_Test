window.QuizHub = window.QuizHub || {};

QuizHub.Home = {
    pendingParsedQuiz: null,
    isSaving: false,
    activeFilter: 'quiz', // 'quiz' | 'html' | 'all'
    activeHtmlRepo: null,

    getSafeCloudUrl() {
        if (QuizHub.Storage && typeof QuizHub.Storage.getCloudUrl === 'function') {
            return QuizHub.Storage.getCloudUrl();
        }
        if (QuizHub.Config && typeof QuizHub.Config.getFirebaseUrl === 'function') {
            return QuizHub.Config.getFirebaseUrl();
        }
        return localStorage.getItem('quizhub_firebase_url_v1') || '';
    },

    setFilter(filterType) {
        this.activeFilter = filterType;
        document.querySelectorAll('.home-filter-btn').forEach(btn => {
            const isActive = btn.dataset.homeFilter === filterType;
            btn.className = isActive
                ? 'home-filter-btn px-3.5 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm transition-all'
                : 'home-filter-btn px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-all';
        });
        this.renderGrid(true);
    },

    generateHtmlCover(title, byteSize) {
        const safeTitle = (title || 'Trang HTML')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 34);
        const kb = Math.max(1, Math.round((byteSize || 0) / 1024));
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320">
            <defs>
                <linearGradient id="gh" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#059669"/>
                    <stop offset="100%" stop-color="#0f766e"/>
                </linearGradient>
            </defs>
            <rect width="640" height="320" fill="url(#gh)"/>
            <circle cx="560" cy="60" r="110" fill="rgba(255,255,255,0.08)"/>
            <rect x="36" y="34" width="120" height="30" rx="15" fill="rgba(255,255,255,0.2)"/>
            <text x="96" y="54" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">HTML PAGE</text>
            <text x="36" y="148" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">${safeTitle}</text>
            <text x="36" y="186" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="500" fill="rgba(255,255,255,0.85)">Trang HTML độc lập • ~${kb} KB</text>
            <rect x="36" y="235" width="160" height="36" rx="10" fill="rgba(15,23,42,0.35)"/>
            <text x="116" y="258" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">&lt;HTML /&gt;</text>
        </svg>`.trim();
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    },

    async renderGrid(skipCloudPull = false) {
        const gridEl = document.getElementById('quiz-grid');
        if (!gridEl) return;

        const keyword = (document.getElementById('home-search')?.value || '').trim().toLowerCase();
        const items = await QuizHub.Storage.getAllQuizzes(skipCloudPull);

        const quizItems = items.filter(i => i.itemType !== 'html');
        const htmlItems = items.filter(i => i.itemType === 'html');
        const totalQuestions = quizItems.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

        // Cập nhật số lượng trên Banner và các Tab lọc
        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setText('home-total-repos', quizItems.length);
        setText('home-total-questions', totalQuestions);
        setText('count-tab-quiz', quizItems.length);
        setText('count-tab-html', htmlItems.length);
        setText('count-tab-all', items.length);

        const syncBadge = document.getElementById('sync-status-badge');
        if (syncBadge) {
            const hasCloud = !!this.getSafeCloudUrl();
            syncBadge.innerHTML = hasCloud
                ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cloud &amp; Local Sync'
                : '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Lưu vĩnh viễn';
        }

        // Lọc theo Tab đang chọn
        let scopedItems = items;
        if (this.activeFilter === 'quiz') scopedItems = quizItems;
        else if (this.activeFilter === 'html') scopedItems = htmlItems;

        const filtered = scopedItems.filter(q => {
            if (!keyword) return true;
            return (q.title || '').toLowerCase().includes(keyword) ||
                   (q.subtitle || '').toLowerCase().includes(keyword);
        });

        if (filtered.length === 0) {
            const emptyMsg = this.activeFilter === 'html'
                ? 'Chưa có trang HTML nào. Bấm nút <strong>"🌐 Thêm trang HTML"</strong> ở góc trên để thêm.'
                : 'Chưa có kho quiz nào phù hợp. Bấm nút <strong>"+ Thêm Quiz mới"</strong> ở góc trên để thêm.';
            gridEl.innerHTML = `
                <div class="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
                    <div class="text-4xl">${this.activeFilter === 'html' ? '🌐' : '📭'}</div>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">Danh sách trống</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${emptyMsg}</p>
                </div>
            `;
            return;
        }

        const cardsHtml = await Promise.all(filtered.map(async (item) => {
            const safeTitle = QuizHub.App.escapeHtml(item.title);
            const safeSubtitle = QuizHub.App.escapeHtml(item.subtitle || '');

            // --- RENDER THẺ CHO TRANG HTML ---
            if (item.itemType === 'html') {
                const kb = Math.max(1, Math.round((item.htmlContent?.length || 0) / 1024));
                const fallbackCover = this.generateHtmlCover(item.title, item.htmlContent?.length || 0);
                return `
                    <article class="quiz-card bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500 flex flex-col">
                        <div class="relative h-44 bg-slate-900 overflow-hidden cursor-pointer" onclick="QuizHub.Home.openHtmlViewer('${item.id}')">
                            <img src="${item.coverImage || fallbackCover}" onerror="this.src='${fallbackCover}'" alt="${safeTitle}" class="w-full h-full object-cover">
                            <div class="absolute top-3 left-3 flex items-center gap-1.5">
                                <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-600/90 text-white backdrop-blur-sm">
                                    🌐 HTML
                                </span>
                                <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/75 text-white backdrop-blur-sm">
                                    ~${kb} KB
                                </span>
                            </div>
                        </div>

                        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div class="space-y-2 cursor-pointer" onclick="QuizHub.Home.openHtmlViewer('${item.id}')">
                                <h3 class="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 transition-colors">
                                    ${safeTitle}
                                </h3>
                                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    ${safeSubtitle || 'Trang HTML độc lập được lưu trữ trên QuizHub.'}
                                </p>
                            </div>

                            <div class="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onclick="QuizHub.Home.openHtmlViewer('${item.id}')" class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors">
                                    ▶️ Mở trang HTML
                                </button>
                                <button type="button" onclick="QuizHub.Home.openHtmlInNewTab('${item.id}')" title="Mở ở tab trình duyệt mới" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                                    ↗️
                                </button>
                                <button type="button" data-quiz-id="${item.id}" data-quiz-title="${safeTitle}" onclick="QuizHub.Home.handleDeleteClick(this)" title="Xóa trang HTML" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }

            // --- RENDER THẺ CHO KHO QUIZ ---
            const prog = await QuizHub.Storage.getProgress(item.id);
            const totalQ = item.questions?.length || 0;
            const doneQ = Object.keys(prog.answeredIds || {}).length;
            const pct = totalQ > 0 ? Math.round((doneQ / totalQ) * 100) : 0;
            const fallbackCover = QuizHub.Parser.generateCoverDataUrl(
                item.title,
                item.topics?.length || 0,
                totalQ,
                item.createdAt || 0
            );

            return `
                <article class="quiz-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-600 flex flex-col">
                    <div class="relative h-44 bg-slate-900 overflow-hidden cursor-pointer" onclick="QuizHub.Home.openQuizWorkspace('${item.id}')">
                        <img src="${item.coverImage || fallbackCover}" onerror="this.src='${fallbackCover}'" alt="${safeTitle}" class="w-full h-full object-cover">
                        <div class="absolute top-3 left-3 flex items-center gap-1.5">
                            <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-950/75 text-white backdrop-blur-sm">
                                ${totalQ} câu hỏi
                            </span>
                            <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-600/90 text-white backdrop-blur-sm">
                                ${item.topics?.length || 0} phần
                            </span>
                        </div>
                    </div>

                    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div class="space-y-2 cursor-pointer" onclick="QuizHub.Home.openQuizWorkspace('${item.id}')">
                            <h3 class="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                ${safeTitle}
                            </h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                ${safeSubtitle}
                            </p>
                        </div>

                        <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <div class="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    <span>Tiến độ: ${doneQ}/${totalQ} câu</span>
                                    <span>${pct}%</span>
                                </div>
                                <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-brand-600 rounded-full transition-all" style="width: ${pct}%"></div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 pt-1">
                                <button type="button" onclick="QuizHub.Home.openQuizWorkspace('${item.id}')" class="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors">
                                    🚀 Vào ôn tập
                                </button>
                                <button type="button" data-quiz-id="${item.id}" data-quiz-title="${safeTitle}" onclick="QuizHub.Home.handleDeleteClick(this)" title="Xóa kho quiz này" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }));

        gridEl.innerHTML = cardsHtml.join('');
    },

    async openQuizWorkspace(quizId) {
        const quiz = await QuizHub.Storage.getQuizById(quizId);
        if (!quiz) return;
        await QuizHub.Quiz.loadQuizRepo(quiz);
        QuizHub.Notes.loadNotesRepo(quiz);
        QuizHub.App.switchView('quiz-dash');
    },

    // --- TRÌNH XEM TRANG HTML ĐỘC LẬP ---
    async openHtmlViewer(itemId) {
        const item = await QuizHub.Storage.getQuizById(itemId);
        if (!item || item.itemType !== 'html') return;
        this.activeHtmlRepo = item;
        document.getElementById('html-viewer-title').textContent = item.title || 'Trang HTML';
        document.getElementById('html-viewer-frame').srcdoc = item.htmlContent || '';
        QuizHub.App.switchView('html-viewer');
    },

    reloadActiveHtml() {
        if (!this.activeHtmlRepo) return;
        const frame = document.getElementById('html-viewer-frame');
        frame.srcdoc = '';
        setTimeout(() => { frame.srcdoc = this.activeHtmlRepo.htmlContent || ''; }, 30);
    },

    async openHtmlInNewTab(itemId) {
        const item = await QuizHub.Storage.getQuizById(itemId);
        if (!item || !item.htmlContent) return;
        const blob = new Blob([item.htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    },

    openActiveHtmlInNewTab() {
        if (this.activeHtmlRepo) this.openHtmlInNewTab(this.activeHtmlRepo.id);
    },

    // --- MODAL THÊM TRANG HTML ---
    openAddHtmlModal() {
        this.isSaving = false;
        document.getElementById('input-html-title').value = '';
        document.getElementById('input-html-cover').value = '';
        document.getElementById('input-html-desc').value = '';
        document.getElementById('input-html-raw').value = '';
        document.getElementById('modal-add-html').classList.remove('hidden');
    },

    closeAddHtmlModal() {
        document.getElementById('modal-add-html').classList.add('hidden');
    },

    async handleHtmlFileUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const content = await file.text();
        document.getElementById('input-html-raw').value = content;
        const titleInput = document.getElementById('input-html-title');
        if (!titleInput.value.trim()) {
            const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(content);
            titleInput.value = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.html?$/i, '');
        }
        event.target.value = '';
    },

    async submitNewHtml() {
        if (this.isSaving) return;
        const rawHtml = (document.getElementById('input-html-raw').value || '').trim();
        if (!rawHtml) {
            QuizHub.App.showModal('Thiếu mã HTML', 'Vui lòng dán mã nguồn HTML hoặc chọn tệp .html trước khi lưu.', null, false, 'Đóng');
            return;
        }

        let title = (document.getElementById('input-html-title').value || '').trim();
        if (!title) {
            const match = /<title[^>]*>([^<]+)<\/title>/i.exec(rawHtml);
            title = match ? match[1].trim() : 'Trang HTML Mới';
        }
        const subtitle = (document.getElementById('input-html-desc').value || '').trim() || 'Trang HTML độc lập được lưu trên QuizHub.';
        const cover = (document.getElementById('input-html-cover').value || '').trim() || this.generateHtmlCover(title, rawHtml.length);

        const htmlObj = {
            id: 'html-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            itemType: 'html',
            title,
            subtitle,
            coverImage: cover,
            htmlContent: rawHtml,
            createdAt: Date.now()
        };

        const saveBtn = document.getElementById('btn-confirm-add-html');
        this.isSaving = true;
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Đang lưu...';

        try {
            await QuizHub.Storage.saveQuiz(htmlObj);
            this.closeAddHtmlModal();
            // Tự động chuyển sang tab Trang HTML để xem ngay mục vừa thêm
            this.setFilter('html');
        } catch (err) {
            QuizHub.App.showModal('Lỗi lưu trang HTML', err.message || 'Không thể lưu dữ liệu.', null, false, 'Đóng');
        } finally {
            this.isSaving = false;
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Lưu trang HTML';
        }
    },

    // --- MODAL THÊM KHO QUIZ MỚI (GIỮ NGUYÊN) ---
    openAddQuizModal() {
        this.pendingParsedQuiz = null;
        this.isSaving = false;
        document.getElementById('input-quiz-title').value = '';
        document.getElementById('input-quiz-cover').value = '';
        document.getElementById('input-quiz-raw').value = '';
        document.getElementById('parse-preview-box').innerHTML =
            'Chưa có dữ liệu. Hãy dán mã nguồn file quiz vào ô phía trên để hệ thống kiểm tra cấu trúc.';
        const saveBtn = document.getElementById('btn-confirm-add-quiz');
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 Lưu & Đồng bộ vĩnh viễn';
        document.getElementById('modal-add-quiz').classList.remove('hidden');
    },

    closeAddQuizModal() {
        document.getElementById('modal-add-quiz').classList.add('hidden');
    },

    previewParsedQuiz() {
        const raw = document.getElementById('input-quiz-raw').value;
        const title = document.getElementById('input-quiz-title').value;
        const cover = document.getElementById('input-quiz-cover').value;
        const previewBox = document.getElementById('parse-preview-box');
        const saveBtn = document.getElementById('btn-confirm-add-quiz');

        if (!raw.trim()) {
            this.pendingParsedQuiz = null;
            saveBtn.disabled = true;
            previewBox.innerHTML = 'Chưa có dữ liệu. Hãy dán mã nguồn file quiz vào ô phía trên để hệ thống kiểm tra cấu trúc.';
            return;
        }

        try {
            const parsed = QuizHub.Parser.parseRawInput(raw, title, cover);
            parsed.itemType = 'quiz';
            this.pendingParsedQuiz = parsed;
            saveBtn.disabled = false;
            previewBox.innerHTML = `
                <div class="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                    <span>✅ Nhận diện cấu trúc hợp lệ!</span>
                </div>
                <div class="mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
                    <div>• <strong>Tên kho:</strong> ${QuizHub.App.escapeHtml(parsed.title)}</div>
                    <div>• <strong>Quy mô:</strong> ${parsed.topics.length} chuyên đề • ${parsed.questions.length} câu hỏi • ${parsed.notes.length} thẻ sổ tay</div>
                </div>
            `;
        } catch (err) {
            this.pendingParsedQuiz = null;
            saveBtn.disabled = true;
            previewBox.innerHTML = `<span class="text-rose-600 dark:text-rose-400 font-semibold">⚠️ ${QuizHub.App.escapeHtml(err.message)}</span>`;
        }
    },

    async submitNewQuiz() {
        if (this.isSaving) return;
        this.previewParsedQuiz();
        if (!this.pendingParsedQuiz) return;

        const saveBtn = document.getElementById('btn-confirm-add-quiz');
        this.isSaving = true;
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ Đang lưu...';

        try {
            await QuizHub.Storage.saveQuiz(this.pendingParsedQuiz);
            this.closeAddQuizModal();
            this.setFilter('quiz');
        } catch (err) {
            QuizHub.App.showModal('Lỗi lưu kho Quiz', err.message || 'Không thể lưu dữ liệu.', null, false, 'Đóng');
        } finally {
            this.isSaving = false;
            saveBtn.textContent = '💾 Lưu & Đồng bộ vĩnh viễn';
        }
    },

    handleDeleteClick(btnEl) {
        const quizId = btnEl.dataset.quizId;
        const quizTitle = btnEl.dataset.quizTitle || 'mục này';
        this.confirmDeleteQuiz(quizId, quizTitle);
    },

    confirmDeleteQuiz(quizId, quizTitle) {
        QuizHub.App.showModal(
            'Xóa vĩnh viễn?',
            `Bạn có chắc chắn muốn xóa "${quizTitle}" khỏi hệ thống?`,
            async () => {
                await QuizHub.Storage.deleteQuiz(quizId);
                await this.renderGrid(true);
            },
            true,
            'Xóa vĩnh viễn'
        );
    },

    // --- MODAL CẤU HÌNH CLOUD SYNC ---
    openSyncModal() {
        document.getElementById('input-firebase-url').value = this.getSafeCloudUrl();
        document.getElementById('modal-sync').classList.remove('hidden');
    },

    closeSyncModal() {
        document.getElementById('modal-sync').classList.add('hidden');
    },

    async saveSyncConfig() {
        const url = (document.getElementById('input-firebase-url').value || '').trim().replace(/\/+$/, '');
        if (QuizHub.Config && typeof QuizHub.Config.setFirebaseUrl === 'function') {
            QuizHub.Config.setFirebaseUrl(url);
        } else if (url) {
            localStorage.setItem('quizhub_firebase_url_v1', url);
        } else {
            localStorage.removeItem('quizhub_firebase_url_v1');
        }
        this.closeSyncModal();
        QuizHub.Storage.startRealtimeSync(() => this.renderGrid(true));
        await this.renderGrid(false);
    }
};
