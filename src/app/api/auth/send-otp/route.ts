// POST /api/auth/send-otp
// Sends OTP via WhatsApp Business API using Authentication template
import { NextResponse } from 'next/server'

const WA_TOKEN    = process.env.WHATSAPP_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const TEST_MODE   = !WA_TOKEN || WA_TOKEN.length < 20

export async function POST(req: Request) {
  try {
    const { phone, role, name } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit number required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate a real 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    // Store OTP temporarily (in production use Redis/Supabase)
    // For now we store in a global map (resets on serverless cold start)
    // TODO: Replace with Supabase table for persistence
    otpStore.set(`+91${phone}`, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      name,
      role,
    })

    if (TEST_MODE) {
      // Test mode — no real WhatsApp sent
      console.log(`[TEST MODE] OTP for +91${phone}: ${otp}`)
      return NextResponse.json({
        success: true,
        message: 'OTP sent (Test Mode)',
        testMode: true,
        // Remove this in production!
        debugOtp: otp,
      })
    }

    // Send via WhatsApp Authentication Template
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WA_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: 'rcusers',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: otp }
                ]
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  { type: 'text', text: otp }
                ]
              }
            ]
          }
        }),
      }
    )

    const waData = await waRes.json()

    if (!waRes.ok || waData.error) {
      console.error('WhatsApp API error:', waData)
      return NextResponse.json({
        error: 'Failed to send WhatsApp OTP. Please try again.',
      }, { status: 500 })
    }

    console.log(`WhatsApp OTP sent to +91${phone}`)
    return NextResponse.json({
      success: true,
      message: `OTP sent to WhatsApp +91${phone}`,
    })

  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}

// Simple in-memory OTP store
// TODO: Replace with Supabase for production persistence
export const otpStore = new Map<string, {
  otp: string
  expires: number
  name: string
  role: string
}>()
