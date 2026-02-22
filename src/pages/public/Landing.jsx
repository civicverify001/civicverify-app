// src/pages/public/Landing.jsx — Enhanced with Live Surveys, Comments, Likes, Sharing
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

/* ─── Icons (inline SVG to avoid lucide dependency issues) ─── */
const Icon = ({ d, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
);
const ArrowRight = ({ size }) => <Icon size={size} d="M5 12h14M12 5l7 7-7 7" />;
const ThumbUp = ({ size }) => <Icon size={size} d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />;
const ThumbDown = ({ size }) => <Icon size={size} d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />;

const COLORS = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ═══════════════════ SHARE MODAL ═══════════════════ */
function ShareModal({ survey, onClose }) {
  const url = `${window.location.origin}/survey/${survey.id}`;
  const text = `Check out this civic survey: "${survey.title}" on CivicVerify`;
  const [copied, setCopied] = useState(false);

  function copy() { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const shares = [
    { name: 'X', bg: '#000000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: 'Fb', bg: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'Li', bg: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: 'Wa', bg: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { name: '✉', bg: '#6B7280', url: `mailto:?subject=${encodeURIComponent(survey.title)}&body=${encodeURIComponent(text + '\n\n' + url)}` },
  ];
  const labels = ['Twitter / X', 'Facebook', 'LinkedIn', 'WhatsApp', 'Email'];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-[fadeIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#0B2545]">Share This Survey</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#0B2545]/5 flex items-center justify-center text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors text-lg">✕</button>
        </div>
        <p className="text-sm text-[#0B2545]/40 mb-5">{survey.title}</p>
        <div className="grid grid-cols-5 gap-3 mb-5">
          {shares.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#0B2545]/[0.03] transition-all group">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: s.bg }}>{s.name}</div>
              <span className="text-[10px] text-[#0B2545]/40 group-hover:text-[#0B2545]/70">{labels[i]}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-[#0B2545]/[0.03] rounded-xl p-2">
          <input readOnly value={url} className="flex-1 text-xs text-[#0B2545]/50 bg-transparent outline-none px-2 truncate" />
          <button onClick={copy} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-[#C5960C] text-white hover:bg-[#b3870b]'}`}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ COMMENT ═══════════════════ */
function CommentItem({ comment, user, onVote }) {
  return (
    <div className="flex gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B2545]/10 to-[#0B2545]/5 flex items-center justify-center text-xs font-bold text-[#0B2545]/40 flex-shrink-0">
        {(comment.user_name || 'A').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0B2545]">{comment.user_name || 'Anonymous'}</span>
          <span className="text-[11px] text-[#0B2545]/20">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-[#0B2545]/60 mt-1 leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2">
          <button onClick={() => onVote(comment.id, 'like')}
            className={`flex items-center gap-1.5 text-xs transition-all duration-200 ${comment.userVote === 'like' ? 'text-[#22863A] font-semibold' : 'text-[#0B2545]/25 hover:text-[#22863A]'}`}>
            <ThumbUp size={13} /> <span>{comment.likes || 0}</span>
          </button>
          <button onClick={() => onVote(comment.id, 'dislike')}
            className={`flex items-center gap-1.5 text-xs transition-all duration-200 ${comment.userVote === 'dislike' ? 'text-[#B8352E] font-semibold' : 'text-[#0B2545]/25 hover:text-[#B8352E]'}`}>
            <ThumbDown size={13} /> <span>{comment.dislikes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ LIVE SURVEY CARD ═══════════════════ */
function LiveSurveyCard({ survey, user }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id)
      .then(({ count }) => setCommentCount(count || 0));
  }, [survey.id]);

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*, users(full_name)').eq('survey_id', survey.id).order('created_at', { ascending: false }).limit(30);
    let list = (data || []).map(c => ({ ...c, user_name: c.users?.full_name }));
    if (user) {
      const { data: votes } = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id);
      const voteMap = {};
      (votes || []).forEach(v => { voteMap[v.comment_id] = v.vote_type; });
      list = list.map(c => ({ ...c, userVote: voteMap[c.id] || null }));
    }
    setComments(list);
  }

  function toggleComments() {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  }

  async function postComment() {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    const { data, error } = await supabase.from('comments').insert({ survey_id: survey.id, user_id: user.id, content: newComment.trim() }).select('*, users(full_name)').single();
    if (!error && data) {
      setComments([{ ...data, user_name: data.users?.full_name, userVote: null }, ...comments]);
      setCommentCount(c => c + 1);
      setNewComment('');
    }
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
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.05] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#0B2545]/[0.03] transition-all duration-300">
        {/* Card Body */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
            <span className="text-[11px] text-[#0B2545]/25">📝 {qCount} question{qCount !== 1 ? 's' : ''}</span>
          </div>

          <h3 className="text-lg font-bold text-[#0B2545] leading-snug" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h3>
          {survey.description && <p className="text-sm text-[#0B2545]/40 mt-2 leading-relaxed line-clamp-2">{survey.description}</p>}

          {progress !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-[#0B2545]/25 mb-1.5">
                <span>{survey.response_count || 0} responses</span>
                <span>{Math.round(progress)}% of goal</span>
              </div>
              <div className="w-full h-2 bg-[#0B2545]/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#C5960C] to-[#d4a832] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button onClick={() => user ? navigate(`/citizen/surveys/${survey.id}`) : navigate('/login')}
            className="mt-5 w-full py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 flex items-center justify-center gap-2">
            {user ? 'Take This Survey' : 'Sign In to Participate'} <ArrowRight size={14} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center border-t border-[#0B2545]/[0.04]">
          <button onClick={toggleComments} className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold text-[#0B2545]/35 hover:text-[#0B2545]/70 hover:bg-[#0B2545]/[0.02] transition-all duration-200 border-r border-[#0B2545]/[0.04]">
            💬 {commentCount} Comment{commentCount !== 1 ? 's' : ''}
          </button>
          <button onClick={() => setShareModal(true)} className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold text-[#0B2545]/35 hover:text-[#0B2545]/70 hover:bg-[#0B2545]/[0.02] transition-all duration-200">
            🔗 Share
          </button>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className="border-t border-[#0B2545]/[0.04] px-6 py-4 bg-[#F5F1EC]/30">
            {user ? (
              <div className="flex gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#C5960C]/10 flex items-center justify-center text-xs font-bold text-[#C5960C] flex-shrink-0">
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts..."
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                    className="flex-1 text-sm text-[#0B2545] bg-white rounded-xl px-4 py-2.5 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all placeholder:text-[#0B2545]/20" />
                  <button onClick={postComment} disabled={!newComment.trim() || posting}
                    className="px-4 py-2.5 rounded-xl bg-[#C5960C] hover:bg-[#b3870b] text-white text-xs font-semibold transition-all duration-200 disabled:opacity-30 flex-shrink-0">
                    {posting ? '...' : 'Post'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl border-2 border-dashed border-[#0B2545]/10 text-sm text-[#0B2545]/30 hover:text-[#C5960C] hover:border-[#C5960C]/30 transition-all duration-200">
                🔒 Sign in to join the discussion
              </button>
            )}
            <div className="divide-y divide-[#0B2545]/[0.04] max-h-[350px] overflow-y-auto">
              {comments.length > 0 ? comments.map(c => (
                <CommentItem key={c.id} comment={c} user={user} onVote={handleVote} />
              )) : (
                <div className="py-8 text-center">
                  <span className="text-2xl block mb-2">💬</span>
                  <p className="text-sm text-[#0B2545]/20">No comments yet — be the first to share your thoughts!</p>
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

/* ═══════════════════ MAIN LANDING PAGE ═══════════════════ */
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
    <div className="min-h-screen bg-white">
      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[#0B2545]/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-[#C5960C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="text-lg font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>CivicVerify</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate(profile?.role === 'admin' ? '/admin' : profile?.role === 'org' ? '/org' : '/citizen')}
                className="px-5 py-2 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-semibold text-[#0B2545]/50 hover:text-[#0B2545] transition-colors">Sign In</button>
                <button onClick={() => navigate('/signup')} className="px-5 py-2 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #132d52 50%, #1a3a66 100%)` }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white/60">{surveys.length} live survey{surveys.length !== 1 ? 's' : ''} running now</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'Libre Baskerville, serif' }}>
              Your Voice,{' '}
              <span className="relative inline-block">
                <span className="text-[#C5960C]">Verified</span>
                <span className="absolute -bottom-1.5 left-0 right-0 h-1 bg-[#C5960C]/30 rounded-full" />
              </span>
            </h1>

            <p className="text-lg text-white/50 mt-6 leading-relaxed max-w-lg">
              The first civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-10">
              <button onClick={() => navigate('/signup')}
                className="px-7 py-3.5 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#C5960C]/20 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-sm">
                Get Started Free <ArrowRight size={16} />
              </button>
              <button onClick={() => document.getElementById('live-surveys')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-white/[0.08] text-sm">
                View Live Surveys ↓
              </button>
            </div>

            <div className="flex items-center gap-8 mt-14 pt-8 border-t border-white/[0.06]">
              {[
                { icon: '🛡️', label: 'Identity Verified' },
                { icon: '👥', label: 'Real Citizens Only' },
                { icon: '📊', label: 'Transparent Results' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-semibold text-white/30">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-[#F5F1EC]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5960C] mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Three Steps to Civic Impact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📱', title: 'Sign Up & Verify', desc: 'Create an account and verify your identity through our secure partner, Didit. One-time process, completely private.' },
              { step: '02', icon: '📋', title: 'Take Surveys', desc: 'Participate in surveys from civic organizations, government agencies, and community groups on issues that matter to you.' },
              { step: '03', icon: '📈', title: 'See Your Impact', desc: 'Track your civic engagement score, see how your community responds, and watch policy decisions shaped by verified voices.' },
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 border border-[#0B2545]/[0.04] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <span className="text-[64px] font-black text-[#0B2545]/[0.03] absolute top-4 right-6 leading-none" style={{ fontFamily: 'Libre Baskerville, serif' }}>{item.step}</span>
                <div className="w-14 h-14 rounded-xl bg-[#C5960C]/10 flex items-center justify-center text-2xl mb-5">{item.icon}</div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-2 group-hover:text-[#C5960C] transition-colors">{item.title}</h3>
                <p className="text-sm text-[#0B2545]/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE SURVEYS ─── */}
      <section id="live-surveys" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5960C] mb-3">Active Right Now</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Live Surveys</h2>
              <p className="text-sm text-[#0B2545]/35 mt-2">Participate, comment, and share with your community</p>
            </div>
            {user && (
              <button onClick={() => navigate('/citizen/surveys')} className="text-sm font-semibold text-[#C5960C] hover:text-[#b3870b] transition-colors hidden md:flex items-center gap-1">
                View All Surveys →
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#0B2545]/30">Loading surveys...</p>
              </div>
            </div>
          ) : surveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map(s => <LiveSurveyCard key={s.id} survey={s} user={profile} />)}
            </div>
          ) : (
            <div className="bg-[#F5F1EC]/30 rounded-2xl py-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-3xl mb-5">📋</div>
              <p className="text-lg font-semibold text-[#0B2545]/25">No active surveys right now</p>
              <p className="text-sm text-[#0B2545]/20 mt-1">Check back soon or sign up to get notified</p>
              <button onClick={() => navigate('/signup')} className="mt-5 px-6 py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl shadow-sm transition-all">
                Sign Up for Notifications
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-16" style={{ background: `linear-gradient(135deg, ${COLORS.navy}, #132d52)` }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '100%', label: 'Verified Responses' },
            { value: '50+', label: 'Partner Organizations' },
            { value: '10K+', label: 'Citizens Engaged' },
            { value: '99.9%', label: 'Platform Uptime' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[#C5960C]">{stat.value}</p>
              <p className="text-xs font-semibold text-white/30 mt-2 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHO IT'S FOR ─── */}
      <section className="py-20 bg-[#F5F1EC]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5960C] mb-3">Built For Everyone</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Who Uses CivicVerify?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🏛️', title: 'Government Agencies', desc: 'Get verified public input on policy decisions, budget priorities, and community planning initiatives.', color: '#0B2545' },
              { icon: '🏢', title: 'Civic Organizations', desc: 'Commission research-grade surveys with guaranteed authentic participation from verified citizens.', color: '#C5960C' },
              { icon: '👤', title: 'Citizens Like You', desc: 'Make your voice heard on issues that matter. Every verified response carries weight and drives real change.', color: '#22863A' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-[#0B2545]/[0.04] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ background: `${item.color}10` }}>{item.icon}</div>
                <h3 className="text-lg font-bold text-[#0B2545] mb-2 group-hover:text-[#C5960C] transition-colors">{item.title}</h3>
                <p className="text-sm text-[#0B2545]/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#C5960C]/10 flex items-center justify-center text-3xl mx-auto mb-6">🗳️</div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Ready to Make Your Voice Count?</h2>
          <p className="text-lg text-[#0B2545]/40 mt-4 max-w-lg mx-auto leading-relaxed">
            Join thousands of verified citizens shaping the future of civic engagement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button onClick={() => navigate('/signup')}
              className="px-8 py-3.5 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl shadow-lg shadow-[#C5960C]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center gap-2">
              Create Free Account <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-[#0B2545]/5 hover:bg-[#0B2545]/10 text-[#0B2545]/60 font-semibold rounded-xl transition-all duration-200 text-sm">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#0B2545]/[0.06] bg-[#F5F1EC]/30">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#C5960C] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">CV</span>
                </div>
                <span className="text-base font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>CivicVerify</span>
              </div>
              <p className="text-sm text-[#0B2545]/30 max-w-xs">The trusted platform for verified civic engagement. Every voice matters.</p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/25 mb-3">Platform</p>
                <div className="space-y-2">
                  <button onClick={() => navigate('/signup')} className="block text-sm text-[#0B2545]/40 hover:text-[#C5960C] transition-colors">Sign Up</button>
                  <button onClick={() => navigate('/login')} className="block text-sm text-[#0B2545]/40 hover:text-[#C5960C] transition-colors">Sign In</button>
                  <button onClick={() => document.getElementById('live-surveys')?.scrollIntoView({ behavior: 'smooth' })} className="block text-sm text-[#0B2545]/40 hover:text-[#C5960C] transition-colors">Live Surveys</button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/25 mb-3">Company</p>
                <div className="space-y-2">
                  <span className="block text-sm text-[#0B2545]/40">About</span>
                  <span className="block text-sm text-[#0B2545]/40">Privacy</span>
                  <span className="block text-sm text-[#0B2545]/40">Terms</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[#0B2545]/[0.06] flex items-center justify-between">
            <p className="text-xs text-[#0B2545]/20">&copy; {new Date().getFullYear()} CivicVerify. All rights reserved.</p>
            <p className="text-xs text-[#0B2545]/20">Built with trust in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
