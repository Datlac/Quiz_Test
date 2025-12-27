class TowerSystem {
    constructor(app) {
        this.app = app;
    }

    startTower() {
        const floor = this.app.stats.towerFloor || 1;
        alert(`Entering Tower Floor ${floor}...`);
        
        // Scale Enemies based on Floor
        const scale = 1 + (floor * 0.1);
        const enemy = {
            id: `tower_e_${floor}`,
            name: `Guardian of Floor ${floor}`,
            stats: { 
                hp: Math.floor(100 * scale), 
                atk: Math.floor(10 * scale), 
                def: Math.floor(5 * scale),
                spd: 100 + floor 
            },
            currentHp: Math.floor(100 * scale),
            maxHp: Math.floor(100 * scale),
            element: this.getRandomElement(),
            isPlayer: false
        };

        // Reuse Battle System but inject custom enemy
        this.app.battleSystem.startBattleCustom([enemy], `Tower Floor ${floor}`, (win) => {
            if (win) {
                this.app.stats.towerFloor = floor + 1;
                this.app.stats.currency += 20; // Small reward
                this.app.saveStats();
                alert(`Cleared Floor ${floor}! +20 Coins.`);
            }
        });
    }

    getRandomElement() {
        const keys = Object.keys(CHAR_ELEMENTS);
        return keys[Math.floor(Math.random() * keys.length)];
    }
}
