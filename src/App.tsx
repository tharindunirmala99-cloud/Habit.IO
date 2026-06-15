/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  LogOut, 
  Database, 
  LayoutDashboard, 
  BarChart3, 
  Flame, 
  HelpCircle,
  Brain,
  Zap,
  Info
} from 'lucide-react';

import { trackerService } from './lib/trackerService';
import { getHabitsWithAnalytics } from './lib/analytics';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { Habit, HabitLog, HabitWithAnalytics, HabitCategory, LogStatus, TrackerUser } from './types';

import AuthScreen from './components/AuthScreen';
import StatsGrid from './components/StatsGrid';
import HabitCard from './components/HabitCard';
import HabitModal from './components/HabitModal';
import SqlInstructions from './components/SqlInstructions';

// Computed static helpers
const getWeekDays = (): Date[] => {
  const now = new Date();
  const day = now.getDay();
  // If today is Sunday (0), shift to prev Monday. Otherwise, find starting Monday (1)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<TrackerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'database'>('dashboard');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<HabitWithAnalytics | null>(null);
  
  // Week days array
  const weekDays = getWeekDays();

  // Load user session on startup and subscribe to Supabase auth state changes
  useEffect(() => {
    async function loadSession() {
      try {
        const user = await trackerService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();

    // Keep session in sync with Supabase auth state (handles token refresh, sign-out, etc.)
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        if (session) {
          const user = await trackerService.getCurrentUser();
          if (user) setCurrentUser(user);
          setLoading(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Fetch User's habits and logs whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setHabits([]);
      setLogs([]);
      return;
    }

    async function loadUserData() {
      setLoading(true);
      try {
        const habitsList = await trackerService.getHabits();
        setHabits(habitsList);

        if (habitsList.length > 0) {
          const habitIds = habitsList.map(h => h.id);
          const logsList = await trackerService.getLogs(habitIds);
          setLogs(logsList);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error('Data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [currentUser]);

  // Merge habits with historical analytics
  const habitsWithAnalytics: HabitWithAnalytics[] = getHabitsWithAnalytics(habits, logs);

  // Stats aggregate computations
  const bestStreak = habitsWithAnalytics.length > 0 ? Math.max(...habitsWithAnalytics.map(h => h.currentStreak)) : 0;
  const avgCompletion = habitsWithAnalytics.length > 0 
    ? Math.round(habitsWithAnalytics.reduce((acc, curr) => acc + curr.completionRate, 0) / habitsWithAnalytics.length) 
    : 0;

  // Handles updating or deleting a day check-off status
  const handleLogChange = async (habitId: string, dateStr: string, status: LogStatus | null) => {
    try {
      if (status === null) {
        // Unmarked -> Delete the log from DB
        await trackerService.deleteLog(habitId, dateStr);
        setLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.date === dateStr)));
      } else {
        // Save/Upsert log entry
        const savedLog = await trackerService.saveLog(habitId, status, dateStr);
        setLogs(prev => {
          const filtered = prev.filter(l => !(l.habit_id === habitId && l.date === dateStr));
          return [...filtered, savedLog];
        });
      }
    } catch (err) {
      console.error('Log cycle update failed:', err);
    }
  };

  // Handles creating a brand new habit or applying updates
  const handleSaveHabit = async (name: string, description: string, category: HabitCategory, editId?: string) => {
    try {
      if (editId) {
        // Edit Operation
        const updated = await trackerService.updateHabit(editId, { name, description, category });
        setHabits(prev => prev.map(h => h.id === editId ? updated : h));
      } else {
        // Create Operation
        const created = await trackerService.createHabit(name, description, category);
        setHabits(prev => [created, ...prev]);
      }
      setShowModal(false);
      setHabitToEdit(null);
    } catch (err) {
      console.error('Saving habit failed:', err);
    }
  };

  // Handles trigger for delete
  const handleDeleteHabit = async (habitId: string) => {
    try {
      await trackerService.deleteHabit(habitId);
      setHabits(prev => prev.filter(h => h.id !== habitId));
      setLogs(prev => prev.filter(l => l.habit_id !== habitId));
    } catch (err) {
      console.error('Delete habit error:', err);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await trackerService.signOut();
      setCurrentUser(null);
      setHabits([]);
      setLogs([]);
    } catch (err) {
      console.error('Log out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render initial loader block
  if (loading && !currentUser) {
    return (
      <div id="loader-view-screen" className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <h3 className="text-sm font-bold tracking-tight font-display">Daily Habit Sync</h3>
        <p className="text-xs text-zinc-400 mt-1">Synchronizing files and session states...</p>
      </div>
    );
  }

  // Render auth screen when logged out
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center py-12 px-4 selection:bg-indigo-950/40">
        <AuthScreen onSuccess={(user) => setCurrentUser(user)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-50 font-sans selection:bg-indigo-950/40 pb-12">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 bg-[#121214]/80 backdrop-blur-md border-b border-zinc-800/80 z-40 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-900/30">
              <Zap className="w-4 h-4 fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-zinc-50 tracking-tight text-sm font-display">HABIT.IO</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/40">
                  v1.2
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium">Empower Your Routines</p>
            </div>
          </div>

          {/* Quick tab controls */}
          <nav className="hidden sm:flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              id="nav-btn-dashboard"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeView === 'dashboard' 
                  ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-btn-analytics"
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeView === 'analytics' 
                  ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Metrics</span>
            </button>

          </nav>

          {/* Connected User Profile Controls & Sign out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-xs font-semibold text-zinc-200 block">@{currentUser.username}</span>
              <span className="text-[10px] text-zinc-500 block">{currentUser.email}</span>
            </div>
            
            <button
              id="btn-global-logout"
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 bg-zinc-900/80 hover:bg-rose-950/20 text-zinc-400 hover:text-rose-400 rounded-xl border border-zinc-800 hover:border-rose-900/30 transition-colors flex items-center gap-1.5"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* Mobile Navigation bar tab switches */}
        <div className="flex sm:hidden items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full">
          <button
            id="mobile-nav-dashboard"
            onClick={() => setActiveView('dashboard')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeView === 'dashboard' ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' : 'text-zinc-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            id="mobile-nav-analytics"
            onClick={() => setActiveView('analytics')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeView === 'analytics' ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' : 'text-zinc-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Metrics</span>
          </button>
          <button
            id="mobile-nav-database"
            onClick={() => setActiveView('database')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeView === 'database' ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' : 'text-zinc-400'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL</span>
          </button>
        </div>


        {/* Action Header bar: Title, Current streak display, + Add habit button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-50 tracking-tight font-display">
              {activeView === 'dashboard' && 'Routine Dashboard'}
              {activeView === 'analytics' && 'Analytics Insights'}
              {activeView === 'database' && 'Cloud Schema Integration'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {activeView === 'dashboard' && 'Record and check-off daily efforts. Complete actions to fuel your active streaks.'}
              {activeView === 'analytics' && 'Detailed habits performance audits, active logs numbers, and categories comparison.'}
              {activeView === 'database' && 'Instructions to register and connect your PostgreSQL with auth Row-Level Security.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {habits.length > 0 && (
              <div className="px-3.5 py-2 bg-orange-950/20 border border-orange-900/40 text-orange-400 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm">
                <Flame className="w-4 h-4 fill-orange-500" />
                <span>Top Streak: {bestStreak}d</span>
              </div>
            )}

            <button
              id="btn-global-add-habit"
              onClick={() => {
                setHabitToEdit(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-[#fafafa] hover:bg-zinc-200 text-[#09090b] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-1.5 font-sans"
            >
              <Plus className="w-4 h-4" />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {/* View Routing Panes */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 1. Statistics Cards Bento Row */}
            <StatsGrid habits={habitsWithAnalytics} />

            {/* 2. Primary List of Habits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Your Habits</h4>
                <span className="text-xxs font-bold text-zinc-400 font-mono">{habits.length} Habits Tracked</span>
              </div>

              {habits.length === 0 ? (
                /* Empty state */
                <div id="habits-empty-state" className="bg-[#121214] border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 my-4">
                  <div className="inline-flex p-4 bg-indigo-950/40 text-indigo-400 rounded-full">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-150 font-display">No active habits found</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Transform your goals into manageable daily rituals. Launch your first habit now!
                    </p>
                  </div>
                  <button
                    id="btn-empty-state-add"
                    onClick={() => {
                      setHabitToEdit(null);
                      setShowModal(true);
                    }}
                    className="px-4 py-2 bg-[#fafafa] hover:bg-zinc-200 text-[#09090b] text-xs font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Create First Habit
                  </button>
                </div>
              ) : (
                /* Cards list */
                <div className="grid grid-cols-1 gap-4">
                  {habitsWithAnalytics.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      weekDays={weekDays}
                      onLogChange={(hId: string, dStr: string, stat: any) => { handleLogChange(hId, dStr, stat); }}
                      onEdit={(h) => {
                        setHabitToEdit(h);
                        setShowModal(true);
                      }}
                      onDelete={(hId: string) => { handleDeleteHabit(hId); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <StatsGrid habits={habitsWithAnalytics} />

            <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
              <h3 className="font-bold text-sm sm:text-base text-zinc-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <span className="font-display">Habits Productivity Audit</span>
              </h3>
              
              {habits.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Create habits to access rich performance auditing records.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xxs font-bold text-zinc-400 uppercase tracking-widest font-mono">
                        <th className="py-3 px-4">Habit Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Active Streak</th>
                        <th className="py-3 px-4">Peak Streak</th>
                        <th className="py-3 px-4">Total Check-Ins</th>
                        <th className="py-3 px-4 text-right">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                      {habitsWithAnalytics.map(habit => {
                        const totalTicks = Object.values(habit.logs).filter(s => s === 'completed').length;
                        
                        // Category badge mapping helper
                        const getCatBadgeClass = (cat: HabitCategory) => {
                          switch (cat) {
                            case 'Mind': return 'bg-violet-950/30 text-violet-400 border-violet-900/35';
                            case 'Health': return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/35';
                            case 'Work': return 'bg-blue-950/30 text-blue-400 border-blue-900/35';
                            case 'Finance': return 'bg-rose-950/30 text-rose-400 border-rose-900/35';
                            case 'Creative': return 'bg-purple-950/30 text-purple-400 border-purple-900/35';
                            case 'Social': return 'bg-cyan-950/30 text-cyan-400 border-cyan-900/35';
                            default: return 'bg-zinc-900 text-zinc-300 border-zinc-800';
                          }
                        };

                        return (
                          <tr key={habit.id} className="border-b border-zinc-900 last:border-0 hover:bg-zinc-800/20 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-zinc-100 font-sans">{habit.name}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-0.5 text-xxs font-bold rounded-md border ${getCatBadgeClass(habit.category)}`}>
                                {habit.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-orange-400">{habit.currentStreak} days</td>
                            <td className="py-3.5 px-4 font-medium text-zinc-400">{habit.longestStreak} days</td>
                            <td className="py-3.5 px-4 text-zinc-500">{totalTicks} logs</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`inline-block px-2.5 py-0.5 text-xxs font-extrabold rounded-md border ${
                                habit.completionRate >= 80 ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/35' :
                                habit.completionRate >= 40 ? 'bg-amber-950/30 text-amber-400 border-amber-900/35' :
                                'bg-rose-950/30 text-rose-400 border-rose-900/35'
                              }`}>
                                {habit.completionRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database setup instructions view */}
        {activeView === 'database' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* 1. Postgres schema Copy component */}
            <SqlInstructions />

            {/* 2. Detailed environment configuration steps card */}
            <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span className="font-display">Integration Guide: Setup Supabase in 2 Minutes</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Follow these fast steps to connect your React client applet with the cloud secure storage stack.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-350">
                <div className="space-y-2 p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h4 className="font-bold text-zinc-100">Generate Tables</h4>
                  <p className="leading-relaxed text-zinc-400">
                    Paste the SQL script copied from the card above into the Supabase SQL editor and press Run. This creates tables for profiles, habits, and logs with matching foreign keys.
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h4 className="font-bold text-zinc-100">Enable Auth Policies</h4>
                  <p className="leading-relaxed text-zinc-400">
                    The schema includes deep Row-Level Security policies. It binds user searches and additions directly to <code className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-1 rounded text-[10px]">auth.uid()</code>, keeping records private.
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <h4 className="font-bold text-zinc-100">Paste Env Keys</h4>
                  <p className="leading-relaxed text-zinc-400">
                    Get your Supabase Project API keys, then find the <strong>Secrets Settings Panel</strong> in your AI Studio editor. Add:
                    <br />
                    <code className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-1 rounded text-[9.5px] block font-semibold mt-1">VITE_SUPABASE_URL</code>
                    <code className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-1 rounded text-[9.5px] block font-semibold mt-0.5">VITE_SUPABASE_ANON_KEY</code>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/20 border border-indigo-900/35 rounded-2xl text-xs text-indigo-300 flex gap-3.5 items-start">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-indigo-200">What happens next?</h5>
                  <p className="leading-relaxed text-indigo-300/85">
                    Once those two variables are read, <strong>HABIT.IO</strong> will immediately shut down its local demo mode and boot the live Supabase Client! New users can register, sign in from anywhere, and enjoy cloud-backed streaks tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Global Habit Modal (Edit or Create Form) */}
      {showModal && (
        <HabitModal
          habitToEdit={habitToEdit}
          onSave={handleSaveHabit}
          onClose={() => {
            setShowModal(false);
            setHabitToEdit(null);
          }}
        />
      )}
    </main>
  );
}
