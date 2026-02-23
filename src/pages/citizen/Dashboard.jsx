// src/pages/citizen/Dashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#C0392B', green: '#1A7A3C', purple: '#6D28D9' };
var font = 'Libre Baskerville, Georgia, serif';

function calcAge(dob) { if (!dob) return null; return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000); }
function timeAgo(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}
function Avatar({ name, size }) {
  size = size || 30;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  var cols = [C.navy, C.gold, C.green, C.purple, '#0891b2', '#b45309'];
  var col = cols[(initials.charCodeAt(0) || 0) % cols.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: col + '22', border: '2px solid ' + col + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.35, fontWeight: 700, color: col }}>
      {initials}
    </div>
  );
}
function matchesSurvey(s, p) {
  if (!p) return true;
  if (s.target_state && p.state && p.state !== s.target_state) return false;
  if (s.target_race && p.race && p.race !== s.target_race) return false;
  if (s.target_sex && p.sex && p.sex !== s.target_sex) return false;
  if (s.target_education && p.education && p.education !== s.target_education) return false;
  if (s.target_employment && p.employment && p.employment !== s.target_employment) return false;
  if (s.target_income && p.income && p.income !== s.target_income) return false;
  if (s.target_party && p.party && p.party !== s.target_party) return false;
  if (s.target_housing && p.housing && p.housing !== s.target_housing) return false;
  if (s.target_voter_registered === 'Yes' && p.voter_registered === false) return false;
  if (s.target_voter_registered === 'No' && p.voter_registered === true) return false;
  if (s.target_veteran === 'Yes' && p.veteran === false) return false;
  if (s.target_veteran === 'No' && p.veteran === true) return false;
  var age = calcAge(p.date_of_birth);
  if (age !== null) {
    if (s.target_age_min && age < s.target_age_min) return false;
    if (s.target_age_max && age > s.target_age_max) return false;
  }
  return true;
}

// ── Poll Discussion Feed ───────────────────────────────────────────────────

function PollDiscussionFeed({ navigate, currentUser, currentProfile }) {
  var [feed, setFeed] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [newComment, setNewComment] = useState({});
  var [expanded, setExpanded] = useState({});
  var [posting, setPosting] = useState(null);
  var timerRef = useRef(null);

  useEffect(function() {
    loadFeed(false);
    timerRef.current = setInterval(function() { loadFeed(true); }, 15000);
    return function() { clearInterval(timerRef.current); };
  }, []);

  async function loadFeed(silent) {
    if (!silent) setLoading(true);
    try {
      // Get surveys (active + ended)
      var sr = await supabase.from('surveys')
        .select('id,title,status,response_count,target_responses')
        .in('status', ['active', 'completed', 'closed', 'inactive'])
        .order('created_at', { ascending: false })
        .limit(30);
      var surveys = sr.data || [];

      // Also include active ones
      var sr2 = await supabase.from('surveys').select('id,title,status,response_count,target_responses').eq('status','active');
      var activeSurveys = sr2.data || [];
      
      // Merge and dedupe
      var allSurveys = surveys.slice();
      activeSurveys.forEach(function(s) {
        if (!allSurveys.find(function(x){return x.id===s.id;})) allSurveys.push(s);
      });

      if (!allSurveys.length) { setFeed([]); setLoading(false); return; }

      var ids = allSurveys.map(function(s) { return s.id; });

      // Try to get comments with survey_id column
      var cr = await supabase.from('comments')
        .select('*')
        .in('survey_id', ids)
        .order('created_at', { ascending: false })
        .limit(100);

      if (cr.error) {
        // survey_id column may not exist yet
        setError('sql_missing');
        setLoading(false);
        return;
      }

      var allComments = cr.data || [];
      var map = {};
      allSurveys.forEach(function(s) { map[s.id] = { survey: s, comments: [] }; });
      allComments.forEach(function(c) { if (c.survey_id && map[c.survey_id]) map[c.survey_id].comments.push(c); });

      var result = Object.values(map)
        .filter(function(x) { return x.comments.length > 0; })
        .sort(function(a, b) {
          return (b.comments[0]?.created_at || '') > (a.comments[0]?.created_at || '') ? 1 : -1;
        });

      // If no comments yet, show the surveys anyway so users can start discussing
      if (!result.length) {
        result = allSurveys.map(function(s) { return { survey: s, comments: [] }; });
      }

      setFeed(result);
      setError(null);
    } catch(e) {
      setError('load_failed');
    }
    setLoading(false);
  }

  async function postComment(surveyId) {
    var text = (newComment[surveyId] || '').trim();
    if (!text || !currentUser) return;
    setPosting(surveyId);
    var r = await supabase.from('comments').insert({
      survey_id: surveyId,
      user_id: currentUser.id,
      author_name: currentProfile ? (currentProfile.full_name || 'Citizen') : 'Citizen',
      verified: !!(currentProfile && currentProfile.identity_verified),
      content: text,
      likes: [],
      parent_id: null,
    });
    if (r.error) {
      setError('sql_missing');
      setPosting(null);
      return;
    }
    setNewComment(function(p) { return Object.assign({}, p, { [surveyId]: '' }); });
    setPosting(null);
    loadFeed(true);
  }

  async function toggleLike(comment) {
    if (!currentUser) return;
    var likes = comment.likes || [];
    var liked = likes.includes(currentUser.id);
    var updated = liked ? likes.filter(function(id) { return id !== currentUser.id; }) : likes.concat([currentUser.id]);
    await supabase.from('comments').update({ likes: updated }).eq('id', comment.id);
    loadFeed(true);
  }

  // SQL patch not run yet — show clear instructions
  if (error === 'sql_missing') return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(197,150,12,0.25)', padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>&#9888; One-time database setup required</p>
      <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 14px', lineHeight: 1.6 }}>
        Run this SQL in your Supabase SQL Editor to enable poll comments:
      </p>
      <pre style={{ background: 'rgba(11,37,69,0.03)', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: C.navy, margin: '0 0 14px', overflowX: 'auto', lineHeight: 1.7 }}>
{`alter table comments
  add column if not exists survey_id uuid
  references surveys(id) on delete cascade;

create index if not exists idx_dc_survey
  on comments(survey_id);`}
      </pre>
      <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>After running the SQL, refresh this page.</p>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {feed.map(function(item) {
        var survey = item.survey;
        var comments = item.comments;
        var isExpanded = expanded[survey.id];
        var shown = isExpanded ? comments : comments.slice(0, 2);
        var isActive = survey.status === 'active';
        var inputText = newComment[survey.id] || '';

        return (
          <div key={survey.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.07)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>

            {/* Survey header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(11,37,69,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {isActive
                    ? <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 20, background: C.green + '15', color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />LIVE
                      </span>
                    : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: 'rgba(11,37,69,0.06)', color: 'rgba(11,37,69,0.4)' }}>ENDED</span>
                  }
                  {!isActive && <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', fontStyle: 'italic' }}>discussion still open</span>}
                  <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', marginLeft: 4 }}>&#128172; {comments.length}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: font }}>{survey.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {isActive && (
                  <button onClick={function() { navigate('/citizen/surveys/' + survey.id); }}
                    style={{ padding: '5px 13px', background: C.gold, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(197,150,12,0.3)' }}>
                    Take Poll
                  </button>
                )}
              </div>
            </div>

            {/* Comments list */}
            <div style={{ padding: '12px 20px 4px' }}>
              {comments.length === 0 && (
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: '4px 0 10px', fontStyle: 'italic' }}>No comments yet — be the first!</p>
              )}
              {shown.map(function(c) {
                var liked = currentUser && (c.likes || []).includes(currentUser.id);
                var isOwn = currentUser && c.user_id === currentUser.id;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <Avatar name={c.author_name} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ background: 'rgba(11,37,69,0.03)', borderRadius: 11, padding: '9px 13px', marginBottom: 4, border: '1px solid rgba(11,37,69,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{c.author_name || 'Citizen'}</span>
                          {c.verified && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.green + '15', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Verified
                            </span>
                          )}
                          {isOwn && <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.25)' }}>you</span>}
                          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', marginLeft: 'auto' }}>{timeAgo(c.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.72)', margin: 0, lineHeight: 1.55, wordBreak: 'break-word' }}>{c.content}</p>
                      </div>
                      <button onClick={function() { toggleLike(c); }}
                        style={{ fontSize: 11, fontWeight: 700, color: liked ? C.gold : 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                        {liked ? '\u2665' : '\u2661'} {(c.likes || []).length || ''}
                      </button>
                    </div>
                  </div>
                );
              })}
              {comments.length > 2 && (
                <button onClick={function() { setExpanded(function(p) { return Object.assign({}, p, { [survey.id]: !isExpanded }); }); }}
                  style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px', display: 'block' }}>
                  {isExpanded ? '\u2191 Show less' : '\u2193 ' + (comments.length - 2) + ' more comments'}
                </button>
              )}
            </div>

            {/* Comment input */}
            <div style={{ padding: '8px 20px 16px', display: 'flex', gap: 9, alignItems: 'center' }}>
              <Avatar name={currentProfile ? currentProfile.full_name : 'You'} size={28} />
              <input
                value={inputText}
                onChange={function(e) { setNewComment(function(p) { return Object.assign({}, p, { [survey.id]: e.target.value }); }); }}
                onKeyDown={function(e) { if (e.key === 'Enter') postComment(survey.id); }}
                placeholder="What do you think about this poll?"
                style={{ flex: 1, padding: '9px 14px', fontSize: 13, border: '1.5px solid rgba(11,37,69,0.1)', borderRadius: 22, outline: 'none', fontFamily: 'inherit', color: C.navy }}
                onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.1)'; }}
              />
              <button
                onClick={function() { postComment(survey.id); }}
                disabled={!inputText.trim() || posting === survey.id}
                style={{ padding: '9px 18px', background: inputText.trim() ? C.navy : 'rgba(11,37,69,0.06)', color: inputText.trim() ? '#fff' : 'rgba(11,37,69,0.2)', border: 'none', borderRadius: 22, fontSize: 12, fontWeight: 700, cursor: inputText.trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}>
                {posting === survey.id ? '...' : 'Post'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export default function CitizenDashboard() {
  var navigate = useNavigate();
  var { user, profile } = useAuth();
  var [stats, setStats] = useState({ matched: 0, available: 0, completed: 0, trust: 0 });
  var [recentSurveys, setRecentSurveys] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!user) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('status', 'active'),
      supabase.from('responses').select('survey_id').eq('user_id', user.id),
    ]).then(function(results) {
      var allSurveys = results[0].data || [];
      var doneIds = (results[1].data || []).map(function(r) { return r.survey_id; });
      var matched = allSurveys.filter(function(s) { return matchesSurvey(s, profile); });
      var avail = matched.filter(function(s) { return doneIds.indexOf(s.id) === -1; });
      setStats({ matched: matched.length, available: avail.length, completed: doneIds.length, trust: (profile && profile.trust_score) || 0 });
      setRecentSurveys(avail.slice(0, 4));
      setLoading(false);
    });
  }, [user, profile]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}'}</style>
    </div>
  );

  var name = profile ? (profile.full_name || '').split(' ')[0] : '';
  var fields = profile ? [profile.full_name, profile.phone, profile.state, profile.city, profile.zip, profile.race, profile.sex, profile.date_of_birth, profile.education, profile.employment, profile.income, profile.party, profile.housing] : [];
  var completeness = fields.length ? Math.round((fields.filter(Boolean).length / fields.length) * 100) : 0;
  var trust = (profile && profile.trust_score) || 0;
  var tier = trust <= 2 ? 'New' : trust <= 10 ? 'Active' : trust <= 25 ? 'Trusted' : 'Champion';
  var tierColor = trust <= 2 ? 'rgba(11,37,69,0.35)' : trust <= 10 ? C.gold : trust <= 25 ? C.green : C.purple;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 980 }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}'}</style>

      <h1 style={{ fontSize: 27, fontWeight: 700, color: C.navy, margin: '0 0 3px', fontFamily: font }}>Welcome back{name ? ', ' + name : ''}</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Your civic voice matters.</p>

      {/* Verify banner */}
      {profile && !profile.identity_verified && (
        <div style={{ background: 'linear-gradient(135deg,' + C.gold + '12,' + C.gold + '06)', border: '1px solid ' + C.gold + '30', borderRadius: 13, padding: '18px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 3px', fontFamily: font }}>Verify your identity to take surveys</p>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Quick ID check — takes less than 2 minutes</p>
          </div>
          <button onClick={function() { navigate('/citizen/verify'); }} style={{ padding: '10px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(197,150,12,0.3)', flexShrink: 0 }}>Verify Now &#8594;</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Surveys Matched', val: stats.matched,   color: C.navy,   bg: 'rgba(11,37,69,0.04)',   icon: '\uD83D\uDCCB' },
          { label: 'Available Now',   val: stats.available, color: C.gold,   bg: 'rgba(197,150,12,0.06)', icon: '\uD83D\uDCE9' },
          { label: 'Completed',       val: stats.completed, color: C.green,  bg: 'rgba(26,122,60,0.06)',  icon: '\u2713' },
          { label: tier,              val: trust,           color: tierColor, bg: 'rgba(109,40,217,0.05)', icon: '\u2605' },
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background: s.bg, borderRadius: 13, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: 0, fontFamily: font, lineHeight: 1 }}>{s.val}</p>
            </div>
          );
        })}
      </div>

      {/* Two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* LEFT — Poll Discussions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Poll Discussions</h2>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '12', padding: '3px 10px', borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />Live
            </span>
            <button onClick={function() { navigate('/citizen/discussion'); }} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>Full Board &#8594;</button>
          </div>
          <PollDiscussionFeed navigate={navigate} currentUser={user} currentProfile={profile} />
        </div>

        {/* RIGHT — Sidebar */}
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Surveys for you */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.07)', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>Surveys For You</h3>
              <button onClick={function() { navigate('/citizen/surveys'); }} style={{ fontSize: 12, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>All &#8594;</button>
            </div>
            {recentSurveys.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', margin: '0 0 10px' }}>No new surveys right now</p>
                  <button onClick={function() { navigate('/citizen/surveys'); }} style={{ padding: '7px 16px', background: 'rgba(11,37,69,0.05)', color: C.navy, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Browse All</button>
                </div>
              )
              : recentSurveys.map(function(s, i) {
                  var qc = s.questions ? s.questions.length : 0;
                  return (
                    <div key={s.id} style={{ padding: '11px 0', borderTop: i > 0 ? '1px solid rgba(11,37,69,0.05)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                        <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)' }}>{qc} question{qc !== 1 ? 's' : ''}</span>
                      </div>
                      <button onClick={function() { navigate('/citizen/surveys/' + s.id); }}
                        style={{ padding: '5px 13px', background: C.gold, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(197,150,12,0.25)' }}>Take</button>
                    </div>
                  );
                })
            }
          </div>

          {/* Profile completeness */}
          {completeness < 100 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.07)', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Profile</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>{completeness}%</span>
              </div>
              <div style={{ height: 7, background: 'rgba(11,37,69,0.06)', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,' + C.gold + ',#E8A838)', borderRadius: 4, width: completeness + '%', transition: 'width 0.5s' }} />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '0 0 10px', lineHeight: 1.5 }}>Complete your profile to match more surveys</p>
              <button onClick={function() { navigate('/citizen/account'); }} style={{ width: '100%', padding: '8px', background: 'rgba(11,37,69,0.05)', color: C.navy, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Complete Profile &#8594;</button>
            </div>
          )}

          {/* Account status */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.07)', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(11,37,69,0.4)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Account Status</h3>
            {[
              { ok: !!(profile && profile.is_verified),       label: 'Email Verified' },
              { ok: !!(profile && profile.identity_verified), label: 'ID Verified' },
            ].map(function(v, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: v.ok ? C.green + '08' : 'rgba(11,37,69,0.03)', marginBottom: i === 0 ? 8 : 0 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: v.ok ? C.green : 'rgba(11,37,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {v.ok
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="rgba(11,37,69,0.25)" strokeWidth="1.5"/></svg>
                    }
                  </span>
                  <span style={{ fontSize: 13, fontWeight: v.ok ? 600 : 400, color: v.ok ? C.green : 'rgba(11,37,69,0.4)', flex: 1 }}>{v.label}</span>
                  {!v.ok && i === 1 && (
                    <button onClick={function() { navigate('/citizen/verify'); }} style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Verify &#8594;</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
