import BackToTop from '../../components/BackToTop'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const C = {
  navy: '#0B2545', navyLight: '#12305a', navyDeep: '#081c35', navyMid: '#1a3a6e',
  gold: '#C5960C', goldL: '#F0B429', goldDim: '#a37d0a',
  warmWhite: '#FDFCFA', offWhite: '#f0f3f8',
  muted: '#6b7c93', ink: '#1a2942',
  green: '#16a34a',
  border: 'rgba(11,37,69,0.07)',
}
const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"

const SUBJECTS = [
  'General Question',
  'Identity Verification Help',
  'Account or Login Issue',
  'Privacy or Data Concern',
  'Organisation / Partnership Inquiry',
  'Report a Bug',
  'Media or Press Inquiry',
  'Other',
]

const FAQ = [
  {
    q: 'How does identity verification work?',
    a: 'You submit a government-issued ID once through our secure partner (Didit). Your document is checked, then immediately and permanently deleted. We store only a one-way token confirming you are a unique, real citizen — never the document itself.',
  },
  {
    q: 'Can organisations see who responded to their survey?',
    a: 'No. Organisations receive aggregated statistical results only — percentages and demographic summaries. Individual responses, identities, and personal details are never accessible to anyone, including CivicVerify staff.',
  },
  {
    q: 'Is my data ever sold?',
    a: 'Never. We do not sell, share, or license citizen data to any third party for any purpose. This is an absolute rule with no exceptions.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Account Settings and click Delete Account. Deletion is immediate and permanent — all your data is removed within 30 days.',
  },
  {
    q: 'I am an organisation. How do I get started?',
    a: 'Register at civicverify.org/org-signup. Your application is reviewed by our team, typically within 2 business days. Once approved you get full access to the survey builder and results dashboard.',
  },
  {
    q: 'How long does it take to get a response?',
    a: 'We respond to all messages within 1 business day. For urgent issues, use the subject "Account or Login Issue" and we will prioritise your request.',
  },
]


export default function Contact() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  function handleChange(field) {
    return e => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setError('')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setSending(true)
    // Replace with real endpoint / Supabase insert when ready
    setTimeout(() => {
      setSending(false)
      setSent(true)
      setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' })
    }, 1400)
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: 14.5, fontFamily: sans,
    border: `1px solid ${C.border}`, borderRadius: 10, outline: 'none',
    color: C.ink, background: '#fff', boxSizing: 'border-box',
    transition: 'border-color .2s',
  }

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
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', boxShadow: '0 2px 10px rgba(197,150,12,.35)', flexShrink: 0 }}>CV</div><span style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: '#fff' }}>Civic<span style={{ color: C.goldL }}>Verify</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/about" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>About</Link>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Privacy</Link>
          <Link to="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 60%,${C.navyMid} 100%)`,
        padding: '80px 28px 72px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 18px', borderRadius: 30,
            background: 'rgba(197,150,12,0.12)', border: '1px solid rgba(197,150,12,0.25)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>Contact Us</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 46, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 18px' }}>
            We're Here to Help.<br />
            <span style={{ color: C.goldL, fontStyle: 'italic' }}>Always.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>
            Whether you're a citizen with a question, an organisation exploring a partnership, or a journalist covering civic tech — reach out and we'll respond within 1 business day.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section style={{ padding: '56px 28px 0', background: C.warmWhite }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: '📧', title: 'General Support', email: 'support@civicverify.org', detail: 'Questions about your account, verification, or how the platform works.' },
              { icon: '🔒', title: 'Privacy & Data', email: 'privacy@civicverify.org', detail: 'Concerns about how your data is handled, deletion requests, or data access.' },
              { icon: '🏛️', title: 'Organisations & Press', email: 'partners@civicverify.org', detail: 'Partnership inquiries, media requests, and organisational onboarding.' },
            ].map(card => (
              <div key={card.title} style={{
                background: '#fff', borderRadius: 18, padding: '28px 24px',
                border: `1px solid ${C.border}`, textAlign: 'center',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(197,150,12,0.08)', border: '1px solid rgba(197,150,12,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, margin: '0 auto 16px',
                }}>{card.icon}</div>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{card.title}</p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '0 0 14px' }}>{card.detail}</p>
                <a href={`mailto:${card.email}`} style={{
                  fontSize: 13.5, fontWeight: 600, color: C.gold, textDecoration: 'none',
                  borderBottom: `1px solid rgba(197,150,12,0.3)`, paddingBottom: 1,
                }}>{card.email}</a>
              </div>
            ))}
          </div>

          {/* Response time bar */}
          <div style={{
            marginTop: 20, padding: '16px 24px',
            background: 'rgba(22,163,74,0.06)', borderRadius: 12,
            border: '1px solid rgba(22,163,74,0.15)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>⏱️</span>
            <p style={{ fontSize: 14, color: '#1a6b3a', fontWeight: 600, margin: 0 }}>
              We respond to all messages within <strong>1 business day</strong> — Monday to Friday, 9am–6pm ET. Weekend messages are answered first thing Monday.
            </p>
          </div>
        </div>
      </section>

      {/* ── FORM + FAQ ── */}
      <section style={{ padding: '52px 28px 80px', background: C.warmWhite }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* FORM */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: `1px solid ${C.border}`, boxShadow: '0 4px 24px rgba(11,37,69,0.06)' }}>
            <h2 style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>Send a Message</h2>
            <p style={{ fontSize: 14, color: C.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
              Fill out the form and we'll get back to you as soon as possible.
            </p>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, margin: '0 auto 20px',
                }}>✅</div>
                <h3 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 10px' }}>Message Sent!</h3>
                <p style={{ fontSize: 14.5, color: C.muted, margin: '0 0 24px', lineHeight: 1.65 }}>
                  Thank you for reaching out. We'll respond to <strong>{form.email || 'your email'}</strong> within 1 business day.
                </p>
                <button onClick={() => setSent(false)} style={{
                  padding: '11px 28px', background: C.navy, color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>Send Another Message</button>
              </div>
            ) : (
              <div>
                {/* Name + Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                      Name <span style={{ color: C.gold }}>*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder="Your full name"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                      Email <span style={{ color: C.gold }}>*</span>
                    </label>
                    <input
                      value={form.email}
                      onChange={handleChange('email')}
                      type="email"
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Subject
                  </label>
                  <select
                    value={form.subject}
                    onChange={handleChange('subject')}
                    style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7c93' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    Message <span style={{ color: C.gold }}>*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={handleChange('message')}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }}
                  />
                </div>

                {error && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8 }}>
                    <p style={{ fontSize: 13.5, color: '#b91c1c', margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: sending ? C.muted : C.navy,
                    color: sending ? 'rgba(255,255,255,0.6)' : C.goldL,
                    fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
                    fontFamily: sans, transition: 'background .2s',
                  }}>
                  {sending ? 'Sending...' : 'Send Message →'}
                </button>

                <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.6 }}>
                  🔒 Your message is private. We never share contact form submissions with third parties.
                </p>
              </div>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>Common Questions</h2>
            <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
              Quick answers before you reach out.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQ.map((item, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 14,
                  border: `1px solid ${openFaq === i ? 'rgba(197,150,12,0.35)' : C.border}`,
                  overflow: 'hidden', transition: 'border-color .2s',
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', padding: '16px 20px', background: 'none', border: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', gap: 12, textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: C.navy, lineHeight: 1.4 }}>{item.q}</span>
                    <span style={{
                      fontSize: 18, color: C.gold, flexShrink: 0,
                      transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                      transition: 'transform .2s', display: 'inline-block',
                    }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 20px 18px' }}>
                      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: 0 }}>{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Privacy reminder */}
            <div style={{
              marginTop: 24, padding: '20px 22px', borderRadius: 14,
              background: `linear-gradient(135deg,${C.navyDeep},${C.navy})`,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.goldL, margin: '0 0 8px' }}>
                🛡️ Your Privacy is Protected
              </p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 12px' }}>
                We will never sell your data, share your identity, or link your civic opinions to your personal information. Read our full commitment.
              </p>
              <Link to="/privacy" style={{ fontSize: 13, fontWeight: 700, color: C.goldL, textDecoration: 'none', borderBottom: '1px solid rgba(240,180,41,0.3)', paddingBottom: 1 }}>
                Read Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDeep, padding: '28px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['/', 'Home'], ['/about', 'About'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms'], ['/contact', 'Contact']].map(([to, label]) => (
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
