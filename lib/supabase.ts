import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Check if we have real Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' &&
	supabaseAnonKey !== 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations
export const supabaseAdmin = createClient(
	supabaseUrl,
	supabaseServiceKey,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
)

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidCredentials
