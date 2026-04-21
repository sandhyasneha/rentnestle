// POST /api/auth/send-otp
// Sends real OTP via Supabase phone auth
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { phone, role, name } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit number required' }, { status: 400 })
    }

    const fullPhone = `+91${phone}`

    // Send OTP via Supabase (uses Twilio/SMS provider configured in dashboard)
    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
      options: {
        data: { role, name }, // stored in raw_user_meta_data
      },
    })

    if (error) {
      console.error('Supabase OTP error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to +91${phone}`,
    })

  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
