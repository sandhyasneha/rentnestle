import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { phone, otp, role } = await req.json()
    if (!phone || !otp || !role) {
      return NextResponse.json({ error: 'phone, otp and role required' }, { status: 400 })
    }

    const { success, error } = await verifyOtp(phone, otp)
    if (!success) return NextResponse.json({ error }, { status: 401 })

    return NextResponse.json({ success: true, role, message: 'Verified successfully' })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}