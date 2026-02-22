// src/pages/citizen/Account.jsx — Polished
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function CitizenAccount() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.full_name || '');
  const [state, setState] = useState(profile?.state || '');
  const [dob, setDob] = useState(profile?.date_of_birth || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from('users').update({ full_name: name, state, date_of_birth: dob || null }).eq('id', profile.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) return alert('Password must be at least 6 characters');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) { setPwSaved(true); setNewPassword(''); setTimeout(() => setPwSaved(false), 3000); }
    else alert('Error: ' + error.message);
  }

  async function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    await supabase.from('users').delete().eq('id', profile.id);
    await signOut();
    navigate('/');
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Account Settings</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-[#0B2545]/[0.04]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C5960C]/20 to-[#C5960C]/5 flex items-center justify-center text-2xl font-bold text-[#C5960C]">
            {(name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-[#0B2545]">{name || 'User'}</p>
            <p className="text-sm text-[#0B2545]/30">{profile?.email}</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full ${profile?.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {profile?.is_verified ? '✓ Verified' : '⏳ Unverified'}
          </span>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">State</label>
            <input value={state} onChange={e => setState(e.target.value)} placeholder="e.g., California"
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Date of Birth</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)}
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all" />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="px-6 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#0B2545]">Change Password</h3>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 characters)"
          className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 outline-none transition-all" />
        <button onClick={changePassword}
          className="px-6 py-2.5 bg-[#0B2545]/10 hover:bg-[#0B2545]/15 text-[#0B2545]/60 text-sm font-semibold rounded-xl transition-all duration-200">
          {pwSaved ? '✓ Password Updated!' : 'Update Password'}
        </button>
      </div>

      {/* Danger */}
      <div className="bg-white rounded-2xl border border-red-200/60 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#B8352E]">Danger Zone</h3>
        <p className="text-sm text-[#0B2545]/30 mt-1">Permanently delete your account and all associated data.</p>
        <button onClick={deleteAccount} className="mt-4 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-[#B8352E] text-sm font-semibold rounded-xl border border-red-200/60 transition-all duration-200">
          Delete My Account
        </button>
      </div>
    </div>
  );
}
