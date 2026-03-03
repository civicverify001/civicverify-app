// src/pages/citizen/Surveys.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#C0392B', green: '#1A7A3C' };
var font = 'Libre Baskerville, Georgia, serif';

function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
}

function matchesSurvey(survey, profile) {
  // If survey has NO targeting filters at all, it matches everyone
  if (survey.target_state && profile.state && profile.state !== survey.target_state) return false;
  if (survey.target_county && profile.county && profile.county !== survey.target_county) return false;
  if (survey.target_city && profile.city && survey.target_city && profile.city.toLowerCase() !== survey.target_city.toLowerCase()) return false;
  if (survey.target_zip && profile.zip && profile.zip !== survey.target_zip) return false;
  if (survey.target_race && profile.race && profile.race !== survey.target_race) return false;
  if (survey.target_sex && profile.sex && profile.sex !== survey.target_sex) return false;
  if (survey.target_education && profile.education && profile.education !== survey.target_education) return false;
  if (survey.target_employment && profile.employment && profile.employment !== survey.target_employment) return false;
  if (survey.target_income && profile.income && profile.income !== survey.target_income) return false;
  if (survey.target_marital && profile.marital_status && profile.marital_status !== survey.target_marital) return false;
  if (survey.target_party && profile.party && profile.party !== survey.target_party) return false;
  if (survey.target_housing && profile.housing && profile.housing !== survey.target_housing) return false;
  if (survey.target_voter_registered === 'Yes' && profile.voter_registered === false) return false;
  if (survey.target_voter_registered === 'No' && profile.voter_registered === true) return false;
  if (survey.target_veteran === 'Yes' && profile.veteran === false) return false;
  if (survey.target_veteran === 'No' && profile.veteran === true) return false;
  var age = calcAge(profile.date_of_birth);
  if (age !== null) {
    if (survey.target_age_min && age < survey.target_age_min) return false;
    if (survey.target_age_max && age > survey.target_age_max) return false;
  }
  return true;
}

export default function CitizenSurveys() {
  var navigate = useNavigate();
  var { user, profile } = useAuth();
  var [allActive, setAllActive] = useState([]);   // every active survey
  var [completed, setCompleted] = useState([]);   // survey_ids user finished
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('available');

  useEffect(function() {
    if (!user) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('responses').select('survey_id').eq('user_id', user.id)
    ]).then(function(results) {
      setAllActive(results[0].data || []);
      setCompleted((results[1].data || []).map(function(r) { return r.survey_id; }));
      setLoading(false);
    });
  }, [user]);

  // Available = active surveys user hasn't done yet AND that match their demographics
  // If profile is incomplete we show all non-targeted surveys + targeted ones where they qualify
  var available = allActive.filter(function(s) {
    if (completed.indexOf(s.id) !== -1) return false;        // already done
    if (!profile) return true;                               // no profile yet, show all
    return matchesSurvey(s, profile);
  });

  var done = allActive.filter(function(s) { return completed.indexOf(s.id) !== -1; });

  // "All" shows every active survey regardless of match — citizen can see what exists
  var shown = tab === 'available' ? available : tab === 'completed' ? done : allActive;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Available Surveys</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Polls matched to your profile and location</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 24, background: 'rgba(11,37,69,0.04)', borderRadius: 11, padding: 4 }}>
        {[
          { k: 'available', l: 'Available', count: available.length },
          { k: 'completed', l: 'Completed', count: done.length },
          { k: 'all',       l: 'All',       count: allActive.length },
        ].map(function(t) {
          var active = tab === t.k;
          return (
            <button key={t.k} onClick={function() { setTab(t.k); }}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? C.navy : 'rgba(11,37,69,0.4)', boxShadow: active ? '0 1px 6px rgba(11,37,69,0.1)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {t.l}
              <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 10, background: active ? C.gold : 'rgba(11,37,69,0.08)', color: active ? '#fff' : 'rgba(11,37,69,0.4)' }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Empty states */}
      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.07)', boxShadow: '0 2px 12px rgba(11,37,69,0.04)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{tab === 'completed' ? '\uD83C\uDFC6' : '\uD83D\uDCEB'}</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>
            {tab === 'completed' ? 'No surveys completed yet' : tab === 'available' ? 'No surveys available right now' : 'No active surveys'}
          </p>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>
            {tab === 'completed' ? 'Take your first survey to make your voice heard!' : 'New polls will appear here when published'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {shown.map(function(s) {
            var isDone = completed.indexOf(s.id) !== -1;
            var isMatched = profile ? matchesSurvey(s, profile) : true;
            var qCount = Array.isArray(s.questions) ? s.questions.length : 0;
            var progress = s.target_responses ? Math.min(100, Math.round(((s.response_count || 0) / s.target_responses) * 100)) : null;
            var tags = [s.target_state, s.target_race, s.target_sex, s.target_party].filter(Boolean);

            return (
              <div key={s.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid ' + (isDone ? 'rgba(26,122,60,0.2)' : 'rgba(11,37,69,0.07)'), overflow: 'hidden', boxShadow: '0 2px 14px rgba(11,37,69,0.05)' }}>
                <div style={{ padding: '20px 24px' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font, lineHeight: 1.3 }}>{s.title}</h3>
                      {s.description && <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>{s.description}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      {isDone && <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '12', padding: '4px 10px', borderRadius: 20, border: '1px solid ' + C.green + '25' }}>&#10003; Completed</span>}
                      {!isDone && !isMatched && tab === 'all' && <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(11,37,69,0.35)', background: 'rgba(11,37,69,0.05)', padding: '3px 8px', borderRadius: 6 }}>Outside your filters</span>}
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {tags.map(function(t, i) { return <span key={i} style={{ fontSize: 10, fontWeight: 700, color: C.navy, background: 'rgba(11,37,69,0.05)', padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(11,37,69,0.06)' }}>{t}</span>; })}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', fontWeight: 500 }}>&#128203; {qCount} question{qCount !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', fontWeight: 500 }}>&#128101; {(s.response_count || 0).toLocaleString()} responses</span>
                    {s.target_responses && <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', fontWeight: 500 }}>&#127919; {s.target_responses.toLocaleString()} target</span>}
                  </div>

                  {progress !== null && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)' }}>Response progress</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: progress >= 100 ? C.green : C.gold }}>{progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'rgba(11,37,69,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: progress >= 100 ? C.green : 'linear-gradient(90deg,' + C.gold + ',#E8A838)', borderRadius: 3, width: progress + '%', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
                  {!isDone && (
                    <button onClick={function() { navigate('/citizen/surveys/' + s.id); }}
                      style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg,' + C.navy + ',#1a3a6e)', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(11,37,69,0.22)' }}>
                      Take Survey &#8594;
                    </button>
                  )}
                  <button onClick={function() { navigate('/citizen/discussion?survey=' + s.id); }}
                    style={{ padding: '13px 18px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    &#128172; Discuss
                  </button>
                  <button onClick={function() {
                    var url = window.location.origin + '/citizen/surveys/' + s.id;
                    var text = s.title + ' — CivicVerify';
                    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                      navigator.share({ title: text, url: url });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert('Link copied!');
                    }
                  }}
                    style={{ padding: '13px 16px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)', border: '1px solid rgba(11,37,69,0.08)', borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    &#x1F517; Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
