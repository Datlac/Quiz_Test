class GachaSystem {
    constructor(app) {
        this.app = app;
        this.costPerPull = 160;
    }

    roll() {
        if (this.app.stats.currency < this.costPerPull) {
            alert(`Không đủ Star Coins! Cần ${this.costPerPull} ⭐.`);
            return null;
        }

        this.app.stats.currency -= this.costPerPull;
        this.app.saveStats();
        this.app.updateCurrencyDisplay();

        const rand = Math.random() * 100;
        let rarity = 3;
        
        // Rates: 5★ (1%), 4★ (10%), 3★ (89%)
        if (rand < 1) rarity = 5;
        else if (rand < 11) rarity = 4;

        const pool = GACHA_POOL.filter(c => c.rarity === rarity);
        const result = pool[Math.floor(Math.random() * pool.length)];

        this.addToInventory(result);
        return result;
    }

    addToInventory(char) {
        if (!this.app.stats.inventory) this.app.stats.inventory = [];
        
        // Check duplicate
        const exists = this.app.stats.inventory.find(c => c.id === char.id);
        if (exists) {
            // Convert to 'Eidolon' / Shard logic later? For now just duplicate or ignore
            console.log("Duplicate char:", char.name);
        } else {
            this.app.stats.inventory.push(char);
        }
        this.app.saveStats();
    }
}
