import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import CanonicalUrl from '../../components/CanonicalUrl';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', warm: '#FAF8F5' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (!error && data) setPost(data);
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(11,37,69,0.3)', fontSize: 16 }}>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
        <nav style={{ background: C.navy, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span onClick={() => navigate('/')} style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            <span style={{ color: C.goldL }}>Civic</span>Verify
          </span>
          <span onClick={() => navigate('/blog')} style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Blog</span>
        </nav>
        <div style={{ textAlign: 'center', padding: '120px 24px' }}>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, color: C.navy, marginBottom: 12 }}>Post Not Found</h1>
          <p style={{ color: 'rgba(11,37,69,0.4)', marginBottom: 24 }}>This article doesn't exist or has been unpublished.</p>
          <button onClick={() => navigate('/blog')} style={{ fontSize: 14, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.sans, background: C.warm, minHeight: '100vh' }}>
      <CanonicalUrl path={`/blog/${post.slug}`} />

      {/* Blog article styles */}
      <style>{`
        .blog-content h2 {
          font-family: ${T.serif};
          font-size: 22px;
          font-weight: 700;
          color: ${C.navy};
          margin: 40px 0 16px;
          line-height: 1.35;
        }
        .blog-content p {
          font-size: 15.5px;
          color: rgba(11,37,69,0.72);
          line-height: 1.8;
          margin: 0 0 20px;
        }
        .blog-content strong {
          color: ${C.navy};
          font-weight: 700;
        }
        .blog-content blockquote {
          font-family: ${T.serif};
          font-size: 18px;
          font-weight: 600;
          color: ${C.navy};
          border-left: 3px solid ${C.goldL};
          padding-left: 20px;
          margin: 32px 0;
          line-height: 1.55;
          font-style: italic;
        }
        .blog-content blockquote p {
          font-size: 18px;
          color: ${C.navy};
          margin: 0;
        }
        .blog-content ul, .blog-content ol {
          font-size: 15.5px;
          color: rgba(11,37,69,0.72);
          line-height: 1.8;
          margin: 0 0 20px;
          padding-left: 24px;
        }
        .blog-content li {
          margin-bottom: 8px;
        }
        .blog-content a {
          color: ${C.gold};
          text-decoration: underline;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid rgba(11,37,69,0.08);
          margin: 36px 0;
        }
      `}</style>

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
        <span style={{ fontSize: 11, fontWeight: 700, color: C.goldL, textTransform: 'uppercase', letterSpacing: 2, background: 'rgba(240,180,41,0.1)', padding: '4px 12px', borderRadius: 6 }}>
          {post.category}
        </span>
        <h1 style={{ fontFamily: T.serif, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, color: '#fff', margin: '20px auto 16px', maxWidth: 700, lineHeight: 1.3 }}>
          {post.title}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {formatDate(post.created_at)} · {post.read_time}{post.author_name ? ` · ${post.author_name}` : ''}
        </p>
      </div>

      {/* Article body — renders HTML */}
      <article className="blog-content" style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Key takeaway */}
      {post.excerpt && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.15)', borderRadius: 12, padding: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>Key Takeaway</p>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.6)', margin: 0, lineHeight: 1.65 }}>{post.excerpt}</p>
          </div>
        </div>
      )}

      {/* Back + CTA */}
      <div style={{ background: C.navy, padding: '48px 24px', textAlign: 'center' }}>
        <button onClick={() => navigate('/blog')}
          style={{ fontSize: 14, fontWeight: 600, color: C.goldL, background: 'none', border: `1px solid ${C.goldL}`, borderRadius: 10, padding: '10px 28px', cursor: 'pointer', marginBottom: 20, display: 'inline-block' }}>
          ← All Articles
        </button>
        <h3 style={{ fontFamily: T.serif, fontSize: 22, color: '#fff', margin: '0 0 10px' }}>Join the Movement</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 20px' }}>Become a verified citizen and shape real civic decisions.</p>
        <button onClick={() => navigate('/signup')}
          style={{ fontSize: 15, fontWeight: 700, color: C.navy, background: C.goldL, border: 'none', borderRadius: 10, padding: '14px 36px', cursor: 'pointer' }}>
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
