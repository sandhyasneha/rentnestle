import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dcxbs8k26'
const API_KEY    = process.env.CLOUDINARY_API_KEY    || '315622584776835'
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'hXiPUNu_4EO2KrnvU1yQveGAryY'

// Use SERVICE ROLE — bypasses all RLS/auth issues
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sha1(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData()
    const file       = formData.get('file') as File
    const propertyId = formData.get('property_id') as string

    if (!file || !propertyId) {
      return NextResponse.json({ error: 'Missing file or property_id' }, { status: 400 })
    }

    // 1. Upload to Cloudinary
    const timestamp = String(Math.round(Date.now() / 1000))
    const folder    = `rentnestle/${propertyId}`
    const signature = await sha1(`folder=${folder}&timestamp=${timestamp}${API_SECRET}`)

    const cf = new FormData()
    cf.append('file', file)
    cf.append('api_key', API_KEY)
    cf.append('timestamp', timestamp)
    cf.append('signature', signature)
    cf.append('folder', folder)

    const cRes  = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: cf }
    )
    const cData = await cRes.json()

    if (!cRes.ok || cData.error) {
      return NextResponse.json({ 
        error: 'Cloudinary: ' + (cData.error?.message || 'upload failed') 
      }, { status: 500 })
    }

    const url = cData.secure_url

    // 2. Get current photos array
    const { data: prop } = await supabase
      .from('properties')
      .select('photos')
      .eq('id', propertyId)
      .single()

    const photos = [...((prop?.photos as string[]) || []), url]

    // 3. Save back to DB — service role bypasses all RLS
    const { error: dbErr } = await supabase
      .from('properties')
      .update({ photos })
      .eq('id', propertyId)

    if (dbErr) {
      return NextResponse.json({ 
        error: 'DB: ' + dbErr.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, url, photos })

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

// DELETE a single photo
export async function DELETE(req: NextRequest) {
  try {
    const { propertyId, photoUrl } = await req.json()

    if (!propertyId || !photoUrl) {
      return NextResponse.json({ error: 'Missing propertyId or photoUrl' }, { status: 400 })
    }

    const { data: prop } = await supabase
      .from('properties')
      .select('photos')
      .eq('id', propertyId)
      .single()

    const photos = ((prop?.photos as string[]) || []).filter(p => p !== photoUrl)

    const { error } = await supabase
      .from('properties')
      .update({ photos })
      .eq('id', propertyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, photos })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
