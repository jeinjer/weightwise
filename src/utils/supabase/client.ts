import { createBrowserClient } from '@supabase/ssr'

/**
 * Singleton Supabase client for use in Client Components.
 * Uses @supabase/ssr to ensure cookie-based session handling
 * compatible with Next.js App Router.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
