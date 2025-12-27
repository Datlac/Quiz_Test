class StorySystem {
    constructor(app) {
        this.app = app;
        this.chapters = [
            {
                id: 'ch1', title: 'The Awakening',
                dialogue: [
                    { speaker: 'System', text: 'Initiating MindPath Protocol...' },
                    { speaker: 'You', text: 'Where... am I?' },
                    { speaker: 'Guide', text: 'Welcome, Traveler. To escape this void, you must master the knowledge found in the database.' }
                ]
            }
        ];
    }

    playChapter(id) {
        const chapter = this.chapters.find(c => c.id === id);
        if(!chapter) return;

        // Simple Overlay for Visual Novel Style
        const overlay = document.createElement('div');
        overlay.id = 'story-overlay';
        overlay.className = 'meme-overlay active';
        overlay.style.background = 'black'; // Cinematic
        overlay.innerHTML = `
            <div id="story-container" style="position:absolute; bottom:0; width:100%; height:300px; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding:20px; color:white; display:flex; flex-direction:column; justify-content:flex-end;">
                <h3 id="story-speaker" style="color:#f1c40f; font-size:1.5rem; margin-bottom:10px;"></h3>
                <p id="story-text" style="font-size:1.2rem; line-height:1.6;"></p>
                <div style="text-align:right; margin-top:20px; color:gray; font-size:0.8rem;">Click to continue...</div>
            </div>
            <button style="position:absolute; top:20px; right:20px; background:transparent; border:1px solid white; color:white; padding:5px 10px;" onclick="document.getElementById('story-overlay').remove()">Skip</button>
        `;
        document.body.appendChild(overlay);

        this.currentLine = 0;
        this.currentChapter = chapter;
        
        overlay.onclick = () => this.nextDialog();
        this.nextDialog();
    }

    nextDialog() {
        if (this.currentLine >= this.currentChapter.dialogue.length) {
            document.getElementById('story-overlay').remove();
            // Trigger a reward or transition?
            return;
        }

        const line = this.currentChapter.dialogue[this.currentLine];
        const speakerEl = document.getElementById('story-speaker');
        const textEl = document.getElementById('story-text');
        
        // Typing effect
        speakerEl.innerText = line.speaker;
        textEl.innerText = line.text; 
        
        this.currentLine++;
    }
}
