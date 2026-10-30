/* =========================================================
   STUDYBOT
   Smart Student Companion
   ========================================================= */

const STORAGE_USERS = "studybot_users";
const STORAGE_SESSION = "studybot_session";

let currentUser = null;
let currentDay = "today";
let currentFilter = "all";

let timerSeconds = 25 * 60;
let timerRunning = false;
let timerInterval = null;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}

// Cryptographic password hashing (SHA-256 with per-user salt)
async function hashPassword(password, email) {
  try {
    const salt = "studybot_salt_" + (email || "").toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ":" + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.warn("Crypto API fallback:", err);
    // Basic fallback if crypto.subtle is unavailable in legacy browser environment
    let hash = 0;
    const str = password + ":" + email;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return "legacy_hash_" + Math.abs(hash).toString(16);
  }
}

// Task overdue check helper
function isTaskOverdue(task) {
  if (!task || task.completed || !task.deadline) return false;
  return task.deadline < todayKey();
}

// Backend AI Tutor configuration & health state
const BACKEND_URL = "http://127.0.0.1:5000";

let backendStatus = {
  online: false,
  aiConfigured: false,
  model: "gemini-2.5-flash"
};

async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const info = await res.json();
      backendStatus = {
        online: true,
        aiConfigured: Boolean(info.ai_configured),
        model: info.model || "gemini-2.5-flash"
      };
      updateAIStatusUI();
      return backendStatus;
    }
  } catch (e) {
    backendStatus = { online: false, aiConfigured: false, model: "" };
  }
  updateAIStatusUI();
  return backendStatus;
}

function updateAIStatusUI() {
  const badge = $("aiStatusBadge");
  if (!badge) return;

  if (backendStatus.online && backendStatus.aiConfigured) {
    badge.innerHTML = "● AI Tutor Ready";
    badge.className = "cloud-status-badge synced";
    badge.title = `Connected to Gemini (${backendStatus.model})`;
  } else if (backendStatus.online && !backendStatus.aiConfigured) {
    badge.innerHTML = "◐ AI Backend (No Key)";
    badge.className = "cloud-status-badge syncing";
    badge.title = "Backend is running, but AI key is missing in backend/.env";
  } else {
    badge.innerHTML = "○ AI Offline";
    badge.className = "cloud-status-badge offline";
    badge.title = "Start the Python backend (python backend/app.py) to enable AI tutoring";
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function userKey() {
  return currentUser ? currentUser.email : "";
}

function getData() {

  if (!currentUser) return null;

  const key = `studybot_data_${userKey()}`;

  const defaultData = {
    profile: {
      name: currentUser.name || "Student",
      goal: "Build consistency",
      dayStart: "06:00",
      dayEnd: "22:30",
      college: true,
      basketball: false,
      ncc: false,
      picture: ""
    },

    tasks: [],

    schedules: [],

    generated: {
      today: [],
      tomorrow: []
    },

    focusMinutes: 0,

    streak: 0,

    dailyHistory: {},

    settings: {
      autoPlanning: true,
      reminders: false,
      gentle: false
    },

    feedback: []
  };

  const saved = JSON.parse(localStorage.getItem(key) || "null");

  if (!saved) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }

  return {
    ...defaultData,
    ...saved,
    profile: {
      ...defaultData.profile,
      ...(saved.profile || {})
    },
    settings: {
      ...defaultData.settings,
      ...(saved.settings || {})
    }
  };
}

function saveData(data) {

  if (!currentUser) return;

  const key = `studybot_data_${userKey()}`;

  localStorage.setItem(key, JSON.stringify(data));

  // Sync to Supabase cloud if configured
  if (typeof syncDataToSupabase === "function" && typeof isSupabaseConfigured === "function" && isSupabaseConfigured()) {
    updateCloudSyncUI("syncing");
    syncDataToSupabase(userKey(), data);
  }
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date) {

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatTime(time) {

  if (!time) return "";

  const [hour, minute] = time.split(":").map(Number);

  const suffix = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function showToast(message) {

  $("toastMessage").textContent = message;

  $("toast").classList.add("show");

  setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2600);
}


/* =========================================================
   AUTH
   ========================================================= */

function showLogin() {

  $("loginPanel").classList.remove("hidden");
  $("signupPanel").classList.add("hidden");
}

function showSignup() {

  $("signupPanel").classList.remove("hidden");
  $("loginPanel").classList.add("hidden");
}

$("showSignup").addEventListener("click", showSignup);

$("showLogin").addEventListener("click", showLogin);


document.querySelectorAll(".password-toggle").forEach(button => {

  button.addEventListener("click", () => {

    const target = $(button.dataset.target);

    if (target.type === "password") {
      target.type = "text";
      button.textContent = "Hide";
    } else {
      target.type = "password";
      button.textContent = "Show";
    }

  });

});


$("signupForm").addEventListener("submit", async event => {

  event.preventDefault();

  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;

  if (password.length < 6) {
    showToast("Password must be at least 6 characters.");
    return;
  }

  showToast("Creating account...");

  // 1. Try Supabase Auth
  if (typeof authSignUp === "function" && isSupabaseConfigured()) {
    const res = await authSignUp(name, email, password);
    if (!res.success) {
      // If network failure, fall through to local mode; otherwise display Supabase error
      if (!res.error.includes("Failed to fetch") && !res.error.includes("Network")) {
        showToast(res.error);
        return;
      }
    } else {
      if (res.requiresConfirmation) {
        showToast("Account created! Please check your email to verify before logging in ✉️");
        showLogin();
        return;
      }

      if (res.user) {
        currentUser = {
          name: name || "Student",
          email: res.user.email || email,
          id: res.user.id
        };
        sessionStorage.setItem(STORAGE_SESSION, email);

        const data = getData();
        data.profile.name = name || "Student";
        saveData(data);

        if (typeof syncProfile === "function") {
          await syncProfile(data.profile);
        }

        showApp();
        showToast("Welcome to STUDYBOT!");
        return;
      }
    }
  }

  // 2. Local Fallback (Offline Mode)
  const hashedPassword = await hashPassword(password, email);
  const users = getUsers();

  if (users[email]) {
    showToast("Account already exists.");
    return;
  }

  users[email] = {
    name,
    email,
    password: hashedPassword
  };

  saveUsers(users);

  sessionStorage.setItem(
    STORAGE_SESSION,
    email
  );

  currentUser = users[email];
  getData();
  showApp();
  showToast("Account created (Local Mode)!");

});


$("loginForm").addEventListener("submit", async event => {

  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  showToast("Signing in...");

  // 1. Try Supabase Auth
  if (typeof authSignIn === "function" && isSupabaseConfigured()) {
    const res = await authSignIn(email, password);
    if (res.success && res.user) {
      const userMetaName = res.user.user_metadata?.name || "Student";
      currentUser = {
        name: userMetaName,
        email: res.user.email || email,
        id: res.user.id
      };
      sessionStorage.setItem(STORAGE_SESSION, email);

      showApp();
      showToast("Welcome back!");
      return;
    } else if (res.error && !res.error.includes("Failed to fetch") && !res.error.includes("Network")) {
      if (res.error.toLowerCase().includes("email not confirmed")) {
        showToast("Email not confirmed yet! Check your inbox or click 'Confirm user' in Supabase Dashboard.");
      } else {
        showToast(res.error);
      }
      return;
    }
  }

  // 2. Local Fallback (Offline Mode)
  const hashedPassword = await hashPassword(password, email);
  const users = getUsers();

  if (!users[email]) {
    showToast("Account not found. Please check your credentials.");
    return;
  }

  const user = users[email];
  const isMatch = (user.password === hashedPassword) || (user.password === password);

  if (!isMatch) {
    showToast("Incorrect password.");
    return;
  }

  // Transparently upgrade legacy plaintext password to secure hash
  if (user.password === password) {
    user.password = hashedPassword;
    saveUsers(users);
  }

  currentUser = user;
  sessionStorage.setItem(STORAGE_SESSION, email);

  showApp();
  showToast("Welcome back (Local Mode)!");

});


$("logoutBtn").addEventListener("click", async () => {

  if (typeof authSignOut === "function") {
    await authSignOut();
  }

  sessionStorage.removeItem(STORAGE_SESSION);
  currentUser = null;

  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");

  showLogin();
  showToast("Logged out successfully.");

});


async function checkSession() {

  // 1. Check official Supabase Auth persistent JWT session
  if (typeof authGetSession === "function" && isSupabaseConfigured()) {
    const session = await authGetSession();
    if (session && session.user) {
      currentUser = {
        name: session.user.user_metadata?.name || "Student",
        email: session.user.email,
        id: session.user.id
      };
      sessionStorage.setItem(STORAGE_SESSION, session.user.email);
      showApp();
      return;
    }
  }

  // 2. Fallback to local session
  const email = sessionStorage.getItem(STORAGE_SESSION);
  if (!email) return;

  const users = getUsers();
  if (!users[email]) return;

  currentUser = users[email];
  showApp();

}

// Register real-time Supabase Auth state change listener
if (typeof authOnStateChange === "function") {
  authOnStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      currentUser = null;
      sessionStorage.removeItem(STORAGE_SESSION);
      $("appScreen").classList.add("hidden");
      $("authScreen").classList.remove("hidden");
    } else if (event === "SIGNED_IN" && session && session.user) {
      if (!currentUser) {
        currentUser = {
          name: session.user.user_metadata?.name || "Student",
          email: session.user.email,
          id: session.user.id
        };
        sessionStorage.setItem(STORAGE_SESSION, session.user.email);
        showApp();
      }
    }
  });
}


/* =========================================================
   APP START
   ========================================================= */

async function showApp() {

  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  renderEverything();

  // If Supabase is configured, pull full cloud data for authenticated user
  if (typeof pullAllUserData === "function" && isSupabaseConfigured() && currentUser) {
    try {
      const cloudData = await pullAllUserData();
      if (cloudData) {
        const key = `studybot_data_${userKey()}`;
        const localData = JSON.parse(localStorage.getItem(key) || "{}");

        // Detect any local tasks not yet stored in Supabase and upload them
        const cloudLocalIds = new Set((cloudData.tasks || []).map(t => t.id));
        const unsyncedLocal = (localData.tasks || []).filter(t => !cloudLocalIds.has(t.id));

        if (unsyncedLocal.length > 0 && typeof syncTaskCreate === "function") {
          for (const task of unsyncedLocal) {
            await syncTaskCreate(task);
          }
        }

        const merged = {
          ...localData,
          profile: { ...(localData.profile || {}), ...(cloudData.profile || {}) },
          tasks: [...(cloudData.tasks || []), ...unsyncedLocal],
          schedules: cloudData.schedules && cloudData.schedules.length ? cloudData.schedules : (localData.schedules || []),
          focusMinutes: Math.max(localData.focusMinutes || 0, cloudData.focusMinutes || 0)
        };

        localStorage.setItem(key, JSON.stringify(merged));
        renderEverything();
        updateCloudSyncUI("synced");
      }
    } catch (err) {
      console.warn("[Supabase] Data synchronization notice:", err);
      updateCloudSyncUI("error");
    }
  } else {
    updateCloudSyncUI("local");
  }

}


/* =========================================================
   NAVIGATION
   ========================================================= */

document.querySelectorAll(".nav-item").forEach(button => {

  button.addEventListener("click", () => {

    openSection(button.dataset.section);

    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    $("sidebar").classList?.remove("mobile-open");

  });

});


document.querySelectorAll("[data-section-target]").forEach(button => {

  button.addEventListener("click", () => {

    openSection(button.dataset.sectionTarget);

    document.querySelectorAll(".nav-item").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.section === button.dataset.sectionTarget
      );

    });

  });

});


function openSection(section) {

  document.querySelectorAll(".page-section").forEach(page => {
    page.classList.remove("active-section");
  });

  const target = $(`${section}Section`);

  if (target) {
    target.classList.add("active-section");
    if (section === "aptitude" && typeof initAptitudeAcademy === "function") {
      initAptitudeAcademy();
    }
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


$("mobileMenuBtn").addEventListener("click", () => {

  const sidebar = document.querySelector(".sidebar");

  sidebar.classList.toggle("mobile-open");

});


/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile() {

  const data = getData();

  if (!data) return;

  $("profileName").value = data.profile.name;
  $("profileGoal").value = data.profile.goal;

  $("dayStart").value = data.profile.dayStart;
  $("dayEnd").value = data.profile.dayEnd;

  $("collegeToggle").checked = data.profile.college;
  $("basketballToggle").checked = data.profile.basketball;
  $("nccToggle").checked = data.profile.ncc;

  renderAvatar();

}


function renderAvatar() {

  const data = getData();

  if (!data) return;

  const name = data.profile.name || "Student";

  const letter = name.charAt(0).toUpperCase();

  const sideAvatar = $("sidebarAvatar");
  const profileAvatar = $("profileAvatar");

  if (data.profile.picture) {

    sideAvatar.innerHTML =
      `<img src="${data.profile.picture}" alt="Profile">`;

    profileAvatar.innerHTML =
      `<img src="${data.profile.picture}" alt="Profile">`;

  } else {

    sideAvatar.textContent = letter;
    profileAvatar.textContent = letter;

  }

  $("sidebarName").textContent = name;

  $("sidebarGoal").textContent =
    data.profile.goal || "Build consistency";

}


$("saveProfileBtn").addEventListener("click", () => {

  const data = getData();

  data.profile.name =
    $("profileName").value.trim() || "Student";

  data.profile.goal =
    $("profileGoal").value.trim() || "Build consistency";

  data.profile.dayStart =
    $("dayStart").value;

  data.profile.dayEnd =
    $("dayEnd").value;

  data.profile.college =
    $("collegeToggle").checked;

  data.profile.basketball =
    $("basketballToggle").checked;

  data.profile.ncc =
    $("nccToggle").checked;

  saveData(data);

  currentUser.name = data.profile.name;

  const users = getUsers();

  users[currentUser.email] = currentUser;

  saveUsers(users);

  // Sync profile directly to Supabase cloud
  if (typeof syncProfile === "function" && isSupabaseConfigured()) {
    syncProfile(data.profile);
  }

  renderEverything();

  showToast("Profile saved.");

});


$("profilePictureInput").addEventListener("change", event => {

  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    const data = getData();

    data.profile.picture = reader.result;

    saveData(data);

    renderAvatar();

    showToast("Profile picture updated.");

  };

  reader.readAsDataURL(file);

});


/* =========================================================
   TASKS
   ========================================================= */

$("taskForm").addEventListener("submit", event => {

  event.preventDefault();

  const data = getData();

  const task = {

    id: Date.now(),

    title: $("taskTitle").value.trim(),

    category: $("taskCategory").value,

    duration: Number($("taskDuration").value),

    deadline: $("taskDeadline").value,

    energy: $("taskEnergy").value,

    important: $("taskImportant").checked,

    completed: false,

    createdAt: new Date().toISOString(),

    completedAt: null

  };

  if (!task.title) {
    showToast("Enter a task name.");
    return;
  }

  data.tasks.push(task);

  saveData(data);

  // Sync new task to Supabase cloud
  if (typeof syncTaskCreate === "function" && isSupabaseConfigured()) {
    syncTaskCreate(task);
  }

  $("taskForm").reset();

  renderEverything();

  showToast("Task added.");

});


function toggleTask(id) {

  const data = getData();

  const task = data.tasks.find(item => item.id === id);

  if (!task) return;

  task.completed = !task.completed;

  task.completedAt =
    task.completed ? new Date().toISOString() : null;

  updateHistory(data);

  saveData(data);

  // Sync task completion status to Supabase cloud
  if (typeof syncTaskUpdate === "function" && isSupabaseConfigured()) {
    syncTaskUpdate(id, {
      completed: task.completed,
      completedAt: task.completedAt
    });
  }

  renderEverything();

  if (task.completed) {
    showToast("Nice! One more task completed.");
  }

}


function deleteTask(id) {

  const data = getData();

  data.tasks = data.tasks.filter(
    task => task.id !== id
  );

  saveData(data);

  // Sync deletion to Supabase cloud
  if (typeof syncTaskDelete === "function" && isSupabaseConfigured()) {
    syncTaskDelete(id);
  }

  renderEverything();

  showToast("Task removed.");

}


function renderPlannerTasks() {

  const data = getData();

  const container = $("plannerTaskList");

  const pending =
    data.tasks.filter(task => !task.completed);

  $("pendingCount").textContent = pending.length;

  if (!pending.length) {

    container.innerHTML = `
      <div class="empty-state">
        No pending tasks. Add something you want to accomplish.
      </div>
    `;

    return;
  }

  container.innerHTML = pending.map(task => `

    <div class="task-item">

      <div
        class="task-check"
        onclick="toggleTask(${task.id})"
      >
        ${task.completed ? "✓" : ""}
      </div>

      <div class="task-info">

        <h4>${escapeHTML(task.title)}</h4>

        <p>
          ${task.category}
          · ${task.duration} min
          ${task.deadline ? `· Due ${task.deadline}` : ""}
        </p>

      </div>

      ${isTaskOverdue(task)
        ? `<span class="task-badge overdue">Overdue</span>`
        : task.important
          ? `<span class="task-badge important">Important</span>`
          : ""
      }

      <button
        class="task-delete"
        onclick="deleteTask(${task.id})"
      >
        ×
      </button>

    </div>

  `).join("");

}


function renderAllTasks() {

  const data = getData();

  let tasks = [...data.tasks];

  if (currentFilter === "pending") {
    tasks = tasks.filter(task => !task.completed);
  }

  if (currentFilter === "overdue") {
    tasks = tasks.filter(task => isTaskOverdue(task));
  }

  if (currentFilter === "completed") {
    tasks = tasks.filter(task => task.completed);
  }

  if (!tasks.length) {

    $("allTasksList").innerHTML = `
      <div class="empty-state">
        Nothing here yet.
      </div>
    `;

    return;
  }

  $("allTasksList").innerHTML = tasks.map(task => `

    <div class="task-item">

      <div
        class="task-check ${task.completed ? "completed" : ""}"
        onclick="toggleTask(${task.id})"
      >
        ${task.completed ? "✓" : ""}
      </div>

      <div class="task-info">

        <h4 style="${task.completed ? "text-decoration:line-through;opacity:.5" : ""}">
          ${escapeHTML(task.title)}
        </h4>

        <p>
          ${task.category}
          · ${task.duration} min
          ${task.deadline ? `· Due ${task.deadline}` : ""}
        </p>

      </div>

      ${isTaskOverdue(task)
        ? `<span class="task-badge overdue">Overdue</span>`
        : task.important
          ? `<span class="task-badge important">Important</span>`
          : ""
      }

      <button
        class="task-delete"
        onclick="deleteTask(${task.id})"
      >
        ×
      </button>

    </div>

  `).join("");

}


document.querySelectorAll(".filter-btn").forEach(button => {

  button.addEventListener("click", () => {

    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter-btn").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    renderAllTasks();

  });

});


/* =========================================================
   SMART TIMETABLE
   ========================================================= */

function getDayName(offset = 0) {

  const date = new Date();

  date.setDate(
    date.getDate() + offset
  );

  return date.getDay();

}


function buildFixedBlocks(offset) {

  const data = getData();

  const blocks = [];

  const day = getDayName(offset);

  /*
    Sunday = 0
    Monday = 1
    Tuesday = 2
    Wednesday = 3
    Thursday = 4
    Friday = 5
    Saturday = 6
  */

  if (
    data.profile.college &&
    day >= 1 &&
    day <= 5
  ) {

    blocks.push({
      time: "08:00",
      end: "16:00",
      title: "College / Classes",
      type: "Fixed"
    });

  }


  if (
    data.profile.basketball &&
    (day === 2 || day === 4)
  ) {

    blocks.push({
      time: "16:00",
      end: "17:00",
      title: "Basketball",
      type: "Fitness"
    });

  }


  if (
    data.profile.ncc &&
    (day === 3 || day === 6)
  ) {

    blocks.push({
      time: "16:00",
      end: "19:00",
      title: "NCC",
      type: "Commitment"
    });

  }

  // Support user-defined custom commitments for any student/course
  if (Array.isArray(data.profile.customCommitments)) {
    data.profile.customCommitments.forEach(item => {
      if (item && item.enabled !== false && Array.isArray(item.days) && item.days.includes(day)) {
        blocks.push({
          time: item.start || "09:00",
          end: item.end || "11:00",
          title: item.title || "Classes",
          type: item.type || "Fixed"
        });
      }
    });
  }

  return blocks;

}


function timeToMinutes(time) {

  const [h, m] =
    time.split(":").map(Number);

  return h * 60 + m;

}


function minutesToTime(total) {

  total = Math.max(0, Math.round(total));

  const h = Math.floor(total / 60) % 24;
  const m = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

}


function buildSmartPlan(offset = 0) {

  const data = getData();

  const fixedBlocks = buildFixedBlocks(offset);

  const pendingTasks =
    data.tasks
      .filter(task => !task.completed)
      .sort((a, b) => {

        if (a.important !== b.important) {
          return a.important ? -1 : 1;
        }

        if (a.deadline && b.deadline) {
          return a.deadline.localeCompare(b.deadline);
        }

        if (a.deadline) return -1;

        if (b.deadline) return 1;

        return 0;

      });


  const result = [...fixedBlocks];

  let cursor =
    timeToMinutes(data.profile.dayStart || "06:00");

  const endOfDay =
    timeToMinutes(data.profile.dayEnd || "22:30");


  for (const task of pendingTasks) {

    let duration =
      Math.min(task.duration || 25, 120);

    let placed = false;

    while (
      cursor + duration <= endOfDay
    ) {

      const candidateStart = cursor;
      const candidateEnd = cursor + duration;

      const conflict =
        fixedBlocks.some(block => {

          const blockStart =
            timeToMinutes(block.time);

          const blockEnd =
            timeToMinutes(block.end);

          return (
            candidateStart < blockEnd &&
            candidateEnd > blockStart
          );

        });


      if (!conflict) {

        result.push({

          time: minutesToTime(candidateStart),

          end: minutesToTime(candidateEnd),

          title: task.title,

          type: task.category,

          taskId: task.id,

          duration: duration

        });

        cursor = candidateEnd + 10;

        placed = true;

        break;

      }

      cursor += 15;

    }

    if (!placed) {
      break;
    }

  }


  result.sort((a, b) =>
    timeToMinutes(a.time) -
    timeToMinutes(b.time)
  );

  return result;

}


function generatePlan() {

  const data = getData();

  data.generated.today =
    buildSmartPlan(0);

  data.generated.tomorrow =
    buildSmartPlan(1);

  saveData(data);

  renderEverything();

  showToast("Your timetable has been rebuilt ✦");

}


$("generatePlanBtn").addEventListener(
  "click",
  generatePlan
);

$("generateDashboardBtn").addEventListener(
  "click",
  generatePlan
);

$("regenerateBtn").addEventListener(
  "click",
  generatePlan
);


function renderTimetable() {

  const data = getData();

  const blocks =
    currentDay === "today"
      ? data.generated.today
      : data.generated.tomorrow;

  if (!blocks.length) {

    $("timetableList").innerHTML = `
      <div class="empty-state">
        Click "Generate Timetable" to create your plan.
      </div>
    `;

    return;

  }


  $("timetableList").innerHTML =
    blocks.map(block => `

      <div class="time-block">

        <div class="time-block-time">
          ${formatTime(block.time)}
        </div>

        <div>

          <div class="time-block-title">
            ${escapeHTML(block.title)}
          </div>

          <div class="time-block-meta">
            ${formatTime(block.time)}
            →
            ${formatTime(block.end)}
            ${block.duration ? ` · ${block.duration} min` : ""}
          </div>

        </div>

        <div class="time-block-type">
          ${escapeHTML(block.type || "")}
        </div>

      </div>

    `).join("");

  renderQuickSchedule(blocks);

}


document.querySelectorAll(".day-tab").forEach(button => {

  button.addEventListener("click", () => {

    currentDay = button.dataset.day;

    document.querySelectorAll(".day-tab").forEach(tab => {
      tab.classList.remove("active");
    });

    button.classList.add("active");

    renderTimetable();

  });

});


/* =========================================================
   MANUAL SCHEDULE
   ========================================================= */

$("scheduleForm").addEventListener("submit", event => {

  event.preventDefault();

  const data = getData();

  const newSchedule = {
    id: Date.now(),
    title: $("scheduleTitle").value.trim(),
    time: $("scheduleTime").value,
    createdAt: new Date().toISOString()
  };

  data.schedules.push(newSchedule);

  saveData(data);

  // Sync schedule block to Supabase cloud
  if (typeof syncScheduleCreate === "function" && isSupabaseConfigured()) {
    syncScheduleCreate(newSchedule);
  }

  $("scheduleForm").reset();

  renderEverything();

  showToast("Schedule block added.");

});


function renderQuickSchedule(blocks = null) {

  const data = getData();

  const generated =
    blocks || data.generated.today;

  const manual =
    data.schedules.map(item => ({
      time: item.time,
      end: "",
      title: item.title,
      type: "Manual"
    }));

  const all = [
    ...generated,
    ...manual
  ].sort((a, b) =>
    timeToMinutes(a.time) -
    timeToMinutes(b.time)
  );

  const selected = all.slice(0, 5);

  if (!selected.length) {

    $("quickScheduleList").innerHTML = `
      <div class="empty-state">
        No schedule yet.
      </div>
    `;

    return;

  }

  $("quickScheduleList").innerHTML =
    selected.map(item => `

      <div class="schedule-item">

        <div class="schedule-time">
          ${formatTime(item.time)}
        </div>

        <div class="schedule-title">
          ${escapeHTML(item.title)}
        </div>

        <div class="schedule-type">
          ${escapeHTML(item.type || "")}
        </div>

      </div>

    `).join("");

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function getTodayStats() {

  const data = getData();

  const total = data.tasks.length;

  const completed =
    data.tasks.filter(task => task.completed).length;

  const pending =
    data.tasks.filter(task => !task.completed).length;

  const overdue =
    data.tasks.filter(task => isTaskOverdue(task)).length;

  const todayDue =
    data.tasks.filter(task => !task.completed && task.deadline === todayKey()).length;

  const percentage =
    total
      ? Math.round((completed / total) * 100)
      : 0;

  return {
    total,
    completed,
    pending,
    overdue,
    todayDue,
    percentage
  };

}


function renderDashboard() {

  const data = getData();

  if (!data) return;

  const now = new Date();

  const hour = now.getHours();

  let greeting = "Good morning.";

  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon.";
  }

  if (hour >= 17) {
    greeting = "Good evening.";
  }

  if (hour >= 22) {
    greeting = "Time to slow down.";
  }

  $("dashboardGreeting").textContent =
    `${greeting} ${data.profile.name.split(" ")[0]}.`;

  $("currentDate").textContent =
    formatDate(now);

  const stats =
    getTodayStats();

  $("todayTaskCount").textContent =
    stats.total;

  $("todayCompletedCount").textContent =
    stats.completed;

  $("todayPercent").textContent =
    `${stats.percentage}%`;

  $("focusMinutes").textContent =
    `${data.focusMinutes}m`;

  $("streakCount").textContent =
    data.streak;

  $("missionTitle").textContent =
    stats.total === 0
      ? "Start with one small task."
      : stats.percentage === 100
        ? "You finished everything."
        : "Make progress, not a perfect timetable.";

  $("missionText").textContent =
    stats.total === 0
      ? "Add your workload. STUDYBOT will help decide what comes first."
      : stats.percentage === 100
        ? "Your planned work is complete. Use the extra time to rest or learn something new."
        : "Don't wait for motivation. Follow the next action and keep moving.";

  renderNextAction();

}


function renderNextAction() {

  const data = getData();

  const task =
    data.tasks.find(item => !item.completed);

  if (!task) {

    $("nextActionCategory").textContent =
      "All clear";

    $("nextActionTitle").textContent =
      "No pending task";

    $("nextActionMeta").textContent =
      "Add another goal or enjoy your free time.";

    return;

  }

  $("nextActionCategory").textContent =
    task.category;

  $("nextActionTitle").textContent =
    task.title;

  $("nextActionMeta").textContent =
    `${task.duration} min · ${task.energy} energy${task.important ? " · important" : ""}`;

  $("focusTaskTitle").textContent =
    task.title;

}


$("doNowBtn").addEventListener("click", () => {

  const data = getData();

  const task =
    data.tasks.find(item => !item.completed);

  if (!task) {

    openSection("planner");

    showToast("Add a task first.");

    return;

  }

  $("focusTaskTitle").textContent =
    task.title;

  openSection("focus");

  showToast("Focus Mode ready.");

});


$("rescueBtn").addEventListener("click", () => {

  const data = getData();

  const pending =
    data.tasks
      .filter(task => !task.completed)
      .sort((a, b) => {

        if (a.important !== b.important) {
          return a.important ? -1 : 1;
        }

        return a.duration - b.duration;

      });

  if (!pending.length) {

    showToast("Nothing to rescue. You're clear!");

    return;

  }

  const first =
    pending[0];

  data.tasks =
    data.tasks.map(task => ({
      ...task,
      rescue: task.id === first.id
    }));

  saveData(data);

  $("focusTaskTitle").textContent =
    first.title;

  openSection("focus");

  showToast(`Rescue Mode: ${first.title}`);

});


/* =========================================================
   FOCUS TIMER
   ========================================================= */

function renderTimer() {

  const minutes =
    Math.floor(timerSeconds / 60);

  const seconds =
    timerSeconds % 60;

  $("timerDisplay").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


$("startTimerBtn").addEventListener("click", () => {

  if (timerRunning) {

    timerRunning = false;

    clearInterval(timerInterval);

    $("startTimerBtn").textContent =
      "Resume Focus";

    return;

  }

  timerRunning = true;

  $("startTimerBtn").textContent =
    "Pause";

  timerInterval =
    setInterval(() => {

      timerSeconds--;

      renderTimer();

      if (timerSeconds <= 0) {

        clearInterval(timerInterval);

        timerRunning = false;

        timerSeconds = 25 * 60;

        $("startTimerBtn").textContent =
          "Start Focus";

        const data = getData();

        data.focusMinutes += 25;

        saveData(data);

        // Record focus session in Supabase study_sessions
        if (typeof syncStudySession === "function" && isSupabaseConfigured()) {
          syncStudySession(25);
        }

        renderDashboard();

        showToast("Focus session complete! 🎉");

      }

    }, 1000);

});


$("resetTimerBtn").addEventListener("click", () => {

  clearInterval(timerInterval);

  timerRunning = false;

  timerSeconds = 25 * 60;

  $("startTimerBtn").textContent =
    "Start Focus";

  renderTimer();

});


/* =========================================================
   PROGRESS
   ========================================================= */

function updateHistory(data) {

  const key = todayKey();

  const completed =
    data.tasks.filter(task => {

      if (!task.completedAt) return false;

      return task.completedAt.startsWith(key);

    }).length;

  data.dailyHistory[key] = completed;

}


function calculateStreak(data) {

  let streak = 0;

  const date = new Date();

  for (let i = 0; i < 365; i++) {

    const key =
      date.toISOString().split("T")[0];

    const count =
      data.dailyHistory[key] || 0;

    if (count > 0) {

      streak++;

      date.setDate(
        date.getDate() - 1
      );

    } else {

      break;

    }

  }

  return streak;

}


function renderProgress() {

  const data = getData();

  updateHistory(data);

  data.streak =
    calculateStreak(data);

  saveData(data);

  const stats =
    getTodayStats();

  $("progressPercent").textContent =
    `${stats.percentage}%`;

  $("progressBar").style.width =
    `${stats.percentage}%`;

  $("progressStreak").textContent =
    `${data.streak} day${data.streak === 1 ? "" : "s"}`;

  $("progressMessage").textContent =
    stats.percentage === 0
      ? "Start with one task."
      : stats.percentage < 50
        ? "You're moving. Keep going."
        : stats.percentage < 100
          ? "You're more than halfway there."
          : "Excellent. You completed everything planned.";

  renderWeeklyChart();

}


function renderWeeklyChart() {

  const data = getData();

  const container =
    $("weeklyChart");

  const days = [];

  for (let i = 6; i >= 0; i--) {

    const date = new Date();

    date.setDate(
      date.getDate() - i
    );

    const key =
      date.toISOString().split("T")[0];

    const label =
      date.toLocaleDateString(
        "en-IN",
        { weekday: "short" }
      );

    days.push({
      label,
      count: data.dailyHistory[key] || 0
    });

  }

  const max =
    Math.max(
      1,
      ...days.map(day => day.count)
    );

  container.innerHTML =
    days.map(day => {

      const height =
        Math.max(
          5,
          (day.count / max) * 100
        );

      return `

        <div class="chart-column">

          <div class="chart-bar-wrapper">

            <div
              class="chart-bar"
              style="height:${height}%"
              title="${day.count} completed"
            ></div>

          </div>

          <span class="chart-day">
            ${day.label}
          </span>

        </div>

      `;

    }).join("");

}


/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {

  const data = getData();

  $("autoPlanningToggle").checked =
    data.settings.autoPlanning;

  $("reminderToggle").checked =
    data.settings.reminders;

  $("gentleToggle").checked =
    data.settings.gentle;

  // Render Supabase settings
  if (typeof getSupabaseConfig === "function") {
    const config = getSupabaseConfig();
    if ($("supabaseUrlInput") && !$("supabaseUrlInput").value) {
      $("supabaseUrlInput").value = config.url || "";
    }
    if ($("supabaseKeyInput") && !$("supabaseKeyInput").value) {
      $("supabaseKeyInput").value = config.anonKey || "";
    }
    const isConfigured = Boolean(config.url && config.anonKey);
    const badge = $("supabaseStatusBadge");
    if (badge) {
      badge.textContent = isConfigured ? "● Cloud Configured" : "○ Local Mode";
      badge.className = `cloud-status-badge ${isConfigured ? "synced" : "local"}`;
    }
  }

}


$("autoPlanningToggle").addEventListener("change", event => {

  const data = getData();

  data.settings.autoPlanning =
    event.target.checked;

  saveData(data);

});


$("gentleToggle").addEventListener("change", event => {

  const data = getData();

  data.settings.gentle =
    event.target.checked;

  saveData(data);

});


$("reminderToggle").addEventListener("change", async event => {

  const data = getData();

  if (
    event.target.checked &&
    "Notification" in window
  ) {

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {

      event.target.checked = false;

      showToast(
        "Browser notifications were not allowed."
      );

      return;

    }

    showToast("Browser reminders enabled.");

  }

  data.settings.reminders =
    event.target.checked;

  saveData(data);

});


$("clearDataBtn").addEventListener("click", () => {

  const confirmed =
    confirm(
      "Clear all tasks, schedules and generated plans?"
    );

  if (!confirmed) return;

  const data = getData();

  data.tasks = [];
  data.schedules = [];
  data.generated = {
    today: [],
    tomorrow: []
  };

  saveData(data);

  renderEverything();

  showToast("Planner data cleared.");

});


/* =========================================================
   SUPABASE SETTINGS ACTIONS
   ========================================================= */

if ($("saveSupabaseBtn")) {
  $("saveSupabaseBtn").addEventListener("click", async () => {
    const url = $("supabaseUrlInput").value.trim();
    const key = $("supabaseKeyInput").value.trim();
    if (!url || !key) {
      showToast("Please enter Supabase URL and Anon Key.");
      return;
    }
    if (typeof saveSupabaseConfig === "function") {
      saveSupabaseConfig(url, key);
      showToast("Supabase configuration saved!");
    }
    const msg = $("supabaseFeedbackMsg");
    if (msg) {
      msg.classList.remove("hidden");
      msg.className = "supabase-msg";
      msg.textContent = "Connecting to Supabase...";
    }
    if (typeof testSupabaseConnection === "function") {
      const res = await testSupabaseConnection();
      if (msg) {
        if (res.success) {
          msg.className = "supabase-msg success";
          msg.textContent = `✓ ${res.message}`;
          showToast("Connected to Supabase! 🟢");
          if (currentUser) {
            syncDataToSupabase(userKey(), getData());
          }
        } else {
          msg.className = "supabase-msg error";
          msg.textContent = `⚠ ${res.message}`;
          showToast("Supabase connection issue");
        }
      }
    }
    renderSettings();
  });
}

if ($("testSupabaseBtn")) {
  $("testSupabaseBtn").addEventListener("click", async () => {
    const msg = $("supabaseFeedbackMsg");
    if (msg) {
      msg.classList.remove("hidden");
      msg.className = "supabase-msg";
      msg.textContent = "Testing connection...";
    }
    if (typeof testSupabaseConnection === "function") {
      const res = await testSupabaseConnection();
      if (msg) {
        if (res.success) {
          msg.className = "supabase-msg success";
          msg.textContent = `✓ ${res.message}`;
          showToast("Connection successful! 🟢");
        } else {
          msg.className = "supabase-msg error";
          msg.textContent = `⚠ ${res.message}`;
          showToast("Connection failed.");
        }
      }
    }
  });
}

if ($("syncNowBtn")) {
  $("syncNowBtn").addEventListener("click", async () => {
    if (!currentUser) {
      showToast("Please log in first to sync data.");
      return;
    }
    if (typeof isSupabaseConfigured === "function" && !isSupabaseConfigured()) {
      showToast("Please configure Supabase URL and Key first.");
      return;
    }
    showToast("Syncing data with Supabase...");
    updateCloudSyncUI("syncing");
    if (typeof pullAllUserData === "function") {
      try {
        const cloudData = await pullAllUserData();
        if (cloudData) {
          const key = `studybot_data_${userKey()}`;
          const localData = JSON.parse(localStorage.getItem(key) || "{}");
          const cloudLocalIds = new Set((cloudData.tasks || []).map(t => t.id));
          const unsyncedLocal = (localData.tasks || []).filter(t => !cloudLocalIds.has(t.id));

          if (unsyncedLocal.length > 0 && typeof syncTaskCreate === "function") {
            for (const task of unsyncedLocal) {
              await syncTaskCreate(task);
            }
          }

          const merged = {
            ...localData,
            profile: { ...(localData.profile || {}), ...(cloudData.profile || {}) },
            tasks: [...(cloudData.tasks || []), ...unsyncedLocal],
            schedules: cloudData.schedules && cloudData.schedules.length ? cloudData.schedules : (localData.schedules || []),
            focusMinutes: Math.max(localData.focusMinutes || 0, cloudData.focusMinutes || 0)
          };
          localStorage.setItem(key, JSON.stringify(merged));
          renderEverything();
          showToast("Synced to Supabase cloud! ☁️");
        }
      } catch (e) {
        showToast("Sync error. Please check connection.");
      }
    }
  });
}


/* =========================================================
   FEEDBACK
   ========================================================= */

$("feedbackForm").addEventListener("submit", event => {

  event.preventDefault();

  const text =
    $("feedbackText").value.trim();

  if (!text) return;

  const data = getData();

  data.feedback.push({

    text,

    date:
      new Date().toISOString()

  });

  saveData(data);

  $("feedbackText").value = "";

  showToast("Thanks for the feedback ❤️");

});


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

  if (!currentUser) return;

  renderProfile();

  renderDashboard();

  renderPlannerTasks();

  renderAllTasks();

  renderTimetable();

  renderProgress();

  renderSettings();

  renderTimer();

  checkBackendHealth();

  if (typeof initAptitudeAcademy === "function") {
    initAptitudeAcademy();
  }

}


/* =========================================================
   INITIALIZE
   ========================================================= */

checkSession();
checkBackendHealth();

// Periodic backend health ping every 30 seconds
setInterval(() => {
  if (currentUser) {
    checkBackendHealth();
  }
}, 30000);