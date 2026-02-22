// src/pages/admin/ReviewQueue.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function ReviewQueue() {
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  async function fetch() {
    const { data } = await supabase
      .from('surveys')
      .select('*, organizations(org_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPending(data || []);
    setLoading(false);
  }

  async function handleAction(id, action) {
    const newStatus = action === 'approve' ? 'active' : 'draft';
    const { error } = await supabase.from('surveys').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setPending((p) => p.filter((s) => s.id !== id));
      setSelected(null);
      setNote('');
    }
  }

  const survey = pending.find((s) => s.id === selected);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Review Queue</h1>
        <p className="text-sm text-[#0B2545]/40 mt-1">{pending.length} pending submission{pending.length !== 1 ? 's' : ''}</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0B2545]/5 p-16 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm text-[#0B2545]/35">All caught up — no surveys pending review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="lg:col-span-1 space-y-2">
            {pending.map((s) => (
              <button key={s.id} onClick={() => { setSelected(s.id); setNote(''); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected === s.id ? 'border-[#C5960C]/30 bg-[#C5960C]/[0.03] shadow-sm' : 'border-[#0B2545]/5 bg-white hover:border-[#0B2545]/10'
                }`}>
                <p className="text-sm font-semibold text-[#0B2545] mb-1">{s.title}</p>
                <p className="text-[11px] text-[#0B2545]/35">{s.organizations?.org_name || 'Unknown org'}</p>
                <p className="text-[11px] text-[#0B2545]/25 mt-1">
                  {new Date(s.created_at).toLocaleDateString()} · {s.type || '5Q'} · {(s.questions || []).length} questions
                </p>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {survey ? (
              <div className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
                <div className="p-6 border-b border-[#0B2545]/5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h2>
                      {survey.description && <p className="text-sm text-[#0B2545]/45 mt-1">{survey.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#0B2545]/30">
                      <span className="px-2 py-1 bg-[#0B2545]/[0.04] rounded">{survey.type || '5Q'}</span>
                      {survey.urgency && survey.urgency !== 'normal' && (
                        <span className={`px-2 py-1 rounded ${survey.urgency === 'urgent' ? 'bg-[#B8352E]/10 text-[#B8352E]' : 'bg-amber-50 text-amber-700'}`}>
                          {survey.urgency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-[11px] text-[#0B2545]/30">
                    <span>Org: <strong className="text-[#0B2545]/50">{survey.organizations?.org_name}</strong></span>
                    <span>Target: <strong className="text-[#0B2545]/50">{survey.target_responses || '—'}</strong></span>
                    <span>Submitted: <strong className="text-[#0B2545]/50">{new Date(survey.created_at).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Questions Preview */}
                <div className="p-6 space-y-5 max-h-[400px] overflow-y-auto">
                  <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider">Questions Preview</h3>
                  {(survey.questions || []).map((q, i) => (
                    <div key={q.id || i} className="pl-4 border-l-2 border-[#0B2545]/5">
                      <p className="text-sm text-[#0B2545]/70">
                        <span className="text-[#0B2545]/25 mr-1.5">{i + 1}.</span>
                        {q.text || 'Untitled'}
                        {q.required && <span className="text-[#B8352E] ml-1 text-xs">*</span>}
                      </p>
                      <p className="text-[10px] text-[#0B2545]/25 mt-0.5 capitalize">{q.type?.replace('_', ' ')}</p>
                      {q.options && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {q.options.map((o, j) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 bg-[#0B2545]/[0.03] rounded text-[#0B2545]/40">{o}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!survey.questions || survey.questions.length === 0) && (
                    <p className="text-sm text-[#0B2545]/25 italic">No questions found</p>
                  )}
                </div>

                {/* Action area */}
                <div className="p-6 border-t border-[#0B2545]/5 space-y-3">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                    placeholder="Optional note to organization..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 transition-all resize-none placeholder:text-[#0B2545]/15" />
                  <div className="flex gap-3">
                    <button onClick={() => handleAction(survey.id, 'approve')}
                      className="flex-1 py-2.5 bg-[#22863A] hover:bg-[#1e7a35] text-white text-sm font-semibold rounded-lg transition-colors">
                      ✓ Approve & Activate
                    </button>
                    <button onClick={() => handleAction(survey.id, 'reject')}
                      className="flex-1 py-2.5 bg-white border border-[#B8352E]/20 text-[#B8352E] text-sm font-semibold rounded-lg hover:bg-[#B8352E]/5 transition-colors">
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#0B2545]/5 flex items-center justify-center h-64">
                <p className="text-sm text-[#0B2545]/25">Select a submission to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
