'use client'

export default function Footer() {
  return (
    <footer style={{
      background: '#f7f9f7',
      borderTop: '1px solid #e0e4e0',
      padding: '2.5rem 1.5rem 1.5rem',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', fontWeight: 700, color: '#0F6E56', marginBottom: '.5rem' }}>
              Rent<span style={{ color: '#1a1a1a' }}>Nestle</span>
            </div>
            <p style={{ fontSize: '.82rem', color: '#555', lineHeight: 1.7, maxWidth: 220 }}>
              India's AI-powered rental portal. Zero brokerage, fully digital, legally compliant.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: '.75rem' }}>
              {['📱 App Coming Soon'].map(t => (
                <span key={t} style={{ fontSize: '.72rem', color: '#0F6E56', background: '#E1F5EE', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Tenants */}
          <div>
            <h4 style={{ fontFamily: 'Georgia,serif', fontSize: '.88rem', fontWeight: 700, marginBottom: '.75rem', color: '#1a1a1a' }}>
              For Tenants
            </h4>
            {['Search Homes', 'Tenant Plans', 'Digital Agreements', 'HRA Receipts', 'Tenant Verification'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: '.78rem', color: '#555', textDecoration: 'none', marginBottom: '.35rem', lineHeight: 1.6 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F6E56')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                {l}
              </a>
            ))}
          </div>

          {/* Owners */}
          <div>
            <h4 style={{ fontFamily: 'Georgia,serif', fontSize: '.88rem', fontWeight: 700, marginBottom: '.75rem', color: '#1a1a1a' }}>
              For Owners
            </h4>
            {['List Property', 'Owner Plans', 'Tenant Screening', 'WhatsApp AI Alerts', 'AI Photo Enhancement'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: '.78rem', color: '#555', textDecoration: 'none', marginBottom: '.35rem', lineHeight: 1.6 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F6E56')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                {l}
              </a>
            ))}
          </div>

          {/* Cities */}
          <div>
            <h4 style={{ fontFamily: 'Georgia,serif', fontSize: '.88rem', fontWeight: 700, marginBottom: '.75rem', color: '#1a1a1a' }}>
              Top Cities
            </h4>
            {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'].map(l => (
              <a key={l} href={`/search?city=${l}`} style={{ display: 'block', fontSize: '.78rem', color: '#555', textDecoration: 'none', marginBottom: '.35rem', lineHeight: 1.6 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F6E56')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                {l}
              </a>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontFamily: 'Georgia,serif', fontSize: '.88rem', fontWeight: 700, marginBottom: '.75rem', color: '#1a1a1a' }}>
              Company
            </h4>
            {['About Us', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Use', 'Contact Us'].map(l => (
              <a key={l} href="#" style={{ display: 'block', fontSize: '.78rem', color: '#555', textDecoration: 'none', marginBottom: '.35rem', lineHeight: 1.6 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0F6E56')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          padding: '1rem 0', borderTop: '1px solid #e0e4e0', borderBottom: '1px solid #e0e4e0',
          marginBottom: '1rem',
        }}>
          {[
            { icon: '🛡️', text: 'Zero Brokerage' },
            { icon: '📄', text: 'Legal Agreements' },
            { icon: '✅', text: 'Verified Listings' },
            { icon: '🔒', text: 'Secure Payments' },
            { icon: '🤖', text: 'AI Powered' },
          ].map(b => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', color: '#555', fontWeight: 500 }}>
              <span style={{ fontSize: '.9rem' }}>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
          <p style={{ fontSize: '.75rem', color: '#999' }}>
            © 2025 RentNestle. All rights reserved. Made with ❤️ in India.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['Privacy', 'Terms', 'Sitemap'].map(l => (
              <a key={l} href="#" style={{ fontSize: '.72rem', color: '#999', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
