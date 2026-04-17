'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

type Step = 'phone' | 'otp' | 'success'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep]       = useState<Step>('phone')
  const [role, setRole]       = useState<UserRole>('tenant')
  const [phone, setPhone]     = useState('')
  const [countryCode, setCC]  = useState('+91')
  const [otp, setOtp]         = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const otpRefs               = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const isTestMode = process.env.NODE_ENV !== 'production'

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStep('otp')
      setTimeout(() => otpRefs[0].current?.focus(), 150)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP box helpers ────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 3) otpRefs[index + 1].current?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 4) { setError('Enter all 4 digits'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpString, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setOtp(['', '', '', ''])
        otpRefs[0].current?.focus()
        return
      }
      setStep('success')
      setTimeout(() => {
        router.push(role === 'owner' ? '/dashboard/owner' : '/dashboard/tenant')
      }, 1500)
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setOtp(['', '', '', ''])
    setError('')
    await handleSendOtp()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(150deg,#eef8f4,#fff)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: '2rem 1.75rem',
        width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', fontWeight: 700, color: '#0F6E56' }}>
            Rent<span style={{ color: '#1a1a1a' }}>Nestle</span>
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' }}>
          {(['phone', 'otp', 'success'] as Step[]).map((s, i) => (
            <div key={s} style={{
              height: 7, borderRadius: 4,
              width: step === s ? 24 : 7,
              background: step === s ? '#0F6E56' : (
                (['phone', 'otp', 'success'].indexOf(step) > i) ? '#9FE1CB' : '#e0e4e0'
              ),
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* ── PHONE STEP ─────────────────────────────────── */}
        {step === 'phone' && (
          <>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.25rem' }}>Welcome 👋</h2>
            <p style={{ fontSize: '.83rem', color: '#555', marginBottom: '1.25rem' }}>
              Sign in or register — no password needed.
            </p>

            {/* Role tabs */}
            <div style={{ display: 'flex', gap: 6, background: '#f7f9f7', borderRadius: 10, padding: 4, marginBottom: '1.25rem' }}>
              {(['tenant', 'owner'] as UserRole[]).map((r) => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 8,
                  background: role === r ? '#fff' : 'transparent',
                  color: role === r ? '#0F6E56' : '#555',
                  fontWeight: 600, fontSize: '.83rem', cursor: 'pointer',
                  boxShadow: role === r ? '0 1px 6px rgba(0,0,0,.08)' : 'none',
                  transition: 'all .2s',
                }}>
                  {r === 'tenant' ? '🏠 Tenant' : '🔑 Owner'}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 6 }}>
              Mobile Number
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <select
                value={countryCode}
                onChange={(e) => setCC(e.target.value)}
                style={{ background: '#f7f9f7', border: '1.5px solid #e0e4e0', borderRadius: 10, padding: '10px 6px', fontSize: '.85rem', width: 76 }}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
              </select>
              <input
                type="tel" maxLength={10} value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                placeholder="98765 43210"
                style={{
                  flex: 1, background: '#f7f9f7', border: '1.5px solid #e0e4e0',
                  borderRadius: 10, padding: '10px 12px', fontSize: '1rem',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            <p style={{ fontSize: '.73rem', color: '#999', marginBottom: '1rem' }}>
              We'll send a one-time password to verify your number.
            </p>

            {error && <p style={{ fontSize: '.78rem', color: '#e24b4a', marginBottom: '.75rem' }}>{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || loading}
              style={{
                width: '100%', background: phone.length === 10 ? '#0F6E56' : '#e0e4e0',
                color: '#fff', border: 'none', padding: '12px',
                borderRadius: 12, fontWeight: 700, fontSize: '.95rem',
                cursor: phone.length === 10 ? 'pointer' : 'not-allowed',
                transition: 'background .2s',
              }}
            >
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>

            {isTestMode && (
              <div style={{ fontSize: '.72rem', color: '#888', textAlign: 'center', marginTop: '.75rem', background: '#FAEEDA', borderRadius: 8, padding: '8px 12px' }}>
                ⚠️ <strong style={{ color: '#BA7517' }}>Test Mode</strong> — Any number works. OTP = <strong style={{ color: '#BA7517' }}>1234</strong>
              </div>
            )}
          </>
        )}

        {/* ── OTP STEP ───────────────────────────────────── */}
        {step === 'otp' && (
          <>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.25rem' }}>Enter OTP 🔐</h2>
            <p style={{ fontSize: '.83rem', color: '#555', marginBottom: '1.25rem' }}>
              Sent to {countryCode} {phone}
              <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: '#0F6E56', cursor: 'pointer', fontSize: '.78rem', marginLeft: 8 }}>
                Change
              </button>
            </p>

            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#555', marginBottom: 8 }}>
              One-Time Password
            </label>
            <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
              {otp.map((digit, i) => (
                <input
                  key={i} ref={otpRefs[i]} type="tel" maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`otp-input${digit ? ' filled' : ''}`}
                />
              ))}
            </div>

            {error && (
              <p style={{ fontSize: '.78rem', color: '#e24b4a', marginBottom: '.75rem', textAlign: 'center' }}>{error}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otp.join('').length < 4 || loading}
              style={{
                width: '100%', background: otp.join('').length === 4 ? '#0F6E56' : '#e0e4e0',
                color: '#fff', border: 'none', padding: '12px',
                borderRadius: 12, fontWeight: 700, fontSize: '.95rem',
                cursor: otp.join('').length === 4 ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: '#0F6E56', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Resend OTP
              </button>
            </div>

            {isTestMode && (
              <div style={{ fontSize: '.72rem', color: '#888', textAlign: 'center', marginTop: '.75rem', background: '#FAEEDA', borderRadius: 8, padding: '8px 12px' }}>
                ⚠️ <strong style={{ color: '#BA7517' }}>Test OTP:</strong> Enter <strong style={{ color: '#BA7517' }}>1 2 3 4</strong>
              </div>
            )}
          </>
        )}

        {/* ── SUCCESS STEP ──────────────────────────────── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>
              ✅
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', marginBottom: '.4rem' }}>You're In!</h2>
            <div style={{ display: 'inline-block', background: '#0F6E56', color: '#fff', fontSize: '.78rem', fontWeight: 700, padding: '6px 16px', borderRadius: 20, margin: '.5rem 0 .75rem' }}>
              {role === 'tenant' ? '🏠 Tenant Account' : '🔑 Owner Account'}
            </div>
            <p style={{ fontSize: '.85rem', color: '#555' }}>
              Welcome to RentNestle! Redirecting you to your dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
