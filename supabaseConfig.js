/* ====================================================================
   STUDYBOT — Central Supabase Client & Cloud Synchronization Engine
   Uses official @supabase/supabase-js with Supabase Auth & RLS
   ==================================================================== */

// Central configuration constants
const DEFAULT_SUPABASE_URL = "https://myhlwiyvbhupxgzaxvdj.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_I6K48eurGXlTfvjRoUwGzg_huTlleDE";

const STORAGE_SUPABASE_CONFIG = "studybot_supabase_config";

let supabaseClient = null;

/**
 * Retrieve active Supabase URL and Publishable API key.
 * Only client-safe publishable keys (sb_publishable_ / anon) are allowed.
 */
function getSupabaseConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_SUPABASE_CONFIG) || "{}");
    return {
      url: (saved.url || DEFAULT_SUPABASE_URL).trim().replace(/\/$/, ""),
      publishableKey: (saved.publishableKey || saved.anonKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY).trim()
    };
  } catch (e) {
    return {
      url: DEFAULT_SUPABASE_URL,
      publishableKey: DEFAULT_SUPABASE_PUBLISHABLE_KEY
    };
  }
}

/**
 * Save user-configured Supabase connection parameters.
 */
function saveSupabaseConfig(url, publishableKey) {
  const cleanUrl = (url || "").trim().replace(/\/$/, "");
  const cleanKey = (publishableKey || "").trim();
  localStorage.setItem(
    STORAGE_SUPABASE_CONFIG,
    JSON.stringify({ url: cleanUrl, publishableKey: cleanKey })
  );
  initSupabaseClient(true);
}

/**
 * Check whether Supabase configuration is present.
 */
function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.publishableKey);
}

/**
 * Initialize official Supabase JavaScript Client.
 */
function initSupabaseClient(force = false) {
  if (supabaseClient && !force) return supabaseClient;

  const config = getSupabaseConfig();
  if (config.url && config.publishableKey && window.supabase && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      console.log("[Supabase] Official client initialized successfully:", config.url);
      return supabaseClient;
    } catch (err) {
      console.warn("[Supabase] Client initialization failed:", err);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return supabaseClient;
}


/* ====================================================================
   SUPABASE AUTHENTICATION ENGINE
   ==================================================================== */

/**
 * Sign up a new student account using Supabase Auth.
 */
async function authSignUp(name, email, password) {
  const client = initSupabaseClient();
  if (!client) {
    return { success: false, error: "Supabase client not initialized." };
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          name: name || "Student"
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = data.user;
    const session = data.session;
    // When Supabase email confirmations are enabled, session is null until verified
    const requiresConfirmation = Boolean(user && !session);

    return {
      success: true,
      user: user,
      session: session,
      requiresConfirmation: requiresConfirmation
    };
  } catch (err) {
    return { success: false, error: err.message || "Failed to sign up." };
  }
}

/**
 * Sign in existing student using Supabase Auth.
 */
async function authSignIn(email, password) {
  const client = initSupabaseClient();
  if (!client) {
    return { success: false, error: "Supabase client not initialized." };
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session
    };
  } catch (err) {
    return { success: false, error: err.message || "Failed to log in." };
  }
}

/**
 * Resend email verification link for unconfirmed accounts.
 */
async function authResendConfirmation(email) {
  const client = initSupabaseClient();
  if (!client) return { success: false, error: "Supabase client not initialized." };

  try {
    const { error } = await client.auth.resend({
      type: "signup",
      email: email.toLowerCase().trim()
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to resend confirmation." };
  }
}

/**
 * Sign out current student session.
 */
async function authSignOut() {
  const client = initSupabaseClient();
  if (!client) return { success: true };

  try {
    const { error } = await client.auth.signOut();
    if (error) console.warn("[Supabase] SignOut notice:", error.message);
    return { success: true };
  } catch (err) {
    console.warn("[Supabase] SignOut error:", err);
    return { success: true };
  }
}

/**
 * Get current authenticated session.
 */
async function authGetSession() {
  const client = initSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data) return null;
    return data.session;
  } catch (err) {
    return null;
  }
}

/**
 * Register auth state change listener.
 */
function authOnStateChange(callback) {
  const client = initSupabaseClient();
  if (!client) return null;

  try {
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  } catch (err) {
    console.warn("[Supabase] Failed to register auth state change listener:", err);
    return null;
  }
}


/* ====================================================================
   DATABASE CRUD & RLS DATA SYNCHRONIZATION
   ==================================================================== */

/**
 * Test Supabase connectivity and schema existence.
 */
async function testSupabaseConnection() {
  const client = initSupabaseClient(true);
  if (!client) {
    return { success: false, message: "Supabase URL or Publishable Key is missing." };
  }

  try {
    // Check if profiles table is accessible
    const { error } = await client.from("profiles").select("id").limit(1);
    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("relation")) {
        return {
          success: false,
          tableMissing: true,
          message: "Connected to Supabase, but the tables do not exist yet! Please run supabase_schema.sql in the Supabase SQL Editor."
        };
      }
      return { success: false, message: error.message || "Connection check returned an error." };
    }
    return { success: true, message: "Connected to Supabase successfully! Tables are ready." };
  } catch (err) {
    return { success: false, message: err.message || "Network error connecting to Supabase." };
  }
}

/**
 * Sync profile updates to public.profiles.
 */
async function syncProfile(profile) {
  const client = initSupabaseClient();
  if (!client) return null;

  const session = await authGetSession();
  if (!session || !session.user) return null;

  try {
    const payload = {
      id: session.user.id,
      email: session.user.email,
      name: profile.name || "Student",
      goal: profile.goal || "Build consistency",
      day_start: profile.dayStart || "06:00",
      day_end: profile.dayEnd || "22:30",
      custom_commitments: profile.customCommitments || [],
      avatar_url: profile.picture || "",
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("[Supabase] Profile sync warning:", error.message);
      updateCloudSyncUI("error");
    } else {
      updateCloudSyncUI("synced");
    }
  } catch (err) {
    console.warn("[Supabase] Profile sync error:", err);
  }
}

/**
 * Create a task in public.tasks.
 */
async function syncTaskCreate(task) {
  const client = initSupabaseClient();
  if (!client) return null;

  const session = await authGetSession();
  if (!session || !session.user) return null;

  try {
    const payload = {
      user_id: session.user.id,
      local_id: task.id,
      title: task.title,
      category: task.category || "Study",
      duration: task.duration || 25,
      deadline: task.deadline || null,
      energy: task.energy || "medium",
      important: Boolean(task.important),
      completed: Boolean(task.completed),
      completed_at: task.completedAt || null,
      created_at: task.createdAt || new Date().toISOString()
    };

    const { data, error } = await client
      .from("tasks")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn("[Supabase] Task create sync warning:", error.message);
      updateCloudSyncUI("error");
      return null;
    }
    updateCloudSyncUI("synced");
    return data;
  } catch (err) {
    console.warn("[Supabase] Task create sync error:", err);
    return null;
  }
}

/**
 * Update an existing task in public.tasks.
 */
async function syncTaskUpdate(localId, fields) {
  const client = initSupabaseClient();
  if (!client) return;

  const session = await authGetSession();
  if (!session || !session.user) return;

  try {
    const payload = {};
    if (fields.title !== undefined) payload.title = fields.title;
    if (fields.category !== undefined) payload.category = fields.category;
    if (fields.duration !== undefined) payload.duration = fields.duration;
    if (fields.deadline !== undefined) payload.deadline = fields.deadline || null;
    if (fields.energy !== undefined) payload.energy = fields.energy;
    if (fields.important !== undefined) payload.important = fields.important;
    if (fields.completed !== undefined) {
      payload.completed = fields.completed;
      payload.completed_at = fields.completed ? (fields.completedAt || new Date().toISOString()) : null;
    }

    const { error } = await client
      .from("tasks")
      .update(payload)
      .eq("local_id", localId);

    if (error) {
      console.warn("[Supabase] Task update sync warning:", error.message);
      updateCloudSyncUI("error");
    } else {
      updateCloudSyncUI("synced");
    }
  } catch (err) {
    console.warn("[Supabase] Task update sync error:", err);
  }
}

/**
 * Delete a task in public.tasks.
 */
async function syncTaskDelete(localId) {
  const client = initSupabaseClient();
  if (!client) return;

  const session = await authGetSession();
  if (!session || !session.user) return;

  try {
    const { error } = await client
      .from("tasks")
      .delete()
      .eq("local_id", localId);

    if (error) {
      console.warn("[Supabase] Task delete sync warning:", error.message);
      updateCloudSyncUI("error");
    } else {
      updateCloudSyncUI("synced");
    }
  } catch (err) {
    console.warn("[Supabase] Task delete sync error:", err);
  }
}

/**
 * Sync schedule block creation.
 */
async function syncScheduleCreate(schedule) {
  const client = initSupabaseClient();
  if (!client) return;

  const session = await authGetSession();
  if (!session || !session.user) return;

  try {
    const payload = {
      user_id: session.user.id,
      local_id: schedule.id,
      title: schedule.title,
      time: schedule.time,
      type: schedule.type || "Manual",
      created_at: schedule.createdAt || new Date().toISOString()
    };

    const { error } = await client.from("schedules").insert(payload);
    if (error) {
      console.warn("[Supabase] Schedule sync warning:", error.message);
      updateCloudSyncUI("error");
    } else {
      updateCloudSyncUI("synced");
    }
  } catch (err) {
    console.warn("[Supabase] Schedule sync error:", err);
  }
}

/**
 * Record a completed focus session in public.study_sessions.
 */
async function syncStudySession(durationMinutes, taskId = null) {
  const client = initSupabaseClient();
  if (!client) return;

  const session = await authGetSession();
  if (!session || !session.user) return;

  try {
    const payload = {
      user_id: session.user.id,
      duration_minutes: durationMinutes,
      session_date: new Date().toISOString().split("T")[0]
    };

    const { error } = await client.from("study_sessions").insert(payload);
    if (!error) {
      updateCloudSyncUI("synced");
    }
  } catch (err) {
    console.warn("[Supabase] Study session sync error:", err);
  }
}

/**
 * Pull all cloud data for authenticated user from Supabase.
 */
async function pullAllUserData() {
  const client = initSupabaseClient();
  if (!client) return null;

  const session = await authGetSession();
  if (!session || !session.user) return null;

  try {
    updateCloudSyncUI("syncing");

    // 1. Fetch Profile
    const profileReq = client
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    // 2. Fetch Tasks
    const tasksReq = client
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Fetch Schedules
    const schedulesReq = client
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: true });

    // 4. Fetch Study Sessions (last 30 days)
    const sessionsReq = client
      .from("study_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const [profileRes, tasksRes, schedulesRes, sessionsRes] = await Promise.all([
      profileReq,
      tasksReq,
      schedulesReq,
      sessionsRes = sessionsReq
    ]);

    if (profileRes.error) {
      console.warn("[Supabase] Error loading profile:", profileRes.error.message);
    }

    const cloudProfile = profileRes.data || {};
    const cloudTasks = (tasksRes.data || []).map(row => ({
      id: row.local_id || Date.now(),
      cloudId: row.id,
      title: row.title,
      category: row.category,
      duration: row.duration,
      deadline: row.deadline || "",
      energy: row.energy,
      important: row.important,
      completed: row.completed,
      completedAt: row.completed_at,
      createdAt: row.created_at
    }));

    const cloudSchedules = (schedulesRes.data || []).map(row => ({
      id: row.local_id || Date.now(),
      cloudId: row.id,
      title: row.title,
      time: row.time,
      type: row.type,
      createdAt: row.created_at
    }));

    // Calculate total focus minutes from study sessions
    const totalFocusMinutes = (sessionsRes.data || []).reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0
    );

    updateCloudSyncUI("synced");

    return {
      profile: {
        name: cloudProfile.name || session.user.user_metadata?.name || "Student",
        goal: cloudProfile.goal || "Build consistency",
        dayStart: cloudProfile.day_start || "06:00",
        dayEnd: cloudProfile.day_end || "22:30",
        customCommitments: cloudProfile.custom_commitments || [],
        picture: cloudProfile.avatar_url || ""
      },
      tasks: cloudTasks,
      schedules: cloudSchedules,
      focusMinutes: totalFocusMinutes
    };
  } catch (err) {
    console.warn("[Supabase] pullAllUserData error:", err);
    updateCloudSyncUI("error");
    return null;
  }
}

/**
 * Update sync status indicator badge in UI.
 */
function updateCloudSyncUI(status) {
  const badge = document.getElementById("cloudSyncStatus");
  if (!badge) return;

  if (status === "synced") {
    badge.innerHTML = "● Cloud Synced";
    badge.className = "cloud-status-badge synced";
  } else if (status === "syncing") {
    badge.innerHTML = "○ Syncing...";
    badge.className = "cloud-status-badge syncing";
  } else if (status === "error") {
    badge.innerHTML = "⚠ Cloud Offline";
    badge.className = "cloud-status-badge offline";
  } else {
    badge.innerHTML = "○ Local Mode";
    badge.className = "cloud-status-badge local";
  }
}

// Auto-initialize on script load
document.addEventListener("DOMContentLoaded", () => {
  initSupabaseClient();
});
