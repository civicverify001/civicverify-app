// src/pages/admin/AdminDebates.jsx — Admin Debate Management Panel
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { adminCancelDebate, adminFlagMessage, createAudioRoom } from '../../lib/debateApi';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#a07a0a', green: '#16a34a', red: '#ef4444' };
var font = 'Libre Baskerville, Georgia, serif';

var statusColors = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', label: 'Confirmed' },
  waiting_room: { bg: '#e0e7ff', text: '#3730a3', label: 'Waiting Room' },
  live: { bg: '#fee2e2', text: '#991b1b', label: '● LIVE' },
  completed: { bg: '#d1fae5', text: '#065f46', label: 'Completed' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelled' },
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
      // Load user names
      var allIds = new Set();
      data.forEach(function(d) { if (d.creator_id) allIds.add(d.creator_id); if (d.opponent_id) allIds.add(d.opponent_id); });
      var idArr = Array.from(allIds);
      if (idArr.length > 0) {
        var { data: users } = await supabase.from('users').select('id, full_name, email, identity_verified').in('id', idArr);
        if (users) { var map = {}; users.forEach(function(u) { map[u.id] = u; }); setDebateUsers(map); }
      }
    }
    // Stats
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

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        .ad-card{cursor:pointer;transition:all 0.2s}
        .ad-card:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(11,37,69,0.08)!important}
        .ad-btn{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.15s}
        .ad-btn:hover{opacity:0.85}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>🎙 Debate Management</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: 0 }}>Oversee, moderate, and manage all live debates</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Debates', value: stats.total, icon: '📊', color: C.navy },
          { label: 'Live Now', value: stats.live, icon: '🔴', color: C.red },
          { label: 'Upcoming', value: stats.upcoming, icon: '📅', color: '#3b82f6' },
          { label: 'Completed', value: stats.completed, icon: '✅', color: C.green },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ padding: '18px 20px', borderRadius: 16, background: '#fff', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 2px 8px rgba(11,37,69,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'live', 'waiting_room', 'confirmed', 'pending', 'completed', 'cancelled'].map(function(f) {
          var active = filter === f;
          return (
            <button key={f} className="ad-btn" onClick={function() { setFilter(f); }}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? C.navy : 'rgba(11,37,69,0.04)',
                color: active ? '#fff' : C.navy,
              }}>
              {f === 'all' ? 'All' : (statusColors[f] || {}).label || f}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Debate List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : debates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 16, color: 'rgba(11,37,69,0.5)', margin: 0 }}>No debates found</p>
            </div>
          ) : debates.map(function(d) {
            var sc = statusColors[d.status] || statusColors.pending;
            var isActive = selected && selected.id === d.id;
            return (
              <div key={d.id} className="ad-card" onClick={function() { selectDebate(d); }}
                style={{
                  padding: '16px 20px', borderRadius: 14, marginBottom: 10,
                  background: isActive ? 'rgba(197,150,12,0.04)' : '#fff',
                  border: isActive ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.06)',
                  boxShadow: '0 2px 8px rgba(11,37,69,0.03)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span>
                      {d.audio_room_url && <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>🔊 Audio</span>}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>{d.topic}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>
                      <span>{getUserName(d.creator_id)} vs {d.opponent_id ? getUserName(d.opponent_id) : 'TBD'}</span>
                      <span>{fmtDate(d.scheduled_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {d.status !== 'cancelled' && d.status !== 'completed' && (
                      <button className="ad-btn" onClick={function(e) { e.stopPropagation(); handleCancel(d.id); }}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: C.red }}>
                        Cancel
                      </button>
                    )}
                    {!d.audio_room_url && (d.status === 'confirmed' || d.status === 'waiting_room') && (
                      <button className="ad-btn" onClick={function(e) { e.stopPropagation(); handleCreateRoom(d.id); }}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(197,150,12,0.08)', color: C.darkGold }}>
                        🔊 Create Room
                      </button>
                    )}
                  </div>
                </div>
                {d.listener_count > 0 && <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(11,37,69,0.4)' }}>👁 {d.listener_count} listening</div>}
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ width: 420, flexShrink: 0, borderRadius: 20, background: '#fff', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 2px 16px rgba(11,37,69,0.04)', overflow: 'hidden' }}>
            {/* Detail header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(11,37,69,0.06)', background: 'linear-gradient(135deg, #0B2545, #163a64)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: (statusColors[selected.status] || {}).bg, color: (statusColors[selected.status] || {}).text }}>{(statusColors[selected.status] || {}).label}</span>
                <button className="ad-btn" onClick={function() { setSelected(null); }} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 18, color: 'rgba(255,255,255,0.5)', background: 'transparent' }}>×</button>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: font }}>{selected.topic}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{fmtDate(selected.scheduled_at)}</p>
            </div>

            {/* Detail info */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, margin: '0 0 4px', textTransform: 'uppercase' }}>Proposition</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{getUserName(selected.creator_id)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, margin: '0 0 4px', textTransform: 'uppercase' }}>Opposition</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{selected.opponent_id ? getUserName(selected.opponent_id) : 'TBD'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(11,37,69,0.04)', color: C.navy }}>👁 {selected.listener_count || 0} listeners</span>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(11,37,69,0.04)', color: C.navy }}>📋 {selected.challenge_type}</span>
                {selected.audio_room_url && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(22,163,74,0.08)', color: C.green }}>🔊 Audio active</span>}
                {selected.current_section && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(197,150,12,0.08)', color: C.darkGold }}>📌 {selected.current_section}</span>}
              </div>
              {selected.description && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.55)', margin: '12px 0 0', lineHeight: 1.5 }}>{selected.description}</p>}
            </div>

            {/* Format */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, margin: '0 0 8px', textTransform: 'uppercase' }}>Format</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(selected.format).map(function(e) {
                  return <span key={e[0]} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(11,37,69,0.03)', color: C.navy, fontWeight: 500 }}>{e[0]}: {Math.round(e[1] / 60)}m</span>;
                })}
              </div>
            </div>

            {/* Chat moderation */}
            <div style={{ padding: '12px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, margin: '0 0 8px', textTransform: 'uppercase' }}>Chat Messages ({chatMessages.length})</p>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {chatMessages.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0, textAlign: 'center', padding: 20 }}>No chat messages</p>
                ) : chatMessages.map(function(m) {
                  var u = chatUsers[m.user_id] || debateUsers[m.user_id];
                  return (
                    <div key={m.id} style={{
                      padding: '8px 10px', marginBottom: 4, borderRadius: 8,
                      background: m.is_flagged ? 'rgba(239,68,68,0.06)' : 'rgba(11,37,69,0.02)',
                      border: m.is_flagged ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent',
                      opacity: m.is_flagged ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>{u ? u.full_name : '...'}</span>
                          <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)', marginLeft: 6 }}>{new Date(m.created_at).toLocaleTimeString()}</span>
                          <p style={{ fontSize: 12, color: C.navy, margin: '2px 0 0', lineHeight: 1.4 }}>{m.content}</p>
                        </div>
                        {!m.is_flagged && (
                          <button className="ad-btn" onClick={function() { handleFlagMessage(selected.id, m.id); }}
                            style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.06)', color: C.red, flexShrink: 0 }}>
                            🚩 Flag
                          </button>
                        )}
                        {m.is_flagged && <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>Flagged</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(11,37,69,0.06)', background: 'rgba(11,37,69,0.02)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                  <button className="ad-btn" onClick={function() { handleCancel(selected.id); }}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: C.red, color: '#fff' }}>
                    Cancel Debate
                  </button>
                )}
                {!selected.audio_room_url && (selected.status === 'confirmed' || selected.status === 'waiting_room') && (
                  <button className="ad-btn" onClick={function() { handleCreateRoom(selected.id); }}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff' }}>
                    🔊 Create Audio Room
                  </button>
                )}
                <button className="ad-btn" onClick={function() { window.open('/citizen/debates/' + selected.id, '_blank'); }}
                  style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'rgba(11,37,69,0.06)', color: C.navy }}>
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

