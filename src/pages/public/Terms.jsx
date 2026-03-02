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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48, paddingBottom: 48, borderBottom: `1px solid ${C.border}` }}>
      <h2 style={{ fontFamily: font, fontSize: 24, fontWeight: 700, color: C.navy,
        margin: '0 0 18px', paddingLeft: 16, borderLeft: `4px solid ${C.gold}` }}>{title}</h2>
      {children}
    </div>
  )
}

function P({ children }) {
  return <p style={{ fontSize: 15, color: '#3a4a5c', lineHeight: 1.85, margin: '0 0 14px' }}>{children}</p>
}

function Li({ children }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ color: C.gold, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>→</span>
      <span style={{ fontSize: 15, color: '#3a4a5c', lineHeight: 1.7 }}>{children}</span>
    </div>
  )
}


export default function Terms() {
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
          <Link to="/about" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>About</Link>
          <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Privacy</Link>
          <Link to="/signup" style={{ padding: '8px 20px', borderRadius: 8, background: C.gold,
            color: C.navy, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: `linear-gradient(155deg,${C.navyDeep} 0%,${C.navy} 60%,${C.navyMid} 100%)`,
        padding: '80px 28px 70px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 18px', borderRadius: 30,
            background: 'rgba(197,150,12,0.12)', border: '1px solid rgba(197,150,12,0.25)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>Terms of Service</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 44, fontWeight: 700, color: '#fff',
            lineHeight: 1.2, margin: '0 0 18px' }}>
            Clear Rules.<br />
            <span style={{ color: C.goldL, fontStyle: 'italic' }}>No Hidden Surprises.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 12px' }}>Last updated: March 1, 2026</p>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>
            By using CivicVerify, you agree to these terms. We have written them in plain English so you actually understand what you are agreeing to.
          </p>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section style={{ padding: '64px 28px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>

          <Section title="1. Who These Terms Apply To">
            <P>These Terms of Service apply to all users of CivicVerify, including:</P>
            <Li><strong>Citizens</strong> who register, verify their identity, and participate in polls, surveys, and community discussions.</Li>
            <Li><strong>Organisations</strong> that register to commission verified civic surveys and access aggregated results.</Li>
            <Li><strong>Visitors</strong> who browse civicverify.org without registering.</Li>
            <P>By accessing or using CivicVerify, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.</P>
          </Section>

          <Section title="2. Eligibility">
            <Li>You must be at least 18 years of age to create a citizen account.</Li>
            <Li>You must be a U.S. citizen or permanent resident to participate in verified civic polls.</Li>
            <Li>You may only create one citizen account. Creating duplicate accounts to inflate response counts is strictly prohibited and will result in permanent suspension.</Li>
            <Li>You must provide accurate information during registration. False information, including fraudulent identity verification, is a violation of these Terms and may constitute a criminal offence.</Li>
          </Section>

          <Section title="3. Identity Verification">
            <P>Participating in verified civic polls requires identity verification. By submitting to verification, you agree that:</P>
            <Li>Your identity document will be processed by our verification partner (Didit) for the sole purpose of confirming you are a real, unique U.S. citizen.</Li>
            <Li>Your document will be deleted immediately after verification is confirmed. We do not retain it.</Li>
            <Li>You are submitting a genuine, unaltered government-issued document. Submitting fraudulent documents is a violation of these Terms and applicable law.</Li>
            <Li>Verification is a one-time process. Once verified, your status is stored as a cryptographic token only — your identity document is not retained.</Li>
          </Section>

          <Section title="4. Acceptable Use — Citizens">
            <P>As a citizen user, you agree to:</P>
            <Li>Participate honestly and in good faith in surveys and community discussions.</Li>
            <Li>Not attempt to manipulate, game, or distort survey results through any means.</Li>
            <Li>Not harass, threaten, or abuse other users in community discussions.</Li>
            <Li>Not post content that is illegal, defamatory, obscene, or incites violence or discrimination.</Li>
            <Li>Not attempt to reverse-engineer, scrape, or extract data from the platform.</Li>
            <Li>Not share your account credentials with any other person.</Li>
          </Section>

          <Section title="5. Acceptable Use — Organisations">
            <P>As an organisation user, you agree to:</P>
            <Li>Use CivicVerify surveys for legitimate civic, research, governmental, or nonprofit purposes only.</Li>
            <Li>Not use survey results to target, identify, or take action against individual respondents.</Li>
            <Li>Not misrepresent aggregated results — you must accurately represent what the data shows and acknowledge its limitations.</Li>
            <Li>Not use the platform for political advertising, fundraising, or voter suppression activities.</Li>
            <Li>Not attempt to use survey design to manipulate or lead respondents toward a predetermined conclusion in a deceptive way.</Li>
            <Li>Acknowledge that all results are aggregated and anonymised — you will never receive individual respondent data, and you will not attempt to obtain it.</Li>
          </Section>

          <Section title="6. Data and Privacy">
            <P>Your privacy is governed by our <Link to="/privacy" style={{ color: C.gold }}>Privacy Policy</Link>, which is incorporated into these Terms by reference. Key commitments include:</P>
            <Li>We will never sell your data to any third party for any purpose.</Li>
            <Li>Organisations receive aggregated results only — never individual responses or identities.</Li>
            <Li>Your identity verification and your survey responses are technically separated and cannot be linked.</Li>
            <Li>You can delete your account and all associated data at any time.</Li>
          </Section>

          <Section title="7. Account Termination">
            <P><strong>By you:</strong> You can delete your account at any time from Account Settings. Deletion is immediate and permanent.</P>
            <P><strong>By us:</strong> We reserve the right to suspend or terminate accounts that:</P>
            <Li>Violate these Terms of Service.</Li>
            <Li>Attempt to manipulate or compromise the integrity of the platform.</Li>
            <Li>Submit fraudulent identity verification.</Li>
            <Li>Create duplicate accounts.</Li>
            <Li>Engage in harassment, abuse, or illegal activity.</Li>
            <P>Where possible, we will give advance warning before termination. For serious violations (fraud, manipulation, illegal activity), termination may be immediate without notice.</P>
          </Section>

          <Section title="8. Platform Availability and Changes">
            <Li>CivicVerify is provided "as is." We aim for maximum uptime but cannot guarantee uninterrupted service.</Li>
            <Li>We may update, modify, or discontinue features of the platform at any time. We will give reasonable notice of significant changes.</Li>
            <Li>We may update these Terms from time to time. We will notify registered users by email of material changes at least 14 days before they take effect. Continued use of the platform after that date constitutes acceptance of the updated Terms.</Li>
          </Section>

          <Section title="9. Intellectual Property">
            <Li>The CivicVerify platform, branding, and all original content are owned by CivicVerify and protected by applicable intellectual property law.</Li>
            <Li>Content you submit (survey responses, community posts) remains yours. By submitting it, you grant CivicVerify a licence to use it for the purpose of operating the platform — specifically, to aggregate it into results and display community posts publicly.</Li>
            <Li>You may not reproduce, distribute, or commercially exploit CivicVerify's platform, design, or data without written permission.</Li>
          </Section>

          <Section title="10. Limitation of Liability">
            <P>To the maximum extent permitted by law:</P>
            <Li>CivicVerify is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</Li>
            <Li>Our total liability to you for any claim arising from use of CivicVerify will not exceed the amount you have paid us in the 12 months preceding the claim (which for free citizen accounts is zero).</Li>
            <Li>We are not responsible for how organisations use aggregated survey results, provided we have complied with our obligations to deliver anonymised data only.</Li>
          </Section>

          <Section title="11. Governing Law">
            <P>These Terms are governed by the laws of the State of Indiana, USA. Any disputes arising from these Terms or your use of CivicVerify will be subject to the exclusive jurisdiction of the courts of Marion County, Indiana.</P>
          </Section>

          <Section title="12. Contact">
            <P>If you have questions about these Terms, please contact us:</P>
            <div style={{ background: C.offWhite, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 15, color: C.navy, fontWeight: 600, margin: '0 0 6px' }}>CivicVerify — Legal</p>
              <p style={{ fontSize: 14, color: C.muted, margin: '0 0 4px' }}>📧 legal@civicverify.org</p>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>📍 Indianapolis, Indiana, USA</p>
            </div>
          </Section>

          <div style={{ background: C.offWhite, borderRadius: 14, padding: '24px',
            border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.7 }}>
              These Terms of Service were last updated on March 1, 2026. We recommend reviewing them periodically.
            </p>
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
