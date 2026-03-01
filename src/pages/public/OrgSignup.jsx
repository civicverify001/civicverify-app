// src/pages/public/OrgSignup.jsx
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#dc2626', green: '#16a34a' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

var ORG_TYPES = ['Nonprofit / NGO', 'Government Agency', 'Academic Institution', 'Private Company', 'Political Campaign', 'Healthcare Organization', 'Media / Research Firm', 'Other'];
var SURVEY_TOPICS = ['Public Policy', 'Healthcare', 'Education', 'Environment', 'Economy & Finance', 'Local Government', 'Transportation', 'Housing', 'Public Safety', 'Social Issues', 'Technology', 'Elections & Voting'];
var AUDIENCE_SIZES = ['Under 500 responses', '500 – 2,000 responses', '2,000 – 10,000 responses', '10,000+ responses'];

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(11,37,69,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
      {children}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type, style }) {
  var [focused, setFocused] = useState(false);
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={function() { setFocused(true); }}
      onBlur={function() { setFocused(false); }}
      style={{
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid ' + (focused ? C.gold : 'rgba(11,37,69,0.12)'),
        background: focused ? '#fff' : '#fafbfc',
        fontFamily: sans, fontSize: 14, color: C.navy, outline: 'none',
        boxSizing: 'border-box', transition: 'all 0.15s',
        boxShadow: focused ? '0 0 0 3px rgba(197,150,12,0.1)' : 'none',
        ...style,
      }}
    />
  );
}

function Select({ value, onChange, children, style }) {
  var [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={function() { setFocused(true); }}
      onBlur={function() { setFocused(false); }}
      style={{
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid ' + (focused ? C.gold : 'rgba(11,37,69,0.12)'),
        background: focused ? '#fff' : '#fafbfc',
        fontFamily: sans, fontSize: 14, color: C.navy, outline: 'none',
        boxSizing: 'border-box', transition: 'all 0.15s', cursor: 'pointer',
        boxShadow: focused ? '0 0 0 3px rgba(197,150,12,0.1)' : 'none',
        ...style,
      }}>
      {children}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows }) {
  var [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows || 3}
      onFocus={function() { setFocused(true); }}
      onBlur={function() { setFocused(false); }}
      style={{
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid ' + (focused ? C.gold : 'rgba(11,37,69,0.12)'),
        background: focused ? '#fff' : '#fafbfc',
        fontFamily: sans, fontSize: 14, color: C.navy, outline: 'none',
        boxSizing: 'border-box', transition: 'all 0.15s', resize: 'vertical',
        boxShadow: focused ? '0 0 0 3px rgba(197,150,12,0.1)' : 'none',
      }}
    />
  );
}

var STEPS = ['Account', 'Organization', 'Survey Intent', 'Documents'];

export default function OrgSignup() {
  var navigate = useNavigate();
  var [step, setStep] = useState(0);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var docInputRef = useRef(null);

  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [contactName, setContactName] = useState('');
  var [contactTitle, setContactTitle] = useState('');
  var [phone, setPhone] = useState('');

  var [orgName, setOrgName] = useState('');
  var [orgType, setOrgType] = useState('');
  var [website, setWebsite] = useState('');
  var [address, setAddress] = useState('');
  var [city, setCity] = useState('');
  var [state, setState] = useState('');
  var [zip, setZip] = useState('');
  var [ein, setEin] = useState('');
  var [description, setDescription] = useState('');

  var [selectedTopics, setSelectedTopics] = useState([]);
  var [audienceSize, setAudienceSize] = useState('');
  var [surveyGoal, setSurveyGoal] = useState('');
  var [targetDemo, setTargetDemo] = useState('');

  var [docFile, setDocFile] = useState(null);
  var [docName, setDocName] = useState('');
  var [agreed, setAgreed] = useState(false);

  function toggleTopic(topic) {
    setSelectedTopics(function(prev) {
      if (prev.includes(topic)) return prev.filter(function(t) { return t !== topic; });
      return prev.concat([topic]);
    });
  }

  function validateStep() {
    setError('');
    if (step === 0) {
      if (!contactName.trim()) return setError('Contact name is required');
      if (!email.trim()) return setError('Email is required');
      if (!password || password.length < 8) return setError('Password must be at least 8 characters');
      if (password !== confirmPassword) return setError('Passwords do not match');
      return true;
    }
    if (step === 1) {
      if (!orgName.trim()) return setError('Organization name is required');
      if (!orgType) return setError('Please select an organization type');
      if (!address.trim() || !city.trim() || !state.trim()) return setError('Full address is required');
      return true;
    }
    if (step === 2) {
      if (selectedTopics.length === 0) return setError('Select at least one survey topic');
      if (!audienceSize) return setError('Please select expected audience size');
      if (!surveyGoal.trim()) return setError('Please describe your survey goals');
      return true;
    }
    if (step === 3) {
      if (!agreed) return setError('You must agree to the terms');
      return true;
    }
    return true;
  }

  function nextStep() {
    if (validateStep()) setStep(function(s) { return s + 1; });
  }

  function handleDocSelect(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    setDocFile(file);
    setDocName(file.name);
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setError('');

    try {
      var signUpResult = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: contactName.trim(),
            role: 'org',
            org_status: 'pending',
            org_name: orgName.trim(),
            org_type: orgType,
            org_website: website.trim() || null,
            org_address: address.trim(),
            org_city: city.trim(),
            org_state: state.trim(),
            org_zip: zip.trim() || null,
            org_ein: ein.trim() || null,
            org_description: description.trim() || null,
            org_contact_title: contactTitle.trim() || null,
            org_phone: phone.trim() || null,
            org_survey_topics: JSON.stringify(selectedTopics),
            org_audience_size: audienceSize,
            org_survey_goal: surveyGoal.trim() || null,
            org_target_demo: targetDemo.trim() || null,
          }
        }
      });

      if (signUpResult.error) throw signUpResult.error;

      var uid = signUpResult.data.user && signUpResult.data.user.id;
      if (!uid) throw new Error('Could not create account. Please try again.');

      // Sign in immediately to get a guaranteed active session before doing DB operations
      var signInResult = await supabase.auth.signInWithPassword({ email: email.trim(), password: password });
      if (signInResult.error) console.warn('Auto sign-in failed:', signInResult.error.message);

      // Upload document, get public URL, save to users table
      if (docFile) {
        try {
          var ext = docFile.name.split('.').pop() || 'pdf';
          var uploadPath = uid + '/registration.' + ext;
          var uploadResult = await supabase.storage
            .from('org-documents')
            .upload(uploadPath, docFile, { contentType: docFile.type, upsert: true });

          if (!uploadResult.error) {
            var urlResult = supabase.storage.from('org-documents').getPublicUrl(uploadPath);
            var docUrl = urlResult.data && urlResult.data.publicUrl;
            if (docUrl) {
              var updateResult = await supabase.from('users').update({ org_doc_url: docUrl }).eq('id', uid);
              if (updateResult.error) console.warn('Doc URL save failed:', updateResult.error.message);
              else console.log('Doc URL saved:', docUrl);
            }
          } else {
            console.warn('Storage upload error:', uploadResult.error.message);
          }
        } catch (uploadErr) {
          console.warn('Doc upload failed (non-fatal):', uploadErr);
        }
      }

      navigate('/org-signup-success');

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: sans }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .step-content{animation:fadeUp 0.25s ease}
        .topic-chip:hover{border-color:${C.gold}!important;background:rgba(197,150,12,0.06)!important}
        .next-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(11,37,69,0.25)!important}
        .next-btn:active{transform:translateY(0)}
      `}</style>

      <div style={{ width: '100%', maxWidth: 560 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(11,37,69,0.25)' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.gold, fontFamily: font }}>CV</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '8px 0 0' }}>Organization Registration</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(11,37,69,0.1)', overflow: 'hidden' }}>

          <div style={{ background: 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)', padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              {STEPS.map(function(s, i) {
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: i < step ? C.green : i === step ? C.gold : 'rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)',
                      border: i === step ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
                      transition: 'all 0.3s',
                    }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: i === step ? '#fff' : 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{s}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ height: '100%', background: C.gold, borderRadius: 2, width: ((step / (STEPS.length - 1)) * 100) + '%', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div style={{ padding: '32px' }}>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>⚠️</span>
                <p style={{ fontSize: 13, color: C.red, margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {step === 0 && (
              <div className="step-content">
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>Account Setup</h2>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Create your organization's login credentials</p>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Label required>Contact Name</Label>
                      <Input value={contactName} onChange={function(e) { setContactName(e.target.value); }} placeholder="Jane Smith" />
                    </div>
                    <div>
                      <Label>Job Title</Label>
                      <Input value={contactTitle} onChange={function(e) { setContactTitle(e.target.value); }} placeholder="Director of Research" />
                    </div>
                  </div>
                  <div>
                    <Label required>Email Address</Label>
                    <Input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="contact@organization.org" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input type="tel" value={phone} onChange={function(e) { setPhone(e.target.value); }} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <Label required>Password</Label>
                    <Input type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} placeholder="Minimum 8 characters" />
                  </div>
                  <div>
                    <Label required>Confirm Password</Label>
                    <Input type="password" value={confirmPassword} onChange={function(e) { setConfirmPassword(e.target.value); }} placeholder="Repeat password" />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="step-content">
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>Organization Details</h2>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Tell us about your organization</p>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <Label required>Organization Name</Label>
                    <Input value={orgName} onChange={function(e) { setOrgName(e.target.value); }} placeholder="Acme Research Institute" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <Label required>Organization Type</Label>
                      <Select value={orgType} onChange={function(e) { setOrgType(e.target.value); }}>
                        <option value="">Select type...</option>
                        {ORG_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
                      </Select>
                    </div>
                    <div>
                      <Label>EIN / Tax ID</Label>
                      <Input value={ein} onChange={function(e) { setEin(e.target.value); }} placeholder="12-3456789" />
                    </div>
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={website} onChange={function(e) { setWebsite(e.target.value); }} placeholder="https://yourorganization.org" />
                  </div>
                  <div>
                    <Label required>Street Address</Label>
                    <Input value={address} onChange={function(e) { setAddress(e.target.value); }} placeholder="123 Main Street, Suite 400" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <Label required>City</Label>
                      <Input value={city} onChange={function(e) { setCity(e.target.value); }} placeholder="Indianapolis" />
                    </div>
                    <div>
                      <Label required>State</Label>
                      <Input value={state} onChange={function(e) { setState(e.target.value); }} placeholder="IN" />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input value={zip} onChange={function(e) { setZip(e.target.value); }} placeholder="46201" />
                    </div>
                  </div>
                  <div>
                    <Label>Brief Description</Label>
                    <Textarea value={description} onChange={function(e) { setDescription(e.target.value); }} placeholder="What does your organization do? What is your mission?" rows={3} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>Survey Intentions</h2>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Help us understand what kind of surveys you'll run</p>
                <div style={{ display: 'grid', gap: 20 }}>
                  <div>
                    <Label required>Survey Topics (select all that apply)</Label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {SURVEY_TOPICS.map(function(topic) {
                        var selected = selectedTopics.includes(topic);
                        return (
                          <button key={topic} className="topic-chip" onClick={function() { toggleTopic(topic); }}
                            style={{
                              padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                              border: '1.5px solid ' + (selected ? C.gold : 'rgba(11,37,69,0.12)'),
                              background: selected ? 'linear-gradient(135deg, ' + C.gold + ', #e8a838)' : '#fafbfc',
                              color: selected ? '#fff' : C.navy, cursor: 'pointer', transition: 'all 0.15s',
                              boxShadow: selected ? '0 2px 8px rgba(197,150,12,0.25)' : 'none',
                            }}>
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label required>Expected Survey Audience Size</Label>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {AUDIENCE_SIZES.map(function(size) {
                        var selected = audienceSize === size;
                        return (
                          <button key={size} onClick={function() { setAudienceSize(size); }}
                            style={{
                              padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                              border: '1.5px solid ' + (selected ? C.gold : 'rgba(11,37,69,0.1)'),
                              background: selected ? 'rgba(197,150,12,0.05)' : '#fafbfc',
                              cursor: 'pointer', fontFamily: sans, fontSize: 13,
                              color: selected ? C.navy : 'rgba(11,37,69,0.6)',
                              fontWeight: selected ? 600 : 400, transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + (selected ? C.gold : 'rgba(11,37,69,0.2)'), background: selected ? C.gold : 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                            </div>
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label required>Survey Goals</Label>
                    <Textarea value={surveyGoal} onChange={function(e) { setSurveyGoal(e.target.value); }} placeholder="Describe what you hope to learn from your surveys." rows={3} />
                  </div>
                  <div>
                    <Label>Target Demographic (optional)</Label>
                    <Textarea value={targetDemo} onChange={function(e) { setTargetDemo(e.target.value); }} placeholder="e.g. Registered voters in Indiana, adults 18-65..." rows={2} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content">
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>Verification Documents</h2>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>Upload documentation to verify your organization. Our team will review within 1–3 business days.</p>
                <div style={{ background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: '0 0 8px' }}>📋 Acceptable Documents</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(11,37,69,0.6)', lineHeight: 1.8 }}>
                    <li>IRS 501(c)(3) determination letter (nonprofits)</li>
                    <li>Business registration / Certificate of Incorporation</li>
                    <li>Government agency authorization letter</li>
                    <li>University / academic department letterhead</li>
                    <li>Business license or state registration</li>
                  </ul>
                </div>
                <div onClick={function() { docInputRef.current && docInputRef.current.click(); }}
                  style={{ border: '2px dashed ' + (docFile ? C.gold : 'rgba(11,37,69,0.15)'), borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: docFile ? 'rgba(197,150,12,0.04)' : '#fafbfc', transition: 'all 0.2s', marginBottom: 20 }}>
                  <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDocSelect} style={{ display: 'none' }} />
                  {docFile ? (
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>{docName}</p>
                      <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>Upload document</p>
                      <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: 0 }}>PDF, DOC, DOCX, JPG or PNG · Max 10MB</p>
                      <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0' }}>Document upload is optional but speeds up approval</p>
                    </div>
                  )}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: '1px solid rgba(11,37,69,0.06)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Application Summary</p>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {[
                      { label: 'Contact', value: contactName + (contactTitle ? ' · ' + contactTitle : '') },
                      { label: 'Email', value: email },
                      { label: 'Organization', value: orgName },
                      { label: 'Type', value: orgType },
                      { label: 'Location', value: city && state ? city + ', ' + state : '—' },
                      { label: 'Topics', value: selectedTopics.length + ' selected' },
                    ].map(function(item) {
                      return (
                        <div key={item.label} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                          <span style={{ color: 'rgba(11,37,69,0.4)', fontWeight: 600, minWidth: 80 }}>{item.label}</span>
                          <span style={{ color: C.navy, fontWeight: 500 }}>{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div onClick={function() { setAgreed(function(v) { return !v; }); }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: '2px solid ' + (agreed ? C.gold : 'rgba(11,37,69,0.2)'), background: agreed ? C.gold : 'none', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {agreed && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)', margin: 0, lineHeight: 1.6 }}>
                    I confirm that all information provided is accurate. I agree to CivicVerify's{' '}
                    <Link to="/terms" style={{ color: C.gold, fontWeight: 600 }}>Terms of Service</Link>{' '}and{' '}
                    <Link to="/privacy" style={{ color: C.gold, fontWeight: 600 }}>Privacy Policy</Link>.
                    I understand my application will be reviewed before access is granted.
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              {step > 0 && (
                <button onClick={function() { setStep(function(s) { return s - 1; }); setError(''); }}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.12)', background: '#fafbfc', color: C.navy, fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button className="next-btn" onClick={nextStep}
                  style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)', color: C.gold, fontFamily: sans, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(11,37,69,0.2)' }}>
                  Continue →
                </button>
              ) : (
                <button className="next-btn" onClick={handleSubmit} disabled={loading}
                  style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: loading ? 'rgba(11,37,69,0.08)' : 'linear-gradient(135deg, ' + C.gold + ', #e8a838)', color: loading ? 'rgba(11,37,69,0.3)' : '#fff', fontFamily: sans, fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 14px rgba(197,150,12,0.3)' }}>
                  {loading ? 'Submitting...' : '🏛️ Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(11,37,69,0.4)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: C.gold, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          {' · '}
          <Link to="/signup" style={{ color: 'rgba(11,37,69,0.4)', textDecoration: 'none' }}>Citizen signup</Link>
        </p>
      </div>
    </div>
  );
}
