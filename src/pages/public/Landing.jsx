// src/pages/public/Landing.jsx — Polished with inline styles for reliable rendering
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ═══ SHARE MODAL ═══ */
function ShareModal({ survey, onClose }) {
  const url = `${window.location.origin}/survey/${survey.id}`;
  const text = `Check out this civic survey: "${survey.title}" on CivicVerify`;
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  const shares = [
    { name: 'X', bg: '#000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: 'Fb', bg: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'In', bg: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: 'Wa', bg: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { name: '✉', bg: '#6B7280', url: `mailto:?subject=${encodeURIComponent(survey.title)}&body=${encodeURIComponent(text + '\n\n' + url)}` },
  ];
  const labels = ['Twitter / X', 'Facebook', 'LinkedIn', 'WhatsApp', 'Email'];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.navy, margin: 0 }}>Share This Survey</h3>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#999' }}>✕</button>
        </div>
        <p style={{ fontSize: '14px', color: '#999', margin: '0 0 20px', lineHeight: 1.5 }}>{survey.title}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {shares.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 4px', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: s.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>{s.name}</div>
              <span style={{ fontSize: '10px', color: '#999' }}>{labels[i]}</span>
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', background: '#f5f5f5', borderRadius: '12px', padding: '8px' }}>
          <input readOnly value={url} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '12px', color: '#666', outline: 'none', padding: '0 8px' }} />
          <button onClick={copy} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: copied ? C.green : C.gold, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ COMMENT ITEM ═══ */
function CommentItem({ comment, user, onVote }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(11,37,69,0.08), rgba(11,37,69,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'rgba(11,37,69,0.35)', flexShrink: 0 }}>
        {(comment.user_name || 'A').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: C.navy }}>{comment.user_name || 'Anonymous'}</span>
          <span style={{ fontSize: '11px', color: 'rgba(11,37,69,0.2)' }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(11,37,69,0.55)', margin: '4px 0 0', lineHeight: 1.6 }}>{comment.content}</p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <button onClick={() => onVote(comment.id, 'like')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', color: comment.userVote === 'like' ? C.green : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'like' ? 600 : 400, transition: 'color 0.2s' }}>
            👍 {comment.likes || 0}
          </button>
          <button onClick={() => onVote(comment.id, 'dislike')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', color: comment.userVote === 'dislike' ? C.red : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'dislike' ? 600 : 400, transition: 'color 0.2s' }}>
            👎 {comment.dislikes || 0}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ LIVE SURVEY CARD ═══ */
function LiveSurveyCard({ survey, user }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id)
      .then(({ count }) => setCommentCount(count || 0));
  }, [survey.id]);

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*, users(full_name)').eq('survey_id', survey.id).order('created_at', { ascending: false }).limit(30);
    let list = (data || []).map(c => ({ ...c, user_name: c.users?.full_name }));
    if (user) {
      const { data: votes } = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id);
      const voteMap = {}; (votes || []).forEach(v => { voteMap[v.comment_id] = v.vote_type; });
      list = list.map(c => ({ ...c, userVote: voteMap[c.id] || null }));
    }
    setComments(list);
  }

  function toggleComments() { if (!showComments) loadComments(); setShowComments(!showComments); }

  async function postComment() {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    const { data, error } = await supabase.from('comments').insert({ survey_id: survey.id, user_id: user.id, content: newComment.trim() }).select('*, users(full_name)').single();
    if (!error && data) { setComments([{ ...data, user_name: data.users?.full_name, userVote: null }, ...comments]); setCommentCount(c => c + 1); setNewComment(''); }
    setPosting(false);
  }

  async function handleVote(commentId, type) {
    if (!user) { navigate('/login'); return; }
    const c = comments.find(x => x.id === commentId);
    if (!c) return;
    const existing = c.userVote;
    if (existing === type) {
      await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      await supabase.from('comments').update({ [type + 's']: Math.max((c[type + 's'] || 1) - 1, 0) }).eq('id', commentId);
      setComments(comments.map(x => x.id === commentId ? { ...x, [type + 's']: Math.max((x[type + 's'] || 1) - 1, 0), userVote: null } : x));
    } else {
      await supabase.from('comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote_type: type }, { onConflict: 'comment_id,user_id' });
      const updates = { [type + 's']: (c[type + 's'] || 0) + 1 };
      if (existing) updates[existing + 's'] = Math.max((c[existing + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(updates).eq('id', commentId);
      setComments(comments.map(x => x.id === commentId ? { ...x, ...updates, userVote: type } : x));
    }
  }

  const qCount = (survey.questions || []).length;
  const progress = survey.target_responses ? Math.min(((survey.response_count || 0) / survey.target_responses) * 100, 100) : null;

  return (
    <>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', transition: 'all 0.3s', boxShadow: hovered ? '0 12px 40px rgba(11,37,69,0.08)' : '0 1px 3px rgba(11,37,69,0.04)', transform: hovered ? 'translateY(-2px)' : 'none' }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#ecfdf5', color: '#059669', border: '1px solid rgba(5,150,105,0.15)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' }} /> Live
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(11,37,69,0.25)' }}>📝 {qCount} question{qCount !== 1 ? 's' : ''}</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.navy, margin: '0 0 8px', lineHeight: 1.3, fontFamily: 'Libre Baskerville, Georgia, serif' }}>{survey.title}</h3>
          {survey.description && <p style={{ fontSize: '14px', color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{survey.description}</p>}

          {progress !== null && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(11,37,69,0.25)', marginBottom: '6px' }}>
                <span>{survey.response_count || 0} responses</span>
                <span>{Math.round(progress)}% of goal</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(11,37,69,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: `linear-gradient(90deg, ${C.gold}, #d4a832)`, borderRadius: '3px', transition: 'width 0.7s', width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button onClick={() => user ? navigate(`/citizen/surveys/${survey.id}`) : navigate('/login')}
            style={{ marginTop: '20px', width: '100%', padding: '12px', background: C.gold, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#b3870b'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(197,150,12,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.boxShadow = 'none'; }}>
            {user ? 'Take This Survey' : 'Sign In to Participate'} →
          </button>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(11,37,69,0.05)' }}>
          <button onClick={toggleComments} style={{ flex: 1, padding: '14px', fontSize: '12px', fontWeight: 600, color: 'rgba(11,37,69,0.3)', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid rgba(11,37,69,0.05)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,37,69,0.02)'; e.currentTarget.style.color = 'rgba(11,37,69,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(11,37,69,0.3)'; }}>
            💬 {commentCount} Comment{commentCount !== 1 ? 's' : ''}
          </button>
          <button onClick={() => setShareModal(true)} style={{ flex: 1, padding: '14px', fontSize: '12px', fontWeight: 600, color: 'rgba(11,37,69,0.3)', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,37,69,0.02)'; e.currentTarget.style.color = 'rgba(11,37,69,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(11,37,69,0.3)'; }}>
            🔗 Share
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ borderTop: '1px solid rgba(11,37,69,0.05)', padding: '20px 24px', background: 'rgba(245,241,236,0.3)' }}>
            {user ? (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${C.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts..."
                  onKeyDown={e => e.key === 'Enter' && postComment()}
                  style={{ flex: 1, padding: '10px 16px', fontSize: '13px', border: '1px solid rgba(11,37,69,0.08)', borderRadius: '12px', outline: 'none', color: C.navy, background: '#fff' }} />
                <button onClick={postComment} disabled={!newComment.trim() || posting}
                  style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: C.gold, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: (!newComment.trim() || posting) ? 0.3 : 1, whiteSpace: 'nowrap' }}>
                  {posting ? '...' : 'Post'}
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px dashed rgba(11,37,69,0.1)', background: 'transparent', fontSize: '13px', color: 'rgba(11,37,69,0.3)', cursor: 'pointer', marginBottom: '12px' }}>
                🔒 Sign in to join the discussion
              </button>
            )}
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {comments.length > 0 ? comments.map(c => (
                <CommentItem key={c.id} comment={c} user={user} onVote={handleVote} />
              )) : (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>💬</span>
                  <p style={{ fontSize: '13px', color: 'rgba(11,37,69,0.2)', margin: 0 }}>No comments yet — be the first!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {shareModal && <ShareModal survey={survey} onClose={() => setShareModal(false)} />}
    </>
  );
}

/* ═══ SECTION WRAPPER ═══ */
function Section({ children, bg = '#fff', id }) {
  return (
    <section id={id} style={{ background: bg, padding: '80px 0' }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px' }}>{children}</div>
    </section>
  );
}

function SectionLabel({ text }) {
  return <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: C.gold, margin: '0 0 12px' }}>{text}</p>;
}

function SectionTitle({ text, center }) {
  return <h2 style={{ fontSize: '36px', fontWeight: 700, color: C.navy, margin: 0, fontFamily: 'Libre Baskerville, Georgia, serif', textAlign: center ? 'center' : 'left', lineHeight: 1.2 }}>{text}</h2>;
}

/* ═══ MAIN LANDING ═══ */
export default function Landing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { setSurveys(data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(11,37,69,0.05)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>CV</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: C.navy, fontFamily: 'Libre Baskerville, Georgia, serif' }}>CivicVerify</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <button onClick={() => navigate(profile?.role === 'admin' ? '/admin' : profile?.role === 'org' ? '/org' : '/citizen')}
                style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} style={{ padding: '10px 16px', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, color: 'rgba(11,37,69,0.5)', cursor: 'pointer' }}>Sign In</button>
                <button onClick={() => navigate('/signup')} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #132d52 50%, #1a3a66 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '80px 24px 90px', position: 'relative' }}>
          <div style={{ maxWidth: '580px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{surveys.length} live survey{surveys.length !== 1 ? 's' : ''} running now</span>
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', fontFamily: 'Libre Baskerville, Georgia, serif', letterSpacing: '-0.02em' }}>
              Your Voice,{' '}
              <span style={{ color: C.gold, position: 'relative', display: 'inline-block' }}>
                Verified
                <span style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '4px', background: `${C.gold}40`, borderRadius: '2px' }} />
              </span>
            </h1>

            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: '480px' }}>
              The first civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '56px' }}>
              <button onClick={() => navigate('/signup')}
                style={{ padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(197,150,12,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Get Started Free →
              </button>
              <button onClick={() => document.getElementById('live-surveys')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                View Live Surveys ↓
              </button>
            </div>

            <div style={{ display: 'flex', gap: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[{ icon: '🛡️', t: 'Identity Verified' }, { icon: '👥', t: 'Real Citizens Only' }, { icon: '📊', t: 'Transparent Results' }].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{x.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>{x.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <Section bg="rgba(245,241,236,0.3)">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <SectionLabel text="How It Works" />
          <SectionTitle text="Three Steps to Civic Impact" center />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', icon: '📱', title: 'Sign Up & Verify', desc: 'Create an account and verify your identity through our secure partner, Didit. One-time process, completely private.' },
            { step: '02', icon: '📋', title: 'Take Surveys', desc: 'Participate in surveys from civic organizations, government agencies, and community groups on issues that matter to you.' },
            { step: '03', icon: '📈', title: 'See Your Impact', desc: 'Track your civic engagement score, see how your community responds, and watch policy decisions shaped by verified voices.' },
          ].map((item, i) => (
            <div key={i} style={{ position: 'relative', background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid rgba(11,37,69,0.05)', transition: 'all 0.3s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(11,37,69,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
              <span style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '56px', fontWeight: 900, color: 'rgba(11,37,69,0.03)', fontFamily: 'Libre Baskerville, Georgia, serif', lineHeight: 1 }}>{item.step}</span>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${C.gold}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── LIVE SURVEYS ─── */}
      <section id="live-surveys" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <SectionLabel text="Active Right Now" />
              <SectionTitle text="Live Surveys" />
              <p style={{ fontSize: '14px', color: 'rgba(11,37,69,0.35)', margin: '8px 0 0' }}>Participate, comment, and share with your community</p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', border: `3px solid ${C.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '14px', color: 'rgba(11,37,69,0.3)' }}>Loading surveys...</p>
            </div>
          ) : surveys.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {surveys.map(s => <LiveSurveyCard key={s.id} survey={s} user={profile} />)}
            </div>
          ) : (
            <div style={{ background: 'rgba(245,241,236,0.4)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: `${C.gold}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(11,37,69,0.25)', margin: '0 0 8px' }}>No active surveys right now</p>
              <p style={{ fontSize: '14px', color: 'rgba(11,37,69,0.18)', margin: '0 0 24px' }}>Check back soon or sign up to get notified</p>
              <button onClick={() => navigate('/signup')} style={{ padding: '12px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Sign Up for Notifications</button>
            </div>
          )}
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ padding: '64px 0', background: `linear-gradient(135deg, ${C.navy}, #132d52)` }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'center' }}>
          {[
            { v: '100%', l: 'Verified Responses' },
            { v: '50+', l: 'Partner Organizations' },
            { v: '10K+', l: 'Citizens Engaged' },
            { v: '99.9%', l: 'Platform Uptime' },
          ].map((s, i) => (
            <div key={i}>
              <p style={{ fontSize: '36px', fontWeight: 700, color: C.gold, margin: '0 0 8px' }}>{s.v}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHO USES ─── */}
      <Section bg="rgba(245,241,236,0.3)">
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <SectionLabel text="Built For Everyone" />
          <SectionTitle text="Who Uses CivicVerify?" center />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { icon: '🏛️', title: 'Government Agencies', desc: 'Get verified public input on policy decisions, budget priorities, and community planning initiatives.', color: C.navy },
            { icon: '🏢', title: 'Civic Organizations', desc: 'Commission research-grade surveys with guaranteed authentic participation from verified citizens.', color: C.gold },
            { icon: '👤', title: 'Citizens Like You', desc: 'Make your voice heard on issues that matter. Every verified response carries weight and drives real change.', color: C.green },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid rgba(11,37,69,0.05)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(11,37,69,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '20px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: `${C.gold}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 24px' }}>🗳️</div>
          <SectionTitle text="Ready to Make Your Voice Count?" center />
          <p style={{ fontSize: '16px', color: 'rgba(11,37,69,0.4)', margin: '16px 0 32px', lineHeight: 1.7 }}>
            Join thousands of verified citizens shaping the future of civic engagement.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>
            <button onClick={() => navigate('/signup')}
              style={{ padding: '14px 32px', background: C.gold, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(197,150,12,0.2)' }}>
              Create Free Account →
            </button>
            <button onClick={() => navigate('/login')}
              style={{ padding: '14px 32px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid rgba(11,37,69,0.06)', background: 'rgba(245,241,236,0.3)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
            <div style={{ maxWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>CV</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: C.navy, fontFamily: 'Libre Baskerville, Georgia, serif' }}>CivicVerify</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(11,37,69,0.3)', lineHeight: 1.6, margin: 0 }}>The trusted platform for verified civic engagement. Every voice matters.</p>
            </div>
            <div style={{ display: 'flex', gap: '48px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(11,37,69,0.2)', margin: '0 0 12px' }}>Platform</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Sign Up', 'Sign In', 'Live Surveys'].map((t, i) => (
                    <button key={i} onClick={() => navigate(i === 0 ? '/signup' : i === 1 ? '/login' : '#live-surveys')}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: 'rgba(11,37,69,0.35)', cursor: 'pointer', textAlign: 'left' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(11,37,69,0.2)', margin: '0 0 12px' }}>Company</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['About', 'Privacy', 'Terms'].map(t => (
                    <span key={t} style={{ fontSize: '13px', color: 'rgba(11,37,69,0.35)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '12px', color: 'rgba(11,37,69,0.18)', margin: 0 }}>© {new Date().getFullYear()} CivicVerify. All rights reserved.</p>
            <p style={{ fontSize: '12px', color: 'rgba(11,37,69,0.18)', margin: 0 }}>Built with trust in mind.</p>
          </div>
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
