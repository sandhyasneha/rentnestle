import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dcxbs8k26'
const API_KEY    = process.env.CLOUDINARY_API_KEY    || '315622584776835'
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'hXiPUNu_4EO2KrnvU1yQveGAryY'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate SHA1 signature for Cloudinary
async function generateSignature(params: Record<string, string>): Promise<string> {
  // Sort params alphabetically and create string
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')

  const stringToSign = sortedParams + API_SECRET
  const encoder      = new TextEncoder()
  const data         = encoder.encode(stringToSign)
  const hashBuffer   = await crypto.subtle.digest('SHA-1', data)
  const hashArray    = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData()
    const file       = formData.get('file') as File
    const propertyId = formData.get('property_id') as string

    console.log('Upload request - file:', file?.name, 'size:', file?.size, 'propertyId:', propertyId)

    if (!file || !propertyId) {
      return NextResponse.json({ error: 'File and property_id required' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    // ── Upload to Cloudinary ──────────────────────────
    const timestamp = Math.round(Date.now() / 1000).toString()
    const folder    = `rentnestle/${propertyId}`

    const signature = await generateSignature({ folder, timestamp })

    console.log('Cloudinary params - cloud:', CLOUD_NAME, 'folder:', folder, 'timestamp:', timestamp)

    const uploadForm = new FormData()
    uploadForm.append('file', file)
    uploadForm.append('api_key', API_KEY)
    uploadForm.append('timestamp', timestamp)
    uploadForm.append('signature', signature)
    uploadForm.append('folder', folder)

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: uploadForm }
    )

    const cloudData = await cloudRes.json()
    console.log('Cloudinary response status:', cloudRes.status)
    console.log('Cloudinary response:', JSON.stringify(cloudData))

    if (!cloudRes.ok || cloudData.error) {
      const errMsg = cloudData.error?.message || 'Cloudinary upload failed'
      console.error('Cloudinary error:', errMsg)
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }

    const photoUrl = cloudData.secure_url
    console.log('✅ Uploaded to Cloudinary:', photoUrl)

    // ── Save URL to Supabase ──────────────────────────
    const { data: property } = await supabase
      .from('properties')
      .select('photos')
      .eq('id', propertyId)
      .single()

    const currentPhotos = (property?.photos as string[]) || []
    const updatedPhotos = [...currentPhotos, photoUrl]

    const { error: dbError } = await supabase
      .from('properties')
      .update({ photos: updatedPhotos })
      .eq('id', propertyId)

    if (dbError) {
      console.error('DB save error:', dbError.message)
      // Photo uploaded but not saved — still return URL
      return NextResponse.json({
        success: true,
        url:     photoUrl,
        photos:  updatedPhotos,
        warning: 'Photo uploaded but DB save failed: ' + dbError.message,
      })
    }

    console.log('✅ Photos saved to DB:', updatedPhotos.length, 'total')

    return NextResponse.json({
      success: true,
      url:     photoUrl,
      photos:  updatedPhotos,
    })

  } catch (err: any) {
    console.error('Upload route error:', err?.message || err)
    return NextResponse.json({
      error: 'Upload failed: ' + (err?.message || 'Unknown error')
    }, { status: 500 })
  }
}
