// src/pages/admin/Surveys.jsx — Polished
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const FILTERS = ['all', 'active', 'draft', 'pending', 'closed'];

function StatusBadge({ status }) {
  const map = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    draft:   'bg-amber-50 text-amber-700 border-amber-200/60',
    pending: 'bg-blue-50 text-blue-700 border-blue-200/60',
    closed:  'bg-gray-50 text-gray-500 border-gray-200/60',
  };
  const dots = { active: 'bg-emerald-500 animate-pulse', draft: 'bg-amber-500', pending: 'bg-blue-500', closed: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[status] || map.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.draft}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function AdminSurveys() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSurveys(); }, []);

  async function fetchSurveys() {
    const { data } = await supabase.from('surveys').select('*, organizations(org_name)').order('created_at', { ascending: false });
    setSurveys(data || []);
    setLoading(false);
  }

  const filtered = surveys.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const counts = surveys.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {});

  async function updateStatus(id, newStatus) {
    const extra = newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {};
    const { error } = await supabase.from('surveys').update({ status: newStatus, ...extra }).eq('id', id);
    if (!error) setSurveys(surveys.map(s => s.id === id ? { ...s, status: newStatus, ...extra } : s));
  }

  async function deleteSurvey(id) {
    if (!confirm('Delete this survey? This cannot be undone.')) return;
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (!error) setSurveys(surveys.filter(s => s.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#0B2545]/30 font-medium">Loading surveys...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Surveys</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">{surveys.length} total surveys</p>
        </div>
        <button onClick={() => navigate('/admin/surveys/new')} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 self-start">
          <span className="text-lg leading-none">+</span> New Survey
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex bg-white rounded-xl border border-[#0B2545]/[0.06] p-1 shadow-sm">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                filter === f
                  ? 'bg-[#0B2545] text-white shadow-sm'
                  : 'text-[#0B2545]/40 hover:text-[#0B2545]/70 hover:bg-[#0B2545]/[0.03]'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-50">{f === 'all' ? surveys.length : (counts[f] || 0)}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B2545]/20 text-sm">🔍</span>
          <input type="text" placeholder="Search surveys..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#0B2545]/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all duration-200 placeholder:text-[#0B2545]/20 shadow-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/[0.04] bg-[#0B2545]/[0.01]">
                  <th className="px-6 py-3.5">Survey</th><th className="px-6 py-3.5">Status</th><th className="px-6 py-3.5">Organization</th><th className="px-6 py-3.5">Responses</th><th className="px-6 py-3.5">Created</th><th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-[#0B2545]/[0.03] last:border-0 hover:bg-[#C5960C]/[0.02] transition-colors duration-150">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0B2545]">{s.title}</p>
                      {s.description && <p className="text-[11px] text-[#0B2545]/30 mt-0.5 line-clamp-1 max-w-xs">{s.description}</p>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4 text-[#0B2545]/40 text-[13px]">{s.organizations?.org_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#0B2545]/70 tabular-nums">{(s.response_count || 0).toLocaleString()}</span>
                      {s.target_responses && <span className="text-[#0B2545]/20"> / {s.target_responses}</span>}
                    </td>
                    <td className="px-6 py-4 text-[#0B2545]/30 text-[13px]">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/admin/surveys/${s.id}/edit`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#0B2545]/5 text-[#0B2545]/30 hover:text-[#0B2545] transition-all duration-150" title="Edit">✏️</button>
                        {s.status === 'draft' && <button onClick={() => updateStatus(s.id, 'active')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-50 text-[#0B2545]/30 hover:text-emerald-600 transition-all duration-150" title="Publish">🚀</button>}
                        {s.status === 'pending' && <button onClick={() => updateStatus(s.id, 'active')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-50 text-[#0B2545]/30 hover:text-emerald-600 transition-all duration-150" title="Approve">✓</button>}
                        {s.status === 'active' && <button onClick={() => updateStatus(s.id, 'closed')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-50 text-[#0B2545]/30 hover:text-amber-600 transition-all duration-150" title="Close">⏸</button>}
                        <button onClick={() => deleteSurvey(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#0B2545]/30 hover:text-[#B8352E] transition-all duration-150" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-3xl mb-5">📋</div>
            <p className="text-base font-semibold text-[#0B2545]/25 mb-1">{search ? `No surveys matching "${search}"` : 'No surveys in this category'}</p>
            <p className="text-sm text-[#0B2545]/20 mb-4">Get started by creating your first survey</p>
            <div className="flex items-center gap-3">
              {(search || filter !== 'all') && <button onClick={() => { setFilter('all'); setSearch(''); }} className="px-4 py-2 text-sm font-semibold text-[#0B2545]/40 hover:text-[#0B2545]/70 rounded-lg border border-[#0B2545]/10 hover:border-[#0B2545]/20 transition-all duration-200">Clear filters</button>}
              <button onClick={() => navigate('/admin/surveys/new')} className="px-5 py-2 bg-[#C5960C] text-white text-sm font-semibold rounded-lg hover:bg-[#b3870b] transition-colors">+ New Survey</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
