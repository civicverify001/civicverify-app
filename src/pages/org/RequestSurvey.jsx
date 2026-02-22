// src/pages/org/RequestSurvey.jsx — Polished
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const TIERS = [
  { name: 'Basic', price: 'Free', responses: '100', features: ['5 questions max', 'Basic demographics', 'CSV export'] },
  { name: 'Professional', price: '$299', responses: '1,000', features: ['Unlimited questions', 'Advanced targeting', 'Real-time results', 'Priority review'] },
  { name: 'Enterprise', price: '$999', responses: '10,000+', features: ['Everything in Pro', 'Custom branding', 'API access', 'Dedicated support', 'Weighted sampling'] },
];

export default function OrgRequestSurvey() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ text: '', type: 'multiple_choice', options: ['', ''] }]);
  const [tier, setTier] = useState('Basic');
  const [submitting, setSubmitting] = useState(false);

  function addQuestion() {
    setQuestions([...questions, { text: '', type: 'multiple_choice', options: ['', ''] }]);
  }

  function updateQuestion(i, field, val) {
    const q = [...questions]; q[i] = { ...q[i], [field]: val }; setQuestions(q);
  }

  async function handleSubmit() {
    if (!title.trim()) return alert('Please enter a survey title');
    setSubmitting(true);
    const { error } = await supabase.from('surveys').insert({
      title, description, questions: questions.filter(q => q.text.trim()),
      status: 'pending', org_id: profile?.org_id, type: tier.toLowerCase(),
    });
    setSubmitting(false);
    if (!error) navigate('/org/surveys');
    else alert('Error: ' + error.message);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <button onClick={() => navigate('/org')} className="text-sm text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors mb-2 flex items-center gap-1">← Back to Dashboard</button>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Request a Survey</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">Submit your survey for admin review and approval</p>
      </div>

      {/* Tier Selection */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 mb-3">Select Tier</p>
        <div className="grid grid-cols-3 gap-4">
          {TIERS.map(t => (
            <button key={t.name} onClick={() => setTier(t.name)}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                tier === t.name
                  ? 'border-[#C5960C] bg-[#C5960C]/[0.03] shadow-md shadow-[#C5960C]/10'
                  : 'border-[#0B2545]/[0.05] bg-white hover:border-[#0B2545]/10 hover:shadow-sm'
              }`}>
              <p className="text-lg font-bold text-[#0B2545]">{t.name}</p>
              <p className="text-2xl font-bold text-[#C5960C] mt-1">{t.price}</p>
              <p className="text-[11px] text-[#0B2545]/30 mt-1">Up to {t.responses} responses</p>
              <div className="mt-3 space-y-1">
                {t.features.map((f, i) => (
                  <p key={i} className="text-[11px] text-[#0B2545]/40 flex items-center gap-1.5">
                    <span className="text-emerald-500 text-[10px]">✓</span> {f}
                  </p>
                ))}
              </div>
              {tier === t.name && <div className="absolute top-3 right-3 w-5 h-5 bg-[#C5960C] rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Survey Details */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#0B2545]">Survey Details</h3>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Public Transit Satisfaction Survey"
            className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this survey about?"
            className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all resize-none" />
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#0B2545]">Questions</h3>
        {questions.map((q, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#0B2545]/[0.015] space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#C5960C]/10 text-[#C5960C] text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              <input value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} placeholder="Enter question..."
                className="flex-1 text-sm font-medium text-[#0B2545] bg-white rounded-lg px-3 py-2 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all" />
              {questions.length > 1 && (
                <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#0B2545]/20 hover:text-[#B8352E] flex items-center justify-center transition-colors text-xs">✕</button>
              )}
            </div>
            {(q.options || []).map((opt, j) => (
              <div key={j} className="flex items-center gap-2 ml-8">
                <span className="w-4 h-4 rounded-full border-2 border-[#0B2545]/10 flex-shrink-0" />
                <input value={opt} onChange={e => { const opts = [...q.options]; opts[j] = e.target.value; updateQuestion(i, 'options', opts); }}
                  placeholder={`Option ${j + 1}`} className="flex-1 text-sm text-[#0B2545] bg-white rounded-lg px-3 py-1.5 border border-[#0B2545]/[0.04] focus:border-[#C5960C]/30 outline-none transition-all" />
              </div>
            ))}
            <button onClick={() => updateQuestion(i, 'options', [...(q.options || []), ''])} className="text-xs font-semibold text-[#C5960C] ml-8">+ Add option</button>
          </div>
        ))}
        <button onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-[#0B2545]/10 rounded-xl text-sm font-semibold text-[#0B2545]/30 hover:text-[#C5960C] hover:border-[#C5960C]/30 transition-all duration-200">
          + Add Question
        </button>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-4">
        <button onClick={() => navigate('/org')} className="px-5 py-2.5 text-sm font-semibold text-[#0B2545]/40 rounded-xl border border-[#0B2545]/10 hover:border-[#0B2545]/20 transition-all">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting}
          className="px-6 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 transition-all duration-200 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
}
