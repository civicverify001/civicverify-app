// src/pages/citizen/Messages.jsx — DM Inbox listing all conversations
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', muted: '#64748b' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

// Assign a gradient per conversation based on name hash
var GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
  'linear-gradient(135deg, #ff9a9e, #fecfef)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
  'linear-gradient(135deg, #fd7043, #ff8a65)',
];

function getGradient(name) {
  var hash = (name || 'A').split('').reduce(function(acc, c) { return acc + c.charCodeAt(0); }, 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

function Avatar({ name, url, size }) {
  size = size || 44;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  if (url) return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', flexShrink: 0 }} />
    </div>
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getGradient(name),
      border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font, fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }}>
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

    var map = {};
    (allMsgs || []).forEach(function(msg) {
      var partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!map[partnerId]) {
        map[partnerId] = { partnerId, lastMessage: msg.content, lastTime: msg.created_at, unread: 0 };
      }
      if (msg.receiver_id === user.id && !msg.is_read) map[partnerId].unread++;
    });

    var partnerIds = Object.keys(map);
    var { data: profiles } = await supabase.from('users')
      .select('id, full_name, identity_verified, avatar_url')
      .in('id', partnerIds);

    var profileMap = {};
    (profiles || []).forEach(function(p) { profileMap[p.id] = p; });

    var list = partnerIds.map(function(pid) {
      var c = map[pid];
      var prof = profileMap[pid] || {};
      return { partnerId: pid, name: prof.full_name || 'Unknown', verified: prof.identity_verified, avatarUrl: prof.avatar_url, lastMessage: c.lastMessage, lastTime: c.lastTime, unread: c.unread };
    }).sort(function(a, b) { return new Date(b.lastTime) - new Date(a.lastTime); });

    setConvos(list);
    setLoading(false);
  }

  var filtered = convos.filter(function(c) {
    return !search.trim() || c.name.toLowerCase().includes(search.toLowerCase());
  });

  var totalUnread = convos.reduce(function(a, c) { return a + c.unread; }, 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: sans }}>
      <div style={{ width: 28, height: 28, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: sans }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .msg-row{transition:all 0.18s ease;cursor:pointer}
        .msg-row:hover{transform:translateX(4px)}
        .search-input:focus{border-color:${C.gold}!important;box-shadow:0 0 0 3px rgba(197,150,12,0.12)!important}
      `}</style>

      {/* ── Colorful Hero Header ── */}
      <div style={{
        borderRadius: 22,
        background: 'linear-gradient(135deg, #0B2545 0%, #1a3a6a 50%, #0B2545 100%)',
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(11,37,69,0.18)',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(197,150,12,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(100,180,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: 120, width: 40, height: 40, borderRadius: '50%', background: 'rgba(197,150,12,0.18)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, ' + C.gold + ', #e8a838)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(197,150,12,0.35)' }}>
                <span style={{ fontSize: 22 }}>✉️</span>
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>Messages</h1>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Citizens · Verified Conversations</p>
              </div>
            </div>
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{convos.length}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 5 }}>conversations</span>
            </div>
            {totalUnread > 0 && (
              <div style={{ padding: '8px 16px', borderRadius: 20, background: 'linear-gradient(135deg, ' + C.gold + ', #e8a838)', boxShadow: '0 2px 10px rgba(197,150,12,0.4)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{totalUnread}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginLeft: 5 }}>unread</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="search-input"
          value={search}
          onChange={function(e) { setSearch(e.target.value); }}
          placeholder="Search by name..."
          style={{
            width: '100%', padding: '12px 14px 12px 42px', borderRadius: 14,
            border: '1.5px solid rgba(11,37,69,0.08)', background: '#fff',
            fontFamily: sans, fontSize: 14, color: C.navy, outline: 'none',
            boxSizing: 'border-box', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(11,37,69,0.04)',
          }}
        />
      </div>

      {/* ── Conversations ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center',
          background: '#fff', borderRadius: 20,
          border: '1px solid rgba(11,37,69,0.05)',
          boxShadow: '0 2px 16px rgba(11,37,69,0.04)',
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(197,150,12,0.1), rgba(197,150,12,0.18))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>💬</div>
          <p style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>
            {search ? 'No matching conversations' : 'No messages yet'}
          </p>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
            {search ? 'Try a different name' : 'Visit a citizen\'s profile and click "Message" to start chatting'}
          </p>
          <button onClick={function() { navigate('/citizen/community'); }}
            style={{ padding: '11px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)', color: C.gold, fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(11,37,69,0.2)' }}>
            Browse Community →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map(function(convo, i) {
            var grad = getGradient(convo.name);
            return (
              <div
                key={convo.partnerId}
                className="msg-row"
                onClick={function() { navigate('/citizen/messages/' + convo.partnerId); }}
                style={{
                  display: 'flex', gap: 14, padding: '14px 18px',
                  background: convo.unread > 0 ? '#fffdf5' : '#fff',
                  borderRadius: 16,
                  border: convo.unread > 0 ? '1.5px solid rgba(197,150,12,0.2)' : '1.5px solid rgba(11,37,69,0.05)',
                  alignItems: 'center',
                  boxShadow: convo.unread > 0 ? '0 2px 12px rgba(197,150,12,0.08)' : '0 1px 6px rgba(11,37,69,0.04)',
                  animation: 'fadeSlide 0.3s ease both',
                  animationDelay: (i * 0.04) + 's',
                }}
              >
                {/* Colored left accent bar */}
                <div style={{ width: 3, height: 44, borderRadius: 2, background: convo.unread > 0 ? grad : 'transparent', flexShrink: 0, transition: 'background 0.2s' }} />

                <Avatar name={convo.name} url={convo.avatarUrl} size={46} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 14, fontWeight: convo.unread > 0 ? 700 : 600, color: C.navy,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{convo.name}</span>
                    {convo.verified && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, color: '#fff',
                        background: 'linear-gradient(135deg, ' + C.gold + ', #e8a838)',
                        padding: '2px 6px', borderRadius: 8, flexShrink: 0, letterSpacing: 0.3,
                        boxShadow: '0 1px 4px rgba(197,150,12,0.3)',
                      }}>✓ VERIFIED</span>
                    )}
                    <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', marginLeft: 'auto', flexShrink: 0, fontWeight: 500 }}>{timeAgo(convo.lastTime)}</span>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: convo.unread > 0 ? C.navy : C.muted,
                    margin: 0, fontWeight: convo.unread > 0 ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '90%', lineHeight: 1.4,
                  }}>{convo.lastMessage}</p>
                </div>

                {convo.unread > 0 ? (
                  <div style={{
                    minWidth: 24, height: 24, borderRadius: 12,
                    background: 'linear-gradient(135deg, ' + C.gold + ', #e8a838)',
                    color: '#fff', fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 7px', flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(197,150,12,0.35)',
                  }}>{convo.unread}</div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(11,37,69,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
