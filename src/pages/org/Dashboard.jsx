// src/pages/org/Dashboard.jsx — Org onboarding + approval gate + dashboard
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';
var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: '#0B2545', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 };

var TERMS = "CIVICVERIFY ORGANIZATION AGREEMENT\n\nEffective upon approval of your organization account.\n\n1. SERVICE DESCRIPTION\nCivicVerify (\"Platform\") provides verified civic polling services. Organizations (\"Client\") may commission surveys distributed to identity-verified citizens. All responses are anonymized and aggregated.\n\n2. PRICING & PAYMENT\n(a) Base Rate: $3.50 per verified response for general audience surveys.\n(b) Targeted Surveys: Additional fees apply based on demographic refinement:\n    - 1-2 demographic filters: $4.50 per response\n    - 3-4 demographic filters: $5.50 per response\n    - 5+ demographic filters: $7.00 per response\n    - Geographic micro-targeting (city/ZIP level): +$1.00 per response\n(c) Invoices are issued upon survey completion or monthly, whichever comes first.\n(d) Payment is due within 30 days of invoice date. Late payments accrue 1.5% monthly interest.\n(e) All prices are in USD and exclusive of applicable taxes.\n\n3. VERIFICATION REQUIREMENTS\n(a) Business Organizations must provide a valid business license, articles of incorporation, or equivalent government-issued registration document.\n(b) Individual Researchers/Consultants must provide a government-issued photo ID (driver's license or passport) and a brief description of intended use.\n(c) CivicVerify reserves the right to request additional documentation at any time.\n(d) Fraudulent or misleading documentation will result in immediate account termination.\n\n4. DATA USAGE & PRIVACY\n(a) All survey responses are anonymized. No individually identifiable data is shared with organizations.\n(b) Organizations receive aggregated response data and demographic breakdowns only.\n(c) Organizations may not attempt to re-identify, de-anonymize, or cross-reference individual respondents.\n(d) Survey data is licensed for the Client's internal use only. Redistribution, resale, or public attribution of raw data requires written consent from CivicVerify.\n(e) CivicVerify complies with all applicable data protection laws including CCPA and state-level privacy regulations.\n\n5. SURVEY CONTENT POLICY\n(a) Surveys must be factual, non-misleading, and relevant to civic, policy, or community topics.\n(b) Prohibited content includes: push polls designed to influence rather than measure opinion, surveys containing hate speech or discriminatory language, misleading or deceptive questions, content that violates any applicable law.\n(c) CivicVerify reserves the right to reject, modify, or remove any survey at its sole discretion.\n(d) All surveys are subject to editorial review prior to distribution.\n\n6. INTELLECTUAL PROPERTY\n(a) CivicVerify retains ownership of the Platform, methodology, and verification systems.\n(b) Organizations retain ownership of their survey questions and commissioned content.\n(c) CivicVerify may use anonymized, aggregated response data for platform improvement, research, and public reporting.\n\n7. ACCOUNT SUSPENSION & TERMINATION\n(a) CivicVerify may suspend or terminate any organization account for: violation of these terms, fraudulent activity, non-payment exceeding 60 days, or any conduct deemed harmful to the Platform or its users.\n(b) Upon termination, outstanding invoices remain payable. Access to historical data will be maintained for 90 days.\n\n8. LIABILITY & DISCLAIMERS\n(a) CivicVerify provides data \"as-is\" and makes no guarantees regarding specific response rates, completion timelines, or statistical significance.\n(b) CivicVerify's total liability shall not exceed the fees paid by the Client in the preceding 12 months.\n(c) CivicVerify is not responsible for decisions made based on survey data.\n\n9. DISPUTE RESOLUTION\nAny disputes shall be resolved through binding arbitration in the State of Indiana, under the rules of the American Arbitration Association.\n\n10. AMENDMENTS\nCivicVerify may update these terms with 30 days written notice. Continued use constitutes acceptance of updated terms.\n\nBy submitting your verification documents and creating an organization account, you acknowledge that you have read, understood, and agree to be bound by these terms.";

export default function OrgDashboard() {
  var navigate = useNavigate();
  var auth = useAuth(); var profile = auth.profile; var user = auth.user;
  var [form, setForm] = useState({ org_name: '', org_type: 'business', description: '', agreeTerms: false });
  var [file, setFile] = useState(null);
  var [uploading, setUploading] = useState(false);
  var [error, setError] = useState('');
  var [showTerms, setShowTerms] = useState(false);
  var fileRef = useRef(null);

  if (!profile) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>;

  var status = profile.org_status || 'pending';

  // ===== PENDING: Show onboarding form =====
  if (status === 'pending' && !profile.org_license_url) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, ' + C.cream + ' 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>CV</span></div>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(11,37,69,0.06)', border: '1px solid rgba(11,37,69,0.06)' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Organization Verification</h1>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Submit your documents for review. Pricing and features unlock upon approval.</p>

            {error && <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 13, color: C.red, margin: 0 }}>{'\u26A0'} {error}</p></div>}

            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Organization / Company Name <span style={{ color: C.red }}>*</span></label><input value={form.org_name} onChange={function(e){ setForm(Object.assign({}, form, { org_name: e.target.value })); setError(''); }} placeholder="e.g., Hoosier Policy Research Institute" style={inputStyle} /></div>

            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Account Type <span style={{ color: C.red }}>*</span></label>
              <select value={form.org_type} onChange={function(e){ setForm(Object.assign({}, form, { org_type: e.target.value })); }} style={selectStyle}>
                <option value="business">Business / Organization</option>
                <option value="government">Government Agency</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="academic">Academic / Research</option>
                <option value="media">Media / Journalism</option>
                <option value="political">Political Campaign / PAC</option>
                <option value="individual">Individual Researcher / Consultant</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Brief Description of Intended Use</label><textarea value={form.description} onChange={function(e){ setForm(Object.assign({}, form, { description: e.target.value })); }} placeholder="How do you plan to use CivicVerify data?" rows={3} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} /></div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Verification Document <span style={{ color: C.red }}>*</span></label>
              <div style={{ background: 'rgba(11,37,69,0.02)', border: '2px dashed rgba(11,37,69,0.1)', borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer' }} onClick={function(){ fileRef.current && fileRef.current.click(); }}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={function(e){ if (e.target.files[0]) setFile(e.target.files[0]); }} />
                {file ? (
                  <div><span style={{ fontSize: 24 }}>{'\uD83D\uDCC4'}</span><p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '8px 0 2px' }}>{file.name}</p><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: 0 }}>{(file.size / 1024).toFixed(0)} KB — Click to change</p></div>
                ) : (
                  <div><span style={{ fontSize: 32 }}>{'\uD83D\uDCC1'}</span><p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '8px 0 2px' }}>Upload Document</p><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: 0 }}>Business license, articles of incorporation, or government-issued ID</p><p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0' }}>PDF, JPG, or PNG — Max 10MB</p></div>
                )}
              </div>
            </div>

            {/* Terms */}
            <div style={{ background: 'rgba(11,37,69,0.02)', border: '1px solid rgba(11,37,69,0.06)', borderRadius: 12, padding: 16, marginBottom: 16, maxHeight: showTerms ? 400 : 0, overflow: showTerms ? 'auto' : 'hidden', transition: 'max-height 0.3s' }}>
              <pre style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>{TERMS}</pre>
            </div>
            <button onClick={function(){ setShowTerms(!showTerms); }} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, padding: 0 }}>{showTerms ? 'Hide' : 'Read'} Organization Agreement {showTerms ? '\u25B2' : '\u25BC'}</button>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={form.agreeTerms} onChange={function(e){ setForm(Object.assign({}, form, { agreeTerms: e.target.checked })); }} style={{ marginTop: 3, width: 18, height: 18, accentColor: C.gold }} />
              <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.45)', lineHeight: 1.5 }}I have read and agree to the <span style={{ color: C.gold, fontWeight: 600 }}>Organization Agreement</span> and data usage policies. Pricing and platform access details will be provided upon approval. I certify that the uploaded document is authentic and belongs to my organization.</span>
            </label>

            <button onClick={async function(){
              if (!form.org_name.trim()) return setError('Organization name is required');
              if (!file) return setError('Please upload a verification document');
              if (!form.agreeTerms) return setError('You must agree to the Organization Agreement');
              setUploading(true);
              var ext = file.name.split('.').pop();
              var path = user.id + '/verification.' + ext;
              var up = await supabase.storage.from('org-docs').upload(path, file, { upsert: true });
              if (up.error) { setUploading(false); return setError('Upload failed: ' + up.error.message); }
              var url = supabase.storage.from('org-docs').getPublicUrl(path).data.publicUrl;
              var res = await supabase.from('users').update({ org_name: form.org_name.trim(), org_type: form.org_type, org_license_url: path, org_status: 'pending' }).eq('id', user.id);
              setUploading(false);
              if (res.error) return setError(res.error.message);
              window.location.reload();
            }} disabled={uploading} style={{ width: '100%', padding: 14, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading...' : 'Submit for Review'}
            </button>

            <button onClick={async function(){ await supabase.auth.signOut(); navigate('/'); }} style={{ width: '100%', marginTop: 12, padding: 12, background: 'rgba(11,37,69,0.03)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== PENDING (submitted): Show waiting screen =====
  if (status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, ' + C.cream + ' 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 32px', boxShadow: '0 4px 24px rgba(11,37,69,0.06)', border: '1px solid rgba(11,37,69,0.06)' }}>
            <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>{'\u23F3'}</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Application Under Review</h1>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px', lineHeight: 1.6 }}>Your organization verification documents have been submitted and are being reviewed by our team. This typically takes 1-2 business days.</p>
            <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>{profile.org_name || 'Your Organization'}</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Type: {profile.org_type || 'Business'} &middot; Submitted: {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Recently'}</p>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: 0 }}>Questions? Contact support@civicverify.org</p>
            <button onClick={async function(){ await supabase.auth.signOut(); navigate('/'); }} style={{ marginTop: 20, padding: '10px 24px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== REJECTED =====
  if (status === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, ' + C.cream + ' 0%, #fff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 32px', boxShadow: '0 4px 24px rgba(11,37,69,0.06)', border: '1px solid rgba(11,37,69,0.06)' }}>
            <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>{'\u274C'}</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.red, margin: '0 0 8px', fontFamily: font }}>Application Not Approved</h1>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 16px', lineHeight: 1.6 }}>Unfortunately, your organization application was not approved.</p>
            {profile.org_rejected_reason && <div style={{ background: C.red + '06', border: '1px solid ' + C.red + '15', borderRadius: 10, padding: 14, marginBottom: 20 }}><p style={{ fontSize: 13, color: C.red, margin: 0 }}><strong>Reason:</strong> {profile.org_rejected_reason}</p></div>}
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: 0 }}>Contact support@civicverify.org to resolve this issue or resubmit.</p>
            <button onClick={async function(){ await supabase.auth.signOut(); navigate('/'); }} style={{ marginTop: 20, padding: '10px 24px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== APPROVED: Full Dashboard =====
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Welcome, {profile.org_name || profile.full_name}</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>Commission verified civic data from real citizens</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.25)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{'\u2705'} Account Status</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.green, margin: 0, fontFamily: font }}>Approved</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.25)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>{'\uD83D\uDCB0'} Base Rate</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>$3.50<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(11,37,69,0.3)' }}>/response</span></p>
        </div>
      </div>

      {/* Pricing table */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>{'\uD83D\uDCB3'} Pricing Schedule</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ borderBottom: '2px solid rgba(11,37,69,0.06)' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'rgba(11,37,69,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Tier</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'rgba(11,37,69,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Filters</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', color: 'rgba(11,37,69,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Per Response</th>
          </tr></thead>
          <tbody>
            {[
              { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50' },
              { tier: 'Basic Targeting', desc: '1-2 demographic filters', price: '$4.50' },
              { tier: 'Refined Targeting', desc: '3-4 demographic filters', price: '$5.50' },
              { tier: 'Precision Targeting', desc: '5+ demographic filters', price: '$7.00' },
              { tier: 'Geo Micro-Target', desc: 'City or ZIP level add-on', price: '+$1.00' },
            ].map(function(r, i) {
              return <tr key={i} style={{ borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: C.navy }}>{r.tier}</td>
                <td style={{ padding: '12px', color: 'rgba(11,37,69,0.4)' }}>{r.desc}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: C.gold }}>{r.price}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <button onClick={function(){ navigate('/org/request'); }} style={{ padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.2)' }}>Request a Survey {'\u2192'}</button>
    </div>
  );
}
