// src/pages/org/RequestSurvey.jsx — Survey request with per-response pricing
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';
var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: '#0B2545', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 };

var DEMOGRAPHIC_OPTIONS = [
  { key: 'race', label: 'Race / Ethnicity' },
  { key: 'sex', label: 'Sex / Gender' },
  { key: 'education', label: 'Education Level' },
  { key: 'employment', label: 'Employment Status' },
  { key: 'income', label: 'Income Range' },
  { key: 'marital', label: 'Marital Status' },
  { key: 'party', label: 'Political Party' },
  { key: 'voter_registered', label: 'Voter Registration' },
  { key: 'veteran', label: 'Veteran Status' },
  { key: 'housing', label: 'Housing Type' },
  { key: 'age', label: 'Age Range' },
];

function calcPrice(filterCount, hasGeo) {
  var base = 3.50;
  if (filterCount >= 5) base = 7.00;
  else if (filterCount >= 3) base = 5.50;
  else if (filterCount >= 1) base = 4.50;
  if (hasGeo) base += 1.00;
  return base;
}

function getTierLabel(filterCount) {
  if (filterCount >= 5) return 'Precision Targeting';
  if (filterCount >= 3) return 'Refined Targeting';
  if (filterCount >= 1) return 'Basic Targeting';
  return 'General Audience';
}

function getTierColor(filterCount) {
  if (filterCount >= 5) return '#7c3aed';
  if (filterCount >= 3) return '#2563eb';
  if (filterCount >= 1) return C.gold;
  return C.green;
}

export default function RequestSurvey() {
  var navigate = useNavigate();
  var auth = useAuth(); var profile = auth.profile; var user = auth.user;
  var [form, setForm] = useState({ title: '', description: '', target_responses: 100, state: '', city: '' });
  var [questions, setQuestions] = useState([{ text: '', type: 'multiple_choice', options: ['', ''] }]);
  var [filters, setFilters] = useState({});
  var [submitting, setSubmitting] = useState(false);
  var [error, setError] = useState('');
  var [success, setSuccess] = useState(false);

  function set(key, val) { setForm(Object.assign({}, form, (function(){ var o = {}; o[key] = val; return o; })())); setError(''); }
  function toggleFilter(key) { var f = Object.assign({}, filters); if (f[key]) delete f[key]; else f[key] = true; setFilters(f); }

  var activeFilters = Object.keys(filters).filter(function(k) { return filters[k]; });
  var hasGeo = !!(form.city && form.city.trim());
  var pricePerResponse = calcPrice(activeFilters.length, hasGeo);
  var tierLabel = getTierLabel(activeFilters.length);
  var tierColor = getTierColor(activeFilters.length);
  var estimatedTotal = (pricePerResponse * (form.target_responses || 100)).toFixed(2);

  // Questions
  function updateQ(i, key, val) {
    var qs = questions.slice();
    qs[i] = Object.assign({}, qs[i], (function(){ var o = {}; o[key] = val; return o; })());
    setQuestions(qs);
  }
  function updateOption(qi, oi, val) {
    var qs = questions.slice();
    var opts = qs[qi].options.slice();
    opts[oi] = val;
    qs[qi] = Object.assign({}, qs[qi], { options: opts });
    setQuestions(qs);
  }
  function addOption(qi) {
    var qs = questions.slice();
    qs[qi] = Object.assign({}, qs[qi], { options: qs[qi].options.concat(['']) });
    setQuestions(qs);
  }
  function removeOption(qi, oi) {
    var qs = questions.slice();
    if (qs[qi].options.length <= 2) return;
    var opts = qs[qi].options.slice(); opts.splice(oi, 1);
    qs[qi] = Object.assign({}, qs[qi], { options: opts });
    setQuestions(qs);
  }
  function addQuestion() { setQuestions(questions.concat([{ text: '', type: 'multiple_choice', options: ['', ''] }])); }
  function removeQuestion(i) { if (questions.length <= 1) return; var qs = questions.slice(); qs.splice(i, 1); setQuestions(qs); }

  async function submit() {
    if (!form.title.trim()) return setError('Survey title is required');
    if (questions.some(function(q) { return !q.text.trim(); })) return setError('All questions must have text');
    if (questions.some(function(q) { return q.type === 'multiple_choice' && q.options.some(function(o) { return !o.trim(); }); })) return setError('All options must be filled in');

    setSubmitting(true);
    var qData = questions.map(function(q, i) {
      return { id: 'q' + (i + 1), text: q.text.trim(), type: q.type, options: q.type === 'multiple_choice' ? q.options.filter(function(o) { return o.trim(); }) : undefined, required: true };
    });

    var surveyData = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: 'pending',
      questions: qData,
      target_responses: parseInt(form.target_responses) || 100,
      created_by: user.id,
      org_id: user.id,
      demographic_filters: {
        filters: activeFilters,
        state: form.state || null,
        city: form.city || null,
        price_per_response: pricePerResponse,
        tier: tierLabel,
        estimated_total: parseFloat(estimatedTotal)
      }
    };

    // Set targeting columns if filters selected
    if (form.state) surveyData.target_state = [form.state];

    var res = await supabase.from('surveys').insert(surveyData);
    setSubmitting(false);
    if (res.error) return setError(res.error.message);
    setSuccess(true);
  }

  if (success) {
    return (
      <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 32px', border: '1px solid rgba(11,37,69,0.06)', boxShadow: '0 4px 24px rgba(11,37,69,0.04)' }}>
            <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>{'\u2705'}</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>Survey Submitted!</h1>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: '0 0 8px', lineHeight: 1.6 }}>Your survey has been submitted for admin review. We'll notify you once it's approved and live.</p>
            <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 12, padding: 16, margin: '20px 0' }}>
              <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 4px' }}>Estimated cost per response</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: C.gold, margin: 0, fontFamily: font }}>${pricePerResponse.toFixed(2)}</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '4px 0 0' }}>{tierLabel} · {form.target_responses} target responses · ~${estimatedTotal} total</p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={function(){ navigate('/org/surveys'); }} style={{ padding: '12px 24px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>View My Surveys</button>
              <button onClick={function(){ navigate('/org'); }} style={{ padding: '12px 24px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <button onClick={function(){ navigate('/org'); }} style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>{'\u2190'} Back to Dashboard</button>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Request a Survey</h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 32px' }}>Submit your survey for admin review and approval</p>

      {error && <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 13, color: C.red, margin: 0 }}>{'\u26A0'} {error}</p></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }} className="org-req-grid">

        {/* LEFT: Form */}
        <div>
          {/* Survey Details */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>Survey Details</h2>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Title <span style={{ color: C.red }}>*</span></label><input value={form.title} onChange={function(e){ set('title', e.target.value); }} placeholder="e.g., Public Transit Satisfaction Survey" style={inputStyle} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Description</label><textarea value={form.description} onChange={function(e){ set('description', e.target.value); }} placeholder="What is this survey about?" rows={3} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} /></div>
            <div><label style={labelStyle}>Target Responses</label>
              <select value={form.target_responses} onChange={function(e){ set('target_responses', e.target.value); }} style={selectStyle}>
                <option value="50">50 responses</option>
                <option value="100">100 responses</option>
                <option value="250">250 responses</option>
                <option value="500">500 responses</option>
                <option value="1000">1,000 responses</option>
                <option value="2500">2,500 responses</option>
                <option value="5000">5,000 responses</option>
              </select>
            </div>
          </div>

          {/* Questions */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>Questions</h2>
            {questions.map(function(q, qi) {
              return (
                <div key={qi} style={{ padding: 16, background: 'rgba(11,37,69,0.02)', borderRadius: 12, marginBottom: 12, border: '1px solid rgba(11,37,69,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>Q{qi + 1}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={q.type} onChange={function(e){ updateQ(qi, 'type', e.target.value); }} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 6, outline: 'none', color: C.navy, background: '#fff' }}>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="rating">Rating (1-5)</option>
                        <option value="yes_no">Yes / No</option>
                        <option value="text">Free Text</option>
                      </select>
                      {questions.length > 1 ? <button onClick={function(){ removeQuestion(qi); }} style={{ fontSize: 14, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>{'\u2715'}</button> : null}
                    </div>
                  </div>
                  <input value={q.text} onChange={function(e){ updateQ(qi, 'text', e.target.value); }} placeholder="Enter question..." style={Object.assign({}, inputStyle, { marginBottom: 10 })} />
                  {q.type === 'multiple_choice' ? (
                    <div>
                      {q.options.map(function(opt, oi) {
                        return (
                          <div key={oi} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(11,37,69,0.12)', flexShrink: 0 }} />
                            <input value={opt} onChange={function(e){ updateOption(qi, oi, e.target.value); }} placeholder={'Option ' + (oi + 1)} style={Object.assign({}, inputStyle, { padding: '8px 12px', fontSize: 13 })} />
                            {q.options.length > 2 ? <button onClick={function(){ removeOption(qi, oi); }} style={{ fontSize: 12, color: 'rgba(11,37,69,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}>{'\u2715'}</button> : null}
                          </div>
                        );
                      })}
                      <button onClick={function(){ addOption(qi); }} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 4 }}>+ Add option</button>
                    </div>
                  ) : null}
                  {q.type === 'yes_no' ? <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '4px 0 0' }}>Respondents choose Yes or No</p> : null}
                  {q.type === 'rating' ? <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '4px 0 0' }}>Respondents rate 1-5 stars</p> : null}
                  {q.type === 'text' ? <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '4px 0 0' }}>Respondents type a free-text answer</p> : null}
                </div>
              );
            })}
            <button onClick={addQuestion} style={{ width: '100%', padding: 12, border: '2px dashed rgba(11,37,69,0.08)', borderRadius: 10, background: 'transparent', fontSize: 13, fontWeight: 600, color: 'rgba(11,37,69,0.25)', cursor: 'pointer' }}>+ Add Question</button>
          </div>

          {/* Demographic Targeting */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>Demographic Targeting</h2>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: '0 0 16px' }}>Each filter increases your per-response rate. More filters = more precise audience.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {DEMOGRAPHIC_OPTIONS.map(function(d) {
                var active = !!filters[d.key];
                return <button key={d.key} onClick={function(){ toggleFilter(d.key); }} style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid ' + (active ? C.gold : 'rgba(11,37,69,0.08)'), background: active ? C.gold + '10' : '#fff', color: active ? C.gold : 'rgba(11,37,69,0.35)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{active ? '\u2713 ' : ''}{d.label}</button>;
              })}
            </div>

            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '16px 0 10px' }}>Geographic Targeting</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={labelStyle}>State</label><input value={form.state} onChange={function(e){ set('state', e.target.value); }} placeholder="e.g., Indiana" style={inputStyle} /></div>
              <div><label style={labelStyle}>City <span style={{ fontSize: 9, color: 'rgba(11,37,69,0.2)' }}>+$1.00/resp</span></label><input value={form.city} onChange={function(e){ set('city', e.target.value); }} placeholder="e.g., Indianapolis" style={inputStyle} /></div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={function(){ navigate('/org'); }} style={{ padding: '14px 24px', background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.4)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={submitting} style={{ padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.2)', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>

        {/* RIGHT: Live Price Calculator */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.25)', margin: '0 0 8px' }}>Your Pricing Tier</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: tierColor }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>{tierLabel}</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', margin: 0 }}>{activeFilters.length} demographic filter{activeFilters.length !== 1 ? 's' : ''}{hasGeo ? ' + geo targeting' : ''}</p>
            </div>

            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(245,241,236,0.3)' }}>
              <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Per Response</p>
              <p style={{ fontSize: 40, fontWeight: 700, color: C.gold, margin: '0 0 4px', fontFamily: font }}>${pricePerResponse.toFixed(2)}</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: 0 }}>per verified response</p>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)' }}>Target responses</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{form.target_responses}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)' }}>Rate per response</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>${pricePerResponse.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Estimated Total</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>${estimatedTotal}</span>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.2)', margin: '0 0 0', lineHeight: 1.5 }}>Final cost based on actual verified responses received. Invoiced upon survey completion.</p>
            </div>

            {/* Pricing breakdown */}
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(11,37,69,0.04)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.2)', margin: '0 0 8px' }}>Pricing Guide</p>
              {[
                { label: 'General Audience', desc: 'No filters', price: '$3.50', active: activeFilters.length === 0 && !hasGeo },
                { label: 'Basic Targeting', desc: '1-2 filters', price: '$4.50', active: activeFilters.length >= 1 && activeFilters.length <= 2 },
                { label: 'Refined Targeting', desc: '3-4 filters', price: '$5.50', active: activeFilters.length >= 3 && activeFilters.length <= 4 },
                { label: 'Precision Targeting', desc: '5+ filters', price: '$7.00', active: activeFilters.length >= 5 },
              ].map(function(t, i) {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: t.active ? 700 : 400, color: t.active ? C.navy : 'rgba(11,37,69,0.3)' }}>{t.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.15)', marginLeft: 6 }}>{t.desc}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.active ? C.gold : 'rgba(11,37,69,0.15)' }}>{t.price}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid rgba(11,37,69,0.04)', marginTop: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: hasGeo ? 700 : 400, color: hasGeo ? C.navy : 'rgba(11,37,69,0.3)' }}>Geo Micro-Target</span>
                  <span style={{ fontSize: 10, color: 'rgba(11,37,69,0.15)', marginLeft: 6 }}>City/ZIP</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: hasGeo ? C.gold : 'rgba(11,37,69,0.15)' }}>+$1.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{'\
        @media (max-width: 900px) { .org-req-grid { grid-template-columns: 1fr !important; } }\
      '}</style>
    </div>
  );
}
