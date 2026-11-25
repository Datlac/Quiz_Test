window.QuizHub = window.QuizHub || {};

// Điều phối toàn bộ ứng dụng: điều hướng View, Theme, Âm thanh, Modal & Phím tắt
QuizHub.App = {
    prefs: {
        soundEnabled: true,
        darkMode: false
    },

    getPrefsKey() {
        return (window.QuizHub && QuizHub.Config && QuizHub.Config.STORAGE_KEY_PREFS)
            || 'quizhub_user_prefs_v1';
    },

    loadPrefs() {
        try {
            const raw = localStorage.getItem(this.getPrefsKey());
            if (raw) Object.assign(this.prefs, JSON.parse(raw));
        } catch {}
        this.applyTheme();
        document.getElementById('btn-sound').textContent = this.prefs.soundEnabled ? '🔊' : '🔇';
    },

    savePrefs() {
        localStorage.setItem(this.getPrefsKey(), JSON.stringify(this.prefs));
    },

    applyTheme() {
        const html = document.documentElement;
        const btn = document.getElementById('btn-theme');
        if (this.prefs.darkMode) {
            html.classList.add('dark');
            html.classList.remove('light');
            btn.textContent = '☀️';
        } else {
            html.classList.remove('dark');
            html.classList.add('light');
            btn.textContent = '🌙';
        }
    },

    toggleTheme() {
        this.prefs.darkMode = !this.prefs.darkMode;
        this.applyTheme();
        this.savePrefs();
    },

    toggleSound() {
        this.prefs.soundEnabled = !this.prefs.soundEnabled;
        document.getElementById('btn-sound').textContent = this.prefs.soundEnabled ? '🔊' : '🔇';
        this.savePrefs();
    },

    playTone(type) {
        if (!this.prefs.soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(type === 'correct' ? 587.33 : (type === 'wrong' ? 200 : 440), now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch {}
    },

    switchView(viewName) {
        if (viewName !== 'quiz' && QuizHub.Quiz.session.active) {
            QuizHub.Quiz.stopTimer();
            QuizHub.Quiz.session.active = false;
        }

        ['home', 'quiz-dash', 'quiz', 'result', 'notes'].forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.add('hidden');
        });

        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.remove('hidden');

        // Ẩn/hiện sub-nav khi ở trong một kho quiz vs ở Trang chủ Grid
        const subnav = document.getElementById('quiz-subnav');
        if (viewName === 'home') {
            subnav.classList.add('hidden');
            subnav.classList.remove('flex');
            QuizHub.Home.renderGrid();
        } else {
            subnav.classList.remove('hidden');
            subnav.classList.add('flex');
        }

        // Cập nhật trạng thái active trên thanh điều hướng
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.className = 'nav-tab px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
        });
        const activeBtn = document.getElementById(`nav-${viewName}`);
        if (activeBtn) {
            activeBtn.className = 'nav-tab px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 transition-colors';
        }

        if (viewName === 'quiz-dash') QuizHub.Quiz.renderDashboard();
        if (viewName === 'notes') QuizHub.Notes.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showModal(title, body, onConfirm, showCancel = true, confirmText = 'Đồng ý') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').textContent = body;
        const cancelBtn = document.getElementById('modal-cancel');
        const confirmBtn = document.getElementById('modal-confirm');

        cancelBtn.style.display = showCancel ? 'inline-flex' : 'none';
        confirmBtn.textContent = confirmText;
        confirmBtn.onclick = () => {
            this.closeModal();
            if (typeof onConfirm === 'function') onConfirm();
        };
        document.getElementById('app-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('app-modal').classList.add('hidden');
    },

    escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const quizView = document.getElementById('view-quiz');
            if (!QuizHub.Quiz.session.active || quizView.classList.contains('hidden')) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            const k = e.key.toLowerCase();
            if (k === '1' || k === 'a') QuizHub.Quiz.selectOption(0);
            else if (k === '2' || k === 'b') QuizHub.Quiz.selectOption(1);
            else if (k === '3' || k === 'c') QuizHub.Quiz.selectOption(2);
            else if (k === '4' || k === 'd') QuizHub.Quiz.selectOption(3);
            else if (e.key === 'ArrowLeft') QuizHub.Quiz.prevQuestion();
            else if (e.key === 'ArrowRight') QuizHub.Quiz.nextQuestion();
            else if (k === 'f') QuizHub.Quiz.toggleFlag();
        });
    },

    init() {
        this.loadPrefs();
        this.bindKeyboardShortcuts();
        QuizHub.Auth.bindEvents();
        QuizHub.Auth.applyAuthUI();
    }
};

window.addEventListener('DOMContentLoaded', () => QuizHub.App.init());
