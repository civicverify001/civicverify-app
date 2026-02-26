// src/pages/admin/Surveys.jsx — Rich navy/gold design with notifications
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', midNavy: '#163a64', gold: '#C5960C', darkGold: '#a07a0a', green: '#16a34a', red: '#ef4444', purple: '#7c3aed' };
var font = 'Libre Baskerville, Georgia, serif';
var FILTERS = ['all', 'active', 'draft', 'pending_review', 'pending', 'closed'];

var statusStyles = {
  active:         { bg: 'linear-gradient(135deg, #10b981, #059669)', dot: '#10b981', label: 'Active' },
  draft:          { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', dot: '#f59e0b', label: 'Draft' },
  pending:        { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', dot: '#3b82f6', label: 'Pending' },
  pending_review: { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', dot: '#8b5cf6', label: 'Pending Review' },
  closed:         { bg: 'linear-gradient(135deg, #6b7280, #4b5563)', dot: '#6b7280', label: 'Closed' },
  rejected:       { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', dot: '#ef4444', label: 'Rejected' },
};

var filterLabels = { all: 'All', active: 'Active', draft: 'Draft', pending_review: 'Pending Review', pending: 'Pending', closed: 'Closed' };

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
  var navigate = useNavigate();
  var [surveys, setSurveys] = useState([]);
  var [filter, setFilter] = useState('all');
  var [search, setSearch] = useState('');
  var [loading, setLoading] = useState(true);
  var [rejectModal, setRejectModal] = useState(null);
  var [rejectReason, setRejectReason] = useState('');

  useEffect(function() { fetchSurveys(); }, []);

  async function fetchSurveys() {
    var { data } = await supabase.from('surveys').select('*, organizations(org_name)').order('created_at', { ascending: false });
    setSurveys(data || []);
    setLoading(false);
  }

  var filtered = surveys.filter(function(s) {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !(s.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  var counts = {};
  surveys.forEach(function(s) { counts[s.status] = (counts[s.status] || 0) + 1; });

  async function updateStatus(id, newStatus, extra) {
    extra = extra || {};
    if (newStatus === 'closed') extra.closed_at = new Date().toISOString();
    var { error } = await supabase.from('surveys').update(Object.assign({ status: newStatus }, extra)).eq('id', id);
    if (!error) setSurveys(surveys.map(function(s) { return s.id === id ? Object.assign({}, s, { status: newStatus }, extra) : s; }));
  }

  async function approveSurvey(survey) {
    await updateStatus(survey.id, 'active');
    if (survey.created_by) {
      await sendNotification(survey.created_by, 'survey_approved', 'Survey Approved ✓', 'Your survey "' + survey.title + '" has been approved and is now live.', survey.id);
    }
  }

  async function rejectSurvey() {
    if (!rejectReason.trim()) return;
    var survey = surveys.find(function(s) { return s.id === rejectModal.id; });
    await updateStatus(rejectModal.id, 'rejected', { rejection_reason: rejectReason });
    if (survey && survey.created_by) {
      await sendNotification(survey.created_by, 'survey_rejected', 'Survey Requires Changes', 'Your survey "' + rejectModal.title + '" was not approved. Reason: ' + rejectReason, rejectModal.id);
    }
    setRejectModal(null);
    setRejectReason('');
  }

  async function deleteSurvey(id) {
    if (!confirm('Delete this survey? This cannot be undone.')) return;
    var { error } = await supabase.from('surveys').delete().eq('id', id);
    if (!error) setSurveys(surveys.filter(function(s) { return s.id !== id; }));
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 40, height: 40, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', marginTop: 14 }}>Loading surveys...</p>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .as-filter{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.2s ease}
        .as-filter:hover{transform:translateY(-1px)}
        .as-btn{cursor:pointer;border:none;font-family:DM Sans,sans-serif;transition:all 0.2s ease}
        .as-btn:hover{transform:translateY(-1px);opacity:0.9}
        .as-btn:active{transform:translateY(0)}
        .as-row{transition:all 0.15s ease}
        .as-row:hover{background:rgba(197,150,12,0.03)!important}
        .as-action{cursor:pointer;border:none;transition:all 0.15s ease;font-family:DM Sans,sans-serif}
        .as-action:hover{transform:scale(1.08)}
        .as-search:focus{border-color:rgba(197,150,12,0.4)!important;box-shadow:0 0 0 3px rgba(197,150,12,0.1)!important}
      `}</style>

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 22, padding: '28px', width: '100%', maxWidth: 440, margin: '0 16px', boxShadow: '0 24px 64px rgba(11,37,69,0.25)', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                <span style={{ fontSize: 20 }}>✕</span>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Reject Survey</h3>
                <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: '2px 0 0' }}>Rejecting: <strong style={{ color: C.navy }}>{rejectModal.title}</strong></p>
              </div>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 8px' }}>Reason for rejection</p>
            <textarea value={rejectReason} onChange={function(e) { setRejectReason(e.target.value); }}
              placeholder="Explain why this survey is being rejected..."
              style={{ width: '100%', padding: '14px 16px', fontSize: 13, border: '2px solid rgba(11,37,69,0.08)', borderRadius: 14, outline: 'none', resize: 'none', minHeight: 90, fontFamily: 'DM Sans, sans-serif', color: C.navy, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="as-btn" onClick={function() { setRejectModal(null); setRejectReason(''); }}
                style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)' }}>
                Cancel
              </button>
              <button className="as-btn" onClick={rejectSurvey} disabled={!rejectReason.trim()}
                style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, background: rejectReason.trim() ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(11,37,69,0.08)', color: rejectReason.trim() ? '#fff' : 'rgba(11,37,69,0.3)', boxShadow: rejectReason.trim() ? '0 4px 16px rgba(239,68,68,0.3)' : 'none' }}>
                Reject Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div style={{
        padding: '32px 36px', borderRadius: 22, marginBottom: 28,
        background: 'linear-gradient(135deg, #0B2545 0%, #163a64 50%, #1e4976 100%)',
        boxShadow: '0 8px 32px rgba(11,37,69,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(197,150,12,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(197,150,12,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(197,150,12,0.4)',
            }}>
              <span style={{ fontSize: 24 }}>📋</span>
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>Surveys</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>{surveys.length} total surveys</p>
            </div>
          </div>
          <button className="as-btn" onClick={function() { navigate('/admin/surveys/new'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 14,
              background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
              color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(197,150,12,0.4)',
            }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Survey
          </button>
        </div>
      </div>

      {/* Pending Review Alert */}
      {counts['pending_review'] > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', marginBottom: 20, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(124,58,237,0.1))',
          border: '2px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.purple, animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6', flex: 1 }}>
            {counts['pending_review']} org survey{counts['pending_review'] !== 1 ? 's' : ''} awaiting review
          </span>
          <button className="as-btn" onClick={function() { setFilter('pending_review'); }}
            style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', boxShadow: '0 2px 8px rgba(139,92,246,0.3)' }}>
            Review now →
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { key: 'active', label: 'Active', icon: '🟢', gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.2)' },
          { key: 'draft', label: 'Drafts', icon: '📝', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.2)' },
          { key: 'pending_review', label: 'Review', icon: '🔍', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139,92,246,0.2)' },
          { key: 'closed', label: 'Closed', icon: '⏸', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)', shadow: 'rgba(107,114,128,0.2)' },
        ].map(function(s) {
          return (
            <div key={s.key} onClick={function() { setFilter(s.key); }} style={{
              padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
              background: filter === s.key ? s.gradient : '#fff',
              border: filter === s.key ? 'none' : '1px solid rgba(11,37,69,0.06)',
              boxShadow: filter === s.key ? '0 4px 16px ' + s.shadow : '0 2px 8px rgba(11,37,69,0.03)',
              transition: 'all 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: filter === s.key ? 'rgba(255,255,255,0.7)' : 'rgba(11,37,69,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{s.label}</span>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: filter === s.key ? '#fff' : C.navy, margin: 0, fontFamily: 'monospace' }}>{counts[s.key] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Filter + Search Bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center',
        padding: '14px 18px', borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(11,37,69,0.03), rgba(11,37,69,0.06))',
        border: '1px solid rgba(11,37,69,0.05)',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {FILTERS.map(function(f) {
            var active = filter === f;
            return (
              <button key={f} className="as-filter" onClick={function() { setFilter(f); }}
                style={{
                  padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: active ? 700 : 500,
                  background: active ? 'linear-gradient(135deg, ' + C.navy + ', ' + C.midNavy + ')' : '#fff',
                  color: active ? '#fff' : 'rgba(11,37,69,0.5)',
                  boxShadow: active ? '0 3px 12px rgba(11,37,69,0.2)' : '0 1px 3px rgba(11,37,69,0.04)',
                }}>
                {filterLabels[f]}
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, opacity: 0.6 }}>{f === 'all' ? surveys.length : (counts[f] || 0)}</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', width: 220 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(11,37,69,0.25)' }}>🔍</span>
          <input className="as-search" type="text" placeholder="Search surveys..." value={search} onChange={function(e) { setSearch(e.target.value); }}
            style={{ width: '100%', padding: '9px 14px 9px 36px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, outline: 'none', color: C.navy, fontFamily: 'DM Sans, sans-serif', background: '#fff', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Survey Table */}
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(11,37,69,0.06)',
        boxShadow: '0 4px 20px rgba(11,37,69,0.05)',
        background: '#fff',
      }}>
        {filtered.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(11,37,69,0.06)', background: 'linear-gradient(135deg, rgba(11,37,69,0.02), rgba(11,37,69,0.04))' }}>
                  {['Survey', 'Status', 'Organization', 'Responses', 'Created', 'Actions'].map(function(h, i) {
                    return <th key={h} style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map(function(s, idx) {
                  var ss = statusStyles[s.status] || statusStyles.draft;
                  var isPendingReview = s.status === 'pending_review';
                  return (
                    <tr key={s.id} className="as-row" style={{
                      borderBottom: '1px solid rgba(11,37,69,0.04)',
                      background: isPendingReview ? 'rgba(139,92,246,0.03)' : 'transparent',
                      animation: 'fadeIn 0.3s ease ' + (idx * 0.02) + 's both',
                    }}>
                      {/* Survey */}
                      <td style={{ padding: '16px 20px', maxWidth: 300 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 3px', fontFamily: font, lineHeight: 1.3 }}>{s.title}</p>
                        {s.description && <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{s.description}</p>}
                        {isPendingReview && <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 700, color: '#7c3aed', background: 'rgba(139,92,246,0.08)', padding: '2px 8px', borderRadius: 6 }}>Org submitted</span>}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8,
                          fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: '#fff',
                          background: ss.bg,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: 0.6 }} />
                          {ss.label}
                        </span>
                      </td>
                      {/* Organization */}
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'rgba(11,37,69,0.45)' }}>
                        {(s.organizations && s.organizations.org_name) || '—'}
                      </td>
                      {/* Responses */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: 'monospace' }}>{(s.response_count || 0).toLocaleString()}</span>
                        {s.target_responses && <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)' }}> / {s.target_responses.toLocaleString()}</span>}
                        {s.target_responses && (function() {
                          var pct = Math.min(100, Math.round(((s.response_count || 0) / s.target_responses) * 100));
                          return (
                            <div style={{ marginTop: 6, width: 80, height: 4, background: 'rgba(11,37,69,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: pct >= 100 ? C.green : 'linear-gradient(90deg, ' + C.gold + ', #E8A838)', transition: 'width 0.5s' }} />
                            </div>
                          );
                        })()}
                      </td>
                      {/* Created */}
                      <td style={{ padding: '16px 20px', fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          {isPendingReview && (
                            <button className="as-action" onClick={function() { approveSurvey(s); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
                              ✓ Approve
                            </button>
                          )}
                          {isPendingReview && (
                            <button className="as-action" onClick={function() { setRejectModal({ id: s.id, title: s.title }); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: C.red }}>
                              ✕ Reject
                            </button>
                          )}
                          <button className="as-action" onClick={function() { navigate('/admin/surveys/' + s.id + '/edit'); }}
                            style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,37,69,0.04)', color: 'rgba(11,37,69,0.4)', fontSize: 14 }}
                            title="Edit">
                            ✏️
                          </button>
                          {s.status === 'draft' && (
                            <button className="as-action" onClick={function() { updateStatus(s.id, 'active'); }}
                              style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.06)', color: C.green, fontSize: 14 }}
                              title="Publish">
                              🚀
                            </button>
                          )}
                          {s.status === 'active' && (
                            <button className="as-action" onClick={function() { updateStatus(s.id, 'closed'); }}
                              style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.06)', color: '#d97706', fontSize: 14 }}
                              title="Close">
                              ⏸
                            </button>
                          )}
                          <button className="as-action" onClick={function() { deleteSurvey(s.id); }}
                            style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.04)', color: 'rgba(11,37,69,0.3)', fontSize: 14 }}
                            title="Delete">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, marginBottom: 18,
              background: 'linear-gradient(135deg, rgba(197,150,12,0.08), rgba(197,150,12,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 32 }}>📋</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>
              {search ? 'No surveys matching "' + search + '"' : 'No surveys in this category'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 18px' }}>
              {search || filter !== 'all' ? 'Try adjusting your filters' : 'Create your first survey to get started'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(search || filter !== 'all') && (
                <button className="as-btn" onClick={function() { setFilter('all'); setSearch(''); }}
                  style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)' }}>
                  Clear filters
                </button>
              )}
              <button className="as-btn" onClick={function() { navigate('/admin/surveys/new'); }}
                style={{ padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')', color: '#fff', boxShadow: '0 3px 12px rgba(197,150,12,0.3)' }}>
                + New Survey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

