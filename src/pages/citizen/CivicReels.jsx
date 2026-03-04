// src/pages/citizen/CivicReels.jsx — TikTok-style Civic Video Feed
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#a07a0a', cream: '#F5F1EC', green: '#16a34a', red: '#ef4444' };
var sans = 'DM Sans, sans-serif';
var serif = 'Libre Baskerville, Georgia, serif';
var PAGE = 5;

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

// ─── Heart burst animation on double-tap ──────────────────────────────────
function HeartBurst({ x, y, onDone }) {
  useEffect(function () { var t = setTimeout(onDone, 900); return function () { clearTimeout(t); }; }, []);
  return (
    <div style={{ position: 'absolute', left: x - 40, top: y - 40, pointerEvents: 'none', zIndex: 50 }}>
      <span style={{ fontSize: 80, animation: 'heartBurst 0.8s ease-out forwards', display: 'block' }}>❤️</span>
    </div>
  );
}

// ─── Single Reel Card ─────────────────────────────────────────────────────
function ReelCard({ reel, isVisible, currentUser, onLike, onComment, onShare, onView, onFollow, index }) {
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

  // Auto-play/pause based on visibility
  useEffect(function () {
    if (!videoRef.current) return;
    if (isVisible) {
      videoRef.current.play().catch(function () { });
      setPaused(false);
      // Count view after 3 seconds
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
      // Double tap — like + heart animation
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

  function openComments() {
    setShowComments(true);
    loadComments();
  }

  var videoUrl = reel.cloudflare_playback_url || reel.video_url;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      scrollSnapAlign: 'start', background: '#000', overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loop muted={false} playsInline
        onClick={handleTap}
      />

      {/* Pause icon */}
      {paused && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 28, color: '#fff', marginLeft: 4 }}>▶</span>
          </div>
        </div>
      )}

      {/* Heart burst animations */}
      {hearts.map(function (h) {
        return <HeartBurst key={h.id} x={h.x} y={h.y} onDone={function () { setHearts(function (p) { return p.filter(function (x) { return x.id !== h.id; }); }); }} />;
      })}

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', pointerEvents: 'none' }} />

      {/* Author info — bottom left */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, right: 72, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}
            onClick={function (e) { e.stopPropagation(); if (reel.user_id) { /* navigate to profile */ } }}
          >
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
          {/* Follow button */}
          {currentUser && reel.user_id !== currentUser.id && (
            <button
              onClick={function (e) { e.stopPropagation(); onFollow(reel.user_id, reel.id); }}
              style={{
                padding: '5px 14px', borderRadius: 20, border: reel.is_following ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                background: reel.is_following ? 'transparent' : C.gold,
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: sans, marginLeft: 4,
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
            >
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

      {/* Right sidebar — engagement buttons */}
      <div style={{ position: 'absolute', right: 12, bottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, zIndex: 10 }}>
        {/* Creator avatar + follow badge */}
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', fontSize: 18, fontWeight: 700, color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {(reel.author_name || '?').charAt(0).toUpperCase()}
          </div>
          {currentUser && reel.user_id !== currentUser.id && !reel.is_following && (
            <button
              onClick={function (e) { e.stopPropagation(); onFollow(reel.user_id, reel.id); }}
              style={{
                position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                width: 22, height: 22, borderRadius: '50%', border: '2px solid #fff',
                background: C.gold, color: '#fff', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', lineHeight: 1, padding: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              +
            </button>
          )}
          {reel.is_following && (
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              width: 22, height: 22, borderRadius: '50%', border: '2px solid #fff',
              background: C.green, color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}>
              ✓
            </div>
          )}
        </div>
        {/* Like */}
        <button onClick={function (e) { e.stopPropagation(); onLike(reel.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
            transition: 'transform 0.2s',
          }}>
            <span style={{ fontSize: 22 }}>{reel.user_liked ? '❤️' : '🤍'}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.likes_count)}</span>
        </button>

        {/* Comment */}
        <button onClick={function (e) { e.stopPropagation(); openComments(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 22 }}>💬</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.comments_count)}</span>
        </button>

        {/* Share */}
        <button onClick={function (e) { e.stopPropagation(); onShare(reel); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 22 }}>🔗</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.shares_count)}</span>
        </button>

        {/* Views */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 22 }}>👁</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{formatCount(reel.views_count)}</span>
        </div>
      </div>

      {/* Comments bottom sheet */}
      {showComments && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, zIndex: 60 }} onClick={function () { setShowComments(false); }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div
            onClick={function (e) { e.stopPropagation(); }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '65%',
              background: '#fff', borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              animation: 'slideSheetUp 0.3s ease',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Comments ({reel.comments_count || 0})</p>
              <button onClick={function () { setShowComments(false); }} style={{ background: 'none', border: 'none', fontSize: 18, color: 'rgba(11,37,69,0.4)', cursor: 'pointer' }}>✕</button>
            </div>
            {/* Comment list */}
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
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, ' + C.navy + ', #163a64)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: C.gold,
                    }}>
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
            {/* Comment input */}
            {currentUser ? (
              <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', gap: 8 }}>
                <input
                  value={commentInput}
                  onChange={function (e) { setCommentInput(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === 'Enter') sendComment(); }}
                  placeholder="Add a comment..."
                  maxLength={500}
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 24, border: '1px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans }}
                />
                <button
                  onClick={sendComment}
                  disabled={!commentInput.trim() || sendingComment}
                  style={{
                    padding: '11px 18px', borderRadius: 24, border: 'none', fontSize: 13, fontWeight: 700,
                    background: commentInput.trim() ? C.gold : 'rgba(11,37,69,0.06)',
                    color: commentInput.trim() ? '#fff' : 'rgba(11,37,69,0.3)',
                    cursor: commentInput.trim() ? 'pointer' : 'default', fontFamily: sans,
                  }}
                >
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
  var [mode, setMode] = useState(null); // 'gallery' | 'record'
  var [file, setFile] = useState(null);
  var [preview, setPreview] = useState(null);
  var [caption, setCaption] = useState('');
  var [tags, setTags] = useState('');
  var [postToCommunity, setPostToCommunity] = useState(false);
  var [uploading, setUploading] = useState(false);
  var [progress, setProgress] = useState(0);
  var [error, setError] = useState(null);

  // Recording state
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
      var s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: true });
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
      setFile(f);
      setPreview(URL.createObjectURL(blob));
      stream.getTracks().forEach(function (t) { t.stop(); });
      setStream(null);
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
    setRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(function () {
      setRecordTime(function (t) {
        if (t >= 119) { stopRecording(); return 120; }
        return t + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function flipCamera() {
    var newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }

  function handleFileSelect(e) {
    var f = e.target.files[0];
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) { setError('Video must be under 200MB'); return; }
    // Check duration
    var v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = function () {
      if (v.duration > 120) { setError('Video must be under 2 minutes'); URL.revokeObjectURL(v.src); return; }
      setFile(f);
      setPreview(URL.createObjectURL(f));
    };
    v.src = URL.createObjectURL(f);
  }

  async function handleUpload() {
    if (!file || !currentUser || uploading) return;
    setUploading(true); setProgress(10); setError(null);

    try {
      // Upload to Supabase storage
      var ext = file.name.split('.').pop();
      var fileName = currentUser.id + '/' + Date.now() + '.' + ext;
      setProgress(20);

      var { data: uploadData, error: uploadError } = await supabase.storage.from('civic-reels').upload(fileName, file, {
        cacheControl: '3600', upsert: false,
        onUploadProgress: function (p) { setProgress(20 + Math.round((p.loaded / p.total) * 50)); }
      });

      if (uploadError) throw uploadError;
      setProgress(75);

      // Get public URL
      var { data: urlData } = supabase.storage.from('civic-reels').getPublicUrl(fileName);
      var videoUrl = urlData.publicUrl;

      // Get duration
      var duration = await new Promise(function (resolve) {
        var v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = function () { resolve(Math.round(v.duration)); URL.revokeObjectURL(v.src); };
        v.onerror = function () { resolve(0); };
        v.src = URL.createObjectURL(file);
      });

      setProgress(85);

      // Parse tags
      var parsedTags = tags.split(/[\s,#]+/).filter(function (t) { return t.trim(); }).map(function (t) { return t.trim().toLowerCase(); });

      // Insert reel record
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
      }).select().single();

      if (reelError) throw reelError;

      // If posting to community too
      if (postToCommunity) {
        await supabase.from('community_posts').insert({
          user_id: currentUser.id,
          content: (caption.trim() || 'Shared a CivicReel') + (parsedTags.length > 0 ? ' ' + parsedTags.map(function (t) { return '#' + t; }).join(' ') : ''),
          image_url: videoUrl,
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
    setFile(null); setPreview(null); setError(null); setProgress(0);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); setStream(null); }
  }

  useEffect(function () {
    return function () {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 440, maxHeight: '90vh', margin: 16,
        background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: 0, fontFamily: serif }}>
            {file ? 'Post Your Reel' : mode === 'record' ? 'Record' : 'Create CivicReel'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(11,37,69,0.4)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Mode selection */}
          {!mode && !file && (
            <div style={{ display: 'grid', gap: 12 }}>
              <button onClick={function () { setMode('gallery'); }}
                style={{
                  padding: '28px 20px', borderRadius: 16, border: '2px dashed rgba(197,150,12,0.3)',
                  background: 'linear-gradient(135deg, rgba(197,150,12,0.04), rgba(197,150,12,0.08))',
                  cursor: 'pointer', textAlign: 'center', fontFamily: sans,
                }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📁</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, display: 'block' }}>Upload from Gallery</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>MP4, MOV, WebM · Max 2 min · 200MB</span>
              </button>
              <button onClick={function () { setMode('record'); startCamera('user'); }}
                style={{
                  padding: '28px 20px', borderRadius: 16, border: '2px dashed rgba(22,163,74,0.3)',
                  background: 'linear-gradient(135deg, rgba(22,163,74,0.04), rgba(22,163,74,0.08))',
                  cursor: 'pointer', textAlign: 'center', fontFamily: sans,
                }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🎥</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, display: 'block' }}>Record Video</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>Use your camera · Max 2 minutes</span>
              </button>
            </div>
          )}

          {/* Gallery file picker */}
          {mode === 'gallery' && !file && (
            <div>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '50px 20px', borderRadius: 16, border: '2px dashed rgba(197,150,12,0.3)',
                background: 'rgba(197,150,12,0.04)', cursor: 'pointer', textAlign: 'center',
              }}>
                <span style={{ fontSize: 48, marginBottom: 12 }}>🎬</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Tap to select video</span>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', marginTop: 4 }}>MP4, MOV, WebM · Max 2 min</span>
                <input type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              <button onClick={function () { setMode(null); }} style={{ marginTop: 12, background: 'none', border: 'none', fontSize: 13, color: 'rgba(11,37,69,0.5)', cursor: 'pointer', fontFamily: sans }}>← Back</button>
            </div>
          )}

          {/* Camera recording */}
          {mode === 'record' && !file && (
            <div>
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '9/16', maxHeight: 360 }}>
                <video ref={videoPreviewRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
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
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 16 }}>
                <video src={preview} controls style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }} />
                <button onClick={resetUpload} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6, display: 'block' }}>Caption</label>
                <textarea
                  value={caption}
                  onChange={function (e) { setCaption(e.target.value); }}
                  placeholder="What's this about?"
                  maxLength={300}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(11,37,69,0.08)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans, minHeight: 60, resize: 'vertical', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0', textAlign: 'right' }}>{caption.length}/300</p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6, display: 'block' }}>Hashtags</label>
                <input
                  value={tags}
                  onChange={function (e) { setTags(e.target.value); }}
                  placeholder="climate, education, policy"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(11,37,69,0.08)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans, boxSizing: 'border-box' }}
                />
              </div>

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

              {error && <p style={{ fontSize: 12, color: C.red, margin: '0 0 12px', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)' }}>{error}</p>}

              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700,
                  background: uploading ? 'rgba(11,37,69,0.08)' : 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
                  color: uploading ? 'rgba(11,37,69,0.3)' : '#fff',
                  cursor: uploading ? 'default' : 'pointer', fontFamily: sans,
                  boxShadow: uploading ? 'none' : '0 4px 16px rgba(197,150,12,0.3)',
                }}
              >
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
  var feedRef = useRef(null);
  var observerRef = useRef(null);

  var loadReels = useCallback(async function (offset) {
    var from = offset || 0;

    if (currentUser) {
      // Use algorithm-based feed for logged-in users
      var { data, error } = await supabase.rpc('get_reels_feed', { p_user_id: currentUser.id, p_limit: PAGE, p_offset: from });
      if (data && !error) {
        var enriched = data.map(function (r) {
          return Object.assign({}, r, { video_url: r.cloudflare_playback_url });
        });
        if (from === 0) setReels(enriched);
        else setReels(function (prev) { return prev.concat(enriched); });
        setHasMore(data.length === PAGE);
        setLoading(false);
        return;
      }
    }

    // Fallback: chronological for non-logged-in or if RPC fails
    var { data } = await supabase
      .from('civic_reels')
      .select('*, users:user_id(full_name, username, identity_verified, followers_count)')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);

    if (data) {
      var enriched = data.map(function (r) {
        return Object.assign({}, r, {
          author_name: r.users ? r.users.full_name : null,
          author_username: r.users ? r.users.username : null,
          author_verified: r.users ? r.users.identity_verified : false,
          author_followers_count: r.users ? r.users.followers_count || 0 : 0,
          video_url: r.cloudflare_playback_url,
          user_liked: false,
          is_following: false,
        });
      });

      if (currentUser) {
        var reelIds = enriched.map(function (r) { return r.id; });
        var creatorIds = Array.from(new Set(enriched.map(function (r) { return r.user_id; })));

        // Check likes
        var { data: likes } = await supabase.from('civic_reel_likes').select('reel_id').eq('user_id', currentUser.id).in('reel_id', reelIds);
        if (likes) {
          var likedSet = {};
          likes.forEach(function (l) { likedSet[l.reel_id] = true; });
          enriched = enriched.map(function (r) { return Object.assign({}, r, { user_liked: !!likedSet[r.id] }); });
        }

        // Check follows
        var { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', currentUser.id).in('following_id', creatorIds);
        if (follows) {
          var followSet = {};
          follows.forEach(function (f) { followSet[f.following_id] = true; });
          enriched = enriched.map(function (r) { return Object.assign({}, r, { is_following: !!followSet[r.user_id] }); });
        }
      }

      if (from === 0) setReels(enriched);
      else setReels(function (prev) { return prev.concat(enriched); });
      setHasMore(data.length === PAGE);
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(function () { loadReels(0); }, [loadReels]);

  // Intersection observer for autoplay
  useEffect(function () {
    if (!feedRef.current) return;
    var options = { root: feedRef.current, threshold: 0.6 };
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = parseInt(entry.target.getAttribute('data-index'));
          setVisibleIndex(idx);
          // Load more when near end
          if (idx >= reels.length - 2 && hasMore) {
            loadReels(reels.length);
          }
        }
      });
    }, options);
    observerRef.current = observer;
    var cards = feedRef.current.querySelectorAll('[data-index]');
    cards.forEach(function (card) { observer.observe(card); });
    return function () { observer.disconnect(); };
  }, [reels.length, hasMore]);

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
    setReels(function (prev) {
      return prev.map(function (r) {
        if (r.id !== reelId) return r;
        return Object.assign({}, r, { comments_count: (r.comments_count || 0) + 1 });
      });
    });
  }

  function handleShare(reel) {
    var url = window.location.origin + '/citizen/reels/' + reel.id;
    var text = (reel.caption || 'Check out this CivicReel') + ' — CivicVerify';
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: text, url: url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
    supabase.from('civic_reels').update({ shares_count: (reel.shares_count || 0) + 1 }).eq('id', reel.id).then(function () { });
    setReels(function (prev) {
      return prev.map(function (r) {
        if (r.id !== reel.id) return r;
        return Object.assign({}, r, { shares_count: (r.shares_count || 0) + 1 });
      });
    });
  }

  async function handleView(reelId) {
    if (currentUser) {
      await supabase.from('civic_reel_views').upsert({ reel_id: reelId, user_id: currentUser.id }, { onConflict: 'reel_id,user_id' });
    }
    supabase.rpc('increment_reel_views', { p_reel_id: reelId }).then(function () { });
  }

  async function handleFollow(targetUserId, reelId) {
    if (!currentUser || targetUserId === currentUser.id) return;
    var { data: isNowFollowing } = await supabase.rpc('toggle_follow', { p_follower: currentUser.id, p_following: targetUserId });
    // Update all reels from this creator
    setReels(function (prev) {
      return prev.map(function (r) {
        if (r.user_id !== targetUserId) return r;
        return Object.assign({}, r, {
          is_following: isNowFollowing,
          author_followers_count: isNowFollowing
            ? (r.author_followers_count || 0) + 1
            : Math.max(0, (r.author_followers_count || 0) - 1)
        });
      });
    });
  }

  function handleUploaded() {
    setShowUpload(false);
    loadReels(0);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', fontFamily: sans }}>Loading CivicReels...</p>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes heartBurst{0%{transform:scale(0);opacity:1}50%{transform:scale(1.2);opacity:0.8}100%{transform:scale(1);opacity:0}}
        @keyframes slideSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes liveDot{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 20,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, fontFamily: serif }}>
          Civic<span style={{ color: C.gold }}>Reels</span>
        </h1>
        {profile && profile.identity_verified && (
          <button
            onClick={function () { setShowUpload(true); }}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
              color: '#fff', cursor: 'pointer', fontFamily: sans,
              boxShadow: '0 2px 12px rgba(197,150,12,0.4)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Create
          </button>
        )}
      </div>

      {/* Feed */}
      {reels.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(197,150,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40 }}>🎬</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, textAlign: 'center', fontFamily: serif }}>No reels yet</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>Be the first to share a CivicReel!</p>
          {profile && profile.identity_verified && (
            <button
              onClick={function () { setShowUpload(true); }}
              style={{
                padding: '12px 28px', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
                color: '#fff', cursor: 'pointer', fontFamily: sans,
                boxShadow: '0 4px 20px rgba(197,150,12,0.4)',
              }}
            >
              🎬 Create Your First Reel
            </button>
          )}
        </div>
      ) : (
        <div
          ref={feedRef}
          style={{
            flex: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {reels.map(function (reel, i) {
            return (
              <div key={reel.id} data-index={i} style={{ height: '100%', scrollSnapAlign: 'start' }}>
                <ReelCard
                  reel={reel}
                  isVisible={i === visibleIndex}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onView={handleView}
                  onFollow={handleFollow}
                  index={i}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal currentUser={currentUser} profile={profile} onClose={function () { setShowUpload(false); }} onUploaded={handleUploaded} />
      )}
    </div>
  );
}
