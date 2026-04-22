// POST /api/auth/verify-otp
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { phone, otp, role, name } = await req.json()

    if (!phone || !otp || !role) {
      return NextResponse.json({ error: 'Phone, OTP and role are required' }, { status: 400 })
    }

    // TEST MODE: Accept 1234
    if (otp !== '1234') {
      return NextResponse.json({ 
        error: 'Invalid OTP. Use 1234 in test mode.' 
      }, { status: 401 })
    }

    // Try to create/find user in Supabase using admin client
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const fullPhone = `+91${phone}`

      // Try to create user
      const { data: userData, error: createError } = await supabaseAdmin
        .auth.admin.createUser({
          phone: fullPhone,
          phone_confirm: true,
          app_metadata: { role },
          user_metadata: { full_name: name, role },
        })

      let userId = userData?.user?.id

      // If user already exists, find them
      if (createError && createError.message.includes('already')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
        const existing = listData?.users?.find((u: any) => u.phone === fullPhone)
        userId = existing?.id
      }

      if (userId) {
        // Upsert profile
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          phone,
          role,
          full_name: name || null,
        }, { onConflict: 'id' })

        return NextResponse.json({
          success: true,
          userId,
          role,
          name: name || '',
          phone,
          message: 'Verified successfully',
        })
      }
    } catch (dbErr) {
      console.error('Supabase error (non-fatal):', dbErr)
      // Even if Supabase fails, allow login in test mode
    }

    // Fallback — return success even without DB (pure test mode)
    return NextResponse.json({
      success:  true,
      userId:   `test-${phone}`,
      role,
      name:     name || '',
      phone,
      message:  'Verified (test mode - no DB)',
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
