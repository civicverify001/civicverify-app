// src/pages/citizen/ManageMyData.jsx - ICDPA Data Rights (Redesigned)
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#2D9B5A', purple: '#6D28D9', teal: '#0891B2' };
var font = 'Libre Baskerville, Georgia, serif';

export default function ManageMyData() {
  var { user, profile } = useAuth();
  var [loading, setLoading] = useState(true);
  var [myData, setMyData] = useState(null);
  var [surveyCount, setSurveyCount] = useState(0);
  var [postCount, setPostCount] = useState(0);
  var [commentCount, setCommentCount] = useState(0);
  var [debateCount, setDebateCount] = useState(0);
  var [consent, setConsent] = useState(null);
  var [downloading, setDownloading] = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [deleteInput, setDeleteInput] = useState('');
  var [deleteSubmitted, setDeleteSubmitted] = useState(false);
  var [deleteError, setDeleteError] = useState('');
  var [activeSection, setActiveSection] = useState('summary');
  var [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(function () {
    function handleResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener('resize', handleResize);
    return function () { window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(function () { if (!user) return; loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      var { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
      setMyData(prof);
      if (prof) { setConsent({ privacy_terms: prof.consent_privacy_terms || false, age_verified: prof.consent_age_verified || false, data_processing: prof.consent_data_processing || false, timestamp: prof.consent_timestamp || null }); }
      var { count: sc } = await supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setSurveyCount(sc || 0);
      var { count: pc } = await supabase.from('community_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setPostCount(pc || 0);
      var { count: cc } = await supabase.from('community_post_comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setCommentCount(cc || 0);
      var { count: dc } = await supabase.from('debates').select('*', { count: 'exact', head: true }).or('creator_id.eq.' + user.id + ',opponent_id.eq.' + user.id);
      setDebateCount(dc || 0);
    } catch (e) { console.error('Error loading data:', e); }
    setLoading(false);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      var { data: profileData } = await supabase.from('users').select('full_name, email, phone, state, county, city, zip, race, sex, date_of_birth, education, employment, income, party, housing, marital_status, voter_registered, veteran, identity_verified, created_at, consent_privacy_terms, consent_age_verified, consent_data_processing, consent_timestamp').eq('id', user.id).single();
      var { data: responses } = await supabase.from('responses').select('survey_id, answers, created_at').eq('user_id', user.id);
      var { data: posts } = await supabase.from('community_posts').select('content, image_url, created_at, likes_count, dislikes_count, comment_count').eq('user_id', user.id).order('created_at', { ascending: false });
      var { data: comments } = await supabase.from('community_post_comments').select('content, image_url, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      var exportData = { exported_at: new Date().toISOString(), platform: 'CivicVerify', data_subject: user.id, profile: profileData, survey_responses: responses || [], community_posts: posts || [], community_comments: comments || [] };
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'civicverify-my-data-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { console.error('Download error:', e); alert('Error downloading data.'); }
    setDownloading(false);
  }

  async function handleDeleteRequest() {
    if (deleteInput !== 'DELETE MY DATA') { setDeleteError('Please type "DELETE MY DATA" exactly to confirm.'); return; }
    setDeleteError('');
    try { await supabase.from('data_deletion_requests').insert({ user_id: user.id, email: user.email, status: 'pending', requested_at: new Date().toISOString() }); setDeleteSubmitted(true); }
    catch (e) { setDeleteError('Error submitting request. Please email privacy@civicverify.org instead.'); }
  }

  if (loading) return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ textAlign: 'center' }}><div style={{ width: 40, height: 40, border: '3px solid rgba(11,37,69,0.08)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} /><p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)' }}>Loading your data...</p></div><style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style></div>);

  var accountAge = myData ? Math.floor((Date.now() - new Date(myData.created_at).getTime()) / 86400000) : 0;
  var accountAgeLabel = accountAge < 30 ? accountAge + 'd' : accountAge < 365 ? Math.floor(accountAge / 30) + 'mo' : Math.floor(accountAge / 365) + 'yr';
  var tabs = [{ key: 'summary', label: 'Overview', icon: '\uD83D\uDCCA' }, { key: 'personal', label: 'Personal Info', icon: '\uD83D\uDC64' }, { key: 'consent', label: 'Consent', icon: '\u2705' }, { key: 'actions', label: 'Actions', icon: '\u2699\uFE0F' }, { key: 'rights', label: 'Your Rights', icon: '\uD83D\uDCDC' }];

  var personalFields = [
    { label: 'Full Name', val: myData?.full_name }, { label: 'Email', val: myData?.email }, { label: 'Phone', val: myData?.phone },
    { label: 'Date of Birth', val: myData?.date_of_birth }, { label: 'State', val: myData?.state }, { label: 'County', val: myData?.county },
    { label: 'City', val: myData?.city }, { label: 'ZIP Code', val: myData?.zip }, { label: 'Race/Ethnicity', val: myData?.race },
    { label: 'Sex', val: myData?.sex }, { label: 'Education', val: myData?.education }, { label: 'Employment', val: myData?.employment },
    { label: 'Income', val: myData?.income }, { label: 'Political Party', val: myData?.party }, { label: 'Housing', val: myData?.housing },
    { label: 'Marital Status', val: myData?.marital_status },
    { label: 'Voter Registered', val: myData?.voter_registered != null ? (myData.voter_registered ? 'Yes' : 'No') : null },
    { label: 'Veteran', val: myData?.veteran != null ? (myData.veteran ? 'Yes' : 'No') : null },
    { label: 'Identity Verified', val: myData?.identity_verified ? 'Yes' : 'No' },
    { label: 'Account Created', val: myData?.created_at ? new Date(myData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null },
  ];
  var filledCount = personalFields.filter(function (f) { return f.val; }).length;
  var totalCount = personalFields.length;
  var completePct = Math.round((filledCount / totalCount) * 100);

  var css = '@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .mmd-card{background:#fff;border-radius:16px;border:1px solid rgba(11,37,69,0.06);padding:24px;box-shadow:0 1px 3px rgba(11,37,69,0.04),0 8px 24px rgba(11,37,69,0.03);animation:fadeUp 0.4s ease both;transition:box-shadow 0.2s;margin-bottom:16px} .mmd-card:hover{box-shadow:0 1px 3px rgba(11,37,69,0.06),0 12px 32px rgba(11,37,69,0.06)} .mmd-btn{padding:11px 24px;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;display:inline-flex;align-items:center;gap:8px} .mmd-btn:active{transform:scale(0.97)} .mmd-field{padding:12px 14px;border-radius:10px;background:rgba(11,37,69,0.018);border:1px solid rgba(11,37,69,0.04);transition:all 0.15s} .mmd-field:hover{background:rgba(11,37,69,0.03);border-color:rgba(11,37,69,0.08)} .mmd-tab{padding:8px 16px;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;white-space:nowrap;display:flex;align-items:center;gap:5px} @media(max-width:768px){.mmd-stats-grid{grid-template-columns:repeat(2,1fr)!important} .mmd-personal-grid{grid-template-columns:1fr!important} .mmd-rights-grid{grid-template-columns:1fr!important} .mmd-header-flex{flex-direction:column!important;align-items:flex-start!important} .mmd-actions-grid{grid-template-columns:1fr!important}} @media(max-width:480px){.mmd-stats-grid{grid-template-columns:1fr 1fr!important} .mmd-tab-bar{gap:4px!important} .mmd-tab{padding:7px 10px!important;font-size:11px!important}}';

  return (
    <div style={{ fontFamily: 'DM Sans, -apple-system, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <style>{css}</style>

      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #132E52 50%, #1A3A5C 100%)', borderRadius: 20, padding: isMobile ? '24px 20px' : '32px 36px', marginBottom: 20, position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, ' + C.gold + '15 0%, transparent 70%)', borderRadius: '0 0 0 100%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, background: C.gold + '08', borderRadius: '50%' }} />
        <div className="mmd-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gold + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{'\uD83D\uDD12'}</div>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>My Data</h1>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 420, lineHeight: 1.5 }}>View, download, correct, or delete your personal data. Protected under the Indiana Consumer Data Protection Act.</p>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Profile</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', minWidth: 60 }}>
                <div style={{ height: '100%', borderRadius: 2, background: completePct === 100 ? C.green : C.gold, width: completePct + '%', transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: completePct === 100 ? C.green : C.gold }}>{completePct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mmd-tab-bar" style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', padding: '2px 0', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {tabs.map(function (t) {
          var active = activeSection === t.key;
          return (<button key={t.key} className="mmd-tab" onClick={function () { setActiveSection(t.key); }} style={{ background: active ? C.navy : 'rgba(11,37,69,0.04)', color: active ? '#fff' : 'rgba(11,37,69,0.5)' }}><span>{t.icon}</span> {t.label}</button>);
        })}
      </div>

      {/* OVERVIEW TAB */}
      {activeSection === 'summary' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="mmd-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[{ label: 'Surveys', val: surveyCount, color: C.navy, icon: '\uD83D\uDCCB' }, { label: 'Posts', val: postCount, color: C.gold, icon: '\uD83D\uDCAC' }, { label: 'Comments', val: commentCount, color: C.teal, icon: '\uD83D\uDDE8\uFE0F' }, { label: 'Debates', val: debateCount, color: C.purple, icon: '\uD83C\uDFDB\uFE0F' }, { label: 'Member', val: accountAgeLabel, color: C.green, icon: '\uD83D\uDCC5' }].map(function (s, i) {
              return (<div key={i} style={{ background: 'linear-gradient(135deg, ' + s.color + '08, ' + s.color + '15)', borderRadius: 14, padding: isMobile ? '16px 14px' : '20px 18px', borderLeft: '3px solid ' + s.color + '40', animation: 'fadeUp 0.3s ease both', animationDelay: (i * 0.05) + 's' }}><div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div><div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: s.color, fontFamily: font, lineHeight: 1 }}>{s.val}</div><div style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', marginTop: 4, fontWeight: 600 }}>{s.label}</div></div>);
            })}
          </div>
          <div className="mmd-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.navy + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83D\uDCCA'}</div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Data Footprint</h3><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>What CivicVerify stores about you</p></div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[{ category: 'Profile Information', count: filledCount + ' of ' + totalCount + ' fields', pct: completePct, color: C.navy }, { category: 'Survey Participation', count: surveyCount + ' responses recorded', pct: Math.min(surveyCount * 10, 100), color: C.gold }, { category: 'Community Activity', count: (postCount + commentCount) + ' posts & comments', pct: Math.min((postCount + commentCount) * 5, 100), color: C.teal }, { category: 'Debate Participation', count: debateCount + ' debates joined', pct: Math.min(debateCount * 20, 100), color: C.purple }].map(function (row, i) {
                return (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(11,37,69,0.015)', border: '1px solid rgba(11,37,69,0.04)' }}><div style={{ flex: 1 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{row.category}</span><span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)' }}>{row.count}</span></div><div style={{ height: 5, borderRadius: 3, background: 'rgba(11,37,69,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, background: row.color, width: row.pct + '%', transition: 'width 1s ease', minWidth: row.pct > 0 ? 4 : 0 }} /></div></div></div>);
              })}
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL INFO TAB */}
      {activeSection === 'personal' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="mmd-card">
            <div className="mmd-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83D\uDC64'}</div>
                <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Personal Information</h3><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>{filledCount} of {totalCount} fields completed</p></div>
              </div>
              <a href="/citizen/account" className="mmd-btn" style={{ background: C.gold, color: '#fff', fontSize: 12, padding: '8px 18px', textDecoration: 'none' }}>Edit {'\u2192'}</a>
            </div>
            <div className="mmd-personal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {personalFields.map(function (field, i) {
                var hasVal = !!field.val;
                return (<div key={field.label} className="mmd-field" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: (i * 0.02) + 's', borderLeft: '3px solid ' + (hasVal ? C.green + '30' : 'rgba(11,37,69,0.06)') }}><p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>{field.label}</p>{hasVal ? <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0, wordBreak: 'break-word' }}>{field.val}</p> : <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.2)', margin: 0, fontStyle: 'italic' }}>Not provided</p>}</div>);
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONSENT TAB */}
      {activeSection === 'consent' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="mmd-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\u2705'}</div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Consent Records</h3><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Consents provided during registration</p></div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              {[{ label: 'Privacy Policy & Terms of Service', given: consent?.privacy_terms, desc: 'Agreed to platform privacy policy and terms' }, { label: 'Age Verification (18+)', given: consent?.age_verified, desc: 'Confirmed being 18 years or older' }, { label: 'Demographic Data Processing', given: consent?.data_processing, desc: 'Consent to use demographics for survey matching' }].map(function (c, i) {
                return (<div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, background: c.given ? C.green + '06' : 'rgba(11,37,69,0.02)', border: '1px solid ' + (c.given ? C.green + '15' : 'rgba(11,37,69,0.06)'), animation: 'fadeUp 0.3s ease both', animationDelay: (i * 0.05) + 's' }}><div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: c.given ? C.green + '15' : 'rgba(11,37,69,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.given ? '\u2705' : '\u274C'}</div><div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>{c.label}</p><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>{c.desc}</p></div><span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: c.given ? C.green + '12' : C.red + '08', color: c.given ? C.green : C.red, flexShrink: 0 }}>{c.given ? 'GIVEN' : 'N/A'}</span></div>);
              })}
            </div>
            {consent?.timestamp && (<div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(11,37,69,0.02)', border: '1px solid rgba(11,37,69,0.04)' }}><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>{'\uD83D\uDD52'} Consent recorded on <strong style={{ color: C.navy }}>{new Date(consent.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p></div>)}
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>Consent was given under the <a href="/privacy" style={{ color: C.gold, fontWeight: 600 }}>Privacy Policy</a> effective at the time of signup.</p>
          </div>
        </div>
      )}

      {/* ACTIONS TAB */}
      {activeSection === 'actions' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="mmd-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="mmd-card" style={{ margin: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, ' + C.navy + '10, ' + C.navy + '20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{'\uD83D\uDCE5'}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 6px' }}>Download Data</h3>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: '0 0 18px', lineHeight: 1.6 }}>Get a complete copy of everything CivicVerify stores about you in JSON format.</p>
              <button onClick={handleDownload} disabled={downloading} className="mmd-btn" style={{ background: C.navy, color: '#fff', width: '100%', justifyContent: 'center', opacity: downloading ? 0.6 : 1 }}>{downloading ? 'Preparing...' : '\uD83D\uDCE5 Download All Data'}</button>
            </div>
            <div className="mmd-card" style={{ margin: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, ' + C.gold + '10, ' + C.gold + '20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{'\u270F\uFE0F'}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 6px' }}>Correct Data</h3>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: '0 0 18px', lineHeight: 1.6 }}>Fix any inaccurate personal data through your account settings or contact our team.</p>
              <a href="/citizen/account" className="mmd-btn" style={{ background: C.gold, color: '#fff', width: '100%', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Account Settings</a>
            </div>
          </div>
          <div className="mmd-card" style={{ border: '1px solid ' + C.red + '15' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.red + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{'\uD83D\uDDD1\uFE0F'}</div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.red, fontFamily: font, margin: '0 0 2px' }}>Delete Account & Data</h3><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Permanently remove all your data within 45 days</p></div>
            </div>
            {deleteSubmitted ? (
              <div style={{ background: C.green + '08', border: '1px solid ' + C.green + '20', borderRadius: 12, padding: '18px 20px' }}><p style={{ fontSize: 14, fontWeight: 700, color: C.green, margin: '0 0 6px' }}>{'\u2705'} Deletion Request Submitted</p><p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.6 }}>We will process your request within 45 days. Confirmation will be sent to <strong>{user?.email}</strong>.</p></div>
            ) : !showDeleteConfirm ? (
              <button onClick={function () { setShowDeleteConfirm(true); }} className="mmd-btn" style={{ background: C.red + '10', color: C.red, border: '1px solid ' + C.red + '20' }}>Request Account Deletion</button>
            ) : (
              <div style={{ background: C.red + '04', border: '1px solid ' + C.red + '15', borderRadius: 12, padding: '18px 20px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.red, margin: '0 0 8px' }}>{'\u26A0\uFE0F'} This action cannot be undone</p>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 6px', lineHeight: 1.6 }}>This will permanently remove your profile, posts, comments, verification status, and all consent records.</p>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 12px' }}>Type <strong style={{ color: C.red, fontFamily: 'monospace' }}>DELETE MY DATA</strong> to confirm:</p>
                <input type="text" value={deleteInput} onChange={function (e) { setDeleteInput(e.target.value); setDeleteError(''); }} placeholder="DELETE MY DATA" style={{ width: '100%', maxWidth: 280, padding: '10px 14px', border: '1.5px solid ' + C.red + '25', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', marginBottom: 10, boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
                {deleteError && <p style={{ fontSize: 12, color: C.red, margin: '0 0 10px' }}>{deleteError}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleDeleteRequest} className="mmd-btn" style={{ background: C.red, color: '#fff' }}>Confirm Deletion</button>
                  <button onClick={function () { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }} className="mmd-btn" style={{ background: 'rgba(11,37,69,0.05)', color: C.navy }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIGHTS TAB */}
      {activeSection === 'rights' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <div className="mmd-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'\uD83C\uDFDB\uFE0F'}</div>
              <div><h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: 0 }}>Your Rights Under ICDPA</h3><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Indiana Consumer Data Protection Act</p></div>
            </div>
            <div className="mmd-rights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[{ right: 'Right to Know', desc: 'View what data we store about you', status: 'Available', color: C.green, icon: '\uD83D\uDD0D', action: 'Overview tab' }, { right: 'Right to Correct', desc: 'Fix any inaccurate personal data', status: 'Available', color: C.green, icon: '\u270F\uFE0F', action: 'Account Settings' }, { right: 'Right to Delete', desc: 'Request deletion of your data', status: 'Available', color: C.green, icon: '\uD83D\uDDD1\uFE0F', action: 'Actions tab' }, { right: 'Right to Portability', desc: 'Download a copy of your data', status: 'Available', color: C.green, icon: '\uD83D\uDCE5', action: 'Actions tab' }, { right: 'Right to Opt Out', desc: 'Opt out of data sales', status: 'N/A', color: 'rgba(11,37,69,0.3)', icon: '\uD83D\uDEAB', action: 'We never sell data' }, { right: 'Right to Appeal', desc: 'Appeal a declined request', status: 'Available', color: C.green, icon: '\uD83D\uDCE7', action: 'privacy@civicverify.org' }].map(function (r, i) {
                return (<div key={r.right} style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(11,37,69,0.015)', border: '1px solid rgba(11,37,69,0.05)', animation: 'fadeUp 0.3s ease both', animationDelay: (i * 0.04) + 's' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}><span style={{ fontSize: 18 }}>{r.icon}</span><span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{r.right}</span></div><p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: '0 0 10px', lineHeight: 1.5 }}>{r.desc}</p><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: r.color + '12', padding: '3px 10px', borderRadius: 20 }}>{'\u2713'} {r.status}</span><span style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)' }}>{r.action}</span></div></div>);
              })}
            </div>
            <div style={{ marginTop: 18, padding: '14px 18px', borderRadius: 10, background: C.gold + '06', border: '1px solid ' + C.gold + '15' }}>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.6 }}>{'\uD83D\uDCE7'} For any data rights requests, contact <a href="mailto:privacy@civicverify.org" style={{ color: C.gold, fontWeight: 700 }}>privacy@civicverify.org</a></p>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}
