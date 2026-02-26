// src/pages/admin/AdminDebates.jsx — Admin Debate Management (Rich Design)
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { adminCancelDebate, adminFlagMessage, createAudioRoom } from '../../lib/debateApi';

var C = { navy: '#0B2545', midNavy: '#163a64', gold: '#C5960C', darkGold: '#a07a0a', green: '#16a34a', red: '#ef4444', cream: '#faf8f4' };
var font = 'Libre Baskerville, Georgia, serif';

var statusColors = {
  pending: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', text: '#fff', label: '⏳ Pending' },
  confirmed: { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', text: '#fff', label: '✓ Confirmed' },
  waiting_room: { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', text: '#fff', label: '🏠 Waiting Room' },
  live: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', text: '#fff', label: '● LIVE' },
  completed: { bg: 'linear-gradient(135deg, #10b981, #059669)', text: '#fff', label: '✅ Completed' },
  cancelled: { bg: 'linear-gradient(135deg, #6b7280, #4b5563)', text: '#fff', label: '✕ Cancelled' },
};

export default function AdminDebates() {
  var [debates, setDebates] = useState([]);
  var [loading, setLoading] = useState(true);
  var [filter, setFilter] = useState('all');
  var [selected, setSelected] = useState(null);
  var [chatMessages, setChatMessages] = useState([]);
  var [chatUsers, setChatUsers] = useState({});
  var [debateUsers, setDebateUsers] = useState({});
  var [stats, setStats] = useState({ total: 0, live: 0, upcoming: 0, completed: 0 });

  var loadDebates = useCallback(async function() {
    setLoading(true);
    var query = supabase.from('debates').select('*').order('scheduled_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    var { data } = await query.limit(100);
    if (data) {
      setDebates(data);
      var allIds = new Set();
      data.forEach(function(d) { if (d.creator_id) allIds.add(d.creator_id); if (d.opponent_id) allIds.add(d.opponent_id); });
      var idArr = Array.from(allIds);
      if (idArr.length > 0) {
        var { data: users } = await supabase.from('users').select('id, full_name, email, identity_verified').in('id', idArr);
        if (users) { var map = {}; users.forEach(function(u) { map[u.id] = u; }); setDebateUsers(map); }
      }
    }
    var { count: total } = await supabase.from('debates').select('*', { count: 'exact', head: true });
    var { count: live } = await supabase.from('debates').select('*', { count: 'exact', head: true }).eq('status', 'live');
    var { count: upcoming } = await supabase.from('debates').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'waiting_room']);
    var { count: completed } = await supabase.from('debates').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    setStats({ total: total || 0, live: live || 0, upcoming: upcoming || 0, completed: completed || 0 });
    setLoading(false);
  }, [filter]);

  useEffect(function() { loadDebates(); }, [loadDebates]);

  async function loadDebateChat(debateId) {
    var { data } = await supabase.from('debate_chat_messages').select('*').eq('debate_id', debateId).order('created_at', { ascending: true }).limit(200);
    if (data) {
      setChatMessages(data);
      var uids = Array.from(new Set(data.map(function(m) { return m.user_id; })));
      var unknowns = uids.filter(function(uid) { return !chatUsers[uid]; });
      if (unknowns.length > 0) {
        var { data: uData } = await supabase.from('users').select('id, full_name, identity_verified').in('id', unknowns);
        if (uData) { var map = Object.assign({}, chatUsers); uData.forEach(function(u) { map[u.id] = u; }); setChatUsers(map); }
      }
    }
  }

  async function handleCancel(debateId) {
    if (!confirm('Cancel this debate? This action cannot be undone.')) return;
    try {
      await adminCancelDebate(debateId);
      loadDebates();
      if (selected && selected.id === debateId) setSelected(null);
    } catch (err) { alert('Error: ' + err.message); }
  }

  async function handleFlagMessage(debateId, messageId) {
    try {
      await adminFlagMessage(debateId, messageId);
      setChatMessages(function(prev) { return prev.map(function(m) { return m.id === messageId ? Object.assign({}, m, { is_flagged: true }) : m; }); });
    } catch (err) { alert('Error: ' + err.message); }
  }

  async function handleCreateRoom(debateId) {
    try {
      await createAudioRoom(debateId);
      loadDebates();
      alert('Audio room created successfully!');
    } catch (err) { alert('Error: ' + err.message); }
  }

  function selectDebate(d) {
    setSelected(d);
    loadDebateChat(d.id);
  }

  function getUserName(userId) {
    var u = debateUsers[userId] || chatUsers[userId];
    return u ? u.full_name : 'Unknown';
  }

  function fmtDate(d) {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function fmtShortDate(d) {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes livePulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}70%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
        .ad-card{cursor:pointer;transition:all 0.25s ease}
        .ad-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(11,37,69,0.12)!important;border-color:rgba(197,150,12,0.3)!important}
        .ad-btn{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.2s ease}
        .ad-btn:hover{transform:translateY(-1px);opacity:0.9}
        .ad-btn:active{transform:translateY(0)}
        .ad-filter{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.2s ease}
        .ad-filter:hover{transform:translateY(-1px)}
        .ad-stat-card{transition:all 0.3s ease}
        .ad-stat-card:hover{transform:translateY(-3px)}
        .ad-chat-row{transition:all 0.15s ease}
        .ad-chat-row:hover{background:rgba(197,150,12,0.04)!important}
      `}</style>

      {/* Hero Header */}
      <div style={{
        padding: '32px 36px', borderRadius: 22, marginBottom: 28,
        background: 'linear-gradient(135deg, #0B2545 0%, #163a64 50%, #1e4976 100%)',
        boxShadow: '0 8px 32px rgba(11,37,69,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(197,150,12,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(197,150,12,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(197,150,12,0.4)',
            }}>
              <span style={{ fontSize: 24 }}>🎙</span>
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>Debate Management</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Oversee, moderate, and manage all live debates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Debates', value: stats.total, icon: '📊', gradient: 'linear-gradient(135deg, #0B2545, #163a64)', shadow: 'rgba(11,37,69,0.25)' },
          { label: 'Live Now', value: stats.live, icon: '🔴', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239,68,68,0.25)', pulse: true },
          { label: 'Upcoming', value: stats.upcoming, icon: '📅', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59,130,246,0.25)' },
          { label: 'Completed', value: stats.completed, icon: '✅', gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.25)' },
        ].map(function(s) {
          return (
            <div key={s.label} className="ad-stat-card" style={{
              padding: '22px 24px', borderRadius: 18,
              background: s.gradient, boxShadow: '0 6px 24px ' + s.shadow,
              animation: s.pulse && stats.live > 0 ? 'livePulse 2s ease-in-out infinite' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{s.label}</span>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
              </div>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'monospace', letterSpacing: 1 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(11,37,69,0.04), rgba(11,37,69,0.08))',
        border: '1px solid rgba(11,37,69,0.06)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.navy, alignSelf: 'center', marginRight: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Filter:</span>
        {[
          { key: 'all', label: 'All Debates' },
          { key: 'live', label: '● Live' },
          { key: 'waiting_room', label: 'Waiting Room' },
          { key: 'confirmed', label: 'Confirmed' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(function(f) {
          var active = filter === f.key;
          return (
            <button key={f.key} className="ad-filter" onClick={function() { setFilter(f.key); }}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? 'linear-gradient(135deg, ' + C.navy + ', ' + C.midNavy + ')' : '#fff',
                color: active ? '#fff' : 'rgba(11,37,69,0.6)',
                boxShadow: active ? '0 3px 12px rgba(11,37,69,0.2)' : '0 1px 4px rgba(11,37,69,0.06)',
              }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: 22 }}>
        {/* Debate List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Loading debates...</p>
            </div>
          ) : debates.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(11,37,69,0.02), rgba(197,150,12,0.04))',
              border: '2px dashed rgba(11,37,69,0.1)',
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(197,150,12,0.1), rgba(197,150,12,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 28 }}>🎙</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>No debates found</p>
              <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Debates will appear here when citizens schedule them</p>
            </div>
          ) : debates.map(function(d, idx) {
            var sc = statusColors[d.status] || statusColors.pending;
            var isActive = selected && selected.id === d.id;
            var isLive = d.status === 'live';
            return (
              <div key={d.id} className="ad-card" onClick={function() { selectDebate(d); }}
                style={{
                  padding: '18px 22px', borderRadius: 16, marginBottom: 10,
                  background: isActive ? 'linear-gradient(135deg, rgba(197,150,12,0.06), rgba(197,150,12,0.02))' : '#fff',
                  border: isActive ? '2px solid ' + C.gold : isLive ? '2px solid rgba(239,68,68,0.2)' : '1px solid rgba(11,37,69,0.08)',
                  boxShadow: isLive ? '0 4px 20px rgba(239,68,68,0.08)' : '0 2px 10px rgba(11,37,69,0.04)',
                  animation: 'fadeIn 0.3s ease ' + (idx * 0.03) + 's both',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                        background: sc.bg, color: sc.text,
                        boxShadow: isLive ? '0 2px 8px rgba(239,68,68,0.3)' : 'none',
                      }}>{sc.label}</span>
                      {d.audio_room_url && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: 'rgba(22,163,74,0.1)', padding: '3px 8px', borderRadius: 6 }}>🔊 Audio</span>}
                      {d.listener_count > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(11,37,69,0.45)' }}>👁 {d.listener_count}</span>}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font, lineHeight: 1.3 }}>{d.topic}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.green + ', #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{(getUserName(d.creator_id) || '?').charAt(0)}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{getUserName(d.creator_id)}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(11,37,69,0.25)' }}>vs</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: d.opponent_id ? 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')' : 'rgba(11,37,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{d.opponent_id ? (getUserName(d.opponent_id) || '?').charAt(0) : '?'}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: d.opponent_id ? C.navy : 'rgba(11,37,69,0.35)' }}>{d.opponent_id ? getUserName(d.opponent_id) : 'TBD'}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', marginLeft: 'auto', fontWeight: 500 }}>{fmtShortDate(d.scheduled_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {d.status !== 'cancelled' && d.status !== 'completed' && (
                      <button className="ad-btn" onClick={function(e) { e.stopPropagation(); handleCancel(d.id); }}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: C.red }}>
                        ✕ Cancel
                      </button>
                    )}
                    {!d.audio_room_url && (d.status === 'confirmed' || d.status === 'waiting_room') && (
                      <button className="ad-btn" onClick={function(e) { e.stopPropagation(); handleCreateRoom(d.id); }}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(197,150,12,0.1)', color: C.darkGold }}>
                        🔊 Room
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{
            width: 430, flexShrink: 0, borderRadius: 22, overflow: 'hidden',
            background: '#fff', border: '2px solid rgba(197,150,12,0.15)',
            boxShadow: '0 8px 36px rgba(11,37,69,0.1)',
            animation: 'fadeIn 0.3s ease',
          }}>
            {/* Detail Header */}
            <div style={{
              padding: '24px', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #0B2545 0%, #163a64 50%, #1e4976 100%)',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(197,150,12,0.1)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{
                    padding: '5px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                    background: (statusColors[selected.status] || {}).bg, color: '#fff',
                  }}>{(statusColors[selected.status] || {}).label}</span>
                  <button className="ad-btn" onClick={function() { setSelected(null); }}
                    style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)' }}>✕</button>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: font, lineHeight: 1.3 }}>{selected.topic}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 500 }}>📅 {fmtDate(selected.scheduled_at)}</p>
              </div>
            </div>

            {/* Debaters */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 14, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.1)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px', background: 'linear-gradient(135deg, ' + C.green + ', #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{(getUserName(selected.creator_id) || '?').charAt(0)}</div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.green, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Proposition</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{getUserName(selected.creator_id)}</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.navy + ', ' + C.midNavy + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(11,37,69,0.15)' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.gold }}>VS</span>
                </div>
                <div style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 14, background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.1)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px', background: selected.opponent_id ? 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')' : 'rgba(11,37,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{selected.opponent_id ? (getUserName(selected.opponent_id) || '?').charAt(0) : '?'}</div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.darkGold, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Opposition</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{selected.opponent_id ? getUserName(selected.opponent_id) : 'TBD'}</p>
                </div>
              </div>
            </div>

            {/* Info Pills */}
            <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(11,37,69,0.05)', color: C.navy, fontWeight: 600, border: '1px solid rgba(11,37,69,0.06)' }}>👁 {selected.listener_count || 0} listeners</span>
                <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(11,37,69,0.05)', color: C.navy, fontWeight: 600, border: '1px solid rgba(11,37,69,0.06)' }}>📋 {selected.challenge_type}</span>
                {selected.audio_room_url && <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.08)', color: C.green, fontWeight: 700, border: '1px solid rgba(22,163,74,0.12)' }}>🔊 Audio active</span>}
                {selected.current_section && <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(197,150,12,0.08)', color: C.darkGold, fontWeight: 700, border: '1px solid rgba(197,150,12,0.12)' }}>📌 {selected.current_section}</span>}
              </div>
              {selected.description && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.55)', margin: '12px 0 0', lineHeight: 1.6 }}>{selected.description}</p>}
            </div>

            {/* Format */}
            <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1.5 }}>⏱ Debate Format</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(selected.format).map(function(e) {
                  return <span key={e[0]} style={{
                    fontSize: 11, padding: '6px 14px', borderRadius: 10, fontWeight: 600,
                    background: 'linear-gradient(135deg, rgba(11,37,69,0.04), rgba(11,37,69,0.07))',
                    color: C.navy, border: '1px solid rgba(11,37,69,0.06)',
                  }}>{e[0]}: <span style={{ color: C.gold, fontWeight: 700, fontFamily: 'monospace' }}>{Math.round(e[1] / 60)}m</span></span>;
                })}
              </div>
            </div>

            {/* Chat Moderation */}
            <div style={{ padding: '14px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, margin: 0, textTransform: 'uppercase', letterSpacing: 1.5 }}>💬 Chat Messages</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.35)', background: 'rgba(11,37,69,0.04)', padding: '3px 10px', borderRadius: 8 }}>{chatMessages.length}</span>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 12, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', background: 'rgba(11,37,69,0.02)' }}>
                    <span style={{ fontSize: 24 }}>💬</span>
                    <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '8px 0 0' }}>No chat messages yet</p>
                  </div>
                ) : chatMessages.map(function(m) {
                  var u = chatUsers[m.user_id] || debateUsers[m.user_id];
                  return (
                    <div key={m.id} className="ad-chat-row" style={{
                      padding: '10px 14px', borderBottom: '1px solid rgba(11,37,69,0.04)',
                      background: m.is_flagged ? 'rgba(239,68,68,0.04)' : 'transparent',
                      opacity: m.is_flagged ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{u ? u.full_name : '...'}</span>
                            <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.7)', margin: '3px 0 0', lineHeight: 1.4 }}>{m.content}</p>
                        </div>
                        {!m.is_flagged ? (
                          <button className="ad-btn" onClick={function() { handleFlagMessage(selected.id, m.id); }}
                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.06)', color: C.red, flexShrink: 0 }}>
                            🚩
                          </button>
                        ) : (
                          <span style={{ fontSize: 10, color: C.red, fontWeight: 700, padding: '4px 8px', background: 'rgba(239,68,68,0.06)', borderRadius: 6 }}>Flagged</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '18px 22px', borderTop: '1px solid rgba(11,37,69,0.06)', background: 'linear-gradient(135deg, rgba(11,37,69,0.02), rgba(11,37,69,0.04))' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                  <button className="ad-btn" onClick={function() { handleCancel(selected.id); }}
                    style={{ padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', boxShadow: '0 3px 12px rgba(239,68,68,0.25)' }}>
                    ✕ Cancel Debate
                  </button>
                )}
                {!selected.audio_room_url && (selected.status === 'confirmed' || selected.status === 'waiting_room') && (
                  <button className="ad-btn" onClick={function() { handleCreateRoom(selected.id); }}
                    style={{ padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', boxShadow: '0 3px 12px rgba(197,150,12,0.3)' }}>
                    🔊 Create Audio Room
                  </button>
                )}
                <button className="ad-btn" onClick={function() { window.open('/citizen/debates/' + selected.id, '_blank'); }}
                  style={{ padding: '11px 22px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, ' + C.navy + ', ' + C.midNavy + ')', color: '#fff', boxShadow: '0 3px 12px rgba(11,37,69,0.2)' }}>
                  Open Debate Room →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

