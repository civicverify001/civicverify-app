// src/pages/public/Landing.jsx — Full Landing with Why This Matters + Community Discussions
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

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
  var text = '"' + title + '" on CivicVerify - Your Voice, Verified';
  var [copied, setCopied] = useState(false);
  var copy = function() { navigator.clipboard.writeText(url); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); };
  var links = [
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
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: 0 }}>Share</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#999' }}>{'\u2715'}</button>
        </div>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>{title}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
          {links.map(function(l, i) {
            return (
              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, textDecoration: 'none' }}>
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
    if (!resp.data) return;
    var counts = {};
    (question.options || []).forEach(function(o) { counts[o] = 0; });
    resp.data.forEach(function(r) {
      var a = r.answers ? r.answers[question.id] : null;
      if (a) { if (Array.isArray(a)) { a.forEach(function(v) { counts[v] = (counts[v] || 0) + 1; }); } else { counts[a] = (counts[a] || 0) + 1; } }
    });
    setResults({ counts: counts, total: Object.values(counts).reduce(function(a, b) { return a + b; }, 0) });
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

  useEffect(function() { if (existingAnswer) loadResults(); }, [existingAnswer]);

  var showResults = selected || existingAnswer;
  var options = question.options || [];

  if (question.type === 'rating') {
    return (
      <div style={{ margin: '16px 0' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 12px' }}>{question.text}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[1,2,3,4,5].map(function(n) { return <button key={n} onClick={function(){vote(n)}} disabled={!!selected} style={{ width: 48, height: 48, borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: selected ? 'default' : 'pointer', background: selected === n ? C.gold : 'rgba(11,37,69,0.04)', color: selected === n ? '#fff' : 'rgba(11,37,69,0.3)', transform: selected === n ? 'scale(1.1)' : 'none', transition: 'all 0.2s' }}>{n}</button>; })}
        </div>
      </div>
    );
  }
  if (question.type === 'text') { return <div style={{ margin: '16px 0' }}><p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)', fontStyle: 'italic' }}>Sign in to respond</p></div>; }

  return (
    <div style={{ margin: '16px 0' }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 14px', lineHeight: 1.4 }}>{question.text} {question.required ? <span style={{ color: C.red }}>*</span> : null}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map(function(opt, i) {
          var count = results && results.counts ? (results.counts[opt] || 0) : 0;
          var pct = results && results.total > 0 ? Math.round((count / results.total) * 100) : 0;
          var isSelected = selected === opt || existingAnswer === opt;
          return (
            <button key={i} onClick={function(){vote(opt)}} disabled={!!selected || voting}
              style={{ position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: 12, border: '2px solid ' + (isSelected ? C.gold : 'rgba(11,37,69,0.07)'), background: isSelected ? C.gold + '08' : '#fff', cursor: selected ? 'default' : 'pointer', transition: 'all 0.2s', zIndex: 1 }}>
              {showResults ? <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: pct + '%', background: isSelected ? C.gold + '18' : 'rgba(11,37,69,0.04)', borderRadius: 10, transition: 'width 0.8s ease-out', zIndex: -1 }} /> : null}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!showResults ? <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (isSelected ? C.gold : 'rgba(11,37,69,0.15)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{isSelected ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold }} /> : null}</span> : isSelected ? <span style={{ fontSize: 14, color: C.gold }}>{'\u2713'}</span> : null}
                  <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.navy : 'rgba(11,37,69,0.6)' }}>{opt}</span>
                </div>
                {showResults ? <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? C.gold : 'rgba(11,37,69,0.25)', minWidth: 44, textAlign: 'right' }}>{pct}%</span> : null}
              </div>
            </button>
          );
        })}
        {showResults ? <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0', textAlign: 'right' }}>{(results ? results.total : 0)} total votes</p> : null}
      </div>
    </div>
  );
}

/* ======== COMMENT ITEM ======== */
function CommentItem({ comment, user, onVote }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(11,37,69,0.1), rgba(11,37,69,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(11,37,69,0.35)', flexShrink: 0 }}>
        {(comment.user_name || 'A').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{comment.user_name || 'Anonymous'}</span>
          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)' }}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.55)', margin: '6px 0 0', lineHeight: 1.6 }}>{comment.content}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={function(){onVote(comment.id, 'like')}} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: comment.userVote === 'like' ? C.green : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'like' ? 600 : 400 }}>
            {'\uD83D\uDC4D'} {comment.likes || 0}
          </button>
          <button onClick={function(){onVote(comment.id, 'dislike')}} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: comment.userVote === 'dislike' ? C.red : 'rgba(11,37,69,0.2)', fontWeight: comment.userVote === 'dislike' ? 600 : 400 }}>
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
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id).then(function(r) { setCommentCount(r.count || 0); });
    if (user && user.id) {
      supabase.from('responses').select('answers').eq('survey_id', survey.id).eq('user_id', user.id).limit(1).then(function(r) {
        if (r.data && r.data.length > 0) { var q = (survey.questions || [])[0]; if (q) setExistingAnswer(r.data[0].answers ? r.data[0].answers[q.id] : null); }
      });
    }
  }, [survey.id, user]);

  async function loadComments() {
    var res = await supabase.from('comments').select('*, users(full_name)').eq('survey_id', survey.id).order('created_at', { ascending: false }).limit(30);
    var list = (res.data || []).map(function(c) { return Object.assign({}, c, { user_name: c.users ? c.users.full_name : null }); });
    if (user && user.id) {
      var vr = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id);
      var vm = {}; (vr.data || []).forEach(function(v) { vm[v.comment_id] = v.vote_type; });
      list = list.map(function(c) { return Object.assign({}, c, { userVote: vm[c.id] || null }); });
    }
    // Sort by net likes (likes - dislikes) descending
    list.sort(function(a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); });
    setComments(list);
  }

  function toggleComments() { if (!showComments) loadComments(); setShowComments(!showComments); }

  async function postComment() {
    if (!newComment.trim() || !user) return;
    setPosting(true);
    var res = await supabase.from('comments').insert({ survey_id: survey.id, user_id: user.id, content: newComment.trim() }).select('*, users(full_name)').single();
    if (!res.error && res.data) { setComments([Object.assign({}, res.data, { user_name: res.data.users ? res.data.users.full_name : null, userVote: null })].concat(comments)); setCommentCount(function(c) { return c + 1; }); setNewComment(''); }
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
      setComments(function(prev) { return prev.map(function(x) { if (x.id !== commentId) return x; var o = Object.assign({}, x, { userVote: null }); o[type + 's'] = Math.max((x[type + 's'] || 1) - 1, 0); return o; }).sort(function(a, b) { return ((b.likes||0)-(b.dislikes||0))-((a.likes||0)-(a.dislikes||0)); }); });
    } else {
      await supabase.from('comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote_type: type }, { onConflict: 'comment_id,user_id' });
      var updates = {}; updates[type + 's'] = (c[type + 's'] || 0) + 1;
      if (existing) updates[existing + 's'] = Math.max((c[existing + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(updates).eq('id', commentId);
      setComments(function(prev) { return prev.map(function(x) { if (x.id !== commentId) return x; return Object.assign({}, x, updates, { userVote: type }); }).sort(function(a, b) { return ((b.likes||0)-(b.dislikes||0))-((a.likes||0)-(a.dislikes||0)); }); });
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
              {extraQs > 0 ? <button onClick={function(){navigate(user ? '/citizen/surveys/' + survey.id : '/login')}} style={{ width: '100%', padding: 10, background: C.gold + '08', border: '1px dashed ' + C.gold + '40', borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.gold, cursor: 'pointer', marginTop: 8 }}>+ {extraQs} more question{extraQs !== 1 ? 's' : ''} — Full Survey</button> : null}
            </>
          ) : <button onClick={function(){navigate(user ? '/citizen/surveys/' + survey.id : '/login')}} style={{ width: '100%', padding: 12, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{user ? 'Take Survey' : 'Sign In to Vote'}</button>}
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(11,37,69,0.05)' }}>
          <button onClick={toggleComments} style={{ flex: 1, padding: 14, fontSize: 12, fontWeight: 600, color: showComments ? C.gold : 'rgba(11,37,69,0.3)', border: 'none', background: showComments ? C.gold + '06' : 'transparent', cursor: 'pointer', borderRight: '1px solid rgba(11,37,69,0.05)' }}>{'\uD83D\uDCAC'} {commentCount} Comment{commentCount !== 1 ? 's' : ''}</button>
          <button onClick={function(){setShareModal(true)}} style={{ flex: 1, padding: 14, fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.3)', border: 'none', background: 'transparent', cursor: 'pointer' }}>{'\uD83D\uDD17'} Share</button>
        </div>
        {showComments ? (
          <div style={{ borderTop: '1px solid rgba(11,37,69,0.05)', padding: '20px 24px', background: 'rgba(245,241,236,0.25)' }}>
            {user ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.gold, flexShrink: 0 }}>{(user.full_name || 'U').charAt(0).toUpperCase()}</div>
                <input value={newComment} onChange={function(e){setNewComment(e.target.value)}} placeholder="Share your thoughts..." onKeyDown={function(e){if(e.key==='Enter')postComment()}} style={{ flex: 1, padding: '10px 16px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 12, outline: 'none', color: C.navy, background: '#fff' }} />
                <button onClick={postComment} disabled={!newComment.trim() || posting} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: C.gold, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!newComment.trim() || posting) ? 0.3 : 1, whiteSpace: 'nowrap' }}>{posting ? '...' : 'Post'}</button>
              </div>
            ) : <button onClick={function(){navigate('/login')}} style={{ width: '100%', padding: 12, borderRadius: 12, border: '2px dashed rgba(11,37,69,0.1)', background: 'transparent', fontSize: 13, color: 'rgba(11,37,69,0.3)', cursor: 'pointer', marginBottom: 12 }}>{'\uD83D\uDD12'} Sign in to comment</button>}
            <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.15)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Sorted by most liked</p>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {comments.length > 0 ? comments.map(function(c) { return <CommentItem key={c.id} comment={c} user={user} onVote={handleVote} />; }) : (
                <div style={{ padding: '32px 0', textAlign: 'center' }}><span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{'\uD83D\uDCAC'}</span><p style={{ fontSize: 13, color: 'rgba(11,37,69,0.2)', margin: 0 }}>No comments yet - be the first!</p></div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {shareModal ? <ShareModal title={survey.title} surveyId={survey.id} onClose={function(){setShareModal(false)}} /> : null}
    </>
  );
}

/* ======== COMMUNITY DISCUSSIONS ======== */
function CommunityDiscussions({ user }) {
  var navigate = useNavigate();
  var [discussions, setDiscussions] = useState([]);
  var [newTopic, setNewTopic] = useState('');
  var [posting, setPosting] = useState(false);
  var [replyTo, setReplyTo] = useState(null);
  var [replyText, setReplyText] = useState('');
  var [replyPosting, setReplyPosting] = useState(false);
  var [loading, setLoading] = useState(true);

  async function loadDiscussions() {
    // Load top-level discussion comments (no survey_id)
    var res = await supabase.from('comments').select('*, users(full_name)').is('survey_id', null).is('parent_id', null).order('created_at', { ascending: false }).limit(20);
    var list = (res.data || []).map(function(c) { return Object.assign({}, c, { user_name: c.users ? c.users.full_name : null, replies: [], showReplies: false }); });

    // Load user votes
    if (user && user.id) {
      var allIds = list.map(function(c) { return c.id; });
      if (allIds.length > 0) {
        var vr = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id).in('comment_id', allIds);
        var vm = {}; (vr.data || []).forEach(function(v) { vm[v.comment_id] = v.vote_type; });
        list = list.map(function(c) { return Object.assign({}, c, { userVote: vm[c.id] || null }); });
      }
    }

    // Sort by net likes
    list.sort(function(a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); });
    setDiscussions(list);
    setLoading(false);
  }

  useEffect(function() { loadDiscussions(); }, [user]);

  async function postTopic() {
    if (!newTopic.trim() || !user) return;
    setPosting(true);
    var res = await supabase.from('comments').insert({ user_id: user.id, content: newTopic.trim(), survey_id: null, parent_id: null }).select('*, users(full_name)').single();
    if (!res.error && res.data) {
      setDiscussions([Object.assign({}, res.data, { user_name: res.data.users ? res.data.users.full_name : null, userVote: null, replies: [], showReplies: false })].concat(discussions));
      setNewTopic('');
    }
    setPosting(false);
  }

  async function postReply(parentId) {
    if (!replyText.trim() || !user) return;
    setReplyPosting(true);
    var res = await supabase.from('comments').insert({ user_id: user.id, content: replyText.trim(), survey_id: null, parent_id: parentId }).select('*, users(full_name)').single();
    if (!res.error && res.data) {
      setDiscussions(function(prev) {
        return prev.map(function(d) {
          if (d.id !== parentId) return d;
          return Object.assign({}, d, { replies: d.replies.concat([Object.assign({}, res.data, { user_name: res.data.users ? res.data.users.full_name : null, userVote: null })]), showReplies: true });
        });
      });
      setReplyText(''); setReplyTo(null);
    }
    setReplyPosting(false);
  }

  async function loadReplies(parentId) {
    var res = await supabase.from('comments').select('*, users(full_name)').eq('parent_id', parentId).order('created_at', { ascending: true });
    var list = (res.data || []).map(function(c) { return Object.assign({}, c, { user_name: c.users ? c.users.full_name : null }); });
    if (user && user.id) {
      var ids = list.map(function(c) { return c.id; });
      if (ids.length > 0) {
        var vr = await supabase.from('comment_votes').select('comment_id, vote_type').eq('user_id', user.id).in('comment_id', ids);
        var vm = {}; (vr.data || []).forEach(function(v) { vm[v.comment_id] = v.vote_type; });
        list = list.map(function(c) { return Object.assign({}, c, { userVote: vm[c.id] || null }); });
      }
    }
    list.sort(function(a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); });
    setDiscussions(function(prev) { return prev.map(function(d) { if (d.id !== parentId) return d; return Object.assign({}, d, { replies: list, showReplies: true }); }); });
  }

  async function handleVote(commentId, type, isReply, parentId) {
    if (!user) { navigate('/login'); return; }

    function updateList(list) {
      return list.map(function(x) {
        if (x.id !== commentId) return x;
        var ex = x.userVote;
        var o = Object.assign({}, x);
        if (ex === type) { o[type + 's'] = Math.max((x[type + 's'] || 1) - 1, 0); o.userVote = null; }
        else { o[type + 's'] = (x[type + 's'] || 0) + 1; if (ex) o[ex + 's'] = Math.max((x[ex + 's'] || 1) - 1, 0); o.userVote = type; }
        return o;
      }).sort(function(a, b) { return ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)); });
    }

    var c = null;
    if (isReply && parentId) {
      var parent = discussions.find(function(d) { return d.id === parentId; });
      if (parent) c = parent.replies.find(function(x) { return x.id === commentId; });
    } else {
      c = discussions.find(function(x) { return x.id === commentId; });
    }
    if (!c) return;
    var existing = c.userVote;

    if (existing === type) {
      await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      var upd = {}; upd[type + 's'] = Math.max((c[type + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(upd).eq('id', commentId);
    } else {
      await supabase.from('comment_votes').upsert({ comment_id: commentId, user_id: user.id, vote_type: type }, { onConflict: 'comment_id,user_id' });
      var updates = {}; updates[type + 's'] = (c[type + 's'] || 0) + 1;
      if (existing) updates[existing + 's'] = Math.max((c[existing + 's'] || 1) - 1, 0);
      await supabase.from('comments').update(updates).eq('id', commentId);
    }

    if (isReply && parentId) {
      setDiscussions(function(prev) { return prev.map(function(d) { if (d.id !== parentId) return d; return Object.assign({}, d, { replies: updateList(d.replies) }); }); });
    } else {
      setDiscussions(function(prev) { return updateList(prev); });
    }
  }

  return (
    <div>
      {/* Post new topic */}
      {user ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: C.gold, flexShrink: 0 }}>{(user.full_name || 'U').charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <textarea value={newTopic} onChange={function(e){setNewTopic(e.target.value)}} placeholder="Start a discussion... What civic issue is on your mind?" rows={3}
                style={{ width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 12, outline: 'none', color: C.navy, background: '#fff', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button onClick={postTopic} disabled={!newTopic.trim() || posting}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!newTopic.trim() || posting) ? 0.3 : 1 }}>
                  {posting ? 'Posting...' : 'Start Discussion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={function(){navigate('/login')}} style={{ width: '100%', padding: 20, borderRadius: 16, border: '2px dashed rgba(11,37,69,0.1)', background: 'transparent', fontSize: 15, color: 'rgba(11,37,69,0.3)', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {'\uD83D\uDD12'} Sign in to start or join discussions
        </button>
      )}

      {/* Discussion list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>
      ) : discussions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {discussions.map(function(d) {
            var netScore = (d.likes || 0) - (d.dislikes || 0);
            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', transition: 'box-shadow 0.3s' }}>
                <div style={{ display: 'flex', gap: 16, padding: 20 }}>
                  {/* Vote column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 44 }}>
                    <button onClick={function(){handleVote(d.id, 'like', false)}} style={{ width: 36, height: 32, borderRadius: 8, border: 'none', background: d.userVote === 'like' ? C.green + '15' : 'transparent', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>{'\u25B2'}</button>
                    <span style={{ fontSize: 16, fontWeight: 700, color: netScore > 0 ? C.green : netScore < 0 ? C.red : 'rgba(11,37,69,0.25)', padding: '2px 0' }}>{netScore}</span>
                    <button onClick={function(){handleVote(d.id, 'dislike', false)}} style={{ width: 36, height: 32, borderRadius: 8, border: 'none', background: d.userVote === 'dislike' ? C.red + '15' : 'transparent', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>{'\u25BC'}</button>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(11,37,69,0.1), rgba(11,37,69,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.35)' }}>{(d.user_name || 'A').charAt(0).toUpperCase()}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{d.user_name || 'Anonymous'}</span>
                      <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)' }}>{timeAgo(d.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.7)', margin: 0, lineHeight: 1.65 }}>{d.content}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                      <button onClick={function() { if (d.showReplies) { setDiscussions(function(prev) { return prev.map(function(x) { if (x.id !== d.id) return x; return Object.assign({}, x, { showReplies: false }); }); }); } else { loadReplies(d.id); } }}
                        style={{ fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.25)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {'\uD83D\uDCAC'} {d.showReplies ? 'Hide' : 'View'} Replies
                      </button>
                      <button onClick={function() { setReplyTo(replyTo === d.id ? null : d.id); setReplyText(''); }}
                        style={{ fontSize: 12, fontWeight: 600, color: C.gold, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0' }}>
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reply input */}
                {replyTo === d.id && user ? (
                  <div style={{ padding: '0 20px 16px 76px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={replyText} onChange={function(e){setReplyText(e.target.value)}} placeholder="Write a reply..." onKeyDown={function(e){if(e.key==='Enter')postReply(d.id)}}
                        style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, outline: 'none', color: C.navy, background: '#fff' }} />
                      <button onClick={function(){postReply(d.id)}} disabled={!replyText.trim() || replyPosting}
                        style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: C.gold, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: (!replyText.trim() || replyPosting) ? 0.3 : 1, whiteSpace: 'nowrap' }}>
                        {replyPosting ? '...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Replies */}
                {d.showReplies && d.replies.length > 0 ? (
                  <div style={{ borderTop: '1px solid rgba(11,37,69,0.04)', padding: '12px 20px 12px 76px', background: 'rgba(245,241,236,0.2)' }}>
                    {d.replies.map(function(r) {
                      return (
                        <div key={r.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(11,37,69,0.03)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(11,37,69,0.08), rgba(11,37,69,0.03))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.3)', flexShrink: 0 }}>{(r.user_name || 'A').charAt(0).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{r.user_name || 'Anonymous'}</span>
                              <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.2)' }}>{timeAgo(r.created_at)}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '4px 0 0', lineHeight: 1.5 }}>{r.content}</p>
                            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                              <button onClick={function(){handleVote(r.id, 'like', true, d.id)}} style={{ fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', color: r.userVote === 'like' ? C.green : 'rgba(11,37,69,0.2)', fontWeight: r.userVote === 'like' ? 600 : 400, display: 'flex', alignItems: 'center', gap: 3 }}>{'\uD83D\uDC4D'} {r.likes || 0}</button>
                              <button onClick={function(){handleVote(r.id, 'dislike', true, d.id)}} style={{ fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', color: r.userVote === 'dislike' ? C.red : 'rgba(11,37,69,0.2)', fontWeight: r.userVote === 'dislike' ? 600 : 400, display: 'flex', alignItems: 'center', gap: 3 }}>{'\uD83D\uDC4E'} {r.dislikes || 0}</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(245,241,236,0.3)', borderRadius: 16 }}>
          <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>{'\uD83D\uDDE3\uFE0F'}</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(11,37,69,0.25)', margin: '0 0 4px' }}>No discussions yet</p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.18)', margin: 0 }}>Be the first to start a civic conversation!</p>
        </div>
      )}
    </div>
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
  var [userCount, setUserCount] = useState(0);
  var [totalResponses, setTotalResponses] = useState(0);
  var [totalResponses, setTotalResponses] = useState(0);

  useEffect(function() {
    supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(6)
      .then(function(r) { setSurveys(r.data || []); setLoading(false); });
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'citizen')
      .then(function(r) { setUserCount(r.count || 0); });
    supabase.from('responses').select('*', { count: 'exact', head: true })
      .then(function(r) { setTotalResponses(r.count || 0); });
    supabase.from('responses').select('*', { count: 'exact', head: true })
      .then(function(r) { setTotalResponses(r.count || 0); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(11,37,69,0.05)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>CV</span></div>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <button onClick={function(){navigate(profile && profile.role === 'admin' ? '/admin' : profile && profile.role === 'org' ? '/org' : '/citizen')}} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Dashboard</button>
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
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 24px 90px', position: 'relative', display: 'flex', alignItems: 'center', gap: 60 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{surveys.length} live poll{surveys.length !== 1 ? 's' : ''} running now</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 24, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 32, marginLeft: 10 }}>
              <span style={{ fontSize: 12 }}>{'\uD83D\uDEE1\uFE0F'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{userCount} verified citizen{userCount !== 1 ? 's' : ''}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, margin: '0 0 24px', fontFamily: font, letterSpacing: '-0.02em' }}>
              Your Voice, <span style={{ color: C.gold, position: 'relative', display: 'inline-block' }}>Verified<span style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 4, background: C.gold + '40', borderRadius: 2 }} /></span>
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 480 }}>The first civic polling platform where every response is identity-verified. Real citizens, real opinions, real impact.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 56 }}>
              <button onClick={function(){navigate('/signup')}} style={{ padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(197,150,12,0.25)' }}>Get Started Free {'\u2192'}</button>
              <button onClick={function(){document.getElementById('live-polls').scrollIntoView({ behavior: 'smooth' })}} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>View Live Polls {'\u2193'}</button>
            </div>
            <div style={{ display: 'flex', gap: 32, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
              {[{i:'\uD83D\uDEE1\uFE0F',t:'Identity Verified'},{i:'\uD83D\uDC65',t:'Real Citizens Only'},{i:'\uD83D\uDCCA',t:'Transparent Results'}].map(function(x,i){ return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 16 }}>{x.i}</span><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>{x.t}</span></div>; })}
            </div>
          </div>

          {/* Right side — Live Platform Activity */}
          <div style={{ width: 360, flexShrink: 0, display: 'none' }} className="hero-right">
            <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Live Platform Activity</span>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ padding: '20px 22px', background: 'rgba(11,37,69,0.3)' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: C.gold, margin: '0 0 2px', fontFamily: font }}>{userCount}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Citizens</p>
                </div>
                <div style={{ padding: '20px 22px', background: 'rgba(11,37,69,0.3)' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#34d399', margin: '0 0 2px', fontFamily: font }}>{surveys.length}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Live Polls</p>
                </div>
                <div style={{ padding: '20px 22px', background: 'rgba(11,37,69,0.3)' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#60a5fa', margin: '0 0 2px', fontFamily: font }}>{totalResponses}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total Votes</p>
                </div>
                <div style={{ padding: '20px 22px', background: 'rgba(11,37,69,0.3)' }}>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#c084fc', margin: '0 0 2px', fontFamily: font }}>100%</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Verified</p>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div style={{ padding: '16px 22px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 12px' }}>Recent Activity</p>
                {surveys.length > 0 ? surveys.slice(0, 3).map(function(s, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: [C.gold + '20', '#34d39920', '#60a5fa20'][i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {['\uD83D\uDDF3\uFE0F', '\uD83D\uDCCA', '\uD83D\uDC65'][i % 3]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0' }}>{s.response_count || 0} votes · Active now</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '12px 0', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', margin: 0 }}>Platform launching soon</p>
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(197,150,12,0.06)' }}>
                <button onClick={function(){navigate('/signup')}} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid ' + C.gold + '40', borderRadius: 10, fontSize: 12, fontWeight: 600, color: C.gold, cursor: 'pointer' }}>Join the Movement {'\u2192'}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY THIS MATTERS */}
      <Section bg="rgba(245,241,236,0.3)">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>Why This Matters</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: '0 0 16px', fontFamily: font, lineHeight: 1.2 }}>Democracy Only Works When Real People Are Heard</h2>
            <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.45)', lineHeight: 1.7, margin: 0 }}>Traditional polls are broken. It's time for verified civic engagement.</p>
          </div>

          {/* The Problem */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.red + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{'\u274C'}</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 12px', fontFamily: font }}>The Problem With Traditional Polls</h3>
                <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 16px', lineHeight: 1.7 }}>Think about it: <strong style={{ color: C.navy }}>when was the last time someone actually reached out to you</strong> to ask your opinion on a policy change, a new law, or how your tax dollars should be spent?</p>
                <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 16px', lineHeight: 1.7 }}>For most people, the answer is <strong style={{ color: C.red }}>never</strong>. Traditional polling systems are fundamentally broken:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Only a tiny fraction of the population gets surveyed',
                    'Polls can be manipulated by bots, fake accounts, and repeat voters',
                    'Results get twisted to serve political agendas, not people',
                    'Your neighborhood, your community, your voice — completely ignored',
                    'No way to verify if respondents are even real citizens'
                  ].map(function(text, i) {
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ color: C.red, fontSize: 14, marginTop: 2, flexShrink: 0 }}>{'\u2022'}</span>
                        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.6 }}>{text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '2px solid ' + C.gold + '20', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.green + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{'\u2705'}</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 12px', fontFamily: font }}>CivicVerify Changes Everything</h3>
                <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.5)', margin: '0 0 16px', lineHeight: 1.7 }}>We believe <strong style={{ color: C.navy }}>every citizen deserves a verified voice</strong> in the decisions that affect their lives. CivicVerify ensures that:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { title: 'One Person, One Verified Vote', desc: 'Identity verification ensures no bots, no fakes, no manipulation. Every response is from a real, verified citizen.' },
                    { title: 'Your Community, Your Polls', desc: 'Targeted by demographics and geography so your local issues get local voices — not distant opinions.' },
                    { title: 'Transparent & Tamper-Proof', desc: 'Results are public, auditable, and cannot be twisted. What citizens say is what decision-makers see.' },
                    { title: 'It\'s Your Civic Responsibility', desc: 'Just like voting in elections, participating in verified polls is how modern citizens shape policy between election cycles.' }
                  ].map(function(item, i) {
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ color: C.green, fontSize: 14, marginTop: 3, flexShrink: 0 }}>{'\u2713'}</span>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>{item.title}</p>
                          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Call to action quote */}
          <div style={{ background: 'linear-gradient(135deg, #0B2545, #132d52)', borderRadius: 16, padding: '32px 36px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: font, lineHeight: 1.4 }}>"The strength of democracy depends on the participation of its citizens."</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>Make your verified voice count — because no one else will do it for you.</p>
            <button onClick={function(){navigate('/signup')}} style={{ padding: '12px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>Join CivicVerify Today {'\u2192'}</button>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>How It Works</p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Three Steps to Civic Impact</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            {s:'01',i:'\uD83D\uDCF1',t:'Sign Up & Verify',d:'Create an account and verify your identity. One-time process, completely private and secure.'},
            {s:'02',i:'\uD83D\uDDF3\uFE0F',t:'Vote on Live Polls',d:'Vote directly on civic polls, discuss issues with fellow citizens, and share to amplify verified voices.'},
            {s:'03',i:'\uD83D\uDCC8',t:'See Real Impact',d:'Watch live results, see your community\'s voice, and track how verified opinions shape real decisions.'}
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
      <section id="live-polls" style={{ padding: '80px 0', background: 'rgba(245,241,236,0.15)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>Vote Now</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Live Civic Polls</h2>
            <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Vote, comment, and share - right here, right now</p>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}><div style={{ width: 40, height: 40, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
          ) : surveys.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
              {surveys.map(function(s) { return <LiveSurveyCard key={s.id} survey={s} user={profile} />; })}
            </div>
          ) : (
            <div style={{ background: 'rgba(245,241,236,0.5)', borderRadius: 20, padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: C.gold + '08', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>{'\uD83D\uDDF3\uFE0F'}</div>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(11,37,69,0.25)', margin: '0 0 8px' }}>No active polls right now</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.18)', margin: '0 0 24px' }}>Check back soon or sign up to get notified</p>
              <button onClick={function(){navigate('/signup')}} style={{ padding: '12px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sign Up</button>
            </div>
          )}
        </div>
      </section>

      {/* COMMUNITY DISCUSSIONS */}
      <section id="discussions" style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: C.gold, margin: '0 0 12px' }}>Community Forum</p>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Civic Discussions</h2>
            <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Discuss issues, share perspectives, and engage with fellow citizens. Most-liked posts rise to the top.</p>
          </div>
          <CommunityDiscussions user={profile} />
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '64px 0', background: 'linear-gradient(135deg, #0B2545, #132d52)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          {[{v:'100%',l:'Verified Responses'},{v:'50+',l:'Partner Organizations'},{v:'10K+',l:'Citizens Engaged'},{v:'99.9%',l:'Platform Uptime'}].map(function(s,i){ return <div key={i}><p style={{ fontSize: 36, fontWeight: 700, color: C.gold, margin: '0 0 8px' }}>{s.v}</p><p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>{s.l}</p></div>; })}
        </div>
      </section>

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
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>CV</span></div>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', lineHeight: 1.6, margin: 0 }}>The trusted platform for verified civic engagement. Every voice matters.</p>
            </div>
            <div style={{ display: 'flex', gap: 48 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.2)', margin: '0 0 12px' }}>Platform</p>
                <button onClick={function(){navigate('/signup')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Sign Up</button>
                <button onClick={function(){navigate('/login')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Sign In</button>
                <button onClick={function(){document.getElementById('discussions').scrollIntoView({behavior:'smooth'})}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Discussions</button>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(11,37,69,0.2)', margin: '0 0 12px' }}>Company</p>
                <button onClick={function(){navigate('/about')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>About</button>
                <button onClick={function(){navigate('/privacy')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Privacy</button>
                <button onClick={function(){navigate('/terms')}} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', cursor: 'pointer' }}>Terms</button>
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
        @media (min-width: 900px) { .hero-right { display: block !important; } }\
      '}</style>
    </div>
  );
}
