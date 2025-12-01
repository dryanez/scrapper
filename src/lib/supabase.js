import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured with valid URL
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
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

// Create Supabase client (only if configured with valid URL)
let supabase = null;
if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to create Supabase client:', error);
    supabase = null;
  }
}

export { supabase };

// Helper to check if we should use Supabase or localStorage fallback
export const useSupabase = () => isSupabaseConfigured() && supabase !== null;

export default supabase;
