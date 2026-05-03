'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OwnerDashboard() {
  const router = useRouter()
  const [profile,    setProfile]    = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [inquiries,  setInquiries]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState<'listings'|'inquiries'>('listings')

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    const name   = localStorage.getItem('rn_user_name')
    const phone  = localStorage.getItem('rn_user_phone')
    const role   = localStorage.getItem('rn_user_role')
    const userId = localStorage.getItem('rn_user_id')
    if (!name || !phone) { router.replace('/auth/login'); return }
    if (role !== 'owner') { router.replace('/dashboard/tenant'); return }
    setProfile({ full_name: name, phone, role })

    if (userId) {
      try {
        const { data: propsData } = await supabase
          .from('properties').select('*')
          .eq('owner_id', userId).order('created_at', { ascending: false })
        if (propsData) setProperties(propsData)

        const { data: inqData } = await supabase
          .from('inquiries')
          .select('*, property:properties(title, city, monthly_rent)')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false }).limit(10)
        if (inqData) setInquiries(inqData)
      } catch (err) { console.error(err) }
    }
    setLoading(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('properties').update({ status }).eq('id', id)
    setProperties(prev => prev.map(p => p.id===id ? {...p, status} : p))
  }

  const handleLogout = () => {
    ['rn_user_name','rn_user_phone','rn_user_role','rn_user_id','rn_access_token'].forEach(k => localStorage.removeItem(k))
    router.replace('/')
  }

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#0F6E56',fontFamily:'Georgia,serif',fontSize:'1.1rem'}}>Loading dashboard...</div>
    </div>
  )

  const activeProps     = properties.filter(p=>p.status==='active').length
  const draftProps      = properties.filter(p=>p.status==='draft').length
  const unreadInquiries = inquiries.filter(i=>!i.is_read).length

  const statusStyle: Record<string,{bg:string,color:string}> = {
    active:   {bg:'#E1F5EE',color:'#0F6E56'},
    draft:    {bg:'#f0f0f0',color:'#888'},
    rented:   {bg:'#FAEEDA',color:'#BA7517'},
    inactive: {bg:'#fff5f5',color:'#e24b4a'},
  }

  return (
    <div style={{maxWidth:960,margin:'0 auto',padding:'2rem 1rem 4rem'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:700,marginBottom:4}}>Owner Dashboard 🔑</h1>
          <p style={{fontSize:'.85rem',color:'#555'}}>{profile?.full_name} · +91 {profile?.phone}</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <a href="/list-property" style={{background:'#0F6E56',color:'#fff',padding:'10px 18px',borderRadius:10,fontWeight:700,fontSize:'.85rem',textDecoration:'none'}}>➕ List Property</a>
          <button onClick={handleLogout} style={{background:'#f7f9f7',border:'1px solid #e0e4e0',color:'#555',padding:'10px 14px',borderRadius:10,fontSize:'.78rem',fontWeight:600,cursor:'pointer'}}>Sign Out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'1rem',marginBottom:'1.75rem'}}>
        {[
          {label:'Total',    value:properties.length, icon:'🏠', accent:false},
          {label:'Active',   value:activeProps,        icon:'✅', accent:activeProps>0},
          {label:'Drafts',   value:draftProps,         icon:'📝', accent:false},
          {label:'New Inquiries', value:unreadInquiries, icon:'🔔', accent:unreadInquiries>0},
        ].map(s=>(
          <div key={s.label} style={{background:s.accent?'#E1F5EE':'#f7f9f7',border:`1px solid ${s.accent?'#9FE1CB':'#e0e4e0'}`,borderRadius:14,padding:'1rem',textAlign:'center'}}>
            <div style={{fontSize:'1.4rem',marginBottom:4}}>{s.icon}</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:700,color:s.accent?'#0F6E56':'#1a1a1a'}}>{s.value}</div>
            <div style={{fontSize:'.72rem',color:'#888'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'#f7f9f7',borderRadius:10,padding:4,marginBottom:'1.5rem',width:'fit-content'}}>
        {(['listings','inquiries'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            style={{padding:'8px 20px',borderRadius:8,border:'none',background:activeTab===tab?'#fff':'transparent',color:activeTab===tab?'#0F6E56':'#555',fontWeight:activeTab===tab?600:500,fontSize:'.85rem',cursor:'pointer',boxShadow:activeTab===tab?'0 1px 6px rgba(0,0,0,.08)':'none',textTransform:'capitalize'}}>
            {tab}{tab==='inquiries'&&unreadInquiries>0&&<span style={{background:'#0F6E56',color:'#fff',fontSize:'.65rem',fontWeight:700,padding:'1px 6px',borderRadius:8,marginLeft:4}}>{unreadInquiries}</span>}
          </button>
        ))}
      </div>

      {/* LISTINGS */}
      {activeTab==='listings' && (
        properties.length===0 ? (
          <div style={{background:'#f7f9f7',border:'1px dashed #e0e4e0',borderRadius:14,padding:'3rem',textAlign:'center'}}>
            <div style={{fontSize:'2.5rem',marginBottom:8}}>🏠</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,marginBottom:'.5rem'}}>No listings yet</div>
            <div style={{fontSize:'.85rem',color:'#888',marginBottom:'1.25rem'}}>Create your first listing in 5 minutes</div>
            <a href="/list-property" style={{background:'#0F6E56',color:'#fff',padding:'10px 24px',borderRadius:10,fontWeight:700,fontSize:'.88rem',textDecoration:'none'}}>List a Property</a>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
            {properties.map((p:any)=>(
              <div key={p.id} style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:12,padding:'1.1rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.75rem'}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:'Georgia,serif',fontWeight:700,fontSize:'.95rem',marginBottom:3}}>{p.title}</div>
                  <div style={{fontSize:'.75rem',color:'#888'}}>📍 {[p.city,p.state].filter(Boolean).join(', ')} · {p.property_type?.toUpperCase()} · {p.bedrooms} BHK</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'.75rem',flexWrap:'wrap'}}>
                  <div style={{fontFamily:'Georgia,serif',fontWeight:700,fontSize:'1rem',color:'#0F6E56'}}>₹{p.monthly_rent?.toLocaleString()}/mo</div>
                  <select value={p.status} onChange={e=>handleStatusChange(p.id,e.target.value)}
                    style={{background:statusStyle[p.status]?.bg||'#f0f0f0',color:statusStyle[p.status]?.color||'#888',border:'none',borderRadius:8,padding:'4px 10px',fontSize:'.75rem',fontWeight:700,cursor:'pointer',outline:'none'}}>
                    <option value="draft">DRAFT</option>
                    <option value="active">ACTIVE</option>
                    <option value="rented">RENTED</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                  <button onClick={()=>router.push(`/property/${p.id}`)} style={{background:'#f7f9f7',border:'1px solid #e0e4e0',color:'#555',padding:'5px 12px',borderRadius:8,fontSize:'.75rem',cursor:'pointer'}}>View</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* INQUIRIES */}
      {activeTab==='inquiries' && (
        inquiries.length===0 ? (
          <div style={{background:'#f7f9f7',border:'1px dashed #e0e4e0',borderRadius:14,padding:'3rem',textAlign:'center'}}>
            <div style={{fontSize:'2.5rem',marginBottom:8}}>📨</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,marginBottom:'.5rem'}}>No inquiries yet</div>
            <div style={{fontSize:'.85rem',color:'#888'}}>Publish listings to start receiving inquiries</div>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'.65rem'}}>
            {inquiries.map((inq:any)=>(
              <div key={inq.id} style={{background:inq.is_read?'#fff':'#f0faf6',border:`1px solid ${inq.is_read?'#e0e4e0':'#9FE1CB'}`,borderRadius:12,padding:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'.75rem',flexWrap:'wrap'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:'.9rem',marginBottom:3}}>Inquiry for: <span style={{color:'#0F6E56'}}>{inq.property?.title}</span></div>
                  <div style={{fontSize:'.78rem',color:'#888'}}>{inq.property?.city} · ₹{inq.property?.monthly_rent?.toLocaleString()}/mo</div>
                  {inq.message&&<div style={{fontSize:'.8rem',color:'#555',marginTop:4}}>"{inq.message}"</div>}
                  <div style={{fontSize:'.72rem',color:'#aaa',marginTop:4}}>{new Date(inq.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                </div>
                {!inq.is_read&&<div style={{width:10,height:10,borderRadius:'50%',background:'#0F6E56',flexShrink:0}}/>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
