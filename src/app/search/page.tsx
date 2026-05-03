'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const GRADIENTS = [
  'linear-gradient(135deg,#9FE1CB,#0F6E56)',
  'linear-gradient(135deg,#B5D4F4,#185FA5)',
  'linear-gradient(135deg,#FAC775,#BA7517)',
  'linear-gradient(135deg,#F4C0D1,#993556)',
  'linear-gradient(135deg,#C4B5FD,#7C3AED)',
  'linear-gradient(135deg,#BAE6FD,#0284C7)',
]
const ICONS = ['🏠','🏢','🏡','🛏️','🏙️','🏘️']

function SearchContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [query,      setQuery]      = useState(searchParams.get('q') || '')
  const [propType,   setPropType]   = useState('Any')
  const [budget,     setBudget]     = useState('Any Budget')
  const [furnishing, setFurnishing] = useState('Any')
  const [sortBy,     setSortBy]     = useState('relevance')
  const [listings,   setListings]   = useState<any[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [langPopOpen,setLangPopOpen]= useState(false)
  const [listening,  setListening]  = useState(false)
  const [selLang,    setSelLang]    = useState('en-IN')

  const VOICE_LANGS = [
    {code:'en-IN',label:'English',flag:'🇬🇧'},
    {code:'ta-IN',label:'தமிழ்',flag:'🇮🇳'},
    {code:'hi-IN',label:'हिंदी',flag:'🇮🇳'},
    {code:'te-IN',label:'తెలుగు',flag:'🇮🇳'},
    {code:'kn-IN',label:'ಕನ್ನಡ',flag:'🇮🇳'},
  ]

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (propType !== 'Any') params.set('type', propType)
      if (budget !== 'Any Budget') params.set('budget', budget)
      if (furnishing !== 'Any') params.set('furnishing', furnishing)
      params.set('page', page.toString())
      const res  = await fetch('/api/properties?' + params)
      const data = await res.json()
      let results = data.properties || []
      if (sortBy === 'price_low')  results = [...results].sort((a:any,b:any) => a.monthly_rent - b.monthly_rent)
      if (sortBy === 'price_high') results = [...results].sort((a:any,b:any) => b.monthly_rent - a.monthly_rent)
      if (sortBy === 'newest')     results = [...results].sort((a:any,b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setListings(results)
      setTotal(data.total || 0)
    } catch { setListings([]) }
    setLoading(false)
  }, [query, propType, budget, furnishing, sortBy, page])

  useEffect(() => {
    const t = setTimeout(fetchListings, 300)
    return () => clearTimeout(t)
  }, [fetchListings])

  const startVoice = (lang: string) => {
    setSelLang(lang); setLangPopOpen(false)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice search requires Chrome'); return }
    const rec = new SR()
    rec.lang = lang; rec.interimResults = true; setListening(true)
    rec.onresult = (e: any) => setQuery(Array.from(e.results as any[]).map((r:any) => r[0].transcript).join(''))
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
  }

  const inp: React.CSSProperties = {background:'#fff',border:'1.5px solid #e0e4e0',borderRadius:9,padding:'9px 12px',fontSize:'.85rem',fontFamily:'inherit',outline:'none',color:'#1a1a1a',width:'100%'}

  return (
    <div style={{minHeight:'100vh',background:'#f7f9f7'}}>
      {/* Search bar */}
      <div style={{background:'#fff',borderBottom:'1px solid #e0e4e0',padding:'1rem 1.5rem',position:'sticky',top:64,zIndex:50}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',gap:'.6rem',flexWrap:'wrap',alignItems:'center'}}>
          <div style={{flex:2,minWidth:200,display:'flex',alignItems:'center',gap:8,background:'#f7f9f7',border:'1.5px solid #e0e4e0',borderRadius:9,padding:'9px 12px'}}>
            <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search by area, city, BHK type..." style={{border:'none',background:'transparent',fontFamily:'inherit',fontSize:'.88rem',color:'#1a1a1a',outline:'none',width:'100%'}}/>
          </div>
          <select value={propType} onChange={e=>{setPropType(e.target.value);setPage(1)}} style={{...inp,flex:'none',width:'auto'}}>
            {['Any','1 BHK','2 BHK','3 BHK','4 BHK','Studio','PG / Room'].map(t=><option key={t}>{t}</option>)}
          </select>
          <select value={budget} onChange={e=>{setBudget(e.target.value);setPage(1)}} style={{...inp,flex:'none',width:'auto'}}>
            {['Any Budget','Under ₹10k','₹10k–20k','₹20k–40k','₹40k+'].map(b=><option key={b}>{b}</option>)}
          </select>
          <select value={furnishing} onChange={e=>{setFurnishing(e.target.value);setPage(1)}} style={{...inp,flex:'none',width:'auto'}}>
            {['Any','Unfurnished','Semi Furnished','Fully Furnished'].map(f=><option key={f}>{f}</option>)}
          </select>
          <div style={{position:'relative'}}>
            <button onClick={()=>listening?setListening(false):setLangPopOpen(p=>!p)} style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${listening?'#e24b4a':'#e0e4e0'}`,background:listening?'#fcebeb':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="15" height="15" fill="none" stroke={listening?'#e24b4a':'#555'} strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6"/></svg>
            </button>
            {langPopOpen && (
              <div style={{position:'absolute',top:44,right:0,background:'#fff',border:'1px solid #e0e4e0',borderRadius:10,padding:'.3rem',minWidth:140,zIndex:60,boxShadow:'0 4px 16px rgba(0,0,0,.1)'}}>
                {VOICE_LANGS.map(l=>(
                  <div key={l.code} onClick={()=>startVoice(l.code)} style={{padding:'7px 12px',borderRadius:7,fontSize:'.82rem',cursor:'pointer',display:'flex',gap:8,background:selLang===l.code?'#E1F5EE':'transparent',color:selLang===l.code?'#0F6E56':'#1a1a1a'}}>
                    {l.flag} {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={()=>navigator.geolocation?.getCurrentPosition(pos=>setQuery(`Near ${pos.coords.latitude.toFixed(2)},${pos.coords.longitude.toFixed(2)}`))} style={{background:'#E1F5EE',color:'#0F6E56',border:'1.5px solid #9FE1CB',borderRadius:9,padding:'8px 14px',fontSize:'.82rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
            📍 Near Me
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'1.5rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'.5rem'}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:'1.05rem',fontWeight:700}}>
            {loading?'Searching...':`${total} ${total===1?'Property':'Properties'} Found`}
            {query && <span style={{fontSize:'.82rem',color:'#888',marginLeft:8,fontFamily:'sans-serif',fontWeight:400}}>for "{query}"</span>}
          </span>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:'.78rem',color:'#888'}}>Sort:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:'#fff',border:'1px solid #e0e4e0',borderRadius:8,padding:'6px 10px',fontSize:'.82rem',fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
              <option value="relevance">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {listening && (
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:'1rem',fontSize:'.82rem',color:'#555',background:'#fff',border:'1px solid #e0e4e0',borderRadius:8,padding:'8px 14px',width:'fit-content'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#e24b4a',display:'inline-block',animation:'blink .7s infinite'}}/>
            Listening...
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.2rem'}}>
            {[1,2,3,4,5,6].map(i=>(
              <div key={i} style={{background:'#fff',borderRadius:12,border:'1px solid #e0e4e0',overflow:'hidden'}}>
                <div style={{height:180,background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',backgroundSize:'800px 100%',animation:'shimmer 1.5s infinite'}}/>
                <div style={{padding:'1rem'}}>
                  <div style={{height:16,background:'#f0f0f0',borderRadius:4,marginBottom:8}}/>
                  <div style={{height:12,background:'#f0f0f0',borderRadius:4,width:'60%',marginBottom:12}}/>
                  <div style={{height:20,background:'#f0f0f0',borderRadius:4,width:'40%'}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length===0 && (
          <div style={{textAlign:'center',padding:'4rem 1rem',background:'#fff',borderRadius:16,border:'1px solid #e0e4e0'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔍</div>
            <h3 style={{fontFamily:'Georgia,serif',fontSize:'1.2rem',marginBottom:'.5rem'}}>No properties found</h3>
            <p style={{fontSize:'.88rem',color:'#888',marginBottom:'1.25rem'}}>Try different filters or search terms.</p>
            <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
              {['Anna Nagar, Chennai','Koramangala, Bengaluru','Andheri, Mumbai'].map(ex=>(
                <span key={ex} onClick={()=>{setQuery(ex);setPage(1)}} style={{background:'#E1F5EE',color:'#0F6E56',padding:'6px 14px',borderRadius:20,fontSize:'.82rem',cursor:'pointer',fontWeight:500}}>{ex}</span>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && listings.length>0 && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.2rem'}}>
              {listings.map((l:any,idx:number)=>(
                <div key={l.id} onClick={()=>router.push(`/property/${l.id}`)}
                  style={{background:'#fff',borderRadius:12,border:'1px solid #e0e4e0',overflow:'hidden',cursor:'pointer',transition:'box-shadow .2s,transform .2s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,0,0,.09)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='none';(e.currentTarget as HTMLDivElement).style.transform='none'}}>
                  <div style={{height:180,background:GRADIENTS[idx%GRADIENTS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.8rem',position:'relative'}}>
                    {l.photos?.length>0
                      ? <img src={l.photos[0]} alt={l.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : ICONS[idx%ICONS.length]
                    }
                    <span style={{position:'absolute',top:9,left:9,background:'#fff',color:'#0F6E56',fontSize:'.65rem',fontWeight:700,padding:'2px 8px',borderRadius:5}}>{l.property_type?.toUpperCase()}</span>
                    {l.is_verified && <span style={{position:'absolute',top:9,right:9,background:'#0F6E56',color:'#fff',fontSize:'.65rem',fontWeight:700,padding:'2px 8px',borderRadius:5}}>✓ Verified</span>}
                  </div>
                  <div style={{padding:'1rem'}}>
                    <div style={{fontFamily:'Georgia,serif',fontSize:'.95rem',fontWeight:700,marginBottom:3}}>{l.title}</div>
                    <div style={{fontSize:'.78rem',color:'#888',marginBottom:'.5rem'}}>📍 {[l.address_line2,l.city].filter(Boolean).join(', ')}</div>
                    <div style={{fontSize:'.75rem',color:'#aaa',marginBottom:'.6rem'}}>
                      {l.area_sqft&&`${l.area_sqft} sq.ft · `}{l.furnishing?.replace(/_/g,' ')} · {l.bedrooms} BHK
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontFamily:'Georgia,serif',fontSize:'1.05rem',fontWeight:700,color:'#0F6E56'}}>
                        ₹{l.monthly_rent?.toLocaleString()}<span style={{fontSize:'.72rem',fontWeight:400,color:'#888'}}>/mo</span>
                      </div>
                      <span style={{background:'#FAEEDA',color:'#BA7517',fontSize:'.65rem',fontWeight:700,padding:'3px 8px',borderRadius:5}}>0 Brokerage</span>
                    </div>
                    <button onClick={e=>{e.stopPropagation();router.push(`/property/${l.id}`)}} style={{width:'100%',marginTop:'.75rem',background:'#0F6E56',color:'#fff',border:'none',padding:'9px',borderRadius:9,fontWeight:600,fontSize:'.85rem',cursor:'pointer'}}>
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {total>12 && (
              <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:'2rem'}}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{background:page===1?'#f0f0f0':'#fff',border:'1px solid #e0e4e0',color:page===1?'#bbb':'#1a1a1a',padding:'8px 16px',borderRadius:8,cursor:page===1?'not-allowed':'pointer',fontWeight:600}}>← Prev</button>
                <span style={{padding:'8px 16px',fontSize:'.85rem',color:'#555'}}>Page {page}</span>
                <button onClick={()=>setPage(p=>p+1)} disabled={listings.length<12} style={{background:listings.length<12?'#f0f0f0':'#0F6E56',color:listings.length<12?'#bbb':'#fff',border:'none',padding:'8px 16px',borderRadius:8,cursor:listings.length<12?'not-allowed':'pointer',fontWeight:600}}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-800px 0}100%{background-position:800px 0}}@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}@media(max-width:700px){body{padding-bottom:60px}}`}</style>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{padding:'3rem',textAlign:'center',color:'#0F6E56'}}>Loading...</div>}>
      <SearchContent/>
    </Suspense>
  )
}
