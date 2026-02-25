// src/pages/citizen/Account.jsx — Profile & Avatar Management
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var heading = "'Playfair Display', Georgia, serif";
var body = "'DM Sans', -apple-system, sans-serif";
var inputStyle = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', fontFamily: body, boxSizing: 'border-box' };
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6, fontFamily: body };

function initials(name) {
  if (!name) return '?';
  var parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

export default function CitizenAccount() {
  var auth = useAuth();
  var user = auth.user;
  var fileRef = useRef(null);

  var [profile, setProfile] = useState(null);
  var [form, setForm] = useState({ full_name: '', email: '', city: '', state: '' });
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [success, setSuccess] = useState('');
  var [error, setError] = useState('');

  // Avatar
  var [avatarUrl, setAvatarUrl] = useState(null);
  var [uploading, setUploading] = useState(false);
  var [avatarHover, setAvatarHover] = useState(false);

  // Password
  var [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });
  var [pwSaving, setPwSaving] = useState(false);
  var [pwError, setPwError] = useState('');
  var [pwSuccess, setPwSuccess] = useState(false);

  useEffect(function () {
    if (!user) return;
    (async function () {
      var { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          email: user.email || '',
          city: data.city || '',
          state: data.state || '',
        });
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    })();
  }, [user]);

  function set(k, v) {
    setForm(function (p) { return Object.assign({}, p, { [k]: v }); });
    setError('');
    setSuccess('');
  }

  // ── Avatar Upload ──
  async function handleAvatarUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }

    setUploading(true);
    setError('');

    // Delete old avatar if exists
    var oldPath = user.id + '/avatar';
    await supabase.storage.from('avatars').remove([oldPath]);

    // Upload new avatar
    var ext = file.name.split('.').pop();
    var path = user.id + '/avatar.' + ext;
    var { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });

    if (uploadErr) {
      setError('Upload failed: ' + uploadErr.message);
      setUploading(false);
      return;
    }

    // Get public URL
    var { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    var publicUrl = urlData.publicUrl + '?t=' + Date.now(); // cache bust

    // Save to users table
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);

    setAvatarUrl(publicUrl);
    setUploading(false);
    setSuccess('Profile picture updated!');
    setTimeout(function () { setSuccess(''); }, 3000);
  }

  async function removeAvatar() {
    setUploading(true);
    // List and delete all files in user's avatar folder
    var { data: files } = await supabase.storage.from('avatars').list(user.id);
    if (files && files.length > 0) {
      var paths = files.map(function (f) { return user.id + '/' + f.name; });
      await supabase.storage.from('avatars').remove(paths);
    }
    await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
    setAvatarUrl(null);
    setUploading(false);
    setSuccess('Profile picture removed');
    setTimeout(function () { setSuccess(''); }, 3000);
  }

  // ── Save Profile ──
  async function saveProfile() {
    if (!form.full_name.trim()) return setError('Name is required');
    setSaving(true);
    var { error: err } = await supabase.from('users').update({
      full_name: form.full_name.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
    }).eq('id', user.id);
    setSaving(false);
    if (err) return setError(err.message);
    setSuccess('Profile updated successfully!');
    setTimeout(function () { setSuccess(''); }, 3000);
  }

  // ── Change Password ──
  async function changePassword() {
    setPwError('');
    setPwSuccess(false);
    if (!pwForm.newPw) return setPwError('New password required');
    if (pwForm.newPw.length < 8) return setPwError('Password must be at least 8 characters');
    if (pwForm.newPw !== pwForm.confirm) return setPwError('Passwords do not match');
    setPwSaving(true);
    var { error: err } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwSaving(false);
    if (err) return setPwError(err.message);
    setPwSuccess(true);
    setPwForm({ newPw: '', confirm: '' });
    setTimeout(function () { setPwSuccess(false); }, 3000);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  var verified = profile && profile.identity_verified;

  return (
    <div style={{ fontFamily: body, maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: heading }}>Account</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Manage your profile and settings</p>
      </div>

      {/* ── Avatar Section ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 28, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Avatar circle */}
        <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={function () { setAvatarHover(true); }}
          onMouseLeave={function () { setAvatarHover(false); }}
          onClick={function () { fileRef.current && fileRef.current.click(); }}>

          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar"
              style={{
                width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                border: '3px solid ' + C.gold + '30',
                filter: avatarHover ? 'brightness(0.7)' : 'none',
                transition: 'filter 0.2s',
              }} />
          ) : (
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'linear-gradient(135deg, ' + C.navy + ', #132d52)',
              border: '3px solid ' + C.gold + '30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: C.gold, fontFamily: heading,
              filter: avatarHover ? 'brightness(0.7)' : 'none',
              transition: 'filter 0.2s',
            }}>
              {initials(form.full_name)}
            </div>
          )}

          {/* Hover overlay */}
          {avatarHover && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" strokeWidth="2" />
                <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {/* Verified badge */}
          {verified && (
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: C.navy, border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={C.gold} />
                <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload}
            style={{ display: 'none' }} />
        </div>

        {/* Info beside avatar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: heading }}>{form.full_name || 'Your Name'}</h2>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 10px' }}>{form.email}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={function () { fileRef.current && fileRef.current.click(); }}
              disabled={uploading}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid ' + C.light,
                background: '#fff', fontSize: 12, fontWeight: 600, color: C.navy,
                cursor: 'pointer', fontFamily: body,
              }}>
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {avatarUrl && (
              <button onClick={removeAvatar} disabled={uploading}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(184,53,46,0.15)',
                  background: 'transparent', fontSize: 12, fontWeight: 600, color: C.red,
                  cursor: 'pointer', fontFamily: body,
                }}>
                Remove
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '8px 0 0' }}>JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      {/* ── Profile Details ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 18px', fontFamily: body }}>Profile Details</h2>

        {error && <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.red, margin: 0, fontFamily: body }}>{error}</p></div>}
        {success && <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.green, margin: 0, fontFamily: body }}>{success}</p></div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input value={form.full_name} onChange={function (e) { set('full_name', e.target.value); }} placeholder="Your full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={form.email} disabled style={Object.assign({}, inputStyle, { opacity: 0.5, cursor: 'not-allowed' })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={function (e) { set('city', e.target.value); }} placeholder="Your city" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <input value={form.state} onChange={function (e) { set('state', e.target.value); }} placeholder="Your state" style={inputStyle} />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving}
          style={{
            padding: '12px 24px', background: C.gold, color: '#fff', border: 'none',
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: body, opacity: saving ? 0.6 : 1,
          }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* ── Verification Status ── */}
      <div style={{
        background: verified ? C.green + '08' : C.gold + '08',
        borderRadius: 16, border: '1px solid ' + (verified ? C.green : C.gold) + '20',
        padding: '18px 22px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: verified ? C.green + '15' : C.gold + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={verified ? C.green : C.gold} strokeWidth="2" />
            {verified && <path d="M9 12l2 2 4-4" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: verified ? C.green : C.gold, margin: '0 0 2px', fontFamily: body }}>
            {verified ? 'Identity Verified' : 'Not Yet Verified'}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0, fontFamily: body }}>
            {verified ? 'Your identity has been verified. Your responses carry a verified badge.' : 'Verify your identity to unlock the verified citizen badge on all your posts and votes.'}
          </p>
        </div>
        {!verified && (
          <button onClick={function () { window.location.href = '/citizen/verify'; }}
            style={{
              padding: '9px 18px', background: C.gold, color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: body, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            Verify Now
          </button>
        )}
      </div>

      {/* ── Change Password ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 18px', fontFamily: body }}>Change Password</h2>

        {pwError && <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.red, margin: 0, fontFamily: body }}>{pwError}</p></div>}
        {pwSuccess && <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 13, color: C.green, margin: 0, fontFamily: body }}>Password changed successfully</p></div>}

        <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={pwForm.newPw}
              onChange={function (e) { setPwForm(function (p) { return Object.assign({}, p, { newPw: e.target.value }); }); }}
              placeholder="At least 8 characters" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={pwForm.confirm}
              onChange={function (e) { setPwForm(function (p) { return Object.assign({}, p, { confirm: e.target.value }); }); }}
              placeholder="Repeat new password" style={inputStyle} />
          </div>
        </div>
        <button onClick={changePassword} disabled={pwSaving}
          style={{
            padding: '12px 24px', background: C.navy, color: '#fff', border: 'none',
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: body, opacity: pwSaving ? 0.6 : 1,
          }}>
          {pwSaving ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* ── Account Info ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 14px', fontFamily: body }}>Account Info</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { label: 'Account ID', value: user ? user.id.slice(0, 8) + '...' : '—' },
            { label: 'Member Since', value: profile && profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
            { label: 'Account Type', value: 'Citizen' },
            { label: 'Identity', value: verified ? 'Verified' : 'Unverified' },
          ].map(function (item) {
            return (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(245,241,236,0.4)', borderRadius: 8,
              }}>
                <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', fontWeight: 600, fontFamily: body }}>{item.label}</span>
                <span style={{ fontSize: 13, color: C.navy, fontWeight: 500, fontFamily: body }}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{'\
        @keyframes spin { to { transform: rotate(360deg) } }\
      '}</style>
    </div>
  );
}
