// POST /api/ai/description
// Generates an attractive property description from amenities + details
// Uses gpt-4o-mini (~$0.15/1M tokens — very cheap)

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { property } = await req.json()

    const prompt = `
You are a property listing expert for an Indian rental portal. 
Write an attractive, concise property description (3-4 sentences) based on:

Property: ${property.property_type?.toUpperCase()} in ${property.city}, ${property.state}
Rent: ₹${property.monthly_rent}/month
Furnishing: ${property.furnishing?.replace('_', ' ')}
Floor: ${property.floor_number || 'N/A'} of ${property.total_floors || 'N/A'}
Area: ${property.area_sqft || 'N/A'} sq.ft
Tenant: ${property.tenant_pref} | Food: ${property.food_pref?.replace('_', ' ')}
Amenities: ${Object.entries(property.amenities || {})
  .filter(([_, v]) => v)
  .map(([k]) => k.replace(/_/g, ' '))
  .join(', ')}

Rules:
- Highlight key selling points naturally
- Mention zero brokerage and digital agreement
- Keep it warm and professional
- Do NOT mention price (already shown separately)
- Max 80 words
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    })

    const description = completion.choices[0]?.message?.content?.trim()
    return NextResponse.json({ description })

  } catch (err) {
    console.error('AI description error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
