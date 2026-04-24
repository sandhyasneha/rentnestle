'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'phone' | 'otp' | 'success'
type Role = 'tenant' | 'owner'

export default function LoginPage() {
  const router = useRouter()
  const [step,    setStep]    = useState<Step>('phone')
  const [role,    setRole]    = useState<Role>('tenant')
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [otp,     setOtp]     = useState(['','','',''])
  const [otpErr,  setOtpErr]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const [testOtp,   setTestOtp]   = useState('')
  const [isTestMode,setIsTestMode]= useState(false)

  const handleSendOtp = async () => {
    if (phone.length !== 10 || !name.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      // Capture test OTP if in test mode
      if (data.testMode && data.debugOtp) {
        setTestOtp(data.debugOtp)
        setIsTestMode(true)
      } else {
        setIsTestMode(false)
        setTestOtp('')
      }
      setStep('otp')
      setTimeout(() => otpRefs[0].current?.focus(), 150)
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const n = [...otp]; n[i] = v; setOtp(n); setOtpErr(false)
    if (v && i < 3) otpRefs[i+1].current?.focus()
  }

  const handleOtpBack = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const n = [...otp]; n[i-1] = ''; setOtp(n)
      otpRefs[i-1].current?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 4) return
    setError('')
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
        setError(data.error || 'Invalid OTP')
        setLoading(false)
        setTimeout(() => {
          setOtp(['','','',''])
          setOtpErr(false)
          setError('')
          otpRefs[0].current?.focus()
        }, 1500)
        return
      }
      // Save to localStorage
      localStorage.setItem('rn_user_name',  data.name || name)
      localStorage.setItem('rn_user_phone', phone)
      localStorage.setItem('rn_user_role',  data.role || role)
      localStorage.setItem('rn_user_id',    data.userId || '')
      setStep('success')
      setTimeout(() => {
        router.push(role === 'owner' ? '/dashboard/owner' : '/search')
      }, 1500)
    } catch {
      setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#f7f9f7', border: '1.5px solid #e0e4e0',
    borderRadius: 10, padding: '10px 12px', fontSize: '1rem',
    fontFamily: 'inherit', outline: 'none', color: '#1a1a1a',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg,#eef8f4,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2rem 1.75rem', width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', fontWeight: 700, color: '#0F6E56' }}>
            Rent<span style={{ color: '#1a1a1a' }}>Nestle</span>
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' }}>
          {(['phone','otp','success'] as Step[]).map((s, i) => (
            <div key={s} style={{ height: 7, borderRadius: 4, transition: 'all .3s',
              width: step === s ? 24 : 7,
              background: step === s ? '#0F6E56' : (['phone','otp','success'].indexOf(step) > i) ? '#9FE1CB' : '#e0e4e0'
            }} />
          ))}
        </div>

        {/* ── PHONE STEP ── */}
        {step === 'phone' && <>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.25rem' }}>Welcome 👋</h2>
          <p style={{ fontSize: '.83rem', color: '#555', marginBottom: '1.25rem' }}>Sign in or register — no password needed.</p>

          {/* Role tabs */}
          <div style={{ display: 'flex', gap: 6, background: '#f7f9f7', borderRadius: 10, padding: 4, marginBottom: '1.25rem' }}>
            {(['tenant','owner'] as Role[]).map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: role===r?'#fff':'transparent', color: role===r?'#0F6E56':'#555', fontWeight: 600, fontSize: '.83rem', cursor: 'pointer', boxShadow: role===r?'0 1px 6px rgba(0,0,0,.08)':'none', transition: 'all .2s' }}>
                {r === 'tenant' ? '🏠 Tenant' : '🔑 Owner'}
              </button>
            ))}
          </div>

          {/* Name */}
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 5 }}>Your Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Enter your full name"
            style={{ ...inp, marginBottom: '1rem' }} />

          {/* Phone — India only */}
          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 5 }}>Mobile Number</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div style={{ background: '#f7f9f7', border: '1.5px solid #e0e4e0', borderRadius: 10, padding: '10px 12px', fontSize: '.9rem', color: '#333', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              🇮🇳 +91
            </div>
            <input type="tel" maxLength={10} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key==='Enter' && handleSendOtp()}
              placeholder="98765 43210"
              style={inp} />
          </div>
          <p style={{ fontSize: '.73rem', color: '#999', marginBottom: '1rem' }}>We'll send a one-time password to verify your number.</p>

          {error && <p style={{ fontSize: '.78rem', color: '#e24b4a', marginBottom: '.75rem' }}>{error}</p>}

          <button onClick={handleSendOtp}
            disabled={phone.length < 10 || !name.trim() || loading}
            style={{ width: '100%', background: (phone.length===10 && name.trim()) ? '#0F6E56' : '#e0e4e0', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: (phone.length===10 && name.trim()) ? 'pointer' : 'not-allowed', transition: 'background .2s' }}>
            {loading ? 'Sending...' : 'Send OTP →'}
          </button>

          <div style={{ fontSize: '.72rem', color: '#888', textAlign: 'center', marginTop: '.75rem', background: '#FAEEDA', borderRadius: 8, padding: '8px 12px' }}>
            ⚠️ <strong style={{ color: '#BA7517' }}>Test Mode:</strong> Any number · OTP = <strong style={{ color: '#BA7517' }}>1234</strong>
          </div>
        </>}

        {/* ── OTP STEP ── */}
        {step === 'otp' && <>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.25rem' }}>Enter OTP 🔐</h2>
          <p style={{ fontSize: '.83rem', color: '#555', marginBottom: '1.25rem' }}>
            Sent to +91 {phone}
            <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: '#0F6E56', cursor: 'pointer', fontSize: '.78rem', marginLeft: 8, fontWeight: 600 }}>Change</button>
          </p>

          <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 8 }}>One-Time Password</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', justifyContent: 'center' }}>
            {otp.map((d, i) => (
              <input key={i} ref={otpRefs[i]} type="tel" maxLength={1} value={d}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpBack(e, i)}
                style={{ width: 62, height: 62, textAlign: 'center', background: otpErr?'#fcebeb':d?'#E1F5EE':'#f7f9f7', border: `1.5px solid ${otpErr?'#e24b4a':d?'#1D9E75':'#e0e4e0'}`, borderRadius: 12, padding: 0, fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Georgia,serif', outline: 'none', transition: 'all .2s', flexShrink: 0 }} />
            ))}
          </div>

          {(error || otpErr) && <p style={{ textAlign: 'center', color: '#e24b4a', fontSize: '.82rem', marginBottom: '.5rem' }}>❌ Wrong OTP. Please check your WhatsApp.</p>}

          <button onClick={handleVerify}
            disabled={otp.join('').length < 4 || loading}
            style={{ width: '100%', background: otp.join('').length===4 ? '#0F6E56' : '#e0e4e0', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: '.95rem', cursor: otp.join('').length===4 ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Verifying...' : 'Verify & Continue →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: '#0F6E56', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>Resend OTP</button>
          </div>

          <div style={{ fontSize: '.72rem', color: '#888', textAlign: 'center', marginTop: '.75rem', background: isTestMode ? '#FAEEDA' : '#E1F5EE', borderRadius: 8, padding: '8px 12px' }}>
            {isTestMode ? (
              <>⚠️ <strong style={{ color: '#BA7517' }}>Test Mode OTP:</strong> <strong style={{ color: '#BA7517', fontSize: '1.1rem', letterSpacing: 4 }}>{testOtp}</strong></>
            ) : (
              <>📱 OTP sent to your <strong style={{ color: '#0F6E56' }}>WhatsApp</strong> +91 {phone}</>
            )}
          </div>
        </>}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>✅</div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.4rem' }}>Welcome, {name}! 🎉</h2>
            <div style={{ display: 'inline-block', background: '#0F6E56', color: '#fff', fontSize: '.78rem', fontWeight: 700, padding: '6px 16px', borderRadius: 20, margin: '.5rem 0 .75rem' }}>
              {role === 'tenant' ? '🏠 Tenant Account' : '🔑 Owner Account'}
            </div>
            <p style={{ fontSize: '.85rem', color: '#555' }}>Redirecting to your {role === 'owner' ? 'dashboard' : 'search'}...</p>
          </div>
        )}

      </div>
    </div>
  )
}
