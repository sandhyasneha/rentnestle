'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [userName,  setUserName]  = useState<string | null>(null)
  const [userPhone, setUserPhone] = useState<string | null>(null)
  const [userRole,  setUserRole]  = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Read user from localStorage on mount
  useEffect(() => {
    const name  = localStorage.getItem('rn_user_name')
    const phone = localStorage.getItem('rn_user_phone')
    const role  = localStorage.getItem('rn_user_role')
    if (name) { setUserName(name); setUserPhone(phone); setUserRole(role) }
  }, [pathname]) // re-check on every page change

  const handleSignOut = () => {
    localStorage.removeItem('rn_user_name')
    localStorage.removeItem('rn_user_phone')
    localStorage.removeItem('rn_user_role')
    localStorage.removeItem('rn_user_id')
    localStorage.removeItem('rn_access_token')
    localStorage.removeItem('rn_refresh_token')
    setUserName(null)
    setUserPhone(null)
    setUserRole(null)
    setShowDropdown(false)
    router.push('/')
  }

  const links = [
    { label: 'Find a Home',   href: '/search' },
    { label: 'List Property', href: '/list-property' },
    { label: 'Agreements',    href: '#' },
    { label: 'Plans',         href: '/#plans' },
  ]

  // First letter avatar
  const avatar = userName ? userName.charAt(0).toUpperCase() : ''

  return (
    <>
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e0e4e0',
        padding: '0 2rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>

        {/* Logo */}
        <div onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          title="RentNestle">
          <Image src="/logo-icon.png" alt="RentNestle" width={38} height={38} style={{ objectFit: 'contain' }} priority />
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', fontWeight: 700, color: '#0F6E56', letterSpacing: '-0.3px', lineHeight: 1 }}>
            Rent<span style={{ color: '#1a1a1a' }}>Nestle</span>
            <span style={{ display: 'block', fontSize: '.6rem', fontFamily: 'system-ui,sans-serif', fontWeight: 400, color: '#999', letterSpacing: '.5px', marginTop: 1 }}>
              www.rentnestle.com
            </span>
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="rn-nav-desktop">
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: '.85rem', color: pathname === l.href ? '#0F6E56' : '#444', textDecoration: 'none', fontWeight: pathname === l.href ? 600 : 500, transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0F6E56')}
              onMouseLeave={e => (e.currentTarget.style.color = pathname === l.href ? '#0F6E56' : '#444')}>
              {l.label}
            </a>
          ))}

          {/* ── LOGGED IN: Show name + dropdown ── */}
          {userName ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(d => !d)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f9f7', border: '1.5px solid #e0e4e0', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', transition: 'border-color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0F6E56')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e4e0')}>
                {/* Avatar circle */}
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0F6E56', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, flexShrink: 0 }}>
                  {avatar}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>{userName}</div>
                  <div style={{ fontSize: '.7rem', color: '#888', lineHeight: 1.2 }}>+91 {userPhone}</div>
                </div>
                <svg width="12" height="12" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div style={{ position: 'absolute', top: 46, right: 0, background: '#fff', border: '1px solid #e0e4e0', borderRadius: 12, padding: '.5rem', minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,.1)', zIndex: 200 }}>
                  {/* User info */}
                  <div style={{ padding: '.6rem .75rem', borderBottom: '1px solid #f0f0f0', marginBottom: '.35rem' }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#1a1a1a' }}>{userName}</div>
                    <div style={{ fontSize: '.73rem', color: '#888' }}>+91 {userPhone}</div>
                    <div style={{ display: 'inline-block', background: userRole === 'owner' ? '#FAEEDA' : '#E1F5EE', color: userRole === 'owner' ? '#BA7517' : '#0F6E56', fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, marginTop: 4 }}>
                      {userRole === 'owner' ? '🔑 Owner' : '🏠 Tenant'}
                    </div>
                  </div>

                  {/* Dashboard link */}
                  <div onClick={() => { router.push(userRole === 'owner' ? '/dashboard/owner' : '/dashboard/tenant'); setShowDropdown(false) }}
                    style={{ padding: '.6rem .75rem', borderRadius: 8, fontSize: '.83rem', cursor: 'pointer', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f7f9f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    📊 My Dashboard
                  </div>

                  {userRole === 'owner' && (
                    <div onClick={() => { router.push('/list-property'); setShowDropdown(false) }}
                      style={{ padding: '.6rem .75rem', borderRadius: 8, fontSize: '.83rem', cursor: 'pointer', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f7f9f7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      🏠 List Property
                    </div>
                  )}

                  {userRole === 'tenant' && (
                    <div onClick={() => { router.push('/search'); setShowDropdown(false) }}
                      style={{ padding: '.6rem .75rem', borderRadius: 8, fontSize: '.83rem', cursor: 'pointer', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f7f9f7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      🔍 Search Homes
                    </div>
                  )}

                  {/* Sign out */}
                  <div onClick={handleSignOut}
                    style={{ padding: '.6rem .75rem', borderRadius: 8, fontSize: '.83rem', cursor: 'pointer', color: '#e24b4a', display: 'flex', alignItems: 'center', gap: 8, marginTop: '.25rem', borderTop: '1px solid #f0f0f0', paddingTop: '.6rem' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    🚪 Sign Out
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── NOT LOGGED IN: Show Sign In button ── */
            <button onClick={() => router.push('/auth/login')} style={{ background: '#0F6E56', color: '#fff', padding: '.45rem 1.1rem', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background .2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1D9E75')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0F6E56')}>
              Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(m => !m)} className="rn-nav-mobile-btn"
          style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#1a1a1a', borderRadius: 2 }} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: '#fff', borderBottom: '1px solid #e0e4e0', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem', zIndex: 99, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {userName && (
            <div style={{ background: '#f7f9f7', borderRadius: 10, padding: '.75rem', marginBottom: '.25rem' }}>
              <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{userName}</div>
              <div style={{ fontSize: '.75rem', color: '#888' }}>+91 {userPhone} · {userRole === 'owner' ? '🔑 Owner' : '🏠 Tenant'}</div>
            </div>
          )}
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: '.92rem', color: '#444', textDecoration: 'none', fontWeight: 500, padding: '.25rem 0' }}>
              {l.label}
            </a>
          ))}
          {userName ? (
            <button onClick={handleSignOut}
              style={{ background: '#fff5f5', color: '#e24b4a', border: '1px solid #fecaca', padding: '.6rem 1rem', borderRadius: 9, fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const }}>
              🚪 Sign Out
            </button>
          ) : (
            <button onClick={() => { router.push('/auth/login'); setMenuOpen(false) }}
              style={{ background: '#0F6E56', color: '#fff', padding: '.6rem 1rem', borderRadius: 9, fontWeight: 600, border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
              Sign In / Register
            </button>
          )}
        </div>
      )}

      <style>{`
        @media(max-width:700px){
          .rn-nav-desktop{display:none!important}
          .rn-nav-mobile-btn{display:flex!important}
        }
      `}</style>
    </>
  )
}
