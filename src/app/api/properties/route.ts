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
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    )
    return payload as { phone: string; userId: string; role: string; name: string }
  } catch {
    return null
  }
}

// GET: Search/list properties
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q          = searchParams.get('q') || ''
    const city       = searchParams.get('city') || ''
    const type       = searchParams.get('type') || ''
    const budget     = searchParams.get('budget') || ''
    const furnishing = searchParams.get('furnishing') || ''
    const owner_id   = searchParams.get('owner_id') || ''
    const page       = parseInt(searchParams.get('page') || '1')
    const limit      = parseInt(searchParams.get('limit') || '12')
    const offset     = (page - 1) * limit

    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (owner_id) {
      query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('owner_id', owner_id)
        .order('created_at', { ascending: false })
    }

    if (q) query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%,address_line1.ilike.%${q}%`)
    if (city && city !== 'All India') query = query.ilike('city', `%${city}%`)
    if (type && type !== 'Any') {
      const typeMap: Record<string, string> = {
        '1 BHK':'1bhk','2 BHK':'2bhk','3 BHK':'3bhk',
        '4 BHK':'4bhk','Studio':'studio','PG / Room':'pg',
      }
      query = query.eq('property_type', typeMap[type] || type.toLowerCase())
    }
    if (furnishing && furnishing !== 'Any') {
      const fMap: Record<string, string> = {
        'Unfurnished':'unfurnished',
        'Semi Furnished':'semi_furnished',
        'Fully Furnished':'fully_furnished',
      }
      query = query.eq('furnishing', fMap[furnishing] || furnishing)
    }
    if (budget && budget !== 'Any Budget') {
      if (budget === 'Under ₹10k')  query = query.lt('monthly_rent', 10000)
      if (budget === '₹10k–20k')    query = query.gte('monthly_rent', 10000).lte('monthly_rent', 20000)
      if (budget === '₹20k–40k')    query = query.gte('monthly_rent', 20000).lte('monthly_rent', 40000)
      if (budget === '₹40k+')       query = query.gte('monthly_rent', 40000)
    }

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({
      properties: data || [],
      total:      count || 0,
      page,
      pages:      Math.ceil((count || 0) / limit),
    })
  } catch (err) {
    console.error('GET properties error:', err)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST: Create new listing
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to list a property' }, { status: 401 })
    }
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can list properties' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, property_type, monthly_rent, security_deposit,
      address_line1, address_line2, city, state, pincode,
      bedrooms, bathrooms, area_sqft, floor_number, total_floors,
      furnishing, tenant_pref, food_pref, amenities, description,
      status, lat, lng,
    } = body

    if (!title || !property_type || !monthly_rent || !city || !state) {
      return NextResponse.json({ error: 'Title, type, rent, city and state are required' }, { status: 400 })
    }

    const insertData: any = {
      owner_id:         user.userId,
      title,
      property_type,
      monthly_rent:     parseInt(monthly_rent),
      security_deposit: parseInt(security_deposit || '0'),
      address_line1:    address_line1 || '',
      address_line2:    address_line2 || null,
      city,
      state,
      pincode:          pincode || '',
      bedrooms:         parseInt(bedrooms || '1'),
      bathrooms:        parseInt(bathrooms || '1'),
      area_sqft:        area_sqft ? parseInt(area_sqft) : null,
      floor_number:     floor_number ? parseInt(floor_number) : null,
      total_floors:     total_floors ? parseInt(total_floors) : null,
      furnishing:       furnishing || 'unfurnished',
      tenant_pref:      tenant_pref || 'any',
      food_pref:        food_pref || 'no_restriction',
      amenities:        amenities || {},
      description:      description || null,
      status:           status || 'draft',
      boost_level:      0,
      photos:           [],
    }

    if (lat && lng) {
      insertData.location = `SRID=4326;POINT(${lng} ${lat})`
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Insert property error:', error.message)
      return NextResponse.json({ error: 'Failed to save property: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, property: data }, { status: 201 })

  } catch (err) {
    console.error('POST properties error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH: Update property status
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { id, status } = await req.json()

    const { data, error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', id)
      .eq('owner_id', user.userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, property: data })

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
