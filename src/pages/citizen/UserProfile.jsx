// src/pages/citizen/UserProfile.jsx — Enhanced profile with civic score, achievements, heatmap, invites
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/useAuth";

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#1A7A3C', purple: '#6D28D9', red: '#C0392B', orange: '#D97706', cyan: '#0891b2' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

var CIVIC_INTERESTS = [
  'Education', 'Climate', 'Healthcare', 'Housing', 'Transportation',
  'Public Safety', 'Economy', 'Civil Rights', 'Immigration', 'Technology',
  'Environment', 'Infrastructure', 'Veterans', 'Agriculture', 'Energy',
  'Gun Policy', 'Tax Reform', 'Mental Health', 'Criminal Justice', 'Small Business',
];

function Ico({ d, size }) {
  return <svg width={size||16} height={size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

function timeAgo(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function Avatar({ name, url, size }) {
  size = size || 60;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  if (url) return (
    <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid ' + C.gold + '44', flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #122e56 100%)',
      border: '3px solid ' + C.gold + '44',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: size * 0.33, fontWeight: 700, color: C.gold, fontFamily: font,
    }}>{initials}</div>
  );
}

// ── Achievement definitions ───────────────────────────────────────────────────
var ACHIEVEMENTS = {
  verified_citizen: { icon: '🛡️', label: 'Verified Citizen', desc: 'Completed identity verification', color: C.gold },
  first_post:       { icon: '✍️', label: 'First Post', desc: 'Published first community post', color: C.green },
  prolific_poster:  { icon: '📝', label: 'Prolific Poster', desc: 'Published 10+ posts', color: C.navy },
  civic_voice:      { icon: '📣', label: 'Civic Voice', desc: 'Published 50+ posts', color: C.purple },
  first_survey:     { icon: '📋', label: 'First Survey', desc: 'Completed first survey', color: C.green },
  survey_veteran:   { icon: '🎯', label: 'Survey Veteran', desc: 'Completed 10+ surveys', color: C.gold },
  survey_champion:  { icon: '🏆', label: 'Survey Champion', desc: 'Completed 50+ surveys', color: C.orange },
  first_debate:     { icon: '🎙️', label: 'First Debate', desc: 'Participated in first debate', color: C.navy },
  debate_veteran:   { icon: '⚔️', label: 'Debate Veteran', desc: 'Participated in 5+ debates', color: C.red },
  rising_star:      { icon: '⭐', label: 'Rising Star', desc: 'Gained 5+ followers', color: C.gold },
  influencer:       { icon: '👑', label: 'Influencer', desc: 'Gained 25+ followers', color: C.purple },
  week_streak:      { icon: '🔥', label: 'Week Warrior', desc: '7-day activity streak', color: C.orange },
  month_streak:     { icon: '💎', label: 'Month Master', desc: '30-day activity streak', color: C.cyan },
  commenter:        { icon: '💬', label: 'Commenter', desc: 'Left 10+ comments', color: C.navy },
  connector:        { icon: '🤝', label: 'Connector', desc: 'Following 10+ citizens', color: C.green },
  recruiter:        { icon: '📨', label: 'Recruiter', desc: 'Invited a citizen who joined', color: C.gold },
  ambassador:       { icon: '🌟', label: 'Ambassador', desc: 'Invited 5+ citizens who joined', color: C.purple },
  civic_100:        { icon: '💯', label: 'Civic 100', desc: 'Reached 100 civic score', color: C.gold },
  civic_500:        { icon: '🏛️', label: 'Civic Legend', desc: 'Reached 500 civic score', color: C.purple },
};

// ── Rank tiers ────────────────────────────────────────────────────────────────
function getRank(score) {
  if (score >= 500) return { name: 'Diamond', color: C.cyan, bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', icon: '💎', next: null, progress: 1 };
  if (score >= 200) return { name: 'Platinum', color: C.purple, bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', icon: '👑', next: 500, progress: (score - 200) / 300 };
  if (score >= 75) return { name: 'Gold', color: C.gold, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '🥇', next: 200, progress: (score - 75) / 125 };
  if (score >= 25) return { name: 'Silver', color: '#94a3b8', bg: 'linear-gradient(135deg, #94a3b8, #64748b)', icon: '🥈', next: 75, progress: (score - 25) / 50 };
  return { name: 'Bronze', color: '#b45309', bg: 'linear-gradient(135deg, #d97706, #b45309)', icon: '🥉', next: 25, progress: score / 25 };
}

// ── Heatmap component ─────────────────────────────────────────────────────────
function ActivityHeatmap({ data }) {
  var today = new Date();
  var days = [];
  for (var i = 89; i >= 0; i--) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var key = d.toISOString().split('T')[0];
    var found = data.find(function(x) { return x.activity_date === key; });
    days.push({ date: key, count: found ? found.activity_count : 0, day: d.getDay() });
  }

  var maxCount = Math.max(1, Math.max.apply(null, days.map(function(d) { return d.count; })));

  function getColor(count) {
    if (count === 0) return 'rgba(11,37,69,0.04)';
    var intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return C.gold + '30';
    if (intensity < 0.5) return C.gold + '55';
    if (intensity < 0.75) return C.gold + '88';
    return C.gold;
  }

  var weeks = [];
  var currentWeek = [];
  days.forEach(function(d, i) {
    currentWeek.push(d);
    if (currentWeek.length === 7 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }}>
        {weeks.map(function(week, wi) {
          return (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map(function(d, di) {
                return (
                  <div key={di} title={d.date + ': ' + d.count + ' activities'} style={{
                    width: 12, height: 12, borderRadius: 3, background: getColor(d.count),
                    transition: 'transform 0.1s', cursor: 'default',
                  }}
                    onMouseEnter={function(e) { e.currentTarget.style.transform = 'scale(1.3)'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(function(v, i) {
          return <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v * maxCount || (i === 0 ? 0 : 1)) }} />;
        })}
        <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)' }}>More</span>
        <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)', marginLeft: 'auto' }}>Last 90 days</span>
      </div>
    </div>
  );
}

// ── Civic Score Ring ──────────────────────────────────────────────────────────
function ScoreRing({ score, rank }) {
  var circumference = 2 * Math.PI * 52;
  var offset = circumference - (rank.progress * circumference);
  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width="130" height="130" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(11,37,69,0.06)" strokeWidth="8" />
        <circle cx="60" cy="60" r="52" fill="none" stroke={rank.color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: C.navy, fontFamily: font, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: rank.color, textTransform: 'uppercase', letterSpacing: 1 }}>{rank.name}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function UserProfile() {
  var { userId } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();

  var [profile, setProfile] = useState(null);
  var [posts, setPosts] = useState([]);
  var [pinnedPost, setPinnedPost] = useState(null);
  var [followers, setFollowers] = useState([]);
  var [following, setFollowing] = useState([]);
  var [isFollowing, setIsFollowing] = useState(false);
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('overview');
  var [followBusy, setFollowBusy] = useState(false);
  var [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, debates: 0 });
  var [civicScore, setCivicScore] = useState(0);
  var [achievements, setAchievements] = useState([]);
  var [heatmapData, setHeatmapData] = useState([]);
  var [debateRecord, setDebateRecord] = useState({ total: 0, as_creator: 0, as_opponent: 0, completed: 0 });
  var [suggestions, setSuggestions] = useState([]);
  var [inviteEmail, setInviteEmail] = useState('');
  var [invites, setInvites] = useState([]);
  var [inviteSent, setInviteSent] = useState(false);
  var [pinBusy, setPinBusy] = useState(false);
  var [editing, setEditing] = useState(false);
  var [editData, setEditData] = useState({ bio: '', occupation: '', education: '', website_url: '', civic_interests: [], social_links: {} });
  var [savingProfile, setSavingProfile] = useState(false);

  var isOwnProfile = user && user.id === userId;

  useEffect(function() { if (userId) loadProfile(); }, [userId]);

  async function loadProfile() {
    setLoading(true);
    try {
      var { data: prof } = await supabase.from('users')
        .select('id, full_name, identity_verified, avatar_url, created_at, follower_count, following_count, state, city, civic_score, current_streak, longest_streak, pinned_post_id, bio, occupation, education, website_url, civic_interests, social_links')
        .eq('id', userId).single();
      setProfile(prof);
      setEditData({
        bio: prof?.bio || '',
        occupation: prof?.occupation || '',
        education: prof?.education || '',
        website_url: prof?.website_url || '',
        civic_interests: prof?.civic_interests || [],
        social_links: prof?.social_links || {},
      });

      try {
        var { data: scoreData } = await supabase.rpc('calculate_civic_score', { uid: userId });
        setCivicScore(scoreData || prof?.civic_score || 0);
      } catch(e) { setCivicScore(prof?.civic_score || 0); }

      var { data: userPosts } = await supabase.from('community_posts')
        .select('id, content, created_at, likes_count, comments_count, image_url')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
      setPosts(userPosts || []);

      if (prof?.pinned_post_id) {
        var { data: pinned } = await supabase.from('community_posts')
          .select('id, content, created_at, likes_count, comments_count, image_url')
          .eq('id', prof.pinned_post_id).single();
        setPinnedPost(pinned);
      }

      var { data: followerRows } = await supabase.from('user_follows')
        .select('follower_id, created_at').eq('following_id', userId)
        .order('created_at', { ascending: false }).limit(50);
      if (followerRows && followerRows.length > 0) {
        var fIds = followerRows.map(function(f) { return f.follower_id; });
        var { data: fUsers } = await supabase.from('users').select('id, full_name, identity_verified, avatar_url').in('id', fIds);
        var fMap = {}; (fUsers || []).forEach(function(u) { fMap[u.id] = u; });
        setFollowers(followerRows.map(function(f) { return Object.assign({}, f, fMap[f.follower_id] || {}); }));
      } else { setFollowers([]); }

      var { data: followingRows } = await supabase.from('user_follows')
        .select('following_id, created_at').eq('follower_id', userId)
        .order('created_at', { ascending: false }).limit(50);
      if (followingRows && followingRows.length > 0) {
        var gIds = followingRows.map(function(f) { return f.following_id; });
        var { data: gUsers } = await supabase.from('users').select('id, full_name, identity_verified, avatar_url').in('id', gIds);
        var gMap = {}; (gUsers || []).forEach(function(u) { gMap[u.id] = u; });
        setFollowing(followingRows.map(function(f) { return Object.assign({}, f, gMap[f.following_id] || {}); }));
      } else { setFollowing([]); }

      if (user && user.id !== userId) {
        var { data: followCheck } = await supabase.from('user_follows')
          .select('id').eq('follower_id', user.id).eq('following_id', userId).single();
        setIsFollowing(!!followCheck);
      }

      var { count: debateCount } = await supabase.from('debates')
        .select('id', { count: 'exact', head: true })
        .or('creator_id.eq.' + userId + ',opponent_id.eq.' + userId);

      setStats({
        posts: (userPosts || []).length,
        followers: prof?.follower_count || (followerRows || []).length,
        following: prof?.following_count || (followingRows || []).length,
        debates: debateCount || 0,
      });

      try {
        var { data: achData } = await supabase.from('user_achievements')
          .select('achievement_key, unlocked_at').eq('user_id', userId);
        setAchievements(achData || []);
        if (user && user.id === userId) { supabase.rpc('check_achievements', { uid: userId }).catch(function(){}); }
      } catch(e) { setAchievements([]); }

      try {
        var { data: heatData } = await supabase.rpc('get_user_heatmap', { uid: userId });
        setHeatmapData(heatData || []);
      } catch(e) { setHeatmapData([]); }

      try {
        var { data: recData } = await supabase.rpc('get_debate_record', { uid: userId });
        if (recData) setDebateRecord(recData);
      } catch(e) {}

      if (user && user.id === userId) {
        try {
          var { data: sugData } = await supabase.rpc('get_similar_citizens', { uid: userId, lim: 5 });
          setSuggestions(sugData || []);
        } catch(e) { setSuggestions([]); }

        try {
          var { data: invData } = await supabase.from('user_invitations')
            .select('*').eq('inviter_id', userId).order('created_at', { ascending: false }).limit(10);
          setInvites(invData || []);
        } catch(e) { setInvites([]); }
      }
    } catch(e) { console.error('Profile load error:', e); }
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

  async function pinPost(postId) {
    setPinBusy(true);
    var newPinId = profile?.pinned_post_id === postId ? null : postId;
    await supabase.from('users').update({ pinned_post_id: newPinId }).eq('id', user.id);
    setProfile(function(p) { return Object.assign({}, p, { pinned_post_id: newPinId }); });
    if (newPinId) {
      var post = posts.find(function(p) { return p.id === postId; });
      setPinnedPost(post);
    } else { setPinnedPost(null); }
    setPinBusy(false);
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || !user) return;
    var { error } = await supabase.from('user_invitations').insert({
      inviter_id: user.id, email: inviteEmail.trim(),
    });
    if (!error) {
      setInviteSent(true);
      setInviteEmail('');
      setTimeout(function() { setInviteSent(false); }, 3000);
      var { data } = await supabase.from('user_invitations')
        .select('*').eq('inviter_id', user.id).order('created_at', { ascending: false }).limit(10);
      setInvites(data || []);
    }
  }

  async function saveProfileInfo() {
    if (!user || savingProfile) return;
    setSavingProfile(true);
    var { error } = await supabase.from('users').update({
      bio: editData.bio || null,
      occupation: editData.occupation || null,
      education: editData.education || null,
      website_url: editData.website_url || null,
      civic_interests: editData.civic_interests || [],
      social_links: editData.social_links || {},
    }).eq('id', user.id);
    if (!error) {
      setProfile(function(p) { return Object.assign({}, p, editData); });
      setEditing(false);
    }
    setSavingProfile(false);
  }

  function toggleInterest(tag) {
    setEditData(function(prev) {
      var current = prev.civic_interests || [];
      var has = current.indexOf(tag) >= 0;
      return Object.assign({}, prev, {
        civic_interests: has ? current.filter(function(t) { return t !== tag; }) : current.concat([tag])
      });
    });
  }

  function updateEditField(field, value) {
    setEditData(function(prev) {
      var next = Object.assign({}, prev);
      next[field] = value;
      return next;
    });
  }

  function updateSocialLink(platform, value) {
    setEditData(function(prev) {
      var links = Object.assign({}, prev.social_links || {});
      if (value) links[platform] = value; else delete links[platform];
      return Object.assign({}, prev, { social_links: links });
    });
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: sans }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}'}</style>
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: 80, fontFamily: sans }}>
      <p style={{ fontSize: 48, margin: '0 0 12px' }}>👤</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>User not found</p>
      <button onClick={function() { navigate('/citizen/community'); }}
        style={{ marginTop: 12, padding: '8px 20px', background: C.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Back to Community
      </button>
    </div>
  );

  var rank = getRank(civicScore);
  var joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  var streak = profile.current_streak || 0;
  var longestStreak = profile.longest_streak || 0;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', fontFamily: sans }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes glow{0%,100%{box-shadow:0 0 8px ' + C.gold + '22}50%{box-shadow:0 0 20px ' + C.gold + '44}}'}</style>

      <button onClick={function() { navigate(-1); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'none', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 20 }}>
        ← Back
      </button>

      {/* ── Profile Header + Civic Score ──────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 24, border: '1px solid rgba(11,37,69,0.07)',
        boxShadow: '0 4px 24px rgba(11,37,69,0.06)', overflow: 'hidden', marginBottom: 20,
        animation: 'fadeIn 0.4s ease',
      }}>
        <div style={{ height: 90, background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #1a3a6a 50%, ' + C.gold + '44 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 12, right: 16, background: rank.bg, padding: '5px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: 14 }}>{rank.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>{rank.name}</span>
          </div>
        </div>

        <div style={{ padding: '0 24px 24px', marginTop: -36 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 14 }}>
                <Avatar name={profile.full_name} url={profile.avatar_url} size={78} />
                <div style={{ paddingTop: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>{profile.full_name}</h1>
                    {profile.identity_verified && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: C.gold + '18', border: '1px solid ' + C.gold + '44', fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {profile.city && profile.state && <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)' }}>📍 {profile.city}, {profile.state}</span>}
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>Joined {joinDate}</span>
                    {streak > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>🔥 {streak} day streak</span>}
                  </div>
                  {/* Bio */}
                  {profile.bio && (
                    <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: '8px 0 0', lineHeight: 1.5, maxWidth: 400 }}>{profile.bio}</p>
                  )}
                  {/* Quick info chips */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    {profile.occupation && (
                      <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, background: 'rgba(11,37,69,0.03)' }}>💼 {profile.occupation}</span>
                    )}
                    {profile.education && (
                      <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, background: 'rgba(11,37,69,0.03)' }}>🎓 {profile.education}</span>
                    )}
                    {profile.website_url && (
                      <a href={profile.website_url.startsWith('http') ? profile.website_url : 'https://' + profile.website_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: C.gold, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, background: C.gold + '08', textDecoration: 'none', fontWeight: 600 }}
                        onClick={function(e) { e.stopPropagation(); }}>
                        🔗 Website
                      </a>
                    )}
                    {profile.social_links && profile.social_links.twitter && (
                      <a href={'https://twitter.com/' + profile.social_links.twitter.replace('@', '')} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#1DA1F2', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, background: '#1DA1F208', textDecoration: 'none', fontWeight: 600 }}
                        onClick={function(e) { e.stopPropagation(); }}>
                        𝕏 {profile.social_links.twitter}
                      </a>
                    )}
                    {profile.social_links && profile.social_links.linkedin && (
                      <a href={profile.social_links.linkedin.startsWith('http') ? profile.social_links.linkedin : 'https://linkedin.com/in/' + profile.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#0A66C2', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, background: '#0A66C208', textDecoration: 'none', fontWeight: 600 }}
                        onClick={function(e) { e.stopPropagation(); }}>
                        in LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {!isOwnProfile && user && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={toggleFollow} disabled={followBusy} style={{
                    padding: '9px 22px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    background: isFollowing ? 'transparent' : C.navy, color: isFollowing ? C.navy : C.gold,
                    border: isFollowing ? '2px solid ' + C.navy + '22' : '2px solid ' + C.navy,
                  }}>{followBusy ? '...' : isFollowing ? '✓ Following' : '+ Follow'}</button>
                  <button onClick={function() { navigate('/citizen/messages/' + userId); }} style={{
                    padding: '9px 18px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: 'rgba(11,37,69,0.04)', color: C.navy, border: '1px solid rgba(11,37,69,0.1)',
                  }}>✉ Message</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { label: 'Posts', val: stats.posts },
                  { label: 'Followers', val: stats.followers },
                  { label: 'Following', val: stats.following },
                  { label: 'Debates', val: stats.debates },
                ].map(function(s) {
                  return (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: C.navy, margin: 0, fontFamily: font }}>{s.val}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(11,37,69,0.4)', margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 44 }}>
              <ScoreRing score={civicScore} rank={rank} />
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: 1 }}>Civic Score</p>
              {rank.next && (
                <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)', margin: '2px 0 0' }}>{rank.next - civicScore} pts to next rank</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, padding: 4, background: C.navy + '06', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '🏠 Overview' },
          { id: 'posts', label: '📝 Posts', count: stats.posts },
          { id: 'achievements', label: '🏆 Badges', count: achievements.length },
          { id: 'followers', label: '👥 Followers', count: stats.followers },
          { id: 'following', label: '🤝 Following', count: stats.following },
        ].map(function(t) {
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? C.navy : 'rgba(11,37,69,0.4)',
              boxShadow: tab === t.id ? '0 1px 4px rgba(11,37,69,0.08)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {t.label} {t.count !== undefined && <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.id ? C.gold : 'rgba(11,37,69,0.25)', marginLeft: 3 }}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* ═══════════ OVERVIEW TAB ════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gap: 16, animation: 'slideUp 0.3s ease' }}>

          {/* Civic Interests Tags (visible to everyone) */}
          {profile.civic_interests && profile.civic_interests.length > 0 && !editing && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '16px 22px', border: '1px solid rgba(11,37,69,0.07)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(11,37,69,0.35)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>Civic Interests</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {profile.civic_interests.map(function(tag) {
                  return (
                    <span key={tag} style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
                      background: C.navy + '08', color: C.navy, border: '1px solid ' + C.navy + '12',
                    }}>{tag}</span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit Profile Button (own profile only) */}
          {isOwnProfile && !editing && (
            <button onClick={function() { setEditing(true); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 14, border: '1.5px dashed ' + C.gold + '44',
              background: C.gold + '06', color: C.gold, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s', width: '100%',
            }}
              onMouseEnter={function(e) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.gold + '12'; }}
              onMouseLeave={function(e) { e.currentTarget.style.borderColor = C.gold + '44'; e.currentTarget.style.background = C.gold + '06'; }}>
              ✏️ Edit Profile Info
            </button>
          )}

          {/* ── INLINE EDIT PANEL ──────────────────────────────────────────── */}
          {editing && isOwnProfile && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '2px solid ' + C.gold + '33', boxShadow: '0 4px 24px rgba(197,150,12,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>✏️ Edit Profile</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={function() { setEditing(false); setEditData({ bio: profile.bio || '', occupation: profile.occupation || '', education: profile.education || '', website_url: profile.website_url || '', civic_interests: profile.civic_interests || [], social_links: profile.social_links || {} }); }}
                    style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', background: 'none', color: 'rgba(11,37,69,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveProfileInfo} disabled={savingProfile}
                    style={{ padding: '7px 20px', borderRadius: 10, border: 'none', background: C.navy, color: C.gold, fontSize: 12, fontWeight: 700, cursor: savingProfile ? 'default' : 'pointer', opacity: savingProfile ? 0.6 : 1 }}>
                    {savingProfile ? 'Saving...' : '✓ Save'}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: '0 0 16px' }}>All fields are optional — only fill in what you want to display.</p>

              {/* Bio */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>About Me</label>
                <textarea value={editData.bio} onChange={function(e) { updateEditField('bio', e.target.value); }}
                  maxLength={160} placeholder="A short bio about yourself..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, fontFamily: sans, color: C.navy, resize: 'vertical', minHeight: 60, maxHeight: 120, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                  onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                />
                <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.25)', margin: '4px 0 0', textAlign: 'right' }}>{(editData.bio || '').length}/160</p>
              </div>

              {/* Occupation + Education side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>💼 Occupation</label>
                  <input value={editData.occupation} onChange={function(e) { updateEditField('occupation', e.target.value); }}
                    placeholder="e.g. Software Engineer"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, fontFamily: sans, color: C.navy, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                    onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>🎓 Education</label>
                  <input value={editData.education} onChange={function(e) { updateEditField('education', e.target.value); }}
                    placeholder="e.g. BS Computer Science"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, fontFamily: sans, color: C.navy, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                    onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                  />
                </div>
              </div>

              {/* Website */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>🔗 Website</label>
                <input value={editData.website_url} onChange={function(e) { updateEditField('website_url', e.target.value); }}
                  placeholder="https://yourwebsite.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, fontFamily: sans, color: C.navy, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                  onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                />
              </div>

              {/* Social Links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>𝕏 Twitter / X</label>
                  <input value={(editData.social_links || {}).twitter || ''} onChange={function(e) { updateSocialLink('twitter', e.target.value); }}
                    placeholder="@username"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, fontFamily: sans, color: C.navy, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                    onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>in LinkedIn</label>
                  <input value={(editData.social_links || {}).linkedin || ''} onChange={function(e) { updateSocialLink('linkedin', e.target.value); }}
                    placeholder="username or full URL"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, fontFamily: sans, color: C.navy, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                    onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                  />
                </div>
              </div>

              {/* Civic Interests */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Civic Interests <span style={{ fontWeight: 400, textTransform: 'none' }}>(select what matters to you)</span></label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CIVIC_INTERESTS.map(function(tag) {
                    var selected = (editData.civic_interests || []).indexOf(tag) >= 0;
                    return (
                      <button key={tag} onClick={function() { toggleInterest(tag); }} style={{
                        fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                        transition: 'all 0.15s', border: 'none',
                        background: selected ? C.navy : 'rgba(11,37,69,0.04)',
                        color: selected ? C.gold : 'rgba(11,37,69,0.45)',
                      }}>{tag}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {pinnedPost && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '2px solid ' + C.gold + '33', boxShadow: '0 2px 16px rgba(197,150,12,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 13 }}>📌</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 0.8 }}>Pinned Post</span>
              </div>
              <p style={{ fontSize: 14, color: C.navy, margin: '0 0 8px', lineHeight: 1.6 }}>{pinnedPost.content}</p>
              {pinnedPost.image_url && <img src={pinnedPost.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, marginBottom: 8 }} />}
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                <span>❤️ {pinnedPost.likes_count || 0}</span>
                <span>💬 {pinnedPost.comments_count || 0}</span>
                <span style={{ marginLeft: 'auto' }}>{timeAgo(pinnedPost.created_at)}</span>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '1px solid rgba(11,37,69,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Activity</h3>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: C.orange, margin: 0, fontFamily: font }}>{streak}</p>
                  <p style={{ fontSize: 9, color: 'rgba(11,37,69,0.35)', margin: 0, fontWeight: 600 }}>🔥 STREAK</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: C.purple, margin: 0, fontFamily: font }}>{longestStreak}</p>
                  <p style={{ fontSize: 9, color: 'rgba(11,37,69,0.35)', margin: 0, fontWeight: 600 }}>💎 BEST</p>
                </div>
              </div>
            </div>
            <ActivityHeatmap data={heatmapData} />
          </div>

          {debateRecord.total > 0 && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '1px solid rgba(11,37,69,0.07)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: font }}>🎙️ Debate Record</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total', val: debateRecord.total, color: C.navy },
                  { label: 'Started', val: debateRecord.as_creator, color: C.gold },
                  { label: 'Completed', val: debateRecord.completed, color: C.green },
                ].map(function(s) {
                  return (
                    <div key={s.label} style={{ textAlign: 'center', padding: '14px 8px', borderRadius: 14, background: s.color + '08', border: '1px solid ' + s.color + '15' }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0, fontFamily: font }}>{s.val}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(11,37,69,0.4)', margin: '4px 0 0', textTransform: 'uppercase' }}>{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {achievements.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '1px solid rgba(11,37,69,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>🏆 Achievements</h3>
                <button onClick={function() { setTab('achievements'); }} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {achievements.slice(0, 6).map(function(a) {
                  var def = ACHIEVEMENTS[a.achievement_key] || { icon: '🏅', label: a.achievement_key, color: C.navy };
                  return (
                    <div key={a.achievement_key} style={{
                      flexShrink: 0, width: 80, textAlign: 'center', padding: '12px 8px', borderRadius: 14,
                      background: def.color + '08', border: '1px solid ' + def.color + '20',
                    }}>
                      <span style={{ fontSize: 28, display: 'block', marginBottom: 4 }}>{def.icon}</span>
                      <p style={{ fontSize: 9, fontWeight: 700, color: def.color, margin: 0, lineHeight: 1.3 }}>{def.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isOwnProfile && suggestions.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '1px solid rgba(11,37,69,0.07)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: font }}>🤝 Citizens Like You</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {suggestions.map(function(s) {
                  var sRank = getRank(s.civic_score || 0);
                  return (
                    <div key={s.id} onClick={function() { navigate('/citizen/profile/' + s.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(11,37,69,0.02)', border: '1px solid rgba(11,37,69,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={function(e) { e.currentTarget.style.borderColor = C.gold + '44'; }}
                      onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(11,37,69,0.04)'; }}>
                      <Avatar name={s.full_name} url={s.avatar_url} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{s.full_name}</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {s.identity_verified && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>✓ Verified</span>}
                          {s.city && s.state && <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)' }}>{s.city}, {s.state}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sRank.color }}>{sRank.icon} {s.civic_score || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isOwnProfile && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 22px', border: '1px solid rgba(11,37,69,0.07)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>📨 Invite Citizens</h3>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '0 0 14px' }}>Grow the community — earn the Recruiter badge!</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input value={inviteEmail} onChange={function(e) { setInviteEmail(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') sendInvite(); }}
                  placeholder="Enter email address..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', fontFamily: sans, color: C.navy, boxSizing: 'border-box' }}
                  onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                  onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
                />
                <button onClick={sendInvite} disabled={!inviteEmail.trim()} style={{
                  padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: inviteEmail.trim() ? 'pointer' : 'default',
                  background: inviteEmail.trim() ? C.navy : 'rgba(11,37,69,0.06)', color: inviteEmail.trim() ? C.gold : 'rgba(11,37,69,0.25)',
                }}>Send</button>
              </div>
              {inviteSent && <p style={{ fontSize: 12, fontWeight: 600, color: C.green, margin: '0 0 8px' }}>✓ Invitation sent!</p>}
              {invites.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.35)', margin: '0 0 8px', textTransform: 'uppercase' }}>Sent Invitations</p>
                  {invites.map(function(inv) {
                    return (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                        <span style={{ fontSize: 12, color: C.navy }}>{inv.email}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                          background: inv.status === 'accepted' ? C.green + '15' : C.gold + '15',
                          color: inv.status === 'accepted' ? C.green : C.gold,
                        }}>{inv.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ POSTS TAB ═══════════════════════════════════════════════ */}
      {tab === 'posts' && (
        <div style={{ display: 'grid', gap: 12, animation: 'slideUp 0.3s ease' }}>
          {posts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>📝</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>No posts yet</p>
            </div>
          ) : posts.map(function(p) {
            var isPinned = profile?.pinned_post_id === p.id;
            return (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 16, padding: '16px 20px',
                border: isPinned ? '2px solid ' + C.gold + '33' : '1px solid rgba(11,37,69,0.06)',
                transition: 'all 0.2s',
              }}>
                {isPinned && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 10, fontWeight: 700, color: C.gold }}>📌 PINNED</div>}
                {p.content && <p style={{ fontSize: 14, color: C.navy, margin: '0 0 8px', lineHeight: 1.6 }}>{p.content}</p>}
                {p.image_url && <img src={p.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, marginBottom: 8, display: 'block' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                  <span>❤️ {p.likes_count || 0}</span>
                  <span>💬 {p.comments_count || 0}</span>
                  <span style={{ marginLeft: 'auto' }}>{timeAgo(p.created_at)}</span>
                  {isOwnProfile && (
                    <button onClick={function() { pinPost(p.id); }} disabled={pinBusy}
                      style={{ fontSize: 11, fontWeight: 600, color: isPinned ? C.gold : 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {isPinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ ACHIEVEMENTS TAB ════════════════════════════════════════ */}
      {tab === 'achievements' && (
        <div style={{ animation: 'slideUp 0.3s ease' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: font }}>Unlocked ({achievements.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
            {achievements.length === 0 ? (
              <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
                <p style={{ fontSize: 36, margin: '0 0 8px' }}>🏆</p>
                <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>No achievements yet</p>
              </div>
            ) : achievements.map(function(a) {
              var def = ACHIEVEMENTS[a.achievement_key] || { icon: '🏅', label: a.achievement_key, desc: '', color: C.navy };
              return (
                <div key={a.achievement_key} style={{
                  background: '#fff', borderRadius: 16, padding: '18px 14px', textAlign: 'center',
                  border: '1px solid ' + def.color + '22', boxShadow: '0 2px 12px ' + def.color + '08',
                }}>
                  <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>{def.icon}</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: def.color, margin: '0 0 4px' }}>{def.label}</p>
                  <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.4)', margin: 0, lineHeight: 1.4 }}>{def.desc}</p>
                  <p style={{ fontSize: 9, color: 'rgba(11,37,69,0.25)', margin: '6px 0 0' }}>{new Date(a.unlocked_at).toLocaleDateString()}</p>
                </div>
              );
            })}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(11,37,69,0.35)', margin: '0 0 14px', fontFamily: font }}>Locked</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {Object.keys(ACHIEVEMENTS).filter(function(key) {
              return !achievements.find(function(a) { return a.achievement_key === key; });
            }).map(function(key) {
              var def = ACHIEVEMENTS[key];
              return (
                <div key={key} style={{
                  background: 'rgba(11,37,69,0.02)', borderRadius: 16, padding: '18px 14px', textAlign: 'center',
                  border: '1px solid rgba(11,37,69,0.05)', opacity: 0.5,
                }}>
                  <span style={{ fontSize: 36, display: 'block', marginBottom: 8, filter: 'grayscale(1)' }}>{def.icon}</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(11,37,69,0.4)', margin: '0 0 4px' }}>{def.label}</p>
                  <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)', margin: 0, lineHeight: 1.4 }}>{def.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ FOLLOWERS TAB ═══════════════════════════════════════════ */}
      {tab === 'followers' && (
        <div style={{ display: 'grid', gap: 8, animation: 'slideUp 0.3s ease' }}>
          {followers.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>👥</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>No followers yet</p>
            </div>
          ) : followers.map(function(f) {
            return (
              <div key={f.follower_id} onClick={function() { navigate('/citizen/profile/' + f.follower_id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = C.gold + '44'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(11,37,69,0.06)'; }}>
                <Avatar name={f.full_name} url={f.avatar_url} size={40} />
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

      {/* ═══════════ FOLLOWING TAB ══════════════════════════════════════════ */}
      {tab === 'following' && (
        <div style={{ display: 'grid', gap: 8, animation: 'slideUp 0.3s ease' }}>
          {following.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 36, margin: '0 0 8px' }}>🤝</p>
              <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Not following anyone yet</p>
            </div>
          ) : following.map(function(f) {
            return (
              <div key={f.following_id} onClick={function() { navigate('/citizen/profile/' + f.following_id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = C.gold + '44'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'rgba(11,37,69,0.06)'; }}>
                <Avatar name={f.full_name} url={f.avatar_url} size={40} />
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
