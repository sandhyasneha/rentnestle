import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use direct client in API routes to avoid server/client confusion
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const supabase = getSupabase()

    const city          = searchParams.get('city')
    const property_type = searchParams.get('property_type')
    const min_rent      = searchParams.get('min_rent')
    const max_rent      = searchParams.get('max_rent')
    const furnishing    = searchParams.get('furnishing')
    const tenant_pref   = searchParams.get('tenant_pref')
    const lat           = searchParams.get('lat')
    const lng           = searchParams.get('lng')
    const radius_km     = searchParams.get('radius_km') || '5'
    const page          = parseInt(searchParams.get('page') || '1')
    const limit         = parseInt(searchParams.get('limit') || '20')
    const offset        = (page - 1) * limit

    if (lat && lng) {
      const { data, error } = await supabase
        .rpc('properties_near_me', {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_km: parseFloat(radius_km)
        })
      if (error) throw error
      return NextResponse.json({ properties: data, total: data?.length || 0 })
    }

    let query = supabase
      .from('properties')
      .select('*, owner:profiles(full_name, phone, avatar_url, aadhaar_verified)', { count: 'exact' })
      .eq('status', 'active')
      .order('boost_level', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (city)          query = query.ilike('city', `%${city}%`)
    if (property_type) query = query.eq('property_type', property_type)
    if (min_rent)      query = query.gte('monthly_rent', parseInt(min_rent))
    if (max_rent)      query = query.lte('monthly_rent', parseInt(max_rent))
    if (furnishing)    query = query.eq('furnishing', furnishing)
    if (tenant_pref)   query = query.in('tenant_pref', [tenant_pref, 'any'])

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({
      properties: data,
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit)
    })

  } catch (err) {
    console.error('properties GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase()
    const body = await req.json()
    const { lat, lng, ...rest } = body

    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...rest,
        location: lat && lng ? `SRID=4326;POINT(${lng} ${lat})` : null,
        status: 'draft'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ property: data }, { status: 201 })

  } catch (err) {
    console.error('properties POST error:', err)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}