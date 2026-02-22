// src/pages/citizen/TakeSurvey.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const LIKERT_DEFAULTS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

export default function TakeSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { if (user && id) loadSurvey(); }, [user, id]);

  async function loadSurvey() {
    try {
      const { data: existing } = await supabase.from('responses').select('id').eq('survey_id', id).eq('user_id', user.id).maybeSingle();
      if (existing) { setAlreadyDone(true); setLoading(false); return; }
      const { data, error: fetchErr } = await supabase.from('surveys').select('*').eq('id', id).eq('status', 'active').single();
      if (fetchErr) throw fetchErr;
      if (!data) throw new Error('Survey not found or is no longer active.');
      setSurvey(data);
    } catch (err) { setError(err.message || 'Failed to load survey'); } finally { setLoading(false); }
  }

  const questions = survey?.questions || [];
  const current = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  function setAnswer(qId, value) { setAnswers((prev) => ({ ...prev, [qId]: value })); }
  function canAdvance() { if (!current) return false; if (!current.required) return true; const a = answers[current.id]; return a !== undefined && a !== null && a !== ''; }

  async function handleSubmit() {
    for (const q of questions) { if (q.required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '')) { alert(`Please answer: "${q.text}"`); setCurrentIdx(questions.findIndex((x) => x.id === q.id)); return; } }
    setSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from('responses').insert([{ survey_id: id, user_id: user.id, answers }]);
      if (insertErr) { if (insertErr.code === '23505') { setAlreadyDone(true); return; } throw insertErr; }
      setSubmitted(true);
    } catch (err) { console.error('Submit error:', err); alert('Failed to submit: ' + (err.message || 'Unknown error')); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return (<div className="max-w-lg mx-auto text-center py-16"><p className="text-3xl mb-3">😕</p><h2 className="text-lg font-bold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Survey Unavailable</h2><p className="text-sm text-[#0B2545]/45 mb-5">{error}</p><button onClick={() => navigate('/citizen/surveys')} className="px-5 py-2.5 bg-[#0B2545] text-white text-sm font-semibold rounded-lg">← Back</button></div>);
  if (alreadyDone) return (<div className="max-w-lg mx-auto text-center py-16"><div className="w-16 h-16 rounded-full bg-[#22863A]/10 flex items-center justify-center text-3xl mx-auto mb-5">✓</div><h2 className="text-xl font-bold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Already Completed</h2><p className="text-sm text-[#0B2545]/45 mb-5">You've already submitted a response for this survey.</p><button onClick={() => navigate('/citizen/surveys')} className="px-5 py-2.5 bg-[#0B2545] text-white text-sm font-semibold rounded-lg">← Browse Surveys</button></div>);
  if (submitted) return (<div className="max-w-lg mx-auto text-center py-16"><div className="w-20 h-20 rounded-full bg-[#22863A]/10 flex items-center justify-center text-4xl mx-auto mb-5">🎉</div><h2 className="text-xl font-bold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Thank You!</h2><p className="text-sm text-[#0B2545]/50 mb-2">Your response to <strong>"{survey.title}"</strong> has been recorded.</p><p className="text-sm text-[#0B2545]/30 mb-6">Verified responses like yours help shape real policy decisions.</p><div className="flex items-center justify-center gap-3"><button onClick={() => navigate('/citizen/surveys')} className="px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">Take Another Survey</button><button onClick={() => navigate('/citizen/impact')} className="px-5 py-2.5 border border-[#0B2545]/10 text-sm font-medium text-[#0B2545]/60 rounded-lg hover:bg-white transition-all">View My Impact</button></div></div>);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#0B2545] rounded-t-2xl px-6 sm:px-8 py-6">
        <button onClick={() => navigate('/citizen/surveys')} className="text-white/30 hover:text-white/60 text-sm mb-3 transition-colors">← Back to Surveys</button>
        <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 rounded bg-[#C5960C] flex items-center justify-center text-[8px] font-bold text-[#0B2545]">CV</div><span className="text-[10px] text-white/30 font-medium tracking-wider uppercase">CivicVerify Survey</span></div>
        <h1 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h1>
        {survey.description && <p className="text-sm text-white/40 mt-2">{survey.description}</p>}
        <div className="mt-5"><div className="flex justify-between text-[11px] text-white/30 mb-1.5"><span>Question {currentIdx + 1} of {questions.length}</span><span>{progress}% complete</span></div><div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-[#C5960C] transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 border-[#0B2545]/5 shadow-sm">
        <div className="px-6 sm:px-8 py-8">
          {current && (
            <div key={current.id}>
              <p className="text-base font-semibold text-[#0B2545] mb-6 leading-relaxed"><span className="text-[#0B2545]/20 mr-2">{currentIdx + 1}.</span>{current.text}{current.required && <span className="text-[#B8352E] ml-1">*</span>}</p>

              {current.type === 'likert' && (
                <>
                  <div className="hidden sm:flex gap-3 justify-center">
                    {(current.labels || LIKERT_DEFAULTS).map((label, i) => { const val = i + 1, sel = answers[current.id] === val; return (
                      <button key={i} onClick={() => setAnswer(current.id, val)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all flex-1 max-w-[120px] ${sel ? 'border-[#C5960C] bg-[#C5960C]/5 shadow-sm' : 'border-[#0B2545]/6 hover:border-[#C5960C]/30'}`}>
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${sel ? 'bg-[#C5960C] text-white' : 'bg-[#0B2545]/[0.04] text-[#0B2545]/35'}`}>{val}</span>
                        <span className={`text-[10px] text-center leading-tight ${sel ? 'text-[#C5960C] font-semibold' : 'text-[#0B2545]/30'}`}>{label}</span>
                      </button>); })}
                  </div>
                  <div className="sm:hidden space-y-2">
                    {(current.labels || LIKERT_DEFAULTS).map((label, i) => { const val = i + 1, sel = answers[current.id] === val; return (
                      <button key={i} onClick={() => setAnswer(current.id, val)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${sel ? 'border-[#C5960C] bg-[#C5960C]/5' : 'border-[#0B2545]/6 hover:border-[#C5960C]/30'}`}>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${sel ? 'bg-[#C5960C] text-white' : 'bg-[#0B2545]/[0.04] text-[#0B2545]/35'}`}>{val}</span>
                        <span className={`text-sm ${sel ? 'text-[#C5960C] font-medium' : 'text-[#0B2545]/50'}`}>{label}</span>
                      </button>); })}
                  </div>
                </>
              )}

              {current.type === 'multiple_choice' && (
                <div className="space-y-2">{(current.options || []).map((opt, i) => { const sel = answers[current.id] === opt; return (
                  <button key={i} onClick={() => setAnswer(current.id, opt)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${sel ? 'border-[#C5960C] bg-[#C5960C]/5' : 'border-[#0B2545]/6 hover:border-[#C5960C]/30'}`}>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${sel ? 'border-[#C5960C] bg-[#C5960C]' : 'border-[#0B2545]/15'}`}>{sel && <span className="w-2 h-2 rounded-full bg-white" />}</span>
                    <span className={`text-sm ${sel ? 'text-[#0B2545] font-medium' : 'text-[#0B2545]/60'}`}>{opt}</span>
                  </button>); })}</div>
              )}

              {current.type === 'text' && <textarea value={answers[current.id] || ''} onChange={(e) => setAnswer(current.id, e.target.value)} rows={4} placeholder="Type your response here..." className="w-full px-4 py-3 text-sm bg-[#F5F1EC]/30 border-2 border-[#0B2545]/6 rounded-xl focus:outline-none focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 transition-all resize-none placeholder:text-[#0B2545]/20" />}

              {current.type === 'yes_no' && (
                <div className="flex gap-4">{['Yes', 'No'].map((opt) => { const sel = answers[current.id] === opt, isYes = opt === 'Yes'; return (
                  <button key={opt} onClick={() => setAnswer(current.id, opt)} className={`flex-1 py-5 rounded-xl border-2 text-base font-semibold transition-all ${sel ? isYes ? 'border-[#22863A] bg-[#22863A]/5 text-[#22863A]' : 'border-[#B8352E] bg-[#B8352E]/5 text-[#B8352E]' : 'border-[#0B2545]/6 text-[#0B2545]/35 hover:border-[#0B2545]/15'}`}>{opt}</button>); })}</div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-[#0B2545]/5 flex items-center justify-between">
          <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="px-4 py-2.5 text-sm font-medium text-[#0B2545]/45 hover:text-[#0B2545] disabled:opacity-25 transition-colors">← Previous</button>
          <div className="hidden sm:flex items-center gap-1.5">{questions.map((q, i) => (<button key={q.id} onClick={() => setCurrentIdx(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIdx ? 'bg-[#C5960C] scale-125' : answers[q.id] !== undefined ? 'bg-[#22863A]/60' : 'bg-[#0B2545]/10'}`} />))}</div>
          {currentIdx === questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={!canAdvance() || submitting} className="px-6 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Response'}</button>
          ) : (
            <button onClick={() => setCurrentIdx(currentIdx + 1)} disabled={!canAdvance()} className="px-5 py-2.5 bg-[#0B2545] hover:bg-[#0B2545]/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-35">Next →</button>
          )}
        </div>
      </div>
    </div>
  );
}
