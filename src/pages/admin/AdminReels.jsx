// src/pages/admin/AdminReels.jsx — Reels Management Dashboard
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#A67C00', green: '#1A7A3C', red: '#C0392B', purple: '#6D28D9' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, sans-serif';

function timeAgo(iso) {
  if (!iso) return '';
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  if (d < 604800) return Math.floor(d / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString();
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatDuration(s) {
  if (!s) return '0:00';
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return m + ':' + String(sec).padStart(2, '0');
}

export default function AdminReels() {
  var [reels, setReels] = useState([]);
  var [loading, setLoading] = useState(true);
  var [stats, setStats] = useState({ total: 0, totalViews: 0, totalLikes: 0, creators: 0 });
  var [search, setSearch] = useState('');
  var [sortBy, setSortBy] = useState('newest');
  var [filterStatus, setFilterStatus] = useState('all');
  var [previewReel, setPreviewReel] = useState(null);
  var [deleting, setDeleting] = useState(null);
  var [page, setPage] = useState(0);
  var [hasMore, setHasMore] = useState(true);
  var PAGE_SIZE = 20;

  useEffect(function () {
    loadReels(0, true);
  }, [sortBy, filterStatus]);

  async function loadReels(offset, reset) {
    setLoading(true);
    var from = offset || 0;

    var query = supabase
      .from('civic_reels')
      .select('*, users:user_id(full_name, username, email, identity_verified)')
      .range(from, from + PAGE_SIZE - 1);

    if (filterStatus === 'reported') {
      query = query.gt('report_count', 0);
    } else if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'most_views') query = query.order('views_count', { ascending: false });
    else if (sortBy === 'most_likes') query = query.order('likes_count', { ascending: false });
    else if (sortBy === 'most_shares') query = query.order('shares_count', { ascending: false });

    var { data, error } = await query;

    if (data) {
      if (reset || from === 0) setReels(data);
      else setReels(function (prev) { return prev.concat(data); });
      setHasMore(data.length === PAGE_SIZE);
      setPage(from);
    }

    // Load aggregate stats
    if (from === 0) {
      var { data: allReels } = await supabase.from('civic_reels').select('id, views_count, likes_count, user_id');
      if (allReels) {
        var uniqueCreators = {};
        var totalViews = 0;
        var totalLikes = 0;
        allReels.forEach(function (r) {
          totalViews += r.views_count || 0;
          totalLikes += r.likes_count || 0;
          uniqueCreators[r.user_id] = true;
        });
        setStats({ total: allReels.length, totalViews: totalViews, totalLikes: totalLikes, creators: Object.keys(uniqueCreators).length });
      }
    }
    setLoading(false);
  }

  async function handleDelete(reelId) {
    if (!window.confirm('Permanently delete this reel? This removes the video and all likes, comments, and saves.')) return;
    setDeleting(reelId);

    // Get the reel to find storage path
    var reel = reels.find(function (r) { return r.id === reelId; });

    // Delete from database (cascade handles likes/comments/saves)
    var { error } = await supabase.from('civic_reels').delete().eq('id', reelId);

    if (!error) {
      // Try to delete from storage too
      if (reel && reel.cloudflare_playback_url) {
        var urlParts = reel.cloudflare_playback_url.split('/civic-reels/');
        if (urlParts[1]) {
          await supabase.storage.from('civic-reels').remove([decodeURIComponent(urlParts[1])]);
        }
      }
      setReels(function (prev) { return prev.filter(function (r) { return r.id !== reelId; }); });
      setStats(function (prev) { return Object.assign({}, prev, { total: prev.total - 1 }); });
      if (previewReel && previewReel.id === reelId) setPreviewReel(null);
    }
    setDeleting(null);
  }

  async function toggleFeature(reelId, currentFeatured) {
    await supabase.from('civic_reels').update({ featured: !currentFeatured }).eq('id', reelId);
    setReels(function (prev) {
      return prev.map(function (r) { return r.id === reelId ? Object.assign({}, r, { featured: !currentFeatured }) : r; });
    });
  }

  var filtered = reels.filter(function (r) {
    if (!search) return true;
    var q = search.toLowerCase();
    var name = r.users ? (r.users.full_name || '').toLowerCase() : '';
    var username = r.users ? (r.users.username || '').toLowerCase() : '';
    var caption = (r.caption || '').toLowerCase();
    var tags = r.tags ? r.tags.join(' ').toLowerCase() : '';
    return name.indexOf(q) !== -1 || username.indexOf(q) !== -1 || caption.indexOf(q) !== -1 || tags.indexOf(q) !== -1;
  });

  return (
    <div style={{ fontFamily: sans }}>
      <style>{'\
        @keyframes spin{to{transform:rotate(360deg)}}\
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\
        .cv-reel-row:hover{background:rgba(11,37,69,0.02)!important}\
        .cv-reel-action:hover{transform:scale(1.08)}\
      '}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>CivicReels</h1>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Manage videos, monitor engagement, and moderate content</p>
        </div>
        <button onClick={function () { loadReels(0, true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#fff', border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.navy, cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,37,69,0.04)' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }} className="cv-reels-stats">
        {[
          { label: 'Total Reels', val: stats.total, icon: '🎬', color: C.navy, bg: 'rgba(11,37,69,0.04)' },
          { label: 'Total Views', val: formatCount(stats.totalViews), icon: '👁', color: C.purple, bg: 'rgba(109,40,217,0.05)' },
          { label: 'Total Likes', val: formatCount(stats.totalLikes), icon: '❤️', color: C.red, bg: 'rgba(192,57,43,0.05)' },
          { label: 'Creators', val: stats.creators, icon: '👤', color: C.green, bg: 'rgba(26,122,60,0.05)' },
        ].map(function (s, i) {
          return (
            <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.06)', animation: 'fadeIn 0.3s ease ' + (i * 0.05) + 's both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0, fontFamily: font, lineHeight: 1 }}>{s.val}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar — search, filter, sort */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'rgba(11,37,69,0.3)' }}>🔍</span>
          <input
            value={search}
            onChange={function (e) { setSearch(e.target.value); }}
            placeholder="Search by creator, caption, or hashtag..."
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, outline: 'none', color: C.navy, fontFamily: sans, boxSizing: 'border-box', background: '#fff' }}
          />
        </div>

        <select value={filterStatus} onChange={function (e) { setFilterStatus(e.target.value); }}
          style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, color: C.navy, fontFamily: sans, background: '#fff', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All Status</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="reported">Reported</option>
        </select>

        <select value={sortBy} onChange={function (e) { setSortBy(e.target.value); }}
          style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(11,37,69,0.1)', fontSize: 13, color: C.navy, fontFamily: sans, background: '#fff', cursor: 'pointer', outline: 'none' }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most_views">Most Views</option>
          <option value="most_likes">Most Likes</option>
          <option value="most_shares">Most Shares</option>
        </select>
      </div>

      {/* Loading */}
      {loading && reels.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🎬</span>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>No reels found</p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>{search ? 'Try a different search term' : 'No reels have been uploaded yet'}</p>
        </div>
      )}

      {/* Reels table */}
      {filtered.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.07)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 140px 80px 80px 80px 80px 140px', gap: 0, padding: '12px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', background: 'rgba(11,37,69,0.02)' }} className="cv-reels-table-header">
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}></span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Reel</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Creator</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Views</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Likes</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Shares</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>Time</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'right' }}>Actions</span>
          </div>

          {/* Rows */}
          {filtered.map(function (reel, i) {
            var videoUrl = reel.cloudflare_playback_url || reel.video_url;
            var creator = reel.users || {};
            var isDeleting = deleting === reel.id;

            return (
              <div key={reel.id} className="cv-reel-row"
                style={{
                  display: 'grid', gridTemplateColumns: '64px 1fr 140px 80px 80px 80px 80px 140px', gap: 0,
                  padding: '14px 20px', borderBottom: '1px solid rgba(11,37,69,0.04)',
                  alignItems: 'center', transition: 'background 0.15s',
                  opacity: isDeleting ? 0.4 : 1, animation: 'fadeIn 0.2s ease ' + (i * 0.02) + 's both',
                }}>

                {/* Thumbnail */}
                <div
                  onClick={function () { setPreviewReel(reel); }}
                  style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#000', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <video src={videoUrl} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                    <span style={{ fontSize: 16, color: '#fff' }}>▶</span>
                  </div>
                  {reel.duration_seconds > 0 && (
                    <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 8, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 3 }}>
                      {formatDuration(reel.duration_seconds)}
                    </span>
                  )}
                </div>

                {/* Caption + tags */}
                <div style={{ minWidth: 0, paddingRight: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {reel.caption || '(No caption)'}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {reel.tags && reel.tags.slice(0, 3).map(function (tag) {
                      return <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: C.gold, background: C.gold + '12', padding: '1px 7px', borderRadius: 8 }}>#{tag}</span>;
                    })}
                    {reel.filter && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.purple, background: C.purple + '10', padding: '1px 7px', borderRadius: 8 }}>🎨 {reel.filter}</span>
                    )}
                    {reel.featured && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.gold, background: C.gold + '15', padding: '1px 7px', borderRadius: 8 }}>⭐ Featured</span>
                    )}
                  </div>
                </div>

                {/* Creator */}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.navy, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {creator.full_name || 'Unknown'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {creator.identity_verified && (
                      <span style={{ fontSize: 8, fontWeight: 700, color: C.green, background: C.green + '15', padding: '1px 5px', borderRadius: 4 }}>✓ ID</span>
                    )}
                    <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {creator.username ? '@' + creator.username : creator.email || ''}
                    </span>
                  </div>
                </div>

                {/* Views */}
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: 0, textAlign: 'center' }}>{formatCount(reel.views_count)}</p>

                {/* Likes */}
                <p style={{ fontSize: 13, fontWeight: 700, color: C.red, margin: 0, textAlign: 'center' }}>{formatCount(reel.likes_count)}</p>

                {/* Shares */}
                <p style={{ fontSize: 13, fontWeight: 700, color: C.purple, margin: 0, textAlign: 'center' }}>{formatCount(reel.shares_count)}</p>

                {/* Time */}
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: 0, textAlign: 'center' }}>{timeAgo(reel.created_at)}</p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    onClick={function () { setPreviewReel(reel); }}
                    className="cv-reel-action"
                    title="Preview"
                    style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(11,37,69,0.08)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s' }}>
                    👁
                  </button>
                  <button
                    onClick={function () { toggleFeature(reel.id, reel.featured); }}
                    className="cv-reel-action"
                    title={reel.featured ? 'Unfeature' : 'Feature'}
                    style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid ' + (reel.featured ? C.gold + '40' : 'rgba(11,37,69,0.08)'), background: reel.featured ? C.gold + '10' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s' }}>
                    {reel.featured ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={function () { handleDelete(reel.id); }}
                    className="cv-reel-action"
                    title="Delete"
                    disabled={isDeleting}
                    style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(192,57,43,0.15)', background: 'rgba(192,57,43,0.04)', cursor: isDeleting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.15s', opacity: isDeleting ? 0.4 : 1 }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && filtered.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <button
            onClick={function () { loadReels(page + PAGE_SIZE); }}
            disabled={loading}
            style={{ padding: '10px 28px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', background: '#fff', fontSize: 13, fontWeight: 600, color: C.navy, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Preview modal */}
      {previewReel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={function () { setPreviewReel(null); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, maxHeight: '90vh', margin: 16, background: '#fff', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease' }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 2px', fontFamily: font }}>Reel Preview</p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: 0 }}>
                  by {previewReel.users ? previewReel.users.full_name : 'Unknown'} · {timeAgo(previewReel.created_at)}
                </p>
              </div>
              <button onClick={function () { setPreviewReel(null); }} style={{ background: 'none', border: 'none', fontSize: 20, color: 'rgba(11,37,69,0.4)', cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            {/* Video */}
            <div style={{ background: '#000', position: 'relative' }}>
              <video
                src={previewReel.cloudflare_playback_url || previewReel.video_url}
                controls autoPlay
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', filter: previewReel.filter ? getFilterCSS(previewReel.filter) : 'none' }}
              />
            </div>

            {/* Details */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              {previewReel.caption && (
                <p style={{ fontSize: 13, color: C.navy, margin: '0 0 10px', lineHeight: 1.5 }}>{previewReel.caption}</p>
              )}

              {previewReel.tags && previewReel.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {previewReel.tags.map(function (tag) {
                    return <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: C.gold, background: C.gold + '12', padding: '3px 10px', borderRadius: 10 }}>#{tag}</span>;
                  })}
                </div>
              )}

              {/* Engagement stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { icon: '👁', val: formatCount(previewReel.views_count), label: 'Views' },
                  { icon: '❤️', val: formatCount(previewReel.likes_count), label: 'Likes' },
                  { icon: '💬', val: formatCount(previewReel.comments_count), label: 'Comments' },
                  { icon: '🔗', val: formatCount(previewReel.shares_count), label: 'Shares' },
                ].map(function (s, i) {
                  return (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: 'rgba(11,37,69,0.03)' }}>
                      <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>{s.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, display: 'block' }}>{s.val}</span>
                      <span style={{ fontSize: 9, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Meta info */}
              <div style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', lineHeight: 2 }}>
                <p style={{ margin: 0 }}><strong style={{ color: C.navy }}>Duration:</strong> {formatDuration(previewReel.duration_seconds)}</p>
                <p style={{ margin: 0 }}><strong style={{ color: C.navy }}>Status:</strong> {previewReel.status || 'ready'}</p>
                {previewReel.filter && <p style={{ margin: 0 }}><strong style={{ color: C.navy }}>Filter:</strong> {previewReel.filter}</p>}
                <p style={{ margin: 0 }}><strong style={{ color: C.navy }}>ID:</strong> {previewReel.id}</p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={function () { toggleFeature(previewReel.id, previewReel.featured); setPreviewReel(function (p) { return Object.assign({}, p, { featured: !p.featured }); }); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid ' + C.gold + '40', background: previewReel.featured ? C.gold + '10' : '#fff', color: C.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
                  {previewReel.featured ? '⭐ Unfeature' : '☆ Feature This Reel'}
                </button>
                <button
                  onClick={function () { handleDelete(previewReel.id); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(192,57,43,0.2)', background: 'rgba(192,57,43,0.04)', color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>
                  🗑 Delete Reel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{'\
        @media (max-width: 900px) {\
          .cv-reels-stats { grid-template-columns: repeat(2,1fr) !important; }\
          .cv-reels-table-header { display: none !important; }\
          .cv-reel-row { grid-template-columns: 52px 1fr !important; grid-template-rows: auto auto !important; gap: 8px !important; padding: 14px 16px !important; }\
        }\
      '}</style>
    </div>
  );
}

function getFilterCSS(filter) {
  var filters = {
    warm: 'saturate(1.2) sepia(0.15) brightness(1.05)',
    cool: 'saturate(0.9) hue-rotate(15deg) brightness(1.05)',
    vintage: 'sepia(0.35) contrast(1.1) brightness(0.95) saturate(1.3)',
    bw: 'grayscale(1) contrast(1.1)',
    vivid: 'saturate(1.6) contrast(1.1) brightness(1.05)',
    cinematic: 'contrast(1.2) brightness(0.95) saturate(0.85)',
    golden: 'sepia(0.25) saturate(1.4) brightness(1.05) hue-rotate(-10deg)',
  };
  return filters[filter] || 'none';
}
