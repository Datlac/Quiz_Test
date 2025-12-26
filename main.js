// --- CONFIGURATION ---
const STORAGE_KEY = "mindpath_v1_stats"; // Đổi key mới để clean dữ liệu rác cũ
const RANK_SYSTEM = [
  { name: "Bronze", min: 0, max: 300, color: "#cd7f32" },
  { name: "Silver", min: 300, max: 800, color: "#bdc3c7" },
  { name: "Gold", min: 800, max: 1500, color: "#f1c40f" },
  { name: "Platinum", min: 1500, max: 2500, color: "#00cec9" },
  { name: "Master", min: 2500, max: 4000, color: "#9b59b6" },
  { name: "Grandmaster", min: 4000, max: 6000, color: "#d63031" },
  { name: "Challenger", min: 6000, max: 9000, color: "#e84393" },
  { name: "Apex", min: 9000, max: 99999, color: "#2d3436" },
];

// --- HELPER FUNCTIONS ---
function getRankByXP(xp) {
  return (
    RANK_SYSTEM.find((r) => xp >= r.min && xp < r.max) ||
    RANK_SYSTEM[RANK_SYSTEM.length - 1]
  );
}

function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add("ripple");
  const ripple = button.getElementsByClassName("ripple")[0];
  if (ripple) ripple.remove();
  button.appendChild(circle);
}

// --- MAIN APP CLASS ---
class LearningApp {
  constructor(data) {
    this.allData = data;

    // 1. Safe Storage Loading
    this.stats = this.loadStats();

    // 2. State Initialization
    this.state = {
      currentIdx: 0,
      questions: [],
      history: [],
      isMistakeMode: false,
      currentCategory: null,
    };

    // 3. UI References
    this.ui = {
      screens: {
        landing: document.getElementById("view-landing"),
        dashboard: document.getElementById("view-dashboard"),
        quiz: document.getElementById("view-quiz"),
        result: document.getElementById("view-result"),
      },
      quiz: {
        questionText: document.getElementById("question-text"),
        optionsGrid: document.getElementById("options-grid"),
        feedbackArea: document.getElementById("feedback-area"),
        microHint: document.getElementById("micro-hint"),
        progressGlow: document.getElementById("progress-glow"),
        timer: document.getElementById("timer"),
      },
    };

    this.init();
    this.setupTheme();
  }

  // --- CORE: STORAGE ---
  loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Storage corrupted, resetting...", e);
    }
    // Default Data
    return {
      xp: 0,
      streak: 0,
      lastLogin: null,
      questionStats: {}, // { id: { wrong: 0, correct: 0, nextReview: timestamp } }
      mistakeIds: [],
    };
  }

  saveStats() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.error("Save failed", e);
    }
    // 2. --- MỚI: Lưu Cloud nếu đã đăng nhập ---
    if (this.userProfile && window.authServices) {
      // Gọi hàm saveProgress chúng ta vừa viết ở index.html
      window.authServices.saveProgress(this.userProfile.uid, this.stats);
    }
  }

  resetProgress() {
    if (
      confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ tiến độ không? Hành động này không thể hoàn tác."
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  }

  // --- CORE: NAVIGATION ---
  init() {
    // Check login logic (Giả lập)
    if (this.stats.lastLogin) {
      this.navigate("dashboard");
    } else {
      this.navigate("landing");
    }
    this.attachGlobalEvents();
    // THÊM: Kết nối với Firebase Auth (nếu script đã load)
    setTimeout(() => {
      if (window.authServices) {
        window.authServices.monitorAuth(async (user) => {
          if (user) {
            this.userProfile = {
              name: user.displayName,
              photo: user.photoURL,
              uid: user.uid,
            };
            // Tải dữ liệu cloud
            const cloudData = await window.authServices.loadProgress(user.uid);
            if (cloudData) {
              this.stats = { ...this.stats, ...cloudData };
              this.saveStats();
            }
            this.renderDashboard();
            this.updateSidebarInfo();
          } else {
            this.userProfile = null;
            this.renderDashboard();
          }
        });
      }
    }, 1000); // Chờ 1 giây
  }

  attachGlobalEvents() {
    // Gắn ripple effect cho các nút tĩnh
    document.querySelectorAll(".hero-btn, .nav-btn").forEach((btn) => {
      btn.addEventListener("click", createRipple);
    });
  }

  navigate(screenName) {
    Object.values(this.ui.screens).forEach((el) => {
      if (el) el.style.display = "none";
    });
    if (this.ui.screens[screenName]) {
      this.ui.screens[screenName].style.display = "block";
    }

    // Toggle Dashboard Btn
    const dashBtn = document.getElementById("dashboard-btn");
    if (dashBtn)
      dashBtn.style.display = screenName === "landing" ? "none" : "block";

    if (screenName === "dashboard") this.renderDashboard();
  }

  enterApp() {
    this.stats.lastLogin = new Date().toISOString();
    this.saveStats();
    this.navigate("dashboard");
  }

  toggleSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && overlay) {
      const isActive = sidebar.classList.contains("active");
      if (isActive) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      } else {
        sidebar.classList.add("active");
        overlay.classList.add("active");
        this.updateSidebarInfo();
      }
    }
  }

  updateSidebarInfo() {
    const rankEl = document.getElementById("sidebar-rank");
    const xpEl = document.getElementById("sidebar-xp");
    const currentRank = getRankByXP(this.stats.xp);

    if (xpEl) xpEl.innerText = `${this.stats.xp} XP`;
    if (rankEl) {
      rankEl.innerText = currentRank.name;
      rankEl.style.color = currentRank.color;
    }
  }

  // --- FEATURE: DASHBOARD ---
  // --- FEATURE: DASHBOARD ---
  renderDashboard() {
    const headerEl = document.getElementById("dashboard-header");
    const pathContainer = document.getElementById("path-container");
    const mistakeBanner = document.getElementById("mistake-alert");

    const hour = new Date().getHours();
    const greeting =
      hour < 12
        ? "Chào buổi sáng"
        : hour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";
    const rank = getRankByXP(this.stats.xp);

    // 1. Header & Login Logic
    // Kiểm tra xem có profile chưa
    const isLoggedIn = !!this.userProfile;

    // Avatar: Nếu có ảnh thì hiện ảnh, không thì hiện icon phi hành gia
    const userAvatar = isLoggedIn
      ? `<img src="${this.userProfile.photo}" style="width:100%; height:100%; border-radius:50%">`
      : `<i class="fas fa-user-astronaut"></i>`;

    const userName = isLoggedIn ? this.userProfile.name : "Khách";

    // Hành động khi bấm vào badge: Login (nếu chưa) hoặc Sidebar (nếu rồi)
    const loginAction = isLoggedIn
      ? "app.toggleSidebar()"
      : "window.authServices.login()";

    if (headerEl) {
      headerEl.innerHTML = `
            <div class="welcome-header">
                <div>
                    <h1>${greeting},<br/>${userName}!</h1>
                    <p class="subtitle">Sẵn sàng bứt phá hôm nay?</p>
                </div>
                <div class="user-badge" onclick="${loginAction}">
                    <div class="avatar">${userAvatar}</div>
                    <div style="display:flex; flex-direction:column; line-height:1.2">
                        <span style="font-weight:700; font-size:0.9rem; color:${
                          rank.color
                        }">${rank.name}</span>
                        <span style="font-size:0.75rem; opacity:0.7">${
                          this.stats.xp
                        } XP</span>
                    </div>
                </div>
            </div>
            
            ${
              !isLoggedIn
                ? `<button class="hero-btn" onclick="window.authServices.login()" style="margin-bottom:20px; background:#4285F4">
                    <i class="fab fa-google"></i> Đăng nhập với Google để lưu tiến độ
                 </button>`
                : ""
            }
        `;
    }

    // 2. Mistake Banner (Giữ nguyên)
    const allStats = Object.entries(this.stats.questionStats || {});
    const weakQuestions = allStats.filter(([id, s]) => s.wrong > 0);

    if (mistakeBanner) {
      if (weakQuestions.length > 0) {
        mistakeBanner.className = "mistake-hero";
        mistakeBanner.style.display = "flex";
        mistakeBanner.innerHTML = `
                <div class="mistake-content">
                    <div class="mistake-icon-box"><i class="fas fa-tools"></i></div>
                    <div>
                        <h4>Cần bảo trì!</h4>
                        <p>Bạn đang hổng <strong style="color: #e17055">${weakQuestions.length} câu</strong>.</p>
                    </div>
                </div>
                <button class="review-btn" onclick="app.startMistakeMode()">Sửa lỗi <i class="fas fa-arrow-right"></i></button>
            `;
      } else {
        mistakeBanner.style.display = "none";
      }
    }

    // 3. Grid (Giữ nguyên)
    if (pathContainer) {
      pathContainer.innerHTML = "";
      Object.keys(this.allData).forEach((key) => {
        const count = this.allData[key].length;
        let icon = "fa-book";
        if (key.toLowerCase().includes("hci")) icon = "fa-laptop-code";
        else if (key.toLowerCase().includes("english")) icon = "fa-language";

        const card = document.createElement("div");
        card.className = "course-card";
        card.onclick = (e) => {
          createRipple(e);
          this.startQuiz(key);
        };

        card.innerHTML = `
                <div class="card-icon"><i class="fas ${icon}"></i></div>
                <div style="margin-top:auto">
                    <h3 style="font-size:1.3rem; margin-bottom:5px">${key.toUpperCase()}</h3>
                    <div class="card-meta">
                        <span><i class="fas fa-layer-group"></i> ${count} Câu</span>
                    </div>
                </div>
            `;
        pathContainer.appendChild(card);
      });
    }
  }

  // --- FEATURE: QUIZ FLOW ---
  startQuiz(category) {
    this.tempCategory = category;
    document.getElementById("mode-modal").classList.add("active");
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
        return !stat || stat.nextReview <= now;
      });
      if (questions.length === 0) {
        alert("Bạn đã nhớ hết chủ đề này! Hãy quay lại sau.");
        return;
      }
    }

    this.state.questions = questions.sort(() => Math.random() - 0.5);
    this.resetFlow();

    // UI Setup
    const timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.style.display = mode === "focus" ? "none" : "block";
      timerEl.innerText = mode === "speed" ? "5s 🔥" : "15s";
    }
  }

  startMistakeMode() {
    this.state.isMistakeMode = true;
    const allQ = Object.values(this.allData).flat();
    this.state.questions = allQ.filter(
      (q) =>
        this.stats.questionStats[q.id] &&
        this.stats.questionStats[q.id].wrong > 0
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

    // Reset UI
    if (this.ui.quiz.feedbackArea)
      this.ui.quiz.feedbackArea.style.display = "none";
    if (this.ui.quiz.questionText) this.ui.quiz.questionText.innerText = q.q;

    // Update Progress Bar
    const percent = (this.state.currentIdx / this.state.questions.length) * 100;
    if (this.ui.quiz.progressGlow)
      this.ui.quiz.progressGlow.style.width = `${percent}%`;

    // Render Options
    if (this.ui.quiz.optionsGrid) {
      this.ui.quiz.optionsGrid.innerHTML = "";
      this.ui.quiz.optionsGrid.style.pointerEvents = "auto";

      q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option-card";
        btn.innerHTML = `<span>${opt}</span><i class="fas status-icon"></i>`;
        btn.onclick = (e) => {
          createRipple(e);
          this.handleAnswer(i, btn);
        };
        this.ui.quiz.optionsGrid.appendChild(btn);
      });
    }
  }

  handleAnswer(idx, btnElement) {
    const q = this.state.questions[this.state.currentIdx];
    const isCorrect = idx === q.a;

    // Lock UI
    this.ui.quiz.optionsGrid.style.pointerEvents = "none";

    // Update Visuals
    btnElement.classList.add(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
      // Show correct answer
      this.ui.quiz.optionsGrid.children[q.a].classList.add("correct");
    }

    // Update Stats
    this.updateStats(q.id, isCorrect);
    this.state.history.push({ qId: q.id, isCorrect });

    // Show Feedback
    if (this.ui.quiz.feedbackArea) {
      this.ui.quiz.feedbackArea.style.display = "block";
      this.ui.quiz.microHint.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <div style="font-size:1.5rem">${isCorrect ? "🎉" : "💡"}</div>
                <div>
                    <strong>${
                      isCorrect ? "Chính xác!" : "Đáp án đúng:"
                    }</strong>
                    <div style="font-size:0.9rem; opacity:0.8">${
                      q.explanation || ""
                    }</div>
                </div>
            </div>
        `;
      this.ui.quiz.feedbackArea.scrollIntoView({ behavior: "smooth" });
    }
  }

  updateStats(qId, isCorrect) {
    if (!this.stats.questionStats[qId]) {
      this.stats.questionStats[qId] = {
        wrong: 0,
        correct: 0,
        nextReview: 0,
        interval: 0,
      };
    }
    const s = this.stats.questionStats[qId];
    const ONE_DAY = 86400000;

    if (isCorrect) {
      s.correct++;
      this.stats.xp += 10;

      // Simple SRS Logic
      if (s.interval === 0) s.interval = 1;
      else s.interval = Math.round(s.interval * 1.5);
      s.nextReview = Date.now() + s.interval * ONE_DAY;
    } else {
      s.wrong++;
      s.interval = 0;
      s.nextReview = Date.now();
    }
    this.saveStats();
  }

  nextStep() {
    this.state.currentIdx++;
    if (this.state.currentIdx < this.state.questions.length) {
      this.loadStep();
    } else {
      this.endQuiz();
    }
  }

  endQuiz() {
    // Tính toán kết quả
    const correct = this.state.history.filter((h) => h.isCorrect).length;
    const total = this.state.questions.length;
    const percent = Math.round((correct / total) * 100);

    const resultDiv = document.getElementById("result-content");
    if (resultDiv) {
      resultDiv.innerHTML = `
            <div class="result-header">
                <div class="score-circle" style="--p:${percent}%">
                    <div class="score-inner">${percent}%</div>
                </div>
                <h2>${percent >= 80 ? "Xuất sắc! 🌟" : "Hoàn thành! 👍"}</h2>
                <p>Bạn đã trả lời đúng ${correct}/${total} câu.</p>
            </div>
            
            <div class="knowledge-graph-wrapper" id="knowledge-graph">
                 <svg class="graph-svg" id="graph-lines" width="100%" height="100%"></svg>
            </div>

            <button class="hero-btn" onclick="app.navigate('dashboard')">Về Dashboard</button>
          `;
      setTimeout(() => this.renderGalaxyGraph(), 50);
    }
    this.navigate("result");

    if (percent >= 80 && typeof confetti === "function") {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }

  // Vẽ Graph đơn giản
  renderGalaxyGraph() {
    const svg = document.getElementById("graph-lines");
    const container = document.getElementById("knowledge-graph");
    if (!svg || !container) return;

    const history = this.state.history;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const step = width / (history.length + 1);

    let htmlNodes = "";
    let pathD = `M ${step} ${height / 2}`;

    history.forEach((h, i) => {
      const x = step * (i + 1);
      const y = height / 2 + Math.sin(i) * 30 * (h.isCorrect ? -1 : 1);

      htmlNodes += `<div class="graph-node ${
        h.isCorrect ? "correct" : "wrong"
      }" style="left:${x - 16}px; top:${y - 16}px">${i + 1}</div>`;
      if (i > 0) pathD += ` L ${x} ${y}`;
    });

    svg.innerHTML = `<path d="${pathD}" stroke="rgba(0,0,0,0.2)" stroke-width="2" fill="none" />`;
    container.insertAdjacentHTML("beforeend", htmlNodes);
  }

  // --- THEME ---
  setupTheme() {
    const btn = document.getElementById("theme-toggle");
    const icon = btn.querySelector("i");

    // Load saved
    if (localStorage.getItem("mp_theme") === "dark") {
      document.body.classList.add("dark-mode");
      icon.className = "fas fa-sun";
    }

    btn.onclick = () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
      localStorage.setItem("mp_theme", isDark ? "dark" : "light");
    };
  }

  // Meme features
  showToothlessMeme() {
    document.getElementById("meme-overlay").classList.add("active");
  }
  closeToothlessMeme() {
    document.getElementById("meme-overlay").classList.remove("active");
  }

  // --- FEATURE: LEADERBOARD ---
  async showLeaderboard() {
    const modal = document.getElementById("leaderboard-modal");
    const listEl = document.getElementById("leaderboard-list");

    // 1. Mở modal và hiện loading
    modal.classList.add("active");
    listEl.innerHTML =
      '<div style="text-align:center; padding:20px"><i class="fas fa-spinner fa-spin"></i> Đang tải cao thủ...</div>';

    // 2. Lấy dữ liệu
    if (!window.authServices) {
      listEl.innerHTML =
        '<p style="text-align:center">Vui lòng đăng nhập để xem BXH.</p>';
      return;
    }
    const data = await window.authServices.getLeaderboard();

    // 3. Render HTML
    if (data.length === 0) {
      listEl.innerHTML =
        '<p style="text-align:center">Chưa có dữ liệu đua top.</p>';
    } else {
      listEl.innerHTML = data
        .map((u, index) => {
          let rankClass = "rank-normal";
          let icon = `<span class="rank-num">${index + 1}</span>`;

          if (index === 0) {
            rankClass = "rank-1";
            icon = "🥇";
          }
          if (index === 1) {
            rankClass = "rank-2";
            icon = "🥈";
          }
          if (index === 2) {
            rankClass = "rank-3";
            icon = "🥉";
          }

          // Fallback nếu không có avatar
          const avatarImg = u.photo
            ? `<img src="${u.photo}" class="lb-avatar">`
            : `<div class="lb-avatar-placeholder"><i class="fas fa-user"></i></div>`;

          return `
                <div class="lb-item ${rankClass}">
                    <div class="lb-left">
                        <div class="lb-rank">${icon}</div>
                        ${avatarImg}
                        <div class="lb-info">
                            <span class="lb-name">${u.name}</span>
                            <span class="lb-streak">🔥 ${u.streak} ngày</span>
                        </div>
                    </div>
                    <div class="lb-xp">${u.xp} XP</div>
                </div>
            `;
        })
        .join("");
    }
  }
}

window.app = new LearningApp(quizData);
