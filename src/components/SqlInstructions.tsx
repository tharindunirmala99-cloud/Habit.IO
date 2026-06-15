/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Database, Key, Shield, HelpCircle } from 'lucide-react';

const SQL_SCHEMA_CODE = `-- ====================================================================
-- DAILY HABITS TRACKER - POSTGRESQL SCHEMA SCRIPT
-- ====================================================================
-- Run this script in your Supabase SQL Editor to set up your database!

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  username TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- 3. Create Habit Logs Table (With unique constraint on same day check-in)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('completed', 'skipped', 'failed')) NOT NULL,
  date DATE NOT NULL,
  UNIQUE (habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Row-Level Security Policies (RLS)
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can do all operations on their own habits" 
  ON public.habits FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can do all operations on their own logs" 
  ON public.habit_logs FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.habits h 
      WHERE h.id = habit_logs.habit_id 
      AND h.user_id = auth.uid()
    )
  );

-- 5. Automatic Profile Creator Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

export default function SqlInstructions() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="sql-instructions-container" className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-sm p-6 overflow-hidden">
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-zinc-805">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-950/35 text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-semibold text-zinc-100">Database SQL Schema</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Complete PostgreSQL architecture script including tables, triggers, and Row-Level Security (RLS) policies.
          </p>
        </div>
        <button
          id="btn-copy-sql-schema"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-indigo-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy SQL</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 font-sans">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-1">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>1. Create Schema</span>
          </div>
          Open the SQL Editor inside your Supabase project dashboard, paste this script, and click "Run".
        </div>

        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 font-sans">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. Security & RLS</span>
          </div>
          All user policies are pre-configured to lock data access. Users only read/edit their personal records.
        </div>

        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 font-sans">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>3. Automations</span>
          </div>
          An authentication trigger is included to automatically link profiles when a new user signs up.
        </div>
      </div>

      <div className="relative">
        <pre className="text-[10px] sm:text-xs font-mono text-zinc-300 w-full bg-zinc-950 rounded-xl p-4 overflow-x-auto max-h-[220px] scrollbar-thin scrollbar-thumb-zinc-800">
          <code>{SQL_SCHEMA_CODE}</code>
        </pre>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none rounded-b-xl" />
      </div>
    </div>
  );
}
