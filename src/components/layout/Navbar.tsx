'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { label: 'Find a Home',   href: '/search' },
    { label: 'List Property', href: '/list-property' },
    { label: 'Agreements',    href: '#' },
    { label: 'Plans',         href: '/#plans' },
  ]

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
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textDecoration: 'none' }}
          title="RentNestle - Zero Brokerage Rentals">
          <Image
            src="/logo-icon.png"
            alt="RentNestle Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#0F6E56',
            letterSpacing: '-0.3px',
            lineHeight: 1,
          }}>
            Rent<span style={{ color: '#1a1a1a' }}>Nestle</span>
            <span style={{
              display: 'block',
              fontSize: '.6rem',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 400,
              color: '#999',
              letterSpacing: '.5px',
              marginTop: 1,
            }}>www.rentnestle.com</span>
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="rn-nav-desktop">
          {links.map(l => (
            <a key={l.label} href={l.href} style={{
              fontSize: '.85rem',
              color: pathname === l.href ? '#0F6E56' : '#444',
              textDecoration: 'none',
              fontWeight: pathname === l.href ? 600 : 500,
              transition: 'color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0F6E56')}
            onMouseLeave={e => (e.currentTarget.style.color = pathname === l.href ? '#0F6E56' : '#444')}>
              {l.label}
            </a>
          ))}
          <button onClick={() => router.push('/auth/login')} style={{
            background: '#0F6E56', color: '#fff',
            padding: '.45rem 1.1rem', borderRadius: 8,
            fontSize: '.85rem', fontWeight: 600,
            border: 'none', cursor: 'pointer',
            transition: 'background .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1D9E75')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0F6E56')}>
            Sign In / Register
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(m => !m)} className="rn-nav-mobile-btn"
          style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#0F6E56' : '#1a1a1a', borderRadius: 2, transition: '.3s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#0F6E56' : '#1a1a1a', borderRadius: 2, transition: '.3s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? '#0F6E56' : '#1a1a1a', borderRadius: 2, transition: '.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0,
          background: '#fff', borderBottom: '1px solid #e0e4e0',
          padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column',
          gap: '.85rem', zIndex: 99,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: '.92rem', color: '#444', textDecoration: 'none', fontWeight: 500, padding: '.25rem 0' }}>
              {l.label}
            </a>
          ))}
          <button onClick={() => { router.push('/auth/login'); setMenuOpen(false) }}
            style={{ background: '#0F6E56', color: '#fff', padding: '.6rem 1rem', borderRadius: 9, fontWeight: 600, border: 'none', cursor: 'pointer', textAlign: 'left' as const, marginTop: '.25rem' }}>
            Sign In / Register
          </button>
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
