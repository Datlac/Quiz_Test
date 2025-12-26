// --- CẤU HÌNH RANK SYSTEM (GIAI ĐOẠN 2: FULL PATH) ---
const RANK_SYSTEM = [
  // Giai đoạn Tân thủ
  { name: "Bronze", min: 0, max: 300, color: "#cd7f32" },
  { name: "Silver", min: 300, max: 800, color: "#bdc3c7" },
  { name: "Gold", min: 800, max: 1500, color: "#f1c40f" },

  // Giai đoạn Cao thủ (User cam kết)
  { name: "Platinum", min: 1500, max: 2500, color: "#00cec9" },
  { name: "Master", min: 2500, max: 4000, color: "#9b59b6" },
  { name: "Grandmaster", min: 4000, max: 6000, color: "#d63031" },

  // Giai đoạn Huyền thoại (End Game)
  { name: "Challenger", min: 6000, max: 9000, color: "#e84393" },
  { name: "Immortal", min: 9000, max: 13000, color: "#fdcb6e" },
  { name: "Apex", min: 13000, max: 99999, color: "#2d3436" },
];

function getRankByXP(xp) {
  return (
    RANK_SYSTEM.find((r) => xp >= r.min && xp < r.max) ||
    RANK_SYSTEM[RANK_SYSTEM.length - 1]
  );
}

function getNextRank(currentRank) {
  const idx = RANK_SYSTEM.indexOf(currentRank);
  if (idx >= 0 && idx < RANK_SYSTEM.length - 1) {
    return RANK_SYSTEM[idx + 1];
  }
  return null;
}

class LearningApp {
  constructor(data) {
    this.allData = data;
    this.stats = JSON.parse(localStorage.getItem("mp_stats")) || {
      xp: 0,
      mistakeIds: [],
      streak: 0,
      lastLogin: null,
      questionStats: {},
      mistakeIds: [],
      completedLessons: [],
    };

    // --- FIX DỮ LIỆU CŨ ---
    if (!this.stats.questionStats) {
      this.stats.questionStats = {};
    }
    if (!this.stats.mistakeIds) this.stats.mistakeIds = [];
    if (typeof this.stats.xp !== "number") this.stats.xp = 0;
    // ----------------------

    this.state = {
      currentIdx: 0,
      questions: [],
      history: [],
      isMistakeMode: false,
    };

    this.sessionState = {
      currentStreak: 0,
      consecutiveWrong: 0,
    };
    this.bgElement = document.getElementById("living-bg");

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

  // --- CẬP NHẬT RENDER DASHBOARD (GIAO DIỆN LEARNING HUB) ---
  renderDashboard() {
    const dashboardHeader = document.getElementById(
      "dashboard-header-container"
    ); // Tạo div này trong HTML nếu chưa có, hoặc append vào view-dashboard
    const pathContainer = document.getElementById("path-container");
    const mistakeBanner = document.getElementById("mistake-alert");

    // 1. Render Greeting (Chào hỏi cá nhân hóa)
    const hour = new Date().getHours();
    let greeting = "Chào buổi sáng";
    if (hour >= 12 && hour < 18) greeting = "Chào buổi chiều";
    else if (hour >= 18) greeting = "Chào buổi tối";

    // Tìm hoặc tạo khu vực Greeting ngay đầu Dashboard
    let welcomeSection = document.getElementById("welcome-section");
    if (!welcomeSection && pathContainer) {
      welcomeSection = document.createElement("div");
      welcomeSection.id = "welcome-section";
      pathContainer.parentNode.insertBefore(welcomeSection, pathContainer);
    }

    if (welcomeSection) {
      welcomeSection.innerHTML = `
            <div class="welcome-header">
                <div>
                    <h1 class="greeting-text">${greeting}, Learner! 👋</h1>
                    <p class="subtitle">Sẵn sàng chinh phục kiến thức hôm nay chưa?</p>
                </div>
                <div class="streak-pill">
                    <i class="fas fa-fire"></i> 
                    <span>${this.stats.streak} Ngày</span>
                </div>
            </div>
        `;
    }

    // 2. Render Mistake Hero (Nút ôn tập nổi bật)
    // Lấy top câu sai nhiều nhất để hiển thị
    const allStats = Object.entries(this.stats.questionStats);
    const weakQuestions = allStats.filter(([id, s]) => s.wrong > 0);

    if (mistakeBanner) {
      if (weakQuestions.length > 0) {
        mistakeBanner.className = "mistake-hero"; // Class mới xịn hơn
        mistakeBanner.style.display = "flex";
        mistakeBanner.innerHTML = `
                <div class="mistake-info">
                    <div class="icon-box warning">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                        <h4>Cần ôn tập gấp!</h4>
                        <p>Bạn có <strong style="color: #e17055">${weakQuestions.length} câu hỏi</strong> cần xem lại.</p>
                    </div>
                </div>
                <button class="review-btn" onclick="app.startMistakeMode()">
                    Chữa lỗi ngay <i class="fas fa-arrow-right"></i>
                </button>
            `;
      } else {
        mistakeBanner.style.display = "none";
      }
    }

    // 3. Render Course Cards (Danh sách bài học)
    if (pathContainer) {
      pathContainer.className = "course-grid"; // Đổi class để CSS mới ăn vào
      pathContainer.innerHTML = "";

      Object.keys(this.allData).forEach((key) => {
        const count = this.allData[key].length;

        // Chọn icon và màu gradient dựa trên tên bài học (Example logic)
        let icon = "fa-book";
        let gradientClass = "grad-blue"; // Mặc định
        let label = "General Knowledge";

        if (key.toLowerCase().includes("hci")) {
          icon = "fa-laptop-code";
          gradientClass = "grad-purple";
          label = "UX & Design";
        } else if (
          key.toLowerCase().includes("english") ||
          key.toLowerCase().includes("tiếng anh")
        ) {
          icon = "fa-language";
          gradientClass = "grad-green";
          label = "Language Skills";
        }

        const card = document.createElement("div");
        card.className = `course-card ${gradientClass}`;
        card.onclick = () => this.startQuiz(key);

        // HTML Card mới
        card.innerHTML = `
            <div class="card-bg-decoration"></div>
            <div class="card-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="card-content">
                <span class="card-label">${label}</span>
                <h3>${key.toUpperCase()}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-layer-group"></i> ${count} Questions</span>
                    <span><i class="fas fa-stopwatch"></i> ~${Math.ceil(
                      count * 0.8
                    )}m</span>
                </div>
            </div>
            <div class="play-indicator">
                <i class="fas fa-play"></i>
            </div>
        `;
        pathContainer.appendChild(card);
      });
    }

    // Cập nhật các chỉ số Stats nhỏ khác nếu cần (giữ nguyên logic cũ của bạn)
    this.updateStreak();
  }

  updateStreak() {
    const streakEl = document.getElementById("dash-streak");
    if (streakEl) streakEl.innerText = this.stats.streak;
  }

  startQuiz(category) {
    this.tempCategory = category;
    document.getElementById("mode-modal").classList.add("active");
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

  updateMemoryStats(questionId, isCorrect) {
    if (!this.stats.questionStats[questionId]) {
      this.stats.questionStats[questionId] = {
        wrong: 0,
        correct: 0,
        interval: 0,
        nextReview: 0,
      };
    }

    const stat = this.stats.questionStats[questionId];
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (isCorrect) {
      stat.correct++;
      if (stat.interval === 0) stat.interval = 1;
      else if (stat.interval === 1) stat.interval = 3;
      else stat.interval = Math.round(stat.interval * 1.8);
      stat.nextReview = now + stat.interval * ONE_DAY;
    } else {
      stat.wrong++;
      stat.interval = 0;
      stat.nextReview = now;
      if (!this.stats.mistakeIds.includes(questionId)) {
        this.stats.mistakeIds.push(questionId);
      }
    }
    this.stats.questionStats[questionId] = stat;
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
    this.updateMemoryStats(q.id, isCorrect);

    if (isCorrect) {
      btnElement.classList.add("correct");
      this.stats.xp += 10;
      localStorage.setItem("mp_stats", JSON.stringify(this.stats));
      if (typeof confetti === "function") {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      }

      if (this.state.isMistakeMode) {
        this.stats.mistakeIds = this.stats.mistakeIds.filter(
          (id) => id !== q.id
        );
      }

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

    if (this.ui.feedbackArea && this.ui.microHint) {
      this.ui.feedbackArea.classList.remove(
        "feedback-correct",
        "feedback-wrong"
      );
      this.ui.feedbackArea.classList.add(
        isCorrect ? "feedback-correct" : "feedback-wrong"
      );
      this.ui.microHint.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 1.6rem; line-height: 1;">${
                  isCorrect ? "🎉" : "💡"
                }</div>
                <div>
                    <strong style="color: ${
                      isCorrect ? "#10b981" : "#ef4444"
                    }; font-size: 1.1rem; display: block; margin-bottom: 4px;">
                        ${isCorrect ? "Tuyệt vời!" : "Đáp án đúng là:"}
                    </strong>
                    <span style="opacity: 0.95; font-size: 0.95rem;">${
                      q.explanation
                    }</span>
                </div>
            </div>`;
    }

    if (this.ui.feedbackArea) {
      this.ui.feedbackArea.style.display = "block";
      this.ui.feedbackArea.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    this.playClickSound(isCorrect ? "correct" : "wrong");
  }

  setBgState(state) {
    if (!this.bgElement) return;
    this.bgElement.classList.remove("state-warm", "state-cold");
    if (state === "warm") this.bgElement.classList.add("state-warm");
    else if (state === "cold") this.bgElement.classList.add("state-cold");
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

  // --- END QUIZ: PHIÊN BẢN KNOWLEDGE GALAXY ---
  endQuiz() {
    const correctCount = this.state.history.filter((h) => h.isCorrect).length;
    const total = this.state.questions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const xpGained = correctCount * 10;

    // 1. Logic danh hiệu
    let title = "Cố gắng hơn nhé! 💪";
    let msg = "Hành trình vạn dặm bắt đầu từ bước chân đầu tiên.";
    if (percentage >= 80) {
      title = "Xuất sắc! 🌟";
      msg = "Bạn đã làm chủ kiến thức này.";
    } else if (percentage >= 50) {
      title = "Làm tốt lắm! 🔥";
      msg = "Bạn đang đi đúng hướng.";
    }

    // 2. Render Layout Kết quả Mới
    const resultDiv = document.getElementById("result-content");

    if (resultDiv) {
      resultDiv.innerHTML = `
            <div class="result-card">
                <h2 style="font-size: 2rem; margin-bottom: 5px;">${title}</h2>
                <p style="opacity: 0.8; margin-bottom: 20px;">${msg}</p>

                <div class="summary-grid">
                    <div class="summary-card">
                        <span class="summary-value" style="color: #2ecc71;">${percentage}%</span>
                        <span class="summary-label">Chính xác</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-value" style="color: #f1c40f;">+${xpGained}</span>
                        <span class="summary-label">XP Kiếm được</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-value" style="color: #e74c3c;">${this.stats.streak}🔥</span>
                        <span class="summary-label">Streak</span>
                    </div>
                </div>

                <div style="text-align: left; font-weight: 700; margin-bottom: 10px; color: var(--text-main);">
                    <i class="fas fa-project-diagram"></i> Bản đồ kiến thức:
                </div>
                
                <div class="knowledge-graph-wrapper" id="knowledge-graph">
                    <svg class="graph-svg" id="graph-lines"></svg>
                    </div>

                <div style="margin-top: 25px;">
                    <button class="hero-btn" onclick="app.startQuiz('${this.state.currentCategory}')">
                        <i class="fas fa-redo-alt"></i> Bắt đầu nhịp thở mới
                    </button>
                    
                    <button class="mode-btn secondary" style="width: 100%; margin-top: 10px; border: none; background: transparent;" onclick="app.navigate('dashboard')">
                        <i class="fas fa-arrow-left"></i> Quay về Dashboard
                    </button>
                </div>
            </div>
        `;

      // 3. Khởi tạo Graph sau khi HTML đã render
      setTimeout(() => this.renderGalaxyGraph(), 50);
    }

    this.navigate("result");
    localStorage.setItem("mp_stats", JSON.stringify(this.stats));

    // Hiệu ứng nền
    if (this.bgElement) {
      this.bgElement.classList.add("pulse-rankup");
      setTimeout(() => {
        this.bgElement.classList.remove("pulse-rankup");
        this.setBgState("normal");
      }, 2000);
    }
  }

  // --- HÀM VẼ GRAPH (Pure JS Logic) ---
  renderGalaxyGraph() {
    const container = document.getElementById("knowledge-graph");
    const svg = document.getElementById("graph-lines");
    if (!container || !svg) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const history = this.state.history;
    const totalNodes = history.length;

    // Logic xếp vị trí: Dạng Sóng (Sine Wave) hoặc ZigZag để tạo đường dẫn
    // Tạo padding 2 bên
    const paddingX = 40;
    const stepX = (width - paddingX * 2) / (totalNodes - 1);

    let nodesHTML = "";
    let linesHTML = "";

    // Mảng lưu tọa độ để vẽ dây
    const coords = [];

    history.forEach((h, index) => {
      // Tính toán tọa độ (X: đều nhau, Y: dao động sóng sin)
      const x = paddingX + stepX * index;
      // Tạo độ lệch ngẫu nhiên cho Y để trông tự nhiên hơn
      const randomY = Math.sin(index) * 50;
      const y = height / 2 + randomY;

      coords.push({ x, y });

      // 1. Tạo Node HTML
      const isCorrect = h.isCorrect;
      const qData = this.state.questions.find((q) => q.id === h.qId) || {
        q: "Câu hỏi",
        explanation: "...",
      };

      // Cắt ngắn câu hỏi cho tooltip
      const shortQ =
        qData.q.length > 50 ? qData.q.substring(0, 50) + "..." : qData.q;

      nodesHTML += `
            <div class="graph-node ${isCorrect ? "correct" : "wrong"}" 
                 style="left: ${x - 18}px; top: ${y - 18}px;">
                ${index + 1}
                <div class="node-tooltip">
                    <span class="tooltip-title">${
                      isCorrect ? "Chính xác" : "Chưa đúng"
                    }</span>
                    ${shortQ}
                </div>
            </div>
        `;

      // 2. Tạo đường nối (Line) tới node trước đó
      if (index > 0) {
        const prev = coords[index - 1];
        linesHTML += `
                <line x1="${prev.x}" y1="${prev.y}" x2="${x}" y2="${y}" 
                      class="connection-line" />
            `;
      }
    });

    // Inject vào DOM
    svg.innerHTML = linesHTML;
    // Thêm nodes vào sau svg (để đè lên lines)
    container.insertAdjacentHTML("beforeend", nodesHTML);
  }

  setupTheme() {
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) return;
    const isDark = localStorage.getItem("mp_theme") === "dark";
    if (isDark) {
      document.body.classList.add("dark-mode");
      themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    themeBtn.onclick = () => {
      document.body.classList.toggle("dark-mode");
      const isDarkModeNow = document.body.classList.contains("dark-mode");
      if (isDarkModeNow) {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem("mp_theme", "dark");
      } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem("mp_theme", "light");
      }
    };
  }

  toggleSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
      if (sidebar.classList.contains("active")) {
        this.updateSidebarInfo();
      }
    }
  }

  updateSidebarInfo() {
    const rankEl = document.getElementById("sidebar-rank");
    const xpEl = document.getElementById("sidebar-xp");
    if (xpEl) xpEl.innerText = `${this.stats.xp} XP`;
    const currentRankName = document.getElementById("rank-name")?.innerText;
    if (rankEl && currentRankName) rankEl.innerText = currentRankName;
  }

  showToothlessMeme() {
    const overlay = document.getElementById("meme-overlay");
    const audio = document.getElementById("meme-audio");
    if (overlay) {
      overlay.classList.add("active");
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio
          .play()
          .catch((e) => console.log("Trình duyệt chặn tự phát âm thanh"));
      }
    }
  }

  closeToothlessMeme() {
    const overlay = document.getElementById("meme-overlay");
    const audio = document.getElementById("meme-audio");
    if (overlay) {
      overlay.classList.remove("active");
      if (audio) audio.pause();
    }
  }

  confirmStartQuiz(mode) {
    document.getElementById("mode-modal").classList.remove("active");
    this.state.currentCategory = this.tempCategory;
    this.state.currentMode = mode;
    this.state.isMistakeMode = false;

    let questions = [...this.allData[this.tempCategory]];

    if (mode === "recall") {
      const now = Date.now();
      questions = questions.filter((q) => {
        const stat = this.stats.questionStats[q.id];
        if (!stat) return true;
        return stat.nextReview <= now;
      });

      if (questions.length === 0) {
        alert("Bạn đã nhớ hết các câu hỏi của chủ đề này! Hãy quay lại sau.");
        return;
      }
    }
    this.state.questions = questions.sort(() => Math.random() - 0.5);
    this.resetFlow();
    this.applyModeUI(mode);
  }

  // --- FIX LỖI TIMER ---
  applyModeUI(mode) {
    const timerBadge = document.getElementById("timer");
    const appContainer = document.getElementById("app-container");

    if (appContainer) {
      appContainer.classList.remove("focus-mode");
    }

    // CHỈ THỰC HIỆN NẾU TÌM THẤY ELEMENT TIMER
    if (timerBadge) {
      timerBadge.style.display = "block";
      if (mode === "speed") {
        timerBadge.innerText = "5s 🔥";
        timerBadge.style.background = "#e74c3c";
      } else if (mode === "focus") {
        timerBadge.style.display = "none";
      } else {
        timerBadge.innerText = "15s";
        timerBadge.style.background = "#ff9f43";
      }
    }
  }
  // Thêm vào main.js
  playClickSound(type) {
    // Tạo context âm thanh (Web Audio API) hoặc dùng file mp3 ngắn
    // Cách đơn giản nhất:
    const audio = new Audio();
    if (type === "correct") audio.src = "path/to/correct.mp3"; // Tiếng "Ding"
    else if (type === "wrong") audio.src = "path/to/wrong.mp3"; // Tiếng "Buzz"
    else audio.src = "path/to/click.mp3"; // Tiếng "Pop" nhẹ

    audio.volume = 0.5;
    audio.play().catch((e) => {}); // Bỏ qua lỗi nếu trình duyệt chặn
  }

  // Thêm method này vào trong class LearningApp

  setupTheme() {
    const themeBtn = document.getElementById("theme-toggle");
    const body = document.body;
    const icon = themeBtn.querySelector("i");

    // 1. Hàm cập nhật Icon
    const updateIcon = (isDark) => {
      if (isDark) {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
    };

    // 2. Logic kiểm tra ban đầu (Ưu tiên LocalStorage -> System Pref)
    const savedTheme = localStorage.getItem("quiz_theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      body.classList.add("dark-mode");
      updateIcon(true);
    } else {
      updateIcon(false);
    }

    // 3. Sự kiện Click Toggle
    themeBtn.addEventListener("click", () => {
      // Toggle class
      body.classList.toggle("dark-mode");
      const isDark = body.classList.contains("dark-mode");

      // Animation xoay nhẹ icon khi click
      themeBtn.style.transform = "scale(0.8) rotate(180deg)";
      setTimeout(() => {
        themeBtn.style.transform = "";
        updateIcon(isDark);
      }, 200);

      // Lưu vào LocalStorage
      localStorage.setItem("quiz_theme", isDark ? "dark" : "light");

      // (Tùy chọn) Phát âm thanh click nhẹ
      // this.playClickSound('click');
    });
  }

  // Đừng quên gọi this.setupTheme() trong constructor hoặc hàm init() nhé!
}

const app = new LearningApp(quizData);
