import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WA_TOKEN    = process.env.WA_TOKEN    || process.env.WHATSAPP_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

// POST — Tenant sends inquiry to owner
export async function POST(req: NextRequest) {
  try {
    const { property_id, message, tenantPhone, tenantName, tenantId } = await req.json()

    if (!property_id) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }
    if (!tenantPhone) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })
    }

    // Get property + owner details
    const { data: property } = await supabase
      .from('properties')
      .select('id, title, city, monthly_rent, owner_id')
      .eq('id', property_id)
      .single()

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Save inquiry to DB
    const { data: inquiry, error: inqErr } = await supabase
      .from('inquiries')
      .insert({
        property_id,
        tenant_id:  tenantId || `rn_${tenantPhone}`,
        owner_id:   property.owner_id,
        message:    message || `Hi, I am interested in ${property.title}`,
        status:     'pending',
        is_read:    false,
      })
      .select()
      .single()

    if (inqErr) {
      console.error('Inquiry insert error:', inqErr.message)
      return NextResponse.json({ error: 'Failed to save inquiry: ' + inqErr.message }, { status: 500 })
    }

    // Get owner phone for WhatsApp notification
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', property.owner_id)
      .single()

    console.log('Owner profile:', ownerProfile)
    console.log('Sending WA to:', ownerProfile?.phone)

    // Send WhatsApp notification to owner
    if (ownerProfile?.phone && WA_TOKEN && WA_PHONE_ID) {
      const waRes = await fetch(
        `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WA_TOKEN}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to:   `91${ownerProfile.phone}`,
            type: 'text',
            text: {
              body: `🏠 *New Inquiry – RentNestle*\n\n*Property:* ${property.title}, ${property.city}\n*Rent:* ₹${property.monthly_rent?.toLocaleString()}/mo\n\n*From:* ${tenantName || 'A Tenant'}\n*Phone:* +91 ${tenantPhone}\n*Message:* ${message || 'Interested in this property'}\n\n👉 View inquiries: https://www.rentnestle.com/dashboard/owner`
            }
          }),
        }
      )
      const waData = await waRes.json()
      console.log('WA notification result:', JSON.stringify(waData))
    } else {
      console.log('WA skipped — owner phone:', ownerProfile?.phone, 'token:', !!WA_TOKEN)
    }

    return NextResponse.json({ success: true, inquiry })

  } catch (err: any) {
    console.error('Inquiry error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

// GET — Load inquiries for owner or tenant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const role   = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    let query = supabase
      .from('inquiries')
      .select('*, property:properties(id, title, city, monthly_rent, property_type, photos)')

    if (role === 'owner') {
      query = query.eq('owner_id', userId)
    } else {
      query = query.eq('tenant_id', userId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ inquiries: data || [] })

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
