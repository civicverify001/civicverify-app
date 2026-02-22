// src/pages/public/Landing.jsx — Inline Polls + Comments + Like/Dislike + Share
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
const font = 'Libre Baskerville, Georgia, serif';

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

/* ======== SHARE MODAL ======== */
function ShareModal({ title, surveyId, onClose }) {
  const url = window.location.origin + '/?survey=' + surveyId;
  const text = '"' + title + '" - Take this civic poll on CivicVerify';
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const links = [
    { label: 'Twitter / X', abbr: 'X', bg: '#000', href: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url) },
    { label: 'Facebook', abbr: 'Fb', bg: '#1877F2', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) },
    { label: 'LinkedIn', abbr: 'In', bg: '#0A66C2', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) },
    { label: 'WhatsApp', abbr: 'Wa', bg: '#25D366', href: 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) },
    { label: 'Email', abbr: '\u2709', bg: '#6B7280', href: 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(text + '\n\n' + url) },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={function(e){e.stopPropagation()}} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: 0 }}>Share This Poll</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#999' }}>{'\u2715'}</button>
        </div>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>{title}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
          {links.map(function(l, i) {
            return (
              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: l.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{l.abbr}</div>
                <span style={{ fontSize: 10, color: '#999' }}>{l.label}</span>
              </a>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#f5f5f5', borderRadius: 12, padding: 8 }}>
          <input readOnly value={url} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: '#666', outline: 'none', padding: '0 8px' }} />
          <button onClick={copy} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: copied ? C.green : C.gold, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {copied ? '\u2713 Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======== INLINE POLL ======== */
function InlinePoll({ question, surveyId, user, existingAnswer, onVoted, responseCount }) {
  var navigate = useNavigate();
  var [selected, setSelected] = useState(existingAnswer || null);
  var [results, setResults] = useState(null);
  var [voting, setVoting] = useState(false);

  async function loadResults() {
    var resp = await supabase.from('responses').select('answers').eq('survey_id', surveyId);
    var data = resp.data;
    if (!data) return;
    var counts = {};
    (question.options || []).forEach(function(o) { counts[o] = 0; });
    data.forEach(function(r) {
      var a = r.answers ? r.answers[question.id] : null;
      if (a) {
        if (Array.isArray(a)) { a.forEach(function(v) { counts[v] = (counts[v] || 0) + 1; }); }
        else { counts[a] = (counts[a] || 0) + 1; }
      }
    });
    var total = Object.values(counts).reduce(function(a, b) { return a + b; }, 0);
    setResults({ counts: counts, total: total });
  }

  async function vote(option) {
    if (!user) { navigate('/login'); return; }
    if (selected) return;
    setVoting(true);
    setSelected(option);
    var answers = {};
    answers[question.id] = option;
    var res = await supabase.from('responses').insert({ survey_id: surveyId, user_id: user.id, answers: answers });
    if (!res.error) {
      await supabase.from('surveys').update({ response_count: (responseCount || 0) + 1 }).eq('id', surveyId);
      if (onVoted) onVoted();
    }
    setVoting(false);
    loadResults();
  }

  useEffect(function() {
    if (existingAnswer) loadResults();
  }, [existingAnswer]);

  var showResults = selected || existingAnswer;
  var options = question.options || [];

  if (question.type === 'rating') {
    return (
      <div style={{ margin: '16px 0' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 12px', lineHeight: 1.4 }}>{question.text}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '8px 0' }}>
          {[1,2,3,4,5].map(function(n) {
            return (
              <button key={n} onClick={function(){vote(n)}} disabled={!!selected}
                style={{ width: 48, height: 48, borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: selected ? 'default' : 'pointer', background: selected === n ? C.gold : 'rgba(11,37,69,0.04)', color: selected === n ? '#fff' : 'rgba(11,37,69,0.3)', transform: selected === n ? 'scale(1.1)' : 'none', transition: 'all 0.2s' }}>
                {n}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === 'text') {
    return (
      <div style={{ margin: '16px 0' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 8px' }}>{question.text}</p>
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', fontStyle: 'italic', margin: 0 }}>Sign in to submit a text response</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '16px 0' }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 14px', lineHeight: 1.4 }}>
        {question.text} {question.required ? <span style={{ color: C.red }}>*</span> : null}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(function(opt, i) {
          var count = results && results.counts ? (results.counts[opt] || 0) : 0;
          var pct = results && results.total > 0 ? Math.round((count / results.total) * 100) : 0;
          var isSelected = selected === opt || existingAnswer === opt;

          return (
            <button key={i} onClick={function(){vote(opt)}} disabled={!!selected || voting}
              style={{ position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: 12, border: '2px solid ' + (isSelected ? C.gold : 'rgba(11,37,69,0.07)'), background: isSelected ? C.gold + '08' : '#fff', cursor: selected ? 'default' : 'pointer', transition: 'all 0.2s', zIndex: 1 }}>
              {showResults ? (
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: pct + '%', background: isSelected ? C.gold + '18' : 'rgba(11,37,69,0.04)', borderRadius: 10, transition: 'width 0.8s ease-out', zIndex: -1 }} />
              ) : null}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!showResults ? (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (isSelected ? C.gold : 'rgba(11,37,69,0.15)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold }} /> : null}
                    </span>
                  ) : isSelected ? <span style={{ fontSize: 14 }}>{'\u2713'}</span> : null}
                  <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.navy : 'rgba(11,37,69,0.6)' }}>{opt}</span>
                </div>
                {showResults ? (
                  <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? C.gold : 'rgba(11,37,69,0.25)', minWidth: 44, textAlign: 'right' }}>
                    {pct}%
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
        {showResults ? (
          <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0', textAlign: 'right' }}>
            {(results ? results.total : 0) || 0} total votes
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ======== COMMENT ITEM ======== */
function CommentItem({ comment, user, onVote }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(11,37,69,0.1), rgba(11,37,69,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(11,37,69,0.35)', flexShrink: 0 }}>
        {(comment.user_name || 'A').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{comment.user_name || 'Anonymous'}</span>
          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)' }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.55)', margin: '6px 0 0', lineHeight: 1.6 }}>{comment.content}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={function(){onVote(comment.id, 'like')}}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: comment.userVote === 'like' ? C.green : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'like' ? 600 : 400 }}>
            {'\uD83D\uDC4D'} {comment.likes || 0}
          </button>
          <button onClick={function(){onVote(comment.id, 'dislike')}}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: comment.userVote === 'dislike' ? C.red : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'dislike' ? 600 : 400 }}>
            {'\uD83D\uDC4E'} {comment.dislikes || 0}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======== LIVE SURVEY CARD ======== */
function LiveSurveyCard({ survey, user }) {
  var navigate = useNavigate();
  var [comments, setComments] = useState([]);
  var [newComment, setNewComment] = useState('');
  var [showComments, setShowComments] = useState(false);
  var [posting, setPosting] = useState(false);
  var [shareModal, setShareModal] = useState(false);
  var [commentCount, setCommentCount] = useState(0);
  var [hovered, setHovered] = useState(false);
  var [existingAnswer, setExistingAnswer] = useState(null);
  var [responseCount, setResponseCount] = useState(survey.response_count || 0);

  useEffect(function() {
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id)
      .then(function(r) { setCommentCount(r.count || 0); });
    if (user && user.id) {
      supabase.from('responses').select('answers').eq('survey_id', survey.id).eq('user_id', user.id).limit(1)
        .then(function(r) {
          if (r.data && r.data.length > 0) {
            var q = (survey.questions || [])[0];
            if (q) setExistingAnswer(r.data[0].answers ? r.data[0].answers[q.id] : null);
          }
        });
    }
  }, [survey.id, user]);

  async function loadComments() {
    var res = await supabase.from('comments').select('*, users(full_name)').eq('survey_id', survey.id).order('created_at', { ascending: false }).limit(30);
    var list = (res.data || []).map(function(c) { return Object.assign({}, c, { user_name: c.users ? c.users.full_name : null }); });
    if (user && user.id) {
      var vr = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id);
      var vm = {};
      (vr.data || []).forEach(function(v) { vm[v.comment_id] = v.vote_type; });
      list = list.map(function(c) { return Object.assign({}, c, { userVote: vm[c.id] || null }); });
    }
    setComments(list);
  }

  function toggleComments() { if (!showComments) loadComments(); setShowComments(!showComments); }

  async function postComment() {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    var res = await supabase.from('comments').insert({ survey_id: survey.id, user_id: user.id, content: newComment.trim() }).select('*, users(full_name)').single();
    if (!res.error && res.data) {
      setComments([Object.assign({}, res.data, { user_name: res.data.users ? res.data.users.full_name : null, userVote: null })].concat(comments));
      setCommentCount(function(c) { return c + 1; });
      setNewComment('');
    }
    setPosting(false);
  }

  async function handleVote(commentId, type) {
    if (!user) { navigate('/login'); return; }
    var c = comments.find(function(x) { return x.id === commentId; });
    if (!c) return;
    var existing = c.userVote;
    if (existing === type) {
      await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      var upd = {}; upd[type + 's'] = Math.max((c[type + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(upd).eq('id', commentId);
      setComments(comments.map(function(x) { if (x.id !== commentId) return x; var o = Object.assign({}, x, { userVote: null }); o[type + 's'] = Math.max((x[type + 's'] || 1) - 1, 0); return o; }));
    } else {
      await supabase.from('comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote_type: type }, { onConflict: 'comment_id,user_id' });
      var updates = {}; updates[type + 's'] = (c[type + 's'] || 0) + 1;
      if (existing) updates[existing + 's'] = Math.max((c[existing + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(updates).eq('id', commentId);
      setComments(comments.map(function(x) { if (x.id !== commentId) return x; return Object.assign({}, x, updates, { userVote: type }); }));
    }
  }

  var firstQ = (survey.questions || [])[0];
  var extraQs = (survey.questions || []).length - 1;

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', transition: 'all 0.3s', boxShadow: hovered ? '0 16px 48px rgba(11,37,69,0.08)' : '0 2px 8px rgba(11,37,69,0.03)', transform: hovered ? 'translateY(-3px)' : 'none' }}
        onMouseEnter={function(){setHovered(true)}} onMouseLeave={function(){setHovered(false)}}>
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ecfdf5', color: '#059669', border: '1px solid rgba(5,150,105,0.15)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' }} /> Live Poll
            </span>
            <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)' }}>{responseCount} vote{responseCount !== 1 ? 's' : ''}</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 4px', lineHeight: 1.3, fontFamily: font }}>{survey.title}</h3>
          {survey.description ? <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 4px', lineHeight: 1.5 }}>{survey.description}</p> : null}
        </div>
        <div style={{ padding: '4px 24px 20px' }}>
          {firstQ ? (
            <>
              <InlinePoll question={firstQ} surveyId={survey.id} user={user} existingAnswer={existingAnswer} onVoted={function(){setResponseCount(function(r){return r+1})}} responseCount={responseCount} />
              {extraQs > 0 ? (
                <button onClick={function(){navigate(user ? '/citizen/surveys/' + survey.id : '/login')}}
                  style={{ width: '100%', padding: 10, background: C.gold + '08', border: '1px dashed ' + C.gold + '40', borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.gold, cursor: 'pointer', marginTop: 8 }}>
                  + {extraQs} more question{extraQs !== 1 ? 's' : ''} — Take Full Survey
                </button>
              ) : null}
            </>
          ) : (
            <button onClick={function(){navigate(user ? '/citizen/surveys/' + survey.id : '/login')}}
              style={{ width: '100%', padding: 12, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {user ? 'Take This Survey' : 'Sign In to Vote'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(11,37,69,0.05)' }}>
          <button onClick={toggleComments}
            style={{ flex: 1, padding: 14, fontSize: 12, fontWeight: 600, color: showComments ? C.gold : 'rgba(11,37,69,0.3)', border: 'none', background: showComments ? C.gold + '06' : 'transparent', cursor: 'pointer', borderRight: '1px solid rgba(11,37,69,0.05)' }}>
            {'\uD83D\uDCAC'} {commentCount} Comment{commentCount !== 1 ? 's' : ''}
          </button>
          <button onClick={function(){setShareModal(true)}}
            style={{ flex: 1, padding: 14, fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.3)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            {'\uD83D\uDD17'} Share
          </button>
        </div>
        {showComments ? (
          <div style={{ borderTop: '1px solid rgba(11,37,69,0.05)', padding: '20px 24px', background: 'rgba(245,241,236,0.25)' }}>
            {user ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <input value={newComment} onChange={function(e){setNewComment(e.target.value)}} placeholder="Share your thoughts on this poll..."
                  onKeyDown={function(e){if(e.key==='Enter')postComment()}}
                  style={{ flex: 1, padding: '10px 16px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 12, outline: 'none', color: C.navy, background: '#fff' }} />
                <button onClick={postComment} disabled={!newComment.trim() || posting}
                  style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: C.gold, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!newComment.trim() || posting) ? 0.3 : 1, whiteSpace: 'nowrap' }}>
                  {posting ? '...' : 'Post'}
                </button>
              </div>
            ) : (
              <button onClick={function(){navigate('/login')}}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: '2px dashed rgba(11,37,69,0.1)', background: 'transparent', fontSize: 13, color: 'rgba(11,37,69,0.3)', cursor: 'pointer', marginBottom: 12 }}>
                {'\uD83D\uDD12'} Sign in to comment & like
              </button>
            )}
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              {comments.length > 0 ? comments.map(function(c) {
                return <CommentItem key={c.id} comment={c} user={user} onVote={handleVote} />;
              }) : (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{'\uD83D\uDCAC'}</span>
                  <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.2)', margin: 0 }}>No comments yet - be the first!</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {shareModal ? <ShareModal title={survey.title} surveyId={survey.id} onClose={function(){setShareModal(false)}} /> : null}
    </>
  );
}

/* ======== SECTION HELPER ======== */
function Section({ children, bg, id }) {
  return <section id={id} style={{ background: bg || '#fff', padding: '80px 0' }}><div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>{children}</div></section>;
}

/* ======== MAIN LANDING ======== */
export default function Landing() {
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;
  var profile = auth.profile;
  var [surveys, setSurveys] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(6)
      .then(function(r) { setSurveys(r.data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(11,37,69,0.05)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>CV</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <button onClick={function(){navigate(profile && profile.role === 'admin' ? '/admin' : profile && profile.role === 'org' ? '/org' : '/citizen')}}
                style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={function(){navigate('/login')}} style={{ padding: '10px 16px', background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, color: 'rgba(11,37,69,0.5)', cursor: 'pointer' }}>Sign In</button>
                <button onClick={function(){navigate('/signup')}} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #0B2545 0%, #132d52 50%, #1a3a66 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 24px 90px', position: 'relative' }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{surveys.length} live poll{surveys.length !== 1 ? 's' : ''} running now</span>
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', fontFamily: font, letterSpacing: '-0.02em' }}>
              Your Voice, <span style={{ color: C.gold, position: 'relative', display: 'inline-block' }}>Verified<span style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: C.gold + '40', borderRadius: 2 }} /></span>
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 480 }}>
              The first civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 56 }}>
              <button onClick={function(){navigate('/signup')}} style={{ padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(197,150,12,0.25)' }}>
                Get Started Free {'\u2192'}
              </button>
              <button onClick={function(){document.getElementById('live-polls').scrollIntoView({ behavior: 'smooth' })}}
                style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                View Live Polls {'\u2193'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[{i:'\uD83D\uDEE1\uFE0F',t:'Identity Verified'},{i:'\uD83D\uDC65',t:'Real Citizens Only'},{i:'\uD83D\uDCCA',t:'Transparent Results'}].map(function(x,i){
                return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 16 }}>{x.i}</span><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>{x.t}</span></div>;
              })}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section bg="rgba(245,241,236,0.3)">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>How It Works</p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1.2 }}>Three Steps to Civic Impact</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            {s:'01',i:'\uD83D\uDCF1',t:'Sign Up & Verify',d:'Create an account and verify your identity through our secure partner. One-time process, completely private.'},
            {s:'02',i:'\uD83D\uDCCB',t:'Vote on Polls',d:'Vote directly on live civic polls, comment on issues, and engage with fellow citizens in real-time discussions.'},
            {s:'03',i:'\uD83D\uDCC8',t:'See Your Impact',d:'Watch live results update, track your civic engagement score, and see how your community responds.'}
          ].map(function(item,i){
            return (
              <div key={i} style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 32, border: '1px solid rgba(11,37,69,0.05)', transition: 'all 0.3s' }}>
                <span style={{ position: 'absolute', top: 16, right: 20, fontSize: 56, fontWeight: 900, color: 'rgba(11,37,69,0.03)', fontFamily: font, lineHeight: 1 }}>{item.s}</span>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: C.gold + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>{item.i}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{item.t}</h3>
                <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.7 }}>{item.d}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* LIVE POLLS */}
      <section id="live-polls" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>Vote Now</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Live Civic Polls</h2>
            <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Vote, comment, and share - right here, right now</p>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
              <div style={{ width: 40, height: 40, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)' }}>Loading polls...</p>
            </div>
          ) : surveys.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
              {surveys.map(function(s) { return <LiveSurveyCard key={s.id} survey={s} user={profile} />; })}
            </div>
          ) : (
            <div style={{ background: 'rgba(245,241,236,0.4)', borderRadius: 20, padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: C.gold + '08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>{'\uD83D\uDDF3\uFE0F'}</div>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(11,37,69,0.25)', margin: '0 0 8px' }}>No active polls right now</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.18)', margin: '0 0 24px' }}>Check back soon or sign up to get notified</p>
              <button onClick={function(){navigate('/signup')}} style={{ padding: '12px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign Up for Notifications</button>
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '64px 0', background: 'linear-gradient(135deg, #0B2545, #132d52)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          {[{v:'100%',l:'Verified Responses'},{v:'50+',l:'Partner Organizations'},{v:'10K+',l:'Citizens Engaged'},{v:'99.9%',l:'Platform Uptime'}].map(function(s,i){
            return <div key={i}><p style={{ fontSize: 36, fontWeight: 700, color: C.gold, margin: '0 0 8px' }}>{s.v}</p><p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>{s.l}</p></div>;
          })}
        </div>
      </section>

      {/* WHO USES */}
      <Section bg="rgba(245,241,236,0.3)">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>Built For Everyone</p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Who Uses CivicVerify?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            {i:'\uD83C\uDFDB\uFE0F',t:'Government Agencies',d:'Get verified public input on policy decisions, budget priorities, and community planning.',c:C.navy},
            {i:'\uD83C\uDFE2',t:'Civic Organizations',d:'Commission research-grade surveys with guaranteed authentic, verified participation.',c:C.gold},
            {i:'\uD83D\uDC64',t:'Citizens Like You',d:'Vote on polls, comment on issues, and make your verified voice count in real decisions.',c:C.green}
          ].map(function(item,i){
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid rgba(11,37,69,0.05)', transition: 'all 0.3s' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: item.c + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>{item.i}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>{item.t}</h3>
                <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.7 }}>{item.d}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: C.gold + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>{'\uD83D\uDDF3\uFE0F'}</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: '0 0 16px', fontFamily: font }}>Ready to Make Your Voice Count?</h2>
          <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.4)', margin: '0 0 32px', lineHeight: 1.7 }}>Join thousands of verified citizens shaping the future of civic engagement.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
            <button onClick={function(){navigate('/signup')}} style={{ padding: '14px 32px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(197,150,12,0.2)' }}>Create Free Account {'\u2192'}</button>
            <button onClick={function(){navigate('/login')}} style={{ padding: '14px 32px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(11,37,69,0.06)', background: 'rgba(245,241,236,0.3)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>CV</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', lineHeight: 1.6, margin: 0 }}>The trusted platform for verified civic engagement. Every voice matters.</p>
            </div>
            <div style={{ display: 'flex', gap: 48 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.2)', margin: '0 0 12px' }}>Platform</p>
                <button onClick={function(){navigate('/signup')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Sign Up</button>
                <button onClick={function(){navigate('/login')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Sign In</button>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.2)', margin: '0 0 12px' }}>Company</p>
                <span style={{ display: 'block', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)' }}>About</span>
                <span style={{ display: 'block', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)' }}>Privacy</span>
                <span style={{ display: 'block', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)' }}>Terms</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.18)', margin: 0 }}>{'\u00A9'} {new Date().getFullYear()} CivicVerify. All rights reserved.</p>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.18)', margin: 0 }}>Built with trust in mind.</p>
          </div>
        </div>
      </footer>

      <style>{'\
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }\
        @keyframes spin { to { transform:rotate(360deg) } }\
        * { box-sizing:border-box; }\
      '}</style>
    </div>
  );
}
