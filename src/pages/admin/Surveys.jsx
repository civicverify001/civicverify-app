// src/pages/admin/Surveys.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const FILTERS = ['all', 'active', 'draft', 'pending', 'closed'];

function StatusBadge({ status }) {
  const map = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft:   'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    closed:  'bg-gray-100 text-gray-500 border-gray-200',
  };
  const dots = { active: 'bg-emerald-500 animate-pulse', draft: 'bg-amber-500', pending: 'bg-blue-500', closed: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[status] || map.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.draft}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function UrgencyDot({ urgency }) {
  if (!urgency || urgency === 'normal') return null;
  const c = urgency === 'urgent' ? 'bg-[#B8352E]' : 'bg-amber-500';
  return <span className={`w-2 h-2 rounded-full ${c}`} title={urgency} />;
}

export default function AdminSurveys() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSurveys(); }, []);

  async function fetchSurveys() {
    const { data, error } = await supabase.from('surveys').select('*, organizations(org_name)').order('created_at', { ascending: false });
    if (!error) setSurveys(data || []);
    setLoading(false);
  }

  const filtered = surveys.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const counts = surveys.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {});

  async function updateStatus(id, newStatus) {
    const extra = newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {};
    const { error } = await supabase.from('surveys').update({ status: newStatus, ...extra }).eq('id', id);
    if (!error) setSurveys(surveys.map((s) => s.id === id ? { ...s, status: newStatus, ...extra } : s));
  }

  async function deleteSurvey(id) {
    if (!confirm('Delete this survey? This cannot be undone.')) return;
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (!error) setSurveys(surveys.filter((s) => s.id !== id));
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Surveys</h1>
          <p className="text-sm text-[#0B2545]/40 mt-1">{surveys.length} total</p>
        </div>
        <button onClick={() => navigate('/admin/surveys/new')} className="flex items-center gap-2 px-4 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm self-start">
          <span className="text-lg leading-none">+</span> New Survey
        </button>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex bg-white rounded-lg border border-[#0B2545]/8 p-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-[#0B2545] text-white shadow-sm' : 'text-[#0B2545]/45 hover:text-[#0B2545]/70'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} <span className="ml-1 opacity-60">({f === 'all' ? surveys.length : (counts[f] || 0)})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B2545]/25 text-sm">🔍</span>
          <input type="text" placeholder="Search surveys..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all placeholder:text-[#0B2545]/20" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/5">
                <th className="px-5 py-3">Survey</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Responses</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-[#0B2545]/5 last:border-0 hover:bg-[#C5960C]/[0.015] transition-colors">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-2"><UrgencyDot urgency={s.urgency} /><div><p className="font-medium text-[#0B2545]">{s.title}</p>{s.description && <p className="text-[11px] text-[#0B2545]/35 mt-0.5 line-clamp-1 max-w-xs">{s.description}</p>}</div></div></td>
                    <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3.5 text-[#0B2545]/50">{s.organizations?.org_name || '—'}</td>
                    <td className="px-5 py-3.5 text-[#0B2545]/50">{s.type || '—'}</td>
                    <td className="px-5 py-3.5 text-[#0B2545]/70 tabular-nums font-medium">{(s.response_count || 0).toLocaleString()}{s.target_responses && <span className="text-[#0B2545]/20"> / {s.target_responses}</span>}</td>
                    <td className="px-5 py-3.5 text-[#0B2545]/35">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/admin/surveys/${s.id}/edit`)} className="px-2 py-1.5 rounded-md hover:bg-[#0B2545]/5 text-[#0B2545]/35 hover:text-[#0B2545] text-xs font-medium transition-colors" title="Edit">✏️</button>
                        {s.status === 'draft' && <button onClick={() => updateStatus(s.id, 'active')} className="px-2 py-1.5 rounded-md hover:bg-emerald-50 text-[#0B2545]/35 hover:text-emerald-600 text-xs font-medium transition-colors" title="Publish">🚀</button>}
                        {s.status === 'pending' && <button onClick={() => updateStatus(s.id, 'active')} className="px-2 py-1.5 rounded-md hover:bg-emerald-50 text-[#0B2545]/35 hover:text-emerald-600 text-xs font-medium transition-colors" title="Approve">✅</button>}
                        {s.status === 'active' && <button onClick={() => updateStatus(s.id, 'closed')} className="px-2 py-1.5 rounded-md hover:bg-amber-50 text-[#0B2545]/35 hover:text-amber-600 text-xs font-medium transition-colors" title="Close">⏹️</button>}
                        <button onClick={() => deleteSurvey(s.id)} className="px-2 py-1.5 rounded-md hover:bg-red-50 text-[#0B2545]/35 hover:text-[#B8352E] text-xs font-medium transition-colors" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-[#0B2545]/25 mb-2">{search ? `No surveys matching "${search}"` : 'No surveys in this category'}</p>
            <button onClick={() => { setFilter('all'); setSearch(''); }} className="text-xs font-semibold text-[#C5960C] hover:underline mt-1">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
