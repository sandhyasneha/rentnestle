// POST /api/auth/verify-otp
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
      return NextResponse.json({ error: 'Phone, OTP and role are required' }, { status: 400 })
    }

    // TEST MODE: Accept 1234 until SMS/DLT is configured
    if (otp !== '1234') {
      return NextResponse.json({ error: 'Invalid OTP. Use 1234 in test mode.' }, { status: 401 })
    }

    const fullPhone = `+91${phone}`

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.phone === fullPhone)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: fullPhone,
        phone_confirm: true,
        app_metadata: { role, name },
        user_metadata: { full_name: name, role },
      })

      if (createError || !newUser.user) {
        console.error('Create user error:', createError?.message)
        return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
      }

      userId = newUser.user.id
    }

    // Upsert profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id:        userId,
        phone:     phone,
        role:      role,
        full_name: name || null,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError.message)
      // Don't fail — profile might already exist
    }

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${phone}@rentnestle.temp`,
    })

    return NextResponse.json({
      success:      true,
      userId,
      role,
      name:         name || '',
      phone,
      message:      'Verified successfully',
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
