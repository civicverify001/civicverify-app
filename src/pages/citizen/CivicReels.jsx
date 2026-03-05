// src/pages/citizen/CivicReels.jsx — Original file with TikTok-style 9:16 recording frame (minimal change)
// NOTE: This keeps your original logic. The ONLY functional change is:
// - Recording preview container is now 9:16 (TikTok frame) using aspectRatio + objectFit: cover
// - getUserMedia now REQUESTS 9:16 via aspectRatio (not guaranteed on iOS, but helps)
// Everything else stays the same as your original file.

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#a07a0a', cream: '#F5F1EC', green: '#16a34a', red: '#ef4444' };
var sans = 'DM Sans, sans-serif';
var serif = 'Libre Baskerville, Georgia, serif';
var PAGE = 5;
var MAX_FILE_MB = 50;
var MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
var MAX_DURATION_SEC = 120;

var TRENDING_TAGS = ['LocalGov', 'ClimateAction', 'CivicDuty', 'VoteReady', 'PublicSafety', 'Education', 'Housing', 'Healthcare'];

var TEXT_FONTS = [
  { id: 'sans', label: 'Sans', css: 'DM Sans, sans-serif' },
  { id: 'serif', label: 'Serif', css: 'Libre Baskerville, Georgia, serif' },
  { id: 'mono', label: 'Mono', css: 'Courier New, monospace' },
  { id: 'display', label: 'Display', css: 'Impact, Haettenschweiler, sans-serif' },
  { id: 'hand', label: 'Hand', css: 'Brush Script MT, cursive' },
];
var TEXT_COLORS = ['#FFFFFF', '#000000', '#C5960C', '#FF3B30', '#34C759', '#007AFF', '#AF52DE', '#FF9500', '#FF2D55'];

function timeAgo(d) {
  var diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function HeartBurst({ x, y, onDone }) {
  useEffect(function () { var t = setTimeout(onDone, 900); return function () { clearTimeout(t); }; }, []);
  return (
    <div style={{ position: 'absolute', left: x - 40, top: y - 40, pointerEvents: 'none', zIndex: 50 }}>
      <span style={{ fontSize: 80, animation: 'heartBurst 0.8s ease-out forwards', display: 'block' }}>❤️</span>
    </div>
  );
}

var VIDEO_FILTERS = {
  none: { label: 'Original', css: 'none' },
  warm: { label: 'Warm', css: 'saturate(1.2) sepia(0.15) brightness(1.05)' },
  cool: { label: 'Cool', css: 'saturate(0.9) hue-rotate(15deg) brightness(1.05)' },
  vintage: { label: 'Vintage', css: 'sepia(0.35) contrast(1.1) brightness(0.95) saturate(1.3)' },
  bw: { label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  vivid: { label: 'Vivid', css: 'saturate(1.6) contrast(1.1) brightness(1.05)' },
  cinematic: { label: 'Cinema', css: 'contrast(1.2) brightness(0.95) saturate(0.85)' },
  golden: { label: 'Golden', css: 'sepia(0.25) saturate(1.4) brightness(1.05) hue-rotate(-10deg)' },
};

// ─── Single Reel Card ─────────────────────────────────────────────────────
function ReelCard({ reel, isVisible, currentUser, onLike, onComment, onShare, onView, onFollow, onSave, onDelete, index }) {
  var videoRef = useRef(null);
  var [paused, setPaused] = useState(false);
  var [hearts, setHearts] = useState([]);
  var [showComments, setShowComments] = useState(false);
  var [comments, setComments] = useState([]);
  var [commentInput, setCommentInput] = useState('');
  var [loadingComments, setLoadingComments] = useState(false);
  var [sendingComment, setSendingComment] = useState(false);
  var [commentUsers, setCommentUsers] = useState({});
  var lastTap = useRef(0);
  var viewCounted = useRef(false);

  useEffect(function () {
    if (!videoRef.current) return;
    if (isVisible) {
      videoRef.current.play().catch(function () { });
      setPaused(false);
      if (!viewCounted.current) {
        var timer = setTimeout(function () {
          if (!viewCounted.current) { viewCounted.current = true; onView(reel.id); }
        }, 3000);
        return function () { clearTimeout(timer); };
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isVisible]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPaused(false); }
    else { videoRef.current.pause(); setPaused(true); }
  }

  function handleTap(e) {
    var now = Date.now();
    if (now - lastTap.current < 300) {
      var rect = e.currentTarget.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      setHearts(function (p) { return p.concat([{ id: Date.now(), x: x, y: y }]); });
      if (!reel.user_liked) onLike(reel.id);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(function () {
        if (lastTap.current === now) togglePlay();
      }, 300);
    }
  }

  async function loadComments() {
    setLoadingComments(true);
    var { data } = await supabase.from('civic_reel_comments').select('*').eq('reel_id', reel.id).order('created_at', { ascending: true }).limit(100);
    if (data) {
      setComments(data);
      var uids = Array.from(new Set(data.map(function (c) { return c.user_id; })));
      var unknowns = uids.filter(function (uid) { return !commentUsers[uid]; });
      if (unknowns.length > 0) {
        var { data: users } = await supabase.from('users').select('id, full_name, username, identity_verified').in('id', unknowns);
        if (users) {
          var map = Object.assign({}, commentUsers);
          users.forEach(function (u) { map[u.id] = u; });
          setCommentUsers(map);
        }
      }
    }
    setLoadingComments(false);
  }

  async function sendComment() {
    if (!commentInput.trim() || !currentUser || sendingComment) return;
    setSendingComment(true);
    var { data } = await supabase.from('civic_reel_comments').insert({ reel_id: reel.id, user_id: currentUser.id, content: commentInput.trim() }).select().single();
    if (data) {
      setComments(function (p) { return p.concat([data]); });
      if (!commentUsers[currentUser.id]) {
        var { data: u } = await supabase.from('users').select('id, full_name, username, identity_verified').eq('id', currentUser.id).single();
        if (u) setCommentUsers(function (p) { return Object.assign({}, p, { [u.id]: u }); });
      }
      onComment(reel.id);
    }
    setCommentInput('');
    setSendingComment(false);
  }

  function openComments() { setShowComments(true); loadComments(); }

  var videoUrl = reel.cloudflare_playback_url || reel.video_url;

  var overlays = [];
  try { overlays = reel.text_overlays ? (typeof reel.text_overlays === 'string' ? JSON.parse(reel.text_overlays) : reel.text_overlays) : []; } catch (e) { }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      scrollSnapAlign: 'start', background: '#000', overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Video */}
      <video
        ref={videoRef} src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: reel.filter && VIDEO_FILTERS[reel.filter] ? VIDEO_FILTERS[reel.filter].css : 'none' }}
        loop muted={false} playsInline onClick={handleTap}
      />

      {/* Text overlays */}
      {overlays.map(function (ov, oi) {
        return (
          <div key={oi} style={{
            position: 'absolute', left: (ov.x || 50) + '%', top: (ov.y || 50) + '%',
            transform: 'translate(-50%, -50%)' + (ov.rotation ? ' rotate(' + ov.rotation + 'deg)' : ''),
            fontSize: ov.fontSize || 24, fontFamily: ov.fontFamily || sans,
            color: ov.color || '#fff', fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none', maxWidth: '80%', textAlign: 'center',
            lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {ov.text}
          </div>
        );
      })}

      {/* Pause icon */}
      {paused && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 28, color: '#fff', marginLeft: 4 }}>▶</span>
          </div>
        </div>
      )}

      {/* Delete button — own reels only */}
      {currentUser && reel.user_id === currentUser.id && onDelete && (
        <button
          className="cv-reel-delete-btn"
          onClick={function (e) { e.stopPropagation(); if (window.confirm('Delete this reel? This cannot be undone.')) onDelete(reel.id); }}
          style={{ position: 'absolute', top: 150, right: 14, zIndex: 25, width: 38, height: 38, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.2s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
          </svg>
        </button>
      )}

      {/* Stats banner for own reels */}
      {currentUser && reel.user_id === currentUser.id && (
        <div className="cv-reel-stats" style={{ position: 'absolute', top: 150, left: 14, right: 60, zIndex: 25, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, padding: '5px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>❤️ {formatCount(reel.likes_count)}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>👁 {formatCount(reel.views_count)}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>🔗 {formatCount(reel.shares_count)}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>💬 {formatCount(reel.comments_count)}</span>
          </div>
        </div>
      )}

      {/* Heart burst animations */}
      {hearts.map(function (h) {
        return <HeartBurst key={h.id} x={h.x} y={h.y} onDone={function () { setHearts(function (p) { return p.filter(function (x) { return x.id !== h.id; }); }); }} />;
      })}

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', pointerEvents: 'none' }} />

      {/* Author info — bottom left */}
      <div className="cv-reel-author" style={{ position: 'absolute', bottom: 16, left: 16, right: 72, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            onClick={function (e) { e.stopPropagation(); }}>
            {(reel.author_name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {reel.author_name || 'Citizen'}
              {reel.author_verified && <span style={{ marginLeft: 6, fontSize: 10, background: C.green, color: '#fff', padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>✓</span>}
            </p>
            {reel.author_username && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>@{reel.author_username}</p>
            )}
          </div>
          {currentUser && reel.user_id !== currentUser.id && (
            <button onClick={function (e) { e.stopPropagation(); onFollow(reel.user_id, reel.id); }}
              style={{ padding: '5px 14px', borderRadius: 20, border: reel.is_following ? '1.5px solid rgba(255,255,255,0.4)' : 'none', background: reel.is_following ? 'transparent' : C.gold, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: sans, marginLeft: 4, textShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
              {reel.is_following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {reel.caption && (
          <p style={{ fontSize: 13, color: '#fff', margin: '0 0 6px', lineHeight: 1.4, textShadow: '0 1px 4px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {reel.caption}
          </p>
        )}
        {reel.tags && reel.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {reel.tags.slice(0, 4).map(function (tag) {
              return <span key={tag} style={{ fontSize: 11, color: C.gold, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>#{tag}</span>;
            })}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="cv-reel-sidebar" style={{ position: 'absolute', right: 12, bottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, zIndex: 30 }}>
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', fontSize: 18, fontWeight: 700, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {(reel.author_name || '?').charAt(0).toUpperCase()}
          </div>
          {currentUser && reel.user_id !== currentUser.id && !reel.is_following && (
            <button onClick={function (e) { e.stopPropagation(); onFollow(reel.user_id, reel.id); }}
              style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', border: '2px solid #fff', background: C.gold, color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1, padding: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
              +
            </button>
          )}
          {reel.is_following && (
            <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', border: '2px solid #fff', background: C.green, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
              ✓
            </div>
          )}
        </div>

        <button onClick={function (e) { e.stopPropagation(); onLike(reel.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', transition: 'transform 0.2s' }}>
            <span style={{ fontSize: 22 }}>{reel.user_liked ? '❤️' : '🤍'}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.likes_count)}</span>
        </button>

        <button onClick={function (e) { e.stopPropagation(); openComments(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 22 }}>💬</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.comments_count)}</span>
        </button>

        <button onClick={function (e) { e.stopPropagation(); onShare(reel); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
              <path d="M13.47 2.47a.75.75 0 011.06 0l6 6a.75.75 0 010 1.06l-6 6a.75.75 0 11-1.06-1.06l4.72-4.72H10a6.75 6.75 0 00-6.75 6.75v1.5a.75.75 0 01-1.5 0v-1.5A8.25 8.25 0 0110 8.25h8.19l-4.72-4.72a.75.75 0 010-1.06z" />
            </svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.shares_count)}</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 22 }}>👁</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.views_count)}</span>
        </div>

        <button onClick={function (e) { e.stopPropagation(); onSave(reel.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: reel.user_saved ? 'rgba(197,150,12,0.3)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={reel.user_saved ? C.gold : 'none'} stroke={reel.user_saved ? C.gold : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: reel.user_saved ? C.gold : '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{reel.user_saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Comments bottom sheet */}
      {showComments && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, zIndex: 60 }} onClick={function () { setShowComments(false); }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div onClick={function (e) { e.stopPropagation(); }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '65%', background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', animation: 'slideSheetUp 0.3s ease' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Comments ({reel.comments_count || 0})</p>
              <button onClick={function () { setShowComments(false); }} style={{ background: 'none', border: 'none', fontSize: 18, color: 'rgba(11,37,69,0.4)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <div style={{ width: 24, height: 24, border: '2px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto' }} />
                </div>
              ) : comments.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(11,37,69,0.4)', fontSize: 13, padding: 30 }}>No comments yet. Be the first!</p>
              ) : comments.map(function (c) {
                var u = commentUsers[c.user_id];
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, ' + C.navy + ', #163a64)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.gold }}>
                      {(u ? u.full_name : '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{u ? u.full_name : '...'}</span>
                        {u && u.username && <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.4)' }}>@{u.username}</span>}
                        {u && u.identity_verified && <span style={{ fontSize: 8, color: C.green, fontWeight: 700 }}>✓</span>}
                        <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(c.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.4 }}>{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {currentUser ? (
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(11,37,69,0.06)',
                display: 'flex', gap: 8,
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              }}>
                <input value={commentInput} onChange={function (e) { setCommentInput(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === 'Enter') sendComment(); }}
                  placeholder="Add a comment..." maxLength={500}
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 24, border: '1px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans }} />
                <button onClick={sendComment} disabled={!commentInput.trim() || sendingComment}
                  style={{ padding: '11px 18px', borderRadius: 24, border: 'none', fontSize: 13, fontWeight: 700, background: commentInput.trim() ? C.gold : 'rgba(11,37,69,0.06)', color: commentInput.trim() ? '#fff' : 'rgba(11,37,69,0.3)', cursor: commentInput.trim() ? 'pointer' : 'default', fontFamily: sans }}>
                  Post
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Sign in to comment</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────
function UploadModal({ currentUser, profile, onClose, onUploaded }) {
  var [mode, setMode] = useState(null);
  var [file, setFile] = useState(null);
  var [preview, setPreview] = useState(null);
  var [caption, setCaption] = useState('');
  var [tags, setTags] = useState('');
  var [postToCommunity, setPostToCommunity] = useState(false);
  var [uploading, setUploading] = useState(false);
  var [progress, setProgress] = useState(0);
  var [error, setError] = useState(null);
  var [selectedFilter, setSelectedFilter] = useState('none');

  var [textOverlays, setTextOverlays] = useState([]);
  var [showTextPanel, setShowTextPanel] = useState(false);
  var [newText, setNewText] = useState('');
  var [newTextFont, setNewTextFont] = useState('sans');
  var [newTextColor, setNewTextColor] = useState('#FFFFFF');
  var [newTextSize, setNewTextSize] = useState(24);
  var overlayContainerRef = useRef(null);

  var [recording, setRecording] = useState(false);
  var [recordTime, setRecordTime] = useState(0);
  var [stream, setStream] = useState(null);
  var [facingMode, setFacingMode] = useState('user');
  var videoPreviewRef = useRef(null);
  var mediaRecorderRef = useRef(null);
  var chunksRef = useRef([]);
  var timerRef = useRef(null);

  async function startCamera(facing) {
    try {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      // ▼ CHANGE: request 9:16 like TikTok (not guaranteed on iOS but helps a lot)
      var s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          aspectRatio: { ideal: 9 / 16 },
          frameRate: { ideal: 30 },
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: true
      });
      setStream(s);
      if (videoPreviewRef.current) { videoPreviewRef.current.srcObject = s; videoPreviewRef.current.play(); }
    } catch (e) { setError('Camera access denied. Please allow camera and microphone permissions.'); }
  }

  function startRecording() {
    if (!stream) return;
    chunksRef.current = [];
    var mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    mr.ondataavailable = function (e) { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = function () {
      var blob = new Blob(chunksRef.current, { type: 'video/webm' });
      var f = new File([blob], 'reel-' + Date.now() + '.webm', { type: 'video/webm' });
      setFile(f); setPreview(URL.createObjectURL(blob));
      stream.getTracks().forEach(function (t) { t.stop(); }); setStream(null);
    };
    mr.start(1000); mediaRecorderRef.current = mr; setRecording(true); setRecordTime(0);
    timerRef.current = setInterval(function () {
      setRecordTime(function (t) { if (t >= 119) { stopRecording(); return 120; } return t + 1; });
    }, 1000);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function flipCamera() {
    var newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing); startCamera(newFacing);
  }

  function handleFileSelect(e) {
    var f = e.target.files[0];
    if (!f) return;
    setError(null);
    if (!f.type.startsWith('video/')) { setError('Please select a video file (MP4, MOV, WebM).'); return; }
    if (f.size > MAX_FILE_BYTES) {
      setError('File too large! Max ' + MAX_FILE_MB + 'MB. Yours is ' + (f.size / 1024 / 1024).toFixed(1) + 'MB.');
      return;
    }
    var v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = function () {
      if (v.duration > MAX_DURATION_SEC) { setError('Video must be under 2 minutes. Yours is ' + Math.round(v.duration) + 's.'); URL.revokeObjectURL(v.src); return; }
      setFile(f); setPreview(URL.createObjectURL(f));
    };
    v.src = URL.createObjectURL(f);
  }

  function addTextOverlay() {
    if (!newText.trim()) return;
    var fontObj = TEXT_FONTS.find(function (f) { return f.id === newTextFont; });
    setTextOverlays(function (prev) {
      return prev.concat([{ id: Date.now().toString(), text: newText.trim(), x: 50, y: 50, fontSize: newTextSize, fontFamily: fontObj ? fontObj.css : sans, color: newTextColor, rotation: 0 }]);
    });
    setNewText(''); setShowTextPanel(false);
  }

  function removeOverlay(id) { setTextOverlays(function (prev) { return prev.filter(function (o) { return o.id !== id; }); }); }

  function handleOverlayDrag(overlayId, e) {
    e.preventDefault();
    var container = overlayContainerRef.current;
    if (!container) return;
    var startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    var startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    var overlay = textOverlays.find(function (o) { return o.id === overlayId; });
    if (!overlay) return;
    var startOx = overlay.x; var startOy = overlay.y;
    var rect = container.getBoundingClientRect();
    function move(ev) {
      var cx = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
      var cy = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;
      var nx = Math.max(5, Math.min(95, startOx + ((cx - startX) / rect.width) * 100));
      var ny = Math.max(5, Math.min(95, startOy + ((cy - startY) / rect.height) * 100));
      setTextOverlays(function (prev) { return prev.map(function (o) { return o.id === overlayId ? Object.assign({}, o, { x: nx, y: ny }) : o; }); });
    }
    function up() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); }
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', up);
  }

  async function handleUpload() {
    if (!file || !currentUser || uploading) return;
    setUploading(true); setProgress(10); setError(null);
    try {
      var ext = file.name.split('.').pop();
      var fileName = currentUser.id + '/' + Date.now() + '.' + ext;
      setProgress(20);
      var { data: uploadData, error: uploadError } = await supabase.storage.from('civic-reels').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      setProgress(75);
      var { data: urlData } = supabase.storage.from('civic-reels').getPublicUrl(fileName);
      var videoUrl = urlData.publicUrl;
      var duration = await new Promise(function (resolve) {
        var v = document.createElement('video'); v.preload = 'metadata';
        v.onloadedmetadata = function () { resolve(Math.round(v.duration)); URL.revokeObjectURL(v.src); };
        v.onerror = function () { resolve(0); };
        v.src = URL.createObjectURL(file);
      });
      setProgress(85);
      var parsedTags = tags.split(/[\s,#]+/).filter(function (t) { return t.trim(); }).map(function (t) { return t.trim().toLowerCase(); });
      var { data: reel, error: reelError } = await supabase.from('civic_reels').insert({
        user_id: currentUser.id,
        cloudflare_video_id: 'local-' + Date.now(),
        cloudflare_playback_url: videoUrl,
        cloudflare_thumbnail_url: videoUrl,
        caption: caption.trim() || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        duration_seconds: duration,
        status: 'ready',
        is_community_post: postToCommunity,
        filter: selectedFilter !== 'none' ? selectedFilter : null,
        text_overlays: textOverlays.length > 0 ? textOverlays : null,
        file_size_bytes: file.size,
      }).select().single();
      if (reelError) throw reelError;
      if (postToCommunity) {
        await supabase.from('community_posts').insert({
          user_id: currentUser.id,
          content: (caption.trim() || 'Shared a CivicReel') + (parsedTags.length > 0 ? ' ' + parsedTags.map(function (t) { return '#' + t; }).join(' ') : ''),
          video_url: videoUrl,
        });
      }
      setProgress(100);
      setTimeout(function () { onUploaded(); }, 500);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  }

  function resetUpload() {
    setFile(null); setPreview(null); setError(null); setProgress(0); setTextOverlays([]);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); setStream(null); }
  }

  useEffect(function () {
    return function () {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        maxHeight: 'calc(100vh - env(safe-area-inset-top, 44px) - 8px)',
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: 'rgba(11,37,69,0.12)' }} />
          <p style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: 0, fontFamily: serif }}>
            {file ? 'Post Your Reel' : mode === 'record' ? 'Record' : 'Create CivicReel'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(11,37,69,0.4)', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '20px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 160px)',
        }}>
          {/* Mode selection */}
          {!mode && !file && (
            <div style={{ display: 'grid', gap: 12 }}>
              <button onClick={function () { setMode('gallery'); }}
                style={{ padding: '28px 20px', borderRadius: 16, border: '2px dashed rgba(197,150,12,0.3)', background: 'linear-gradient(135deg, rgba(197,150,12,0.04), rgba(197,150,12,0.08))', cursor: 'pointer', textAlign: 'center', fontFamily: sans }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📁</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, display: 'block' }}>Upload from Gallery</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>MP4, MOV, WebM · Max 2 min · {MAX_FILE_MB}MB</span>
              </button>

              <button onClick={function () { setMode('record'); startCamera('user'); }}
                style={{ padding: '28px 20px', borderRadius: 16, border: '2px dashed rgba(22,163,74,0.3)', background: 'linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.08))', cursor: 'pointer', textAlign: 'center', fontFamily: sans }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🎥</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, display: 'block' }}>Record Video</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>Use your camera · Max 2 minutes</span>
              </button>
            </div>
          )}

          {/* Gallery file picker */}
          {mode === 'gallery' && !file && (
            <div>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', borderRadius: 16, border: '2px dashed rgba(197,150,12,0.3)', background: 'rgba(197,150,12,0.04)', cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 48, marginBottom: 12 }}>🎬</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Tap to select video</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', marginTop: 4 }}>Max {MAX_FILE_MB}MB · MP4, MOV, WebM</span>
                <input type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              {error && <p style={{ fontSize: 12, color: C.red, margin: '10px 0 0', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)' }}>⚠ {error}</p>}
              <button onClick={function () { setMode(null); setError(null); }} style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 13, color: 'rgba(11,37,69,0.5)', cursor: 'pointer', fontFamily: sans }}>← Back</button>
            </div>
          )}

          {/* Camera recording */}
          {mode === 'record' && !file && (
            <div>
              {/* ▼ CHANGE: TikTok 9:16 frame */}
              <div style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#000',
                width: '100%',
                aspectRatio: '9 / 16',
                maxHeight: '55vh'
              }}>
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />
                {recording && (
                  <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.9)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'liveDot 1s ease-in-out infinite' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                      {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')} / 2:00
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 16 }}>
                <button onClick={function () { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); setStream(null); } setMode(null); }}
                  style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(11,37,69,0.08)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                {!recording ? (
                  <button onClick={startRecording}
                    style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid ' + C.red, background: C.red, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }} />
                ) : (
                  <button onClick={stopRecording}
                    style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid ' + C.red, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: C.red }} />
                  </button>
                )}
                <button onClick={flipCamera} disabled={recording}
                  style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(11,37,69,0.08)', cursor: 'pointer', fontSize: 18 }}>🔄</button>
              </div>
            </div>
          )}

          {/* Preview + details */}
          {file && preview && (
            <div>
              <div ref={overlayContainerRef} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
                <video src={preview} controls style={{ width: '100%', maxHeight: 280, objectFit: 'contain', filter: VIDEO_FILTERS[selectedFilter] ? VIDEO_FILTERS[selectedFilter].css : 'none' }} />
                {textOverlays.map(function (ov) {
                  return (
                    <div key={ov.id}
                      onMouseDown={function (e) { handleOverlayDrag(ov.id, e); }}
                      onTouchStart={function (e) { handleOverlayDrag(ov.id, e); }}
                      style={{
                        position: 'absolute', left: ov.x + '%', top: ov.y + '%',
                        transform: 'translate(-50%, -50%)', fontSize: ov.fontSize,
                        fontFamily: ov.fontFamily, color: ov.color, fontWeight: 700,
                        textShadow: '0 2px 8px rgba(0,0,0,0.7)', cursor: 'grab', userSelect: 'none',
                        maxWidth: '80%', textAlign: 'center', padding: '4px 8px',
                        border: '1px dashed rgba(255,255,255,0.5)', borderRadius: 4,
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
                <span style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <button onClick={resetUpload} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Filter picker */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 8, display: 'block' }}>Filter</label>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {Object.entries(VIDEO_FILTERS).map(function (entry) {
                    var key = entry[0], f = entry[1]; var active = selectedFilter === key;
                    return (
                      <button key={key} onClick={function () { setSelectedFilter(key); }}
                        style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, border: active ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.1)', background: active ? 'rgba(197,150,12,0.1)' : '#fff', cursor: 'pointer', fontFamily: sans, fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.gold : C.navy, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text overlay panel */}
              <div style={{ marginBottom: 14 }}>
                <button onClick={function () { setShowTextPanel(!showTextPanel); }}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px dashed rgba(11,37,69,0.15)', background: showTextPanel ? 'rgba(197,150,12,0.05)' : 'transparent', color: showTextPanel ? C.gold : C.navy, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
                  {showTextPanel ? '✕ Close Text Editor' : '✏️ Add Text to Video'}
                </button>
                {showTextPanel && (
                  <div style={{ marginTop: 10, padding: 14, borderRadius: 12, background: 'rgba(11,37,69,0.03)', border: '1px solid rgba(11,37,69,0.06)' }}>
                    <input value={newText} onChange={function (e) { setNewText(e.target.value); }}
                      placeholder="Type your text..." maxLength={100}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', fontSize: 14, outline: 'none', fontFamily: sans, color: C.navy, boxSizing: 'border-box', marginBottom: 10 }} />
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
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                      {TEXT_COLORS.map(function (color) {
                        return (
                          <button key={color} onClick={function () { setNewTextColor(color); }}
                            style={{ width: 26, height: 26, borderRadius: '50%', background: color, border: newTextColor === color ? '3px solid ' + C.gold : '2px solid rgba(11,37,69,0.15)', cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }} />
                        );
                      })}
                    </div>
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

              {/* Caption */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6, display: 'block' }}>Caption</label>
                <textarea value={caption} onChange={function (e) { setCaption(e.target.value); }}
                  placeholder="What's this about?" maxLength={300}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(11,37,69,0.08)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans, minHeight: 60, resize: 'vertical', boxSizing: 'border-box' }} />
                <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0', textAlign: 'right' }}>{caption.length}/300</p>
              </div>

              {/* Hashtags */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6, display: 'block' }}>Hashtags</label>
                <input value={tags} onChange={function (e) { setTags(e.target.value); }}
                  placeholder="climate, education, policy"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(11,37,69,0.08)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans, boxSizing: 'border-box' }} />
              </div>

              {/* Post to community */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(11,37,69,0.03)', cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" checked={postToCommunity} onChange={function (e) { setPostToCommunity(e.target.checked); }} style={{ width: 18, height: 18, accentColor: C.gold }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Also post to Community feed</span>
                  <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', display: 'block' }}>Share with the Community tab too</span>
                </div>
              </label>

              {uploading && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(11,37,69,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: '6px 0 0', textAlign: 'center' }}>{progress < 100 ? 'Uploading... ' + progress + '%' : '✓ Complete!'}</p>
                </div>
              )}

              {error && <p style={{ fontSize: 12, color: C.red, margin: '0 0 12px', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)' }}>⚠ {error}</p>}

              <button onClick={handleUpload} disabled={uploading}
                style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, background: uploading ? 'rgba(11,37,69,0.08)' : 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: uploading ? 'rgba(11,37,69,0.3)' : '#fff', cursor: uploading ? 'default' : 'pointer', fontFamily: sans, boxShadow: uploading ? 'none' : '0 4px 16px rgba(197,150,12,0.3)' }}>
                {uploading ? 'Posting...' : '🎬 Post CivicReel'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main CivicReels Page ──────────────────────────────────────────────────
export default function CivicReels() {
  var navigate = useNavigate();
  var auth = useAuth();
  var currentUser = auth.user;
  var profile = auth.profile;

  var [reels, setReels] = useState([]);
  var [loading, setLoading] = useState(true);
  var [visibleIndex, setVisibleIndex] = useState(0);
  var [showUpload, setShowUpload] = useState(false);
  var [hasMore, setHasMore] = useState(true);
  var [feedMode, setFeedMode] = useState('foryou');
  var [searchTag, setSearchTag] = useState('');
  var feedRef = useRef(null);
  var observerRef = useRef(null);

  var loadReels = useCallback(async function (offset) {
    var from = offset || 0;
    if (searchTag) {
      var { data } = await supabase
        .from('civic_reels')
        .select('*, users:user_id(full_name, username, identity_verified, followers_count)')
        .eq('status', 'ready')
        .contains('tags', [searchTag.toLowerCase()])
        .order('views_count', { ascending: false })
        .range(from, from + PAGE - 1);
      if (data) {
        var enriched = data.map(function (r) {
          return Object.assign({}, r, { author_name: r.users ? r.users.full_name : null, author_username: r.users ? r.users.username : null, author_verified: r.users ? r.users.identity_verified : false, author_followers_count: r.users ? r.users.followers_count || 0 : 0, video_url: r.cloudflare_playback_url, user_liked: false, is_following: false, user_saved: false });
        });
        if (from === 0) setReels(enriched); else setReels(function (prev) { return prev.concat(enriched); });
        setHasMore(data.length === PAGE);
      }
      setLoading(false);
      return;
    }

    var { data } = await supabase
      .from('civic_reels')
      .select('*, users:user_id(full_name, username, identity_verified, followers_count)')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);

    if (data) {
      var enriched = data.map(function (r) {
        return Object.assign({}, r, { author_name: r.users ? r.users.full_name : null, author_username: r.users ? r.users.username : null, author_verified: r.users ? r.users.identity_verified : false, author_followers_count: r.users ? r.users.followers_count || 0 : 0, video_url: r.cloudflare_playback_url, user_liked: false, is_following: false, user_saved: false });
      });

      if (currentUser) {
        var reelIds = enriched.map(function (r) { return r.id; });
        var creatorIds = Array.from(new Set(enriched.map(function (r) { return r.user_id; })));
        var { data: likes } = await supabase.from('civic_reel_likes').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds);
        if (likes) { var likedSet = {}; likes.forEach(function (l) { likedSet[l.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_liked: !!likedSet[r.id] }); }); }
        var { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', currentUser.id).in('following_id', creatorIds);
        if (follows) { var followSet = {}; follows.forEach(function (f) { followSet[f.following_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { is_following: !!followSet[r.user_id] }); }); }
        var { data: saves } = await supabase.from('civic_reel_saves').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds);
        if (saves) { var saveSet = {}; saves.forEach(function (s) { saveSet[s.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_saved: !!saveSet[r.id] }); }); }
      }
      if (from === 0) setReels(enriched); else setReels(function (prev) { return prev.concat(enriched); });
      setHasMore(data.length === PAGE);
    }
    setLoading(false);
  }, [currentUser, searchTag]);

  useEffect(function () {
    if (!feedRef.current) return;
    var options = { root: feedRef.current, threshold: 0.6 };
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = parseInt(entry.target.getAttribute('data-index'));
          setVisibleIndex(idx);
          if (idx >= reels.length - 2 && hasMore) {
            if (feedMode === 'saved') loadSavedReels(reels.length);
            else if (feedMode === 'myreels') loadMyReels(reels.length);
            else if (feedMode === 'following') loadFollowingReels(reels.length);
            else loadReels(reels.length);
          }
        }
      });
    }, options);
    observerRef.current = observer;
    var cards = feedRef.current.querySelectorAll('[data-index]');
    cards.forEach(function (card) { observer.observe(card); });
    return function () { observer.disconnect(); };
  }, [reels.length, hasMore, feedMode]);

  async function handleLike(reelId) {
    if (!currentUser) return;
    var { data: liked } = await supabase.rpc('toggle_reel_like', { p_reel_id: reelId, p_user_id: currentUser.id });
    setReels(function (prev) {
      return prev.map(function (r) {
        if (r.id !== reelId) return r;
        return Object.assign({}, r, { user_liked: liked, likes_count: liked ? r.likes_count + 1 : Math.max(0, r.likes_count - 1) });
      });
    });
  }

  function handleComment(reelId) {
    setReels(function (prev) { return prev.map(function (r) { return r.id !== reelId ? r : Object.assign({}, r, { comments_count: (r.comments_count || 0) + 1 }); }); });
  }

  function handleShare(reel) {
    var url = window.location.origin + '/citizen/reels/' + reel.id;
    var text = (reel.caption || 'Check out this CivicReel') + ' — CivicVerify';
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: text, url: url });
    } else { navigator.clipboard.writeText(url); alert('Link copied!'); }
    supabase.from('civic_reels').update({ shares_count: (reel.shares_count || 0) + 1 }).eq('id', reel.id).then(function () { });
    setReels(function (prev) { return prev.map(function (r) { return r.id !== reel.id ? r : Object.assign({}, r, { shares_count: (r.shares_count || 0) + 1 }); }); });
  }

  function handleView(reelId) {
    try {
      var current = (reels.find(function (r) { return r.id === reelId; }) || {}).views_count || 0;
      supabase.from('civic_reels').update({ views_count: current + 1 }).eq('id', reelId).then(function () { });
    } catch (e) { }
  }

  async function handleFollow(targetUserId) {
    if (!currentUser || targetUserId === currentUser.id) return;
    var { data: isNowFollowing } = await supabase.rpc('toggle_follow', { p_follower: currentUser.id, p_following: targetUserId });
    setReels(function (prev) {
      return prev.map(function (r) {
        if (r.user_id !== targetUserId) return r;
        return Object.assign({}, r, { is_following: isNowFollowing, author_followers_count: isNowFollowing ? (r.author_followers_count || 0) + 1 : Math.max(0, (r.author_followers_count || 0) - 1) });
      });
    });
  }

  async function handleSave(reelId) {
    if (!currentUser) return;
    var reel = reels.find(function (r) { return r.id === reelId; });
    var isSaved = reel && reel.user_saved;
    if (isSaved && feedMode === 'saved') { setReels(function (prev) { return prev.filter(function (r) { return r.id !== reelId; }); }); }
    else { setReels(function (prev) { return prev.map(function (r) { return r.id !== reelId ? r : Object.assign({}, r, { user_saved: !isSaved }); }); }); }
    if (isSaved) { await supabase.from('civic_reel_saves').delete().eq('reel_id', reelId).eq('user_id', currentUser.id); }
    else { await supabase.from('civic_reel_saves').upsert({ reel_id: reelId, user_id: currentUser.id }, { onConflict: 'reel_id,user_id' }); }
  }

  var loadSavedReels = useCallback(async function (offset) {
    if (!currentUser) return; setLoading(true); var from = offset || 0;
    var { data } = await supabase.from('civic_reel_saves').select('reel_id, civic_reels:reel_id(*, users:user_id(full_name, username, identity_verified, followers_count))').eq('user_id', currentUser.id).order('created_at', { ascending: false }).range(from, from + PAGE - 1);
    if (data) {
      var enriched = data.filter(function (s) { return s.civic_reels; }).map(function (s) { var r = s.civic_reels; return Object.assign({}, r, { author_name: r.users ? r.users.full_name : null, author_username: r.users ? r.users.username : null, author_verified: r.users ? r.users.identity_verified : false, author_followers_count: r.users ? r.users.followers_count || 0 : 0, video_url: r.cloudflare_playback_url, user_saved: true }); });
      var reelIds = enriched.map(function (r) { return r.id; });
      if (reelIds.length > 0) { var { data: likes } = await supabase.from('civic_reel_likes').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds); if (likes) { var likeSet = {}; likes.forEach(function (l) { likeSet[l.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_liked: !!likeSet[r.id] }); }); } }
      if (from === 0) setReels(enriched); else setReels(function (prev) { return prev.concat(enriched); });
      setHasMore(data.length === PAGE);
    } setLoading(false);
  }, [currentUser]);

  var loadFollowingReels = useCallback(async function (offset) {
    if (!currentUser) return; setLoading(true); var from = offset || 0;
    var { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', currentUser.id);
    var followIds = (follows || []).map(function (f) { return f.following_id; });
    if (followIds.length === 0) { setReels([]); setHasMore(false); setLoading(false); return; }
    var { data } = await supabase.from('civic_reels').select('*, users:user_id(full_name, username, identity_verified, followers_count)').in('user_id', followIds).eq('status', 'ready').order('created_at', { ascending: false }).range(from, from + PAGE - 1);
    if (data) {
      var enriched = data.map(function (r) { return Object.assign({}, r, { author_name: r.users ? r.users.full_name : null, author_username: r.users ? r.users.username : null, author_verified: r.users ? r.users.identity_verified : false, author_followers_count: r.users ? r.users.followers_count || 0 : 0, video_url: r.cloudflare_playback_url, is_following: true, user_saved: false, user_liked: false }); });
      var reelIds = enriched.map(function (r) { return r.id; });
      if (reelIds.length > 0) {
        var { data: likes } = await supabase.from('civic_reel_likes').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds); if (likes) { var likeSet = {}; likes.forEach(function (l) { likeSet[l.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_liked: !!likeSet[r.id] }); }); }
        var { data: saves } = await supabase.from('civic_reel_saves').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds); if (saves) { var saveSet = {}; saves.forEach(function (s) { saveSet[s.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_saved: !!saveSet[r.id] }); }); }
      }
      if (from === 0) setReels(enriched); else setReels(function (prev) { return prev.concat(enriched); });
      setHasMore(data.length === PAGE);
    } setLoading(false);
  }, [currentUser]);

  var loadMyReels = useCallback(async function (offset) {
    if (!currentUser) return; setLoading(true); var from = offset || 0;
    var { data } = await supabase.from('civic_reels').select('*, users:user_id(full_name, username, identity_verified, followers_count)').eq('user_id', currentUser.id).order('created_at', { ascending: false }).range(from, from + PAGE - 1);
    if (data) {
      var enriched = data.map(function (r) { return Object.assign({}, r, { author_name: r.users ? r.users.full_name : null, author_username: r.users ? r.users.username : null, author_verified: r.users ? r.users.identity_verified : false, author_followers_count: r.users ? r.users.followers_count || 0 : 0, video_url: r.cloudflare_playback_url, user_saved: false, user_liked: false }); });
      var reelIds = enriched.map(function (r) { return r.id; });
      if (reelIds.length > 0) {
        var { data: likes } = await supabase.from('civic_reel_likes').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds); if (likes) { var likeSet = {}; likes.forEach(function (l) { likeSet[l.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_liked: !!likeSet[r.id] }); }); }
        var { data: saves } = await supabase.from('civic_reel_saves').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds); if (saves) { var saveSet = {}; saves.forEach(function (s) { saveSet[s.reel_id] = true; }); enriched = enriched.map(function (r) { return Object.assign({}, r, { user_saved: !!saveSet[r.id] }); }); }
      }
      if (from === 0) setReels(enriched); else setReels(function (prev) { return prev.concat(enriched); });
      setHasMore(data.length === PAGE);
    } setLoading(false);
  }, [currentUser]);

  useEffect(function () {
    setReels([]); setVisibleIndex(0); setSearchTag('');
    if (feedMode === 'saved') loadSavedReels(0);
    else if (feedMode === 'myreels') loadMyReels(0);
    else if (feedMode === 'following') loadFollowingReels(0);
    else loadReels(0);
  }, [feedMode, loadReels, loadSavedReels]);

  useEffect(function () {
    if (searchTag) { setReels([]); setVisibleIndex(0); loadReels(0); }
  }, [searchTag]);

  async function handleDelete(reelId) {
    var { error: delErr } = await supabase.from('civic_reels').delete().eq('id', reelId).eq('user_id', currentUser.id);
    if (!delErr) { setReels(function (prev) { return prev.filter(function (r) { return r.id !== reelId; }); }); }
  }

  function handleUploaded() { setShowUpload(false); loadReels(0); }

  if (loading && reels.length === 0) return (
    <div className="cv-reels-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: sans }}>Loading CivicReels...</p>
      </div>
    </div>
  );

  return (
    <div className="cv-reels-container" style={{ width: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes heartBurst { 0% { transform: scale(0); opacity: 1 } 50% { transform: scale(1.2); opacity: 0.8 } 100% { transform: scale(1); opacity: 0 } }
        @keyframes slideSheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes liveDot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        .cv-reels-feed { scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
        .cv-reels-feed::-webkit-scrollbar { display: none; }
        .cv-reel-card { scroll-snap-align: start; scroll-snap-stop: always; }

        .cv-reels-container {
          position: fixed !important;
          top: 0; right: 0; bottom: 0;
          left: 240px;
          height: 100vh !important;
          height: 100svh !important;
          border-radius: 0;
          z-index: 20;
        }

        @media (max-width: 768px) {
          .cv-reels-container {
            left: 0 !important;
            height: 100vh !important;
            height: 100svh !important;
          }

          .cv-reel-author {
            bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          }

          .cv-reel-sidebar {
            bottom: calc(116px + env(safe-area-inset-bottom, 0px)) !important;
          }

          .cv-reel-top-overlay {
            padding-top: 0 !important;
          }
        }
      `}</style>

      {/* Top overlay — tabs + search + upload button */}
      <div className="cv-reel-top-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 0', pointerEvents: 'auto' }}>
          <div style={{ width: 36 }} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {searchTag && (
              <button onClick={function () { setSearchTag(''); setReels([]); loadReels(0); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: C.gold, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                #{searchTag} ✕
              </button>
            )}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            {profile && profile.identity_verified && (
              <button onClick={function () { setShowUpload(true); }}
                style={{ width: 36, height: 24, borderRadius: 6, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', background: '#25F4EE', borderRadius: '6px 0 0 6px' }} />
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', background: '#FE2C55', borderRadius: '0 6px 6px 0' }} />
                <span style={{ position: 'relative', fontSize: 18, fontWeight: 700, color: '#000', lineHeight: 1, zIndex: 1 }}>+</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '8px 0 6px', pointerEvents: 'auto' }}>
          {[{ key: 'following', label: 'Following' }, { key: 'foryou', label: 'For You' }, { key: 'myreels', label: 'My Reels' }, { key: 'saved', label: 'Saved' }].map(function (tab) {
            var isActive = feedMode === tab.key;
            return (
              <button key={tab.key} onClick={function () { setFeedMode(tab.key); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: isActive ? 800 : 500, padding: '4px 2px 8px', fontFamily: sans, position: 'relative', transition: 'all 0.2s', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {tab.label}
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 3, borderRadius: 2, background: '#fff' }} />}
              </button>
            );
          })}
        </div>

        {!searchTag && feedMode === 'foryou' && (
          <div style={{ padding: '2px 16px 6px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', pointerEvents: 'auto' }}>
            {TRENDING_TAGS.map(function (tag) {
              return (
                <button key={tag} onClick={function () { setSearchTag(tag); }}
                  style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: sans, whiteSpace: 'nowrap' }}>
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {reels.length === 0 && !loading ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, zIndex: 10 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40 }}>{feedMode === 'saved' ? '🔖' : feedMode === 'myreels' ? '🎥' : feedMode === 'following' ? '👥' : '🎬'}</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center', fontFamily: serif }}>
            {searchTag ? 'No reels for #' + searchTag : feedMode === 'saved' ? 'No saved reels' : feedMode === 'myreels' ? 'No reels yet' : feedMode === 'following' ? 'No reels from people you follow' : 'No reels yet'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
            {searchTag ? 'Try a different hashtag' : feedMode === 'saved' ? 'Tap the bookmark icon on any reel to save it here' : feedMode === 'myreels' ? 'Create your first CivicReel to see it here' : feedMode === 'following' ? 'Follow creators from the For You feed' : 'Be the first to share a CivicReel!'}
          </p>
          {(feedMode === 'saved' || feedMode === 'following' || searchTag) ? (
            <button onClick={function () { setFeedMode('foryou'); setSearchTag(''); }} style={{ padding: '12px 28px', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', cursor: 'pointer', fontFamily: sans, boxShadow: '0 4px 20px rgba(197,150,12,0.4)' }}>
              Browse Reels
            </button>
          ) : (profile && profile.identity_verified) && (
            <button onClick={function () { setShowUpload(true); }}
              style={{ padding: '12px 28px', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', cursor: 'pointer', fontFamily: sans, boxShadow: '0 4px 20px rgba(197,150,12,0.4)' }}>
              🎬 Create Your First Reel
            </button>
          )}
        </div>
      ) : (
        <div ref={feedRef} className="cv-reels-feed"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {reels.map(function (reel, i) {
            return (
              <div key={reel.id} data-index={i} className="cv-reel-card" style={{ height: '100svh', minHeight: '100vh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                <ReelCard reel={reel} isVisible={i === visibleIndex} currentUser={currentUser}
                  onLike={handleLike} onComment={handleComment} onShare={handleShare} onView={handleView}
                  onFollow={handleFollow} onSave={handleSave} onDelete={handleDelete} index={i} />
              </div>
            );
          })}
        </div>
      )}

      {showUpload && <UploadModal currentUser={currentUser} profile={profile} onClose={function () { setShowUpload(false); }} onUploaded={handleUploaded} />}
    </div>
  );
}
