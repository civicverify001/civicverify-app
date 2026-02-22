// src/pages/admin/ReviewQueue.jsx — Polished
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AdminReviewQueue() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('surveys').select('*, organizations(org_name)').eq('status', 'pending').order('created_at', { ascending: true })
      .then(({ data }) => { setPending(data || []); setLoading(false); });
  }, []);

  async function review(id, action) {
    const status = action === 'approve' ? 'active' : 'closed';
    const { error } = await supabase.from('surveys').update({ status }).eq('id', id);
    if (!error) setPending(pending.filter(s => s.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Review Queue</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">{pending.length} pending submissions</p>
      </div>

      {pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full border border-blue-200/60">Pending Review</span>
                    {s.organizations?.org_name && <span className="text-xs text-[#0B2545]/30">from {s.organizations.org_name}</span>}
                  </div>
                  <h3 className="text-lg font-bold text-[#0B2545]">{s.title}</h3>
                  {s.description && <p className="text-sm text-[#0B2545]/40 mt-1 line-clamp-2">{s.description}</p>}
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#0B2545]/25">
                    <span>📝 {(s.questions || []).length} questions</span>
                    <span>📅 {new Date(s.created_at).toLocaleDateString()}</span>
                    {s.target_state && <span>📍 {s.target_state}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => review(s.id, 'reject')} className="px-4 py-2 text-sm font-semibold text-[#B8352E] bg-red-50 hover:bg-red-100 rounded-xl border border-red-200/60 transition-all duration-200">Reject</button>
                  <button onClick={() => review(s.id, 'approve')} className="px-4 py-2 text-sm font-semibold text-white bg-[#22863A] hover:bg-[#1d7533] rounded-xl shadow-sm transition-all duration-200">Approve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] shadow-sm py-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-4xl mb-5">✅</div>
          <p className="text-lg font-semibold text-[#0B2545]/30">All caught up!</p>
          <p className="text-sm text-[#0B2545]/20 mt-1">No surveys pending review</p>
        </div>
      )}
    </div>
  );
}
