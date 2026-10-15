/**
 * QUIZSPHERE 3D — MAIN QUIZ CONTROLLER
 * Loads questions from 'questions.txt' (with seamless offline fallback),
 * supports Multiple Choice and Open-Ended Paragraph responses,
 * Web Audio API synthesized sound effects, 3D card tilt, particle confetti,
 * and comprehensive answer review & export.
 */

// ==========================================
// 1. FALLBACK EMBEDDED QUESTIONS DATASET
// (Pre-parsed from questions.txt for 100% offline file:// compatibility)
// ==========================================
const FALLBACK_QUESTIONS = [
  {
    number: "1",
    section: "Personal Trivia",
    question: "At which state i born?",
    type: "mcq",
    options: ["Delhi", "Bihar", "Jaipur", "Noida"],
    correctIndex: 0
  },
  {
    number: "2",
    section: "Personal Trivia",
    question: "My favorite sports?",
    type: "mcq",
    options: ["Badminton", "Cricket", "Basketball", "Kabdi"],
    correctIndex: 0
  },
  {
    number: "3",
    section: "Personal Trivia",
    question: "My last crush?",
    type: "mcq",
    options: ["Soumya", "Upasana", "Hiranya", "Kashvi"],
    correctIndex: 0
  },
  {
    number: "4",
    section: "Personal Trivia",
    question: "What's my favorite hobby?",
    type: "mcq",
    options: ["Playing sports", "Programming", "Singing", "Gaming"],
    correctIndex: 1
  },
  {
    number: "5",
    section: "Personal Trivia",
    question: "My first and last love?",
    type: "mcq",
    options: ["My parents!!", "You!!", "My last crush", "Myself only!!"],
    correctIndex: 1
  },
  {
    number: "6",
    section: "Personal Trivia",
    question: "Which language do I prefer for chatting with ChatGPT?",
    type: "mcq",
    options: ["English", "Hinglish", "Hindi", "Bhojpuri"],
    correctIndex: 1
  },
  {
    number: "7",
    section: "Personal Trivia",
    question: "What I will do with you if you stand in front of me?",
    type: "mcq",
    options: ["Ignore you", "Hug + Kiss you", "Blush in front of you", "React normal"],
    correctIndex: 1
  },
  {
    number: "8",
    section: "Personal Trivia",
    question: "Which habit of you I love most?",
    type: "mcq",
    options: ["When you make cringy faces", "When you show your love", "When you teasing me", "When you teaching me"],
    correctIndex: 1
  },
  {
    number: "9",
    section: "Personal Trivia",
    question: "Which game do I like most in lockdown?",
    type: "mcq",
    options: ["GTA 5", "Minecraft", "Roblox", "BGMI"],
    correctIndex: 1
  },
  {
    number: "10",
    section: "Personal Trivia",
    question: "What's my full real name?",
    type: "mcq",
    options: ["Aashu Patel", "Aashirwad Patel", "Aashu Singh", "Aashirwad Singh"],
    correctIndex: 3
  },
  {
    number: "11",
    section: "Personal Trivia",
    question: "My favourite word which I use in front of you?",
    type: "mcq",
    options: ["Bauni", "Baby", "Jaanu", "Mera bacha"],
    correctIndex: 1
  },
  {
    number: "12",
    section: "Personal Trivia",
    question: "What make me feel closest to you?",
    type: "mcq",
    options: ["Dark talks", "Physical touch", "Personal talks", "All of these"],
    correctIndex: 3
  },
  {
    number: "13",
    section: "Personal Trivia",
    question: "What's my dream car?",
    type: "mcq",
    options: ["BMW M3", "Lamborghini Sian", "Nissan GTR", "Bugatti Chiron"],
    correctIndex: 0
  },
  {
    number: "14",
    section: "Personal Trivia",
    question: "Which song do I always skip to in the car?",
    type: "mcq",
    options: ["Soft songs", "Sad songs", "90's songs", "Gangster songs"],
    correctIndex: 1
  },
  {
    number: "15",
    section: "Personal Trivia",
    question: "My reaction when we meet first time?",
    type: "mcq",
    options: ["Socked", "Shy", "Blush", "Friendly with you"],
    correctIndex: -1
  },
  {
    number: "16",
    section: "Sexual questions (General Questions)",
    question: "Which part of my body do you like most?",
    type: "mcq",
    options: ["Dick", "Lips", "Nose", "Testis"],
    correctIndex: -1
  },
  {
    number: "17",
    section: "Sexual questions (General Questions)",
    question: "Which part of your body do I like most?",
    type: "mcq",
    options: ["Boobs", "Lips", "Tango ke bich wala area", "Your full body"],
    correctIndex: 3
  },
  {
    number: "18",
    section: "Sexual questions (General Questions)",
    question: "What is the best sexual experience or most intimate touch you’ve ever did with anyone?",
    type: "paragraph",
    options: [],
    correctIndex: -1
  },
  {
    number: "19",
    section: "Sexual questions (General Questions)",
    question: "Which memory of ours is your favourite and one of the best moments of your life?",
    type: "paragraph",
    options: [],
    correctIndex: -1
  },
  {
    number: "20",
    section: "Sexual questions (General Questions)",
    question: "Do you really like romantic or sexual talks with me?",
    type: "mcq",
    options: ["Yes", "No", "Sometimes"],
    correctIndex: -1
  },
  {
    number: "21",
    section: "Sexual questions (General Questions)",
    question: "Why you choose me as your life partner? Write a paragraph on this.",
    type: "paragraph",
    options: [],
    correctIndex: -1
  },
  {
    number: "22",
    section: "Sexual questions (General Questions)",
    question: "What habit do you like most about me?",
    type: "paragraph",
    options: [],
    correctIndex: -1
  },
  {
    number: "23",
    section: "Sexual questions (General Questions)",
    question: "What do you think at night about me?",
    type: "paragraph",
    options: [],
    correctIndex: -1
  },
  {
    number: "24",
    section: "Sexual questions (General Questions)",
    question: "Best dream you have ever seen about me?",
    type: "paragraph",
    options: [],
    correctIndex: -1
  },
  {
    number: "25",
    section: "Sexual questions (General Questions)",
    question: "Why you so, safe with me? Why you don't think i am not a safe place for you?",
    type: "paragraph",
    options: [],
    correctIndex: -1
  }
];

// ==========================================
// 2. WEB AUDIO API SYNTHESIZER
// ==========================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playClick() {
    this.playTone(480, 'triangle', 0.08, 0.06);
  }

  playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.22, 0.12);
      }, idx * 75);
    });
  }

  playWrong() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  playSave() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(587.33, 'sine', 0.15, 0.1);
    setTimeout(() => this.playTone(880, 'sine', 0.25, 0.12), 90);
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const fanfare = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.18 },
      { f: 1046.50, d: 0.45 }
    ];
    let offset = 0;
    fanfare.forEach(({ f, d }) => {
      setTimeout(() => {
        this.playTone(f, 'triangle', d, 0.14);
      }, offset);
      offset += 160;
    });
  }
}

// ==========================================
// 3. CANVAS CONFETTI CANNON
// ==========================================
class ConfettiCannon {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.colors = ['#f43f5e', '#ef4444', '#38bdf8', '#fbbf24', '#ffffff', '#10b981'];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(durationMs = 3500) {
    if (!this.canvas) return;
    this.resize();
    this.particles = [];
    const count = 130;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2 + 60,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.7) * 24,
        size: Math.random() * 9 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    const startTime = Date.now();
    cancelAnimationFrame(this.animId);

    const step = () => {
      const elapsed = Date.now() - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - (elapsed / durationMs));

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (elapsed < durationMs) {
        this.animId = requestAnimationFrame(step);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    this.animId = requestAnimationFrame(step);
  }
}

// ==========================================
// 4. MAIN QUIZ ENGINE
// ==========================================
class QuizArena {
  constructor() {
    this.sound = new SoundSynth();
    this.confetti = new ConfettiCannon('confetti-canvas');

    // Player Identification
    this.playerName = this.resolvePlayerName();

    // Questions State
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.userAnswers = []; // Records all 25 responses

    // Cache DOM
    this.dom = {
      // Screens
      quizScreen: document.getElementById('quiz-screen'),
      resultsScreen: document.getElementById('results-screen'),

      // Header
      headerPlayerName: document.getElementById('header-player-name'),
      soundToggleBtn: document.getElementById('sound-toggle-btn'),
      soundIcon: document.getElementById('sound-icon'),

      // HUD
      progressFill: document.getElementById('progress-fill'),
      questionTracker: document.getElementById('question-tracker'),
      sectionPillDisplay: document.getElementById('section-pill-display'),
      hudScore: document.getElementById('hud-score'),
      hudStreak: document.getElementById('hud-streak'),
      streakFire: document.getElementById('streak-fire'),
      typeIcon: document.getElementById('type-icon'),
      typeLabel: document.getElementById('type-label'),

      // Question Card
      questionCard: document.getElementById('question-card'),
      qCategoryBadge: document.getElementById('q-category-badge'),
      qNumberBadge: document.getElementById('q-number-badge'),
      questionText: document.getElementById('question-text'),
      answersContainer: document.getElementById('answers-container'),
      paragraphContainer: document.getElementById('paragraph-container'),
      paragraphInput: document.getElementById('paragraph-input'),
      charCount: document.getElementById('char-count'),
      saveParagraphBtn: document.getElementById('save-paragraph-btn'),

      // Feedback & Controls
      feedbackBanner: document.getElementById('feedback-banner'),
      feedbackIcon: document.getElementById('feedback-icon'),
      feedbackTitle: document.getElementById('feedback-title'),
      feedbackExplanation: document.getElementById('feedback-explanation'),
      skipQuestionBtn: document.getElementById('skip-question-btn'),
      nextQuestionBtn: document.getElementById('next-question-btn'),
      nextBtnText: document.getElementById('next-btn-text'),

      // Results Screen
      summaryPlayerName: document.getElementById('summary-player-name'),
      resultTitle: document.getElementById('result-title'),
      resultSubtitle: document.getElementById('result-subtitle'),
      trophyIcon: document.getElementById('trophy-icon'),
      rankTitle: document.getElementById('rank-title'),
      metricScore: document.getElementById('metric-score'),
      metricAccuracy: document.getElementById('metric-accuracy'),
      metricParagraphs: document.getElementById('metric-paragraphs'),
      metricStreak: document.getElementById('metric-streak'),
      copySummaryBtn: document.getElementById('copy-summary-btn'),
      downloadSummaryBtn: document.getElementById('download-summary-btn'),
      reviewList: document.getElementById('review-list'),

      // Toast
      toastNotification: document.getElementById('toast-notification'),
      toastMsg: document.getElementById('toast-msg')
    };

    this.init();
  }

  resolvePlayerName() {
    const params = new URLSearchParams(window.location.search);
    const urlName = params.get('name');
    if (urlName && urlName.trim()) {
      localStorage.setItem('quiz_player_name', urlName.trim());
      return urlName.trim();
    }
    const saved = localStorage.getItem('quiz_player_name');
    if (saved && saved.trim()) {
      return saved.trim();
    }
    // If no name found, redirect back to index
    window.location.href = 'index.html';
    return "Challenger";
  }

  async init() {
    this.dom.headerPlayerName.textContent = this.playerName;
    this.bindEvents();
    this.init3DTilt();
    await this.loadQuestions();
    this.startQuiz();
  }

  // --- QUESTIONS PARSER & LOADER ---
  async loadQuestions() {
    try {
      const response = await fetch('questions.txt');
      if (!response.ok) throw new Error("Fetch failed");
      const text = await response.text();
      const parsed = this.parseQuestionsTxt(text);
      if (parsed && parsed.length > 0) {
        this.questions = parsed;
        return;
      }
    } catch (e) {
      console.info("Using embedded pre-parsed dataset from questions.txt for offline reliability.");
    }
    this.questions = [...FALLBACK_QUESTIONS];
  }

  parseQuestionsTxt(text) {
    const lines = text.split(/\r?\n/);
    let section = 'Personal Trivia';
    const result = [];
    let currentQ = null;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('---')) {
        section = line.replace(/-/g, '').trim();
        continue;
      }

      const qMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (qMatch) {
        if (currentQ) result.push(currentQ);
        currentQ = {
          number: qMatch[1],
          question: qMatch[2],
          section: section,
          type: 'mcq',
          options: [],
          correctIndex: -1
        };
        continue;
      }

      if (currentQ && line.toLowerCase().includes('(answer in paragraph)')) {
        currentQ.type = 'paragraph';
        continue;
      }

      if (currentQ && line.startsWith('-')) {
        const optText = line.replace(/^-\s*/, '');
        const isCorrect = optText.toLowerCase().includes('(answer)');
        const cleanText = optText.replace(/\s*\(Answer\)\s*/i, '').trim();
        currentQ.options.push(cleanText);
        if (isCorrect) currentQ.correctIndex = currentQ.options.length - 1;
      }
    }

    if (currentQ) result.push(currentQ);
    return result;
  }

  // --- 3D TACTILE PERSPECTIVE TILT ---
  init3DTilt() {
    const card = document.querySelector('.tilt-element');
    if (card && window.matchMedia('(pointer: fine)').matches) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    }
  }

  // --- EVENT ATTACHMENTS ---
  bindEvents() {
    // Sound Toggle
    this.dom.soundToggleBtn.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
      this.showToast(isMuted ? 'Sound Muted' : 'Sound Enabled');
    });

    // Paragraph Character Count
    this.dom.paragraphInput.addEventListener('input', (e) => {
      this.dom.charCount.textContent = e.target.value.length;
    });

    // Save Paragraph Button
    this.dom.saveParagraphBtn.addEventListener('click', () => {
      this.handleParagraphSubmit();
    });

    // Next Question Button
    this.dom.nextQuestionBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.goToNextQuestion();
    });

    // Skip Question Button
    this.dom.skipQuestionBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.handleSkipQuestion();
    });

    // Copy Summary Button
    this.dom.copySummaryBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.copyAllResponses();
    });

    // Download Summary Button
    this.dom.downloadSummaryBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.downloadResponsesTxt();
    });
  }

  // --- START QUIZ SESSION ---
  startQuiz() {
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.userAnswers = [];
    this.updateHUD();
    this.loadQuestion(this.currentIndex);
  }

  // --- LOAD INDIVIDUAL QUESTION ---
  loadQuestion(index) {
    if (index >= this.questions.length) {
      this.finishQuiz();
      return;
    }

    const q = this.questions[index];
    this.isAnsweringAllowed = true;

    // Reset UI components
    this.dom.feedbackBanner.classList.add('hidden');
    this.dom.feedbackBanner.classList.remove('correct', 'wrong');
    this.dom.nextQuestionBtn.classList.add('hidden');
    this.dom.questionCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';

    // Update Progress
    const totalQ = this.questions.length;
    this.dom.questionTracker.textContent = `Question ${index + 1}/${totalQ}`;
    const progressPct = ((index + 1) / totalQ) * 100;
    this.dom.progressFill.style.width = `${progressPct}%`;

    // Update Section & Question Details
    const isSection2 = q.section.toLowerCase().includes('sexual') || q.section.toLowerCase().includes('intimate');
    this.dom.sectionPillDisplay.textContent = isSection2 
      ? "🔥 Part 2: Deep, Intimate & Romantic Thoughts" 
      : "💖 Part 1: How Well Do You Know Me?";
    this.dom.sectionPillDisplay.className = `hud-pill ${isSection2 ? 'pill-pink' : 'pill-blue'}`;

    this.dom.qCategoryBadge.textContent = isSection2 ? "Intimate Thoughts" : "Personal Lore";
    this.dom.qNumberBadge.textContent = `Q #${index + 1}`;
    this.dom.questionText.textContent = q.question;

    // Handle Formats: MCQ vs Paragraph
    if (q.type === 'paragraph') {
      // Open-ended paragraph format
      this.dom.answersContainer.classList.add('hidden');
      this.dom.paragraphContainer.classList.remove('hidden');
      this.dom.typeIcon.textContent = "✍️";
      this.dom.typeLabel.textContent = "Paragraph";
      this.dom.paragraphInput.value = '';
      this.dom.charCount.textContent = "0";
      setTimeout(() => this.dom.paragraphInput.focus(), 150);
    } else {
      // Multiple Choice MCQ format
      this.dom.paragraphContainer.classList.add('hidden');
      this.dom.answersContainer.classList.remove('hidden');
      this.dom.typeIcon.textContent = "⚡";
      this.dom.typeLabel.textContent = "Multiple Choice";
      this.renderMCQOptions(q);
    }
  }

  // --- RENDER 3D MCQ OPTIONS ---
  renderMCQOptions(q) {
    this.dom.answersContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    q.options.forEach((optText, optIdx) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'option-btn btn-3d';
      optBtn.setAttribute('data-index', optIdx);

      optBtn.innerHTML = `
        <div class="btn-face">
          <span class="option-letter-badge">${letters[optIdx] || (optIdx + 1)}</span>
          <span class="option-text">${this.escapeHTML(optText)}</span>
        </div>
        <div class="btn-depth"></div>
      `;

      optBtn.addEventListener('click', () => {
        if (this.isAnsweringAllowed) {
          this.handleMCQSelection(optIdx, optBtn, q);
        }
      });

      this.dom.answersContainer.appendChild(optBtn);
    });
  }

  // --- HANDLE MCQ SELECTION ---
  handleMCQSelection(selectedIdx, clickedBtn, q) {
    if (!this.isAnsweringAllowed) return;
    this.isAnsweringAllowed = false;

    const buttons = this.dom.answersContainer.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.add('disabled'));

    const hasSpecificAnswer = (q.correctIndex >= 0);

    if (hasSpecificAnswer) {
      const isCorrect = (selectedIdx === q.correctIndex);

      if (isCorrect) {
        this.sound.playCorrect();
        clickedBtn.classList.add('correct');
        this.streak++;
        if (this.streak > this.maxStreak) this.maxStreak = this.streak;
        const earned = 100 + (this.streak - 1) * 20;
        this.score += earned;

        this.dom.feedbackIcon.textContent = "🎉";
        this.dom.feedbackTitle.textContent = this.streak >= 3 ? `Incredible! ${this.streak}x Streak!` : "Spot On! You know me so well!";
        this.dom.feedbackExplanation.textContent = `Correct answer: "${q.options[q.correctIndex]}"`;
        this.dom.feedbackBanner.className = "feedback-banner correct";
      } else {
        this.sound.playWrong();
        clickedBtn.classList.add('wrong');
        buttons[q.correctIndex].classList.add('correct');
        this.streak = 0;

        this.dom.feedbackIcon.textContent = "❌";
        this.dom.feedbackTitle.textContent = "Aww, not quite!";
        this.dom.feedbackExplanation.textContent = `The right answer was: "${q.options[q.correctIndex]}"`;
        this.dom.feedbackBanner.className = "feedback-banner wrong";
      }

      this.userAnswers.push({
        number: q.number,
        question: q.question,
        section: q.section,
        type: 'mcq',
        userResponse: q.options[selectedIdx],
        correctAnswer: q.options[q.correctIndex],
        isCorrect: isCorrect
      });
    } else {
      // Opinion / subjective preference without a single strict answer
      this.sound.playSave();
      clickedBtn.classList.add('correct');
      this.score += 100; // Reward for heartfelt answer

      this.dom.feedbackIcon.textContent = "💖";
      this.dom.feedbackTitle.textContent = "Your choice has been recorded!";
      this.dom.feedbackExplanation.textContent = `You selected: "${q.options[selectedIdx]}"`;
      this.dom.feedbackBanner.className = "feedback-banner correct";

      this.userAnswers.push({
        number: q.number,
        question: q.question,
        section: q.section,
        type: 'mcq_opinion',
        userResponse: q.options[selectedIdx],
        correctAnswer: null,
        isCorrect: true
      });
    }

    this.updateHUD();
    this.dom.feedbackBanner.classList.remove('hidden');
    this.showNextButton();
  }

  // --- HANDLE PARAGRAPH SUBMISSION ---
  handleParagraphSubmit() {
    const text = this.dom.paragraphInput.value.trim();
    if (!text) {
      this.showToast("Please write a few words from your heart before continuing! 💕");
      this.dom.paragraphInput.focus();
      return;
    }

    const q = this.questions[this.currentIndex];
    this.sound.playSave();
    this.score += 150; // Special reward for deep paragraph thoughts

    this.userAnswers.push({
      number: q.number,
      question: q.question,
      section: q.section,
      type: 'paragraph',
      userResponse: text,
      correctAnswer: null,
      isCorrect: true
    });

    this.updateHUD();
    this.showToast("Answer saved with love! 💖");
    this.goToNextQuestion();
  }

  // --- HANDLE SKIP QUESTION ---
  handleSkipQuestion() {
    const q = this.questions[this.currentIndex];
    this.userAnswers.push({
      number: q.number,
      question: q.question,
      section: q.section,
      type: q.type,
      userResponse: "(Skipped)",
      correctAnswer: q.correctIndex >= 0 ? q.options[q.correctIndex] : null,
      isCorrect: false
    });

    this.goToNextQuestion();
  }

  showNextButton() {
    const isLast = (this.currentIndex === this.questions.length - 1);
    this.dom.nextBtnText.textContent = isLast ? "View Complete Results" : "Next Question";
    this.dom.nextQuestionBtn.classList.remove('hidden');
  }

  goToNextQuestion() {
    this.currentIndex++;
    if (this.currentIndex < this.questions.length) {
      this.loadQuestion(this.currentIndex);
    } else {
      this.finishQuiz();
    }
  }

  // --- UPDATE HUD DASHBOARD ---
  updateHUD() {
    this.dom.hudScore.textContent = this.score;
    this.dom.hudStreak.textContent = `${this.streak}x`;
    if (this.streak >= 2) {
      this.dom.streakFire.classList.add('flame-active');
    } else {
      this.dom.streakFire.classList.remove('flame-active');
    }
  }

  // --- FINISH QUIZ & DISPLAY RESULTS ---
  finishQuiz() {
    this.dom.quizScreen.classList.remove('active');
    this.dom.resultsScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Calculate metrics
    const triviaQuestions = this.userAnswers.filter(a => a.correctAnswer !== null);
    const correctTrivia = triviaQuestions.filter(a => a.isCorrect).length;
    const accuracy = triviaQuestions.length > 0 
      ? Math.round((correctTrivia / triviaQuestions.length) * 100) 
      : 100;

    const paragraphQuestions = this.userAnswers.filter(a => a.type === 'paragraph');
    const completedParagraphs = paragraphQuestions.filter(a => a.userResponse !== "(Skipped)").length;

    // Populate Results Screen
    this.dom.summaryPlayerName.textContent = this.playerName;
    this.dom.metricScore.textContent = this.score;
    this.dom.metricAccuracy.textContent = `${accuracy}%`;
    this.dom.metricParagraphs.textContent = `${completedParagraphs} / ${paragraphQuestions.length}`;
    this.dom.metricStreak.textContent = `${this.maxStreak}x`;

    // Dynamic Rank Title
    let rank = "💖 TRUE SOULMATE";
    let trophy = "👑";
    let heading = "Quiz Completed with Love!";
    let subtitle = `Thank you so much, ${this.playerName}! Every memory and thought you shared is deeply cherished.`;

    if (accuracy >= 80 && completedParagraphs >= 5) {
      rank = "👑 MYTHIC SOULMATE";
      trophy = "💖";
    } else if (accuracy >= 60) {
      rank = "💎 HEART CONNOISSEUR";
      trophy = "🏆";
    }

    this.dom.rankTitle.textContent = rank;
    this.dom.trophyIcon.textContent = trophy;
    this.dom.resultTitle.textContent = heading;
    this.dom.resultSubtitle.textContent = subtitle;

    this.sound.playVictory();
    this.confetti.fire(4500);

    // Save to MySQL Database
    this.saveSubmissionToMySQL({
      playerName: this.playerName,
      totalScore: this.score,
      accuracy: accuracy,
      triviaCorrect: correctTrivia,
      totalTrivia: triviaQuestions.length,
      paragraphsCount: completedParagraphs,
      maxStreak: this.maxStreak,
      answers: this.userAnswers
    });

    // Build the Full Review Drawer
    this.buildReviewList();
  }

  // --- SAVE TO MYSQL DATABASE API ---
  async saveSubmissionToMySQL(payload) {
    const endpoints = [
      'api.php?action=submit',
      'http://localhost/Quiz-Website/api.php?action=submit',
      '/api/submissions'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            console.log("[MySQL] Answers successfully stored in database. Submission ID:", data.submissionId);
            this.showToast("Your answers & notes have been saved to MySQL! 💖");
            return;
          }
        }
      } catch (e) {
        // Try next endpoint
      }
    }
    console.info("Saved in local session.");
  }

  // --- BUILD REVIEW LIST ---
  buildReviewList() {
    this.dom.reviewList.innerHTML = '';

    this.userAnswers.forEach((item, idx) => {
      const card = document.createElement('div');
      const isParagraph = (item.type === 'paragraph');
      const isTrivia = (item.correctAnswer !== null);

      let cardClass = 'review-item';
      if (isTrivia) {
        cardClass += item.isCorrect ? ' is-correct' : ' is-wrong';
      } else {
        cardClass += ' is-correct';
      }

      card.className = cardClass;

      let badgeText = isParagraph ? '✍️ Paragraph Response' : (isTrivia ? (item.isCorrect ? '✅ Correct' : '❌ Missed') : '💖 Recorded');
      let badgeClass = isParagraph ? 'badge-purple' : (isTrivia ? (item.isCorrect ? 'badge-blue' : 'badge-pink') : 'badge-blue');

      let responseHTML = '';
      if (isParagraph) {
        responseHTML = `
          <div class="review-paragraph-content">
            ${this.escapeHTML(item.userResponse)}
          </div>
        `;
      } else if (isTrivia) {
        responseHTML = `
          <div class="review-answers-box">
            ${!item.isCorrect ? `<div class="ans-line user-wrong"><span>❌ Your answer:</span> <span>${this.escapeHTML(item.userResponse)}</span></div>` : ''}
            <div class="ans-line correct"><span>✅ Correct answer:</span> <span>${this.escapeHTML(item.correctAnswer)}</span></div>
          </div>
        `;
      } else {
        responseHTML = `
          <div class="review-answers-box">
            <div class="ans-line correct"><span>💖 Your selection:</span> <span>${this.escapeHTML(item.userResponse)}</span></div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="review-item-header">
          <span class="review-q-text">${idx + 1}. ${this.escapeHTML(item.question)}</span>
          <span class="badge-3d ${badgeClass}">${badgeText}</span>
        </div>
        ${responseHTML}
      `;

      this.dom.reviewList.appendChild(card);
    });
  }

  // --- COPY ALL RESPONSES SUMMARY ---
  copyAllResponses() {
    let report = `💌 QUIZSPHERE 3D RESPONSES\n`;
    report += `👤 Challenger: ${this.playerName}\n`;
    report += `💎 Total Score: ${this.score}\n`;
    report += `🎯 Accuracy: ${this.dom.metricAccuracy.textContent}\n`;
    report += `✍️ Paragraphs: ${this.dom.metricParagraphs.textContent}\n\n`;
    report += `=========================================\n`;

    this.userAnswers.forEach((ans, i) => {
      report += `\n${i + 1}. [${ans.section}] ${ans.question}\n`;
      report += `👉 Answer: ${ans.userResponse}\n`;
      if (ans.correctAnswer && !ans.isCorrect) {
        report += `(Correct was: ${ans.correctAnswer})\n`;
      }
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report).then(() => {
        this.showToast("All responses copied to clipboard! Share with your partner 💌");
      }).catch(() => {
        prompt("Copy all quiz responses below:", report);
      });
    } else {
      prompt("Copy all quiz responses below:", report);
    }
  }

  // --- DOWNLOAD AS .TXT FILE ---
  downloadResponsesTxt() {
    let report = `💌 QUIZSPHERE 3D RESPONSES\n`;
    report += `👤 Challenger: ${this.playerName}\n`;
    report += `💎 Total Score: ${this.score}\n`;
    report += `🎯 Accuracy: ${this.dom.metricAccuracy.textContent}\n`;
    report += `✍️ Paragraphs: ${this.dom.metricParagraphs.textContent}\n`;
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `=========================================\n\n`;

    this.userAnswers.forEach((ans, i) => {
      report += `${i + 1}. [${ans.section}] ${ans.question}\n`;
      report += `Answer: ${ans.userResponse}\n`;
      if (ans.correctAnswer && !ans.isCorrect) {
        report += `Correct: ${ans.correctAnswer}\n`;
      }
      report += `\n-----------------------------------------\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quiz_Responses_${this.playerName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast("Downloaded responses as text file! 💾");
  }

  // --- TOAST UTILITY ---
  showToast(message) {
    this.dom.toastMsg.textContent = message;
    this.dom.toastNotification.classList.remove('hidden');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.toastNotification.classList.add('hidden');
    }, 3200);
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ==========================================
// 5. BOOTSTRAP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  window.quizArena = new QuizArena();
});
