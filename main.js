// CẤU HÌNH RANK: PHƯƠNG ÁN 3 (ESPORT / MMO)
const RANK_SYSTEM = [
  { threshold: 0, name: "Bronze", color: "#cd7f32" },
  { threshold: 150, name: "Silver", color: "#bdc3c7" },
  { threshold: 400, name: "Gold", color: "#f1c40f" },
  { threshold: 800, name: "Platinum", color: "#00cec9" },
  { threshold: 1500, name: "Diamond", color: "#74b9ff" },
  { threshold: 2500, name: "Master", color: "#9b59b6" },
  { threshold: 4000, name: "Grandmaster", color: "#d63031" },
  { threshold: 6000, name: "Challenger", color: "#e84393" },
  { threshold: 9000, name: "Immortal", color: "#fdcb6e" },
  { threshold: 13000, name: "Apex", color: "#2d3436" },
];

class LearningApp {
  constructor(data) {
    this.allData = data;
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

    // --- MỚI 1: State cho Living Background ---
    this.sessionState = {
      currentStreak: 0,
      consecutiveWrong: 0,
    };
    this.bgElement = document.getElementById("living-bg");
    // ------------------------------------------

    this.screens = {
      landing: document.getElementById("view-landing"),
      dashboard: document.getElementById("view-dashboard"),
      quiz: document.getElementById("view-quiz"),
      result: document.getElementById("view-result"),
    };

    this.ui = {
      questionText: document.getElementById("question-text"),
      optionsGrid: document.getElementById("options-grid"),
      feedbackArea: document.getElementById("feedback-area"),
      microHint: document.getElementById("micro-hint"),
      progressText: document.getElementById("progress-text"),
      nextBtn: document.getElementById("next-btn"),
    };

    this.init();
    this.setupTheme();
  }

  init() {
    if (this.stats.lastLogin) {
      this.navigate("dashboard");
    } else {
      this.navigate("landing");
    }
    this.updateStreak();
  }

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

  renderDashboard() {
    // 1. Logic Rank
    const currentXP = this.stats.xp;
    let currentRank = RANK_SYSTEM[0];
    let nextRank = RANK_SYSTEM[RANK_SYSTEM.length - 1];
    let progressPercent = 100;

    for (let i = 0; i < RANK_SYSTEM.length; i++) {
      if (currentXP >= RANK_SYSTEM[i].threshold) {
        currentRank = RANK_SYSTEM[i];
        if (i < RANK_SYSTEM.length - 1) {
          nextRank = RANK_SYSTEM[i + 1];
          const currentLevelXP = currentXP - currentRank.threshold;
          const nextLevelNeed = nextRank.threshold - currentRank.threshold;
          progressPercent = Math.floor((currentLevelXP / nextLevelNeed) * 100);
        } else {
          progressPercent = 100;
          nextRank = { name: "Max Level", threshold: currentXP };
        }
      }
    }

    // 2. Render Stats
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

    // 3. Render UI Rank
    const rankNameEl = document.getElementById("rank-name");
    const rankBarEl = document.getElementById("rank-progress-bar");
    const rankTextEl = document.getElementById("rank-next-text");

    if (rankNameEl) {
      rankNameEl.innerText = currentRank.name;
      rankNameEl.style.color = currentRank.color;
    }
    if (rankBarEl) {
      rankBarEl.style.width = `${progressPercent}%`;
      rankBarEl.style.backgroundColor = currentRank.color;
    }
    if (rankTextEl) {
      // Logic fix hiển thị Apex
      const maxRankThreshold = RANK_SYSTEM[RANK_SYSTEM.length - 1].threshold;
      if (currentXP >= maxRankThreshold) {
        rankTextEl.innerHTML = "👑 Đỉnh cao vọng trọng! Bạn là huyền thoại.";
        rankTextEl.style.color = "#ffd700";
      } else {
        rankTextEl.innerText = `Còn ${
          nextRank.threshold - currentXP
        } XP để lên ${nextRank.name}`;
        rankTextEl.style.color = "";
      }
    }

    // 4. Render Learning Paths
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
    // Logic streak cơ bản
  }

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

    // Reset trạng thái background mỗi khi bắt đầu quiz mới
    this.sessionState = { currentStreak: 0, consecutiveWrong: 0 };
    this.setBgState("normal");

    this.navigate("quiz");
    this.loadStep();
  }

  loadStep() {
    const q = this.state.questions[this.state.currentIdx];

    if (this.ui.feedbackArea) this.ui.feedbackArea.style.display = "none";

    if (this.ui.optionsGrid) {
      this.ui.optionsGrid.style.pointerEvents = "auto";
      this.ui.optionsGrid.innerHTML = "";
    }

    if (this.ui.questionText) {
      this.ui.questionText.innerText = q.q;
    }

    if (this.ui.progressText) {
      this.ui.progressText.innerText = `Câu ${this.state.currentIdx + 1} / ${
        this.state.questions.length
      }`;
    }
    this.updateProgress();

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

  // --- MỚI 2: Logic xử lý câu trả lời tích hợp Nền Sống ---
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

      // === LOGIC NỀN: ĐÚNG ===
      this.sessionState.currentStreak++;
      this.sessionState.consecutiveWrong = 0;

      if (this.sessionState.currentStreak >= 3) {
        this.setBgState("warm");
      } else {
        this.setBgState("normal");
      }
    } else {
      btnElement.classList.add("wrong");
      if (this.ui.optionsGrid && this.ui.optionsGrid.children[q.a]) {
        this.ui.optionsGrid.children[q.a].classList.add("correct");
      }

      if (!this.stats.mistakeIds.includes(q.id)) {
        this.stats.mistakeIds.push(q.id);
      }

      // === LOGIC NỀN: SAI ===
      this.sessionState.consecutiveWrong++;
      this.sessionState.currentStreak = 0;

      if (this.sessionState.consecutiveWrong >= 2) {
        this.setBgState("cold");
      } else {
        this.setBgState("normal");
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

  // --- MỚI 3: Hàm Helper đổi màu nền ---
  setBgState(state) {
    if (!this.bgElement) return;

    // Xóa hết class trạng thái cũ
    this.bgElement.classList.remove("state-warm", "state-cold");

    if (state === "warm") {
      this.bgElement.classList.add("state-warm");
    } else if (state === "cold") {
      this.bgElement.classList.add("state-cold");
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

  // --- MỚI 4: Hiệu ứng kết thúc ---
  endQuiz() {
    const correctCount = this.state.history.filter((h) => h.isCorrect).length;
    const total = this.state.questions.length;

    const resultDiv = document.getElementById("result-content");
    if (resultDiv) {
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

    // Hiệu ứng Pulse cuối cùng
    if (this.bgElement) {
      this.bgElement.classList.add("pulse-rankup");
      setTimeout(() => {
        this.bgElement.classList.remove("pulse-rankup");
        this.setBgState("normal");
      }, 2000);
    }
  }
  // --- LOGIC DARK MODE ---
  setupTheme() {
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) return;

    // 1. Kiểm tra LocalStorage xem user đã chọn dark mode chưa
    const isDark = localStorage.getItem("mp_theme") === "dark";
    if (isDark) {
      document.body.classList.add("dark-mode");
      themeBtn.innerHTML = '<i class="fas fa-sun"></i>'; // Đổi icon thành mặt trời
    }

    // 2. Bắt sự kiện click
    themeBtn.onclick = () => {
      document.body.classList.toggle("dark-mode");
      const isDarkModeNow = document.body.classList.contains("dark-mode");

      // Đổi icon & Lưu vào bộ nhớ
      if (isDarkModeNow) {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem("mp_theme", "dark");
      } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem("mp_theme", "light");
      }
    };
  }
}

// Khởi tạo ứng dụng
const app = new LearningApp(quizData);
