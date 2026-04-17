'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────
type VoiceLang = 'en-IN' | 'ta-IN' | 'hi-IN'
type ModalStep = 'phone' | 'otp' | 'success'
type Role      = 'tenant' | 'owner'

const VOICE_LANGS: { code: VoiceLang; label: string; flag: string }[] = [
  { code: 'en-IN', label: 'English', flag: '🇬🇧' },
  { code: 'ta-IN', label: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'hi-IN', label: 'हिंदी',   flag: '🇮🇳' },
]

const LISTINGS = [
  { id:1, title:'Spacious 2BHK with Balcony', loc:'Nungambakkam, Chennai', type:'2 BHK', price:18000, chips:['Family','Semi-Furn','2 Bath'], verified:true,  g:'linear-gradient(135deg,#9FE1CB,#0F6E56)', icon:'🏠' },
  { id:2, title:'Modern Studio near Metro',   loc:'Koramangala, Bengaluru', type:'1 BHK', price:12500, chips:['Bachelors','Furnished','AC'],   verified:false, g:'linear-gradient(135deg,#B5D4F4,#185FA5)', icon:'🏢' },
  { id:3, title:'Premium 3BHK with Parking',  loc:'Andheri West, Mumbai',   type:'3 BHK', price:45000, chips:['Family','Fully Furn','3 Bath'], verified:true,  g:'linear-gradient(135deg,#FAC775,#BA7517)', icon:'🏡', ai:true },
  { id:4, title:'PG for Working Professionals',loc:'Sector 15, Gurgaon',    type:'PG',    price:7500,  chips:['Veg Only','WiFi','Meals'],       verified:true,  g:'linear-gradient(135deg,#F4C0D1,#993556)', icon:'🛏️' },
]

export default function HomePage() {
  const router = useRouter()

  // search
  const [searchVal,  setSearchVal]  = useState('')
  const [propType,   setPropType]   = useState('2 BHK')
  const [budget,     setBudget]     = useState('Any Budget')
  const [activeCity, setActiveCity] = useState('All India')

  // voice
  const [listening,      setListening]      = useState(false)
  const [selLang,        setSelLang]        = useState<VoiceLang>('en-IN')
  const [langPopOpen,    setLangPopOpen]    = useState(false)
  const recognitionRef                      = useRef<SpeechRecognition | null>(null)
  const micRef                              = useRef<HTMLDivElement>(null)

  // OTP modal
  const [modalOpen, setModalOpen] = useState(false)
  const [role,      setRole]      = useState<Role>('tenant')
  const [step,      setStep]      = useState<ModalStep>('phone')
  const [phone,     setPhone]     = useState('')
  const [cc,        setCc]        = useState('+91')
  const [otp,       setOtp]       = useState(['','','',''])
  const [otpErr,    setOtpErr]    = useState(false)
  const otpRefs = [useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null)]

  const isTestMode = process.env.NODE_ENV !== 'production'

  // PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Close lang popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (micRef.current && !micRef.current.contains(e.target as Node)) setLangPopOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Voice ──────────────────────────────────────────────────
  const pickLang = (lang: VoiceLang) => {
    setSelLang(lang)
    setLangPopOpen(false)
    startListening(lang)
  }

  const startListening = (lang: VoiceLang) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice search not supported in this browser'); return }
    const rec = new SR()
    rec.lang = lang; rec.interimResults = true; rec.continuous = false
    setListening(true)
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setSearchVal(t)
    }
    rec.onend  = () => setListening(false)
    rec.onerror= () => setListening(false)
    recognitionRef.current = rec
    rec.start()
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  // ── OTP Modal ──────────────────────────────────────────────
  const openModal = (r: Role = 'tenant') => {
    setRole(r); setStep('phone'); setPhone(''); setOtp(['','','','']); setOtpErr(false); setModalOpen(true)
  }

  const sendOtp = async () => {
    if (phone.length !== 10) return
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role }),
      })
    } catch {}
    setStep('otp')
    setTimeout(() => otpRefs[0].current?.focus(), 150)
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const n = [...otp]; n[i] = v; setOtp(n); setOtpErr(false)
    if (v && i < 3) otpRefs[i+1].current?.focus()
  }

  const handleOtpBack = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const n = [...otp]; n[i-1] = ''; setOtp(n)
      otpRefs[i-1].current?.focus()
    }
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 4) return
    if (isTestMode && code !== '1234') {
      setOtpErr(true)
      setTimeout(() => { setOtp(['','','','']); setOtpErr(false); otpRefs[0].current?.focus() }, 700)
      return
    }
    setStep('success')
    setTimeout(() => {
      setModalOpen(false)
      router.push(role === 'owner' ? '/dashboard/owner' : '/dashboard/tenant')
    }, 1500)
  }

  // ── Styles ─────────────────────────────────────────────────
  const S = {
    btn:  (active: boolean, accent = '#0F6E56') => ({
      padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${active ? accent : '#e0e4e0'}`,
      background: active ? (accent === '#0F6E56' ? '#E1F5EE' : '#fff') : '#fff',
      color: active ? accent : '#555', fontWeight: 600 as const, fontSize: '.8rem', cursor: 'pointer' as const,
    }),
    input: {
      width: '100%', background: '#f7f9f7', border: '1.5px solid #e0e4e0', borderRadius: 10,
      padding: '10px 12px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', color: '#1a1a1a',
    } as React.CSSProperties,
    label: { display: 'block' as const, fontSize: '.78rem', fontWeight: 600 as const, color: '#555', marginBottom: 5 },
  }

  const cities = ['All India','Chennai','Bengaluru','Mumbai','Delhi NCR','Hyderabad','Pune']
  const stepDots: ModalStep[] = ['phone','otp','success']

  return (
    <>
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e0e4e0', padding:'0 1.5rem', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:700, color:'#0F6E56' }}>
          Rent<span style={{ color:'#1a1a1a' }}>Nestle</span>
        </div>
        <div className="nav-desktop" style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
          <a href="/search"         style={{ fontSize:'.83rem', color:'#555', textDecoration:'none', fontWeight:500 }}>Find a Home</a>
          <a href="/list-property"  style={{ fontSize:'.83rem', color:'#555', textDecoration:'none', fontWeight:500 }}>List Property</a>
          <a href="#agreements"     style={{ fontSize:'.83rem', color:'#555', textDecoration:'none', fontWeight:500 }}>Agreements</a>
          <a href="#plans"          style={{ fontSize:'.83rem', color:'#555', textDecoration:'none', fontWeight:500 }}>Plans</a>
          <button onClick={() => openModal('tenant')} style={{ background:'#0F6E56', color:'#fff', padding:'.4rem 1rem', borderRadius:8, fontSize:'.83rem', fontWeight:600, border:'none', cursor:'pointer' }}>
            Sign In / Register
          </button>
        </div>
        {/* Mobile hamburger placeholder */}
        <button className="nav-mobile" onClick={() => openModal('tenant')} style={{ display:'none', background:'#0F6E56', color:'#fff', padding:'6px 12px', borderRadius:8, fontSize:'.8rem', fontWeight:600, border:'none', cursor:'pointer' }}>
          Sign In
        </button>
      </nav>

      <style>{`
        @media(max-width:680px){
          .nav-desktop{display:none!important}
          .nav-mobile{display:block!important}
          .hero-grid{grid-template-columns:1fr!important}
          .hero-phone{display:none!important}
          .plans-grid{grid-template-columns:1fr!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
          body{padding-bottom:60px}
          .bottom-nav{display:flex!important}
          section{padding:2.5rem 1rem!important}
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{ background:'linear-gradient(150deg,#eef8f4 0%,#fff 65%)', padding:'3.5rem 1.5rem 3rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:'3rem', alignItems:'center' }}>

            {/* LEFT */}
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#E1F5EE', color:'#0F6E56', fontSize:'.75rem', fontWeight:700, padding:'.3rem .8rem', borderRadius:20, marginBottom:'1rem' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#1D9E75', display:'inline-block' }} />
                Zero Brokerage · 100% Digital
              </div>
              <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,4.5vw,3.2rem)', fontWeight:700, lineHeight:1.12, letterSpacing:-1, marginBottom:'1rem' }}>
                Find Your<br/><span style={{ color:'#0F6E56' }}>Perfect Rental</span><br/>No Broker. No Drama.
              </h1>
              <p style={{ fontSize:'1rem', color:'#555', lineHeight:1.7, maxWidth:460, marginBottom:'2rem', fontWeight:300 }}>
                AI-powered rental portal with digital agreements, police verification, and zero brokerage fees across India.
              </p>

              {/* SEARCH BOX */}
              <div style={{ background:'#fff', border:'1.5px solid #e0e4e0', borderRadius:14, padding:'.7rem', display:'flex', gap:'.5rem', flexWrap:'wrap', boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
                <div style={{ flex:2, minWidth:160, display:'flex', alignItems:'center', gap:8, background:'#f7f9f7', borderRadius:9, padding:'8px 12px' }}>
                  <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
                    placeholder="City, area or locality..."
                    style={{ border:'none', background:'transparent', fontFamily:'inherit', fontSize:'.85rem', color:'#1a1a1a', outline:'none', width:'100%' }} />
                </div>
                <div style={{ flex:1, minWidth:110, display:'flex', alignItems:'center', background:'#f7f9f7', borderRadius:9, padding:'4px 8px' }}>
                  <select value={propType} onChange={e => setPropType(e.target.value)}
                    style={{ border:'none', background:'transparent', fontFamily:'inherit', fontSize:'.83rem', color:'#1a1a1a', outline:'none', width:'100%', cursor:'pointer' }}>
                    {['1 BHK','2 BHK','3 BHK','PG / Room','Commercial'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex:1, minWidth:120, display:'flex', alignItems:'center', background:'#f7f9f7', borderRadius:9, padding:'4px 8px' }}>
                  <select value={budget} onChange={e => setBudget(e.target.value)}
                    style={{ border:'none', background:'transparent', fontFamily:'inherit', fontSize:'.83rem', color:'#1a1a1a', outline:'none', width:'100%', cursor:'pointer' }}>
                    {['Any Budget','Under ₹10k','₹10k–20k','₹20k–40k','₹40k+'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>

                {/* MIC BUTTON */}
                <div ref={micRef} style={{ position:'relative' }}>
                  <button
                    onClick={() => { if (listening) { stopListening() } else { setLangPopOpen(p => !p) } }}
                    style={{ width:38, height:38, borderRadius:'50%', border:`1.5px solid ${listening ? '#e24b4a' : '#e0e4e0'}`, background: listening ? '#fcebeb' : '#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, animation: listening ? 'mic-pulse 1s infinite' : 'none' }}>
                    <svg width="16" height="16" fill="none" stroke={listening ? '#e24b4a' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="2" width="6" height="12" rx="3"/>
                      <path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6"/>
                    </svg>
                  </button>
                  {/* Language picker popup */}
                  {langPopOpen && (
                    <div style={{ position:'absolute', top:46, right:0, background:'#fff', border:'1px solid #e0e4e0', borderRadius:10, padding:'.35rem', minWidth:130, zIndex:50, boxShadow:'0 4px 16px rgba(0,0,0,.1)' }}>
                      {VOICE_LANGS.map(l => (
                        <div key={l.code} onClick={() => pickLang(l.code)}
                          style={{ padding:'8px 12px', borderRadius:7, fontSize:'.82rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontWeight:500,
                            background: selLang === l.code ? '#E1F5EE' : 'transparent',
                            color: selLang === l.code ? '#0F6E56' : '#1a1a1a' }}>
                          <span>{l.flag}</span>{l.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => router.push(`/search?q=${searchVal}&type=${propType}`)}
                  style={{ background:'#0F6E56', color:'#fff', border:'none', padding:'.58rem 1.3rem', borderRadius:9, fontWeight:700, fontSize:'.88rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                  Search
                </button>
              </div>

              {/* Voice listening indicator */}
              {listening && (
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, fontSize:'.8rem', color:'#555', background:'#f7f9f7', borderRadius:8, padding:'6px 12px', width:'fit-content' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#e24b4a', display:'inline-block', animation:'blink .7s infinite' }} />
                  Listening in {VOICE_LANGS.find(l => l.code === selLang)?.label}...
                  <button onClick={stopListening} style={{ background:'none', border:'none', color:'#e24b4a', fontSize:'.75rem', cursor:'pointer', marginLeft:4 }}>Stop</button>
                </div>
              )}

              {/* Stats */}
              <div style={{ display:'flex', gap:'2rem', marginTop:'1.5rem' }}>
                {[['12,400+','Active Listings'],['₹0','Brokerage'],['24h','Agreement']].map(([v,l]) => (
                  <div key={l}>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:700 }}>{v}</div>
                    <div style={{ fontSize:'.75rem', color:'#999' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Phone mockup */}
            <div className="hero-phone" style={{ maxWidth:260, margin:'0 auto' }}>
              <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e0e4e0', padding:'1rem', boxShadow:'0 6px 32px rgba(0,0,0,.08)' }}>
                <div style={{ width:50, height:4, background:'#e0e4e0', borderRadius:3, margin:'0 auto .75rem' }} />
                <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid #e0e4e0' }}>
                  <div style={{ height:130, background:'linear-gradient(135deg,#9FE1CB,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.8rem', position:'relative' }}>
                    <span style={{ position:'absolute', top:8, left:8, background:'#fff', color:'#0F6E56', fontSize:'.65rem', fontWeight:700, padding:'2px 6px', borderRadius:5 }}>2 BHK</span>
                    <span style={{ position:'absolute', top:8, right:8, background:'#0F6E56', color:'#fff', fontSize:'.65rem', fontWeight:700, padding:'2px 6px', borderRadius:5 }}>✓ Verified</span>
                    🏠
                  </div>
                  <div style={{ padding:'.7rem' }}>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'.88rem', fontWeight:700 }}>Spacious 2BHK Flat</div>
                    <div style={{ fontSize:'.72rem', color:'#999', margin:'.2rem 0 .5rem' }}>📍 Anna Salai, Chennai</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:700, color:'#0F6E56' }}>₹18,000/mo</div>
                      <div style={{ display:'flex', gap:4 }}>
                        <span style={{ background:'#E1F5EE', color:'#0F6E56', fontSize:'.62rem', fontWeight:600, padding:'2px 6px', borderRadius:4 }}>Family</span>
                      </div>
                    </div>
                    <div style={{ background:'#FAEEDA', color:'#BA7517', fontSize:'.68rem', fontWeight:700, padding:'4px 8px', borderRadius:6, marginTop:6, display:'inline-block' }}>🎉 Zero Brokerage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LISTINGS ──────────────────────────────────────── */}
      <section style={{ padding:'3.5rem 1.5rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'1.5px', color:'#0F6E56', textTransform:'uppercase', marginBottom:4 }}>Featured</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:700, letterSpacing:'-.8px', marginBottom:4 }}>Latest Listings</h2>
          <p style={{ fontSize:'.95rem', color:'#555', marginBottom:'1.25rem' }}>Verified properties. No hidden charges.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1.75rem' }}>
            {cities.map(c => (
              <span key={c} onClick={() => setActiveCity(c)}
                style={{ background: activeCity===c ? '#0F6E56' : '#f7f9f7', color: activeCity===c ? '#fff' : '#555', border:`1px solid ${activeCity===c ? '#0F6E56' : '#e0e4e0'}`, borderRadius:20, padding:'.35rem .9rem', fontSize:'.82rem', fontWeight:500, cursor:'pointer', transition:'all .2s' }}>
                {c}
              </span>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1.2rem' }}>
            {LISTINGS.map(l => (
              <div key={l.id} onClick={() => router.push(`/property/${l.id}`)}
                style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e4e0', overflow:'hidden', cursor:'pointer', transition:'box-shadow .2s,transform .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(0,0,0,.09)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='none'; (e.currentTarget as HTMLDivElement).style.transform='none' }}>
                <div style={{ height:160, background:l.g, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', position:'relative' }}>
                  <span style={{ position:'absolute', top:9, left:9, background:'#fff', color:'#0F6E56', fontSize:'.65rem', fontWeight:700, padding:'2px 6px', borderRadius:5 }}>{l.type}</span>
                  {l.verified && <span style={{ position:'absolute', top:9, right:9, background:'#0F6E56', color:'#fff', fontSize:'.65rem', fontWeight:700, padding:'2px 6px', borderRadius:5 }}>{l.ai ? 'AI Enhanced' : '✓ Verified'}</span>}
                  {l.icon}
                </div>
                <div style={{ padding:'.9rem' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'.92rem', fontWeight:700, marginBottom:2 }}>{l.title}</div>
                  <div style={{ fontSize:'.75rem', color:'#999', marginBottom:'.55rem' }}>📍 {l.loc}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:'.7rem' }}>
                    {l.chips.map(c => <span key={c} style={{ background:'#f7f9f7', borderRadius:5, padding:'2px 7px', fontSize:'.68rem', color:'#555' }}>{c}</span>)}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:700, color:'#0F6E56' }}>₹{l.price.toLocaleString()}<span style={{ fontSize:'.7rem', fontWeight:400, color:'#999' }}>/mo</span></div>
                    <span style={{ background:'#FAEEDA', color:'#BA7517', fontSize:'.63rem', fontWeight:700, padding:'2px 7px', borderRadius:4 }}>0 Brokerage</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section style={{ padding:'3.5rem 1.5rem', background:'#f7f9f7' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'1.5px', color:'#0F6E56', textTransform:'uppercase', marginBottom:4 }}>Why RentNestle</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:700, letterSpacing:'-.8px', marginBottom:4 }}>The Smarter Way to Rent</h2>
          <p style={{ fontSize:'.95rem', color:'#555', marginBottom:'2rem' }}>Built for India. Powered by AI.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:'1.1rem' }}>
            {[
              { icon:'🛡️', title:'Zero Brokerage',     desc:"Save one month's rent on every deal. No broker fees — ever." },
              { icon:'📄', title:'Digital Agreements',  desc:'Aadhaar e-sign + digital stamp. Legally valid in under 24 hours.' },
              { icon:'✅', title:'Tenant Verification', desc:'Aadhaar KYC, PAN check, and state-specific police verification.' },
              { icon:'🤖', title:'AI-Powered Listings', desc:'Auto descriptions, photo enhancement, WhatsApp AI assistant.' },
              { icon:'🗺️', title:'Street View',         desc:'See the actual street before visiting. Loaded on-demand.' },
              { icon:'🧾', title:'Auto HRA Receipts',   desc:'Tax-ready receipts sent monthly. Zero effort at filing time.' },
            ].map(f => (
              <div key={f.title}
                style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e4e0', padding:'1.4rem', transition:'box-shadow .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow='0 3px 16px rgba(0,0,0,.07)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow='none'}>
                <div style={{ width:40, height:40, borderRadius:9, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'.9rem', fontSize:'1.1rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily:'Georgia,serif', fontSize:'.92rem', fontWeight:700, marginBottom:'.35rem' }}>{f.title}</h3>
                <p style={{ fontSize:'.82rem', color:'#555', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ padding:'3.5rem 1.5rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'1.5px', color:'#0F6E56', textTransform:'uppercase', marginBottom:4 }}>Process</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:700, letterSpacing:'-.8px', marginBottom:4 }}>How It Works</h2>
          <p style={{ fontSize:'.95rem', color:'#555', marginBottom:'2rem' }}>From search to signed agreement in under 24 hours.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'1.25rem' }}>
            {[
              { n:'1', title:'Register with Phone', desc:'OTP-based sign-up. No email needed. Takes 30 seconds.' },
              { n:'2', title:'Browse & Connect',    desc:'Search verified listings, view street view, connect directly with owners.' },
              { n:'3', title:'Verify Identity',     desc:'Aadhaar KYC in minutes. Police verification by state automatically.' },
              { n:'4', title:'Sign & Move In',      desc:'e-Stamp + Aadhaar e-sign. Agreement emailed to both parties instantly.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign:'center', padding:'1.4rem 1rem' }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'#0F6E56', color:'#fff', fontSize:'1rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto .9rem', fontFamily:'Georgia,serif' }}>{s.n}</div>
                <h3 style={{ fontFamily:'Georgia,serif', fontSize:'.92rem', fontWeight:700, marginBottom:'.35rem' }}>{s.title}</h3>
                <p style={{ fontSize:'.82rem', color:'#555', lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ─────────────────────────────────────────── */}
      <section id="plans" style={{ padding:'3.5rem 1.5rem', background:'#f7f9f7' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'1.5px', color:'#0F6E56', textTransform:'uppercase', marginBottom:4 }}>Pricing</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:700, letterSpacing:'-.8px', marginBottom:4 }}>Simple, Transparent Plans</h2>
          <p style={{ fontSize:'.95rem', color:'#555', marginBottom:'2rem' }}>Choose what works. Upgrade anytime.</p>
          <div className="plans-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
            {[
              { title:'🏠 For Tenants', plans:[
                { name:'Explorer',       desc:'3 contacts/day · Basic',           price:null },
                { name:'Verified Pro',   desc:'Unlimited · e-Sign · HRA',         price:499,  pop:'Most Popular' },
                { name:'Assurance Gold', desc:'Early access · Police verify',      price:1299 },
              ]},
              { title:'🔑 For Owners', plans:[
                { name:'Starter',       desc:'5 inquiries · DIY draft',           price:null },
                { name:'Speed Pro',     desc:'Unlimited · e-Sign · WA AI',        price:999,  pop:'Best Value' },
                { name:'Managed Gold',  desc:'Featured · Full BG · Concierge',    price:2999 },
              ]},
            ].map(section => (
              <div key={section.title}>
                <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:700, marginBottom:'.9rem', paddingBottom:'.45rem', borderBottom:'2px solid #E1F5EE' }}>{section.title}</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                  {section.plans.map(p => (
                    <div key={p.name} onClick={() => openModal('tenant')}
                      style={{ background:'#fff', border:`1px solid ${p.pop ? '#0F6E56' : '#e0e4e0'}`, borderRadius:12, padding:'.9rem 1.1rem', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', position:'relative', transition:'border-color .2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor='#0F6E56'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor= p.pop ? '#0F6E56' : '#e0e4e0'}>
                      {p.pop && <span style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', background:'#0F6E56', color:'#fff', fontSize:'.63rem', fontWeight:700, padding:'2px 10px', borderRadius:8, whiteSpace:'nowrap' }}>{p.pop}</span>}
                      <div>
                        <div style={{ fontWeight:600, fontSize:'.88rem' }}>{p.name}</div>
                        <div style={{ fontSize:'.72rem', color:'#999', marginTop:2 }}>{p.desc}</div>
                      </div>
                      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', fontWeight:700, color: p.price ? '#0F6E56' : '#999' }}>
                        {p.price ? `₹${p.price}` : 'Free'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section style={{ padding:'3.5rem 1.5rem' }}>
        <div style={{ maxWidth:780, margin:'0 auto', background:'#0F6E56', color:'#fff', borderRadius:20, padding:'2.5rem 2rem', textAlign:'center' }}>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:700, letterSpacing:'-.5px', marginBottom:'.7rem' }}>Ready to Find Your Next Home?</h2>
          <p style={{ fontSize:'.95rem', opacity:.85, marginBottom:'1.5rem' }}>Join 50,000+ users who rent smarter. Zero brokerage. Fully digital.</p>
          <div style={{ display:'flex', gap:'.7rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => openModal('tenant')} style={{ background:'#fff', color:'#0F6E56', border:'none', padding:'.65rem 1.4rem', borderRadius:9, fontWeight:700, fontSize:'.88rem', cursor:'pointer' }}>
              Get Started Free
            </button>
            <button onClick={() => openModal('owner')} style={{ background:'transparent', color:'#fff', border:'1.5px solid rgba(255,255,255,.5)', padding:'.65rem 1.4rem', borderRadius:9, fontWeight:600, fontSize:'.88rem', cursor:'pointer' }}>
              List Your Property
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background:'#f7f9f7', borderTop:'1px solid #e0e4e0', padding:'2.5rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'2rem', marginBottom:'1.75rem' }}>
            <div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:700, color:'#0F6E56' }}>Rent<span style={{ color:'#1a1a1a' }}>Nestle</span></div>
              <p style={{ fontSize:'.82rem', color:'#555', marginTop:'.45rem', lineHeight:1.6, maxWidth:210 }}>India's AI-powered rental portal. Zero brokerage, fully digital, legally compliant.</p>
            </div>
            {[
              { h:'Tenants',  links:['Search Homes','Tenant Plans','Agreements','HRA Receipts'] },
              { h:'Owners',   links:['List Property','Owner Plans','Tenant Screening','WhatsApp AI'] },
              { h:'Company',  links:['About Us','Privacy Policy','Terms','Contact'] },
            ].map(col => (
              <div key={col.h}>
                <h4 style={{ fontFamily:'Georgia,serif', fontSize:'.82rem', fontWeight:700, marginBottom:'.65rem' }}>{col.h}</h4>
                {col.links.map(l => <a key={l} href="#" style={{ display:'block', fontSize:'.78rem', color:'#555', textDecoration:'none', marginBottom:'.35rem' }}>{l}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid #e0e4e0', paddingTop:'.9rem', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem' }}>
            <p style={{ fontSize:'.75rem', color:'#999' }}>© 2025 RentNestle. All rights reserved.</p>
            <p style={{ fontSize:'.75rem', color:'#999' }}>Chennai · Bengaluru · Mumbai · Delhi</p>
          </div>
        </div>
      </footer>

      {/* ── BOTTOM NAV (mobile) ───────────────────────────── */}
      <div className="bottom-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #e0e4e0', padding:'.45rem 0 .2rem', zIndex:90, justifyContent:'space-around' }}>
        {[['🏠','Home','/'],['🔍','Search','/search'],['➕','List','/list-property'],['📄','Deals','#'],['👤','Account','#']].map(([ic,lb,hr]) => (
          <div key={lb} onClick={() => lb === 'Account' ? openModal() : router.push(hr as string)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, fontSize:'.62rem', fontWeight:500, color: lb==='Home' ? '#0F6E56' : '#999', cursor:'pointer', padding:'.15rem .5rem' }}>
            <span style={{ fontSize:'1.1rem' }}>{ic}</span>{lb}
          </div>
        ))}
      </div>

      {/* ── OTP MODAL ─────────────────────────────────────── */}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:0 }}>
          <div style={{ background:'#fff', borderRadius:'22px 22px 0 0', padding:'2rem 1.75rem 2.5rem', width:'100%', maxWidth:400, animation:'slideUp .3s ease' }}>
            {/* Handle */}
            <div style={{ width:36, height:4, background:'#e0e4e0', borderRadius:2, margin:'0 auto 1.25rem' }} />
            <button onClick={() => setModalOpen(false)} style={{ position:'absolute', top:'1.2rem', right:'1.2rem', background:'#f7f9f7', border:'none', width:30, height:30, borderRadius:'50%', cursor:'pointer', fontSize:'.85rem', display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>✕</button>

            {/* Step dots */}
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:'1.5rem' }}>
              {stepDots.map((s,i) => (
                <div key={s} style={{ height:7, borderRadius:4, transition:'all .3s', width: step===s ? 22 : 7, background: step===s ? '#0F6E56' : stepDots.indexOf(step) > i ? '#9FE1CB' : '#e0e4e0' }} />
              ))}
            </div>

            {/* PHONE STEP */}
            {step === 'phone' && <>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', marginBottom:'.25rem' }}>Welcome 👋</h2>
              <p style={{ fontSize:'.83rem', color:'#555', marginBottom:'1.25rem' }}>Sign in or register in 30 seconds — no password needed.</p>
              <div style={{ display:'flex', gap:6, background:'#f7f9f7', borderRadius:10, padding:4, marginBottom:'1.25rem' }}>
                {(['tenant','owner'] as Role[]).map(r => (
                  <button key={r} onClick={() => setRole(r)} style={{ flex:1, padding:'8px', border:'none', borderRadius:8, background: role===r ? '#fff' : 'transparent', color: role===r ? '#0F6E56' : '#555', fontWeight:600, fontSize:'.83rem', cursor:'pointer', boxShadow: role===r ? '0 1px 6px rgba(0,0,0,.08)' : 'none', transition:'all .2s' }}>
                    {r === 'tenant' ? '🏠 Tenant' : '🔑 Owner'}
                  </button>
                ))}
              </div>
              <label style={S.label}>Mobile Number</label>
              <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                <select value={cc} onChange={e => setCc(e.target.value)} style={{ background:'#f7f9f7', border:'1.5px solid #e0e4e0', borderRadius:10, padding:'10px 6px', fontSize:'.85rem', width:76 }}>
                  {['+91','+1','+44','+971'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} onKeyDown={e => e.key==='Enter' && sendOtp()} placeholder="98765 43210" style={S.input} />
              </div>
              <p style={{ fontSize:'.73rem', color:'#999', marginBottom:'1rem' }}>We'll send a one-time password to verify your number.</p>
              <button onClick={sendOtp} disabled={phone.length < 10} style={{ width:'100%', background: phone.length===10 ? '#0F6E56' : '#e0e4e0', color:'#fff', border:'none', padding:'12px', borderRadius:12, fontWeight:700, fontSize:'.95rem', cursor: phone.length===10 ? 'pointer' : 'not-allowed', transition:'background .2s' }}>
                Send OTP →
              </button>
              {isTestMode && <div style={{ fontSize:'.72rem', color:'#888', textAlign:'center', marginTop:'.75rem', background:'#FAEEDA', borderRadius:8, padding:'8px 12px' }}>⚠️ <strong style={{ color:'#BA7517' }}>Test Mode</strong> — Any number works. OTP = <strong style={{ color:'#BA7517' }}>1234</strong></div>}
            </>}

            {/* OTP STEP */}
            {step === 'otp' && <>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', marginBottom:'.25rem' }}>Enter OTP 🔐</h2>
              <p style={{ fontSize:'.83rem', color:'#555', marginBottom:'1.25rem' }}>
                Sent to {cc} {phone}
                <button onClick={() => setStep('phone')} style={{ background:'none', border:'none', color:'#0F6E56', cursor:'pointer', fontSize:'.78rem', marginLeft:8, fontWeight:600 }}>Change</button>
              </p>
              <label style={S.label}>One-Time Password</label>
              <div style={{ display:'flex', gap:10, marginBottom:'1rem' }}>
                {otp.map((d,i) => (
                  <input key={i} ref={otpRefs[i]} type="tel" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpBack(i, e)}
                    style={{ flex:1, textAlign:'center', background: otpErr ? '#fcebeb' : d ? '#E1F5EE' : '#f7f9f7', border:`1.5px solid ${otpErr ? '#e24b4a' : d ? '#1D9E75' : '#e0e4e0'}`, borderRadius:12, padding:'12px 4px', fontSize:'1.4rem', fontWeight:700, fontFamily:'Georgia,serif', outline:'none', transition:'all .2s' }} />
                ))}
              </div>
              <button onClick={verifyOtp} disabled={otp.join('').length < 4} style={{ width:'100%', background: otp.join('').length===4 ? '#0F6E56' : '#e0e4e0', color:'#fff', border:'none', padding:'12px', borderRadius:12, fontWeight:700, fontSize:'.95rem', cursor: otp.join('').length===4 ? 'pointer' : 'not-allowed' }}>
                Verify & Continue →
              </button>
              <div style={{ textAlign:'center', marginTop:10 }}>
                <button onClick={sendOtp} style={{ background:'none', border:'none', color:'#0F6E56', fontSize:'.78rem', fontWeight:600, cursor:'pointer' }}>Resend OTP</button>
              </div>
              {isTestMode && <div style={{ fontSize:'.72rem', color:'#888', textAlign:'center', marginTop:'.75rem', background:'#FAEEDA', borderRadius:8, padding:'8px 12px' }}>⚠️ <strong style={{ color:'#BA7517' }}>Test OTP:</strong> Enter <strong style={{ color:'#BA7517' }}>1 2 3 4</strong></div>}
            </>}

            {/* SUCCESS */}
            {step === 'success' && (
              <div style={{ textAlign:'center', padding:'1rem 0' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', fontSize:'1.8rem' }}>✅</div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', marginBottom:'.4rem' }}>You're In!</h2>
                <div style={{ display:'inline-block', background:'#0F6E56', color:'#fff', fontSize:'.78rem', fontWeight:700, padding:'6px 16px', borderRadius:20, margin:'.5rem 0 .75rem' }}>
                  {role === 'tenant' ? '🏠 Tenant Account' : '🔑 Owner Account'}
                </div>
                <p style={{ fontSize:'.85rem', color:'#555' }}>Redirecting to your dashboard...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(226,75,74,.3)} 50%{box-shadow:0 0 0 8px rgba(226,75,74,0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </>
  )
}
