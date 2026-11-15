window.QuizHub = window.QuizHub || {};

// Lõi làm bài trắc nghiệm cho từng kho quiz (chọn chuyên đề, ôn tập, thi thử, chấm điểm)
QuizHub.Quiz = {
    currentRepo: null,
    state: {
        selectedTopics: [],
        onlyWrongBank: false,
        mode: 'practice',
        questionLevel: 'all',
        questionCount: 0,
        examDurationMinutes: 15,
        stats: { quizId: '', answeredIds: {}, wrongBank: [] }
    },
    session: {
        active: false,
        questions: [],
        currentIndex: 0,
        userAnswers: {},
        flagged: {},
        timerInterval: null,
        secondsLeft: 0,
        startTime: 0,
        reviewFilter: 'all',
        lastLabel: ''
    },

    async loadQuizRepo(quizObj) {
        this.currentRepo = quizObj;
        this.state.selectedTopics = quizObj.topics.map(t => t.id);
        this.state.onlyWrongBank = false;
        this.state.mode = 'practice';
        this.state.questionLevel = 'all';
        this.state.questionCount = 0;
        this.state.stats = await QuizHub.Storage.getProgress(quizObj.id);

        document.getElementById('active-quiz-title').textContent = quizObj.title;
        document.getElementById('active-quiz-subtitle').textContent = quizObj.subtitle || '';
        document.getElementById('active-quiz-badge').textContent =
            `${quizObj.topics.length} chuyên đề • ${quizObj.questions.length} câu hỏi`;

        // Ẩn/hiện tab Sổ tay nếu kho quiz không có notes
        const notesTab = document.getElementById('nav-quiz-notes');
        if (notesTab) {
            notesTab.style.display = (quizObj.notes && quizObj.notes.length > 0) ? 'inline-block' : 'none';
        }

        // Ẩn/hiện nút luyện câu code nếu kho quiz không có câu type === 'code'
        const hasCodeQs = quizObj.questions.some(q => q.type === 'code');
        const codeBtn = document.getElementById('btn-quick-code-trap');
        if (codeBtn) {
            codeBtn.style.display = hasCodeQs ? 'flex' : 'none';
        }

        this.selectMode('practice');
        this.selectLevel('all');
        this.selectCount(0);
        this.renderDashboard();
    },

    renderDashboard() {
        if (!this.currentRepo) return;
        const QUESTIONS = this.currentRepo.questions;
        const TOPICS = this.currentRepo.topics;

        const answeredEntries = Object.entries(this.state.stats.answeredIds || {});
        const totalAnswered = answeredEntries.length;
        const totalCorrect = answeredEntries.filter(([, isRight]) => isRight).length;
        const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        const coverage = QUESTIONS.length > 0 ? Math.round((totalAnswered / QUESTIONS.length) * 100) : 0;

        document.getElementById('stat-answered').textContent = `${totalAnswered}/${QUESTIONS.length}`;
        document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
        document.getElementById('stat-wrong-bank').textContent = this.state.stats.wrongBank.length;
        document.getElementById('stat-coverage-text').textContent = `${coverage}%`;
        document.getElementById('stat-coverage-bar').style.width = `${coverage}%`;

        const topicContainer = document.getElementById('topic-list');
        let html = '';

        if (this.state.stats.wrongBank.length > 0) {
            const isWrongSel = this.state.onlyWrongBank;
            html += `
                <div class="p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isWrongSel ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40' : 'border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900'
                }">
                    <div class="space-y-1 cursor-pointer flex-1" onclick="QuizHub.Quiz.toggleWrongBankMode()">
                        <span class="font-bold text-sm text-rose-700 dark:text-rose-300">⚠️ Kho câu hỏi từng làm sai (${this.state.stats.wrongBank.length} câu)</span>
                        <p class="text-xs text-slate-600 dark:text-slate-400">Ôn lại những câu bạn đã làm sai để xóa khỏi danh sách cần ôn.</p>
                    </div>
                    <button type="button" onclick="QuizHub.Quiz.startWrongBankQuiz()" class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">
                        Ôn ngay ${this.state.stats.wrongBank.length} câu
                    </button>
                </div>
            `;
        } else {
            this.state.onlyWrongBank = false;
        }

        html += TOPICS.map(t => {
            const isSelected = !this.state.onlyWrongBank && this.state.selectedTopics.includes(t.id);
            const qs = QUESTIONS.filter(q => q.topic === t.id);
            const doneCount = qs.filter(q => this.state.stats.answeredIds[q.id] !== undefined).length;

            return `
                <div class="p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                    ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }">
                    <div onclick="QuizHub.Quiz.toggleTopicSelection('${t.id}')" class="flex items-start gap-3.5 cursor-pointer flex-1">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); QuizHub.Quiz.toggleTopicSelection('${t.id}')" class="mt-1 w-4 h-4 rounded text-brand-600 cursor-pointer shrink-0">
                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-bold text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-white'}">${QuizHub.App.escapeHtml(t.name)}</span>
                                <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">${QuizHub.App.escapeHtml(t.file || `${qs.length} câu`)}</span>
                            </div>
                            <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">${QuizHub.App.escapeHtml(t.desc || '')}</p>
                        </div>
                    </div>
                    <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pl-7 sm:pl-0">
                        <span class="text-[11px] font-semibold text-slate-400">Đã làm ${doneCount}/${qs.length}</span>
                        <button type="button" onclick="QuizHub.Quiz.practiceSingleTopic('${t.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-200 transition-colors">
                            Ôn riêng phần này →
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        topicContainer.innerHTML = html;
    },

    toggleTopicSelection(topicId) {
        this.state.onlyWrongBank = false;
        const idx = this.state.selectedTopics.indexOf(topicId);
        if (idx === -1) this.state.selectedTopics.push(topicId);
        else this.state.selectedTopics.splice(idx, 1);
        this.renderDashboard();
    },

    selectAllTopics(selectAll) {
        this.state.onlyWrongBank = false;
        this.state.selectedTopics = selectAll ? this.currentRepo.topics.map(t => t.id) : [];
        this.renderDashboard();
    },

    toggleWrongBankMode() {
        this.state.onlyWrongBank = !this.state.onlyWrongBank;
        this.renderDashboard();
    },

    practiceSingleTopic(topicId) {
        this.state.onlyWrongBank = false;
        this.state.selectedTopics = [topicId];
        this.selectMode('practice');
        const topicQs = this.currentRepo.questions.filter(q => q.topic === topicId);
        const tObj = this.currentRepo.topics.find(t => t.id === topicId);
        this.startQuiz(topicQs, tObj ? tObj.name : 'Ôn tập chủ đề');
    },

    startWrongBankQuiz() {
        const wrongQs = this.currentRepo.questions.filter(q => this.state.stats.wrongBank.includes(q.id));
        if (wrongQs.length === 0) return;
        this.selectMode('practice');
        this.startQuiz(wrongQs, `Ôn lại ${wrongQs.length} câu làm sai`);
    },

    startStandardExam() {
        const pool = this.shuffleArray(this.currentRepo.questions).slice(0, 40);
        this.selectMode('exam');
        this.selectDuration(45);
        this.startQuiz(pool, `Thi thử Chuẩn (${pool.length} câu - 45 phút)`);
    },

    startCodeTrapPractice() {
        const codeQs = this.currentRepo.questions.filter(q => q.type === 'code');
        if (codeQs.length === 0) return;
        this.selectMode('practice');
        this.startQuiz(codeQs, `Luyện ${codeQs.length} câu Đọc code & Bẫy`);
    },

    selectMode(mode) {
        this.state.mode = mode;
        const btnP = document.getElementById('mode-practice');
        const btnE = document.getElementById('mode-exam');
        const durBox = document.getElementById('exam-duration-box');
        if (mode === 'practice') {
            btnP.className = 'p-3.5 rounded-xl border-2 border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-left transition-all';
            btnE.className = 'p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-left transition-all';
            durBox.classList.add('hidden');
        } else {
            btnE.className = 'p-3.5 rounded-xl border-2 border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-left transition-all';
            btnP.className = 'p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-left transition-all';
            durBox.classList.remove('hidden');
        }
    },

    selectLevel(level) {
        this.state.questionLevel = level;
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.className = btn.dataset.level === level
                ? 'level-btn py-2 px-2.5 rounded-xl text-xs font-bold border-2 border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                : 'level-btn py-2 px-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700';
        });
    },

    selectCount(count) {
        this.state.questionCount = count;
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.className = Number(btn.dataset.count) === count
                ? 'count-btn py-2 px-3 rounded-xl text-sm font-semibold border-2 border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                : 'count-btn py-2 px-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700';
        });
    },

    selectDuration(mins) {
        this.state.examDurationMinutes = mins;
        document.querySelectorAll('.dur-btn').forEach(btn => {
            btn.className = Number(btn.dataset.mins) === mins
                ? 'dur-btn py-2 px-3 rounded-xl text-sm font-semibold border-2 border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                : 'dur-btn py-2 px-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700';
        });
    },

    shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    },

    startQuiz(customList = null, customLabel = null) {
        const QUESTIONS = this.currentRepo.questions;
        const TOPICS = this.currentRepo.topics;
        let pool = [];
        let sessionLabel = customLabel || 'Bộ câu hỏi ôn tập tùy chỉnh';

        if (customList) {
            pool = [...customList];
        } else if (this.state.onlyWrongBank && this.state.stats.wrongBank.length > 0) {
            pool = QUESTIONS.filter(q => this.state.stats.wrongBank.includes(q.id));
            sessionLabel = `Kho câu hỏi cần ôn lại (${pool.length} câu)`;
        } else {
            const chosen = this.state.selectedTopics.length > 0
                ? this.state.selectedTopics
                : TOPICS.map(t => t.id);
            pool = QUESTIONS.filter(q => chosen.includes(q.topic));
            if (this.state.questionLevel !== 'all') {
                pool = pool.filter(q => q.type === this.state.questionLevel);
            }
            if (pool.length === 0) {
                QuizHub.App.showModal('Không có câu hỏi phù hợp', 'Hãy chọn thêm chuyên đề hoặc đặt mức độ về "Tất cả dạng".', null, false);
                return;
            }
        }

        const doShuffleQ = document.getElementById('chk-shuffle-q').checked;
        const doShuffleOpt = document.getElementById('chk-shuffle-opt').checked;

        if (doShuffleQ) pool = this.shuffleArray(pool);
        if (this.state.questionCount > 0 && pool.length > this.state.questionCount && !customList) {
            pool = pool.slice(0, this.state.questionCount);
        }

        const prepared = pool.map(q => {
            const indexedOpts = q.options.map((text, idx) => ({ text, isCorrect: idx === q.correct }));
            const finalOpts = doShuffleOpt ? this.shuffleArray(indexedOpts) : indexedOpts;
            return {
                ...q,
                mappedOptions: finalOpts.map(o => o.text),
                mappedCorrect: finalOpts.findIndex(o => o.isCorrect)
            };
        });

        this.session = {
            active: true,
            questions: prepared,
            currentIndex: 0,
            userAnswers: {},
            flagged: {},
            timerInterval: null,
            secondsLeft: this.state.examDurationMinutes * 60,
            startTime: Date.now(),
            reviewFilter: 'all',
            lastLabel: sessionLabel
        };

        document.getElementById('quiz-topic-label').textContent = sessionLabel;
        const modeBadge = document.getElementById('quiz-mode-badge');
        const timerBox = document.getElementById('quiz-timer-box');

        if (this.state.mode === 'exam') {
            modeBadge.textContent = '⏱️ Thi thử';
            modeBadge.className = 'px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800';
            timerBox.classList.remove('hidden');
            timerBox.classList.add('flex');
            this.startTimer();
        } else {
            modeBadge.textContent = '📖 Ôn tập';
            modeBadge.className = 'px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-100 text-brand-700';
            timerBox.classList.add('hidden');
            timerBox.classList.remove('flex');
            this.stopTimer();
        }

        QuizHub.App.switchView('quiz');
        this.renderQuestion();
    },

    startTimer() {
        this.stopTimer();
        this.updateTimerDisplay();
        this.session.timerInterval = setInterval(() => {
            this.session.secondsLeft--;
            this.updateTimerDisplay();
            if (this.session.secondsLeft <= 0) {
                this.stopTimer();
                this.submitQuiz(true);
            }
        }, 1000);
    },

    stopTimer() {
        if (this.session.timerInterval) {
            clearInterval(this.session.timerInterval);
            this.session.timerInterval = null;
        }
    },

    updateTimerDisplay() {
        const mins = Math.max(0, Math.floor(this.session.secondsLeft / 60));
        const secs = Math.max(0, this.session.secondsLeft % 60);
        document.getElementById('quiz-timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    renderQuestion() {
        const idx = this.session.currentIndex;
        const total = this.session.questions.length;
        const q = this.session.questions[idx];
        const userChoice = this.session.userAnswers[idx];
        const isAnswered = userChoice !== undefined;
        const isPractice = this.state.mode === 'practice';

        document.getElementById('q-number-badge').textContent = `Câu ${idx + 1}`;
        document.getElementById('q-source').textContent = q.source;
        document.getElementById('q-type-badge').textContent = q.type === 'code' ? '💻 Đọc code & Bẫy' : '📘 Lý thuyết';
        document.getElementById('quiz-progress-text').textContent = `Câu ${idx + 1} / ${total}`;
        document.getElementById('quiz-progress-bar').style.width = `${Math.round(((idx + 1) / total) * 100)}%`;

        const isFlagged = !!this.session.flagged[idx];
        document.getElementById('btn-flag-text').textContent = isFlagged ? 'Đã cắm cờ' : 'Cắm cờ';
        document.getElementById('btn-flag').className = isFlagged
            ? 'px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-700 flex items-center gap-1.5'
            : 'px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5';

        document.getElementById('q-text').textContent = q.question;
        const codeWrap = document.getElementById('q-code-wrapper');
        if (q.code) {
            codeWrap.classList.remove('hidden');
            document.getElementById('q-code').textContent = q.code;
        } else {
            codeWrap.classList.add('hidden');
        }

        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        document.getElementById('q-options').innerHTML = q.mappedOptions.map((optText, oIdx) => {
            let cardClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-brand-400';
            let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
            let statusIcon = '';

            if (isPractice && isAnswered) {
                if (oIdx === q.mappedCorrect) {
                    cardClass = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40';
                    badgeClass = 'bg-emerald-600 text-white';
                    statusIcon = '<span class="text-emerald-600 font-bold text-sm shrink-0">✓ Đúng</span>';
                } else if (oIdx === userChoice) {
                    cardClass = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40';
                    badgeClass = 'bg-rose-600 text-white';
                    statusIcon = '<span class="text-rose-600 font-bold text-sm shrink-0">✕ Bạn chọn</span>';
                } else {
                    cardClass = 'border-slate-200 dark:border-slate-800 opacity-60';
                }
            } else if (!isPractice && userChoice === oIdx) {
                cardClass = 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/50 shadow-sm';
                badgeClass = 'bg-brand-600 text-white';
            }

            const disabledAttr = (isPractice && isAnswered) ? 'disabled' : '';
            return `
                <button type="button" ${disabledAttr} onclick="QuizHub.Quiz.selectOption(${oIdx})" class="w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-3 ${cardClass}">
                    <div class="flex items-start gap-3.5">
                        <span class="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${badgeClass}">${letters[oIdx] || oIdx + 1}</span>
                        <span class="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-snug">${QuizHub.App.escapeHtml(optText)}</span>
                    </div>
                    ${statusIcon}
                </button>
            `;
        }).join('');

        const expBox = document.getElementById('q-explanation-box');
        if (isPractice && isAnswered) {
            expBox.classList.remove('hidden');
            document.getElementById('q-explanation-text').textContent = q.explanation;
        } else {
            expBox.classList.add('hidden');
        }

        document.getElementById('btn-prev').disabled = idx === 0;
        const nextBtn = document.getElementById('btn-next');
        if (idx === total - 1) {
            nextBtn.textContent = 'Hoàn tất & Nộp bài ✓';
            nextBtn.onclick = () => this.confirmSubmitQuiz();
        } else {
            nextBtn.textContent = 'Câu tiếp →';
            nextBtn.onclick = () => this.nextQuestion();
        }

        this.renderPalette();
    },

    renderPalette() {
        const total = this.session.questions.length;
        const answeredCount = Object.keys(this.session.userAnswers).length;
        document.getElementById('palette-answered-count').textContent = `${answeredCount}/${total} đã chọn`;

        document.getElementById('q-palette').innerHTML = this.session.questions.map((q, i) => {
            const isCurrent = i === this.session.currentIndex;
            const isAnswered = this.session.userAnswers[i] !== undefined;
            const isFlagged = !!this.session.flagged[i];

            let cls = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            if (this.state.mode === 'practice' && isAnswered) {
                const isRight = this.session.userAnswers[i] === q.mappedCorrect;
                cls = isRight ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
            } else if (isAnswered) {
                cls = 'bg-brand-600 text-white';
            }
            if (isFlagged && !isAnswered) cls = 'bg-amber-400 text-slate-900 font-extrabold';
            if (isCurrent) cls += ' ring-2 ring-offset-2 ring-brand-600 dark:ring-offset-slate-900';

            return `<button type="button" onclick="QuizHub.Quiz.goToQuestion(${i})" class="h-9 rounded-lg text-xs font-bold flex items-center justify-center ${cls}">${i + 1}</button>`;
        }).join('');
    },

    selectOption(optIdx) {
        const idx = this.session.currentIndex;
        const q = this.session.questions[idx];
        if (this.state.mode === 'practice' && this.session.userAnswers[idx] !== undefined) return;

        this.session.userAnswers[idx] = optIdx;
        const isCorrect = optIdx === q.mappedCorrect;

        if (this.state.mode === 'practice') {
            QuizHub.App.playTone(isCorrect ? 'correct' : 'wrong');
            this.recordQuestionStat(q.id, isCorrect);
        } else {
            QuizHub.App.playTone('click');
        }
        this.renderQuestion();
    },

    async recordQuestionStat(questionId, isCorrect) {
        this.state.stats.quizId = this.currentRepo.id;
        this.state.stats.answeredIds[questionId] = isCorrect;
        const wrongIdx = this.state.stats.wrongBank.indexOf(questionId);
        if (!isCorrect && wrongIdx === -1) this.state.stats.wrongBank.push(questionId);
        else if (isCorrect && wrongIdx !== -1) this.state.stats.wrongBank.splice(wrongIdx, 1);
        await QuizHub.Storage.saveProgress(this.state.stats);
    },

    toggleFlag() {
        const idx = this.session.currentIndex;
        this.session.flagged[idx] = !this.session.flagged[idx];
        this.renderQuestion();
    },

    goToQuestion(idx) {
        if (idx >= 0 && idx < this.session.questions.length) {
            this.session.currentIndex = idx;
            this.renderQuestion();
        }
    },

    prevQuestion() {
        if (this.session.currentIndex > 0) {
            this.session.currentIndex--;
            this.renderQuestion();
        }
    },

    nextQuestion() {
        if (this.session.currentIndex < this.session.questions.length - 1) {
            this.session.currentIndex++;
            this.renderQuestion();
        }
    },

    confirmExitQuiz() {
        QuizHub.App.showModal('Thoát bài làm hiện tại?', 'Tiến trình phiên làm bài này sẽ không được chấm điểm.', () => {
            QuizHub.App.switchView('quiz-dash');
        });
    },

    confirmSubmitQuiz() {
        const total = this.session.questions.length;
        const answered = Object.keys(this.session.userAnswers).length;
        const msg = answered < total
            ? `Bạn mới trả lời ${answered}/${total} câu. Xác nhận nộp bài ngay?`
            : `Bạn đã trả lời đủ ${total}/${total} câu. Nộp bài và xem kết quả?`;
        QuizHub.App.showModal('Xác nhận nộp bài', msg, () => this.submitQuiz(false), true, 'Nộp bài');
    },

    async submitQuiz(autoTimeout = false) {
        this.stopTimer();
        this.session.active = false;

        let correctCount = 0;
        const topicStats = {};

        for (let idx = 0; idx < this.session.questions.length; idx++) {
            const q = this.session.questions[idx];
            const choice = this.session.userAnswers[idx];
            const isRight = choice !== undefined && choice === q.mappedCorrect;
            if (isRight) correctCount++;
            if (choice !== undefined) await this.recordQuestionStat(q.id, isRight);

            if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0 };
            topicStats[q.topic].total++;
            if (isRight) topicStats[q.topic].correct++;
        }

        const total = this.session.questions.length;
        const wrongCount = total - correctCount;
        const percent = Math.round((correctCount / total) * 100);
        const score10 = Number(((correctCount / total) * 10).toFixed(2));

        document.getElementById('res-score-10').textContent = score10;
        document.getElementById('res-summary-text').textContent = `Bạn trả lời đúng ${correctCount}/${total} câu hỏi (${percent}%).`;

        const elapsedSec = Math.max(1, Math.round((Date.now() - this.session.startTime) / 1000));
        document.getElementById('res-time-taken').textContent =
            `${autoTimeout ? '⏰ Hết giờ! ' : '⏱️ '}Thời gian: ${Math.floor(elapsedSec / 60)} phút ${elapsedSec % 60} giây`;

        const rankBadge = document.getElementById('res-rank-badge');
        rankBadge.textContent = score10 >= 8.0 ? '🌟 Xuất sắc / Giỏi' : (score10 >= 5.0 ? '👍 Đạt yêu cầu' : '📚 Cần ôn tập thêm');

        const retryWrongBtn = document.getElementById('btn-retry-wrong');
        if (wrongCount > 0) {
            retryWrongBtn.classList.remove('hidden');
            retryWrongBtn.textContent = `🔄 Làm lại ${wrongCount} câu sai`;
        } else {
            retryWrongBtn.classList.add('hidden');
        }

        document.getElementById('res-topic-breakdown').innerHTML = Object.entries(topicStats).map(([tId, st]) => {
            const tInfo = this.currentRepo.topics.find(t => t.id === tId);
            const tPct = Math.round((st.correct / st.total) * 100);
            return `
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                    <div class="flex justify-between text-xs font-bold">
                        <span>${QuizHub.App.escapeHtml(tInfo ? tInfo.name : tId)}</span>
                        <span>${st.correct}/${st.total} (${tPct}%)</span>
                    </div>
                    <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-brand-600 rounded-full" style="width: ${tPct}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        this.setReviewFilter('all');
        QuizHub.App.switchView('result');
    },

    setReviewFilter(filter) {
        this.session.reviewFilter = filter;
        document.querySelectorAll('.rfilter-btn').forEach(btn => {
            btn.className = btn.dataset.rfilter === filter
                ? 'rfilter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white'
                : 'rfilter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-800';
        });
        this.renderReviewList();
    },

    renderReviewList() {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const filter = this.session.reviewFilter;
        const filtered = this.session.questions
            .map((q, idx) => ({ q, idx }))
            .filter(({ q, idx }) => {
                const choice = this.session.userAnswers[idx];
                const isRight = choice !== undefined && choice === q.mappedCorrect;
                if (filter === 'wrong') return !isRight;
                if (filter === 'correct') return isRight;
                if (filter === 'flagged') return !!this.session.flagged[idx];
                return true;
            });

        document.getElementById('res-review-list').innerHTML = filtered.map(({ q, idx }) => {
            const choice = this.session.userAnswers[idx];
            const isRight = choice !== undefined && choice === q.mappedCorrect;
            const badge = isRight
                ? '<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">✓ Đúng</span>'
                : '<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-700">✕ Sai / Bỏ trống</span>';

            const optsHtml = q.mappedOptions.map((opt, oIdx) => {
                let cls = 'border-slate-200 dark:border-slate-800';
                if (oIdx === q.mappedCorrect) cls = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold';
                else if (oIdx === choice) cls = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40';
                return `<div class="p-3 rounded-xl border text-xs sm:text-sm ${cls}"><strong>${letters[oIdx]}.</strong> ${QuizHub.App.escapeHtml(opt)}</div>`;
            }).join('');

            return `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <div class="flex items-center gap-2">
                        <span class="font-extrabold text-sm text-brand-600">Câu ${idx + 1}</span>
                        ${badge}
                    </div>
                    <p class="text-sm font-bold">${QuizHub.App.escapeHtml(q.question)}</p>
                    <div class="space-y-2">${optsHtml}</div>
                    <div class="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 text-xs">
                        <strong>💡 Giải thích:</strong> ${QuizHub.App.escapeHtml(q.explanation)}
                    </div>
                </div>
            `;
        }).join('');
    },

    retryWrongFromSession() {
        const wrongQs = this.session.questions
            .filter((q, idx) => this.session.userAnswers[idx] !== q.mappedCorrect)
            .map(q => this.currentRepo.questions.find(orig => orig.id === q.id))
            .filter(Boolean);
        if (wrongQs.length === 0) return;
        this.selectMode('practice');
        this.startQuiz(wrongQs, `Làm lại ${wrongQs.length} câu sai`);
    },

    retrySameQuiz() {
        const origList = this.session.questions
            .map(q => this.currentRepo.questions.find(orig => orig.id === q.id))
            .filter(Boolean);
        this.startQuiz(origList, this.session.lastLabel);
    },

    openResetModal() {
        QuizHub.App.showModal('Đặt lại thống kê kho này?', 'Xóa lịch sử đã làm của riêng kho quiz này.', async () => {
            this.state.stats = { quizId: this.currentRepo.id, answeredIds: {}, wrongBank: [] };
            await QuizHub.Storage.saveProgress(this.state.stats);
            this.renderDashboard();
        }, true, 'Đặt lại');
    }
};