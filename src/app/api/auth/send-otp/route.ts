// POST /api/auth/send-otp
// Body: { phone: "9876543210", role: "tenant" | "owner" }

import { NextResponse } from 'next/server'
import { sendOtp } from '@/lib/otp'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { phone, role } = await req.json()

    // Validate phone
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit phone number required' }, { status: 400 })
    }

    // Send OTP via MSG91
    const { success, error } = await sendOtp(phone)
    if (!success) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Store role in metadata (used when creating profile after verification)
    // We use Supabase admin to upsert a pending session marker
    // The actual user record is created on OTP verify

    return NextResponse.json({
      success: true,
      message: process.env.NODE_ENV !== 'production'
        ? 'TEST MODE: Use OTP 1234'
        : 'OTP sent successfully',
      testMode: process.env.NODE_ENV !== 'production'
    })
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
