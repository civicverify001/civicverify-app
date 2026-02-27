// src/pages/citizen/Messages.jsx — DM Inbox listing all conversations
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', muted: '#64748b' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

function Avatar({ name, url, size }) {
  size = size || 44;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + C.gold + '22', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.navy + ', #122e56)', border: '2px solid ' + C.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontSize: size * 0.33, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  var s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return new Date(ts).toLocaleDateString();
}

export default function Messages() {
  var { user } = useAuth();
  var navigate = useNavigate();
  var [convos, setConvos] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');

  useEffect(function() {
    if (user) loadConversations();
  }, [user]);

  async function loadConversations() {
    setLoading(true);

    // Get all DMs involving this user
    var { data: allMsgs } = await supabase.from('direct_messages')
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .or('sender_id.eq.' + user.id + ',receiver_id.eq.' + user.id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!allMsgs || allMsgs.length === 0) {
      setConvos([]);
      setLoading(false);
      return;
    }

    // Group by conversation partner
    var map = {};
    (allMsgs || []).forEach(function(msg) {
      var partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!map[partnerId]) {
        map[partnerId] = {
          partnerId: partnerId,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          unread: 0,
        };
      }
      if (msg.receiver_id === user.id && !msg.is_read) {
        map[partnerId].unread++;
      }
    });

    // Fetch user profiles for all partners
    var partnerIds = Object.keys(map);
    var { data: profiles } = await supabase.from('users')
      .select('id, full_name, identity_verified, avatar_url')
      .in('id', partnerIds);

    var profileMap = {};
    (profiles || []).forEach(function(p) { profileMap[p.id] = p; });

    // Build sorted list
    var list = partnerIds.map(function(pid) {
      var c = map[pid];
      var prof = profileMap[pid] || {};
      return {
        partnerId: pid,
        name: prof.full_name || 'Unknown',
        verified: prof.identity_verified,
        avatarUrl: prof.avatar_url,
        lastMessage: c.lastMessage,
        lastTime: c.lastTime,
        unread: c.unread,
      };
    }).sort(function(a, b) { return new Date(b.lastTime) - new Date(a.lastTime); });

    setConvos(list);
    setLoading(false);
  }

  var filtered = convos.filter(function(c) {
    return !search.trim() || c.name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: sans }}>
      <div style={{ width: 28, height: 28, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: sans }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>Messages</h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Your conversations with fellow citizens</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input value={search} onChange={function(e) { setSearch(e.target.value); }}
          placeholder="Search conversations..."
          style={{
            width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12,
            border: '1.5px solid rgba(11,37,69,0.08)', background: '#fff',
            fontFamily: sans, fontSize: 14, color: C.navy, outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
          onFocus={function(e) { e.target.style.borderColor = C.gold; }}
          onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.08)'; }}
        />
      </div>

      {/* Conversation list */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(11,37,69,0.06)', background: '#fff' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>💬</p>
            <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>
              {search ? 'No matching conversations' : 'No messages yet'}
            </p>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 16px' }}>
              {search ? 'Try a different search' : 'Visit a profile and click "Message" to start chatting'}
            </p>
            <button onClick={function() { navigate('/citizen/community'); }}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.navy, color: C.gold, fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Browse Community
            </button>
          </div>
        ) : filtered.map(function(convo, i) {
          return (
            <div key={convo.partnerId}
              onClick={function() { navigate('/citizen/messages/' + convo.partnerId); }}
              style={{
                display: 'flex', gap: 12, padding: '14px 18px', cursor: 'pointer',
                background: convo.unread > 0 ? 'rgba(197,150,12,0.03)' : '#fff',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(11,37,69,0.04)' : 'none',
                transition: 'background 0.15s', alignItems: 'center',
              }}
              onMouseEnter={function(e) { e.currentTarget.style.background = C.cream; }}
              onMouseLeave={function(e) { e.currentTarget.style.background = convo.unread > 0 ? 'rgba(197,150,12,0.03)' : '#fff'; }}>
              <Avatar name={convo.name} url={convo.avatarUrl} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 14, fontWeight: convo.unread > 0 ? 700 : 600, color: C.navy,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{convo.name}</span>
                  {convo.verified && (
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: C.gold, background: C.gold + '15', padding: '1px 5px', borderRadius: 8, flexShrink: 0 }}>✓</span>
                  )}
                  <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', marginLeft: 'auto', flexShrink: 0 }}>{timeAgo(convo.lastTime)}</span>
                </div>
                <p style={{
                  fontSize: 13, color: convo.unread > 0 ? C.navy : C.muted, margin: 0,
                  fontWeight: convo.unread > 0 ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '90%',
                }}>{convo.lastMessage}</p>
              </div>
              {convo.unread > 0 && (
                <span style={{
                  minWidth: 20, height: 20, borderRadius: 10, background: C.gold,
                  color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0,
                }}>{convo.unread}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
