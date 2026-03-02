// src/pages/citizen/TakeSurvey.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

function MultipleChoice({ question, value, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {(question.options || []).map(function(opt, i) {
        var sel = value === opt;
        return (
          <button key={i} onClick={function() { onChange(opt); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: '2px solid ' + (sel ? C.gold : 'rgba(11,37,69,0.08)'), borderRadius: 12, background: sel ? C.gold + '0A' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + (sel ? C.gold : 'rgba(11,37,69,0.2)'), background: sel ? C.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sel && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />}
            </span>
            <span style={{ fontSize: 15, color: sel ? C.navy : 'rgba(11,37,69,0.7)', fontWeight: sel ? 600 : 400 }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function CheckboxQ({ question, value, onChange }) {
  var sel = Array.isArray(value) ? value : [];
  function toggle(opt) { onChange(sel.includes(opt) ? sel.filter(function(v) { return v !== opt; }) : sel.concat([opt])); }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {(question.options || []).map(function(opt, i) {
        var checked = sel.includes(opt);
        return (
          <button key={i} onClick={function() { toggle(opt); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: '2px solid ' + (checked ? C.gold : 'rgba(11,37,69,0.08)'), borderRadius: 12, background: checked ? C.gold + '0A' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}>
            <span style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid ' + (checked ? C.gold : 'rgba(11,37,69,0.2)'), background: checked ? C.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </span>
            <span style={{ fontSize: 15, color: checked ? C.navy : 'rgba(11,37,69,0.7)', fontWeight: checked ? 600 : 400 }}>{opt}</span>
          </button>
        );
      })}
      {sel.length > 0 && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: '2px 0 0' }}>{sel.length} selected</p>}
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {['Yes', 'No'].map(function(opt) {
        var sel = value === opt;
        var col = opt === 'Yes' ? C.green : C.red;
        return (
          <button key={opt} onClick={function() { onChange(opt); }} style={{ padding: '22px 16px', border: '2px solid ' + (sel ? col : 'rgba(11,37,69,0.08)'), borderRadius: 14, background: sel ? col + '10' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>{opt === 'Yes' ? '\u2714\uFE0F' : '\u274C'}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: sel ? col : 'rgba(11,37,69,0.35)' }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function Rating({ question, value, onChange }) {
  var scale = question.scale || 5;
  var nums = Array.from({ length: scale }, function(_, i) { return i + 1; });
  var [hover, setHover] = useState(0);
  var active = hover || value || 0;
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        {nums.map(function(n) {
          var lit = n <= active;
          return (
            <button key={n} onClick={function() { onChange(n); }} onMouseEnter={function() { setHover(n); }} onMouseLeave={function() { setHover(0); }}
              style={{ width: 54, height: 54, border: '2px solid ' + (lit ? C.gold : 'rgba(11,37,69,0.08)'), borderRadius: 12, background: lit ? C.gold + '12' : '#fff', cursor: 'pointer', fontSize: 24, transition: 'all 0.12s', transform: lit ? 'scale(1.08)' : 'scale(1)' }}>
              {lit ? '\u2605' : '\u2606'}
            </button>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(11,37,69,0.35)', margin: 0 }}>
        {active ? active + ' / ' + scale : 'Click a star to rate'}
      </p>
    </div>
  );
}

function TextAnswer({ value, onChange }) {
  return (
    <textarea value={value || ''} onChange={function(e) { onChange(e.target.value); }} placeholder="Type your answer here..." rows={4}
      style={{ width: '100%', padding: '14px 16px', fontSize: 15, border: '2px solid rgba(11,37,69,0.08)', borderRadius: 12, outline: 'none', resize: 'vertical', fontFamily: 'DM Sans, sans-serif', color: C.navy, lineHeight: 1.6, boxSizing: 'border-box' }}
      onFocus={function(e) { e.target.style.borderColor = C.gold; }} onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.08)'; }} />
  );
}

function QuestionInput({ question, value, onChange }) {
  if (question.type === 'multiple_choice') return <MultipleChoice question={question} value={value} onChange={onChange} />;
  if (question.type === 'checkbox') return <CheckboxQ question={question} value={value} onChange={onChange} />;
  if (question.type === 'yes_no') return <YesNo value={value} onChange={onChange} />;
  if (question.type === 'rating') return <Rating question={question} value={value} onChange={onChange} />;
  return <TextAnswer value={value} onChange={onChange} />;
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }, function(_, i) {
        var done = i < current - 1;
        var active = i === current - 1;
        return (
          <span key={i} style={{ width: active ? 24 : 8, height: 8, borderRadius: 4, background: done ? C.gold + '60' : active ? C.gold : 'rgba(11,37,69,0.08)', transition: 'all 0.3s' }} />
        );
      })}
    </div>
  );
}

export default function TakeSurvey() {
  var { id: surveyId } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();

  var [survey, setSurvey] = useState(null);
  var [answers, setAnswers] = useState({});
  var [step, setStep] = useState(0);
  var [submitting, setSubmitting] = useState(false);
  var [error, setError] = useState('');
  var [alreadyDone, setAlreadyDone] = useState(false);
  var [loading, setLoading] = useState(true);
  var [shareThought, setShareThought] = useState('');
  var [shared, setShared] = useState(false);
  var [sharing, setSharing] = useState(false);
  var startTime = useRef(Date.now());

  useEffect(function() {
    if (!user || !surveyId) return;
    Promise.all([
      supabase.from('surveys').select('*').eq('id', surveyId).eq('status', 'active').single(),
      supabase.from('responses').select('id').eq('survey_id', surveyId).eq('user_id', user.id).maybeSingle()
    ]).then(function(results) {
      var s = results[0].data;
      var existing = results[1].data;
      if (!s) { navigate('/citizen/surveys'); return; }
      setSurvey(s);
      if (existing) setAlreadyDone(true);
      setLoading(false);
    });
  }, [user, surveyId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!survey) return null;

  var questions = survey.questions || [];
  var total = questions.length;

  // Already completed
  if (alreadyDone) return (
    <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', padding: '0 20px', fontFamily: 'DM Sans, sans-serif' }}>
      <span style={{ fontSize: 52, display: 'block', marginBottom: 16 }}>&#10003;</span>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 10px', fontFamily: font }}>Already completed</h2>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 28px' }}>You already responded to this survey. Thank you!</p>
      <button onClick={function() { navigate('/citizen/surveys'); }} style={{ padding: '12px 32px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Back to Surveys</button>
    </div>
  );

  async function shareComment() {
    if (!shareThought.trim() || !user) return;
    setSharing(true);
    await supabase.from('discussion_comments').insert({
      survey_id: surveyId,
      user_id: user.id,
      author_name: 'Citizen',
      verified: false,
      content: shareThought.trim(),
      likes: [],
      parent_id: null,
    });
    setShared(true);
    setSharing(false);
  }

  if (step > total) return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.green + '12', border: '2px solid ' + C.green + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30, color: C.green }}>&#10003;</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Response recorded!</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.45)', margin: 0, lineHeight: 1.6 }}>Thanks for completing <strong style={{ color: C.navy }}>{survey.title}</strong>. Your voice contributes to verified civic data.</p>
      </div>

      {/* Inline discussion prompt */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>&#128172; What do you think about this poll?</p>
        <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: '0 0 14px' }}>Share a thought — others can see and reply. Discussion stays open even after the poll ends.</p>
        {shared
          ? <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: C.green, fontWeight: 600, margin: 0 }}>&#10003; Your comment was posted!</p>
            </div>
          : <div>
              <textarea value={shareThought} onChange={function(e) { setShareThought(e.target.value); }} placeholder={'e.g. "I think this matters because..." or "Here's my take..."'} rows={3}
                style={{ width: '100%', padding: '12px 14px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                onFocus={function(e) { e.target.style.borderColor = C.gold; }} onBlur={function(e) { e.target.style.borderColor = 'rgba(11,37,69,0.08)'; }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={shareComment} disabled={!shareThought.trim() || sharing} style={{ padding: '9px 20px', background: shareThought.trim() ? C.navy : 'rgba(11,37,69,0.06)', color: shareThought.trim() ? '#fff' : 'rgba(11,37,69,0.2)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: shareThought.trim() ? 'pointer' : 'default' }}>
                  {sharing ? 'Posting...' : 'Share Thought'}
                </button>
              </div>
            </div>
        }
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <button onClick={function() { navigate('/citizen/surveys'); }} style={{ padding: 13, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Back to Surveys &#8594;</button>
        <button onClick={function() { navigate('/citizen/discussion'); }} style={{ padding: 13, background: 'rgba(11,37,69,0.04)', color: C.navy, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View Poll Discussions &#8594;</button>
      </div>
    </div>
  );

  var currentQ = questions[step - 1];
  var currentAnswer = currentQ ? answers[currentQ.id] : null;

  function isAnswered(q, val) {
    if (!q.required) return true;
    if (val === null || val === undefined || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }

  var canNext = step === 0 || (currentQ && isAnswered(currentQ, currentAnswer));

  function setAnswer(qId, val) { setAnswers(function(p) { return Object.assign({}, p, { [qId]: val }); }); setError(''); }

  function goNext() {
    if (step > 0 && !canNext) { setError('Please answer this question before continuing.'); return; }
    setError('');
    if (step < total) { setStep(step + 1); window.scrollTo(0, 0); }
    else submitSurvey();
  }

  function goPrev() { if (step > 0) { setStep(step - 1); setError(''); window.scrollTo(0, 0); } }

  async function submitSurvey() {
    setSubmitting(true);
    try {
      var duration = Math.round((Date.now() - startTime.current) / 1000);
      var answersArr = questions.map(function(q) { return { question_id: q.id, answer: answers[q.id] !== undefined ? answers[q.id] : null }; });

      var r = await supabase.from('responses').insert({ survey_id: surveyId, user_id: user.id, answers: answersArr, duration_seconds: duration });
      if (r.error) throw r.error;

      // Increment response_count on survey
      var sr = await supabase.from('surveys').select('response_count').eq('id', surveyId).single();
      if (sr.data) await supabase.from('surveys').update({ response_count: (sr.data.response_count || 0) + 1 }).eq('id', surveyId);

      // Increment trust score
      var ur = await supabase.from('users').select('trust_score').eq('id', user.id).single();
      if (ur.data) await supabase.from('users').update({ trust_score: (ur.data.trust_score || 0) + 1 }).eq('id', user.id);

      setStep(total + 1);
    } catch (e) {
      setError('Submission failed: ' + (e.message || 'Please try again.'));
    }
    setSubmitting(false);
  }

  // ── Intro screen (step 0)
  if (step === 0) return (
    <div style={{ maxWidth: 580, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>
      <button onClick={function() { navigate('/citizen/surveys'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(11,37,69,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 28, padding: 0 }}>&#8592; Back to Surveys</button>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(11,37,69,0.05)' }}>
        <div style={{ background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #1a3a6e 100%)', padding: '32px 36px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>Civic Survey</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: font, lineHeight: 1.3 }}>{survey.title}</h1>
          {survey.description && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{survey.description}</p>}
        </div>
        <div style={{ padding: '28px 36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Questions', val: total },
              { label: 'Responses so far', val: (survey.response_count || 0).toLocaleString() },
              { label: 'Est. time', val: total <= 3 ? '< 1 min' : total <= 8 ? '2-3 min' : '5 min' },
            ].map(function(s) { return (
              <div key={s.label} style={{ background: 'rgba(11,37,69,0.025)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>{s.val}</p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{s.label}</p>
              </div>
            ); })}
          </div>
          <div style={{ background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.55)', margin: 0, lineHeight: 1.6 }}>
              &#128274; Your response is anonymous to the public and used for verified civic data only. You earn +1 trust point for completing this survey.
            </p>
          </div>
          <button onClick={goNext} style={{ width: '100%', padding: 16, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.25)' }}>
            Start Survey &#8594;
          </button>
        </div>
      </div>
    </div>
  );

  // ── Question screen (step 1..N)
  var pct = Math.round((step / total) * 100);
  return (
    <div style={{ maxWidth: 580, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Question {step} of {total}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{pct}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(11,37,69,0.06)', borderRadius: 3 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, ' + C.gold + ', #E8A838)', borderRadius: 3, width: pct + '%', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(11,37,69,0.06)', padding: '32px 36px', boxShadow: '0 4px 24px rgba(11,37,69,0.05)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: C.navy, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{step}</span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font, lineHeight: 1.4 }}>{currentQ.text}</h2>
            <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', fontWeight: 600 }}>
              {currentQ.type === 'multiple_choice' ? 'Select one' : currentQ.type === 'checkbox' ? 'Select all that apply' : currentQ.type === 'yes_no' ? 'Yes or No' : currentQ.type === 'rating' ? 'Rate 1-' + (currentQ.scale || 5) : 'Written answer'}
              {currentQ.required ? ' \u2022 Required' : ' \u2022 Optional'}
            </span>
          </div>
        </div>

        <QuestionInput question={currentQ} value={currentAnswer} onChange={function(val) { setAnswer(currentQ.id, val); }} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={goPrev} style={{ padding: '14px 24px', background: 'rgba(11,37,69,0.04)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&#8592; Back</button>
        <button onClick={goNext} disabled={submitting} style={{ flex: 1, padding: 14, background: canNext ? C.gold : 'rgba(11,37,69,0.06)', color: canNext ? '#fff' : 'rgba(11,37,69,0.2)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: canNext ? '0 4px 16px rgba(197,150,12,0.2)' : 'none' }}>
          {submitting ? 'Submitting...' : step === total ? 'Submit Survey &#10003;' : 'Next &#8594;'}
        </button>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 20 }}>
        {Array.from({ length: total }, function(_, i) {
          return <span key={i} style={{ width: i === step - 1 ? 20 : 6, height: 6, borderRadius: 3, background: i < step ? C.gold : i === step ? C.gold + '40' : 'rgba(11,37,69,0.08)', transition: 'all 0.3s' }} />;
        })}
      </div>
    </div>
  );
}
