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
    const body        = await req.json()
    const propertyId  = params.id
    const { ownerPhone, ...updates } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    // Verify property exists
    const { data: prop } = await supabase
      .from('properties')
      .select('id, owner_id')
      .eq('id', propertyId)
      .single()

    if (!prop) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Build update object
    const allowed = [
      'status','photos','title','property_type','monthly_rent','security_deposit',
      'address_line1','address_line2','city','state','pincode','bedrooms','bathrooms',
      'area_sqft','floor_number','total_floors','furnishing','tenant_pref',
      'food_pref','amenities','description',
    ]

    const updateData: Record<string, any> = {}
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        const numeric = ['monthly_rent','security_deposit','bedrooms','bathrooms',
          'area_sqft','floor_number','total_floors']
        updateData[key] = numeric.includes(key) && updates[key]
          ? parseInt(updates[key])
          : updates[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, property: data })

  } catch (err: any) {
    console.error('PATCH error:', err)
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
