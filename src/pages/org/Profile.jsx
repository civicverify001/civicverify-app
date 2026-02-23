// src/pages/org/Profile.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';
var inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: '#0B2545', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 };

var ORG_TYPES = ['Nonprofit / NGO', 'Government Agency', 'Research Institution', 'University / Academic', 'Political Campaign', 'News / Media', 'Corporation', 'Healthcare', 'Other'];

export default function OrgProfile() {
  var auth = useAuth(); var user = auth.user;
  var [profile, setProfile] = useState(null);
  var [form, setForm] = useState({ full_name: '', org_name: '', org_type: '', email: '' });
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [success, setSuccess] = useState(false);
  var [error, setError] = useState('');

  // Password section
  var [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  var [pwSaving, setPwSaving] = useState(false);
  var [pwError, setPwError] = useState('');
  var [pwSuccess, setPwSuccess] = useState(false);

  useEffect(function() {
    if (!user) return;
    (async function() {
      var { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({ full_name: data.full_name || '', org_name: data.org_name || '', org_type: data.org_type || '', email: user.email || '' });
      }
      setLoading(false);
    })();
  }, [user]);

  function set(k, v) { setForm(function(p) { return Object.assign({}, p, { [k]: v }); }); setError(''); setSuccess(false); }

  async function saveProfile() {
    if (!form.full_name.trim()) return setError('Name is required');
    if (!form.org_name.trim()) return setError('Organization name is required');
    setSaving(true);
    var { error: err } = await supabase.from('users').update({ full_name: form.full_name.trim(), org_name: form.org_name.trim(), org_type: form.org_type || null }).eq('id', user.id);
    setSaving(false);
    if (err) return setError(err.message);
    setSuccess(true);
    setTimeout(function() { setSuccess(false); }, 3000);
  }

  async function changePassword() {
    setPwError(''); setPwSuccess(false);
    if (!pwForm.newPw) return setPwError('New password required');
    if (pwForm.newPw.length < 8) return setPwError('Password must be at least 8 characters');
    if (pwForm.newPw !== pwForm.confirm) return setPwError('Passwords do not match');
    setPwSaving(true);
    var { error: err } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwSaving(false);
    if (err) return setPwError(err.message);
    setPwSuccess(true);
    setPwForm({ current: '', newPw: '', confirm: '' });
    setTimeout(function() { setPwSuccess(false); }, 3000);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  var statusCfg = {
    approved: { label: 'Approved', color: C.green, bg: '#F0FFF4' },
    pending:  { label: 'Pending Review', color: C.gold, bg: '#FFFBF0' },
    rejected: { label: 'Rejected', color: C.red, bg: '#FFF5F5' },
  }[profile?.org_status || 'pending'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Profile</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Manage your organization account</p>
      </div>

      {/* Account status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: statusCfg.bg, borderRadius: 12, marginBottom: 24, border: '1px solid ' + statusCfg.color + '20' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: statusCfg.color, margin: '0 0 1px' }}>Account Status: {statusCfg.label}</p>
          {profile?.org_status === 'approved' && profile?.org_approved_at && (
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Approved on {new Date(profile.org_approved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          )}
          {profile?.org_status === 'rejected' && profile?.org_rejected_reason && (
            <p style={{ fontSize: 11, color: C.red, margin: 0 }}>Reason: {profile.org_rejected_reason}</p>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 18px' }}>Organization Details</h2>

        {error && <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.red, margin: 0 }}>⚠ {error}</p></div>}
        {success && <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.green, margin: 0 }}>✓ Profile updated successfully</p></div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Contact Name</label><input value={form.full_name} onChange={function(e) { set('full_name', e.target.value); }} placeholder="Your full name" style={inputStyle} /></div>
          <div><label style={labelStyle}>Email</label><input value={form.email} disabled style={Object.assign({}, inputStyle, { opacity: 0.5, cursor: 'not-allowed' })} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Organization Name</label>
          <input value={form.org_name} onChange={function(e) { set('org_name', e.target.value); }} placeholder="Your organization's name" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Organization Type</label>
          <select value={form.org_type} onChange={function(e) { set('org_type', e.target.value); }} style={Object.assign({}, inputStyle, { appearance: 'none' })}>
            <option value="">Select type...</option>
            {ORG_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
          </select>
        </div>
        <button onClick={saveProfile} disabled={saving} style={{ padding: '12px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Password change */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 18px' }}>Change Password</h2>

        {pwError && <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.red, margin: 0 }}>⚠ {pwError}</p></div>}
        {pwSuccess && <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.green, margin: 0 }}>✓ Password changed successfully</p></div>}

        <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
          <div><label style={labelStyle}>New Password</label><input type="password" value={pwForm.newPw} onChange={function(e) { setPwForm(function(p) { return Object.assign({}, p, { newPw: e.target.value }); }); }} placeholder="At least 8 characters" style={inputStyle} /></div>
          <div><label style={labelStyle}>Confirm New Password</label><input type="password" value={pwForm.confirm} onChange={function(e) { setPwForm(function(p) { return Object.assign({}, p, { confirm: e.target.value }); }); }} placeholder="Repeat new password" style={inputStyle} /></div>
        </div>
        <button onClick={changePassword} disabled={pwSaving} style={{ padding: '12px 24px', background: C.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: pwSaving ? 0.6 : 1 }}>
          {pwSaving ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* Account info */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 14px' }}>Account Info</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { label: 'Account ID', value: user?.id?.slice(0, 8) + '...' },
            { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
            { label: 'Account Type', value: 'Organization' },
          ].map(function(item) {
            return (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(245,241,236,0.4)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
