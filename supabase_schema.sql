-- ====================================================================
-- STUDYBOT PRODUCTION DATABASE SCHEMA (Supabase Auth + RLS)
-- Run this script in your Supabase Dashboard:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

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

-- 5. ENABLE ROW LEVEL SECURITY (RLS) ON ALL USER TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- 6. STRICT ROW LEVEL SECURITY POLICIES (OWNER-ONLY ACCESS)

-- Drop any previous policies to ensure clean idempotent migrations
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Tasks Policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Schedules Policies
DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can create own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;

CREATE POLICY "Users can view own schedules" ON public.schedules
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own schedules" ON public.schedules
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON public.schedules
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON public.schedules
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Study Sessions Policies
DROP POLICY IF EXISTS "Users can view own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can insert own study sessions" ON public.study_sessions;

CREATE POLICY "Users can view own study sessions" ON public.study_sessions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON public.study_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', 'Student')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id, session_date);

-- ============================================================================
-- 9. APTITUDE ACADEMY & COMPETITIVE EXAM TABLES
-- ============================================================================

-- Aptitude Topic Progress & Confidence Tracking
CREATE TABLE IF NOT EXISTS public.aptitude_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic_id text NOT NULL,
    confidence_level text DEFAULT 'medium', -- 'low', 'medium', 'high'
    completed boolean DEFAULT false,
    questions_practiced integer DEFAULT 0,
    questions_correct integer DEFAULT 0,
    total_time_seconds integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, topic_id)
);

-- Timed Mock Test Attempts & Score Reports
CREATE TABLE IF NOT EXISTS public.mock_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    exam_profile_id text NOT NULL,
    exam_name text NOT NULL,
    total_questions integer NOT NULL,
    attempted integer NOT NULL,
    correct integer NOT NULL,
    incorrect integer NOT NULL,
    score numeric(6,2) NOT NULL,
    max_score numeric(6,2) NOT NULL,
    accuracy numeric(5,2) NOT NULL,
    time_taken_seconds integer NOT NULL,
    section_breakdown jsonb DEFAULT '{}'::jsonb,
    topic_breakdown jsonb DEFAULT '{}'::jsonb,
    detailed_responses jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Personal Mistake Notebook for Spaced Revision
CREATE TABLE IF NOT EXISTS public.mistake_notebook (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id text NOT NULL,
    topic_id text NOT NULL,
    selected_option integer,
    correct_option integer,
    user_note text DEFAULT '',
    reviewed boolean DEFAULT false,
    mastery_streak integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, question_id)
);

-- Bookmarked Questions
CREATE TABLE IF NOT EXISTS public.aptitude_bookmarks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id text NOT NULL,
    topic_id text NOT NULL,
    note text DEFAULT '',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, question_id)
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) FOR APTITUDE TABLES
-- ============================================================================
ALTER TABLE public.aptitude_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_bookmarks ENABLE ROW LEVEL SECURITY;

-- Aptitude Progress Policies
DROP POLICY IF EXISTS "Users can view own aptitude progress" ON public.aptitude_progress;
DROP POLICY IF EXISTS "Users can insert own aptitude progress" ON public.aptitude_progress;
DROP POLICY IF EXISTS "Users can update own aptitude progress" ON public.aptitude_progress;
DROP POLICY IF EXISTS "Users can delete own aptitude progress" ON public.aptitude_progress;

CREATE POLICY "Users can view own aptitude progress" ON public.aptitude_progress
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own aptitude progress" ON public.aptitude_progress
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own aptitude progress" ON public.aptitude_progress
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own aptitude progress" ON public.aptitude_progress
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mock Attempts Policies
DROP POLICY IF EXISTS "Users can view own mock attempts" ON public.mock_attempts;
DROP POLICY IF EXISTS "Users can insert own mock attempts" ON public.mock_attempts;
DROP POLICY IF EXISTS "Users can delete own mock attempts" ON public.mock_attempts;

CREATE POLICY "Users can view own mock attempts" ON public.mock_attempts
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock attempts" ON public.mock_attempts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mock attempts" ON public.mock_attempts
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mistake Notebook Policies
DROP POLICY IF EXISTS "Users can view own mistake notebook" ON public.mistake_notebook;
DROP POLICY IF EXISTS "Users can insert own mistake notebook" ON public.mistake_notebook;
DROP POLICY IF EXISTS "Users can update own mistake notebook" ON public.mistake_notebook;
DROP POLICY IF EXISTS "Users can delete own mistake notebook" ON public.mistake_notebook;

CREATE POLICY "Users can view own mistake notebook" ON public.mistake_notebook
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistake notebook" ON public.mistake_notebook
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mistake notebook" ON public.mistake_notebook
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mistake notebook" ON public.mistake_notebook
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Bookmarks Policies
DROP POLICY IF EXISTS "Users can view own aptitude bookmarks" ON public.aptitude_bookmarks;
DROP POLICY IF EXISTS "Users can insert own aptitude bookmarks" ON public.aptitude_bookmarks;
DROP POLICY IF EXISTS "Users can delete own aptitude bookmarks" ON public.aptitude_bookmarks;

CREATE POLICY "Users can view own aptitude bookmarks" ON public.aptitude_bookmarks
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own aptitude bookmarks" ON public.aptitude_bookmarks
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own aptitude bookmarks" ON public.aptitude_bookmarks
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes for Aptitude Tables
CREATE INDEX IF NOT EXISTS idx_aptitude_progress_user ON public.aptitude_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON public.mock_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mistake_notebook_user ON public.mistake_notebook(user_id);
CREATE INDEX IF NOT EXISTS idx_aptitude_bookmarks_user ON public.aptitude_bookmarks(user_id);

