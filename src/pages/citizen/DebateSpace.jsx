// src/pages/citizen/DebateSpace.jsx — Phase 4: Audio + Auto-Timer + Transcription
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import {
  startDebate as apiStartDebate,
  concedeTime as apiConcedeTime,
  nextTurn as apiNextTurn,
  createAudioRoom as apiCreateAudioRoom,
  getDailyToken as apiGetDailyToken,
  generateSummary as apiGenerateSummary,
  timerWarning as apiTimerWarning,
  aiModerateChat as apiModerateChat,
  aiAnalyzeTranscript as apiAnalyzeTranscript,
  aiScorecard as apiScorecard,
  generateReport as apiGenerateReport,
} from '../../lib/debateApi';

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

function SpeakerCard({ name, isActive, isVerified, timeLeft, side, isMuted, isAudioConnected }) {
  var initial = (name || '?').charAt(0).toUpperCase();
  var sideColor = side === 'Proposition' ? C.green : C.darkGold;
  var sideBg = side === 'Proposition' ? 'rgba(22,163,74,0.08)' : 'rgba(197,150,12,0.08)';
  var sideBorder = side === 'Proposition' ? 'rgba(22,163,74,0.15)' : 'rgba(197,150,12,0.15)';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1,
      padding: '16px 10px', borderRadius: 16, minWidth: 0, overflow: 'hidden',
      background: isActive ? 'linear-gradient(160deg, rgba(255,255,255,1), rgba(197,150,12,0.08))' : '#fff',
      border: isActive ? '2px solid rgba(197,150,12,0.3)' : '1.5px solid rgba(11,37,69,0.08)',
      boxShadow: isActive ? '0 4px 20px rgba(197,150,12,0.12)' : '0 2px 8px rgba(11,37,69,0.03)',
      transition: 'all 0.4s ease',
    }}>
      <span style={{
        fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5,
        color: sideColor, background: sideBg, padding: '3px 10px', borderRadius: 8,
        border: '1px solid ' + sideBorder,
      }}>
        {side}
      </span>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: isActive ? 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')' : 'linear-gradient(135deg, #94a3b8, #64748b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isActive ? '0 0 0 3px rgba(197,150,12,0.2)' : 'none',
          transition: 'all 0.4s ease',
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{initial}</span>
        </div>
        {isActive && (
          <div style={{
            position: 'absolute', bottom: -3, right: -3, width: 22, height: 22, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)', border: '1.5px solid rgba(197,150,12,0.2)',
          }}>
            <span style={{ fontSize: 10, animation: 'micPulse 1.5s ease-in-out infinite' }}>🎙</span>
          </div>
        )}
        {isAudioConnected && (
          <div style={{
            position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%',
            background: isMuted ? C.red : C.green, border: '2px solid #fff',
          }} />
        )}
      </div>
      <div style={{ textAlign: 'center', width: '100%', padding: '0 2px' }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name || 'TBD'}</p>
        {isVerified && (
          <span style={{ fontSize: 9, fontWeight: 700, color: C.green, display: 'inline-block', marginTop: 2 }}>
            ✓ Verified
          </span>
        )}
      </div>
      <div style={{
        padding: '6px 14px', borderRadius: 10, width: '100%', textAlign: 'center',
        background: isActive ? C.navy : 'rgba(11,37,69,0.04)',
        transition: 'all 0.3s ease',
      }}>
        <span style={{
          fontSize: 20, fontWeight: 700, fontFamily: 'monospace',
          color: isActive ? (timeLeft <= 30 ? '#fca5a5' : '#fff') : 'rgba(11,37,69,0.3)', letterSpacing: 2,
        }}>
          {fmtTimer(timeLeft)}
        </span>
      </div>
    </div>
  );
}

function ModMessage({ message, eventType, time }) {
  var icons = { mute: '🔇', unmute: '🎙', warning: '⚠️', summary: '📋', announcement: '📜', fact_check: '🔍', topic_drift: '🔀', auto_poll: '📊', question_suggestion: '💡', section_summary: '📋', scorecard: '🏆', report: '📄' };
  var borderColors = { fact_check: '#ef4444', topic_drift: '#f59e0b', warning: '#ef4444', scorecard: C.gold, auto_poll: '#3b82f6', question_suggestion: '#8b5cf6' };
  var bgColors = { fact_check: 'rgba(239,68,68,0.04)', topic_drift: 'rgba(245,158,11,0.04)', warning: 'rgba(239,68,68,0.04)', scorecard: 'rgba(197,150,12,0.06)', question_suggestion: 'rgba(139,92,246,0.04)' };

  if (eventType === 'scorecard') {
    try {
      var sc = JSON.parse(message);
      return (
        <div style={{ padding: '16px', borderRadius: 14, marginBottom: 12, background: 'linear-gradient(135deg, rgba(197,150,12,0.04), rgba(197,150,12,0.08))', borderLeft: '3px solid ' + C.gold, animation: 'slideUp 0.3s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>🏆 Argument Scorecard</p>
          {[sc.debater_a, sc.debater_b].filter(Boolean).map(function(d, i) {
            var avg = d.overall || Math.round(((d.clarity || 0) + (d.evidence || 0) + (d.relevance || 0) + (d.persuasion || 0)) / 4);
            return (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: '#fff', marginBottom: 8, border: '1px solid rgba(11,37,69,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.green : C.darkGold }}>{d.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{avg}/10</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                  {[['Clarity', d.clarity], ['Evidence', d.evidence], ['Relevance', d.relevance], ['Persuasion', d.persuasion]].map(function(s) {
                    return <span key={s[0]} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(11,37,69,0.04)', color: 'rgba(11,37,69,0.6)' }}>{s[0]}: <strong>{s[1]}</strong></span>;
                  })}
                </div>
                {d.strength && <p style={{ fontSize: 11, color: C.green, margin: '2px 0', fontWeight: 500 }}>💪 {d.strength}</p>}
                {d.improvement && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.5)', margin: '2px 0', fontStyle: 'italic' }}>📝 {d.improvement}</p>}
              </div>
            );
          })}
          {sc.summary && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.6)', margin: '6px 0 0', lineHeight: 1.5 }}>{sc.summary}</p>}
          <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)', margin: '6px 0 0' }}>{timeAgo(time)}</p>
        </div>
      );
    } catch (e) { /* fall through to default */ }
  }

  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12, marginBottom: 10,
      background: bgColors[eventType] || 'linear-gradient(135deg, rgba(11,37,69,0.03), rgba(197,150,12,0.04))',
      borderLeft: '3px solid ' + (borderColors[eventType] || C.gold), animation: 'slideUp 0.3s ease',
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

function ChatMsg({ name, content, isVerified: verified, time, index }) {
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
  var isFeatured = poll.poll_type === 'featured';
  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16, marginBottom: 12,
      background: isFeatured ? 'linear-gradient(135deg, #fff, #fefce8)' : '#fff',
      border: '1px solid ' + (isFeatured ? 'rgba(197,150,12,0.2)' : 'rgba(11,37,69,0.08)'),
      boxShadow: '0 2px 8px rgba(11,37,69,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>📊 {poll.question}</p>
        {isFeatured && <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Featured</span>}
      </div>
      {poll.creator_name && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: '-6px 0 10px', fontWeight: 500 }}>by {poll.creator_name}</p>}
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

function CreatePollForm({ debateId, currentUser, pollType, onCreated }) {
  var [showForm, setShowForm] = useState(false);
  var [question, setQuestion] = useState('');
  var [options, setOptions] = useState(['', '']);
  var [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!question.trim()) return;
    var validOpts = options.filter(function(o) { return o.trim(); });
    if (validOpts.length < 2) return alert('Need at least 2 options');
    setCreating(true);
    var { error } = await supabase.from('debate_polls').insert({
      debate_id: debateId,
      question: question.trim(),
      options: validOpts,
      is_active: true,
      created_by: currentUser.id,
      poll_type: pollType,
    });
    setCreating(false);
    if (error) { alert('Error: ' + error.message); return; }
    setQuestion(''); setOptions(['', '']); setShowForm(false);
    if (onCreated) onCreated();
  }

  if (!showForm) {
    return (
      <button onClick={function() { setShowForm(true); }}
        style={{
          width: '100%', padding: '10px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
          background: pollType === 'featured' ? 'linear-gradient(135deg, rgba(197,150,12,0.08), rgba(197,150,12,0.15))' : 'rgba(11,37,69,0.04)',
          border: '1px dashed ' + (pollType === 'featured' ? 'rgba(197,150,12,0.3)' : 'rgba(11,37,69,0.15)'),
          color: pollType === 'featured' ? C.darkGold : 'rgba(11,37,69,0.6)',
        }}>
        + Create {pollType === 'featured' ? 'Featured' : ''} Poll
      </button>
    );
  }

  return (
    <div style={{ padding: '16px', borderRadius: 14, background: '#fff', border: '1px solid rgba(11,37,69,0.1)', marginBottom: 12, boxShadow: '0 2px 8px rgba(11,37,69,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 }}>📊 New Poll</p>
        <button onClick={function() { setShowForm(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'rgba(11,37,69,0.4)' }}>✕</button>
      </div>
      <input
        value={question} onChange={function(e) { setQuestion(e.target.value); }}
        placeholder="Your question..."
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', fontSize: 13, color: C.navy, fontFamily: 'DM Sans, sans-serif', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
      />
      {options.map(function(opt, i) {
        return (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              value={opt}
              onChange={function(e) { var newOpts = options.slice(); newOpts[i] = e.target.value; setOptions(newOpts); }}
              placeholder={'Option ' + (i + 1)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(11,37,69,0.08)', fontSize: 12, color: C.navy, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
            />
            {options.length > 2 && (
              <button onClick={function() { var newOpts = options.slice(); newOpts.splice(i, 1); setOptions(newOpts); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(239,68,68,0.6)', padding: '0 4px' }}>✕</button>
            )}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {options.length < 5 && (
          <button onClick={function() { setOptions(options.concat([''])); }}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px dashed rgba(11,37,69,0.15)', background: 'none', fontSize: 11, fontWeight: 600, color: 'rgba(11,37,69,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            + Add Option
          </button>
        )}
        <button onClick={handleCreate} disabled={creating || !question.trim()}
          style={{
            marginLeft: 'auto', padding: '8px 18px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            background: question.trim() ? 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')' : 'rgba(11,37,69,0.06)',
            color: question.trim() ? '#fff' : 'rgba(11,37,69,0.3)',
          }}>
          {creating ? 'Creating...' : 'Launch Poll'}
        </button>
      </div>
    </div>
  );
}

function LiveVoteBar({ debate, debaterA, debaterB, votesA, votesB, userVote, onVote, currentUser }) {
  var total = votesA + votesB;
  var pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
  var pctB = total > 0 ? 100 - pctA : 50;
  var nameA = debaterA ? debaterA.full_name : 'Proposition';
  var nameB = debaterB ? debaterB.full_name : 'Opposition';
  var isDebater = currentUser && (debate.creator_id === currentUser.id || debate.opponent_id === currentUser.id);

  return (
    <div style={{ padding: '18px 22px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(11,37,69,0.03), rgba(197,150,12,0.04))', border: '1px solid rgba(11,37,69,0.08)', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: 0 }}>🗳️ Who's winning?</p>
        <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.5)', fontWeight: 600 }}>{total} vote{total !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', height: 36, borderRadius: 12, overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(11,37,69,0.08)' }}>
        <div style={{ width: pctA + '%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.6s ease', minWidth: total > 0 ? '8%' : '50%' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{total > 0 ? pctA + '%' : '-'}</span>
        </div>
        <div style={{ width: pctB + '%', background: 'linear-gradient(135deg, #C5960C, #a07a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.6s ease', minWidth: total > 0 ? '8%' : '50%' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{total > 0 ? pctB + '%' : '-'}</span>
        </div>
      </div>
      {currentUser && !isDebater && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={function() { onVote(debate.creator_id); }}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              background: userVote === debate.creator_id ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(22,163,74,0.08)',
              color: userVote === debate.creator_id ? '#fff' : '#16a34a',
              border: userVote === debate.creator_id ? 'none' : '1px solid rgba(22,163,74,0.2)',
            }}>
            {userVote === debate.creator_id ? '✓ ' : ''}👍 {nameA}
          </button>
          <button onClick={function() { onVote(debate.opponent_id); }}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              background: userVote === debate.opponent_id ? 'linear-gradient(135deg, #C5960C, #a07a0a)' : 'rgba(197,150,12,0.08)',
              color: userVote === debate.opponent_id ? '#fff' : C.darkGold,
              border: userVote === debate.opponent_id ? 'none' : '1px solid rgba(197,150,12,0.2)',
            }}>
            {userVote === debate.opponent_id ? '✓ ' : ''}👍 {nameB}
          </button>
        </div>
      )}
      {currentUser && isDebater && (
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>Debaters cannot vote</p>
      )}
      {!currentUser && (
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: 0, textAlign: 'center' }}>Sign in to vote</p>
      )}
    </div>
  );
}

function AudioPanel({ debate, currentUser, isDebater, callObjRef, audioConnected, setAudioConnected, isMuted, setIsMuted }) {
  var [joining, setJoining] = useState(false);
  var [audioError, setAudioError] = useState(null);
  var audioContainerRef = useRef(null);

  useEffect(function() {
    if (!audioConnected || !callObjRef.current || !isDebater || !currentUser) return;
    if (!debate || debate.status !== 'live') return;
    var isMyTurn = debate.active_speaker_id === currentUser.id;
    callObjRef.current.setLocalAudio(isMyTurn);
    setIsMuted(!isMyTurn);
  }, [debate && debate.active_speaker_id, audioConnected]);

  async function joinAudio() {
    if (joining) return;
    setJoining(true); setAudioError(null);
    try {
      if (callObjRef.current) {
        try { await callObjRef.current.leave(); } catch(e) {}
        try { callObjRef.current.destroy(); } catch(e) {}
        callObjRef.current = null;
      }
      if (isDebater) {
        try {
          var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(function(t) { t.stop(); });
        } catch(micErr) {
          throw new Error('Microphone access denied. Please allow mic permission and try again.');
        }
      }
      var tokenData = await apiGetDailyToken(debate.id);
      if (!tokenData.token) throw new Error('No token received');
      if (!window.DailyIframe) {
        await new Promise(function(resolve, reject) {
          var s = document.createElement('script');
          s.src = 'https://unpkg.com/@daily-co/daily-js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      var callObj = window.DailyIframe.createCallObject();
      callObjRef.current = callObj;
      callObj.on('track-started', function(ev) {
        if (ev.participant && ev.participant.local) return;
        if (ev.track && ev.track.kind !== 'audio') return;
        var audioEl = document.createElement('audio');
        audioEl.srcObject = new MediaStream([ev.track]);
        audioEl.autoplay = true;
        audioEl.setAttribute('data-participant-id', ev.participant.session_id);
        if (audioContainerRef.current) audioContainerRef.current.appendChild(audioEl);
      });
      callObj.on('track-stopped', function(ev) {
        if (ev.participant && ev.participant.local) return;
        if (audioContainerRef.current) {
          var els = audioContainerRef.current.querySelectorAll('[data-participant-id="' + ev.participant.session_id + '"]');
          els.forEach(function(el) { el.remove(); });
        }
      });
      callObj.on('participant-left', function(ev) {
        if (audioContainerRef.current) {
          var els = audioContainerRef.current.querySelectorAll('[data-participant-id="' + ev.participant.session_id + '"]');
          els.forEach(function(el) { el.remove(); });
        }
      });
      callObj.on('joined-meeting', function() {
        setAudioConnected(true); setJoining(false);
        var isMyTurn = isDebater && debate && currentUser && debate.active_speaker_id === currentUser.id;
        callObj.setLocalAudio(!!isMyTurn);
        setIsMuted(!isMyTurn);
      });
      callObj.on('error', function(e) {
        var msg = e.errorMsg || 'Audio error';
        if (msg.indexOf('payment') !== -1) msg = 'Audio provider requires billing setup. Debate features work without audio.';
        setAudioError(msg); setJoining(false);
        try { callObj.destroy(); } catch(ex) {}
        callObjRef.current = null;
      });
      callObj.on('left-meeting', function() { setAudioConnected(false); });
      await callObj.join({ url: debate.audio_room_url, token: tokenData.token, startVideoOff: true, startAudioOff: true });
    } catch (err) {
      if (callObjRef.current) { try { callObjRef.current.destroy(); } catch(e) {} callObjRef.current = null; }
      var msg = err.message || 'Failed to connect audio';
      if (msg.indexOf('payment') !== -1 || msg.indexOf('Payment') !== -1) msg = 'Audio provider requires billing setup. Debate features work without audio.';
      setAudioError(msg); setJoining(false);
    }
  }

  function leaveAudio() {
    if (callObjRef.current) { try { callObjRef.current.leave(); } catch(e) {} try { callObjRef.current.destroy(); } catch(e) {} callObjRef.current = null; }
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = '';
    setAudioConnected(false);
  }

  function toggleMute() {
    if (!callObjRef.current) return;
    if (debate && currentUser && debate.active_speaker_id !== currentUser.id) return;
    callObjRef.current.setLocalAudio(isMuted);
    setIsMuted(!isMuted);
  }

  if (!debate.audio_room_url) {
    return (
      <div style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(11,37,69,0.03)', border: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0 }}>🔇 Audio room not yet created</p>
        {isDebater && (
          <button onClick={async function() { try { await apiCreateAudioRoom(debate.id); } catch (err) { setAudioError(err.message); } }}
            style={{ marginTop: 10, padding: '10px 24px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', boxShadow: '0 2px 8px rgba(197,150,12,0.25)' }}>
            🔊 Create Audio Room
          </button>
        )}
        {audioError && <p style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{audioError}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '14px 18px', borderRadius: 16, background: audioConnected ? 'rgba(22,163,74,0.06)' : 'rgba(11,37,69,0.03)', border: '1px solid ' + (audioConnected ? 'rgba(22,163,74,0.15)' : 'rgba(11,37,69,0.06)') }}>
      <div ref={audioContainerRef} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: audioConnected ? C.green : '#94a3b8', animation: audioConnected ? 'liveDot 1.5s ease-in-out infinite' : 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{audioConnected ? '🔊 Audio Connected' : '🔇 Audio Disconnected'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {audioConnected && isDebater && (function() {
            var isMyTurn = debate && currentUser && debate.active_speaker_id === currentUser.id;
            if (!isMyTurn) return (<span style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.6)' }}>🔇 Muted — Not your turn</span>);
            return (<button onClick={toggleMute} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: isMuted ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)', color: isMuted ? C.red : C.green }}>{isMuted ? '🔇 Unmute' : '🎙 Mute'}</button>);
          })()}
          {!audioConnected ? (
            <button onClick={joinAudio} disabled={joining} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', boxShadow: '0 2px 8px rgba(197,150,12,0.25)' }}>{joining ? '⏳ Connecting...' : '🎧 Join Audio'}</button>
          ) : (
            <button onClick={leaveAudio} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', background: 'rgba(239,68,68,0.06)', color: C.red }}>Leave Audio</button>
          )}
        </div>
      </div>
      {audioError && <p style={{ fontSize: 12, color: C.red, marginTop: 8, margin: '8px 0 0' }}>{audioError}</p>}
    </div>
  );
}

function TranscriptPanel({ debateId, transcriptSegments, isLive, isActiveSpeaker }) {
  if (transcriptSegments.length === 0) {
    return (
      <div style={{ padding: '30px 16px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: 'rgba(197,150,12,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 24 }}>📝</span></div>
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 8px', fontWeight: 500 }}>{isLive ? 'Live transcript will appear here when debaters speak' : 'No transcript segments recorded yet'}</p>
        {isLive && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0, lineHeight: 1.5 }}>Transcription requires Chrome, Edge, or Safari.</p>}
      </div>
    );
  }
  return (
    <div style={{ padding: '12px 14px' }}>
      {transcriptSegments.map(function(seg, i) {
        return (
          <div key={seg.id || i} style={{ marginBottom: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(11,37,69,0.03)', borderLeft: '3px solid ' + C.gold, animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{seg.speaker_name || 'Speaker'}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {seg.section && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(197,150,12,0.1)', color: C.darkGold, fontWeight: 600 }}>{seg.section}</span>}
                {seg.created_at && <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.35)' }}>{timeAgo(seg.created_at)}</span>}
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.6 }}>"{seg.content}"</p>
          </div>
        );
      })}
    </div>
  );
}

export default function DebateSpace() {
  var { debateId: id } = useParams();
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
  var [featuredPolls, setFeaturedPolls] = useState([]);
  var [audiencePolls, setAudiencePolls] = useState([]);
  var [countdown, setCountdown] = useState(null);
  var [audioConnected, setAudioConnected] = useState(false);
  var [isMuted, setIsMuted] = useState(true);
  var callObjRef = useRef(null);
  var [transcriptSegments, setTranscriptSegments] = useState([]);
  var recognitionRef = useRef(null);
  var [isTranscribing, setIsTranscribing] = useState(false);
  var autoTimerFired = useRef(false);
  var warningFired = useRef(false);
  var analysisTriggered = useRef(false);
  var debateStartTimeRef = useRef(null);
  var [audienceVotes, setAudienceVotes] = useState({ a: 0, b: 0 });
  var [userVote, setUserVote] = useState(null);
  var [listenerCount, setListenerCount] = useState(0);
  var presenceChannelRef = useRef(null);

  // ══════════════════════════════════════════════════════════════
  // ALL DATA LOADERS — GUARDED with if (!id) return;
  // ══════════════════════════════════════════════════════════════

  var loadDebate = useCallback(async function() {
    if (!id) return;
    var { data } = await supabase.from('debates').select('*').eq('id', id).single();
    if (!data) { navigate('..'); return; }
    setDebate(data);
    var ids = [data.creator_id, data.opponent_id].filter(Boolean);
    if (ids.length > 0) {
      var { data: users } = await supabase.from('users').select('id, full_name, identity_verified').in('id', ids);
      if (users) { users.forEach(function(u) { if (u.id === data.creator_id) setDebaterA(u); if (u.id === data.opponent_id) setDebaterB(u); }); }
    }
    if (data.turn_started_at && data.turn_duration) {
      var elapsed = Math.floor((Date.now() - new Date(data.turn_started_at).getTime()) / 1000);
      var remaining = Math.max(0, data.turn_duration - elapsed);
      if (data.active_speaker_id === data.creator_id) { setTimerA(remaining); setTimerB(data.turn_duration); }
      else { setTimerB(remaining); setTimerA(data.turn_duration); }
    } else if (data.format) {
      var s = Object.entries(data.format);
      if (s.length > 0) { setTimerA(s[0][1]); setTimerB(s[0][1]); }
    }
    setLoading(false);
  }, [id, navigate]);

  var loadModLog = useCallback(async function() {
    if (!id) return;
    var { data } = await supabase.from('debate_moderator_log').select('*').eq('debate_id', id).order('created_at', { ascending: true });
    setModLog(data || []);
  }, [id]);

  var loadChat = useCallback(async function() {
    if (!id) return;
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
    if (!id) return;
    var { data: pd } = await supabase.from('debate_polls').select('*').eq('debate_id', id).eq('is_active', true);
    if (pd && pd.length > 0) {
      var creatorIds = pd.map(function(p) { return p.created_by; }).filter(Boolean);
      var creatorMap = {};
      if (creatorIds.length > 0) {
        var { data: creators } = await supabase.from('users').select('id, full_name').in('id', Array.from(new Set(creatorIds)));
        if (creators) creators.forEach(function(c) { creatorMap[c.id] = c.full_name; });
      }
      var enriched = await Promise.all(pd.map(async function(p) {
        var { data: votes } = await supabase.from('debate_poll_votes').select('choice').eq('poll_id', p.id);
        var vc = {}; (votes || []).forEach(function(v) { vc[v.choice] = (vc[v.choice] || 0) + 1; });
        var uv = null;
        if (currentUser) { var { data: mv } = await supabase.from('debate_poll_votes').select('choice').eq('poll_id', p.id).eq('user_id', currentUser.id).single(); if (mv) uv = mv.choice; }
        return Object.assign({}, p, { votes: vc, userVote: uv, creator_name: creatorMap[p.created_by] || null });
      }));
      setPolls(enriched);
      setFeaturedPolls(enriched.filter(function(p) { return p.poll_type === 'featured'; }));
      setAudiencePolls(enriched.filter(function(p) { return p.poll_type === 'audience'; }));
    } else { setPolls([]); setFeaturedPolls([]); setAudiencePolls([]); }
  }, [id, currentUser]);

  var loadTranscript = useCallback(async function() {
    if (!id) return;
    var { data } = await supabase.from('debate_transcript_segments').select('*, users:speaker_id(full_name)').eq('debate_id', id).eq('is_final', true).order('created_at', { ascending: true });
    if (data) {
      setTranscriptSegments(data.map(function(s) { return Object.assign({}, s, { speaker_name: s.users ? s.users.full_name : 'Speaker' }); }));
    }
  }, [id]);

  var loadAudienceVotes = useCallback(async function() {
    if (!id) return;
    var { data } = await supabase.from('debate_audience_votes').select('voted_for').eq('debate_id', id);
    if (data) {
      var a = 0, b = 0;
      data.forEach(function(v) {
        if (debate && v.voted_for === debate.creator_id) a++;
        else b++;
      });
      setAudienceVotes({ a: a, b: b });
    }
    if (currentUser) {
      var { data: mv } = await supabase.from('debate_audience_votes').select('voted_for').eq('debate_id', id).eq('user_id', currentUser.id).single();
      if (mv) setUserVote(mv.voted_for);
      else setUserVote(null);
    }
  }, [id, currentUser, debate]);

  async function castAudienceVote(votedFor) {
    if (!currentUser || !id) return;
    if (userVote === votedFor) return;
    if (userVote) {
      await supabase.from('debate_audience_votes').update({ voted_for: votedFor }).eq('debate_id', id).eq('user_id', currentUser.id);
    } else {
      await supabase.from('debate_audience_votes').insert({ debate_id: id, user_id: currentUser.id, voted_for: votedFor });
    }
    setUserVote(votedFor);
    loadAudienceVotes();
  }

  // Presence tracking
  useEffect(function() {
    if (!id) return;
    var channel = supabase.channel('presence-debate-' + id, { config: { presence: { key: currentUser ? currentUser.id : 'anon-' + Math.random().toString(36).substr(2, 9) } } });
    channel.on('presence', { event: 'sync' }, function() {
      var state = channel.presenceState();
      setListenerCount(Object.keys(state).length);
    });
    channel.subscribe(async function(status) {
      if (status === 'SUBSCRIBED') await channel.track({ user_id: currentUser ? currentUser.id : null, joined_at: new Date().toISOString() });
    });
    presenceChannelRef.current = channel;
    return function() { supabase.removeChannel(channel); };
  }, [id, currentUser]);

  // Subscribe to audience vote changes
  useEffect(function() {
    if (!id) return;
    var ch = supabase.channel('av-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debate_audience_votes', filter: 'debate_id=eq.' + id }, function() { loadAudienceVotes(); }).subscribe();
    return function() { supabase.removeChannel(ch); };
  }, [id, loadAudienceVotes]);

  useEffect(function() {
    if (!id) return;
    loadDebate(); loadModLog(); loadChat(); loadPolls(); loadTranscript();
  }, [loadDebate, loadModLog, loadChat, loadPolls, loadTranscript]);

  useEffect(function() { if (debate) loadAudienceVotes(); }, [debate, loadAudienceVotes]);

  // Realtime subscriptions — ALL GUARDED
  useEffect(function() {
    if (!id) return;
    var ch = supabase.channel('dc-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_chat_messages', filter: 'debate_id=eq.' + id }, function(p) {
        setChatMessages(function(prev) { return prev.concat([p.new]); });
        var uid = p.new.user_id;
        if (!chatUsers[uid]) supabase.from('users').select('id, full_name, identity_verified').eq('id', uid).single().then(function(r) { if (r.data) setChatUsers(function(prev) { return Object.assign({}, prev, { [uid]: r.data }); }); });
      }).subscribe();
    var ml = supabase.channel('dm-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_moderator_log', filter: 'debate_id=eq.' + id }, function(p) { setModLog(function(prev) { return prev.concat([p.new]); }); }).subscribe();
    var ds = supabase.channel('ds-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'debates', filter: 'id=eq.' + id }, function(p) {
        setDebate(p.new);
        if (p.new.turn_started_at && p.new.turn_duration) {
          var elapsed = Math.floor((Date.now() - new Date(p.new.turn_started_at).getTime()) / 1000);
          var remaining = Math.max(0, p.new.turn_duration - elapsed);
          if (p.new.active_speaker_id === p.new.creator_id) { setTimerA(remaining); setTimerB(p.new.turn_duration); }
          else { setTimerB(remaining); setTimerA(p.new.turn_duration); }
          autoTimerFired.current = false;
        }
      }).subscribe();
    var ts = supabase.channel('dt-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debate_transcript_segments', filter: 'debate_id=eq.' + id }, function(p) {
        if (p.new.is_final) {
          supabase.from('users').select('full_name').eq('id', p.new.speaker_id).single().then(function(r) {
            setTranscriptSegments(function(prev) { return prev.concat([Object.assign({}, p.new, { speaker_name: r.data ? r.data.full_name : 'Speaker' })]); });
          });
        }
      }).subscribe();
    var pl = supabase.channel('dp-' + id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debate_polls', filter: 'debate_id=eq.' + id }, function() { loadPolls(); }).subscribe();
    return function() { supabase.removeChannel(ch); supabase.removeChannel(ml); supabase.removeChannel(ds); supabase.removeChannel(ts); supabase.removeChannel(pl); };
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
      var isCreatorTurn = debate.active_speaker_id === debate.creator_id;
      var setTimer = isCreatorTurn ? setTimerA : setTimerB;
      setTimer(function(t) {
        var newT = Math.max(0, t - 1);
        if (newT === 30 && !warningFired.current && currentUser && debate.active_speaker_id === currentUser.id) {
          warningFired.current = true;
          apiTimerWarning(debate.id, 30).catch(function(e) {});
        }
        if (newT === 0 && !autoTimerFired.current && currentUser && debate.active_speaker_id === currentUser.id) {
          autoTimerFired.current = true;
          apiNextTurn(debate.id).catch(function(err) {});
        }
        return newT;
      });
      if (callObjRef.current && currentUser && (debate.creator_id === currentUser.id || debate.opponent_id === currentUser.id)) {
        var shouldBeUnmuted = debate.active_speaker_id === currentUser.id;
        var localParticipant = callObjRef.current.participants().local;
        if (localParticipant && localParticipant.audio !== shouldBeUnmuted) {
          callObjRef.current.setLocalAudio(shouldBeUnmuted);
          setIsMuted(!shouldBeUnmuted);
        }
      }
    }, 1000);
    return function() { clearInterval(timerRef.current); };
  }, [debate, currentUser]);

  useEffect(function() { if (debate) { warningFired.current = false; analysisTriggered.current = false; } }, [debate && debate.active_speaker_id]);

  useEffect(function() {
    if (!debate || debate.status !== 'live' || !currentUser) return;
    if (debate.active_speaker_id === currentUser.id && !analysisTriggered.current && debate.moderator_type !== 'user') {
      analysisTriggered.current = true;
      var timer = setTimeout(function() { apiAnalyzeTranscript(debate.id).catch(function(e) {}); }, 10000);
      return function() { clearTimeout(timer); };
    }
  }, [debate && debate.current_section, currentUser]);

  useEffect(function() {
    if (!debate || debate.status !== 'live' || !currentUser) return;
    var isActiveSpeakerNow = debate.active_speaker_id === currentUser.id;
    if (isActiveSpeakerNow && !isTranscribing) startTranscription();
    else if (!isActiveSpeakerNow && isTranscribing) stopTranscription();
  }, [debate, currentUser, isTranscribing]);

  function startTranscription() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    var recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onresult = function(event) {
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var result = event.results[i];
        if (result.isFinal && result[0].transcript.trim()) {
          supabase.from('debate_transcript_segments').insert({
            debate_id: id, speaker_id: currentUser.id, section: debate ? debate.current_section : null,
            content: result[0].transcript.trim(), is_final: true,
            start_time: debateStartTimeRef.current ? (Date.now() - debateStartTimeRef.current) / 1000 : null,
          }).then(function(res) { if (res.error) console.error('[Transcript] Insert error:', res.error); });
        }
      }
    };
    recognition.onerror = function(e) { console.log('[Transcript] Error:', e.error); };
    recognition.onend = function() { if (recognitionRef.current) { try { setTimeout(function() { if (recognitionRef.current) recognitionRef.current.start(); }, 200); } catch (e) {} } };
    recognitionRef.current = recognition;
    if (!debateStartTimeRef.current) debateStartTimeRef.current = Date.now();
    try { recognition.start(); setIsTranscribing(true); } catch (e) {}
  }

  function stopTranscription() {
    if (recognitionRef.current) { recognitionRef.current.onend = null; try { recognitionRef.current.stop(); } catch (e) {} recognitionRef.current = null; }
    setIsTranscribing(false);
  }

  useEffect(function() {
    return function() {
      if (callObjRef.current) { try { callObjRef.current.leave(); } catch(e) {} try { callObjRef.current.destroy(); } catch(e) {} callObjRef.current = null; }
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }
    };
  }, []);

  async function sendChat() {
    if (!chatInput.trim() || sendingChat || !currentUser || !id) return;
    setSendingChat(true);
    var content = chatInput.trim();
    var { data: inserted } = await supabase.from('debate_chat_messages').insert({ debate_id: id, user_id: currentUser.id, content: content }).select().single();
    setChatInput(''); setSendingChat(false);
    if (inserted && debate && debate.moderator_type !== 'user') {
      apiModerateChat(debate.id, inserted.id, content, profile ? profile.full_name : 'User').catch(function(e) {});
    }
  }
  async function votePoll(pollId, choice) {
    if (!currentUser) return;
    await supabase.from('debate_poll_votes').insert({ poll_id: pollId, user_id: currentUser.id, choice: choice });
    loadPolls();
  }
  async function concedeTime() { if (!currentUser || !debate) return; try { await apiConcedeTime(debate.id); } catch (err) {} }
  async function handleStartDebate() { if (!currentUser || !debate) return; try { await apiStartDebate(debate.id); } catch (err) {} }
  async function handleGenerateScorecard() { if (!debate) return; try { await apiScorecard(debate.id); } catch (err) {} }
  async function handleGenerateReport() { if (!debate) return; try { await apiGenerateReport(debate.id); } catch (err) {} }

  var isDebater = debate && currentUser && (debate.creator_id === currentUser.id || debate.opponent_id === currentUser.id);
  var isModerator = debate && currentUser && debate.moderator_type === 'user' && debate.moderator_user_id === currentUser.id;
  var isActiveSpeaker = debate && currentUser && debate.active_speaker_id === currentUser.id;
  var isLive = debate && debate.status === 'live';
  var isWaiting = debate && (debate.status === 'waiting_room' || debate.status === 'confirmed' || debate.status === 'pending');
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
    <div style={{ width: '100%' }}>
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

      <div style={{ marginBottom: 20 }}>
        <button onClick={function() { navigate(-1); }} style={{ background: 'rgba(11,37,69,0.04)', border: 'none', color: C.navy, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, marginBottom: 16, fontFamily: 'DM Sans, sans-serif' }}>← Back to Debates</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {isLive && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg, #ef4444, #dc2626)', fontSize: 12, fontWeight: 800, color: '#fff', boxShadow: '0 2px 12px rgba(239,68,68,0.3)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'liveDot 1.5s ease-in-out infinite' }} />LIVE NOW</span>}
              {isWaiting && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', fontSize: 12, fontWeight: 700, color: '#fff', boxShadow: '0 2px 12px rgba(59,130,246,0.25)' }}>⏳ Waiting Room</span>}
              {isCompleted && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 20, background: C.navy, fontSize: 12, fontWeight: 700, color: '#fff' }}>✓ Completed</span>}
              {isTranscribing && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.08)', fontSize: 11, fontWeight: 700, color: C.red }}>● REC</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1.3 }}>{debate.topic}</h1>
            {debate.description && <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: '6px 0 0', lineHeight: 1.5 }}>{debate.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: 'rgba(11,37,69,0.04)' }}>
            <span style={{ fontSize: 14 }}>👁</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{listenerCount}</span>
            <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)' }}>listening</span>
          </div>
        </div>
      </div>

      {!isCompleted && (
        <div style={{ marginBottom: 16 }}>
          <AudioPanel debate={debate} currentUser={currentUser} isDebater={isDebater} callObjRef={callObjRef} audioConnected={audioConnected} setAudioConnected={setAudioConnected} isMuted={isMuted} setIsMuted={setIsMuted} />
        </div>
      )}

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

      <div style={{ background: '#fff', borderRadius: 20, padding: '20px 14px', border: isLive ? '2px solid rgba(197,150,12,0.2)' : '1px solid rgba(11,37,69,0.06)', marginBottom: 20, boxShadow: '0 4px 24px rgba(11,37,69,0.04)' }}>
        {debate.current_section && <div style={{ textAlign: 'center', marginBottom: 16 }}><span style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(197,150,12,0.1), rgba(197,150,12,0.15))', fontSize: 12, fontWeight: 700, color: C.darkGold, border: '1px solid rgba(197,150,12,0.2)' }}>📌 {debate.current_section}</span></div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <SpeakerCard name={debaterA ? debaterA.full_name : 'TBD'} isActive={debate.active_speaker_id === debate.creator_id} isVerified={debaterA && debaterA.identity_verified} timeLeft={timerA} side="Proposition" isMuted={isMuted} isAudioConnected={audioConnected && currentUser && debate.creator_id === currentUser.id} />
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0B2545, #163a64)', boxShadow: '0 2px 10px rgba(11,37,69,0.15)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>VS</span>
            </div>
          </div>
          <SpeakerCard name={debaterB ? debaterB.full_name : 'TBD'} isActive={debate.active_speaker_id === debate.opponent_id} isVerified={debaterB && debaterB.identity_verified} timeLeft={timerB} side="Opposition" isMuted={isMuted} isAudioConnected={audioConnected && currentUser && debate.opponent_id === currentUser.id} />
        </div>
        {isActiveSpeaker && isLive && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={concedeTime} style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(197,150,12,0.08), rgba(197,150,12,0.15))', border: '2px solid rgba(197,150,12,0.3)', color: C.darkGold, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>⏭ Concede Remaining Time</button>
          </div>
        )}
      </div>

      {(isLive || isCompleted) && (
        <LiveVoteBar debate={debate} debaterA={debaterA} debaterB={debaterB} votesA={audienceVotes.a} votesB={audienceVotes.b} userVote={userVote} onVote={castAudienceVote} currentUser={currentUser} />
      )}

      {(isLive || isCompleted) && (featuredPolls.length > 0 || (isDebater || isModerator)) && (
        <div style={{ padding: '18px 22px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(197,150,12,0.03), rgba(197,150,12,0.06))', border: '1px solid rgba(197,150,12,0.12)', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 14px' }}>📊 Featured Polls</p>
          {featuredPolls.map(function(p) { return <PollCard key={p.id} poll={p} onVote={votePoll} />; })}
          {(isDebater || isModerator) && isLive && currentUser && (
            <CreatePollForm debateId={id} currentUser={currentUser} pollType="featured" onCreated={loadPolls} />
          )}
          {featuredPolls.length === 0 && !(isDebater || isModerator) && (
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0, textAlign: 'center' }}>No featured polls yet</p>
          )}
        </div>
      )}

      <div className="cv-ds-main" style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: 420, background: 'linear-gradient(180deg, #fff 0%, #fafaf8 100%)', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 2px 16px rgba(11,37,69,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid rgba(11,37,69,0.06)', background: 'linear-gradient(135deg, #0B2545, #163a64)', borderRadius: '20px 20px 0 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(197,150,12,0.3)' }}><span style={{ fontSize: 18 }}>{debate.moderator_type === 'user' ? '👤' : '⚖️'}</span></div>
            <div><p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>The Forum</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500 }}>{debate.moderator_type === 'user' ? 'Human Moderator' : 'AI Moderator'}</p></div>
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

        <div className="cv-ds-sidebar" style={{ width: 380, borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: 420, background: '#fff', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 2px 16px rgba(11,37,69,0.03)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: C.navy }}>
            {[{ id: 'chat', label: '💬 Chat', count: chatMessages.length }, { id: 'transcript', label: '📝 Transcript', count: transcriptSegments.length }, { id: 'polls', label: '📊 Polls', count: audiencePolls.length }, { id: 'info', label: 'ℹ️ Info' }].map(function(t) {
              var active = activeTab === t.id;
              return (<button key={t.id} className="cv-ds-tab" onClick={function() { setActiveTab(t.id); }} style={{ flex: 1, padding: '14px 4px', fontSize: 11, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.45)', background: active ? 'rgba(197,150,12,0.2)' : 'transparent', borderBottom: active ? '3px solid ' + C.gold : '3px solid transparent' }}>
                {t.label}{t.count > 0 && <span style={{ marginLeft: 4, padding: '2px 6px', borderRadius: 10, fontSize: 9, fontWeight: 700, background: active ? C.gold : 'rgba(255,255,255,0.15)', color: '#fff' }}>{t.count}</span>}
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
                  return <ChatMsg key={m.id} name={u ? u.full_name : '...'} content={m.content} isVerified={u && u.identity_verified} time={m.created_at} index={idx} />;
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

            {activeTab === 'transcript' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <TranscriptPanel debateId={id} transcriptSegments={transcriptSegments} isLive={isLive} isActiveSpeaker={isActiveSpeaker} />
              </div>
            )}

            {activeTab === 'polls' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {currentUser && !isDebater && !isModerator && isLive && (
                  <div style={{ marginBottom: 14 }}>
                    <CreatePollForm debateId={id} currentUser={currentUser} pollType="audience" onCreated={loadPolls} />
                  </div>
                )}
                {audiencePolls.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>🎤 Audience Polls</p>
                    {audiencePolls.map(function(p) { return <PollCard key={p.id} poll={p} onVote={votePoll} />; })}
                  </div>
                )}
                {featuredPolls.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>⭐ Featured Polls</p>
                    {featuredPolls.map(function(p) { return <PollCard key={p.id} poll={p} onVote={votePoll} />; })}
                  </div>
                )}
                {polls.length === 0 && (
                  <div style={{ padding: '40px 8px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: 'rgba(197,150,12,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 24 }}>📊</span></div>
                    <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.5)', margin: '0 0 4px', fontWeight: 500 }}>No polls yet</p>
                    <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>{isLive ? 'Create a poll or wait for debaters to launch one' : 'Polls appear during live debates'}</p>
                  </div>
                )}
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
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1.5 }}>Debaters</p>
                  {[debaterA, debaterB].filter(Boolean).map(function(d, i) {
                    var isG = i === 0;
                    return <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, marginBottom: 6, background: isG ? 'rgba(22,163,74,0.06)' : 'rgba(197,150,12,0.06)', border: '1px solid ' + (isG ? 'rgba(22,163,74,0.12)' : 'rgba(197,150,12,0.12)') }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: isG ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #C5960C, #a07a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{(d.full_name || '?').charAt(0).toUpperCase()}</div>
                      <div><p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>{d.full_name}</p>{d.identity_verified && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✓ Verified</span>}</div>
                    </div>;
                  })}
                </div>
                {isCompleted && (
                  <div style={{ marginBottom: 22 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1.5 }}>🤖 AI Analysis</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={handleGenerateScorecard} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(197,150,12,0.2)', background: 'rgba(197,150,12,0.06)', color: C.darkGold, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>🏆 Scorecard</button>
                      <button onClick={handleGenerateReport} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)', background: 'rgba(11,37,69,0.04)', color: C.navy, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>📄 Full Report</button>
                    </div>
                  </div>
                )}
                {debate.summary && (
                  <div style={{ marginTop: 14, padding: '16px 18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(197,150,12,0.06), rgba(197,150,12,0.1))', border: '1px solid rgba(197,150,12,0.15)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1.5 }}>⚖️ AI Summary</p>
                    <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.6 }}>{debate.summary}</p>
                  </div>
                )}
                {debate.report_card && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ padding: '16px 18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(11,37,69,0.02), rgba(197,150,12,0.04))', border: '1px solid rgba(197,150,12,0.12)' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 10px' }}>📄 {debate.report_card.title || 'Debate Report Card'}</p>
                      {debate.report_card.overview && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.65)', margin: '0 0 14px', lineHeight: 1.5 }}>{debate.report_card.overview}</p>}
                      {[debate.report_card.debater_a, debate.report_card.debater_b].filter(Boolean).map(function(d, i) {
                        return (
                          <div key={i} style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 10, background: '#fff', border: '1px solid rgba(11,37,69,0.06)' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.green : C.darkGold, margin: '0 0 8px' }}>{d.name}</p>
                            {d.scores && (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                {Object.entries(d.scores).map(function(s) { return <span key={s[0]} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: 'rgba(11,37,69,0.04)', color: 'rgba(11,37,69,0.7)', fontWeight: 600 }}>{s[0]}: {s[1]}/10</span>; })}
                              </div>
                            )}
                            {d.strengths && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.6)', margin: '0 0 4px', lineHeight: 1.4 }}>💪 {d.strengths}</p>}
                            {d.areas_to_improve && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>📝 {d.areas_to_improve}</p>}
                          </div>
                        );
                      })}
                      {debate.report_card.recommendations && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.55)', margin: '8px 0 0', lineHeight: 1.5 }}>💡 {debate.report_card.recommendations}</p>}
                    </div>
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
