class AIService {
    constructor(app) {
        this.app = app;
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        this.provider = 'gemini'; // or 'openai'
    }

    setUnknownKey(key) {
        this.apiKey = key;
        localStorage.setItem('ai_api_key', key);
    }

    async generateQuiz(text) {
        if (!this.apiKey) {
            const key = prompt("⚠️ Tính năng này cần API Key (Gemini/OpenAI).\nVui lòng nhập API Key của bạn:");
            if (key) this.setUnknownKey(key);
            else return null;
        }

        // Mock return if still no key provided or for failsafe
        if (this.apiKey.startsWith('demo')) return this.mockGen(text);

        try {
            // Real API Call to Gemini
            // https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
            const promptStr = `
                Generate 5 multiple choice questions in JSON format from the following text. 
                Focus on key concepts.
                Output Format: Array of objects [{ "q": "question", "options": ["A","B","C","D"], "a": 0 (index of correct), "explanation": "short reason" }]
                Text: ${text.substring(0, 5000)}
            `;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptStr }] }]
                })
            });

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            
            // Extract JSON from potential markdown blocks
            const jsonMatch = rawText.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                console.error("AI Output not JSON", rawText);
                throw new Error("Invalid AI Format");
            }
        } catch (e) {
            alert("AI Error: " + e.message + "\nUsing backup generator.");
            return this.mockGen(text);
        }
    }

    mockGen(text) {
        const lines = text.split('\n').filter(l => l.length > 5);
        return lines.slice(0, 5).map((line, i) => ({
            id: `ai_${Date.now()}_${i}`,
            q: `Ý chính của câu: "${line.substring(0, 30)}..." là gì?`,
            options: ["Là khái niệm quan trọng", "Là chi tiết phụ", "Là ví dụ minh họa", "Không liên quan"],
            a: 0,
            explanation: "Được tạo tự động bởi hệ thống dự phòng."
        }));
    }
}
