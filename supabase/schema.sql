-- ====================================================================
-- DAILY HABITS TRACKER - POSTGRESQL SCHEMA SCRIPT
-- ====================================================================
-- This file defines the tables, foreign keys, unique constraints,
-- automatic triggers, and Row-Level Security (RLS) policies.
-- Run this script in your Supabase SQL Editor to set up your database!

-- -------------------------------------------------------------
-- 1. Create Profiles Table (Linked to Supabase Auth)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  username TEXT
);

-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. Create Habits Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Health, Work, Mind, Finance, Social, Routine, Creative, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 3. Create Habit Logs Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('completed', 'skipped', 'failed')) NOT NULL,
  date DATE NOT NULL,
  UNIQUE (habit_id, date)
);

-- Enable Row-Level Security
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 4. Row-Level Security Policies (isolation of user data)
-- -------------------------------------------------------------

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Habits Policies (All CRUD operations bound to auth.uid())
DROP POLICY IF EXISTS "Users can view their own habits" ON public.habits;
CREATE POLICY "Users can view their own habits" 
  ON public.habits FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
CREATE POLICY "Users can insert their own habits" 
  ON public.habits FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits" 
  ON public.habits FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits" 
  ON public.habits FOR DELETE 
  USING (auth.uid() = user_id);

-- Habit Logs Policies (Require that the referenced habit belongs to authenticated user)
DROP POLICY IF EXISTS "Users can view logs of their own habits" ON public.habit_logs;
CREATE POLICY "Users can view logs of their own habits" 
  ON public.habit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h 
      WHERE h.id = habit_logs.habit_id 
      AND h.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert logs for their own habits" ON public.habit_logs;
CREATE POLICY "Users can insert logs for their own habits" 
  ON public.habit_logs FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits h 
      WHERE h.id = habit_logs.habit_id 
      AND h.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update logs of their own habits" ON public.habit_logs;
CREATE POLICY "Users can update logs of their own habits" 
  ON public.habit_logs FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h 
      WHERE h.id = habit_logs.habit_id 
      AND h.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete logs of their own habits" ON public.habit_logs;
CREATE POLICY "Users can delete logs of their own habits" 
  ON public.habit_logs FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h 
      WHERE h.id = habit_logs.habit_id 
      AND h.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- 5. Automate Profile Creation Trigger (Sign Up Hook)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove duplicate trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
