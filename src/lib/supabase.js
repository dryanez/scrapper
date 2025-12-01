import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded for production reliability
// These are safe to expose as they are public anon keys with RLS enabled
const SUPABASE_URL = 'https://mszpskizddxiutgugezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenBza2l6ZGR4aXV0Z3VnZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDE0NTcsImV4cCI6MjA4MDE3NzQ1N30.N4vUK9bI13i28BOTKH1udy8HlWap3t6QEg8YGHmx1mQ';

// Use env vars if available, otherwise use hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

// Check if Supabase is configured with valid URL
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  // Validate URL format
  try {
    new URL(supabaseUrl);
    return true;
  } catch {
    console.warn('Invalid Supabase URL configured:', supabaseUrl);
    return false;
  }
};

// Create Supabase client
let supabase = null;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.warn('Failed to create Supabase client:', error);
  supabase = null;
}

export { supabase };

// Helper to check if we should use Supabase or localStorage fallback
export const useSupabase = () => supabase !== null;

export default supabase;
