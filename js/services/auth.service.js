window.QuizHub = window.QuizHub || {};

// Cơ chế xác thực đăng nhập & duy trì phiên làm việc
QuizHub.Auth = {
    getCurrentUser() {
        try {
            const raw = localStorage.getItem(QuizHub.Config.STORAGE_KEY_AUTH);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    login(username) {
        const cleanName = (username || 'Học viên').trim();
        const displayName = cleanName.includes('@') ? cleanName.split('@')[0] : cleanName;
        const user = {
            username: cleanName,
            displayName,
            loginAt: Date.now()
        };
        localStorage.setItem(QuizHub.Config.STORAGE_KEY_AUTH, JSON.stringify(user));
        this.applyAuthUI();
    },

    logout() {
        localStorage.removeItem(QuizHub.Config.STORAGE_KEY_AUTH);
        this.applyAuthUI();
    },

    applyAuthUI() {
        const user = this.getCurrentUser();
        const loginView = document.getElementById('view-login');
        const appShell = document.getElementById('app-shell');

        if (user) {
            loginView.classList.add('hidden');
            appShell.classList.remove('hidden');
            document.getElementById('user-display-name').textContent = user.displayName;
            QuizHub.App.switchView('home');
        } else {
            appShell.classList.add('hidden');
            loginView.classList.remove('hidden');
        }
    },

    bindEvents() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                this.login(username);
            });
        }

        const demoBtn = document.getElementById('btn-demo-login');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                this.login('Học viên QuizHub');
            });
        }
    }
};