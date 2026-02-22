// src/pages/citizen/Settings.jsx — Profile & Location Editor
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

var US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

export default function CitizenSettings() {
  var navigate = useNavigate();
  var { user, profile } = useAuth();
  var [form, setForm] = useState({ full_name: '', phone: '', state: '', county: '', city: '', zip: '' });
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(function() {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        state: profile.state || '',
        county: profile.county || '',
        city: profile.city || '',
        zip: profile.zip || ''
      });
      setLoading(false);
    }
  }, [profile]);

  function update(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
    setMsg({ type: '', text: '' });
  }

  function formatPhone(val) {
    var digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 7) return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6);
    if (digits.length >= 4) return '(' + digits.slice(0,3) + ') ' + digits.slice(3);
    if (digits.length > 0) return '(' + digits;
    return '';
  }

  async function save() {
    if (!form.full_name.trim()) return setMsg({ type: 'error', text: 'Name is required' });
    if (!form.state) return setMsg({ type: 'error', text: 'Please select your state' });
    if (!form.city.trim()) return setMsg({ type: 'error', text: 'City is required' });

    setSaving(true);
    var phoneDigits = form.phone.replace(/\D/g, '');

    // Check phone uniqueness if changed
    if (phoneDigits && phoneDigits !== profile.phone) {
      var { data: existing } = await supabase.from('users').select('id').eq('phone', phoneDigits).neq('id', user.id).limit(1);
      if (existing && existing.length > 0) {
        setSaving(false);
        return setMsg({ type: 'error', text: 'This phone number is already linked to another account.' });
      }
    }

    var { error } = await supabase.from('users').update({
      full_name: form.full_name.trim(),
      phone: phoneDigits || null,
      state: form.state,
      county: form.county.trim() || null,
      city: form.city.trim(),
      zip: form.zip.replace(/\D/g, '').slice(0, 5) || null
    }).eq('id', user.id);

    setSaving(false);
    if (error) return setMsg({ type: 'error', text: error.message });
    setMsg({ type: 'success', text: 'Profile updated successfully!' });
  }

  var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', fontFamily: 'inherit' };
  var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });

  function Field({ label, required, children, hint }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>
          {label} {required ? <span style={{ color: C.red }}>*</span> : null}
        </label>
        {children}
        {hint ? <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0' }}>{hint}</p> : null}
      </div>
    );
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;

  var completeness = 0;
  if (form.full_name) completeness += 20;
  if (form.phone) completeness += 20;
  if (form.state) completeness += 20;
  if (form.city) completeness += 20;
  if (form.zip) completeness += 20;

  return (
    <div style={{ maxWidth: 640, fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>My Profile</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Keep your information up to date for relevant polls</p>

      {/* Profile Completeness */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Profile Completeness</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: completeness === 100 ? C.green : C.gold }}>{completeness}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(11,37,69,0.04)', borderRadius: 3 }}>
          <div style={{ height: '100%', background: completeness === 100 ? C.green : C.gold, borderRadius: 3, transition: 'width 0.5s', width: completeness + '%' }} />
        </div>
        {completeness < 100 ? <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '8px 0 0' }}>Complete your profile to participate in location-targeted polls</p> : null}
      </div>

      {/* Message */}
      {msg.text ? (
        <div style={{ background: msg.type === 'success' ? C.green + '08' : C.red + '08', border: '1px solid ' + (msg.type === 'success' ? C.green : C.red) + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: msg.type === 'success' ? C.green : C.red, margin: 0 }}>{msg.type === 'success' ? '\u2713' : '\u26A0'} {msg.text}</p>
        </div>
      ) : null}

      {/* Account Info */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>{'\uD83D\uDC64'} Account Information</h2>

        <Field label="Full Name" required>
          <input value={form.full_name} onChange={function(e){update('full_name', e.target.value)}} style={inputStyle} />
        </Field>

        <Field label="Email" hint="Email cannot be changed">
          <input value={profile?.email || ''} disabled style={Object.assign({}, inputStyle, { background: 'rgba(11,37,69,0.02)', color: 'rgba(11,37,69,0.3)' })} />
        </Field>

        <Field label="Phone Number" hint="One phone number per account — prevents duplicates">
          <input value={formatPhone(form.phone)} onChange={function(e){update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}} placeholder="(555) 123-4567" style={inputStyle} />
        </Field>
      </div>

      {/* Location */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>{'\uD83D\uDCCD'} Location</h2>
        <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '0 0 16px' }}>Used to match you with relevant local polls. Never shared publicly.</p>

        <Field label="State" required>
          <select value={form.state} onChange={function(e){update('state', e.target.value)}} style={selectStyle}>
            <option value="">Select your state</option>
            {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
        </Field>

        <Field label="County">
          <input value={form.county} onChange={function(e){update('county', e.target.value)}} placeholder="e.g., Marion County" style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="City" required>
            <input value={form.city} onChange={function(e){update('city', e.target.value)}} placeholder="e.g., Indianapolis" style={inputStyle} />
          </Field>
          <Field label="ZIP Code">
            <input value={form.zip} onChange={function(e){update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}} placeholder="e.g., 46201" maxLength={5} style={inputStyle} />
          </Field>
        </div>
      </div>

      {/* Verification Status */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>{'\uD83D\uDEE1\uFE0F'} Verification Status</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, padding: 16, borderRadius: 10, background: profile?.is_verified ? C.green + '08' : 'rgba(11,37,69,0.02)', border: '1px solid ' + (profile?.is_verified ? C.green + '20' : 'rgba(11,37,69,0.06)'), textAlign: 'center' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{profile?.is_verified ? '\u2705' : '\u23F3'}</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: profile?.is_verified ? C.green : 'rgba(11,37,69,0.3)', margin: 0 }}>{profile?.is_verified ? 'Email Verified' : 'Email Pending'}</p>
          </div>
          <div style={{ flex: 1, padding: 16, borderRadius: 10, background: profile?.identity_verified ? C.green + '08' : 'rgba(11,37,69,0.02)', border: '1px solid ' + (profile?.identity_verified ? C.green + '20' : 'rgba(11,37,69,0.06)'), textAlign: 'center' }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>{profile?.identity_verified ? '\u2705' : '\u23F3'}</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: profile?.identity_verified ? C.green : 'rgba(11,37,69,0.3)', margin: 0 }}>{profile?.identity_verified ? 'ID Verified' : 'ID Not Verified'}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={save} disabled={saving}
        style={{ width: '100%', padding: 14, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
