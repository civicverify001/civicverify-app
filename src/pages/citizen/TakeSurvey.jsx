// src/pages/citizen/TakeSurvey.jsx — Polished
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function CitizenTakeSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('surveys').select('*').eq('id', id).single().then(({ data }) => {
      setSurvey(data);
      setLoading(false);
    });
  }, [id]);

  const questions = survey?.questions || [];
  const q = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  function setAnswer(val) {
    setAnswers({ ...answers, [q.id]: val });
  }

  async function handleSubmit() {
    setSubmitting(true);
    const { error } = await supabase.from('responses').insert({
      survey_id: id, user_id: profile?.id, answers,
    });
    if (!error) {
      await supabase.from('surveys').update({ response_count: (survey.response_count || 0) + 1 }).eq('id', id);
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (submitted) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">🎉</div>
      <h2 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Thank You!</h2>
      <p className="text-sm text-[#0B2545]/40 mt-3 max-w-sm mx-auto leading-relaxed">Your response has been submitted. Your voice matters in shaping civic decisions.</p>
      <button onClick={() => navigate('/citizen/surveys')} className="mt-6 px-6 py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200">Back to Surveys</button>
    </div>
  );

  if (!survey) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mx-auto mb-5">⚠️</div>
      <p className="text-lg font-semibold text-[#0B2545]/30">Survey not found</p>
      <button onClick={() => navigate('/citizen/surveys')} className="mt-4 text-sm font-semibold text-[#C5960C]">← Back to Surveys</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/citizen/surveys')} className="text-sm text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors mb-2 flex items-center gap-1">← Back to Surveys</button>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h1>
        {survey.description && <p className="text-sm text-[#0B2545]/40 mt-1">{survey.description}</p>}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#0B2545]/30">Question {current + 1} of {questions.length}</span>
          <span className="text-xs font-bold text-[#C5960C]">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-[#0B2545]/[0.04] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#C5960C] to-[#d4a832] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      {q && (
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-8 shadow-sm">
          <p className="text-lg font-semibold text-[#0B2545] mb-6">{q.text} {q.required && <span className="text-[#B8352E]">*</span>}</p>

          {(q.type === 'multiple_choice') && (
            <div className="space-y-3">
              {(q.options || []).map((opt, i) => (
                <button key={i} onClick={() => setAnswer(opt)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                    answers[q.id] === opt
                      ? 'border-[#C5960C] bg-[#C5960C]/[0.03] text-[#0B2545] shadow-sm'
                      : 'border-[#0B2545]/[0.06] hover:border-[#0B2545]/10 text-[#0B2545]/60 hover:text-[#0B2545]'
                  }`}>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 ${answers[q.id] === opt ? 'border-[#C5960C] bg-[#C5960C]' : 'border-[#0B2545]/15'}`}>
                    {answers[q.id] === opt && <span className="w-2 h-2 bg-white rounded-full" />}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {q.type === 'checkbox' && (
            <div className="space-y-3">
              {(q.options || []).map((opt, i) => {
                const selected = (answers[q.id] || []).includes(opt);
                return (
                  <button key={i} onClick={() => { const cur = answers[q.id] || []; setAnswer(selected ? cur.filter(x => x !== opt) : [...cur, opt]); }}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                      selected ? 'border-[#C5960C] bg-[#C5960C]/[0.03] shadow-sm' : 'border-[#0B2545]/[0.06] hover:border-[#0B2545]/10'
                    }`}>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded mr-3 border-2 ${selected ? 'border-[#C5960C] bg-[#C5960C] text-white' : 'border-[#0B2545]/15'}`}>
                      {selected && <span className="text-[10px] font-bold">✓</span>}
                    </span>
                    <span className="text-sm font-medium text-[#0B2545]/70">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'text' && (
            <textarea value={answers[q.id] || ''} onChange={e => setAnswer(e.target.value)} rows={4} placeholder="Type your answer..."
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all resize-none" />
          )}

          {q.type === 'rating' && (
            <div className="flex items-center gap-3 justify-center py-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setAnswer(n)}
                  className={`w-14 h-14 rounded-2xl text-lg font-bold transition-all duration-200 ${
                    answers[q.id] === n
                      ? 'bg-[#C5960C] text-white shadow-md shadow-[#C5960C]/20 scale-110'
                      : 'bg-[#0B2545]/[0.04] text-[#0B2545]/30 hover:bg-[#0B2545]/[0.08] hover:text-[#0B2545]/60 hover:scale-105'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
          className="px-5 py-2.5 text-sm font-semibold text-[#0B2545]/40 hover:text-[#0B2545]/70 rounded-xl border border-[#0B2545]/10 hover:border-[#0B2545]/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed">
          ← Previous
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#C5960C] hover:bg-[#b3870b] rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#22863A] hover:bg-[#1d7533] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Response ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
