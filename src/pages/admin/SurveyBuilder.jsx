// src/pages/admin/SurveyBuilder.jsx — Polished
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const QUESTION_TYPES = [
  { type: 'multiple_choice', label: 'Multiple Choice', icon: '◉', desc: 'Select one option' },
  { type: 'checkbox', label: 'Checkboxes', icon: '☑', desc: 'Select multiple' },
  { type: 'text', label: 'Free Text', icon: '✎', desc: 'Open response' },
  { type: 'rating', label: 'Rating', icon: '★', desc: '1-5 scale' },
];

function QuestionCard({ q, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const typeInfo = QUESTION_TYPES.find(t => t.type === q.type) || QUESTION_TYPES[0];
  return (
    <div className="group bg-white rounded-2xl border border-[#0B2545]/[0.05] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3 px-5 py-3 bg-[#0B2545]/[0.015] border-b border-[#0B2545]/[0.04]">
        <span className="w-7 h-7 rounded-lg bg-[#C5960C]/10 text-[#C5960C] text-xs font-bold flex items-center justify-center">{index + 1}</span>
        <span className="text-sm font-semibold text-[#0B2545]/70">{typeInfo.icon} {typeInfo.label}</span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && <button onClick={onMoveUp} className="w-7 h-7 rounded-lg hover:bg-[#0B2545]/5 flex items-center justify-center text-xs text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors">↑</button>}
          {!isLast && <button onClick={onMoveDown} className="w-7 h-7 rounded-lg hover:bg-[#0B2545]/5 flex items-center justify-center text-xs text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors">↓</button>}
          <button onClick={onDelete} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-xs text-[#0B2545]/30 hover:text-[#B8352E] transition-colors">✕</button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <input value={q.text} onChange={e => onUpdate({ ...q, text: e.target.value })} placeholder="Enter your question..."
          className="w-full text-base font-medium text-[#0B2545] placeholder:text-[#0B2545]/20 bg-transparent border-b-2 border-[#0B2545]/[0.06] focus:border-[#C5960C] outline-none pb-2 transition-colors" />
        <label className="flex items-center gap-2 text-sm text-[#0B2545]/40">
          <input type="checkbox" checked={q.required} onChange={e => onUpdate({ ...q, required: e.target.checked })} className="rounded accent-[#C5960C]" />
          Required question
        </label>
        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
          <div className="space-y-2 pl-1">
            {(q.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-[#0B2545]/10 flex-shrink-0" />
                <input value={opt} onChange={e => { const opts = [...q.options]; opts[i] = e.target.value; onUpdate({ ...q, options: opts }); }}
                  className="flex-1 text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-lg px-3 py-2 border border-transparent focus:border-[#C5960C]/30 focus:bg-white outline-none transition-all" placeholder={`Option ${i + 1}`} />
                <button onClick={() => { const opts = q.options.filter((_, j) => j !== i); onUpdate({ ...q, options: opts }); }}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#0B2545]/20 hover:text-[#B8352E] flex items-center justify-center transition-colors text-xs">✕</button>
              </div>
            ))}
            <button onClick={() => onUpdate({ ...q, options: [...(q.options || []), ''] })}
              className="text-sm font-semibold text-[#C5960C] hover:text-[#b3870b] ml-7 mt-1 transition-colors">+ Add option</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSurveyBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [targetAge, setTargetAge] = useState('');
  const [targetState, setTargetState] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      supabase.from('surveys').select('*').eq('id', id).single().then(({ data }) => {
        if (data) { setTitle(data.title || ''); setDescription(data.description || ''); setQuestions(data.questions || []); setTargetAge(data.target_age || ''); setTargetState(data.target_state || ''); }
        setLoading(false);
      });
    }
  }, [id]);

  function addQuestion(type) {
    const q = { id: Date.now().toString(), type, text: '', required: false };
    if (type === 'multiple_choice' || type === 'checkbox') q.options = ['', ''];
    setQuestions([...questions, q]);
  }

  function moveQuestion(i, dir) {
    const arr = [...questions]; const j = i + dir;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setQuestions(arr);
  }

  async function saveSurvey(status = 'draft') {
    if (!title.trim()) return alert('Please enter a survey title');
    setSaving(true);
    const payload = { title, description, questions, status, target_age: targetAge || null, target_state: targetState || null };
    const { error } = id ? await supabase.from('surveys').update(payload).eq('id', id) : await supabase.from('surveys').insert(payload);
    setSaving(false);
    if (!error) navigate('/admin/surveys');
    else alert('Error saving: ' + error.message);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin/surveys')} className="text-sm text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors mb-2 flex items-center gap-1">← Back to Surveys</button>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{id ? 'Edit Survey' : 'New Survey'}</h1>
        </div>
      </div>

      {/* Survey Details */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm space-y-5">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Survey Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Community Transportation Survey"
            className="w-full text-lg font-semibold text-[#0B2545] placeholder:text-[#0B2545]/15 bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief description of this survey's purpose..."
            className="w-full text-sm text-[#0B2545] placeholder:text-[#0B2545]/15 bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Target Age Range</label>
            <input value={targetAge} onChange={e => setTargetAge(e.target.value)} placeholder="e.g., 18-65"
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Target State</label>
            <input value={targetState} onChange={e => setTargetState(e.target.value)} placeholder="e.g., California"
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all" />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div>
        <h2 className="text-sm font-bold text-[#0B2545] mb-4">Questions ({questions.length})</h2>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i}
              onUpdate={updated => setQuestions(questions.map(x => x.id === q.id ? updated : x))}
              onDelete={() => setQuestions(questions.filter(x => x.id !== q.id))}
              onMoveUp={() => moveQuestion(i, -1)}
              onMoveDown={() => moveQuestion(i, 1)}
              isFirst={i === 0} isLast={i === questions.length - 1} />
          ))}
        </div>

        {questions.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#0B2545]/10 py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-2xl mb-4">❓</div>
            <p className="text-sm font-semibold text-[#0B2545]/25">No questions yet</p>
            <p className="text-xs text-[#0B2545]/20 mt-1">Add your first question below</p>
          </div>
        )}
      </div>

      {/* Add Question */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 mb-3">Add Question</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUESTION_TYPES.map(t => (
            <button key={t.type} onClick={() => addQuestion(t.type)}
              className="bg-white rounded-xl border border-[#0B2545]/[0.06] p-4 text-center hover:border-[#C5960C]/30 hover:shadow-md hover:shadow-[#C5960C]/5 hover:-translate-y-0.5 transition-all duration-200 group">
              <span className="text-2xl block mb-2">{t.icon}</span>
              <p className="text-xs font-semibold text-[#0B2545]/70 group-hover:text-[#C5960C] transition-colors">{t.label}</p>
              <p className="text-[10px] text-[#0B2545]/25 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#0B2545]/[0.06]">
        <button onClick={() => navigate('/admin/surveys')} className="px-5 py-2.5 text-sm font-semibold text-[#0B2545]/40 hover:text-[#0B2545]/70 rounded-xl border border-[#0B2545]/10 hover:border-[#0B2545]/20 transition-all duration-200">Cancel</button>
        <div className="flex gap-3">
          <button onClick={() => saveSurvey('draft')} disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-[#0B2545]/60 bg-[#0B2545]/5 hover:bg-[#0B2545]/10 rounded-xl transition-all duration-200 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => saveSurvey('active')} disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#C5960C] hover:bg-[#b3870b] rounded-xl shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 transition-all duration-200 disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish Survey'}
          </button>
        </div>
      </div>
    </div>
  );
}
