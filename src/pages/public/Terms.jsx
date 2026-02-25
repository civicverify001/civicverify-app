// src/pages/public/Terms.jsx
import { useNavigate } from 'react-router-dom';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', white: '#fff' };
var heading = "'Playfair Display', Georgia, serif";
var body = "'DM Sans', -apple-system, sans-serif";

var sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By creating an account or using CivicVerify, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the platform. CivicVerify reserves the right to update these terms at any time. Material changes will be communicated via email or a notice on the platform.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years of age to create an account on CivicVerify. By registering, you represent and warrant that you meet this age requirement and that all information you provide is accurate and truthful. Each person may only maintain one account.',
  },
  {
    title: '3. Account Registration & Security',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access or use of your account. CivicVerify is not liable for any loss or damage arising from your failure to protect your login information. Providing false information during registration or identity verification may result in account termination.',
  },
  {
    title: '4. Identity Verification',
    content: 'CivicVerify offers optional identity verification to enhance the integrity of the platform. By submitting documents for verification, you consent to the processing of your identification data by CivicVerify and its authorized verification partner(s) for the sole purpose of confirming your identity. Verification status may be displayed as a badge on your profile and community posts. Attempting to use fraudulent or stolen documents is strictly prohibited and may result in permanent account suspension and referral to authorities.',
  },
  {
    title: '5. Acceptable Use',
    content: 'You agree to use CivicVerify in a lawful and respectful manner. The following activities are prohibited:\n\n\u2022 Creating multiple accounts or impersonating another person.\n\u2022 Posting spam, harmful, abusive, threatening, defamatory, or hateful content.\n\u2022 Attempting to manipulate surveys, polls, or community discussions.\n\u2022 Using automated tools, bots, or scripts to interact with the platform.\n\u2022 Interfering with the platform\'s security, integrity, or performance.\n\u2022 Collecting or harvesting other users\' personal information.\n\u2022 Using the platform for commercial advertising or solicitation without authorization.',
  },
  {
    title: '6. Community Guidelines',
    content: 'CivicVerify is designed to foster respectful, constructive civic discourse. Community posts, replies, and chat messages must be relevant, respectful, and in good faith. Content that promotes violence, discrimination, or harassment will be removed. Repeated violations will result in account suspension. CivicVerify moderates content at its discretion and reserves the right to remove any content that violates these guidelines.',
  },
  {
    title: '7. Survey Participation',
    content: 'Survey participation is voluntary. By responding to a survey, you understand that your anonymized, aggregated responses may be shared with the organization that created the survey. Individual responses are never shared in an identifiable form. You may decline to answer any question or exit a survey at any time without penalty.',
  },
  {
    title: '8. Intellectual Property',
    content: 'All content, design, graphics, trademarks, and software on CivicVerify are owned by or licensed to CivicVerify and are protected by intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from any part of the platform without prior written consent. Content you post on the Community feed remains yours, but you grant CivicVerify a non-exclusive, worldwide license to display and distribute that content on the platform.',
  },
  {
    title: '9. Data & Privacy',
    content: 'Your use of CivicVerify is also governed by our Privacy Policy, which details how we collect, use, store, and protect your data. By using the platform, you consent to the practices described in the Privacy Policy.',
  },
  {
    title: '10. Disclaimer of Warranties',
    content: 'CivicVerify is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the platform\'s reliability, accuracy, availability, or fitness for a particular purpose. While we strive for high uptime and data accuracy, we do not guarantee uninterrupted or error-free operation.',
  },
  {
    title: '11. Limitation of Liability',
    content: 'To the fullest extent permitted by law, CivicVerify and its founders, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, including but not limited to loss of data, loss of reputation, or any decisions made based on survey data.',
  },
  {
    title: '12. Account Termination',
    content: 'You may delete your account at any time from your Account settings. CivicVerify reserves the right to suspend or terminate any account that violates these Terms, engages in fraudulent activity, or is otherwise deemed harmful to the platform or its community. Upon termination, your personal data will be handled in accordance with our Privacy Policy.',
  },
  {
    title: '13. Governing Law',
    content: 'These Terms of Service shall be governed by and construed in accordance with the laws of the United States. Any disputes arising from these terms or your use of CivicVerify shall be resolved through good-faith negotiation, and if necessary, binding arbitration.',
  },
  {
    title: '14. Contact',
    content: 'For questions about these Terms of Service, please contact us at legal@civicverify.org or through our Contact page.',
  },
];

export default function Terms() {
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
        <h1 style={{ fontSize: 40, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: heading }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.4)', margin: 0, fontFamily: body }}>Last updated: February 2026</p>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(11,37,69,0.55)', margin: '20px 0 0', fontFamily: body }}>
          Please read these terms carefully before using CivicVerify. They govern your access to and use of our platform.
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
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 12px', fontFamily: body }}>{section.title}</h2>
              {section.content.split('\n\n').map(function (para, pi) {
                return <p key={pi} style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(11,37,69,0.55)', margin: pi > 0 ? '10px 0 0' : 0, fontFamily: body, whiteSpace: 'pre-line' }}>{para}</p>;
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
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/privacy'); }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }} onClick={function () { navigate('/contact'); }}>Contact</span>
        </div>
        &copy; {new Date().getFullYear()} CivicVerify. All rights reserved.
      </footer>
    </div>
  );
}
