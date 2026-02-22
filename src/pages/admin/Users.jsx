// src/pages/admin/Users.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const ROLE_OPTIONS = ['citizen', 'admin', 'org'];
const TRUST_LEVELS = { 0: 'New', 3: 'Active', 11: 'Trusted', 25: 'Champion' };

function getTrustLevel(score) {
  if (score >= 25) return { label: 'Champion', color: '#C5960C' };
  if (score >= 11) return { label: 'Trusted', color: '#22863A' };
  if (score >= 3) return { label: 'Active', color: '#0B2545' };
  return { label: 'New', color: '#0B2545' };
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
    setLoading(false);
  }

  async function updateRole(userId, newRole) {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  }

  async function toggleVerified(userId, current) {
    const { error } = await supabase.from('users').update({ is_verified: !current }).eq('id', userId);
    if (!error) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_verified: !current } : u));
  }

  async function deleteUser(userId) {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setEditingUser(null);
    }
  }

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (verifiedFilter === 'verified' && !u.is_verified) return false;
    if (verifiedFilter === 'unverified' && u.is_verified) return false;
    if (search) {
      const s = search.toLowerCase();
      return (u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    }
    return true;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Users</h1>
          <p className="text-sm text-[#0B2545]/40 mt-1">{users.length} total users</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-semibold">
            ✓ {users.filter((u) => u.is_verified).length} verified
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-semibold">
            ⏳ {users.filter((u) => !u.is_verified).length} pending
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0B2545]/25 text-sm">🔍</span>
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all placeholder:text-[#0B2545]/20" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 transition-all text-[#0B2545]/60">
          <option value="all">All Roles</option>
          <option value="citizen">Citizens</option>
          <option value="admin">Admins</option>
          <option value="org">Organizations</option>
        </select>
        <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 transition-all text-[#0B2545]/60">
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/5">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Verified</th>
                <th className="px-5 py-3">Trust</th>
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const trust = getTrustLevel(u.trust_score || 0);
                return (
                  <tr key={u.id} className="border-b border-[#0B2545]/5 last:border-0 hover:bg-[#C5960C]/[0.01] transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-[#0B2545]">{u.full_name || '—'}</p>
                        <p className="text-[11px] text-[#0B2545]/30">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select value={u.role || 'citizen'} onChange={(e) => updateRole(u.id, e.target.value)}
                        className="text-xs px-2 py-1 bg-[#0B2545]/[0.03] border border-[#0B2545]/8 rounded-md focus:outline-none focus:ring-1 focus:ring-[#C5960C]/30 text-[#0B2545]/60">
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleVerified(u.id, u.is_verified)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                          u.is_verified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                        }`}>
                        {u.is_verified ? '✓ Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold tabular-nums" style={{ color: trust.color }}>{u.trust_score || 0}</span>
                        <span className="text-[10px] text-[#0B2545]/25">{trust.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#0B2545]/40">{u.state || '—'}</td>
                    <td className="px-5 py-3.5 text-[#0B2545]/30">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => deleteUser(u.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-[#0B2545]/20 hover:text-[#B8352E] transition-colors" title="Delete user">
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#0B2545]/25">No users match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
