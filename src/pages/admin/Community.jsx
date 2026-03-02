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
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('posts');
  var [comments, setComments] = useState([]);
  var [expandedPost, setExpandedPost] = useState(null);
  var [search, setSearch] = useState('');

  useEffect(function() { fetchPosts(); }, []);

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

  async function deletePost(id) {
    if (!window.confirm('Delete this post and all its comments? This cannot be undone.')) return;
    // Delete comments first
    await supabase.from('community_post_comments').delete().eq('post_id', id);
    await supabase.from('community_post_reactions').delete().eq('post_id', id);
    await supabase.from('community_post_likes').delete().eq('post_id', id);
    await supabase.from('community_posts').delete().eq('id', id);
    fetchPosts();
  }

  async function loadComments(postId) {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    var { data } = await supabase
      .from('community_post_comments')
      .select('id, content, created_at, image_url, users:user_id(full_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setExpandedPost(postId);
  }

  async function deleteComment(commentId, postId) {
    if (!window.confirm('Delete this comment?')) return;
    await supabase.from('community_post_comments').delete().eq('id', commentId);
    // Decrement count
    var post = posts.find(function(p) { return p.id === postId; });
    if (post) {
      await supabase.from('community_posts').update({ comments_count: Math.max(0, (post.comments_count || 1) - 1) }).eq('id', postId);
    }
    loadComments(postId);
    fetchPosts();
  }

  var filtered = posts.filter(function(p) {
    if (!search) return true;
    var s = search.toLowerCase();
    return (p.content || '').toLowerCase().includes(s) || (p.users?.full_name || '').toLowerCase().includes(s);
  });

  var totalPosts = posts.length;
  var totalLikes = posts.reduce(function(a, p) { return a + (p.likes_count || 0); }, 0);
  var totalComments = posts.reduce(function(a, p) { return a + (p.comments_count || 0); }, 0);

  return (
    <div style={{ fontFamily: T.sans, maxWidth: 920 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Community</h1>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Moderate posts, comments, and activity</p>
        </div>
        <button onClick={fetchPosts} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(11,37,69,0.1)', background: '#fff', fontSize: 12, fontWeight: 600, color: C.navy, cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Posts', val: totalPosts, icon: '📝', color: C.navy },
          { label: 'Total Likes', val: totalLikes, icon: '👍', color: C.gold },
          { label: 'Total Comments', val: totalComments, icon: '💬', color: C.green },
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

      {/* Search */}
      <input value={search} onChange={function(e) { setSearch(e.target.value); }}
        placeholder="Search posts or users..."
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.08)', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />

      {/* Posts list */}
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
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,' + C.navy + ',' + C.navy + 'cc)', border: '2px solid rgba(197,150,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.goldL }}>
                    {initials(post.users?.full_name)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{post.users?.full_name || 'Citizen'}</span>
                      {post.users?.identity_verified && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: 'rgba(197,150,12,0.1)', padding: '2px 6px', borderRadius: 6 }}>VERIFIED</span>
                      )}
                      <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(post.created_at)}</span>
                      {post.survey_tag && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>#{post.survey_tag}</span>
                      )}
                    </div>

                    <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.55, margin: '0 0 8px', wordBreak: 'break-word' }}>{post.content}</p>

                    {post.image_url && (
                      <img src={post.image_url} alt="" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, marginBottom: 8, display: 'block' }} />
                    )}

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(11,37,69,0.35)', alignItems: 'center' }}>
                      <span>👍 {post.likes_count || 0}</span>
                      <span>👎 {post.dislikes_count || 0}</span>
                      <span style={{ cursor: 'pointer', color: expandedPost === post.id ? C.gold : 'rgba(11,37,69,0.35)', fontWeight: expandedPost === post.id ? 700 : 400 }}
                        onClick={function() { loadComments(post.id); }}>
                        💬 {post.comments_count || 0} {expandedPost === post.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={function() { deletePost(post.id); }}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 12, fontWeight: 600, color: C.red, cursor: 'pointer', flexShrink: 0 }}>
                    🗑️ Delete
                  </button>
                </div>

                {/* Expanded comments */}
                {expandedPost === post.id && (
                  <div style={{ borderTop: '1px solid rgba(11,37,69,0.06)', padding: '12px 20px 16px', background: 'rgba(11,37,69,0.015)' }}>
                    {comments.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', fontStyle: 'italic' }}>No comments</p>
                    ) : comments.map(function(c) {
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: C.goldL, flexShrink: 0 }}>
                            {initials(c.users?.full_name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{c.users?.full_name || 'Citizen'}</span>
                              <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.25)' }}>{timeAgo(c.created_at)}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.65)', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                            {c.image_url && <img src={c.image_url} alt="" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, marginTop: 4 }} />}
                          </div>
                          <button onClick={function() { deleteComment(c.id, post.id); }}
                            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(220,38,38,0.06)', fontSize: 10, fontWeight: 600, color: C.red, cursor: 'pointer', flexShrink: 0 }}>
                            ✕
                          </button>
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
    </div>
  );
}
