'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [property, setProperty] = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [sent,     setSent]     = useState(false)
  const [sending,  setSending]  = useState(false)

  useEffect(() => { if (id) loadProperty() }, [id])

  const loadProperty = async () => {
    try {
      const res  = await fetch(`/api/properties/${id}`)
      const data = await res.json()
      setProperty(data.property || null)
    } catch { setProperty(null) }
    setLoading(false)
  }

  const handleInquiry = async () => {
    const name = localStorage.getItem('rn_user_name')
    if (!name) { router.push('/auth/login'); return }
    setSending(true)
    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({property_id: id, message: `Hi, I am interested in ${property?.title}`}),
      })
      setSent(true)
    } catch {}
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
          {/* Image/hero */}
          <div style={{height:320,background:'linear-gradient(135deg,#9FE1CB,#0F6E56)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'5rem',marginBottom:'1.5rem',overflow:'hidden',position:'relative'}}>
            {property.photos?.length>0
              ? <img src={property.photos[0]} alt={property.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : '🏠'
            }
            {property.is_verified && (
              <div style={{position:'absolute',top:16,right:16,background:'#0F6E56',color:'#fff',fontSize:'.78rem',fontWeight:700,padding:'4px 12px',borderRadius:8}}>✓ Verified Property</div>
            )}
          </div>

          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,marginBottom:'.5rem'}}>{property.title}</h1>
          <p style={{fontSize:'.9rem',color:'#555',marginBottom:'1.25rem'}}>
            📍 {[property.address_line1,property.address_line2,property.city,property.state,property.pincode].filter(Boolean).join(', ')}
          </p>

          {/* Key details grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
            {[
              {icon:'🛏️',label:'Bedrooms',  value:property.bedrooms},
              {icon:'🚿',label:'Bathrooms',  value:property.bathrooms},
              {icon:'📐',label:'Area',       value:property.area_sqft?`${property.area_sqft} sq.ft`:'N/A'},
              {icon:'🪑',label:'Furnishing', value:property.furnishing?.replace(/_/g,' ')},
              {icon:'👨‍👩‍👧',label:'Preferred', value:property.tenant_pref},
              {icon:'🍽️',label:'Food',       value:property.food_pref?.replace(/_/g,' ')},
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
          <div style={{background:'#f7f9f7',border:'1px solid #e0e4e0',borderRadius:12,padding:'1.5rem',textAlign:'center'}}>
            <div style={{fontSize:'2rem',marginBottom:8}}>🗺️</div>
            <div style={{fontWeight:600,fontSize:'.9rem',marginBottom:4}}>Street View</div>
            <div style={{fontSize:'.78rem',color:'#888'}}>Google Maps Street View integration coming soon</div>
          </div>
        </div>

        {/* RIGHT — Contact card */}
        <div style={{position:'sticky',top:80}}>
          <div style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:16,padding:'1.5rem',boxShadow:'0 4px 20px rgba(0,0,0,.06)'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,color:'#0F6E56',marginBottom:4}}>
              ₹{property.monthly_rent?.toLocaleString()}<span style={{fontSize:'1rem',fontWeight:400,color:'#888'}}>/mo</span>
            </div>
            {property.security_deposit>0 && (
              <div style={{fontSize:'.82rem',color:'#555',marginBottom:'.75rem'}}>Security: ₹{property.security_deposit?.toLocaleString()}</div>
            )}
            <div style={{background:'#FAEEDA',color:'#BA7517',fontSize:'.78rem',fontWeight:700,padding:'6px 12px',borderRadius:8,marginBottom:'1.25rem',textAlign:'center'}}>
              🎉 Zero Brokerage — Save ₹{property.monthly_rent?.toLocaleString()}
            </div>

            {sent ? (
              <div style={{background:'#E1F5EE',color:'#0F6E56',borderRadius:10,padding:'1rem',textAlign:'center',fontWeight:600,fontSize:'.88rem'}}>
                ✅ Inquiry Sent! Owner will contact you soon.
              </div>
            ) : (
              <button onClick={handleInquiry} disabled={sending}
                style={{width:'100%',background:sending?'#e0e4e0':'#0F6E56',color:'#fff',border:'none',padding:'14px',borderRadius:12,fontWeight:700,fontSize:'1rem',cursor:sending?'not-allowed':'pointer',marginBottom:'.75rem'}}>
                {sending?'Sending...':'📩 Contact Owner'}
              </button>
            )}

            <button style={{width:'100%',background:'transparent',color:'#0F6E56',border:'1.5px solid #0F6E56',padding:'12px',borderRadius:12,fontWeight:600,fontSize:'.9rem',cursor:'pointer'}}>
              📅 Schedule a Visit
            </button>

            <div style={{marginTop:'1rem',padding:'1rem',background:'#f7f9f7',borderRadius:10,fontSize:'.78rem',color:'#555',lineHeight:1.8}}>
              <div>🏠 {property.property_type?.toUpperCase()} · Floor {property.floor_number||'N/A'} of {property.total_floors||'N/A'}</div>
              <div>📅 Listed {new Date(property.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
              <div>🔑 Owner Verified</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:700px){.detail-grid{grid-template-columns:1fr!important}body{padding-bottom:60px}}`}</style>
    </div>
  )
}
