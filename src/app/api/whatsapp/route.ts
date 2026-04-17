// WhatsApp Cloud API webhook
// GET  /api/whatsapp — webhook verification by Meta
// POST /api/whatsapp — incoming messages

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const WA_TOKEN      = process.env.WHATSAPP_TOKEN!
const WA_PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID!
const VERIFY_TOKEN  = process.env.WHATSAPP_VERIFY_TOKEN!

// ── Meta webhook verification ─────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// ── Incoming message handler ──────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!message) return NextResponse.json({ ok: true })

    const fromPhone = message.from       // user's WhatsApp number
    const msgText   = message.text?.body?.trim() || ''

    // Find user profile by phone
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, plan, preferred_lang')
      .eq('phone', fromPhone.replace(/^91/, ''))   // strip country code
      .single()

    const lang = profile?.preferred_lang || 'en'

    // AI reply using GPT-4o-mini
    const systemPrompt = `You are RentNestle's AI assistant. 
You help Indian landlords and tenants with zero-brokerage rentals, digital agreements, and tenant verification.
User: ${profile?.full_name || 'Guest'}, Role: ${profile?.role || 'unknown'}, Plan: ${profile?.plan || 'free'}
Reply language: ${lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English'}
Keep replies under 150 words. Be helpful and friendly.
Portal URL: https://rentnesttle.com`

    const aiReply = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: msgText },
      ],
      max_tokens: 200,
    })

    const replyText = aiReply.choices[0]?.message?.content || "Sorry, I couldn't process that. Please visit rentnesttle.com"

    // Send WhatsApp reply via Meta API
    await sendWhatsAppMessage(fromPhone, replyText)

    // Log conversation to Supabase (optional — for analytics)
    if (profile?.id) {
      await supabaseAdmin.from('whatsapp_logs' as any).insert({
        user_id:  profile.id,
        message:  msgText,
        reply:    replyText,
        lang,
      }).throwOnError()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ ok: true })   // always return 200 to Meta
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
}

// ── Helper: send WhatsApp notification to owner ───────────
// Call this from other API routes when a new inquiry comes in
export async function notifyOwnerWhatsApp(ownerPhone: string, tenantName: string, propertyTitle: string) {
  const message = `🏠 *New Inquiry — RentNestle*\n\n*${tenantName}* is interested in your property:\n📌 ${propertyTitle}\n\nOpen your dashboard to view their profile and respond.\n👉 https://rentnesttle.com/dashboard/owner`
  await sendWhatsAppMessage(`91${ownerPhone}`, message)
}
