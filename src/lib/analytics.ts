/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Habit, HabitLog, HabitWithAnalytics, LogStatus } from '../types';

/**
 * Calculates metrics for each habit:
 * 1. Completion Rate: (completed) / (completed + failed + skipped, or just total logged days)
 * 2. Current Streak: Consecutive completed days trailing back from today/yesterday.
 * 3. Longest Streak: Deep scan of consecutive completed dates in history.
 */
export function getHabitsWithAnalytics(habits: Habit[], logs: HabitLog[]): HabitWithAnalytics[] {
  return habits.map(habit => {
    // Filter logs for this specific habit
    const habitLogs = logs.filter(l => l.habit_id === habit.id);
    
    // Map of logger: "YYYY-MM-DD" -> "status"
    const logsMap: { [date: string]: LogStatus } = {};
    habitLogs.forEach(l => {
      logsMap[l.date] = l.status;
    });

    const completedDates = habitLogs
      .filter(l => l.status === 'completed')
      .map(l => l.date)
      .sort(); // ascending chronological sorting

    const currentStreak = calculateCurrentStreak(completedDates);
    const longestStreak = calculateLongestStreak(completedDates);
    const completionRate = calculateCompletionRate(habitLogs);

    return {
      ...habit,
      logs: logsMap,
      currentStreak,
      longestStreak,
      completionRate
    };
  });
}

/**
 * Converts a date string "YYYY-MM-DD" to local Date object at midnight to prevent time offsets timezone shift
 */
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month in JS Date is 0-indexed
  return new Date(year, month - 1, day);
};

/**
 * Calculates current streak backing from today
 */
export function calculateCurrentStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  const dateSet = new Set(completedDates);
  const now = new Date();
  
  // Format dates for comparison
  const getFormattedStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getFormattedStr(now);
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = getFormattedStr(yesterday);

  let currentCheckingDate: Date;
  
  // Rule: If today has completed logs, streak begins today.
  // Else, if yesterday was completed, streak begins yesterday (the user hasn't checked today code yet).
  // Else, current streak is 0.
  if (dateSet.has(todayStr)) {
    currentCheckingDate = now;
  } else if (dateSet.has(yesterdayStr)) {
    currentCheckingDate = yesterday;
  } else {
    return 0;
  }

  let streakCount = 0;
  while (true) {
    const dateQueryStr = getFormattedStr(currentCheckingDate);
    if (dateSet.has(dateQueryStr)) {
      streakCount++;
      // Move 1 day back
      currentCheckingDate.setDate(currentCheckingDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streakCount;
}

/**
 * Calculates longest streak of contiguous calendar days
 */
export function calculateLongestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  // Ensure unique sorted dates
  const uniqueDates = Array.from(new Set(completedDates)).sort();
  
  if (uniqueDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = parseLocalDate(uniqueDates[i - 1]);
    const currDate = parseLocalDate(uniqueDates[i]);

    // Difference in days
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return Math.max(maxStreak, currentStreak);
}

/**
 * Calculates completion rate percentage over logged events
 */
export function calculateCompletionRate(logs: HabitLog[]): number {
  if (logs.length === 0) return 0;
  const completedLogs = logs.filter(l => l.status === 'completed');
  // We divide completed logs by the sum of completed + failed logs (skipped does not penalize streaks or rates in elite trackers)
  const penalizedLogs = logs.filter(l => l.status === 'completed' || l.status === 'failed');
  
  if (penalizedLogs.length === 0) {
    // If only skipped logs exist, let's treat average completion rate as 100% since they technically haven't failed any
    return completedLogs.length === logs.length ? 100 : 100;
  }

  return Math.round((completedLogs.length / penalizedLogs.length) * 100);
}
