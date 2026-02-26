// src/pages/admin/Users.jsx — Fixed to use identity_verified (Didit)
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('users').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'verified' && !u.identity_verified) return false;
    if (statusFilter === 'unverified' && u.identity_verified) return false;
    if (search && !(u.full_name || '').toLowerCase().includes(search.toLowerCase()) && !(u.email || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const verifiedCount = users.filter(u => u.identity_verified).length;

  async function updateRole(id, role) {
    const { error } = await supabase.from('users').update({ role }).eq('id', id);
    if (!error) setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  }

  async function toggleVerify(id, current) {
    const { error } = await supabase.from('users').update({ identity_verified: !current }).eq('id', id);
    if (!error) setUsers(users.map(u => u.id === id ? { ...u, identity_verified: !current } : u));
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) setUsers(users.filter(u => u.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Users</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-xs">✓ {verifiedCount} verified</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full font-semibold text-xs">⏳ {users.length - verifiedCount} pending</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0B2545]/20 text-sm">🔍</span>
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#0B2545]/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all duration-200 placeholder:text-[#0B2545]/20 shadow-sm" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 text-sm bg-white border border-[#0B2545]/[0.06] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 text-[#0B2545]/60">
          <option value="all">All Roles</option><option value="citizen">Citizens</option><option value="admin">Admins</option><option value="org">Organizations</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 text-sm bg-white border border-[#0B2545]/[0.06] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 text-[#0B2545]/60">
          <option value="all">All Status</option><option value="verified">Verified</option><option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/[0.04] bg-[#0B2545]/[0.01]">
                  <th className="px-6 py-3.5">User</th><th className="px-6 py-3.5">Role</th><th className="px-6 py-3.5">Verified</th><th className="px-6 py-3.5">Trust</th><th className="px-6 py-3.5">State</th><th className="px-6 py-3.5">Joined</th><th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-[#0B2545]/[0.03] last:border-0 hover:bg-[#C5960C]/[0.015] transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B2545]/10 to-[#0B2545]/5 flex items-center justify-center text-sm font-bold text-[#0B2545]/40 flex-shrink-0">
                          {(u.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#0B2545]">{u.full_name || 'Unnamed'}</p>
                          <p className="text-[11px] text-[#0B2545]/30">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                          u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                          u.role === 'org' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        }`}>
                        <option value="citizen">Citizen</option><option value="admin">Admin</option><option value="org">Organization</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleVerify(u.id, u.identity_verified)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${
                          u.identity_verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-200/60 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200/60'
                        }`}>
                        {u.identity_verified ? '✓ Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#0B2545]/50 tabular-nums">{u.trust_score || 0}</td>
                    <td className="px-6 py-4 text-[#0B2545]/30 text-[13px]">{u.state || '—'}</td>
                    <td className="px-6 py-4 text-[#0B2545]/30 text-[13px]">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteUser(u.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#0B2545]/20 hover:text-[#B8352E] flex items-center justify-center ml-auto transition-all duration-150">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-[#0B2545]/[0.03] flex items-center justify-center text-3xl mb-5">👤</div>
            <p className="text-base font-semibold text-[#0B2545]/25">No users found</p>
            <p className="text-sm text-[#0B2545]/20 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

