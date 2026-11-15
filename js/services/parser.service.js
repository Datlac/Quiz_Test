window.QuizHub = window.QuizHub || {};

// Bộ phân tích thông minh: bóc tách file index.html, code JS hoặc JSON thành đối tượng Quiz chuẩn
QuizHub.Parser = {
    PALETTES: [
        ['#4f46e5', '#7c3aed', 'C# / .NET'],
        ['#059669', '#0d9488', 'DATABASE'],
        ['#d97706', '#ea580c', 'ALGORITHMS'],
        ['#2563eb', '#0284c7', 'SYSTEMS'],
        ['#db2777', '#e11d48', 'WEB DEV'],
        ['#7c3aed', '#4f46e5', 'QUIZ BANK']
    ],

    // Trích xuất mảng JS [ ... ] theo tên biến mà không bị lỗi khi bên trong có code/ngoặc nhọn
    extractArrayLiteral(source, varName) {
        const regex = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*\\[`, 'm');
        const match = regex.exec(source);
        if (!match) return null;

        let startIdx = match.index + match[0].length - 1; // Vị trí dấu '[' mở đầu
        let depth = 0;
        let inString = null;
        let escaped = false;
        let inLineComment = false;
        let inBlockComment = false;

        for (let i = startIdx; i < source.length; i++) {
            const ch = source[i];
            const next = source[i + 1];

            if (inLineComment) {
                if (ch === '\n') inLineComment = false;
                continue;
            }
            if (inBlockComment) {
                if (ch === '*' && next === '/') {
                    inBlockComment = false;
                    i++;
                }
                continue;
            }
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === inString) {
                    inString = null;
                }
                continue;
            }

            if (ch === '/' && next === '/') {
                inLineComment = true;
                i++;
                continue;
            }
            if (ch === '/' && next === '*') {
                inBlockComment = true;
                i++;
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') {
                inString = ch;
                continue;
            }

            if (ch === '[') depth++;
            else if (ch === ']') {
                depth--;
                if (depth === 0) {
                    return source.slice(startIdx, i + 1);
                }
            }
        }
        return null;
    },

    // Tự động tạo ảnh bìa SVG đẹp mắt cho từng kho quiz
    generateCoverDataUrl(title, topicCount, questionCount, seedIndex = 0) {
        const palette = this.PALETTES[Math.abs(seedIndex) % this.PALETTES.length];
        const safeTitle = (title || 'Kho Trắc Nghiệm')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .slice(0, 34);

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${palette[0]}"/>
                    <stop offset="100%" stop-color="${palette[1]}"/>
                </linearGradient>
            </defs>
            <rect width="640" height="320" fill="url(#g)"/>
            <circle cx="560" cy="60" r="110" fill="rgba(255,255,255,0.08)"/>
            <circle cx="80" cy="280" r="90" fill="rgba(255,255,255,0.06)"/>
            <rect x="36" y="34" width="130" height="30" rx="15" fill="rgba(255,255,255,0.2)"/>
            <text x="101" y="54" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">${palette[2]}</text>
            <text x="36" y="145" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">${safeTitle}</text>
            <text x="36" y="185" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="500" fill="rgba(255,255,255,0.85)">${topicCount} chuyên đề • ${questionCount} câu hỏi trắc nghiệm</text>
            <rect x="36" y="235" width="160" height="36" rx="10" fill="rgba(15,23,42,0.35)"/>
            <text x="116" y="258" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">QUIZHUB REPO</text>
        </svg>`.trim();

        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    },

    parseRawInput(rawText, customTitle = '', customCover = '') {
        const text = (rawText || '').trim();
        if (!text) {
            throw new Error('Nội dung trống. Hãy dán mã nguồn file index.html hoặc dữ liệu câu hỏi.');
        }

        let extractedTitle = customTitle.trim();
        let extractedSubtitle = '';
        let topics = [];
        let questions = [];
        let notes = [];

        // 1. Thử phân tích nếu người dùng dán JSON thuần
        if (text.startsWith('{')) {
            const json = JSON.parse(text);
            extractedTitle = extractedTitle || json.title || 'Kho Quiz Mới';
            extractedSubtitle = json.subtitle || 'Ngân hàng câu hỏi nhập từ JSON';
            topics = Array.isArray(json.topics) ? json.topics : [];
            questions = Array.isArray(json.questions) ? json.questions : [];
            notes = Array.isArray(json.notes) ? json.notes : [];
        } else {
            // 2. Trích xuất tiêu đề từ thẻ <title> hoặc <h1> nếu là file HTML
            if (!extractedTitle) {
                const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(text);
                if (titleMatch) {
                    extractedTitle = titleMatch[1].trim();
                } else {
                    const h1Match = /<h1[^>]*>([^<]+)<\/h1>/i.exec(text);
                    extractedTitle = h1Match ? h1Match[1].trim() : 'Kho Trắc Nghiệm Mới';
                }
            }

            // Trích xuất đoạn mô tả ngắn trong thẻ <p> đầu tiên nếu có
            const pMatch = /<main[\s\S]*?<p[^>]*>([^<]+)<\/p>/i.exec(text);
            extractedSubtitle = pMatch
                ? pMatch[1].trim()
                : 'Kho câu hỏi được đồng bộ từ cấu trúc file index.html.';

            // Bóc tách mảng TOPICS, QUESTIONS và NOTES_DATA
            const topicsStr = this.extractArrayLiteral(text, 'TOPICS');
            const questionsStr = this.extractArrayLiteral(text, 'QUESTIONS');
            const notesStr = this.extractArrayLiteral(text, 'NOTES_DATA');

            if (!questionsStr) {
                throw new Error('Không tìm thấy mảng "const QUESTIONS = [...]" trong nội dung đã dán.');
            }

            questions = (new Function('return ' + questionsStr))();
            topics = topicsStr ? (new Function('return ' + topicsStr))() : [];
            notes = notesStr ? (new Function('return ' + notesStr))() : [];
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Danh sách QUESTIONS rỗng hoặc không đúng định dạng mảng.');
        }

        // Chuẩn hóa ID & topic cho từng câu hỏi
        questions = questions.map((q, idx) => ({
            id: q.id ?? (idx + 1),
            topic: q.topic || 'general',
            type: q.type || (q.code ? 'code' : 'theory'),
            source: q.source || 'Ngân hàng câu hỏi',
            question: String(q.question || ''),
            code: q.code || '',
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correct: typeof q.correct === 'number' ? q.correct : 0,
            explanation: String(q.explanation || 'Chưa có giải thích chi tiết.')
        }));

        // Nếu file không khai báo TOPICS, tự động gom nhóm theo field topic của câu hỏi
        if (!Array.isArray(topics) || topics.length === 0) {
            const uniqueTopicIds = [...new Set(questions.map(q => q.topic))];
            topics = uniqueTopicIds.map((tId, i) => ({
                id: tId,
                name: tId === 'general' ? 'Chuyên đề tổng hợp' : `Chuyên đề ${i + 1}: ${tId}`,
                file: `${questions.filter(q => q.topic === tId).length} câu hỏi`,
                desc: 'Tự động nhận diện từ danh sách câu hỏi.',
                color: 'brand'
            }));
        }

        const finalCover = customCover.trim() ||
            this.generateCoverDataUrl(extractedTitle, topics.length, questions.length, Date.now());

        return {
            id: 'quiz-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            title: extractedTitle,
            subtitle: extractedSubtitle,
            coverImage: finalCover,
            topics,
            questions,
            notes,
            isDefault: false,
            createdAt: Date.now()
        };
    }
};