// src/pages/citizen/Dashboard.jsx — Shows matched surveys, profile completion, stats
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

function calcAge(dob) { if (!dob) return null; return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000); }

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
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!user || !profile) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('status', 'active'),
      supabase.from('responses').select('survey_id').eq('user_id', user.id)
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;

  var name = profile ? (profile.full_name || '').split(' ')[0] : '';

  // Profile completeness
  var fields = [profile.full_name, profile.phone, profile.state, profile.city, profile.zip, profile.race, profile.sex, profile.date_of_birth, profile.education, profile.employment, profile.income, profile.party, profile.housing];
  var filled = fields.filter(Boolean).length;
  var completeness = Math.round((filled / fields.length) * 100);

  // Trust tier
  var trust = profile.trust_score || 0;
  var tier = trust <= 2 ? 'New' : trust <= 10 ? 'Active' : trust <= 25 ? 'Trusted' : 'Champion';
  var tierColor = trust <= 2 ? 'rgba(11,37,69,0.3)' : trust <= 10 ? C.gold : trust <= 25 ? C.green : '#8b5cf6';

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Welcome back, {name}</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Your civic voice matters. Here's your overview.</p>

      {/* Verify Banner */}
      {profile && !profile.identity_verified && (
        <div style={{ background: 'linear-gradient(135deg, ' + C.gold + '10 0%, ' + C.gold + '05 100%)', border: '1px solid ' + C.gold + '25', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Verify your identity to take surveys</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Quick ID verification required — takes less than 2 minutes</p>
          </div>
          <button onClick={function(){navigate('/citizen/verify')}} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Verify Now {'\u2192'}</button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '\uD83D\uDCCB', label: 'SURVEYS MATCHED', val: stats.matched, color: C.navy },
          { icon: '\uD83D\uDCE9', label: 'AVAILABLE NOW', val: stats.available, color: C.gold },
          { icon: '\u2705', label: 'COMPLETED', val: stats.completed, color: C.green },
          { icon: '\uD83D\uDEE1\uFE0F', label: 'TRUST SCORE', val: trust, color: tierColor, sub: tier }
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid rgba(11,37,69,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.25)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, color: s.color, margin: '0', fontFamily: font }}>{s.val}</p>
              {s.sub && <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.sub}</span>}
            </div>
          );
        })}
      </div>

      {/* Profile Completeness */}
      {completeness < 100 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>Profile Completeness</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{completeness}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(11,37,69,0.04)', borderRadius: 4, marginBottom: 10 }}>
            <div style={{ height: '100%', background: C.gold, borderRadius: 4, width: completeness + '%', transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', margin: '0 0 10px' }}>Complete your demographics to get matched with more targeted surveys</p>
          <button onClick={function(){navigate('/citizen/account')}} style={{ padding: '8px 16px', background: 'rgba(11,37,69,0.05)', color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Complete Profile {'\u2192'}</button>
        </div>
      )}

      {/* Verification Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
          <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{profile && profile.is_verified ? '\u2705' : '\u23F3'}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: profile && profile.is_verified ? C.green : 'rgba(11,37,69,0.3)', margin: 0 }}>{profile && profile.is_verified ? 'Email Verified' : 'Email Pending'}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
          <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{profile && profile.identity_verified ? '\u2705' : '\u23F3'}</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: profile && profile.identity_verified ? C.green : 'rgba(11,37,69,0.3)', margin: 0 }}>{profile && profile.identity_verified ? 'ID Verified' : 'ID Not Verified'}</p>
        </div>
      </div>

      {/* Available Surveys Preview */}
      {recentSurveys.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0 }}>{'\uD83D\uDCE9'} Surveys For You</h2>
            <button onClick={function(){navigate('/citizen/surveys')}} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>View All {'\u2192'}</button>
          </div>
          {recentSurveys.map(function(s, i) {
            var qCount = s.questions ? (Array.isArray(s.questions) ? s.questions.length : 0) : 0;
            var tags = [s.target_state, s.target_race, s.target_party].filter(Boolean);
            return (
              <div key={s.id} onClick={function(){navigate('/citizen/surveys/' + s.id)}} style={{ padding: '16px 0', borderTop: i > 0 ? '1px solid rgba(11,37,69,0.04)' : 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>{s.title}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{qCount} questions</span>
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{s.response_count || 0} responses</span>
                    {tags.map(function(t, j) { return <span key={j} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(11,37,69,0.25)', background: 'rgba(11,37,69,0.03)', padding: '2px 6px', borderRadius: 4 }}>{t}</span>; })}
                  </div>
                </div>
                <span style={{ fontSize: 18, color: C.gold }}>{'\u2192'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
