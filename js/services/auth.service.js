window.QuizHub = window.QuizHub || {};

QuizHub.Auth = {
    // Tài khoản & mật khẩu đăng nhập hệ thống
    ACCOUNTS: {
        'admin': '123456',
        'datlac': '2026'
    },

    getStorageKey() {
        return (window.QuizHub && QuizHub.Config && QuizHub.Config.STORAGE_KEY_AUTH)
            || 'quizhub_auth_session_v1';
    },

    getCurrentUser() {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    login(username, password = '', isDemo = false) {
        const cleanName = (username || '').trim();

        if (!isDemo) {
            const expectedPass = this.ACCOUNTS[cleanName];
            if (!expectedPass || expectedPass !== password) {
                if (QuizHub.App && QuizHub.App.showModal) {
                    QuizHub.App.showModal(
                        'Sai thông tin đăng nhập',
                        'Tên đăng nhập hoặc mật khẩu không đúng. (Mặc định: admin / 123456)',
                        null,
                        false,
                        'Thử lại'
                    );
                }
                return;
            }
        }

        const displayName = cleanName.includes('@') ? cleanName.split('@')[0] : cleanName;
        const user = {
            username: cleanName,
            displayName,
            loginAt: Date.now()
        };
        localStorage.setItem(this.getStorageKey(), JSON.stringify(user));
        this.applyAuthUI();
    },

    logout() {
        localStorage.removeItem(this.getStorageKey());
        this.applyAuthUI();
    },

    applyAuthUI() {
        const user = this.getCurrentUser();
        const loginView = document.getElementById('view-login');
        const appShell = document.getElementById('app-shell');

        if (user) {
            loginView.classList.add('hidden');
            appShell.classList.remove('hidden');
            const nameEl = document.getElementById('user-display-name');
            if (nameEl) nameEl.textContent = user.displayName;
            if (QuizHub.App && QuizHub.App.switchView) {
                QuizHub.App.switchView('home');
            }
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
                const password = document.getElementById('login-password').value;
                this.login(username, password, false);
            });
        }

        const demoBtn = document.getElementById('btn-demo-login');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                this.login('Học viên QuizHub', '', true);
            });
        }
    }
};
