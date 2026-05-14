'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

declare global {
  interface Window {
    google: any
    initStreetViewCheck: () => void
  }
}

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [property,  setProperty]  = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [sent,      setSent]      = useState(false)
  const [sending,   setSending]   = useState(false)
  const [showModal, setShowModal] = useState<'contact'|'visit'|null>(null)
  const [message,   setMessage]   = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [svLoaded,  setSvLoaded]  = useState(false)
  const [svAvail,   setSvAvail]   = useState<boolean|null>(null)
  const [isOwner,   setIsOwner]   = useState(false)
  const svRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (id) loadProperty() }, [id])

  const loadProperty = async () => {
    try {
      const res  = await fetch(`/api/properties/${id}`)
      const data = await res.json()
      const prop = data.property
      setProperty(prop)

      // Check if current user is the owner
      // owner_id format is rn_{phone} — match by userId or phone
      const userId  = localStorage.getItem('rn_user_id')
      const phone   = localStorage.getItem('rn_user_phone')
      const role    = localStorage.getItem('rn_user_role')
      const ownerId = prop?.owner_id || ''
      const isOwnerById    = userId && ownerId === userId
      const isOwnerByPhone = phone && (ownerId === `rn_${phone}` || ownerId.includes(phone))
      if (role === 'owner' && (isOwnerById || isOwnerByPhone)) setIsOwner(true)

      if (prop?.lat && prop?.lng) checkStreetView(parseFloat(prop.lat), parseFloat(prop.lng))
    } catch {}
    setLoading(false)
  }

  const checkStreetView = (lat: number, lng: number) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return
    const script = document.createElement('script')
    script.src   = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initStreetViewCheck`
    script.async = true
    window.initStreetViewCheck = () => {
      const svc = new window.google.maps.StreetViewService()
      svc.getPanorama({ location: { lat, lng }, radius: 50 }, (_: any, status: string) => {
        setSvAvail(status === 'OK')
      })
    }
    document.head.appendChild(script)
  }

  const loadStreetView = () => {
    if (!property?.lat || !property?.lng || !svRef.current) return
    new window.google.maps.StreetViewPanorama(svRef.current, {
      position: { lat: parseFloat(property.lat), lng: parseFloat(property.lng) },
      pov: { heading: 165, pitch: 0 }, zoom: 1,
    })
    setSvLoaded(true)
  }

  const handleInquiry = async () => {
    const name   = localStorage.getItem('rn_user_name')
    const phone  = localStorage.getItem('rn_user_phone')
    const userId = localStorage.getItem('rn_user_id')
    if (!name || !phone) { router.push('/auth/login'); return }
    setSending(true)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          property_id: id,
          message:     message || `Hi, I am interested in ${property?.title}`,
          tenantName:  name,
          tenantPhone: phone,
          tenantId:    userId || `rn_${phone}`,
        }),
      })
      const data = await res.json()
      console.log('Inquiry response:', data)
      if (res.ok && data.success) {
        setSent(true)
        setShowModal(null)
      }
    } catch (err) {
      console.error('Inquiry error:', err)
    }
    setSending(false)
  }

  const handleVisit = async () => {
    const name   = localStorage.getItem('rn_user_name')
    const phone  = localStorage.getItem('rn_user_phone')
    const userId = localStorage.getItem('rn_user_id')
    if (!name || !phone) { router.push('/auth/login'); return }
    setSending(true)
    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          property_id: id,
          message:     `I would like to schedule a visit on ${visitDate} at ${visitTime}. Please confirm.`,
          tenantName:  name,
          tenantPhone: phone,
          tenantId:    userId || `rn_${phone}`,
        }),
      })
      alert(`✅ Visit request sent for ${visitDate} at ${visitTime}! Owner will contact you on WhatsApp.`)
      setShowModal(null)
    } catch (err) {
      console.error('Visit request error:', err)
    }
    setSending(false)
  }

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#0F6E56',fontFamily:'Georgia,serif',fontSize:'1.1rem'}}>Loading property...</div>
    </div>
  )

  if (!property) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1rem'}}>
      <div style={{fontSize:'3rem'}}>🏠</div>
      <h2 style={{fontFamily:'Georgia,serif'}}>Property not found</h2>
      <button onClick={()=>router.push('/search')} style={{background:'#0F6E56',color:'#fff',border:'none',padding:'10px 20px',borderRadius:10,cursor:'pointer',fontWeight:600}}>Browse Properties</button>
    </div>
  )

  const amenityList = Object.entries(property.amenities||{}).filter(([,v])=>v).map(([k])=>k)

  return (
    <div style={{maxWidth:960,margin:'0 auto',padding:'2rem 1rem 4rem'}}>
      <button onClick={()=>router.back()} style={{background:'none',border:'none',color:'#0F6E56',cursor:'pointer',fontWeight:600,fontSize:'.85rem',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:6}}>
        ← Back to Search
      </button>

      <div className="detail-grid" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'2rem',alignItems:'start'}}>

        {/* LEFT */}
        <div>
          {/* Photo */}
          <div style={{height:320,background:'linear-gradient(135deg,#9FE1CB,#0F6E56)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'5rem',marginBottom:'1.5rem',overflow:'hidden',position:'relative'}}>
            {property.photos?.length>0
              ? <img src={property.photos[0]} alt={property.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <span>🏠</span>
            }
            {property.is_verified && (
              <div style={{position:'absolute',top:16,right:16,background:'#0F6E56',color:'#fff',fontSize:'.78rem',fontWeight:700,padding:'4px 12px',borderRadius:8}}>✓ Verified</div>
            )}
          </div>

          {/* Multiple photos */}
          {property.photos?.length > 1 && (
            <div style={{display:'flex',gap:8,marginBottom:'1.5rem',overflowX:'auto',paddingBottom:4}}>
              {property.photos.map((url: string, i: number) => (
                <img key={i} src={url} alt={`Photo ${i+1}`}
                  style={{width:100,height:70,objectFit:'cover',borderRadius:8,border:'2px solid #e0e4e0',flexShrink:0,cursor:'pointer'}}/>
              ))}
            </div>
          )}

          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,marginBottom:'.5rem'}}>{property.title}</h1>
          <p style={{fontSize:'.9rem',color:'#555',marginBottom:'1.25rem'}}>
            📍 {[property.address_line1,property.address_line2,property.city,property.state,property.pincode].filter(Boolean).join(', ')}
          </p>

          {/* Key details */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
            {[
              {icon:'🛏️',label:'Bedrooms',  value:property.bedrooms},
              {icon:'🚿',label:'Bathrooms',  value:property.bathrooms},
              {icon:'📐',label:'Area',       value:property.area_sqft?`${property.area_sqft} sq.ft`:'N/A'},
              {icon:'🪑',label:'Furnishing', value:property.furnishing?.replace(/_/g,' ')},
              {icon:'👨‍👩‍👧',label:'Preferred', value:property.tenant_pref||'Any'},
              {icon:'🍽️',label:'Food',       value:property.food_pref?.replace(/_/g,' ')||'No restriction'},
            ].map(d=>(
              <div key={d.label} style={{background:'#f7f9f7',borderRadius:12,padding:'.9rem',textAlign:'center'}}>
                <div style={{fontSize:'1.3rem',marginBottom:4}}>{d.icon}</div>
                <div style={{fontSize:'.68rem',color:'#888',marginBottom:2}}>{d.label}</div>
                <div style={{fontSize:'.82rem',fontWeight:600,textTransform:'capitalize'}}>{d.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {property.description && (
            <div style={{marginBottom:'1.5rem'}}>
              <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,marginBottom:'.75rem'}}>About this Property</h2>
              <p style={{fontSize:'.9rem',color:'#444',lineHeight:1.8}}>{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {amenityList.length>0 && (
            <div style={{marginBottom:'1.5rem'}}>
              <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,marginBottom:'.75rem'}}>Amenities</h2>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {amenityList.map(a=>(
                  <span key={a} style={{background:'#E1F5EE',color:'#0F6E56',fontSize:'.8rem',fontWeight:600,padding:'5px 12px',borderRadius:20}}>✓ {a.replace(/_/g,' ')}</span>
                ))}
              </div>
            </div>
          )}

          {/* Street View */}
          <div style={{marginBottom:'1.5rem'}}>
            <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,marginBottom:'.75rem'}}>🗺️ Street View</h2>
            {!property.lat || !property.lng ? (
              <div style={{background:'#f7f9f7',border:'1px solid #e0e4e0',borderRadius:12,padding:'2rem',textAlign:'center',color:'#888',fontSize:'.85rem'}}>
                Street View not available — coordinates not set for this property.
              </div>
            ) : svAvail===false ? (
              <div style={{background:'#f7f9f7',border:'1px solid #e0e4e0',borderRadius:12,padding:'2rem',textAlign:'center',color:'#888',fontSize:'.85rem'}}>
                Street View not available for this location.
              </div>
            ) : (
              <div ref={svRef} style={{width:'100%',height:320,borderRadius:12,overflow:'hidden',border:'1px solid #e0e4e0',background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1rem'}}>
                {!svLoaded && <>
                  <div style={{fontSize:'2rem'}}>📸</div>
                  <button onClick={loadStreetView} style={{background:'#0F6E56',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,fontWeight:700,cursor:'pointer'}}>
                    🗺️ Show Street View
                  </button>
                </>}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Contact card */}
        <div style={{position:'sticky',top:80}}>
          <div style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:16,padding:'1.5rem',boxShadow:'0 4px 20px rgba(0,0,0,.06)'}}>

            <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,color:'#0F6E56',marginBottom:4}}>
              ₹{property.monthly_rent?.toLocaleString()}<span style={{fontSize:'1rem',fontWeight:400,color:'#888'}}>/mo</span>
            </div>
            {property.security_deposit>0 && (
              <div style={{fontSize:'.82rem',color:'#555',marginBottom:'.75rem'}}>
                Security: ₹{property.security_deposit?.toLocaleString()}
              </div>
            )}
            <div style={{background:'#FAEEDA',color:'#BA7517',fontSize:'.78rem',fontWeight:700,padding:'6px 12px',borderRadius:8,marginBottom:'1.25rem',textAlign:'center'}}>
              🎉 Zero Brokerage
            </div>

            {/* ── OWNER VIEW ── */}
            {isOwner ? (
              <div>
                <div style={{background:'#E1F5EE',borderRadius:10,padding:'10px 14px',fontSize:'.83rem',color:'#0F6E56',fontWeight:600,marginBottom:'1rem',textAlign:'center'}}>
                  🔑 This is your listing
                </div>
                <button onClick={()=>router.push(`/edit-property/${id}`)}
                  style={{width:'100%',background:'#0F6E56',color:'#fff',border:'none',padding:'13px',borderRadius:12,fontWeight:700,fontSize:'.95rem',cursor:'pointer',marginBottom:'.75rem'}}>
                  ✏️ Edit This Listing
                </button>
                <button onClick={()=>router.push('/dashboard/owner')}
                  style={{width:'100%',background:'#f7f9f7',color:'#555',border:'1px solid #e0e4e0',padding:'11px',borderRadius:12,fontWeight:600,fontSize:'.88rem',cursor:'pointer'}}>
                  📊 View Dashboard
                </button>
              </div>
            ) : (
              /* ── TENANT VIEW ── */
              <div>
                {sent ? (
                  <div style={{background:'#E1F5EE',color:'#0F6E56',borderRadius:10,padding:'1rem',textAlign:'center',fontWeight:600,fontSize:'.88rem',marginBottom:'.75rem'}}>
                    ✅ Inquiry Sent!<br/>
                    <span style={{fontSize:'.78rem',fontWeight:400}}>Owner will contact you on WhatsApp.</span>
                  </div>
                ) : (
                  <button onClick={()=>setShowModal('contact')}
                    style={{width:'100%',background:'#0F6E56',color:'#fff',border:'none',padding:'14px',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:'pointer',marginBottom:'.75rem'}}>
                    📩 Contact Owner
                  </button>
                )}
                <button onClick={()=>setShowModal('visit')}
                  style={{width:'100%',background:'transparent',color:'#0F6E56',border:'1.5px solid #0F6E56',padding:'12px',borderRadius:12,fontWeight:600,fontSize:'.9rem',cursor:'pointer'}}>
                  📅 Schedule a Visit
                </button>
              </div>
            )}

            <div style={{marginTop:'1rem',padding:'1rem',background:'#f7f9f7',borderRadius:10,fontSize:'.78rem',color:'#555',lineHeight:1.8}}>
              <div>🏠 {property.property_type?.toUpperCase()} · Floor {property.floor_number||'N/A'} of {property.total_floors||'N/A'}</div>
              <div>📅 Listed {new Date(property.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT MODAL */}
      {showModal==='contact' && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(null)}}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'22px 22px 0 0',padding:'2rem',width:'100%',maxWidth:460}}>
            <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.15rem',marginBottom:'.25rem'}}>Contact Owner</h3>
            <p style={{fontSize:'.82rem',color:'#555',marginBottom:'1rem'}}>For: {property.title}</p>
            <label style={{display:'block',fontSize:'.78rem',fontWeight:600,color:'#555',marginBottom:5}}>Your Message</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)}
              placeholder={`Hi, I am interested in ${property.title}. Please share more details.`}
              style={{width:'100%',background:'#f7f9f7',border:'1.5px solid #e0e4e0',borderRadius:10,padding:'10px 12px',fontSize:'.9rem',fontFamily:'inherit',outline:'none',height:110,resize:'vertical' as const,marginBottom:'1rem'}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <button onClick={()=>setShowModal(null)} style={{background:'#f7f9f7',border:'1px solid #e0e4e0',color:'#555',padding:'12px',borderRadius:10,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={handleInquiry} disabled={sending}
                style={{background:sending?'#e0e4e0':'#0F6E56',color:'#fff',border:'none',padding:'12px',borderRadius:10,fontWeight:700,cursor:sending?'not-allowed':'pointer'}}>
                {sending?'Sending...':'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISIT MODAL */}
      {showModal==='visit' && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(null)}}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'22px 22px 0 0',padding:'2rem',width:'100%',maxWidth:460}}>
            <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.15rem',marginBottom:'.25rem'}}>Schedule a Visit</h3>
            <p style={{fontSize:'.82rem',color:'#555',marginBottom:'1.25rem'}}>For: {property.title}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.25rem'}}>
              <div>
                <label style={{display:'block',fontSize:'.78rem',fontWeight:600,color:'#555',marginBottom:5}}>Preferred Date</label>
                <input type="date" value={visitDate} onChange={e=>setVisitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{width:'100%',background:'#f7f9f7',border:'1.5px solid #e0e4e0',borderRadius:10,padding:'10px 12px',fontSize:'.9rem',fontFamily:'inherit',outline:'none'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'.78rem',fontWeight:600,color:'#555',marginBottom:5}}>Preferred Time</label>
                <select value={visitTime} onChange={e=>setVisitTime(e.target.value)}
                  style={{width:'100%',background:'#f7f9f7',border:'1.5px solid #e0e4e0',borderRadius:10,padding:'10px 12px',fontSize:'.9rem',fontFamily:'inherit',outline:'none'}}>
                  <option value="">Select time</option>
                  {['9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'].map(t=>(
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <button onClick={()=>setShowModal(null)} style={{background:'#f7f9f7',border:'1px solid #e0e4e0',color:'#555',padding:'12px',borderRadius:10,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={handleVisit} disabled={!visitDate||!visitTime||sending}
                style={{background:(!visitDate||!visitTime||sending)?'#e0e4e0':'#0F6E56',color:'#fff',border:'none',padding:'12px',borderRadius:10,fontWeight:700,cursor:(!visitDate||!visitTime)?'not-allowed':'pointer'}}>
                {sending?'Sending...':'Request Visit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:700px){.detail-grid{grid-template-columns:1fr!important}body{padding-bottom:60px}}`}</style>
    </div>
  )
}
