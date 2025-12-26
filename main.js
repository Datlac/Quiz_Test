class LearningApp {
  constructor(data) {
    this.allData = data;
    // Lấy stats từ LocalStorage hoặc khởi tạo mới
    this.stats = JSON.parse(localStorage.getItem("mp_stats")) || {
      xp: 0,
      mistakeIds: [],
      streak: 0,
    };

    this.state = {
      currentIdx: 0,
      questions: [],
      history: [], // Lưu kết quả từng câu
      timer: null,
      timeLeft: 15,
      isAnswered: false, // Chống click nhiều lần
    };

    this.ui = {
      themeBtn: document.getElementById("theme-toggle"),
      timerDisplay: document.getElementById("timer"),
      categoryList: document.getElementById("category-list"),
    };

    this.init();
  }

  init() {
    this.renderStats();
    this.setupCategories();
    this.checkMistakes();

    // Dark mode logic
    this.ui.themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const icon = this.ui.themeBtn.querySelector("i");
      icon.classList.toggle("fa-moon");
      icon.classList.toggle("fa-sun");
    });
  }

  setupCategories() {
    // Tự động tạo nút dựa trên dữ liệu
    Object.keys(this.allData).forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "mode-btn";
      btn.innerHTML = `🚀 ${key.toUpperCase()}`;
      btn.onclick = () => this.startQuiz(key);
      this.ui.categoryList.appendChild(btn);
    });
  }

  checkMistakes() {
    if (this.stats.mistakeIds.length > 0) {
      document.getElementById("mistake-btn").style.display = "block";
    }
  }

  startQuiz(category) {
    // Shuffle câu hỏi
    this.state.questions = [...this.allData[category]].sort(
      () => Math.random() - 0.5
    );
    this.resetQuizState();
  }

  startMistakeMode() {
    const allQuestions = Object.values(this.allData).flat();
    this.state.questions = allQuestions.filter((q) =>
      this.stats.mistakeIds.includes(q.id)
    );

    if (this.state.questions.length === 0) {
      alert("Bạn đã khắc phục hết lỗi sai! Tuyệt vời!");
      this.stats.mistakeIds = [];
      localStorage.setItem("mp_stats", JSON.stringify(this.stats));
      location.reload();
      return;
    }
    this.resetQuizState();
  }

  resetQuizState() {
    this.state.currentIdx = 0;
    this.state.history = [];
    this.showScreen("quiz-flow");
    this.loadStep();
  }

  loadStep() {
    const q = this.state.questions[this.state.currentIdx];
    this.state.isAnswered = false;

    // UI Reset
    document.getElementById("question-text").innerText = q.q;
    document.getElementById("micro-hint").innerHTML = "";
    const grid = document.getElementById("options-grid");
    grid.innerHTML = "";

    // Render Options
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option-card";
      btn.innerText = opt;
      btn.onclick = () => this.handleAnswer(i, btn);
      grid.appendChild(btn);
    });

    this.updateProgress();
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.state.timer);
    this.state.timeLeft = 15; // 15 giây mỗi câu
    this.ui.timerDisplay.innerText = this.state.timeLeft;

    this.state.timer = setInterval(() => {
      this.state.timeLeft--;
      this.ui.timerDisplay.innerText = this.state.timeLeft;
      if (this.state.timeLeft <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  handleTimeout() {
    this.handleAnswer(-1, null); // -1 là sai do hết giờ
  }

  playSound(type) {
    const sound = document.getElementById(
      type === "correct" ? "sound-correct" : "sound-wrong"
    );
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.log("Audio require interaction"));
    }
  }

  handleAnswer(idx, btnElement) {
    if (this.state.isAnswered) return;
    this.state.isAnswered = true;
    clearInterval(this.state.timer);

    const q = this.state.questions[this.state.currentIdx];
    const isCorrect = idx === q.a;

    // Lưu lịch sử
    this.state.history.push(isCorrect);
    const cards = document.querySelectorAll(".option-card");
    cards.forEach((c) => (c.style.pointerEvents = "none"));

    if (isCorrect) {
      this.playSound("correct");
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      this.stats.xp += 10;
      if (btnElement) btnElement.classList.add("correct");

      // Xóa khỏi danh sách lỗi nếu làm đúng (Optional)
      this.stats.mistakeIds = this.stats.mistakeIds.filter((id) => id !== q.id);
    } else {
      this.playSound("wrong");
      if (btnElement) btnElement.classList.add("wrong");
      // Highlight câu đúng
      if (cards[q.a]) cards[q.a].classList.add("correct");

      if (!this.stats.mistakeIds.includes(q.id)) {
        this.stats.mistakeIds.push(q.id);
      }
    }

    // Lưu stats
    localStorage.setItem("mp_stats", JSON.stringify(this.stats));
    this.renderStats();

    // Hiển thị giải thích
    document.getElementById("micro-hint").innerHTML = `
            <div class="${isCorrect ? "text-green" : "text-red"}">
                <b>${isCorrect ? "CHÍNH XÁC! 🎉" : "TIẾC QUÁ! 😅"}</b><br>
                ${q.explanation}
            </div>
        `;

    setTimeout(() => {
      this.state.currentIdx++;
      if (this.state.currentIdx < this.state.questions.length) {
        this.loadStep();
      } else {
        this.endQuiz();
      }
    }, 2500); // Đợi 2.5s để đọc giải thích
  }

  updateProgress() {
    const p = (this.state.currentIdx / this.state.questions.length) * 100;
    document.getElementById("progress-glow").style.width = p + "%";
  }

  renderStats() {
    document.getElementById("xp-info").innerText = `✨ ${this.stats.xp} XP`;
    // Có thể thêm logic tính streak ở đây
  }

  showScreen(id) {
    document
      .querySelectorAll("#app-container > div, #app-container > main")
      .forEach((el) => (el.style.display = "none"));
    document.getElementById(id).style.display = "block";
  }

  endQuiz() {
    this.showScreen("review-scene");
    const total = this.state.questions.length;
    const correctCount = this.state.history.filter(Boolean).length;
    const percentage = Math.round((correctCount / total) * 100);

    const reviewScene = document.getElementById("review-scene");
    reviewScene.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <h2>${
                      percentage >= 80 ? "Xuất sắc! 🌟" : "Hoàn thành! 🏁"
                    }</h2>
                    <p>Bạn đã trả lời đúng ${correctCount}/${total} câu</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="label">XP Nhận được</span><br>
                        <span class="value">+${correctCount * 10}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Độ chính xác</span><br>
                        <span class="value">${percentage}%</span>
                    </div>
                </div>

                <div class="action-group">
                    <button class="mode-btn" onclick="location.reload()">🏠 Trang chủ</button>
                    ${
                      this.stats.mistakeIds.length > 0
                        ? `<button class="mode-btn secondary" onclick="app.startMistakeMode()">🧠 Khắc phục ${this.stats.mistakeIds.length} lỗi sai</button>`
                        : ""
                    }
                </div>
            </div>
        `;
  }
}

// Khởi tạo ứng dụng
const app = new LearningApp(quizData);
