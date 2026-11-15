window.QuizHub = window.QuizHub || {};

// Quản lý Sổ tay tóm tắt kiến thức của kho quiz đang mở
QuizHub.Notes = {
    currentRepo: null,
    selectedTopic: 'all',

    loadNotesRepo(quizObj) {
        this.currentRepo = quizObj;
        this.selectedTopic = 'all';

        const filterBox = document.getElementById('notes-topic-filters');
        if (!filterBox) return;

        const pills = [
            `<button type="button" onclick="QuizHub.Notes.setTopic('all')" data-ntopic="all" class="ntopic-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white">Tất cả chủ đề</button>`
        ].concat(
            (quizObj.topics || []).map(t =>
                `<button type="button" onclick="QuizHub.Notes.setTopic('${t.id}')" data-ntopic="${t.id}" class="ntopic-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">${QuizHub.App.escapeHtml(t.name)}</button>`
            )
        );
        filterBox.innerHTML = pills.join('');
    },

    setTopic(topic) {
        this.selectedTopic = topic;
        document.querySelectorAll('.ntopic-btn').forEach(btn => {
            btn.className = btn.dataset.ntopic === topic
                ? 'ntopic-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white'
                : 'ntopic-btn px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800';
        });
        this.render();
    },

    render() {
        const container = document.getElementById('notes-container');
        if (!this.currentRepo || !container) return;

        const keyword = (document.getElementById('notes-search')?.value || '').trim().toLowerCase();
        const notes = this.currentRepo.notes || [];

        const filtered = notes.filter(note => {
            const matchTopic = this.selectedTopic === 'all' || note.topic === this.selectedTopic;
            if (!matchTopic) return false;
            if (!keyword) return true;
            return (note.title || '').toLowerCase().includes(keyword) ||
                   (note.items && note.items.some(i => i.toLowerCase().includes(keyword)));
        });

        if (filtered.length === 0) {
            container.innerHTML = `<div class="lg:col-span-2 p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500">Không có nội dung sổ tay phù hợp.</div>`;
            return;
        }

        container.innerHTML = filtered.map(note => {
            let bodyHtml = '';
            if (note.items) {
                bodyHtml = `<ul class="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed list-disc pl-5">${note.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
            } else if (note.table) {
                bodyHtml = `
                    <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-100 dark:bg-slate-800 font-bold">
                                <tr>${note.table.headers.map(h => `<th class="p-2.5">${QuizHub.App.escapeHtml(h)}</th>`).join('')}</tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                                ${note.table.rows.map(r => `<tr>${r.map(c => `<td class="p-2.5">${QuizHub.App.escapeHtml(c)}</td>`).join('')}</tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`;
            }

            return `
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
                    <div class="space-y-1.5">
                        <span class="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">${QuizHub.App.escapeHtml(note.badge || '')}</span>
                        <h3 class="text-base font-extrabold text-slate-900 dark:text-white">${QuizHub.App.escapeHtml(note.title)}</h3>
                    </div>
                    ${bodyHtml}
                </div>
            `;
        }).join('');
    }
};