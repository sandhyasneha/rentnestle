import { NextRequest, NextResponse } from 'next/server'

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME  || 'dcxbs8k26'
const API_KEY     = process.env.CLOUDINARY_API_KEY     || '315622584776835'
const API_SECRET  = process.env.CLOUDINARY_API_SECRET  || 'hXiPUNu_4EO2KrnvU1yQveGAryY'

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData()
    const file       = formData.get('file') as File
    const propertyId = formData.get('property_id') as string

    if (!file || !propertyId) {
      return NextResponse.json({ error: 'File and property_id required' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    // Generate Cloudinary signature
    const timestamp  = Math.round(Date.now() / 1000)
    const folder     = `rentnestle/properties/${propertyId}`
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`

    // Create SHA1 signature
    const encoder    = new TextEncoder()
    const data       = encoder.encode(paramsToSign + API_SECRET)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray  = Array.from(new Uint8Array(hashBuffer))
    const signature  = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Upload to Cloudinary
    const cloudinaryForm = new FormData()
    cloudinaryForm.append('file', file)
    cloudinaryForm.append('api_key', API_KEY)
    cloudinaryForm.append('timestamp', timestamp.toString())
    cloudinaryForm.append('signature', signature)
    cloudinaryForm.append('folder', folder)
    cloudinaryForm.append('transformation', 'q_auto,f_auto,w_1200,h_800,c_limit')

    const res  = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    )
    const result = await res.json()

    if (!res.ok || result.error) {
      console.error('Cloudinary error:', result.error)
      return NextResponse.json({ error: 'Upload failed: ' + (result.error?.message || 'Unknown error') }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url:     result.secure_url,
      width:   result.width,
      height:  result.height,
    })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
