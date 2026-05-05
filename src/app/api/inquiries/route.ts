import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jwtVerify } from 'jose'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserFromRequest(req: NextRequest) {
  try {
    const token = req.cookies.get('rentnestle_token')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
    return payload as { phone: string; userId: string; role: string; name: string }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

    const { property_id, message } = await req.json()
    if (!property_id) return NextResponse.json({ error: 'Property ID required' }, { status: 400 })

    // Get property + owner details
    const { data: property } = await supabase
      .from('properties')
      .select('id, title, city, monthly_rent, owner_id')
      .eq('id', property_id)
      .single()

    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

    // Save inquiry
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        property_id,
        tenant_id:  user.userId,
        owner_id:   property.owner_id,
        message:    message || `Hi, I am interested in ${property.title}`,
        status:     'pending',
        is_read:    false,
      })
      .select()
      .single()

    if (error) {
      console.error('Inquiry insert error:', error.message)
      return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 })
    }

    // Get owner profile for WhatsApp notification
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', property.owner_id)
      .single()

    // Send WhatsApp notification to owner
    if (ownerProfile?.phone) {
      await sendWhatsAppNotification(
        ownerProfile.phone,
        user.name || 'A tenant',
        user.phone,
        property.title,
        property.city,
        property.monthly_rent
      )
    }

    return NextResponse.json({ success: true, inquiry })

  } catch (err) {
    console.error('Inquiry error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || user.role

    let query = supabase.from('inquiries').select('*, property:properties(title, city, monthly_rent, property_type)')

    if (role === 'owner') {
      query = query.eq('owner_id', user.userId)
    } else {
      query = query.eq('tenant_id', user.userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(20)
    if (error) throw error

    return NextResponse.json({ inquiries: data || [] })

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function sendWhatsAppNotification(
  ownerPhone: string,
  tenantName: string,
  tenantPhone: string,
  propertyTitle: string,
  city: string,
  rent: number
) {
  const WA_TOKEN    = process.env.WA_TOKEN || process.env.WHATSAPP_TOKEN
  const WA_PHONE_ID = process.env.WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!WA_TOKEN || !WA_PHONE_ID) return

  try {
    await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:   `91${ownerPhone}`,
        type: 'text',
        text: {
          body: `🏠 *New Inquiry on RentNestle!*\n\n*Property:* ${propertyTitle}, ${city}\n*Rent:* ₹${rent?.toLocaleString()}/mo\n\n*Tenant:* ${tenantName}\n*Phone:* +91 ${tenantPhone}\n\nLog in to RentNestle to respond: https://www.rentnestle.com/dashboard/owner`
        }
      }),
    })
  } catch (err) {
    console.error('WhatsApp notification error:', err)
  }
}
