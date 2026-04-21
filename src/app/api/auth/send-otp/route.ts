// POST /api/auth/send-otp
// TEST MODE: Just returns success — no SMS sent until DLT approved
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { phone, role, name } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit number required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // TEST MODE — no real SMS sent
    // Real SMS via MSG91 will be enabled after DLT registration
    console.log(`[TEST MODE] OTP requested for +91${phone} — use 1234`)

    return NextResponse.json({
      success: true,
      message: 'OTP sent (Test Mode — use 1234)',
      testMode: true,
    })

  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
