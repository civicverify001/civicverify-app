// src/pages/org/MySurveys.jsx — Polished
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function OrgMySurveys() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('surveys').select('*').eq('org_id', profile?.org_id).order('created_at', { ascending: false })
      .then(({ data }) => { setSurveys(data || []); setLoading(false); });
  }, [profile]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>My Surveys</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">{surveys.length} surveys</p>
        </div>
        <button onClick={() => navigate('/org/request')} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20">
          <span className="text-lg">+</span> New Request
        </button>
      </div>

      {surveys.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/[0.04] bg-[#0B2545]/[0.01]">
                <th className="px-6 py-3.5">Survey</th><th className="px-6 py-3.5">Status</th><th className="px-6 py-3.5">Responses</th><th className="px-6 py-3.5">Created</th><th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map(s => (
                <tr key={s.id} className="border-b border-[#0B2545]/[0.03] last:border-0 hover:bg-[#C5960C]/[0.015] transition-colors duration-150">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#0B2545]">{s.title}</p>
                    {s.description && <p className="text-[11px] text-[#0B2545]/30 mt-0.5 line-clamp-1">{s.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      s.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                      s.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                      s.status === 'closed' ? 'bg-gray-50 text-gray-500 border-gray-200/60' :
                      'bg-amber-50 text-amber-700 border-amber-200/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500 animate-pulse' : s.status === 'pending' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      {s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#0B2545]/50 tabular-nums">{s.response_count || 0}</td>
                  <td className="px-6 py-4 text-[#0B2545]/30">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {s.status === 'active' || s.status === 'closed' ? (
                      <button onClick={() => navigate(`/org/surveys/${s.id}/results`)}
                        className="px-4 py-2 text-xs font-semibold text-[#C5960C] bg-[#C5960C]/5 hover:bg-[#C5960C]/10 rounded-lg transition-all duration-200">
                        View Results →
                      </button>
                    ) : (
                      <span className="text-xs text-[#0B2545]/20">Awaiting approval</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] py-20 flex flex-col items-center text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-3xl mb-5">📋</div>
          <p className="text-base font-semibold text-[#0B2545]/25">No surveys yet</p>
          <p className="text-sm text-[#0B2545]/20 mt-1">Request your first survey to get started</p>
          <button onClick={() => navigate('/org/request')} className="mt-4 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200">Request a Survey</button>
        </div>
      )}
    </div>
  );
}
