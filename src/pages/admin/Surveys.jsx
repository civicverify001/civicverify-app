// src/pages/admin/Surveys.jsx — with notifications on approve/reject
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const FILTERS = ['all', 'active', 'draft', 'pending_review', 'pending', 'closed'];

function StatusBadge({ status }) {
  const map = {
    active:         'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    draft:          'bg-amber-50 text-amber-700 border-amber-200/60',
    pending:        'bg-blue-50 text-blue-700 border-blue-200/60',
    pending_review: 'bg-purple-50 text-purple-700 border-purple-200/60',
    closed:         'bg-gray-50 text-gray-500 border-gray-200/60',
    rejected:       'bg-red-50 text-red-700 border-red-200/60',
  };
  const dots = {
    active: 'bg-emerald-500 animate-pulse', draft: 'bg-amber-500', pending: 'bg-blue-500',
    pending_review: 'bg-purple-500 animate-pulse', closed: 'bg-gray-400', rejected: 'bg-red-500',
  };
  const labels = { pending_review: 'Pending Review' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[status] || map.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.draft}`} />
      {labels[status] || (status?.charAt(0).toUpperCase() + status?.slice(1))}
    </span>
  );
}

async function sendNotification(userId, type, title, message, surveyId) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId, type, title, message,
      related_id: surveyId, read: false,
      created_at: new Date().toISOString(),
    });
  } catch(e) { console.warn('Notification insert failed:', e); }
}

export default function AdminSurveys() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

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

  async function updateStatus(id, newStatus, extra = {}) {
    if (newStatus === 'closed') extra.closed_at = new Date().toISOString();
    const { error } = await supabase.from('surveys').update({ status: newStatus, ...extra }).eq('id', id);
    if (!error) setSurveys(surveys.map(s => s.id === id ? { ...s, status: newStatus, ...extra } : s));
  }

  async function approveSurvey(survey) {
    await updateStatus(survey.id, 'active');
    if (survey.created_by) {
      await sendNotification(
        survey.created_by, 'survey_approved',
        'Survey Approved ✓',
        `Your survey "${survey.title}" has been approved and is now live.`,
        survey.id
      );
    }
  }

  async function rejectSurvey() {
    if (!rejectReason.trim()) return;
    const survey = surveys.find(s => s.id === rejectModal.id);
    await updateStatus(rejectModal.id, 'rejected', { rejection_reason: rejectReason });
    if (survey?.created_by) {
      await sendNotification(
        survey.created_by, 'survey_rejected',
        'Survey Requires Changes',
        `Your survey "${rejectModal.title}" was not approved. Reason: ${rejectReason}`,
        rejectModal.id
      );
    }
    setRejectModal(null);
    setRejectReason('');
  }

  async function deleteSurvey(id) {
    if (!confirm('Delete this survey? This cannot be undone.')) return;
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (!error) setSurveys(surveys.filter(s => s.id !== id));
  }

  const filterLabels = { all: 'All', active: 'Active', draft: 'Draft', pending_review: 'Pending Review', pending: 'Pending', closed: 'Closed' };

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
      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-[#0B2545] mb-1" style={{ fontFamily: 'Libre Baskerville, serif' }}>Reject Survey</h3>
            <p className="text-sm text-[#0B2545]/40 mb-4">Rejecting: <strong className="text-[#0B2545]/70">{rejectModal.title}</strong></p>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#0B2545]/30 mb-2">Reason for rejection</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this survey is being rejected..." rows={3}
              className="w-full px-4 py-3 text-sm border border-[#0B2545]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B8352E]/20 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 text-sm font-semibold text-[#0B2545]/40 bg-[#0B2545]/5 rounded-xl hover:bg-[#0B2545]/10 transition-colors">Cancel</button>
              <button onClick={rejectSurvey} disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#B8352E] rounded-xl hover:bg-[#a02e28] transition-colors disabled:opacity-40">Reject Survey</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Surveys</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">{surveys.length} total surveys</p>
        </div>
        <button onClick={() => navigate('/admin/surveys/new')} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm self-start">
          <span className="text-lg leading-none">+</span> New Survey
        </button>
      </div>

      {/* Pending review alert */}
      {counts['pending_review'] > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-purple-50 border border-purple-200/60 rounded-xl text-sm">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
          <span className="text-purple-700 font-medium">{counts['pending_review']} org survey{counts['pending_review'] !== 1 ? 's' : ''} awaiting review</span>
          <button onClick={() => setFilter('pending_review')} className="ml-auto text-xs font-bold text-purple-600 hover:text-purple-800 underline">Review now</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-wrap bg-white rounded-xl border border-[#0B2545]/[0.06] p-1 shadow-sm gap-0.5">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${filter === f ? 'bg-[#0B2545] text-white shadow-sm' : 'text-[#0B2545]/40 hover:text-[#0B2545]/70 hover:bg-[#0B2545]/[0.03]'}`}>
              {filterLabels[f]}
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
                  <tr key={s.id} className={`border-b border-[#0B2545]/[0.03] last:border-0 hover:bg-[#C5960C]/[0.02] transition-colors duration-150 ${s.status === 'pending_review' ? 'bg-purple-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0B2545]">{s.title}</p>
                      {s.description && <p className="text-[11px] text-[#0B2545]/30 mt-0.5 line-clamp-1 max-w-xs">{s.description}</p>}
                      {s.status === 'pending_review' && <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-1 inline-block">Org submitted</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4 text-[#0B2545]/40 text-[13px]">{s.organizations?.org_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#0B2545]/70 tabular-nums">{(s.response_count || 0).toLocaleString()}</span>
                      {s.target_responses && <span className="text-[#0B2545]/20"> / {s.target_responses.toLocaleString()}</span>}
                    </td>
                    <td className="px-6 py-4 text-[#0B2545]/30 text-[13px]">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {s.status === 'pending_review' && (
                          <button onClick={() => approveSurvey(s)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors" title="Approve">✓ Approve</button>
                        )}
                        {s.status === 'pending_review' && (
                          <button onClick={() => setRejectModal({ id: s.id, title: s.title })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-[#B8352E] transition-colors" title="Reject">✕ Reject</button>
                        )}
                        <button onClick={() => navigate(`/admin/surveys/${s.id}/edit`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#0B2545]/5 text-[#0B2545]/30 hover:text-[#0B2545] transition-all duration-150" title="Edit">✏️</button>
                        {s.status === 'draft' && <button onClick={() => updateStatus(s.id, 'active')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-emerald-50 text-[#0B2545]/30 hover:text-emerald-600 transition-all duration-150" title="Publish">🚀</button>}
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
            <div className="flex items-center gap-3 mt-2">
              {(search || filter !== 'all') && <button onClick={() => { setFilter('all'); setSearch(''); }} className="px-4 py-2 text-sm font-semibold text-[#0B2545]/40 hover:text-[#0B2545]/70 rounded-lg border border-[#0B2545]/10 transition-all">Clear filters</button>}
              <button onClick={() => navigate('/admin/surveys/new')} className="px-5 py-2 bg-[#C5960C] text-white text-sm font-semibold rounded-lg hover:bg-[#b3870b] transition-colors">+ New Survey</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
