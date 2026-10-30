# STUDYBOT — Smart Student Productivity & AI Study Companion

STUDYBOT is a student productivity suite and AI study companion engineered for students across all colleges, majors, and academic levels. It combines smart workload scheduling, focus tracking, and an academic AI Tutor with an official Supabase cloud backend.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Python 3.14+ supported)
- **Node.js 18+** & npm (for Capacitor mobile build)
- Web browser (Chrome, Edge, Firefox, Safari)
- Free Supabase project at [supabase.com](https://supabase.com)

---

### 2. Supabase Cloud Backend Setup

STUDYBOT connects directly to Supabase using the official JavaScript client with **Supabase Auth** and strict **Row Level Security (RLS)**.

#### Step A: Run SQL Migrations
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **SQL Editor** in the left sidebar -> **New query**.
3. Copy and paste the entire SQL script from [`supabase_schema.sql`](file:///c:/Users/delgr/OneDrive/Studybot/supabase_schema.sql) (also shown below) and click **Run**:

```sql
-- 1. PROFILES TABLE (Linked 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT DEFAULT 'Student',
    goal TEXT DEFAULT 'Build consistency',
    day_start TEXT DEFAULT '06:00',
    day_end TEXT DEFAULT '22:30',
    custom_commitments JSONB DEFAULT '[]'::jsonb,
    avatar_url TEXT DEFAULT '',
    streak INTEGER DEFAULT 0,
    focus_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TASKS TABLE (Individual records per student task)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id BIGINT,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Study',
    duration INTEGER DEFAULT 25,
    deadline DATE,
    energy TEXT DEFAULT 'medium',
    important BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SCHEDULES TABLE (Fixed routine & manual schedule blocks)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id BIGINT,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT DEFAULT 'Manual',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. STUDY SESSIONS TABLE (Deep work & focus tracking history)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    session_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- 6. STRICT OWNER-ONLY POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own schedules" ON public.schedules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own schedules" ON public.schedules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON public.schedules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON public.schedules FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study sessions" ON public.study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. AUTOMATIC PROFILE TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'Student'))
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id, session_date);
```

#### Step B: Email Confirmation Settings
- Go to Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**.
- **For instant testing without email links**: Toggle **"Confirm email"** to **OFF**. Students will log in immediately upon signup.
- **For production verification**: Keep **"Confirm email"** ON. Students must verify the link sent to their email before their initial login.

#### Step C: Central Frontend Configuration
Your project URL and publishable key are configured in [`supabaseConfig.js`](file:///c:/Users/delgr/OneDrive/Studybot/supabaseConfig.js):
```javascript
const DEFAULT_SUPABASE_URL = "https://your-project.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
```
*Note: Only publishable API keys (`sb_publishable_...`) are permitted on the frontend. Never expose secret or `service_role` keys.*

---

### 3. Backend Setup (AI Tutor Engine)

The backend runs a Flask server that provides AI tutoring endpoints, workload advice, and health monitoring.

1. Configure environment:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Add your Google Gemini API key to `backend/.env`:
   ```env
   PORT=5000
   HOST=127.0.0.1
   GEMINI_API_KEY=your_gemini_api_key_here
   AI_MODEL=gemini-2.5-flash
   ```
   > 💡 Free Gemini key at: [Google AI Studio](https://aistudio.google.com/app/apikey).
   > If no key is set, the app runs in safe diagnostic mode with honest offline indicators without crashing.

3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Run the Python backend:
   ```bash
   python backend/app.py
   ```
   *Runs on `http://127.0.0.1:5000`.*

---

### 4. Frontend Web App Setup

1. Start a local web server:
   ```bash
   python -m http.server 8000
   ```
2. Open `http://127.0.0.1:8000` in your web browser.

---

### 5. Running Automated Tests

Run the test suite verifying Supabase integration, security, and backend APIs:
```bash
python tests/test_stage1.py
python tests/test_supabase_integration.py
```

---

## 🔒 Security & Privacy Architecture

1. **Official Supabase Auth & JWT Sessions**:
   - Secure login, signup, and persistent token refresh handled by Supabase.
   - Client session stored securely in browser `localStorage` under Supabase Auth's managed namespace.
2. **Row Level Security (RLS)**:
   - Every row in `profiles`, `tasks`, `schedules`, and `study_sessions` is bounded by `auth.uid() = user_id`.
   - Students cannot read or mutate data belonging to other students.
3. **Server-Side AI API Key Protection**:
   - Gemini API keys are kept strictly on the Python backend (`backend/.env`) and never exposed to the frontend.
4. **Offline Resilience**:
   - If network connection drops, actions continue functioning locally and sync back to Supabase once reconnected.

---

## 📱 Mobile App (Android / Capacitor)

Build and sync static web assets into Capacitor:
```bash
npm run build
npx cap sync android
```
To generate the APK:
```bash
npm run build:apk
```

---

## 📂 Project Structure

```text
Studybot/
├── index.html                  # Core application view & layout
├── style.css                   # Modern dark-mode student design system
├── script.js                   # Application logic, data store, timetable engine
├── supabase.js                 # Official Supabase JavaScript client bundle
├── supabaseConfig.js           # Supabase Auth & Cloud CRUD synchronization layer
├── supabase_schema.sql         # Production RLS database migrations & triggers
├── package.json                # Node & Capacitor build scripts
├── backend/
│   ├── app.py                  # Flask server with AI tutor and advice endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variable template
│   └── .env                    # Local secrets (Gemini API key)
└── tests/
    ├── test_stage1.py          # Stage 1 unit & backend tests
    └── test_supabase_integration.py # Supabase integration & RLS test suite
```
