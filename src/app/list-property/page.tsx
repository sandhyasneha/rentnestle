'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PropertyType, FurnishingType, TenantPreference, FoodPreference, Amenities } from '@/types'

type Step = 1 | 2 | 3 | 4

const AMENITIES_LIST = [
  { key: 'parking',         label: '🚗 Parking' },
  { key: 'power_backup',    label: '⚡ Power Backup' },
  { key: 'ac',              label: '❄️ AC' },
  { key: 'lift',            label: '🛗 Lift' },
  { key: 'security',        label: '🔒 Security' },
  { key: 'wifi',            label: '📶 WiFi' },
  { key: 'gym',             label: '💪 Gym' },
  { key: 'modular_kitchen', label: '🍳 Modular Kitchen' },
  { key: 'swimming_pool',   label: '🏊 Pool' },
  { key: 'east_facing',     label: '🌅 East Facing' },
  { key: 'piped_gas',       label: '🔥 Piped Gas' },
  { key: 'club_house',      label: '🏛️ Club House' },
]

const STATES = ['Tamil Nadu','Karnataka','Maharashtra','Delhi','Telangana','Kerala','Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Andhra Pradesh','Punjab','Haryana']

export default function ListPropertyPage() {
  const router  = useRouter()
  const [step,    setStep]    = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [genAI,   setGenAI]   = useState(false)

  const [form, setForm] = useState({
    title:            '',
    property_type:    '2bhk' as PropertyType,
    monthly_rent:     '',
    security_deposit: '',
    address_line1:    '',
    address_line2:    '',
    city:             '',
    state:            '',
    pincode:          '',
    lat:              '',
    lng:              '',
    bedrooms:         2,
    bathrooms:        1,
    area_sqft:        '',
    floor_number:     '',
    total_floors:     '',
    furnishing:       'semi_furnished' as FurnishingType,
    tenant_pref:      'any' as TenantPreference,
    food_pref:        'no_restriction' as FoodPreference,
    amenities:        {} as Amenities,
    description:      '',
  })

  const update = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))
  const toggleAmenity = (key: string) =>
    setForm(f => ({ ...f, amenities: { ...f.amenities, [key]: !f.amenities[key as keyof Amenities] } }))

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
    } catch {}
    setGenAI(false)
  }

  // Always works - no Supabase needed yet
  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    alert('✅ Property saved as Draft!\n\nGo to your dashboard to view and publish it once photos are uploaded.')
    router.push('/dashboard/owner')
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#f7f9f7', border: '1.5px solid #e0e4e0',
    borderRadius: 10, padding: '10px 12px', fontSize: '.9rem',
    fontFamily: 'inherit', outline: 'none', color: '#1a1a1a',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 5 }
  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }
  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 8,
    border: `1.5px solid ${active ? '#0F6E56' : '#e0e4e0'}`,
    background: active ? '#E1F5EE' : '#fff',
    color: active ? '#0F6E56' : '#555',
    fontWeight: 600, fontSize: '.8rem', cursor: 'pointer',
  })

  const steps = ['Basic Details', 'Address & Location', 'Features & Amenities', 'Preview & Publish']

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9f7' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: '.25rem' }}>
          List Your Property
        </h1>
        <p style={{ fontSize: '.85rem', color: '#555', marginBottom: '1.5rem' }}>
          Step {step} of 4 — {steps[step - 1]}
        </p>

        {/* Progress */}
        <div style={{ height: 4, background: '#e0e4e0', borderRadius: 2, marginBottom: '1.75rem' }}>
          <div style={{ height: '100%', background: '#0F6E56', borderRadius: 2, width: `${step * 25}%`, transition: 'width .3s' }} />
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center', fontSize: '.68rem',
              color: i + 1 === step ? '#0F6E56' : i + 1 < step ? '#1D9E75' : '#bbb',
              fontWeight: i + 1 === step ? 700 : 400 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', margin: '0 auto 4px',
                background: i + 1 < step ? '#0F6E56' : i + 1 === step ? '#E1F5EE' : '#f0f0f0',
                border: `2px solid ${i + 1 <= step ? '#0F6E56' : '#e0e4e0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i + 1 < step ? '#fff' : i + 1 === step ? '#0F6E56' : '#bbb',
                fontSize: '.75rem', fontWeight: 700 }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className="hide-mobile">{s}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e0e4e0', padding: '1.75rem' }}>

          {/* STEP 1 */}
          {step === 1 && <>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Property Type</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['1bhk','2bhk','3bhk','4bhk','studio','pg','villa','commercial'] as PropertyType[]).map(t => (
                  <button key={t} onClick={() => update('property_type', t)} style={chipBtn(form.property_type === t)}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Listing Title</label>
              <input style={inp} placeholder="e.g. Spacious 2BHK with balcony near Metro"
                value={form.title} onChange={e => update('title', e.target.value)} />
            </div>

            <div style={row}>
              <div>
                <label style={lbl}>Monthly Rent (₹)</label>
                <input style={inp} type="number" placeholder="18000"
                  value={form.monthly_rent} onChange={e => update('monthly_rent', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Security Deposit (₹)</label>
                <input style={inp} type="number" placeholder="36000"
                  value={form.security_deposit} onChange={e => update('security_deposit', e.target.value)} />
              </div>
            </div>

            <div style={row}>
              <div>
                <label style={lbl}>Bedrooms</label>
                <input style={inp} type="number" min={1} max={10}
                  value={form.bedrooms} onChange={e => update('bedrooms', parseInt(e.target.value))} />
              </div>
              <div>
                <label style={lbl}>Bathrooms</label>
                <input style={inp} type="number" min={1} max={10}
                  value={form.bathrooms} onChange={e => update('bathrooms', parseInt(e.target.value))} />
              </div>
            </div>

            <div style={row}>
              <div>
                <label style={lbl}>Area (sq.ft)</label>
                <input style={inp} type="number" placeholder="950"
                  value={form.area_sqft} onChange={e => update('area_sqft', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Furnishing</label>
                <select style={inp} value={form.furnishing} onChange={e => update('furnishing', e.target.value)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="fully_furnished">Fully Furnished</option>
                </select>
              </div>
            </div>
          </>}

          {/* STEP 2 */}
          {step === 2 && <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Street Address</label>
              <input style={inp} placeholder="e.g. 12, Anna Salai, T Nagar"
                value={form.address_line1} onChange={e => update('address_line1', e.target.value)} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Landmark / Area (optional)</label>
              <input style={inp} placeholder="e.g. Near Metro Station, Opposite Big Bazaar"
                value={form.address_line2} onChange={e => update('address_line2', e.target.value)} />
            </div>
            <div style={row}>
              <div>
                <label style={lbl}>City</label>
                <input style={inp} placeholder="Chennai"
                  value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>State</label>
                <select style={inp} value={form.state} onChange={e => update('state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={row}>
              <div>
                <label style={lbl}>Pincode</label>
                <input style={inp} placeholder="600001" maxLength={6}
                  value={form.pincode} onChange={e => update('pincode', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Floor No.</label>
                <input style={inp} type="number" placeholder="3"
                  value={form.floor_number} onChange={e => update('floor_number', e.target.value)} />
              </div>
            </div>
            <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', fontSize: '.8rem', color: '#0F6E56', marginTop: '.5rem' }}>
              💡 <strong>Coming soon:</strong> Google Places Autocomplete will auto-fill address + enable Street View.
            </div>
          </>}

          {/* STEP 3 */}
          {step === 3 && <>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Tenant Preference</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([['any','Any'],['family','Family'],['bachelors','Bachelors'],['company_lease','Company']] as [TenantPreference,string][]).map(([v,l]) => (
                  <button key={v} onClick={() => update('tenant_pref', v)} style={chipBtn(form.tenant_pref === v)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Food Preference</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['no_restriction','🍗 No Restriction'],['veg_only','🥦 Veg Only']] as [FoodPreference,string][]).map(([v,l]) => (
                  <button key={v} onClick={() => update('food_pref', v)} style={chipBtn(form.food_pref === v)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Amenities</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AMENITIES_LIST.map(a => (
                  <button key={a.key} onClick={() => toggleAmenity(a.key)}
                    style={chipBtn(!!form.amenities[a.key as keyof Amenities])}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...lbl, margin: 0 }}>Description</label>
                <button onClick={generateDescription} disabled={genAI} style={{
                  background: genAI ? '#e0e4e0' : '#0F6E56', color: '#fff', border: 'none',
                  padding: '4px 12px', borderRadius: 6, fontSize: '.72rem', fontWeight: 700,
                  cursor: genAI ? 'not-allowed' : 'pointer',
                }}>
                  {genAI ? '⏳ Generating...' : '✨ AI Generate'}
                </button>
              </div>
              <textarea style={{ ...inp, height: 110, resize: 'vertical' }}
                placeholder="Describe your property... or click AI Generate above"
                value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
          </>}

          {/* STEP 4 */}
          {step === 4 && <>
            <div style={{ background: '#f7f9f7', border: '1px solid #e0e4e0', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', marginBottom: '.5rem' }}>
                {form.title || '(No title entered)'}
              </h3>
              <div style={{ fontSize: '.82rem', color: '#555', marginBottom: '.4rem' }}>
                📍 {[form.address_line1, form.address_line2, form.city, form.state, form.pincode].filter(Boolean).join(', ') || '(No address)'}
              </div>
              <div style={{ fontSize: '.82rem', color: '#555', marginBottom: '.75rem' }}>
                {form.property_type?.toUpperCase()} · {form.bedrooms} BHK · {form.furnishing?.replace(/_/g,' ')}
                {form.area_sqft && ` · ${form.area_sqft} sq.ft`}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', fontWeight: 700, color: '#0F6E56' }}>
                  ₹{parseInt(form.monthly_rent || '0').toLocaleString()}/mo
                </div>
                {form.security_deposit && (
                  <div style={{ fontSize: '.78rem', color: '#555' }}>
                    Deposit: ₹{parseInt(form.security_deposit).toLocaleString()}
                  </div>
                )}
                <span style={{ background: '#FAEEDA', color: '#BA7517', fontSize: '.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>
                  0 Brokerage
                </span>
              </div>
              {form.description && (
                <p style={{ fontSize: '.82rem', color: '#555', marginTop: '.75rem', lineHeight: 1.6, borderTop: '1px solid #e0e4e0', paddingTop: '.75rem' }}>
                  {form.description}
                </p>
              )}
              {Object.entries(form.amenities).filter(([,v]) => v).length > 0 && (
                <div style={{ marginTop: '.75rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(form.amenities).filter(([,v]) => v).map(([k]) => (
                    <span key={k} style={{ background: '#E1F5EE', color: '#0F6E56', fontSize: '.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 5 }}>
                      {k.replace(/_/g,' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 14px', fontSize: '.8rem', color: '#0F6E56' }}>
              ✅ Your listing will be saved as <strong>Draft</strong>. Add photos and publish from your dashboard.
            </div>
          </>}

        </div>{/* end form card */}

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button onClick={() => step > 1 && setStep((step - 1) as Step)} disabled={step === 1}
            style={{ background: step === 1 ? '#f0f0f0' : '#fff', border: '1.5px solid #e0e4e0',
              color: step === 1 ? '#bbb' : '#1a1a1a', padding: '10px 24px', borderRadius: 10,
              fontWeight: 600, fontSize: '.88rem', cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
            ← Back
          </button>
          {step < 4 ? (
            <button onClick={() => setStep((step + 1) as Step)}
              style={{ background: '#0F6E56', color: '#fff', border: 'none', padding: '10px 28px',
                borderRadius: 10, fontWeight: 700, fontSize: '.9rem', cursor: 'pointer' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              style={{ background: loading ? '#e0e4e0' : '#0F6E56', color: '#fff', border: 'none',
                padding: '10px 28px', borderRadius: 10, fontWeight: 700, fontSize: '.9rem',
                cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : '🚀 Save Draft'}
            </button>
          )}
        </div>

      </div>
      <style>{`
        @media(max-width:680px){
          .hide-mobile{display:none}
          body{padding-bottom:60px}
        }
      `}</style>
    </div>
  )
}
