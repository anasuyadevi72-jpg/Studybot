/* ====================================================================
   STUDYBOT — Aptitude Academy Engine
   Core engine for:
   - Topic Learning & Concept Mastery
   - Reusable Verified Question Bank & Practice Arena
   - Timed Mock Test Engine with Sectional Palette & Negative Marking
   - Post-Test Performance Analytics & Scoring
   - Personal Mistake Notebook & Bookmark System
   - Personalized Study Coach & Timetable Bridge
   - AI Aptitude Tutor Bridge (Hints, Shortcuts, Similar Problems)
   - Supabase & LocalStorage Data Persistence
   ==================================================================== */

const APTITUDE_STORAGE_KEY_PREFIX = "studybot_aptitude_";
const ACTIVE_MOCK_STORAGE_KEY = "studybot_active_mock";

// In-memory state for active sessions
let activePracticeState = {
  questions: [],
  currentIndex: 0,
  selectedOption: null,
  isAnswered: false,
  filterSubject: "all",
  filterTopic: "all",
  filterDifficulty: "all",
  filterExam: "all",
  startTime: null
};

let activeMockState = {
  inProgress: false,
  profile: null,
  questions: [],
  answers: {}, // { [qIndex]: optionIndex }
  paletteStatus: {}, // { [qIndex]: 'not_visited' | 'not_answered' | 'answered' | 'review' | 'answered_review' }
  questionTimes: {}, // { [qIndex]: seconds }
  currentIndex: 0,
  currentSectionIndex: 0,
  totalSeconds: 0,
  secondsRemaining: 0,
  timerInterval: null,
  questionStartTimestamp: null,
  isSubmitting: false
};

/* ====================================================================
   1. USER & LOCAL STORAGE PERSISTENCE
   ==================================================================== */

function getAptitudeUserKey() {
  if (typeof currentUser !== "undefined" && currentUser && currentUser.email) {
    return currentUser.email.toLowerCase().trim();
  }
  return "guest";
}

function getAptitudeState() {
  const key = APTITUDE_STORAGE_KEY_PREFIX + getAptitudeUserKey();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        progress: parsed.progress || {},
        attempts: parsed.attempts || [],
        mistakes: parsed.mistakes || [],
        bookmarks: parsed.bookmarks || [],
        targetExam: parsed.targetExam || "campus_placements",
        targetDate: parsed.targetDate || ""
      };
    }
  } catch (e) {
    console.warn("[Aptitude] Storage read warning:", e);
  }
  return {
    progress: {},
    attempts: [],
    mistakes: [],
    bookmarks: [],
    targetExam: "campus_placements",
    targetDate: ""
  };
}

function saveAptitudeState(state) {
  const key = APTITUDE_STORAGE_KEY_PREFIX + getAptitudeUserKey();
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error("[Aptitude] Storage save error:", e);
  }
  // Asynchronously trigger cloud sync if user is authenticated and Supabase is active
  syncAptitudeToCloud(state).catch(err => {
    console.debug("[Aptitude] Cloud sync notice:", err);
  });
}

// Supabase Cloud Sync Integration
async function syncAptitudeToCloud(state) {
  if (typeof isSupabaseConfigured !== "function" || !isSupabaseConfigured()) return;
  if (typeof supabaseClient === "undefined" || !supabaseClient) return;
  if (!currentUser || !currentUser.id) return;

  const userId = currentUser.id;

  try {
    // 1. Sync Progress entries
    const progressEntries = Object.entries(state.progress || {});
    for (const [topicId, p] of progressEntries) {
      await supabaseClient
        .from("aptitude_progress")
        .upsert({
          user_id: userId,
          topic_id: topicId,
          confidence_level: p.confidence || "medium",
          completed: Boolean(p.completed),
          questions_practiced: p.questionsPracticed || 0,
          questions_correct: p.questionsCorrect || 0,
          total_time_seconds: p.totalTimeSeconds || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,topic_id" });
    }

    // 2. Sync Mistake Notebook
    for (const m of (state.mistakes || []).slice(-20)) {
      await supabaseClient
        .from("mistake_notebook")
        .upsert({
          user_id: userId,
          question_id: m.questionId,
          topic_id: m.topicId,
          selected_option: m.selectedOption,
          correct_option: m.correctOption,
          user_note: m.userNote || "",
          reviewed: Boolean(m.reviewed),
          mastery_streak: m.masteryStreak || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,question_id" });
    }

    // 3. Sync Bookmarks
    for (const b of (state.bookmarks || []).slice(-30)) {
      await supabaseClient
        .from("aptitude_bookmarks")
        .upsert({
          user_id: userId,
          question_id: b.questionId,
          topic_id: b.topicId,
          note: b.note || "",
          created_at: b.dateAdded || new Date().toISOString()
        }, { onConflict: "user_id,question_id" });
    }
  } catch (err) {
    console.debug("[Aptitude] Background Supabase sync:", err.message);
  }
}

/* ====================================================================
   2. TOPIC PROGRESS & CONFIDENCE MANAGEMENT
   ==================================================================== */

function updateTopicProgress(topicId, updates) {
  const state = getAptitudeState();
  const existing = state.progress[topicId] || {
    completed: false,
    confidence: "medium",
    questionsPracticed: 0,
    questionsCorrect: 0,
    totalTimeSeconds: 0
  };
  state.progress[topicId] = { ...existing, ...updates };
  saveAptitudeState(state);
  renderLearningPathsTab();
  renderPerformanceTab();
  return state.progress[topicId];
}

function toggleTopicCompleted(topicId) {
  const state = getAptitudeState();
  const current = state.progress[topicId]?.completed || false;
  updateTopicProgress(topicId, { completed: !current });
  if (typeof showToast === "function") {
    showToast(!current ? "Topic marked as Completed! 🎓" : "Topic marked as In-Progress.");
  }
}

function setTopicConfidence(topicId, level) {
  updateTopicProgress(topicId, { confidence: level });
  if (typeof showToast === "function") {
    showToast(`Confidence set to: ${level.toUpperCase()}`);
  }
}

/* ====================================================================
   3. LESSON MODAL / DRAWER
   ==================================================================== */

function openLessonModal(topicId) {
  const topic = (window.APTITUDE_TOPICS || []).find(t => t.id === topicId);
  if (!topic) return;

  const modal = document.getElementById("aptitudeLessonModal");
  if (!modal) return;

  const state = getAptitudeState();
  const prog = state.progress[topicId] || { completed: false, confidence: "medium" };

  document.getElementById("lessonModalTitle").textContent = topic.title;
  document.getElementById("lessonModalSubject").textContent = topic.subject;
  document.getElementById("lessonModalDifficulty").textContent = topic.difficulty;
  document.getElementById("lessonModalDifficulty").className = `badge badge-${topic.difficulty.toLowerCase()}`;
  document.getElementById("lessonModalDuration").textContent = `${topic.estimatedMinutes} mins`;
  document.getElementById("lessonModalTheory").textContent = topic.theory;

  // Prerequisites & next
  const prereqEl = document.getElementById("lessonPrerequisites");
  if (prereqEl) {
    prereqEl.textContent = topic.prerequisites ? `Prerequisites: ${topic.prerequisites}` : "Prerequisites: None";
  }

  // Formulas list
  const formulasContainer = document.getElementById("lessonFormulasList");
  formulasContainer.innerHTML = (topic.formulas || []).map(f => `
    <li class="formula-item">
      <code>${escapeHTML(f)}</code>
    </li>
  `).join("");

  // Shortcuts list
  const shortcutsContainer = document.getElementById("lessonShortcutsList");
  shortcutsContainer.innerHTML = (topic.shortcuts || []).map(s => `
    <div class="shortcut-card">
      <div class="shortcut-header">
        <span class="shortcut-icon">⚡</span>
        <strong>${escapeHTML(s.title)}</strong>
      </div>
      <p class="shortcut-rule">${escapeHTML(s.rule)}</p>
      <div class="shortcut-condition">
        <span class="condition-badge">When to apply:</span>
        <em>${escapeHTML(s.condition)}</em>
      </div>
    </div>
  `).join("");

  // Common Mistakes
  const mistakesContainer = document.getElementById("lessonMistakesList");
  mistakesContainer.innerHTML = (topic.commonMistakes || []).map(m => `
    <li class="mistake-item">
      <span class="mistake-icon">⚠️</span>
      <span>${escapeHTML(m)}</span>
    </li>
  `).join("");

  // Worked Examples
  const examplesContainer = document.getElementById("lessonExamplesList");
  examplesContainer.innerHTML = (topic.workedExamples || []).map((ex, idx) => `
    <div class="example-card">
      <div class="example-title">Worked Example ${idx + 1}</div>
      <div class="example-problem">${escapeHTML(ex.problem)}</div>
      <div class="example-solution">
        <strong>Step-by-Step Solution:</strong>
        <pre>${escapeHTML(ex.solution)}</pre>
      </div>
      <div class="example-answer">
        <span>Final Answer:</span>
        <strong>${escapeHTML(ex.answer)}</strong>
      </div>
    </div>
  `).join("");

  // Confidence & Completed controls
  const completedCheckbox = document.getElementById("lessonCompletedCheckbox");
  if (completedCheckbox) {
    completedCheckbox.checked = prog.completed;
    completedCheckbox.onchange = () => toggleTopicCompleted(topicId);
  }

  const confidenceButtons = document.querySelectorAll(".confidence-pill");
  confidenceButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.level === prog.confidence);
    btn.onclick = () => {
      setTopicConfidence(topicId, btn.dataset.level);
      confidenceButtons.forEach(b => b.classList.toggle("active", b === btn));
    };
  });

  // Practice CTA button
  const practiceBtn = document.getElementById("lessonStartPracticeBtn");
  if (practiceBtn) {
    practiceBtn.onclick = () => {
      closeLessonModal();
      switchAptitudeTab("practice");
      setPracticeFilterTopic(topicId);
    };
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeLessonModal() {
  const modal = document.getElementById("aptitudeLessonModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
}

/* ====================================================================
   4. PRACTICE ARENA
   ==================================================================== */

function setPracticeFilterTopic(topicId) {
  const sel = document.getElementById("practiceTopicFilter");
  if (sel) {
    sel.value = topicId;
    activePracticeState.filterTopic = topicId;
    loadPracticeQuestions();
  }
}

function loadPracticeQuestions() {
  const allQuestions = window.APTITUDE_QUESTION_BANK || [];
  const subjectFilter = activePracticeState.filterSubject;
  const topicFilter = activePracticeState.filterTopic;
  const difficultyFilter = activePracticeState.filterDifficulty;
  const examFilter = activePracticeState.filterExam;

  let filtered = allQuestions.filter(q => {
    if (subjectFilter !== "all" && q.subject !== subjectFilter) return false;
    if (topicFilter !== "all" && q.topicId !== topicFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) return false;
    if (examFilter !== "all" && (!q.examCategories || !q.examCategories.includes(examFilter))) return false;
    return true;
  });

  if (filtered.length === 0) {
    filtered = allQuestions; // Graceful fallback
  }

  // Shuffle filtered questions for randomized practice sets
  activePracticeState.questions = [...filtered].sort(() => Math.random() - 0.5);
  activePracticeState.currentIndex = 0;
  activePracticeState.selectedOption = null;
  activePracticeState.isAnswered = false;
  activePracticeState.startTime = Date.now();

  renderCurrentPracticeQuestion();
}

function renderCurrentPracticeQuestion() {
  const questions = activePracticeState.questions;
  const total = questions.length;
  const index = activePracticeState.currentIndex;

  const container = document.getElementById("practiceQuestionCard");
  const emptyState = document.getElementById("practiceEmptyState");
  if (!container) return;

  if (total === 0 || index >= total) {
    container.classList.add("hidden");
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  container.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");

  const q = questions[index];
  const state = getAptitudeState();
  const isBookmarked = (state.bookmarks || []).some(b => b.questionId === q.id);

  activePracticeState.selectedOption = null;
  activePracticeState.isAnswered = false;
  activePracticeState.startTime = Date.now();

  // Update counters and badges
  document.getElementById("practiceQuestionCounter").textContent = `Question ${index + 1} of ${total}`;
  document.getElementById("practiceQuestionSubject").textContent = q.subject;
  document.getElementById("practiceQuestionDifficulty").textContent = q.difficulty;
  document.getElementById("practiceQuestionDifficulty").className = `badge badge-${q.difficulty.toLowerCase()}`;
  document.getElementById("practiceQuestionText").textContent = q.text;

  // Verification badge
  const verBadge = document.getElementById("practiceVerificationBadge");
  if (verBadge) {
    verBadge.textContent = q.verified ? "✓ Verified Benchmark" : "AI Practice Question";
    verBadge.className = q.verified ? "verified-badge official" : "verified-badge ai";
  }

  // Bookmark button state
  const bookmarkBtn = document.getElementById("practiceBookmarkBtn");
  if (bookmarkBtn) {
    bookmarkBtn.innerHTML = isBookmarked ? "★ Bookmarked" : "☆ Bookmark";
    bookmarkBtn.classList.toggle("active-bookmark", isBookmarked);
    bookmarkBtn.onclick = () => toggleBookmarkQuestion(q.id, q.topicId);
  }

  // Render Option buttons
  const optionsList = document.getElementById("practiceOptionsList");
  optionsList.innerHTML = q.options.map((opt, i) => `
    <button type="button" class="practice-option-btn" data-index="${i}">
      <span class="option-letter">${String.fromCharCode(65 + i)}</span>
      <span class="option-text">${escapeHTML(opt)}</span>
    </button>
  `).join("");

  optionsList.querySelectorAll(".practice-option-btn").forEach(btn => {
    btn.onclick = () => {
      if (activePracticeState.isAnswered) return;
      optionsList.querySelectorAll(".practice-option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      activePracticeState.selectedOption = parseInt(btn.dataset.index, 10);
      document.getElementById("practiceCheckBtn").disabled = false;
    };
  });

  // Reset controls
  const checkBtn = document.getElementById("practiceCheckBtn");
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.classList.remove("hidden");
  }

  const nextBtn = document.getElementById("practiceNextBtn");
  if (nextBtn) {
    nextBtn.classList.add("hidden");
  }

  // Hide explanation and AI tutor panels
  const expPanel = document.getElementById("practiceExplanationPanel");
  if (expPanel) expPanel.classList.add("hidden");

  const aiPanel = document.getElementById("practiceAITutorPanel");
  if (aiPanel) aiPanel.classList.add("hidden");
}

function checkPracticeAnswer() {
  if (activePracticeState.selectedOption === null || activePracticeState.isAnswered) return;

  const q = activePracticeState.questions[activePracticeState.currentIndex];
  const chosen = activePracticeState.selectedOption;
  const isCorrect = chosen === q.correctIndex;
  const timeSpentSec = Math.round((Date.now() - activePracticeState.startTime) / 1000);

  activePracticeState.isAnswered = true;

  // Highlight options
  const optionBtns = document.querySelectorAll(".practice-option-btn");
  optionBtns.forEach(btn => {
    const idx = parseInt(btn.dataset.index, 10);
    btn.disabled = true;
    if (idx === q.correctIndex) {
      btn.classList.add("correct-option");
    } else if (idx === chosen) {
      btn.classList.add("incorrect-option");
    }
  });

  // Record practice in user progress
  const state = getAptitudeState();
  const prog = state.progress[q.topicId] || {
    completed: false,
    confidence: "medium",
    questionsPracticed: 0,
    questionsCorrect: 0,
    totalTimeSeconds: 0
  };
  prog.questionsPracticed = (prog.questionsPracticed || 0) + 1;
  if (isCorrect) prog.questionsCorrect = (prog.questionsCorrect || 0) + 1;
  prog.totalTimeSeconds = (prog.totalTimeSeconds || 0) + timeSpentSec;
  state.progress[q.topicId] = prog;

  // If wrong, automatically record in mistake notebook
  if (!isCorrect) {
    recordMistake(q.id, q.topicId, chosen, q.correctIndex);
  } else {
    // If correct, increment mastery streak if it was in mistake notebook
    const mistakeIdx = state.mistakes.findIndex(m => m.questionId === q.id);
    if (mistakeIdx !== -1) {
      state.mistakes[mistakeIdx].masteryStreak = (state.mistakes[mistakeIdx].masteryStreak || 0) + 1;
      state.mistakes[mistakeIdx].reviewed = true;
    }
  }
  saveAptitudeState(state);

  // Show detailed explanation
  const expPanel = document.getElementById("practiceExplanationPanel");
  if (expPanel) {
    expPanel.classList.remove("hidden");
    const resultHeader = document.getElementById("practiceResultHeader");
    resultHeader.textContent = isCorrect ? "✓ Correct! Well done." : "✗ Incorrect. Learn from the steps:";
    resultHeader.className = isCorrect ? "result-badge correct" : "result-badge incorrect";

    document.getElementById("practiceExplanationText").textContent = q.explanation;
  }

  // Toggle buttons
  document.getElementById("practiceCheckBtn").classList.add("hidden");
  document.getElementById("practiceNextBtn").classList.remove("hidden");

  // Hook AI Tutor buttons for this question
  hookAITutorButtons(q);
}

function nextPracticeQuestion() {
  if (activePracticeState.currentIndex < activePracticeState.questions.length - 1) {
    activePracticeState.currentIndex++;
    renderCurrentPracticeQuestion();
  } else {
    if (typeof showToast === "function") {
      showToast("Practice set completed! Great effort! 🚀");
    }
    // Reload a fresh randomized set
    loadPracticeQuestions();
  }
}

/* ====================================================================
   5. BOOKMARKS & MISTAKE NOTEBOOK
   ==================================================================== */

function toggleBookmarkQuestion(questionId, topicId) {
  const state = getAptitudeState();
  const idx = state.bookmarks.findIndex(b => b.questionId === questionId);
  const bookmarkBtn = document.getElementById("practiceBookmarkBtn");

  if (idx !== -1) {
    state.bookmarks.splice(idx, 1);
    if (typeof showToast === "function") showToast("Bookmark removed.");
    if (bookmarkBtn) {
      bookmarkBtn.innerHTML = "☆ Bookmark";
      bookmarkBtn.classList.remove("active-bookmark");
    }
  } else {
    state.bookmarks.push({
      questionId,
      topicId,
      note: "",
      dateAdded: new Date().toISOString()
    });
    if (typeof showToast === "function") showToast("Question bookmarked! ⭐");
    if (bookmarkBtn) {
      bookmarkBtn.innerHTML = "★ Bookmarked";
      bookmarkBtn.classList.add("active-bookmark");
    }
  }
  saveAptitudeState(state);
  renderMistakesTab();
}

function recordMistake(questionId, topicId, chosenOption, correctOption) {
  const state = getAptitudeState();
  const idx = state.mistakes.findIndex(m => m.questionId === questionId);
  if (idx === -1) {
    state.mistakes.push({
      id: "mistake_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      questionId,
      topicId,
      selectedOption: chosenOption,
      correctOption: correctOption,
      userNote: "",
      reviewed: false,
      masteryStreak: 0,
      dateAdded: new Date().toISOString()
    });
    saveAptitudeState(state);
  }
}

function removeMistake(questionId) {
  const state = getAptitudeState();
  state.mistakes = state.mistakes.filter(m => m.questionId !== questionId);
  saveAptitudeState(state);
  renderMistakesTab();
  if (typeof showToast === "function") showToast("Mistake removed from notebook.");
}

function saveMistakeNote(questionId, note) {
  const state = getAptitudeState();
  const m = state.mistakes.find(item => item.questionId === questionId);
  if (m) {
    m.userNote = note;
    saveAptitudeState(state);
    if (typeof showToast === "function") showToast("Note saved!");
  }
}

/* ====================================================================
   6. AI APTITUDE TUTOR BRIDGE
   ==================================================================== */

function hookAITutorButtons(question) {
  const hintBtn = document.getElementById("aiTutorHintBtn");
  const methodBtn = document.getElementById("aiTutorMethodBtn");
  const similarBtn = document.getElementById("aiTutorSimilarBtn");

  if (hintBtn) hintBtn.onclick = () => requestAIAptitudeTutor("aptitude_hint", question);
  if (methodBtn) methodBtn.onclick = () => requestAIAptitudeTutor("aptitude_method", question);
  if (similarBtn) similarBtn.onclick = () => requestAIAptitudeTutor("aptitude_similar", question);
}

async function requestAIAptitudeTutor(mode, question) {
  const container = document.getElementById("practiceAITutorPanel");
  const content = document.getElementById("practiceAITutorContent");
  if (!container || !content) return;

  container.classList.remove("hidden");
  content.innerHTML = `
    <div class="ai-loading-spinner">
      <div class="spinner"></div>
      <p>Consulting STUDYBOT AI Tutor...</p>
    </div>
  `;

  const topic = (window.APTITUDE_TOPICS || []).find(t => t.id === question.topicId);
  const topicTitle = topic ? topic.title : "Aptitude";

  try {
    const payload = {
      mode: mode,
      question_context: {
        text: question.text,
        options: question.options,
        topicTitle: topicTitle,
        difficulty: question.difficulty
      },
      student_context: {
        name: (currentUser && currentUser.name) || "Student"
      }
    };

    const res = await fetch("http://127.0.0.1:5000/api/aptitude/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        content.innerHTML = `
          <div class="ai-response-box">
            <div class="ai-meta-bar">
              <span class="ai-mode-tag">${mode === "aptitude_hint" ? "💡 Step-by-Step Hint" : mode === "aptitude_method" ? "⚡ Shortcut Method" : "📝 Similar Problem"}</span>
              <span class="ai-disclaimer-tag">⚠️ Unverified by official boards</span>
            </div>
            <div class="ai-text-body">${escapeHTML(data.response).replace(/\\n/g, "<br>")}</div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="ai-notice-box">
            <strong>AI Tutor Notice:</strong>
            <p>${escapeHTML(data.message || "AI Tutor backend is running, but API key is missing in backend/.env.")}</p>
          </div>
        `;
      }
    } else {
      content.innerHTML = `
        <div class="ai-notice-box error">
          <p>AI Tutor request failed. Backend returned status ${res.status}.</p>
        </div>
      `;
    }
  } catch (err) {
    content.innerHTML = `
      <div class="ai-notice-box warning">
        <p>AI Backend connection unavailable at http://127.0.0.1:5000. Start the Python backend using <code>python backend/app.py</code> to enable live AI tutoring.</p>
      </div>
    `;
  }
}

/* ====================================================================
   7. TIMED MOCK TEST ENGINE
   ==================================================================== */

function startMockTest(profileId) {
  const profile = (window.EXAM_PROFILES || []).find(p => p.id === profileId);
  if (!profile) return;

  const allQuestions = window.APTITUDE_QUESTION_BANK || [];

  // Filter or select questions matching exam categories
  let examQuestions = allQuestions.filter(q =>
    q.examCategories && q.examCategories.includes(profileId)
  );

  // If question bank has fewer questions than totalQuestions, use all questions and duplicate/cycle cleanly
  if (examQuestions.length === 0) {
    examQuestions = [...allQuestions];
  }

  // Shuffle and pick target count (capped at available for verified integrity)
  const targetCount = Math.min(profile.totalQuestions, Math.max(10, examQuestions.length));
  const selectedQuestions = [...examQuestions].sort(() => Math.random() - 0.5).slice(0, targetCount);

  // Initialize active test state
  activeMockState = {
    inProgress: true,
    profile: profile,
    questions: selectedQuestions,
    answers: {},
    paletteStatus: {},
    questionTimes: {},
    currentIndex: 0,
    currentSectionIndex: 0,
    totalSeconds: profile.totalMinutes * 60,
    secondsRemaining: profile.totalMinutes * 60,
    timerInterval: null,
    questionStartTimestamp: Date.now(),
    isSubmitting: false
  };

  // Set initial palette status
  selectedQuestions.forEach((_, idx) => {
    activeMockState.paletteStatus[idx] = idx === 0 ? "not_answered" : "not_visited";
    activeMockState.questionTimes[idx] = 0;
  });

  // Save active session for crash/refresh recovery
  saveActiveMockSession();

  // Show active test UI
  document.getElementById("mockSetupView").classList.add("hidden");
  document.getElementById("mockResultView").classList.add("hidden");
  document.getElementById("mockActiveTestView").classList.remove("hidden");

  // Render header info
  document.getElementById("mockActiveTestTitle").textContent = profile.name;
  document.getElementById("mockActiveTestSubtitle").textContent = `${profile.totalQuestions} Questions • ${profile.totalMinutes} Mins • ${profile.negativeMarking ? `Negative marking (-${profile.negativePenalty})` : "No negative marking"}`;

  // Start countdown timer
  startMockTimer();

  // Render first question and palette
  renderMockQuestion(0);
  renderMockPalette();
}

function startMockTimer() {
  if (activeMockState.timerInterval) {
    clearInterval(activeMockState.timerInterval);
  }

  updateTimerDisplay();

  activeMockState.timerInterval = setInterval(() => {
    if (!activeMockState.inProgress) {
      clearInterval(activeMockState.timerInterval);
      return;
    }

    activeMockState.secondsRemaining--;
    updateTimerDisplay();

    // Auto-submit when time expires
    if (activeMockState.secondsRemaining <= 0) {
      clearInterval(activeMockState.timerInterval);
      if (typeof showToast === "function") showToast("Time is up! Submitting your test automatically...");
      submitMockTest(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerBadge = document.getElementById("mockTimerBadge");
  if (!timerBadge) return;

  const secs = Math.max(0, activeMockState.secondsRemaining);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  timerBadge.textContent = `⏱️ ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  // Visual warning under 2 minutes
  if (secs <= 120) {
    timerBadge.classList.add("time-warning");
  } else {
    timerBadge.classList.remove("time-warning");
  }
}

function renderMockQuestion(index) {
  const total = activeMockState.questions.length;
  if (index < 0 || index >= total) return;

  // Track time on previous question
  recordTimeOnCurrentQuestion();

  activeMockState.currentIndex = index;
  activeMockState.questionStartTimestamp = Date.now();

  // If it was not visited, mark as not answered
  if (activeMockState.paletteStatus[index] === "not_visited") {
    activeMockState.paletteStatus[index] = "not_answered";
  }

  const q = activeMockState.questions[index];
  const profile = activeMockState.profile;

  document.getElementById("mockQuestionNumberBadge").textContent = `Question ${index + 1} of ${total}`;
  document.getElementById("mockQuestionMarksBadge").textContent = `+${profile.marksPerQuestion || 1.0} / -${profile.negativeMarking ? profile.negativePenalty : 0}`;
  document.getElementById("mockQuestionSubjectBadge").textContent = q.subject;
  document.getElementById("mockQuestionText").textContent = q.text;

  // Render options
  const chosenIndex = activeMockState.answers[index];
  const optionsContainer = document.getElementById("mockQuestionOptionsList");
  optionsContainer.innerHTML = q.options.map((opt, i) => `
    <label class="mock-option-label ${chosenIndex === i ? "selected" : ""}" data-index="${i}">
      <input type="radio" name="mock_option" value="${i}" ${chosenIndex === i ? "checked" : ""}>
      <span class="option-indicator">${String.fromCharCode(65 + i)}</span>
      <span class="option-label-text">${escapeHTML(opt)}</span>
    </label>
  `).join("");

  optionsContainer.querySelectorAll(".mock-option-label").forEach(lbl => {
    lbl.onclick = (e) => {
      const optIdx = parseInt(lbl.dataset.index, 10);
      optionsContainer.querySelectorAll(".mock-option-label").forEach(l => l.classList.remove("selected"));
      lbl.classList.add("selected");
      activeMockState.answers[index] = optIdx;

      // Update palette status
      if (activeMockState.paletteStatus[index] === "review" || activeMockState.paletteStatus[index] === "answered_review") {
        activeMockState.paletteStatus[index] = "answered_review";
      } else {
        activeMockState.paletteStatus[index] = "answered";
      }

      saveActiveMockSession();
      renderMockPalette();
    };
  });

  // Update nav buttons
  const prevBtn = document.getElementById("mockPrevBtn");
  if (prevBtn) prevBtn.disabled = index === 0;

  renderMockPalette();
}

function recordTimeOnCurrentQuestion() {
  if (activeMockState.questionStartTimestamp) {
    const elapsed = Math.round((Date.now() - activeMockState.questionStartTimestamp) / 1000);
    const curr = activeMockState.currentIndex;
    activeMockState.questionTimes[curr] = (activeMockState.questionTimes[curr] || 0) + elapsed;
    activeMockState.questionStartTimestamp = Date.now();
  }
}

function clearCurrentMockResponse() {
  const curr = activeMockState.currentIndex;
  delete activeMockState.answers[curr];
  activeMockState.paletteStatus[curr] = "not_answered";

  const optionsContainer = document.getElementById("mockQuestionOptionsList");
  if (optionsContainer) {
    optionsContainer.querySelectorAll(".mock-option-label").forEach(l => {
      l.classList.remove("selected");
      const input = l.querySelector("input");
      if (input) input.checked = false;
    });
  }

  saveActiveMockSession();
  renderMockPalette();
}

function markForReviewAndNext() {
  const curr = activeMockState.currentIndex;
  if (activeMockState.answers[curr] !== undefined) {
    activeMockState.paletteStatus[curr] = "answered_review";
  } else {
    activeMockState.paletteStatus[curr] = "review";
  }

  saveActiveMockSession();
  renderMockPalette();

  if (curr < activeMockState.questions.length - 1) {
    renderMockQuestion(curr + 1);
  }
}

function saveAndNextMockQuestion() {
  const curr = activeMockState.currentIndex;
  if (curr < activeMockState.questions.length - 1) {
    renderMockQuestion(curr + 1);
  } else {
    // Open submission confirmation modal
    openSubmitConfirmationModal();
  }
}

function renderMockPalette() {
  const paletteGrid = document.getElementById("mockPaletteGrid");
  if (!paletteGrid) return;

  const total = activeMockState.questions.length;
  const current = activeMockState.currentIndex;

  paletteGrid.innerHTML = activeMockState.questions.map((_, i) => {
    const status = activeMockState.paletteStatus[i] || "not_visited";
    const isCurrent = i === current;
    return `
      <button type="button" class="palette-node ${status} ${isCurrent ? "current" : ""}" data-index="${i}">
        ${i + 1}
      </button>
    `;
  }).join("");

  paletteGrid.querySelectorAll(".palette-node").forEach(btn => {
    btn.onclick = () => {
      renderMockQuestion(parseInt(btn.dataset.index, 10));
    };
  });

  // Update summary counts
  updatePaletteSummaryCounts();
}

function updatePaletteSummaryCounts() {
  let answered = 0;
  let notAnswered = 0;
  let review = 0;
  let answeredReview = 0;
  let notVisited = 0;

  activeMockState.questions.forEach((_, i) => {
    const s = activeMockState.paletteStatus[i];
    if (s === "answered") answered++;
    else if (s === "not_answered") notAnswered++;
    else if (s === "review") review++;
    else if (s === "answered_review") answeredReview++;
    else notVisited++;
  });

  const countEl = document.getElementById("paletteAnsweredCount");
  if (countEl) countEl.textContent = answered + answeredReview;

  const reviewEl = document.getElementById("paletteReviewCount");
  if (reviewEl) reviewEl.textContent = review + answeredReview;

  const unansEl = document.getElementById("paletteUnansweredCount");
  if (unansEl) unansEl.textContent = notAnswered + notVisited;
}

function saveActiveMockSession() {
  try {
    localStorage.setItem(ACTIVE_MOCK_STORAGE_KEY, JSON.stringify({
      profileId: activeMockState.profile?.id,
      answers: activeMockState.answers,
      paletteStatus: activeMockState.paletteStatus,
      questionTimes: activeMockState.questionTimes,
      currentIndex: activeMockState.currentIndex,
      secondsRemaining: activeMockState.secondsRemaining,
      totalSeconds: activeMockState.totalSeconds,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.debug("[Aptitude] Session backup notice:", e);
  }
}

function clearActiveMockSession() {
  try {
    localStorage.removeItem(ACTIVE_MOCK_STORAGE_KEY);
  } catch (e) {}
}

/* ====================================================================
   8. TEST SUBMISSION & SCORE COMPUTATION
   ==================================================================== */

function openSubmitConfirmationModal() {
  const modal = document.getElementById("mockSubmitConfirmModal");
  if (!modal) return;

  recordTimeOnCurrentQuestion();

  let answered = 0;
  let review = 0;
  let unattempted = 0;

  activeMockState.questions.forEach((_, i) => {
    if (activeMockState.answers[i] !== undefined) {
      answered++;
    } else {
      unattempted++;
    }
    if (activeMockState.paletteStatus[i] === "review" || activeMockState.paletteStatus[i] === "answered_review") {
      review++;
    }
  });

  document.getElementById("confirmTotalQuestions").textContent = activeMockState.questions.length;
  document.getElementById("confirmAnsweredQuestions").textContent = answered;
  document.getElementById("confirmReviewQuestions").textContent = review;
  document.getElementById("confirmUnansweredQuestions").textContent = unattempted;

  modal.classList.remove("hidden");
}

function closeSubmitConfirmationModal() {
  const modal = document.getElementById("mockSubmitConfirmModal");
  if (modal) modal.classList.add("hidden");
}

function submitMockTest(force = false) {
  if (activeMockState.isSubmitting) return; // Prevent double submission
  activeMockState.isSubmitting = true;

  recordTimeOnCurrentQuestion();

  if (activeMockState.timerInterval) {
    clearInterval(activeMockState.timerInterval);
  }

  closeSubmitConfirmationModal();

  const profile = activeMockState.profile;
  const questions = activeMockState.questions;
  const answers = activeMockState.answers;
  const times = activeMockState.questionTimes;

  const marksPerQ = profile.marksPerQuestion || 1.0;
  const negPenalty = profile.negativeMarking ? (profile.negativePenalty || 0.25) : 0;

  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let grossMarks = 0;
  let negativeMarksDeducted = 0;

  const sectionBreakdown = {};
  const topicBreakdown = {};
  const detailedResponses = [];

  questions.forEach((q, idx) => {
    const chosen = answers[idx];
    const isAttempted = chosen !== undefined;
    const isCorrect = isAttempted && chosen === q.correctIndex;
    const isIncorrect = isAttempted && chosen !== q.correctIndex;
    const timeSpent = times[idx] || 0;

    let qMarks = 0;
    if (isCorrect) {
      qMarks = marksPerQ;
      grossMarks += marksPerQ;
      correctCount++;
    } else if (isIncorrect) {
      qMarks = -negPenalty;
      negativeMarksDeducted += negPenalty;
      incorrectCount++;
      // Auto record into mistake notebook
      recordMistake(q.id, q.topicId, chosen, q.correctIndex);
    } else {
      unattemptedCount++;
    }

    // Breakdown by Subject
    if (!sectionBreakdown[q.subject]) {
      sectionBreakdown[q.subject] = { total: 0, attempted: 0, correct: 0, score: 0 };
    }
    sectionBreakdown[q.subject].total++;
    if (isAttempted) sectionBreakdown[q.subject].attempted++;
    if (isCorrect) sectionBreakdown[q.subject].correct++;
    sectionBreakdown[q.subject].score += qMarks;

    // Breakdown by Topic
    if (!topicBreakdown[q.topicId]) {
      topicBreakdown[q.topicId] = { total: 0, attempted: 0, correct: 0 };
    }
    topicBreakdown[q.topicId].total++;
    if (isAttempted) topicBreakdown[q.topicId].attempted++;
    if (isCorrect) topicBreakdown[q.topicId].correct++;

    detailedResponses.push({
      questionId: q.id,
      topicId: q.topicId,
      subject: q.subject,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedOption: chosen,
      isCorrect: isCorrect,
      marks: qMarks,
      timeSeconds: timeSpent,
      explanation: q.explanation
    });
  });

  const finalScore = Math.max(0, parseFloat((grossMarks - negativeMarksDeducted).toFixed(2)));
  const maxScore = parseFloat((questions.length * marksPerQ).toFixed(2));
  const attemptedTotal = correctCount + incorrectCount;
  const accuracy = attemptedTotal > 0 ? parseFloat(((correctCount / attemptedTotal) * 100).toFixed(1)) : 0;
  const totalTimeTakenSec = Math.max(1, activeMockState.totalSeconds - activeMockState.secondsRemaining);

  const attemptReport = {
    id: "attempt_" + Date.now(),
    examProfileId: profile.id,
    examName: profile.name,
    totalQuestions: questions.length,
    attempted: attemptedTotal,
    correct: correctCount,
    incorrect: incorrectCount,
    unattempted: unattemptedCount,
    score: finalScore,
    maxScore: maxScore,
    accuracy: accuracy,
    timeTakenSeconds: totalTimeTakenSec,
    sectionBreakdown: sectionBreakdown,
    topicBreakdown: topicBreakdown,
    detailedResponses: detailedResponses,
    createdAt: new Date().toISOString()
  };

  // Persist completed attempt
  const state = getAptitudeState();
  state.attempts.unshift(attemptReport);
  saveAptitudeState(state);

  clearActiveMockSession();
  activeMockState.inProgress = false;

  // Render Post-Test Result View
  renderMockResultView(attemptReport);
}

function renderMockResultView(report) {
  document.getElementById("mockActiveTestView").classList.add("hidden");
  document.getElementById("mockResultView").classList.remove("hidden");

  document.getElementById("resExamTitle").textContent = report.examName;
  document.getElementById("resScoreText").textContent = `${report.score} / ${report.maxScore}`;
  document.getElementById("resAccuracyText").textContent = `${report.accuracy}%`;
  document.getElementById("resCorrectCount").textContent = report.correct;
  document.getElementById("resIncorrectCount").textContent = report.incorrect;
  document.getElementById("resUnattemptedCount").textContent = report.unattempted;

  const min = Math.floor(report.timeTakenSeconds / 60);
  const sec = report.timeTakenSeconds % 60;
  document.getElementById("resTimeTaken").textContent = `${min}m ${sec}s`;

  // Render Section Breakdown Table
  const tableBody = document.getElementById("resSectionTableBody");
  if (tableBody) {
    tableBody.innerHTML = Object.entries(report.sectionBreakdown).map(([secName, d]) => `
      <tr>
        <td><strong>${escapeHTML(secName)}</strong></td>
        <td>${d.attempted} / ${d.total}</td>
        <td>${d.correct}</td>
        <td>${d.score.toFixed(2)}</td>
        <td>${d.attempted > 0 ? ((d.correct / d.attempted) * 100).toFixed(1) : 0}%</td>
      </tr>
    `).join("");
  }

  // Render Question-by-Question Review with Explanations
  const reviewContainer = document.getElementById("resQuestionReviewList");
  if (reviewContainer) {
    reviewContainer.innerHTML = report.detailedResponses.map((r, i) => {
      const statusClass = r.selectedOption === undefined ? "unattempted" : r.isCorrect ? "correct" : "incorrect";
      const statusLabel = r.selectedOption === undefined ? "Unattempted" : r.isCorrect ? "✓ Correct (+marks)" : "✗ Incorrect (-penalty)";

      return `
        <div class="review-question-card ${statusClass}">
          <div class="review-q-header">
            <span class="q-num">Q${i + 1} (${escapeHTML(r.subject)})</span>
            <span class="review-status-pill ${statusClass}">${statusLabel}</span>
          </div>
          <p class="review-q-text">${escapeHTML(r.text)}</p>
          <div class="review-options-grid">
            ${r.options.map((opt, optIdx) => {
              let optClass = "";
              if (optIdx === r.correctIndex) optClass = "correct-choice";
              if (optIdx === r.selectedOption && !r.isCorrect) optClass = "wrong-choice";
              return `
                <div class="review-choice ${optClass}">
                  <span class="opt-letter">${String.fromCharCode(65 + optIdx)}</span>
                  <span>${escapeHTML(opt)}</span>
                  ${optIdx === r.correctIndex ? '<span class="choice-tag">✓ Correct Answer</span>' : ""}
                  ${optIdx === r.selectedOption && !r.isCorrect ? '<span class="choice-tag wrong">Your Answer</span>' : ""}
                </div>
              `;
            }).join("")}
          </div>
          <div class="review-explanation-box">
            <strong>Worked Explanation:</strong>
            <p>${escapeHTML(r.explanation)}</p>
          </div>
        </div>
      `;
    }).join("");
  }
}

/* ====================================================================
   9. PERSONALIZED STUDY COACH & ANALYTICS
   ==================================================================== */

function renderPerformanceTab() {
  const state = getAptitudeState();
  const attempts = state.attempts || [];
  const progress = state.progress || {};

  // Compute aggregate accuracy & average time
  let totalPracticed = 0;
  let totalCorrect = 0;
  let totalSeconds = 0;

  Object.values(progress).forEach(p => {
    totalPracticed += (p.questionsPracticed || 0);
    totalCorrect += (p.questionsCorrect || 0);
    totalSeconds += (p.totalTimeSeconds || 0);
  });

  const overallAccuracy = totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0;
  const avgTimePerQ = totalPracticed > 0 ? Math.round(totalSeconds / totalPracticed) : 0;

  const accEl = document.getElementById("coachAccuracyMetric");
  if (accEl) accEl.textContent = `${overallAccuracy}%`;

  const timeEl = document.getElementById("coachAvgTimeMetric");
  if (timeEl) timeEl.textContent = avgTimePerQ > 0 ? `${avgTimePerQ}s` : "--";

  const testsEl = document.getElementById("coachTestsCountMetric");
  if (testsEl) testsEl.textContent = attempts.length;

  // Target Exam Countdown
  const targetExamSelect = document.getElementById("coachTargetExamSelect");
  if (targetExamSelect && state.targetExam) {
    targetExamSelect.value = state.targetExam;
  }

  const targetDateInput = document.getElementById("coachTargetDateInput");
  if (targetDateInput && state.targetDate) {
    targetDateInput.value = state.targetDate;
  }

  updateCountdownDisplay(state.targetDate);

  // Weak Topics Identification (<60% accuracy or Low confidence)
  const weakTopicsList = document.getElementById("coachWeakTopicsList");
  if (weakTopicsList) {
    const weak = [];
    (window.APTITUDE_TOPICS || []).forEach(t => {
      const p = progress[t.id];
      if (p) {
        const acc = p.questionsPracticed > 0 ? (p.questionsCorrect / p.questionsPracticed) * 100 : 100;
        if (acc < 60 || p.confidence === "low") {
          weak.push({ topic: t, accuracy: Math.round(acc), confidence: p.confidence });
        }
      }
    });

    if (weak.length === 0) {
      weakTopicsList.innerHTML = `
        <div class="empty-notice">
          <p>No weak topics detected yet! Complete practice questions and mock tests to diagnose areas for improvement.</p>
        </div>
      `;
    } else {
      weakTopicsList.innerHTML = weak.map(w => `
        <div class="weak-topic-row">
          <div>
            <strong>${escapeHTML(w.topic.title)}</strong>
            <span class="sub-muted">${escapeHTML(w.topic.subject)} • Accuracy: ${w.accuracy}%</span>
          </div>
          <button type="button" class="small-btn primary-btn" onclick="openLessonModal('${w.topic.id}')">
            Revise Lesson →
          </button>
        </div>
      `).join("");
    }
  }

  // Recent Mock Tests History
  const historyList = document.getElementById("coachTestHistoryList");
  if (historyList) {
    if (attempts.length === 0) {
      historyList.innerHTML = `<div class="empty-notice"><p>No mock test attempts recorded yet.</p></div>`;
    } else {
      historyList.innerHTML = attempts.slice(0, 5).map(att => `
        <div class="test-history-card">
          <div class="th-main">
            <strong>${escapeHTML(att.examName)}</strong>
            <span class="th-date">${new Date(att.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="th-stats">
            <span class="th-score">Score: ${att.score} / ${att.maxScore}</span>
            <span class="th-acc">Accuracy: ${att.accuracy}%</span>
            <span class="th-time">Time: ${Math.round(att.timeTakenSeconds / 60)}m</span>
          </div>
        </div>
      `).join("");
    }
  }
}

function updateCountdownDisplay(targetDateStr) {
  const badge = document.getElementById("coachCountdownBadge");
  if (!badge) return;

  if (!targetDateStr) {
    badge.textContent = "Set target date";
    badge.className = "countdown-badge pending";
    return;
  }

  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    badge.textContent = `🎯 ${diffDays} days remaining`;
    badge.className = "countdown-badge active";
  } else if (diffDays === 0) {
    badge.textContent = "🎯 Exam is TODAY! Best of luck!";
    badge.className = "countdown-badge today";
  } else {
    badge.textContent = "Target date has passed";
    badge.className = "countdown-badge expired";
  }
}

// Generate Personalized Plan and Integrate with STUDYBOT Timetable/Tasks
function generateAptitudePlan() {
  const state = getAptitudeState();
  const topics = window.APTITUDE_TOPICS || [];
  const progress = state.progress || {};

  // Prioritize weak topics first, then incomplete beginner topics
  const unmastered = topics.filter(t => {
    const p = progress[t.id];
    return !p || !p.completed || p.confidence === "low";
  });

  const selectedForPlan = unmastered.slice(0, 3);
  if (selectedForPlan.length === 0) {
    if (typeof showToast === "function") showToast("You have completed all curriculum topics! Focus on timed full mock tests! 🏆");
    return;
  }

  const planPreview = document.getElementById("coachPlanPreview");
  if (planPreview) {
    planPreview.innerHTML = `
      <div class="generated-plan-card">
        <h4>Recommended Daily Aptitude Plan:</h4>
        <ul class="plan-tasks-list">
          ${selectedForPlan.map(t => `
            <li>
              <span>📖 <strong>${escapeHTML(t.title)}</strong> (${t.estimatedMinutes}m lesson + 10 practice Qs)</span>
            </li>
          `).join("")}
        </ul>
        <button type="button" id="coachIntegrateTasksBtn" class="primary-btn full-btn">
          Add Tasks to My STUDYBOT Planner & Timetable ✦
        </button>
      </div>
    `;

    document.getElementById("coachIntegrateTasksBtn").onclick = () => {
      integratePlanIntoStudybot(selectedForPlan);
    };
  }
}

function integratePlanIntoStudybot(selectedTopics) {
  if (typeof getData !== "function" || typeof saveData !== "function") {
    if (typeof showToast === "function") showToast("Unable to reach main task planner.");
    return;
  }

  const data = getData();
  const today = typeof todayKey === "function" ? todayKey() : new Date().toISOString().split("T")[0];

  let addedCount = 0;
  selectedTopics.forEach((t, i) => {
    const title = `Aptitude: ${t.title} (Lesson & Practice)`;
    // Avoid duplicate task titles
    const exists = (data.tasks || []).some(existing => existing.title === title);
    if (!exists) {
      const newTask = {
        id: "task_apt_" + Date.now() + "_" + i,
        title: title,
        subject: t.subject,
        duration: t.estimatedMinutes || 30,
        deadline: today,
        completed: false,
        createdAt: new Date().toISOString()
      };
      data.tasks.push(newTask);
      addedCount++;

      // Seamlessly sync to Supabase if configured
      if (typeof syncTaskCreate === "function") {
        syncTaskCreate(newTask).catch(() => {});
      }
    }
  });

  saveData(data);
  if (typeof renderEverything === "function") {
    renderEverything();
  }

  if (typeof showToast === "function") {
    showToast(`Added ${addedCount} aptitude study session(s) to your Task Planner! 🎯`);
  }
}

/* ====================================================================
   10. MISTAKE NOTEBOOK TAB RENDERER
   ==================================================================== */

function renderMistakesTab() {
  const state = getAptitudeState();
  const mistakes = state.mistakes || [];
  const bookmarks = state.bookmarks || [];

  const mistakeContainer = document.getElementById("mistakesListContainer");
  const bookmarksContainer = document.getElementById("bookmarksListContainer");

  // Render Mistakes
  if (mistakeContainer) {
    if (mistakes.length === 0) {
      mistakeContainer.innerHTML = `
        <div class="empty-notice">
          <p>No mistakes recorded yet! Any question you answer incorrectly during practice or mock tests will automatically appear here for spaced repetition.</p>
        </div>
      `;
    } else {
      mistakeContainer.innerHTML = mistakes.map(m => {
        const q = (window.APTITUDE_QUESTION_BANK || []).find(item => item.id === m.questionId);
        if (!q) return "";
        return `
          <div class="mistake-notebook-card">
            <div class="mn-header">
              <span class="mn-topic">${escapeHTML(q.subject)}</span>
              <span class="mn-streak">Mastery: ${m.masteryStreak || 0} streak</span>
              <button type="button" class="text-btn danger-text" onclick="removeMistake('${q.id}')">Remove ✕</button>
            </div>
            <p class="mn-text">${escapeHTML(q.text)}</p>
            <div class="mn-answers-comparison">
              <div class="ans-box wrong">
                <small>Your Answer:</small>
                <span>${m.selectedOption !== undefined ? escapeHTML(q.options[m.selectedOption]) : "Unanswered"}</span>
              </div>
              <div class="ans-box right">
                <small>Correct Answer:</small>
                <span>${escapeHTML(q.options[q.correctIndex])}</span>
              </div>
            </div>
            <div class="mn-explanation">
              <strong>Worked Explanation:</strong>
              <p>${escapeHTML(q.explanation)}</p>
            </div>
            <div class="mn-note-section">
              <label>Personal Mistake Reason / Revision Note:</label>
              <div class="note-input-row">
                <input type="text" id="noteInput_${q.id}" value="${escapeHTML(m.userNote || "")}" placeholder="e.g. Forgot AB rule condition; missed unit conversion">
                <button type="button" class="small-btn secondary-btn" onclick="saveMistakeNote('${q.id}', document.getElementById('noteInput_${q.id}').value)">Save Note</button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // Render Bookmarks
  if (bookmarksContainer) {
    if (bookmarks.length === 0) {
      bookmarksContainer.innerHTML = `<div class="empty-notice"><p>No bookmarked questions yet. Click ☆ Bookmark during practice to pin high-value questions here.</p></div>`;
    } else {
      bookmarksContainer.innerHTML = bookmarks.map(b => {
        const q = (window.APTITUDE_QUESTION_BANK || []).find(item => item.id === b.questionId);
        if (!q) return "";
        return `
          <div class="bookmark-card">
            <div class="bm-header">
              <span>⭐ ${escapeHTML(q.subject)}</span>
              <button type="button" class="text-btn" onclick="toggleBookmarkQuestion('${q.id}', '${q.topicId}')">Remove ✕</button>
            </div>
            <p>${escapeHTML(q.text)}</p>
            <div class="bm-solution">
              <strong>Answer:</strong> ${escapeHTML(q.options[q.correctIndex])}
            </div>
          </div>
        `;
      }).join("");
    }
  }
}

/* ====================================================================
   11. LEARNING PATHS TAB RENDERER
   ==================================================================== */

function renderLearningPathsTab() {
  const container = document.getElementById("learningPathsGrid");
  if (!container) return;

  const topics = window.APTITUDE_TOPICS || [];
  const state = getAptitudeState();
  const progress = state.progress || {};

  container.innerHTML = topics.map(t => {
    const prog = progress[t.id] || { completed: false, confidence: "medium", questionsPracticed: 0 };
    const isCompleted = Boolean(prog.completed);
    const confidence = prog.confidence || "medium";

    return `
      <div class="topic-learning-card ${isCompleted ? "completed" : ""}">
        <div class="tl-topbar">
          <span class="subject-tag">${escapeHTML(t.subject)}</span>
          <span class="badge badge-${t.difficulty.toLowerCase()}">${t.difficulty}</span>
        </div>
        <h4 class="tl-title">${escapeHTML(t.title)}</h4>
        <p class="tl-desc">${escapeHTML(t.description)}</p>
        <div class="tl-meta">
          <span>⏱️ ${t.estimatedMinutes}m</span>
          <span>Prereq: ${escapeHTML(t.prerequisites || "None")}</span>
        </div>
        <div class="tl-status-row">
          <div class="confidence-indicator ${confidence}">
            <span class="dot">●</span> ${confidence.toUpperCase()} CONFIDENCE
          </div>
          ${isCompleted ? '<span class="status-done">✓ Completed</span>' : '<span class="status-pending">○ In Progress</span>'}
        </div>
        <div class="tl-actions">
          <button type="button" class="primary-btn small-btn" onclick="openLessonModal('${t.id}')">
            Study Lesson →
          </button>
          <button type="button" class="secondary-btn small-btn" onclick="switchAptitudeTab('practice'); setPracticeFilterTopic('${t.id}')">
            Practice Qs
          </button>
        </div>
      </div>
    `;
  }).join("");
}

/* ====================================================================
   12. EXAM PROFILES TAB RENDERER
   ==================================================================== */

function renderExamProfilesTab() {
  const container = document.getElementById("examProfilesGrid");
  if (!container) return;

  const profiles = window.EXAM_PROFILES || [];

  container.innerHTML = profiles.map(p => `
    <div class="exam-profile-card">
      <div class="ep-header">
        <span class="ep-category">${escapeHTML(p.category)}</span>
        <span class="verified-badge official">✓ Pattern Verified</span>
      </div>
      <h3 class="ep-name">${escapeHTML(p.name)}</h3>
      <p class="ep-desc">${escapeHTML(p.description)}</p>

      <div class="ep-specs">
        <div class="spec-item">
          <strong>${p.totalQuestions}</strong>
          <span>Questions</span>
        </div>
        <div class="spec-item">
          <strong>${p.totalMinutes}m</strong>
          <span>Duration</span>
        </div>
        <div class="spec-item">
          <strong>${p.negativeMarking ? `-${p.negativePenalty}` : "None"}</strong>
          <span>Negative</span>
        </div>
        <div class="spec-item">
          <strong>${p.cutoffGoal}%</strong>
          <span>Target Cutoff</span>
        </div>
      </div>

      <div class="ep-sections">
        <strong>Sectional Distribution:</strong>
        <ul>
          ${p.sections.map(s => `
            <li>${escapeHTML(s.name)}: ${s.questions} Qs (${s.timeMin}m)</li>
          `).join("")}
        </ul>
      </div>

      <div class="ep-pattern-note">
        <small>Official Pattern: ${escapeHTML(p.verifiedPattern)}</small>
      </div>

      <button type="button" class="primary-btn full-btn" onclick="startMockTest('${p.id}')">
        Launch Timed Mock Test ⏱️
      </button>
    </div>
  `).join("");
}

/* ====================================================================
   13. TAB SWITCHING & INITIALIZATION
   ==================================================================== */

function switchAptitudeTab(tabId) {
  document.querySelectorAll(".aptitude-subtab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  document.querySelectorAll(".aptitude-subview").forEach(view => {
    view.classList.toggle("hidden", view.id !== `aptitudeTab_${tabId}`);
  });

  if (tabId === "learning") {
    renderLearningPathsTab();
  } else if (tabId === "practice") {
    loadPracticeQuestions();
  } else if (tabId === "mock") {
    // Show setup view by default
    document.getElementById("mockSetupView").classList.remove("hidden");
    document.getElementById("mockActiveTestView").classList.add("hidden");
    document.getElementById("mockResultView").classList.add("hidden");
  } else if (tabId === "performance") {
    renderPerformanceTab();
  } else if (tabId === "mistakes") {
    renderMistakesTab();
  } else if (tabId === "profiles") {
    renderExamProfilesTab();
  }
}

function initAptitudeAcademy() {
  // Populate Practice topic dropdown filter
  const topicFilterSel = document.getElementById("practiceTopicFilter");
  if (topicFilterSel) {
    topicFilterSel.innerHTML = '<option value="all">All Topics</option>' +
      (window.APTITUDE_TOPICS || []).map(t => `
        <option value="${t.id}">${escapeHTML(t.title)} (${escapeHTML(t.subject)})</option>
      `).join("");

    topicFilterSel.onchange = (e) => {
      activePracticeState.filterTopic = e.target.value;
      loadPracticeQuestions();
    };
  }

  // Populate Practice Subject filter
  const subjectFilterSel = document.getElementById("practiceSubjectFilter");
  if (subjectFilterSel) {
    subjectFilterSel.onchange = (e) => {
      activePracticeState.filterSubject = e.target.value;
      loadPracticeQuestions();
    };
  }

  // Populate Practice Difficulty filter
  const diffFilterSel = document.getElementById("practiceDifficultyFilter");
  if (diffFilterSel) {
    diffFilterSel.onchange = (e) => {
      activePracticeState.filterDifficulty = e.target.value;
      loadPracticeQuestions();
    };
  }

  // Practice buttons
  const checkBtn = document.getElementById("practiceCheckBtn");
  if (checkBtn) checkBtn.onclick = checkPracticeAnswer;

  const nextBtn = document.getElementById("practiceNextBtn");
  if (nextBtn) nextBtn.onclick = nextPracticeQuestion;

  // Subtab switching
  document.querySelectorAll(".aptitude-subtab-btn").forEach(btn => {
    btn.onclick = () => switchAptitudeTab(btn.dataset.tab);
  });

  // Mock test buttons
  const clearRespBtn = document.getElementById("mockClearResponseBtn");
  if (clearRespBtn) clearRespBtn.onclick = clearCurrentMockResponse;

  const reviewNextBtn = document.getElementById("mockReviewNextBtn");
  if (reviewNextBtn) reviewNextBtn.onclick = markForReviewAndNext;

  const saveNextBtn = document.getElementById("mockSaveNextBtn");
  if (saveNextBtn) saveNextBtn.onclick = saveAndNextMockQuestion;

  const submitTestBtn = document.getElementById("mockSubmitTestBtn");
  if (submitTestBtn) submitTestBtn.onclick = openSubmitConfirmationModal;

  const confirmSubmitBtn = document.getElementById("confirmMockSubmitBtn");
  if (confirmSubmitBtn) confirmSubmitBtn.onclick = () => submitMockTest(false);

  const cancelSubmitBtn = document.getElementById("cancelMockSubmitBtn");
  if (cancelSubmitBtn) cancelSubmitBtn.onclick = closeSubmitConfirmationModal;

  const prevMockBtn = document.getElementById("mockPrevBtn");
  if (prevMockBtn) prevMockBtn.onclick = () => {
    if (activeMockState.currentIndex > 0) {
      renderMockQuestion(activeMockState.currentIndex - 1);
    }
  };

  const returnSetupBtn = document.getElementById("resReturnToSetupBtn");
  if (returnSetupBtn) returnSetupBtn.onclick = () => switchAptitudeTab("mock");

  // Coach buttons
  const genPlanBtn = document.getElementById("coachGeneratePlanBtn");
  if (genPlanBtn) genPlanBtn.onclick = generateAptitudePlan;

  const targetDateInput = document.getElementById("coachTargetDateInput");
  if (targetDateInput) {
    targetDateInput.onchange = (e) => {
      const state = getAptitudeState();
      state.targetDate = e.target.value;
      saveAptitudeState(state);
      updateCountdownDisplay(state.targetDate);
    };
  }

  const targetExamSelect = document.getElementById("coachTargetExamSelect");
  if (targetExamSelect) {
    targetExamSelect.onchange = (e) => {
      const state = getAptitudeState();
      state.targetExam = e.target.value;
      saveAptitudeState(state);
    };
  }

  // Close Lesson modal
  const closeLessonBtn = document.getElementById("closeLessonModalBtn");
  if (closeLessonBtn) closeLessonBtn.onclick = closeLessonModal;

  // Render initial default subtab
  renderLearningPathsTab();
}

// Attach to window for global access
if (typeof window !== "undefined") {
  window.initAptitudeAcademy = initAptitudeAcademy;
  window.switchAptitudeTab = switchAptitudeTab;
  window.openLessonModal = openLessonModal;
  window.closeLessonModal = closeLessonModal;
  window.toggleTopicCompleted = toggleTopicCompleted;
  window.setTopicConfidence = setTopicConfidence;
  window.startMockTest = startMockTest;
  window.submitMockTest = submitMockTest;
  window.removeMistake = removeMistake;
  window.saveMistakeNote = saveMistakeNote;
  window.toggleBookmarkQuestion = toggleBookmarkQuestion;
  window.getAptitudeState = getAptitudeState;
  window.saveAptitudeState = saveAptitudeState;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getAptitudeState,
    saveAptitudeState,
    updateTopicProgress,
    startMockTest,
    submitMockTest,
    recordMistake
  };
}
