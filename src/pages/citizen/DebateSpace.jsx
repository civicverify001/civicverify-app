// src/pages/citizen/DebateSpace.jsx — Live Debate Room
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#16a34a', red: '#ef4444' };
var font = 'Libre Baskerville, Georgia, serif';

// ─── Helpers ───
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

// ─── Speaker Avatar ───
function SpeakerCard({ name, isActive, isVerified, timeLeft, isConceded, side }) {
  var initial = (name || '?').charAt(0).toUpperCase();
  var ringColor = isActive ? C.gold : 'rgba(11,37,69,0.1)';
  var glowStyle = isActive ? { boxShadow: '0 0 0 4px rgba(197,150,12,0.15), 0 0 24px rgba(197,150,12,0.2)' } : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 1, minWidth: 140 }}>
      {/* Avatar */}
      <div style={Object.assign({
        width: 80, height: 80, borderRadius: '50%', border: '3px solid ' + ringColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? 'rgba(197,150,12,0.08)' : 'rgba(11,37,69,0.04)',
        transition: 'all 0.4s ease', position: 'relative',
      }, glowStyle)}>
        <span style={{ fontSize: 28, fontWeight: 700, color: isActive ? C.gold : 'rgba(11,37,69,0.4)' }}>
          {initial}
        </span>
        {/* Active mic indicator */}
        {isActive && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4, width: 24, height: 24,
            borderRadius: '50%', background: C.gold, display: 'flex',
            alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
            animation: 'micPulse 1.5s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 12 }}>🎙</span>
          </div>
        )}
      </div>

      {/* Name + Badge */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>
          {name || 'Unknown'}
        </p>
        {isVerified && (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>✓ Verified Citizen</span>
        )}
      </div>

      {/* Timer */}
      <div style={{
        padding: '8px 20px', borderRadius: 12,
        background: isActive ? 'rgba(197,150,12,0.08)' : 'rgba(11,37,69,0.03)',
        border: isActive ? '1px solid rgba(197,150,12,0.2)' : '1px solid rgba(11,37,69,0.06)',
      }}>
        <span style={{
          fontSize: 24, fontWeight: 700, fontFamily: 'monospace',
          color: timeLeft <= 30 && isActive ? C.red : isActive ? C.gold : 'rgba(11,37,69,0.4)',
          letterSpacing: 2,
        }}>
          {fmtTimer(timeLeft)}
        </span>
      </div>

      {/* Side label */}
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(11,37,69,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {side}
      </span>
    </div>
  );
}

// ─── Moderator Message ───
function ModMessage({ message, eventType, time }) {
  var icon = '📜';
  if (eventType === 'mute') icon = '🔇';
  if (eventType === 'unmute') icon = '🎙';
  if (eventType === 'warning') icon = '⚠️';
  if (eventType === 'summary') icon = '📋';

  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, background: 'rgba(197,150,12,0.04)',
      border: '1px solid rgba(197,150,12,0.08)', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.5 }}>{message}</p>
          <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)', margin: '4px 0 0' }}>{timeAgo(time)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Message ───
function ChatMsg({ name, content, isVerified: verified, time, isOwn }) {
  return (
    <div style={{ padding: '8px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isOwn ? 'rgba(197,150,12,0.12)' : 'rgba(11,37,69,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: isOwn ? C.gold : 'rgba(11,37,69,0.4)',
      }}>
        {(name || '?').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{name}</span>
          {verified && <span style={{ fontSize: 9, color: C.green, fontWeight: 700 }}>✓</span>}
          <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)' }}>{timeAgo(time)}</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.7)', margin: '2px 0 0', lineHeight: 1.4 }}>
          {content}
        </p>
      </div>
    </div>
  );
}

// ─── Poll Card ───
function PollCard({ poll, userId, onVote }) {
  var options = poll.options || [];
  var votes = poll.votes || {};
  var totalVotes = Object.values(votes).reduce(function(a, b) { return a + b; }, 0);
  var userVote = poll.userVote;
  var hasVoted = userVote !== undefined && userVote !== null;

  return (
    <div style={{
      padding: '16px 18px', borderRadius: 14, background: '#fff',
      border: '1px solid rgba(11,37,69,0.06)', marginBottom: 12,
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 12px' }}>{poll.question}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {options.map(function(opt, i) {
          var count = votes[i] || 0;
          var pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          var isSelected = userVote === i;

          return (
            <button
              key={i}
              onClick={function() { if (!hasVoted) onVote(poll.id, i); }}
              disabled={hasVoted}
              style={{
                position: 'relative', padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                border: isSelected ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.08)',
                background: hasVoted ? '#fff' : 'rgba(11,37,69,0.02)',
                cursor: hasVoted ? 'default' : 'pointer', overflow: 'hidden',
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              }}
            >
              {/* Progress bar */}
              {hasVoted && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: pct + '%',
                  background: isSelected ? 'rgba(197,150,12,0.1)' : 'rgba(11,37,69,0.03)',
                  transition: 'width 0.6s ease', borderRadius: 10,
                }} />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: C.navy }}>{opt}</span>
                {hasVoted && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? C.gold : 'rgba(11,37,69,0.4)' }}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {totalVotes > 0 && (
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: '10px 0 0', textAlign: 'right' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function DebateSpace() {
  var { id } = useParams();
  var navigate = useNavigate();
  var auth = useAuth();
  var currentUser = auth.user;
  var profile = auth.profile;

  // State
  var [debate, setDebate] = useState(null);
  var [debaterA, setDebaterA] = useState(null);
  var [debaterB, setDebaterB] = useState(null);
  var [loading, setLoading] = useState(true);
  var [activeTab, setActiveTab] = useState('chat'); // chat | polls | info

  // Timers
  var [timerA, setTimerA] = useState(0);
  var [timerB, setTimerB] = useState(0);
  var timerRef = useRef(null);

  // Moderator log
  var [modLog, setModLog] = useState([]);
  var modLogRef = useRef(null);

  // Chat
  var [chatMessages, setChatMessages] = useState([]);
  var [chatInput, setChatInput] = useState('');
  var [sendingChat, setSendingChat] = useState(false);
  var chatRef = useRef(null);
  var [chatUsers, setChatUsers] = useState({});

  // Polls
  var [polls, setPolls] = useState([]);

  // Waiting room countdown
  var [countdown, setCountdown] = useState(null);

  // ─── Load debate data ───
  var loadDebate = useCallback(async function() {
    var { data } = await supabase.from('debates').select('*').eq('id', id).single();
    if (!data) { navigate('/citizen/debates'); return; }
    setDebate(data);

    // Load debaters
    var ids = [data.creator_id, data.opponent_id].filter(Boolean);
    if (ids.length > 0) {
      var { data: users } = await supabase.from('users').select('id, full_name, identity_verified').in('id', ids);
      if (users) {
        users.forEach(function(u) {
          if (u.id === data.creator_id) setDebaterA(u);
          if (u.id === data.opponent_id) setDebaterB(u);
        });
      }
    }

    // Init timers from format (use first section time)
    if (data.format) {
      var sections = Object.entries(data.format);
      if (sections.length > 0) {
        var firstTime = sections[0][1];
        setTimerA(firstTime);
        setTimerB(firstTime);
      }
    }

    setLoading(false);
  }, [id, navigate]);

  // ─── Load mod log ───
  var loadModLog = useCallback(async function() {
    var { data } = await supabase.from('debate_moderator_log')
      .select('*').eq('debate_id', id)
      .order('created_at', { ascending: true });
    setModLog(data || []);
  }, [id]);

  // ─── Load chat ───
  var loadChat = useCallback(async function() {
    var { data } = await supabase.from('debate_chat_messages')
      .select('*').eq('debate_id', id).eq('is_flagged', false)
      .order('created_at', { ascending: true })
      .limit(200);

    if (data && data.length > 0) {
      setChatMessages(data);
      // Fetch user names
      var userIds = Array.from(new Set(data.map(function(m) { return m.user_id; })));
      var unknowns = userIds.filter(function(uid) { return !chatUsers[uid]; });
      if (unknowns.length > 0) {
        var { data: uData } = await supabase.from('users').select('id, full_name, identity_verified').in('id', unknowns);
        if (uData) {
          var map = Object.assign({}, chatUsers);
          uData.forEach(function(u) { map[u.id] = u; });
          setChatUsers(map);
        }
      }
    }
  }, [id]);

  // ─── Load polls ───
  var loadPolls = useCallback(async function() {
    var { data: pollData } = await supabase.from('debate_polls')
      .select('*').eq('debate_id', id).eq('is_active', true);
    
    if (pollData && pollData.length > 0) {
      // Get vote counts + user's votes
      var enriched = await Promise.all(pollData.map(async function(p) {
        var { data: votes } = await supabase.from('debate_poll_votes')
          .select('choice').eq('poll_id', p.id);
        
        var voteCounts = {};
        (votes || []).forEach(function(v) {
          voteCounts[v.choice] = (voteCounts[v.choice] || 0) + 1;
        });

        var userVote = null;
        if (currentUser) {
          var { data: myVote } = await supabase.from('debate_poll_votes')
            .select('choice').eq('poll_id', p.id).eq('user_id', currentUser.id).single();
          if (myVote) userVote = myVote.choice;
        }

        return Object.assign({}, p, { votes: voteCounts, userVote: userVote });
      }));

      setPolls(enriched);
    } else {
      setPolls([]);
    }
  }, [id, currentUser]);

  // ─── Initial load ───
  useEffect(function() {
    loadDebate();
    loadModLog();
    loadChat();
    loadPolls();
  }, [loadDebate, loadModLog, loadChat, loadPolls]);

  // ─── Realtime subscriptions ───
  useEffect(function() {
    var chatSub = supabase.channel('debate-chat-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_chat_messages', filter: 'debate_id=eq.' + id },
        function(payload) {
          setChatMessages(function(prev) { return prev.concat([payload.new]); });
          // Fetch user if unknown
          var uid = payload.new.user_id;
          if (!chatUsers[uid]) {
            supabase.from('users').select('id, full_name, identity_verified').eq('id', uid).single()
              .then(function(r) {
                if (r.data) setChatUsers(function(prev) { return Object.assign({}, prev, { [uid]: r.data }); });
              });
          }
        }
      ).subscribe();

    var modSub = supabase.channel('debate-mod-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_moderator_log', filter: 'debate_id=eq.' + id },
        function(payload) {
          setModLog(function(prev) { return prev.concat([payload.new]); });
        }
      ).subscribe();

    var debateSub = supabase.channel('debate-state-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'debates', filter: 'id=eq.' + id },
        function(payload) {
          setDebate(payload.new);
        }
      ).subscribe();

    return function() {
      supabase.removeChannel(chatSub);
      supabase.removeChannel(modSub);
      supabase.removeChannel(debateSub);
    };
  }, [id]);

  // ─── Auto-scroll chat ───
  useEffect(function() {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  // ─── Auto-scroll mod log ───
  useEffect(function() {
    if (modLogRef.current) modLogRef.current.scrollTop = modLogRef.current.scrollHeight;
  }, [modLog]);

  // ─── Waiting room countdown ───
  useEffect(function() {
    if (!debate) return;
    if (debate.status === 'waiting_room' || debate.status === 'confirmed') {
      var interval = setInterval(function() {
        var diff = Math.floor((new Date(debate.scheduled_at) - Date.now()) / 1000);
        setCountdown(Math.max(0, diff));
      }, 1000);
      return function() { clearInterval(interval); };
    }
  }, [debate]);

  // ─── Timer countdown for active speaker ───
  useEffect(function() {
    if (!debate || debate.status !== 'live') return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(function() {
      if (debate.active_speaker_id === debate.creator_id) {
        setTimerA(function(t) { return Math.max(0, t - 1); });
      } else if (debate.active_speaker_id === debate.opponent_id) {
        setTimerB(function(t) { return Math.max(0, t - 1); });
      }
    }, 1000);

    return function() { clearInterval(timerRef.current); };
  }, [debate]);

  // ─── Send chat message ───
  async function sendChat() {
    if (!chatInput.trim() || sendingChat || !currentUser) return;
    setSendingChat(true);
    await supabase.from('debate_chat_messages').insert({
      debate_id: id,
      user_id: currentUser.id,
      content: chatInput.trim(),
    });
    setChatInput('');
    setSendingChat(false);
  }

  // ─── Vote on poll ───
  async function votePoll(pollId, choice) {
    if (!currentUser) return;
    await supabase.from('debate_poll_votes').insert({
      poll_id: pollId,
      user_id: currentUser.id,
      choice: choice,
    });
    loadPolls();
  }

  // ─── Concede time ───
  async function concedeTime() {
    if (!currentUser || !debate) return;
    // Insert moderator log event
    await supabase.from('debate_moderator_log').insert({
      debate_id: id,
      message: (profile ? profile.full_name : 'Debater') + ' has conceded their remaining time.',
      event_type: 'announcement',
    });
    // In production: send CONCEDE event to backend state machine
  }

  // ─── Computed ───
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

  // Format countdown
  var countdownText = '';
  if (countdown !== null && countdown > 0) {
    var hrs = Math.floor(countdown / 3600);
    var mins = Math.floor((countdown % 3600) / 60);
    var secs = countdown % 60;
    countdownText = (hrs > 0 ? hrs + 'h ' : '') + (mins > 0 ? mins + 'm ' : '') + secs + 's';
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes micPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:0.7}}
        @keyframes liveDot{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .cv-ds-tab{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.2s}
        .cv-ds-tab:hover{background:rgba(11,37,69,0.04)}
        .cv-chat-input:focus{border-color:rgba(197,150,12,0.4)!important;box-shadow:0 0 0 3px rgba(197,150,12,0.1)}
        @media(max-width:768px){
          .cv-ds-main{flex-direction:column!important}
          .cv-ds-speakers{flex-direction:column!important;gap:20px!important}
          .cv-ds-sidebar{width:100%!important;height:400px!important}
        }
      `}</style>

      {/* ─── Back + Header ─── */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={function() { navigate('/citizen/debates'); }}
          style={{ background: 'none', border: 'none', color: 'rgba(11,37,69,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '4px 0', marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>
          ← Back to Debates
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {isLive && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                  borderRadius: 20, background: '#FEE2E2', fontSize: 12, fontWeight: 700, color: '#991B1B',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'liveDot 1.5s ease-in-out infinite' }} />
                  LIVE
                </span>
              )}
              {isWaiting && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: '#DBEAFE', fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
                  ⏳ Waiting Room
                </span>
              )}
              {isCompleted && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: '#F3F4F6', fontSize: 12, fontWeight: 700, color: '#374151' }}>
                  ✓ Completed
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1.3 }}>
              {debate.topic}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)' }}>
              👁 {debate.listener_count || 0} listening
            </span>
          </div>
        </div>
      </div>

      {/* ─── Waiting Room Countdown ─── */}
      {isWaiting && countdown !== null && (
        <div style={{
          padding: '32px 24px', borderRadius: 20, textAlign: 'center', marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(11,37,69,0.03), rgba(197,150,12,0.04))',
          border: '1px solid rgba(197,150,12,0.1)',
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(11,37,69,0.5)', margin: '0 0 8px' }}>
            {countdown > 0 ? 'Debate starts in' : 'Starting soon...'}
          </p>
          {countdown > 0 && (
            <p style={{ fontSize: 40, fontWeight: 700, color: C.navy, margin: 0, fontFamily: 'monospace', letterSpacing: 4 }}>
              {countdownText}
            </p>
          )}
          {isDebater && (
            <p style={{ fontSize: 13, color: C.gold, margin: '12px 0 0', fontWeight: 600 }}>
              🎙 You are a debater. Get ready!
            </p>
          )}
        </div>
      )}

      {/* ─── Speaker Panel ─── */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px 24px',
        border: isLive ? '2px solid rgba(197,150,12,0.15)' : '1px solid rgba(11,37,69,0.06)',
        marginBottom: 20, boxShadow: '0 2px 16px rgba(11,37,69,0.03)',
      }}>
        {/* Section indicator */}
        {debate.current_section && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{
              display: 'inline-block', padding: '6px 18px', borderRadius: 20,
              background: 'rgba(197,150,12,0.08)', fontSize: 13, fontWeight: 700, color: C.gold,
            }}>
              📌 {debate.current_section}
            </span>
          </div>
        )}

        <div className="cv-ds-speakers" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <SpeakerCard
            name={debaterA ? debaterA.full_name : 'TBD'}
            isActive={debate.active_speaker_id === (debate.creator_id)}
            isVerified={debaterA && debaterA.identity_verified}
            timeLeft={timerA}
            side="Proposition"
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'rgba(11,37,69,0.15)' }}>VS</span>
          </div>

          <SpeakerCard
            name={debaterB ? debaterB.full_name : 'TBD'}
            isActive={debate.active_speaker_id === (debate.opponent_id)}
            isVerified={debaterB && debaterB.identity_verified}
            timeLeft={timerB}
            side="Opposition"
          />
        </div>

        {/* Concede Button */}
        {isActiveSpeaker && isLive && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={concedeTime}
              style={{
                padding: '12px 28px', borderRadius: 12, border: '2px solid rgba(197,150,12,0.3)',
                background: 'rgba(197,150,12,0.06)', color: C.gold, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              }}
            >
              ⏭ Concede Remaining Time
            </button>
          </div>
        )}
      </div>

      {/* ─── Main Area: Mod Panel + Chat/Polls ─── */}
      <div className="cv-ds-main" style={{ display: 'flex', gap: 16 }}>

        {/* Left: AI Moderator Panel */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 18, padding: '20px',
          border: '1px solid rgba(11,37,69,0.06)', display: 'flex', flexDirection: 'column',
          minHeight: 400,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0B2545, #1a3a5c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16 }}>⚖️</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>The Forum</p>
              <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: 0 }}>AI Moderator</p>
            </div>
          </div>

          <div ref={modLogRef} style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {modLog.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: 32 }}>⚖️</span>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '12px 0 0' }}>
                  {isWaiting ? 'The Forum will begin moderating when the debate starts.' :
                   isCompleted ? 'This debate has concluded.' :
                   'Moderator announcements will appear here.'}
                </p>
              </div>
            ) : (
              modLog.map(function(m) {
                return <ModMessage key={m.id} message={m.message} eventType={m.event_type} time={m.created_at} />;
              })
            )}
          </div>
        </div>

        {/* Right: Chat / Polls Sidebar */}
        <div className="cv-ds-sidebar" style={{
          width: 360, background: '#fff', borderRadius: 18,
          border: '1px solid rgba(11,37,69,0.06)', display: 'flex', flexDirection: 'column',
          minHeight: 400,
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(11,37,69,0.06)', padding: '0 4px' }}>
            {[
              { id: 'chat', label: '💬 Chat', count: chatMessages.length },
              { id: 'polls', label: '📊 Polls', count: polls.length },
              { id: 'info', label: 'ℹ️ Info' },
            ].map(function(t) {
              var active = activeTab === t.id;
              return (
                <button key={t.id} className="cv-ds-tab" onClick={function() { setActiveTab(t.id); }}
                  style={{
                    flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: active ? 700 : 500,
                    color: active ? C.navy : 'rgba(11,37,69,0.4)', background: 'none',
                    borderBottom: active ? '2px solid ' + C.gold : '2px solid transparent',
                  }}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span style={{
                      marginLeft: 5, padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: active ? 'rgba(197,150,12,0.1)' : 'rgba(11,37,69,0.05)',
                      color: active ? C.gold : 'rgba(11,37,69,0.4)',
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <>
                <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ padding: '40px 8px', textAlign: 'center' }}>
                      <span style={{ fontSize: 28 }}>💬</span>
                      <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '8px 0 0' }}>
                        No messages yet. Be the first to chat!
                      </p>
                    </div>
                  ) : (
                    chatMessages.map(function(m) {
                      var u = chatUsers[m.user_id];
                      return (
                        <ChatMsg
                          key={m.id}
                          name={u ? u.full_name : '...'}
                          content={m.content}
                          isVerified={u && u.identity_verified}
                          time={m.created_at}
                          isOwn={currentUser && m.user_id === currentUser.id}
                        />
                      );
                    })
                  )}
                </div>
                {/* Chat input */}
                {currentUser ? (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(11,37,69,0.06)', display: 'flex', gap: 8 }}>
                    <input
                      className="cv-chat-input"
                      style={{
                        flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)',
                        borderRadius: 10, outline: 'none', color: C.navy, fontFamily: 'DM Sans, sans-serif',
                        background: 'rgba(11,37,69,0.02)',
                      }}
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={function(e) { setChatInput(e.target.value); }}
                      onKeyDown={function(e) { if (e.key === 'Enter') sendChat(); }}
                      maxLength={500}
                    />
                    <button
                      onClick={sendChat}
                      disabled={sendingChat || !chatInput.trim()}
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: 'none', fontSize: 13,
                        fontWeight: 700, background: chatInput.trim() ? C.gold : 'rgba(11,37,69,0.06)',
                        color: chatInput.trim() ? '#fff' : 'rgba(11,37,69,0.3)',
                        cursor: chatInput.trim() ? 'pointer' : 'default',
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
                      }}
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px', borderTop: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Sign in to chat</p>
                  </div>
                )}
              </>
            )}

            {/* POLLS TAB */}
            {activeTab === 'polls' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                {polls.length === 0 ? (
                  <div style={{ padding: '40px 8px', textAlign: 'center' }}>
                    <span style={{ fontSize: 28 }}>📊</span>
                    <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '8px 0 0' }}>
                      No active polls right now.
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: '4px 0 0' }}>
                      Polls may be launched during the debate.
                    </p>
                  </div>
                ) : (
                  polls.map(function(p) {
                    return <PollCard key={p.id} poll={p} userId={currentUser ? currentUser.id : null} onVote={votePoll} />;
                  })
                )}
              </div>
            )}

            {/* INFO TAB */}
            {activeTab === 'info' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Topic</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: 0 }}>{debate.topic}</p>
                  {debate.description && (
                    <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: '6px 0 0', lineHeight: 1.5 }}>
                      {debate.description}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.4)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Format</p>
                  {Object.entries(debate.format).map(function(entry) {
                    return (
                      <div key={entry[0]} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                        borderRadius: 8, background: 'rgba(11,37,69,0.02)', marginBottom: 4,
                      }}>
                        <span style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>{entry[0]}</span>
                        <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {Math.round(entry[1] / 60)} min
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.4)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Debaters</p>
                  {[debaterA, debaterB].filter(Boolean).map(function(d) {
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: 'rgba(11,37,69,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: 'rgba(11,37,69,0.4)',
                        }}>
                          {(d.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{d.full_name}</p>
                          {d.identity_verified && <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>✓ Verified</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Summary */}
                {debate.summary && (
                  <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(197,150,12,0.04)', border: '1px solid rgba(197,150,12,0.1)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>
                      ⚖️ AI Summary
                    </p>
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

