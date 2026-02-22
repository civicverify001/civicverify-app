// src/pages/org/RequestSurvey.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { US_STATES, AGE_RANGES } from '../../utils/constants';

const Q_TYPES = [
  { type: 'likert', label: 'Likert Scale (1–5)', icon: '★' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
  { type: 'text', label: 'Free Text', icon: '✎' },
  { type: 'yes_no', label: 'Yes / No', icon: '◑' },
];

const TIERS = [
  { key: 'standard', label: 'Standard', price: '$3.50', questions: '5 questions', desc: 'Quick pulse surveys' },
  { key: 'refined', label: 'Refined', price: '$5.00', questions: '10 questions', desc: 'In-depth feedback' },
  { key: 'precision', label: 'Precision', price: '$7.50+', questions: 'Custom', desc: 'Full research surveys' },
];

const LIKERT_DEFAULTS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const STATES_LIST = US_STATES || ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const AGES_LIST = AGE_RANGES || ['18-24','25-34','35-44','45-54','55-64','65+'];

export default function RequestSurvey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [org, setOrg] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState('standard');
  const [targetResponses, setTargetResponses] = useState('500');
  const [urgency, setUrgency] = useState('normal');
  const [demoFilters, setDemoFilters] = useState({ states: [], age_ranges: [] });
  const [questions, setQuestions] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addRef = useRef(null);

  useEffect(() => {
    if (user) fetchOrg();
    const handler = (e) => { if (addRef.current && !addRef.current.contains(e.target)) setShowAddMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [user]);

  async function fetchOrg() {
    const { data } = await supabase.from('organizations').select('*').eq('user_id', user.id).single();
    setOrg(data);
  }

  function addQ(type) {
    setQuestions([...questions, {
      id: `q_${Date.now()}`, type, text: '', required: true,
      ...(type === 'likert' ? { labels: [...LIKERT_DEFAULTS] } : {}),
      ...(type === 'multiple_choice' ? { options: ['', ''] } : {}),
    }]);
    setShowAddMenu(false);
  }

  function updateQ(id, updates) { setQuestions(questions.map((q) => q.id === id ? { ...q, ...updates } : q)); }
  function removeQ(id) { setQuestions(questions.filter((q) => q.id !== id)); }

  async function handleSubmit() {
    if (!title.trim()) return alert('Please enter a survey title.');
    if (questions.length === 0) return alert('Please add at least one question.');

    setSubmitting(true);
    try {
      const surveyType = tier === 'standard' ? '5Q' : tier === 'refined' ? '10Q' : 'custom';
      const { error } = await supabase.from('surveys').insert([{
        title: title.trim(),
        description: description.trim(),
        type: surveyType,
        urgency,
        status: 'pending', // goes to admin review queue
        org_id: org?.id || null,
        target_responses: parseInt(targetResponses) || 500,
        demographic_filters: demoFilters,
        questions,
      }]);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all placeholder:text-[#0B2545]/15";

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-[#22863A]/10 flex items-center justify-center text-4xl mx-auto mb-5">📬</div>
        <h2 className="text-xl font-bold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Survey Submitted for Review</h2>
        <p className="text-sm text-[#0B2545]/45 mb-6">Our admin team will review your survey and activate it once approved. You'll be notified when it goes live.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate('/org/surveys')} className="px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors">View My Surveys</button>
          <button onClick={() => navigate('/org')} className="px-5 py-2.5 border border-[#0B2545]/10 text-sm font-medium text-[#0B2545]/60 rounded-lg hover:bg-white transition-all">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/org')} className="text-[#0B2545]/35 hover:text-[#0B2545] transition-colors">←</button>
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Request a Survey</h1>
          <p className="text-sm text-[#0B2545]/40 mt-0.5">Submit for admin review before activation</p>
        </div>
      </div>

      {/* Tier Selection */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 p-6">
        <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider mb-3">Select Tier</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIERS.map((t) => (
            <button key={t.key} onClick={() => setTier(t.key)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                tier === t.key ? 'border-[#C5960C] bg-[#C5960C]/[0.03]' : 'border-[#0B2545]/5 hover:border-[#0B2545]/10'
              }`}>
              <p className="text-base font-bold text-[#0B2545]">{t.label}</p>
              <p className="text-lg font-bold text-[#C5960C] mt-1">{t.price}<span className="text-xs font-normal text-[#0B2545]/30"> /response</span></p>
              <p className="text-[11px] text-[#0B2545]/35 mt-1">{t.questions} · {t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Survey Details */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 p-6 space-y-4">
        <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider">Survey Details</h3>
        <div>
          <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Customer Sentiment on Public Transit" className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this survey about?" className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Target Responses</label>
            <input type="number" value={targetResponses} onChange={(e) => setTargetResponses(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Urgency</label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={inputClass}>
              <option value="normal">Normal</option>
              <option value="priority">Priority (+20%)</option>
              <option value="urgent">Urgent (+50%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Demographic Targeting */}
      <details className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden group">
        <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-[#0B2545]/60 hover:text-[#0B2545] transition-colors list-none flex items-center justify-between">
          <span>🎯 Demographic Targeting (optional)</span>
          <span className="text-[#0B2545]/20 group-open:rotate-90 transition-transform">▸</span>
        </summary>
        <div className="px-6 pb-5 pt-2 border-t border-[#0B2545]/5 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-2">States</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {STATES_LIST.map((st) => (
                <button key={st} onClick={() => setDemoFilters((p) => ({ ...p, states: p.states.includes(st) ? p.states.filter((s) => s !== st) : [...p.states, st] }))}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${demoFilters.states.includes(st) ? 'bg-[#C5960C]/10 border-[#C5960C]/30 text-[#C5960C]' : 'bg-white border-[#0B2545]/8 text-[#0B2545]/35'}`}>{st}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-2">Age Ranges</label>
            <div className="flex flex-wrap gap-2">
              {AGES_LIST.map((age) => (
                <button key={age} onClick={() => setDemoFilters((p) => ({ ...p, age_ranges: p.age_ranges.includes(age) ? p.age_ranges.filter((a) => a !== age) : [...p.age_ranges, age] }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${demoFilters.age_ranges.includes(age) ? 'bg-[#C5960C]/10 border-[#C5960C]/30 text-[#C5960C]' : 'bg-white border-[#0B2545]/8 text-[#0B2545]/35'}`}>{age}</button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Questions */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider">Questions ({questions.length})</h3>
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl border border-[#0B2545]/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{Q_TYPES.find((t) => t.type === q.type)?.icon}</span>
              <span className="text-[10px] text-[#0B2545]/25">{Q_TYPES.find((t) => t.type === q.type)?.label}</span>
              <span className="text-[10px] text-[#0B2545]/15 ml-auto">Q{i + 1}</span>
              <button onClick={() => removeQ(q.id)} className="p-1 rounded hover:bg-red-50 text-[#0B2545]/15 hover:text-[#B8352E] transition-colors">✕</button>
            </div>
            <input type="text" value={q.text} onChange={(e) => updateQ(q.id, { text: e.target.value })}
              placeholder="Enter your question..." className={inputClass} />
            {q.type === 'multiple_choice' && (
              <div className="space-y-1.5 pl-2">
                {q.options.map((o, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-[#0B2545]/12 shrink-0" />
                    <input type="text" value={o} onChange={(e) => { const no = [...q.options]; no[j] = e.target.value; updateQ(q.id, { options: no }); }}
                      placeholder={`Option ${j + 1}`} className="flex-1 px-2.5 py-1.5 text-xs bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5960C]/20" />
                    {q.options.length > 2 && <button onClick={() => updateQ(q.id, { options: q.options.filter((_, k) => k !== j) })} className="text-[#0B2545]/15 hover:text-[#B8352E] text-xs">✕</button>}
                  </div>
                ))}
                <button onClick={() => updateQ(q.id, { options: [...q.options, ''] })} className="text-[10px] font-semibold text-[#C5960C] ml-5">+ Add option</button>
              </div>
            )}
          </div>
        ))}

        <div className="relative" ref={addRef}>
          <button onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full py-3 border-2 border-dashed border-[#0B2545]/8 rounded-xl text-sm font-semibold text-[#0B2545]/30 hover:text-[#C5960C] hover:border-[#C5960C]/30 transition-all">
            + Add Question
          </button>
          {showAddMenu && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-[#0B2545]/8 shadow-xl z-10 p-2">
              {Q_TYPES.map((t) => (
                <button key={t.type} onClick={() => addQ(t.type)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-[#C5960C]/[0.04] transition-colors">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-sm font-medium text-[#0B2545]">{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50">
          {submitting ? 'Submitting...' : '📬 Submit for Review'}
        </button>
        <button onClick={() => navigate('/org')}
          className="px-6 py-3 border border-[#0B2545]/10 text-sm font-medium text-[#0B2545]/50 rounded-lg hover:bg-white transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}
