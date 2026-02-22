// src/pages/citizen/Account.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { US_STATES, AGE_RANGES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

const STATES = US_STATES || ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const AGES = AGE_RANGES || ['18-24','25-34','35-44','45-54','55-64','65+'];

export default function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: '', state: '', age_range: '', email_digest: true });
  const [password, setPassword] = useState({ current: '', new1: '', new2: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  async function fetchProfile() {
    const { data } = await supabase.from('users').select('full_name, state, age_range, email_digest').eq('id', user.id).single();
    if (data) setProfile({ ...profile, ...data });
    setLoading(false);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from('users').update({
      full_name: profile.full_name?.trim(),
      state: profile.state,
      age_range: profile.age_range,
      email_digest: profile.email_digest,
    }).eq('id', user.id);
    setSaving(false);
    setMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Profile updated successfully' });
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (password.new1 !== password.new2) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (password.new1.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setSavingPw(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: password.new1 });
    setSavingPw(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Password changed successfully' });
      setPassword({ current: '', new1: '', new2: '' });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.')) return;
    if (!confirm('This will delete all your responses and profile data. Type "DELETE" in the next prompt to confirm.')) return;
    const confirmation = prompt('Type DELETE to confirm account deletion:');
    if (confirmation !== 'DELETE') return;

    // Delete user data
    await supabase.from('responses').delete().eq('user_id', user.id);
    await supabase.from('notifications').delete().eq('user_id', user.id);
    await supabase.from('users').delete().eq('id', user.id);
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  const inputClass = "w-full px-3.5 py-2.5 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 focus:border-[#C5960C]/40 transition-all placeholder:text-[#0B2545]/15";
  const labelClass = "block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Account Settings</h1>
        <p className="text-sm text-[#0B2545]/40 mt-1">{user?.email}</p>
      </div>

      {/* Toast message */}
      {msg && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-[#B8352E]'
        }`}>
          <span>{msg.type === 'success' ? '✓' : '✕'}</span> {msg.text}
        </div>
      )}

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-[#0B2545]/5 p-6 space-y-4">
        <h3 className="font-semibold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Profile</h3>

        <div>
          <label className={labelClass}>Full Name</label>
          <input type="text" value={profile.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            placeholder="Your full name" className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>State</label>
            <select value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} className={inputClass}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Age Range</label>
            <select value={profile.age_range || ''} onChange={(e) => setProfile({ ...profile, age_range: e.target.value })} className={inputClass}>
              <option value="">Select age range</option>
              {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={profile.email_digest ?? true}
            onChange={(e) => setProfile({ ...profile, email_digest: e.target.checked })}
            className="w-4 h-4 rounded border-[#0B2545]/15 text-[#C5960C] focus:ring-[#C5960C]/20" />
          <div>
            <p className="text-sm text-[#0B2545]/70 font-medium">Weekly email digest</p>
            <p className="text-[11px] text-[#0B2545]/30">Get notified about new surveys matching your profile</p>
          </div>
        </label>

        <button type="submit" disabled={saving}
          className="px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-[#0B2545]/5 p-6 space-y-4">
        <h3 className="font-semibold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Change Password</h3>
        <div>
          <label className={labelClass}>New Password</label>
          <input type="password" value={password.new1} onChange={(e) => setPassword({ ...password, new1: e.target.value })}
            placeholder="New password (min 6 characters)" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Confirm New Password</label>
          <input type="password" value={password.new2} onChange={(e) => setPassword({ ...password, new2: e.target.value })}
            placeholder="Confirm new password" className={inputClass} />
        </div>
        <button type="submit" disabled={savingPw || !password.new1}
          className="px-5 py-2.5 bg-[#0B2545] hover:bg-[#0B2545]/90 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          {savingPw ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-[#B8352E]/15 p-6">
        <h3 className="font-semibold text-[#B8352E] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Danger Zone</h3>
        <p className="text-sm text-[#0B2545]/40 mb-4">
          Deleting your account will permanently remove all your data, including survey responses and verification status.
        </p>
        <button onClick={handleDeleteAccount}
          className="px-5 py-2.5 bg-white border border-[#B8352E]/20 text-[#B8352E] text-sm font-semibold rounded-lg hover:bg-[#B8352E]/5 transition-colors">
          Delete My Account
        </button>
      </div>
    </div>
  );
}
