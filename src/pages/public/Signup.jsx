// src/pages/public/Signup.jsx — Enhanced with location + phone + duplicate prevention
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
const font = 'Libre Baskerville, Georgia, serif';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

export default function Signup() {
  var navigate = useNavigate();
  var [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    phone: '', state: '', county: '', city: '', zip: '',
    role: 'citizen', agreeTerms: false
  });
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [step, setStep] = useState(1); // 1 = account, 2 = location

  function update(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
    setError('');
  }

  function formatPhone(val) {
    var digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length >= 7) return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6);
    if (digits.length >= 4) return '(' + digits.slice(0,3) + ') ' + digits.slice(3);
    if (digits.length > 0) return '(' + digits;
    return '';
  }

  async function handleStep1() {
    if (!form.fullName.trim()) return setError('Full name is required');
    if (!form.email.trim()) return setError('Email is required');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError('Enter a valid email address');
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) return setError('Enter a valid 10-digit phone number');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    // Check if phone already exists
    var phoneDigits = form.phone.replace(/\D/g, '');
    var { data: existingPhone } = await supabase.from('users').select('id').eq('phone', phoneDigits).limit(1);
    if (existingPhone && existingPhone.length > 0) {
      setLoading(false);
      return setError('This phone number is already registered. One account per person.');
    }

    // Check if email already exists
    var { data: existingEmail } = await supabase.from('users').select('id').eq('email', form.email.toLowerCase().trim()).limit(1);
    if (existingEmail && existingEmail.length > 0) {
      setLoading(false);
      return setError('This email is already registered. Please sign in instead.');
    }

    setLoading(false);
    setStep(2);
  }

  async function handleSignup() {
    if (!form.state) return setError('State is required');
    if (!form.city.trim()) return setError('City is required');
    if (!form.zip.trim() || form.zip.replace(/\D/g, '').length < 5) return setError('Enter a valid 5-digit ZIP code');
    if (!form.agreeTerms) return setError('You must agree to the terms');

    setLoading(true);

    var { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: { data: { full_name: form.fullName.trim() } }
    });

    if (authError) { setLoading(false); return setError(authError.message); }

    if (authData.user) {
      var { error: profileError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email: form.email.trim().toLowerCase(),
        full_name: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ''),
        role: form.role,
        state: form.state,
        county: form.county.trim(),
        city: form.city.trim(),
        zip: form.zip.replace(/\D/g, '').slice(0, 5),
        is_verified: false,
        identity_verified: false
      });

      if (profileError) { setLoading(false); return setError('Account created but profile save failed: ' + profileError.message); }
    }

    setLoading(false);
    navigate('/login?registered=true');
  }

  function Field({ label, required, children }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>
          {label} {required ? <span style={{ color: C.red }}>*</span> : null}
        </label>
        {children}
      </div>
    );
  }

  var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', transition: 'border 0.2s', fontFamily: 'inherit' };
  var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, ' + C.cream + ' 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>CV</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(11,37,69,0.06)', border: '1px solid rgba(11,37,69,0.06)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Create Your Account</h1>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 8px' }}>
            {step === 1 ? 'Step 1 of 2: Account Information' : 'Step 2 of 2: Your Location'}
          </p>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.gold }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: step === 2 ? C.gold : 'rgba(11,37,69,0.06)' }} />
          </div>

          {error ? (
            <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: C.red, fontSize: 14, marginTop: 1 }}>{'\u26A0'}</span>
              <p style={{ fontSize: 13, color: C.red, margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          ) : null}

          {step === 1 ? (
            <>
              <Field label="Full Name" required>
                <input value={form.fullName} onChange={function(e){update('fullName', e.target.value)}} placeholder="Enter your legal full name" style={inputStyle} />
              </Field>

              <Field label="Email Address" required>
                <input type="email" value={form.email} onChange={function(e){update('email', e.target.value)}} placeholder="you@example.com" style={inputStyle} />
              </Field>

              <Field label="Phone Number" required>
                <input value={form.phone} onChange={function(e){update('phone', formatPhone(e.target.value))}} placeholder="(555) 123-4567" style={inputStyle} />
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', margin: '4px 0 0' }}>Used to verify one account per person</p>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Password" required>
                  <input type="password" value={form.password} onChange={function(e){update('password', e.target.value)}} placeholder="Min 8 characters" style={inputStyle} />
                </Field>
                <Field label="Confirm Password" required>
                  <input type="password" value={form.confirmPassword} onChange={function(e){update('confirmPassword', e.target.value)}} placeholder="Re-enter password" style={inputStyle} />
                </Field>
              </div>

              <Field label="I am signing up as">
                <select value={form.role} onChange={function(e){update('role', e.target.value)}} style={selectStyle}>
                  <option value="citizen">Citizen</option>
                  <option value="org">Organization</option>
                </select>
              </Field>

              <button onClick={handleStep1} disabled={loading}
                style={{ width: '100%', padding: '14px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Checking...' : 'Continue \u2192'}
              </button>
            </>
          ) : (
            <>
              <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.5 }}>
                  {'\uD83D\uDCCD'} Your location helps us show you polls and surveys relevant to your community. This info is never shared publicly.
                </p>
              </div>

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
                <Field label="ZIP Code" required>
                  <input value={form.zip} onChange={function(e){update('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}} placeholder="e.g., 46201" maxLength={5} style={inputStyle} />
                </Field>
              </div>

              <div style={{ marginBottom: 16, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.agreeTerms} onChange={function(e){update('agreeTerms', e.target.checked)}}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: C.gold }} />
                  <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.45)', lineHeight: 1.5 }}>
                    I agree to the <span style={{ color: C.gold, fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: C.gold, fontWeight: 600 }}>Privacy Policy</span>. I confirm this is my only CivicVerify account.
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={function(){setStep(1); setError('')}}
                  style={{ flex: 1, padding: '14px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {'\u2190'} Back
                </button>
                <button onClick={handleSignup} disabled={loading}
                  style={{ flex: 2, padding: '14px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(11,37,69,0.35)', marginTop: 20 }}>
            Already have an account? <span onClick={function(){navigate('/login')}} style={{ color: C.gold, fontWeight: 600, cursor: 'pointer' }}>Sign In</span>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(11,37,69,0.2)', marginTop: 20 }}>
          {'\u00A9'} {new Date().getFullYear()} CivicVerify. One person, one verified voice.
        </p>
      </div>
    </div>
  );
}
