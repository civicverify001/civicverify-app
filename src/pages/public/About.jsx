import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const C = {
  navy: '#0B2545', navyLight: '#12305a', navyDeep: '#081c35', navyMid: '#1a3a6e',
  gold: '#C5960C', goldL: '#F0B429', goldDim: '#a37d0a',
  warmWhite: '#FDFCFA', offWhite: '#f0f3f8',
  muted: '#6b7c93', ink: '#1a2942',
  border: 'rgba(11,37,69,0.07)',
}
const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"


export default function About() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ fontFamily: sans, background: C.warmWhite, minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,37,69,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', boxShadow: '0 2px 10px rgba(197,150,12,.35)', flexShrink: 0 }}>CV</div><span style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: '#fff' }}>Civic<span style={{ color: C.goldL }}>Verify</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/how-it-works" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How It Works</Link>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Privacy</Link>
          <Link to="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: C.gold,
            color: C.navy, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 60%,${C.navyMid} 100%)`,
        padding: '90px 28px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 18px', borderRadius: 30,
            background: 'rgba(197,150,12,0.12)', border: '1px solid rgba(197,150,12,0.25)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>About CivicVerify</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 48, fontWeight: 700, color: '#fff',
            lineHeight: 1.2, margin: '0 0 20px' }}>
            Built to Make Every<br />
            <span style={{ color: C.goldL, fontStyle: 'italic' }}>Voice Count for Real</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
            We started CivicVerify because online civic engagement was broken. Bots, fake accounts, and coordinated manipulation were drowning out real citizens. We decided to fix it.
          </p>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section style={{ padding: '80px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase',
                letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>Our Mission</span>
              <h2 style={{ fontFamily: font, fontSize: 36, fontWeight: 700, color: C.navy,
                lineHeight: 1.25, margin: '0 0 20px' }}>
                One verified citizen.<br />One real voice.
              </h2>
              <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.8, margin: '0 0 16px' }}>
                CivicVerify exists to ensure that when public opinion reaches decision-makers, it reflects reality — not manipulation. We verify that every participant is a real, unique U.S. citizen before their voice is counted.
              </p>
              <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.8, margin: 0 }}>
                We are not a polling company. We are not a data broker. We are infrastructure for authentic civic participation — built in Indianapolis, built for everyone.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { icon: '🗳️', title: 'Authentic Participation', desc: 'Every response backed by a real, verified U.S. citizen. No exceptions.' },
                { icon: '🔒', title: 'Privacy by Design', desc: 'Identity verification and civic participation are permanently separated. Nobody sees who said what.' },
                { icon: '⚖️', title: 'Nonpartisan Always', desc: 'We have no political agenda. We make the data trustworthy — what happens with it is up to citizens and policymakers.' },
                { icon: '🌍', title: 'Built for Everyone', desc: 'Free to join for all citizens. Simple enough for anyone. Powerful enough to influence real policy.' },
              ].map(v => (
                <div key={v.title} style={{ display: 'flex', gap: 14, padding: '16px',
                  background: C.offWhite, borderRadius: 14, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{v.icon}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>{v.title}</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section style={{ padding: '80px 28px', background: C.offWhite }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase',
            letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>Our Story</span>
          <h2 style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: C.navy, margin: '0 0 32px' }}>
            Started in Indianapolis. Built for the Country.
          </h2>
          <div style={{ textAlign: 'left', display: 'grid', gap: 18 }}>
            {[
              'The problem was obvious to anyone paying attention. Government agencies were running online consultations that any organised group could flood with fake submissions. Local councils were making decisions based on petitions that nobody could verify. Social media polls were being manipulated in real time. The public voice was being drowned out by the loudest, most coordinated actors — not the most representative ones.',
              'We built CivicVerify to change that. The idea is simple: before your opinion is counted, we verify you are a real, unique U.S. citizen. Once verified, you participate freely — and your participation cannot be duplicated, faked, or manipulated by someone else.',
              'We are an early-stage platform, and we are transparent about that. We are building carefully, incrementally, and with trust as our primary design principle. Every feature we add, every policy we write, every decision we make is filtered through one question: does this make CivicVerify more trustworthy for the citizens who use it?',
            ].map((p, i) => (
              <p key={i} style={{ fontSize: 15.5, color: '#3a4a5c', lineHeight: 1.85, margin: 0,
                padding: '20px 24px', background: '#fff', borderRadius: 12,
                border: `1px solid ${C.border}`, borderLeft: `4px solid ${i === 0 ? C.gold : C.border}` }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: '80px 28px', background: C.warmWhite }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase',
              letterSpacing: '.18em', display: 'block', marginBottom: 14 }}>What We Stand For</span>
            <h2 style={{ fontFamily: font, fontSize: 34, fontWeight: 700, color: C.navy, margin: 0 }}>
              Our Non-Negotiable Principles
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: '🚫', title: 'No Data Sales. Ever.', desc: 'We will never sell, rent, or license citizen data to any third party for any purpose — commercial, political, or otherwise. This is absolute.' },
              { icon: '👁️', title: 'Results Only for Orgs', desc: 'Organisations that commission surveys receive aggregated statistics only. They never see who responded, how individuals answered, or any personal details.' },
              { icon: '🔐', title: 'ID Verified, Not Stored', desc: 'Your identity document is verified once and immediately discarded. We retain a one-way cryptographic token only — never the document itself.' },
              { icon: '⚖️', title: 'Nonpartisan Infrastructure', desc: 'CivicVerify has no political affiliation and advances no political agenda. We provide the verification layer — citizens decide the content.' },
              { icon: '🗑️', title: 'Right to Delete', desc: 'You can delete your account and all associated data at any time, permanently and immediately. No retention period. No questions asked.' },
              { icon: '🏛️', title: 'Transparent Operations', desc: 'We publish transparency reports, are working toward independent audits, and will always be honest about what we do and do not yet have.' },
            ].map(v => (
              <div key={v.title} style={{ padding: '28px 24px', borderRadius: 18,
                background: C.offWhite, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{v.icon}</div>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 10px' }}>{v.title}</p>
                <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section style={{ padding: '60px 28px',
        background: `linear-gradient(135deg,${C.navyDeep},${C.navy})`, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 16 }}>Based In</p>
          <p style={{ fontFamily: font, fontSize: 28, color: '#fff', fontWeight: 700, margin: '0 0 12px' }}>
            Indianapolis, Indiana
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Proudly built in the heart of the Midwest, with a mission that reaches every corner of the country.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ padding: '13px 28px', borderRadius: 10,
              background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700,
              textDecoration: 'none' }}>Join as a Citizen →</Link>
            <Link to="/contact" style={{ padding: '13px 28px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontWeight: 600,
              textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>Contact Us</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDeep, padding: '28px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['/', 'Home'], ['/about', 'About'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms'], ['/contact', 'Contact']].map(([to, label]) => (
            <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: '16px 0 0' }}>
          © 2026 CivicVerify. Indianapolis, IN. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
