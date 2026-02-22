// src/pages/admin/SurveyBuilder.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const LIKERT = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const Q_TYPES = [
  { type: 'likert', label: 'Likert Scale (1–5)', icon: '★' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
  { type: 'text', label: 'Free Text', icon: '✎' },
  { type: 'yes_no', label: 'Yes / No', icon: '◑' },
];
const STATES_LIST = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const AGES_LIST = ['18-24','25-34','35-44','45-54','55-64','65+'];

function QuestionCard({ q, idx, total, open, onToggle, onUpdate, onRemove, onMove, onDuplicate }) {
  const t = Q_TYPES.find((t) => t.type === q.type) || Q_TYPES[0];
  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 ${open ? 'border-[#C5960C]/30 shadow-md ring-1 ring-[#C5960C]/10' : 'border-[#0B2545]/5 hover:border-[#0B2545]/10 hover:shadow-sm'}`}>
      <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none" onClick={onToggle}>
        <span className="w-7 h-7 rounded-lg bg-[#0B2545]/[0.04] flex items-center justify-center text-[11px] font-bold text-[#0B2545]/30">{idx + 1}</span>
        <span className="text-base">{t.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0B2545] truncate">{q.text || <span className="italic text-[#0B2545]/25">Untitled question</span>}</p>
          <p className="text-[10px] text-[#0B2545]/25">{t.label}</p>
        </div>
        {q.required && <span className="text-[10px] font-bold text-[#B8352E] uppercase tracking-wider">Required</span>}
        <span className={`text-[#0B2545]/25 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▸</span>
      </div>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-[#0B2545]/5 space-y-4" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Question Text</label>
            <input type="text" value={q.text} autoFocus onChange={(e) => onUpdate({ text: e.target.value })} placeholder="e.g., How satisfied are you with local road conditions?"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all placeholder:text-[#0B2545]/15" />
          </div>
          {q.type === 'likert' && (
            <div>
              <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-2">Scale Labels</label>
              <div className="flex gap-2">
                {(q.labels || LIKERT).map((l, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="w-9 h-9 rounded-full border-2 border-[#C5960C]/20 bg-[#C5960C]/5 flex items-center justify-center text-xs font-bold text-[#C5960C] mx-auto mb-1">{i + 1}</div>
                    <input type="text" value={l} onChange={(e) => { const nl = [...(q.labels || LIKERT)]; nl[i] = e.target.value; onUpdate({ labels: nl }); }}
                      className="w-full text-[10px] text-center bg-transparent border-b border-[#0B2545]/8 focus:border-[#C5960C] outline-none py-0.5 text-[#0B2545]/45" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {q.type === 'multiple_choice' && (
            <div>
              <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-2">Options</label>
              <div className="space-y-2">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-[#0B2545]/12 shrink-0" />
                    <input type="text" value={opt} onChange={(e) => { const no = [...q.options]; no[i] = e.target.value; onUpdate({ options: no }); }} placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-2 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 transition-all placeholder:text-[#0B2545]/15" />
                    {q.options.length > 2 && <button onClick={() => onUpdate({ options: q.options.filter((_, j) => j !== i) })} className="p-1.5 rounded-md hover:bg-red-50 text-[#0B2545]/15 hover:text-[#B8352E] transition-colors">✕</button>}
                  </div>
                ))}
                <button onClick={() => onUpdate({ options: [...(q.options || []), ''] })} className="flex items-center gap-1.5 text-xs font-semibold text-[#C5960C] hover:text-[#b3870b] ml-6 transition-colors">+ Add option</button>
              </div>
            </div>
          )}
          {q.type === 'text' && <div className="bg-[#F5F1EC]/30 rounded-lg border border-dashed border-[#0B2545]/8 p-4"><p className="text-xs text-[#0B2545]/25 italic">Citizens will see a free-text input field here</p></div>}
          {q.type === 'yes_no' && <div className="flex gap-3"><div className="flex-1 bg-[#F5F1EC]/30 rounded-lg border border-[#0B2545]/8 p-3 text-center text-sm text-[#0B2545]/30 font-medium">Yes</div><div className="flex-1 bg-[#F5F1EC]/30 rounded-lg border border-[#0B2545]/8 p-3 text-center text-sm text-[#0B2545]/30 font-medium">No</div></div>}
          <div className="flex items-center justify-between pt-3 border-t border-[#0B2545]/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={q.required} onChange={(e) => onUpdate({ required: e.target.checked })} className="w-4 h-4 rounded border-[#0B2545]/15 text-[#C5960C] focus:ring-[#C5960C]/20" />
              <span className="text-xs font-medium text-[#0B2545]/45">Required</span>
            </label>
            <div className="flex items-center gap-1">
              <button onClick={() => onMove(-1)} disabled={idx === 0} className="p-1.5 rounded-md hover:bg-[#0B2545]/5 text-[#0B2545]/25 disabled:opacity-20 transition-colors" title="Move up">↑</button>
              <button onClick={() => onMove(1)} disabled={idx === total - 1} className="p-1.5 rounded-md hover:bg-[#0B2545]/5 text-[#0B2545]/25 disabled:opacity-20 transition-colors" title="Move down">↓</button>
              <span className="w-px h-4 bg-[#0B2545]/8 mx-1" />
              <button onClick={onDuplicate} className="p-1.5 rounded-md hover:bg-[#0B2545]/5 text-[#0B2545]/25 transition-colors" title="Duplicate">⧉</button>
              <button onClick={onRemove} className="p-1.5 rounded-md hover:bg-red-50 text-[#0B2545]/25 hover:text-[#B8352E] transition-colors" title="Delete">🗑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SurveyBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [surveyType, setSurveyType] = useState('5Q');
  const [urgency, setUrgency] = useState('normal');
  const [targetResponses, setTargetResponses] = useState('');
  const [demographicFilters, setDemographicFilters] = useState({ states: [], age_ranges: [] });
  const [questions, setQuestions] = useState([]);
  const [openQ, setOpenQ] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const addRef = useRef(null);

  useEffect(() => { if (isEdit) loadSurvey(); }, [id]);
  useEffect(() => {
    const handler = (e) => { if (addRef.current && !addRef.current.contains(e.target)) setShowAddMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function loadSurvey() {
    const { data } = await supabase.from('surveys').select('*').eq('id', id).single();
    if (data) { setTitle(data.title || ''); setDescription(data.description || ''); setSurveyType(data.type || '5Q'); setUrgency(data.urgency || 'normal'); setTargetResponses(data.target_responses?.toString() || ''); setDemographicFilters(data.demographic_filters || { states: [], age_ranges: [] }); setQuestions(data.questions || []); }
    setLoading(false);
  }

  function addQuestion(type) {
    const newQ = { id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type, text: '', required: true, ...(type === 'likert' ? { labels: [...LIKERT] } : {}), ...(type === 'multiple_choice' ? { options: ['', ''] } : {}) };
    setQuestions((prev) => [...prev, newQ]); setOpenQ(newQ.id); setShowAddMenu(false);
  }
  function updateQ(qId, updates) { setQuestions((prev) => prev.map((q) => q.id === qId ? { ...q, ...updates } : q)); }
  function removeQ(qId) { setQuestions((prev) => prev.filter((q) => q.id !== qId)); if (openQ === qId) setOpenQ(null); }
  function moveQ(qId, dir) { setQuestions((prev) => { const i = prev.findIndex((q) => q.id === qId); if ((dir === -1 && i === 0) || (dir === 1 && i === prev.length - 1)) return prev; const a = [...prev]; [a[i], a[i + dir]] = [a[i + dir], a[i]]; return a; }); }
  function duplicateQ(qId) { setQuestions((prev) => { const i = prev.findIndex((q) => q.id === qId); const copy = { ...prev[i], id: `q_${Date.now()}`, text: prev[i].text + ' (copy)' }; const a = [...prev]; a.splice(i + 1, 0, copy); return a; }); }

  async function handleSave(status = 'draft') {
    if (!title.trim()) return alert('Please enter a survey title.');
    if (questions.length === 0) return alert('Please add at least one question.');
    setSaving(true);
    const payload = { title: title.trim(), description: description.trim(), type: surveyType, urgency, target_responses: targetResponses ? parseInt(targetResponses) : null, demographic_filters: demographicFilters, questions, status };
    try {
      let error;
      if (isEdit) { ({ error } = await supabase.from('surveys').update(payload).eq('id', id)); } else { ({ error } = await supabase.from('surveys').insert([payload])); }
      if (error) throw error;
      navigate('/admin/surveys');
    } catch (err) { console.error('Save error:', err); alert('Failed to save: ' + (err.message || 'Unknown error')); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  if (showPreview) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(false)} className="text-sm font-medium text-[#0B2545]/50 hover:text-[#0B2545] transition-colors">← Back to Editor</button>
          <span className="text-[11px] px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-semibold">Preview Mode</span>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#0B2545]/5 shadow-sm overflow-hidden">
          <div className="bg-[#0B2545] px-8 py-7">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Libre Baskerville, serif' }}>{title || 'Untitled Survey'}</h2>
            {description && <p className="text-sm text-white/45 mt-2">{description}</p>}
          </div>
          <div className="p-8 space-y-8">
            {questions.length === 0 ? <p className="text-center text-sm text-[#0B2545]/25 py-12">No questions added yet</p> : questions.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm font-medium text-[#0B2545] mb-3"><span className="text-[#0B2545]/20 mr-1.5">{i + 1}.</span>{q.text || 'Untitled'}{q.required && <span className="text-[#B8352E] ml-1">*</span>}</p>
                {q.type === 'likert' && <div className="flex gap-2 ml-5">{(q.labels || LIKERT).map((l, j) => (<div key={j} className="flex-1 text-center"><div className="w-10 h-10 rounded-full border-2 border-[#0B2545]/8 flex items-center justify-center text-sm font-semibold text-[#0B2545]/35 mx-auto">{j + 1}</div><p className="text-[9px] text-[#0B2545]/25 mt-1.5">{l}</p></div>))}</div>}
                {q.type === 'multiple_choice' && <div className="space-y-2 ml-5">{(q.options || []).map((o, j) => (<div key={j} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#0B2545]/6"><span className="w-4 h-4 rounded-full border-2 border-[#0B2545]/12 shrink-0" /><span className="text-sm text-[#0B2545]/65">{o || 'Option'}</span></div>))}</div>}
                {q.type === 'text' && <textarea rows={3} disabled placeholder="Type your response..." className="w-full ml-5 px-3.5 py-2.5 text-sm bg-[#F5F1EC]/30 border border-[#0B2545]/8 rounded-lg resize-none placeholder:text-[#0B2545]/15" style={{ maxWidth: 'calc(100% - 1.25rem)' }} />}
                {q.type === 'yes_no' && <div className="flex gap-3 ml-5"><button className="flex-1 py-3 rounded-lg border-2 border-[#0B2545]/6 text-sm font-medium text-[#0B2545]/40">Yes</button><button className="flex-1 py-3 rounded-lg border-2 border-[#0B2545]/6 text-sm font-medium text-[#0B2545]/40">No</button></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all placeholder:text-[#0B2545]/15";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/surveys')} className="text-[#0B2545]/35 hover:text-[#0B2545] transition-colors">←</button>
          <div>
            <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{isEdit ? 'Edit Survey' : 'New Survey'}</h1>
            <p className="text-sm text-[#0B2545]/35 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)} className="px-4 py-2.5 border border-[#0B2545]/10 text-sm font-medium text-[#0B2545]/60 hover:text-[#0B2545] rounded-lg hover:bg-white transition-all">👁 Preview</button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="px-4 py-2.5 border border-[#0B2545]/10 text-sm font-medium text-[#0B2545]/60 hover:text-[#0B2545] rounded-lg hover:bg-white transition-all disabled:opacity-50">Save Draft</button>
          <button onClick={() => handleSave('active')} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50">{saving ? '...' : '🚀'} Publish</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#0B2545]/5 p-6 space-y-4">
        <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 2026 Community Infrastructure Priorities" className={`${inputClass} text-base font-semibold`} /></div>
        <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description..." className={`${inputClass} resize-none`} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Type</label><select value={surveyType} onChange={(e) => setSurveyType(e.target.value)} className={inputClass}><option value="5Q">Standard (5Q)</option><option value="10Q">Refined (10Q)</option><option value="custom">Custom</option></select></div>
          <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Urgency</label><select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={inputClass}><option value="normal">Normal</option><option value="priority">Priority</option><option value="urgent">Urgent</option></select></div>
          <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Target Responses</label><input type="number" value={targetResponses} onChange={(e) => setTargetResponses(e.target.value)} placeholder="e.g., 500" className={inputClass} /></div>
        </div>
      </div>

      <details className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden group">
        <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-[#0B2545]/60 hover:text-[#0B2545] transition-colors list-none flex items-center justify-between"><span>🎯 Demographic Targeting (optional)</span><span className="text-[#0B2545]/20 group-open:rotate-90 transition-transform">▸</span></summary>
        <div className="px-6 pb-5 pt-2 border-t border-[#0B2545]/5 space-y-3">
          <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-2">States</label><div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">{STATES_LIST.map((st) => (<button key={st} onClick={() => setDemographicFilters((p) => ({ ...p, states: p.states.includes(st) ? p.states.filter((s) => s !== st) : [...p.states, st] }))} className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${demographicFilters.states.includes(st) ? 'bg-[#C5960C]/10 border-[#C5960C]/30 text-[#C5960C]' : 'bg-white border-[#0B2545]/8 text-[#0B2545]/35'}`}>{st}</button>))}</div></div>
          <div><label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-2">Age Ranges</label><div className="flex flex-wrap gap-2">{AGES_LIST.map((age) => (<button key={age} onClick={() => setDemographicFilters((p) => ({ ...p, age_ranges: p.age_ranges.includes(age) ? p.age_ranges.filter((a) => a !== age) : [...p.age_ranges, age] }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${demographicFilters.age_ranges.includes(age) ? 'bg-[#C5960C]/10 border-[#C5960C]/30 text-[#C5960C]' : 'bg-white border-[#0B2545]/8 text-[#0B2545]/35'}`}>{age}</button>))}</div></div>
        </div>
      </details>

      <div className="space-y-3">
        <h2 className="font-semibold text-[#0B2545]/60 text-sm">Questions</h2>
        {questions.length === 0 && <div className="bg-white rounded-xl border border-dashed border-[#0B2545]/10 p-12 text-center"><p className="text-2xl mb-2">📋</p><p className="text-sm text-[#0B2545]/35 mb-4">No questions yet — add your first one</p></div>}
        {questions.map((q, i) => (
          <QuestionCard key={q.id} q={q} idx={i} total={questions.length} open={openQ === q.id}
            onToggle={() => setOpenQ(openQ === q.id ? null : q.id)} onUpdate={(updates) => updateQ(q.id, updates)}
            onRemove={() => removeQ(q.id)} onMove={(dir) => moveQ(q.id, dir)} onDuplicate={() => duplicateQ(q.id)} />
        ))}
        <div className="relative" ref={addRef}>
          <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full py-3 border-2 border-dashed border-[#0B2545]/8 rounded-xl text-sm font-semibold text-[#0B2545]/35 hover:text-[#C5960C] hover:border-[#C5960C]/30 transition-all">+ Add Question</button>
          {showAddMenu && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-[#0B2545]/8 shadow-xl z-10 p-2 space-y-1">
              {Q_TYPES.map((t) => (<button key={t.type} onClick={() => addQuestion(t.type)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-[#C5960C]/[0.04] transition-colors"><span className="text-lg">{t.icon}</span><span className="text-sm font-medium text-[#0B2545]">{t.label}</span></button>))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
