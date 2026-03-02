// src/pages/citizen/ManageMyData.jsx — ICDPA Data Rights Page
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#2D9B5A' };
var font = 'Libre Baskerville, Georgia, serif';

var cardStyle = { background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.07)', padding: '22px 24px', marginBottom: 16, boxShadow: '0 2px 12px rgba(11,37,69,0.04)' };
var h3Style = { fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: font, margin: '0 0 6px' };
var pStyle = { fontSize: 13, lineHeight: 1.6, color: 'rgba(11,37,69,0.5)', margin: '0 0 14px' };
var labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' };
var valStyle = { fontSize: 14, color: C.navy, margin: '0 0 14px', wordBreak: 'break-word' };

export default function ManageMyData() {
  var { user, profile } = useAuth();
  var [loading, setLoading] = useState(true);
  var [myData, setMyData] = useState(null);
  var [surveyCount, setSurveyCount] = useState(0);
  var [postCount, setPostCount] = useState(0);
  var [commentCount, setCommentCount] = useState(0);
  var [consent, setConsent] = useState(null);
  var [downloading, setDownloading] = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [deleteInput, setDeleteInput] = useState('');
  var [deleteSubmitted, setDeleteSubmitted] = useState(false);
  var [deleteError, setDeleteError] = useState('');

  useEffect(function () {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      // Get user profile data
      var { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setMyData(prof);

      // Get consent info
      if (prof) {
        setConsent({
          privacy_terms: prof.consent_privacy_terms || false,
          age_verified: prof.consent_age_verified || false,
          data_processing: prof.consent_data_processing || false,
          timestamp: prof.consent_timestamp || null
        });
      }

      // Count survey responses
      var { count: sc } = await supabase
        .from('survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setSurveyCount(sc || 0);

      // Count community posts
      var { count: pc } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setPostCount(pc || 0);

      // Count comments
      var { count: cc } = await supabase
        .from('community_post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setCommentCount(cc || 0);

    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      // Gather all user data
      var { data: profileData } = await supabase
        .from('users')
        .select('full_name, email, phone, state, county, city, zip, race, sex, date_of_birth, education, employment, income, party, housing, marital_status, voter_registered, veteran, identity_verified, created_at, consent_privacy_terms, consent_age_verified, consent_data_processing, consent_timestamp')
        .eq('id', user.id)
        .single();

      var { data: responses } = await supabase
        .from('survey_responses')
        .select('survey_id, answers, created_at')
        .eq('user_id', user.id);

      var { data: posts } = await supabase
        .from('community_posts')
        .select('content, image_url, created_at, likes_count, dislikes_count, comment_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      var { data: comments } = await supabase
        .from('community_post_comments')
        .select('content, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      var exportData = {
        exported_at: new Date().toISOString(),
        platform: 'CivicVerify',
        data_subject: user.id,
        profile: profileData,
        survey_responses: responses || [],
        community_posts: posts || [],
        community_comments: comments || []
      };

      // Download as JSON
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'civicverify-my-data-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
      alert('Error downloading data. Please try again.');
    }
    setDownloading(false);
  }

  async function handleDeleteRequest() {
    if (deleteInput !== 'DELETE MY DATA') {
      setDeleteError('Please type "DELETE MY DATA" exactly to confirm.');
      return;
    }
    setDeleteError('');
    try {
      // Log the deletion request
      await supabase.from('data_deletion_requests').insert({
        user_id: user.id,
        email: user.email,
        status: 'pending',
        requested_at: new Date().toISOString()
      });
      setDeleteSubmitted(true);
    } catch (e) {
      console.error('Delete request error:', e);
      setDeleteError('Error submitting request. Please email privacy@civicverify.org instead.');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(11,37,69,0.08)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'DM Sans, -apple-system, sans-serif', maxWidth: 800 }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>

      <h1 style={{ fontSize: 27, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Manage My Data</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>View, download, correct, or delete your personal data. These rights are guaranteed under the Indiana Consumer Data Protection Act (ICDPA).</p>

      {/* Data Summary */}
      <div style={cardStyle}>
        <h3 style={h3Style}>Your Data Summary</h3>
        <p style={pStyle}>Here is an overview of everything CivicVerify stores about you.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Survey Responses', val: surveyCount, icon: '\uD83D\uDCCB' },
            { label: 'Community Posts', val: postCount, icon: '\uD83D\uDCAC' },
            { label: 'Comments', val: commentCount, icon: '\uD83D\uDDE8\uFE0F' },
            { label: 'Account Age', val: myData ? Math.floor((Date.now() - new Date(myData.created_at).getTime()) / 86400000) + ' days' : '—', icon: '\uD83D\uDCC5' }
          ].map(function (s) {
            return (
              <div key={s.label} style={{ background: 'rgba(11,37,69,0.02)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', marginTop: 2 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Information */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={h3Style}>Personal Information</h3>
            <p style={{ ...pStyle, margin: 0 }}>Data stored in your account profile.</p>
          </div>
          <a href="/citizen/account" style={{ fontSize: 13, color: C.gold, fontWeight: 600, textDecoration: 'none' }}>Edit in Account Settings {'\u2192'}</a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
          {[
            { label: 'Full Name', val: myData?.full_name },
            { label: 'Email', val: myData?.email },
            { label: 'Phone', val: myData?.phone },
            { label: 'Date of Birth', val: myData?.date_of_birth },
            { label: 'State', val: myData?.state },
            { label: 'County', val: myData?.county },
            { label: 'City', val: myData?.city },
            { label: 'ZIP Code', val: myData?.zip },
            { label: 'Race/Ethnicity', val: myData?.race },
            { label: 'Sex', val: myData?.sex },
            { label: 'Education', val: myData?.education },
            { label: 'Employment', val: myData?.employment },
            { label: 'Income', val: myData?.income },
            { label: 'Political Party', val: myData?.party },
            { label: 'Housing Status', val: myData?.housing },
            { label: 'Marital Status', val: myData?.marital_status },
            { label: 'Voter Registered', val: myData?.voter_registered != null ? (myData.voter_registered ? 'Yes' : 'No') : null },
            { label: 'Veteran', val: myData?.veteran != null ? (myData.veteran ? 'Yes' : 'No') : null },
            { label: 'Identity Verified', val: myData?.identity_verified ? 'Yes' : 'No' },
            { label: 'Account Created', val: myData?.created_at ? new Date(myData.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null }
          ].map(function (field) {
            return (
              <div key={field.label}>
                <p style={labelStyle}>{field.label}</p>
                <p style={valStyle}>{field.val || <span style={{ color: 'rgba(11,37,69,0.2)', fontStyle: 'italic' }}>Not provided</span>}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consent Records */}
      <div style={cardStyle}>
        <h3 style={h3Style}>Consent Records</h3>
        <p style={pStyle}>When you signed up, you provided the following consents:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Privacy Policy & Terms of Service', given: consent?.privacy_terms },
            { label: 'Age Verification (18+)', given: consent?.age_verified },
            { label: 'Demographic Data Processing', given: consent?.data_processing }
          ].map(function (c) {
            return (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(11,37,69,0.02)', borderRadius: 8 }}>
                <span style={{ fontSize: 16 }}>{c.given ? '\u2705' : '\u274C'}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: 0 }}>{c.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0 }}>
                    {c.given ? 'Consent given' : 'Not recorded'}
                    {consent?.timestamp ? ' on ' + new Date(consent.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          Consent was given under the <a href="/privacy" style={{ color: C.gold }}>Privacy Policy</a> effective at the time of signup. You can view previous policy versions at the bottom of our Privacy Policy page.
        </p>
      </div>

      {/* Download My Data */}
      <div style={cardStyle}>
        <h3 style={h3Style}>{'\uD83D\uDCE5'} Download My Data</h3>
        <p style={pStyle}>Download a complete copy of all data CivicVerify stores about you. This includes your profile information, survey responses, community posts, and comments. The file will be in JSON format.</p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            padding: '12px 28px', background: C.navy, color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: downloading ? 'wait' : 'pointer',
            opacity: downloading ? 0.6 : 1, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {downloading ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Preparing download...
            </>
          ) : (
            '\uD83D\uDCE5 Download All My Data'
          )}
        </button>
      </div>

      {/* Correct My Data */}
      <div style={cardStyle}>
        <h3 style={h3Style}>{'\u270F\uFE0F'} Correct My Data</h3>
        <p style={pStyle}>You have the right to correct any inaccurate personal data. Most fields can be updated directly from your account settings. For corrections you cannot make yourself, please contact us.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/citizen/account" style={{
            padding: '10px 22px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block'
          }}>Go to Account Settings</a>
          <a href="mailto:privacy@civicverify.org?subject=Data Correction Request" style={{
            padding: '10px 22px', background: 'rgba(11,37,69,0.05)', color: C.navy, border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block'
          }}>Email Privacy Team</a>
        </div>
      </div>

      {/* Delete My Data */}
      <div style={{ ...cardStyle, border: '1px solid ' + C.red + '20' }}>
        <h3 style={{ ...h3Style, color: C.red }}>{'\uD83D\uDDD1\uFE0F'} Delete My Account & Data</h3>
        <p style={pStyle}>You have the right to request deletion of your personal data. Upon request, we will delete your account and all associated data within 45 days. Anonymized, aggregated survey responses that cannot be linked back to you will be retained.</p>

        {deleteSubmitted ? (
          <div style={{ background: C.green + '10', border: '1px solid ' + C.green + '30', borderRadius: 10, padding: '16px 18px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.green, margin: '0 0 4px' }}>{'\u2705'} Deletion Request Submitted</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: 0, lineHeight: 1.5 }}>
              Your request has been received. We will process your deletion request within 45 days. You will receive a confirmation email at <strong>{user?.email}</strong> once complete. If you have questions, contact privacy@civicverify.org.
            </p>
          </div>
        ) : !showDeleteConfirm ? (
          <button
            onClick={function () { setShowDeleteConfirm(true); }}
            style={{
              padding: '12px 28px', background: C.red, color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Request Account Deletion
          </button>
        ) : (
          <div style={{ background: C.red + '06', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '18px 20px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.red, margin: '0 0 8px' }}>{'\u26A0\uFE0F'} This action cannot be undone</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 4px', lineHeight: 1.5 }}>Deleting your account will permanently remove:</p>
            <ul style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 14px', paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Your profile and all personal information</li>
              <li>All community posts and comments</li>
              <li>Your verification status</li>
              <li>All consent records</li>
            </ul>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)', margin: '0 0 12px' }}>Type <strong style={{ color: C.red }}>DELETE MY DATA</strong> to confirm:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={function (e) { setDeleteInput(e.target.value); setDeleteError(''); }}
              placeholder="Type DELETE MY DATA"
              style={{
                width: '100%', maxWidth: 300, padding: '10px 14px', border: '1px solid rgba(11,37,69,0.15)',
                borderRadius: 8, fontSize: 14, fontFamily: 'monospace', marginBottom: 10,
                boxSizing: 'border-box', outline: 'none'
              }}
            />
            {deleteError && <p style={{ fontSize: 12, color: C.red, margin: '0 0 10px' }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDeleteRequest}
                style={{
                  padding: '10px 22px', background: C.red, color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Confirm Deletion Request
              </button>
              <button
                onClick={function () { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                style={{
                  padding: '10px 22px', background: 'rgba(11,37,69,0.05)', color: C.navy, border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ICDPA Rights Notice */}
      <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 14, padding: '18px 22px', marginTop: 8, marginBottom: 40 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Your Rights Under the Indiana Consumer Data Protection Act (ICDPA)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { right: 'Right to Know', desc: 'View what data we have about you', status: 'Available above' },
            { right: 'Right to Correct', desc: 'Fix inaccurate personal data', status: 'Via Account Settings' },
            { right: 'Right to Delete', desc: 'Request deletion of your data', status: 'Available above' },
            { right: 'Right to Data Portability', desc: 'Download a copy of your data', status: 'Available above' },
            { right: 'Right to Opt Out', desc: 'Opt out of data sales (we never sell)', status: 'N/A — we don\'t sell data' },
            { right: 'Right to Appeal', desc: 'Appeal a declined request', status: 'Email privacy@civicverify.org' }
          ].map(function (r) {
            return (
              <div key={r.right} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 2px' }}>{r.right}</p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', margin: '0 0 4px' }}>{r.desc}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.green, margin: 0 }}>{'\u2713'} {r.status}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
