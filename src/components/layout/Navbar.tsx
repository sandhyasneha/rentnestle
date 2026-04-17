'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { label: 'Find a Home',    href: '/search' },
    { label: 'List Property',  href: '/list-property' },
    { label: 'Agreements',     href: '#' },
    { label: 'Plans',          href: '/#plans' },
  ]

  return (
    <>
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e0e4e0',
        padding: '0 1.5rem', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div onClick={() => router.push('/')}
          style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', fontWeight:700, color:'#0F6E56', cursor:'pointer' }}>
          Rent<span style={{ color:'#1a1a1a' }}>Nestle</span>
        </div>

        {/* Desktop links */}
        <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }} className="nav-desktop">
          {links.map(l => (
            <a key={l.label} href={l.href} style={{
              fontSize:'.83rem', color: pathname === l.href ? '#0F6E56' : '#555',
              textDecoration:'none', fontWeight: pathname === l.href ? 600 : 500,
            }}>
              {l.label}
            </a>
          ))}
          <button onClick={() => router.push('/auth/login')} style={{
            background:'#0F6E56', color:'#fff', padding:'.4rem 1rem',
            borderRadius:8, fontSize:'.83rem', fontWeight:600, border:'none', cursor:'pointer',
          }}>
            Sign In / Register
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(m => !m)}
          style={{ display:'none', background:'none', border:'none', cursor:'pointer', padding:4 }}
          className="nav-mobile-btn">
          <div style={{ width:22, height:2, background:'#1a1a1a', borderRadius:2, marginBottom:5 }} />
          <div style={{ width:22, height:2, background:'#1a1a1a', borderRadius:2, marginBottom:5 }} />
          <div style={{ width:22, height:2, background:'#1a1a1a', borderRadius:2 }} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position:'fixed', top:58, left:0, right:0, background:'#fff',
          borderBottom:'1px solid #e0e4e0', padding:'1rem 1.5rem',
          display:'flex', flexDirection:'column', gap:'.9rem', zIndex:99,
        }}>
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontSize:'.88rem', color:'#555', textDecoration:'none', fontWeight:500 }}>
              {l.label}
            </a>
          ))}
          <button onClick={() => { router.push('/auth/login'); setMenuOpen(false) }}
            style={{ background:'#0F6E56', color:'#fff', padding:'.5rem 1rem', borderRadius:8, fontWeight:600, border:'none', cursor:'pointer', textAlign:'left' }}>
            Sign In / Register
          </button>
        </div>
      )}

      <style>{`
        @media(max-width:680px){
          .nav-desktop{display:none!important}
          .nav-mobile-btn{display:block!important}
        }
      `}</style>
    </>
  )
}
