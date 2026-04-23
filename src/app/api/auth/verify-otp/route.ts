import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, role, name } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    // ── Find valid OTP in Supabase ──────────────────────
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'OTP expired or not found. Please request a new one.' }, { status: 400 })
    }

    // ── Check attempt limit ─────────────────────────────
    if (data.attempts >= 3) {
      await supabase.from('otp_verifications').delete().eq('phone', phone)
      return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 429 })
    }

    // ── Verify OTP ──────────────────────────────────────
    if (otp !== data.otp) {
      await supabase
        .from('otp_verifications')
        .update({ attempts: (data.attempts || 0) + 1 })
        .eq('id', data.id)
      return NextResponse.json({ error: 'Invalid OTP. Please check your WhatsApp.' }, { status: 401 })
    }

    // ── Mark OTP as used ────────────────────────────────
    await supabase.from('otp_verifications').update({ used: true }).eq('id', data.id)

    // ── Create or find user in profiles ────────────────
    let userId: string

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingProfile?.id) {
      userId = existingProfile.id
      // Update name if provided
      if (name) {
        await supabase.from('profiles').update({ full_name: name }).eq('id', userId)
      }
    } else {
      // Create new auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: `+91${phone}`,
        phone_confirm: true,
        app_metadata:  { role: role || data.role },
        user_metadata: { full_name: name || data.name, role: role || data.role },
      })

      if (authError || !authUser.user) {
        console.error('Create user error:', authError?.message)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      userId = authUser.user.id

      // Profile created automatically via trigger
      // Update with name and role
      await supabase.from('profiles').upsert({
        id:        userId,
        phone,
        role:      role || data.role || 'tenant',
        full_name: name || data.name || null,
      }, { onConflict: 'id' })
    }

    // ── Issue JWT ───────────────────────────────────────
    const token = await new SignJWT({
      phone,
      userId,
      role: role || data.role || 'tenant',
      name: name || data.name || '',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!))

    // ── Set HTTP-only cookie ────────────────────────────
    const res = NextResponse.json({
      success: true,
      userId,
      role:    role || data.role || 'tenant',
      name:    name || data.name || '',
      phone,
      message: 'Verified successfully',
    })

    res.cookies.set('rentnestle_token', token, {
      httpOnly: true,
      secure:   true,
      sameSite: 'lax',
      maxAge:   604800, // 7 days
      path:     '/',
    })

    return res

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
