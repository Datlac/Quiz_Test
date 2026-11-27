window.QuizHub = window.QuizHub || {};

// Quản lý Trang chủ Grid: Hiển thị các kho quiz, tìm kiếm, thêm mới từ file index & xóa
QuizHub.Home = {
    pendingParsedQuiz: null,
    isSaving: false,

    getSafeCloudUrl() {
        if (QuizHub.Storage && typeof QuizHub.Storage.getCloudUrl === 'function') {
            return QuizHub.Storage.getCloudUrl();
        }
        if (QuizHub.Config && typeof QuizHub.Config.getFirebaseUrl === 'function') {
            return QuizHub.Config.getFirebaseUrl();
        }
        return localStorage.getItem('quizhub_firebase_url_v1') || '';
    },

    async renderGrid(skipCloudPull = false) {
        const gridEl = document.getElementById('quiz-grid');
        if (!gridEl) return;

        const keyword = (document.getElementById('home-search')?.value || '').trim().toLowerCase();
        const quizzes = await QuizHub.Storage.getAllQuizzes(skipCloudPull);
        const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

        const totalReposEl = document.getElementById('home-total-repos');
        const totalQsEl = document.getElementById('home-total-questions');
        if (totalReposEl) totalReposEl.textContent = quizzes.length;
        if (totalQsEl) totalQsEl.textContent = totalQuestions;

        // Cập nhật badge trạng thái lưu trữ / đồng bộ Cloud
        const syncBadge = document.getElementById('sync-status-badge');
        if (syncBadge) {
            const hasCloud = !!this.getSafeCloudUrl();
            syncBadge.innerHTML = hasCloud
                ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cloud &amp; Local Sync'
                : '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Lưu vĩnh viễn';
        }

        const filtered = quizzes.filter(q => {
            if (!keyword) return true;
            return (q.title || '').toLowerCase().includes(keyword) ||
                   (q.subtitle || '').toLowerCase().includes(keyword);
        });

        if (filtered.length === 0) {
            gridEl.innerHTML = `
                <div class="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
                    <div class="text-4xl">📭</div>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">Chưa có kho quiz nào phù hợp</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Bấm nút <strong>"+ Thêm Quiz mới (Dán Index)"</strong> ở góc trên để thêm bộ đề đầu tiên của bạn.</p>
                </div>
            `;
            return;
        }

        const cardsHtml = await Promise.all(filtered.map(async (quiz) => {
            const prog = await QuizHub.Storage.getProgress(quiz.id);
            const totalQ = quiz.questions?.length || 0;
            const doneQ = Object.keys(prog.answeredIds || {}).length;
            const pct = totalQ > 0 ? Math.round((doneQ / totalQ) * 100) : 0;
            const fallbackCover = QuizHub.Parser.generateCoverDataUrl(
                quiz.title,
                quiz.topics?.length || 0,
                totalQ,
                quiz.createdAt || 0
            );
            const safeTitle = QuizHub.App.escapeHtml(quiz.title);
            const safeSubtitle = QuizHub.App.escapeHtml(quiz.subtitle || '');

            return `
                <article class="quiz-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-400 dark:hover:border-brand-600 flex flex-col">
                    <!-- Ảnh bìa minh họa kho Quiz -->
                    <div class="relative h-44 bg-slate-900 overflow-hidden cursor-pointer" onclick="QuizHub.Home.openQuizWorkspace('${quiz.id}')">
                        <img src="${quiz.coverImage || fallbackCover}" onerror="this.src='${fallbackCover}'" alt="${safeTitle}" class="w-full h-full object-cover">
                        <div class="absolute top-3 left-3 flex items-center gap-1.5">
                            <span class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-950/75 text-white backdrop-blur-sm">
                                ${totalQ} câu hỏi
                            </span>
                            <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-600/90 text-white backdrop-blur-sm">
                                ${quiz.topics?.length || 0} phần
                            </span>
                        </div>
                    </div>

                    <!-- Nội dung thẻ -->
                    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div class="space-y-2 cursor-pointer" onclick="QuizHub.Home.openQuizWorkspace('${quiz.id}')">
                            <h3 class="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                                ${safeTitle}
                            </h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                ${safeSubtitle}
                            </p>
                        </div>

                        <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <!-- Thanh tiến độ ôn tập -->
                            <div>
                                <div class="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    <span>Tiến độ: ${doneQ}/${totalQ} câu</span>
                                    <span>${pct}%</span>
                                </div>
                                <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-brand-600 rounded-full transition-all" style="width: ${pct}%"></div>
                                </div>
                            </div>

                            <!-- Nút hành động -->
                            <div class="flex items-center gap-2 pt-1">
                                <button type="button" onclick="QuizHub.Home.openQuizWorkspace('${quiz.id}')" class="flex-1 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-colors">
                                    🚀 Vào ôn tập
                                </button>
                                <button type="button" data-quiz-id="${quiz.id}" data-quiz-title="${safeTitle}" onclick="QuizHub.Home.handleDeleteClick(this)" title="Xóa kho quiz này" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
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

    // --- MODAL THÊM KHO QUIZ MỚI ---
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
            await this.renderGrid();
        } catch (err) {
            QuizHub.App.showModal('Lỗi lưu kho Quiz', err.message || 'Không thể lưu dữ liệu.', null, false, 'Đóng');
        } finally {
            this.isSaving = false;
            saveBtn.textContent = '💾 Lưu & Đồng bộ vĩnh viễn';
        }
    },

    handleDeleteClick(btnEl) {
        const quizId = btnEl.dataset.quizId;
        const quizTitle = btnEl.dataset.quizTitle || 'kho quiz này';
        this.confirmDeleteQuiz(quizId, quizTitle);
    },

    confirmDeleteQuiz(quizId, quizTitle) {
        QuizHub.App.showModal(
            'Xóa vĩnh viễn kho Quiz?',
            `Bạn có chắc chắn muốn xóa kho "${quizTitle}" và toàn bộ tiến độ ôn tập của kho này khỏi hệ thống?`,
            async () => {
                await QuizHub.Storage.deleteQuiz(quizId);
                await this.renderGrid();
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
