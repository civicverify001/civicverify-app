// src/pages/public/FAQ.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BackToTop from '../../components/BackToTop'

const C = {
  navy: '#0B2545', navyLight: '#12305a', navyDeep: '#081c35', navyMid: '#1a3a6e',
  gold: '#C5960C', goldL: '#F0B429', goldDim: '#a37d0a',
  warmWhite: '#FDFCFA', offWhite: '#f0f3f8',
  muted: '#6b7c93', ink: '#1a2942',
  border: 'rgba(11,37,69,0.07)',
}
const font = "'Libre Baskerville', Georgia, serif"
const sans = "'DM Sans', system-ui, sans-serif"

const FAQS = [
  {
    category: 'Getting Started',
    emoji: '🚀',
    items: [
      {
        q: 'What is CivicVerify?',
        a: 'CivicVerify is a civic engagement platform that ensures authentic public opinion reaches policymakers. Every participant is identity-verified, which means surveys and polls reflect what real citizens actually think — not bots, not fake accounts, not coordinated campaigns.'
      },
      {
        q: 'Is CivicVerify free to use?',
        a: 'Yes, completely free for citizens. You can sign up, verify your identity, participate in polls and surveys, and engage in the Community — all at no cost, now and always.'
      },
      {
        q: 'Do I need to verify my identity to participate?',
        a: 'Yes. Identity verification is what makes CivicVerify different. It ensures one person, one verified voice. The process takes about 60 seconds using a government-issued ID and is handled securely by our partner, Didit. Your document is permanently deleted immediately after verification.'
      },
      {
        q: 'What devices can I use CivicVerify on?',
        a: 'CivicVerify works on any modern browser — desktop, tablet, or mobile. You can also install it as an app on your phone from your browser (no app store required) for a faster, native-style experience.'
      },
    ]
  },
  {
    category: 'Privacy & Data',
    emoji: '🔒',
    items: [
      {
        q: 'What happens to my ID document after verification?',
        a: 'It is permanently and immediately deleted. We use Didit to check your ID. Once verified, the document is destroyed and we retain only a one-way cryptographic token — a mathematical fingerprint that confirms you are verified without storing any identifying information.'
      },
      {
        q: 'Can anyone see how I voted on a survey?',
        a: 'No. Your individual responses are completely private. Organisations and policymakers receive only aggregated statistics — percentages and demographic breakdowns. Nobody can see your personal answers. This is a technical guarantee, not just a policy promise.'
      },
      {
        q: 'Is CivicVerify affiliated with any political party or government?',
        a: 'No. CivicVerify is a privately operated, nonpartisan platform. We have no political affiliation and receive no government funding. We do not favour any party, candidate, or ideology. Our only goal is to make civic data more trustworthy.'
      },
      {
        q: 'Can I delete my account and all my data?',
        a: 'Yes, at any time. Go to Settings → Account → Delete Account. All your data — responses, community posts, profile information — is permanently deleted within 30 days. There are no exceptions and no retention of deleted data.'
      },
      {
        q: 'Does CivicVerify sell my data?',
        a: 'Never. We do not sell, share, or license your personal data to any third party for any purpose. Organisations that commission surveys receive only anonymised aggregate results — never individual responses or personal information.'
      },
    ]
  },
  {
    category: 'Surveys & Polls',
    emoji: '🗳️',
    items: [
      {
        q: 'What is the difference between a poll and a survey?',
        a: 'Polls are short, 1–3 question opinion checks available to everyone in the Community tab — any verified citizen can create one. Surveys are longer, more structured data collections commissioned by organisations, typically 3–10 questions with optional demographic targeting.'
      },
      {
        q: 'Who creates the surveys I see on my dashboard?',
        a: 'Surveys are created by approved organisations — government agencies, research institutions, nonprofits, and civic groups. Every organisation is reviewed and approved before they can publish surveys. Political campaigns and commercial advertisers are not permitted.'
      },
      {
        q: 'Why am I not seeing any surveys?',
        a: 'There are two common reasons: your identity is not yet verified (surveys require verification), or the available surveys are targeted to demographics that do not match your profile. Make sure your profile is complete and your identity is verified.'
      },
      {
        q: 'Can I change my answer after submitting?',
        a: 'You can update your answer while a survey is still open. Once a survey closes, all responses are aggregated and individual records are locked. You will see a "Already completed" message if you revisit a closed survey you participated in.'
      },
      {
        q: 'How do I create a community poll?',
        a: 'Go to Community → Polls tab → click "Create a Poll". Type your question, add 2 to 6 answer options, and post. Any verified citizen can create a community poll. They are separate from the official surveys on your dashboard.'
      },
    ]
  },
  {
    category: 'Community',
    emoji: '💬',
    items: [
      {
        q: 'Who can post in the Community?',
        a: 'Any identity-verified citizen. The Community is exclusively for verified users — this is what keeps it free of bots and coordinated manipulation. You will see a verified badge next to every person\'s name.'
      },
      {
        q: 'Can I follow other citizens?',
        a: 'Yes. Click Follow on any citizen\'s profile or from their posts in the Feed. You can manage who you follow from your profile page. Followed citizens\' posts do not currently filter the main feed, but this is coming in a future update.'
      },
      {
        q: 'What are Survey Rooms?',
        a: 'Survey Rooms are live chat spaces tied to active surveys. When a survey is live, a room opens where verified participants can discuss the topic in real time. Rooms close when the survey ends.'
      },
      {
        q: 'How do I report a post or user that violates community guidelines?',
        a: 'Use the Contact page to report any content that you believe violates our community standards. Include the post content and the username. Our moderation team reviews all reports within 48 hours.'
      },
    ]
  },
  {
    category: 'For Organisations',
    emoji: '🏛️',
    items: [
      {
        q: 'How do organisations get approved?',
        a: 'Organisations apply through our registration page with their details and intended use. Our team reviews each application to confirm a legitimate civic, research, governmental, or nonprofit purpose. Approval typically takes 2 business days.'
      },
      {
        q: 'What types of organisations are NOT permitted?',
        a: 'Political campaigns, political action committees (PACs), commercial advertisers, and any organisation seeking to use the platform for marketing or partisan political purposes are not permitted. This is absolute policy and not subject to exceptions.'
      },
      {
        q: 'What data do organisations receive from surveys?',
        a: 'Organisations receive aggregate statistics only: percentage breakdowns by answer option, demographic summaries (age range, location, etc.), and response counts. They never receive individual responses, respondent names, or any personally identifiable information.'
      },
      {
        q: 'Is there a cost for organisations to commission surveys?',
        a: 'Please contact us through the Contact page for current pricing. We offer different tiers based on survey size, targeting complexity, and response volume requirements.'
      },
    ]
  },
  {
    category: 'Technical',
    emoji: '⚙️',
    items: [
      {
        q: 'How do I install CivicVerify as a mobile app?',
        a: 'On Chrome (Android): tap the three-dot menu → "Add to Home Screen". On Safari (iPhone): tap the Share button → "Add to Home Screen". This installs CivicVerify as a full-screen app without needing the App Store.'
      },
      {
        q: 'Why is my identity verification failing?',
        a: 'Common reasons: the ID image is blurry or too dark, the ID is expired, or the name on the ID does not match your account name. Make sure you are in good lighting and the full ID is visible. If problems persist, contact us through the Contact page.'
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the login page, click "Forgot password?" and enter your email address. You will receive a reset link within a few minutes. Check your spam folder if it does not arrive. The link expires after 24 hours.'
      },
      {
        q: 'Does CivicVerify work offline?',
        a: 'The app loads when you have no connection thanks to offline caching. However, participating in surveys, posting in the Community, and loading new content all require an active internet connection.'
      },
    ]
  },
]

function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      animation: `fadeIn 0.4s ease ${index * 0.04}s both`,
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '18px 0', background: 'none', border: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', gap: 16, textAlign: 'left',
      }}>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: open ? C.navy : '#2d3f55', lineHeight: 1.45, fontFamily: sans }}>{q}</span>
        <span style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: open ? C.navy : 'transparent',
          border: `1.5px solid ${open ? C.navy : C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: open ? C.goldL : C.muted,
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'all .25s',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? '500px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.8, margin: '0 0 20px', paddingRight: 44, fontFamily: sans }}>
          {a}
        </p>
      </div>
    </div>
  )
}

export default function FAQ() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const [activeCategory, setActiveCategory] = useState(null)

  const displayed = activeCategory
    ? FAQS.filter(g => g.category === activeCategory)
    : FAQS

  const totalCount = FAQS.reduce((a, g) => a + g.items.length, 0)

  return (
    <div style={{ fontFamily: sans, background: C.warmWhite, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(11,37,69,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 28px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>CV</div>
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: '#fff' }}>Civic<span style={{ color: C.goldL }}>Verify</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/how-it-works" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How It Works</Link>
          <Link to="/contact" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Contact</Link>
          <Link to="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: C.gold, color: C.navy, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 60%,${C.navyMid} 100%)`, padding: '72px 28px 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '6px 18px', borderRadius: 30, background: 'rgba(197,150,12,0.12)', border: '1px solid rgba(197,150,12,0.25)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>FAQ</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 44, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
            Frequently Asked<br />
            <span style={{ color: C.goldL, fontStyle: 'italic' }}>Questions</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 28px' }}>
            {totalCount} answers covering everything from how verification works to privacy, surveys, and the community.
          </p>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setActiveCategory(null)} style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: sans,
              background: !activeCategory ? C.gold : 'rgba(255,255,255,0.1)',
              color: !activeCategory ? C.navy : 'rgba(255,255,255,0.7)',
              transition: 'all .2s',
            }}>All</button>
            {FAQS.map(g => (
              <button key={g.category} onClick={() => setActiveCategory(g.category === activeCategory ? null : g.category)} style={{
                padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: sans,
                background: activeCategory === g.category ? C.gold : 'rgba(255,255,255,0.1)',
                color: activeCategory === g.category ? C.navy : 'rgba(255,255,255,0.7)',
                transition: 'all .2s',
              }}>{g.emoji} {g.category}</button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ CONTENT */}
      <section style={{ padding: '60px 28px 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48 }}>
          {displayed.map((group) => (
            <div key={group.category}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{group.emoji}</span>
                <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.navy, margin: 0 }}>{group.category}</h2>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: `${C.gold}15`, border: `1px solid ${C.gold}33`, padding: '2px 8px', borderRadius: 10 }}>
                  {group.items.length}
                </span>
              </div>
              <div style={{ width: '100%', height: 2, background: `linear-gradient(90deg, ${C.gold}66, transparent)`, marginBottom: 4 }} />

              {/* Items */}
              <div>
                {group.items.map((item, i) => (
                  <FaqItem key={i} q={item.q} a={item.a} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STILL HAVE QUESTIONS CTA */}
      <section style={{ padding: '48px 28px 64px', background: C.offWhite, textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🤝</div>
          <h2 style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>Still have questions?</h2>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: '0 0 28px' }}>
            Can't find what you're looking for? Our team responds to every message.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{ padding: '12px 30px', borderRadius: 10, background: C.navy, color: C.goldL, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Contact Us →
            </Link>
            <Link to="/how-it-works" style={{ padding: '12px 30px', borderRadius: 10, background: 'transparent', color: C.navy, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: `1.5px solid ${C.border}` }}>
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.navyDeep, padding: '28px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['/', 'Home'], ['/about', 'About'], ['/how-it-works', 'How It Works'], ['/faq', 'FAQ'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms'], ['/contact', 'Contact']].map(([to, label]) => (
            <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: '16px 0 0' }}>© 2026 CivicVerify. Indianapolis, IN. All rights reserved.</p>
      </footer>

      <BackToTop />
    </div>
  )
}
