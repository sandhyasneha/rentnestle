import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Namespace UUID for RentNestle (fixed)
const RN_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, role, name } = await req.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    // ── Find valid OTP ──────────────────────────────────
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
      return NextResponse.json({
        error: 'OTP expired or not found. Please request a new one.'
      }, { status: 400 })
    }

    // ── Check attempts ──────────────────────────────────
    if (data.attempts >= 3) {
      await supabase.from('otp_verifications').delete().eq('phone', phone)
      return NextResponse.json({
        error: 'Too many attempts. Please request a new OTP.'
      }, { status: 429 })
    }

    // ── Verify OTP ──────────────────────────────────────
    if (otp !== data.otp) {
      await supabase
        .from('otp_verifications')
        .update({ attempts: (data.attempts || 0) + 1 })
        .eq('id', data.id)
      return NextResponse.json({
        error: 'Invalid OTP. Please check your WhatsApp.'
      }, { status: 401 })
    }

    // ── Mark OTP used ───────────────────────────────────
    await supabase.from('otp_verifications').update({ used: true }).eq('id', data.id)

    // ── Generate consistent UUID from phone ─────────────
    const { data: uuidData } = await supabase
      .rpc('uuid_generate_v5', {
        namespace: RN_NAMESPACE,
        name: phone
      })
    
    // Fallback if RPC fails
    const userId = uuidData || data.id

    const userRole = role || data.role || 'tenant'
    const userName = name || data.name || ''

    // ── Upsert profile ──────────────────────────────────
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id:        userId,
        phone,
        role:      userRole,
        full_name: userName,
      }, { onConflict: 'id' })

    if (profileError) {
      console.log('Profile upsert error:', profileError.message)
    }

    // ── Issue JWT ───────────────────────────────────────
    const token = await new SignJWT({
      phone, userId, role: userRole, name: userName,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!))

    const res = NextResponse.json({
      success: true,
      userId,
      role:    userRole,
      name:    userName,
      phone,
      message: 'Verified successfully',
    })

    res.cookies.set('rentnestle_token', token, {
      httpOnly: true,
      secure:   true,
      sameSite: 'lax',
      maxAge:   604800,
      path:     '/',
    })

    return res

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
