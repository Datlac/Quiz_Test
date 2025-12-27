class BattleSystem {
    constructor(app) {
        this.app = app;
        this.overlay = document.getElementById('battle-overlay');
        this.arena = document.getElementById('battle-arena');
        this.logEl = null; // Battle Log
        this.state = null;
    }

    startBattle() {
        // Validation: Check if team has at least 1 member
        const activeTeam = this.app.stats.team.filter(id => id != null);
        if (activeTeam.length === 0) {
            alert("Hãy vào phần 'Đội Hình' để chọn nhân vật xuất trận trước!");
            return;
        }
        this.overlay.classList.add('active');
        this.initBattle(activeTeam);
    }

    startBattleCustom(customEnemies, title, callback) {
        const activeTeam = this.app.stats.team.filter(id => id != null);
        if (activeTeam.length === 0) {
            alert("Hãy vào phần 'Đội Hình' để chọn nhân vật xuất trận trước!");
            return;
        }
        this.overlay.classList.add('active');
        this.initBattle(activeTeam, customEnemies, title, callback);
    }

    initBattle(teamIds, customEnemies = null, title = null, callback = null) {
        this.onBattleEnd = callback; // Store callback
        
        // Load Player Characters
        const pTeam = teamIds.map((id, index) => {
            const data = GACHA_POOL.find(c => c.id === id);
            return {
                ...data, // copy static data
                maxHp: data.stats.hp,
                currentHp: data.stats.hp,
                sp: 0, // Energy for Ult
                id: `p_${index}`,
                isPlayer: true
            };
        });

        // Generate Enemies (Mock)
        const eTeam = [
            { id: 'e_1', name: 'Glitch Slime', stats: { hp: 150, atk: 15, spd: 80 }, currentHp: 150, maxHp: 150, element: 'WIND', isPlayer: false },
            { id: 'e_2', name: 'Bug Monitor', stats: { hp: 200, atk: 20, spd: 90 }, currentHp: 200, maxHp: 200, element: 'FIRE', isPlayer: false }
        ];

        this.state = {
            round: 1,
            skillPoints: 3, // Shared resource
            maxSkillPoints: 5,
            pTeam: pTeam,
            eTeam: eTeam,
            turnQueue: [], // Order of action
            selectedCharIndex: 0, 
            targetIndex: 0
        };

        this.renderBattleField();
        this.nextTurn();
    }

    renderBattleField() {
        this.arena.innerHTML = `
            <button class="meme-close-btn" onclick="document.getElementById('battle-overlay').classList.remove('active')"><i class="fas fa-times"></i></button>
            
            <!-- Skill Points HUD -->
            <div style="position: absolute; top: 20px; left: 20px; color: gold; font-size: 1.5rem; font-weight: bold; text-shadow: 0 0 5px black;">
                SP: <span id="sp-val">${this.state.skillPoints}</span>/5
            </div>

            <!-- ENEMY SIDE -->
            <div id="enemy-row" style="position: absolute; top: 20%; width: 100%; display: flex; justify-content: center; gap: 50px;">
                ${this.state.eTeam.map((e, idx) => `
                    <div id="e-card-${idx}" class="entity-card enemy" onclick="app.battleSystem.selectEnemy(${idx})" style="position:relative; top:0; right:0;">
                        <i class="fas fa-spider" style="font-size: 3rem; color: #ff6b6b;"></i>
                        <div style="font-size:0.8rem; margin-top:5px;">${e.name}</div>
                        <div class="hp-bar-wrap"><div id="hp-e-${idx}" class="hp-bar" style="width: ${(e.currentHp/e.maxHp)*100}%"></div></div>
                        <div style="position:absolute; top:-10px; right:-10px; background:${CHAR_ELEMENTS[e.element]?.color || 'gray'}; border-radius:50%; width:20px; height:20px; font-size:0.6rem; display:flex; align-items:center; justify-content:center;">${CHAR_ELEMENTS[e.element]?.icon || ''}</div>
                    </div>
                `).join('')}
            </div>

            <!-- PLAYER SIDE -->
            <div id="player-row" style="position: absolute; bottom: 30%; width: 100%; display: flex; justify-content: center; gap: 40px;">
                ${this.state.pTeam.map((p, idx) => `
                    <div id="p-card-${idx}" class="entity-card player" style="position:relative; bottom:0; left:0; width:100px; height:150px;">
                        <img src="${p.img}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">
                        <div style="font-size:0.7rem; font-weight:bold;">${p.name}</div>
                         <div class="hp-bar-wrap"><div id="hp-p-${idx}" class="hp-bar" style="width: ${(p.currentHp/p.maxHp)*100}%"></div></div>
                         <div style="font-size:0.6rem; color:cyan;">Ult: ${p.sp}/100</div>
                         <div id="turn-indicator-${idx}" style="display:none; position:absolute; top:-20px; color:yellow;"><i class="fas fa-arrow-down"></i></div>
                    </div>
                `).join('')}
            </div>

            <!-- ACTION HUD -->
            <div id="action-hud" class="battle-hud" style="visibility: hidden;">
                <div id="char-name-turn" style="position:absolute; top:-30px; color:white; font-weight:bold;"></div>
                <button class="skill-btn" onclick="app.battleSystem.castSkill('basic')">
                    <i class="fas fa-fist-raised"></i> <span>Strike</span>
                </button>
                <button class="skill-btn" onclick="app.battleSystem.castSkill('skill')">
                    <i class="fas fa-magic"></i> <span>Skill (-1 SP)</span>
                </button>
                <button class="skill-btn" onclick="app.battleSystem.castSkill('ult')" id="btn-ult">
                    <i class="fas fa-meteor"></i> <span>Ult</span>
                </button>
            </div>
        `;
    }

    selectEnemy(idx) {
        if (this.state.eTeam[idx].currentHp <= 0) return;
        this.state.targetIndex = idx;
        // Visual feedback
        document.querySelectorAll('.entity-card.enemy').forEach(e => e.style.borderColor = '#ff6b6b');
        document.getElementById(`e-card-${idx}`).style.borderColor = 'yellow';
    }

    nextTurn() {
        // Simple Round Robin for MVP: P1 -> P2 -> P3 -> E1 -> E2 -> Loop
        // Better: Queue based.
        if (this.state.turnQueue.length === 0) {
            this.state.turnQueue = [
                ...this.state.pTeam.map((p, i) => ({ type: 'player', index: i, spd: p.stats.spd })),
                ...this.state.eTeam.map((e, i) => ({ type: 'enemy', index: i, spd: e.stats.spd }))
            ].filter(u => this.getUnit(u).currentHp > 0);
            
            // Sort by Speed
            this.state.turnQueue.sort((a, b) => b.spd - a.spd);
        }

        const turn = this.state.turnQueue.shift();
        if (!turn) { this.nextTurn(); return; } // Safety

        const unit = this.getUnit(turn);
        if (unit.currentHp <= 0) { this.nextTurn(); return; } // Skip dead

        if (turn.type === 'player') {
            this.startPlayerTurn(turn.index);
        } else {
            setTimeout(() => this.execEnemyTurn(turn.index), 1000);
        }
    }

    getUnit(turn) {
        return turn.type === 'player' ? this.state.pTeam[turn.index] : this.state.eTeam[turn.index];
    }

    startPlayerTurn(idx) {
        this.state.selectedCharIndex = idx;
        const char = this.state.pTeam[idx];
        
        // Show HUD
        const hud = document.getElementById('action-hud');
        hud.style.visibility = 'visible';
        document.getElementById('char-name-turn').innerText = `${char.name}'s Turn`;
        
        // Indicate Indicator
        document.querySelectorAll('[id^="turn-indicator-"]').forEach(e => e.style.display = 'none');
        document.getElementById(`turn-indicator-${idx}`).style.display = 'block';

        // Auto select first alive enemy
        const firstAlive = this.state.eTeam.findIndex(e => e.currentHp > 0);
        if(firstAlive !== -1) this.selectEnemy(firstAlive);
    }

    castSkill(type) {
        const char = this.state.pTeam[this.state.selectedCharIndex];
        const target = this.state.eTeam[this.state.targetIndex];

        if (type === 'skill' && this.state.skillPoints < 1) {
            alert("Not enough SP!");
            return;
        }

        // Hide HUD
        document.getElementById('action-hud').style.visibility = 'hidden';

        // Calc Dmg
        let dmg = 0;
        let isCrit = Math.random() < 0.2; // 20% Base Crit
        let skillData = char.skills[type];

        // Basic Mult Logic
        if (type === 'basic') {
            dmg = char.stats.atk * 1.0;
            if (this.state.skillPoints < this.state.maxSkillPoints) {
                this.state.skillPoints++;
                document.getElementById('sp-val').innerText = this.state.skillPoints;
            }
            char.sp = Math.min(100, char.sp + 20); // Gain Energy
        } else if (type === 'skill') {
             dmg = char.stats.atk * 1.5;
             this.state.skillPoints--;
             document.getElementById('sp-val').innerText = this.state.skillPoints;
             char.sp = Math.min(100, char.sp + 30);
        } else if (type === 'ult') {
             if (char.sp < 100) { alert("Ult not ready!"); this.state.turnQueue.unshift({type:'player', index:this.state.selectedCharIndex}); this.startPlayerTurn(this.state.selectedCharIndex); return; }
             dmg = char.stats.atk * 3.0; // Big damage
             char.sp = 0;
             // ULT FX
             this.arena.style.filter = "invert(1)";
             setTimeout(() => this.arena.style.filter = "none", 200);
        }

        // Element Advantage
        let multiplier = 1.0;
        // Simple logic: Water > Fire, etc. Implementation can be expanded.
        
        let finalDmg = Math.floor(dmg * multiplier * (isCrit ? 1.5 : 1.0));
        
        // Apply Dmg
        if (target.currentHp > 0) {
            target.currentHp -= finalDmg;
            this.showDamage(finalDmg, `e-card-${this.state.targetIndex}`, isCrit);
            this.updateHpBars();
        }

        // Check Win
        if (this.state.eTeam.every(e => e.currentHp <= 0)) {
            setTimeout(() => this.endBattle(true), 1000);
        } else {
            setTimeout(() => this.nextTurn(), 1000);
        }
    }

    execEnemyTurn(idx) {
        const enemy = this.state.eTeam[idx];
        // Pick random player
        const alivePlayers = this.state.pTeam.map((p, i) => ({...p, idx})).filter(p => p.currentHp > 0);
        if (alivePlayers.length === 0) {
            this.endBattle(false);
            return;
        }
        
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        const dmg = Math.floor(enemy.stats.atk * 1.0);
        
        this.state.pTeam[target.idx].currentHp -= dmg;
        this.showDamage(dmg, `p-card-${target.idx}`, false);
        this.updateHpBars();

        if (this.state.pTeam.every(p => p.currentHp <= 0)) {
            setTimeout(() => this.endBattle(false), 1000);
        } else {
            this.nextTurn();
        }
    }

    updateHpBars() {
        this.state.eTeam.forEach((e, i) => {
            const bar = document.getElementById(`hp-e-${i}`);
            if (bar) bar.style.width = `${Math.max(0, (e.currentHp/e.maxHp)*100)}%`;
            if (e.currentHp <= 0) document.getElementById(`e-card-${i}`).style.opacity = '0.5';
        });
        this.state.pTeam.forEach((p, i) => {
             const bar = document.getElementById(`hp-p-${i}`);
             if (bar) bar.style.width = `${Math.max(0, (p.currentHp/p.maxHp)*100)}%`;
        });
    }

    showDamage(amount, targetId, isCrit) {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;
        
        const el = document.createElement('div');
        el.className = 'damage-number';
        el.innerText = amount;
        if (isCrit) {
            el.style.color = '#f1c40f';
            el.style.fontSize = '2.5rem';
            el.innerText += '!';
        }

        const rect = targetEl.getBoundingClientRect();
        // Since overlay is fixed, use client coords logic or relative
        // Simplified:
        targetEl.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    endBattle(win) {
        if (win) {
            alert("Victory! Earned 100 Star Coins & 50 XP!");
            this.app.stats.currency += 100;
            this.app.stats.xp += 50;
            if(this.app.questSystem) this.app.questSystem.onEvent('battle_win');
            this.app.saveStats();
            this.app.updateCurrencyDisplay();
        } else {
            alert("Defeated... Enhance your team and return!");
        }
        this.overlay.classList.remove('active');
    }
}
