import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const C = { navy: '#0B2545', gold: '#C5960C', goldL: '#F0B429', green: '#16a34a', red: '#dc2626' };
const T = { serif: "'Libre Baskerville', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif" };

function timeAgo(ts) {
  var s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function initials(n) { return (n || '?').split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2); }

export default function AdminCommunity() {
  var [posts, setPosts] = useState([]);
  var [polls, setPolls] = useState([]);
  var [loading, setLoading] = useState(true);
  var [pollsLoading, setPollsLoading] = useState(false);
  var [tab, setTab] = useState('posts');
  var [comments, setComments] = useState([]);
  var [expandedPost, setExpandedPost] = useState(null);
  var [search, setSearch] = useState('');

  useEffect(function() { fetchPosts(); }, []);
  useEffect(function() { if (tab === 'polls' && polls.length === 0) fetchPolls(); }, [tab]);

  async function fetchPosts() {
    setLoading(true);
    var { data } = await supabase
      .from('community_posts')
      .select('id, content, created_at, likes_count, dislikes_count, comments_count, image_url, survey_tag, users:user_id(full_name, identity_verified)')
      .order('created_at', { ascending: false })
      .limit(100);
    setPosts(data || []);
    setLoading(false);
  }

  async function fetchPolls() {
    setPollsLoading(true);
    try {
      var { data: pollData } = await supabase
        .from('community_polls')
        .select('id, question, options, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!pollData?.length) { setPolls([]); setPollsLoading(false); return; }

      var userIds = [...new Set(pollData.map(function(p) { return p.user_id; }).filter(Boolean))];
      var userMap = {};
      if (userIds.length) {
        var { data: userData } = await supabase.from('users').select('id, full_name, identity_verified').in('id', userIds);
        (userData || []).forEach(function(u) { userMap[u.id] = u; });
      }

      var pollIds = pollData.map(function(p) { return p.id; });
      var { data: allVotes } = await supabase.from('community_poll_votes').select('poll_id, option_index').in('poll_id', pollIds);

      var shaped = pollData.map(function(p) {
        var pvotes = (allVotes || []).filter(function(v) { return v.poll_id === p.id; });
        var voteCounts = (p.options || []).map(function(_, i) { return pvotes.filter(function(v) { return v.option_index === i; }).length; });
        var totalVotes = voteCounts.reduce(function(a, b) { return a + b; }, 0);
        return {
          id: p.id, question: p.question, options: p.options, created_at: p.created_at, user_id: p.user_id,
          author_name: userMap[p.user_id]?.full_name || 'Unknown',
          author_verified: userMap[p.user_id]?.identity_verified || false,
          vote_counts: voteCounts, total_votes: totalVotes,
        };
      });
      setPolls(shaped);
    } catch (e) { console.warn('fetchPolls error:', e); setPolls([]); }
    setPollsLoading(false);
  }

  async function deletePost(id) {
    if (!window.confirm('Delete this post and all its comments? This cannot be undone.')) return;
    await supabase.from('community_post_comments').delete().eq('post_id', id);
    await supabase.from('community_post_reactions').delete().eq('post_id', id);
    await supabase.from('community_post_likes').delete().eq('post_id', id);
    await supabase.from('community_posts').delete().eq('id', id);
    fetchPosts();
  }

  async function deletePoll(id) {
    if (!window.confirm('Delete this poll and all its votes? This cannot be undone.')) return;
    await supabase.from('community_poll_votes').delete().eq('poll_id', id);
    await supabase.from('community_polls').delete().eq('id', id);
    setPolls(function(prev) { return prev.filter(function(p) { return p.id !== id; }); });
  }

  async function loadComments(postId) {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    var { data } = await supabase.from('community_post_comments').select('id, content, created_at, image_url, users:user_id(full_name)').eq('post_id', postId).order('created_at', { ascending: true });
    setComments(data || []);
    setExpandedPost(postId);
  }

  async function deleteComment(commentId, postId) {
    if (!window.confirm('Delete this comment?')) return;
    await supabase.from('community_post_comments').delete().eq('id', commentId);
    var post = posts.find(function(p) { return p.id === postId; });
    if (post) await supabase.from('community_posts').update({ comments_count: Math.max(0, (post.comments_count || 1) - 1) }).eq('id', postId);
    loadComments(postId);
    fetchPosts();
  }

  var filtered = posts.filter(function(p) {
    if (!search) return true;
    var s = search.toLowerCase();
    return (p.content || '').toLowerCase().includes(s) || (p.users?.full_name || '').toLowerCase().includes(s);
  });

  var filteredPolls = polls.filter(function(p) {
    if (!search) return true;
    var s = search.toLowerCase();
    return (p.question || '').toLowerCase().includes(s) || (p.author_name || '').toLowerCase().includes(s);
  });

  var totalPosts = posts.length;
  var totalLikes = posts.reduce(function(a, p) { return a + (p.likes_count || 0); }, 0);
  var totalComments = posts.reduce(function(a, p) { return a + (p.comments_count || 0); }, 0);
  var totalPolls = polls.length;
  var totalPollVotes = polls.reduce(function(a, p) { return a + (p.total_votes || 0); }, 0);

  return (
    <div style={{ fontFamily: T.sans, maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Community</h1>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Moderate posts, polls, comments, and activity</p>
        </div>
        <button onClick={function() { fetchPosts(); if (tab === 'polls') fetchPolls(); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(11,37,69,0.1)', background: '#fff', fontSize: 12, fontWeight: 600, color: C.navy, cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Posts', val: totalPosts, icon: '📝', color: C.navy },
          { label: 'Total Likes', val: totalLikes, icon: '👍', color: C.gold },
          { label: 'Total Comments', val: totalComments, icon: '💬', color: C.green },
          { label: 'Total Polls', val: totalPolls, icon: '📊', color: '#6366f1' },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 3, background: 'rgba(11,37,69,0.04)', borderRadius: 10 }}>
        {[{ id: 'posts', label: 'Posts', icon: '📝', count: totalPosts }, { id: 'polls', label: 'Polls', icon: '📊', count: totalPolls }].map(function(t) {
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }}
              style={{ flex: 1, padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: T.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? C.navy : 'rgba(11,37,69,0.4)', boxShadow: tab === t.id ? '0 1px 4px rgba(11,37,69,0.08)' : 'none', transition: 'all 0.15s' }}>
              <span>{t.icon}</span> {t.label}
              <span style={{ padding: '1px 7px', borderRadius: 8, background: tab === t.id ? C.gold + '22' : 'rgba(11,37,69,0.06)', color: tab === t.id ? C.gold : 'rgba(11,37,69,0.4)', fontSize: 10, fontWeight: 700 }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <input value={search} onChange={function(e) { setSearch(e.target.value); }}
        placeholder={tab === 'posts' ? "Search posts or users..." : "Search polls or creators..."}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.08)', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />

      {tab === 'posts' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(11,37,69,0.3)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.3)' }}>No community posts yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(function(post) {
                return (
                  <div key={post.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,' + C.navy + ',' + C.navy + 'cc)', border: '2px solid rgba(197,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.goldL }}>{initials(post.users?.full_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{post.users?.full_name || 'Citizen'}</span>
                          {post.users?.identity_verified && <span style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: 'rgba(197,150,12,0.1)', padding: '2px 6px', borderRadius: 6 }}>VERIFIED</span>}
                          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(post.created_at)}</span>
                          {post.survey_tag && <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>#{post.survey_tag}</span>}
                        </div>
                        <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.55, margin: '0 0 8px', wordBreak: 'break-word' }}>{post.content}</p>
                        {post.image_url && <img src={post.image_url} alt="" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, marginBottom: 8, display: 'block' }} />}
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(11,37,69,0.35)', alignItems: 'center' }}>
                          <span>👍 {post.likes_count || 0}</span>
                          <span>👎 {post.dislikes_count || 0}</span>
                          <span style={{ cursor: 'pointer', color: expandedPost === post.id ? C.gold : 'rgba(11,37,69,0.35)', fontWeight: expandedPost === post.id ? 700 : 400 }} onClick={function() { loadComments(post.id); }}>💬 {post.comments_count || 0} {expandedPost === post.id ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      <button onClick={function() { deletePost(post.id); }} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 12, fontWeight: 600, color: C.red, cursor: 'pointer', flexShrink: 0 }}>🗑️ Delete</button>
                    </div>
                    {expandedPost === post.id && (
                      <div style={{ borderTop: '1px solid rgba(11,37,69,0.06)', padding: '12px 20px 16px', background: 'rgba(11,37,69,0.015)' }}>
                        {comments.length === 0 ? <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', fontStyle: 'italic' }}>No comments</p> : comments.map(function(c) {
                          return (
                            <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.goldL, flexShrink: 0 }}>{initials(c.users?.full_name)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{c.users?.full_name || 'Citizen'}</span>
                                  <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.25)' }}>{timeAgo(c.created_at)}</span>
                                </div>
                                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.65)', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                                {c.image_url && <img src={c.image_url} alt="" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, marginTop: 4 }} />}
                              </div>
                              <button onClick={function() { deleteComment(c.id, post.id); }} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 10, fontWeight: 600, color: C.red, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'polls' && (
        <>
          {pollsLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(11,37,69,0.3)' }}>Loading polls...</div>
          ) : filteredPolls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 40, margin: '0 0 8px' }}>📊</p>
              <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.3)', margin: 0 }}>No community polls yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', borderRadius: 10, border: '1px solid rgba(11,37,69,0.06)', fontSize: 12, color: 'rgba(11,37,69,0.4)' }}>
                <span><strong style={{ color: C.navy }}>{filteredPolls.length}</strong> polls</span>
                <span><strong style={{ color: C.gold }}>{totalPollVotes}</strong> total votes</span>
              </div>
              {filteredPolls.map(function(poll) {
                return (
                  <div key={poll.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,' + C.navy + ',' + C.navy + 'cc)', border: '2px solid rgba(197,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.goldL }}>{initials(poll.author_name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{poll.author_name}</span>
                            {poll.author_verified && <span style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: 'rgba(197,150,12,0.1)', padding: '2px 6px', borderRadius: 6 }}>VERIFIED</span>}
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: 6 }}>POLL</span>
                            <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(poll.created_at)}</span>
                          </div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, lineHeight: 1.4 }}>{poll.question}</p>
                        </div>
                        <button onClick={function() { deletePoll(poll.id); }} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 12, fontWeight: 600, color: C.red, cursor: 'pointer', flexShrink: 0 }}>🗑️ Delete</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {(poll.options || []).map(function(opt, i) {
                          var count = poll.vote_counts?.[i] || 0;
                          var pct = poll.total_votes > 0 ? Math.round((count / poll.total_votes) * 100) : 0;
                          return (
                            <div key={i} style={{ position: 'relative', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
                              <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: pct > 0 ? C.gold + '12' : 'transparent', transition: 'width 0.4s' }} />
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13, color: C.navy }}>{opt}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: count > 0 ? C.gold : 'rgba(11,37,69,0.2)' }}>{count} ({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                        <span>🗳️ <strong style={{ color: C.navy }}>{poll.total_votes}</strong> total votes</span>
                        <span>📋 {(poll.options || []).length} options</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(11,37,69,0.2)' }}>ID: {poll.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
