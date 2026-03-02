// src/components/PublicFooter.jsx
import { useNavigate } from 'react-router-dom'

const C = {
  navyDeep: '#081c35',
  gold: '#C5960C', goldL: '#F0B429', goldDim: '#a37d0a',
}
const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"

export default function PublicFooter() {
  const navigate = useNavigate()

  const col = (title, items) => (
    <div key={title}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.32)', textTransform: 'uppercase', letterSpacing: '.12em', margin: '0 0 16px' }}>{title}</p>
      {items.map(([label, path]) => (
        <span key={label} onClick={() => navigate(path)} style={{
          display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,.32)',
          marginBottom: 10, cursor: 'pointer', transition: 'color .15s',
        }}
          onMouseEnter={e => { e.target.style.color = C.goldL }}
          onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,.32)' }}>
          {label}
        </span>
      ))}
    </div>
  )

  return (
    <footer style={{ background: C.navyDeep, borderTop: '3px solid rgba(197,150,12,.2)', fontFamily: sans }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${C.gold},${C.goldL},${C.gold})` }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 28px 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 44 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontSize: 13, fontWeight: 700, color: '#fff' }}>CV</div>
              <span style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: '#fff' }}>Civic<span style={{ color: C.goldL }}>Verify</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', lineHeight: 1.75, maxWidth: 260, marginBottom: 20 }}>
              The trusted platform for verified civic engagement. Every voice matters when it's real.
            </p>
            {['🛡️ Identity Verified Network', '🔒 Privacy by Design', '⚖️ Editorial Integrity'].map(t => (
              <div key={t} style={{ fontSize: 12.5, color: 'rgba(255,255,255,.28)', marginBottom: 6 }}>{t}</div>
            ))}
          </div>

          {col('Platform', [['Sign Up', '/signup'], ['Sign In', '/login'], ['Live Polls', '/#live-polls'], ['Community', '/#community'], ['For Organizations', '/org-signup']])}
          {col('Company', [['About', '/about'], ['How It Works', '/how-it-works'], ['FAQ', '/faq'], ['Contact', '/contact']])}
          {col('Legal', [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']])}

          {/* CTA */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.32)', textTransform: 'uppercase', letterSpacing: '.12em', margin: '0 0 16px' }}>Get Involved</p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.25)', lineHeight: 1.7, marginBottom: 16 }}>Your civic voice matters. Join verified citizens making a difference.</p>
            <button onClick={() => navigate('/signup')} style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Join Free →</button>
            <button onClick={() => navigate('/org-signup')} style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>🏛️ Organizations</button>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.16)' }}>© 2026 CivicVerify. Indianapolis, IN. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 18 }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['FAQ', '/faq']].map(([label, path]) => (
              <span key={label} onClick={() => navigate(path)} style={{ fontSize: 12, color: 'rgba(255,255,255,.16)', cursor: 'pointer' }}
                onMouseEnter={e => { e.target.style.color = C.goldL }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,.16)' }}>{label}</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.1)' }}>Built with trust in mind.</span>
        </div>
      </div>
    </footer>
  )
}
