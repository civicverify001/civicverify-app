import { useNavigate } from 'react-router-dom';
import CanonicalUrl from '../../components/CanonicalUrl';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', warm: '#FAF8F5', ink: '#1a1a2e' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

const posts = [
  {
    slug: 'why-online-polls-are-broken',
    title: 'Why Online Polls Are Broken — And How Verification Fixes It',
    excerpt: 'Bots, duplicate responses, and anonymous trolling have made most online polls meaningless. Identity verification restores the one thing polling needs to work: trust.',
    date: 'March 2, 2026',
    readTime: '6 min read',
    category: 'Trust & Verification',
    keywords: 'verified civic polls, bot-free polling, authentic citizen feedback',
  },
  {
    slug: 'what-happens-to-your-id',
    title: 'What Happens to Your ID When You Verify on CivicVerify',
    excerpt: 'You upload a government ID, and then what? A transparent walkthrough of exactly how CivicVerify and Didit handle, process, and permanently delete your identity document.',
    date: 'March 2, 2026',
    readTime: '5 min read',
    category: 'Privacy & Security',
    keywords: 'identity verification privacy, CivicVerify security, Didit verification',
  },
  {
    slug: 'civic-engagement-indianapolis',
    title: "Civic Engagement in Indianapolis: Why Your Voice Gets Drowned Out",
    excerpt: 'Indianapolis has 900,000 residents and a democratic participation problem. Here is why authentic, verified civic feedback could change how the city listens to its people.',
    date: 'March 2, 2026',
    readTime: '7 min read',
    category: 'Civic Engagement',
    keywords: 'Indianapolis civic engagement, local government feedback, community voice',
  },
];

export default function Blog() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
      <CanonicalUrl path="/blog" />

      {/* Nav */}
      <nav style={{ background: C.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          onClick={() => navigate('/')}
          style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: -0.5 }}
        >
          <span style={{ color: C.goldL }}>Civic</span>Verify
        </span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[
            { label: 'About', path: '/about' },
            { label: 'How It Works', path: '/how-it-works' },
            { label: 'FAQ', path: '/faq' },
          ].map((l) => (
            <span
              key={l.path}
              onClick={() => navigate(l.path)}
              style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.target.style.color = '#fff')}
              onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.7)')}
            >
              {l.label}
            </span>
          ))}
          <button
            onClick={() => navigate('/login')}
            style={{ fontSize: 13, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #112d4e 100%)`, padding: '72px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: C.goldL, textTransform: 'uppercase', margin: '0 0 16px' }}>
          CivicVerify Blog
        </p>
        <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.25 }}>
          Insights on Verified Civic Engagement
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Exploring trust, identity, privacy, and the future of authentic public opinion.
        </p>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {posts.map((post, i) => (
            <article
              key={post.slug}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid rgba(11,37,69,0.06)',
                padding: 'clamp(24px, 4vw, 36px)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(11,37,69,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,37,69,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(11,37,69,0.04)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: C.gold, background: 'rgba(197,150,12,0.08)',
                  padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {post.category}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>{post.date}</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>·</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>{post.readTime}</span>
              </div>

              <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, color: C.navy, margin: '0 0 12px', lineHeight: 1.35 }}>
                {post.title}
              </h2>

              <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.55)', lineHeight: 1.65, margin: '0 0 16px' }}>
                {post.excerpt}
              </p>

              <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
                Read article →
              </span>
            </article>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: C.navy, padding: '56px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>
          Ready to Make Your Voice Count?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
          Join verified citizens shaping real civic decisions.
        </p>
        <button
          onClick={() => navigate('/signup')}
          style={{
            fontSize: 15, fontWeight: 700, color: C.navy, background: C.goldL,
            border: 'none', borderRadius: 10, padding: '14px 36px', cursor: 'pointer',
          }}
        >
          Sign Up Free
        </button>
      </div>

      {/* Footer */}
      <footer style={{ background: '#071b33', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          © 2026 CivicVerify · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/privacy')}>Privacy</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact</span>
        </p>
      </footer>
    </div>
  );
}
