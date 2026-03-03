// src/pages/citizen/Account.jsx — Redesigned Account Settings
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', red: '#dc2626', green: '#16a34a', purple: '#6D28D9', teal: '#0891B2', muted: '#6b7c93', border: 'rgba(11,37,69,0.08)' };
var font = "'Libre Baskerville', Georgia, serif";
var sans = "'DM Sans', system-ui, sans-serif";

var STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
var RACES = ['White','Black or African American','Hispanic or Latino','Asian','American Indian or Alaska Native','Native Hawaiian or Pacific Islander','Two or More Races','Other','Prefer not to say'];
var EDUCATION = ['Less than High School','High School Diploma/GED','Some College','Associate Degree','Bachelor\'s Degree','Master\'s Degree','Doctoral/Professional Degree'];
var EMPLOYMENT = ['Employed Full-Time','Employed Part-Time','Self-Employed','Unemployed','Student','Retired','Homemaker','Unable to Work'];
var INCOME = ['Under $25,000','$25,000 - $49,999','$50,000 - $74,999','$75,000 - $99,999','$100,000 - $149,999','$150,000 - $199,999','$200,000+','Prefer not to say'];
var PARTY = ['Democrat','Republican','Independent','Libertarian','Green','Other','No Affiliation'];
var HOUSING = ['Homeowner','Renter','Living with Family','Other'];
var MARITAL = ['Single','Married','Divorced','Widowed','Separated','Domestic Partnership'];

export default function CitizenAccount() {
  var navigate = useNavigate();
  var { user } = useAuth();
  var [profile, setProfile] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [saveMsg, setSaveMsg] = useState(null);
  var [activeTab, setActiveTab] = useState('profile');
  var [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  var [usernameStatus, setUsernameStatus] = useState(null);
  var [checkingUsername, setCheckingUsername] = useState(false);

  // Profile form
  var [form, setForm] = useState({
    full_name: '', username: '', phone: '', city: '', state: '', county: '', zip: '',
    date_of_birth: '', race: '', sex: '', education: '', employment: '',
    income: '', party: '', housing: '', marital_status: '',
    voter_registered: null, veteran: null
  });

  // Password
  var [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });
  var [pwSaving, setPwSaving] = useState(false);
  var [pwMsg, setPwMsg] = useState(null);

  // Delete
  var [showDelete, setShowDelete] = useState(false);
  var [deleteText, setDeleteText] = useState('');
  var [deleting, setDeleting] = useState(false);
  var [deleteError, setDeleteError] = useState('');

  useEffect(function () {
    function handleResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', handleResize);
    return function () { window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(function () { if (user) loadProfile(); }, [user]);

  async function loadProfile() {
    setLoading(true);
    var { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: data.full_name || '', username: data.username || '', phone: data.phone || '',
        city: data.city || '', state: data.state || '', county: data.county || '', zip: data.zip || '',
        date_of_birth: data.date_of_birth || '', race: data.race || '', sex: data.sex || '',
        education: data.education || '', employment: data.employment || '',
        income: data.income || '', party: data.party || '', housing: data.housing || '',
        marital_status: data.marital_status || '',
        voter_registered: data.voter_registered, veteran: data.veteran
      });
    }
    setLoading(false);
  }

  function updateForm(key, val) { setForm(function (p) { var n = Object.assign({}, p); n[key] = val; return n; }); }

  async function checkUsername(val) {
    if (!val || val.length < 3) { setUsernameStatus(null); return; }
    if (!/^[a-z0-9_]+$/.test(val)) { setUsernameStatus({ ok: false, msg: 'Only lowercase letters, numbers, underscores' }); return; }
    if (val.length > 25) { setUsernameStatus({ ok: false, msg: 'Max 25 characters' }); return; }
    if (profile && profile.username === val) { setUsernameStatus({ ok: true, msg: 'Current username' }); return; }
    setCheckingUsername(true);
    var { data } = await supabase.rpc('check_username_available', { desired_username: val });
    setCheckingUsername(false);
    if (data === true) { setUsernameStatus({ ok: true, msg: 'Available!' }); }
    else { setUsernameStatus({ ok: false, msg: 'Already taken' }); }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (form.username && usernameStatus && !usernameStatus.ok) { setSaveMsg({ type: 'error', text: 'Username is not available.' }); return; }
    setSaving(true); setSaveMsg(null);
    var updates = {
      full_name: form.full_name, username: form.username || null, phone: form.phone, city: form.city, state: form.state,
      county: form.county, zip: form.zip, date_of_birth: form.date_of_birth || null,
      race: form.race, sex: form.sex, education: form.education, employment: form.employment,
      income: form.income, party: form.party, housing: form.housing, marital_status: form.marital_status,
      voter_registered: form.voter_registered, veteran: form.veteran
    };
    var { error } = await supabase.from('users').update(updates).eq('id', user.id);
    setSaving(false);
    if (error) { setSaveMsg({ type: 'error', text: 'Failed to save. Please try again.' }); }
    else { setSaveMsg({ type: 'success', text: 'Profile saved successfully!' }); setTimeout(function () { setSaveMsg(null); }, 3000); }
  }

  async function handlePassword(e) {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.newPw.length < 8) { setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setPwSaving(true);
    var { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwSaving(false);
    if (error) { setPwMsg({ type: 'error', text: error.message }); return; }
    setPwMsg({ type: 'success', text: 'Password updated!' }); setPwForm({ newPw: '', confirm: '' });
    setTimeout(function () { setPwMsg(null); }, 3000);
  }

  async function handleDelete() {
    if (deleteText !== 'DELETE') { setDeleteError('Please type DELETE in capitals.'); return; }
    setDeleting(true); setDeleteError('');
    try {
      await supabase.from('responses').delete().eq('user_id', user.id);
      await supabase.from('community_posts').delete().eq('user_id', user.id);
      await supabase.from('community_post_comments').delete().eq('user_id', user.id);
      await supabase.from('community_post_likes').delete().eq('user_id', user.id);
      await supabase.from('community_post_reactions').delete().eq('user_id', user.id);
      await supabase.from('notifications').delete().eq('user_id', user.id);
      await supabase.from('survey_chat_messages').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) { setDeleting(false); setDeleteError('Something went wrong. Contact support@civicverify.org'); }
  }

  function InputField(props) {
    return (
      <div style={props.span2 ? { gridColumn: 'span 2' } : {}}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>{props.label}</label>
        {props.type === 'select' ? (
          <select value={props.value} onChange={function (e) { updateForm(props.field, e.target.value); }}
            style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: sans, border: '1.5px solid ' + C.border, borderRadius: 10, outline: 'none', color: props.value ? C.navy : 'rgba(11,37,69,0.3)', background: '#fff', boxSizing: 'border-box', cursor: 'pointer', appearance: 'auto' }}>
            <option value="">{props.placeholder || 'Select...'}</option>
            {props.options.map(function (o) { return <option key={o} value={o}>{o}</option>; })}
          </select>
        ) : props.type === 'toggle' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {['Yes', 'No'].map(function (opt) {
              var isActive = (opt === 'Yes' && props.value === true) || (opt === 'No' && props.value === false);
              return (<button key={opt} type="button" onClick={function () { updateForm(props.field, opt === 'Yes'); }}
                style={{ flex: 1, padding: '10px', border: isActive ? '2px solid ' + C.gold : '1.5px solid ' + C.border, borderRadius: 10, background: isActive ? C.gold + '10' : '#fff', color: isActive ? C.navy : 'rgba(11,37,69,0.35)', fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontFamily: sans, transition: 'all 0.15s' }}>
                {opt}
              </button>);
            })}
          </div>
        ) : (
          <input type={props.type || 'text'} value={props.value} onChange={function (e) { updateForm(props.field, e.target.value); }}
            placeholder={props.placeholder} disabled={props.disabled}
            style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: sans, border: '1.5px solid ' + C.border, borderRadius: 10, outline: 'none', color: props.disabled ? C.muted : C.navy, background: props.disabled ? 'rgba(11,37,69,0.03)' : '#fff', boxSizing: 'border-box', cursor: props.disabled ? 'not-allowed' : 'text' }} />
        )}
      </div>
    );
  }

  if (loading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ textAlign: 'center' }}><div style={{ width: 40, height: 40, border: '3px solid rgba(11,37,69,0.08)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} /><p style={{ fontSize: 14, color: C.muted }}>Loading account...</p></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>);

  var fields = [form.full_name, form.username, form.phone, form.state, form.city, form.zip, form.race, form.sex, form.date_of_birth, form.education, form.employment, form.income, form.party, form.housing, form.marital_status];
  var completePct = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  var tabs = [
    { key: 'profile', label: 'Profile', icon: '\uD83D\uDC64' },
    { key: 'demographics', label: 'Demographics', icon: '\uD83D\uDCCA' },
    { key: 'security', label: 'Security', icon: '\uD83D\uDD12' },
    { key: 'danger', label: 'Danger Zone', icon: '\u26A0\uFE0F' },
  ];

  return (
    <div style={{ fontFamily: sans, maxWidth: 960, margin: '0 auto' }}>
      <style>{'\
        @keyframes spin{to{transform:rotate(360deg)}}\
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}\
        .acc-card{background:#fff;border-radius:16px;border:1px solid rgba(11,37,69,0.06);padding:28px;box-shadow:0 1px 3px rgba(11,37,69,0.04),0 8px 24px rgba(11,37,69,0.03);animation:fadeUp 0.4s ease both;margin-bottom:16px}\
        .acc-btn{padding:11px 24px;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;display:inline-flex;align-items:center;gap:8px}\
        .acc-btn:active{transform:scale(0.97)}\
        .acc-tab{padding:8px 16px;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;white-space:nowrap;display:flex;align-items:center;gap:5px}\
        @media(max-width:768px){\
          .acc-form-grid{grid-template-columns:1fr!important}\
          .acc-form-grid>*{grid-column:span 1!important}\
          .acc-header-flex{flex-direction:column!important;align-items:flex-start!important}\
          .acc-delete-flex{flex-direction:column!important}\
        }\
        @media(max-width:480px){\
          .acc-tab-bar{gap:4px!important}\
          .acc-tab{padding:7px 10px!important;font-size:11px!important}\
        }\
      '}</style>

      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #132E52 50%, #1A3A5C 100%)', borderRadius: 20, padding: isMobile ? '24px 20px' : '32px 36px', marginBottom: 20, position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, ' + C.gold + '15 0%, transparent 70%)', borderRadius: '0 0 0 100%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, background: C.gold + '08', borderRadius: '50%' }} />
        <div className="acc-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gold + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{'\u2699\uFE0F'}</div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>Account Settings</h1>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 420, lineHeight: 1.5 }}>Manage your profile, demographics, password, and account preferences.</p>
            {form.username && <p style={{ fontSize: 12, color: C.gold, margin: '6px 0 0', fontWeight: 600 }}>@{form.username}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {profile?.identity_verified && (
              <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>VERIFIED</span>
              </div>
            )}
            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Complete</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', minWidth: 60 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: completePct === 100 ? C.green : C.gold, width: completePct + '%', transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: completePct === 100 ? C.green : C.gold }}>{completePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="acc-tab-bar" style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', padding: '2px 0', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {tabs.map(function (t) {
          var active = activeTab === t.key;
          return (<button key={t.key} className="acc-tab" onClick={function () { setActiveTab(t.key); }}
            style={{ background: active ? (t.key === 'danger' ? C.red : C.navy) : 'rgba(11,37,69,0.04)', color: active ? '#fff' : (t.key === 'danger' ? C.red : 'rgba(11,37,69,0.5)') }}>
            <span>{t.icon}</span> {t.label}
          </button>);
        })}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <form onSubmit={handleSave}>
            <div className="acc-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.navy + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83D\uDC64'}</div>
                <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Basic Information</h3><p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Your name, contact info, and location</p></div>
              </div>
              <div className="acc-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="Full Name" field="full_name" value={form.full_name} placeholder="Your full name" />
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>Email</label>
                  <input value={user?.email || ''} disabled style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: sans, border: '1.5px solid ' + C.border, borderRadius: 10, outline: 'none', color: C.muted, background: 'rgba(11,37,69,0.03)', boxSizing: 'border-box', cursor: 'not-allowed' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>Username (how people find you)</label>
                  <div style={{ position: 'relative', maxWidth: 340 }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.gold, fontWeight: 700, pointerEvents: 'none' }}>@</span>
                    <input value={form.username} onChange={function(e) { var v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); updateForm('username', v); checkUsername(v); }} placeholder="your_handle" maxLength={25} style={{ width: '100%', padding: '11px 14px 11px 30px', fontSize: 13, fontFamily: sans, border: '1.5px solid ' + (usernameStatus ? (usernameStatus.ok ? '#16a34a40' : '#dc262640') : C.border), borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
                    {form.username && form.username.length >= 3 && (<span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: checkingUsername ? 'rgba(11,37,69,0.3)' : usernameStatus ? (usernameStatus.ok ? '#16a34a' : '#dc2626') : 'rgba(11,37,69,0.3)' }}>{checkingUsername ? '...' : usernameStatus ? (usernameStatus.ok ? '✓ ' + usernameStatus.msg : '✗ ' + usernameStatus.msg) : ''}</span>)}
                  </div>
                  {form.username && form.username.length > 0 && form.username.length < 3 && (<p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: '4px 0 0' }}>Min 3 characters</p>)}
                </div>
                <InputField label="Phone" field="phone" value={form.phone} placeholder="(555) 000-0000" />
                <InputField label="Date of Birth" field="date_of_birth" value={form.date_of_birth} type="date" />
                <InputField label="City" field="city" value={form.city} placeholder="Your city" />
                <InputField label="County" field="county" value={form.county} placeholder="Your county" />
                <InputField label="State" field="state" value={form.state} type="select" options={STATES} placeholder="Select state" />
                <InputField label="ZIP Code" field="zip" value={form.zip} placeholder="46040" />
              </div>
            </div>

            {saveMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: saveMsg.type === 'success' ? C.green + '08' : C.red + '08', border: '1px solid ' + (saveMsg.type === 'success' ? C.green + '20' : C.red + '20'), animation: 'fadeUp 0.3s ease both' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: saveMsg.type === 'success' ? C.green : C.red, margin: 0 }}>{saveMsg.type === 'success' ? '\u2705' : '\u274C'} {saveMsg.text}</p>
              </div>
            )}

            <button type="submit" disabled={saving} className="acc-btn" style={{ background: C.navy, color: '#fff', opacity: saving ? 0.6 : 1, fontSize: 14, padding: '13px 32px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* DEMOGRAPHICS TAB */}
      {activeTab === 'demographics' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <form onSubmit={handleSave}>
            <div className="acc-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.purple + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83D\uDCCA'}</div>
                <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Demographic Details</h3><p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Used for survey matching — always kept private</p></div>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: '0 0 20px', padding: '10px 14px', borderRadius: 8, background: C.gold + '06', border: '1px solid ' + C.gold + '12', lineHeight: 1.5 }}>{'\uD83D\uDD12'} Your demographic data is encrypted and never shared with organizations. It is only used anonymously to match you with relevant surveys.</p>
              <div className="acc-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="Sex" field="sex" value={form.sex} type="select" options={['Male','Female','Non-binary','Prefer not to say']} />
                <InputField label="Race / Ethnicity" field="race" value={form.race} type="select" options={RACES} />
                <InputField label="Education" field="education" value={form.education} type="select" options={EDUCATION} />
                <InputField label="Employment" field="employment" value={form.employment} type="select" options={EMPLOYMENT} />
                <InputField label="Household Income" field="income" value={form.income} type="select" options={INCOME} />
                <InputField label="Political Party" field="party" value={form.party} type="select" options={PARTY} />
                <InputField label="Housing Status" field="housing" value={form.housing} type="select" options={HOUSING} />
                <InputField label="Marital Status" field="marital_status" value={form.marital_status} type="select" options={MARITAL} />
                <InputField label="Registered Voter" field="voter_registered" value={form.voter_registered} type="toggle" />
                <InputField label="Veteran" field="veteran" value={form.veteran} type="toggle" />
              </div>
            </div>

            {saveMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: saveMsg.type === 'success' ? C.green + '08' : C.red + '08', border: '1px solid ' + (saveMsg.type === 'success' ? C.green + '20' : C.red + '20'), animation: 'fadeUp 0.3s ease both' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: saveMsg.type === 'success' ? C.green : C.red, margin: 0 }}>{saveMsg.type === 'success' ? '\u2705' : '\u274C'} {saveMsg.text}</p>
              </div>
            )}

            <button type="submit" disabled={saving} className="acc-btn" style={{ background: C.navy, color: '#fff', opacity: saving ? 0.6 : 1, fontSize: 14, padding: '13px 32px' }}>
              {saving ? 'Saving...' : 'Save Demographics'}
            </button>
          </form>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          {/* Verification Status */}
          <div className="acc-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: profile?.identity_verified ? C.green + '10' : C.red + '06', flexShrink: 0 }}>
                {profile?.identity_verified ? '\u2705' : '\u26A0\uFE0F'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 3px' }}>{profile?.identity_verified ? 'Identity Verified' : 'Not Yet Verified'}</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{profile?.identity_verified ? 'Your identity has been confirmed. Your ID document has been permanently deleted.' : 'Verify your identity to participate in civic polls and surveys.'}</p>
              </div>
              {!profile?.identity_verified && (
                <button onClick={function () { navigate('/citizen/verify'); }} className="acc-btn" style={{ background: C.gold, color: '#fff', flexShrink: 0 }}>Verify Now {'\u2192'}</button>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="acc-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.teal + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83D\uDD12'}</div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Change Password</h3><p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Update your account password</p></div>
            </div>
            <form onSubmit={handlePassword}>
              <div className="acc-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>New Password</label>
                  <input type="password" value={pwForm.newPw} onChange={function (e) { setPwForm(function (p) { return Object.assign({}, p, { newPw: e.target.value }); }); }} placeholder="Min. 8 characters"
                    style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: sans, border: '1.5px solid ' + C.border, borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>Confirm Password</label>
                  <input type="password" value={pwForm.confirm} onChange={function (e) { setPwForm(function (p) { return Object.assign({}, p, { confirm: e.target.value }); }); }} placeholder="Repeat password"
                    style={{ width: '100%', padding: '11px 14px', fontSize: 13, fontFamily: sans, border: '1.5px solid ' + C.border, borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', boxSizing: 'border-box' }} />
                </div>
              </div>
              {pwMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: pwMsg.type === 'success' ? C.green + '08' : C.red + '08', border: '1px solid ' + (pwMsg.type === 'success' ? C.green + '20' : C.red + '20') }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: pwMsg.type === 'success' ? C.green : C.red, margin: 0 }}>{pwMsg.text}</p>
                </div>
              )}
              <button type="submit" disabled={pwSaving} className="acc-btn" style={{ background: C.navy, color: '#fff', opacity: pwSaving ? 0.6 : 1 }}>
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DANGER ZONE TAB */}
      {activeTab === 'danger' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="acc-card" style={{ border: '1px solid ' + C.red + '20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.red + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\u26A0\uFE0F'}</div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.red, fontFamily: font, margin: 0 }}>Danger Zone</h3><p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Irreversible account actions</p></div>
            </div>

            <div className="acc-delete-flex" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, padding: '18px 20px', borderRadius: 12, background: C.red + '04', border: '1px solid ' + C.red + '10' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Delete My Account</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: 400 }}>Permanently deletes your account, all survey responses, community posts, and personal data. This cannot be undone.</p>
              </div>
              <button onClick={function () { setShowDelete(true); }} className="acc-btn" style={{ background: 'transparent', border: '1.5px solid ' + C.red, color: C.red, flexShrink: 0 }}>Delete Account</button>
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(11,37,69,0.02)' }}>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0, lineHeight: 1.6 }}>
                {'\uD83D\uDCE7'} For data rights requests under ICDPA, visit <a href="/citizen/my-data" style={{ color: C.gold, fontWeight: 600 }}>My Data</a> or contact <a href="mailto:privacy@civicverify.org" style={{ color: C.gold, fontWeight: 600 }}>privacy@civicverify.org</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(8,28,53,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.25)', animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' }}>{'\u26A0\uFE0F'}</div>
            <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.navy, margin: '0 0 12px', textAlign: 'center' }}>Delete Your Account?</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '0 0 8px', textAlign: 'center' }}>This will permanently delete:</p>
            <div style={{ background: C.red + '06', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              {['Your profile and personal information', 'All your survey responses', 'All your community posts and comments', 'Your identity verification status'].map(function (item) {
                return (<div key={item} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center' }}><span style={{ color: C.red, fontSize: 12 }}>{'\u2717'}</span><span style={{ fontSize: 13, color: '#7f1d1d' }}>{item}</span></div>);
              })}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 8px' }}>Type <strong>DELETE</strong> to confirm:</p>
            <input value={deleteText} onChange={function (e) { setDeleteText(e.target.value); setDeleteError(''); }} placeholder="Type DELETE here"
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, fontFamily: 'monospace', border: '1.5px solid ' + (deleteText === 'DELETE' ? C.red : C.border), borderRadius: 10, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }} />
            {deleteError && <p style={{ fontSize: 13, color: C.red, margin: '0 0 12px' }}>{deleteError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={function () { setShowDelete(false); setDeleteText(''); setDeleteError(''); }}
                className="acc-btn" style={{ background: 'rgba(11,37,69,0.04)', color: C.navy, justifyContent: 'center', border: '1px solid ' + C.border }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting || deleteText !== 'DELETE'}
                className="acc-btn" style={{ background: deleteText === 'DELETE' ? C.red : '#fca5a5', color: '#fff', justifyContent: 'center', cursor: deleteText === 'DELETE' ? 'pointer' : 'not-allowed' }}>
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
