import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase project URL and Anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const Auth = createClient(supabaseUrl, supabaseAnonKey)
export const Server = process.env.BIZ_TOUCH_SERVER || ""