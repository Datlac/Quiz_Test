window.QuizHub = window.QuizHub || {};

QuizHub.Config = {
    STORAGE_KEY_PREFS: 'quizhub_user_prefs_v1',
    STORAGE_KEY_AUTH: 'quizhub_auth_session_v1',
    STORAGE_KEY_CLOUD_URL: 'quizhub_firebase_url_v1',

        DEFAULT_FIREBASE_URL: 'https://quiz-3ed7d-default-rtdb.asia-southeast1.firebasedatabase.app',

    getFirebaseUrl() {
        return localStorage.getItem(this.STORAGE_KEY_CLOUD_URL) || this.DEFAULT_FIREBASE_URL || '';
    },

    setFirebaseUrl(url) {
        const clean = (url || '').trim().replace(/\/+$/, '');
        if (clean) {
            localStorage.setItem(this.STORAGE_KEY_CLOUD_URL, clean);
        } else {
            localStorage.removeItem(this.STORAGE_KEY_CLOUD_URL);
        }
    }
};