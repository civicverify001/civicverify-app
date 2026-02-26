// src/pages/public/Landing.jsx — Complete with Notification Bell + Mobile Overflow Fix
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBell from '../../components/NotificationBell';

/* ======== DESIGN TOKENS ======== */
var C = {
  navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A',
  ink: '#1a2332', muted: 'rgba(11,37,69,0.45)', light: 'rgba(11,37,69,0.08)',
  goldGlow: 'rgba(197,150,12,0.15)', navyDeep: '#091e38',
};
var heading = "'Playfair Display', Georgia, serif";
var body = "'DM Sans', -apple-system, sans-serif";

/* ======== SCROLL ANIMATION HOOK ======== */
function useReveal(threshold) {
  var ref = useRef(null);
  var [visible, setVisible] = useState(false);
  useEffect(function () {
    var el = ref.current;
    if (!el) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } });
    }, { threshold: threshold || 0.15 });
    obs.observe(el);
    return function () { obs.disconnect(); };
  }, []);
  return [ref, visible];
}

/* ======== ANIMATED COUNTER ======== */
function AnimatedNumber({ value, duration, suffix }) {
  var [display, setDisplay] = useState(0);
  var [ref, visible] = useReveal(0.3);
  useEffect(function () {
    if (!visible) return;
    var target = typeof value === 'number' ? value : parseInt(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    var start = 0;
    var dur = duration || 2000;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / dur, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [visible, value]);
  return <span ref={ref}>{display.toLocaleString()}{suffix || ''}</span>;
}

/* ======== UTILITIES ======== */
function timeAgo(d) {
  var s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 2592000) return Math.floor(s / 86400) + 'd ago';
  return Math.floor(s / 2592000) + 'mo ago';
}

/* ======== SHARE MODAL ======== */
function ShareModal({ title, surveyId, onClose }) {
  var url = window.location.origin + (surveyId ? '/?survey=' + surveyId : '');
  var text = '"' + title + '" on CivicVerify \u2014 Your Voice, Verified';
  var [copied, setCopied] = useState(false);
  var copy = function () { navigator.clipboard.writeText(url); setCopied(true); setTimeout(function () { setCopied(false); }, 2000); };
  var links = [
    { label: 'Twitter / X', abbr: 'X', bg: '#000', href: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url) },
    { label: 'Facebook', abbr: 'Fb', bg: '#1877F2', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) },
    { label: 'LinkedIn', abbr: 'In', bg: '#0A66C2', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) },
    { label: 'WhatsApp', abbr: 'Wa', bg: '#25D366', href: 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) },
    { label: 'Email', abbr: '\u2709', bg: '#6B7280', href: 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(text + '\n\n' + url) },
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={function (e) { e.stopPropagation(); }} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: 0, fontFamily: heading }}>Share</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#999' }}>{'\u2715'}</button>
        </div>
        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 20px', lineHeight: 1.5, fontFamily: body }}>{title}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
          {links.map(function (l, i) {
            return (
              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, textDecoration: 'none', transition: 'transform 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: l.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: body }}>{l.abbr}</div>
                <span style={{ fontSize: 10, color: '#999', fontFamily: body }}>{l.label}</span>
              </a>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, background: '#f7f7f7', borderRadius: 12, padding: 8 }}>
          <input readOnly value={url} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, color: '#666', outline: 'none', padding: '0 8px', fontFamily: body, minWidth: 0 }} />
          <button onClick={copy} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: copied ? C.green : C.gold, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: body, transition: 'background 0.3s', whiteSpace: 'nowrap' }}>
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
    if (!resp.data) return;
    var counts = {};
    (question.options || []).forEach(function (o) { counts[o] = 0; });
    resp.data.forEach(function (r) {
      var a = r.answers ? r.answers[question.id] : null;
      if (a) { if (Array.isArray(a)) { a.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; }); } else { counts[a] = (counts[a] || 0) + 1; } }
    });
    setResults({ counts: counts, total: Object.values(counts).reduce(function (a, b) { return a + b; }, 0) });
  }

  async function vote(option) {
    if (!user) { navigate('/login'); return; }
    if (selected) return;
    setVoting(true); setSelected(option);
    var answers = {}; answers[question.id] = option;
    var res = await supabase.from('responses').insert({ survey_id: surveyId, user_id: user.id, answers: answers });
    if (!res.error) { await supabase.from('surveys').update({ response_count: (responseCount || 0) + 1 }).eq('id', surveyId); if (onVoted) onVoted(); }
    setVoting(false); loadResults();
  }

  useEffect(function () { if (existingAnswer) loadResults(); }, [existingAnswer]);

  var showResults = selected || existingAnswer;
  var options = question.options || [];

  if (question.type === 'rating') {
    return (
      <div style={{ margin: '16px 0' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 12px', fontFamily: body }}>{question.text}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map(function (n) { return <button key={n} onClick={function () { vote(n); }} disabled={!!selected} style={{ width: 46, height: 46, borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: selected ? 'default' : 'pointer', background: selected === n ? C.gold : 'rgba(11,37,69,0.04)', color: selected === n ? '#fff' : 'rgba(11,37,69,0.3)', transform: selected === n ? 'scale(1.15)' : 'none', transition: 'all 0.25s cubic-bezier(.4,0,.2,1)', fontFamily: body }}>{n}</button>; })}
        </div>
      </div>
    );
  }
  if (question.type === 'text') { return <div style={{ margin: '16px 0' }}><p style={{ fontSize: 13, color: C.muted, fontStyle: 'italic', fontFamily: body }}>Sign in to respond</p></div>; }

  return (
    <div style={{ margin: '16px 0' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 14px', lineHeight: 1.4, fontFamily: body }}>{question.text} {question.required ? <span style={{ color: C.red }}>*</span> : null}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(function (opt, i) {
          var count = results && results.counts ? (results.counts[opt] || 0) : 0;
          var pct = results && results.total > 0 ? Math.round((count / results.total) * 100) : 0;
          var isSelected = selected === opt || existingAnswer === opt;
          return (
            <button key={i} onClick={function () { vote(opt); }} disabled={!!selected || voting}
              style={{ position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'left', padding: '13px 16px', borderRadius: 12, border: '2px solid ' + (isSelected ? C.gold : C.light), background: isSelected ? C.goldGlow : '#fff', cursor: selected ? 'default' : 'pointer', transition: 'all 0.25s', zIndex: 1, fontFamily: body }}>
              {showResults ? <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: pct + '%', background: isSelected ? C.gold + '18' : 'rgba(11,37,69,0.04)', borderRadius: 10, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)', zIndex: -1 }} /> : null}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {!showResults ? <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (isSelected ? C.gold : 'rgba(11,37,69,0.15)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isSelected ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.gold }} /> : null}</span> : isSelected ? <span style={{ fontSize: 13, color: C.gold, flexShrink: 0 }}>{'\u2713'}</span> : null}
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.navy : 'rgba(11,37,69,0.55)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
                </div>
                {showResults ? <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.gold : 'rgba(11,37,69,0.25)', minWidth: 40, textAlign: 'right', flexShrink: 0 }}>{pct}%</span> : null}
              </div>
            </button>
          );
        })}
        {showResults ? <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0', textAlign: 'right', fontFamily: body }}>{(results ? results.total : 0)} total votes</p> : null}
      </div>
    </div>
  );
}

/* ======== COMMENT ITEM ======== */
function CommentItem({ comment, user, onVote }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(11,37,69,0.08), rgba(11,37,69,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(11,37,69,0.3)', flexShrink: 0, fontFamily: body }}>
        {(comment.user_name || 'A').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: body }}>{comment.user_name || 'Anonymous'}</span>
          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', fontFamily: body }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.55)', margin: '5px 0 0', lineHeight: 1.6, fontFamily: body, wordBreak: 'break-word' }}>{comment.content}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={function () { onVote(comment.id, 'like'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: comment.userVote === 'like' ? C.green : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'like' ? 600 : 400, fontFamily: body, transition: 'color 0.2s' }}>
            {'\uD83D\uDC4D'} {comment.likes || 0}
          </button>
          <button onClick={function () { onVote(comment.id, 'dislike'); }} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: comment.userVote === 'dislike' ? C.red : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'dislike' ? 600 : 400, fontFamily: body, transition: 'color 0.2s' }}>
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
  var [existingAnswer, setExistingAnswer] = useState(null);
  var [responseCount, setResponseCount] = useState(survey.response_count || 0);

  useEffect(function () {
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id).then(function (r) { setCommentCount(r.count || 0); });
    if (user && user.id) {
      supabase.from('responses').select('answers').eq('survey_id', survey.id).eq('user_id', user.id).limit(1).then(function (r) {
        if (r.data && r.data.length > 0) { var q = (survey.questions || [])[0]; if (q) setExistingAnswer(r.data[0].answers ? r.data[0].answers[q.id] : null); }
      });
    }
  }, [survey.id, user]);

  async function loadComments() {
    var res = await supabase.from('comments').select('*, users(full_name)').eq('survey_id', survey.id).order('created_at', { ascending: false }).limit(30);
    var list = (res.data || []).map(function (c) { return Object.assign({}, c, { user_name: c.users ? c.users.full_name : null }); });
    if (user && user.id) {
      var vr = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id);
      var vm = {}; (vr.data || []).forEach(function (v) { vm[v.comment_id] = v.vote_type; });
      list = list.map(function (c) { return Object.assign({}, c, { userVote: vm[c.id] || null }); });
    }
    list.sort(function (a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); });
    setComments(list);
  }

  function toggleComments() { if (!showComments) loadComments(); setShowComments(!showComments); }

  async function postComment() {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    var res = await supabase.from('comments').insert({ survey_id: survey.id, user_id: user.id, content: newComment.trim() }).select('*, users(full_name)').single();
    if (!res.error && res.data) { setComments([Object.assign({}, res.data, { user_name: res.data.users ? res.data.users.full_name : null, userVote: null })].concat(comments)); setCommentCount(function (c) { return c + 1; }); setNewComment(''); }
    setPosting(false);
  }

  async function handleVote(commentId, type) {
    if (!user) { navigate('/login'); return; }
    var c = comments.find(function (x) { return x.id === commentId; });
    if (!c) return;
    var existing = c.userVote;
    if (existing === type) {
      await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      var upd = {}; upd[type + 's'] = Math.max((c[type + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(upd).eq('id', commentId);
      setComments(function (prev) { return prev.map(function (x) { if (x.id !== commentId) return x; var o = Object.assign({}, x, { userVote: null }); o[type + 's'] = Math.max((x[type + 's'] || 1) - 1, 0); return o; }).sort(function (a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); }); });
    } else {
      await supabase.from('comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote_type: type }, { onConflict: 'comment_id,user_id' });
      var updates = {}; updates[type + 's'] = (c[type + 's'] || 0) + 1;
      if (existing) updates[existing + 's'] = Math.max((c[existing + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(updates).eq('id', commentId);
      setComments(function (prev) { return prev.map(function (x) { if (x.id !== commentId) return x; return Object.assign({}, x, updates, { userVote: type }); }).sort(function (a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); }); });
    }
  }

  var firstQ = (survey.questions || [])[0];
  var extraQs = (survey.questions || []).length - 1;

  return (
    <>
      <div className="cv-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid ' + C.light, overflow: 'hidden', transition: 'all 0.35s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ padding: '22px 22px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ecfdf5', color: '#059669', border: '1px solid rgba(5,150,105,0.12)', fontFamily: body }}>
              <span className="cv-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> Live
            </span>
            <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', fontFamily: body }}>{responseCount} vote{responseCount !== 1 ? 's' : ''}</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 4px', lineHeight: 1.3, fontFamily: heading }}>{survey.title}</h3>
          {survey.description ? <p style={{ fontSize: 13, color: C.muted, margin: '0 0 4px', lineHeight: 1.5, fontFamily: body }}>{survey.description}</p> : null}
        </div>
        <div style={{ padding: '4px 22px 18px' }}>
          {firstQ ? (
            <>
              <InlinePoll question={firstQ} surveyId={survey.id} user={user} existingAnswer={existingAnswer} onVoted={function () { setResponseCount(function (r) { return r + 1; }); }} responseCount={responseCount} />
              {extraQs > 0 ? <button onClick={function () { navigate(user ? '/citizen/surveys/' + survey.id : '/login'); }} style={{ width: '100%', padding: 10, background: C.goldGlow, border: '1px dashed ' + C.gold + '40', borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.gold, cursor: 'pointer', marginTop: 6, fontFamily: body }}>+ {extraQs} more question{extraQs !== 1 ? 's' : ''} {'\u2014'} Full Survey</button> : null}
            </>
          ) : <button onClick={function () { navigate(user ? '/citizen/surveys/' + survey.id : '/login'); }} style={{ width: '100%', padding: 12, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: body }}>{user ? 'Take Survey' : 'Sign In to Vote'}</button>}
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid ' + C.light }}>
          <button onClick={toggleComments} className="cv-btn-subtle" style={{ flex: 1, padding: 13, fontSize: 12, fontWeight: 600, color: showComments ? C.gold : 'rgba(11,37,69,0.3)', border: 'none', background: showComments ? C.goldGlow : 'transparent', cursor: 'pointer', borderRight: '1px solid ' + C.light, fontFamily: body, transition: 'all 0.2s' }}>{'\uD83D\uDCAC'} {commentCount}</button>
          <button onClick={function () { setShareModal(true); }} className="cv-btn-subtle" style={{ flex: 1, padding: 13, fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.3)', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: body, transition: 'all 0.2s' }}>{'\uD83D\uDD17'} Share</button>
        </div>
        {showComments ? (
          <div style={{ borderTop: '1px solid ' + C.light, padding: '18px 22px', background: 'rgba(245,241,236,0.2)' }}>
            {user ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.goldGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.gold, flexShrink: 0, fontFamily: body }}>{(user.full_name || 'U').charAt(0).toUpperCase()}</div>
                <input value={newComment} onChange={function (e) { setNewComment(e.target.value); }} placeholder="Share your thoughts..." onKeyDown={function (e) { if (e.key === 'Enter') postComment(); }} style={{ flex: 1, padding: '9px 14px', fontSize: 13, border: '1px solid ' + C.light, borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', fontFamily: body, minWidth: 0 }} />
                <button onClick={postComment} disabled={!newComment.trim() || posting} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!newComment.trim() || posting) ? 0.3 : 1, whiteSpace: 'nowrap', fontFamily: body }}>Post</button>
              </div>
            ) : <button onClick={function () { navigate('/login'); }} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px dashed ' + C.light, background: 'transparent', fontSize: 13, color: 'rgba(11,37,69,0.3)', cursor: 'pointer', marginBottom: 12, fontFamily: body }}>{'\uD83D\uDD12'} Sign in to comment</button>}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {comments.length > 0 ? comments.map(function (c) { return <CommentItem key={c.id} comment={c} user={user} onVote={handleVote} />; }) : (
                <div style={{ padding: '28px 0', textAlign: 'center' }}><span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>{'\uD83D\uDCAC'}</span><p style={{ fontSize: 13, color: 'rgba(11,37,69,0.2)', margin: 0, fontFamily: body }}>No comments yet</p></div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {shareModal ? <ShareModal title={survey.title} surveyId={survey.id} onClose={function () { setShareModal(false); }} /> : null}
    </>
  );
}

/* ======== COMMUNITY DISCUSSIONS ======== */
function CommunityDiscussions({ user }) {
  var navigate = useNavigate();
  var [posts, setPosts] = useState([]);
  var [newTopic, setNewTopic] = useState('');
  var [posting, setPosting] = useState(false);
  var [loading, setLoading] = useState(true);

  async function loadPosts() {
    var res = await supabase.from('community_posts')
      .select('id, content, image_url, created_at, likes_count, dislikes_count, comments_count, users:user_id(full_name, identity_verified, avatar_url)')
      .order('created_at', { ascending: false }).limit(10);
    setPosts((res.data || []).map(function (p) {
      return Object.assign({}, p, {
        author_name: p.users ? p.users.full_name : null,
        author_verified: p.users ? p.users.identity_verified : false,
        author_avatar: p.users ? p.users.avatar_url : null,
      });
    }));
    setLoading(false);
  }

  useEffect(function () { loadPosts(); }, []);

  async function postTopic() {
    if (!newTopic.trim() || !user) return;
    setPosting(true);
    var res = await supabase.from('community_posts')
      .insert({ user_id: user.id, content: newTopic.trim(), likes_count: 0, comments_count: 0 })
      .select('id, content, created_at, likes_count, comments_count, users:user_id(full_name, identity_verified, avatar_url)')
      .single();
    if (!res.error && res.data) {
      setPosts([Object.assign({}, res.data, {
        author_name: res.data.users ? res.data.users.full_name : null,
        author_verified: res.data.users ? res.data.users.identity_verified : false,
        author_avatar: res.data.users ? res.data.users.avatar_url : null,
      })].concat(posts));
      setNewTopic('');
    }
    setPosting(false);
  }

  return (
    <div>
      {user ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid ' + C.light, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.goldGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.gold, flexShrink: 0, fontFamily: body }}>{(user.full_name || 'U').charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea value={newTopic} onChange={function (e) { setNewTopic(e.target.value); }} placeholder="What civic issue is on your mind?" rows={3} style={{ width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid ' + C.light, borderRadius: 12, outline: 'none', color: C.navy, background: '#fff', resize: 'vertical', lineHeight: 1.6, fontFamily: body, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button onClick={postTopic} disabled={!newTopic.trim() || posting} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!newTopic.trim() || posting) ? 0.3 : 1, fontFamily: body }}>{posting ? 'Posting...' : 'Start Discussion'}</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={function () { navigate('/login'); }} style={{ width: '100%', padding: 20, borderRadius: 16, border: '1.5px dashed ' + C.light, background: 'transparent', fontSize: 14, color: 'rgba(11,37,69,0.3)', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: body }}>{'\uD83D\uDD12'} Sign in to start or join discussions</button>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}><div className="cv-spinner" /></div>
      ) : posts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {posts.map(function (p) {
            return (
              <div key={p.id} className="cv-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid ' + C.light, overflow: 'hidden', padding: 18 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  {p.author_avatar ? (
                    <img src={p.author_avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.navy + ', rgba(11,37,69,0.7))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.gold, flexShrink: 0, fontFamily: body }}>{(p.author_name || 'A').charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: body }}>{p.author_name || 'Citizen'}</span>
                      {p.author_verified && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: C.goldGlow, padding: '2px 8px', borderRadius: 20, fontFamily: body }}>VERIFIED</span>}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', fontFamily: body }}>{timeAgo(p.created_at)}</span>
                  </div>
                </div>
                <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.7)', margin: '0 0 12px', lineHeight: 1.65, fontFamily: body, wordBreak: 'break-word' }}>{p.content}</p>
                {p.image_url && (
                  <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden' }}>
                    <img src={p.image_url} alt="post" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(11,37,69,0.05)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: body }}>{'\uD83D\uDC4D'} {p.likes_count || 0}</span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: body }}>{'\uD83D\uDCAC'} {p.comments_count || 0}</span>
                  <button onClick={function () { navigate('/citizen/community'); }} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: C.gold, border: 'none', background: 'none', cursor: 'pointer', fontFamily: body }}>Join Discussion {'\u2192'}</button>
                </div>
              </div>
            );
          })}
          <button onClick={function () { navigate('/citizen/community'); }} className="cv-card" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid ' + C.light, background: '#fff', fontSize: 13, fontWeight: 600, color: C.navy, cursor: 'pointer', fontFamily: body, textAlign: 'center' }}>
            View all discussions {'\u2192'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(245,241,236,0.25)', borderRadius: 16 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto 10px' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="rgba(11,37,69,0.15)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(11,37,69,0.2)', margin: '0 0 4px', fontFamily: body }}>No discussions yet</p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.15)', margin: 0, fontFamily: body }}>Be the first to start a civic conversation</p>
        </div>
      )}
    </div>
  );
}

/* ======== REVEAL WRAPPER ======== */
function Reveal({ children, delay, direction }) {
  var [ref, visible] = useReveal(0.1);
  var dir = direction || 'up';
  var tx = dir === 'left' ? '-40px' : dir === 'right' ? '40px' : '0';
  var ty = dir === 'up' ? '40px' : dir === 'down' ? '-40px' : '0';
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate(0,0)' : 'translate(' + tx + ',' + ty + ')',
      transition: 'opacity 0.7s cubic-bezier(.4,0,.2,1) ' + (delay || 0) + 'ms, transform 0.7s cubic-bezier(.4,0,.2,1) ' + (delay || 0) + 'ms',
    }}>{children}</div>
  );
}

/* ======== MAIN LANDING ======== */
export default function Landing() {
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;
  var profile = auth.profile;
  var notif = useNotifications(supabase, user ? user.id : null);
  var [surveys, setSurveys] = useState([]);
  var [loading, setLoading] = useState(true);
  var [userCount, setUserCount] = useState(0);
  var [totalResponses, setTotalResponses] = useState(0);
  var [orgCount, setOrgCount] = useState(0);
  var [surveyCount, setSurveyCount] = useState(0);
  var [scrolled, setScrolled] = useState(false);

  useEffect(function () {
    supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(6)
      .then(function (r) { setSurveys(r.data || []); setLoading(false); });
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'citizen')
      .then(function (r) { setUserCount(r.count || 0); });
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'org')
      .then(function (r) { setOrgCount(r.count || 0); });
    supabase.from('responses').select('*', { count: 'exact', head: true })
      .then(function (r) { setTotalResponses(r.count || 0); })
      .catch(function () { setTotalResponses(0); });
    supabase.from('surveys').select('*', { count: 'exact', head: true })
      .then(function (r) { setSurveyCount(r.count || 0); });

    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return function () { window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: body, overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ============ NAVBAR ============ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(11,37,69,0.06)' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }} onClick={function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" style={{ flexShrink: 0 }}>
              <rect width="38" height="38" rx="10" fill={C.gold} />
              <text x="19" y="24.5" textAnchor="middle" fill="#fff" fontFamily="'Playfair Display', Georgia, serif" fontSize="18" fontWeight="700">CV</text>
              <path d="M28 10 L30 12 L26 16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 19, fontWeight: 700, color: scrolled ? C.navy : '#fff', fontFamily: heading, transition: 'color 0.3s', letterSpacing: '-0.01em' }}>
                Civic<span style={{ color: C.gold }}>Verify</span>
              </span>
            </div>
          </div>
          <div style={{ display: 'none', alignItems: 'center', gap: 28 }} className="cv-nav-links">
            {['How It Works', 'Live Polls', 'Community', 'For Organizations'].map(function (item) {
              var id = item.toLowerCase().replace(/ /g, '-');
              return <button key={id} onClick={function () { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: scrolled ? 'rgba(11,37,69,0.5)' : 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: body, transition: 'color 0.3s', padding: 0 }}>{item}</button>;
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {user ? (
              <>
                <NotificationBell notifications={notif.notifications} unreadCount={notif.unreadCount} markAllRead={notif.markAllRead} theme={scrolled ? 'light' : 'dark'} />
                <button onClick={function () { navigate(profile && profile.role === 'admin' ? '/admin' : profile && profile.role === 'org' ? '/org' : '/citizen'); }} style={{ padding: '10px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: body, boxShadow: '0 2px 12px rgba(197,150,12,0.25)' }}>Dashboard</button>
              </>
            ) : (
              <>
                <button onClick={function () { navigate('/login'); }} style={{ padding: '10px 18px', background: 'transparent', border: 'none', fontSize: 13, fontWeight: 600, color: scrolled ? 'rgba(11,37,69,0.5)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: body, transition: 'color 0.3s' }}>Sign In</button>
                <button onClick={function () { navigate('/signup'); }} style={{ padding: '10px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: body, boxShadow: '0 2px 12px rgba(197,150,12,0.25)' }}>Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section style={{ background: 'linear-gradient(160deg, #091e38 0%, #0B2545 40%, #12325a 100%)', position: 'relative', overflow: 'hidden', paddingTop: 80 }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,150,12,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,150,12,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.02, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 28px 100px', position: 'relative', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 64 }} className="cv-hero-flex">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Reveal>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.12)' }}>
                    <span className="cv-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399', fontFamily: body }}>{surveys.length} live poll{surveys.length !== 1 ? 's' : ''}</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="rgba(255,255,255,0.45)" strokeWidth="2"/></svg>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', fontFamily: body }}>{userCount} verified citizen{userCount !== 1 ? 's' : ''}</span>
                  </span>
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 style={{ fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 800, color: '#fff', lineHeight: 1.08, margin: '0 0 28px', fontFamily: heading, letterSpacing: '-0.02em' }}>
                  Your Voice,{' '}
                  <span style={{ color: C.gold, position: 'relative', display: 'inline-block' }}>
                    Verified
                    <svg viewBox="0 0 200 12" style={{ position: 'absolute', bottom: -6, left: 0, width: '100%', height: 12 }}>
                      <path d="M2 8 Q50 2 100 6 Q150 10 198 4" stroke={C.gold} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 44px', maxWidth: 500, fontFamily: body }}>
                  The civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact on policy.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 60 }}>
                  <button onClick={function () { navigate('/signup'); }} className="cv-btn-gold" style={{ padding: '16px 32px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: body, boxShadow: '0 8px 32px rgba(197,150,12,0.3)', transition: 'all 0.3s' }}>
                    Get Started Free <span style={{ marginLeft: 6 }}>{'\u2192'}</span>
                  </button>
                  <button onClick={function () { var el = document.getElementById('live-polls'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: body, transition: 'all 0.3s' }}>
                    View Live Polls <span style={{ marginLeft: 6 }}>{'\u2193'}</span>
                  </button>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div style={{ display: 'flex', gap: 36, paddingTop: 36, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                  {[
                    { t: 'Identity Verified' },
                    { t: 'Real Citizens Only' },
                    { t: 'End-to-End Encrypted' },
                  ].map(function (x, i) {
                    var trustIcons = [
                      <svg key="t0" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/></svg>,
                      <svg key="t1" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/></svg>,
                      <svg key="t2" width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/></svg>,
                    ];
                    return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{trustIcons[i]}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)', fontFamily: body, letterSpacing: '0.02em' }}>{x.t}</span></div>;
                  })}
                </div>
              </Reveal>
            </div>

            <div style={{ width: 380, flexShrink: 0 }} className="cv-hero-right">
              <Reveal delay={300} direction="right">
                <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="cv-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: body }}>Live Platform Activity</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.03)' }}>
                    {[
                      { v: userCount, l: 'Citizens', c: C.gold },
                      { v: surveys.length, l: 'Live Polls', c: '#34d399' },
                      { v: totalResponses, l: 'Total Votes', c: '#60a5fa' },
                      { v: surveyCount, l: 'Surveys Created', c: '#c084fc' },
                    ].map(function (s, i) {
                      return (
                        <div key={i} style={{ padding: '20px 22px', background: 'rgba(11,37,69,0.25)' }}>
                          <p style={{ fontSize: 28, fontWeight: 700, color: s.c, margin: '0 0 2px', fontFamily: heading }}>
                            <AnimatedNumber value={s.v} duration={1800} />
                          </p>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: body }}>{s.l}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '16px 22px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 12px', fontFamily: body }}>Recent Activity</p>
                    {surveys.length > 0 ? surveys.slice(0, 3).map(function (s, i) {
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: [C.gold + '20', '#34d39920', '#60a5fa20'][i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d={['M9 12l2 2 4-4M3 3h18v18H3z','M18 20V10M12 20V4M6 20v-6','M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2'][i%3]} stroke={[C.gold,'#34d399','#60a5fa'][i%3]} strokeWidth="2" strokeLinecap="round"/></svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: body }}>{s.title}</p>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0', fontFamily: body }}>{s.response_count || 0} votes {'\u00b7'} Active now</p>
                          </div>
                        </div>
                      );
                    }) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', margin: 0, textAlign: 'center', padding: '12px 0', fontFamily: body }}>Launching soon</p>}
                  </div>
                  <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(197,150,12,0.04)' }}>
                    <button onClick={function () { navigate('/signup'); }} style={{ width: '100%', padding: 10, background: 'transparent', border: '1px solid ' + C.gold + '40', borderRadius: 10, fontSize: 12, fontWeight: 600, color: C.gold, cursor: 'pointer', fontFamily: body, transition: 'all 0.3s' }}>Join the Movement {'\u2192'}</button>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 80 }}>
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" fill="#fff" />
        </svg>
      </section>

      {/* ============ WHY THIS MATTERS ============ */}
      <section style={{ padding: '60px 0 80px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 28px', boxSizing: 'border-box' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 14px', fontFamily: body }}>Why This Matters</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.navy, margin: '0 0 16px', fontFamily: heading, lineHeight: 1.2 }}>Traditional Polls Are Broken</h2>
              <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, margin: 0, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto', fontFamily: body }}>When was the last time someone asked your opinion on a policy change? For most people, the answer is never.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
            <Reveal delay={100}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid rgba(184,53,46,0.1)', height: '100%' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.red + '0c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={C.red} strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: heading }}>The Problem</h3>
                {['Bots & fake accounts manipulate results', 'Tiny sample sizes miss real communities', 'No way to verify if respondents are citizens', 'Results twisted for political agendas'].map(function (t, i) {
                  return <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}><span style={{ color: C.red, fontSize: 12, marginTop: 3, flexShrink: 0 }}>{'\u2022'}</span><p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.6, fontFamily: body }}>{t}</p></div>;
                })}
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '2px solid ' + C.gold + '20', height: '100%' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.green + '0c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: heading }}>CivicVerify</h3>
                {[
                  { t: 'One Person, One Verified Vote', d: 'Identity verification stops manipulation' },
                  { t: 'Community-Targeted Polls', d: 'Your local issues get local voices' },
                  { t: 'Transparent Results', d: 'Auditable \u2014 what citizens say is what decision-makers see' },
                  { t: 'Civic Responsibility', d: 'Shape policy between election cycles' },
                ].map(function (item, i) {
                  return <div key={i} style={{ marginBottom: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ color: C.green, fontSize: 13, marginTop: 2, flexShrink: 0 }}>{'\u2713'}</span><div><p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0, fontFamily: body }}>{item.t}</p><p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '2px 0 0', lineHeight: 1.4, fontFamily: body }}>{item.d}</p></div></div>;
                })}
              </div>
            </Reveal>
          </div>

          <Reveal delay={300}>
            <div style={{ background: 'linear-gradient(135deg, #0B2545, #132d52)', borderRadius: 16, padding: '32px 36px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: heading, lineHeight: 1.4, fontStyle: 'italic' }}>"The strength of democracy depends on the participation of its citizens."</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px', fontFamily: body }}>Make your verified voice count.</p>
              <button onClick={function () { navigate('/signup'); }} style={{ padding: '12px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: body, boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>Join CivicVerify {'\u2192'}</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" style={{ padding: '80px 0', background: C.cream + '60' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', boxSizing: 'border-box' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, fontFamily: body }}>How It Works</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.navy, margin: '12px 0 0', fontFamily: heading }}>Three Steps to Civic Impact</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { s: '01', t: 'Sign Up & Verify', d: 'Create your account and verify your identity with a quick ID scan. One-time, completely private.', color: '#60a5fa' },
              { s: '02', t: 'Vote on Live Polls', d: 'Vote directly on civic polls matched to your community. Discuss issues with fellow verified citizens.', color: '#34d399' },
              { s: '03', t: 'See Real Impact', d: "Watch live results, see your community's voice, and track how opinions shape real decisions.", color: '#c084fc' },
            ].map(function (item, i) {
              var stepIcons = [
                <svg key="s0" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#60a5fa" strokeWidth="2"/><path d="M22 21v-2a4 4 0 00-3-3.87" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/></svg>,
                <svg key="s1" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="18" height="18" rx="3" stroke="#34d399" strokeWidth="2"/></svg>,
                <svg key="s2" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/></svg>,
              ];
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="cv-card" style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 32, border: '1px solid ' + C.light, height: '100%', transition: 'all 0.35s' }}>
                    <span style={{ position: 'absolute', top: 16, right: 20, fontSize: 52, fontWeight: 900, color: 'rgba(11,37,69,0.025)', fontFamily: heading, lineHeight: 1 }}>{item.s}</span>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: item.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: '1px solid ' + item.color + '15' }}>{stepIcons[i]}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 10px', fontFamily: heading }}>{item.t}</h3>
                    <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.7, fontFamily: body }}>{item.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ LIVE POLLS ============ */}
      <section id="live-polls" style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', boxSizing: 'border-box' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, fontFamily: body }}>Vote Now</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.navy, margin: '12px 0 8px', fontFamily: heading }}>Live Civic Polls</h2>
              <p style={{ fontSize: 15, color: C.muted, margin: 0, fontFamily: body }}>Vote, comment, and share {'\u2014'} right here, right now</p>
            </div>
          </Reveal>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="cv-spinner" /></div>
          ) : surveys.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {surveys.map(function (s, i) { return <Reveal key={s.id} delay={i * 80}><LiveSurveyCard survey={s} user={profile} /></Reveal>; })}
            </div>
          ) : (
            <Reveal>
              <div style={{ background: C.cream + '50', borderRadius: 20, padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: C.goldGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="3" width="18" height="18" rx="3" stroke={C.gold} strokeWidth="2" /></svg>
                </div>
                <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(11,37,69,0.2)', margin: '0 0 8px', fontFamily: heading }}>No active polls right now</p>
                <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.15)', margin: '0 0 24px', fontFamily: body }}>Check back soon or sign up to get notified</p>
                <button onClick={function () { navigate('/signup'); }} style={{ padding: '12px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: body }}>Sign Up</button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ============ COMMUNITY DISCUSSIONS ============ */}
      <section id="community" style={{ padding: '80px 0', background: C.cream + '40' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 28px', boxSizing: 'border-box' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, fontFamily: body }}>Community Forum</span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.navy, margin: '12px 0 8px', fontFamily: heading }}>Civic Discussions</h2>
              <p style={{ fontSize: 15, color: C.muted, margin: 0, fontFamily: body }}>Share perspectives and engage with fellow citizens. Best posts rise to the top.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <CommunityDiscussions user={profile} />
          </Reveal>
        </div>
      </section>

      {/* ============ FOR ORGANIZATIONS ============ */}
      <section id="for-organizations" style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 60 }} className="cv-org-flex">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Reveal direction="left">
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, fontFamily: body }}>For Organizations</span>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.navy, margin: '14px 0 18px', fontFamily: heading, lineHeight: 1.2 }}>Reach Verified Citizens. <br />Get Trusted Data.</h2>
                <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, margin: '0 0 32px', fontFamily: body }}>Whether you're a government agency, nonprofit, or research institution {'\u2014'} CivicVerify gives you access to identity-verified respondents with demographic targeting.</p>
                {[
                  { t: 'Targeted Surveys', d: 'Reach citizens by age, location, and demographics' },
                  { t: 'Real-Time Analytics', d: 'Watch responses come in with live dashboards' },
                  { t: 'Verified Respondents', d: 'Every response from an identity-verified citizen' },
                  { t: 'Export & Report', d: 'Download data in CSV/PDF for analysis' },
                ].map(function (item, i) {
                  var orgIcons = [
                    <svg key="o0" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke={C.gold} strokeWidth="2" opacity="0.5"/><circle cx="12" cy="12" r="2" fill={C.gold}/></svg>,
                    <svg key="o1" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/></svg>,
                    <svg key="o2" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={C.gold} strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    <svg key="o3" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.gold} strokeWidth="2"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/></svg>,
                  ];
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: C.goldGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{orgIcons[i]}</div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: 0, fontFamily: body }}>{item.t}</p>
                        <p style={{ fontSize: 13, color: C.muted, margin: '2px 0 0', fontFamily: body }}>{item.d}</p>
                      </div>
                    </div>
                  );
                })}
                <button onClick={function () { navigate('/signup'); }} style={{ marginTop: 12, padding: '14px 28px', background: C.navy, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: body, boxShadow: '0 4px 20px rgba(11,37,69,0.15)' }}>Register Your Organization {'\u2192'}</button>
              </Reveal>
            </div>
            <div style={{ width: 420, flexShrink: 0 }} className="cv-org-right">
              <Reveal delay={200} direction="right">
                <div style={{ background: 'linear-gradient(135deg, #0B2545, #152f55)', borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,150,12,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px', fontFamily: body }}>Organization Dashboard Preview</p>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: body }}>Survey Responses</span>
                      <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, fontFamily: body }}>+12% this week</span>
                    </div>
                    <div style={{ height: 48, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                      {[30, 45, 35, 60, 55, 75, 65, 80, 70, 90, 85, 95].map(function (h, i) {
                        return <div key={i} style={{ flex: 1, height: h + '%', background: 'linear-gradient(to top, ' + C.gold + '40, ' + C.gold + ')', borderRadius: 3, opacity: 0.5 + (i / 24) }} />;
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: C.gold, margin: 0, fontFamily: heading }}>100%</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', fontFamily: body }}>Verified Rate</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#34d399', margin: 0, fontFamily: heading }}>&lt;30s</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', fontFamily: body }}>Avg Response Time</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ REAL STATS BAR ============ */}
      <section style={{ padding: '64px 0', background: 'linear-gradient(135deg, #091e38, #0B2545, #132d52)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 32, textAlign: 'center', boxSizing: 'border-box' }}>
          {[
            { v: userCount, l: 'Verified Citizens', suffix: '' },
            { v: orgCount, l: 'Organizations', suffix: '' },
            { v: totalResponses, l: 'Total Votes Cast', suffix: '' },
            { v: surveyCount, l: 'Surveys Created', suffix: '' },
          ].map(function (s, i) {
            return (
              <Reveal key={i} delay={i * 100}>
                <div>
                  <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.gold, margin: '0 0 6px', fontFamily: heading }}>
                    <AnimatedNumber value={s.v} duration={2000} suffix={s.suffix} />
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, margin: 0, fontFamily: body }}>{s.l}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section style={{ padding: '100px 0', background: '#fff' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 28px', textAlign: 'center', boxSizing: 'border-box' }}>
          <Reveal>
            <div style={{ width: 68, height: 68, borderRadius: 18, background: C.goldGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '1px solid ' + C.gold + '20' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="2" opacity="0.3" />
              </svg>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: C.navy, margin: '0 0 16px', fontFamily: heading }}>Ready to Make Your Voice Count?</h2>
            <p style={{ fontSize: 16, color: C.muted, margin: '0 0 36px', lineHeight: 1.7, fontFamily: body }}>Join a growing community of verified citizens shaping the future of civic engagement.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
              <button onClick={function () { navigate('/signup'); }} className="cv-btn-gold" style={{ padding: '16px 36px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: body, boxShadow: '0 8px 32px rgba(197,150,12,0.25)' }}>Create Free Account {'\u2192'}</button>
              <button onClick={function () { navigate('/login'); }} style={{ padding: '16px 36px', background: 'rgba(11,37,69,0.04)', color: C.muted, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: body }}>Sign In</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid ' + C.light, background: C.cream + '50' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 28px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <svg width="32" height="32" viewBox="0 0 38 38" fill="none" style={{ flexShrink: 0 }}>
                  <rect width="38" height="38" rx="10" fill={C.gold} />
                  <text x="19" y="24.5" textAnchor="middle" fill="#fff" fontFamily="'Playfair Display', Georgia, serif" fontSize="18" fontWeight="700">CV</text>
                </svg>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: heading }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', lineHeight: 1.6, margin: 0, fontFamily: body }}>The trusted platform for verified civic engagement. Every voice matters when it's real.</p>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.2)', margin: '0 0 14px', fontFamily: body }}>Platform</p>
                {[{ t: 'Sign Up', a: '/signup' }, { t: 'Sign In', a: '/login' }, { t: 'Live Polls', a: '#live-polls' }, { t: 'Discussions', a: '#community' }].map(function (link) {
                  return <button key={link.t} onClick={function () { if (link.a.startsWith('#')) { var el = document.getElementById(link.a.slice(1)); if (el) el.scrollIntoView({ behavior: 'smooth' }); } else navigate(link.a); }} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.4)', cursor: 'pointer', fontFamily: body }}>{link.t}</button>;
                })}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.2)', margin: '0 0 14px', fontFamily: body }}>Company</p>
                {[{ t: 'About', a: '/about' }, { t: 'Privacy', a: '/privacy' }, { t: 'Terms', a: '/terms' }, { t: 'Contact', a: '/contact' }].map(function (link) {
                  return <button key={link.t} onClick={function () { navigate(link.a); }} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.4)', cursor: 'pointer', fontFamily: body, textAlign: 'left' }}>{link.t}</button>;
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid ' + C.light, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.2)', margin: 0, fontFamily: body }}>{'\u00A9'} {new Date().getFullYear()} CivicVerify. All rights reserved.</p>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.2)', margin: 0, fontFamily: body }}>Built with trust in mind.</p>
          </div>
        </div>
      </footer>

      {/* ============ GLOBAL STYLES ============ */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes spin { to { transform:rotate(360deg) } }
        * { box-sizing:border-box; margin:0; }

        html, body, #root {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          width: 100% !important;
        }
        img, video, iframe, svg, table { max-width: 100% !important; }

        .cv-pulse { animation: pulse 2s ease-in-out infinite; }

        .cv-spinner {
          width: 36px; height: 36px; border: 3px solid ${C.gold}25;
          border-top-color: ${C.gold}; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin: 0 auto;
        }

        .cv-card:hover {
          box-shadow: 0 12px 40px rgba(11,37,69,0.06);
          transform: translateY(-2px);
        }

        .cv-btn-gold:hover {
          box-shadow: 0 12px 40px rgba(197,150,12,0.35) !important;
          transform: translateY(-1px);
        }

        .cv-btn-subtle:hover { background: rgba(11,37,69,0.02) !important; }

        .cv-hero-right { display: none; }
        .cv-nav-links { display: none !important; }
        .cv-org-right { display: none; }
        .cv-org-flex { flex-direction: column; }
        .cv-hero-flex { flex-direction: column; }

        @media (min-width: 960px) {
          .cv-hero-right { display: block !important; }
          .cv-hero-flex { flex-direction: row !important; }
          .cv-nav-links { display: flex !important; }
          .cv-org-right { display: block !important; }
          .cv-org-flex { flex-direction: row !important; }
        }

        @media (max-width: 768px) {
          section > div {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        @media (max-width: 420px) {
          section > div {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }

        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

