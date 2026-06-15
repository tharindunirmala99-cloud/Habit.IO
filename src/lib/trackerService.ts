/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Habit, HabitLog, HabitCategory, LogStatus, TrackerUser } from '../types';

// Let's seed initial realistic demo data for the Local sandbox
const DEMO_HABITS: Habit[] = [
  {
    id: 'demo-habit-1',
    user_id: 'demo-user-id',
    name: 'Morning Mindfulness',
    description: '10 minutes of deep breathing and presence before starting work.',
    category: 'Mind',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-habit-2',
    user_id: 'demo-user-id',
    name: 'Daily Workout',
    description: '30-minute high intensity workout or weights session.',
    category: 'Health',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-habit-3',
    user_id: 'demo-user-id',
    name: 'Read Technical Docs',
    description: 'Learn new tech stack concepts and system capabilities.',
    category: 'Work',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'demo-habit-4',
    user_id: 'demo-user-id',
    name: 'Track Spending',
    description: 'Log daily expenses to maintain strict budget goals.',
    category: 'Finance',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Seed realistic completions for the past 7 days to showcase beautiful chart/calendar completion states
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEMO_LOGS: HabitLog[] = [
  // Mindfulness (Mind)
  { id: 'l1', habit_id: 'demo-habit-1', status: 'completed', date: getPastDateStr(6) },
  { id: 'l2', habit_id: 'demo-habit-1', status: 'completed', date: getPastDateStr(5) },
  { id: 'l3', habit_id: 'demo-habit-1', status: 'skipped',   date: getPastDateStr(4) },
  { id: 'l4', habit_id: 'demo-habit-1', status: 'completed', date: getPastDateStr(3) },
  { id: 'l5', habit_id: 'demo-habit-1', status: 'completed', date: getPastDateStr(2) },
  { id: 'l6', habit_id: 'demo-habit-1', status: 'completed', date: getPastDateStr(1) },
  { id: 'l7', habit_id: 'demo-habit-1', status: 'completed', date: getPastDateStr(0) }, // Active streak of 4 (skipped splits streak, or does it? standard is consecutive completions or allowed skip. We'll count completed)

  // Gym Workout (Health)
  { id: 'l8',  habit_id: 'demo-habit-2', status: 'completed', date: getPastDateStr(6) },
  { id: 'l9',  habit_id: 'demo-habit-2', status: 'failed',    date: getPastDateStr(5) },
  { id: 'l10', habit_id: 'demo-habit-2', status: 'completed', date: getPastDateStr(4) },
  { id: 'l11', habit_id: 'demo-habit-2', status: 'completed', date: getPastDateStr(3) },
  { id: 'l12', habit_id: 'demo-habit-2', status: 'failed',    date: getPastDateStr(2) },
  { id: 'l13', habit_id: 'demo-habit-2', status: 'completed', date: getPastDateStr(1) },

  // Read Docs (Work)
  { id: 'l14', habit_id: 'demo-habit-3', status: 'skipped',   date: getPastDateStr(6) },
  { id: 'l15', habit_id: 'demo-habit-3', status: 'completed', date: getPastDateStr(5) },
  { id: 'l16', habit_id: 'demo-habit-3', status: 'completed', date: getPastDateStr(4) },
  { id: 'l17', habit_id: 'demo-habit-3', status: 'completed', date: getPastDateStr(3) },
  { id: 'l18', habit_id: 'demo-habit-3', status: 'completed', date: getPastDateStr(2) },
  { id: 'l19', habit_id: 'demo-habit-3', status: 'completed', date: getPastDateStr(1) },
  { id: 'l20', habit_id: 'demo-habit-3', status: 'completed', date: getPastDateStr(0) } // Active streak of 6
];

// Helper to check and initialize standard LocalStorage
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('habits_tracker_user')) {
    // Standard mock user
    const defaultUser: TrackerUser = {
      id: 'demo-user-id',
      email: 'pioneer@habits.io',
      username: 'DailyPioneer'
    };
    localStorage.setItem('habits_tracker_user', JSON.stringify(defaultUser));
  }
  if (!localStorage.getItem('habits_tracker_habits')) {
    localStorage.setItem('habits_tracker_habits', JSON.stringify(DEMO_HABITS));
  }
  if (!localStorage.getItem('habits_tracker_logs')) {
    localStorage.setItem('habits_tracker_logs', JSON.stringify(DEMO_LOGS));
  }
};

initializeLocalStorage();

export const trackerService = {
  // -------------------------------------------------------------
  // USER / AUTH SERVICE
  // -------------------------------------------------------------
  async getCurrentUser(): Promise<TrackerUser | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return null;

      // Fetch Profile username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      return {
        id: session.user.id,
        email: session.user.email || '',
        username: profile?.username || session.user.email?.split('@')[0] || 'User'
      };
    } else {
      const userStr = localStorage.getItem('habits_tracker_user');
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  async signUp(email: string, password: string, username: string): Promise<TrackerUser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('User creation failed.');

      // The trigger 'on_auth_user_created' on Supabase handles writing the Row to public.profiles.
      // But just in case, we return the parsed credentials
      return {
        id: data.user.id,
        email: data.user.email || email,
        username: username
      };
    } else {
      const userId = 'local-user-' + Math.random().toString(36).substring(2, 9);
      const newUser: TrackerUser = { id: userId, email, username };
      localStorage.setItem('habits_tracker_user', JSON.stringify(newUser));
      return newUser;
    }
  },

  async signIn(email: string, password: string): Promise<TrackerUser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (!data.user) throw new Error('Login failed.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email || '',
        username: profile?.username || data.user.email?.split('@')[0] || 'User'
      };
    } else {
      // Mock log in
      const current = localStorage.getItem('habits_tracker_user');
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed.email === email) return parsed;
      }
      const demoUser: TrackerUser = {
        id: 'demo-user-id',
        email,
        username: email.split('@')[0] || 'User'
      };
      localStorage.setItem('habits_tracker_user', JSON.stringify(demoUser));
      return demoUser;
    }
  },

  async signInWithGoogle(): Promise<{ url?: string; error?: Error }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) return { error };
      return { url: data.url };
    } else {
      // Direct mock login for standard live sandbox flow
      const demoUser: TrackerUser = {
        id: 'demo-google-id',
        email: 'google.explorer@domain.com',
        username: 'GoogleExplorer'
      };
      localStorage.setItem('habits_tracker_user', JSON.stringify(demoUser));
      return {};
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('habits_tracker_user');
      localStorage.removeItem('habits_tracker_habits');
      localStorage.removeItem('habits_tracker_logs');
    }
  },

  // -------------------------------------------------------------
  // HABITS SERVICE
  // -------------------------------------------------------------
  async getHabits(): Promise<Habit[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Habit[];
    } else {
      const habitsStr = localStorage.getItem('habits_tracker_habits');
      return habitsStr ? JSON.parse(habitsStr) : [];
    }
  },

  async createHabit(name: string, description: string, category: HabitCategory): Promise<Habit> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthenticated user cannot create habits.');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: session.user.id,
          name,
          description,
          category,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    } else {
      const user = await this.getCurrentUser();
      const newHabit: Habit = {
        id: 'local-habit-' + Math.random().toString(36).substring(2, 9),
        user_id: user?.id || 'demo-user-id',
        name,
        description,
        category,
        created_at: new Date().toISOString()
      };

      const habitsStr = localStorage.getItem('habits_tracker_habits');
      const habits: Habit[] = habitsStr ? JSON.parse(habitsStr) : [];
      habits.unshift(newHabit);
      localStorage.setItem('habits_tracker_habits', JSON.stringify(habits));
      return newHabit;
    }
  },

  async updateHabit(habitId: string, updates: Partial<Omit<Habit, 'id' | 'user_id' | 'created_at'>>): Promise<Habit> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    } else {
      const habitsStr = localStorage.getItem('habits_tracker_habits');
      const habits: Habit[] = habitsStr ? JSON.parse(habitsStr) : [];
      let updatedHabit!: Habit;
      const updatedList = habits.map(h => {
        if (h.id === habitId) {
          updatedHabit = { ...h, ...updates };
          return updatedHabit;
        }
        return h;
      });
      localStorage.setItem('habits_tracker_habits', JSON.stringify(updatedList));
      return updatedHabit;
    }
  },

  async deleteHabit(habitId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
      if (error) throw error;
    } else {
      // Delete habit
      const habitsStr = localStorage.getItem('habits_tracker_habits');
      const habits: Habit[] = habitsStr ? JSON.parse(habitsStr) : [];
      localStorage.setItem('habits_tracker_habits', JSON.stringify(habits.filter(h => h.id !== habitId)));

      // Delete cascade logs
      const logsStr = localStorage.getItem('habits_tracker_logs');
      const logs: HabitLog[] = logsStr ? JSON.parse(logsStr) : [];
      localStorage.setItem('habits_tracker_logs', JSON.stringify(logs.filter(l => l.habit_id !== habitId)));
    }
  },

  // -------------------------------------------------------------
  // HABIT LOGS SERVICE
  // -------------------------------------------------------------
  async getLogs(habitIds: string[]): Promise<HabitLog[]> {
    if (isSupabaseConfigured && supabase) {
      if (habitIds.length === 0) return [];
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .in('habit_id', habitIds);
      if (error) throw error;
      return (data || []) as HabitLog[];
    } else {
      const logsStr = localStorage.getItem('habits_tracker_logs');
      const logs: HabitLog[] = logsStr ? JSON.parse(logsStr) : [];
      return logs.filter(l => habitIds.includes(l.habit_id));
    }
  },

  async saveLog(habitId: string, status: LogStatus, dateStr: string): Promise<HabitLog> {
    if (isSupabaseConfigured && supabase) {
      // Try to upsert row. Supabase uses ON CONFLICT (habit_id, date) DO UPDATE based on our schema model.
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            habit_id: habitId,
            status,
            date: dateStr
          },
          { onConflict: 'habit_id,date' }
        )
        .select()
        .single();
      if (error) {
        // If single() is fussy about matching rows or returning, fallback to raw select or re-query
        const selectQuery = await supabase
          .from('habit_logs')
          .select('*')
          .eq('habit_id', habitId)
          .eq('date', dateStr)
          .maybeSingle();
        if (selectQuery.data) return selectQuery.data as HabitLog;
        throw error;
      }
      return data as HabitLog;
    } else {
      // Mock local storage upsert
      const logsStr = localStorage.getItem('habits_tracker_logs');
      const logs: HabitLog[] = logsStr ? JSON.parse(logsStr) : [];

      const existingIndex = logs.findIndex(l => l.habit_id === habitId && l.date === dateStr);
      let targetLog: HabitLog;

      if (existingIndex > -1) {
        logs[existingIndex].status = status;
        targetLog = logs[existingIndex];
      } else {
        targetLog = {
          id: 'local-log-' + Math.random().toString(36).substring(2, 9),
          habit_id: habitId,
          status,
          date: dateStr
        };
        logs.push(targetLog);
      }

      localStorage.setItem('habits_tracker_logs', JSON.stringify(logs));
      return targetLog;
    }
  },

  async deleteLog(habitId: string, dateStr: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', dateStr);
      if (error) throw error;
    } else {
      const logsStr = localStorage.getItem('habits_tracker_logs');
      const logs: HabitLog[] = logsStr ? JSON.parse(logsStr) : [];
      const filtered = logs.filter(l => !(l.habit_id === habitId && l.date === dateStr));
      localStorage.setItem('habits_tracker_logs', JSON.stringify(filtered));
    }
  }
};
