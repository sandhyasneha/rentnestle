'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Property, Agreement } from '@/types'

export default function TenantDashboard() {
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [saved, setSaved]           = useState<Property[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const [profileRes, savedRes, agrRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('saved_properties').select('*, property:properties(*)').eq('tenant_id', user.id).limit(4),
      supabase.from('agreements').select('*, property:properties(title,city)').eq('tenant_id', user.id).order('created_at', { ascending: false }).limit(3),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (savedRes.data) setSaved(savedRes.data.map((s: any) => s.property))
    if (agrRes.data) setAgreements(agrRes.data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#0F6E56', fontFamily: 'Georgia,serif', fontSize: '1.1rem' }}>Loading...</div>
    </div>
  )

  const planColors = { free: '#888', pro: '#0F6E56', gold: '#BA7517' }
  const planColor = planColors[profile?.plan || 'free']

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
            Hello, {profile?.full_name || 'Tenant'} 👋
          </h1>
          <p style={{ fontSize: '.85rem', color: '#555' }}>+91 {profile?.phone}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: planColor, color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block', textTransform: 'uppercase' }}>
            {profile?.plan} Plan
          </div>
          {profile?.plan === 'free' && (
            <div style={{ fontSize: '.72rem', color: '#0F6E56', marginTop: 4, cursor: 'pointer', fontWeight: 600 }}>
              ↑ Upgrade for unlimited access
            </div>
          )}
        </div>
      </div>

      {/* Verification Status */}
      <div style={{ background: '#f7f9f7', border: '1px solid #e0e4e0', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '.75rem' }}>
          Verification Status
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Aadhaar', done: profile?.aadhaar_verified, icon: '🪪' },
            { label: 'PAN',     done: profile?.pan_verified,     icon: '📋' },
            { label: 'Police',  done: profile?.police_verified,  icon: '👮' },
          ].map((v) => (
            <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.83rem' }}>
              <span>{v.icon}</span>
              <span style={{ color: v.done ? '#0F6E56' : '#999', fontWeight: v.done ? 600 : 400 }}>
                {v.label}: {v.done ? '✅ Verified' : '⬜ Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '🔍', label: 'Search Homes',   href: '/search' },
          { icon: '📄', label: 'My Agreements',   href: '/agreements' },
          { icon: '🧾', label: 'HRA Receipts',    href: '/hra' },
          { icon: '✅', label: 'Get Verified',    href: '/verify' },
        ].map((a) => (
          <a key={a.label} href={a.href} style={{
            background: '#fff', border: '1px solid #e0e4e0', borderRadius: 14,
            padding: '1.25rem 1rem', textAlign: 'center', textDecoration: 'none',
            color: '#1a1a1a', transition: 'box-shadow .2s, transform .2s',
            display: 'block',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{a.label}</div>
          </a>
        ))}
      </div>

      {/* Recent Agreements */}
      {agreements.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem' }}>My Agreements</h2>
            <a href="/agreements" style={{ fontSize: '.78rem', color: '#0F6E56', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          {agreements.map((a) => (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #e0e4e0', borderRadius: 12, padding: '1rem', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{(a as any).property?.title}</div>
                <div style={{ fontSize: '.75rem', color: '#999' }}>{(a as any).property?.city} · ₹{a.monthly_rent}/mo</div>
              </div>
              <div style={{
                background: a.status === 'completed' ? '#E1F5EE' : '#FAEEDA',
                color: a.status === 'completed' ? '#0F6E56' : '#BA7517',
                fontSize: '.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 8,
              }}>
                {a.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Properties */}
      {saved.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem' }}>Saved Homes</h2>
            <a href="/saved" style={{ fontSize: '.78rem', color: '#0F6E56', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '.75rem' }}>
            {saved.map((p) => p && (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e0e4e0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ height: 90, background: 'linear-gradient(135deg,#9FE1CB,#0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏠</div>
                <div style={{ padding: '.6rem .75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '.83rem', fontFamily: 'Georgia,serif', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: '.72rem', color: '#999' }}>{p.city}</div>
                  <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#0F6E56', marginTop: 4 }}>₹{p.monthly_rent?.toLocaleString()}/mo</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
