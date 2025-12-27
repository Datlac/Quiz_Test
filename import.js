// Handles Importing Excel/TXT Files and AI Generation

class ImportSystem {
    constructor(app) {
        this.app = app;
        // Load SheetJS from CDN dynamically if not present?
        // Ideally index.html should include: <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
    }

    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            console.log("Imported:", jsonData);
            this.processImportedData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }

    processImportedData(data) {
        // Assume format: { Question: "...", Answer: "...", OptionA: "...", ... }
        // Transform to our internal format
        const newQuestions = data.map((row, index) => {
            // Basic mapping logic (customizable)
            return {
                id: `import_${Date.now()}_${index}`,
                q: row.Question || "No Question Text",
                options: [row.OptionA, row.OptionB, row.OptionC, row.OptionD].filter(Boolean),
                a: 0, // Default to A for now
                explanation: row.Explanation || ""
            };
        });

        alert(`Imported ${newQuestions.length} questions! Added to 'Custom' topic.`);
        
        // Add to app data
        if (!window.quizData['Custom']) window.quizData['Custom'] = [];
        window.quizData['Custom'].push(...newQuestions);
        
        // Refresh dashboard
        this.app.renderDashboard();
    }

    async processText() {
        if (!this.app.userProfile) {
            alert("Vui lòng đăng nhập để sử dụng tính năng này!");
            return;
        }

        const topicName = document.getElementById('import-topic-name').value;
        if (!topicName) return alert("Vui lòng nhập tên chủ đề!");

        const text = document.getElementById('paste-input').value;
        if (!text) return alert("Please paste some text!");
        
        const isPublic = document.getElementById('import-is-public').checked;

        const btn = document.querySelector('#import-modal .cta-btn');
        btn.innerText = "🤖 AI Thinking...";
        btn.disabled = true;

        const newQuestions = await this.app.aiService.generateQuiz(text);
        
        if (newQuestions) {
            // Add ID if missing
            newQuestions.forEach((q, i) => { if(!q.id) q.id = `gen_${Date.now()}_${i}`; });
            
            // Create Quiz Bundle
            const quizBundle = {
                id: `quiz_${Date.now()}`,
                title: topicName,
                questions: newQuestions,
                questionCount: newQuestions.length
            };

            if (isPublic) {
                // Save to Cloud Public
                if (window.authServices) {
                    await window.authServices.publishQuiz(this.app.userProfile, quizBundle);
                }
            } else {
                // Save to Local User Data
                if (!this.app.stats.customQuizzes) this.app.stats.customQuizzes = [];
                this.app.stats.customQuizzes.push(quizBundle);
                this.app.saveStats();
                alert(`Đã lưu bộ câu hỏi "${topicName}" vào danh sách cá nhân!`);
            }
            
            this.app.renderDashboard();
            document.getElementById('import-modal').classList.remove('active');
        }

        btn.innerText = "Analyze & Generate AI";
        btn.disabled = false;
    }
}
