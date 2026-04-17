import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POLICE_VERIFICATION_STATES } from '@/types'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
)

export async function POST(req: Request) {
  try {
    const supabase = getSupabase()
    const { type, state, property_id, tenant_id } = await req.json()

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    const targetState = (state || '').toLowerCase().replace(' ', '_')

    if (type === 'aadhaar') {
      const { data } = await supabase
        .from('tenant_verifications')
        .insert({ tenant_id, property_id, type: 'aadhaar', state: targetState, provider: 'digio', status: 'processing' })
        .select().single()
      return NextResponse.json({
        success: true,
        verification_id: data?.id,
        redirect_url: `https://app.digio.in/kyc/aadhaar?ref=${data?.id}`,
      })
    }

    if (type === 'pan') {
      const { data } = await supabase
        .from('tenant_verifications')
        .insert({ tenant_id, property_id, type: 'pan', state: targetState, provider: 'digio', status: 'processing' })
        .select().single()
      return NextResponse.json({
        success: true,
        verification_id: data?.id,
        redirect_url: `https://app.digio.in/kyc/pan?ref=${data?.id}`,
      })
    }

    if (type === 'police') {
      const stateConfig = POLICE_VERIFICATION_STATES[targetState]
      if (!stateConfig?.available) {
        return NextResponse.json({
          success: false,
          message: 'Police verification not available online for this state.',
          offline: true,
        })
      }
      const { data } = await supabase
        .from('tenant_verifications')
        .insert({ tenant_id, property_id, type: 'police', state: targetState, provider: 'manual', status: 'processing' })
        .select().single()
      return NextResponse.json({
        success: true,
        verification_id: data?.id,
        portal_url: stateConfig.portal,
        method: stateConfig.method,
      })
    }

    return NextResponse.json({ error: 'Unknown verification type' }, { status: 400 })

  } catch (err) {
    console.error('verification error:', err)
    return NextResponse.json({ error: 'Verification service unavailable' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenant_id = searchParams.get('tenant_id')
  if (!tenant_id) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  const supabase = getSupabase()
  const { data } = await supabase
    .from('tenant_verifications')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ verifications: data })
}