// src/pages/citizen/DirectMessages.jsx — Enhanced with emoji picker + image sending
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/useAuth";

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#1A7A3C', purple: '#7c3aed' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

// Gradient per user name hash
var GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fd7043, #ff8a65)',
  'linear-gradient(135deg, #0B2545, #1a3a6a)',
];
function getGradient(name) {
  var hash = (name || 'A').split('').reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

// ── Emoji data ───────────────────────────────────────────────────────────────
var EMOJI_CATEGORIES = [
  { label: '😀 Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🥳','😎','🥸','🤩'] },
  { label: '👍 Gestures', emojis: ['👍','👎','👏','🙌','🤝','👐','🤲','🙏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','💪','🦾','🖕','✍️','💅','🤳','💃','🕺','🫶','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'] },
  { label: '🎉 Celebration', emojis: ['🎉','🎊','🎈','🎁','🏆','🥇','🥈','🥉','🎖','🎗','🏅','🎀','🎆','🎇','🧨','✨','🌟','💫','⭐','🌠','🎃','🎄','🎋','🎍','🎎','🎏','🎐','🧧','🎑','🎠','🎡','🎢','🎭','🎨','🖼','🎬','🎤','🎧','🎼','🎵','🎶','🎻','🎸','🎹','🥁'] },
  { label: '🐶 Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🦄','🐝','🦋','🐛','🦟','🦗','🕷','🐢','🦎','🐍','🦕','🐙','🦑','🦀','🐡','🐬','🐳','🦈','🦭','🐊','🦓','🦒'] },
  { label: '🍕 Food', emojis: ['🍕','🍔','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🥣','🥗','🍿','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍞','🥐','🥖','🫓','🥨','🥯','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍩','🍪','🍦','🍧','🍨','🧃','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷'] },
  { label: '🌍 Nature', emojis: ['🌍','🌎','🌏','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌙','🌚','🌛','🌜','☀️','🌝','🌞','🌟','⭐','💫','✨','☁️','⛅','🌤','🌥','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄','🌊','💧','🔥','🌈','🌀','🌪','🌫','⚡','🌲','🌳','🌴','🌵','🌾','🍀','🌸','🌺'] },
];

// ── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  var [tab, setTab] = useState(0);
  var ref = useRef(null);

  useEffect(function() {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: 56, left: 0,
      width: 320, borderRadius: 18,
      background: '#fff', border: '1px solid rgba(11,37,69,0.1)',
      boxShadow: '0 8px 32px rgba(11,37,69,0.15)',
      zIndex: 100, overflow: 'hidden',
      animation: 'emojiPop 0.18s ease',
    }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(11,37,69,0.06)', background: '#fafbfc', overflowX: 'auto' }}>
        {EMOJI_CATEGORIES.map(function(cat, i) {
          return (
            <button key={i} onClick={function() { setTab(i); }}
              style={{ padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, opacity: tab === i ? 1 : 0.4, borderBottom: tab === i ? '2px solid ' + C.gold : '2px solid transparent', transition: 'all 0.15s', flexShrink: 0 }}>
              {cat.emojis[0]}
            </button>
          );
        })}
      </div>
      {/* Emoji grid */}
      <div style={{ padding: 10, maxHeight: 200, overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>{EMOJI_CATEGORIES[tab].label.split(' ').slice(1).join(' ')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {EMOJI_CATEGORIES[tab].emojis.map(function(em, i) {
            return (
              <button key={i} onClick={function() { onSelect(em); }}
                style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, borderRadius: 8, transition: 'background 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(197,150,12,0.1)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; }}>
                {em}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Quick Reactions ───────────────────────────────────────────────────────────
var QUICK_REACTIONS = ['❤️','😂','😮','😢','👍','🔥'];

function MessageBubble({ msg, isMe, onReact }) {
  var [showReactions, setShowReactions] = useState(false);
  var reactions = msg.reactions || {};
  var hasReactions = Object.keys(reactions).length > 0;

  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: hasReactions ? 18 : 2, position: 'relative' }}
      onMouseEnter={function() { setShowReactions(true); }}
      onMouseLeave={function() { setShowReactions(false); }}>

      <div style={{ maxWidth: '72%', position: 'relative' }}>
        {/* Image message */}
        {msg.image_url && (
          <div style={{ marginBottom: msg.content ? 6 : 0 }}>
            <img src={msg.image_url} alt="shared" style={{
              maxWidth: '100%', maxHeight: 240, borderRadius: 14,
              display: 'block', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(11,37,69,0.12)',
              border: isMe ? 'none' : '1px solid rgba(11,37,69,0.08)',
            }}
              onClick={function() { window.open(msg.image_url, '_blank'); }}
            />
          </div>
        )}

        {/* Text bubble */}
        {msg.content && (
          <div style={{
            padding: '10px 14px',
            background: isMe
              ? 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)'
              : '#fff',
            color: isMe ? '#fff' : C.navy,
            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            boxShadow: isMe ? '0 2px 12px rgba(11,37,69,0.2)' : '0 1px 6px rgba(11,37,69,0.07)',
            border: isMe ? 'none' : '1px solid rgba(11,37,69,0.06)',
          }}>
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.35)' : 'rgba(11,37,69,0.25)', fontWeight: 500 }}>
                {timeAgo(msg.created_at)}
              </span>
              {isMe && msg.is_read && <span style={{ fontSize: 9, color: C.gold }}>✓✓</span>}
            </div>
          </div>
        )}

        {/* Existing reactions */}
        {hasReactions && (
          <div style={{
            position: 'absolute', bottom: -16, right: isMe ? 0 : 'auto', left: isMe ? 'auto' : 0,
            display: 'flex', gap: 3,
          }}>
            {Object.entries(reactions).map(function(entry) {
              return (
                <span key={entry[0]} onClick={function() { onReact && onReact(msg.id, entry[0]); }}
                  style={{ fontSize: 13, background: '#fff', border: '1.5px solid rgba(11,37,69,0.08)', borderRadius: 20, padding: '2px 6px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(11,37,69,0.1)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  {entry[0]} <span style={{ fontSize: 10, fontWeight: 700, color: C.navy }}>{entry[1]}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Hover reaction bar */}
        {showReactions && (
          <div style={{
            position: 'absolute', top: -36, right: isMe ? 0 : 'auto', left: isMe ? 'auto' : 0,
            display: 'flex', gap: 3, background: '#fff', borderRadius: 20, padding: '4px 8px',
            boxShadow: '0 4px 16px rgba(11,37,69,0.12)', border: '1px solid rgba(11,37,69,0.07)',
            animation: 'emojiPop 0.15s ease', zIndex: 10,
          }}>
            {QUICK_REACTIONS.map(function(em) {
              return (
                <button key={em} onClick={function() { onReact && onReact(msg.id, em); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 3px', borderRadius: 8, transition: 'transform 0.1s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.transform = 'scale(1.3)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.transform = 'scale(1)'; }}>
                  {em}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

function Avatar({ name, url, size }) {
  size = size || 36;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getGradient(name),
      border: '2px solid rgba(255,255,255,0.8)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', fontFamily: font,
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }}>
      {initials}
    </div>
  );
}

// ── Date separator ────────────────────────────────────────────────────────────
function DateSep({ date }) {
  var d = new Date(date);
  var today = new Date();
  var yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  var label = d.toDateString() === today.toDateString() ? 'Today'
    : d.toDateString() === yesterday.toDateString() ? 'Yesterday'
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(11,37,69,0.08)' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.3)', background: 'rgba(11,37,69,0.04)', padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(11,37,69,0.08)' }} />
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DirectMessages() {
  var { userId } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();
  var [otherUser, setOtherUser] = useState(null);
  var [messages, setMessages] = useState([]);
  var [text, setText] = useState('');
  var [loading, setLoading] = useState(true);
  var [sending, setSending] = useState(false);
  var [showEmoji, setShowEmoji] = useState(false);
  var [uploadingImg, setUploadingImg] = useState(false);
  var [imagePreview, setImagePreview] = useState(null);
  var [imageFile, setImageFile] = useState(null);
  var bottomRef = useRef(null);
  var inputRef = useRef(null);
  var imgInputRef = useRef(null);

  useEffect(function() {
    if (user && userId) loadAll();
  }, [user, userId]);

  useEffect(function() {
    if (!user) return;
    var channel = supabase.channel('dm-' + user.id + '-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: 'sender_id=eq.' + userId,
      }, function(payload) {
        if (payload.new.receiver_id === user.id) {
          setMessages(function(prev) { return prev.concat([payload.new]); });
          supabase.from('direct_messages').update({ is_read: true }).eq('id', payload.new.id);
          setTimeout(function() { bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, 50);
        }
      })
      .subscribe();
    return function() { supabase.removeChannel(channel); };
  }, [user, userId]);

  async function loadAll() {
    setLoading(true);
    var { data: prof } = await supabase.from('users')
      .select('id, full_name, identity_verified, avatar_url').eq('id', userId).single();
    setOtherUser(prof);

    var { data: msgs } = await supabase.from('direct_messages')
      .select('*')
      .or('and(sender_id.eq.' + user.id + ',receiver_id.eq.' + userId + '),and(sender_id.eq.' + userId + ',receiver_id.eq.' + user.id + ')')
      .order('created_at', { ascending: true }).limit(200);
    setMessages(msgs || []);

    await supabase.from('direct_messages').update({ is_read: true })
      .eq('sender_id', userId).eq('receiver_id', user.id).eq('is_read', false);

    setLoading(false);
    setTimeout(function() { bottomRef.current && bottomRef.current.scrollIntoView(); }, 100);
  }

  function handleImageSelect(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    var reader = new FileReader();
    reader.onload = function(ev) { setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function removeImagePreview() { setImagePreview(null); setImageFile(null); if (imgInputRef.current) imgInputRef.current.value = ''; }

  async function uploadImage(file) {
    var ext = file.name.split('.').pop() || 'jpg';
    var path = 'dm/' + user.id + '/' + Date.now() + '.' + ext;
    var { error } = await supabase.storage.from('chat-images').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    var { data } = supabase.storage.from('chat-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function sendMessage() {
    if ((!text.trim() && !imageFile) || sending) return;
    setSending(true);
    var content = text.trim();
    var imageUrl = null;

    if (imageFile) {
      setUploadingImg(true);
      try { imageUrl = await uploadImage(imageFile); } catch(e) { setUploadingImg(false); setSending(false); return; }
      setUploadingImg(false);
    }

    setText('');
    removeImagePreview();

    var { data, error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: userId,
      content: content || null,
      image_url: imageUrl,
      is_read: false,
    }).select().single();

    if (!error && data) {
      setMessages(function(prev) { return prev.concat([data]); });
      await supabase.from('notifications').insert({
        user_id: userId, type: 'reply',
        content: imageUrl ? '📷 Sent you a photo' : 'New message',
        link: '/citizen/messages/' + user.id, is_read: false,
      });
    }
    setSending(false);
    setTimeout(function() { bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, 50);
    inputRef.current && inputRef.current.focus();
  }

  function addEmoji(em) {
    setText(function(prev) { return prev + em; });
    inputRef.current && inputRef.current.focus();
  }

  async function handleReact(msgId, emoji) {
    // Update reactions optimistically
    setMessages(function(prev) {
      return prev.map(function(m) {
        if (m.id !== msgId) return m;
        var reactions = Object.assign({}, m.reactions || {});
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return Object.assign({}, m, { reactions });
      });
    });
    // Persist to DB (requires reactions jsonb column on direct_messages)
    try {
      var { data: current } = await supabase.from('direct_messages').select('reactions').eq('id', msgId).single();
      var existing = current && current.reactions ? current.reactions : {};
      existing[emoji] = (existing[emoji] || 0) + 1;
      await supabase.from('direct_messages').update({ reactions: existing }).eq('id', msgId);
    } catch(e) { /* silent fail — reactions are optional */ }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: sans }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!otherUser) return (
    <div style={{ textAlign: 'center', padding: 80, fontFamily: sans }}>
      <p style={{ fontSize: 48, margin: '0 0 12px' }}>✉️</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>User not found</p>
      <button onClick={function() { navigate(-1); }}
        style={{ marginTop: 12, padding: '8px 20px', background: C.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        Go Back
      </button>
    </div>
  );

  // Group messages by date for separators
  var grouped = [];
  var lastDate = null;
  messages.forEach(function(msg) {
    var d = new Date(msg.created_at).toDateString();
    if (d !== lastDate) { grouped.push({ type: 'date', date: msg.created_at }); lastDate = d; }
    grouped.push({ type: 'msg', msg });
  });

  return (
    <div style={{ fontFamily: sans, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes emojiPop{from{opacity:0;transform:scale(0.9) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes imgPreviewIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .dm-send-btn:hover{transform:scale(1.05)}
        .dm-send-btn:active{transform:scale(0.96)}
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px',
        background: 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)',
        borderRadius: '18px 18px 0 0',
        boxShadow: '0 4px 16px rgba(11,37,69,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(197,150,12,0.1)', pointerEvents: 'none' }} />

        <button onClick={function() { navigate(-1); }}
          style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, flexShrink: 0, transition: 'background 0.15s' }}
          onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
          ←
        </button>

        <Avatar name={otherUser.full_name} url={otherUser.avatar_url} size={42} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span onClick={function() { navigate('/citizen/profile/' + userId); }}
              style={{ fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {otherUser.full_name}
            </span>
            {otherUser.identity_verified && (
              <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, ' + C.gold + ', #e8a838)', padding: '2px 7px', borderRadius: 10, flexShrink: 0, letterSpacing: 0.3, boxShadow: '0 1px 4px rgba(197,150,12,0.4)' }}>✓ VERIFIED</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Direct Message</span>
        </div>

        <button onClick={function() { navigate('/citizen/profile/' + userId); }}
          style={{ padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
          Profile
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 18px',
        background: 'linear-gradient(180deg, #f0f4f8 0%, #e8eef5 100%)',
        borderLeft: '1px solid rgba(11,37,69,0.07)',
        borderRight: '1px solid rgba(11,37,69,0.07)',
        display: 'flex', flexDirection: 'column',
      }}>
        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 14px', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 2px 12px rgba(11,37,69,0.08)' }}>💬</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Start the conversation</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Say hello to {otherUser.full_name}! 👋</p>
          </div>
        ) : grouped.map(function(item, idx) {
          if (item.type === 'date') return <DateSep key={'d-' + idx} date={item.date} />;
          var msg = item.msg;
          var isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} style={{ animation: 'fadeIn 0.2s ease' }}>
              <MessageBubble msg={msg} isMe={isMe} onReact={handleReact} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Image Preview ── */}
      {imagePreview && (
        <div style={{
          background: '#fff', borderLeft: '1px solid rgba(11,37,69,0.07)', borderRight: '1px solid rgba(11,37,69,0.07)',
          padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'imgPreviewIn 0.2s ease',
          borderTop: '1px solid rgba(11,37,69,0.06)',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={imagePreview} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '2px solid ' + C.gold + '33', boxShadow: '0 2px 8px rgba(11,37,69,0.1)' }} />
            <button onClick={removeImagePreview}
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
              ✕
            </button>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>📷 Image ready to send</p>
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Add a caption or send as-is</p>
          </div>
          {uploadingImg && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, border: '2px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)' }}>Uploading...</span>
            </div>
          )}
        </div>
      )}

      {/* ── Input Bar ── */}
      <div style={{
        padding: '10px 12px',
        background: '#fff',
        borderRadius: '0 0 18px 18px',
        border: '1px solid rgba(11,37,69,0.07)', borderTop: 'none',
        boxShadow: '0 -2px 12px rgba(11,37,69,0.04)',
        position: 'relative',
      }}>
        {/* Emoji Picker */}
        {showEmoji && <EmojiPicker onSelect={addEmoji} onClose={function() { setShowEmoji(false); }} />}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {/* Emoji button */}
          <button onClick={function() { setShowEmoji(function(v) { return !v; }); }}
            style={{ width: 38, height: 38, borderRadius: 12, background: showEmoji ? C.gold + '18' : 'rgba(11,37,69,0.04)', border: showEmoji ? '1.5px solid ' + C.gold + '44' : '1.5px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'all 0.15s', flexShrink: 0 }}>
            😊
          </button>

          {/* Image button */}
          <button onClick={function() { imgInputRef.current && imgInputRef.current.click(); }}
            disabled={uploadingImg}
            style={{ width: 38, height: 38, borderRadius: 12, background: imagePreview ? C.gold + '18' : 'rgba(11,37,69,0.04)', border: imagePreview ? '1.5px solid ' + C.gold + '44' : '1.5px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.15s', flexShrink: 0 }}>
            📷
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

          {/* Text input */}
          <input
            ref={inputRef}
            value={text}
            onChange={function(e) { setText(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={imagePreview ? 'Add a caption...' : 'Message ' + otherUser.full_name.split(' ')[0] + '...'}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 20,
              border: '1.5px solid rgba(11,37,69,0.1)', background: '#f8fafc',
              fontFamily: sans, fontSize: 14, color: C.navy,
              outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s',
            }}
            onFocus={function(e) { e.target.style.borderColor = C.gold; e.target.style.background = '#fff'; }}
            onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; e.target.style.background = '#f8fafc'; }}
          />

          {/* Send button */}
          <button
            className="dm-send-btn"
            onClick={sendMessage}
            disabled={(!text.trim() && !imageFile) || sending || uploadingImg}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: (text.trim() || imageFile) && !sending
                ? 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)'
                : 'rgba(11,37,69,0.06)',
              cursor: (text.trim() || imageFile) ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: (text.trim() || imageFile) ? C.gold : 'rgba(11,37,69,0.2)',
              transition: 'all 0.15s', flexShrink: 0,
              boxShadow: (text.trim() || imageFile) ? '0 4px 14px rgba(11,37,69,0.25)' : 'none',
            }}>
            {sending ? (
              <div style={{ width: 16, height: 16, border: '2px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
