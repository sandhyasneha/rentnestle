import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dcxbs8k26'
const API_KEY    = process.env.CLOUDINARY_API_KEY    || '315622584776835'
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'hXiPUNu_4EO2KrnvU1yQveGAryY'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData()
    const file       = formData.get('file') as File
    const propertyId = formData.get('property_id') as string

    if (!file || !propertyId) {
      return NextResponse.json({ error: 'File and property_id required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    // ── Upload to Cloudinary ────────────────────────────
    const timestamp    = Math.round(Date.now() / 1000)
    const folder       = `rentnestle/properties/${propertyId}`
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`

    const encoder    = new TextEncoder()
    const data       = encoder.encode(paramsToSign + API_SECRET)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray  = Array.from(new Uint8Array(hashBuffer))
    const signature  = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const cloudinaryForm = new FormData()
    cloudinaryForm.append('file', file)
    cloudinaryForm.append('api_key', API_KEY)
    cloudinaryForm.append('timestamp', timestamp.toString())
    cloudinaryForm.append('signature', signature)
    cloudinaryForm.append('folder', folder)

    const res    = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    )
    const result = await res.json()

    console.log('Cloudinary response:', JSON.stringify(result))

    if (!res.ok || result.error) {
      console.error('Cloudinary error:', result.error)
      return NextResponse.json({ error: 'Upload failed: ' + (result.error?.message || 'Unknown') }, { status: 500 })
    }

    const photoUrl = result.secure_url
    console.log('Photo URL:', photoUrl)

    // ── Fetch current photos from DB ────────────────────
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('photos')
      .eq('id', propertyId)
      .single()

    if (fetchError) {
      console.error('Fetch property error:', fetchError.message)
      // Still return URL even if DB update fails
      return NextResponse.json({ success: true, url: photoUrl })
    }

    const currentPhotos = (property?.photos as string[]) || []
    const updatedPhotos = [...currentPhotos, photoUrl]

    console.log('Saving photos:', updatedPhotos)

    // ── Save updated photos array to DB ─────────────────
    const { error: updateError } = await supabase
      .from('properties')
      .update({ photos: updatedPhotos })
      .eq('id', propertyId)

    if (updateError) {
      console.error('DB update error:', updateError.message)
      return NextResponse.json({
        success: true,
        url:     photoUrl,
        warning: 'Photo uploaded but not saved to listing: ' + updateError.message,
      })
    }

    console.log('Photos saved to DB successfully')
    return NextResponse.json({
      success: true,
      url:     photoUrl,
      photos:  updatedPhotos,
    })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Server error: ' + String(err) }, { status: 500 })
  }
}
