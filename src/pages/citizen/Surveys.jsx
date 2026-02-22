// src/pages/citizen/Surveys.jsx — Shows only surveys matching citizen's demographics
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

function calcAge(dob) {
  if (!dob) return null;
  var d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / 31557600000);
}

function matchesSurvey(survey, profile) {
  // Each targeting field: if survey has it set, citizen must match. If null/empty, means "all"
  if (survey.target_state && profile.state !== survey.target_state) return false;
  if (survey.target_county && profile.county !== survey.target_county) return false;
  if (survey.target_city && profile.city && profile.city.toLowerCase() !== survey.target_city.toLowerCase()) return false;
  if (survey.target_zip && profile.zip !== survey.target_zip) return false;
  if (survey.target_race && profile.race !== survey.target_race) return false;
  if (survey.target_sex && profile.sex !== survey.target_sex) return false;
  if (survey.target_education && profile.education !== survey.target_education) return false;
  if (survey.target_employment && profile.employment !== survey.target_employment) return false;
  if (survey.target_income && profile.income !== survey.target_income) return false;
  if (survey.target_marital && profile.marital_status !== survey.target_marital) return false;
  if (survey.target_party && profile.party !== survey.target_party) return false;
  if (survey.target_housing && profile.housing !== survey.target_housing) return false;
  if (survey.target_voter_registered === 'Yes' && !profile.voter_registered) return false;
  if (survey.target_voter_registered === 'No' && profile.voter_registered) return false;
  if (survey.target_veteran === 'Yes' && !profile.veteran) return false;
  if (survey.target_veteran === 'No' && profile.veteran) return false;
  // Age matching
  var age = calcAge(profile.date_of_birth);
  if (age !== null) {
    if (survey.target_age_min && age < survey.target_age_min) return false;
    if (survey.target_age_max && age > survey.target_age_max) return false;
  }
  return true;
}

export default function CitizenSurveys() {
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;
  var user = auth.user;
  var [surveys, setSurveys] = useState([]);
  var [completed, setCompleted] = useState([]);
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('available');

  useEffect(function() {
    if (!user || !profile) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('responses').select('survey_id').eq('user_id', user.id)
    ]).then(function(results) {
      var allSurveys = results[0].data || [];
      var doneIds = (results[1].data || []).map(function(r) { return r.survey_id; });
      setCompleted(doneIds);
      // Filter surveys that match this citizen's demographics
      var matched = allSurveys.filter(function(s) { return matchesSurvey(s, profile); });
      setSurveys(matched);
      setLoading(false);
    });
  }, [user, profile]);

  var available = surveys.filter(function(s) { return completed.indexOf(s.id) === -1; });
  var done = surveys.filter(function(s) { return completed.indexOf(s.id) !== -1; });
  var shown = tab === 'available' ? available : tab === 'completed' ? done : surveys;

  // Check profile completeness for matching
  var missingFields = [];
  if (!profile) { /* loading */ }
  else {
    if (!profile.state) missingFields.push('State');
    if (!profile.race) missingFields.push('Race');
    if (!profile.sex) missingFields.push('Sex');
    if (!profile.date_of_birth) missingFields.push('Date of Birth');
    if (!profile.education) missingFields.push('Education');
    if (!profile.employment) missingFields.push('Employment');
    if (!profile.income) missingFields.push('Income');
    if (!profile.party) missingFields.push('Party');
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Available Surveys</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Polls matched to your profile and location</p>

      {/* Profile completeness warning */}
      {missingFields.length > 0 && (
        <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{'\u26A0\uFE0F'}</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>Complete your profile for more surveys</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>
              You're missing: <strong>{missingFields.join(', ')}</strong>. Surveys targeting these demographics won't appear for you.
            </p>
            <button onClick={function(){navigate('/citizen/account')}} style={{ padding: '8px 16px', background: C.gold, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Complete Profile {'\u2192'}</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(11,37,69,0.03)', borderRadius: 10, padding: 4 }}>
        {[{ k: 'available', l: 'Available (' + available.length + ')' }, { k: 'completed', l: 'Completed (' + done.length + ')' }, { k: 'all', l: 'All (' + surveys.length + ')' }].map(function(t) {
          return <button key={t.k} onClick={function(){setTab(t.k)}} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === t.k ? '#fff' : 'transparent', color: tab === t.k ? C.navy : 'rgba(11,37,69,0.35)', boxShadow: tab === t.k ? '0 1px 4px rgba(0,0,0,0.06)' : 'none' }}>{t.l}</button>;
        })}
      </div>

      {/* Survey Cards */}
      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{tab === 'completed' ? '\uD83C\uDFC6' : '\uD83D\uDCED'}</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, margin: '0 0 8px' }}>{tab === 'completed' ? 'No surveys completed yet' : 'No surveys available'}</p>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{tab === 'completed' ? 'Take your first survey to make your voice heard!' : 'New polls matching your profile will appear here'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {shown.map(function(s) {
            var isDone = completed.indexOf(s.id) !== -1;
            var progress = s.target_responses ? Math.min(100, Math.round(((s.response_count || 0) / s.target_responses) * 100)) : null;
            var qCount = s.questions ? (Array.isArray(s.questions) ? s.questions.length : 0) : 0;

            // Build targeting tags
            var tags = [s.target_state, s.target_race, s.target_sex, s.target_education, s.target_party, s.target_age_min ? 'Age ' + s.target_age_min + '+' : null].filter(Boolean);

            return (
              <div key={s.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', opacity: isDone ? 0.7 : 1 }}>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>{s.title}</h3>
                      {s.description && <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 8px', lineHeight: 1.5 }}>{s.description}</p>}
                    </div>
                    {isDone && <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '10', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{'\u2713'} Completed</span>}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {tags.map(function(t, i) { return <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(11,37,69,0.35)', background: 'rgba(11,37,69,0.03)', padding: '3px 8px', borderRadius: 6 }}>{t}</span>; })}
                    </div>
                  )}

                  {/* Stats row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: progress !== null ? 12 : 0 }}>
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{'\uD83D\uDCCB'} {qCount} question{qCount !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{'\uD83D\uDC65'} {s.response_count || 0} responses</span>
                    {s.target_responses && <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)' }}>{'\uD83C\uDFAF'} {s.target_responses} target</span>}
                  </div>

                  {/* Progress bar */}
                  {progress !== null && (
                    <div style={{ marginBottom: 0 }}>
                      <div style={{ width: '100%', height: 4, background: 'rgba(11,37,69,0.04)', borderRadius: 2 }}>
                        <div style={{ height: '100%', background: progress >= 100 ? C.green : C.gold, borderRadius: 2, width: progress + '%', transition: 'width 0.5s' }} />
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0' }}>{progress}% complete</p>
                    </div>
                  )}
                </div>

                {/* Action */}
                {!isDone && (
                  <div style={{ padding: '12px 24px 20px' }}>
                    <button onClick={function(){navigate('/citizen/surveys/' + s.id)}} style={{ width: '100%', padding: 12, background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Take Survey {'\u2192'}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
