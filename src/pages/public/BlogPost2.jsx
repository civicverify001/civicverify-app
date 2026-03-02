import { useNavigate } from 'react-router-dom';
import CanonicalUrl from '../../components/CanonicalUrl';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', warm: '#FAF8F5' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

function BlogLayout({ children, title, category, date, readTime, canonicalPath }) {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
      <CanonicalUrl path={canonicalPath} />
      <nav style={{ background: C.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span onClick={() => navigate('/')} style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          <span style={{ color: C.goldL }}>Civic</span>Verify
        </span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span onClick={() => navigate('/blog')} style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Blog</span>
          <button onClick={() => navigate('/signup')} style={{ fontSize: 13, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>Sign Up</button>
        </div>
      </nav>
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, #112d4e)`, padding: '56px 24px 48px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: 2, background: 'rgba(240,180,41,0.1)', padding: '4px 12px', borderRadius: 6 }}>{category}</span>
        <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, color: '#fff', margin: '20px auto 16px', maxWidth: 700, lineHeight: 1.3 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{date} · {readTime}</p>
      </div>
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>{children}</article>
      <div style={{ background: C.navy, padding: '48px 24px', textAlign: 'center' }}>
        <button onClick={() => navigate('/blog')} style={{ fontSize: 14, fontWeight: 600, color: C.goldL, background: 'none', border: `1px solid ${C.goldL}`, borderRadius: 10, padding: '10px 28px', cursor: 'pointer', marginBottom: 20 }}>← All Articles</button>
        <h3 style={{ fontFamily: T.serif, fontSize: 22, color: '#fff', margin: '0 0 10px' }}>Your Data Is Safe With Us</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>Verify once. Participate with confidence. Delete anytime.</p>
        <button onClick={() => navigate('/signup')} style={{ fontSize: 15, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 10, padding: '14px 36px', cursor: 'pointer' }}>Sign Up Free</button>
      </div>
      <footer style={{ background: '#071b33', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© 2026 CivicVerify · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/privacy')}>Privacy</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms</span></p>
      </footer>
    </div>
  );
}

const h2Style = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#0B2545', margin: '40px 0 16px', lineHeight: 1.35 };
const pStyle = { fontSize: 15.5, color: 'rgba(11,37,69,0.72)', lineHeight: 1.8, margin: '0 0 20px' };
const pullStyle = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 18, fontWeight: 600, color: '#0B2545', borderLeft: '3px solid #F0B429', paddingLeft: 20, margin: '32px 0', lineHeight: 1.55, fontStyle: 'italic' };

export default function BlogPost2() {
  return (
    <BlogLayout
      title="What Happens to Your ID When You Verify on CivicVerify"
      category="Privacy & Security"
      date="March 2, 2026"
      readTime="5 min read"
      canonicalPath="/blog/what-happens-to-your-id"
    >
      <p style={pStyle}>
        The single most common question we receive from new users is some variation of: "I have to upload my ID? What do you do with it?" It is a completely reasonable question, and it deserves a completely transparent answer. This article walks through every step of the verification process — what happens, when it happens, and what gets deleted.
      </p>

      <h2 style={h2Style}>Step 1: You Upload Your ID</h2>
      <p style={pStyle}>
        When you choose to verify your identity on CivicVerify, you are asked to photograph or upload a government-issued photo ID — such as a driver's licence, passport, or state ID card. This image is sent directly to Didit, our third-party identity verification provider. It does not pass through CivicVerify's servers. It goes straight to Didit's secure, encrypted infrastructure.
      </p>

      <h2 style={h2Style}>Step 2: Didit Verifies Your Document</h2>
      <p style={pStyle}>
        Didit performs several checks on your document: it confirms the document is genuine (not digitally altered or expired), it reads the basic identity information (name and date of birth), and it performs a biometric comparison between your ID photo and a live selfie you take during the process. This confirms that the person holding the ID is the person on the ID.
      </p>
      <p style={pStyle}>
        The entire process typically takes under 60 seconds.
      </p>

      <h2 style={h2Style}>Step 3: CivicVerify Receives a Result — Not Your Document</h2>
      <p style={pStyle}>
        This is the critical step most people want to understand. After Didit completes its verification, it sends CivicVerify a simple result: verified or not verified. CivicVerify also receives a unique cryptographic token — a random string of characters that proves your identity was confirmed but cannot be reverse-engineered to reveal your name, ID number, or any personal details.
      </p>

      <div style={pullStyle}>
        "CivicVerify never sees your ID document. We never store it. We receive only a yes-or-no verification result and a cryptographic token."
      </div>

      <h2 style={h2Style}>Step 4: Your Document Is Deleted</h2>
      <p style={pStyle}>
        After verification is complete, Didit permanently deletes your ID image and biometric data in accordance with their data retention policy. CivicVerify has no copy, no backup, no archive. The document exists only for the seconds required to confirm your identity — then it is gone.
      </p>

      <h2 style={h2Style}>What CivicVerify Does Store</h2>
      <p style={pStyle}>
        To be fully transparent, here is exactly what CivicVerify stores about you after verification:
      </p>
      <p style={{ ...pStyle, paddingLeft: 24 }}>
        <strong>Your account information</strong> — email address, display name, and any demographic profile data you voluntarily provide (such as age range, location, or political affiliation). This is used to match you with relevant surveys.<br /><br />
        <strong>Your verification status</strong> — a simple boolean flag that says "this account is verified" plus the cryptographic token from Didit.<br /><br />
        <strong>Your survey responses</strong> — the answers you submit to polls and surveys. These are stored pseudonymously and cannot be linked to your real name by organisations viewing the results.
      </p>

      <h2 style={h2Style}>What No One Can Do</h2>
      <p style={pStyle}>
        No CivicVerify staff member can look up your real name from your survey responses. No organisation that receives poll data can identify individual respondents. The system is designed so that your verified status proves you are real, but your identity remains private. Verification and anonymity coexist by design.
      </p>

      <h2 style={h2Style}>You Can Delete Everything</h2>
      <p style={pStyle}>
        Any CivicVerify user can permanently delete their account and all associated data at any time. This is not a "request for deletion" that gets processed in 30 days. It is an immediate, irreversible action available in your account settings. Your survey responses, profile data, community posts, and verification token are all permanently removed.
      </p>

      <h2 style={h2Style}>Why We Built It This Way</h2>
      <p style={pStyle}>
        CivicVerify exists to restore trust in public opinion data. But that trust has to work in both directions. Citizens need to trust the platform with their participation, and organisations need to trust that the data is authentic. By making privacy not just a policy but an architectural decision — where we literally cannot access what we do not need — we believe both sides of that equation are satisfied.
      </p>

      <div style={{ background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.15)', borderRadius: 12, padding: 24, marginTop: 40 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Key Takeaway</p>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.6)', margin: 0, lineHeight: 1.65 }}>
          CivicVerify uses Didit for identity verification. Your ID document goes directly to Didit, is used only for the seconds needed to confirm your identity, and is then permanently deleted. CivicVerify never sees, stores, or has access to your original ID. You can delete your entire account and all data at any time.
        </p>
      </div>
    </BlogLayout>
  );
}
