// POST /api/verification
// Triggers state-specific verification workflow

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { POLICE_VERIFICATION_STATES } from '@/types'

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type, state, property_id } = await req.json()

    // Get tenant profile for state-specific routing
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_state, plan')
      .eq('id', user.id)
      .single()

    const targetState = (state || profile?.current_state || '').toLowerCase().replace(' ', '_')

    // Basic tier: Aadhaar or PAN only
    if (type === 'aadhaar') {
      const record = await createVerificationRecord(supabase, user.id, property_id, 'aadhaar', targetState, 'digio')
      return NextResponse.json({
        success: true,
        verification_id: record.id,
        redirect_url: `https://app.digio.in/kyc/aadhaar?ref=${record.id}`,  // Digio KYC URL
        message: 'Redirecting to Aadhaar KYC',
      })
    }

    if (type === 'pan') {
      const record = await createVerificationRecord(supabase, user.id, property_id, 'pan', targetState, 'digio')
      return NextResponse.json({
        success: true,
        verification_id: record.id,
        redirect_url: `https://app.digio.in/kyc/pan?ref=${record.id}`,
        message: 'Redirecting to PAN verification',
      })
    }

    // Police verification — state-specific
    if (type === 'police') {
      const stateConfig = POLICE_VERIFICATION_STATES[targetState]

      if (!stateConfig || !stateConfig.available) {
        return NextResponse.json({
          success: false,
          message: 'Police verification is not yet available online for this state. Please visit your local police station.',
          offline: true,
        })
      }

      const record = await createVerificationRecord(supabase, user.id, property_id, 'police', targetState, 'manual')

      return NextResponse.json({
        success: true,
        verification_id: record.id,
        portal_url: stateConfig.portal,
        method: stateConfig.method,
        message: stateConfig.method === 'online'
          ? `Online police verification available for ${targetState}`
          : 'Hybrid verification — some steps require physical presence',
      })
    }

    return NextResponse.json({ error: 'Unknown verification type' }, { status: 400 })

  } catch (err) {
    console.error('verification error:', err)
    return NextResponse.json({ error: 'Verification service unavailable' }, { status: 500 })
  }
}

async function createVerificationRecord(
  supabase: ReturnType<typeof createServerClient>,
  tenant_id: string,
  property_id: string | null,
  type: string,
  state: string,
  provider: string
) {
  const { data } = await supabase
    .from('tenant_verifications')
    .insert({ tenant_id, property_id, type, state, provider, status: 'processing' })
    .select()
    .single()
  return data!
}

// GET /api/verification?tenant_id=xxx — check status
export async function GET(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('tenant_verifications')
    .select('*')
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ verifications: data })
}
