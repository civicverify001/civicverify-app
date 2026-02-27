// src/pages/admin/Moderation.jsx — Full content moderation dashboard
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', green: '#16a34a', red: '#ef4444', orange: '#f59e0b', muted: '#64748b', border: 'rgba(11,37,69,0.08)' };
const font = 'Libre Baskerville, Georgia, serif';
const sans = 'DM Sans, system-ui, sans-serif';

function Ico({ d, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function Avatar({ name, url, size = 36 }) {
  const i = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + C.gold + '22', flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,' + C.navy + ',#122e56)', border: '2px solid ' + C.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontSize: size * 0.33, fontWeight: 700, color: C.gold, flexShrink: 0 }}>{i}</div>;
}

function timeAgo(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return new Date(ts).toLocaleDateString();
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid ' + C.border, flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          <Ico d={icon} size={18} />
        </div>
      </div>
      <p style={{ fontFamily: font, fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: C.muted, margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
function Badge({ text, color }) {
  return (
    <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: color + '15', color: color }}>
      {text}
    </span>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontFamily: font, fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 10px' }}>{title}</h3>
        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid ' + C.border, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: C.navy }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: confirmColor || C.red, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Moderation() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reportFilter, setReportFilter] = useState('pending');
  const [confirm, setConfirm] = useState(null);
  const [detailReport, setDetailReport] = useState(null);

  useEffect(() => { init(); }, []);

  async function init() {
    setLoading(true);
    await Promise.all([fetchStats(), fetchReports(), fetchUsers(), fetchPosts(), fetchActions()]);
    setLoading(false);
  }

  async function fetchStats() {
    const { data } = await supabase.rpc('get_admin_mod_stats');
    if (data) setStats(data);
  }

  async function fetchReports() {
    const { data } = await supabase.from('content_reports')
      .select('*, reporter:reporter_id(full_name), reported_user:reported_user_id(full_name, avatar_url, identity_verified), post:post_id(content, user_id), comment:comment_id(content)')
      .order('created_at', { ascending: false }).limit(100);
    setReports(data || []);
  }

  async function fetchUsers() {
    const { data } = await supabase.from('users')
      .select('id, full_name, email, role, identity_verified, is_verified, is_banned, is_suspended, suspended_until, warnings_count, avatar_url, created_at')
      .eq('role', 'citizen').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []);
  }

  async function fetchPosts() {
    const { data } = await supabase.from('community_posts')
      .select('id, content, image_url, likes_count, dislikes_count, comments_count, is_hidden, hidden_reason, created_at, user_id, users:user_id(full_name, avatar_url)')
      .order('created_at', { ascending: false }).limit(100);
    setPosts(data || []);
  }

  async function fetchActions() {
    const { data } = await supabase.from('mod_actions')
      .select('*, admin:admin_id(full_name), target_user:target_user_id(full_name)')
      .order('created_at', { ascending: false }).limit(50);
    setActions(data || []);
  }

  // ── Moderation Actions ──────────────────────────────────────────────────

  async function logAction(type, targetUserId, targetPostId, details) {
    await supabase.from('mod_actions').insert({
      admin_id: user.id, target_user_id: targetUserId,
      target_post_id: targetPostId, action_type: type, details
    });
  }

  async function warnUser(u) {
    await supabase.from('users').update({ warnings_count: (u.warnings_count || 0) + 1 }).eq('id', u.id);
    await logAction('warn', u.id, null, 'Warning issued');
    await supabase.from('notifications').insert({ user_id: u.id, type: 'warning', content: 'You have received a warning from moderators. Please review community guidelines.', is_read: false });
    fetchUsers(); fetchActions();
  }

  async function suspendUser(u, days) {
    const until = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from('users').update({ is_suspended: true, suspended_until: until }).eq('id', u.id);
    await logAction('suspend', u.id, null, 'Suspended for ' + days + ' days');
    await supabase.from('notifications').insert({ user_id: u.id, type: 'suspension', content: 'Your account has been suspended for ' + days + ' days.', is_read: false });
    fetchUsers(); fetchActions();
  }

  async function banUser(u) {
    await supabase.from('users').update({ is_banned: true }).eq('id', u.id);
    await logAction('ban', u.id, null, 'Account banned');
    fetchUsers(); fetchActions(); fetchStats();
  }

  async function unbanUser(u) {
    await supabase.from('users').update({ is_banned: false, is_suspended: false, suspended_until: null }).eq('id', u.id);
    await logAction('unban', u.id, null, 'Ban/suspension removed');
    fetchUsers(); fetchActions(); fetchStats();
  }

  async function hidePost(p, reason) {
    await supabase.from('community_posts').update({ is_hidden: true, hidden_reason: reason || 'Removed by moderator', hidden_by: user.id }).eq('id', p.id);
    await logAction('hide_post', p.user_id, p.id, reason || 'Content violation');
    fetchPosts(); fetchActions(); fetchStats();
  }

  async function unhidePost(p) {
    await supabase.from('community_posts').update({ is_hidden: false, hidden_reason: null, hidden_by: null }).eq('id', p.id);
    await logAction('unhide_post', p.user_id, p.id, 'Post restored');
    fetchPosts(); fetchActions();
  }

  async function deletePost(p) {
    await logAction('delete_post', p.user_id, p.id, 'Post permanently deleted');
    await supabase.from('community_posts').delete().eq('id', p.id);
    fetchPosts(); fetchActions(); fetchStats();
  }

  async function resolveReport(r, resolution) {
    await supabase.from('content_reports').update({ status: 'resolved', resolution, resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', r.id);
    await logAction('resolve_report', r.reported_user_id, r.post_id, resolution);
    fetchReports(); fetchActions(); fetchStats();
  }

  async function dismissReport(r) {
    await supabase.from('content_reports').update({ status: 'dismissed', resolution: 'No action needed', resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', r.id);
    await logAction('dismiss_report', r.reported_user_id, r.post_id, 'Report dismissed');
    fetchReports(); fetchActions(); fetchStats();
  }

  // ── Tab content renderers ──────────────────────────────────────────────

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'reports', label: 'Reports', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z', count: stats.pending_reports },
    { id: 'users', label: 'Users', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'posts', label: 'Posts', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { id: 'log', label: 'Action Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ];

  // ═══════════ OVERVIEW ═══════════════════════════════════════════════════
  function renderOverview() {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label="Total Citizens" value={stats.total_users || 0} color={C.navy} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          <StatCard label="Verified" value={stats.verified_users || 0} color={C.green} icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          <StatCard label="Banned" value={stats.banned_users || 0} color={C.red} icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          <StatCard label="Pending Reports" value={stats.pending_reports || 0} color={C.orange} icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          <StatCard label="Total Posts" value={stats.total_posts || 0} color="#6366f1" icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          <StatCard label="Hidden Posts" value={stats.hidden_posts || 0} color={C.muted} icon="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
          <StatCard label="Active Surveys" value={stats.active_surveys || 0} color={C.gold} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <StatCard label="Total Responses" value={stats.total_responses || 0} color="#8b5cf6" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </div>

        {/* Recent reports quick view */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + C.border }}>
            <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Recent Reports</h3>
            <button onClick={() => setTab('reports')} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {reports.filter(r => r.status === 'pending').length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: C.muted }}>No pending reports — all clear!</p>
            </div>
          ) : reports.filter(r => r.status === 'pending').slice(0, 5).map(r => (
            <div key={r.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid ' + C.border }}>
              <Avatar name={r.reported_user?.full_name} url={r.reported_user?.avatar_url} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{r.reported_user?.full_name || 'Unknown'}</p>
                <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}: {r.details || 'No details'}</p>
              </div>
              <Badge text={r.status} color={r.status === 'pending' ? C.orange : C.green} />
              <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(r.created_at)}</span>
            </div>
          ))}
        </div>

        {/* Recent mod actions */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.border }}>
            <h3 style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Recent Mod Actions</h3>
          </div>
          {actions.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: C.muted }}>No actions taken yet</p>
            </div>
          ) : actions.slice(0, 8).map(a => {
            const colors = { warn: C.orange, suspend: C.orange, ban: C.red, unban: C.green, hide_post: C.muted, unhide_post: C.green, delete_post: C.red, dismiss_report: C.muted, resolve_report: C.green };
            return (
              <div key={a.id} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid ' + C.border, fontSize: 13 }}>
                <Badge text={a.action_type.replace('_', ' ')} color={colors[a.action_type] || C.muted} />
                <span style={{ color: C.navy, fontWeight: 500 }}>{a.target_user?.full_name || '—'}</span>
                <span style={{ color: C.muted }}>by {a.admin?.full_name || 'admin'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{timeAgo(a.created_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════════ REPORTS ════════════════════════════════════════════════════
  function renderReports() {
    const filtered = reports.filter(r => reportFilter === 'all' || r.status === reportFilter);
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['pending', 'resolved', 'dismissed', 'all'].map(f => (
            <button key={f} onClick={() => setReportFilter(f)} style={{
              padding: '7px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', textTransform: 'capitalize',
              background: reportFilter === f ? C.navy : '#fff',
              color: reportFilter === f ? '#fff' : C.muted,
              boxShadow: reportFilter === f ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {f} {f === 'pending' && stats.pending_reports > 0 ? '(' + stats.pending_reports + ')' : ''}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '50px 20px', textAlign: 'center', border: '1px solid ' + C.border }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>✅</p>
            <p style={{ fontFamily: font, fontSize: 16, fontWeight: 700, color: C.navy }}>No {reportFilter === 'all' ? '' : reportFilter} reports</p>
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + C.border, padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <Avatar name={r.reported_user?.full_name} url={r.reported_user?.avatar_url} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{r.reported_user?.full_name || 'Unknown'}</span>
                  <Badge text={r.status} color={r.status === 'pending' ? C.orange : r.status === 'resolved' ? C.green : C.muted} />
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{timeAgo(r.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: C.navy, margin: '0 0 4px' }}>
                  <strong>Reason:</strong> {r.reason}
                </p>
                {r.details && <p style={{ fontSize: 13, color: C.muted, margin: '0 0 4px' }}>{r.details}</p>}
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Reported by: {r.reporter?.full_name || 'Anonymous'}</p>
              </div>
            </div>

            {/* Reported content preview */}
            {(r.post?.content || r.comment?.content) && (
              <div style={{ background: C.cream, borderRadius: 10, padding: '12px 14px', marginBottom: 12, borderLeft: '3px solid ' + C.orange }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, margin: '0 0 4px' }}>Reported Content:</p>
                <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.5 }}>{r.post?.content || r.comment?.content}</p>
              </div>
            )}

            {/* Action buttons */}
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {r.post_id && (
                  <button onClick={() => { hidePost({ id: r.post_id, user_id: r.post?.user_id }, r.reason); resolveReport(r, 'Post hidden'); }}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.orange + '15', color: C.orange, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Hide Post
                  </button>
                )}
                <button onClick={() => { warnUser({ id: r.reported_user_id, warnings_count: 0 }); resolveReport(r, 'User warned'); }}
                  style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.orange + '15', color: C.orange, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Warn User
                </button>
                <button onClick={() => { suspendUser({ id: r.reported_user_id }, 3); resolveReport(r, 'User suspended 3 days'); }}
                  style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.red + '15', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Suspend 3d
                </button>
                <button onClick={() => setConfirm({ title: 'Ban User', message: 'Permanently ban ' + (r.reported_user?.full_name || 'this user') + '?', color: C.red, onConfirm: () => { banUser({ id: r.reported_user_id }); resolveReport(r, 'User banned'); setConfirm(null); } })}
                  style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: C.red + '15', color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Ban User
                </button>
                <button onClick={() => dismissReport(r)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid ' + C.border, background: '#fff', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                  Dismiss
                </button>
              </div>
            )}
            {r.resolution && (
              <p style={{ fontSize: 12, color: C.muted, margin: '8px 0 0', fontStyle: 'italic' }}>Resolution: {r.resolution}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ═══════════ USERS ═════════════════════════════════════════════════════
  function renderUsers() {
    const filtered = users.filter(u => !search.trim() || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email..."
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1.5px solid ' + C.border, background: '#fff', fontFamily: sans, fontSize: 14, color: C.navy, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = C.gold; }} onBlur={e => { e.target.style.borderColor = C.border; }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 140px', gap: 8, padding: '10px 16px', borderBottom: '1px solid ' + C.border, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>User</span><span>Email</span><span>Status</span><span>Verified</span><span>Warnings</span><span>Actions</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No users found</div>
          ) : filtered.slice(0, 50).map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 140px', gap: 8, padding: '10px 16px', borderBottom: '1px solid ' + C.border, alignItems: 'center', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={u.full_name} url={u.avatar_url} size={30} />
                <span style={{ fontWeight: 600, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</span>
              </div>
              <span style={{ color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              <span>
                {u.is_banned ? <Badge text="Banned" color={C.red} /> :
                 u.is_suspended ? <Badge text="Suspended" color={C.orange} /> :
                 <Badge text="Active" color={C.green} />}
              </span>
              <span>{(u.identity_verified || u.is_verified) ? <Badge text="Yes" color={C.green} /> : <Badge text="No" color={C.muted} />}</span>
              <span style={{ color: (u.warnings_count || 0) > 0 ? C.orange : C.muted, fontWeight: 600 }}>{u.warnings_count || 0}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {!u.is_banned ? (
                  <>
                    <button onClick={() => warnUser(u)} title="Warn" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: C.orange + '12', color: C.orange, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Warn</button>
                    <button onClick={() => suspendUser(u, 7)} title="Suspend 7d" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: C.red + '12', color: C.red, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>7d</button>
                    <button onClick={() => setConfirm({ title: 'Ban ' + u.full_name + '?', message: 'This will permanently ban this user from the platform.', color: C.red, onConfirm: () => { banUser(u); setConfirm(null); } })}
                      title="Ban" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: C.red + '12', color: C.red, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Ban</button>
                  </>
                ) : (
                  <button onClick={() => unbanUser(u)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: C.green + '12', color: C.green, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Unban</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════ POSTS ═════════════════════════════════════════════════════
  function renderPosts() {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setSearch('')} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: !search ? C.navy : '#fff', color: !search ? '#fff' : C.muted }}>All Posts</button>
          <button onClick={() => setSearch('__hidden__')} style={{ padding: '7px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: search === '__hidden__' ? C.navy : '#fff', color: search === '__hidden__' ? '#fff' : C.muted }}>Hidden Only</button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {posts.filter(p => search === '__hidden__' ? p.is_hidden : true).map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + (p.is_hidden ? C.red + '30' : C.border), padding: '16px 20px', opacity: p.is_hidden ? 0.7 : 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <Avatar name={p.users?.full_name} url={p.users?.avatar_url} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{p.users?.full_name || 'Unknown'}</span>
                    {p.is_hidden && <Badge text="Hidden" color={C.red} />}
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{timeAgo(p.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.navy, margin: '6px 0', lineHeight: 1.5 }}>{p.content}</p>
                  {p.image_url && <img src={p.image_url} alt="" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />}
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.muted }}>
                    <span>👍 {p.likes_count || 0}</span>
                    <span>👎 {p.dislikes_count || 0}</span>
                    <span>💬 {p.comments_count || 0}</span>
                  </div>
                </div>
              </div>
              {p.hidden_reason && <p style={{ fontSize: 11, color: C.red, margin: '4px 0 8px', fontStyle: 'italic' }}>Hidden: {p.hidden_reason}</p>}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {!p.is_hidden ? (
                  <button onClick={() => hidePost(p, 'Content violation')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: C.orange + '12', color: C.orange, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Hide</button>
                ) : (
                  <button onClick={() => unhidePost(p)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: C.green + '12', color: C.green, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Restore</button>
                )}
                <button onClick={() => setConfirm({ title: 'Delete Post?', message: 'This will permanently delete this post and all its comments. This cannot be undone.', color: C.red, onConfirm: () => { deletePost(p); setConfirm(null); } })}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: C.red + '12', color: C.red, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════ ACTION LOG ═════════════════════════════════════════════════
  function renderLog() {
    const colors = { warn: C.orange, suspend: C.orange, ban: C.red, unban: C.green, hide_post: C.muted, unhide_post: C.green, delete_post: C.red, dismiss_report: C.muted, resolve_report: C.green };
    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 100px', gap: 8, padding: '10px 16px', borderBottom: '1px solid ' + C.border, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span>Action</span><span>Target</span><span>Admin</span><span>Details</span><span>When</span>
        </div>
        {actions.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No actions logged</div>
        ) : actions.map(a => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 100px', gap: 8, padding: '10px 16px', borderBottom: '1px solid ' + C.border, alignItems: 'center', fontSize: 13 }}>
            <Badge text={a.action_type.replace(/_/g, ' ')} color={colors[a.action_type] || C.muted} />
            <span style={{ color: C.navy, fontWeight: 500 }}>{a.target_user?.full_name || '—'}</span>
            <span style={{ color: C.muted }}>{a.admin?.full_name || '—'}</span>
            <span style={{ color: C.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details || '—'}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(a.created_at)}</span>
          </div>
        ))}
      </div>
    );
  }

  // ═══════════ RENDER ═════════════════════════════════════════════════════
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80, fontFamily: sans }}>
      <div style={{ width: 28, height: 28, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: sans, maxWidth: 1100, margin: '0 auto' }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>

      <ConfirmModal open={!!confirm} title={confirm?.title} message={confirm?.message}
        confirmLabel="Confirm" confirmColor={confirm?.color}
        onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: font, fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 6px' }}>Moderation</h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Manage reports, users, and community content</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', borderRadius: 12, padding: 4, border: '1px solid ' + C.border, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: tab === t.id ? C.navy : 'transparent',
            color: tab === t.id ? '#fff' : C.muted, transition: 'all 0.15s',
            position: 'relative',
          }}>
            <Ico d={t.icon} size={15} />
            {t.label}
            {t.count > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: tab === t.id ? C.gold : C.red, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && renderOverview()}
      {tab === 'reports' && renderReports()}
      {tab === 'users' && renderUsers()}
      {tab === 'posts' && renderPosts()}
      {tab === 'log' && renderLog()}
    </div>
  );
}
