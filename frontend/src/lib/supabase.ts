import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- BEGIN SINGLETON PATTERN ---
// Declare a global variable to hold the client instance.
// We use `any` here to avoid TypeScript errors about adding properties to `globalThis`.
const globalForSupabase = globalThis as any;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for frontend');
}

// Check if an instance already exists in the global scope.
// If not, create a new one and store it.
const supabase: SupabaseClient =
  globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey);

// In development, store the client in the global scope to prevent
// multiple instances from being created by Hot Module Replacement (HMR).
if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}
// --- END SINGLETON PATTERN ---

export { supabase }; 