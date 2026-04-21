'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SAMPLE_LISTINGS = [
  { id:1,  title:'Spacious 2BHK with Balcony',      loc:'Anna Nagar, Chennai',       type:'2bhk', price:18000, furnishing:'Semi Furnished', chips:['Family','2 Bath','Parking'],   verified:true,  g:'linear-gradient(135deg,#9FE1CB,#0F6E56)', icon:'🏠', area:950 },
  { id:2,  title:'Modern 1BHK near Metro',           loc:'Koramangala, Bengaluru',    type:'1bhk', price:12500, furnishing:'Furnished',      chips:['Bachelors','AC','WiFi'],        verified:false, g:'linear-gradient(135deg,#B5D4F4,#185FA5)', icon:'🏢', area:620 },
  { id:3,  title:'Premium 3BHK with Parking',        loc:'Andheri West, Mumbai',      type:'3bhk', price:45000, furnishing:'Fully Furnished',chips:['Family','3 Bath','Gym'],        verified:true,  g:'linear-gradient(135deg,#FAC775,#BA7517)', icon:'🏡', area:1450 },
  { id:4,  title:'PG for Working Professionals',     loc:'Sector 15, Gurgaon',        type:'pg',   price:7500,  furnishing:'Furnished',      chips:['Veg Only','WiFi','Meals'],      verified:true,  g:'linear-gradient(135deg,#F4C0D1,#993556)', icon:'🛏️', area:200 },
  { id:5,  title:'3BHK Independent House',           loc:'Anna Nagar, Chennai',       type:'3bhk', price:22000, furnishing:'Semi Furnished', chips:['Family','Garden','Parking'],   verified:true,  g:'linear-gradient(135deg,#9FE1CB,#1D9E75)', icon:'🏡', area:1800 },
  { id:6,  title:'Cozy 1BHK Studio Apartment',       loc:'Indiranagar, Bengaluru',    type:'studio',price:9500, furnishing:'Furnished',      chips:['Bachelors','AC','Power Backup'],verified:false, g:'linear-gradient(135deg,#C4B5FD,#7C3AED)', icon:'🏠', area:450 },
  { id:7,  title:'2BHK East Facing Flat',            loc:'Banjara Hills, Hyderabad',  type:'2bhk', price:15000, furnishing:'Semi Furnished', chips:['Family','East Facing','Lift'], verified:true,  g:'linear-gradient(135deg,#FCA5A5,#DC2626)', icon:'🏢', area:1050 },
  { id:8,  title:'Luxury 3BHK with Sea View',        loc:'Bandra West, Mumbai',       type:'3bhk', price:85000, furnishing:'Fully Furnished',chips:['Family','Sea View','Gym'],      verified:true,  g:'linear-gradient(135deg,#BAE6FD,#0284C7)', icon:'🏙️', area:2100 },
]

type SortOption = 'relevance' | 'price_low' | 'price_high' | 'newest'

function SearchContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [query,     setQuery]     = useState(searchParams.get('q') || '')
  const [propType,  setPropType]  = useState(searchParams.get('type') || 'Any')
  const [budget,    setBudget]    = useState(searchParams.get('budget') || 'Any Budget')
  const [furnishing,setFurnishing]= useState('Any')
  const [sortBy,    setSortBy]    = useState<SortOption>('relevance')
  const [loading,   setLoading]   = useState(false)
  const [listings,  setListings]  = useState(SAMPLE_LISTINGS)

  // Voice
  const [listening,   setListening]   = useState(false)
  const [langPopOpen, setLangPopOpen] = useState(false)
  const [selLang,     setSelLang]     = useState('en-IN')

  const VOICE_LANGS = [
    { code:'en-IN', label:'English', flag:'🇬🇧' },
    { code:'ta-IN', label:'தமிழ்',   flag:'🇮🇳' },
    { code:'hi-IN', label:'हिंदी',   flag:'🇮🇳' },
    { code:'te-IN', label:'తెలుగు',  flag:'🇮🇳' },
    { code:'kn-IN', label:'ಕನ್ನಡ',   flag:'🇮🇳' },
  ]

  // Filter + sort listings
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      let filtered = [...SAMPLE_LISTINGS]

      if (query) {
        const q = query.toLowerCase()
        filtered = filtered.filter(l =>
          l.title.toLowerCase().includes(q) ||
          l.loc.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q) ||
          l.chips.some(c => c.toLowerCase().includes(q))
        )
      }
      if (propType && propType !== 'Any') {
        filtered = filtered.filter(l => l.type === propType.toLowerCase().replace(' ','').replace('/room',''))
      }
      if (budget !== 'Any Budget') {
        if (budget === 'Under ₹10k')  filtered = filtered.filter(l => l.price < 10000)
        if (budget === '₹10k–20k')    filtered = filtered.filter(l => l.price >= 10000 && l.price <= 20000)
        if (budget === '₹20k–40k')    filtered = filtered.filter(l => l.price >= 20000 && l.price <= 40000)
        if (budget === '₹40k+')       filtered = filtered.filter(l => l.price > 40000)
      }
      if (furnishing !== 'Any') {
        filtered = filtered.filter(l => l.furnishing === furnishing)
      }
      if (sortBy === 'price_low')  filtered.sort((a,b) => a.price - b.price)
      if (sortBy === 'price_high') filtered.sort((a,b) => b.price - a.price)

      setListings(filtered)
      setLoading(false)
    }, 400)
  }, [query, propType, budget, furnishing, sortBy])

  const startVoice = (lang: string) => {
    setSelLang(lang)
    setLangPopOpen(false)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice search requires Chrome browser'); return }
    const rec = new SR()
    rec.lang = lang; rec.interimResults = true
    setListening(true)
    rec.onresult = (e: any) => setQuery(Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(''))
    rec.onend  = () => setListening(false)
    rec.onerror= () => setListening(false)
    rec.start()
  }

  const inp: React.CSSProperties = {
    background:'#fff', border:'1.5px solid #e0e4e0', borderRadius:9,
    padding:'9px 12px', fontSize:'.85rem', fontFamily:'inherit',
    outline:'none', color:'#1a1a1a', width:'100%',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f9f7' }}>

      {/* ── SEARCH BAR ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e0e4e0', padding:'1rem 1.5rem', position:'sticky', top:64, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center' }}>

          {/* Search input */}
          <div style={{ flex:2, minWidth:200, display:'flex', alignItems:'center', gap:8, background:'#f7f9f7', border:'1.5px solid #e0e4e0', borderRadius:9, padding:'9px 12px' }}>
            <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by area, city, BHK type..."
              style={{ border:'none', background:'transparent', fontFamily:'inherit', fontSize:'.88rem', color:'#1a1a1a', outline:'none', width:'100%' }} />
          </div>

          {/* Filters */}
          <select value={propType} onChange={e => setPropType(e.target.value)} style={inp}>
            {['Any','1 BHK','2 BHK','3 BHK','4 BHK','Studio','PG / Room'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={budget} onChange={e => setBudget(e.target.value)} style={inp}>
            {['Any Budget','Under ₹10k','₹10k–20k','₹20k–40k','₹40k+'].map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={furnishing} onChange={e => setFurnishing(e.target.value)} style={inp}>
            {['Any','Unfurnished','Semi Furnished','Fully Furnished'].map(f => <option key={f}>{f}</option>)}
          </select>

          {/* Voice mic */}
          <div style={{ position:'relative' }}>
            <button onClick={() => listening ? setListening(false) : setLangPopOpen(p => !p)}
              title="Voice Search"
              style={{ width:38, height:38, borderRadius:'50%', border:`1.5px solid ${listening ? '#e24b4a' : '#e0e4e0'}`, background: listening ? '#fcebeb' : '#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', animation: listening ? 'mic-pulse 1s infinite' : 'none' }}>
              <svg width="15" height="15" fill="none" stroke={listening ? '#e24b4a' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6"/>
              </svg>
            </button>
            {langPopOpen && (
              <div style={{ position:'absolute', top:44, right:0, background:'#fff', border:'1px solid #e0e4e0', borderRadius:10, padding:'.3rem', minWidth:140, zIndex:60, boxShadow:'0 4px 16px rgba(0,0,0,.1)' }}>
                {VOICE_LANGS.map(l => (
                  <div key={l.code} onClick={() => startVoice(l.code)}
                    style={{ padding:'7px 12px', borderRadius:7, fontSize:'.82rem', cursor:'pointer', display:'flex', gap:8, fontWeight:500, background: selLang===l.code ? '#E1F5EE' : 'transparent', color: selLang===l.code ? '#0F6E56' : '#1a1a1a' }}>
                    {l.flag} {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Near me */}
          <button onClick={() => {
            navigator.geolocation?.getCurrentPosition(pos => {
              setQuery(`Near me (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`)
            })
          }}
          style={{ background:'#E1F5EE', color:'#0F6E56', border:'1.5px solid #9FE1CB', borderRadius:9, padding:'8px 14px', fontSize:'.82rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
            📍 Near Me
          </button>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem' }}>

        {/* Results header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'.5rem' }}>
          <div>
            <span style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:700 }}>
              {loading ? 'Searching...' : `${listings.length} Properties Found`}
            </span>
            {query && <span style={{ fontSize:'.82rem', color:'#888', marginLeft:8 }}>for "{query}"</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'.78rem', color:'#888' }}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
              style={{ background:'#fff', border:'1px solid #e0e4e0', borderRadius:8, padding:'6px 10px', fontSize:'.82rem', fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
              <option value="relevance">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Listening indicator */}
        {listening && (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'1rem', fontSize:'.82rem', color:'#555', background:'#fff', border:'1px solid #e0e4e0', borderRadius:8, padding:'8px 14px', width:'fit-content' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#e24b4a', display:'inline-block', animation:'blink .7s infinite' }} />
            Listening... speak your search
          </div>
        )}

        {/* No results */}
        {!loading && listings.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem 1rem', background:'#fff', borderRadius:16, border:'1px solid #e0e4e0' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
            <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.2rem', marginBottom:'.5rem' }}>No properties found</h3>
            <p style={{ fontSize:'.88rem', color:'#888', marginBottom:'1.25rem' }}>Try a different area, city, or budget filter.</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              {['Anna Nagar, Chennai','Koramangala, Bengaluru','Andheri, Mumbai'].map(ex => (
                <span key={ex} onClick={() => setQuery(ex)}
                  style={{ background:'#E1F5EE', color:'#0F6E56', padding:'6px 14px', borderRadius:20, fontSize:'.82rem', cursor:'pointer', fontWeight:500 }}>
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.2rem' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e4e0', overflow:'hidden' }}>
                <div style={{ height:180, background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize:'800px 100%', animation:'shimmer 1.5s infinite' }} />
                <div style={{ padding:'1rem' }}>
                  <div style={{ height:16, background:'#f0f0f0', borderRadius:4, marginBottom:8, animation:'shimmer 1.5s infinite' }} />
                  <div style={{ height:12, background:'#f0f0f0', borderRadius:4, width:'60%', marginBottom:12, animation:'shimmer 1.5s infinite' }} />
                  <div style={{ height:20, background:'#f0f0f0', borderRadius:4, width:'40%', animation:'shimmer 1.5s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Listings grid */}
        {!loading && listings.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.2rem' }}>
            {listings.map(l => (
              <div key={l.id} onClick={() => router.push(`/property/${l.id}`)}
                style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e4e0', overflow:'hidden', cursor:'pointer', transition:'box-shadow .2s,transform .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,0,0,.09)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='none'; (e.currentTarget as HTMLDivElement).style.transform='none' }}>
                <div style={{ height:180, background:l.g, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.8rem', position:'relative' }}>
                  <span style={{ position:'absolute', top:9, left:9, background:'#fff', color:'#0F6E56', fontSize:'.65rem', fontWeight:700, padding:'2px 8px', borderRadius:5 }}>{l.type.toUpperCase()}</span>
                  {l.verified && <span style={{ position:'absolute', top:9, right:9, background:'#0F6E56', color:'#fff', fontSize:'.65rem', fontWeight:700, padding:'2px 8px', borderRadius:5 }}>✓ Verified</span>}
                  {l.icon}
                </div>
                <div style={{ padding:'1rem' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'.95rem', fontWeight:700, marginBottom:3 }}>{l.title}</div>
                  <div style={{ fontSize:'.78rem', color:'#888', marginBottom:'.6rem' }}>📍 {l.loc}</div>
                  <div style={{ fontSize:'.75rem', color:'#aaa', marginBottom:'.6rem' }}>
                    {l.area} sq.ft · {l.furnishing}
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:'.75rem' }}>
                    {l.chips.map(c => <span key={c} style={{ background:'#f7f9f7', borderRadius:5, padding:'2px 8px', fontSize:'.68rem', color:'#555' }}>{c}</span>)}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:700, color:'#0F6E56' }}>
                      ₹{l.price.toLocaleString()}<span style={{ fontSize:'.72rem', fontWeight:400, color:'#888' }}>/mo</span>
                    </div>
                    <span style={{ background:'#FAEEDA', color:'#BA7517', fontSize:'.65rem', fontWeight:700, padding:'3px 8px', borderRadius:5 }}>0 Brokerage</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/property/${l.id}`) }}
                    style={{ width:'100%', marginTop:'.75rem', background:'#0F6E56', color:'#fff', border:'none', padding:'9px', borderRadius:9, fontWeight:600, fontSize:'.85rem', cursor:'pointer' }}>
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer{0%{background-position:-800px 0}100%{background-position:800px 0}}
        @keyframes mic-pulse{0%,100%{box-shadow:0 0 0 0 rgba(226,75,74,.3)}50%{box-shadow:0 0 0 8px rgba(226,75,74,0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @media(max-width:700px){body{padding-bottom:60px}}
      `}</style>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding:'3rem', textAlign:'center', color:'#0F6E56', fontFamily:'Georgia,serif', fontSize:'1.1rem' }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  )
}
