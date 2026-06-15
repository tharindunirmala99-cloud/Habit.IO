/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  updated_at: string;
  username: string;
}

export type HabitCategory = 'Health' | 'Work' | 'Mind' | 'Finance' | 'Creative' | 'Social' | 'Routine';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: HabitCategory;
  created_at: string;
}

export type LogStatus = 'completed' | 'skipped' | 'failed';

export interface HabitLog {
  id: string;
  habit_id: string;
  status: LogStatus;
  date: string; // YYYY-MM-DD
}

export interface HabitWithAnalytics extends Habit {
  logs: { [dateStr: string]: LogStatus };
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage (0 - 100)
}

export interface TrackerUser {
  id: string;
  email: string;
  username: string;
}

export interface TrackerUser {
  email_confirmed_at?: string | null;   // ← Add this
}