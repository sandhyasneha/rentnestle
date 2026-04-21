// POST /api/auth/verify-otp
// Verifies OTP and creates/updates user profile
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const { phone, otp, role, name } = await req.json()

    if (!phone || !otp || !role) {
      return NextResponse.json({ error: 'phone, otp and role are required' }, { status: 400 })
    }

    const fullPhone = `+91${phone}`

    // Verify OTP with Supabase
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabaseClient.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    })

    if (error || !data.user) {
      console.error('OTP verify error:', error?.message)
      return NextResponse.json({
        error: error?.message || 'Invalid OTP',
      }, { status: 401 })
    }

    const userId = data.user.id

    // Upsert profile with name and role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        phone,
        role,
        full_name: name || null,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError.message)
    }

    return NextResponse.json({
      success: true,
      userId,
      role,
      name,
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      message: 'Verified successfully',
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
