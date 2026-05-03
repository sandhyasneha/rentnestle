'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TenantDashboard() {
  const router = useRouter()
  const [profile,    setProfile]    = useState<any>(null)
  const [saved,      setSaved]      = useState<any[]>([])
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    const name   = localStorage.getItem('rn_user_name')
    const phone  = localStorage.getItem('rn_user_phone')
    const role   = localStorage.getItem('rn_user_role')
    const userId = localStorage.getItem('rn_user_id')
    if (!name || !phone) { router.replace('/auth/login'); return }
    if (role !== 'tenant') { router.replace('/dashboard/owner'); return }
    setProfile({ full_name: name, phone, role })

    if (userId) {
      try {
        const { data: savedData } = await supabase
          .from('saved_properties')
          .select('*, property:properties(id,title,city,monthly_rent,property_type,bedrooms)')
          .eq('tenant_id', userId).limit(6)
        if (savedData) setSaved(savedData.map((s:any)=>s.property).filter(Boolean))

        const { data: agrData } = await supabase
          .from('agreements')
          .select('*, property:properties(title,city,monthly_rent)')
          .eq('tenant_id', userId)
          .order('created_at',{ascending:false}).limit(5)
        if (agrData) setAgreements(agrData)
      } catch (err) { console.error(err) }
    }
    setLoading(false)
  }

  const handleLogout = () => {
    ['rn_user_name','rn_user_phone','rn_user_role','rn_user_id','rn_access_token'].forEach(k=>localStorage.removeItem(k))
    router.replace('/')
  }

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#0F6E56',fontFamily:'Georgia,serif',fontSize:'1.1rem'}}>Loading dashboard...</div>
    </div>
  )

  return (
    <div style={{maxWidth:960,margin:'0 auto',padding:'2rem 1rem 4rem'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:700,marginBottom:4}}>Welcome back, {profile?.full_name} 👋</h1>
          <p style={{fontSize:'.85rem',color:'#555'}}>+91 {profile?.phone}</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{background:'#E1F5EE',color:'#0F6E56',fontSize:'.72rem',fontWeight:700,padding:'4px 12px',borderRadius:20}}>🏠 Tenant · Free Plan</div>
          <button onClick={handleLogout} style={{background:'#f7f9f7',border:'1px solid #e0e4e0',color:'#555',padding:'8px 14px',borderRadius:8,fontSize:'.78rem',fontWeight:600,cursor:'pointer'}}>Sign Out</button>
        </div>
      </div>

      {/* Verification Status */}
      <div style={{background:'#f7f9f7',border:'1px solid #e0e4e0',borderRadius:14,padding:'1rem 1.25rem',marginBottom:'1.5rem'}}>
        <div style={{fontSize:'.75rem',fontWeight:700,color:'#555',letterSpacing:'1px',textTransform:'uppercase' as const,marginBottom:'.75rem'}}>Verification Status</div>
        <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',alignItems:'center'}}>
          {[{label:'Aadhaar',done:false,icon:'🪪'},{label:'PAN',done:false,icon:'📋'},{label:'Police',done:false,icon:'👮'}].map(v=>(
            <div key={v.label} style={{display:'flex',alignItems:'center',gap:6,fontSize:'.83rem'}}>
              {v.icon} <span style={{color:v.done?'#0F6E56':'#999'}}>{v.label}: {v.done?'✅ Verified':'⬜ Pending'}</span>
            </div>
          ))}
          <a href="/verify" style={{marginLeft:'auto',background:'#0F6E56',color:'#fff',fontSize:'.75rem',fontWeight:700,padding:'4px 12px',borderRadius:8,textDecoration:'none'}}>Get Verified →</a>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        {[{icon:'🔍',label:'Search Homes',href:'/search'},{icon:'📄',label:'My Agreements',href:'/agreements'},{icon:'🧾',label:'HRA Receipts',href:'/hra'},{icon:'✅',label:'Get Verified',href:'/verify'}].map(a=>(
          <a key={a.label} href={a.href} style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:14,padding:'1.25rem 1rem',textAlign:'center',textDecoration:'none',color:'#1a1a1a',display:'block',transition:'box-shadow .2s'}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='none'}>
            <div style={{fontSize:'1.5rem',marginBottom:6}}>{a.icon}</div>
            <div style={{fontSize:'.82rem',fontWeight:600}}>{a.label}</div>
          </a>
        ))}
      </div>

      {/* Agreements */}
      {agreements.length>0 && (
        <div style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',marginBottom:'.75rem'}}>My Agreements</h2>
          {agreements.map((a:any)=>(
            <div key={a.id} style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:12,padding:'1rem',marginBottom:'.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.5rem'}}>
              <div>
                <div style={{fontWeight:600,fontSize:'.9rem'}}>{a.property?.title}</div>
                <div style={{fontSize:'.75rem',color:'#888'}}>{a.property?.city} · ₹{a.property?.monthly_rent?.toLocaleString()}/mo</div>
              </div>
              <div style={{background:a.status==='active'?'#E1F5EE':'#FAEEDA',color:a.status==='active'?'#0F6E56':'#BA7517',fontSize:'.7rem',fontWeight:700,padding:'4px 10px',borderRadius:8}}>
                {a.status?.replace('_',' ').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Properties */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.75rem'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem'}}>Saved Homes</h2>
          <a href="/search" style={{fontSize:'.78rem',color:'#0F6E56',fontWeight:600,textDecoration:'none'}}>Browse more →</a>
        </div>
        {saved.length===0 ? (
          <div style={{background:'#f7f9f7',border:'1px dashed #e0e4e0',borderRadius:14,padding:'2.5rem',textAlign:'center'}}>
            <div style={{fontSize:'2rem',marginBottom:8}}>🔍</div>
            <div style={{fontWeight:600,marginBottom:4}}>No saved homes yet</div>
            <div style={{fontSize:'.83rem',color:'#888',marginBottom:'1rem'}}>Search and save properties you like</div>
            <a href="/search" style={{background:'#0F6E56',color:'#fff',padding:'10px 20px',borderRadius:10,fontWeight:700,fontSize:'.85rem',textDecoration:'none'}}>Search Homes</a>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'.75rem'}}>
            {saved.map((p:any)=>(
              <div key={p.id} style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:12,overflow:'hidden',cursor:'pointer'}} onClick={()=>router.push(`/property/${p.id}`)}>
                <div style={{height:90,background:'linear-gradient(135deg,#9FE1CB,#0F6E56)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem'}}>🏠</div>
                <div style={{padding:'.75rem'}}>
                  <div style={{fontWeight:600,fontSize:'.85rem',fontFamily:'Georgia,serif',marginBottom:2}}>{p.title}</div>
                  <div style={{fontSize:'.72rem',color:'#888',marginBottom:4}}>{p.city}</div>
                  <div style={{fontSize:'.9rem',fontWeight:700,color:'#0F6E56'}}>₹{p.monthly_rent?.toLocaleString()}/mo</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
