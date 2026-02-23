// src/pages/citizen/Discussion.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 36 }) {
  var initials = (name || 'A').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  var colors = ['#0B2545', '#C5960C', '#22863A', '#6366f1', '#B8352E', '#0891b2'];
  var col = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: col + '18', border: '2px solid ' + col + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.36, fontWeight: 700, color: col }}>
      {initials}
    </div>
  );
}

function CommentCard({ comment, onReply, onLike, currentUserId, depth = 0 }) {
  var [showReplies, setShowReplies] = useState(true);
  var [replyOpen, setReplyOpen] = useState(false);
  var [replyText, setReplyText] = useState('');
  var liked = (comment.likes || []).includes(currentUserId);
  var isOwn = comment.user_id === currentUserId;

  function submitReply() {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 44 : 0 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
        <Avatar name={comment.author_name} size={depth > 0 ? 30 : 36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', borderRadius: depth > 0 ? 12 : 14, border: '1px solid rgba(11,37,69,0.06)', padding: '12px 16px', marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{comment.author_name || 'Citizen'}</span>
                {comment.verified && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: C.green, background: C.green + '12', padding: '2px 6px', borderRadius: 4 }}>&#10003; Verified</span>}
                {isOwn && <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(11,37,69,0.25)' }}>you</span>}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', flexShrink: 0, marginLeft: 12 }}>{timeAgo(comment.created_at)}</span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.75)', margin: 0, lineHeight: 1.6, wordBreak: 'break-word' }}>{comment.content}</p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 16, paddingLeft: 4 }}>
            <button onClick={function() { onLike(comment.id, liked); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: liked ? C.gold : 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {liked ? '\u2665' : '\u2661'} {(comment.likes || []).length || ''}
            </button>
            {depth < 2 && (
              <button onClick={function() { setReplyOpen(!replyOpen); }} style={{ fontSize: 12, fontWeight: 600, color: replyOpen ? C.navy : 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Reply
              </button>
            )}
            {(comment.replies || []).length > 0 && (
              <button onClick={function() { setShowReplies(!showReplies); }} style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {showReplies ? 'Hide' : 'Show'} {(comment.replies || []).length} {(comment.replies || []).length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyOpen && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <textarea value={replyText} onChange={function(e) { setReplyText(e.target.value); }} placeholder="Write a reply..." rows={2}
                style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                onKeyDown={function(e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitReply(); }} />
              <button onClick={submitReply} disabled={!replyText.trim()} style={{ padding: '0 16px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: replyText.trim() ? 'pointer' : 'not-allowed', opacity: replyText.trim() ? 1 : 0.5, alignSelf: 'flex-end', height: 40 }}>Reply</button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && (comment.replies || []).map(function(reply) {
        return <CommentCard key={reply.id} comment={reply} onReply={onReply} onLike={onLike} currentUserId={currentUserId} depth={depth + 1} />;
      })}
    </div>
  );
}

function TopicCard({ topic, onClick, commentCount }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '18px 22px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={function(e) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,37,69,0.08)'; }}
      onMouseLeave={function(e) { e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: C.gold + '12', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{topic.category || 'General'}</span>
            {topic.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: C.navy, background: 'rgba(11,37,69,0.06)', padding: '2px 8px', borderRadius: 6 }}>&#128204; Pinned</span>}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font, lineHeight: 1.3 }}>{topic.title}</h3>
          {topic.description && <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 10px', lineHeight: 1.5 }}>{topic.description}</p>}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>&#128172; {commentCount} comments</span>
            <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>&#128100; {topic.author_name || 'Citizen'}</span>
            <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(topic.created_at)}</span>
          </div>
        </div>
        <span style={{ fontSize: 20, color: 'rgba(11,37,69,0.12)', flexShrink: 0 }}>&#8594;</span>
      </div>
    </div>
  );
}

export default function Discussion() {
  var navigate = useNavigate();
  var { user, profile } = useAuth();

  var [view, setView] = useState('list'); // 'list' | 'thread'
  var [topics, setTopics] = useState([]);
  var [activeTopic, setActiveTopic] = useState(null);
  var [comments, setComments] = useState([]);
  var [newTopic, setNewTopic] = useState({ title: '', description: '', category: 'General' });
  var [newComment, setNewComment] = useState('');
  var [showNewTopic, setShowNewTopic] = useState(false);
  var [loading, setLoading] = useState(true);
  var [posting, setPosting] = useState(false);
  var [search, setSearch] = useState('');
  var [category, setCategory] = useState('All');
  var commentRef = useRef(null);

  var CATEGORIES = ['All', 'General', 'Policy', 'Local Issues', 'Economy', 'Healthcare', 'Education', 'Environment'];

  useEffect(function() { loadTopics(); }, []);
  useEffect(function() { if (activeTopic) loadComments(activeTopic.id); }, [activeTopic]);

  async function loadTopics() {
    setLoading(true);
    var r = await supabase.from('discussion_topics').select('*, comment_count:discussion_comments(count)').order('pinned', { ascending: false }).order('created_at', { ascending: false });
    if (!r.error) setTopics(r.data || []);
    setLoading(false);
  }

  async function loadComments(topicId) {
    var r = await supabase.from('discussion_comments').select('*').eq('topic_id', topicId).is('parent_id', null).order('created_at', { ascending: true });
    if (r.error) return;
    var parentComments = r.data || [];

    // Load replies for each comment
    var withReplies = await Promise.all(parentComments.map(async function(c) {
      var rr = await supabase.from('discussion_comments').select('*').eq('parent_id', c.id).order('created_at', { ascending: true });
      return Object.assign({}, c, { replies: rr.data || [] });
    }));
    setComments(withReplies);
  }

  async function createTopic() {
    if (!newTopic.title.trim()) return;
    setPosting(true);
    var r = await supabase.from('discussion_topics').insert({
      title: newTopic.title.trim(),
      description: newTopic.description.trim() || null,
      category: newTopic.category,
      user_id: user.id,
      author_name: profile ? (profile.full_name || 'Citizen') : 'Citizen',
    });
    if (!r.error) {
      setNewTopic({ title: '', description: '', category: 'General' });
      setShowNewTopic(false);
      loadTopics();
    }
    setPosting(false);
  }

  async function openTopic(topic) {
    setActiveTopic(topic);
    setView('thread');
    window.scrollTo(0, 0);
  }

  async function postComment() {
    if (!newComment.trim() || !activeTopic) return;
    setPosting(true);
    var r = await supabase.from('discussion_comments').insert({
      topic_id: activeTopic.id,
      user_id: user.id,
      author_name: profile ? (profile.full_name || 'Citizen') : 'Citizen',
      verified: !!(profile && profile.identity_verified),
      content: newComment.trim(),
      likes: [],
      parent_id: null,
    });
    if (!r.error) { setNewComment(''); loadComments(activeTopic.id); }
    setPosting(false);
  }

  async function postReply(parentId, content) {
    if (!content.trim() || !activeTopic) return;
    await supabase.from('discussion_comments').insert({
      topic_id: activeTopic.id,
      parent_id: parentId,
      user_id: user.id,
      author_name: profile ? (profile.full_name || 'Citizen') : 'Citizen',
      verified: !!(profile && profile.identity_verified),
      content: content.trim(),
      likes: [],
    });
    loadComments(activeTopic.id);
  }

  async function toggleLike(commentId, isLiked) {
    if (!user) return;
    var comment = findComment(comments, commentId);
    if (!comment) return;
    var likes = comment.likes || [];
    var updated = isLiked ? likes.filter(function(id) { return id !== user.id; }) : likes.concat([user.id]);
    await supabase.from('discussion_comments').update({ likes: updated }).eq('id', commentId);
    loadComments(activeTopic.id);
  }

  function findComment(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
      if (list[i].replies) { var f = findComment(list[i].replies, id); if (f) return f; }
    }
    return null;
  }

  var filteredTopics = topics.filter(function(t) {
    if (category !== 'All' && t.category !== category) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Thread view
  if (view === 'thread' && activeTopic) return (
    <div style={{ maxWidth: 660, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <button onClick={function() { setView('list'); setActiveTopic(null); setComments([]); }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(11,37,69,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>&#8592; Back to Discussion</button>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '24px 28px', marginBottom: 24 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: C.gold + '12', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-block', marginBottom: 10 }}>{activeTopic.category}</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font, lineHeight: 1.3 }}>{activeTopic.title}</h1>
        {activeTopic.description && <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: '0 0 12px', lineHeight: 1.6 }}>{activeTopic.description}</p>}
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>&#128100; {activeTopic.author_name}</span>
          <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(activeTopic.created_at)}</span>
          <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>&#128172; {comments.length} comments</span>
        </div>
      </div>

      {/* Comments */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {comments.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)', margin: 0 }}>Be the first to comment on this topic.</p>
            </div>
          : comments.map(function(c) { return <CommentCard key={c.id} comment={c} onReply={postReply} onLike={toggleLike} currentUserId={user?.id} />; })
        }
      </div>

      {/* New comment box */}
      <div ref={commentRef} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 24px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 12px' }}>Add your comment</p>
        <textarea value={newComment} onChange={function(e) { setNewComment(e.target.value); }} placeholder="Share your thoughts..." rows={3}
          style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
          onFocus={function(e) { e.target.style.borderColor = C.gold; }} onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
          onKeyDown={function(e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment(); }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)' }}>Ctrl+Enter to submit</span>
          <button onClick={postComment} disabled={!newComment.trim() || posting} style={{ padding: '10px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: newComment.trim() ? 'pointer' : 'not-allowed', opacity: newComment.trim() ? 1 : 0.5 }}>
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── List view
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Discussion</h1>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Civic conversations with your verified community</p>
        </div>
        <button onClick={function() { setShowNewTopic(!showNewTopic); }} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + New Topic
        </button>
      </div>

      {/* New topic form */}
      {showNewTopic && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '22px 26px', marginBottom: 24, boxShadow: '0 4px 20px rgba(11,37,69,0.06)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>Start a new discussion</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Topic Title *</label>
              <input value={newTopic.title} onChange={function(e) { setNewTopic(function(p) { return Object.assign({}, p, { title: e.target.value }); }); }} placeholder="What do you want to discuss?" style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Description</label>
              <textarea value={newTopic.description} onChange={function(e) { setNewTopic(function(p) { return Object.assign({}, p, { description: e.target.value }); }); }} placeholder="Add more context (optional)..." rows={2} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Category</label>
              <select value={newTopic.category} onChange={function(e) { setNewTopic(function(p) { return Object.assign({}, p, { category: e.target.value }); }); }} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}>
                {CATEGORIES.filter(function(c) { return c !== 'All'; }).map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={function() { setShowNewTopic(false); }} style={{ padding: '10px 20px', background: 'rgba(11,37,69,0.04)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={createTopic} disabled={!newTopic.title.trim() || posting} style={{ flex: 1, padding: '10px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: newTopic.title.trim() ? 'pointer' : 'not-allowed', opacity: newTopic.title.trim() ? 1 : 0.5 }}>
              {posting ? 'Creating...' : 'Create Topic'}
            </button>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>&#128269;</span>
          <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search discussions..." style={{ width: '100%', padding: '10px 14px 10px 34px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(function(cat) {
            return (
              <button key={cat} onClick={function() { setCategory(cat); }} style={{ padding: '8px 14px', background: category === cat ? C.navy : '#fff', color: category === cat ? '#fff' : 'rgba(11,37,69,0.4)', border: '1px solid ' + (category === cat ? C.navy : 'rgba(11,37,69,0.08)'), borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '60px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>&#128172;</span>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 6px' }}>No discussions yet</p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: '0 0 20px' }}>Be the first to start a civic conversation</p>
          <button onClick={function() { setShowNewTopic(true); }} style={{ padding: '10px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Start a Topic</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredTopics.map(function(topic) {
            var count = Array.isArray(topic.comment_count) ? (topic.comment_count[0]?.count || 0) : (topic.comment_count || 0);
            return <TopicCard key={topic.id} topic={topic} commentCount={count} onClick={function() { openTopic(topic); }} />;
          })}
        </div>
      )}
    </div>
  );
}
