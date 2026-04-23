import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WA_TOKEN    = process.env.WHATSAPP_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const TEST_MODE   = !WA_TOKEN || WA_TOKEN.length < 20

export async function POST(req: NextRequest) {
  try {
    const { phone, role, name } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit number required' }, { status: 400 })
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate 4-digit OTP
    const otp = TEST_MODE
      ? '1234'  // Always 1234 in test mode
      : Math.floor(1000 + Math.random() * 9000).toString()

    // Delete any existing OTPs for this phone
    await supabase.from('otp_verifications').delete().eq('phone', phone)

    // Store OTP in Supabase (expires in 10 minutes)
    const { error: insertError } = await supabase.from('otp_verifications').insert({
      phone,
      otp,
      role:       role || 'tenant',
      name:       name.trim(),
      attempts:   0,
      used:       false,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    if (insertError) {
      console.error('OTP store error:', insertError.message)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // ── Test mode: return OTP in response ───────────────
    if (TEST_MODE) {
      console.log(`[TEST MODE] OTP for ${phone}: ${otp}`)
      return NextResponse.json({
        success:  true,
        testMode: true,
        debugOtp: otp,
        message:  'Test mode — OTP shown below',
      })
    }

    // ── Production: Send via WhatsApp ───────────────────
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${WA_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to:   `91${phone}`,
          type: 'template',
          template: {
            name:     'rcusers',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              },
              {
                type:       'button',
                sub_type:   'url',
                index:      '0',
                parameters: [{ type: 'text', text: otp }],
              },
            ],
          },
        }),
      }
    )

    const waData = await waRes.json()

    if (!waRes.ok || waData.error) {
      console.error('WhatsApp error:', JSON.stringify(waData))
      // Delete the stored OTP since send failed
      await supabase.from('otp_verifications').delete().eq('phone', phone)
      return NextResponse.json({ error: 'Failed to send WhatsApp message. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to WhatsApp +91${phone}`,
    })

  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
