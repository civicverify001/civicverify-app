import CanonicalUrl from '../../components/CanonicalUrl'

// Inside return(), first line:
<CanonicalUrl />
// src/pages/public/HowItWorks.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BackToTop from '../../components/BackToTop'

const C = {
  navy: '#0B2545', navyLight: '#12305a', navyDeep: '#081c35', navyMid: '#1a3a6e',
  gold: '#C5960C', goldL: '#F0B429', goldDim: '#a37d0a',
  warmWhite: '#FDFCFA', offWhite: '#f0f3f8',
  muted: '#6b7c93', ink: '#1a2942',
  green: '#16a34a', greenLight: 'rgba(22,163,74,0.08)',
  border: 'rgba(11,37,69,0.07)',
}
const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"

const CITIZEN_STEPS = [
  {
    num: '01',
    icon: '📝',
    title: 'Create a Free Account',
    desc: 'Sign up with your email address. No credit card, no subscription. CivicVerify is always free for citizens.',
    detail: 'Your account is created instantly. You can browse the platform right away — you\'ll need to verify your identity before your responses are counted.',
  },
  {
    num: '02',
    icon: '🪪',
    title: 'Verify Your Identity Once',
    desc: 'Submit a government-issued ID through our secure partner, Didit. This takes about 60 seconds and happens only once.',
    detail: 'Your ID is checked to confirm you are a real, unique U.S. citizen. The document is immediately and permanently deleted after verification. We store only a one-way cryptographic token — never the document itself.',
  },
  {
    num: '03',
    icon: '🗳️',
    title: 'Participate in Civic Polls',
    desc: 'Surveys and polls matched to your location and demographics appear on your dashboard. Vote, share your view, and see how your community thinks.',
    detail: 'Your responses are encrypted and permanently separated from your identity. Nobody — not organisations, not CivicVerify staff — can link your answers to your name.',
  },
  {
    num: '04',
    icon: '💬',
    title: 'Join the Community',
    desc: 'Discuss poll results with other verified citizens. React, reply, and follow people whose views you want to follow.',
    detail: 'Every person in the Community section is identity-verified. No bots, no fake accounts, no coordinated manipulation — just real people with real views.',
  },
  {
    num: '05',
    icon: '📊',
    title: 'See Your Impact',
    desc: 'Your My Impact dashboard shows which polls you\'ve influenced, how your community voted, and when results are shared with policymakers.',
    detail: 'When organisations receive aggregated results from surveys you participated in, you\'ll see it. Your voice is traceable to real outcomes — just never traceable back to you personally.',
  },
]

const ORG_STEPS = [
  {
    num: '01',
    icon: '🏛️',
    title: 'Register Your Organisation',
    desc: 'Sign up with your organisation details. Applications are reviewed by our team — typically within 2 business days.',
    detail: 'We verify that organisations have a legitimate civic, research, governmental, or nonprofit purpose. This keeps the platform trustworthy for citizens.',
  },
  {
    num: '02',
    icon: '🎯',
    title: 'Design Your Survey',
    desc: 'Use our survey builder to create questions, set targeting criteria (age, location, demographics), and define your response goals.',
    detail: 'Our team reviews all surveys before they go live to ensure questions are fair, clear, and not designed to manipulate or mislead respondents.',
  },
  {
    num: '03',
    icon: '✅',
    title: 'Collect Verified Responses',
    desc: 'Your survey is distributed to matching verified citizens. Every response is guaranteed to be from a real, unique, identity-verified person.',
    detail: 'No bots. No duplicate submissions. No coordinated campaigns. The data you receive reflects what real citizens actually think.',
  },
  {
    num: '04',
    icon: '📈',
    title: 'Receive Aggregated Results',
    desc: 'Access your results dashboard with percentage breakdowns, demographic summaries, and response trends.',
    detail: 'You receive aggregated statistics only — never individual responses, never respondent identities. This is absolute and non-negotiable.',
  },
]

const PRIVACY_FACTS = [
  { icon: '🔒', title: 'ID Verified Once', desc: 'Your document is checked once then permanently deleted. We keep only a cryptographic token.' },
  { icon: '🔀', title: 'Identity Separated', desc: 'Your identity and your survey responses live in separate systems that cannot be joined — by design.' },
  { icon: '🚫', title: 'No Individual Access', desc: 'No organisation, no staff member, nobody can see how you personally answered any question.' },
  { icon: '🗑️', title: 'Delete Anytime', desc: 'Delete your account instantly from Settings. All data removed within 30 days. No exceptions.' },
  { icon: '💰', title: 'Never Sold', desc: 'We do not sell, share, or license your data to any third party for any purpose. Ever.' },
  { icon: '⚖️', title: 'Court Orders Only', desc: 'We only disclose data under lawful court order — and even then, your responses are not accessible.' },
]

function StepCard({ step, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '64px 1fr', gap: 24,
      padding: '28px 28px', background: '#fff', borderRadius: 18,
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(11,37,69,0.04)',
      transition: 'box-shadow .2s',
    }}>
      {/* Number */}
      <div style={{
        width: 56, height: 56, borderRadius: 16, flexShrink: 0,
        background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.goldL, letterSpacing: '.08em' }}>{step.num}</span>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{step.icon}</span>
      </div>

      {/* Content */}
      <div>
        <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.7, margin: '0 0 10px' }}>
          {step.desc}
        </p>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: C.gold, fontFamily: sans,
            display: 'flex', alignItems: 'center', gap: 6 }}>
          {open ? 'Hide detail ↑' : 'More detail ↓'}
        </button>
        {open && (
          <div style={{ marginTop: 12, padding: '14px 16px', background: C.offWhite,
            borderRadius: 10, borderLeft: `3px solid ${C.gold}` }}>
            <p style={{ fontSize: 13.5, color: '#3a4a5c', lineHeight: 1.75, margin: 0 }}>
              {step.detail}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HowItWorks() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const [tab, setTab] = useState('citizen')

  return (
    <div style={{ fontFamily: sans, background: C.warmWhite, minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,37,69,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 28px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', boxShadow: '0 2px 10px rgba(197,150,12,.35)', flexShrink: 0 }}>CV</div>
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: '#fff' }}>Civic<span style={{ color: C.goldL }}>Verify</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/about" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>About</Link>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Privacy</Link>
          <Link to="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 60%,${C.navyMid} 100%)`,
        padding: '80px 28px 72px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 18px', borderRadius: 30,
            background: 'rgba(197,150,12,0.12)', border: '1px solid rgba(197,150,12,0.25)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>How It Works</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 46, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 18px' }}>
            Simple, Transparent,<br />
            <span style={{ color: C.goldL, fontStyle: 'italic' }}>and Completely Private.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 32px' }}>
            CivicVerify works differently from any polling platform you've used before. Here's exactly what happens — step by step — for both citizens and organisations.
          </p>
          {/* Tab switcher */}
          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[['citizen', '🗳️ For Citizens'], ['org', '🏛️ For Organisations']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '10px 24px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: sans,
                background: tab === key ? C.gold : 'transparent',
                color: tab === key ? C.navy : 'rgba(255,255,255,0.55)',
                transition: 'all .2s',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section style={{ padding: '64px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em' }}>
              {tab === 'citizen' ? 'Citizen Journey' : 'Organisation Journey'}
            </span>
            <h2 style={{ fontFamily: font, fontSize: 30, fontWeight: 700, color: C.navy, margin: '8px 0 0' }}>
              {tab === 'citizen' ? 'Your path from signup to impact' : 'From application to verified results'}
            </h2>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {(tab === 'citizen' ? CITIZEN_STEPS : ORG_STEPS).map((step, i) => (
              <StepCard key={step.num} step={step} index={i} />
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link to={tab === 'citizen' ? '/signup' : '/org-signup'} style={{
              display: 'inline-block', padding: '14px 36px', borderRadius: 12,
              background: C.navy, color: C.goldL, fontSize: 15, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(11,37,69,0.2)',
            }}>
              {tab === 'citizen' ? 'Join as a Citizen →' : 'Apply as an Organisation →'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRIVACY FACTS ── */}
      <section style={{ padding: '64px 28px', background: C.offWhite }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '.18em', display: 'block', marginBottom: 12 }}>Privacy by Design</span>
            <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: C.navy, margin: '0 0 14px' }}>
              What happens to your data
            </h2>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
              Every part of CivicVerify is designed so that participating in civic life never puts your personal privacy at risk.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {PRIVACY_FACTS.map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: '24px 22px',
                border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{f.title}</p>
                <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/privacy" style={{ fontSize: 14, fontWeight: 700, color: C.gold,
              textDecoration: 'none', borderBottom: `1px solid rgba(197,150,12,0.3)`, paddingBottom: 2 }}>
              Read the full Privacy Policy →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ STRIP ── */}
      <section style={{ padding: '64px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: font, fontSize: 30, fontWeight: 700, color: C.navy, margin: 0 }}>
              Common Questions
            </h2>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { q: 'Does verifying my identity mean CivicVerify can see my political views?', a: 'No. Identity verification and survey participation are stored in completely separate systems. There is no technical way to link your name to your answers — not even for our own engineers.' },
              { q: 'What if I make a mistake or change my mind after voting?', a: 'You can update your response while a survey is still open. Once a survey closes, responses are aggregated and individual records are no longer accessible.' },
              { q: 'Can I verify if I am not a U.S. citizen?', a: 'Currently CivicVerify focuses on U.S. civic participation and requires U.S. citizenship or permanent residency for verification. We plan to expand to other countries in the future.' },
              { q: 'How do organisations get approved?', a: 'Organisations apply through our registration page and are reviewed by our team. We check that the organisation has a legitimate civic, research, governmental, or nonprofit purpose. Political campaigns and commercial advertising are not permitted.' },
              { q: 'Is CivicVerify affiliated with any political party or government agency?', a: 'No. CivicVerify is a privately operated, nonpartisan platform. We have no political affiliation and receive no government funding. Our only goal is to make civic data more trustworthy.' },
            ].map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '60px 28px',
        background: `linear-gradient(135deg,${C.navyDeep},${C.navy})`, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: font, fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>
            Ready to make your voice count?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Join CivicVerify free. Verify once. Participate forever.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ padding: '13px 32px', borderRadius: 10,
              background: C.gold, color: C.navy, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Join as a Citizen →
            </Link>
            <Link to="/org-signup" style={{ padding: '13px 32px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, fontWeight: 600,
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
              Apply as an Organisation
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDeep, padding: '28px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['/', 'Home'], ['/about', 'About'], ['/how-it-works', 'How It Works'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms'], ['/contact', 'Contact']].map(([to, label]) => (
            <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: '16px 0 0' }}>
          © 2026 CivicVerify. Indianapolis, IN. All rights reserved.
        </p>
      </footer>

      <BackToTop />
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#fff', borderRadius: 14,
      border: `1px solid ${open ? 'rgba(197,150,12,0.35)' : C.border}`,
      overflow: 'hidden', transition: 'border-color .2s' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '18px 22px', background: 'none', border: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', gap: 16, textAlign: 'left',
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.navy, lineHeight: 1.4 }}>{q}</span>
        <span style={{ fontSize: 20, color: C.gold, flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px' }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  )
}
