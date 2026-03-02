import BackToTop from '../../components/BackToTop'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const C = {
  navy: '#0B2545', navyLight: '#12305a', navyDeep: '#081c35', navyMid: '#1a3a6e',
  gold: '#C5960C', goldL: '#F0B429', goldDim: '#a37d0a',
  warmWhite: '#FDFCFA', offWhite: '#f0f3f8', cream: '#F5F1EC',
  muted: '#6b7c93', ink: '#1a2942',
  green: '#16a34a', greenL: '#4ade80',
  border: 'rgba(11,37,69,0.07)',
}

const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"

/* ── Helpers ─────────────────────────────────────── */
function useOnScreen(ref, threshold = 0.12) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return vis
}

function fade(vis, delay = 0) {
  return {
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(32px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  }
}

function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const vis = useOnScreen(ref)
  useEffect(() => {
    if (!vis || !target) return
    let v = 0
    const step = Math.max(1, Math.ceil(target / 60))
    const t = setInterval(() => {
      v = Math.min(v + step, target)
      setVal(v)
      if (v >= target) clearInterval(t)
    }, 24)
    return () => clearInterval(t)
  }, [vis, target])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

const timeAgo = ts => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  return Math.floor(s / 86400) + 'd ago'
}
const initials = n => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

/* ── Main Component ──────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [posts, setPosts]   = useState([])
  const [navSolid, setNav]  = useState(false)

  useEffect(() => {
    fetchPosts()
    const fn = () => setNav(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  async function fetchPosts() {
    const { data } = await supabase.from('community_posts')
      .select('id,content,created_at,likes_count,comments_count,user_id,users:user_id(full_name,identity_verified)')
      .order('created_at', { ascending: false }).limit(4)
    setPosts(data || [])
  }

  /* Section refs */
  const whyRef = useRef(null);   const whyVis  = useOnScreen(whyRef)
  const howRef = useRef(null);   const howVis  = useOnScreen(howRef)
  const orgRef = useRef(null);   const orgVis  = useOnScreen(orgRef)
  const comRef = useRef(null);   const comVis  = useOnScreen(comRef)
  const ctaRef = useRef(null);   const ctaVis  = useOnScreen(ctaRef)

  return (
    <div style={{ fontFamily: sans, color: C.ink, background: C.warmWhite, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; scroll-behavior: smooth; }

        @keyframes float    { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-10px)} }
        @keyframes floatB   { 0%,100%{transform:translateY(-5px)} 50%{transform:translateY(5px)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes ring     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes tickerScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .hero-badge { animation: fadeUp .7s ease .2s both }
        .hero-h1    { animation: fadeUp .7s ease .35s both }
        .hero-sub   { animation: fadeUp .7s ease .5s both }
        .hero-btns  { animation: fadeUp .7s ease .65s both }
        .hero-trust { animation: fadeUp .7s ease .8s both }
        .hero-card  { animation: fadeUp .8s ease .5s both }

        .btn-gold { transition: all .22s; }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(197,150,12,.38) !important; filter: brightness(1.06); }
        .btn-ghost { transition: all .22s; }
        .btn-ghost:hover { background: rgba(255,255,255,.1) !important; transform: translateY(-1px); }
        .card-lift { transition: transform .25s ease, box-shadow .25s ease; }
        .card-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(11,37,69,.12) !important; }
        .nav-a:hover { color: ${C.goldL} !important; }
        .ticker-inner { display: flex; animation: tickerScroll 22s linear infinite; }
        .ticker-inner:hover { animation-play-state: paused; }
        .org-feature:hover .org-icon { background: ${C.gold}22 !important; }
        .step-card:hover .step-num { color: ${C.gold} !important; }

        @media(max-width:900px) {
          .hero-layout      { grid-template-columns: 1fr !important; }
          .why-grid         { grid-template-columns: 1fr !important; }
          .org-layout       { grid-template-columns: 1fr !important; }
          .footer-cols      { grid-template-columns: 1fr 1fr !important; }
          .steps-grid       { grid-template-columns: 1fr !important; }
          .pledge-cards     { grid-template-columns: 1fr !important; }
          .commitments-grid { grid-template-columns: 1fr !important; }
          .hero-h1          { font-size: 38px !important; }
          .section-title    { font-size: 30px !important; }
        }
        @media(max-width:600px) {
          .hero-h1       { font-size: 30px !important; }
          .hero-btns-row { flex-direction: column !important; }
          .hero-btns-row button { width: 100%; }
          .footer-cols   { grid-template-columns: 1fr !important; }
          .trust-row     { flex-wrap: wrap; gap: 16px !important; }
          .section-title { font-size: 26px !important; }
          .stats-ticker  { font-size: 12px !important; }
          .pledge-cards     { grid-template-columns: 1fr !important; }
          .commitments-grid { grid-template-columns: 1fr !important; }
        }
        @media(max-width:600px) {
          section { padding-top: 60px !important; padding-bottom: 60px !important; }
        }
        @media(min-width:901px) {
          .mobile-hide { display: flex !important; }
        }
        @media(max-width:900px) {
          .mobile-hide { display: none !important; }
        }
      `}</style>

      {/* ═══════════ NAV ═══════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        padding: navSolid ? '10px 0' : '18px 0',
        background: navSolid ? 'rgba(8,28,53,0.96)' : 'transparent',
        backdropFilter: navSolid ? 'blur(16px)' : 'none',
        borderBottom: navSolid ? '1px solid rgba(197,150,12,0.12)' : 'none',
        transition: 'all .3s ease',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: font, fontWeight: 700, fontSize: 13, color: '#fff',
              boxShadow: '0 2px 12px rgba(197,150,12,.3)' }}>CV</div>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#fff' }}>
              Civic<span style={{ color: C.goldL }}>Verify</span>
            </span>
          </Link>

          {/* ── Centre links — FAQ added ── */}
          <div className="mobile-hide" style={{ display: 'none', alignItems: 'center', gap: 32 }}>
            {[
              ['How It Works', '/how-it-works'],
              ['FAQ', '/faq'],
              ['Live Polls', '#live-polls'],
              ['Community', '#community'],
              ['For Organizations', '#for-organizations'],
            ].map(([label, href]) => (
              href.startsWith('/') ? (
                <Link key={label} to={href} className="nav-a"
                  style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.72)', textDecoration: 'none', transition: 'color .2s', letterSpacing: '.01em' }}>
                  {label}
                </Link>
              ) : (
                <a key={label} href={href} className="nav-a"
                  style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.72)', textDecoration: 'none', transition: 'color .2s', letterSpacing: '.01em' }}>
                  {label}
                </a>
              )
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {user ? (
              <button className="btn-gold" onClick={() => navigate('/citizen')}
                style={{ padding: '9px 22px', borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(197,150,12,.3)' }}>
                Dashboard
              </button>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => navigate('/login')}
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.18)',
                    background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Sign In
                </button>
                <button className="btn-gold mobile-hide" onClick={() => navigate('/org-signup')}
                  style={{ display: 'none', padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.18)',
                    background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  For Orgs
                </button>
                <button className="btn-gold" onClick={() => navigate('/signup')}
                  style={{ padding: '9px 22px', borderRadius: 10, border: 'none',
                    background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 14px rgba(197,150,12,.32)' }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        background: `linear-gradient(155deg, ${C.navyDeep} 0%, ${C.navy} 45%, ${C.navyMid} 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 80,
      }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: .025,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.6) 1px, transparent 0)',
          backgroundSize: '36px 36px', pointerEvents: 'none' }} />

        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '8%', right: '8%', width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(197,150,12,.1) 0%, transparent 70%)`,
          filter: 'blur(60px)', animation: 'float 9s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '12%', left: '-5%', width: 360, height: 360, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(96,165,250,.07) 0%, transparent 70%)`,
          filter: 'blur(50px)', animation: 'floatB 12s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* Decorative rings top-right */}
        <div style={{ position: 'absolute', top: -80, right: -80, pointerEvents: 'none', opacity: .12 }}>
          <svg width="480" height="480" viewBox="0 0 480 480">
            {[60,100,140,180,220,260].map((r, i) => (
              <circle key={i} cx="240" cy="240" r={r} fill="none"
                stroke={i % 2 === 0 ? C.gold : '#60a5fa'} strokeWidth=".8"
                style={{ opacity: 1 - i * .12, animation: `pulse ${3 + i * .6}s ease-in-out infinite`, animationDelay: i * .3 + 's' }} />
            ))}
          </svg>
        </div>

        {/* Floating particles */}
        {[
          { x: '8%',  y: '20%', c: C.goldL,   s: 4 },
          { x: '18%', y: '75%', c: '#60a5fa',  s: 3 },
          { x: '45%', y: '10%', c: C.gold,     s: 5 },
          { x: '62%', y: '80%', c: '#34d399',  s: 3 },
          { x: '88%', y: '30%', c: '#f472b6',  s: 4 },
          { x: '75%', y: '65%', c: C.goldL,    s: 2 },
        ].map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: p.x, top: p.y,
            width: p.s, height: p.s, borderRadius: '50%', background: p.c, opacity: .55,
            animation: `float ${2.5 + i * .4}s ease-in-out infinite`, animationDelay: i * .18 + 's',
            pointerEvents: 'none' }} />
        ))}

        {/* Main hero content */}
        <div className="hero-layout" style={{
          maxWidth: 1280, margin: '0 auto', padding: '60px 28px 80px',
          position: 'relative', zIndex: 2,
          display: 'grid', gridTemplateColumns: '1fr 440px', gap: 64, alignItems: 'center',
        }}>
          {/* LEFT */}
          <div>
            <div className="hero-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
              padding: '6px 16px', borderRadius: 30,
              background: 'rgba(197,150,12,.12)', border: '1px solid rgba(197,150,12,.28)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.goldL, letterSpacing: '.04em' }}>
                🔒 Identity-verified · Zero bots · Your data never sold
              </span>
            </div>

            <h1 className="hero-h1" style={{
              fontFamily: font, fontWeight: 700, fontSize: 58, lineHeight: 1.12,
              color: '#fff', marginBottom: 22, letterSpacing: '-.025em',
            }}>
              Your Voice,{' '}
              <span style={{ color: C.goldL, fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
                Verified
                <svg viewBox="0 0 220 14" style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 14, overflow: 'visible' }}>
                  <path d="M2 9 Q55 2 110 7 Q165 12 218 5" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
                </svg>
              </span>
            </h1>

            <p className="hero-sub" style={{
              fontSize: 17.5, lineHeight: 1.72, color: 'rgba(255,255,255,.58)',
              maxWidth: 520, marginBottom: 38, fontWeight: 400,
            }}>
              The civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact on policy.
            </p>

            <div className="hero-btns hero-btns-row" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <button className="btn-gold" onClick={() => navigate('/signup')}
                style={{ padding: '15px 34px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 22px rgba(197,150,12,.32)',
                  display: 'flex', alignItems: 'center', gap: 8 }}>
                Get Started Free <span style={{ fontSize: 18 }}>→</span>
              </button>
              <button className="btn-ghost" onClick={() => document.getElementById('live-polls')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '15px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)',
                  background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.85)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', gap: 8 }}>
                View Live Polls <span>↓</span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="trust-row" style={{ display: 'flex', gap: 28 }}>
              {[
                { icon: '🛡️', text: 'Identity Verified' },
                { icon: '👤', text: 'Real Citizens Only' },
                { icon: '🔒', text: 'End-to-End Encrypted' },
              ].map(t => (
                <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 16, opacity: .75 }}>{t.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.38)', fontWeight: 500 }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Live Activity Card */}
          <div className="hero-card" style={{
            background: 'rgba(255,255,255,.05)', borderRadius: 22,
            border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(24px)',
            overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.25)',
          }}>
            {/* Card header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,.07)',
              background: 'rgba(255,255,255,.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Live Platform Activity</span>
              </div>
            </div>

            <div style={{ padding: '22px 22px 0' }}>
              {/* 4 stat boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: '🔒', label: 'ID Verified',    desc: 'One person, one voice',   color: C.goldL },
                  { icon: '🚫', label: 'No Data Sales',  desc: 'Ever. Absolute rule.',     color: C.green },
                  { icon: '👁️', label: 'Results Only',   desc: 'Orgs see aggregates only', color: '#818cf8' },
                  { icon: '🗑️', label: 'Delete Anytime', desc: 'Full control, always',     color: '#f472b6' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px 16px', borderRadius: 14,
                    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <p style={{ fontSize: 22, margin: '0 0 4px' }}>{s.icon}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.label}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,.32)', margin: 0 }}>{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16, paddingBottom: 8 }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Recent Activity</p>
                {posts.length > 0 ? posts.slice(0, 2).map(p => (
                  <div key={p.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
                      border: `1.5px solid rgba(197,150,12,.3)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: C.goldL }}>
                      {initials(p.users?.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.52)', margin: '0 0 2px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</p>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)' }}>{timeAgo(p.created_at)}</span>
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,.22)', fontStyle: 'italic', marginBottom: 12 }}>Community launching soon</p>
                )}
              </div>
            </div>

            {/* Card CTA */}
            <div style={{ padding: '0 22px 22px' }}>
              <button className="btn-gold" onClick={() => navigate('/signup')}
                style={{ width: '100%', padding: '13px', borderRadius: 12,
                  border: '1px solid rgba(197,150,12,.3)', background: 'rgba(197,150,12,.1)',
                  color: C.goldL, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                Join the Movement →
              </button>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 72" style={{ position: 'absolute', bottom: -1, left: 0, width: '100%' }} preserveAspectRatio="none">
          <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,12 1440,28 L1440,72 L0,72 Z" fill={C.warmWhite} />
        </svg>
      </section>

      {/* ═══════════ LIVE STATS TICKER ═══════════ */}
      <div style={{ background: C.navy, borderBottom: `3px solid ${C.gold}`, overflow: 'hidden', padding: '10px 0' }}>
        <div className="ticker-inner" style={{ whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, rep) => (
            <span key={rep} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {[
                { icon: "🛡️", text: "Identity Verified Citizens" },
                { icon: "📋", text: "Civic Surveys Powered" },
                { icon: "✅", text: "100% Verified Responses" },
                { icon: '🔒', text: '100% Bot-Free Platform' },
                { icon: '🚫', text: 'Zero Data Sales. Ever.' },
                { icon: '🏛️', text: 'Results Only — No Raw Data Access' },
                { icon: '🌐', text: 'Identity Verified, Never Stored' },
                { icon: '📊', text: 'Aggregated Results Only' },
                { icon: '⚖️', text: 'Independently Audited Privacy' },
              ].map((item, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 28px' }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span className="stats-ticker" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.7)', letterSpacing: '.02em' }}>{item.text}</span>
                  <span style={{ color: C.gold, fontSize: 10, padding: '0 4px' }}>◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════ WHY THIS MATTERS ═══════════ */}
      <section id="how-it-works" ref={whyRef} style={{ padding: '100px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64, ...fade(whyVis) }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>Why This Matters</span>
            <h2 className="section-title" style={{ fontFamily: font, fontSize: 40, fontWeight: 700, color: C.navy, lineHeight: 1.2, marginBottom: 16 }}>Traditional Polls Are Broken</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
              When was the last time someone asked your opinion on a policy change? For most people, the answer is never.
            </p>
          </div>

          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, ...fade(whyVis, .2) }}>
            {/* Problem card */}
            <div style={{ padding: '40px 36px', borderRadius: 22, background: '#fff',
              border: '1px solid rgba(220,38,38,.12)',
              boxShadow: '0 4px 20px rgba(11,37,69,.04)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, fontSize: 22 }}>✕</div>
              <h3 style={{ fontFamily: font, fontSize: 21, fontWeight: 700, color: C.navy, marginBottom: 20 }}>The Problem</h3>
              {[
                'Bots & fake accounts skew every result',
                'Tiny sample sizes miss whole communities',
                'No verification that respondents are real citizens',
                'Results twisted to serve political agendas',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fee2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#dc2626', flexShrink: 0, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Solution card */}
            <div className="card-lift" style={{ padding: '40px 36px', borderRadius: 22, background: '#fff',
              border: `1.5px solid rgba(197,150,12,.22)`,
              boxShadow: `0 4px 28px rgba(197,150,12,.07)` }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `rgba(197,150,12,.1)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, fontSize: 22 }}>🛡️</div>
              <h3 style={{ fontFamily: font, fontSize: 21, fontWeight: 700, color: C.navy, marginBottom: 20 }}>CivicVerify</h3>
              {[
                { t: 'One Person, One Verified Vote',    d: 'Identity verification stops all manipulation' },
                { t: 'Community-Targeted Polls',         d: 'Your local issues get the right local voices' },
                { t: 'Transparent Auditable Results',    d: "What citizens say is exactly what decision-makers see" },
                { t: 'Shape Policy Between Elections',   d: 'Civic participation every day, not every 4 years' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: `rgba(197,150,12,.12)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: C.gold, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</span>
                  <div>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>{item.t}</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ QUOTE BANNER ═══════════ */}
      <section style={{ padding: '70px 28px', background: `linear-gradient(135deg,${C.navyDeep},${C.navyMid})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,150,12,.07) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 40, color: C.gold, opacity: .35, fontFamily: font, lineHeight: 1, marginBottom: 8 }}>"</div>
          <p style={{ fontFamily: font, fontSize: 23, fontWeight: 400, fontStyle: 'italic',
            color: 'rgba(255,255,255,.88)', lineHeight: 1.65, marginBottom: 14 }}>
            The strength of democracy depends on the participation of its citizens.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.32)', fontWeight: 500, marginBottom: 28 }}>Make your verified voice count.</p>
          <button className="btn-gold" onClick={() => navigate('/signup')}
            style={{ padding: '13px 32px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(197,150,12,.3)' }}>
            Join CivicVerify →
          </button>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section ref={howRef} style={{ padding: '100px 28px', background: C.offWhite }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64, ...fade(howVis) }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>How It Works</span>
            <h2 className="section-title" style={{ fontFamily: font, fontSize: 40, fontWeight: 700, color: C.navy, lineHeight: 1.2 }}>Three Steps to Civic Impact</h2>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { num: '01', icon: '🛡️', title: 'Sign Up & Verify', desc: 'Create your account and verify your identity once with a quick ID scan. Completely private.', bg: '#dbeafe', color: '#2563eb' },
              { num: '02', icon: '✅', title: 'Vote on Live Polls', desc: 'Vote directly on civic polls matched to your community. Discuss with fellow verified citizens.', bg: '#d1fae5', color: '#16a34a' },
              { num: '03', icon: '📊', title: 'See Real Impact',   desc: "Watch live results, see your community's voice, and track how verified opinions shape decisions.", bg: '#fef3c7', color: C.goldDim },
            ].map((step, i) => (
              <div key={step.num} className="card-lift step-card" style={{
                background: '#fff', borderRadius: 22, padding: '38px 30px',
                border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
                boxShadow: '0 2px 14px rgba(11,37,69,.04)', ...fade(howVis, .15 * (i + 1)),
              }}>
                <span className="step-num" style={{ position: 'absolute', top: 18, right: 22,
                  fontFamily: font, fontSize: 52, fontWeight: 700, color: `rgba(11,37,69,.05)`, lineHeight: 1,
                  transition: 'color .3s' }}>{step.num}</span>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: step.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, fontSize: 26 }}>
                  {step.icon}
                </div>
                {/* Coloured accent bar */}
                <div style={{ width: 36, height: 3, borderRadius: 2, background: step.color, marginBottom: 16 }} />
                <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.72 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ LIVE POLLS ═══════════ */}
      <section id="live-polls" style={{ padding: '100px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>Vote Now</span>
          <h2 className="section-title" style={{ fontFamily: font, fontSize: 40, fontWeight: 700, color: C.navy, marginBottom: 12, lineHeight: 1.2 }}>Live Civic Polls</h2>
          <p style={{ fontSize: 15.5, color: C.muted, marginBottom: 44, lineHeight: 1.7 }}>Vote, comment, and share — right here, right now</p>

          <div style={{ background: C.offWhite, borderRadius: 24, padding: '64px 40px', border: `1px solid ${C.border}` }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `rgba(197,150,12,.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28 }}>🛡️</div>
            <p style={{ fontFamily: font, fontSize: 19, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No active polls right now</p>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>Check back soon — or sign up to get notified when polls go live</p>
            <button className="btn-gold" onClick={() => navigate('/signup')}
              style={{ padding: '12px 30px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(197,150,12,.28)' }}>
              Sign Up for Alerts
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ COMMUNITY ═══════════ */}
      <section id="community" ref={comRef} style={{ padding: '100px 28px', background: C.offWhite }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48, ...fade(comVis) }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>Community Forum</span>
            <h2 className="section-title" style={{ fontFamily: font, fontSize: 40, fontWeight: 700, color: C.navy, marginBottom: 12, lineHeight: 1.2 }}>Civic Discussions</h2>
            <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.7 }}>Share perspectives with fellow verified citizens. Best posts rise to the top.</p>
          </div>

          {/* Compose box */}
          <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`,
            padding: '22px 26px', marginBottom: 18, boxShadow: '0 2px 12px rgba(11,37,69,.03)',
            ...fade(comVis, .2) }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.navy, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: font, fontSize: 12, fontWeight: 700, color: C.goldL }}>
                {user ? initials(user?.user_metadata?.full_name) : 'K'}
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: 14,
                background: C.offWhite, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                onClick={() => navigate(user ? '/citizen/community' : '/signup')}>
                <span style={{ fontSize: 14, color: C.muted }}>What civic issue is on your mind?</span>
              </div>
              <button className="btn-gold" onClick={() => navigate(user ? '/citizen/community' : '/signup')}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: `rgba(197,150,12,.12)`, color: C.gold,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Discuss
              </button>
            </div>
          </div>

          {/* Posts */}
          <div style={{ display: 'grid', gap: 14, ...fade(comVis, .3) }}>
            {posts.length > 0 ? posts.map(p => (
              <div key={p.id} className="card-lift" onClick={() => navigate(user ? '/citizen/community' : '/signup')}
                style={{ background: '#fff', borderRadius: 16, padding: '20px 24px',
                  border: `1px solid ${C.border}`, cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(11,37,69,.03)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg,${C.navy},${C.navyLight})`,
                    border: `2px solid rgba(197,150,12,.3)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11.5, fontWeight: 700, color: C.goldL }}>
                    {initials(p.users?.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{p.users?.full_name || 'Citizen'}</span>
                      {p.users?.identity_verified && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: C.gold,
                          background: 'rgba(197,150,12,.1)', padding: '2px 8px', borderRadius: 10 }}>VERIFIED</span>
                      )}
                      <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>{timeAgo(p.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, margin: '0 0 10px' }}>{p.content}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: C.muted }}>
                      <span>👍 {p.likes_count || 0}</span>
                      <span>💬 {p.comments_count || 0}</span>
                      <span style={{ marginLeft: 'auto', color: C.gold, fontWeight: 700 }}>Join Discussion →</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: C.muted, fontSize: 14,
                background: '#fff', borderRadius: 16, border: `1px solid ${C.border}` }}>
                Be the first to start a discussion!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOR ORGANIZATIONS ═══════════ */}
      <section id="for-organizations" ref={orgRef} style={{ padding: '100px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div className="org-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

            {/* Left: copy */}
            <div style={fade(orgVis)}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>For Organizations</span>
              <h2 className="section-title" style={{ fontFamily: font, fontSize: 38, fontWeight: 700, color: C.navy, marginBottom: 18, lineHeight: 1.25 }}>
                Reach Verified Citizens.<br />Get Trusted Data.
              </h2>
              <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.75, marginBottom: 36 }}>
                Whether you're a government agency, nonprofit, or research institution — CivicVerify gives you identity-verified respondents with precise demographic targeting.
              </p>

              <div style={{ display: 'grid', gap: 18, marginBottom: 36 }}>
                {[
                  { icon: '🎯', title: 'Targeted Surveys',      desc: 'Commission surveys targeted by age, location, and demographics — without ever seeing who responded' },
                  { icon: '📊', title: 'Real-Time Results',      desc: 'View aggregated results as they come in — never individual responses or personal details' },
                  { icon: '✅', title: 'Verified Respondents',   desc: 'Every result backed by identity-verified citizens — no bots, no duplicates, no fake accounts' },
                  { icon: '🔒', title: 'Results Only, Always',   desc: 'You receive statistical outcomes only. Raw responses and citizen identities are never accessible to anyone' },
                ].map((f, i) => (
                  <div key={f.title} className="org-feature" style={{ display: 'flex', gap: 16, ...fade(orgVis, .1 * (i + 1)) }}>
                    <div className="org-icon" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `rgba(11,37,69,.06)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, transition: 'background .2s' }}>{f.icon}</div>
                    <div>
                      <p style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>{f.title}</p>
                      <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-gold" onClick={() => navigate('/org-signup')}
                style={{ padding: '14px 32px', borderRadius: 12, border: 'none',
                  background: C.navy, color: C.goldL,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(11,37,69,.18)' }}>
                Register Your Organization →
              </button>
            </div>

            {/* Right: dashboard mockup */}
            <div style={fade(orgVis, .3)}>
              <div style={{ background: `linear-gradient(145deg,${C.navyDeep},${C.navyMid})`,
                borderRadius: 22, padding: 28, boxShadow: '0 24px 64px rgba(11,37,69,.22)',
                border: '1px solid rgba(255,255,255,.05)' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.12em', margin: 0 }}>Organization Dashboard</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.green,
                    background: 'rgba(22,163,74,.12)', padding: '3px 10px', borderRadius: 10 }}>● Live</span>
                </div>

                {/* Bar chart */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>Survey Responses</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>+14% this week</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 70 }}>
                    {[30,52,38,65,42,70,55,82,48,75,62,90].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: h + '%', borderRadius: '3px 3px 0 0',
                        background: `linear-gradient(to top,${C.goldDim},${C.goldL})`,
                        opacity: .65 + i * .028 }} />
                    ))}
                  </div>
                </div>

                {/* Metric boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  {[
                    { label: 'Verified Rate',        val: '100%', color: C.goldL },
                    { label: 'Avg Response Time',     val: '<30s',  color: C.green },
                    { label: 'Completion Rate',       val: '94%',  color: '#60a5fa' },
                    { label: 'Demographics Covered',  val: '12+',  color: '#f472b6' },
                  ].map(m => (
                    <div key={m.label} style={{ padding: '14px', borderRadius: 12,
                      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                      <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: m.color, margin: '0 0 3px' }}>{m.val}</p>
                      <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Trust badge */}
                <div style={{ padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.2)',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🔒</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.7)', margin: 0 }}>
                    Results only · No identity data ever accessible
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRIVACY PLEDGE ═══════════ */}
      <section style={{ padding: '100px 28px', background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 60%,${C.navyMid} 100%)`, position: 'relative', overflow: 'hidden' }}>
        {/* background rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', opacity: .06 }}>
          <svg width="800" height="800" viewBox="0 0 800 800">
            {[80,150,220,290,360].map((r, i) => (
              <circle key={i} cx="400" cy="400" r={r} fill="none" stroke={C.gold} strokeWidth=".8"
                style={{ animation: `pulse ${3 + i * .8}s ease-in-out infinite`, animationDelay: i * .25 + 's' }} />
            ))}
          </svg>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20,
              padding: '8px 20px', borderRadius: 30,
              background: 'rgba(197,150,12,.1)', border: '1px solid rgba(197,150,12,.25)' }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>Our Privacy Pledge</span>
            </div>
            <h2 style={{ fontFamily: font, fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 18 }}>
              Your Data Belongs to You.<br />
              <span style={{ color: C.goldL, fontStyle: 'italic' }}>No Exceptions. No Compromise.</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.52)', maxWidth: 600, margin: '0 auto', lineHeight: 1.75 }}>
              We built CivicVerify on one non-negotiable principle: citizen data is never for sale, never for access, never shared — with anyone, ever.
            </p>
          </div>

          {/* 3 big pledge cards */}
          <div className="pledge-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 48 }}>
            {[
              {
                icon: '👁️',
                title: 'No One Sees Your Data',
                body: 'Not us. Not organisations. Not governments. Not partners. Your individual responses, identity, and participation are cryptographically isolated. Nobody can access them — not even CivicVerify staff.',
                color: C.goldL,
                bg: 'rgba(197,150,12,.08)',
                border: 'rgba(197,150,12,.2)',
              },
              {
                icon: '📊',
                title: 'Organisations Get Results Only',
                body: 'When an organisation commissions a survey, they receive one thing: statistical aggregated outcomes. Zero access to who responded, how individuals answered, or any personal information whatsoever.',
                color: '#60a5fa',
                bg: 'rgba(96,165,250,.06)',
                border: 'rgba(96,165,250,.18)',
              },
              {
                icon: '🔐',
                title: 'Identity Verified, Never Stored',
                body: "Your identity verification is used once to confirm you're a real citizen. After that, it's discarded. We don't retain ID documents. We never link your civic responses to your real-world identity.",
                color: '#34d399',
                bg: 'rgba(52,211,153,.06)',
                border: 'rgba(52,211,153,.18)',
              },
            ].map((card, i) => (
              <div key={i} style={{
                padding: '36px 30px', borderRadius: 22,
                background: card.bg, border: `1px solid ${card.border}`,
                backdropFilter: 'blur(12px)',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 16,
                  background: `rgba(255,255,255,.06)`, border: `1px solid ${card.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 22, fontSize: 24 }}>{card.icon}</div>
                <h3 style={{ fontFamily: font, fontSize: 19, fontWeight: 700, color: card.color, marginBottom: 14, lineHeight: 1.3 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.78, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          {/* Iron-clad statements row */}
          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 20, padding: '32px 36px',
            border: '1px solid rgba(255,255,255,.08)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase',
              letterSpacing: '.16em', marginBottom: 24, textAlign: 'center' }}>Our Absolute Commitments</p>
            <div className="commitments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {[
                '🚫 We will never sell citizen data to any third party, ever',
                '🚫 Organisations cannot access individual responses — only aggregated results',
                '🚫 No government or authority receives citizen data without a lawful court order',
                '🚫 We do not use citizen responses for advertising or profiling',
                '✅ All data is encrypted in transit and at rest using AES-256',
                '✅ Identity documents are verified and immediately discarded — not stored',
                '✅ Citizens can delete their account and all associated data at any time',
                '✅ Independent audits confirm our zero-access policy is technically enforced',
              ].map((stmt, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 16px', borderRadius: 12,
                  background: stmt.startsWith('✅') ? 'rgba(52,211,153,.05)' : 'rgba(239,68,68,.04)',
                  border: `1px solid ${stmt.startsWith('✅') ? 'rgba(52,211,153,.12)' : 'rgba(239,68,68,.1)'}` }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{stmt.slice(0, 2)}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,.62)', lineHeight: 1.55 }}>{stmt.slice(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section ref={ctaRef} style={{
        padding: '110px 28px',
        background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 50%,${C.navyMid} 100%)`,
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,150,12,.07) 0%, transparent 70%)',
          filter: 'blur(48px)', pointerEvents: 'none' }} />
        {/* Rings */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: .08 }}>
          <svg width="700" height="700" viewBox="0 0 700 700">
            {[80,140,200,260].map((r, i) => (
              <circle key={i} cx="350" cy="350" r={r} fill="none" stroke={C.gold} strokeWidth=".8"
                style={{ animation: `pulse ${3+i*.8}s ease-in-out infinite`, animationDelay: i*.3+'s' }} />
            ))}
          </svg>
        </div>

        <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative', zIndex: 2, ...fade(ctaVis) }}>
          <div style={{ width: 68, height: 68, borderRadius: 18, margin: '0 auto 26px',
            background: 'rgba(197,150,12,.12)', border: '1px solid rgba(197,150,12,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🛡️</div>

          <h2 style={{ fontFamily: font, fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.25 }}>
            Ready to Make Your<br />Voice Count?
          </h2>
          <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,.48)', marginBottom: 40, lineHeight: 1.72 }}>
            Join a growing community of verified citizens shaping the future of civic engagement.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <button className="btn-gold" onClick={() => navigate('/signup')}
              style={{ padding: '16px 38px', borderRadius: 14, border: 'none',
                background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 6px 28px rgba(197,150,12,.32)' }}>
              Create Free Account →
            </button>
            <button className="btn-ghost" onClick={() => navigate('/login')}
              style={{ padding: '16px 32px', borderRadius: 14, border: '1px solid rgba(255,255,255,.15)',
                background: 'transparent', color: 'rgba(255,255,255,.8)',
                fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
            <button className="btn-ghost" onClick={() => navigate('/org-signup')}
              style={{ padding: '16px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)',
                background: 'transparent', color: 'rgba(255,255,255,.55)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              🏛️ Register Organization
            </button>
          </div>

          {/* Mini trust row */}
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🔒 Free to join', '✅ Identity verified', '🛡️ Privacy first'].map(t => (
              <span key={t} style={{ fontSize: 13, color: 'rgba(255,255,255,.28)', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ background: C.navyDeep, borderTop: '3px solid rgba(197,150,12,.2)' }}>
        {/* Gold top strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg,${C.gold},${C.goldL},${C.gold})` }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 28px 40px' }}>
          <div className="footer-cols" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>

            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: font, fontSize: 13, fontWeight: 700, color: '#fff',
                  boxShadow: '0 2px 10px rgba(197,150,12,.25)' }}>CV</div>
                <span style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#fff' }}>
                  Civic<span style={{ color: C.goldL }}>Verify</span>
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.32)', lineHeight: 1.75, maxWidth: 280, marginBottom: 24 }}>
                The trusted platform for verified civic engagement. Every voice matters when it's real.
              </p>
              {/* Trust badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['🛡️ Identity Verified Network', '🔒 Privacy by Design', '⚖️ Editorial Integrity'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform links */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 18 }}>Platform</p>
              {[
                ['Sign Up', '/signup'],
                ['Sign In', '/login'],
                ['Live Polls', '#live-polls'],
                ['Community', '#community'],
                ['For Organizations', '/org-signup'],
              ].map(([label, href]) => (
                <a key={label} href={href}
                  style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,.32)', textDecoration: 'none', marginBottom: 11, transition: 'color .15s' }}
                  onMouseEnter={e => { e.target.style.color = C.goldL }}
                  onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,.32)' }}>
                  {label}
                </a>
              ))}
            </div>

            {/* ── Company links — How It Works + FAQ added ── */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 18 }}>Company</p>
              {[
                { label: 'About',            path: '/about' },
                { label: 'How It Works',     path: '/how-it-works' },
                { label: 'FAQ',              path: '/faq' },
                { label: 'Privacy Policy',   path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Contact',          path: '/contact' },
              ].map(l => (
                <span key={l.label}
                  onClick={() => navigate(l.path)}
                  style={{ display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,.32)', textDecoration: 'none', marginBottom: 11, transition: 'color .15s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.target.style.color = C.goldL }}
                  onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,.32)' }}>
                  {l.label}
                </span>
              ))}
            </div>

            {/* CTA column */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 18 }}>Get Involved</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.28)', lineHeight: 1.7, marginBottom: 18 }}>
                Your civic voice matters. Join thousands of verified citizens making a difference.
              </p>
              <button className="btn-gold" onClick={() => navigate('/signup')}
                style={{ width: '100%', padding: '11px 20px', borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(197,150,12,.28)', marginBottom: 10 }}>
                Join Free →
              </button>
              <button className="btn-ghost" onClick={() => navigate('/org-signup')}
                style={{ width: '100%', padding: '11px 20px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,.12)', background: 'transparent',
                  color: 'rgba(255,255,255,.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🏛️ Organizations
              </button>
            </div>
          </div>

          {/* ── Bottom bar — FAQ added ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.18)' }}>© 2026 CivicVerify. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Privacy', path: '/privacy' },
                { label: 'Terms',   path: '/terms' },
                { label: 'FAQ',     path: '/faq' },
              ].map(l => (
                <span key={l.label}
                  onClick={() => navigate(l.path)}
                  style={{ fontSize: 12.5, color: 'rgba(255,255,255,.18)', textDecoration: 'none', transition: 'color .15s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.target.style.color = C.goldL }}
                  onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,.18)' }}>
                  {l.label}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.12)' }}>Built with trust in mind.</span>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  )
}
