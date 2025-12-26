class LearningFlowApp {
  constructor(data) {
    this.questions = data;
    this.currentIdx = 0;
    this.history = [];
    this.xp = 150;
    this.currentStreak = 0;
    this.streakThreshold = 3;

    this.ui = {
      text: document.getElementById("question-text"),
      grid: document.getElementById("options-grid"),
      hint: document.getElementById("micro-hint"),
      progress: document.getElementById("progress-glow"),
      xpInfo: document.getElementById("xp-info"),
      streakInfo: document.getElementById("streak-info"),
      scenes: {
        quiz: document.getElementById("question-scene"),
        review: document.getElementById("review-scene"),
      },
    };

    this.createStreakUI();
    this.loadStep();
  }

  createStreakUI() {
    const badge = document.createElement("div");
    badge.id = "streak-badge";
    badge.className = "streak-badge";
    document.querySelector(".glass-card").appendChild(badge);
    this.ui.streakBadge = badge;
  }

  loadStep() {
    const q = this.questions[this.currentIdx];

    // 5. Tập trung tuyệt đối: Xóa bỏ các yếu tố gây nhiễu
    this.ui.grid.innerHTML = "";
    this.ui.hint.innerHTML = "";
    this.ui.text.innerText = q.q;

    // 2. Thanh tiến trình mờ (không số)
    this.ui.progress.style.width = `${
      (this.currentIdx / this.questions.length) * 100
    }%`;

    q.options.forEach((opt, i) => {
      const btn = document.createElement("div");
      btn.className = "option-card";
      btn.innerText = opt;
      btn.onclick = () => this.handleDecision(i);
      this.ui.grid.appendChild(btn);
    });
  }

  handleDecision(index) {
    const q = this.questions[this.currentIdx];
    const isCorrect = index === q.a;
    const cards = this.ui.grid.querySelectorAll(".option-card");

    cards.forEach((c) => (c.style.pointerEvents = "none"));

    // 7. Phản hồi màu sắc có kiểm soát
    if (isCorrect) {
      cards[index].classList.add("correct");
      this.ui.hint.innerHTML = `<p style="color: var(--success-soft)"><b>Chính xác!</b> ${q.feedbackOk}</p>`;
    } else {
      cards[index].classList.add("wrong");
      cards[q.a].classList.add("correct");
      this.ui.hint.innerHTML = `<p style="color: var(--error-soft)"><b>Gợi ý:</b> ${q.feedbackFail}</p>`;
    }

    // 6. Nút hành động rõ ràng & nhất quán
    const controls = document.createElement("div");
    controls.style.marginTop = "30px";

    const nextBtn = document.createElement("button");
    nextBtn.className = "action-btn primary-btn";
    nextBtn.innerText =
      this.currentIdx === this.questions.length - 1
        ? "Xem kết quả"
        : "Tiếp theo";
    nextBtn.onclick = () => this.goToNext();

    controls.appendChild(nextBtn);
    this.ui.grid.appendChild(controls);
  }

  goToNext() {
    this.currentIdx++;
    if (this.currentIdx < this.questions.length) {
      this.loadStep();
    } else {
      this.showKnowledgeMap();
    }
  }

  updateStats() {
    this.ui.xpInfo.innerText = `✨ ${this.xp} XP`;
    this.ui.streakInfo.innerText = `🔥 ${this.currentStreak} Câu đúng`;
  }

  showKnowledgeMap() {
    this.ui.scenes.quiz.style.display = "none";
    this.ui.scenes.review.style.display = "block";

    // 3. Màn hình kết thúc: Tổng kết điểm
    const correctCount = this.history.filter((h) => h.isCorrect).length;
    const summaryText =
      correctCount > this.questions.length / 2
        ? "🌟 Tuyệt vời! Bạn đã nắm vững kiến thức."
        : "📘 Cố gắng lên! Hãy xem lại các câu sai nhé.";

    document.getElementById(
      "mistake-analysis"
    ).innerHTML = `<h4>${summaryText}</h4><p>Bạn đúng ${correctCount}/${this.questions.length} câu.</p>`;

    // 4. Review Mode: Click vào node để xem lại chi tiết
    const mapContainer = document.getElementById("knowledge-map");
    mapContainer.innerHTML = this.history
      .map(
        (h, i) => `
        <div class="node ${
          h.isCorrect ? "correct" : "wrong"
        }" onclick="alert('Câu hỏi: ${h.question}\\nBạn chọn: ${
          h.selected
        }\\nĐáp án đúng: ${h.correct}')">
            <span>${i + 1}</span>
            <small>${h.tag}</small>
        </div>
    `
      )
      .join("");
  }
}

const app = new LearningFlowApp(quizBank);
