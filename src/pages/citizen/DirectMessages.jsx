// src/pages/citizen/DirectMessages.jsx — 1:1 messaging between citizens
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/useAuth";

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#1A7A3C' };
var font = 'Libre Baskerville, Georgia, serif';

function timeAgo(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'now';
  if (d < 3600) return Math.floor(d / 60) + 'm';
  if (d < 86400) return Math.floor(d / 3600) + 'h';
  return Math.floor(d / 86400) + 'd ago';
}

function Avatar({ name, size }) {
  size = size || 36;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #122e56 100%)',
      border: '2px solid ' + C.gold + '33',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: size * 0.33, fontWeight: 700, color: C.gold, fontFamily: font,
    }}>
      {initials}
    </div>
  );
}

export default function DirectMessages() {
  var { userId } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();
  var [otherUser, setOtherUser] = useState(null);
  var [messages, setMessages] = useState([]);
  var [text, setText] = useState('');
  var [loading, setLoading] = useState(true);
  var [sending, setSending] = useState(false);
  var bottomRef = useRef(null);
  var inputRef = useRef(null);

  useEffect(function() {
    if (user && userId) loadAll();
  }, [user, userId]);

  // Realtime subscription
  useEffect(function() {
    if (!user) return;
    var channel = supabase.channel('dm-' + user.id + '-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: 'sender_id=eq.' + userId,
      }, function(payload) {
        if (payload.new.receiver_id === user.id) {
          setMessages(function(prev) { return prev.concat([payload.new]); });
          // Mark as read immediately
          supabase.from('direct_messages').update({ is_read: true }).eq('id', payload.new.id);
          setTimeout(function() { bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, 50);
        }
      })
      .subscribe();

    return function() { supabase.removeChannel(channel); };
  }, [user, userId]);

  async function loadAll() {
    setLoading(true);

    // Get other user's profile
    var { data: prof } = await supabase.from('users')
      .select('id, full_name, identity_verified')
      .eq('id', userId).single();
    setOtherUser(prof);

    // Get messages between us
    var { data: msgs } = await supabase.from('direct_messages')
      .select('*')
      .or(
        'and(sender_id.eq.' + user.id + ',receiver_id.eq.' + userId + '),' +
        'and(sender_id.eq.' + userId + ',receiver_id.eq.' + user.id + ')'
      )
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(msgs || []);

    // Mark received messages as read
    await supabase.from('direct_messages')
      .update({ is_read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    setLoading(false);
    setTimeout(function() { bottomRef.current && bottomRef.current.scrollIntoView(); }, 100);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    var content = text.trim();
    setText('');

    var { data, error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: userId,
      content: content,
      is_read: false,
    }).select().single();

    if (!error && data) {
      setMessages(function(prev) { return prev.concat([data]); });
      // Send notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'reply',
        content: (otherUser ? 'New message from you' : 'New message'),
        link: '/citizen/messages/' + user.id,
        is_read: false,
      });
    }

    setSending(false);
    setTimeout(function() { bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, 50);
    inputRef.current && inputRef.current.focus();
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!otherUser) return (
    <div style={{ textAlign: 'center', padding: 80, fontFamily: 'DM Sans, sans-serif' }}>
      <p style={{ fontSize: 48, margin: '0 0 12px' }}>✉️</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>User not found</p>
      <button onClick={function() { navigate(-1); }}
        style={{ marginTop: 12, padding: '8px 20px', background: C.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Go Back
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px', background: '#fff', borderRadius: '16px 16px 0 0',
        border: '1px solid rgba(11,37,69,0.07)', borderBottom: 'none',
        boxShadow: '0 2px 8px rgba(11,37,69,0.04)',
      }}>
        <button onClick={function() { navigate(-1); }}
          style={{
            width: 36, height: 36, borderRadius: 10, background: C.cream,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: C.navy, fontSize: 16, flexShrink: 0,
          }}>
          ←
        </button>
        <Avatar name={otherUser.full_name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              onClick={function() { navigate('/citizen/profile/' + userId); }}
              style={{ fontSize: 15, fontWeight: 700, color: C.navy, cursor: 'pointer', fontFamily: font }}>
              {otherUser.full_name}
            </span>
            {otherUser.identity_verified && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: C.gold,
                background: C.gold + '18', padding: '2px 6px', borderRadius: 10,
              }}>✓ VERIFIED</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)' }}>Direct Message</span>
        </div>
        <button onClick={function() { navigate('/citizen/profile/' + userId); }}
          style={{
            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: 'rgba(11,37,69,0.04)', color: C.navy,
            border: '1px solid rgba(11,37,69,0.08)', cursor: 'pointer',
          }}>
          View Profile
        </button>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 18px',
        background: C.cream, borderLeft: '1px solid rgba(11,37,69,0.07)',
        borderRight: '1px solid rgba(11,37,69,0.07)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 40, margin: '0 0 8px' }}>💬</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>Start the conversation</p>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Say hello to {otherUser.full_name}!</p>
          </div>
        ) : messages.map(function(msg) {
          var isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px',
                background: isMe ? C.navy : '#fff',
                color: isMe ? C.cream : C.navy,
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: '0 1px 4px rgba(11,37,69,0.08)',
                border: isMe ? 'none' : '1px solid rgba(11,37,69,0.06)',
              }}>
                <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.4)' : 'rgba(11,37,69,0.3)' }}>
                    {timeAgo(msg.created_at)}
                  </span>
                  {isMe && msg.is_read && (
                    <span style={{ fontSize: 10, color: C.gold }}>✓ read</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 18px', background: '#fff',
        borderRadius: '0 0 16px 16px',
        border: '1px solid rgba(11,37,69,0.07)', borderTop: 'none',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <input
          ref={inputRef}
          value={text}
          onChange={function(e) { setText(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={'Message ' + (otherUser.full_name.split(' ')[0]) + '...'}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 20,
            border: '1.5px solid rgba(11,37,69,0.1)', background: C.cream,
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: C.navy,
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={function(e) { e.target.style.borderColor = C.gold; }}
          onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
        />
        <button onClick={sendMessage} disabled={!text.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: text.trim() ? C.navy : 'rgba(11,37,69,0.06)',
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: text.trim() ? C.gold : 'rgba(11,37,69,0.2)',
            transition: 'all 0.15s', flexShrink: 0,
            boxShadow: text.trim() ? '0 2px 8px rgba(11,37,69,0.3)' : 'none',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

