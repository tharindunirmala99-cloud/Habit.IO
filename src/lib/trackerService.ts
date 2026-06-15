/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Habit, HabitLog, HabitCategory, LogStatus, TrackerUser } from '../types';

// Demo data for Local Sandbox Mode


const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('habits_tracker_user')) {
    const defaultUser: TrackerUser = {
      id: 'demo-user-id',
      email: 'pioneer@habits.io',
      username: 'DailyPioneer'
    };
    localStorage.setItem('habits_tracker_user', JSON.stringify(defaultUser));
  }
  // if (!localStorage.getItem('habits_tracker_habits')) {
  //   localStorage.setItem('habits_tracker_habits', JSON.stringify(DEMO_HABITS));
  // }
  // if (!localStorage.getItem('habits_tracker_logs')) {
  //   localStorage.setItem('habits_tracker_logs', JSON.stringify(DEMO_LOGS));
  // }
};

initializeLocalStorage();

export const trackerService = {
  async getCurrentUser(): Promise<TrackerUser | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      return {
        id: session.user.id,
        email: session.user.email || '',
        username: profile?.username || session.user.user_metadata?.username || 'User',
        email_confirmed_at: session.user.email_confirmed_at
      };
    } else {
      const userStr = localStorage.getItem('habits_tracker_user');
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  async signUp(email: string, password: string, username: string): Promise<TrackerUser> {
    console.log('[trackerService] signUp called for:', email);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}`,
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw error;
      }

      return {
        id: data.user!.id,
        email: data.user!.email || email,
        username,
        email_confirmed_at: data.user!.email_confirmed_at
      };
    } else {
      // Local mode
      const userId = 'local-user-' + Math.random().toString(36).substring(2, 9);
      const newUser: TrackerUser = { id: userId, email, username };
      localStorage.setItem('habits_tracker_user', JSON.stringify(newUser));
      return newUser;
    }
  },

  async signIn(email: string, password: string): Promise<TrackerUser> {
    console.log('[trackerService] signIn called for:', email);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed.');

      // STRICT EMAIL VERIFICATION CHECK
      if (!data.user.email_confirmed_at) {
        throw new Error('Please verify your email address first. Check your inbox (and spam folder).');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email || '',
        username: profile?.username || data.user.user_metadata?.username || 'User',
        email_confirmed_at: data.user.email_confirmed_at
      };
    } else {
      // Local sandbox - always allow
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
        options: { redirectTo: window.location.origin }
      });
      if (error) return { error };
      return { url: data.url };
    } else {
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

  // HABITS
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated user cannot create habits.');

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
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
      const habitsStr = localStorage.getItem('habits_tracker_habits');
      const habits: Habit[] = habitsStr ? JSON.parse(habitsStr) : [];
      localStorage.setItem('habits_tracker_habits', JSON.stringify(habits.filter(h => h.id !== habitId)));

      const logsStr = localStorage.getItem('habits_tracker_logs');
      const logs: HabitLog[] = logsStr ? JSON.parse(logsStr) : [];
      localStorage.setItem('habits_tracker_logs', JSON.stringify(logs.filter(l => l.habit_id !== habitId)));
    }
  },

  // HABIT LOGS
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
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          { habit_id: habitId, status, date: dateStr },
          { onConflict: 'habit_id,date' }
        )
        .select()
        .single();

      if (error) {
        const { data: fallback } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('habit_id', habitId)
          .eq('date', dateStr)
          .maybeSingle();
        if (fallback) return fallback as HabitLog;
        throw error;
      }
      return data as HabitLog;
    } else {
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