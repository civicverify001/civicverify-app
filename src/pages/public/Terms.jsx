// src/pages/public/Terms.jsx — Terms of Service
import { useNavigate } from 'react-router-dom';
import CanonicalUrl from '../../components/CanonicalUrl';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E' };
var font = 'Libre Baskerville, Georgia, serif';

var sectionStyle = { marginBottom: 32 };
var h2Style = { fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid rgba(11,37,69,0.08)' };
var pStyle = { fontSize: 14, lineHeight: 1.75, color: 'rgba(11,37,69,0.6)', margin: '0 0 12px' };
var liStyle = { fontSize: 14, lineHeight: 1.75, color: 'rgba(11,37,69,0.6)', marginBottom: 6 };

export default function Terms() {
  var navigate = useNavigate();
  var updated = 'March 2, 2026';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,' + C.cream + ' 0%,#fff 100%)', fontFamily: 'DM Sans,-apple-system,sans-serif' }}>
      <CanonicalUrl />

      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(11,37,69,0.06)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>CV</span></div>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
          </div>
          <span onClick={function(){navigate(-1)}} style={{ fontSize: 13, color: C.gold, fontWeight: 600, cursor: 'pointer' }}>{'\u2190'} Back</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 8px' }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 8px' }}>Last updated: {updated}</p>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 32px' }}>Effective date: {updated}</p>

        {/* Acceptance */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Acceptance of Terms</h2>
          <p style={pStyle}>By creating an account on CivicVerify ("Platform"), operated at civicverify.org, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not create an account or use the Platform. These Terms constitute a legally binding agreement between you and CivicVerify ("we," "our," or "us").</p>
        </div>

        {/* Eligibility */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Eligibility & Age Requirement</h2>
          <div style={{ background: C.red + '06', border: '1px solid ' + C.red + '15', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
            <p style={{ fontSize: 14, color: C.navy, margin: 0, lineHeight: 1.6, fontWeight: 600 }}>You must be at least 18 years of age to use CivicVerify.</p>
          </div>
          <p style={pStyle}>By creating an account, you represent and warrant that you are at least 18 years old. Our identity verification process requires a government-issued photo ID, which serves as an additional age safeguard. If we discover that a user is under 18, we will immediately terminate their account and delete all associated data.</p>
          <p style={pStyle}>You must be a resident of the United States to use the Platform. By creating an account, you represent that you are a U.S. resident.</p>
        </div>

        {/* Account */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Your Account</h2>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}><strong>One account per person:</strong> You may create only one account on CivicVerify. The Platform is designed around the principle of "one person, one verified voice." Creating multiple accounts will result in termination of all accounts.</li>
            <li style={liStyle}><strong>Account security:</strong> You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account. Notify us immediately of any unauthorized use.</li>
            <li style={liStyle}><strong>Accurate information:</strong> You agree to provide truthful, accurate, and complete information when creating your account and completing your profile. Providing false demographic information undermines the integrity of the Platform and may result in account termination.</li>
          </ul>
        </div>

        {/* Data Accuracy */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Data Accuracy & Integrity</h2>
          <p style={pStyle}>CivicVerify's value depends on authentic, accurate data from real, verified citizens. By using the Platform, you agree to:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Provide truthful demographic information (race, sex, income, political affiliation, etc.) to the best of your knowledge.</li>
            <li style={liStyle}>Answer surveys honestly and thoughtfully.</li>
            <li style={liStyle}>Not impersonate any other person or misrepresent your identity.</li>
            <li style={liStyle}>Not use bots, scripts, or automated tools to interact with the Platform.</li>
          </ul>
          <p style={pStyle}>We reserve the right to terminate accounts that we reasonably believe are providing intentionally false or misleading information.</p>
        </div>

        {/* Identity Verification */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Identity Verification</h2>
          <p style={pStyle}>CivicVerify offers optional identity verification through our partner, Didit (didit.me). By choosing to verify your identity, you:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Consent to Didit processing your government-issued ID and facial biometrics solely for identity verification purposes.</li>
            <li style={liStyle}>Understand that your ID and biometric data are processed by Didit and deleted within 30 days of verification.</li>
            <li style={liStyle}>Understand that CivicVerify does NOT store your government ID or biometric data on our servers.</li>
            <li style={liStyle}>Acknowledge that verified status may grant access to additional Platform features, such as participation in verified-only surveys.</li>
          </ul>
        </div>

        {/* How Orgs See Data */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. How Organizations Use Survey Data</h2>
          <p style={pStyle}>Organizations that create surveys on CivicVerify receive only anonymous, aggregated results. This means:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Organizations can see <strong>how many</strong> people of a certain demographic answered a certain way, but can <strong>never</strong> identify individual respondents.</li>
            <li style={liStyle}>Your name, email, phone number, and other identifying information are <strong>never</strong> shared with organizations.</li>
            <li style={liStyle}>Organizations may <strong>not</strong> use CivicVerify data to discriminate against, target, harass, or otherwise harm any individual or group.</li>
          </ul>
        </div>

        {/* Prohibited Use */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Prohibited Uses</h2>
          <p style={pStyle}>You agree NOT to:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Create multiple accounts or help others create fake accounts.</li>
            <li style={liStyle}>Use the Platform for any illegal purpose.</li>
            <li style={liStyle}>Harass, threaten, or abuse other users in community features.</li>
            <li style={liStyle}>Post content that is defamatory, obscene, hateful, or promotes violence.</li>
            <li style={liStyle}>Attempt to access other users' accounts or personal data.</li>
            <li style={liStyle}>Scrape, crawl, or use automated tools to extract data from the Platform.</li>
            <li style={liStyle}>Reverse engineer, decompile, or otherwise attempt to extract the source code of the Platform.</li>
            <li style={liStyle}>Use CivicVerify data to discriminate against individuals or groups.</li>
          </ul>
        </div>

        {/* Community Guidelines */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Community Content</h2>
          <p style={pStyle}>The Platform includes community discussion features including posts, comments, debates, and polls. You retain ownership of content you post, but grant CivicVerify a non-exclusive, royalty-free license to display and distribute your content within the Platform. We reserve the right to remove content that violates these Terms or our community guidelines, and to suspend or terminate accounts of repeat violators.</p>
        </div>

        {/* Account Deletion */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Account Deletion & Data Removal</h2>
          <p style={pStyle}>You may request deletion of your account and personal data at any time. To request account deletion:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Email privacy@civicverify.org with the subject "Account Deletion Request"</li>
            <li style={liStyle}>Include the email address associated with your account</li>
          </ul>
          <p style={pStyle}>Upon receiving your request, we will:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Delete your account and all associated personal data within <strong>45 days</strong>.</li>
            <li style={liStyle}>Remove your community posts and comments.</li>
            <li style={liStyle}>Retain anonymized, aggregated survey response data that cannot be linked back to you.</li>
            <li style={liStyle}>Retain consent records as required by law.</li>
          </ul>
          <p style={pStyle}>We may also terminate your account if you violate these Terms, with notice where practicable.</p>
        </div>

        {/* Disclaimers */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Disclaimers & Limitation of Liability</h2>
          <p style={pStyle}>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>
          <p style={pStyle}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CIVICVERIFY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.</p>
          <p style={pStyle}>CivicVerify does not guarantee the accuracy of user-provided demographic data or survey responses. Organizations using survey data should consider it as one input among many in their decision-making.</p>
        </div>

        {/* Governing Law */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Governing Law & Dispute Resolution</h2>
          <p style={pStyle}>These Terms are governed by the laws of the State of Indiana, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Platform shall be resolved in the state or federal courts located in Marion County, Indiana. Before filing any claim, you agree to attempt to resolve the dispute informally by contacting us at privacy@civicverify.org.</p>
        </div>

        {/* Changes */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Changes to These Terms</h2>
          <p style={pStyle}>We may update these Terms from time to time. If we make material changes, we will notify you by posting a prominent notice on the Platform or by email at least 30 days before the changes take effect. Your continued use of the Platform after changes are posted constitutes acceptance of the updated Terms.</p>
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Contact Us</h2>
          <p style={pStyle}>If you have questions about these Terms, please contact us:</p>
          <div style={{ background: 'rgba(11,37,69,0.02)', borderRadius: 10, padding: '16px 18px', marginTop: 8 }}>
            <p style={{ ...pStyle, margin: '0 0 4px' }}><strong>CivicVerify</strong></p>
            <p style={{ ...pStyle, margin: '0 0 4px' }}>Email: privacy@civicverify.org</p>
            <p style={{ ...pStyle, margin: 0 }}>Website: civicverify.org</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(11,37,69,0.2)', marginTop: 40 }}>{'\u00A9'} {new Date().getFullYear()} CivicVerify. One person, one verified voice.</p>
      </div>
    </div>
  );
}
