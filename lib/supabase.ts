import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://ekghedjnmfetsttvhqwj.supabase.co'
const supabaseAnonKey = 'sb_publishable_bVsYk_BcbxcXvWXoY6AzDg_C9_ktpxy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})