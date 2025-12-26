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

    // Adaptive UI: Font lớn hơn nếu câu trước sai
    if (this.history[this.currentIdx - 1]?.isCorrect === false) {
      this.ui.text.style.fontSize = "1.8rem";
    } else {
      this.ui.text.style.fontSize = "1.6rem";
    }

    this.ui.text.innerText = q.q;
    this.ui.grid.innerHTML = "";
    this.ui.hint.innerText = "";

    this.ui.progress.style.width = `${
      ((this.currentIdx + 1) / this.questions.length) * 100
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
    const cardContainer = document.querySelector(".glass-card");

    cards.forEach((c) => (c.style.pointerEvents = "none"));

    if (isCorrect) {
      cards[index].classList.add("correct");
      this.ui.hint.innerText = "✨ " + q.feedbackOk;

      this.currentStreak++;
      if (this.currentStreak >= this.streakThreshold) {
        cardContainer.classList.add("streak-active");
        this.ui.streakBadge.innerText = `🔥 STREAK x${this.currentStreak}`;
        this.ui.streakBadge.classList.add("show");
        this.xp += 20 * this.currentStreak;
      } else {
        this.xp += 20;
      }
    } else {
      cards[index].classList.add("wrong");
      cards[q.a].classList.add("correct");
      this.ui.hint.innerText = "💡 " + q.feedbackFail;

      this.currentStreak = 0;
      cardContainer.classList.remove("streak-active");
      this.ui.streakBadge.classList.remove("show");
    }

    this.updateStats();
    this.history.push({ qId: q.id, isCorrect, tag: q.tag });

    setTimeout(() => {
      this.currentIdx++;
      if (this.currentIdx < this.questions.length) {
        this.loadStep();
      } else {
        this.showKnowledgeMap();
      }
    }, 1500);
  }

  updateStats() {
    this.ui.xpInfo.innerText = `✨ ${this.xp} XP`;
    this.ui.streakInfo.innerText = `🔥 ${this.currentStreak} Câu đúng`;
  }

  showKnowledgeMap() {
    this.ui.scenes.quiz.style.display = "none";
    this.ui.scenes.review.style.display = "block";
    const mapContainer = document.getElementById("knowledge-map");

    mapContainer.innerHTML = this.history
      .map(
        (h) => `
            <div class="node ${h.isCorrect ? "correct" : "wrong"}">
                <span>${h.isCorrect ? "✔" : "✘"}</span>
                <small>${h.tag}</small>
            </div>
        `
      )
      .join("");
  }
}

const app = new LearningFlowApp(quizBank);
