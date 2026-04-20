// Data Deletion Callback API
// Meta calls this endpoint when a user requests data deletion via Facebook Login
// GET  /api/data-deletion?signed_request=xxx  — Meta's signed request
// POST /api/data-deletion                      — Direct deletion request from our HTML page

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const APP_SECRET = process.env.META_APP_SECRET ?? ''

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Parse Meta's signed_request ──────────────────────────
function parseSignedRequest(signedRequest: string): { user_id?: string } | null {
  try {
    const [encodedSig, payload] = signedRequest.split('.')
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    const expectedSig = crypto.createHmac('sha256', APP_SECRET).update(payload).digest()
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null
    return data
  } catch {
    return null
  }
}

// ── GET: Meta's signed_request callback ──────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const signedRequest = searchParams.get('signed_request')

  if (!signedRequest) {
    // Redirect to our human-readable deletion page
    return NextResponse.redirect(new URL('/data-deletion.html', req.url))
  }

  const data = parseSignedRequest(signedRequest)
  if (!data || !data.user_id) {
    return NextResponse.json({ error: 'Invalid signed request' }, { status: 400 })
  }

  const confirmationCode = `RN-DEL-${Date.now().toString(36).toUpperCase()}`

  // Queue deletion (process async)
  try {
    const supabase = getSupabase()
    // Log deletion request
    await supabase.from('data_deletion_requests' as any).insert({
      meta_user_id: data.user_id,
      confirmation_code: confirmationCode,
      status: 'pending',
      requested_at: new Date().toISOString(),
    }).throwOnError()
  } catch {
    // Table may not exist yet — still return success to Meta
    console.log(`Data deletion queued for Meta user: ${data.user_id}, ref: ${confirmationCode}`)
  }

  // Meta requires this exact JSON response format
  return NextResponse.json({
    url: `https://www.rentnestle.com/data-deletion.html?ref=${confirmationCode}`,
    confirmation_code: confirmationCode,
  })
}

// ── POST: Our HTML form submission ────────────────────────
export async function POST(req: Request) {
  try {
    const { phone, name, email, reason, ref } = await req.json()

    if (!phone || !email) {
      return NextResponse.json({ error: 'Phone and email are required' }, { status: 400 })
    }

    const confirmationCode = ref || `RN-DEL-${Date.now().toString(36).toUpperCase()}`

    // Log to Supabase
    try {
      const supabase = getSupabase()
      await supabase.from('data_deletion_requests' as any).insert({
        phone,
        full_name: name,
        email,
        reason,
        confirmation_code: confirmationCode,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
    } catch {
      // Log even if DB insert fails
      console.log(`Deletion request: ${phone}, ${email}, ref: ${confirmationCode}`)
    }

    // TODO: Send confirmation email via your email provider
    // TODO: Actually delete user data after 30-day period

    return NextResponse.json({
      success: true,
      confirmation_code: confirmationCode,
      message: 'Deletion request received. We will process within 30 days.',
    })

  } catch (err) {
    console.error('Data deletion error:', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
