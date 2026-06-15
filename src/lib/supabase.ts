/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Clean up and sanitize the Supabase URL against common copy-paste errors
let rawUrl = ((import.meta as any).env.VITE_SUPABASE_URL || '').trim();

// Remove raw protocols or endpoints if they pasted the fully expanded endpoints
if (rawUrl) {
  // Strip trailing slashes
  while (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
  
  // Standard copy-pastes from connection options often include API version suffixes
  if (rawUrl.endsWith('/rest/v1')) {
    rawUrl = rawUrl.substring(0, rawUrl.length - 8);
  }
  if (rawUrl.endsWith('/auth/v1')) {
    rawUrl = rawUrl.substring(0, rawUrl.length - 8);
  }
  
  // Clean up any double slashes at the end left over by suffix stripping
  while (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
}

const supabaseUrl = rawUrl;
const supabaseAnonKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || '').trim();

// Clean up placeholders in case the user pasted dummy values
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
