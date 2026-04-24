powershell -Command "
@'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { phone, role, name } = await req.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid 10-digit number required' }, { status: 400 })
    }

    const WA_TOKEN    = process.env.WHATSAPP_TOKEN
    const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    const TEST_MODE   = !WA_TOKEN || WA_TOKEN.length < 20

    const otp = TEST_MODE ? '1234' : Math.floor(1000 + Math.random() * 9000).toString()

    await supabase.from('otp_verifications').delete().eq('phone', phone)

    const { error: insertError } = await supabase.from('otp_verifications').insert({
      phone, otp, role: role || 'tenant', name: name?.trim() || '',
      attempts: 0, used: false,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    if (insertError) {
      console.log('OTP insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    if (TEST_MODE) {
      console.log('TEST MODE OTP:', otp, 'for', phone)
      return NextResponse.json({ success: true, testMode: true, debugOtp: otp })
    }

    const waPayload = {
      messaging_product: 'whatsapp',
      to: '91' + phone,
      type: 'template',
      template: {
        name: 'rcusers',
        language: { code: 'en' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: otp }] },
          { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
        ],
      },
    }

    console.log('Sending WA:', JSON.stringify(waPayload))
    console.log('PHONE_ID:', WA_PHONE_ID, 'TOKEN_LEN:', WA_TOKEN?.length)

    const waRes  = await fetch('https://graph.facebook.com/v20.0/' + WA_PHONE_ID + '/messages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + WA_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(waPayload),
    })
    const waData = await waRes.json()
    console.log('WA response:', JSON.stringify(waData))

    if (!waRes.ok || waData.error) {
      await supabase.from('otp_verifications').delete().eq('phone', phone)
      return NextResponse.json({ error: 'WhatsApp send failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'OTP sent via WhatsApp' })

  } catch (err) {
    console.log('send-otp catch:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
'@ | Set-Content -Path route.ts -Encoding UTF8
"