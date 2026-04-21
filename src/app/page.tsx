'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type VoiceLang = 'en-IN' | 'ta-IN' | 'hi-IN' | 'te-IN' | 'kn-IN'
type ModalStep = 'phone' | 'otp' | 'success'
type Role = 'tenant' | 'owner'

const VOICE_LANGS = [
  { code: 'en-IN' as VoiceLang, label: 'English', flag: '🇬🇧' },
  { code: 'ta-IN' as VoiceLang, label: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'hi-IN' as VoiceLang, label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'te-IN' as VoiceLang, label: 'తెలుగు',  flag: '🇮🇳' },
  { code: 'kn-IN' as VoiceLang, label: 'ಕನ್ನಡ',   flag: '🇮🇳' },
]

const LISTINGS = [
  { id:1, title:'Spacious 2BHK with Balcony',  loc:'Nungambakkam, Chennai',  type:'2 BHK', price:18000, chips:['Family','Semi-Furn','2 Bath'], verified:true,  g:'linear-gradient(135deg,#9FE1CB,#0F6E56)', icon:'🏠' },
  { id:2, title:'Modern Studio near Metro',    loc:'Koramangala, Bengaluru', type:'1 BHK', price:12500, chips:['Bachelors','Furnished','AC'],   verified:false, g:'linear-gradient(135deg,#B5D4F4,#185FA5)', icon:'🏢' },
  { id:3, title:'Premium 3BHK with Parking',   loc:'Andheri West, Mumbai',   type:'3 BHK', price:45000, chips:['Family','Fully Furn','3 Bath'], verified:true,  g:'linear-gradient(135deg,#FAC775,#BA7517)', icon:'🏡', ai:true },
  { id:4, title:'PG for Working Professionals', loc:'Sector 15, Gurgaon',    type:'PG',    price:7500,  chips:['Veg Only','WiFi','Meals'],       verified:true,  g:'linear-gradient(135deg,#F4C0D1,#993556)', icon:'🛏️' },
]

const SEARCH_EXAMPLES = [
  '3 BHK Anna Nagar, Chennai',
  '2 BHK Koramangala, Bengaluru',
  'PG Andheri, Mumbai',
  '1 BHK Banjara Hills, Hyderabad',
]

export default function HomePage() {
  const router = useRouter()

  // search
  const [searchVal,   setSearchVal]   = useState('')
  const [propType,    setPropType]    = useState('2 BHK')
  const [budget,      setBudget]      = useState('Any Budget')
  const [activeCity,  setActiveCity]  = useState('All India')
  const [placeholder, setPlaceholder] = useState(SEARCH_EXAMPLES[0])

  // voice
  const [listening,   setListening]   = useState(false)
  const [selLang,     setSelLang]     = useState<VoiceLang>('en-IN')
  const [langPopOpen, setLangPopOpen] = useState(false)
  const recognitionRef                = useRef<any>(null)
  const micRef                        = useRef<HTMLDivElement>(null)

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [role,      setRole]      = useState<Role>('tenant')
  const [step,      setStep]      = useState<ModalStep>('phone')
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [otp,       setOtp]       = useState(['', '', '', ''])
  const [otpErr,    setOtpErr]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Rotate search placeholder every 3 seconds
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i = (i + 1) % SEARCH_EXAMPLES.length
      setPlaceholder(SEARCH_EXAMPLES[i])
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Close language popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (micRef.current && !micRef.current.contains(e.target as Node)) {
        setLangPopOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Voice Search ────────────────────────────────────────
  const pickLang = (lang: VoiceLang) => {
    setSelLang(lang)
    setLangPopOpen(false)
    startListening(lang)
  }

  const startListening = (lang: VoiceLang) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice search requires Chrome browser'); return }
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = false
    setListening(true)
    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('')
      setSearchVal(t)
    }
    rec.onend  = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  // ── OTP Modal ───────────────────────────────────────────
  const openModal = (r: Role = 'tenant') => {
    setRole(r)
    setStep('phone')
    setName('')
    setPhone('')
    setOtp(['', '', '', ''])
    setOtpErr(false)
    setLoading(false)
    setModalOpen(true)
  }

  const sendOtp = async () => {
    if (phone.length !== 10 || !name.trim()) return
    setLoading(true)
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role, name }),
      })
    } catch {}
    setLoading(false)
    setStep('otp')
    setTimeout(() => otpRefs[0].current?.focus(), 150)
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const n = [...otp]
    n[i] = v
    setOtp(n)
    setOtpErr(false)
    if (v && i < 3) otpRefs[i + 1].current?.focus()
  }

  const handleOtpBack = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const n = [...otp]
      n[i - 1] = ''
      setOtp(n)
      otpRefs[i - 1].current?.focus()
    }
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 4) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code, role, name }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setOtpErr(true)
        setLoading(false)
        setTimeout(() => {
          setOtp(['', '', '', ''])
          setOtpErr(false)
          otpRefs[0].current?.focus()
        }, 700)
        return
      }

      // Save session to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('rn_user_name',  data.name || name)
        localStorage.setItem('rn_user_phone', phone)
        localStorage.setItem('rn_user_role',  data.role || role)
        localStorage.setItem('rn_user_id',    data.userId || '')
        if (data.accessToken) {
          localStorage.setItem('rn_access_token',  data.accessToken)
          localStorage.setItem('rn_refresh_token', data.refreshToken || '')
        }
      }

      setLoading(false)
      setStep('success')
      setTimeout(() => {
        setModalOpen(false)
        router.push(role === 'owner' ? '/dashboard/owner' : '/search')
      }, 1500)

    } catch {
      setLoading(false)
      setOtpErr(true)
      setTimeout(() => {
        setOtp(['', '', '', ''])
        setOtpErr(false)
        otpRefs[0].current?.focus()
      }, 700)
    }
  }

  const stepDots: ModalStep[] = ['phone', 'otp', 'success']
  const cities = ['All India', 'Chennai', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune']

  const inp: React.CSSProperties = {
    width: '100%',
    background: '#f7f9f7',
    border: '1.5px solid #e0e4e0',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#1a1a1a',
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(150deg,#eef8f4 0%,#fff 65%)', padding: '3.5rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '3rem', alignItems: 'center' }}>

            {/* LEFT CONTENT */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E1F5EE', color: '#0F6E56', fontSize: '.75rem', fontWeight: 700, padding: '.3rem .8rem', borderRadius: 20, marginBottom: '1rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }} />
                Zero Brokerage · 100% Digital
              </div>

              <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2rem,4.5vw,3.2rem)', fontWeight: 700, lineHeight: 1.12, letterSpacing: -1, marginBottom: '1rem' }}>
                Find Your<br />
                <span style={{ color: '#0F6E56' }}>Perfect Rental</span><br />
                No Broker. No Drama.
              </h1>

              <p style={{ fontSize: '1rem', color: '#555', lineHeight: 1.7, maxWidth: 460, marginBottom: '2rem', fontWeight: 300 }}>
                AI-powered rental portal with digital agreements, police verification, and zero brokerage fees across India.
              </p>

              {/* SEARCH BOX */}
              <div style={{ background: '#fff', border: '1.5px solid #e0e4e0', borderRadius: 14, padding: '.7rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>

                {/* Text input */}
                <div style={{ flex: 2, minWidth: 160, display: 'flex', alignItems: 'center', gap: 8, background: '#f7f9f7', borderRadius: 9, padding: '8px 12px' }}>
                  <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <input
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && router.push(`/search?q=${encodeURIComponent(searchVal)}&type=${propType}&budget=${budget}`)}
                    placeholder={placeholder}
                    style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.85rem', color: '#1a1a1a', outline: 'none', width: '100%' }}
                  />
                </div>

                {/* Property type */}
                <div style={{ flex: 1, minWidth: 110, background: '#f7f9f7', borderRadius: 9, padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <select value={propType} onChange={e => setPropType(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.83rem', color: '#1a1a1a', outline: 'none', width: '100%', cursor: 'pointer' }}>
                    {['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio', 'PG / Room', 'Commercial'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Budget */}
                <div style={{ flex: 1, minWidth: 120, background: '#f7f9f7', borderRadius: 9, padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <select value={budget} onChange={e => setBudget(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.83rem', color: '#1a1a1a', outline: 'none', width: '100%', cursor: 'pointer' }}>
                    {['Any Budget', 'Under ₹10k', '₹10k–20k', '₹20k–40k', '₹40k+'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>

                {/* Mic button */}
                <div ref={micRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => listening ? stopListening() : setLangPopOpen(p => !p)}
                    title="Voice Search"
                    style={{ width: 38, height: 38, borderRadius: '50%', border: `1.5px solid ${listening ? '#e24b4a' : '#e0e4e0'}`, background: listening ? '#fcebeb' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: listening ? 'mic-pulse 1s infinite' : 'none' }}>
                    <svg width="16" height="16" fill="none" stroke={listening ? '#e24b4a' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="2" width="6" height="12" rx="3" />
                      <path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6" />
                    </svg>
                  </button>

                  {/* Language popup */}
                  {langPopOpen && (
                    <div style={{ position: 'absolute', top: 46, right: 0, background: '#fff', border: '1px solid #e0e4e0', borderRadius: 10, padding: '.35rem', minWidth: 145, zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}>
                      {VOICE_LANGS.map(l => (
                        <div key={l.code} onClick={() => pickLang(l.code)}
                          style={{ padding: '8px 12px', borderRadius: 7, fontSize: '.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, background: selLang === l.code ? '#E1F5EE' : 'transparent', color: selLang === l.code ? '#0F6E56' : '#1a1a1a' }}>
                          {l.flag} {l.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search button */}
                <button
                  onClick={() => router.push(`/search?q=${encodeURIComponent(searchVal)}&type=${propType}&budget=${budget}`)}
                  style={{ background: '#0F6E56', color: '#fff', border: 'none', padding: '.58rem 1.3rem', borderRadius: 9, fontWeight: 700, fontSize: '.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Search
                </button>
              </div>

              {/* Voice listening status */}
              {listening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '.8rem', color: '#555', background: '#f7f9f7', borderRadius: 8, padding: '6px 12px', width: 'fit-content' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e24b4a', display: 'inline-block', animation: 'blink .7s infinite' }} />
                  Listening in {VOICE_LANGS.find(l => l.code === selLang)?.label}...
                  <button onClick={stopListening} style={{ background: 'none', border: 'none', color: '#e24b4a', fontSize: '.75rem', cursor: 'pointer', marginLeft: 4 }}>Stop</button>
                </div>
              )}

              {/* Search example chips */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '.75rem', color: '#999' }}>Try:</span>
                {SEARCH_EXAMPLES.slice(0, 3).map(ex => (
                  <span key={ex} onClick={() => setSearchVal(ex)}
                    style={{ fontSize: '.75rem', color: '#0F6E56', background: '#E1F5EE', padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontWeight: 500 }}>
                    {ex}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                {[['12,400+', 'Active Listings'], ['₹0', 'Brokerage'], ['24h', 'Agreement']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', fontWeight: 700 }}>{v}</div>
                    <div style={{ fontSize: '.75rem', color: '#999' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PHONE MOCKUP */}
            <div className="hero-phone" style={{ maxWidth: 260, margin: '0 auto' }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e0e4e0', padding: '1rem', boxShadow: '0 6px 32px rgba(0,0,0,.08)' }}>
                <div style={{ width: 50, height: 4, background: '#e0e4e0', borderRadius: 3, margin: '0 auto .75rem' }} />
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e4e0' }}>
                  <div style={{ height: 130, background: 'linear-gradient(135deg,#9FE1CB,#0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#fff', color: '#0F6E56', fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>2 BHK</span>
                    <span style={{ position: 'absolute', top: 8, right: 8, background: '#0F6E56', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>✓ Verified</span>
                    🏠
                  </div>
                  <div style={{ padding: '.7rem' }}>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: '.88rem', fontWeight: 700 }}>Spacious 2BHK Flat</div>
                    <div style={{ fontSize: '.72rem', color: '#999', margin: '.2rem 0 .5rem' }}>📍 Anna Salai, Chennai</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#0F6E56' }}>₹18,000/mo</div>
                      <span style={{ background: '#E1F5EE', color: '#0F6E56', fontSize: '.62rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>Family</span>
                    </div>
                    <div style={{ background: '#FAEEDA', color: '#BA7517', fontSize: '.68rem', fontWeight: 700, padding: '4px 8px', borderRadius: 6, marginTop: 6, display: 'inline-block' }}>🎉 Zero Brokerage</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LISTINGS ──────────────────────────────────────── */}
      <section style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '1.5px', color: '#0F6E56', textTransform: 'uppercase', marginBottom: 4 }}>Featured</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, letterSpacing: '-.8px', marginBottom: 4 }}>Latest Listings</h2>
          <p style={{ fontSize: '.95rem', color: '#555', marginBottom: '1.25rem' }}>Verified properties. No hidden charges.</p>

          {/* City filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            {cities.map(c => (
              <span key={c}
                onClick={() => { setActiveCity(c); router.push(`/search?city=${encodeURIComponent(c)}`) }}
                style={{ background: activeCity === c ? '#0F6E56' : '#f7f9f7', color: activeCity === c ? '#fff' : '#555', border: `1px solid ${activeCity === c ? '#0F6E56' : '#e0e4e0'}`, borderRadius: 20, padding: '.35rem .9rem', fontSize: '.82rem', fontWeight: 500, cursor: 'pointer', transition: 'all .2s' }}>
                {c}
              </span>
            ))}
          </div>

          {/* Listing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.2rem' }}>
            {LISTINGS.map(l => (
              <div key={l.id}
                onClick={() => router.push(`/property/${l.id}`)}
                style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0e4e0', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .2s,transform .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,.09)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}>
                <div style={{ height: 160, background: l.g, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 9, left: 9, background: '#fff', color: '#0F6E56', fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>{l.type}</span>
                  {l.verified && <span style={{ position: 'absolute', top: 9, right: 9, background: '#0F6E56', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>{(l as any).ai ? 'AI Enhanced' : '✓ Verified'}</span>}
                  {l.icon}
                </div>
                <div style={{ padding: '.9rem' }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '.92rem', fontWeight: 700, marginBottom: 2 }}>{l.title}</div>
                  <div style={{ fontSize: '.75rem', color: '#999', marginBottom: '.55rem' }}>📍 {l.loc}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '.7rem' }}>
                    {l.chips.map(c => <span key={c} style={{ background: '#f7f9f7', borderRadius: 5, padding: '2px 7px', fontSize: '.68rem', color: '#555' }}>{c}</span>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#0F6E56' }}>₹{l.price.toLocaleString()}<span style={{ fontSize: '.7rem', fontWeight: 400, color: '#999' }}>/mo</span></div>
                    <span style={{ background: '#FAEEDA', color: '#BA7517', fontSize: '.63rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>0 Brokerage</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section style={{ padding: '3.5rem 1.5rem', background: '#f7f9f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '1.5px', color: '#0F6E56', textTransform: 'uppercase', marginBottom: 4 }}>Why RentNestle</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, letterSpacing: '-.8px', marginBottom: 4 }}>The Smarter Way to Rent</h2>
          <p style={{ fontSize: '.95rem', color: '#555', marginBottom: '2rem' }}>Built for India. Powered by AI.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '1.1rem' }}>
            {[
              { icon: '🛡️', title: 'Zero Brokerage',     desc: "Save one month's rent. No broker fees — ever." },
              { icon: '📄', title: 'Digital Agreements',  desc: 'Aadhaar e-sign + digital stamp. Legally valid in 24 hours.' },
              { icon: '✅', title: 'Tenant Verification', desc: 'Aadhaar KYC, PAN, and state-specific police verification.' },
              { icon: '🤖', title: 'AI-Powered Listings', desc: 'Auto descriptions, photo enhancement, WhatsApp AI.' },
              { icon: '🗺️', title: 'Street View',         desc: 'See the actual street before visiting. On-demand.' },
              { icon: '🧾', title: 'Auto HRA Receipts',   desc: 'Tax-ready receipts sent monthly. Zero effort.' },
            ].map(f => (
              <div key={f.title}
                style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0e4e0', padding: '1.4rem', transition: 'box-shadow .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 3px 16px rgba(0,0,0,.07)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.9rem', fontSize: '1.1rem' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '.92rem', fontWeight: 700, marginBottom: '.35rem' }}>{f.title}</h3>
                <p style={{ fontSize: '.82rem', color: '#555', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '1.5px', color: '#0F6E56', textTransform: 'uppercase', marginBottom: 4 }}>Process</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, letterSpacing: '-.8px', marginBottom: 4 }}>How It Works</h2>
          <p style={{ fontSize: '.95rem', color: '#555', marginBottom: '2rem' }}>From search to signed agreement in under 24 hours.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1.25rem' }}>
            {[
              { n: '1', title: 'Register with Phone', desc: 'OTP-based sign-up. No email needed. Takes 30 seconds.' },
              { n: '2', title: 'Browse & Connect',    desc: 'Search verified listings, view street view, connect directly.' },
              { n: '3', title: 'Verify Identity',     desc: 'Aadhaar KYC in minutes. Police verification by state.' },
              { n: '4', title: 'Sign & Move In',      desc: 'e-Stamp + Aadhaar e-sign. Agreement emailed instantly.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center', padding: '1.4rem 1rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0F6E56', color: '#fff', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .9rem', fontFamily: 'Georgia,serif' }}>{s.n}</div>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '.92rem', fontWeight: 700, marginBottom: '.35rem' }}>{s.title}</h3>
                <p style={{ fontSize: '.82rem', color: '#555', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ─────────────────────────────────────────── */}
      <section id="plans" style={{ padding: '3.5rem 1.5rem', background: '#f7f9f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '1.5px', color: '#0F6E56', textTransform: 'uppercase', marginBottom: 4 }}>Pricing</div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, letterSpacing: '-.8px', marginBottom: 4 }}>Simple, Transparent Plans</h2>
          <p style={{ fontSize: '.95rem', color: '#555', marginBottom: '2rem' }}>Choose what works. Upgrade anytime.</p>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {[
              { title: '🏠 For Tenants', plans: [
                { name: 'Explorer',       desc: '3 contacts/day · Basic',        price: null },
                { name: 'Verified Pro',   desc: 'Unlimited · e-Sign · HRA',      price: 499,  pop: 'Most Popular' },
                { name: 'Assurance Gold', desc: 'Early access · Police verify',   price: 1299 },
              ]},
              { title: '🔑 For Owners', plans: [
                { name: 'Starter',       desc: '5 inquiries · DIY draft',        price: null },
                { name: 'Speed Pro',     desc: 'Unlimited · e-Sign · WA AI',     price: 999,  pop: 'Best Value' },
                { name: 'Managed Gold',  desc: 'Featured · Full BG · Concierge', price: 2999 },
              ]},
            ].map(section => (
              <div key={section.title}>
                <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, marginBottom: '.9rem', paddingBottom: '.45rem', borderBottom: '2px solid #E1F5EE' }}>{section.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                  {section.plans.map(p => (
                    <div key={p.name} onClick={() => openModal('tenant')}
                      style={{ background: '#fff', border: `1px solid ${p.pop ? '#0F6E56' : '#e0e4e0'}`, borderRadius: 12, padding: '.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', position: 'relative', transition: 'border-color .2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#0F6E56'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = p.pop ? '#0F6E56' : '#e0e4e0'}>
                      {p.pop && <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: '#0F6E56', color: '#fff', fontSize: '.63rem', fontWeight: 700, padding: '2px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>{p.pop}</span>}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{p.name}</div>
                        <div style={{ fontSize: '.72rem', color: '#999', marginTop: 2 }}>{p.desc}</div>
                      </div>
                      <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.05rem', fontWeight: 700, color: p.price ? '#0F6E56' : '#999' }}>
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
      <section style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', background: '#0F6E56', color: '#fff', borderRadius: 20, padding: '2.5rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, letterSpacing: '-.5px', marginBottom: '.7rem' }}>Ready to Find Your Next Home?</h2>
          <p style={{ fontSize: '.95rem', opacity: .85, marginBottom: '1.5rem' }}>Join 50,000+ users who rent smarter. Zero brokerage. Fully digital.</p>
          <div style={{ display: 'flex', gap: '.7rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => openModal('tenant')} style={{ background: '#fff', color: '#0F6E56', border: 'none', padding: '.65rem 1.4rem', borderRadius: 9, fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>Get Started Free</button>
            <button onClick={() => openModal('owner')} style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,.5)', padding: '.65rem 1.4rem', borderRadius: 9, fontWeight: 600, fontSize: '.88rem', cursor: 'pointer' }}>List Your Property</button>
          </div>
        </div>
      </section>

      {/* ── BOTTOM NAV (mobile only) ──────────────────────── */}
      <div className="bottom-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0e4e0', padding: '.45rem 0 .2rem', zIndex: 90, justifyContent: 'space-around' }}>
        {[['🏠','Home','/'],['🔍','Search','/search'],['➕','List','/list-property'],['📄','Deals','#'],['👤','Account','#']].map(([ic,lb,hr]) => (
          <div key={lb}
            onClick={() => lb === 'Account' ? openModal() : router.push(hr as string)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: '.62rem', fontWeight: 500, color: lb === 'Home' ? '#0F6E56' : '#999', cursor: 'pointer', padding: '.15rem .5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{ic}</span>{lb}
          </div>
        ))}
      </div>

      {/* ── OTP MODAL ─────────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '2rem 1.75rem 2.5rem', width: '100%', maxWidth: 420, animation: 'slideUp .3s ease', position: 'relative' }}>

            {/* Drag handle */}
            <div style={{ width: 36, height: 4, background: '#e0e4e0', borderRadius: 2, margin: '0 auto 1.25rem' }} />

            {/* Close button */}
            <button onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: '#f7f9f7', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: '.85rem', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>

            {/* Step progress dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' }}>
              {stepDots.map((s, i) => (
                <div key={s} style={{ height: 7, borderRadius: 4, transition: 'all .3s', width: step === s ? 22 : 7, background: step === s ? '#0F6E56' : stepDots.indexOf(step) > i ? '#9FE1CB' : '#e0e4e0' }} />
              ))}
            </div>

            {/* ── STEP 1: PHONE ─────────────────────────── */}
            {step === 'phone' && (
              <>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.25rem' }}>Welcome to RentNestle 👋</h2>
                <p style={{ fontSize: '.83rem', color: '#555', marginBottom: '1.25rem' }}>Sign in or create your account in 30 seconds.</p>

                {/* Tenant / Owner tabs */}
                <div style={{ display: 'flex', gap: 6, background: '#f7f9f7', borderRadius: 10, padding: 4, marginBottom: '1.25rem' }}>
                  {(['tenant', 'owner'] as Role[]).map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: role === r ? '#fff' : 'transparent', color: role === r ? '#0F6E56' : '#555', fontWeight: 600, fontSize: '.83rem', cursor: 'pointer', boxShadow: role === r ? '0 1px 6px rgba(0,0,0,.08)' : 'none', transition: 'all .2s' }}>
                      {r === 'tenant' ? "🏠 I'm a Tenant" : "🔑 I'm an Owner"}
                    </button>
                  ))}
                </div>

                {/* Name field */}
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 5 }}>Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{ ...inp, marginBottom: '1rem' }}
                />

                {/* Phone — India only (+91 fixed) */}
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 5 }}>Mobile Number</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <div style={{ background: '#f7f9f7', border: '1.5px solid #e0e4e0', borderRadius: 10, padding: '10px 12px', fontSize: '.9rem', color: '#333', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="98765 43210"
                    style={{ ...inp, marginBottom: 0 }}
                  />
                </div>
                <p style={{ fontSize: '.73rem', color: '#999', marginBottom: '1rem' }}>We'll send a one-time password to verify your number.</p>

                <button
                  onClick={sendOtp}
                  disabled={phone.length < 10 || !name.trim() || loading}
                  style={{ width: '100%', background: (phone.length === 10 && name.trim()) ? '#0F6E56' : '#e0e4e0', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: (phone.length === 10 && name.trim()) ? 'pointer' : 'not-allowed', transition: 'background .2s' }}>
                  {loading ? 'Sending...' : 'Send OTP →'}
                </button>

                <div style={{ fontSize: '.72rem', color: '#888', textAlign: 'center', marginTop: '.75rem', background: '#FAEEDA', borderRadius: 8, padding: '8px 12px' }}>
                  ⚠️ <strong style={{ color: '#BA7517' }}>Test Mode:</strong> Any number works. OTP = <strong style={{ color: '#BA7517' }}>1234</strong>
                </div>
              </>
            )}

            {/* ── STEP 2: OTP ───────────────────────────── */}
            {step === 'otp' && (
              <>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.25rem' }}>Enter OTP 🔐</h2>
                <p style={{ fontSize: '.83rem', color: '#555', marginBottom: '1.25rem' }}>
                  Sent to +91 {phone}
                  <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: '#0F6E56', cursor: 'pointer', fontSize: '.78rem', marginLeft: 8, fontWeight: 600 }}>Change</button>
                </p>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 8 }}>One-Time Password</label>

                {/* 4 OTP boxes */}
                <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', justifyContent: 'center' }}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="tel"
                      maxLength={1}
                      value={d}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpBack(i, e)}
                      style={{ width: 62, height: 62, textAlign: 'center', background: otpErr ? '#fcebeb' : d ? '#E1F5EE' : '#f7f9f7', border: `1.5px solid ${otpErr ? '#e24b4a' : d ? '#1D9E75' : '#e0e4e0'}`, borderRadius: 12, padding: 0, fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Georgia,serif', outline: 'none', transition: 'all .2s', flexShrink: 0 }}
                    />
                  ))}
                </div>

                {otpErr && <p style={{ textAlign: 'center', color: '#e24b4a', fontSize: '.82rem', marginBottom: '.5rem' }}>❌ Wrong OTP. Use 1234 in test mode.</p>}

                <button
                  onClick={verifyOtp}
                  disabled={otp.join('').length < 4 || loading}
                  style={{ width: '100%', background: otp.join('').length === 4 ? '#0F6E56' : '#e0e4e0', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: otp.join('').length === 4 ? 'pointer' : 'not-allowed' }}>
                  {loading ? 'Verifying...' : 'Verify & Continue →'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 10 }}>
                  <button onClick={sendOtp} style={{ background: 'none', border: 'none', color: '#0F6E56', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>Resend OTP</button>
                </div>

                <div style={{ fontSize: '.72rem', color: '#888', textAlign: 'center', marginTop: '.75rem', background: '#FAEEDA', borderRadius: 8, padding: '8px 12px' }}>
                  ⚠️ <strong style={{ color: '#BA7517' }}>Test OTP:</strong> Enter <strong style={{ color: '#BA7517' }}>1 2 3 4</strong>
                </div>
              </>
            )}

            {/* ── STEP 3: SUCCESS ───────────────────────── */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>✅</div>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.4rem' }}>Welcome, {name}! 🎉</h2>
                <div style={{ display: 'inline-block', background: '#0F6E56', color: '#fff', fontSize: '.78rem', fontWeight: 700, padding: '6px 16px', borderRadius: 20, margin: '.5rem 0 .75rem' }}>
                  {role === 'tenant' ? '🏠 Tenant Account' : '🔑 Owner Account'}
                </div>
                <p style={{ fontSize: '.85rem', color: '#555' }}>
                  Redirecting to your {role === 'owner' ? 'dashboard' : 'search'}...
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(226,75,74,.3)} 50%{box-shadow:0 0 0 8px rgba(226,75,74,0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @media(max-width:700px){
          .hero-grid{grid-template-columns:1fr!important}
          .hero-phone{display:none!important}
          .plans-grid{grid-template-columns:1fr!important}
          .bottom-nav{display:flex!important}
          body{padding-bottom:60px}
        }
      `}</style>
    </>
  )
}
