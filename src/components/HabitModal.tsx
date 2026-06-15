/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Brain, Heart, Sparkles, Coins, Compass, Users, ClipboardCheck } from 'lucide-react';
import { HabitCategory, HabitWithAnalytics } from '../types';

interface HabitModalProps {
  habitToEdit: HabitWithAnalytics | null;
  onSave: (name: string, description: string, category: HabitCategory, editId?: string) => void;
  onClose: () => void;
}

export default function HabitModal({ habitToEdit, onSave, onClose }: HabitModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Mind');
  const [error, setError] = useState('');

  const categoriesList: { name: HabitCategory; icon: any; colorText: string; activeBg: string }[] = [
    { name: 'Mind', icon: Brain, colorText: 'text-indigo-400', activeBg: 'bg-indigo-950/40 border-indigo-505 text-indigo-400' },
    { name: 'Health', icon: Heart, colorText: 'text-emerald-400', activeBg: 'bg-emerald-950/40 border-emerald-505 text-emerald-400' },
    { name: 'Work', icon: Sparkles, colorText: 'text-amber-400', activeBg: 'bg-amber-950/40 border-amber-505 text-amber-400' },
    { name: 'Finance', icon: Coins, colorText: 'text-rose-400', activeBg: 'bg-rose-950/40 border-rose-505 text-rose-400' },
    { name: 'Creative', icon: Compass, colorText: 'text-purple-400', activeBg: 'bg-purple-950/40 border-purple-505 text-purple-400' },
    { name: 'Social', icon: Users, colorText: 'text-cyan-400', activeBg: 'bg-cyan-950/40 border-cyan-505 text-cyan-400' },
    { name: 'Routine', icon: ClipboardCheck, colorText: 'text-zinc-400', activeBg: 'bg-zinc-900 border-zinc-700 text-zinc-100' }
  ];

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setCategory(habitToEdit.category);
    } else {
      setName('');
      setDescription('');
      setCategory('Mind');
    }
    setError('');
  }, [habitToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a descriptive name for this habit.');
      return;
    }
    onSave(name.trim(), description.trim(), category, habitToEdit?.id);
  };

  return (
    <div id="habit-modal-backdrop" className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="habit-modal-content"
        className="bg-[#121214] rounded-3xl border border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-250 text-zinc-50"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-850">
          <h3 className="text-lg font-bold text-zinc-100 font-display">
            {habitToEdit ? 'Edit Habit Settings' : 'Create New Habit'}
          </h3>
          <button 
            id="btn-close-habit-modal"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-400 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">Habit Name *</label>
            <input
              id="input-habit-name"
              type="text"
              placeholder="e.g. Drink 3L Water, Evening Read, Push-ups..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 rounded-xl text-sm transition-all font-medium placeholder-zinc-600"
              autoFocus
            />
          </div>

          {/* Category SELECT Badge list */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categoriesList.map((item) => {
                const isSelected = category === item.name;
                const CatIcon = item.icon;
                return (
                  <button
                    id={`btn-select-category-${item.name}`}
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold justify-center transition-all ${
                      isSelected 
                        ? item.activeBg 
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300'
                    }`}
                  >
                    <CatIcon className={`w-4 h-4 ${isSelected ? '' : item.colorText}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">Description (Optional)</label>
            <textarea
              id="input-habit-description"
              rows={3}
              placeholder="Provide context, metrics, routine steps, or location triggers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 rounded-xl text-sm transition-all font-medium resize-none placeholder-zinc-600"
            />
          </div>

          {/* Submit Action footer buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-850">
            <button
              id="btn-cancel-modal"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm font-semibold rounded-xl transition-colors hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              id="btn-save-habit"
              type="submit"
              className="px-5 py-2.5 bg-[#fafafa] hover:bg-zinc-200 text-[#09090b] text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{habitToEdit ? 'Update settings' : 'Launch habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
