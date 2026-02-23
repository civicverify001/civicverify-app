// src/pages/citizen/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

function calcAge(dob) { if (!dob) return null; return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000); }

function timeAgo(iso) {
  var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function matchesSurvey(s, p) {
  if (s.target_state && p.state !== s.target_state) return false;
  if (s.target_county && p.county !== s.target_county) return false;
  if (s.target_city && p.city && p.city.toLowerCase() !== s.target_city.toLowerCase()) return false;
  if (s.target_zip && p.zip !== s.target_zip) return false;
  if (s.target_race && p.race !== s.target_race) return false;
  if (s.target_sex && p.sex !== s.target_sex) return false;
  if (s.target_education && p.education !== s.target_education) return false;
  if (s.target_employment && p.employment !== s.target_employment) return false;
  if (s.target_income && p.income !== s.target_income) return false;
  if (s.target_marital && p.marital_status !== s.target_marital) return false;
  if (s.target_party && p.party !== s.target_party) return false;
  if (s.target_housing && p.housing !== s.target_housing) return false;
  if (s.target_voter_registered === 'Yes' && !p.voter_registered) return false;
  if (s.target_voter_registered === 'No' && p.voter_registered) return false;
  if (s.target_veteran === 'Yes' && !p.veteran) return false;
  if (s.target_veteran === 'No' && p.veteran) return false;
  var age = calcAge(p.date_of_birth);
  if (age !== null) { if (s.target_age_min && age < s.target_age_min) return false; if (s.target_age_max && age > s.target_age_max) return false; }
  return true;
}

export default function CitizenDashboard() {
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;
  var user = auth.user;
  var [stats, setStats] = useState({ matched: 0, available: 0, completed: 0, trust: 0 });
  var [recentSurveys, setRecentSurveys] = useState([]);
  var [recentDiscussions, setRecentDiscussions] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!user || !profile) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('status', 'active'),
      supabase.from('responses').select('survey_id').eq('user_id', user.id),
      supabase.from('discussion_topics').select('*, comment_count:discussion_comments(count)').order('created_at', { ascending: false }).limit(4),
    ]).then(function(results) {
      var allSurveys = results[0].data || [];
      var doneIds = (results[1].data || []).map(function(r) { return r.survey_id; });
      var discussions = results[2].data || [];
      var matched = allSurveys.filter(function(s) { return matchesSurvey(s, profile); });
      var avail = matched.filter(function(s) { return doneIds.indexOf(s.id) === -1; });
      setStats({ matched: matched.length, available: avail.length, completed: doneIds.length, trust: profile.trust_score || 0 });
      setRecentSurveys(avail.slice(0, 3));
      setRecentDiscussions(discussions);
      setLoading(false);
    });
  }, [user, profile]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  var name = profile ? (profile.full_name || '').split(' ')[0] : '';

  var fields = [profile.full_name, profile.phone, profile.state, profile.city, profile.zip, profile.race, profile.sex, profile.date_of_birth, profile.education, profile.employment, profile.income, profile.party, profile.housing];
  var filled = fields.filter(Boolean).length;
  var completeness = Math.round((filled / fields.length) * 100);

  var trust = profile.trust_score || 0;
  var tier = trust <= 2 ? 'New' : trust <= 10 ? 'Active' : trust <= 25 ? 'Trusted' : 'Champion';
  var tierColor = trust <= 2 ? 'rgba(11,37,69,0.3)' : trust <= 10 ? C.gold : trust <= 25 ? C.green : '#8b5cf6';

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Welcome back{name ? ', ' + name : ''}</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Your civic voice matters. Here's your overview.</p>

      {/* Verify Banner */}
      {profile && !profile.identity_verified && (
        <div style={{ background: 'linear-gradient(135deg, ' + C.gold + '10, ' + C.gold + '05)', border: '1px solid ' + C.gold + '25', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Verify your identity to take surveys</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Quick ID verification required — takes less than 2 minutes</p>
          </div>
          <button onClick={function(){navigate('/citizen/verify');}} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Verify Now &#8594;</button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '&#128203;', label: 'SURVEYS MATCHED', val: stats.matched, color: C.navy },
          { icon: '&#128233;', label: 'AVAILABLE NOW',   val: stats.available, color: C.gold },
          { icon: '&#10003;', label: 'COMPLETED',        val: stats.completed, color: C.green },
          { icon: '&#128737;', label: 'TRUST SCORE',     val: trust, color: tierColor, sub: tier },
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }} dangerouslySetInnerHTML={{ __html: s.icon }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.25)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, color: s.color, margin: 0, fontFamily: font }}>{s.val}</p>
              {s.sub && <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.sub}</span>}
            </div>
          );
        })}
      </div>

      {/* Two-column grid for surveys + discussion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Available Surveys */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid rgba(11,37,69,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Surveys For You</h2>
            <button onClick={function(){navigate('/citizen/surveys');}} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>View All &#8594;</button>
          </div>
          {recentSurveys.length === 0
            ? <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: 0, textAlign: 'center', padding: '24px 0' }}>No surveys available right now</p>
            : recentSurveys.map(function(s, i) {
                var qCount = s.questions ? s.questions.length : 0;
                return (
                  <div key={s.id} onClick={function(){navigate('/citizen/surveys/' + s.id);}} style={{ padding: '14px 0', borderTop: i > 0 ? '1px solid rgba(11,37,69,0.04)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                      <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{qCount} question{qCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ padding: '5px 12px', background: C.gold, color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Take</span>
                  </div>
                );
              })
          }
        </div>

        {/* Recent Discussions */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid rgba(11,37,69,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Recent Discussions</h2>
            <button onClick={function(){navigate('/citizen/discussion');}} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>View All &#8594;</button>
          </div>
          {recentDiscussions.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: '0 0 12px' }}>No discussions yet</p>
                <button onClick={function(){navigate('/citizen/discussion');}} style={{ padding: '8px 18px', background: C.navy, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Start one &#8594;</button>
              </div>
            )
            : recentDiscussions.map(function(t, i) {
                var count = Array.isArray(t.comment_count) ? (t.comment_count[0]?.count || 0) : (t.comment_count || 0);
                return (
                  <div key={t.id} onClick={function(){navigate('/citizen/discussion');}} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(11,37,69,0.04)' : 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)' }}>&#128172; {count}</span>
                          <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)' }}>{timeAgo(t.created_at)}</span>
                          {t.category && <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>{t.category}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* Profile completeness */}
      {completeness < 100 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Profile Completeness</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{completeness}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(11,37,69,0.04)', borderRadius: 4, marginBottom: 10 }}>
            <div style={{ height: '100%', background: C.gold, borderRadius: 4, width: completeness + '%', transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Complete your profile to get matched with more surveys</p>
            <button onClick={function(){navigate('/citizen/account');}} style={{ padding: '8px 16px', background: 'rgba(11,37,69,0.05)', color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>Complete &#8594;</button>
          </div>
        </div>
      )}

      {/* Verification status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { icon: profile && profile.is_verified ? '&#10003;' : '&#9203;', label: profile && profile.is_verified ? 'Email Verified' : 'Email Pending', ok: !!(profile && profile.is_verified) },
          { icon: profile && profile.identity_verified ? '&#10003;' : '&#9203;', label: profile && profile.identity_verified ? 'ID Verified' : 'ID Not Verified', ok: !!(profile && profile.identity_verified) },
        ].map(function(v, i) {
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
              <span style={{ fontSize: 26, display: 'block', marginBottom: 6, color: v.ok ? C.green : 'rgba(11,37,69,0.2)' }} dangerouslySetInnerHTML={{ __html: v.icon }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: v.ok ? C.green : 'rgba(11,37,69,0.3)', margin: 0 }}>{v.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
