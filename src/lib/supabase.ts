import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// ── Browser client (use in Client Components) ──────────────
export const supabase = createClientComponentClient()

// ── Server client (use in Server Components / Route Handlers) ──
// Import this separately in server files only
export const createServerClient = async () => {
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const { cookies } = await import('next/headers')
  return createServerComponentClient({ cookies })
}

// ── Admin client (service role — server only) ──────────────
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
)