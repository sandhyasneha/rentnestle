// POST /api/auth/verify-otp
// Body: { phone: "9876543210", otp: "1234", role: "tenant" | "owner" }

import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { supabaseAdmin } from '@/lib/supabase'
import { createServerClient } from '@/lib/supabase'
import { UserRole } from '@/types'

export async function POST(req: Request) {
  try {
    const { phone, otp, role }: { phone: string; otp: string; role: UserRole } = await req.json()

    if (!phone || !otp || !role) {
      return NextResponse.json({ error: 'phone, otp and role are required' }, { status: 400 })
    }

    // 1. Verify OTP (MSG91 or test mode)
    const { success, error } = await verifyOtp(phone, otp)
    if (!success) {
      return NextResponse.json({ error }, { status: 401 })
    }

    // 2. Sign in or sign up via Supabase
    //    We use phone OTP flow. Supabase natively supports this.
    //    For production: use supabase.auth.verifyOtp({ phone, token, type: 'sms' })
    //    For test mode: we create/get the user via admin client

    let userId: string

    if (process.env.NODE_ENV !== 'production') {
      // Test mode: upsert user by phone
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single()

      if (existingUser) {
        userId = existingUser.id
      } else {
        // Create auth user then profile via trigger
        const { data: authUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          phone,
          phone_confirm: true,
          app_metadata: { role },
        })
        if (createErr || !authUser.user) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }
        userId = authUser.user.id
      }
    } else {
      // Production: real Supabase phone OTP verification
      // Frontend calls supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
      // and gets session directly — no server call needed for this step
      return NextResponse.json({ error: 'Use Supabase client-side OTP verify in production' }, { status: 400 })
    }

    // 3. Return success — frontend will use Supabase session
    return NextResponse.json({
      success: true,
      userId,
      role,
      message: 'Verified successfully'
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
