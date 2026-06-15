/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, Check, HelpCircle, RefreshCw, X, MoreVertical, Edit3, Trash2, Calendar, Sparkles, Heart, Brain, Users, ClipboardCheck, Coins, Compass } from 'lucide-react';
import { HabitWithAnalytics, HabitCategory, LogStatus } from '../types';

interface HabitCardProps {
  habit: HabitWithAnalytics;
  weekDays: Date[];
  onLogChange: (habitId: string, dateStr: string, status: any) => void;
  onEdit: (habit: HabitWithAnalytics) => void;
  onDelete: (habitId: string) => void;
}

export default function HabitCard({
  habit,
  weekDays,
  onLogChange,
  onEdit,
  onDelete
}: HabitCardProps) {
  const [showActions, setShowActions] = useState(false);

  // Category Icons Helper
  const getCategoryTheme = (cat: HabitCategory) => {
    switch (cat) {
      case 'Mind':
        return { icon: Brain, bg: 'bg-indigo-950/40 text-indigo-400 border-indigo-900/35', text: 'text-indigo-405' };
      case 'Health':
        return { icon: Heart, bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/35', text: 'text-emerald-405' };
      case 'Work':
        return { icon: Sparkles, bg: 'bg-amber-950/40 text-amber-400 border-amber-900/35', text: 'text-amber-405' };
      case 'Finance':
        return { icon: Coins, bg: 'bg-rose-950/40 text-rose-400 border-rose-900/35', text: 'text-rose-405' };
      case 'Creative':
        return { icon: Compass, bg: 'bg-purple-950/40 text-purple-400 border-purple-900/35', text: 'text-purple-405' };
      case 'Social':
        return { icon: Users, bg: 'bg-cyan-950/40 text-cyan-400 border-cyan-900/35', text: 'text-cyan-405' };
      default:
        return { icon: ClipboardCheck, bg: 'bg-zinc-900 text-zinc-300 border-zinc-800', text: 'text-zinc-350' };
    }
  };

  const theme = getCategoryTheme(habit.category);
  const CatIcon = theme.icon;

  const formatDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to handle the rotating cycle of daily logs
  const handleDayClick = (date: Date) => {
    const dateStr = formatDateStr(date);
    const currentStatus = habit.logs[dateStr];

    if (!currentStatus) {
      onLogChange(habit.id, dateStr, 'completed');
    } else if (currentStatus === 'completed') {
      onLogChange(habit.id, dateStr, 'skipped');
    } else if (currentStatus === 'skipped') {
      onLogChange(habit.id, dateStr, 'failed');
    } else if (currentStatus === 'failed') {
      onLogChange(habit.id, dateStr, null); // Clear / Unmark
    }
  };

  // Status Classes Helper
  const getDayStatusStyle = (status?: LogStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md border-emerald-500 scale-[1.03]';
      case 'skipped':
        return 'bg-zinc-800 hover:bg-zinc-700/80 text-zinc-400 border-zinc-700';
      case 'failed':
        return 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border-rose-900/40';
      default:
        return 'bg-zinc-900 hover:bg-zinc-800 text-zinc-600 border-zinc-800 hover:border-zinc-700 border-dashed';
    }
  };

  const getRateBadgeColor = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/35';
    if (rate >= 40) return 'bg-amber-950/30 text-amber-400 border-amber-900/35';
    return 'bg-rose-950/30 text-rose-400 border-rose-900/35';
  };

  return (
    <div id={`habit-card-${habit.id}`} className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-sm overflow-visible hover:border-zinc-700 transition-all p-5 flex flex-col md:flex-row gap-5">
      {/* Habit Info & Streaks Section (Left in Desktop) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${theme.bg}`}>
                <CatIcon className="w-3.5 h-3.5" />
                <span>{habit.category}</span>
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${getRateBadgeColor(habit.completionRate)}`}>
                {habit.completionRate}% Done
              </span>
            </div>

            {/* Actions Popover Trigger */}
            <div className="relative">
              <button 
                id={`btn-actions-${habit.id}`}
                onClick={() => setShowActions(!showActions)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-[#121214] rounded-xl shadow-lg border border-zinc-800 z-20 py-1 text-xs overflow-hidden">
                    <button
                      id={`btn-edit-${habit.id}`}
                      onClick={() => {
                        onEdit(habit);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-50 transition-colors text-left"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Habit</span>
                    </button>
                    <button
                      id={`btn-delete-${habit.id}`}
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this habit and all its logs?')) {
                          onDelete(habit.id);
                        }
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-zinc-805 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <h3 className="text-base font-semibold text-zinc-50 mt-2 truncate group-hover:text-amber-600 transition-colors" title={habit.name}>
            {habit.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {habit.description || 'No description provided.'}
          </p>
        </div>

        {/* Streaks Ticker */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800/60 font-mono">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-400">Streak:</span>
            <span className="text-xs font-bold text-orange-400">{habit.currentStreak}d</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">Longest:</span>
            <span className="text-xs font-bold text-zinc-300">{habit.longestStreak}d</span>
          </div>
        </div>
      </div>

      {/* Week Calendar Check-off Section (Right in Desktop) */}
      <div className="md:w-[420px] flex flex-col justify-center">
        <div className="text-[10px] font-medium text-zinc-500 flex items-center justify-between mb-2 px-1 font-mono">
          <span>Click tiles to log cycle:</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Completed
            <span className="inline-block w-1.5 h-1.5 bg-zinc-700 rounded-full" /> Skipped
            <span className="inline-block w-1.5 h-1.5 bg-rose-550 rounded-full" /> Failed
          </span>
        </div>

        {/* Calendar Day grid */}
        <div className="grid grid-cols-7 gap-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5">
          {weekDays.map((day, idx) => {
            const dateStr = formatDateStr(day);
            const status = habit.logs[dateStr];
            
            // Format labels
            const weekdayShort = day.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = day.getDate();
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <button
                id={`check-habit-${habit.id}-day-${idx}`}
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`flex flex-col items-center justify-between py-2 rounded-xl border text-center transition-all focus:outline-none aspect-square h-[54px] sm:h-[60px] relative ${getDayStatusStyle(status)}`}
              >
                {/* Visual tiny indicator for today */}
                {isToday && !status && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                )}

                <span className={`text-[10px] font-medium tracking-tight uppercase ${status === 'completed' ? 'text-emerald-100' : 'text-zinc-500'}`}>
                  {weekdayShort}
                </span>

                <span className={`text-sm font-bold ${status === 'completed' ? 'text-white' : 'text-zinc-200'}`}>
                  {dayNum}
                </span>

                {/* Microstatus Icons */}
                <span className="flex items-center justify-center">
                  {status === 'completed' ? (
                    <Check className="w-3.5 h-3.5 font-black text-white" />
                  ) : status === 'skipped' ? (
                    <span className="text-zinc-400 font-bold text-[10px]">-</span>
                  ) : status === 'failed' ? (
                    <X className="w-3 h-3 text-rose-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full border border-zinc-800" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
