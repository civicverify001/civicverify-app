// src/pages/public/Privacy.jsx — ICDPA-Compliant Privacy Policy
import { useNavigate } from 'react-router-dom';
import CanonicalUrl from '../../components/CanonicalUrl';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E' };
var font = 'Libre Baskerville, Georgia, serif';

var sectionStyle = { marginBottom: 32 };
var h2Style = { fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid rgba(11,37,69,0.08)' };
var h3Style = { fontSize: 15, fontWeight: 700, color: C.navy, margin: '20px 0 8px' };
var pStyle = { fontSize: 14, lineHeight: 1.75, color: 'rgba(11,37,69,0.6)', margin: '0 0 12px' };
var liStyle = { fontSize: 14, lineHeight: 1.75, color: 'rgba(11,37,69,0.6)', marginBottom: 6 };
var tableCell = { padding: '10px 14px', fontSize: 13, lineHeight: 1.5, color: 'rgba(11,37,69,0.6)', borderBottom: '1px solid rgba(11,37,69,0.06)', verticalAlign: 'top' };
var tableHeader = { padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(11,37,69,0.35)', borderBottom: '2px solid rgba(11,37,69,0.1)', textAlign: 'left', background: 'rgba(11,37,69,0.02)' };

export default function Privacy() {
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
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 8px' }}>Last updated: {updated}</p>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 32px' }}>Effective date: {updated}</p>

        {/* Overview */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Overview</h2>
          <p style={pStyle}>CivicVerify ("we," "our," or "us") operates the civic engagement platform at civicverify.org ("Platform"). This Privacy Policy describes how we collect, use, share, and protect your personal information when you use our Platform.</p>
          <p style={pStyle}>CivicVerify is committed to protecting your privacy. We believe authentic civic participation requires trust, and that trust starts with transparency about how we handle your data.</p>
          <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.6 }}><strong style={{ color: C.navy }}>Key principles:</strong> We never sell your individual data. Organizations only see anonymous, aggregated survey results. Your identity documents are processed by our verification partner and deleted within 30 days. You can delete your data anytime.</p>
          </div>
        </div>

        {/* Data We Collect */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Information We Collect</h2>
          <p style={pStyle}>We collect the following categories of personal information:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr><th style={tableHeader}>Category</th><th style={tableHeader}>Specific Data</th><th style={tableHeader}>Classification</th></tr>
            </thead>
            <tbody>
              <tr><td style={tableCell}><strong>Account Information</strong></td><td style={tableCell}>Full name, email address, phone number, password (encrypted)</td><td style={tableCell}>Personal Data</td></tr>
              <tr><td style={tableCell}><strong>Location Data</strong></td><td style={tableCell}>State, county, city, ZIP code</td><td style={tableCell}>Personal Data</td></tr>
              <tr><td style={tableCell}><strong>Demographic Data</strong></td><td style={tableCell}>Race/ethnicity, sex, date of birth, education, employment, income, marital status, housing status, veteran status, voter registration, political party</td><td style={{ ...tableCell, color: C.red }}>Sensitive Data*</td></tr>
              <tr><td style={tableCell}><strong>Identity Verification</strong></td><td style={tableCell}>Government-issued ID (processed by Didit), facial biometrics for liveness check</td><td style={{ ...tableCell, color: C.red }}>Sensitive Data*</td></tr>
              <tr><td style={tableCell}><strong>Survey Responses</strong></td><td style={tableCell}>Your answers to polls and surveys on the Platform</td><td style={tableCell}>Personal Data</td></tr>
              <tr><td style={tableCell}><strong>Community Content</strong></td><td style={tableCell}>Posts, comments, reactions in community discussions</td><td style={tableCell}>Personal Data</td></tr>
              <tr><td style={tableCell}><strong>Usage Data</strong></td><td style={tableCell}>Pages visited, features used, IP address, browser type (collected via Google Analytics)</td><td style={tableCell}>Technical Data</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', marginTop: 8 }}>*Sensitive Data requires your explicit opt-in consent before collection, as required by the Indiana Consumer Data Protection Act (ICDPA).</p>
        </div>

        {/* Purpose */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. How We Use Your Information</h2>
          <p style={pStyle}>We use your personal information for the following specific purposes:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}><strong>Account management:</strong> To create and manage your account, authenticate your identity, and communicate with you about your account.</li>
            <li style={liStyle}><strong>Identity verification:</strong> To verify you are a real, unique person through our third-party verification partner (Didit), ensuring one person = one voice on the Platform.</li>
            <li style={liStyle}><strong>Survey matching:</strong> To match you with surveys and polls relevant to your demographics and location.</li>
            <li style={liStyle}><strong>Aggregated reporting:</strong> To provide organizations with anonymous, aggregated survey results broken down by demographics. Individual responses are never shared.</li>
            <li style={liStyle}><strong>Community features:</strong> To enable you to participate in community discussions, debates, and polls.</li>
            <li style={liStyle}><strong>Platform improvement:</strong> To understand how users interact with the Platform and improve our services using anonymized analytics.</li>
            <li style={liStyle}><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorized access.</li>
          </ul>
          <p style={pStyle}>We do <strong>not</strong> use your data for targeted advertising. We do <strong>not</strong> sell your individual personal data to any third party.</p>
        </div>

        {/* Third Parties */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Third Parties Who Receive Your Data</h2>
          <p style={pStyle}>We share your personal information with the following third-party service providers, solely to operate the Platform:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr><th style={tableHeader}>Provider</th><th style={tableHeader}>Purpose</th><th style={tableHeader}>Data Shared</th><th style={tableHeader}>Retention</th></tr>
            </thead>
            <tbody>
              <tr><td style={tableCell}><strong>Didit</strong> (didit.me)</td><td style={tableCell}>Identity verification — processes government ID and facial biometrics to confirm your identity</td><td style={tableCell}>Government ID image, selfie/facial scan</td><td style={tableCell}>Deleted within 30 days of verification</td></tr>
              <tr><td style={tableCell}><strong>Supabase</strong> (supabase.com)</td><td style={tableCell}>Database hosting — stores your account data, survey responses, and community content</td><td style={tableCell}>All account and platform data</td><td style={tableCell}>Until you delete your account</td></tr>
              <tr><td style={tableCell}><strong>Vercel</strong> (vercel.com)</td><td style={tableCell}>Website hosting — serves the Platform to your browser</td><td style={tableCell}>Server logs (IP address, browser type)</td><td style={tableCell}>30 days</td></tr>
              <tr><td style={tableCell}><strong>Google Analytics</strong> (GA4)</td><td style={tableCell}>Analytics — helps us understand how users interact with the Platform</td><td style={tableCell}>Page views, device info, anonymized IP</td><td style={tableCell}>14 months</td></tr>
              <tr><td style={tableCell}><strong>hCaptcha</strong></td><td style={tableCell}>Bot protection — prevents automated signups</td><td style={tableCell}>Browser fingerprint, interaction data</td><td style={tableCell}>Per hCaptcha policy</td></tr>
            </tbody>
          </table>
          <p style={pStyle}>We do not share, sell, rent, or trade your individual personal data with any organizations using the Platform for surveys. Organizations only receive anonymous, aggregated results.</p>
        </div>

        {/* Biometric Data */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Biometric Data & Identity Verification</h2>
          <p style={pStyle}>When you choose to verify your identity on CivicVerify, our verification partner <strong>Didit</strong> (didit.me) processes your biometric data:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}><strong>What is collected:</strong> A photo of your government-issued ID and a selfie or liveness video. Didit extracts facial geometry to compare these images.</li>
            <li style={liStyle}><strong>Purpose:</strong> To confirm you are a real person and that your ID belongs to you. This ensures one person = one verified voice.</li>
            <li style={liStyle}><strong>Consent:</strong> You must provide explicit consent before the verification process begins. Verification is optional but required to participate in verified surveys.</li>
            <li style={liStyle}><strong>Storage:</strong> CivicVerify does NOT store your government ID or biometric data. Didit processes and stores this data for up to 30 days, after which it is automatically and permanently deleted.</li>
            <li style={liStyle}><strong>No sale:</strong> Your biometric data is never sold, rented, or traded.</li>
            <li style={liStyle}><strong>Deletion:</strong> You can request deletion of your biometric data at any time by contacting us.</li>
          </ul>
          <div style={{ background: C.red + '06', border: '1px solid ' + C.red + '15', borderRadius: 10, padding: '14px 16px', marginTop: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.6 }}><strong style={{ color: C.navy }}>Illinois residents:</strong> If you reside in Illinois, additional protections under the Illinois Biometric Information Privacy Act (BIPA) apply to your biometric data. By proceeding with identity verification, you provide written consent as required under BIPA.</p>
          </div>
        </div>

        {/* Data Retention */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Data Retention</h2>
          <p style={pStyle}>We retain your data only as long as necessary for the purposes described in this policy:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}><strong>Account data:</strong> Retained while your account is active. Deleted within 45 days of account deletion request.</li>
            <li style={liStyle}><strong>Identity verification data:</strong> Processed by Didit and deleted within 30 days of verification.</li>
            <li style={liStyle}><strong>Survey responses:</strong> Retained in anonymized/aggregated form even after account deletion, as they cannot be linked back to you.</li>
            <li style={liStyle}><strong>Community content:</strong> Posts and comments are deleted when you delete your account.</li>
            <li style={liStyle}><strong>Analytics data:</strong> Google Analytics retains data for 14 months, after which it is automatically deleted.</li>
            <li style={liStyle}><strong>Consent records:</strong> We retain records of when and how you provided consent for legal compliance purposes.</li>
          </ul>
        </div>

        {/* ICDPA Rights */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Your Rights Under the Indiana Consumer Data Protection Act (ICDPA)</h2>
          <p style={pStyle}>If you are an Indiana resident, you have the following rights under the ICDPA, effective January 1, 2026:</p>
          <div style={{ background: 'rgba(11,37,69,0.02)', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 12, padding: '16px 18px', marginTop: 12 }}>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li style={{ ...liStyle, marginBottom: 10 }}><strong style={{ color: C.navy }}>Right to Know:</strong> You have the right to confirm whether we are processing your personal data and to access a copy of that data.</li>
              <li style={{ ...liStyle, marginBottom: 10 }}><strong style={{ color: C.navy }}>Right to Correct:</strong> You have the right to correct inaccurate personal data. You can update most information directly in your account settings.</li>
              <li style={{ ...liStyle, marginBottom: 10 }}><strong style={{ color: C.navy }}>Right to Delete:</strong> You have the right to request deletion of your personal data. We will comply within 45 days.</li>
              <li style={{ ...liStyle, marginBottom: 10 }}><strong style={{ color: C.navy }}>Right to Data Portability:</strong> You have the right to obtain a copy of your personal data in a portable, commonly used format.</li>
              <li style={{ ...liStyle, marginBottom: 10 }}><strong style={{ color: C.navy }}>Right to Opt Out:</strong> You have the right to opt out of the processing of your personal data for targeted advertising (we do not do this), sales of personal data (we do not do this), or profiling.</li>
              <li style={{ ...liStyle, marginBottom: 0 }}><strong style={{ color: C.navy }}>Right to Appeal:</strong> If we decline your request, you have the right to appeal. If your appeal is denied, you may file a complaint with the Indiana Attorney General.</li>
            </ul>
          </div>
          <h3 style={h3Style}>How to Exercise Your Rights</h3>
          <p style={pStyle}>To exercise any of these rights, you may:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>Email us at <strong>privacy@civicverify.org</strong></li>
            <li style={liStyle}>Use the "Manage My Data" section in your account settings</li>
            <li style={liStyle}>Submit a request through our contact form</li>
          </ul>
          <p style={pStyle}>We will respond to your request within <strong>45 days</strong>. If we need additional time, we will notify you within the initial 45-day period. We will not discriminate against you for exercising your rights.</p>
        </div>

        {/* Cookies & Analytics */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Cookies & Analytics</h2>
          <p style={pStyle}>CivicVerify uses the following tracking technologies:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}><strong>Google Analytics 4 (GA4):</strong> We use GA4 to understand how visitors use our Platform, including pages visited, time spent, and general device information. GA4 uses cookies to collect this data. We have enabled IP anonymization.</li>
            <li style={liStyle}><strong>Essential cookies:</strong> We use cookies strictly necessary for the Platform to function, including authentication (keeping you logged in) and security (hCaptcha).</li>
          </ul>
          <p style={pStyle}>We do <strong>not</strong> use cookies for targeted advertising or retargeting. You can opt out of analytics tracking using the cookie consent banner when you first visit our site, or by adjusting your browser settings.</p>
        </div>

        {/* Children */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Children's Privacy</h2>
          <p style={pStyle}>CivicVerify is not intended for anyone under the age of 18. We do not knowingly collect personal information from children. Our identity verification process requires a government-issued ID, which serves as an additional safeguard. If we learn that we have collected data from a person under 18, we will delete that data promptly. If you believe a minor has created an account, please contact us immediately.</p>
        </div>

        {/* Data Security */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Data Security</h2>
          <p style={pStyle}>We implement reasonable administrative, technical, and physical safeguards to protect your personal information:</p>
          <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
            <li style={liStyle}>All data transmitted to and from the Platform is encrypted using TLS/SSL (HTTPS).</li>
            <li style={liStyle}>Passwords are hashed and never stored in plain text.</li>
            <li style={liStyle}>Our database provider (Supabase) implements row-level security and encryption at rest.</li>
            <li style={liStyle}>Our identity verification partner (Didit) is ISO/IEC 27001 certified.</li>
            <li style={liStyle}>Access to user data is restricted to authorized personnel only.</li>
          </ul>
          <p style={pStyle}>No system is 100% secure. While we take reasonable measures to protect your data, we cannot guarantee absolute security. If we become aware of a data breach affecting your personal information, we will notify you as required by law.</p>
        </div>

        {/* Changes */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Changes to This Policy</h2>
          <p style={pStyle}>We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting a prominent notice on the Platform or by email. The "Last updated" date at the top of this page indicates when the policy was most recently revised. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.</p>
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Contact Us</h2>
          <p style={pStyle}>If you have questions about this Privacy Policy, want to exercise your data rights, or have concerns about our data practices, please contact us:</p>
          <div style={{ background: 'rgba(11,37,69,0.02)', borderRadius: 10, padding: '16px 18px', marginTop: 8 }}>
            <p style={{ ...pStyle, margin: '0 0 4px' }}><strong>CivicVerify</strong></p>
            <p style={{ ...pStyle, margin: '0 0 4px' }}>Email: privacy@civicverify.org</p>
            <p style={{ ...pStyle, margin: 0 }}>Website: civicverify.org/contact</p>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(11,37,69,0.2)', marginTop: 40 }}>{'\u00A9'} {new Date().getFullYear()} CivicVerify. One person, one verified voice.</p>
      </div>
    </div>
  );
}
