import { supabase } from '@/lib/supabase'

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
console.log('🔧 Supabase Configuration (singleton):', {
  env: import.meta.env.MODE
}) 