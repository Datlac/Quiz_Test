class QuestSystem {
    constructor(app) {
        this.app = app;
        this.checkReset();
        // Hook into app events if possible, or manual checks
    }

    checkReset() {
        const today = new Date().toDateString();
        if (this.app.stats.lastQuestDate !== today) {
            this.app.stats.lastQuestDate = today;
            this.app.stats.quests = [
                { id: 'q_login', desc: 'Đăng nhập mỗi ngày', goal: 1, current: 1, reward: 20, collected: false },
                { id: 'q_quiz', desc: 'Hoàn thành 1 bài Quiz', goal: 1, current: 0, reward: 30, collected: false },
                { id: 'q_battle', desc: 'Thắng 1 trận Battle', goal: 1, current: 0, reward: 50, collected: false }
            ];
            this.app.saveStats();
            console.log("Quests Reset for", today);
        }
    }

    onEvent(type) {
        let changed = false;
        this.app.stats.quests.forEach(q => {
            if (q.collected) return;
            if (q.id === 'q_quiz' && type === 'quiz_complete') {
                q.current = Math.min(q.goal, q.current + 1);
                changed = true;
            }
            if (q.id === 'q_battle' && type === 'battle_win') {
                q.current = Math.min(q.goal, q.current + 1);
                changed = true;
            }
        });
        if (changed) this.app.saveStats();
        this.checkCompletion();
    }

    checkCompletion() {
        // Just visual notification if needed
        const completable = this.app.stats.quests.filter(q => q.current >= q.goal && !q.collected);
        if (completable.length > 0) {
            // alert(`Bạn đã hoàn thành ${completable.length} nhiệm vụ!`);
        }
    }

    collect(questId) {
        const q = this.app.stats.quests.find(x => x.id === questId);
        if (q && q.current >= q.goal && !q.collected) {
            q.collected = true;
            this.app.stats.currency += q.reward;
            this.app.saveStats();
            this.app.updateCurrencyDisplay();
            this.renderQuestModal(); // Refresh UI
            alert(`Nhận ${q.reward} Star Coins!`);
        }
    }

    openQuestModal() {
        // Simple Alert for MVP or a real modal? Let's use a real modal or inject into a new DIV.
        // For MVP, reused basic modal structure.
        let html = `<div style="padding:20px;"><h2>📜 Nhiệm Vụ Hàng Ngày</h2>`;
        this.app.stats.quests.forEach(q => {
            const isDone = q.current >= q.goal;
            const btnState = q.collected ? 'Đã nhận' : (isDone ? 'Nhận Thưởng' : `${q.current}/${q.goal}`);
            const btnClass = isDone && !q.collected ? 'cta-btn' : 'hero-btn';
            const style = q.collected ? 'background:gray;cursor:default' : (isDone ? 'background:#f1c40f' : 'background:#34495e');
            
            html += `
            <div style="background:rgba(255,255,255,0.1); margin:10px 0; padding:15px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:bold;">${q.desc}</div>
                    <div style="font-size:0.8rem; color:#cbd5e1;">Phần thưởng: ${q.reward} Coins</div>
                </div>
                <button onclick="app.questSystem.collect('${q.id}')" style="padding:5px 15px; border:none; border-radius:5px; color:white; ${style}">
                    ${btnState}
                </button>
            </div>`;
        });
        html += `<button onclick="document.getElementById('quest-modal').classList.remove('active')" style="margin-top:20px; width:100%; padding:10px; background:transparent; border:1px solid white; color:white; border-radius:5px;">Đóng</button></div>`;
        
        const modal = document.getElementById('quest-modal');
        modal.querySelector('.glass-card').innerHTML = html;
        modal.classList.add('active');
        this.renderQuestModal = () => this.openQuestModal(); // Self-bind for refresh
    }
}
