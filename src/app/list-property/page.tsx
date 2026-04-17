'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { PropertyType, FurnishingType, TenantPreference, FoodPreference, Amenities } from '@/types'

type Step = 1 | 2 | 3 | 4

const AMENITIES_LIST = [
  { key: 'parking',          label: '🚗 Parking' },
  { key: 'power_backup',     label: '⚡ Power Backup' },
  { key: 'ac',               label: '❄️ AC' },
  { key: 'lift',             label: '🛗 Lift' },
  { key: 'security',         label: '🔒 Security' },
  { key: 'wifi',             label: '📶 WiFi' },
  { key: 'gym',              label: '💪 Gym' },
  { key: 'modular_kitchen',  label: '🍳 Modular Kitchen' },
  { key: 'swimming_pool',    label: '🏊 Pool' },
  { key: 'east_facing',      label: '🌅 East Facing' },
  { key: 'piped_gas',        label: '🔥 Piped Gas' },
  { key: 'club_house',       label: '🏛️ Club House' },
]

export default function ListPropertyPage() {
  const router  = useRouter()
  const [step, setStep]       = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [genAI, setGenAI]     = useState(false)

  // Form state
  const [form, setForm] = useState({
    title:           '',
    property_type:   '2bhk' as PropertyType,
    monthly_rent:    '',
    security_deposit:'',
    address_line1:   '',
    city:            '',
    state:           '',
    pincode:         '',
    lat:             '',
    lng:             '',
    bedrooms:        2,
    bathrooms:       1,
    area_sqft:       '',
    floor_number:    '',
    total_floors:    '',
    furnishing:      'semi_furnished' as FurnishingType,
    tenant_pref:     'any' as TenantPreference,
    food_pref:       'no_restriction' as FoodPreference,
    amenities:       {} as Amenities,
    description:     '',
  })

  const update = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const toggleAmenity = (key: string) => {
    setForm(f => ({ ...f, amenities: { ...f.amenities, [key]: !f.amenities[key as keyof Amenities] } }))
  }

  // AI description generator
  const generateDescription = async () => {
    setGenAI(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: form }),
      })
      const data = await res.json()
      if (data.description) update('description', data.description)
    } catch { /* silent fail */ }
    setGenAI(false)
  }

  // Submit listing
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monthly_rent:     parseInt(form.monthly_rent),
          security_deposit: parseInt(form.security_deposit || '0'),
          bedrooms:         form.bedrooms,
          bathrooms:        form.bathrooms,
          area_sqft:        form.area_sqft ? parseInt(form.area_sqft) : null,
          floor_number:     form.floor_number ? parseInt(form.floor_number) : null,
          total_floors:     form.total_floors ? parseInt(form.total_floors) : null,
          lat:              form.lat ? parseFloat(form.lat) : null,
          lng:              form.lng ? parseFloat(form.lng) : null,
        }),
      })
      const data = await res.json()
      if (res.ok) router.push('/dashboard/owner')
      else alert(data.error || 'Failed to create listing')
    } catch {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#f7f9f7', border: '1.5px solid #e0e4e0',
    borderRadius: 10, padding: '10px 12px', fontSize: '.9rem',
    fontFamily: 'inherit', outline: 'none', color: '#1a1a1a',
  }
  const labelStyle = { display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 5 }
  const rowStyle   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '.25rem' }}>
        List Your Property
      </h1>
      <p style={{ fontSize: '.85rem', color: '#555', marginBottom: '1.5rem' }}>
        Step {step} of 4 — {['Basic Details', 'Address & Location', 'Features & Amenities', 'Preview & Publish'][step - 1]}
      </p>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#e0e4e0', borderRadius: 2, marginBottom: '1.75rem' }}>
        <div style={{ height: '100%', background: '#0F6E56', borderRadius: 2, width: `${step * 25}%`, transition: 'width .3s' }} />
      </div>

      {/* ── STEP 1: BASIC DETAILS ───────────────────────── */}
      {step === 1 && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Property Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['1bhk','2bhk','3bhk','4bhk','studio','pg','villa','commercial'] as PropertyType[]).map(t => (
                <button key={t} onClick={() => update('property_type', t)} style={{
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.property_type === t ? '#0F6E56' : '#e0e4e0',
                  background: form.property_type === t ? '#E1F5EE' : '#fff',
                  color: form.property_type === t ? '#0F6E56' : '#555',
                  fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
                }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Listing Title</label>
            <input style={inputStyle} placeholder="e.g. Spacious 2BHK with balcony near Metro"
              value={form.title} onChange={e => update('title', e.target.value)} />
          </div>

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Monthly Rent (₹)</label>
              <input style={inputStyle} type="number" placeholder="18000"
                value={form.monthly_rent} onChange={e => update('monthly_rent', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Security Deposit (₹)</label>
              <input style={inputStyle} type="number" placeholder="36000"
                value={form.security_deposit} onChange={e => update('security_deposit', e.target.value)} />
            </div>
          </div>

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Bedrooms</label>
              <input style={inputStyle} type="number" min={1} max={10}
                value={form.bedrooms} onChange={e => update('bedrooms', parseInt(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Bathrooms</label>
              <input style={inputStyle} type="number" min={1} max={10}
                value={form.bathrooms} onChange={e => update('bathrooms', parseInt(e.target.value))} />
            </div>
          </div>

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Area (sq.ft)</label>
              <input style={inputStyle} type="number" placeholder="950"
                value={form.area_sqft} onChange={e => update('area_sqft', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Furnishing</label>
              <select style={inputStyle} value={form.furnishing} onChange={e => update('furnishing', e.target.value)}>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi Furnished</option>
                <option value="fully_furnished">Fully Furnished</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: ADDRESS ─────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Street Address (use Google Places on frontend)</label>
            <input style={inputStyle} placeholder="e.g. 12, Anna Salai"
              value={form.address_line1} onChange={e => update('address_line1', e.target.value)} />
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} placeholder="Chennai"
                value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select style={inputStyle} value={form.state} onChange={e => update('state', e.target.value)}>
                <option value="">Select state</option>
                {['Tamil Nadu','Karnataka','Maharashtra','Delhi','Telangana','Kerala','Gujarat','Rajasthan','Uttar Pradesh','West Bengal'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Pincode</label>
              <input style={inputStyle} placeholder="600001" maxLength={6}
                value={form.pincode} onChange={e => update('pincode', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Floor</label>
              <input style={inputStyle} type="number" placeholder="3"
                value={form.floor_number} onChange={e => update('floor_number', e.target.value)} />
            </div>
          </div>
          <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', fontSize: '.8rem', color: '#0F6E56', marginTop: '.5rem' }}>
            💡 <strong>Tip:</strong> In your Next.js app, use Google Places Autocomplete to auto-fill address + coordinates. Coordinates enable "Near Me" search and Street View.
          </div>
        </div>
      )}

      {/* ── STEP 3: FEATURES ────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Tenant Preference</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['any','family','bachelors','company_lease'] as TenantPreference[]).map(t => (
                <button key={t} onClick={() => update('tenant_pref', t)} style={{
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.tenant_pref === t ? '#0F6E56' : '#e0e4e0',
                  background: form.tenant_pref === t ? '#E1F5EE' : '#fff',
                  color: form.tenant_pref === t ? '#0F6E56' : '#555',
                  fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
                }}>
                  {t === 'company_lease' ? 'Company' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Food Preference</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'no_restriction', l: '🍗 No restriction' }, { v: 'veg_only', l: '🥦 Veg only' }].map(f => (
                <button key={f.v} onClick={() => update('food_pref', f.v)} style={{
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.food_pref === f.v ? '#0F6E56' : '#e0e4e0',
                  background: form.food_pref === f.v ? '#E1F5EE' : '#fff',
                  color: form.food_pref === f.v ? '#0F6E56' : '#555',
                  fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
                }}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AMENITIES_LIST.map(a => (
                <button key={a.key} onClick={() => toggleAmenity(a.key)} style={{
                  padding: '6px 12px', borderRadius: 8, border: '1.5px solid',
                  borderColor: form.amenities[a.key as keyof Amenities] ? '#0F6E56' : '#e0e4e0',
                  background: form.amenities[a.key as keyof Amenities] ? '#E1F5EE' : '#fff',
                  color: form.amenities[a.key as keyof Amenities] ? '#0F6E56' : '#555',
                  fontWeight: 500, fontSize: '.78rem', cursor: 'pointer',
                }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Description</label>
              <button onClick={generateDescription} disabled={genAI} style={{
                background: genAI ? '#e0e4e0' : '#0F6E56', color: '#fff', border: 'none',
                padding: '4px 12px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700, cursor: genAI ? 'not-allowed' : 'pointer',
              }}>
                {genAI ? '⏳ Generating...' : '✨ AI Generate'}
              </button>
            </div>
            <textarea style={{ ...inputStyle, height: 100, resize: 'vertical' as const }}
              placeholder="Describe your property... or click AI Generate above"
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── STEP 4: PREVIEW & PUBLISH ───────────────────── */}
      {step === 4 && (
        <div>
          <div style={{ background: '#f7f9f7', border: '1px solid #e0e4e0', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '1.05rem', marginBottom: '.5rem' }}>{form.title || 'Untitled Listing'}</h3>
            <div style={{ fontSize: '.82rem', color: '#555', marginBottom: '.4rem' }}>
              📍 {form.address_line1}, {form.city}, {form.state} {form.pincode}
            </div>
            <div style={{ fontSize: '.82rem', color: '#555', marginBottom: '.75rem' }}>
              {form.property_type?.toUpperCase()} · {form.bedrooms}BHK · {form.furnishing?.replace('_',' ')}
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', fontWeight: 700, color: '#0F6E56' }}>
                ₹{parseInt(form.monthly_rent || '0').toLocaleString()}/mo
              </div>
              <div style={{ background: '#FAEEDA', color: '#BA7517', fontSize: '.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>
                0 Brokerage
              </div>
            </div>
            {form.description && (
              <p style={{ fontSize: '.82rem', color: '#555', marginTop: '.75rem', lineHeight: 1.6, borderTop: '1px solid #e0e4e0', paddingTop: '.75rem' }}>
                {form.description}
              </p>
            )}
          </div>
          <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', fontSize: '.8rem', color: '#0F6E56', marginBottom: '1rem' }}>
            ✅ Your listing will be saved as <strong>Draft</strong>. Publish it from your dashboard once photos are uploaded.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem' }}>
        <button
          onClick={() => step > 1 && setStep((step - 1) as Step)}
          disabled={step === 1}
          style={{
            background: step === 1 ? '#e0e4e0' : '#f7f9f7', border: '1.5px solid #e0e4e0',
            color: step === 1 ? '#999' : '#1a1a1a', padding: '10px 22px',
            borderRadius: 10, fontWeight: 600, fontSize: '.88rem',
            cursor: step === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Back
        </button>

        {step < 4 ? (
          <button onClick={() => setStep((step + 1) as Step)} style={{
            background: '#0F6E56', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
          }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} style={{
            background: loading ? '#e0e4e0' : '#0F6E56', color: '#fff', border: 'none',
            padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: '.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Saving...' : '🚀 Save Draft'}
          </button>
        )}
      </div>
    </div>
  )
}
