// src/pages/public/Privacy.jsx
import { useNavigate } from 'react-router-dom';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', white: '#fff' };
var heading = "'Playfair Display', Georgia, serif";
var body = "'DM Sans', -apple-system, sans-serif";

var sections = [
  {
    title: '1. Information We Collect',
    content: [
      { subtitle: 'Account Information', text: 'When you create an account, we collect your name, email address, and password. You may optionally provide demographic information such as your city, state, date of birth, education level, employment status, and political affiliation to help match you with relevant surveys.' },
      { subtitle: 'Identity Verification Data', text: 'If you choose to verify your identity, we process government-issued identification documents and biometric data (such as a selfie) through our secure identity verification partner. We do not store copies of your ID documents on our servers — they are processed in a secure, isolated environment and discarded after verification is complete.' },
      { subtitle: 'Survey Responses', text: 'When you participate in surveys, we collect your responses. Individual responses are stored securely and are never shared with third parties in a way that could identify you personally.' },
      { subtitle: 'Community Activity', text: 'Posts, comments, reactions, and chat messages you contribute to the Community feed and survey discussion rooms are stored on our platform. Your display name and verified status are visible to other users.' },
      { subtitle: 'Usage Data', text: 'We automatically collect standard technical data such as your IP address, browser type, device type, and pages visited. This data is used exclusively for platform security, performance monitoring, and improving user experience.' },
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      { text: 'We use the information we collect for the following purposes:' },
      { text: '\u2022 To create and manage your account and authenticate your identity.' },
      { text: '\u2022 To match you with relevant surveys based on your demographic profile.' },
      { text: '\u2022 To display your posts and contributions in the Community feed.' },
      { text: '\u2022 To generate anonymized, aggregated survey results for organizational partners.' },
      { text: '\u2022 To prevent fraud, abuse, and duplicate accounts.' },
      { text: '\u2022 To improve the platform, fix bugs, and develop new features.' },
      { text: '\u2022 To communicate important updates about your account or the platform.' },
    ],
  },
  {
    title: '3. How We Share Your Information',
    content: [
      { subtitle: 'We Never Sell Your Personal Data', text: 'CivicVerify will never sell, rent, or trade your personally identifiable information (PII) to any third party, under any circumstances.' },
      { subtitle: 'Aggregated & Anonymized Data', text: 'Survey results shared with organizational partners (nonprofits, researchers, government agencies) are always fully anonymized and aggregated. No individual response can be traced back to a specific user.' },
      { subtitle: 'Identity Verification Partners', text: 'Your ID documents are processed by our identity verification partner solely for the purpose of confirming your identity. They operate under strict data processing agreements and are prohibited from retaining or using your data for any other purpose.' },
      { subtitle: 'Legal Requirements', text: 'We may disclose your information if required by law, court order, or government regulation, or if necessary to protect the rights, safety, or property of CivicVerify, its users, or the public.' },
    ],
  },
  {
    title: '4. Data Security',
    content: [
      { text: 'We implement industry-standard security measures to protect your data:' },
      { text: '\u2022 All data in transit is encrypted using TLS 1.3.' },
      { text: '\u2022 All data at rest is encrypted using AES-256 encryption.' },
      { text: '\u2022 Access to production systems is restricted to authorized personnel with role-based permissions.' },
      { text: '\u2022 We conduct regular security assessments and follow OWASP best practices.' },
      { text: '\u2022 Identity verification documents are processed in isolated, secure environments and are not stored after verification.' },
    ],
  },
  {
    title: '5. Your Rights & Choices',
    content: [
      { subtitle: 'Access & Export', text: 'You can view all personal data we hold about you from your Account settings. You may request a full export of your data at any time.' },
      { subtitle: 'Correction', text: 'You can update your profile information at any time from your Account page.' },
      { subtitle: 'Deletion', text: 'You may request deletion of your account and all associated personal data. Upon deletion, your data is permanently removed from our systems within 30 days. Anonymized, aggregated survey data that cannot be linked to you may be retained.' },
      { subtitle: 'Opt-Out', text: 'You can opt out of non-essential communications at any time. Survey participation is always voluntary.' },
    ],
  },
  {
    title: '6. Cookies & Tracking',
    content: [
      { text: 'CivicVerify uses essential cookies required for authentication and platform functionality. We do not use third-party advertising cookies or tracking pixels. We do not serve ads of any kind.' },
    ],
  },
  {
    title: '7. Children\'s Privacy',
    content: [
      { text: 'CivicVerify is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we learn that we have collected data from a child under 18, we will delete it promptly.' },
    ],
  },
  {
    title: '8. Changes to This Policy',
    content: [
      { text: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or a prominent notice on our platform. Your continued use of CivicVerify after changes take effect constitutes acceptance of the updated policy.' },
    ],
  },
  {
    title: '9. Contact Us',
    content: [
      { text: 'If you have questions about this Privacy Policy or how we handle your data, please contact us at privacy@civicverify.org or through our Contact page.' },
    ],
  },
];

export default function Privacy() {
  var navigate = useNavigate();

  return (
    <div style={{ fontFamily: body, color: C.navy, background: C.cream, minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '16px 32px',
        background: 'rgba(245,241,236,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(11,37,69,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function () { navigate('/'); }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: body }}>CV</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: heading }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
        </div>
        <button onClick={function () { navigate('/'); }}
          style={{ padding: '9px 20px', background: 'transparent', border: '1px solid rgba(11,37,69,0.12)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.navy, cursor: 'pointer', fontFamily: body }}>
          Back to Home
        </button>
      </nav>

      {/* Header */}
      <section style={{ padding: '60px 32px 40px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: heading }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.4)', margin: 0, fontFamily: body }}>Last updated: February 2026</p>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(11,37,69,0.55)', margin: '20px 0 0', fontFamily: body }}>
          Your privacy is fundamental to our mission. This policy explains what data we collect, how we use it, and the choices you have.
        </p>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 740, margin: '0 auto', padding: '0 32px 80px' }}>
        {sections.map(function (section, si) {
          return (
            <div key={si} style={{
              background: C.white, borderRadius: 16, padding: '28px 32px',
              border: '1px solid rgba(11,37,69,0.06)', marginBottom: 16,
              boxShadow: '0 2px 12px rgba(11,37,69,0.04)',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 16px', fontFamily: body }}>{section.title}</h2>
              {section.content.map(function (item, ci) {
                return (
                  <div key={ci} style={{ marginBottom: ci < section.content.length - 1 ? 14 : 0 }}>
                    {item.subtitle && <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: body }}>{item.subtitle}</h3>}
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(11,37,69,0.55)', margin: 0, fontFamily: body }}>{item.text}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px', borderTop: '1px solid rgba(11,37,69,0.08)',
        textAlign: 'center', fontSize: 13, color: 'rgba(11,37,69,0.3)', fontFamily: body,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/about'); }}>About Us</span>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/terms'); }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/contact'); }}>Contact</span>
        </div>
        &copy; {new Date().getFullYear()} CivicVerify. All rights reserved.
      </footer>
    </div>
  );
}
