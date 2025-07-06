import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trmqbpnnboyoneyfleux.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybXFicG5uYm95b25leWZsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzg5MzQsImV4cCI6MjA2NDk1NDkzNH0.sAremnjIHwHnzdxxuXl-GMNTyRVpZaQUVxxSgYcXhLk'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Export types for better TypeScript support
export type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('system_status')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Supabase connection error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Supabase connection successful')
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Supabase connection failed:', error)
    return { success: false, error: error.message }
  }
}

// Configuration logging
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  env: import.meta.env.MODE
}) 