/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, Database, ShieldAlert, ArrowRight, CheckCircle } from 'lucide-react';
import { trackerService } from '../lib/trackerService';
import { isSupabaseConfigured } from '../lib/supabase';
import { TrackerUser } from '../types';

interface AuthScreenProps {
  onSuccess: (user: TrackerUser) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyPrompt, setVerifyPrompt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[AuthScreen] handleSubmit - ${activeTab}`);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (activeTab === 'signup' && !username.trim()) {
      setError('Username is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (activeTab === 'login') {
        const user = await trackerService.signIn(email, password);
        onSuccess(user);   // Only reaches here if email is confirmed
      } else {
        // SIGNUP
        await trackerService.signUp(email, password, username);
        
        setSuccessMsg('Account created successfully!');
        setVerifyPrompt(true);
        
        // Do NOT auto-login — force user to check email
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
        
        <div className="flex justify-center font-mono text-xs">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/35 text-emerald-400 border border-emerald-900/35 rounded-full text-xxs font-semibold">
              <Database className="w-3.5 h-3.5" /> Live Supabase
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/25 text-amber-400 border border-amber-900/35 rounded-full text-xxs font-semibold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> Sandbox Mode
            </span>
          )}
        </div>

        <div className="text-center">
          <div className="flex justify-center gap-1.5 text-indigo-400 font-bold text-sm tracking-widest">
            <Sparkles className="w-5 h-5" />
            HABIT.IO
          </div>
          <h2 className="text-2xl font-black text-white mt-2">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
          <button onClick={() => { setActiveTab('login'); setError(''); setVerifyPrompt(false); }} 
            className={`flex-1 py-3 text-sm font-semibold rounded-lg ${activeTab === 'login' ? 'bg-zinc-900 text-white' : 'text-zinc-400'}`}>
            Sign In
          </button>
          <button onClick={() => { setActiveTab('signup'); setError(''); setVerifyPrompt(false); }} 
            className={`flex-1 py-3 text-sm font-semibold rounded-lg ${activeTab === 'signup' ? 'bg-zinc-900 text-white' : 'text-zinc-400'}`}>
            Sign Up
          </button>
        </div>

        {error && <div className="p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-2xl text-sm">{error}</div>}
        
        {successMsg && (
          <div className="p-4 bg-emerald-900/30 border border-emerald-800 text-emerald-400 rounded-2xl text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {verifyPrompt && (
          <div className="p-4 bg-blue-950/40 border border-blue-800 text-blue-300 rounded-2xl text-sm">
            <strong>Check your email!</strong><br />
            Click the verification link we sent you to activate your account.<br />
            <span className="text-xs opacity-75">Don't forget to check your spam folder.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === 'signup' && (
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Username</label>
              <div className="relative mt-1">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="TharinduN"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-600 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google Button */}
        <button onClick={() => { /* existing google logic */ }} className="w-full py-3 border border-zinc-700 hover:bg-zinc-900 rounded-xl flex items-center justify-center gap-2">
          Continue with Google
        </button>
      </div>
    </div>
  );
}