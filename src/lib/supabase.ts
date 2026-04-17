import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ── Browser client (use in Client Components) ──────────────
export const supabase = createClientComponentClient()

// ── Server client (use in Server Components / Route Handlers) ──
export const createServerClient = () =>
  createServerComponentClient({ cookies })

// ── Admin client (service role — server only, never expose) ──
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
