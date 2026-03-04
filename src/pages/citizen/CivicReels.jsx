// src/pages/citizen/CivicReels.jsx — V2 TikTok-Style Civic Reels
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#A67C00', green: '#1A7A3C', red: '#C0392B', purple: '#6D28D9', cream: '#F5F1EC' };
var sans = 'DM Sans, sans-serif';
var serif = 'Libre Baskerville, Georgia, serif';
var MAX_FILE_MB = 50;
var MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
var MAX_DURATION = 90; // seconds

var FILTERS = [
  { id: 'none', label: 'Original', css: 'none' },
  { id: 'warm', label: 'Warm', css: 'saturate(1.2) sepia(0.15) brightness(1.05)' },
  { id: 'cool', label: 'Cool', css: 'saturate(0.9) hue-rotate(15deg) brightness(1.05)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.35) contrast(1.1) brightness(0.95) saturate(1.3)' },
  { id: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { id: 'vivid', label: 'Vivid', css: 'saturate(1.6) contrast(1.1) brightness(1.05)' },
  { id: 'cinematic', label: 'Cinema', css: 'contrast(1.2) brightness(0.95) saturate(0.85)' },
  { id: 'golden', label: 'Golden', css: 'sepia(0.25) saturate(1.4) brightness(1.05) hue-rotate(-10deg)' },
];

var TEXT_FONTS = [
  { id: 'sans', label: 'Sans', css: 'DM Sans, sans-serif' },
  { id: 'serif', label: 'Serif', css: 'Libre Baskerville, Georgia, serif' },
  { id: 'mono', label: 'Mono', css: 'JetBrains Mono, Courier New, monospace' },
  { id: 'display', label: 'Display', css: 'Impact, Haettenschweiler, sans-serif' },
  { id: 'handwritten', label: 'Hand', css: 'Brush Script MT, cursive' },
];

var TEXT_COLORS = ['#FFFFFF', '#000000', '#C5960C', '#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#FF2D55'];

var TRENDING_TAGS = ['LocalGov', 'ClimateAction', 'CivicDuty', 'VoteReady', 'PublicSafety', 'Education', 'Housing', 'Healthcare'];

function fmtCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function timeAgo(iso) {
  if (!iso) return '';
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm';
  if (d < 86400) return Math.floor(d / 3600) + 'h';
  if (d < 604800) return Math.floor(d / 86400) + 'd';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFilterCSS(filterId) {
  var f = FILTERS.find(function (x) { return x.id === filterId; });
  return f ? f.css : 'none';
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function CivicReels() {
  var auth = useAuth();
  var currentUser = auth.user;
  var profile = auth.profile;

  var [reels, setReels] = useState([]);
  var [loading, setLoading] = useState(true);
  var [activeIndex, setActiveIndex] = useState(0);
  var [feed, setFeed] = useState('foryou'); // foryou | following
  var [showUpload, setShowUpload] = useState(false);
  var [showComments, setShowComments] = useState(false);
  var [commentsReelId, setCommentsReelId] = useState(null);
  var [likedReels, setLikedReels] = useState({});
  var [savedReels, setSavedReels] = useState({});
  var [likeAnim, setLikeAnim] = useState(null);
  var [searchTag, setSearchTag] = useState('');
  var scrollRef = useRef(null);
  var videoRefs = useRef({});

  // ─── LOAD FEED ──────────────────────────────────────────
  useEffect(function () {
    loadFeed();
  }, [feed, searchTag, currentUser]);

  async function loadFeed() {
    setLoading(true);
    var query = supabase
      .from('civic_reels')
      .select('*, users:user_id(full_name, username, avatar_url, identity_verified)')
      .eq('status', 'ready')
      .limit(30);

    if (searchTag) {
      query = query.contains('tags', [searchTag]);
    }

    if (feed === 'foryou') {
      query = query.order('views_count', { ascending: false });
    } else if (feed === 'following' && currentUser) {
      // Get followed user IDs first
      var { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
      var followIds = follows ? follows.map(function (f) { return f.following_id; }) : [];
      if (followIds.length > 0) {
        query = query.in('user_id', followIds);
      }
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    var { data, error } = await query;
    if (data) setReels(data);
    setLoading(false);
    setActiveIndex(0);

    // Load user's likes and saves
    if (currentUser) {
      var { data: likes } = await supabase
        .from('civic_reel_likes')
        .select('reel_id')
        .eq('user_id', currentUser.id);
      var lm = {};
      if (likes) likes.forEach(function (l) { lm[l.reel_id] = true; });
      setLikedReels(lm);

      var { data: saves } = await supabase
        .from('civic_reel_saves')
        .select('reel_id')
        .eq('user_id', currentUser.id);
      var sm = {};
      if (saves) saves.forEach(function (s) { sm[s.reel_id] = true; });
      setSavedReels(sm);
    }
  }

  // ─── SCROLL SNAP HANDLER ───────────────────────────────
  function handleScroll() {
    var container = scrollRef.current;
    if (!container) return;
    var idx = Math.round(container.scrollTop / container.clientHeight);
    if (idx !== activeIndex && idx >= 0 && idx < reels.length) {
      setActiveIndex(idx);
    }
  }

  // ─── AUTO-PLAY ACTIVE VIDEO ────────────────────────────
  useEffect(function () {
    Object.keys(videoRefs.current).forEach(function (key) {
      var vid = videoRefs.current[key];
      if (!vid) return;
      if (parseInt(key) === activeIndex) {
        vid.play().catch(function () {});
      } else {
        vid.pause();
      }
    });

    // Track view
    if (reels[activeIndex]) {
      supabase.rpc('increment_reel_views', { p_reel_id: reels[activeIndex].id }).catch(function () {});
    }
  }, [activeIndex, reels]);

  // ─── LIKE ──────────────────────────────────────────────
  async function toggleLike(reelId) {
    if (!currentUser) return;
    var isLiked = likedReels[reelId];

    if (isLiked) {
      setLikedReels(function (prev) { var n = Object.assign({}, prev); delete n[reelId]; return n; });
      setReels(function (prev) { return prev.map(function (r) { return r.id === reelId ? Object.assign({}, r, { likes_count: Math.max(0, (r.likes_count || 0) - 1) }) : r; }); });
      await supabase.from('civic_reel_likes').delete().eq('reel_id', reelId).eq('user_id', currentUser.id);
    } else {
      setLikedReels(function (prev) { return Object.assign({}, prev, (function () { var o = {}; o[reelId] = true; return o; })()); });
      setReels(function (prev) { return prev.map(function (r) { return r.id === reelId ? Object.assign({}, r, { likes_count: (r.likes_count || 0) + 1 }) : r; }); });
      await supabase.from('civic_reel_likes').insert({ reel_id: reelId, user_id: currentUser.id });
    }
    supabase.rpc('sync_reel_like_count', { p_reel_id: reelId }).catch(function () {});
  }

  // ─── DOUBLE TAP TO LIKE ────────────────────────────────
  var lastTap = useRef(0);
  function handleDoubleTap(reelId, e) {
    var now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (!likedReels[reelId]) {
        toggleLike(reelId);
      }
      setLikeAnim(reelId);
      setTimeout(function () { setLikeAnim(null); }, 800);
    }
    lastTap.current = now;
  }

  // ─── SAVE ──────────────────────────────────────────────
  async function toggleSave(reelId) {
    if (!currentUser) return;
    var isSaved = savedReels[reelId];

    if (isSaved) {
      setSavedReels(function (prev) { var n = Object.assign({}, prev); delete n[reelId]; return n; });
      await supabase.from('civic_reel_saves').delete().eq('reel_id', reelId).eq('user_id', currentUser.id);
    } else {
      setSavedReels(function (prev) { return Object.assign({}, prev, (function () { var o = {}; o[reelId] = true; return o; })()); });
      await supabase.from('civic_reel_saves').insert({ reel_id: reelId, user_id: currentUser.id });
    }
    supabase.rpc('sync_reel_save_count', { p_reel_id: reelId }).catch(function () {});
  }

  // ─── SHARE ─────────────────────────────────────────────
  function handleShare(reelId) {
    var url = window.location.origin + '/citizen/reels?id=' + reelId;
    if (navigator.share) {
      navigator.share({ title: 'CivicReel', url: url }).catch(function () {});
    } else {
      navigator.clipboard.writeText(url).then(function () {
        alert('Link copied!');
      });
    }
    supabase.from('civic_reels').update({ shares_count: (reels.find(function (r) { return r.id === reelId; })?.shares_count || 0) + 1 }).eq('id', reelId).then(function () {});
  }

  // ─── OPEN COMMENTS ────────────────────────────────────
  function openComments(reelId) {
    setCommentsReelId(reelId);
    setShowComments(true);
  }

  // ─── TAP TO PLAY/PAUSE ────────────────────────────────
  function handleTapVideo(idx) {
    var vid = videoRefs.current[idx];
    if (!vid) return;
    if (vid.paused) vid.play().catch(function () {});
    else vid.pause();
  }

  // ─── NAVIGATE UP/DOWN ──────────────────────────────────
  function goTo(idx) {
    if (idx < 0 || idx >= reels.length) return;
    var container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: idx * container.clientHeight, behavior: 'smooth' });
  }

  // ─── RENDER ────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', fontFamily: sans }}>
      <style>{'@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap");'}</style>
      <style>{'\n\
        @keyframes cvHeartBurst{0%{transform:scale(0);opacity:1}50%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:0}}\n\
        @keyframes cvSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}\n\
        @keyframes cvFadeIn{from{opacity:0}to{opacity:1}}\n\
        @keyframes cvSpin{to{transform:rotate(360deg)}}\n\
        @keyframes cvPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}\n\
        .cv-reels-scroll::-webkit-scrollbar{display:none}\n\
        .cv-reel-btn:active{transform:scale(0.9)}\n\
      '}</style>

      {/* ─── TOP BAR ─────────────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
        {/* Feed tabs */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[{ id: 'following', label: 'Following' }, { id: 'foryou', label: 'For You' }].map(function (tab) {
            var isActive = feed === tab.id;
            return (
              <button key={tab.id} onClick={function () { setFeed(tab.id); setSearchTag(''); }}
                style={{ background: 'none', border: 'none', color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: isActive ? 800 : 500, cursor: 'pointer', fontFamily: sans, padding: '4px 0', borderBottom: isActive ? '2px solid #fff' : '2px solid transparent', transition: 'all 0.2s' }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Upload + Search */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {searchTag && (
            <button onClick={function () { setSearchTag(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: C.gold, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              #{searchTag} ✕
            </button>
          )}
          <button onClick={function () { setShowUpload(true); }}
            style={{ width: 36, height: 36, borderRadius: 10, background: C.gold, border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 2px 10px rgba(197,150,12,0.4)' }}>
            +
          </button>
        </div>
      </div>

      {/* ─── TRENDING HASHTAGS ────────────────────── */}
      {activeIndex === 0 && !searchTag && (
        <div style={{ position: 'absolute', top: 52, left: 0, right: 0, zIndex: 15, padding: '4px 16px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TRENDING_TAGS.map(function (tag) {
            return (
              <button key={tag} onClick={function () { setSearchTag(tag); }}
                style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: sans, whiteSpace: 'nowrap' }}>
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── LOADING ──────────────────────────────── */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
          <div style={{ width: 40, height: 40, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'cvSpin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ─── EMPTY STATE ──────────────────────────── */}
      {!loading && reels.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 24 }}>
          <span style={{ fontSize: 56, marginBottom: 16 }}>🎬</span>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: serif, textAlign: 'center' }}>
            {searchTag ? 'No reels for #' + searchTag : feed === 'following' ? 'Follow creators to see their reels' : 'No reels yet'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', textAlign: 'center' }}>Be the first to share a civic reel!</p>
          <button onClick={function () { setShowUpload(true); }}
            style={{ padding: '12px 32px', borderRadius: 12, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: sans, boxShadow: '0 4px 16px rgba(197,150,12,0.4)' }}>
            Create Your First Reel
          </button>
        </div>
      )}

      {/* ─── REELS SCROLL CONTAINER ──────────────── */}
      {reels.length > 0 && (
        <div ref={scrollRef} className="cv-reels-scroll"
          onScroll={handleScroll}
          style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>

          {reels.map(function (reel, idx) {
            var videoUrl = reel.cloudflare_playback_url || reel.video_url;
            var creator = reel.users || {};
            var isLiked = likedReels[reel.id];
            var isSaved = savedReels[reel.id];
            var filterCss = reel.filter ? getFilterCSS(reel.filter) : 'none';
            var overlays = [];
            try { overlays = reel.text_overlays ? (typeof reel.text_overlays === 'string' ? JSON.parse(reel.text_overlays) : reel.text_overlays) : []; } catch (e) {}

            return (
              <div key={reel.id} style={{ height: '100vh', width: '100%', scrollSnapAlign: 'start', position: 'relative', background: '#000' }}>

                {/* Video */}
                <video
                  ref={function (el) { videoRefs.current[idx] = el; }}
                  src={videoUrl}
                  loop muted={false} playsInline
                  preload={Math.abs(idx - activeIndex) <= 1 ? 'auto' : 'none'}
                  onClick={function () { handleTapVideo(idx); handleDoubleTap(reel.id); }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterCss !== 'none' ? filterCss : undefined }}
                />

                {/* Text Overlays */}
                {overlays.map(function (ov, oi) {
                  return (
                    <div key={oi} style={{
                      position: 'absolute',
                      left: (ov.x || 50) + '%',
                      top: (ov.y || 50) + '%',
                      transform: 'translate(-50%, -50%)' + (ov.rotation ? ' rotate(' + ov.rotation + 'deg)' : ''),
                      fontSize: ov.fontSize || 24,
                      fontFamily: ov.fontFamily || sans,
                      color: ov.color || '#fff',
                      fontWeight: 700,
                      textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3)',
                      pointerEvents: 'none',
                      maxWidth: '80%',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {ov.text}
                    </div>
                  );
                })}

                {/* Double-tap heart animation */}
                {likeAnim === reel.id && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 25 }}>
                    <span style={{ fontSize: 100, animation: 'cvHeartBurst 0.8s ease-out forwards' }}>❤️</span>
                  </div>
                )}

                {/* Bottom gradient */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '60px 16px 24px', zIndex: 10 }}>
                  {/* Creator info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid ' + C.gold, flexShrink: 0, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: C.gold, fontSize: 14, fontWeight: 700 }}>{(creator.full_name || '?')[0]}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{creator.full_name || 'Citizen'}</span>
                        {creator.identity_verified && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: 'rgba(197,150,12,0.2)', padding: '2px 6px', borderRadius: 6 }}>✓ Verified</span>
                        )}
                      </div>
                      {creator.username && (
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>@{creator.username}</span>
                      )}
                    </div>
                  </div>

                  {/* Caption */}
                  {reel.caption && (
                    <p style={{ color: '#fff', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {reel.caption}
                    </p>
                  )}

                  {/* Tags */}
                  {reel.tags && reel.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {reel.tags.map(function (tag) {
                        return (
                          <button key={tag} onClick={function (e) { e.stopPropagation(); setSearchTag(tag); }}
                            style={{ background: 'none', border: 'none', color: C.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ─── RIGHT SIDEBAR ACTIONS ─────────── */}
                <div style={{ position: 'absolute', right: 10, bottom: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 10 }}>
                  {/* Like */}
                  <button className="cv-reel-btn" onClick={function () { toggleLike(reel.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0, transition: 'transform 0.15s' }}>
                    <span style={{ fontSize: 28, filter: isLiked ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', animation: isLiked ? 'cvPulse 0.3s ease' : 'none' }}>{isLiked ? '❤️' : '🤍'}</span>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{fmtCount(reel.likes_count)}</span>
                  </button>

                  {/* Comment */}
                  <button className="cv-reel-btn" onClick={function () { openComments(reel.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}>
                    <span style={{ fontSize: 26, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>💬</span>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{fmtCount(reel.comments_count)}</span>
                  </button>

                  {/* Save */}
                  <button className="cv-reel-btn" onClick={function () { toggleSave(reel.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}>
                    <span style={{ fontSize: 26, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{isSaved ? '🔖' : '🏷️'}</span>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{fmtCount(reel.saves_count)}</span>
                  </button>

                  {/* Share */}
                  <button className="cv-reel-btn" onClick={function () { handleShare(reel.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0 }}>
                    <span style={{ fontSize: 26, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>↗️</span>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{fmtCount(reel.shares_count)}</span>
                  </button>
                </div>

                {/* Progress dots (small, right side) */}
                {reels.length > 1 && reels.length <= 20 && (
                  <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10 }}>
                    {reels.map(function (_, i) {
                      return <div key={i} style={{ width: 3, height: i === idx ? 14 : 6, borderRadius: 2, background: i === idx ? C.gold : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── COMMENTS DRAWER ────────────────────── */}
      {showComments && commentsReelId && (
        <CommentsDrawer
          reelId={commentsReelId}
          currentUser={currentUser}
          onClose={function () { setShowComments(false); setCommentsReelId(null); }}
        />
      )}

      {/* ─── UPLOAD MODAL ────────────────────────── */}
      {showUpload && (
        <UploadModal
          currentUser={currentUser}
          onClose={function () { setShowUpload(false); }}
          onUploaded={function () { setShowUpload(false); loadFeed(); }}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// COMMENTS DRAWER
// ═══════════════════════════════════════════════════════════
function CommentsDrawer(props) {
  var reelId = props.reelId;
  var currentUser = props.currentUser;
  var onClose = props.onClose;

  var [comments, setComments] = useState([]);
  var [loading, setLoading] = useState(true);
  var [text, setText] = useState('');
  var [sending, setSending] = useState(false);
  var bottomRef = useRef(null);

  useEffect(function () {
    loadComments();
    // Realtime subscription
    var sub = supabase
      .channel('reel-comments-' + reelId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'civic_reel_comments', filter: 'reel_id=eq.' + reelId }, function (payload) {
        // Fetch with user data
        supabase.from('civic_reel_comments')
          .select('*, users:user_id(full_name, avatar_url, identity_verified)')
          .eq('id', payload.new.id)
          .single()
          .then(function (res) {
            if (res.data) setComments(function (prev) { return prev.concat([res.data]); });
          });
      })
      .subscribe();
    return function () { supabase.removeChannel(sub); };
  }, [reelId]);

  async function loadComments() {
    setLoading(true);
    var { data } = await supabase
      .from('civic_reel_comments')
      .select('*, users:user_id(full_name, avatar_url, identity_verified)')
      .eq('reel_id', reelId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setComments(data);
    setLoading(false);
  }

  async function sendComment() {
    if (!text.trim() || !currentUser || sending) return;
    setSending(true);
    await supabase.from('civic_reel_comments').insert({
      reel_id: reelId,
      user_id: currentUser.id,
      content: text.trim(),
    });
    supabase.rpc('sync_reel_comment_count', { p_reel_id: reelId }).catch(function () {});
    setText('');
    setSending(false);
    setTimeout(function () { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, 200);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      <div style={{ position: 'relative', maxHeight: '65vh', background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', animation: 'cvSlideUp 0.25s ease' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, fontFamily: serif }}>{comments.length} Comments</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(11,37,69,0.3)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ width: 24, height: 24, border: '2px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'cvSpin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(11,37,69,0.3)', fontSize: 13, padding: 24 }}>No comments yet. Be the first!</p>
          )}
          {comments.map(function (c) {
            var u = c.users || {};
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.navy, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>{(u.full_name || '?')[0]}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{u.full_name || 'Citizen'}</span>
                    {u.identity_verified && <span style={{ fontSize: 8, color: C.gold, fontWeight: 700 }}>✓</span>}
                    <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{c.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Comment input */}
        {currentUser ? (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', gap: 10, background: '#fafafa' }}>
            <input value={text} onChange={function (e) { setText(e.target.value); }}
              onKeyDown={function (e) { if (e.key === 'Enter') sendComment(); }}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', fontFamily: sans, color: C.navy }} />
            <button onClick={sendComment} disabled={!text.trim() || sending}
              style={{ padding: '10px 20px', borderRadius: 24, border: 'none', background: text.trim() ? C.gold : 'rgba(11,37,69,0.06)', color: text.trim() ? '#fff' : 'rgba(11,37,69,0.3)', fontWeight: 700, fontSize: 13, cursor: text.trim() ? 'pointer' : 'default', fontFamily: sans }}>
              Post
            </button>
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid rgba(11,37,69,0.06)' }}>
            <p style={{ color: 'rgba(11,37,69,0.4)', fontSize: 13, margin: 0 }}>Sign in to comment</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// UPLOAD MODAL — with text overlays, filters, file validation
// ═══════════════════════════════════════════════════════════
function UploadModal(props) {
  var currentUser = props.currentUser;
  var onClose = props.onClose;
  var onUploaded = props.onUploaded;

  var [step, setStep] = useState('pick'); // pick | edit | posting
  var [file, setFile] = useState(null);
  var [preview, setPreview] = useState('');
  var [error, setError] = useState('');
  var [caption, setCaption] = useState('');
  var [tagsInput, setTagsInput] = useState('');
  var [activeFilter, setActiveFilter] = useState('none');
  var [textOverlays, setTextOverlays] = useState([]);
  var [editingText, setEditingText] = useState(null); // overlay id being edited
  var [newText, setNewText] = useState('');
  var [newTextFont, setNewTextFont] = useState('sans');
  var [newTextColor, setNewTextColor] = useState('#FFFFFF');
  var [newTextSize, setNewTextSize] = useState(24);
  var [showTextPanel, setShowTextPanel] = useState(false);
  var [uploading, setUploading] = useState(false);
  var [uploadProgress, setUploadProgress] = useState(0);
  var [duration, setDuration] = useState(0);
  var videoPreviewRef = useRef(null);
  var dragRef = useRef(null);
  var containerRef = useRef(null);

  if (!currentUser) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 340, textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: serif }}>Sign in to upload</p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 16px' }}>You need an account to create CivicReels.</p>
          <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, background: C.navy, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }

  // ─── FILE PICK ──────────────────────────────────────
  function handleFilePick(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;

    setError('');

    // File type check
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, WebM).');
      return;
    }

    // File size check
    if (f.size > MAX_FILE_BYTES) {
      setError('File is too large! Maximum size is ' + MAX_FILE_MB + 'MB. Your file is ' + (f.size / 1024 / 1024).toFixed(1) + 'MB.');
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('edit');
  }

  // Get video duration
  function handleVideoLoaded() {
    if (videoPreviewRef.current) {
      setDuration(Math.round(videoPreviewRef.current.duration));
    }
  }

  // ─── ADD TEXT OVERLAY ────────────────────────────────
  function addTextOverlay() {
    if (!newText.trim()) return;
    var font = TEXT_FONTS.find(function (f) { return f.id === newTextFont; });
    var overlay = {
      id: Date.now().toString(),
      text: newText.trim(),
      x: 50, // percent
      y: 50,
      fontSize: newTextSize,
      fontFamily: font ? font.css : sans,
      color: newTextColor,
      rotation: 0,
    };
    setTextOverlays(function (prev) { return prev.concat([overlay]); });
    setNewText('');
    setShowTextPanel(false);
  }

  function removeOverlay(id) {
    setTextOverlays(function (prev) { return prev.filter(function (o) { return o.id !== id; }); });
  }

  // ─── DRAG TEXT OVERLAY ──────────────────────────────
  function handleOverlayDrag(overlayId, e) {
    e.preventDefault();
    var container = containerRef.current;
    if (!container) return;

    var startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    var startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    var overlay = textOverlays.find(function (o) { return o.id === overlayId; });
    if (!overlay) return;
    var startOx = overlay.x;
    var startOy = overlay.y;
    var rect = container.getBoundingClientRect();

    function move(ev) {
      var cx = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
      var cy = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;
      var dx = ((cx - startX) / rect.width) * 100;
      var dy = ((cy - startY) / rect.height) * 100;
      var nx = Math.max(5, Math.min(95, startOx + dx));
      var ny = Math.max(5, Math.min(95, startOy + dy));
      setTextOverlays(function (prev) {
        return prev.map(function (o) {
          return o.id === overlayId ? Object.assign({}, o, { x: nx, y: ny }) : o;
        });
      });
    }

    function up() {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', up);
    }

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', up);
  }

  // ─── UPLOAD ─────────────────────────────────────────
  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload video to storage
      var ext = file.name.split('.').pop();
      var path = 'reels/' + currentUser.id + '/' + Date.now() + '.' + ext;
      setUploadProgress(20);

      var { data: storageData, error: storageError } = await supabase.storage
        .from('civic-reels')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (storageError) throw storageError;
      setUploadProgress(60);

      // Get public URL
      var { data: urlData } = supabase.storage.from('civic-reels').getPublicUrl(path);
      var videoUrl = urlData.publicUrl;
      setUploadProgress(70);

      // Parse tags
      var tags = tagsInput
        .split(/[,\s#]+/)
        .map(function (t) { return t.trim().replace(/^#/, ''); })
        .filter(function (t) { return t.length > 0; });

      // Insert reel record
      var { data: reelData, error: reelError } = await supabase
        .from('civic_reels')
        .insert({
          user_id: currentUser.id,
          cloudflare_playback_url: videoUrl,
          video_url: videoUrl,
          caption: caption.trim(),
          tags: tags.length > 0 ? tags : null,
          filter: activeFilter !== 'none' ? activeFilter : null,
          text_overlays: textOverlays.length > 0 ? textOverlays : null,
          duration_seconds: duration,
          file_size_bytes: file.size,
          status: 'ready',
          views_count: 0,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          saves_count: 0,
        })
        .select()
        .single();

      if (reelError) throw reelError;
      setUploadProgress(100);

      setTimeout(function () {
        onUploaded();
      }, 500);
    } catch (err) {
      setError('Upload failed: ' + (err.message || 'Unknown error'));
      setUploading(false);
    }
  }

  // ─── RENDER ─────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, maxHeight: '95vh', margin: 12, background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'cvFadeIn 0.2s ease' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: 0, fontFamily: serif }}>
            {step === 'pick' ? 'New CivicReel' : step === 'edit' ? 'Edit Your Reel' : 'Uploading...'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(11,37,69,0.3)', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', borderRadius: 10, background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)' }}>
            <p style={{ fontSize: 12, color: C.red, margin: 0 }}>⚠ {error}</p>
          </div>
        )}

        {/* ─── STEP: PICK FILE ─────────────────── */}
        {step === 'pick' && (
          <div style={{ padding: 32, textAlign: 'center', flex: 1 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(197,150,12,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 36 }}>🎬</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: serif }}>Upload a Video</p>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>
              MP4, MOV, or WebM • Max {MAX_FILE_MB}MB • Up to {MAX_DURATION}s
            </p>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.3)', fontFamily: sans }}>
              📁 Choose Video
              <input type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={handleFilePick} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* ─── STEP: EDIT ──────────────────────── */}
        {step === 'edit' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Video Preview + Text Overlays */}
            <div ref={containerRef} style={{ position: 'relative', background: '#000', aspectRatio: '9/16', maxHeight: 340, margin: '0 auto', overflow: 'hidden' }}>
              <video ref={videoPreviewRef} src={preview} loop muted playsInline autoPlay
                onLoadedMetadata={handleVideoLoaded}
                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: activeFilter !== 'none' ? getFilterCSS(activeFilter) : undefined }} />

              {/* Text overlays on video */}
              {textOverlays.map(function (ov) {
                return (
                  <div key={ov.id}
                    onMouseDown={function (e) { handleOverlayDrag(ov.id, e); }}
                    onTouchStart={function (e) { handleOverlayDrag(ov.id, e); }}
                    style={{
                      position: 'absolute', left: ov.x + '%', top: ov.y + '%',
                      transform: 'translate(-50%, -50%)' + (ov.rotation ? ' rotate(' + ov.rotation + 'deg)' : ''),
                      fontSize: ov.fontSize, fontFamily: ov.fontFamily, color: ov.color,
                      fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                      cursor: 'grab', userSelect: 'none', maxWidth: '80%', textAlign: 'center',
                      padding: '4px 8px', border: '1px dashed rgba(255,255,255,0.5)', borderRadius: 4,
                      lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                    {ov.text}
                    <button onClick={function (e) { e.stopPropagation(); removeOverlay(ov.id); }}
                      style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, borderRadius: '50%', background: C.red, border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* Duration badge */}
              {duration > 0 && (
                <span style={{ position: 'absolute', bottom: 8, right: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
                </span>
              )}

              {/* File size badge */}
              {file && (
                <span style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              )}
            </div>

            {/* Filters strip */}
            <div style={{ padding: '12px 16px', overflowX: 'auto', display: 'flex', gap: 10, borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              {FILTERS.map(function (f) {
                var isActive = activeFilter === f.id;
                return (
                  <button key={f.id} onClick={function () { setActiveFilter(f.id); }}
                    style={{
                      flexShrink: 0, padding: '6px 16px', borderRadius: 20,
                      background: isActive ? C.gold : 'rgba(11,37,69,0.04)',
                      border: isActive ? '2px solid ' + C.darkGold : '2px solid transparent',
                      color: isActive ? '#fff' : C.navy,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: sans, transition: 'all 0.15s'
                    }}>
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Add Text button */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              <button onClick={function () { setShowTextPanel(!showTextPanel); }}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px dashed rgba(11,37,69,0.15)', background: showTextPanel ? 'rgba(197,150,12,0.05)' : 'transparent', color: showTextPanel ? C.gold : C.navy, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
                {showTextPanel ? '✕ Close Text Editor' : '✏️ Add Text to Video'}
              </button>

              {/* Text editor panel */}
              {showTextPanel && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: 'rgba(11,37,69,0.03)', border: '1px solid rgba(11,37,69,0.06)' }}>
                  <input value={newText} onChange={function (e) { setNewText(e.target.value); }}
                    placeholder="Type your text..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', fontSize: 14, outline: 'none', fontFamily: sans, color: C.navy, boxSizing: 'border-box', marginBottom: 10 }} />

                  {/* Font picker */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {TEXT_FONTS.map(function (f) {
                      return (
                        <button key={f.id} onClick={function () { setNewTextFont(f.id); }}
                          style={{ padding: '5px 12px', borderRadius: 8, border: newTextFont === f.id ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.1)', background: newTextFont === f.id ? C.gold + '10' : '#fff', color: C.navy, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: f.css }}>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Color picker */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                    {TEXT_COLORS.map(function (color) {
                      return (
                        <button key={color} onClick={function () { setNewTextColor(color); }}
                          style={{ width: 26, height: 26, borderRadius: '50%', background: color, border: newTextColor === color ? '3px solid ' + C.gold : '2px solid rgba(11,37,69,0.15)', cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }} />
                      );
                    })}
                  </div>

                  {/* Size slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', fontWeight: 600, minWidth: 30 }}>Size</span>
                    <input type="range" min="12" max="48" value={newTextSize}
                      onChange={function (e) { setNewTextSize(parseInt(e.target.value)); }}
                      style={{ flex: 1, accentColor: C.gold }} />
                    <span style={{ fontSize: 11, color: C.navy, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{newTextSize}</span>
                  </div>

                  <button onClick={addTextOverlay} disabled={!newText.trim()}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: newText.trim() ? C.gold : 'rgba(11,37,69,0.06)', color: newText.trim() ? '#fff' : 'rgba(11,37,69,0.3)', fontWeight: 700, fontSize: 13, cursor: newText.trim() ? 'pointer' : 'default', fontFamily: sans }}>
                    Add Text
                  </button>
                </div>
              )}
            </div>

            {/* Caption + Tags */}
            <div style={{ padding: '14px 16px' }}>
              <textarea value={caption} onChange={function (e) { setCaption(e.target.value); }}
                placeholder="Write a caption..."
                rows={2}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', fontFamily: sans, color: C.navy, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />

              <input value={tagsInput} onChange={function (e) { setTagsInput(e.target.value); }}
                placeholder="Add hashtags: CivicDuty, VoteReady, LocalGov"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', fontFamily: sans, color: C.navy, boxSizing: 'border-box' }} />
              <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0' }}>Separate with commas or spaces</p>
            </div>
          </div>
        )}

        {/* ─── STEP: POSTING ───────────────────── */}
        {step === 'edit' && uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', border: '4px solid rgba(11,37,69,0.08)', borderTopColor: C.gold, animation: 'cvSpin 0.8s linear infinite', marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: serif }}>Uploading...</p>
            <div style={{ width: 200, height: 6, borderRadius: 3, background: 'rgba(11,37,69,0.06)', overflow: 'hidden' }}>
              <div style={{ width: uploadProgress + '%', height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, ' + C.gold + ', ' + C.darkGold + ')', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: '6px 0 0' }}>{uploadProgress}%</p>
          </div>
        )}

        {/* Bottom actions */}
        {step === 'edit' && !uploading && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', gap: 10 }}>
            <button onClick={function () { setStep('pick'); setFile(null); setPreview(''); setTextOverlays([]); setActiveFilter('none'); setError(''); }}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(11,37,69,0.1)', background: '#fff', color: C.navy, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
              ← Back
            </button>
            <button onClick={handleUpload}
              style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: sans, boxShadow: '0 4px 16px rgba(197,150,12,0.3)' }}>
              🚀 Post Reel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
