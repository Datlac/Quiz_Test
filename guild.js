class GuildSystem {
    constructor(app) {
        this.app = app;
    }

    openGuildModal() {
        // Mock UI for Guilds
        const modal = document.getElementById('guild-modal');
        if (!modal) return; // Should create if missing
        
        modal.classList.add('active');
        this.renderGuildUI();
    }

    renderGuildUI() {
        const container = document.getElementById('guild-content');
        if (!this.app.stats.guildId) {
            // Not in a guild
            container.innerHTML = `
                <div style="text-align:center; color:white;">
                    <h2>🏰 Bang Hội</h2>
                    <p>Tham gia bang hội để cùng nhau săn boss và nhận thưởng!</p>
                    <div style="display:flex; justify-content:center; gap:20px; margin-top:30px;">
                        <button class="hero-btn" onclick="app.guildSystem.createGuild()">Tạo Bang (500 Coins)</button>
                        <button class="hero-btn" style="background:#34495e" onclick="app.guildSystem.joinGuild()">Tìm Bang</button>
                    </div>
                </div>
            `;
        } else {
            // In a guild
            container.innerHTML = `
                <div style="color:white;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h2>🏰 ${this.app.stats.guildName || 'Bang Hội'}</h2>
                        <button onclick="app.guildSystem.leaveGuild()" style="background:red; border:none; color:white; padding:5px 10px; border-radius:5px;">Rời Bang</button>
                    </div>
                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; margin-top:20px;">
                        <h3>Thành viên (Online: 1)</h3>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                            <div class="user-avatar" style="width:30px; height:30px;"><img src="${this.app.userProfile?.photo || ''}" style="width:100%; border-radius:50%"></div>
                            <span>${this.app.userProfile?.name || 'Tôi'} (Bang Chủ)</span>
                        </div>
                    </div>
                    
                    <div style="margin-top:20px;">
                        <h3>💬 Kênh Chat Bang</h3>
                        <div id="guild-chat" style="height:200px; background:rgba(0,0,0,0.2); border-radius:10px; padding:10px; overflow-y:auto; margin-bottom:10px;">
                            <div style="color:#a777e3;">[System]: Chào mừng bạn đến với bang hội!</div>
                        </div>
                        <input type="text" placeholder="Nhập tin nhắn..." onkeydown="if(event.key==='Enter') app.guildSystem.sendChat(this)" style="width:100%; padding:10px; border-radius:5px; border:none;">
                    </div>
                </div>
            `;
        }
    }

    createGuild() {
        if (this.app.stats.currency < 500) {
            alert("Không đủ tiền! Cần 500 Star Coins.");
            return;
        }
        const name = prompt("Nhập tên bang hội:");
        if (name) {
            this.app.stats.currency -= 500;
            this.app.stats.guildId = `g_${Date.now()}`;
            this.app.stats.guildName = name;
            this.app.saveStats();
            this.renderGuildUI();
            alert("Tạo bang thành công!");
        }
    }

    joinGuild() {
        alert("Tính năng tìm bang đang bảo trì (Server Alpha). Hãy tự tạo bang nhé!");
    }

    leaveGuild() {
        if(confirm("Bạn có chắc muốn rời bang?")) {
            this.app.stats.guildId = null;
            this.app.stats.guildName = null;
            this.app.saveStats();
            this.renderGuildUI();
        }
    }

    sendChat(input) {
        const list = document.getElementById('guild-chat');
        if(input.value.trim()) {
            list.innerHTML += `<div style="margin-top:5px;"><b>You:</b> ${input.value}</div>`;
            list.scrollTop = list.scrollHeight;
            input.value = '';
        }
    }
}
