import { createBrowserClient } from '@supabase/ssr'

/**
 * Singleton Supabase client for use in Client Components.
 * Uses @supabase/ssr to ensure cookie-based session handling
 * compatible with Next.js App Router.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase browser environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
