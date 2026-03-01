// src/pages/org/Profile.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font  = 'Libre Baskerville, Georgia, serif';
var sans  = 'DM Sans, system-ui, sans-serif';
var gold  = '#C5960C';
var goldL = '#F0B429';
var navy  = '#0B2545';
var bg    = '#f0f3f8';
var card  = '#ffffff';
var bdr   = 'rgba(11,37,69,0.08)';
var txt   = '#0B2545';
var muted = 'rgba(11,37,69,0.42)';
var faint = 'rgba(11,37,69,0.28)';

var inputStyle = {
  width:'100%', padding:'12px 16px', fontSize:14,
  border:'1px solid rgba(11,37,69,0.12)', borderRadius:10,
  outline:'none', color:txt, background:'#fff',
  fontFamily:sans, boxSizing:'border-box', transition:'border-color 0.2s',
};
var labelStyle = {
  display:'block', fontSize:10, fontWeight:700,
  textTransform:'uppercase', letterSpacing:1.8,
  color:faint, marginBottom:7,
};

var ORG_TYPES = [
  'Nonprofit / NGO','Government Agency','Research Institution',
  'University / Academic','Political Campaign','News / Media',
  'Corporation','Healthcare','Other',
];

var STATUS_CFG = {
  approved: { label:'Approved',      color:'#16a34a', bg:'rgba(22,163,74,0.09)',  border:'rgba(22,163,74,0.25)',  icon:'✅' },
  pending:  { label:'Pending Review',color:'#c5960c', bg:'rgba(197,150,12,0.09)', border:'rgba(197,150,12,0.25)', icon:'⏳' },
  rejected: { label:'Rejected',      color:'#dc2626', bg:'rgba(220,38,38,0.08)',  border:'rgba(220,38,38,0.25)',  icon:'❌' },
};

function Section({ icon, title, subtitle, children }) {
  return (
    <div style={{ background:card, border:'1px solid '+bdr, borderRadius:16,
      overflow:'hidden', boxShadow:'0 2px 12px rgba(11,37,69,0.06)', marginBottom:16 }}>
      <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid '+bdr,
        display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
          background:'linear-gradient(135deg,'+gold+','+goldL+')',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:15, boxShadow:'0 2px 8px rgba(197,150,12,0.25)' }}>{icon}</div>
        <div>
          <h2 style={{ fontSize:15, fontWeight:700, color:txt, margin:0, fontFamily:font }}>{title}</h2>
          {subtitle && <p style={{ fontSize:12, color:muted, margin:0 }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding:'20px 24px' }}>{children}</div>
    </div>
  );
}

export default function OrgProfile() {
  var { user } = useAuth();
  var [profile, setProfile]     = useState(null);
  var [form, setForm]           = useState({ full_name:'', org_name:'', org_type:'', email:'' });
  var [loading, setLoading]     = useState(true);
  var [saving, setSaving]       = useState(false);
  var [success, setSuccess]     = useState(false);
  var [error, setError]         = useState('');
  var [pwForm, setPwForm]       = useState({ newPw:'', confirm:'' });
  var [pwSaving, setPwSaving]   = useState(false);
  var [pwError, setPwError]     = useState('');
  var [pwSuccess, setPwSuccess] = useState(false);

  useEffect(function() {
    if (!user) return;
    (async function() {
      var { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({ full_name:data.full_name||'', org_name:data.org_name||'', org_type:data.org_type||'', email:user.email||'' });
      }
      setLoading(false);
    })();
  }, [user]);

  function set(k,v){ setForm(function(p){ return Object.assign({},p,{[k]:v}); }); setError(''); setSuccess(false); }

  async function saveProfile() {
    if (!form.full_name.trim()) return setError('Contact name is required');
    if (!form.org_name.trim())  return setError('Organisation name is required');
    setSaving(true);
    var { error:err } = await supabase.from('users').update({
      full_name: form.full_name.trim(),
      org_name:  form.org_name.trim(),
      org_type:  form.org_type || null,
    }).eq('id', user.id);
    setSaving(false);
    if (err) return setError(err.message);
    setSuccess(true);
    setTimeout(function(){ setSuccess(false); }, 3000);
  }

  async function changePassword() {
    setPwError(''); setPwSuccess(false);
    if (!pwForm.newPw)                   return setPwError('New password is required');
    if (pwForm.newPw.length < 8)         return setPwError('Password must be at least 8 characters');
    if (pwForm.newPw !== pwForm.confirm)  return setPwError('Passwords do not match');
    setPwSaving(true);
    var { error:err } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwSaving(false);
    if (err) return setPwError(err.message);
    setPwSuccess(true);
    setPwForm({ newPw:'', confirm:'' });
    setTimeout(function(){ setPwSuccess(false); }, 3000);
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(197,150,12,0.2)',
        borderTopColor:gold, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  var statusKey = profile?.org_status || 'pending';
  var sc        = STATUS_CFG[statusKey] || STATUS_CFG.pending;

  return (
    <div style={{ fontFamily:sans, background:bg, margin:'0 -24px -24px',
      width:'calc(100% + 48px)', paddingBottom:48, minHeight:'100vh' }}>
      <style>{`
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none} }
        .pf-input:focus   { border-color:rgba(197,150,12,0.5)!important; }
        .pf-input::placeholder { color:rgba(11,37,69,0.25); }
        .pf-btn           { transition:all 0.15s; cursor:pointer; }
        .pf-btn:hover     { filter:brightness(1.08); transform:translateY(-1px); }
        .pf-grid          { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:900px){ .pf-layout{grid-template-columns:1fr!important} .pf-sticky{position:static!important} }
        @media(max-width:600px){ .pf-hero{padding:20px 16px!important} .pf-body{padding:16px!important} .pf-grid{grid-template-columns:1fr!important} }
      `}</style>

      {/* ── HERO ────────────────────────────────── */}
      <div className="pf-hero" style={{
        background:'linear-gradient(135deg,'+navy+' 0%,#1a3a6e 60%,#0f3060 100%)',
        borderBottom:'3px solid '+gold,
        padding:'32px 40px', position:'relative', overflow:'hidden' }}>

        <svg style={{ position:'absolute', top:-50, right:-50, pointerEvents:'none', opacity:0.15 }}
          width="240" height="240" viewBox="0 0 240 240">
          {[40,75,110].map(function(r,i){
            return <circle key={i} cx="120" cy="120" r={r} fill="none"
              stroke={i%2===0?gold:'#60a5fa'} strokeWidth="0.8" />;
          })}
        </svg>

        <div style={{ position:'relative', zIndex:1,
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          flexWrap:'wrap', gap:20 }}>

          {/* Left: title + org name */}
          <div>
            <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:700, color:'#fff',
              margin:'0 0 5px', fontFamily:font }}>Organisation Profile</h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', margin:'0 0 18px' }}>
              Manage your account details and credentials
            </p>

            {/* Org name + type chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {form.org_name && (
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px',
                  background:'rgba(255,255,255,0.09)', border:'1px solid rgba(255,255,255,0.14)',
                  borderRadius:20 }}>
                  <span style={{ fontSize:13 }}>🏢</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{form.org_name}</span>
                </div>
              )}
              {form.org_type && (
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px',
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:20 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{form.org_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: account status card */}
          <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid '+sc.border,
            borderRadius:16, padding:'16px 20px', minWidth:220 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
              letterSpacing:1.8, color:'rgba(255,255,255,0.35)', margin:'0 0 10px' }}>Account Status</p>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:sc.color, flexShrink:0,
                animation: statusKey==='approved'?'none':'pulse 2s infinite',
                boxShadow: '0 0 0 3px '+sc.color+'30' }} />
              <span style={{ fontSize:16, fontWeight:700, color:sc.color }}>{sc.label}</span>
            </div>
            {statusKey==='approved' && profile?.org_approved_at && (
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0 }}>
                Approved {new Date(profile.org_approved_at).toLocaleDateString('en-US',
                  {month:'long',day:'numeric',year:'numeric'})}
              </p>
            )}
            {statusKey==='rejected' && profile?.org_rejected_reason && (
              <p style={{ fontSize:11, color:'rgba(248,113,113,0.8)', margin:0 }}>
                Reason: {profile.org_rejected_reason}
              </p>
            )}
            {statusKey==='pending' && (
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0 }}>
                Under admin review — usually 1–2 business days
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────── */}
      <div className="pf-body" style={{ padding:'28px 40px 0' }}>
        <div className="pf-layout" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'flex-start' }}>

          {/* LEFT: Forms */}
          <div>

            {/* Organisation Details */}
            <Section icon="🏢" title="Organisation Details" subtitle="Your public-facing organisation information">
              {error && (
                <div style={{ background:'rgba(220,38,38,0.07)', border:'1px solid rgba(220,38,38,0.2)',
                  borderRadius:10, padding:'10px 14px', marginBottom:14,
                  display:'flex', gap:8, alignItems:'center' }}>
                  <span>⚠️</span>
                  <p style={{ fontSize:13, color:'#dc2626', margin:0 }}>{error}</p>
                </div>
              )}
              {success && (
                <div style={{ background:'rgba(22,163,74,0.07)', border:'1px solid rgba(22,163,74,0.2)',
                  borderRadius:10, padding:'10px 14px', marginBottom:14,
                  display:'flex', gap:8, alignItems:'center' }}>
                  <span>✅</span>
                  <p style={{ fontSize:13, color:'#16a34a', margin:0 }}>Profile updated successfully</p>
                </div>
              )}

              <div className="pf-grid" style={{ marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>Contact Name <span style={{color:'#dc2626'}}>*</span></label>
                  <input className="pf-input" value={form.full_name}
                    onChange={function(e){ set('full_name',e.target.value); }}
                    placeholder="Your full name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input value={form.email} disabled
                    style={Object.assign({},inputStyle,{opacity:0.45,cursor:'not-allowed',background:'rgba(11,37,69,0.03)'})} />
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Organisation Name <span style={{color:'#dc2626'}}>*</span></label>
                <input className="pf-input" value={form.org_name}
                  onChange={function(e){ set('org_name',e.target.value); }}
                  placeholder="Your organisation's name" style={inputStyle} />
              </div>

              <div style={{ marginBottom:22 }}>
                <label style={labelStyle}>Organisation Type</label>
                <div style={{ position:'relative' }}>
                  <select className="pf-input" value={form.org_type}
                    onChange={function(e){ set('org_type',e.target.value); }}
                    style={Object.assign({},inputStyle,{appearance:'none',paddingRight:40,cursor:'pointer'})}>
                    <option value="">Select type…</option>
                    {ORG_TYPES.map(function(t){
                      return <option key={t} value={t}>{t}</option>;
                    })}
                  </select>
                  <span style={{ position:'absolute', right:14, top:'50%',
                    transform:'translateY(-50%)', pointerEvents:'none',
                    color:faint, fontSize:11 }}>▼</span>
                </div>
              </div>

              <button className="pf-btn" onClick={saveProfile} disabled={saving}
                style={{ padding:'12px 28px',
                  background:'linear-gradient(135deg,'+gold+','+goldL+')',
                  color:'#fff', border:'none', borderRadius:10,
                  fontSize:14, fontWeight:700, opacity:saving?0.6:1,
                  boxShadow:'0 4px 14px rgba(197,150,12,0.3)' }}>
                {saving ? '⏳ Saving…' : 'Save Changes'}
              </button>
            </Section>

            {/* Change Password */}
            <Section icon="🔒" title="Change Password" subtitle="Update your account password">
              {pwError && (
                <div style={{ background:'rgba(220,38,38,0.07)', border:'1px solid rgba(220,38,38,0.2)',
                  borderRadius:10, padding:'10px 14px', marginBottom:14,
                  display:'flex', gap:8, alignItems:'center' }}>
                  <span>⚠️</span>
                  <p style={{ fontSize:13, color:'#dc2626', margin:0 }}>{pwError}</p>
                </div>
              )}
              {pwSuccess && (
                <div style={{ background:'rgba(22,163,74,0.07)', border:'1px solid rgba(22,163,74,0.2)',
                  borderRadius:10, padding:'10px 14px', marginBottom:14,
                  display:'flex', gap:8, alignItems:'center' }}>
                  <span>✅</span>
                  <p style={{ fontSize:13, color:'#16a34a', margin:0 }}>Password updated successfully</p>
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>New Password</label>
                <input className="pf-input" type="password" value={pwForm.newPw}
                  onChange={function(e){ setPwForm(function(p){ return Object.assign({},p,{newPw:e.target.value}); }); }}
                  placeholder="At least 8 characters" style={inputStyle} />
              </div>
              <div style={{ marginBottom:22 }}>
                <label style={labelStyle}>Confirm New Password</label>
                <input className="pf-input" type="password" value={pwForm.confirm}
                  onChange={function(e){ setPwForm(function(p){ return Object.assign({},p,{confirm:e.target.value}); }); }}
                  placeholder="Repeat new password" style={inputStyle} />
              </div>

              <button className="pf-btn" onClick={changePassword} disabled={pwSaving}
                style={{ padding:'12px 28px', background:navy,
                  color:'#fff', border:'none', borderRadius:10,
                  fontSize:14, fontWeight:700, opacity:pwSaving?0.6:1,
                  boxShadow:'0 4px 14px rgba(11,37,69,0.2)' }}>
                {pwSaving ? '⏳ Updating…' : 'Update Password'}
              </button>
            </Section>

          </div>

          {/* RIGHT: Sidebar */}
          <div className="pf-sticky" style={{ position:'sticky', top:24, display:'grid', gap:16 }}>

            {/* Account Info */}
            <div style={{ background:card, border:'1px solid '+bdr, borderRadius:16,
              overflow:'hidden', boxShadow:'0 2px 12px rgba(11,37,69,0.06)' }}>
              <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid '+bdr }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:1.8, color:faint, margin:0 }}>Account Info</p>
              </div>
              <div style={{ padding:'14px 20px', display:'grid', gap:10 }}>
                {[
                  { label:'Account ID',   value: user?.id?.slice(0,8)+'…',     icon:'🔑' },
                  { label:'Member Since', value: profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})
                      : '—',                                                     icon:'📅' },
                  { label:'Account Type', value:'Organisation',                  icon:'🏢' },
                  { label:'Email',        value: user?.email || '—',             icon:'✉️' },
                ].map(function(item,i){
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'10px 12px', background:'rgba(11,37,69,0.03)',
                      border:'1px solid rgba(11,37,69,0.07)', borderRadius:10 }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{item.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                          letterSpacing:1.2, color:faint, margin:'0 0 2px' }}>{item.label}</p>
                        <p style={{ fontSize:13, fontWeight:600, color:txt, margin:0,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips card */}
            <div style={{ background:'linear-gradient(140deg,'+navy+',#1a3a6e)',
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:16,
              overflow:'hidden' }}>
              <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                  letterSpacing:1.8, color:'rgba(255,255,255,0.35)', margin:0 }}>💡 Profile Tips</p>
              </div>
              <div style={{ padding:'14px 20px', display:'grid', gap:12 }}>
                {[
                  { icon:'🏢', tip:'A complete org name and type helps admins approve your account faster.' },
                  { icon:'🔒', tip:'Use a strong password with letters, numbers and symbols.' },
                  { icon:'📋', tip:'Keep your contact details up to date for invoice delivery.' },
                ].map(function(t,i){
                  return (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{t.icon}</span>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', margin:0, lineHeight:1.6 }}>{t.tip}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Need help */}
            <div style={{ background:'rgba(197,150,12,0.08)', border:'1px solid rgba(197,150,12,0.2)',
              borderRadius:16, padding:'16px 20px' }}>
              <p style={{ fontSize:13, fontWeight:700, color:gold, margin:'0 0 6px' }}>Need help?</p>
              <p style={{ fontSize:12, color:muted, margin:'0 0 12px', lineHeight:1.6 }}>
                Contact our support team if you have questions about your account or billing.
              </p>
              <a href="mailto:support@civicverify.org"
                style={{ display:'inline-flex', alignItems:'center', gap:6,
                  fontSize:12, fontWeight:700, color:gold, textDecoration:'none' }}>
                ✉️ support@civicverify.org
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
