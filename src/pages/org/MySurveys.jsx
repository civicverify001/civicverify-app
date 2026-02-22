// src/pages/org/MySurveys.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

function StatusBadge({ status }) {
  const map = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    closed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const dots = { active: 'bg-emerald-500 animate-pulse', pending: 'bg-blue-500', draft: 'bg-amber-500', closed: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[status] || map.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.draft}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function MySurveys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchSurveys(); }, [user]);

  async function fetchSurveys() {
    const { data: org } = await supabase.from('organizations').select('id').eq('user_id', user.id).single();
    if (org) {
      const { data } = await supabase.from('surveys').select('*').eq('org_id', org.id).order('created_at', { ascending: false });
      setSurveys(data || []);
    }
    setLoading(false);
  }

  const filtered = filter === 'all' ? surveys : surveys.filter((s) => s.status === filter);
  const counts = surveys.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {});

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>My Surveys</h1>
          <p className="text-sm text-[#0B2545]/40 mt-1">{surveys.length} total surveys</p>
        </div>
        <button onClick={() => navigate('/org/request')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm self-start">
          <span className="text-lg leading-none">+</span> New Request
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-white rounded-lg border border-[#0B2545]/8 p-1 w-fit overflow-x-auto">
        {['all', 'active', 'pending', 'closed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f ? 'bg-[#0B2545] text-white shadow-sm' : 'text-[#0B2545]/40 hover:text-[#0B2545]/60'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? surveys.length : counts[f] || 0})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/5">
                  <th className="px-5 py-3">Survey</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Responses</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const pct = s.target_responses ? Math.round(((s.response_count || 0) / s.target_responses) * 100) : null;
                  return (
                    <tr key={s.id} className="border-b border-[#0B2545]/5 last:border-0 hover:bg-[#C5960C]/[0.01] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#0B2545]">{s.title}</p>
                        <p className="text-[10px] text-[#0B2545]/25 mt-0.5">{s.type} · {(s.questions || []).length} questions</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-medium text-[#0B2545]/70 tabular-nums">{(s.response_count || 0).toLocaleString()}</span>
                          {pct !== null && (
                            <div className="w-20 h-1.5 rounded-full bg-[#0B2545]/5 overflow-hidden mt-1">
                              <div className="h-full rounded-full bg-[#C5960C]" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#0B2545]/35 tabular-nums">{s.target_responses?.toLocaleString() || '—'}</td>
                      <td className="px-5 py-3.5 text-[#0B2545]/30">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        {(s.status === 'active' || s.status === 'closed') && (
                          <button onClick={() => navigate(`/org/surveys/${s.id}/results`)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#C5960C] hover:bg-[#C5960C]/5 rounded-md transition-colors">
                            View Results →
                          </button>
                        )}
                        {s.status === 'pending' && (
                          <span className="text-[11px] text-blue-500">Under review</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#0B2545]/25">
              {filter !== 'all' ? 'No surveys in this category' : 'No surveys yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
