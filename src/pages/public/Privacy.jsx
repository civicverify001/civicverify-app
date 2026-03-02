import { useEffect } from 'react'
import { Link } from 'react-router-dom'

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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48, paddingBottom: 48,
      borderBottom: `1px solid ${C.border}` }}>
      <h2 style={{ fontFamily: font, fontSize: 24, fontWeight: 700, color: C.navy,
        margin: '0 0 18px', paddingLeft: 16,
        borderLeft: `4px solid ${C.gold}` }}>{title}</h2>
      {children}
    </div>
  )
}

function P({ children }) {
  return <p style={{ fontSize: 15, color: '#3a4a5c', lineHeight: 1.85, margin: '0 0 14px' }}>{children}</p>
}

function Li({ children, icon = '✅' }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 15, color: '#3a4a5c', lineHeight: 1.7 }}>{children}</span>
    </div>
  )
}


export default function Privacy() {
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
          <Link to="/terms" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Terms</Link>
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
            <span style={{ fontSize: 12, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: '.14em' }}>Privacy Policy</span>
          </div>
          <h1 style={{ fontFamily: font, fontSize: 44, fontWeight: 700, color: '#fff',
            lineHeight: 1.2, margin: '0 0 18px' }}>
            Your Data Belongs to You.<br />
            <span style={{ color: C.goldL, fontStyle: 'italic' }}>No Exceptions.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 20px' }}>
            Last updated: March 1, 2026
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
            This policy explains exactly what data we collect, how we use it, and the absolute limits on what we will ever do with it. We have written it in plain English on purpose.
          </p>
        </div>
      </section>

      {/* ── PLEDGE BANNER ── */}
      <div style={{ background: C.navyDeep, padding: '32px 28px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto',
          background: 'rgba(197,150,12,0.1)', border: '1px solid rgba(197,150,12,0.25)',
          borderRadius: 16, padding: '28px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: font, fontSize: 20, color: C.goldL, fontWeight: 700, margin: '0 0 8px' }}>
            The CivicVerify Data Pledge
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, margin: '0 0 8px' }}>
            No one — including CivicVerify staff — has access to individual citizen responses.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: 0 }}>
            Organisations receive aggregated statistical results only. Nothing else. Ever.
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <section style={{ padding: '64px 28px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>

          <Section title="1. What Data We Collect">
            <P>We collect only what is strictly necessary to operate CivicVerify. We never collect data speculatively or for future monetisation.</P>
            <Li>
              <strong>Account information:</strong> Your name, email address, and password (stored as a secure hash — we never see your actual password).
            </Li>
            <Li>
              <strong>Identity verification:</strong> Your government-issued ID document, processed once through our verification partner (Didit). The document is immediately and permanently deleted after verification is confirmed. We retain only a one-way cryptographic token that confirms you are a unique, real citizen — we cannot reverse this token to recover your identity.
            </Li>
            <Li>
              <strong>Demographic profile (optional):</strong> Age range, location, and other profile fields you choose to fill in. These are used solely to match you to relevant surveys. You control what you share.
            </Li>
            <Li>
              <strong>Survey responses:</strong> Your answers to civic surveys. These are stored in encrypted form and are never linked to your identity in any queryable way.
            </Li>
            <Li>
              <strong>Usage data:</strong> Standard server logs (IP address, browser type, pages visited) used for security monitoring and performance. Retained for 30 days maximum.
            </Li>
          </Section>

          <Section title="2. What We Will Never Do With Your Data">
            <P>These are absolute commitments. They are not subject to business conditions, partner agreements, or future changes in policy.</P>
            <Li icon="🚫"><strong>We will never sell your data</strong> — to advertisers, data brokers, political organisations, research firms, or any other third party, for any price, under any circumstances.</Li>
            <Li icon="🚫"><strong>We will never share your individual responses</strong> with organisations that commission surveys. They receive aggregated statistical results only.</Li>
            <Li icon="🚫"><strong>We will never link your identity to your political opinions</strong> — technically or otherwise. The systems are architecturally separated.</Li>
            <Li icon="🚫"><strong>We will never use your data for advertising</strong> — on our platform or anyone else's. CivicVerify is ad-free by design.</Li>
            <Li icon="🚫"><strong>We will never retain your ID document</strong> beyond the moment of verification. It is deleted immediately.</Li>
            <Li icon="🚫"><strong>We will never allow CivicVerify employees to query individual response records.</strong> Database access controls make this technically impossible, not just policy-prohibited.</Li>
          </Section>

          <Section title="3. How Identity Verification Works">
            <P>Understanding exactly what happens to your ID is important. Here is the complete process:</P>
            <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
              {[
                ['Step 1', 'You submit your government-issued ID via our secure verification partner, Didit. The upload is encrypted in transit using TLS 1.3.'],
                ['Step 2', 'Didit confirms your ID is valid and that you are a unique individual who has not previously registered. This takes approximately 30 seconds.'],
                ['Step 3', 'Your ID document is permanently deleted from Didit\'s and CivicVerify\'s systems immediately upon confirmation.'],
                ['Step 4', 'A one-way cryptographic token is stored against your account — this confirms your uniqueness but cannot be reversed to identify you.'],
                ['Step 5', 'Your identity verification status (verified / not verified) is stored. Your actual identity is not.'],
              ].map(([step, desc]) => (
                <div key={step} style={{ display: 'flex', gap: 16, padding: '16px 18px',
                  background: C.offWhite, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, flexShrink: 0,
                    textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 3 }}>{step}</span>
                  <span style={{ fontSize: 14.5, color: '#3a4a5c', lineHeight: 1.65 }}>{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. How Survey Responses Are Protected">
            <P>Your civic participation is protected by both technical controls and strict policy:</P>
            <Li>Survey responses are encrypted at rest using AES-256 encryption.</Li>
            <Li>Responses are stored in a separate database partition from identity records — they cannot be joined by design.</Li>
            <Li>When an organisation receives results from a commissioned survey, they receive only: percentage breakdowns, demographic summaries (e.g. "42% of respondents aged 25–34 supported this policy"), and total response counts.</Li>
            <Li>Minimum response thresholds apply — no results are released for surveys with fewer than a defined number of responses, preventing reverse-identification of small groups.</Li>
            <Li>No individual response record, timestamp, or participant identifier is ever included in results delivered to organisations.</Li>
          </Section>

          <Section title="5. Data Retention">
            <P>We keep data for as long as it is needed and no longer.</P>
            <Li><strong>ID documents:</strong> Deleted immediately after verification (within seconds of confirmation).</Li>
            <Li><strong>Server logs:</strong> Deleted after 30 days.</Li>
            <Li><strong>Account data:</strong> Retained while your account is active. Deleted permanently within 30 days of account deletion request.</Li>
            <Li><strong>Survey responses:</strong> Retained in anonymised, aggregated form for platform analytics. Individual response records deleted within 30 days of account deletion.</Li>
            <Li><strong>Cryptographic verification token:</strong> Retained to prevent re-registration. If you delete your account, the token is also deleted — meaning you would need to re-verify if you create a new account.</Li>
          </Section>

          <Section title="6. Your Rights">
            <P>You have the following rights over your data at all times:</P>
            <Li><strong>Right to access:</strong> You can request a full export of all data we hold about you.</Li>
            <Li><strong>Right to deletion:</strong> You can delete your account and all associated data at any time from your Account Settings page. Deletion is immediate and permanent.</Li>
            <Li><strong>Right to correction:</strong> You can update your profile information at any time.</Li>
            <Li><strong>Right to withdraw consent:</strong> You can stop participating in surveys at any time. Past responses that have already been included in aggregated results cannot be retroactively removed (as they no longer exist as individual records), but no future responses will be collected.</Li>
            <Li><strong>Right to complain:</strong> If you believe we have handled your data incorrectly, contact us at privacy@civicverify.org. We take all complaints seriously and will respond within 5 business days.</Li>
          </Section>

          <Section title="7. Government and Legal Requests">
            <P>We take a firm position on government access to citizen data:</P>
            <Li icon="🛡️">We do not voluntarily provide any citizen data to government agencies, law enforcement, or any authority without a lawful court order.</Li>
            <Li icon="🛡️">If we receive a court order, we will comply with only the minimum data legally required — and because we do not link identities to responses, individual civic opinions are not accessible even under court order.</Li>
            <Li icon="🛡️">We will notify affected users of legal requests whenever we are legally permitted to do so.</Li>
            <Li icon="🛡️">We will always publish aggregate statistics on legal requests received in our annual Transparency Report.</Li>
          </Section>

          <Section title="8. Third-Party Services">
            <P>We use a small number of trusted third-party services to operate CivicVerify:</P>
            <Li><strong>Didit</strong> — identity verification. Processes your ID once and returns a verification result. Subject to their own privacy policy and our data processing agreement requiring immediate deletion.</Li>
            <Li><strong>Supabase</strong> — database and authentication infrastructure. All data is encrypted at rest and in transit. Hosted on secure cloud infrastructure.</Li>
            <Li><strong>Vercel</strong> — website hosting and deployment. Does not have access to user data.</Li>
            <P>We do not use advertising networks, analytics platforms that track individuals across the web, or any service that monetises user behaviour.</P>
          </Section>

          <Section title="9. Security">
            <P>We implement the following security measures:</P>
            <Li>All data encrypted in transit using TLS 1.3.</Li>
            <Li>All data encrypted at rest using AES-256.</Li>
            <Li>Database access controlled by role-based permissions — staff cannot access individual response records.</Li>
            <Li>Regular security reviews of our infrastructure.</Li>
            <Li>If a security breach occurs that affects your data, we will notify you within 72 hours of becoming aware of it.</Li>
          </Section>

          <Section title="10. Contact Us">
            <P>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</P>
            <div style={{ background: C.offWhite, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 15, color: C.navy, fontWeight: 600, margin: '0 0 6px' }}>CivicVerify — Privacy Team</p>
              <p style={{ fontSize: 14, color: C.muted, margin: '0 0 4px' }}>📧 privacy@civicverify.org</p>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>📍 Indianapolis, Indiana, USA</p>
            </div>
          </Section>

          <div style={{ background: C.offWhite, borderRadius: 14, padding: '24px',
            border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.7 }}>
              This Privacy Policy was last updated on March 1, 2026. We will notify registered users by email of any material changes before they take effect.
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
