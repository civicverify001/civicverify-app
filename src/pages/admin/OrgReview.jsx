// src/pages/admin/OrgReview.jsx — Admin reviews org applications
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

export default function OrgReview() {
  var [orgs, setOrgs] = useState([]);
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('pending');
  var [rejectId, setRejectId] = useState(null);
  var [rejectReason, setRejectReason] = useState('');
  var [docUrl, setDocUrl] = useState(null);
  var [processing, setProcessing] = useState('');

  async function load() {
    setLoading(true);
    var r = await supabase.from('users').select('*').eq('role', 'org').order('created_at', { ascending: false });
    setOrgs(r.data || []);
    setLoading(false);
  }
  useEffect(function() { load(); }, []);

  async function approve(id) {
    setProcessing(id);
    await supabase.from('users').update({ org_status: 'approved', org_approved_at: new Date().toISOString() }).eq('id', id);
    setProcessing('');
    load();
  }

  async function reject(id) {
    if (!rejectReason.trim()) return;
    setProcessing(id);
    await supabase.from('users').update({ org_status: 'rejected', org_rejected_reason: rejectReason.trim() }).eq('id', id);
    setProcessing('');
    setRejectId(null);
    setRejectReason('');
    load();
  }

  async function viewDoc(path) {
    if (!path) return;
    var r = await supabase.storage.from('org-docs').createSignedUrl(path, 300);
    if (r.data && r.data.signedUrl) window.open(r.data.signedUrl, '_blank');
  }

  var filtered = orgs.filter(function(o) {
    if (tab === 'pending') return o.org_status === 'pending' && o.org_license_url;
    if (tab === 'approved') return o.org_status === 'approved';
    if (tab === 'rejected') return o.org_status === 'rejected';
    return true;
  });

  var pendingCount = orgs.filter(function(o) { return o.org_status === 'pending' && o.org_license_url; }).length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Organization Review</h1>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Review and approve organization applications</p>
        </div>
        {pendingCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: C.red, padding: '6px 14px', borderRadius: 20 }}>{pendingCount} pending</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(11,37,69,0.03)', borderRadius: 10, padding: 4 }}>
        {[{ k: 'pending', l: 'Pending' }, { k: 'approved', l: 'Approved' }, { k: 'rejected', l: 'Rejected' }, { k: 'all', l: 'All' }].map(function(t) {
          return <button key={t.k} onClick={function(){ setTab(t.k); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === t.k ? '#fff' : 'transparent', color: tab === t.k ? C.navy : 'rgba(11,37,69,0.35)', boxShadow: tab === t.k ? '0 1px 4px rgba(0,0,0,0.06)' : 'none' }}>{t.l}</button>;
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{tab === 'pending' ? '\u2705' : '\uD83D\uDCED'}</span>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, margin: '0 0 8px' }}>{tab === 'pending' ? 'All caught up!' : 'No organizations'}</p>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{tab === 'pending' ? 'No pending applications to review' : 'No organizations in this category'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map(function(o) {
            var isPending = o.org_status === 'pending' && o.org_license_url;
            var isApproved = o.org_status === 'approved';
            var isRejected = o.org_status === 'rejected';
            var statusColor = isApproved ? C.green : isRejected ? C.red : C.gold;
            var statusLabel = isApproved ? 'Approved' : isRejected ? 'Rejected' : isPending ? 'Pending Review' : 'Not Submitted';

            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>{o.org_name || o.full_name || 'Unnamed'}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: 0 }}>{o.email}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '12', padding: '4px 12px', borderRadius: 20 }}>{statusLabel}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'rgba(11,37,69,0.4)', marginBottom: 12 }}>
                    <span><strong style={{ color: 'rgba(11,37,69,0.25)' }}>Type:</strong> {o.org_type || 'N/A'}</span>
                    <span><strong style={{ color: 'rgba(11,37,69,0.25)' }}>Joined:</strong> {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}</span>
                    {o.state && <span><strong style={{ color: 'rgba(11,37,69,0.25)' }}>Location:</strong> {[o.city, o.state].filter(Boolean).join(', ')}</span>}
                    {isApproved && o.org_approved_at && <span><strong style={{ color: 'rgba(11,37,69,0.25)' }}>Approved:</strong> {new Date(o.org_approved_at).toLocaleDateString()}</span>}
                  </div>

                  {o.org_license_url && (
                    <button onClick={function(){ viewDoc(o.org_license_url); }} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', marginBottom: isPending ? 16 : 0 }}>{'\uD83D\uDCC4'} View Document</button>
                  )}

                  {isRejected && o.org_rejected_reason && (
                    <div style={{ background: C.red + '06', border: '1px solid ' + C.red + '12', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
                      <p style={{ fontSize: 12, color: C.red, margin: 0 }}><strong>Rejection reason:</strong> {o.org_rejected_reason}</p>
                    </div>
                  )}

                  {/* Actions for pending */}
                  {isPending && (
                    <div>
                      {rejectId === o.id ? (
                        <div style={{ background: 'rgba(11,37,69,0.02)', borderRadius: 10, padding: 16, marginTop: 8 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Rejection Reason <span style={{ color: C.red }}>*</span></label>
                          <textarea value={rejectReason} onChange={function(e){ setRejectReason(e.target.value); }} placeholder="Explain why..." rows={2} style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={function(){ setRejectId(null); setRejectReason(''); }} style={{ flex: 1, padding: 10, background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={function(){ reject(o.id); }} disabled={processing === o.id} style={{ flex: 1, padding: 10, background: C.red, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: processing === o.id ? 0.6 : 1 }}>{processing === o.id ? '...' : 'Confirm Reject'}</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                          <button onClick={function(){ approve(o.id); }} disabled={processing === o.id} style={{ flex: 1, padding: 12, background: C.green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: processing === o.id ? 0.6 : 1 }}>{processing === o.id ? '...' : '\u2713 Approve'}</button>
                          <button onClick={function(){ setRejectId(o.id); }} style={{ flex: 1, padding: 12, background: C.red + '10', color: C.red, border: '1px solid ' + C.red + '20', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{'\u2715'} Reject</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
