class BossSystem {
    constructor(app) {
        this.app = app;
        // Mock Boss Data (In real app, sync with Firebase)
        this.boss = {
            name: "Eater of Knowledge",
            maxHp: 1000000,
            currentHp: 850020,
            image: "https://api.dicebear.com/7.x/shapes/svg?seed=Boss",
            level: 99
        };
    }

    openBossModal() {
        const modal = document.getElementById('boss-modal');
        if (!modal) return;
        modal.classList.add('active');
        this.renderBossUI();
    }

    renderBossUI() {
        const container = document.getElementById('boss-content');
        const hpPercent = (this.boss.currentHp / this.boss.maxHp) * 100;
        
        container.innerHTML = `
            <div style="text-align:center; color:white;">
                <h2 style="color:#ff6b6b; font-size:2rem; text-transform:uppercase;">☠️ ${this.boss.name} (Lv.${this.boss.level})</h2>
                <div style="position:relative; width:200px; height:200px; margin:20px auto;">
                     <img src="${this.boss.image}" class="boss-shake" style="width:100%; height:100%; object-fit:contain;">
                </div>
                
                <div class="hp-bar-wrap" style="width:100%; height:30px; margin-bottom:10px;">
                    <div class="hp-bar" style="width:${hpPercent}%; background: linear-gradient(90deg, #ff4757, #ff6b6b);"></div>
                    <span style="position:absolute; width:100%; text-align:center; top:5px; font-weight:bold; text-shadow:1px 1px 2px black;">${this.boss.currentHp.toLocaleString()} / ${this.boss.maxHp.toLocaleString()}</span>
                </div>

                <p>Toàn server đang cùng nhau đánh boss này!</p>
                
                <div style="display:flex; justify-content:center; gap:20px; margin-top:30px;">
                    <button class="hero-btn" style="background:#e74c3c" onclick="app.bossSystem.attack()">⚔️ Tấn Công (10 Quiz)</button>
                    <button class="hero-btn" onclick="alert('Đã nhận thưởng tham gia!')">🎁 Nhận Quà</button>
                </div>
            </div>
        `;
    }

    attack() {
        // Trigger a quick quiz or just simple clicker for MVP
        // For MVP: Simple clicker
        const dmg = Math.floor(Math.random() * 5000) + 1000;
        this.boss.currentHp = Math.max(0, this.boss.currentHp - dmg);
        
        this.renderBossUI(); // Re-render
        
        // Show dmg floating
        // (Simplified)
        alert(`Bạn gây ${dmg} sát thương!`);
    }
}
