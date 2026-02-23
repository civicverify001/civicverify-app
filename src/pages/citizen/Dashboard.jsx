// src/pages/citizen/Dashboard.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A', purple: '#7C3AED' };
var font = 'Libre Baskerville, Georgia, serif';

function calcAge(dob) { if (!dob) return null; return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000); }

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function Avatar({ name, size = 30 }) {
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  var cols = [C.navy, C.gold, C.green, C.purple, '#0891b2', '#b45309'];
  var col = cols[(initials.charCodeAt(0) || 0) % cols.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: col + '18', border: '2px solid ' + col + '35', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.35, fontWeight: 700, color: col }}>
      {initials}
    </div>
  );
}

function matchesSurvey(s, p) {
  if (s.target_state && p.state !== s.target_state) return false;
  if (s.target_race && p.race !== s.target_race) return false;
  if (s.target_sex && p.sex !== s.target_sex) return false;
  if (s.target_education && p.education !== s.target_education) return false;
  if (s.target_employment && p.employment !== s.target_employment) return false;
  if (s.target_income && p.income !== s.target_income) return false;
  if (s.target_party && p.party !== s.target_party) return false;
  if (s.target_housing && p.housing !== s.target_housing) return false;
  if (s.target_voter_registered === 'Yes' && !p.voter_registered) return false;
  if (s.target_voter_registered === 'No' && p.voter_registered) return false;
  if (s.target_veteran === 'Yes' && !p.veteran) return false;
  if (s.target_veteran === 'No' && p.veteran) return false;
  var age = calcAge(p.date_of_birth);
  if (age !== null) {
    if (s.target_age_min && age < s.target_age_min) return false;
    if (s.target_age_max && age > s.target_age_max) return false;
  }
  return true;
}

// ── Live Poll Discussion Feed ─────────────────────────────────────────────

function PollDiscussionFeed({ navigate }) {
  var { user, profile } = useAuth();
  var [feed, setFeed] = useState([]);
  var [loading, setLoading] = useState(true);
  var [newComment, setNewComment] = useState({});   // { [surveyId]: text }
  var [expanded, setExpanded] = useState({});        // { [surveyId]: bool }
  var [posting, setPosting] = useState(null);
  var [pulse, setPulse] = useState(false);
  var intervalRef = useRef(null);

  useEffect(function() {
    loadFeed();
    // Poll for new comments every 15s to simulate live feel
    intervalRef.current = setInterval(function() {
      loadFeed(true);
    }, 15000);
    return function() { clearInterval(intervalRef.current); };
  }, []);

  async function loadFeed(silent) {
    if (!silent) setLoading(true);

    // Get all surveys (active + closed/completed) that have discussions
    var surveysRes = await supabase
      .from('surveys')
      .select('id, title, status, response_count, target_responses')
      .in('status', ['active', 'completed', 'closed'])
      .order('created_at', { ascending: false })
      .limit(20);

    var surveys = surveysRes.data || [];
    if (!surveys.length) { setLoading(false); return; }

    var surveyIds = surveys.map(function(s) { return s.id; });

    // Get recent comments on these surveys
    var commentsRes = await supabase
      .from('discussion_comments')
      .select('*')
      .in('survey_id', surveyIds)
      .order('created_at', { ascending: false })
      .limit(60);

    var allComments = commentsRes.data || [];

    // Group comments by survey
    var surveyMap = {};
    surveys.forEach(function(s) { surveyMap[s.id] = { survey: s, comments: [] }; });
    allComments.forEach(function(c) { if (surveyMap[c.survey_id]) surveyMap[c.survey_id].comments.push(c); });

    // Only include surveys that have at least 1 comment, sorted by most recent activity
    var result = Object.values(surveyMap)
      .filter(function(x) { return x.comments.length > 0; })
      .sort(function(a, b) {
        var aLatest = a.comments[0]?.created_at || '';
        var bLatest = b.comments[0]?.created_at || '';
        return bLatest > aLatest ? 1 : -1;
      });

    if (!silent) setLoading(false);
    else if (result.length !== feed.length) setPulse(true);
    setFeed(result);
  }

  async function postComment(surveyId) {
    var text = (newComment[surveyId] || '').trim();
    if (!text || !user) return;
    setPosting(surveyId);
    await supabase.from('discussion_comments').insert({
      survey_id: surveyId,
      user_id: user.id,
      author_name: profile ? (profile.full_name || 'Citizen') : 'Citizen',
      verified: !!(profile && profile.identity_verified),
      content: text,
      likes: [],
      parent_id: null,
    });
    setNewComment(function(p) { return Object.assign({}, p, { [surveyId]: '' }); });
    setPosting(null);
    loadFeed(true);
  }

  async function toggleLike(comment) {
    if (!user) return;
    var likes = comment.likes || [];
    var liked = likes.includes(user.id);
    var updated = liked ? likes.filter(function(id) { return id !== user.id; }) : likes.concat([user.id]);
    await supabase.from('discussion_comments').update({ likes: updated }).eq('id', comment.id);
    loadFeed(true);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 28, height: 28, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!feed.length) return (
    <div style={{ textAlign: 'center', padding: '32px 20px' }}>
      <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>&#128172;</span>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 16px' }}>No poll discussions yet. Be the first!</p>
      <button onClick={function() { navigate('/citizen/surveys'); }} style={{ padding: '8px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Browse Polls &#8594;</button>
    </div>
  );

  return (
    <div>
      {pulse && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, color: C.green, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 1s ease-in-out' }} />
          New activity
        </div>
      )}

      {feed.map(function(item) {
        var survey = item.survey;
        var comments = item.comments;
        var isExpanded = expanded[survey.id];
        var shown = isExpanded ? comments : comments.slice(0, 2);
        var isActive = survey.status === 'active';
        var inputText = newComment[survey.id] || '';

        return (
          <div key={survey.id} style={{ marginBottom: 20, background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>

            {/* Survey header */}
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(11,37,69,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isActive ? C.green + '12' : 'rgba(11,37,69,0.05)', color: isActive ? C.green : 'rgba(11,37,69,0.3)' }}>
                    {isActive ? '● LIVE' : '✓ ENDED'}
                  </span>
                  {!isActive && <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.25)' }}>Discussion still open</span>}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: font }}>{survey.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {isActive && (
                  <button onClick={function() { navigate('/citizen/surveys/' + survey.id); }} style={{ padding: '5px 12px', background: C.gold, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Take Poll
                  </button>
                )}
                <button onClick={function() { navigate('/citizen/discussion?survey=' + survey.id); }} style={{ padding: '5px 12px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  View All
                </button>
              </div>
            </div>

            {/* Comments */}
            <div style={{ padding: '12px 20px 0' }}>
              {shown.map(function(c, ci) {
                var liked = user && (c.likes || []).includes(user.id);
                var isOwn = user && c.user_id === user.id;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <Avatar name={c.author_name} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ background: 'rgba(11,37,69,0.025)', borderRadius: 10, padding: '10px 14px', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{c.author_name || 'Citizen'}</span>
                          {c.verified && <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.green + '12', padding: '1px 5px', borderRadius: 4 }}>✓ Verified</span>}
                          {isOwn && <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.2)' }}>you</span>}
                          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.22)', marginLeft: 'auto' }}>{timeAgo(c.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.7)', margin: 0, lineHeight: 1.55, wordBreak: 'break-word' }}>{c.content}</p>
                      </div>
                      <button onClick={function() { toggleLike(c); }} style={{ fontSize: 11, fontWeight: 600, color: liked ? C.gold : 'rgba(11,37,69,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                        {liked ? '♥' : '♡'} {(c.likes || []).length || ''}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Show more/less */}
              {comments.length > 2 && (
                <button onClick={function() { setExpanded(function(p) { return Object.assign({}, p, { [survey.id]: !isExpanded }); }); }}
                  style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', display: 'block' }}>
                  {isExpanded ? 'Show less ↑' : 'Show ' + (comments.length - 2) + ' more comments ↓'}
                </button>
              )}
            </div>

            {/* Quick comment box */}
            <div style={{ padding: '10px 20px 16px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Avatar name={profile ? profile.full_name : 'You'} size={28} />
              <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                <input
                  value={inputText}
                  onChange={function(e) { setNewComment(function(p) { return Object.assign({}, p, { [survey.id]: e.target.value }); }); }}
                  onKeyDown={function(e) { if (e.key === 'Enter') postComment(survey.id); }}
                  placeholder="Comment on this poll..."
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 20, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={function(e) { e.target.style.borderColor = C.gold; }}
                  onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.08)'; }}
                />
                <button
                  onClick={function() { postComment(survey.id); }}
                  disabled={!inputText.trim() || posting === survey.id}
                  style={{ padding: '8px 16px', background: inputText.trim() ? C.navy : 'rgba(11,37,69,0.06)', color: inputText.trim() ? '#fff' : 'rgba(11,37,69,0.2)', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: inputText.trim() ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0 }}>
                  {posting === survey.id ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────

export default function CitizenDashboard() {
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;
  var user = auth.user;
  var [stats, setStats] = useState({ matched: 0, available: 0, completed: 0, trust: 0 });
  var [recentSurveys, setRecentSurveys] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!user || !profile) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('status', 'active'),
      supabase.from('responses').select('survey_id').eq('user_id', user.id),
    ]).then(function(results) {
      var allSurveys = results[0].data || [];
      var doneIds = (results[1].data || []).map(function(r) { return r.survey_id; });
      var matched = allSurveys.filter(function(s) { return matchesSurvey(s, profile); });
      var avail = matched.filter(function(s) { return doneIds.indexOf(s.id) === -1; });
      setStats({ matched: matched.length, available: avail.length, completed: doneIds.length, trust: profile.trust_score || 0 });
      setRecentSurveys(avail.slice(0, 3));
      setLoading(false);
    });
  }, [user, profile]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  );

  var name = profile ? (profile.full_name || '').split(' ')[0] : '';
  var fields = [profile.full_name, profile.phone, profile.state, profile.city, profile.zip, profile.race, profile.sex, profile.date_of_birth, profile.education, profile.employment, profile.income, profile.party, profile.housing];
  var completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  var trust = profile.trust_score || 0;
  var tier = trust <= 2 ? 'New' : trust <= 10 ? 'Active' : trust <= 25 ? 'Trusted' : 'Champion';
  var tierColor = trust <= 2 ? 'rgba(11,37,69,0.3)' : trust <= 10 ? C.gold : trust <= 25 ? C.green : C.purple;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 960 }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Welcome back{name ? ', ' + name : ''}</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Your civic voice matters.</p>

      {/* Verify banner */}
      {profile && !profile.identity_verified && (
        <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '22', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 2px' }}>Verify your identity to take surveys</p>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Takes less than 2 minutes</p>
          </div>
          <button onClick={function() { navigate('/citizen/verify'); }} style={{ padding: '9px 18px', background: C.gold, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Verify Now &#8594;</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Matched', val: stats.matched, color: C.navy, icon: '&#128203;' },
          { label: 'Available', val: stats.available, color: C.gold, icon: '&#128233;' },
          { label: 'Completed', val: stats.completed, color: C.green, icon: '&#10003;' },
          { label: tier, val: trust, color: tierColor, icon: '&#11088;' },
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(11,37,69,0.06)' }}>
              <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', display: 'block', marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: s.icon + ' ' + s.label }} />
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: 0, fontFamily: font }}>{s.val}</p>
            </div>
          );
        })}
      </div>

      {/* Main two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Poll Discussion Feed — main focus */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Poll Discussions</h2>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '10', padding: '3px 10px', borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live
            </span>
            <button onClick={function() { navigate('/citizen/discussion'); }} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>Full Discussion Board &#8594;</button>
          </div>
          <PollDiscussionFeed navigate={navigate} />
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Available surveys */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>Surveys For You</h3>
              <button onClick={function() { navigate('/citizen/surveys'); }} style={{ fontSize: 11, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>All &#8594;</button>
            </div>
            {recentSurveys.length === 0
              ? <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: 0, textAlign: 'center', padding: '16px 0' }}>No surveys right now</p>
              : recentSurveys.map(function(s, i) {
                  var qc = s.questions ? s.questions.length : 0;
                  return (
                    <div key={s.id} onClick={function() { navigate('/citizen/surveys/' + s.id); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(11,37,69,0.04)' : 'none', cursor: 'pointer', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                        <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)' }}>{qc} question{qc !== 1 ? 's' : ''}</span>
                      </div>
                      <span style={{ padding: '4px 10px', background: C.gold, color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Take</span>
                    </div>
                  );
                })
            }
          </div>

          {/* Profile completeness */}
          {completeness < 100 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Profile</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{completeness}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(11,37,69,0.05)', borderRadius: 3, marginBottom: 10 }}>
                <div style={{ height: '100%', background: C.gold, borderRadius: 3, width: completeness + '%', transition: 'width 0.5s' }} />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: '0 0 10px' }}>Complete profile = more matched surveys</p>
              <button onClick={function() { navigate('/citizen/account'); }} style={{ width: '100%', padding: '8px', background: 'rgba(11,37,69,0.04)', color: C.navy, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Complete &#8594;</button>
            </div>
          )}

          {/* Verification badges */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(11,37,69,0.06)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 12px' }}>Account Status</h3>
            {[
              { ok: !!(profile && profile.is_verified), label: 'Email Verified' },
              { ok: !!(profile && profile.identity_verified), label: 'ID Verified' },
            ].map(function(v, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i === 0 ? 8 : 0 }}>
                  <span style={{ fontSize: 16, color: v.ok ? C.green : 'rgba(11,37,69,0.15)' }}>{v.ok ? '&#10003;' : '&#9711;'}</span>
                  <span style={{ fontSize: 13, color: v.ok ? C.green : 'rgba(11,37,69,0.3)', fontWeight: v.ok ? 600 : 400 }} dangerouslySetInnerHTML={{ __html: (v.ok ? '&#10003;' : '&#9711;') + ' ' + v.label }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
