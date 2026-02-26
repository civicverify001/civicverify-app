// src/pages/citizen/DebateSpace.jsx — Live Debate Room (Polished)
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { startDebate as apiStartDebate, concedeTime as apiConcedeTime } from '../../lib/debateApi';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#a07a0a', cream: '#F5F1EC', green: '#16a34a', darkGreen: '#15803d', red: '#ef4444' };
var font = 'Libre Baskerville, Georgia, serif';

function fmtTimer(seconds) {
  if (seconds < 0) seconds = 0;
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function timeAgo(d) {
  var diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function SpeakerCard({ name, isActive, isVerified, timeLeft, side }) {
  var initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1, minWidth: 150,
      padding: '24px 16px', borderRadius: 20,
      background: isActive ? 'linear-gradient(135deg, rgba(197,150,12,0.06), rgba(197,150,12,0.12))' : 'rgba(11,37,69,0.02)',
      border: isActive ? '2px solid rgba(197,150,12,0.25)' : '2px solid transparent',
      transition: 'all 0.4s ease',
    }}>
      <div style={{
        position: 'relative', width: 88, height: 88, borderRadius: '50%',
        background: isActive ? 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')' : 'linear-gradient(135deg, #94a3b8, #64748b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isActive ? '0 0 0 5px rgba(197,150,12,0.15), 0 8px 24px rgba(197,150,12,0.2)' : '0 4px 12px rgba(11,37,69,0.08)',
        transition: 'all 0.4s ease',
      }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{initial}</span>
        {isActive && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontSize: 14, animation: 'micPulse 1.5s ease-in-out infinite' }}>🎙</span>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>{name || 'TBD'}</p>
        {isVerified && (
          <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: 'rgba(22,163,74,0.08)', padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 4 }}>
            ✓ Verified
          </span>
        )}
      </div>
      <div style={{
        padding: '10px 24px', borderRadius: 14,
        background: isActive ? C.navy : 'rgba(11,37,69,0.06)',
        boxShadow: isActive ? '0 4px 16px rgba(11,37,69,0.2)' : 'none', transition: 'all 0.3s ease',
      }}>
        <span style={{
          fontSize: 28, fontWeight: 700, fontFamily: 'monospace',
          color: isActive ? (timeLeft <= 30 ? '#fca5a5' : '#fff') : 'rgba(11,37,69,0.35)', letterSpacing: 3,
        }}>
          {fmtTimer(timeLeft)}
        </span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? C.gold : 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
        {side}
      </span>
    </div>
  );
}

function ModMessage({ message, eventType, time }) {
  var icons = { mute: '🔇', unmute: '🎙', warning: '⚠️', summary: '📋', announcement: '📜' };
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12, marginBottom: 10,
      background: 'linear-gradient(135deg, rgba(11,37,69,0.03), rgba(197,150,12,0.04))',
      borderLeft: '3px solid ' + C.gold, animation: 'slideUp 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icons[eventType] || '⚖️'}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{message}</p>
          <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.4)', margin: '4px 0 0', fontWeight: 600 }}>{timeAgo(time)}</p>
        </div>
      </div>
    </div>
  );
}

function ChatMsg({ name, content, isVerified: verified, time, isOwn, index }) {
  var isEven = index % 2 === 0;
  var bubbleBg = isEven ? 'rgba(22,163,74,0.08)' : 'rgba(197,150,12,0.08)';
  var bubbleBorder = isEven ? 'rgba(22,163,74,0.15)' : 'rgba(197,150,12,0.15)';
  var nameColor = isEven ? C.green : C.darkGold;
  var avatarBg = isEven ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #C5960C, #a07a0a)';
  return (
    <div style={{
      padding: '10px 12px', marginBottom: 6, borderRadius: 14,
      background: bubbleBg, border: '1px solid ' + bubbleBorder, animation: 'slideUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: avatarBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff',
        }}>
          {(name || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: nameColor }}>{name}</span>
            {verified && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, background: C.green, padding: '1px 5px', borderRadius: 6 }}>✓</span>}
            <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.4)', fontWeight: 500 }}>{timeAgo(time)}</span>
          </div>
          <p style={{ fontSize: 13, color: C.navy, margin: '3px 0 0', lineHeight: 1.45 }}>{content}</p>
        </div>
      </div>
    </div>
  );
}

function PollCard({ poll, onVote }) {
  var options = poll.options || [];
  var votes = poll.votes || {};
  var totalVotes = Object.values(votes).reduce(function(a, b) { return a + b; }, 0);
  var hasVoted = poll.userVote !== undefined && poll.userVote !== null;
  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16, marginBottom: 12,
      background: 'linear-gradient(135deg, #fff, #fefce8)',
      border: '1px solid rgba(197,150,12,0.15)', boxShadow: '0 2px 8px rgba(197,150,12,0.06)',
    }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 14px' }}>📊 {poll.question}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {options.map(function(opt, i) {
          var count = votes[i] || 0;
          var pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          var isSel = poll.userVote === i;
          return (
            <button key={i} onClick={function() { if (!hasVoted) onVote(poll.id, i); }} disabled={hasVoted}
              style={{
                position: 'relative', padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                border: isSel ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.1)',
                background: '#fff', cursor: hasVoted ? 'default' : 'pointer', overflow: 'hidden',
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              }}
            >
              {hasVoted && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: pct + '%', background: isSel ? 'rgba(197,150,12,0.12)' : 'rgba(11,37,69,0.04)', transition: 'width 0.6s ease', borderRadius: 12 }} />}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: isSel ? 700 : 500, color: C.navy }}>{opt}</span>
                {hasVoted && <span style={{ fontSize: 13, fontWeight: 700, color: isSel ? C.gold : 'rgba(11,37,69,0.4)' }}>{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      {totalVotes > 0 && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: '10px 0 0', textAlign: 'right', fontWeight: 600 }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>}
    </div>
  );
}

export default function DebateSpace() {
  var { id } = useParams();
  var navigate = useNavigate();
  var auth = useAuth();
  var currentUser = auth.user;
  var profile = auth.profile;
  var [debate, setDebate] = useState(null);
  var [debaterA, setDebaterA] = useState(null);
  var [debaterB, setDebaterB] = useState(null);
  var [loading, setLoading] = useState(true);
  var [activeTab, setActiveTab] = useState('chat');
  var [timerA, setTimerA] = useState(0);
  var [timerB, setTimerB] = useState(0);
  var timerRef = useRef(null);
  var [modLog, setModLog] = useState([]);
  var modLogRef = useRef(null);
  var [chatMessages, setChatMessages] = useState([]);
  var [chatInput, setChatInput] = useState('');
  var [sendingChat, setSendingChat] = useState(false);
  var chatRef = useRef(null);
  var [chatUsers, setChatUsers] = useState({});
  var [polls, setPolls] = useState([]);
  var [countdown, setCountdown] = useState(null);

  var loadDebate = useCallback(async function() {
    var { data } = await supabase.from('debates').select('*').eq('id', id).single();
    if (!data) { navigate('/citizen/debates'); return; }
    setDebate(data);
    var ids = [data.creator_id, data.opponent_id].filter(Boolean);
    if (ids.length > 0) {
      var { data: users } = await supabase.from('users').select('id, full_name, identity_verified').in('id', ids);
      if (users) { users.forEach(function(u) { if (u.id === data.creator_id) setDebaterA(u); if (u.id === data.opponent_id) setDebaterB(u); }); }
    }
    if (data.format) { var s = Object.entries(data.format); if (s.length > 0) { setTimerA(s[0][1]); setTimerB(s[0][1]); } }
    setLoading(false);
  }, [id, navigate]);

  var loadModLog = useCallback(async function() {
    var { data } = await supabase.from('debate_moderator_log').select('*').eq('debate_id', id).order('created_at', { ascending: true });
    setModLog(data || []);
  }, [id]);

  var loadChat = useCallback(async function() {
    var { data } = await supabase.from('debate_chat_messages').select('*').eq('debate_id', id).eq('is_flagged', false).order('created_at', { ascending: true }).limit(200);
    if (data && data.length > 0) {
      setChatMessages(data);
      var uids = Array.from(new Set(data.map(function(m) { return m.user_id; })));
      var unknowns = uids.filter(function(uid) { return !chatUsers[uid]; });
      if (unknowns.length > 0) {
        var { data: uData } = await supabase.from('users').select('id, full_name, identity_verified').in('id', unknowns);
        if (uData) { var map = Object.assign({}, chatUsers); uData.forEach(function(u) { map[u.id] = u; }); setChatUsers(map); }
      }
    }
  }, [id]);

  var loadPolls = useCallback(async function() {
    var { data: pd } = await supabase.from('debate_polls').select('*').eq('debate_id', id).eq('is_active', true);
    if (pd && pd.length > 0) {
      var enriched = await Promise.all(pd.map(async function(p) {
        var { data: votes } = await supabase.from('debate_poll_votes').select('choice').eq('poll_id', p.id);
        var vc = {}; (votes || []).forEach(function(v) { vc[v.choice] = (vc[v.choice] || 0) + 1; });
        var uv = null;
        if (currentUser) { var { data: mv } = await supabase.from('debate_poll_votes').select('choice').eq('poll_id', p.id).eq('user_id', currentUser.id).single(); if (mv) uv = mv.choice; }
        return Object.assign({}, p, { votes: vc, userVote: uv });
      }));
      setPolls(enriched);
    } else { setPolls([]); }
  }, [id, currentUser]);

  useEffect(function() { loadDebate(); loadModLog(); loadChat(); loadPolls(); }, [loadDebate, loadModLog, loadChat, loadPolls]);

  useEffect(function() {
    var ch = supabase.channel('dc-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_chat_messages', filter: 'debate_id=eq.' + id }, function(p) {
        setChatMessages(function(prev) { return prev.concat([p.new]); });
        var uid = p.new.user_id;
        if (!chatUsers[uid]) supabase.from('users').select('id, full_name, identity_verified').eq('id', uid).single().then(function(r) { if (r.data) setChatUsers(function(prev) { return Object.assign({}, prev, { [uid]: r.data }); }); });
      }).subscribe();
    var ml = supabase.channel('dm-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_moderator_log', filter: 'debate_id=eq.' + id }, function(p) { setModLog(function(prev) { return prev.concat([p.new]); }); }).subscribe();
    var ds = supabase.channel('ds-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'debates', filter: 'id=eq.' + id }, function(p) { setDebate(p.new); }).subscribe();
    return function() { supabase.removeChannel(ch); supabase.removeChannel(ml); supabase.removeChannel(ds); };
  }, [id]);

  useEffect(function() { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chatMessages]);
  useEffect(function() { if (modLogRef.current) modLogRef.current.scrollTop = modLogRef.current.scrollHeight; }, [modLog]);

  useEffect(function() {
    if (!debate) return;
    if (debate.status === 'waiting_room' || debate.status === 'confirmed') {
      var iv = setInterval(function() { setCountdown(Math.max(0, Math.floor((new Date(debate.scheduled_at) - Date.now()) / 1000))); }, 1000);
      return function() { clearInterval(iv); };
    }
  }, [debate]);

  useEffect(function() {
    if (!debate || debate.status !== 'live') return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(function() {
      if (debate.active_speaker_id === debate.creator_id) setTimerA(function(t) { return Math.max(0, t - 1); });
      else if (debate.active_speaker_id === debate.opponent_id) setTimerB(function(t) { return Math.max(0, t - 1); });
    }, 1000);
    return function() { clearInterval(timerRef.current); };
  }, [debate]);

  async function sendChat() {
    if (!chatInput.trim() || sendingChat || !currentUser) return;
    setSendingChat(true);
    await supabase.from('debate_chat_messages').insert({ debate_id: id, user_id: currentUser.id, content: chatInput.trim() });
    setChatInput(''); setSendingChat(false);
  }
  async function votePoll(pollId, choice) {
    if (!currentUser) return;
    await supabase.from('debate_poll_votes').insert({ poll_id: pollId, user_id: currentUser.id, choice: choice });
    loadPolls();
  }
  async function concedeTime() {
    if (!currentUser || !debate) return;
    try { await apiConcedeTime(debate.id); } catch (err) { console.error('Concede error:', err); }
  }
  async function handleStartDebate() {
    if (!currentUser || !debate) return;
    try { await apiStartDebate(debate.id); } catch (err) { console.error('Start error:', err); }
  }

  var isDebater = debate && currentUser && (debate.creator_id === currentUser.id || debate.opponent_id === currentUser.id);
  var isActiveSpeaker = debate && currentUser && debate.active_speaker_id === currentUser.id;
  var isLive = debate && debate.status === 'live';
  var isWaiting = debate && (debate.status === 'waiting_room' || debate.status === 'confirmed');
  var isCompleted = debate && debate.status === 'completed';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!debate) return null;

  var countdownText = '';
  if (countdown !== null && countdown > 0) {
    var hrs = Math.floor(countdown / 3600); var mns = Math.floor((countdown % 3600) / 60); var scs = countdown % 60;
    countdownText = (hrs > 0 ? hrs + 'h ' : '') + (mns > 0 ? mns + 'm ' : '') + scs + 's';
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes micPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.2);opacity:0.6}}
        @keyframes liveDot{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes countPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
        .cv-ds-tab{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.2s}
        .cv-ds-tab:hover{opacity:0.85}
        .cv-chat-input:focus{border-color:rgba(197,150,12,0.5)!important;box-shadow:0 0 0 3px rgba(197,150,12,0.12)}
        @media(max-width:768px){.cv-ds-main{flex-direction:column!important}.cv-ds-speakers{flex-direction:column!important;gap:16px!important}.cv-ds-sidebar{width:100%!important;height:420px!important}}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={function() { navigate('/citizen/debates'); }}
          style={{ background: 'rgba(11,37,69,0.04)', border: 'none', color: C.navy, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, marginBottom: 16, fontFamily: 'DM Sans, sans-serif' }}>
          ← Back to Debates
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {isLive && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg, #ef4444, #dc2626)', fontSize: 12, fontWeight: 800, color: '#fff', boxShadow: '0 2px 12px rgba(239,68,68,0.3)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'liveDot 1.5s ease-in-out infinite' }} />LIVE NOW</span>}
              {isWaiting && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', fontSize: 12, fontWeight: 700, color: '#fff', boxShadow: '0 2px 12px rgba(59,130,246,0.25)' }}>⏳ Waiting Room</span>}
              {isCompleted && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 20, background: C.navy, fontSize: 12, fontWeight: 700, color: '#fff' }}>✓ Completed</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1.3 }}>{debate.topic}</h1>
            {debate.description && <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: '6px 0 0', lineHeight: 1.5 }}>{debate.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: 'rgba(11,37,69,0.04)' }}>
            <span style={{ fontSize: 14 }}>👁</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{debate.listener_count || 0}</span>
            <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>listening</span>
          </div>
        </div>
      </div>

      {/* Countdown */}
      {isWaiting && countdown !== null && (
        <div style={{ padding: '36px 28px', borderRadius: 22, textAlign: 'center', marginBottom: 24, background: 'linear-gradient(135deg, #0B2545, #163a64)', border: '1px solid rgba(197,150,12,0.2)', boxShadow: '0 8px 32px rgba(11,37,69,0.15)' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: '0 0 10px', letterSpacing: 1, textTransform: 'uppercase' }}>{countdown > 0 ? 'Debate begins in' : 'Starting any moment...'}</p>
          {countdown > 0 && <p style={{ fontSize: 48, fontWeight: 700, color: C.gold, margin: 0, fontFamily: 'monospace', letterSpacing: 6, animation: 'countPulse 2s ease-in-out infinite', textShadow: '0 2px 16px rgba(197,150,12,0.4)' }}>{countdownText}</p>}
          {isDebater && (<div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '8px 20px', borderRadius: 12, display: 'inline-block', background: 'rgba(197,150,12,0.15)', border: '1px solid rgba(197,150,12,0.25)' }}><span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>🎙 You are a debater — get ready!</span></div>
            {countdown !== null && countdown <= 0 && (
              <button onClick={handleStartDebate} style={{ padding: '14px 36px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', boxShadow: '0 4px 20px rgba(197,150,12,0.4)', letterSpacing: 0.5 }}>🎙 Start Debate Now</button>
            )}
          </div>)}
        </div>
      )}

      {/* Speakers */}
      <div style={{ background: 'linear-gradient(180deg, #fff 0%, #fafafa 100%)', borderRadius: 22, padding: '28px 20px', border: isLive ? '2px solid rgba(197,150,12,0.2)' : '1px solid rgba(11,37,69,0.06)', marginBottom: 20, boxShadow: '0 4px 24px rgba(11,37,69,0.04)' }}>
        {debate.current_section && <div style={{ textAlign: 'center', marginBottom: 20 }}><span style={{ display: 'inline-block', padding: '8px 22px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(197,150,12,0.1), rgba(197,150,12,0.15))', fontSize: 13, fontWeight: 700, color: C.darkGold, border: '1px solid rgba(197,150,12,0.2)' }}>📌 {debate.current_section}</span></div>}
        <div className="cv-ds-speakers" style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 24 }}>
          <SpeakerCard name={debaterA ? debaterA.full_name : 'TBD'} isActive={debate.active_speaker_id === debate.creator_id} isVerified={debaterA && debaterA.identity_verified} timeLeft={timerA} side="Proposition" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0B2545, #163a64)', boxShadow: '0 4px 16px rgba(11,37,69,0.15)' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.gold }}>VS</span>
            </div>
          </div>
          <SpeakerCard name={debaterB ? debaterB.full_name : 'TBD'} isActive={debate.active_speaker_id === debate.opponent_id} isVerified={debaterB && debaterB.identity_verified} timeLeft={timerB} side="Opposition" />
        </div>
        {isActiveSpeaker && isLive && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={concedeTime} style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(197,150,12,0.08), rgba(197,150,12,0.15))', border: '2px solid rgba(197,150,12,0.3)', color: C.darkGold, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>⏭ Concede Remaining Time</button>
          </div>
        )}
      </div>

      {/* Moderator + Chat */}
      <div className="cv-ds-main" style={{ display: 'flex', gap: 16 }}>
        {/* Moderator */}
        <div style={{ flex: 1, borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: 420, background: 'linear-gradient(180deg, #fff 0%, #fafaf8 100%)', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 2px 16px rgba(11,37,69,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', background: 'linear-gradient(135deg, #0B2545, #163a64)', borderRadius: '20px 20px 0 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(197,150,12,0.3)' }}><span style={{ fontSize: 18 }}>⚖️</span></div>
            <div><p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>The Forum</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500 }}>AI Moderator</p></div>
          </div>
          <div ref={modLogRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            {modLog.length === 0 ? (
              <div style={{ padding: '50px 16px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(197,150,12,0.08), rgba(197,150,12,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 28 }}>⚖️</span></div>
                <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: 0, fontWeight: 500 }}>{isWaiting ? 'The Forum will begin moderating when the debate starts.' : isCompleted ? 'This debate has concluded.' : 'Moderator announcements will appear here.'}</p>
              </div>
            ) : modLog.map(function(m) { return <ModMessage key={m.id} message={m.message} eventType={m.event_type} time={m.created_at} />; })}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="cv-ds-sidebar" style={{ width: 380, borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: 420, background: '#fff', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 2px 16px rgba(11,37,69,0.03)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: C.navy }}>
            {[{ id: 'chat', label: '💬 Chat', count: chatMessages.length }, { id: 'polls', label: '📊 Polls', count: polls.length }, { id: 'info', label: 'ℹ️ Info' }].map(function(t) {
              var active = activeTab === t.id;
              return (<button key={t.id} className="cv-ds-tab" onClick={function() { setActiveTab(t.id); }} style={{ flex: 1, padding: '14px 8px', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.45)', background: active ? 'rgba(197,150,12,0.2)' : 'transparent', borderBottom: active ? '3px solid ' + C.gold : '3px solid transparent' }}>
                {t.label}{t.count > 0 && <span style={{ marginLeft: 5, padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: active ? C.gold : 'rgba(255,255,255,0.15)', color: '#fff' }}>{t.count}</span>}
              </button>);
            })}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'chat' && (<>
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ padding: '50px 8px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(197,150,12,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 24 }}>💬</span></div>
                    <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: 0, fontWeight: 500 }}>No messages yet. Start the conversation!</p>
                  </div>
                ) : chatMessages.map(function(m, idx) {
                  var u = chatUsers[m.user_id];
                  return <ChatMsg key={m.id} name={u ? u.full_name : '...'} content={m.content} isVerified={u && u.identity_verified} time={m.created_at} isOwn={currentUser && m.user_id === currentUser.id} index={idx} />;
                })}
              </div>
              {currentUser ? (
                <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', gap: 8, background: 'rgba(11,37,69,0.02)' }}>
                  <input className="cv-chat-input" style={{ flex: 1, padding: '11px 16px', fontSize: 13, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 12, outline: 'none', color: C.navy, fontFamily: 'DM Sans, sans-serif', background: '#fff' }} placeholder="Type a message..." value={chatInput} onChange={function(e) { setChatInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }} maxLength={500} />
                  <button onClick={sendChat} disabled={sendingChat || !chatInput.trim()} style={{ padding: '11px 20px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, background: chatInput.trim() ? 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')' : 'rgba(11,37,69,0.06)', color: chatInput.trim() ? '#fff' : 'rgba(11,37,69,0.3)', cursor: chatInput.trim() ? 'pointer' : 'default', fontFamily: 'DM Sans, sans-serif', boxShadow: chatInput.trim() ? '0 2px 8px rgba(197,150,12,0.25)' : 'none' }}>Send</button>
                </div>
              ) : (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(11,37,69,0.06)', textAlign: 'center', background: 'rgba(11,37,69,0.02)' }}><p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0 }}>Sign in to join the chat</p></div>
              )}
            </>)}
            {activeTab === 'polls' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {polls.length === 0 ? (
                  <div style={{ padding: '50px 8px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: 'rgba(197,150,12,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 24 }}>📊</span></div>
                    <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: '0 0 4px', fontWeight: 500 }}>No active polls</p>
                    <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Polls may be launched during the debate</p>
                  </div>
                ) : polls.map(function(p) { return <PollCard key={p.id} poll={p} onVote={votePoll} />; })}
              </div>
            )}
            {activeTab === 'info' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1.5 }}>Topic</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>{debate.topic}</p>
                  {debate.description && <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: '6px 0 0', lineHeight: 1.5 }}>{debate.description}</p>}
                </div>
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1.5 }}>Format</p>
                  {Object.entries(debate.format).map(function(e) {
                    return <div key={e[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(11,37,69,0.03)', marginBottom: 5, border: '1px solid rgba(11,37,69,0.04)' }}><span style={{ fontSize: 13, color: C.navy, fontWeight: 600 }}>{e[0]}</span><span style={{ fontSize: 13, color: C.gold, fontWeight: 700, fontFamily: 'monospace' }}>{Math.round(e[1] / 60)} min</span></div>;
                  })}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1.5 }}>Debaters</p>
                  {[debaterA, debaterB].filter(Boolean).map(function(d, i) {
                    var isG = i === 0;
                    return <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, marginBottom: 6, background: isG ? 'rgba(22,163,74,0.06)' : 'rgba(197,150,12,0.06)', border: '1px solid ' + (isG ? 'rgba(22,163,74,0.12)' : 'rgba(197,150,12,0.12)') }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: isG ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #C5960C, #a07a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{(d.full_name || '?').charAt(0).toUpperCase()}</div>
                      <div><p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>{d.full_name}</p>{d.identity_verified && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✓ Verified</span>}</div>
                    </div>;
                  })}
                </div>
                {debate.summary && (
                  <div style={{ marginTop: 22, padding: '16px 18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(197,150,12,0.06), rgba(197,150,12,0.1))', border: '1px solid rgba(197,150,12,0.15)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1.5 }}>⚖️ AI Summary</p>
                    <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.6 }}>{debate.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

