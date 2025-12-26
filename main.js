class LearningApp {
  constructor(data) {
    this.allData = data;
    // Lấy dữ liệu user từ LocalStorage
    this.stats = JSON.parse(localStorage.getItem("mp_stats")) || {
      xp: 0,
      mistakeIds: [],
      streak: 0,
      lastLogin: null,
      completedLessons: [],
    };

    this.state = {
      currentIdx: 0,
      questions: [],
      history: [],
      isMistakeMode: false,
    };

    // 1. Cache các màn hình (Routing)
    this.screens = {
      landing: document.getElementById("view-landing"),
      dashboard: document.getElementById("view-dashboard"),
      quiz: document.getElementById("view-quiz"),
      result: document.getElementById("view-result"),
    };

    // --- PHẦN BỊ THIẾU CẦN THÊM VÀO ---
    // 2. Cache các thành phần UI trong Quiz (Để loadStep sử dụng)
    this.ui = {
      questionText: document.getElementById("question-text"),
      optionsGrid: document.getElementById("options-grid"),
      feedbackArea: document.getElementById("feedback-area"),
      microHint: document.getElementById("micro-hint"),
      progressText: document.getElementById("progress-text"),
      nextBtn: document.getElementById("next-btn"),
    };
    // ----------------------------------

    this.init();
  }

  init() {
    if (this.stats.lastLogin) {
      this.navigate("dashboard");
    } else {
      this.navigate("landing");
    }
    this.updateStreak();
  }

  // --- NAVIGATION ---
  navigate(screenName) {
    Object.values(this.screens).forEach((el) => {
      if (el) el.style.display = "none";
    });

    if (this.screens[screenName]) {
      this.screens[screenName].style.display = "block";
    }

    if (screenName === "dashboard") {
      const dashboardBtn = document.getElementById("dashboard-btn");
      if (dashboardBtn) dashboardBtn.style.display = "block";
      this.renderDashboard();
    } else if (screenName === "landing") {
      const dashboardBtn = document.getElementById("dashboard-btn");
      if (dashboardBtn) dashboardBtn.style.display = "none";
    }
  }

  enterApp() {
    this.stats.lastLogin = new Date().toISOString();
    localStorage.setItem("mp_stats", JSON.stringify(this.stats));
    this.navigate("dashboard");
  }

  // --- DASHBOARD ---
  renderDashboard() {
    const xpEl = document.getElementById("dash-xp");
    if (xpEl) xpEl.innerText = this.stats.xp;

    const streakEl = document.getElementById("dash-streak");
    if (streakEl) streakEl.innerText = this.stats.streak;

    const mistakeEl = document.getElementById("dash-mistakes");
    if (mistakeEl) mistakeEl.innerText = this.stats.mistakeIds.length;

    const mistakeCountEl = document.getElementById("mistake-count");
    if (mistakeCountEl) mistakeCountEl.innerText = this.stats.mistakeIds.length;

    const mistakeBanner = document.getElementById("mistake-alert");
    if (mistakeBanner) {
      mistakeBanner.style.display =
        this.stats.mistakeIds.length > 0 ? "flex" : "none";
    }

    const pathContainer = document.getElementById("path-container");
    if (pathContainer) {
      pathContainer.innerHTML = "";
      Object.keys(this.allData).forEach((key) => {
        const count = this.allData[key].length;
        const card = document.createElement("div");
        card.className = "path-card";
        card.onclick = () => this.startQuiz(key);
        card.innerHTML = `
                    <h4>🚀 ${key.toUpperCase()}</h4>
                    <div class="path-meta">
                        <span><i class="fas fa-list"></i> ${count} Bài tập</span>
                        <span><i class="fas fa-clock"></i> ~${Math.ceil(
                          count * 0.5
                        )} phút</span>
                    </div>
                    <div style="margin-top: 15px; width: 100%; height: 6px; background: #eee; border-radius: 3px;">
                        <div style="width: 0%; height: 100%; background: var(--primary-glow); border-radius: 3px;"></div>
                    </div>
                `;
        pathContainer.appendChild(card);
      });
    }
  }

  updateStreak() {
    // Logic streak cơ bản (có thể mở rộng sau)
  }

  // --- QUIZ LOGIC ---
  startQuiz(category) {
    this.state.isMistakeMode = false;
    this.state.questions = [...this.allData[category]].sort(
      () => Math.random() - 0.5
    );
    this.resetFlow();
  }

  startMistakeMode() {
    this.state.isMistakeMode = true;
    const allQuestions = Object.values(this.allData).flat();
    this.state.questions = allQuestions.filter((q) =>
      this.stats.mistakeIds.includes(q.id)
    );
    this.resetFlow();
  }

  resetFlow() {
    this.state.currentIdx = 0;
    this.state.history = [];
    this.navigate("quiz");
    this.loadStep();
  }

  loadStep() {
    const q = this.state.questions[this.state.currentIdx];

    // 1. Reset UI (Kiểm tra an toàn để tránh lỗi null)
    if (this.ui.feedbackArea) this.ui.feedbackArea.style.display = "none";

    if (this.ui.optionsGrid) {
      this.ui.optionsGrid.style.pointerEvents = "auto";
      this.ui.optionsGrid.innerHTML = "";
    }

    if (this.ui.questionText) {
      this.ui.questionText.innerText = q.q;
    }

    // 2. Cập nhật tiến trình
    if (this.ui.progressText) {
      this.ui.progressText.innerText = `Câu ${this.state.currentIdx + 1} / ${
        this.state.questions.length
      }`;
    }
    this.updateProgress();

    // 3. Render Options
    if (this.ui.optionsGrid) {
      q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option-card";
        btn.innerText = opt;
        btn.onclick = () => this.handleAnswer(i, btn);
        this.ui.optionsGrid.appendChild(btn);
      });
    }
  }

  handleAnswer(idx, btnElement) {
    const q = this.state.questions[this.state.currentIdx];
    const isCorrect = idx === q.a;

    this.state.history.push({
      qId: q.id,
      isCorrect: isCorrect,
      userAns: idx,
    });

    if (this.ui.optionsGrid) {
      this.ui.optionsGrid.style.pointerEvents = "none";
      const cards = document.querySelectorAll(".option-card");
      cards.forEach((c) => (c.style.pointerEvents = "none"));
    }

    if (isCorrect) {
      btnElement.classList.add("correct");
      this.stats.xp += 10;
      if (typeof confetti === "function") {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      }

      if (this.state.isMistakeMode) {
        this.stats.mistakeIds = this.stats.mistakeIds.filter(
          (id) => id !== q.id
        );
      }
    } else {
      btnElement.classList.add("wrong");
      if (this.ui.optionsGrid && this.ui.optionsGrid.children[q.a]) {
        this.ui.optionsGrid.children[q.a].classList.add("correct");
      }

      if (!this.stats.mistakeIds.includes(q.id)) {
        this.stats.mistakeIds.push(q.id);
      }
    }

    this.stats.totalAnswered++;
    localStorage.setItem("mp_stats", JSON.stringify(this.stats));

    if (this.ui.microHint) {
      this.ui.microHint.innerHTML = `
            <div class="${isCorrect ? "msg-success" : "msg-error"}">
                <strong>${
                  isCorrect ? "Chính xác! 🎉" : "Chưa đúng rồi 😅"
                }</strong><br>
                ${q.explanation}
            </div>
        `;
    }

    if (this.ui.feedbackArea) {
      this.ui.feedbackArea.style.display = "block";
      this.ui.feedbackArea.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }

  nextStep() {
    this.state.currentIdx++;
    if (this.state.currentIdx < this.state.questions.length) {
      this.loadStep();
    } else {
      this.endQuiz();
    }
  }

  updateProgress() {
    const bar = document.getElementById("progress-glow");
    if (bar) {
      const p = (this.state.currentIdx / this.state.questions.length) * 100;
      bar.style.width = p + "%";
    }
  }

  endQuiz() {
    const correctCount = this.state.history.filter((h) => h.isCorrect).length;
    const total = this.state.questions.length;

    const resultDiv = document.getElementById("result-content");
    if (resultDiv) {
      // Tạo map kết quả (Xanh/Đỏ)
      const mapHTML = this.state.history
        .map(
          (h, i) => `
            <div class="node ${h.isCorrect ? "correct" : "wrong"}" title="Câu ${
            i + 1
          }">
                ${i + 1}
            </div>
        `
        )
        .join("");

      resultDiv.innerHTML = `
                <h2>Hoàn thành! 🏁</h2>
                <p>Kết quả: <b>${correctCount}/${total}</b></p>
                
                <div style="margin: 20px 0;">
                    <p style="font-size: 0.9rem; margin-bottom: 10px;">Bản đồ kết quả:</p>
                    <div id="knowledge-map">${mapHTML}</div>
                </div>

                <div class="action-group">
                    <button class="mode-btn" onclick="app.navigate('dashboard')">🏠 Về Dashboard</button>
                    <button class="mode-btn secondary" onclick="app.startQuiz('${
                      this.state.questions[0]?.tag || "hci"
                    }')">🔄 Làm lại</button>
                </div>
            `;
    }

    this.navigate("result");
    localStorage.setItem("mp_stats", JSON.stringify(this.stats));
  }
}

// Khởi tạo ứng dụng
const app = new LearningApp(quizData);
