'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

const AMENITIES = [
  {key:'parking',label:'🚗 Parking'},{key:'power_backup',label:'⚡ Power Backup'},
  {key:'ac',label:'❄️ AC'},{key:'lift',label:'🛗 Lift'},{key:'security',label:'🔒 Security'},
  {key:'wifi',label:'📶 WiFi'},{key:'gym',label:'💪 Gym'},{key:'modular_kitchen',label:'🍳 Modular Kitchen'},
  {key:'swimming_pool',label:'🏊 Pool'},{key:'east_facing',label:'🌅 East Facing'},
  {key:'piped_gas',label:'🔥 Piped Gas'},{key:'club_house',label:'🏛️ Club House'},
]
const STATES = ['Tamil Nadu','Karnataka','Maharashtra','Delhi','Telangana','Kerala','Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Andhra Pradesh','Punjab','Haryana','Odisha','Bihar']

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [genAI,     setGenAI]     = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [activeTab, setActiveTab] = useState<'details'|'photos'|'amenities'>('details')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<any>({
    title:'', property_type:'2bhk', monthly_rent:'', security_deposit:'',
    address_line1:'', address_line2:'', city:'', state:'', pincode:'',
    bedrooms:2, bathrooms:1, area_sqft:'', floor_number:'', total_floors:'',
    furnishing:'semi_furnished', tenant_pref:'any', food_pref:'no_restriction',
    amenities:{}, description:'', photos:[], status:'draft',
  })

  useEffect(() => { if (id) loadProperty() }, [id])

  const loadProperty = async () => {
    const userId = localStorage.getItem('rn_user_id')
    if (!userId) { router.replace('/auth/login'); return }

    const res  = await fetch(`/api/properties/${id}`)
    const data = await res.json()
    if (!data.property) { router.replace('/dashboard/owner'); return }
    if (data.property.owner_id !== userId) {
      alert('You can only edit your own listings.')
      router.replace('/dashboard/owner')
      return
    }
    const p = data.property
    setForm({
      ...p,
      monthly_rent:     p.monthly_rent?.toString() || '',
      security_deposit: p.security_deposit?.toString() || '',
      area_sqft:        p.area_sqft?.toString() || '',
      floor_number:     p.floor_number?.toString() || '',
      total_floors:     p.total_floors?.toString() || '',
      amenities:        p.amenities || {},
      photos:           p.photos || [],
    })
    setLoading(false)
  }

  const update = (k: string, v: unknown) => setForm((f: any) => ({...f, [k]: v}))
  const toggleAmenity = (k: string) => setForm((f: any) => ({...f, amenities:{...f.amenities, [k]:!f.amenities[k]}}))

  const generateAI = async () => {
    setGenAI(true)
    try {
      const res  = await fetch('/api/ai', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({property:form})})
      const data = await res.json()
      if (data.description) update('description', data.description)
    } catch {}
    setGenAI(false)
  }

  // Upload photos to Supabase Storage via API
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (form.photos.length + files.length > 10) { setError('Maximum 10 photos allowed'); return }
    setUploading(true); setError(''); setSuccess('')

    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('property_id', id)
      const res  = await fetch('/api/upload-photo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success && data.photos) {
        update('photos', data.photos)
        setSuccess('✅ Photo saved!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Upload failed')
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = async (idx: number) => {
    const updatedPhotos = form.photos.filter((_: string, i: number) => i !== idx)
    update('photos', updatedPhotos)

    // Save immediately
    await fetch(`/api/edit-property/${id}`, {
      method:  'PATCH',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({ photos: updatedPhotos }),
    })
  }

  const handleSave = async (publish = false) => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/edit-property/${id}`, {
        method:  'PATCH',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify({...form, status: publish ? 'active' : form.status}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return }
      setSuccess(publish ? '🚀 Property published!' : '✅ Changes saved!')
      setTimeout(() => router.push(`/property/${id}`), 1200)
    } catch { setError('Network error. Please try again.') }
    setSaving(false)
  }

  const inp: React.CSSProperties = {width:'100%',background:'#f7f9f7',border:'1.5px solid #e0e4e0',borderRadius:10,padding:'10px 12px',fontSize:'.9rem',fontFamily:'inherit',outline:'none',color:'#1a1a1a'}
  const lbl: React.CSSProperties = {display:'block',fontSize:'.78rem',fontWeight:600,color:'#555',marginBottom:5}
  const row: React.CSSProperties = {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}
  const chip = (on: boolean): React.CSSProperties => ({padding:'7px 14px',borderRadius:8,border:`1.5px solid ${on?'#0F6E56':'#e0e4e0'}`,background:on?'#E1F5EE':'#fff',color:on?'#0F6E56':'#555',fontWeight:600,fontSize:'.8rem',cursor:'pointer'})

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#0F6E56',fontFamily:'Georgia,serif',fontSize:'1.1rem'}}>Loading...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f7f9f7'}}>
      <div style={{maxWidth:750,margin:'0 auto',padding:'2rem 1rem 5rem'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:700,marginBottom:4}}>Edit Listing ✏️</h1>
            <p style={{fontSize:'.82rem',color:'#555'}}>{form.title}</p>
          </div>
          <button onClick={()=>router.push(`/property/${id}`)} style={{background:'none',border:'none',color:'#0F6E56',cursor:'pointer',fontWeight:600,fontSize:'.85rem'}}>
            ← View Listing
          </button>
        </div>

        {/* Status */}
        <div style={{display:'flex',gap:8,marginBottom:'1.5rem',alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:'.78rem',color:'#555',fontWeight:600}}>Status:</span>
          {['draft','active','rented','inactive'].map(s=>(
            <button key={s} onClick={()=>update('status',s)}
              style={{padding:'5px 14px',borderRadius:20,border:`1.5px solid ${form.status===s?'#0F6E56':'#e0e4e0'}`,background:form.status===s?'#0F6E56':'#fff',color:form.status===s?'#fff':'#555',fontSize:'.75rem',fontWeight:600,cursor:'pointer',textTransform:'capitalize' as const}}>
              {s}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,background:'#f0f0f0',borderRadius:10,padding:4,marginBottom:'1.5rem'}}>
          {(['details','photos','amenities'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              style={{flex:1,padding:'9px',borderRadius:8,border:'none',background:activeTab===tab?'#fff':'transparent',color:activeTab===tab?'#0F6E56':'#555',fontWeight:activeTab===tab?600:500,fontSize:'.85rem',cursor:'pointer',boxShadow:activeTab===tab?'0 1px 6px rgba(0,0,0,.08)':'none'}}>
              {tab==='photos'?'📸 Photos':tab==='amenities'?'🏠 Amenities':'📝 Details'}
            </button>
          ))}
        </div>

        <div style={{background:'#fff',borderRadius:16,border:'1px solid #e0e4e0',padding:'1.75rem'}}>

          {/* DETAILS TAB */}
          {activeTab==='details' && <>
            <div style={{marginBottom:'1rem'}}><label style={lbl}>Listing Title</label><input style={inp} value={form.title} onChange={e=>update('title',e.target.value)}/></div>
            <div style={row}>
              <div><label style={lbl}>Monthly Rent (₹)</label><input style={inp} type="number" value={form.monthly_rent} onChange={e=>update('monthly_rent',e.target.value)}/></div>
              <div><label style={lbl}>Security Deposit (₹)</label><input style={inp} type="number" value={form.security_deposit} onChange={e=>update('security_deposit',e.target.value)}/></div>
            </div>
            <div style={row}>
              <div><label style={lbl}>Bedrooms</label><input style={inp} type="number" min={1} max={10} value={form.bedrooms} onChange={e=>update('bedrooms',e.target.value)}/></div>
              <div><label style={lbl}>Bathrooms</label><input style={inp} type="number" min={1} max={10} value={form.bathrooms} onChange={e=>update('bathrooms',e.target.value)}/></div>
            </div>
            <div style={row}>
              <div><label style={lbl}>Area (sq.ft)</label><input style={inp} type="number" value={form.area_sqft} onChange={e=>update('area_sqft',e.target.value)}/></div>
              <div><label style={lbl}>Furnishing</label>
                <select style={inp} value={form.furnishing} onChange={e=>update('furnishing',e.target.value)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi Furnished</option>
                  <option value="fully_furnished">Fully Furnished</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:'1rem'}}><label style={lbl}>Street Address</label><input style={inp} value={form.address_line1||''} onChange={e=>update('address_line1',e.target.value)}/></div>
            <div style={{marginBottom:'1rem'}}><label style={lbl}>Landmark / Area</label><input style={inp} value={form.address_line2||''} onChange={e=>update('address_line2',e.target.value)}/></div>
            <div style={row}>
              <div><label style={lbl}>City</label><input style={inp} value={form.city||''} onChange={e=>update('city',e.target.value)}/></div>
              <div><label style={lbl}>State</label>
                <select style={inp} value={form.state||''} onChange={e=>update('state',e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:'1.25rem'}}>
              <label style={lbl}>Tenant Preference</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[['any','Any'],['family','Family'],['bachelors','Bachelors'],['company_lease','Company']].map(([v,l])=>(
                  <button key={v} onClick={()=>update('tenant_pref',v)} style={chip(form.tenant_pref===v)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:'1.25rem'}}>
              <label style={lbl}>Food Preference</label>
              <div style={{display:'flex',gap:8}}>
                {[['no_restriction','🍗 No Restriction'],['veg_only','🥦 Veg Only']].map(([v,l])=>(
                  <button key={v} onClick={()=>update('food_pref',v)} style={chip(form.food_pref===v)}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                <label style={{...lbl,margin:0}}>Description</label>
                <button onClick={generateAI} disabled={genAI} style={{background:genAI?'#e0e4e0':'#0F6E56',color:'#fff',border:'none',padding:'4px 12px',borderRadius:6,fontSize:'.72rem',fontWeight:700,cursor:genAI?'not-allowed':'pointer'}}>
                  {genAI?'⏳ Generating...':'✨ AI Rewrite'}
                </button>
              </div>
              <textarea style={{...inp,height:120,resize:'vertical' as const}} value={form.description||''} onChange={e=>update('description',e.target.value)} placeholder="Describe your property..."/>
            </div>
          </>}

          {/* PHOTOS TAB */}
          {activeTab==='photos' && <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.75rem'}}>
              <h3 style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:700}}>Property Photos</h3>
              <span style={{fontSize:'.75rem',color:'#888'}}>{form.photos.length}/10 photos</span>
            </div>

            {/* Upload area */}
            <div onClick={()=>fileInputRef.current?.click()}
              style={{border:'2px dashed #9FE1CB',borderRadius:12,padding:'2rem',textAlign:'center',cursor:'pointer',background:'#f0faf6',marginBottom:'1.25rem'}}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='#E1F5EE'}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='#f0faf6'}>
              <div style={{fontSize:'2rem',marginBottom:8}}>📸</div>
              <div style={{fontWeight:600,fontSize:'.9rem',color:'#0F6E56',marginBottom:4}}>
                {uploading ? '⏳ Uploading & Saving...' : 'Click to Upload Photos'}
              </div>
              <div style={{fontSize:'.75rem',color:'#888'}}>JPG, PNG up to 5MB · Max 10 photos · Auto-saved to listing</div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handlePhotoUpload}/>
            </div>

            {/* Photo grid */}
            {form.photos.length > 0 ? (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'1rem'}}>
                {form.photos.map((url: string, idx: number) => (
                  <div key={idx} style={{position:'relative',borderRadius:10,overflow:'hidden',border:'1px solid #e0e4e0'}}>
                    <img src={url} alt={`Photo ${idx+1}`} style={{width:'100%',height:130,objectFit:'cover',display:'block'}}/>
                    {idx===0 && <div style={{position:'absolute',top:6,left:6,background:'#0F6E56',color:'#fff',fontSize:'.6rem',fontWeight:700,padding:'2px 7px',borderRadius:4}}>Cover</div>}
                    <button onClick={()=>removePhoto(idx)}
                      style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,.65)',color:'#fff',border:'none',width:24,height:24,borderRadius:'50%',cursor:'pointer',fontSize:'.8rem',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:'center',color:'#aaa',fontSize:'.85rem',padding:'2rem',background:'#f7f9f7',borderRadius:12}}>
                No photos yet — upload some to attract more tenants! 📸
              </div>
            )}
          </>}

          {/* AMENITIES TAB */}
          {activeTab==='amenities' && <>
            <h3 style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:700,marginBottom:'.5rem'}}>Property Amenities</h3>
            <p style={{fontSize:'.82rem',color:'#555',marginBottom:'1.25rem'}}>Toggle available amenities — changes saved when you click Save:</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
              {AMENITIES.map(a=>(
                <button key={a.key} onClick={()=>toggleAmenity(a.key)}
                  style={{...chip(!!form.amenities[a.key]),padding:'12px',textAlign:'center' as const,justifyContent:'center',display:'flex',alignItems:'center',gap:6}}>
                  {a.label}{form.amenities[a.key]&&<span>✓</span>}
                </button>
              ))}
            </div>
          </>}
        </div>

        {/* Messages */}
        {error   && <div style={{background:'#fff5f5',border:'1px solid #fecaca',color:'#e24b4a',borderRadius:10,padding:'10px 14px',fontSize:'.85rem',marginTop:'1rem'}}>{error}</div>}
        {success && <div style={{background:'#E1F5EE',border:'1px solid #9FE1CB',color:'#0F6E56',borderRadius:10,padding:'10px 14px',fontSize:'.85rem',marginTop:'1rem',fontWeight:600}}>{success}</div>}

        {/* Save buttons */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'1.5rem'}}>
          <button onClick={()=>handleSave(false)} disabled={saving}
            style={{background:'#fff',border:'1.5px solid #0F6E56',color:'#0F6E56',padding:'13px',borderRadius:10,fontWeight:700,fontSize:'.9rem',cursor:saving?'not-allowed':'pointer'}}>
            {saving?'Saving...':'💾 Save Changes'}
          </button>
          {form.status!=='active' ? (
            <button onClick={()=>handleSave(true)} disabled={saving}
              style={{background:saving?'#e0e4e0':'#0F6E56',color:'#fff',border:'none',padding:'13px',borderRadius:10,fontWeight:700,fontSize:'.9rem',cursor:saving?'not-allowed':'pointer'}}>
              {saving?'Publishing...':'🚀 Save & Publish'}
            </button>
          ) : (
            <button onClick={()=>router.push(`/property/${id}`)}
              style={{background:'#f7f9f7',border:'1px solid #e0e4e0',color:'#555',padding:'13px',borderRadius:10,fontWeight:600,fontSize:'.9rem',cursor:'pointer'}}>
              View Live Listing →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
