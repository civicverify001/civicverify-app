import { useNavigate } from 'react-router-dom';
import CanonicalUrl from '../../components/CanonicalUrl';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', warm: '#FAF8F5' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

function BlogLayout({ children, title, category, date, readTime, canonicalPath }) {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
      <CanonicalUrl path={canonicalPath} />

      {/* Nav */}
      <nav style={{ background: C.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span onClick={() => navigate('/')} style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
          <span style={{ color: C.goldL }}>Civic</span>Verify
        </span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span onClick={() => navigate('/blog')} style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Blog</span>
          <button onClick={() => navigate('/signup')} style={{ fontSize: 13, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, #112d4e)`, padding: '56px 24px 48px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: 2, background: 'rgba(240,180,41,0.1)', padding: '4px 12px', borderRadius: 6 }}>{category}</span>
        <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, color: '#fff', margin: '20px auto 16px', maxWidth: 700, lineHeight: 1.3 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{date} · {readTime}</p>
      </div>

      {/* Article */}
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}>
        {children}
      </article>

      {/* Back to blog + CTA */}
      <div style={{ background: C.navy, padding: '48px 24px', textAlign: 'center' }}>
        <button onClick={() => navigate('/blog')} style={{ fontSize: 14, fontWeight: 600, color: C.goldL, background: 'none', border: `1px solid ${C.goldL}`, borderRadius: 10, padding: '10px 28px', cursor: 'pointer', marginBottom: 20, display: 'inline-block' }}>
          ← All Articles
        </button>
        <h3 style={{ fontFamily: T.serif, fontSize: 22, color: '#fff', margin: '0 0 10px' }}>Join the Movement</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>Become a verified citizen and shape real civic decisions.</p>
        <button onClick={() => navigate('/signup')} style={{ fontSize: 15, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 10, padding: '14px 36px', cursor: 'pointer' }}>
          Sign Up Free
        </button>
      </div>

      <footer style={{ background: '#071b33', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          © 2026 CivicVerify · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/privacy')}>Privacy</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms</span>
        </p>
      </footer>
    </div>
  );
}

// ── Shared text styles ──────────────────
const h2Style = { fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: C.navy, margin: '40px 0 16px', lineHeight: 1.35 };
const pStyle = { fontSize: 15.5, color: 'rgba(11,37,69,0.72)', lineHeight: 1.8, margin: '0 0 20px' };
const pullStyle = { fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: C.navy, borderLeft: `3px solid ${C.goldL}`, paddingLeft: 20, margin: '32px 0', lineHeight: 1.55, fontStyle: 'italic' };
const listStyle = { ...pStyle, paddingLeft: 24, margin: '0 0 20px' };

// ══════════════════════════════════════════
//  POST 1 — Why Online Polls Are Broken
// ══════════════════════════════════════════
export default function BlogPost1() {
  return (
    <BlogLayout
      title="Why Online Polls Are Broken — And How Verification Fixes It"
      category="Trust & Verification"
      date="March 2, 2026"
      readTime="6 min read"
      canonicalPath="/blog/why-online-polls-are-broken"
    >
      <p style={pStyle}>
        In 2024, a widely shared Twitter poll about public transit funding received over 200,000 votes. The result was cited by local news outlets and even referenced in a city council session. There was one problem: researchers later estimated that at least 40% of the responses came from bots and duplicate accounts. The poll was meaningless, but the damage to public discourse was already done.
      </p>
      <p style={pStyle}>
        This is not an isolated case. It is the norm. Most online polls today are fundamentally broken — not because the questions are bad, but because there is no way to know whether the people answering them are real, unique, or representative of anything.
      </p>

      <h2 style={h2Style}>The Three Problems With Online Polls</h2>
      <p style={pStyle}>
        <strong>1. Bot manipulation.</strong> Automated scripts can fill out surveys thousands of times in minutes. Any poll without identity verification is vulnerable to this. Political operatives, activist groups, and even hobbyist trolls routinely flood open polls to skew results in their preferred direction.
      </p>
      <p style={pStyle}>
        <strong>2. Duplicate responses.</strong> Even when bots are not involved, nothing stops a motivated individual from clearing their cookies and submitting the same response five, ten, or fifty times. IP-based restrictions are trivially bypassed with a VPN.
      </p>
      <p style={pStyle}>
        <strong>3. Non-representative samples.</strong> Open polls attract the loudest voices, not the broadest. Without demographic context, a poll result that claims to represent "public opinion" actually represents the opinion of whoever happened to find and complete it — which skews heavily toward people with strong feelings and ample free time.
      </p>

      <div style={pullStyle}>
        "If you cannot verify who answered, you cannot trust what they said. It is that simple."
      </div>

      <h2 style={h2Style}>Why This Matters for Civic Decisions</h2>
      <p style={pStyle}>
        When city councils, school boards, and local organisations use polling data to make decisions, the integrity of that data matters enormously. A fraudulent poll does not just produce wrong numbers — it distorts the relationship between citizens and the institutions that serve them.
      </p>
      <p style={pStyle}>
        Consider a scenario: a local government posts a poll asking residents whether they support a proposed bike lane on a major road. If that poll is flooded by out-of-district respondents, ideological bots, or a single advocacy group using VPNs, the result will not reflect what actual residents think. And if the council acts on that result, trust erodes further.
      </p>

      <h2 style={h2Style}>What Verification Changes</h2>
      <p style={pStyle}>
        Identity verification solves all three problems simultaneously. When every respondent must prove they are a real, unique person before they can participate, the entire dynamic shifts:
      </p>
      <p style={listStyle}>
        <strong>No bots.</strong> A verified identity requires a government-issued ID and a live selfie match. No script can fabricate that.<br /><br />
        <strong>No duplicates.</strong> Each verified person gets exactly one response. One person, one voice.<br /><br />
        <strong>Demographic authenticity.</strong> When respondents are verified, their demographic data — age, location, background — is real. This means poll results can be weighted, segmented, and trusted as genuinely representative.
      </p>

      <h2 style={h2Style}>How CivicVerify Approaches This</h2>
      <p style={pStyle}>
        CivicVerify was built from the ground up around this principle: every voice on the platform is a real, verified citizen. The verification process uses Didit, a third-party identity verification provider, to confirm each user's identity through document authentication and biometric matching. Once verified, the original ID document is permanently deleted — CivicVerify never stores it.
      </p>
      <p style={pStyle}>
        The result is a platform where organisations — government agencies, nonprofits, civic groups — can post surveys and polls knowing that every single response comes from a real, unique, verified person. No bots. No duplicates. No guessing.
      </p>

      <h2 style={h2Style}>The Cost of Doing Nothing</h2>
      <p style={pStyle}>
        Every unverified poll that gets cited in a news article, shared on social media, or used to justify a policy decision makes the problem worse. Public trust in polling is already at historic lows — and it will keep falling until the fundamental integrity problem is addressed.
      </p>
      <p style={pStyle}>
        Verification is not a luxury feature. It is the minimum requirement for polling data to mean anything at all. The tools exist today. The question is whether we choose to use them.
      </p>

      <div style={{ background: 'rgba(197,150,12,0.06)', border: `1px solid rgba(197,150,12,0.15)`, borderRadius: 12, padding: 24, marginTop: 40 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Key Takeaway</p>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.6)', margin: 0, lineHeight: 1.65 }}>
          Online polls without identity verification are vulnerable to bots, duplicates, and non-representative samples. Verified civic polling — where every respondent proves they are real — is the only way to produce data that organisations and communities can actually trust.
        </p>
      </div>
    </BlogLayout>
  );
}
