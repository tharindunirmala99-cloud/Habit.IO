/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, CheckCircle, Award, ListTodo, Brain, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { HabitWithAnalytics, HabitCategory } from '../types';

interface StatsGridProps {
  habits: HabitWithAnalytics[];
}

export default function StatsGrid({ habits }: StatsGridProps) {
  // Calculations
  const totalHabits = habits.length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak)) : 0;
  const averageCompletionRate = habits.length > 0 
    ? Math.round(habits.reduce((acc, curr) => acc + curr.completionRate, 0) / habits.length) 
    : 0;

  // Let's count some totals
  const totalCompletions = habits.reduce((acc, h) => {
    const logs = Object.values(h.logs);
    const comps = logs.filter(status => status === 'completed').length;
    return acc + comps;
  }, 0);

  // Category counts and rates
  const categories: { name: HabitCategory; icon: any; color: string; bg: string; text: string }[] = [
    { name: 'Mind', icon: Brain, color: 'indigo', bg: 'bg-indigo-950/40 border border-indigo-900/35', text: 'text-indigo-400' },
    { name: 'Health', icon: Heart, color: 'emerald', bg: 'bg-emerald-950/40 border border-emerald-900/35', text: 'text-emerald-400' },
    { name: 'Work', icon: Sparkles, color: 'amber', bg: 'bg-amber-950/40 border border-amber-900/35', text: 'text-amber-400' },
    { name: 'Finance', icon: ListTodo, color: 'rose', bg: 'bg-rose-950/40 border border-rose-900/35', text: 'text-rose-400' },
    { name: 'Creative', icon: Brain, color: 'purple', bg: 'bg-purple-950/40 border border-purple-900/35', text: 'text-purple-400' },
    { name: 'Social', icon: Heart, color: 'cyan', bg: 'bg-cyan-950/40 border border-cyan-900/35', text: 'text-cyan-400' },
    { name: 'Routine', icon: Sparkles, color: 'slate', bg: 'bg-zinc-900 border border-zinc-800', text: 'text-zinc-300' }
  ];

  const habitsByCategory = (catName: HabitCategory) => habits.filter(h => h.category === catName);

  return (
    <div id="analytics-statistics-dashboard" className="space-y-6">
      {/* Total Aggregates Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Bento */}
        <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-zinc-400">Longest Streak</span>
            <span className="p-1.5 sm:p-2 bg-orange-950/30 text-orange-400 rounded-xl">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-display">
              {bestStreak} <span className="text-xs sm:text-sm font-normal text-zinc-500">days</span>
            </h4>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Keep pushing daily habits</p>
          </div>
        </div>

        {/* Completion Rate Bento */}
        <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-zinc-400">Avg Completion</span>
            <span className="p-1.5 sm:p-2 bg-indigo-950/40 text-indigo-400 rounded-xl">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-display">
              {averageCompletionRate}%
            </h4>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${averageCompletionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Habits Bento */}
        <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-zinc-400">Total Habits</span>
            <span className="p-1.5 sm:p-2 bg-emerald-950/30 text-emerald-400 rounded-xl">
              <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-display">
              {totalHabits}
            </h4>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Active targets tracks</p>
          </div>
        </div>

        {/* Total Actions Bento */}
        <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-zinc-400">Total Logs</span>
            <span className="p-1.5 sm:p-2 bg-amber-950/30 text-amber-400 rounded-xl">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight font-display">
              {totalCompletions} <span className="text-xs sm:text-sm font-normal text-zinc-500">ticks</span>
            </h4>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Completed events all-time</p>
          </div>
        </div>
      </div>

      {/* Category Breakdowns Side-rail */}
      {totalHabits > 0 && (
        <div className="bg-[#121214] rounded-2xl border border-zinc-800 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-zinc-100 mb-4 font-display">Habits Category Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {categories.map(cat => {
              const catHabits = habitsByCategory(cat.name);
              if (catHabits.length === 0) return null;
              
              const catCompletions = catHabits.reduce((acc, h) => acc + h.completionRate, 0);
              const avgCatCompletion = Math.round(catCompletions / catHabits.length);

              return (
                <div key={cat.name} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className={`p-2 rounded-lg ${cat.bg} ${cat.text}`}>
                    <cat.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200 truncate">{cat.name}</span>
                      <span className="text-xxs font-bold text-zinc-500">{catHabits.length} {catHabits.length === 1 ? 'habit' : 'habits'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-zinc-950 h-1 border border-zinc-800/50 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full" 
                          style={{ width: `${avgCatCompletion}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 font-mono">{avgCatCompletion}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
