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

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    const name   = localStorage.getItem('rn_user_name')
    const phone  = localStorage.getItem('rn_user_phone')
    const role   = localStorage.getItem('rn_user_role')
    const userId = localStorage.getItem('rn_user_id')

    if (!name || !phone) {
      router.replace('/')
      return
    }

    if (role !== 'owner') {
      router.replace('/dashboard/tenant')
      return
    }

    if (userId) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        setProfile(profileData || { full_name: name, phone, role, plan: 'free' })

        const { data: propsData } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
        if (propsData) setProperties(propsData)

        const { data: inqData } = await supabase
          .from('inquiries')
          .select('*, tenant:profiles(full_name,phone,aadhaar_verified), property:properties(title)')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (inqData) setInquiries(inqData)

      } catch (err) {
        console.error('Owner dashboard error:', err)
        setProfile({ full_name: name, phone, role, plan: 'free' })
      }
    } else {
      setProfile({ full_name: name, phone, role, plan: 'free' })
    }

    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('rn_user_name')
    localStorage.removeItem('rn_user_phone')
    localStorage.removeItem('rn_user_role')
    localStorage.removeItem('rn_user_id')
    localStorage.removeItem('rn_access_token')
    router.replace('/')
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#0F6E56', fontFamily: 'Georgia,serif', fontSize: '1.1rem' }}>Loading your dashboard...</div>
    </div>
  )

  const activeProps      = properties.filter(p => p.status === 'active').length
  const totalInquiries   = inquiries.length
  const unreadInquiries  = inquiries.filter((i: any) => !i.is_read).length

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
            Owner Dashboard 🔑
          </h1>
          <p style={{ fontSize: '.85rem', color: '#555' }}>
            {profile?.full_name} · +91 {profile?.phone}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/list-property" style={{ background: '#0F6E56', color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>
            ➕ List Property
          </a>
          <button onClick={handleLogout}
            style={{ background: '#f7f9f7', border: '1px solid #e0e4e0', color: '#555', padding: '10px 14px', borderRadius: 10, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Listings', value: properties.length, icon: '🏠' },
          { label: 'Active',         value: activeProps,        icon: '✅' },
          { label: 'Inquiries',      value: totalInquiries,     icon: '📨' },
          { label: 'Unread',         value: unreadInquiries,    icon: '🔔', accent: unreadInquiries > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: s.accent ? '#E1F5EE' : '#f7f9f7', border: `1px solid ${s.accent ? '#9FE1CB' : '#e0e4e0'}`, borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', fontWeight: 700, color: s.accent ? '#0F6E56' : '#1a1a1a' }}>{s.value}</div>
            <div style={{ fontSize: '.72rem', color: '#888' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Properties */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem' }}>My Listings</h2>
          <a href="/list-property" style={{ fontSize: '.78rem', color: '#0F6E56', fontWeight: 600, textDecoration: 'none' }}>+ Add new</a>
        </div>

        {properties.length === 0 ? (
          <div style={{ background: '#f7f9f7', border: '1px dashed #e0e4e0', borderRadius: 14, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏠</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No listings yet</div>
            <div style={{ fontSize: '.83rem', color: '#888', marginBottom: '1rem' }}>Create your first listing in 5 minutes</div>
            <a href="/list-property" style={{ background: '#0F6E56', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>
              List a Property
            </a>
          </div>
        ) : (
          properties.map((p: any) => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #e0e4e0', borderRadius: 12, padding: '1rem', marginBottom: '.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: '.92rem', fontFamily: 'Georgia,serif' }}>{p.title}</div>
                <div style={{ fontSize: '.75rem', color: '#999' }}>{p.city}, {p.state} · {p.property_type?.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: '#0F6E56' }}>₹{p.monthly_rent?.toLocaleString()}/mo</div>
                <div style={{ display: 'inline-block', fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6, marginTop: 4, background: p.status === 'active' ? '#E1F5EE' : p.status === 'rented' ? '#FAEEDA' : '#f0f0f0', color: p.status === 'active' ? '#0F6E56' : p.status === 'rented' ? '#BA7517' : '#888' }}>
                  {p.status?.toUpperCase()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inquiries */}
      {inquiries.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', marginBottom: '.75rem' }}>
            Recent Inquiries
            {unreadInquiries > 0 && <span style={{ background: '#0F6E56', color: '#fff', fontSize: '.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 8 }}>{unreadInquiries} new</span>}
          </h2>
          {inquiries.map((inq: any) => (
            <div key={inq.id} style={{ background: inq.is_read ? '#fff' : '#f0faf6', border: `1px solid ${inq.is_read ? '#e0e4e0' : '#9FE1CB'}`, borderRadius: 12, padding: '.9rem 1rem', marginBottom: '.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.88rem' }}>
                  {inq.tenant?.full_name || 'Tenant'}
                  {inq.tenant?.aadhaar_verified && <span style={{ fontSize: '.65rem', color: '#0F6E56', background: '#E1F5EE', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>✓ KYC</span>}
                </div>
                <div style={{ fontSize: '.75rem', color: '#888' }}>{inq.tenant?.phone} · {inq.property?.title}</div>
              </div>
              {!inq.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F6E56', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
