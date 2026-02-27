// src/pages/citizen/UserProfile.jsx — Public user profile with posts, followers, follow button
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/useAuth";

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#1A7A3C', purple: '#6D28D9' };
var font = 'Libre Baskerville, Georgia, serif';

function timeAgo(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function Avatar({ name, size }) {
  size = size || 60;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #122e56 100%)',
      border: '3px solid ' + C.gold + '44',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: size * 0.33, fontWeight: 700, color: C.gold, fontFamily: font,
    }}>
      {initials}
    </div>
  );
}

export default function UserProfile() {
  var { userId } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();

  var [profile, setProfile] = useState(null);
  var [posts, setPosts] = useState([]);
  var [followers, setFollowers] = useState([]);
  var [following, setFollowing] = useState([]);
  var [isFollowing, setIsFollowing] = useState(false);
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('posts');
  var [followBusy, setFollowBusy] = useState(false);
  var [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, debates: 0 });

  var isOwnProfile = user && user.id === userId;

  useEffect(function() {
    if (userId) loadProfile();
  }, [userId]);

  async function loadProfile() {
    setLoading(true);

    // Profile
    var { data: prof } = await supabase.from('users')
      .select('id, full_name, identity_verified, avatar_url, created_at, follower_count, following_count, state, city')
      .eq('id', userId).single();
    setProfile(prof);

    // Posts by this user
    var { data: userPosts } = await supabase.from('community_posts')
      .select('id, content, created_at, likes_count, comments_count, image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    setPosts(userPosts || []);

    // Followers
    var { data: followerRows } = await supabase.from('user_follows')
      .select('follower_id, created_at')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (followerRows && followerRows.length > 0) {
      var fIds = followerRows.map(function(f) { return f.follower_id; });
      var { data: fUsers } = await supabase.from('users').select('id, full_name, identity_verified').in('id', fIds);
      var fMap = {};
      (fUsers || []).forEach(function(u) { fMap[u.id] = u; });
      setFollowers(followerRows.map(function(f) { return Object.assign({}, f, fMap[f.follower_id] || {}); }));
    } else {
      setFollowers([]);
    }

    // Following
    var { data: followingRows } = await supabase.from('user_follows')
      .select('following_id, created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (followingRows && followingRows.length > 0) {
      var gIds = followingRows.map(function(f) { return f.following_id; });
      var { data: gUsers } = await supabase.from('users').select('id, full_name, identity_verified').in('id', gIds);
      var gMap = {};
      (gUsers || []).forEach(function(u) { gMap[u.id] = u; });
      setFollowing(followingRows.map(function(f) { return Object.assign({}, f, gMap[f.following_id] || {}); }));
    } else {
      setFollowing([]);
    }

    // Am I following this user?
    if (user && user.id !== userId) {
      var { data: followCheck } = await supabase.from('user_follows')
        .select('id').eq('follower_id', user.id).eq('following_id', userId).single();
      setIsFollowing(!!followCheck);
    }

    // Debate count
    var { count: debateCount } = await supabase.from('debates')
      .select('id', { count: 'exact', head: true })
      .or('creator_id.eq.' + userId + ',opponent_id.eq.' + userId);

    setStats({
      posts: (userPosts || []).length,
      followers: prof?.follower_count || (followerRows || []).length,
      following: prof?.following_count || (followingRows || []).length,
      debates: debateCount || 0,
    });

    setLoading(false);
  }

  async function toggleFollow() {
    if (!user || followBusy) return;
    setFollowBusy(true);
    if (isFollowing) {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setIsFollowing(false);
      setStats(function(p) { return Object.assign({}, p, { followers: Math.max(0, p.followers - 1) }); });
    } else {
      await supabase.from('user_follows').insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setStats(function(p) { return Object.assign({}, p, { followers: p.followers + 1 }); });
    }
    setFollowBusy(false);
  }

  async function sendMessage() {
    navigate('/citizen/messages/' + userId);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: 80, fontFamily: 'DM Sans, sans-serif' }}>
      <p style={{ fontSize: 48, margin: '0 0 12px' }}>👤</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>User not found</p>
      <button onClick={function() { navigate('/citizen/community'); }}
        style={{ marginTop: 12, padding: '8px 20px', background: C.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Back to Community
      </button>
    </div>
  );

  var joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'}</style>

      {/* Back button */}
      <button onClick={function() { navigate(-1); }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'none', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 20, transition: 'all 0.15s' }}
        onMouseEnter={function(e) { e.currentTarget.style.background = C.cream; }}
        onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; }}
      >
        ← Back
      </button>

      {/* Profile header card */}
      <div style={{
        background: '#fff', borderRadius: 24, border: '1px solid rgba(11,37,69,0.07)',
        boxShadow: '0 4px 24px rgba(11,37,69,0.06)', overflow: 'hidden', marginBottom: 24,
        animation: 'fadeIn 0.4s ease',
      }}>
        {/* Banner */}
        <div style={{ height: 100, background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #1a3a6a 50%, ' + C.gold + '44 100%)' }} />

        <div style={{ padding: '0 24px 24px', marginTop: -40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <Avatar name={profile.full_name} size={80} />
            <div style={{ flex: 1, minWidth: 0, paddingTop: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>{profile.full_name}</h1>
                {profile.identity_verified && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 20,
                    background: C.gold + '18', border: '1px solid ' + C.gold + '44',
                    fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    ✓ Verified Citizen
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                {profile.city && profile.state && (
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)' }}>📍 {profile.city}, {profile.state}</span>
                )}
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>Joined {joinDate}</span>
              </div>
            </div>

            {/* Action buttons */}
            {!isOwnProfile && user && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={toggleFollow} disabled={followBusy}
                  style={{
                    padding: '9px 22px', borderRadius: 14, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
                    background: isFollowing ? 'transparent' : C.navy,
                    color: isFollowing ? C.navy : C.gold,
                    border: isFollowing ? '2px solid ' + C.navy + '22' : '2px solid ' + C.navy,
                  }}>
                  {followBusy ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
                </button>
                <button onClick={sendMessage}
                  style={{
                    padding: '9px 18px', borderRadius: 14, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
                    background: 'rgba(11,37,69,0.04)', color: C.navy, border: '1px solid rgba(11,37,69,0.1)',
                  }}>
                  ✉ Message
                </button>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Posts', val: stats.posts, color: C.navy },
              { label: 'Followers', val: stats.followers, color: C.gold },
              { label: 'Following', val: stats.following, color: C.green },
              { label: 'Debates', val: stats.debates, color: C.purple },
            ].map(function(s) {
              return (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '12px 8px', borderRadius: 12,
                  background: s.color + '08', border: '1px solid ' + s.color + '15',
                }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0, fontFamily: font, lineHeight: 1 }}>{s.val}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.4)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, padding: 4, background: C.navy + '08', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)' }}>
        {['posts', 'followers', 'following'].map(function(t) {
          var labels = { posts: '📝 Posts', followers: '👥 Followers', following: '🤝 Following' };
          var counts = { posts: stats.posts, followers: stats.followers, following: stats.following };
          return (
            <button key={t} onClick={function() { setTab(t); }}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? C.navy : 'rgba(11,37,69,0.4)',
                boxShadow: tab === t ? '0 1px 4px rgba(11,37,69,0.08)' : 'none',
              }}>
              {labels[t]} <span style={{ fontSize: 11, fontWeight: 700, color: tab === t ? C.gold : 'rgba(11,37,69,0.25)', marginLeft: 4 }}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {posts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>📝</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>No posts yet</p>
            </div>
          ) : posts.map(function(p) {
            return (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 16, padding: '16px 20px',
                border: '1px solid rgba(11,37,69,0.06)', transition: 'all 0.2s',
                cursor: 'pointer',
              }}
                onClick={function() { navigate('/citizen/community'); }}
                onMouseEnter={function(e) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(11,37,69,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {p.content && (
                  <p style={{ fontSize: 14, color: C.navy, margin: '0 0 8px', lineHeight: 1.6 }}>{p.content}</p>
                )}
                {p.image_url && (
                  <img src={p.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, marginBottom: 8, display: 'block' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                  <span>❤️ {p.likes_count || 0}</span>
                  <span>💬 {p.comments_count || 0}</span>
                  <span style={{ marginLeft: 'auto' }}>{timeAgo(p.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Followers tab */}
      {tab === 'followers' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {followers.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>👥</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>No followers yet</p>
            </div>
          ) : followers.map(function(f) {
            var pid = f.follower_id;
            return (
              <div key={pid}
                onClick={function() { navigate('/citizen/profile/' + pid); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = C.gold + '44'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(11,37,69,0.06)'; }}
              >
                <Avatar name={f.full_name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>{f.full_name || 'Citizen'}</p>
                  {f.identity_verified && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>✓ Verified</span>}
                </div>
                <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)' }}>{timeAgo(f.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Following tab */}
      {tab === 'following' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {following.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>🤝</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Not following anyone yet</p>
            </div>
          ) : following.map(function(f) {
            var pid = f.following_id;
            return (
              <div key={pid}
                onClick={function() { navigate('/citizen/profile/' + pid); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = C.gold + '44'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(11,37,69,0.06)'; }}
              >
                <Avatar name={f.full_name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>{f.full_name || 'Citizen'}</p>
                  {f.identity_verified && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>✓ Verified</span>}
                </div>
                <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)' }}>{timeAgo(f.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

