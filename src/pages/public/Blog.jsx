import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import CanonicalUrl from '../../components/CanonicalUrl';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', warm: '#FAF8F5' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, category, read_time, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
      <CanonicalUrl path="/blog" />

      {/* Nav */}
      <nav style={{ background: C.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span onClick={() => navigate('/')} style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: -0.5 }}>
          <span style={{ color: C.goldL }}>Civic</span>Verify
        </span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[
            { label: 'About', path: '/about' },
            { label: 'How It Works', path: '/how-it-works' },
            { label: 'FAQ', path: '/faq' },
          ].map(l => (
            <span key={l.path} onClick={() => navigate(l.path)}
              style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target.style.color = '#fff')}
              onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.7)')}>
              {l.label}
            </span>
          ))}
          <button onClick={() => navigate('/login')}
            style={{ fontSize: 13, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #112d4e 100%)`, padding: '72px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: C.goldL, textTransform: 'uppercase', margin: '0 0 16px' }}>CivicVerify Blog</p>
        <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.25 }}>
          Insights on Verified Civic Engagement
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Exploring trust, identity, privacy, and the future of authentic public opinion.
        </p>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(11,37,69,0.3)' }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)' }}>
            <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.4)' }}>No posts published yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {posts.map(post => (
              <article key={post.slug} onClick={() => navigate(`/blog/${post.slug}`)}
                style={{
                  background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)',
                  padding: 'clamp(24px, 4vw, 36px)', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 3px rgba(11,37,69,0.04)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,37,69,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(11,37,69,0.04)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: 'rgba(197,150,12,0.08)', padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>{formatDate(post.created_at)}</span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>·</span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>{post.read_time}</span>
                </div>
                <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, color: C.navy, margin: '0 0 12px', lineHeight: 1.35 }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.55)', lineHeight: 1.65, margin: '0 0 16px' }}>
                  {post.excerpt}
                </p>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>Read article →</span>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ background: C.navy, padding: '56px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Ready to Make Your Voice Count?</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>Join verified citizens shaping real civic decisions.</p>
        <button onClick={() => navigate('/signup')}
          style={{ fontSize: 15, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 10, padding: '14px 36px', cursor: 'pointer' }}>
          Sign Up Free
        </button>
      </div>

      <footer style={{ background: '#071b33', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          © 2026 CivicVerify · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/privacy')}>Privacy</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/terms')}>Terms</span> · <span style={{ cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact</span>
        </p>
      </footer>
    </div>
  );
}
