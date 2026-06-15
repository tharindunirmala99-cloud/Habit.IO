/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, Database, ShieldAlert, ArrowRight } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all mandatory credentials.');
      return;
    }
    if (activeTab === 'signup' && !username.trim()) {
      setError('Please provide a unique username.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (activeTab === 'login') {
        const user = await trackerService.signIn(email, password);
        onSuccess(user);
      } else {
        const { user, requiresConfirmation } = await trackerService.signUp(email, password, username);
        if (requiresConfirmation) {
          setSuccessMsg('Account created! Check your email inbox for a verification link, then come back to sign in.');
        } else {
          onSuccess(user);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { url, error: gError } = await trackerService.signInWithGoogle();
      if (gError) throw gError;
      
      if (url) {
        // Redirect to Supabase Google OAuth endpoint
        window.location.href = url;
      } else {
        // Local simulation login
        const demoGUser = await trackerService.getCurrentUser();
        if (demoGUser) {
          onSuccess(demoGUser);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Google signup initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-layout" className="min-h-[82vh] flex items-center justify-center p-4">
      <div id="auth-box-container" className="w-full max-w-md bg-[#121214] border border-zinc-800 shadow-2xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Connection Type Indicator Badge */}
        <div className="flex justify-center font-mono text-xs">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/35 text-emerald-400 border border-emerald-900/35 text-xxs font-semibold rounded-full">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Database Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/25 text-amber-400 border border-amber-900/35 text-xxs font-semibold rounded-full animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Local Sandbox Mode (Pre-seeded)</span>
            </span>
          )}
        </div>

        {/* Brand App Name */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-bold text-sm tracking-widest font-mono">
            <Sparkles className="w-4 h-4 fill-indigo-950/40" />
            <span className="tracking-widest uppercase">HABIT.IO</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-50 tracking-tight font-display">
            {activeTab === 'login' ? 'Welcome Back!' : 'Begin Your Streak'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isSupabaseConfigured 
              ? 'Connect your personal habits with secure cloud storage and real-time syncing.'
              : 'Try the dynamic habits engine. To secure data, paste your Supabase keys!'
            }
          </p>
        </div>

        {/* Tab Buttons Selection */}
        <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
          <button
            id="tab-select-login"
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'login' 
                ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-select-signup"
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'signup' 
                ? 'bg-zinc-900 text-zinc-50 border border-zinc-800 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Errors Visual Logs */}
        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="input-auth-username"
                  type="text"
                  placeholder="HabitPioneer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 placeholder-zinc-605"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="input-auth-email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 placeholder-zinc-605"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="input-auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-950/40 focus:border-indigo-500 placeholder-zinc-605"
              />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#fafafa] hover:bg-zinc-200 text-[#09090b] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Register & Sync'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Or</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Google OAuth Trigger buttons */}
        <button
          id="btn-google-oauth"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 hover:text-zinc-100 text-zinc-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {/* Flat Google logo */}
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>{isSupabaseConfigured ? 'Continue with Google' : 'Simulate Google Login'}</span>
        </button>

        {/* Demo login instructions footer */}
        {!isSupabaseConfigured && (
          <p className="text-[10px] text-center text-zinc-400 bg-zinc-900/50 border border-zinc-800/80 p-2.5 rounded-xl">
            <strong>🚀 Preview Tip:</strong> Since no credentials are configured, you can type **any email and password** to enter instant sandbox dashboard mode!
          </p>
        )}
      </div>
    </div>
  );
}
