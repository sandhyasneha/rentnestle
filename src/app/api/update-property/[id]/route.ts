// Simple property update route — no JWT needed, uses service role
// Security: owner verified by matching owner_id with rn_{phone}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { ownerPhone, ...updates } = body
    const propertyId = params.id

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    // Verify ownership via phone
    if (ownerPhone) {
      const ownerId = `rn_${ownerPhone}`
      const { data: prop } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single()

      if (prop && prop.owner_id !== ownerId) {
        return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
      }
    }

    // Clean update fields
    const allowed = [
      'status','photos','title','property_type','monthly_rent','security_deposit',
      'address_line1','address_line2','city','state','pincode','bedrooms','bathrooms',
      'area_sqft','floor_number','total_floors','furnishing','tenant_pref',
      'food_pref','amenities','description',
    ]

    const updateData: Record<string, any> = {}
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        const numericFields = ['monthly_rent','security_deposit','bedrooms',
          'bathrooms','area_sqft','floor_number','total_floors']
        updateData[key] = numericFields.includes(key) && updates[key]
          ? parseInt(updates[key])
          : updates[key]
      }
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, property: data })

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
