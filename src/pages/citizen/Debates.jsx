// src/pages/citizen/Debates.jsx — CivicVerify Live Debates
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#16a34a', red: '#B8352E' };
var font = 'Libre Baskerville, Georgia, serif';

// Pre-set debate formats
var FORMATS = [
  { label: 'Standard', value: { 'Opening Statement': 300, 'Rebuttal': 180, 'Closing Statement': 120 }, desc: '5 min open, 3 min rebuttal, 2 min close' },
  { label: 'Quick Fire', value: { 'Opening Statement': 120, 'Rebuttal': 120, 'Closing Statement': 60 }, desc: '2 min open, 2 min rebuttal, 1 min close' },
  { label: 'Extended', value: { 'Opening Statement': 300, 'Rebuttal': 300, 'Q&A': 180, 'Closing Statement': 120 }, desc: '5 min open, 5 min rebuttal, 3 min Q&A, 2 min close' },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatDuration(format) {
  var total = Object.values(format).reduce(function(a, b) { return a + b; }, 0);
  return Math.round(total / 60) + ' min total';
}
function timeUntil(d) {
  var diff = new Date(d) - new Date();
  if (diff < 0) return 'Started';
  var days = Math.floor(diff / 86400000);
  var hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return days + 'd ' + hours + 'h';
  var mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return hours + 'h ' + mins + 'm';
  return mins + 'm';
}

// Status badge component
function StatusBadge({ status }) {
  var cfg = {
    pending: { label: 'Open Challenge', bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
    confirmed: { label: 'Confirmed', bg: '#D1FAE5', color: '#065F46', icon: '✓' },
    waiting_room: { label: 'Lobby Open', bg: '#DBEAFE', color: '#1E40AF', icon: '🔵' },
    live: { label: 'LIVE', bg: '#FEE2E2', color: '#991B1B', icon: '🔴' },
    completed: { label: 'Completed', bg: '#F3F4F6', color: '#374151', icon: '✓' },
    cancelled: { label: 'Cancelled', bg: '#F3F4F6', color: '#6B7280', icon: '✕' },
  };
  var c = cfg[status] || cfg.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, letterSpacing: 0.3 }}>
      <span style={{ fontSize: 10 }}>{c.icon}</span>{c.label}
    </span>
  );
}

// Format sections display
function FormatPills({ format }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {Object.entries(format).map(function(entry) {
        return (
          <span key={entry[0]} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(11,37,69,0.06)', color: 'rgba(11,37,69,0.65)', fontWeight: 500 }}>
            {entry[0]} · {Math.round(entry[1] / 60)}m
          </span>
        );
      })}
    </div>
  );
}

export default function Debates() {
  var auth = useAuth();
  var currentUser = auth.user;
  var profile = auth.profile;
  var navigate = useNavigate();

  var [debates, setDebates] = useState([]);
  var [users, setUsers] = useState({});
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('upcoming');
  var [showForm, setShowForm] = useState(false);
  var [creating, setCreating] = useState(false);
  var [accepting, setAccepting] = useState(null);
  var [searchUser, setSearchUser] = useState('');
  var [searchResults, setSearchResults] = useState([]);
  var [searching, setSearching] = useState(false);

  var [form, setForm] = useState({
    topic: '',
    description: '',
    formatIndex: 0,
    challengeType: 'open',
    directOpponentId: null,
    directOpponentName: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  var loadDebates = useCallback(async function() {
    var { data } = await supabase
      .from('debates')
      .select('*')
      .order('scheduled_at', { ascending: true });
    
    if (data && data.length > 0) {
      setDebates(data);
      var userIds = [];
      data.forEach(function(d) {
        if (d.creator_id && !users[d.creator_id]) userIds.push(d.creator_id);
        if (d.opponent_id && !users[d.opponent_id]) userIds.push(d.opponent_id);
      });
      if (userIds.length > 0) {
        var unique = Array.from(new Set(userIds));
        var { data: userData } = await supabase.from('users').select('id, full_name, identity_verified').in('id', unique);
        if (userData) {
          var map = Object.assign({}, users);
          userData.forEach(function(u) { map[u.id] = u; });
          setUsers(map);
        }
      }
    } else {
      setDebates([]);
    }
    setLoading(false);
  }, []);

  useEffect(function() { loadDebates(); }, [loadDebates]);

  async function searchOpponent(query) {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    var { data } = await supabase
      .from('users')
      .select('id, full_name, identity_verified')
      .eq('role', 'citizen')
      .eq('identity_verified', true)
      .neq('id', currentUser.id)
      .ilike('full_name', '%' + query + '%')
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
  }

  async function createDebate() {
    if (!form.topic.trim()) return alert('Please enter a debate topic');
    if (!form.scheduledDate || !form.scheduledTime) return alert('Please select a date and time');
    if (form.challengeType === 'direct' && !form.directOpponentId) return alert('Please select an opponent');

    var scheduled = new Date(form.scheduledDate + 'T' + form.scheduledTime);
    if (scheduled < new Date()) return alert('Scheduled time must be in the future');

    setCreating(true);
    var { error } = await supabase.from('debates').insert({
      topic: form.topic.trim(),
      description: form.description.trim() || null,
      format: FORMATS[form.formatIndex].value,
      challenge_type: form.challengeType,
      creator_id: currentUser.id,
      opponent_id: form.challengeType === 'direct' ? form.directOpponentId : null,
      scheduled_at: scheduled.toISOString(),
      status: form.challengeType === 'direct' ? 'pending' : 'pending',
    });

    setCreating(false);
    if (error) { alert('Error: ' + error.message); return; }

    setForm({ topic: '', description: '', formatIndex: 0, challengeType: 'open', directOpponentId: null, directOpponentName: '', scheduledDate: '', scheduledTime: '' });
    setShowForm(false);
    loadDebates();
  }

  async function acceptChallenge(debateId) {
    setAccepting(debateId);
    var { error } = await supabase.from('debates')
      .update({ opponent_id: currentUser.id, status: 'confirmed' })
      .eq('id', debateId);
    setAccepting(null);
    if (error) { alert('Error: ' + error.message); return; }
    loadDebates();
  }

  async function cancelDebate(debateId) {
    if (!confirm('Cancel this debate?')) return;
    await supabase.from('debates').update({ status: 'cancelled' }).eq('id', debateId);
    loadDebates();
  }

  async function acceptDirect(debateId) {
    setAccepting(debateId);
    var { error } = await supabase.from('debates')
      .update({ status: 'confirmed' })
      .eq('id', debateId);
    setAccepting(null);
    if (!error) loadDebates();
  }

  var now = new Date();
  var filtered = debates.filter(function(d) {
    if (tab === 'upcoming') return (d.status === 'confirmed' || d.status === 'waiting_room' || d.status === 'live') && new Date(d.scheduled_at) >= new Date(now - 86400000);
    if (tab === 'open') return d.status === 'pending' && d.challenge_type === 'open' && d.creator_id !== (currentUser && currentUser.id);
    if (tab === 'my') return currentUser && (d.creator_id === currentUser.id || d.opponent_id === currentUser.id) && d.status !== 'completed' && d.status !== 'cancelled';
    if (tab === 'past') return d.status === 'completed' || d.status === 'cancelled';
    return true;
  });

  var myDirectChallenges = debates.filter(function(d) {
    return d.status === 'pending' && d.challenge_type === 'direct' && d.opponent_id === (currentUser && currentUser.id);
  });

  function getUserName(id) {
    if (!id) return 'TBD';
    var u = users[id];
    return u ? u.full_name || 'Citizen' : '...';
  }
  function isVerified(id) {
    var u = users[id];
    return u && u.identity_verified;
  }

  var inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.08)',
    borderRadius: 12, background: '#fff', outline: 'none', color: C.navy,
    fontFamily: 'DM Sans, sans-serif', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
  var labelStyle = { fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.6)', marginBottom: 6, display: 'block' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .cv-debate-card{transition:all 0.2s ease;cursor:pointer}
        .cv-debate-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(11,37,69,0.08)!important}
        .cv-tab-btn{transition:all 0.2s ease;cursor:pointer;border:none;font-family:DM Sans,sans-serif}
        .cv-tab-btn:hover{background:rgba(197,150,12,0.08)}
        .cv-form-input:focus{border-color:rgba(197,150,12,0.4)!important;box-shadow:0 0 0 3px rgba(197,150,12,0.1)}
        .cv-search-item{transition:background 0.15s;cursor:pointer}
        .cv-search-item:hover{background:rgba(197,150,12,0.06)!important}
        @media(max-width:640px){
          .cv-debate-header{flex-direction:column!important;gap:12px!important}
          .cv-tab-row{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .cv-form-row{grid-template-columns:1fr!important}
          .cv-debate-meta{flex-direction:column!important;gap:8px!important}
        }
      `}</style>

      {/* Header */}
      <div className="cv-debate-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>
            Live Debates
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.65)', margin: '6px 0 0', lineHeight: 1.5 }}>
            AI-moderated civic debates between verified citizens
          </p>
        </div>
        {profile && profile.identity_verified && (
          <button
            onClick={function() { setShowForm(!showForm); }}
            style={{
              padding: '12px 24px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700,
              background: showForm ? 'rgba(11,37,69,0.06)' : C.gold, color: showForm ? C.navy : '#fff',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              boxShadow: showForm ? 'none' : '0 2px 12px rgba(197,150,12,0.3)',
            }}
          >
            {showForm ? '✕ Cancel' : '⚡ Schedule Debate'}
          </button>
        )}
      </div>

      {/* Verification Notice */}
      {profile && !profile.identity_verified && (
        <div style={{
          padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(197,150,12,0.2)',
          background: 'linear-gradient(135deg, #FFFBF0, #FFF8E7)', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>Identity verification required</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: '4px 0 0' }}>
              You need to verify your identity to schedule or participate in debates. You can still watch and chat!
            </p>
          </div>
        </div>
      )}

      {/* Direct Challenge Alerts */}
      {myDirectChallenges.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {myDirectChallenges.map(function(d) {
            return (
              <div key={d.id} style={{
                padding: '16px 20px', borderRadius: 14,
                border: '2px solid rgba(197,150,12,0.3)',
                background: 'linear-gradient(135deg, #FFFBF0, #FFF8E7)',
                marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.gold, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    ⚔️ Challenge Received
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>{d.topic}</p>
                  <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: 0 }}>
                    From {getUserName(d.creator_id)} · {formatDate(d.scheduled_at)} at {formatTime(d.scheduled_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={function() { acceptDirect(d.id); }}
                    disabled={accepting === d.id}
                    style={{
                      padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700,
                      background: C.gold, color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {accepting === d.id ? 'Accepting...' : '✓ Accept'}
                  </button>
                  <button
                    onClick={function() { cancelDebate(d.id); }}
                    style={{
                      padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.1)',
                      fontSize: 13, fontWeight: 600, background: '#fff', color: 'rgba(11,37,69,0.6)',
                      cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Form */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)',
          padding: 28, marginBottom: 28,
          boxShadow: '0 4px 24px rgba(11,37,69,0.04)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 20px', fontFamily: font }}>
            Schedule a Debate
          </h2>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Topic / Proposition</label>
            <input
              className="cv-form-input"
              style={inputStyle}
              placeholder='e.g. "Should the U.S. adopt a national carbon tax?"'
              value={form.topic}
              onChange={function(e) { setForm(Object.assign({}, form, { topic: e.target.value })); }}
              maxLength={300}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Description <span style={{ fontWeight: 400, color: 'rgba(11,37,69,0.55)' }}>(optional)</span></label>
            <textarea
              className="cv-form-input"
              style={Object.assign({}, inputStyle, { minHeight: 80, resize: 'vertical' })}
              placeholder="Add context or background for the debate..."
              value={form.description}
              onChange={function(e) { setForm(Object.assign({}, form, { description: e.target.value })); }}
              maxLength={1000}
            />
          </div>

          <div className="cv-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Debate Format</label>
              <div style={{ display: 'grid', gap: 8 }}>
                {FORMATS.map(function(f, i) {
                  var selected = form.formatIndex === i;
                  return (
                    <div
                      key={i}
                      onClick={function() { setForm(Object.assign({}, form, { formatIndex: i })); }}
                      style={{
                        padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        border: selected ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.06)',
                        background: selected ? 'rgba(197,150,12,0.04)' : '#fff',
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>
                        {selected && '✦ '}{f.label}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.65)', margin: '3px 0 0' }}>
                        {f.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Challenge Type</label>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { val: 'open', label: 'Open Challenge', desc: 'Any verified citizen can accept', icon: '🌐' },
                  { val: 'direct', label: 'Direct Challenge', desc: 'Challenge a specific citizen', icon: '🎯' },
                ].map(function(opt) {
                  var selected = form.challengeType === opt.val;
                  return (
                    <div
                      key={opt.val}
                      onClick={function() { setForm(Object.assign({}, form, { challengeType: opt.val, directOpponentId: null, directOpponentName: '' })); setSearchResults([]); setSearchUser(''); }}
                      style={{
                        padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        border: selected ? '2px solid ' + C.gold : '1px solid rgba(11,37,69,0.06)',
                        background: selected ? 'rgba(197,150,12,0.04)' : '#fff',
                      }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0 }}>
                        {opt.icon} {opt.label}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.65)', margin: '3px 0 0' }}>
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {form.challengeType === 'direct' && (
                <div style={{ marginTop: 12 }}>
                  {form.directOpponentId ? (
                    <div style={{
                      padding: '10px 14px', borderRadius: 10, background: '#D1FAE5', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>✓ {form.directOpponentName}</span>
                      <button onClick={function() { setForm(Object.assign({}, form, { directOpponentId: null, directOpponentName: '' })); }}
                        style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        className="cv-form-input"
                        style={inputStyle}
                        placeholder="Search verified citizens..."
                        value={searchUser}
                        onChange={function(e) { setSearchUser(e.target.value); searchOpponent(e.target.value); }}
                      />
                      {searching && <div style={{ position: 'absolute', right: 12, top: 13, width: 16, height: 16, border: '2px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
                      {searchResults.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                          borderRadius: 12, border: '1px solid rgba(11,37,69,0.08)',
                          boxShadow: '0 8px 24px rgba(11,37,69,0.1)', zIndex: 10, marginTop: 4,
                          overflow: 'hidden',
                        }}>
                          {searchResults.map(function(u) {
                            return (
                              <div key={u.id} className="cv-search-item"
                                onClick={function() {
                                  setForm(Object.assign({}, form, { directOpponentId: u.id, directOpponentName: u.full_name }));
                                  setSearchResults([]); setSearchUser('');
                                }}
                                style={{ padding: '10px 14px', borderBottom: '1px solid rgba(11,37,69,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}
                              >
                                <div style={{
                                  width: 30, height: 30, borderRadius: '50%', background: 'rgba(11,37,69,0.06)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 700, color: 'rgba(11,37,69,0.65)',
                                }}>
                                  {(u.full_name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{u.full_name}</p>
                                  <p style={{ fontSize: 11, color: '#16a34a', margin: 0, fontWeight: 600 }}>✓ Verified</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="cv-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                className="cv-form-input"
                type="date"
                style={inputStyle}
                value={form.scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={function(e) { setForm(Object.assign({}, form, { scheduledDate: e.target.value })); }}
              />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input
                className="cv-form-input"
                type="time"
                style={inputStyle}
                value={form.scheduledTime}
                onChange={function(e) { setForm(Object.assign({}, form, { scheduledTime: e.target.value })); }}
              />
            </div>
          </div>

          {form.topic && (
            <div style={{
              padding: '14px 18px', borderRadius: 12, background: 'rgba(11,37,69,0.02)',
              border: '1px dashed rgba(11,37,69,0.08)', marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.55)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Preview</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>{form.topic}</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.65)', margin: 0 }}>
                {FORMATS[form.formatIndex].label} format · {formatDuration(FORMATS[form.formatIndex].value)} · {form.challengeType === 'open' ? 'Open to all' : 'Direct: ' + (form.directOpponentName || '...')}
              </p>
            </div>
          )}

          <button
            onClick={createDebate}
            disabled={creating}
            style={{
              padding: '14px 32px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700,
              background: creating ? 'rgba(11,37,69,0.1)' : C.gold, color: '#fff',
              cursor: creating ? 'default' : 'pointer', fontFamily: 'DM Sans, sans-serif',
              boxShadow: creating ? 'none' : '0 2px 16px rgba(197,150,12,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {creating ? 'Creating...' : '⚡ Create Debate Challenge'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="cv-tab-row" style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: 'rgba(11,37,69,0.03)',
        marginBottom: 20,
      }}>
        {[
          { id: 'upcoming', label: 'Upcoming', icon: '📅' },
          { id: 'open', label: 'Open Challenges', icon: '⚔️' },
          { id: 'my', label: 'My Debates', icon: '👤' },
          { id: 'past', label: 'Past', icon: '📜' },
        ].map(function(t) {
          var active = tab === t.id;
          return (
            <button
              key={t.id}
              className="cv-tab-btn"
              onClick={function() { setTab(t.id); }}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? '#fff' : 'transparent',
                color: active ? C.navy : 'rgba(11,37,69,0.55)',
                boxShadow: active ? '0 1px 8px rgba(11,37,69,0.06)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Debate Cards */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: 18,
          border: '1px solid rgba(11,37,69,0.04)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>
            {tab === 'open' ? '⚔️' : tab === 'my' ? '🎙' : tab === 'past' ? '📜' : '📅'}
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(11,37,69,0.6)', margin: '0 0 6px' }}>
            {tab === 'open' ? 'No open challenges right now' :
             tab === 'my' ? 'You have no active debates' :
             tab === 'past' ? 'No past debates yet' :
             'No upcoming debates scheduled'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', margin: 0 }}>
            {tab === 'open' ? 'Check back soon or create your own!' :
             tab === 'my' ? 'Schedule one to get started' :
             tab === 'past' ? 'Completed debates will appear here' :
             'Be the first to schedule a live debate'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filtered.map(function(d) {
            var isCreator = currentUser && d.creator_id === currentUser.id;
            var isOpponent = currentUser && d.opponent_id === currentUser.id;
            var isParticipant = isCreator || isOpponent;
            var canAccept = tab === 'open' && d.status === 'pending' && !isCreator && profile && profile.identity_verified;
            var isLive = d.status === 'live';

            return (
              <div
                key={d.id}
                className="cv-debate-card"
                onClick={function() { navigate('/citizen/debates/' + d.id); }}
                style={{
                  background: '#fff', borderRadius: 18, padding: '22px 24px',
                  border: isLive ? '2px solid rgba(185,27,46,0.2)' : '1px solid rgba(11,37,69,0.04)',
                  boxShadow: '0 2px 16px rgba(11,37,69,0.03)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {isLive && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)', animation: 'livePulse 2s ease-in-out infinite' }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <StatusBadge status={d.status} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.55)' }}>
                    {d.status === 'completed' ? formatDate(d.scheduled_at) :
                     d.status === 'live' ? '🔴 Live Now' :
                     '⏱ ' + timeUntil(d.scheduled_at)}
                  </span>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font, lineHeight: 1.4 }}>
                  {d.topic}
                </h3>
                {d.description && (
                  <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.7)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    {d.description}
                  </p>
                )}

                <div className="cv-debate-meta" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isCreator ? 'rgba(197,150,12,0.15)' : 'rgba(11,37,69,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: isCreator ? C.gold : 'rgba(11,37,69,0.55)',
                      border: isCreator ? '2px solid rgba(197,150,12,0.3)' : 'none',
                    }}>
                      {getUserName(d.creator_id).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>
                        {getUserName(d.creator_id)} {isCreator && <span style={{ fontSize: 10, color: C.gold }}>(you)</span>}
                      </p>
                      {isVerified(d.creator_id) && <p style={{ fontSize: 10, color: C.green, margin: 0, fontWeight: 600 }}>✓ Verified</p>}
                    </div>
                  </div>

                  <span style={{ fontSize: 16, color: 'rgba(11,37,69,0.5)', fontWeight: 700 }}>VS</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {d.opponent_id ? (
                      <>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: isOpponent ? 'rgba(197,150,12,0.15)' : 'rgba(11,37,69,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: isOpponent ? C.gold : 'rgba(11,37,69,0.55)',
                          border: isOpponent ? '2px solid rgba(197,150,12,0.3)' : 'none',
                        }}>
                          {getUserName(d.opponent_id).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>
                            {getUserName(d.opponent_id)} {isOpponent && <span style={{ fontSize: 10, color: C.gold }}>(you)</span>}
                          </p>
                          {isVerified(d.opponent_id) && <p style={{ fontSize: 10, color: C.green, margin: 0, fontWeight: 600 }}>✓ Verified</p>}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.6)', fontStyle: 'italic' }}>
                        Awaiting challenger...
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)' }}>
                    📅 {formatDate(d.scheduled_at)} at {formatTime(d.scheduled_at)}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)' }}>
                    ⏱ {formatDuration(d.format)}
                  </span>
                  {d.listener_count > 0 && (
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)' }}>
                      👁 {d.listener_count} listening
                    </span>
                  )}
                </div>

                <FormatPills format={d.format} />

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  {canAccept && (
                    <button
                      onClick={function(e) { e.stopPropagation(); acceptChallenge(d.id); }}
                      disabled={accepting === d.id}
                      style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700,
                        background: C.gold, color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                        boxShadow: '0 2px 12px rgba(197,150,12,0.25)',
                      }}
                    >
                      {accepting === d.id ? 'Accepting...' : '⚔️ Accept Challenge'}
                    </button>
                  )}
                  {isLive && (
                    <button onClick={function(e) { e.stopPropagation(); }} style={{
                      padding: '10px 22px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700,
                      background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      animation: 'livePulse 2s ease-in-out infinite',
                    }}>
                      🔴 Join Live Debate
                    </button>
                  )}
                  {d.status === 'confirmed' && isParticipant && (
                    <button onClick={function(e) { e.stopPropagation(); }} style={{
                      padding: '10px 22px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.08)',
                      fontSize: 13, fontWeight: 600, background: '#fff', color: C.navy, cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      📋 View Details
                    </button>
                  )}
                  {d.status === 'pending' && isCreator && (
                    <button
                      onClick={function(e) { e.stopPropagation(); cancelDebate(d.id); }}
                      style={{
                        padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.06)',
                        fontSize: 12, fontWeight: 500, background: '#fff', color: 'rgba(11,37,69,0.6)',
                        cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  {d.status === 'completed' && d.summary && (
                    <button onClick={function(e) { e.stopPropagation(); }} style={{
                      padding: '10px 22px', borderRadius: 10, border: '1px solid rgba(11,37,69,0.08)',
                      fontSize: 13, fontWeight: 600, background: '#fff', color: C.navy, cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      📜 View Summary & Transcript
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

