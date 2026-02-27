import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const C = {
  navy: '#0B2545', navyLight: '#12305a', navyDark: '#081c35',
  gold: '#C5960C', goldLight: '#d4ab2f', goldDim: '#a37d0a',
  cream: '#F5F1EC', warmWhite: '#FDFCFA', offWhite: '#f8f6f3',
  muted: '#6b7c93', ink: '#1a2942',
  greenSoft: '#16a34a',
  border: 'rgba(11,37,69,0.06)',
}

/* ── useOnScreen (intersection observer for scroll reveals) ── */
function useOnScreen(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return visible
}

/* ── Animated counter ── */
function Counter({ target, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const visible = useOnScreen(ref)
  useEffect(() => {
    if (!visible || target <= 0) return
    let start = 0
    const step = Math.max(1, Math.ceil(target / (duration / 30)))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(start)
    }, 30)
    return () => clearInterval(timer)
  }, [visible, target])
  return <span ref={ref}>{val}{suffix}</span>
}

/* ── SVG icons ── */
const Shield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ citizens: 0, polls: 0, votes: 0, surveys: 0 })
  const [posts, setPosts] = useState([])
  const [navSolid, setNavSolid] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchPosts()
    const onScroll = () => setNavSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function fetchStats() {
    const [u, p, v, s] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'citizen'),
      supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('responses').select('id', { count: 'exact', head: true }),
      supabase.from('surveys').select('id', { count: 'exact', head: true }),
    ])
    setStats({ citizens: u.count || 0, polls: p.count || 0, votes: v.count || 0, surveys: s.count || 0 })
  }

  async function fetchPosts() {
    const { data } = await supabase.from('community_posts')
      .select('id, content, created_at, likes_count, comments_count, user_id, users:user_id(full_name, identity_verified)')
      .order('created_at', { ascending: false }).limit(4)
    setPosts(data || [])
  }

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (s < 3600) return Math.floor(s / 60) + 'm ago'
    if (s < 86400) return Math.floor(s / 3600) + 'h ago'
    return Math.floor(s / 86400) + 'd ago'
  }

  const initials = (n) => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  /* ── Section refs for scroll reveal ── */
  const problemRef = useRef(null)
  const problemVis = useOnScreen(problemRef)
  const stepsRef = useRef(null)
  const stepsVis = useOnScreen(stepsRef)
  const forOrgRef = useRef(null)
  const forOrgVis = useOnScreen(forOrgRef)
  const communityRef = useRef(null)
  const communityVis = useOnScreen(communityRef)
  const ctaRef = useRef(null)
  const ctaVis = useOnScreen(ctaRef)

  const sectionFade = (visible, delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(40px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  })

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: C.ink, background: C.warmWhite, overflowX: 'hidden', maxWidth: '100vw' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; max-width: 100vw; }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: none } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: none } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: none } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        .hero-badge { animation: fadeUp 0.8s ease 0.2s both }
        .hero-h1 { animation: fadeUp 0.8s ease 0.4s both }
        .hero-sub { animation: fadeUp 0.8s ease 0.6s both }
        .hero-btns { animation: fadeUp 0.8s ease 0.8s both }
        .hero-trust { animation: fadeUp 0.8s ease 1s both }
        .hero-card { animation: scaleIn 0.8s ease 0.6s both }
        .nav-link:hover { color: ${C.gold} !important }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(197,150,12,0.35) !important }
        .btn-secondary:hover { background: ${C.cream} !important; transform: translateY(-1px) }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(11,37,69,0.1) !important }
        .hero-grid { display: grid; grid-template-columns: 1fr 420px; gap: 60; align-items: center; }
        .problem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .org-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
        .cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-mobile-hide { display: flex; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .problem-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .org-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .hero-h1 { font-size: 34px !important; }
          .hero-sub { font-size: 15px !important; }
          .nav-mobile-hide { display: none !important; }
          .section-heading { font-size: 28px !important; }
          .quote-text { font-size: 18px !important; }
          .cta-heading { font-size: 28px !important; }
        }
        @media (max-width: 480px) {
          .hero-h1 { font-size: 28px !important; }
          .section-heading { font-size: 24px !important; }
          .hero-btns { flex-direction: column; }
          .hero-btns button { width: 100%; justify-content: center; }
          .cta-btns { flex-direction: column; align-items: center; }
          .cta-btns button { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* ═══════════════ NAV ═══════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        padding: navSolid ? '12px 0' : '18px 0',
        background: navSolid ? 'rgba(11,37,69,0.97)' : 'transparent',
        backdropFilter: navSolid ? 'blur(12px)' : 'none',
        boxShadow: navSolid ? '0 2px 20px rgba(11,37,69,0.15)' : 'none',
        transition: 'all 0.35s ease',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, ' + C.gold + ' 0%, ' + C.goldDim + ' 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 14, color: '#fff' }}>CV</div>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 18, color: '#fff' }}>
              Civic<span style={{ color: C.gold }}>Verify</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Nav links - hidden on mobile */}
            <div className="nav-mobile-hide" style={{ alignItems: 'center', gap: 28 }}>
              {['How It Works', 'Live Polls', 'Community', 'For Organizations'].map((item) => (
                <a key={item} href={'#' + item.toLowerCase().replace(/ /g, '-')} className="nav-link"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 0.2s', letterSpacing: '0.01em' }}>
                  {item}
                </a>
              ))}
              <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            </div>
            {/* Auth buttons - always visible */}
            {user ? (
              <button onClick={() => navigate('/citizen')} className="btn-primary"
                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(197,150,12,0.25)', whiteSpace: 'nowrap' }}>
                Dashboard
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => navigate('/login')} className="btn-secondary"
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  Sign In
                </button>
                <button onClick={() => navigate('/signup')} className="btn-primary nav-mobile-hide"
                  style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(197,150,12,0.25)', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section style={{
        position: 'relative', minHeight: '100vh', overflow: 'hidden',
        background: 'linear-gradient(165deg, ' + C.navyDark + ' 0%, ' + C.navy + ' 40%, ' + C.navyLight + ' 100%)',
        display: 'flex', alignItems: 'center', paddingTop: 80,
      }}>
        {/* Subtle grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        {/* Gradient orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,150,12,0.08) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '0%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,150,12,0.05) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite 2s', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 80px', position: 'relative', zIndex: 2 }}>
          {/* Left */}
          <div>
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, padding: '6px 16px', borderRadius: 30, background: 'rgba(197,150,12,0.12)', border: '1px solid rgba(197,150,12,0.25)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.greenSoft, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.gold, letterSpacing: '0.03em' }}>
                {stats.polls} live polls · {stats.citizens} verified citizens
              </span>
            </div>

            <h1 className="hero-h1" style={{
              fontFamily: "'Libre Baskerville', serif", fontWeight: 700,
              fontSize: 54, lineHeight: 1.15, color: '#fff', marginBottom: 22,
              letterSpacing: '-0.02em',
            }}>
              Your Voice,{' '}
              <span style={{
                color: C.gold, fontStyle: 'italic', position: 'relative',
                display: 'inline-block',
              }}>
                Verified
                <svg viewBox="0 0 200 12" style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 12, overflow: 'visible' }}>
                  <path d="M2 8 Q50 2 100 6 Q150 10 198 4" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                </svg>
              </span>
            </h1>

            <p className="hero-sub" style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', maxWidth: 520, marginBottom: 36, fontWeight: 400 }}>
              The civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact on policy.
            </p>

            <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <button onClick={() => navigate('/signup')} className="btn-primary"
                style={{ padding: '15px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, ' + C.gold + ' 0%, ' + C.goldDim + ' 100%)', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 20px rgba(197,150,12,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Get Started Free <span style={{ fontSize: 18 }}>→</span>
              </button>
              <button onClick={() => document.getElementById('live-polls')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary"
                style={{ padding: '15px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                View Live Polls <span style={{ fontSize: 16 }}>↓</span>
              </button>
            </div>

            <div className="hero-trust" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[
                { icon: '🛡️', text: 'Identity Verified' },
                { icon: '👤', text: 'Real Citizens Only' },
                { icon: '🔒', text: 'End-to-End Encrypted' },
              ].map((t) => (
                <div key={t.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, opacity: 0.7 }}>{t.icon}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.02em' }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Live Activity Card */}
          <div className="hero-card" style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.greenSoft, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live Platform Activity</span>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {[
                  { val: stats.citizens, label: 'Citizens', color: C.gold },
                  { val: stats.polls, label: 'Live Polls', color: C.greenSoft },
                  { val: stats.votes, label: 'Total Votes', color: '#818cf8' },
                  { val: stats.surveys, label: 'Surveys Created', color: '#f472b6' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>
                      <Counter target={s.val} />
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Recent Activity</p>
                {posts.length > 0 ? posts.slice(0, 2).map((p) => (
                  <div key={p.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.navy + ', ' + C.navyLight + ')', border: '1.5px solid rgba(197,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                      {initials(p.users?.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content}</p>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(p.created_at)}</span>
                    </div>
                  </div>
                )) : (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Launching soon</p>
                )}
              </div>

              <button onClick={() => navigate('/signup')} className="btn-primary"
                style={{ width: '100%', padding: '13px', marginTop: 8, borderRadius: 12, border: '1px solid rgba(197,150,12,0.3)', background: 'rgba(197,150,12,0.1)', color: C.gold, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                Join the Movement →
              </button>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 80" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%' }}>
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,40 1440,30 L1440,80 L0,80 Z" fill={C.warmWhite} />
        </svg>
      </section>

      {/* ═══════════════ WHY THIS MATTERS ═══════════════ */}
      <section id="how-it-works" ref={problemRef} style={{ padding: '100px 24px', background: C.warmWhite }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60, ...sectionFade(problemVis) }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, display: 'block' }}>Why This Matters</span>
            <h2 className="section-heading" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 38, fontWeight: 700, color: C.navy, marginBottom: 16, lineHeight: 1.25 }}>Traditional Polls Are Broken</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              When was the last time someone asked your opinion on a policy change? For most people, the answer is never.
            </p>
          </div>

          <div className="problem-grid" style={sectionFade(problemVis, 0.2)}>
            {/* Problem */}
            <div style={{ padding: 36, borderRadius: 20, background: '#fff', border: '1px solid ' + C.border, boxShadow: '0 2px 16px rgba(11,37,69,0.03)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 20 }}>✕</div>
              <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 16 }}>The Problem</h3>
              {['Bots & fake accounts manipulate results', 'Tiny sample sizes miss real communities', 'No way to verify if respondents are citizens', 'Results twisted for political agendas'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: '#ef4444', fontSize: 14, marginTop: 2, flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="card-hover" style={{ padding: 36, borderRadius: 20, background: '#fff', border: '1.5px solid ' + C.gold + '22', boxShadow: '0 4px 24px rgba(197,150,12,0.06)', transition: 'all 0.3s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.gold + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: C.gold }}>
                <Shield />
              </div>
              <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 16 }}>CivicVerify</h3>
              {[
                { title: 'One Person, One Verified Vote', desc: 'Identity verification stops manipulation' },
                { title: 'Community-Targeted Polls', desc: 'Your local issues get local voices' },
                { title: 'Transparent Results', desc: 'Auditable — what citizens say is what decision-makers see' },
                { title: 'Civic Responsibility', desc: 'Shape policy between election cycles' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <span style={{ color: C.gold, fontSize: 15, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{t.title}</span>
                    <p style={{ fontSize: 13, color: C.muted, margin: '2px 0 0', lineHeight: 1.5 }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ QUOTE BANNER ═══════════════ */}
      <section style={{ padding: '60px 24px', background: 'linear-gradient(135deg, ' + C.navy + ' 0%, ' + C.navyLight + ' 100%)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p className="quote-text" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 12 }}>
            "The strength of democracy depends on the participation of its citizens."
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Make your verified voice count.</p>
          <button onClick={() => navigate('/signup')} className="btn-primary"
            style={{ marginTop: 24, padding: '13px 30px', borderRadius: 12, border: 'none', background: C.gold, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>
            Join CivicVerify →
          </button>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section ref={stepsRef} style={{ padding: '100px 24px', background: C.offWhite }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60, ...sectionFade(stepsVis) }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, display: 'block' }}>How It Works</span>
            <h2 className="section-heading" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 38, fontWeight: 700, color: C.navy, lineHeight: 1.25 }}>Three Steps to Civic Impact</h2>
          </div>

          <div className="steps-grid">
            {[
              { num: '01', icon: '🛡️', title: 'Sign Up & Verify', desc: 'Create your account and verify your identity with a quick ID scan. One-time, completely private.', color: '#dbeafe' },
              { num: '02', icon: '✅', title: 'Vote on Live Polls', desc: 'Vote directly on civic polls matched to your community. Discuss with fellow verified citizens.', color: '#d1fae5' },
              { num: '03', icon: '📊', title: 'See Real Impact', desc: 'Watch live results, see your community\'s voice, and track how opinions shape real decisions.', color: '#fef3c7' },
            ].map((step, i) => (
              <div key={step.num} className="card-hover" style={{
                background: '#fff', borderRadius: 20, padding: '36px 28px',
                border: '1px solid ' + C.border, position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s', boxShadow: '0 2px 12px rgba(11,37,69,0.03)',
                ...sectionFade(stepsVis, 0.15 * (i + 1)),
              }}>
                <span style={{ position: 'absolute', top: 16, right: 20, fontFamily: "'Libre Baskerville', serif", fontSize: 48, fontWeight: 700, color: C.navy + '06', lineHeight: 1 }}>{step.num}</span>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 24 }}>{step.icon}</div>
                <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ LIVE POLLS ═══════════════ */}
      <section id="live-polls" style={{ padding: '100px 24px', background: C.warmWhite }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, display: 'block' }}>Vote Now</span>
          <h2 className="section-heading" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 38, fontWeight: 700, color: C.navy, marginBottom: 12, lineHeight: 1.25 }}>Live Civic Polls</h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 40, lineHeight: 1.7 }}>Vote, comment, and share — right here, right now</p>

          <div style={{ background: C.offWhite, borderRadius: 24, padding: '60px 40px', border: '1px solid ' + C.border }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.gold + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield />
            </div>
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No active polls right now</p>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>Check back soon or sign up to get notified</p>
            <button onClick={() => navigate('/signup')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: C.gold, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Sign Up</button>
          </div>
        </div>
      </section>

      {/* ═══════════════ COMMUNITY ═══════════════ */}
      <section id="community" ref={communityRef} style={{ padding: '100px 24px', background: C.offWhite }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48, ...sectionFade(communityVis) }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, display: 'block' }}>Community Forum</span>
            <h2 className="section-heading" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 38, fontWeight: 700, color: C.navy, marginBottom: 12, lineHeight: 1.25 }}>Civic Discussions</h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7 }}>Share perspectives and engage with fellow citizens. Best posts rise to the top.</p>
          </div>

          {/* Composer preview */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid ' + C.border, padding: '24px 28px', marginBottom: 20, ...sectionFade(communityVis, 0.2) }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Libre Baskerville', serif", fontSize: 13, fontWeight: 700, color: C.gold }}>
                {user ? initials(user?.user_metadata?.full_name) : 'K'}
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: C.cream, border: '1px solid ' + C.border, cursor: 'pointer' }}
                onClick={() => navigate(user ? '/citizen/community' : '/signup')}>
                <span style={{ fontSize: 14, color: C.muted }}>What civic issue is on your mind?</span>
              </div>
              <button onClick={() => navigate(user ? '/citizen/community' : '/signup')}
                style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: C.gold + '15', color: C.gold, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                Start Discussion
              </button>
            </div>
          </div>

          {/* Posts */}
          <div style={{ display: 'grid', gap: 14, ...sectionFade(communityVis, 0.3) }}>
            {posts.length > 0 ? posts.map((p) => (
              <div key={p.id} className="card-hover" onClick={() => navigate(user ? '/citizen/community' : '/signup')}
                style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid ' + C.border, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.navy + ', ' + C.navyLight + ')', border: '2px solid ' + C.gold + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                    {initials(p.users?.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{p.users?.full_name || 'Citizen'}</span>
                      {p.users?.identity_verified && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: C.gold, background: C.gold + '12', padding: '2px 7px', borderRadius: 10 }}>VERIFIED</span>
                      )}
                      <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>{timeAgo(p.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, margin: '0 0 10px' }}>{p.content}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
                      <span>👍 {p.likes_count || 0}</span>
                      <span>💬 {p.comments_count || 0}</span>
                      <span style={{ marginLeft: 'auto', color: C.gold, fontWeight: 600 }}>Join Discussion →</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 14 }}>
                Be the first to start a discussion!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOR ORGANIZATIONS ═══════════════ */}
      <section id="for-organizations" ref={forOrgRef} style={{ padding: '100px 24px', background: C.warmWhite }}>
        <div className="org-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={sectionFade(forOrgVis)}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, display: 'block' }}>For Organizations</span>
            <h2 className="section-heading" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 36, fontWeight: 700, color: C.navy, marginBottom: 18, lineHeight: 1.3 }}>
              Reach Verified Citizens.<br />Get Trusted Data.
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 32 }}>
              Whether you're a government agency, nonprofit, or research institution — CivicVerify gives you access to identity-verified respondents with demographic targeting.
            </p>

            {[
              { icon: '🎯', title: 'Targeted Surveys', desc: 'Reach citizens by age, location, and demographics' },
              { icon: '📊', title: 'Real-Time Analytics', desc: 'Watch responses come in with live dashboards' },
              { icon: '✅', title: 'Verified Respondents', desc: 'Every response from an identity-verified citizen' },
              { icon: '📄', title: 'Export & Report', desc: 'Download data in CSV/PDF for analysis' },
            ].map((f, i) => (
              <div key={f.title} style={{ display: 'flex', gap: 14, marginBottom: 20, ...sectionFade(forOrgVis, 0.1 * (i + 1)) }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.navy + '08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}

            <button onClick={() => navigate('/signup')} className="btn-primary"
              style={{ marginTop: 12, padding: '14px 30px', borderRadius: 12, border: 'none', background: C.navy, color: C.gold, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 4px 16px rgba(11,37,69,0.15)' }}>
              Register Your Organization →
            </button>
          </div>

          {/* Dashboard preview card */}
          <div style={{ ...sectionFade(forOrgVis, 0.3) }}>
            <div style={{
              background: 'linear-gradient(145deg, ' + C.navy + ' 0%, ' + C.navyLight + ' 100%)',
              borderRadius: 20, padding: 28, boxShadow: '0 20px 60px rgba(11,37,69,0.2)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Organization Dashboard Preview</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Survey Responses</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.greenSoft }}>+12% this week</span>
              </div>
              {/* Chart bars */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginBottom: 20 }}>
                {[35, 55, 42, 68, 45, 72, 60, 85, 50, 78, 65, 90].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: h + '%', borderRadius: 4, background: 'linear-gradient(to top, ' + C.goldDim + ', ' + C.gold + ')', opacity: 0.7 + (i * 0.025), transition: 'height 0.3s' }} />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, fontWeight: 700, color: C.gold, margin: '0 0 2px' }}>100%</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Verified Rate</p>
                </div>
                <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, fontWeight: 700, color: C.gold, margin: '0 0 2px' }}>&lt;30s</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Avg Response Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section ref={ctaRef} style={{
        padding: '100px 24px',
        background: 'linear-gradient(165deg, ' + C.navyDark + ' 0%, ' + C.navy + ' 50%, ' + C.navyLight + ' 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,150,12,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 2, ...sectionFade(ctaVis) }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.gold + '15', border: '1px solid ' + C.gold + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: C.gold }}>
            <Shield />
          </div>
          <h2 className="cta-heading" style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.3 }}>
            Ready to Make Your Voice Count?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 36, lineHeight: 1.7 }}>
            Join a growing community of verified citizens shaping the future of civic engagement.
          </p>
          <div className="cta-btns">
            <button onClick={() => navigate('/signup')} className="btn-primary"
              style={{ padding: '16px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.goldDim + ')', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 6px 24px rgba(197,150,12,0.3)' }}>
              Create Free Account →
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary"
              style={{ padding: '16px 32px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s' }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer style={{ padding: '60px 24px 40px', background: C.navyDark, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="footer-grid" style={{ marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Libre Baskerville', serif", fontSize: 12, fontWeight: 700, color: C.gold }}>CV</div>
                <span style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>
                  Civic<span style={{ color: C.gold }}>Verify</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, maxWidth: 300 }}>
                The trusted platform for verified civic engagement. Every voice matters when it's real.
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Platform</p>
              {['Sign Up', 'Sign In', 'Live Polls', 'Discussions'].map((l) => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={(e) => { e.target.style.color = C.gold }}
                  onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.35)' }}>
                  {l}
                </a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Company</p>
              {['About', 'Privacy', 'Terms', 'Contact'].map((l) => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={(e) => { e.target.style.color = C.gold }}
                  onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.35)' }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 CivicVerify. All rights reserved.</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Built with trust in mind.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

