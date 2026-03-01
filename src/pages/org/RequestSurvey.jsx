// src/pages/org/RequestSurvey.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font  = 'Libre Baskerville, Georgia, serif';
var sans  = 'DM Sans, system-ui, sans-serif';
var gold  = '#C5960C';
var goldL = '#F0B429';
var navy  = '#0B2545';
var mid   = '#1e3a6e';
var red   = '#f87171';

var inputStyle = {
  width:'100%', padding:'12px 16px', fontSize:14,
  border:'1px solid rgba(255,255,255,0.12)', borderRadius:10,
  outline:'none', color:'#fff', background:'rgba(255,255,255,0.07)',
  fontFamily:sans, boxSizing:'border-box',
  transition:'border-color 0.2s',
};
var labelStyle = {
  display:'block', fontSize:10, fontWeight:700,
  textTransform:'uppercase', letterSpacing:1.8,
  color:'rgba(255,255,255,0.35)', marginBottom:7,
};

var DEMOGRAPHIC_OPTIONS = [
  { key:'race',             label:'Race / Ethnicity' },
  { key:'sex',              label:'Sex / Gender' },
  { key:'education',        label:'Education Level' },
  { key:'employment',       label:'Employment Status' },
  { key:'income',           label:'Income Range' },
  { key:'marital',          label:'Marital Status' },
  { key:'party',            label:'Political Party' },
  { key:'voter_registered', label:'Voter Registration' },
  { key:'veteran',          label:'Veteran Status' },
  { key:'housing',          label:'Housing Type' },
  { key:'age',              label:'Age Range' },
];

function calcPrice(n, hasGeo) {
  var b = n>=5 ? 7.00 : n>=3 ? 5.50 : n>=1 ? 4.50 : 3.50;
  return b + (hasGeo ? 1.00 : 0);
}
function getTier(n) {
  if (n>=5) return { label:'Precision Targeting', color:'#a78bfa' };
  if (n>=3) return { label:'Refined Targeting',   color:'#60a5fa' };
  if (n>=1) return { label:'Basic Targeting',      color:gold };
  return              { label:'General Audience',   color:'#34d399' };
}

/* ── Section card wrapper ───────────────────────────────── */
function Card({ title, subtitle, icon, children }) {
  return (
    <div style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
      border:'1px solid rgba(255,255,255,0.08)', borderRadius:18,
      overflow:'hidden', marginBottom:20 }}>
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
          background:'linear-gradient(135deg,'+gold+','+goldL+')',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, boxShadow:'0 2px 8px rgba(197,150,12,0.3)' }}>{icon}</div>
        <div>
          <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>{title}</h2>
          {subtitle && <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0 }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding:'20px 24px' }}>{children}</div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function RequestSurvey() {
  var navigate = useNavigate();
  var { profile, user } = useAuth();
  var [form, setForm]         = useState({ title:'', description:'', target_responses:100, state:'', city:'' });
  var [questions, setQuestions] = useState([{ text:'', type:'multiple_choice', options:['',''] }]);
  var [filters, setFilters]   = useState({});
  var [submitting, setSubmitting] = useState(false);
  var [error, setError]       = useState('');
  var [success, setSuccess]   = useState(false);

  function set(k,v){ setForm(Object.assign({},form,{[k]:v})); setError(''); }
  function toggleFilter(k){ var f=Object.assign({},filters); f[k]?delete f[k]:f[k]=true; setFilters(f); }

  var active  = Object.keys(filters).filter(function(k){return filters[k];});
  var hasGeo  = !!(form.city&&form.city.trim());
  var price   = calcPrice(active.length, hasGeo);
  var tier    = getTier(active.length);
  var total   = (price * (form.target_responses||100)).toFixed(2);

  function updateQ(i,k,v){ var q=questions.slice(); q[i]=Object.assign({},q[i],{[k]:v}); setQuestions(q); }
  function updateOpt(qi,oi,v){ var q=questions.slice(); var o=q[qi].options.slice(); o[oi]=v; q[qi]=Object.assign({},q[qi],{options:o}); setQuestions(q); }
  function addOpt(qi){ var q=questions.slice(); q[qi]=Object.assign({},q[qi],{options:q[qi].options.concat('')}); setQuestions(q); }
  function remOpt(qi,oi){ var q=questions.slice(); if(q[qi].options.length<=2)return; var o=q[qi].options.slice(); o.splice(oi,1); q[qi]=Object.assign({},q[qi],{options:o}); setQuestions(q); }
  function addQ(){ setQuestions(questions.concat([{text:'',type:'multiple_choice',options:['','']}])); }
  function remQ(i){ if(questions.length<=1)return; var q=questions.slice(); q.splice(i,1); setQuestions(q); }

  async function submit() {
    if (!form.title.trim()) return setError('Survey title is required');
    if (questions.some(function(q){return !q.text.trim();})) return setError('All questions must have text');
    if (questions.some(function(q){return q.type==='multiple_choice'&&q.options.some(function(o){return !o.trim();});})) return setError('All options must be filled in');
    setSubmitting(true);
    var qData = questions.map(function(q,i){
      return { id:'q'+(i+1), text:q.text.trim(), type:q.type,
        options:q.type==='multiple_choice'?q.options.filter(function(o){return o.trim();}):undefined, required:true };
    });
    var data = {
      title:form.title.trim(), description:form.description.trim(),
      status:'pending_review', questions:qData,
      target_responses:parseInt(form.target_responses)||100,
      created_by:user.id,
      demographic_filters:{ filters:active, state:form.state||null, city:form.city||null,
        price_per_response:price, tier:tier.label, estimated_total:parseFloat(total) },
    };
    if (form.state) data.target_state = [form.state];
    var res = await supabase.from('surveys').insert(data);
    setSubmitting(false);
    if (res.error) return setError(res.error.message);
    setSuccess(true);
  }

  /* ── Success screen ─────────────────────────────────── */
  if (success) return (
    <div style={{ fontFamily:sans, color:'#fff', margin:'0 -24px', padding:'0 24px 40px' }}>
      <div style={{ maxWidth:520, margin:'60px auto', textAlign:'center', animation:'fadeUp 0.5s ease' }}>
        <div style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
          borderRadius:24, padding:'48px 32px',
          border:'1px solid rgba(255,255,255,0.08)',
          boxShadow:'0 16px 48px rgba(0,0,0,0.3)' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px',
            background:'rgba(52,211,153,0.15)', border:'2px solid rgba(52,211,153,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>✅</div>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#fff', margin:'0 0 10px', fontFamily:font }}>Survey Submitted!</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', margin:'0 0 24px', lineHeight:1.7 }}>
            Your survey is under admin review. We'll notify you once it's approved and live for citizens.
          </p>
          <div style={{ background:'rgba(197,150,12,0.1)', border:'1px solid rgba(197,150,12,0.2)',
            borderRadius:14, padding:'20px', margin:'0 0 28px' }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:1, fontWeight:700 }}>Pricing Summary</p>
            <p style={{ fontSize:36, fontWeight:800, color:gold, margin:'0 0 4px', fontFamily:font }}>${price.toFixed(2)}</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>
              {tier.label} · {form.target_responses} responses · ~${total} total
            </p>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={function(){navigate('/org/surveys');}}
              style={{ padding:'12px 24px', background:'linear-gradient(135deg,'+gold+','+goldL+')',
                color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                boxShadow:'0 4px 16px rgba(197,150,12,0.35)' }}>
              View My Surveys
            </button>
            <button onClick={function(){navigate('/org');}}
              style={{ padding:'12px 24px', background:'rgba(255,255,255,0.07)',
                color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
      <style>{'@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}'}</style>
    </div>
  );

  /* ── Main form ──────────────────────────────────────── */
  return (
    <div style={{ fontFamily:sans, color:'#fff', margin:'0 -24px', paddingBottom:40 }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes livepulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .rq-input:focus { border-color: rgba(197,150,12,0.5) !important; background: rgba(255,255,255,0.10) !important; }
        .rq-input::placeholder { color: rgba(255,255,255,0.2); }
        .rq-select option { background: #0B2545; color: #fff; }
        .rq-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .filter-pill:hover { border-color: rgba(197,150,12,0.5) !important; color: rgba(255,255,255,0.9) !important; }
        .rq-grid { display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:flex-start; }
        @media(max-width:900px){ .rq-grid { grid-template-columns:1fr !important; } .rq-sticky { position:static !important; } }
        @media(max-width:600px){ .rq-hero { padding:20px 16px !important; } .rq-body { padding:16px 16px 0 !important; } }
      `}</style>

      {/* ── Hero header ───────────────────────────────── */}
      <div className="rq-hero" style={{ background:'linear-gradient(140deg,'+navy+' 0%,'+mid+' 60%,#0f3060 100%)',
        borderBottom:'3px solid '+gold, padding:'32px 40px', position:'relative', overflow:'hidden' }}>
        {/* Decorative rings */}
        <div style={{ position:'absolute', top:-40, right:-40, width:220, height:220, pointerEvents:'none' }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            {[40,70,100].map(function(r,i){
              return <circle key={i} cx="110" cy="110" r={r} fill="none"
                stroke={i%2===0?gold:'#60a5fa'} strokeWidth="0.6" style={{opacity:0.12-i*0.02}} />;
            })}
          </svg>
        </div>
        <button onClick={function(){navigate('/org');}}
          style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13,
            color:'rgba(255,255,255,0.4)', background:'none', border:'none',
            cursor:'pointer', padding:0, marginBottom:12, fontFamily:sans,
            transition:'color 0.15s' }}
          onMouseEnter={function(e){e.currentTarget.style.color='rgba(255,255,255,0.8)';}}
          onMouseLeave={function(e){e.currentTarget.style.color='rgba(255,255,255,0.4)';}}>
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:700, color:'#fff',
          margin:'0 0 6px', fontFamily:font }}>Request a Survey</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>
          Commission verified civic data from real, identity-verified citizens
        </p>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:6, marginTop:20, flexWrap:'wrap' }}>
          {[
            { n:'1', label:'Survey Details' },
            { n:'2', label:'Add Questions' },
            { n:'3', label:'Target Audience' },
            { n:'4', label:'Review & Submit' },
          ].map(function(s,i){
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6,
                padding:'6px 12px', background:'rgba(255,255,255,0.07)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:20 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0,
                  background:'linear-gradient(135deg,'+gold+','+goldL+')',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:800, color:'#fff' }}>{s.n}</div>
                <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)', whiteSpace:'nowrap' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="rq-body" style={{ padding:'28px 40px 0', maxWidth:1200, margin:'0 auto' }}>

        {/* Error banner */}
        {error && (
          <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)',
            borderRadius:12, padding:'12px 16px', marginBottom:20,
            display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16 }}>⚠</span>
            <p style={{ fontSize:13, color:red, margin:0 }}>{error}</p>
          </div>
        )}

        <div className="rq-grid">

          {/* ── LEFT: Form ──────────────────────────── */}
          <div>

            {/* Survey Details */}
            <Card title="Survey Details" subtitle="What do you want to learn from citizens?" icon="📋">
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Title <span style={{color:red}}>*</span></label>
                <input className="rq-input" value={form.title}
                  onChange={function(e){set('title',e.target.value);}}
                  placeholder="e.g., Public Transit Satisfaction Survey"
                  style={inputStyle} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Description</label>
                <textarea className="rq-input" value={form.description}
                  onChange={function(e){set('description',e.target.value);}}
                  placeholder="Briefly describe the purpose and context of this survey..."
                  rows={3} style={Object.assign({},inputStyle,{resize:'vertical',lineHeight:1.7})} />
              </div>
              <div>
                <label style={labelStyle}>Target Responses</label>
                <div style={{ position:'relative' }}>
                  <select className="rq-input rq-select" value={form.target_responses}
                    onChange={function(e){set('target_responses',e.target.value);}}
                    style={Object.assign({},inputStyle,{appearance:'none',paddingRight:40,cursor:'pointer'})}>
                    <option value="50">50 responses</option>
                    <option value="100">100 responses</option>
                    <option value="250">250 responses</option>
                    <option value="500">500 responses</option>
                    <option value="1000">1,000 responses</option>
                    <option value="2500">2,500 responses</option>
                    <option value="5000">5,000 responses</option>
                  </select>
                  <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                    pointerEvents:'none', color:'rgba(255,255,255,0.4)', fontSize:11 }}>▼</span>
                </div>
              </div>
            </Card>

            {/* Questions */}
            <Card title="Survey Questions" subtitle="Add the questions citizens will answer" icon="❓">
              {questions.map(function(q,qi){
                return (
                  <div key={qi} style={{ padding:16, background:'rgba(255,255,255,0.04)',
                    borderRadius:14, marginBottom:12,
                    border:'1px solid rgba(255,255,255,0.07)',
                    animation:'fadeUp 0.3s ease' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:24, height:24, borderRadius:6,
                          background:'linear-gradient(135deg,'+gold+','+goldL+')',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, fontWeight:800, color:'#fff' }}>{qi+1}</div>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>Question</span>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <select value={q.type} onChange={function(e){updateQ(qi,'type',e.target.value);}}
                          style={{ padding:'6px 10px', fontSize:11, border:'1px solid rgba(255,255,255,0.12)',
                            borderRadius:8, outline:'none', color:'#fff',
                            background:'rgba(255,255,255,0.08)', cursor:'pointer', fontFamily:sans }}>
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="rating">Rating (1–5)</option>
                          <option value="yes_no">Yes / No</option>
                          <option value="text">Free Text</option>
                        </select>
                        {questions.length > 1 && (
                          <button onClick={function(){remQ(qi);}}
                            style={{ width:28, height:28, borderRadius:8,
                              background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)',
                              color:red, cursor:'pointer', fontSize:13, display:'flex',
                              alignItems:'center', justifyContent:'center' }}>✕</button>
                        )}
                      </div>
                    </div>

                    <input className="rq-input" value={q.text}
                      onChange={function(e){updateQ(qi,'text',e.target.value);}}
                      placeholder="Enter your question here..."
                      style={Object.assign({},inputStyle,{marginBottom:12})} />

                    {q.type==='multiple_choice' && (
                      <div>
                        {q.options.map(function(opt,oi){
                          return (
                            <div key={oi} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                              <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0,
                                border:'2px solid rgba(255,255,255,0.15)',
                                background:'rgba(255,255,255,0.04)' }} />
                              <input className="rq-input" value={opt}
                                onChange={function(e){updateOpt(qi,oi,e.target.value);}}
                                placeholder={'Option '+(oi+1)}
                                style={Object.assign({},inputStyle,{padding:'8px 12px',fontSize:13})} />
                              {q.options.length > 2 && (
                                <button onClick={function(){remOpt(qi,oi);}}
                                  style={{ background:'none', border:'none', cursor:'pointer',
                                    color:'rgba(255,255,255,0.2)', fontSize:14, padding:'0 4px',
                                    flexShrink:0 }}>✕</button>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={function(){addOpt(qi);}}
                          style={{ fontSize:12, fontWeight:700, color:gold,
                            background:'none', border:'none', cursor:'pointer',
                            padding:'4px 0', marginTop:2, fontFamily:sans }}>
                          + Add option
                        </button>
                      </div>
                    )}
                    {q.type==='yes_no'  && <p style={{fontSize:12,color:'rgba(255,255,255,0.25)',margin:'4px 0 0'}}>Citizens choose Yes or No</p>}
                    {q.type==='rating'  && <p style={{fontSize:12,color:'rgba(255,255,255,0.25)',margin:'4px 0 0'}}>Citizens rate from 1 to 5 stars</p>}
                    {q.type==='text'    && <p style={{fontSize:12,color:'rgba(255,255,255,0.25)',margin:'4px 0 0'}}>Citizens type a free-text answer</p>}
                  </div>
                );
              })}

              <button onClick={addQ}
                style={{ width:'100%', padding:14, border:'2px dashed rgba(255,255,255,0.1)',
                  borderRadius:12, background:'transparent', fontSize:13, fontWeight:700,
                  color:'rgba(255,255,255,0.3)', cursor:'pointer', fontFamily:sans,
                  transition:'all 0.2s' }}
                onMouseEnter={function(e){e.currentTarget.style.borderColor='rgba(197,150,12,0.4)';e.currentTarget.style.color=gold;}}
                onMouseLeave={function(e){e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color='rgba(255,255,255,0.3)';}}>
                + Add Question
              </button>
            </Card>

            {/* Demographic Targeting */}
            <Card title="Demographic Targeting" subtitle="More filters = more precise audience (and higher price per response)" icon="🎯">
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
                {DEMOGRAPHIC_OPTIONS.map(function(d){
                  var on = !!filters[d.key];
                  return (
                    <button key={d.key} className="filter-pill"
                      onClick={function(){toggleFilter(d.key);}}
                      style={{ padding:'8px 14px', borderRadius:20,
                        border:'1px solid '+(on?gold:'rgba(255,255,255,0.1)'),
                        background: on?'rgba(197,150,12,0.15)':'rgba(255,255,255,0.04)',
                        color: on?gold:'rgba(255,255,255,0.45)',
                        fontSize:12, fontWeight:600, cursor:'pointer',
                        transition:'all 0.15s', fontFamily:sans }}>
                      {on && <span style={{marginRight:4}}>✓</span>}{d.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <span style={{ fontSize:14 }}>📍</span>
                  <h3 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:0 }}>Geographic Targeting</h3>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.06)',
                    padding:'2px 8px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)' }}>
                    City adds +$1.00/response
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input className="rq-input" value={form.state}
                      onChange={function(e){set('state',e.target.value);}}
                      placeholder="e.g., Indiana" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input className="rq-input" value={form.city}
                      onChange={function(e){set('city',e.target.value);}}
                      placeholder="e.g., Indianapolis" style={inputStyle} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit actions */}
            <div style={{ display:'flex', gap:12, alignItems:'center', paddingBottom:20 }}>
              <button onClick={function(){navigate('/org');}}
                style={{ padding:'14px 24px', background:'rgba(255,255,255,0.07)',
                  color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:sans }}>
                Cancel
              </button>
              <button className="rq-btn" onClick={submit} disabled={submitting}
                style={{ flex:1, padding:'14px 28px',
                  background:'linear-gradient(135deg,'+gold+','+goldL+')',
                  color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700,
                  cursor:'pointer', boxShadow:'0 4px 20px rgba(197,150,12,0.4)',
                  opacity:submitting?0.6:1, transition:'all 0.2s', fontFamily:sans }}>
                {submitting ? '⏳ Submitting…' : '🚀 Submit for Review'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live Price Calculator ────────── */}
          <div className="rq-sticky" style={{ position:'sticky', top:24 }}>

            {/* Tier card */}
            <div style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:18,
              overflow:'hidden', marginBottom:16 }}>

              {/* Top accent */}
              <div style={{ height:3, background:'linear-gradient(90deg,'+tier.color+','+gold+')' }} />

              <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.8,
                  color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>Your Pricing Tier</p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%',
                    background:tier.color, animation:'livepulse 2s infinite',
                    boxShadow:'0 0 0 3px '+tier.color+'30' }} />
                  <span style={{ fontSize:17, fontWeight:700, color:'#fff', fontFamily:font }}>{tier.label}</span>
                </div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:'6px 0 0' }}>
                  {active.length} filter{active.length!==1?'s':''}{hasGeo?' + geo':''}
                </p>
              </div>

              {/* Big price */}
              <div style={{ padding:'22px 20px', textAlign:'center',
                background:'rgba(197,150,12,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.8,
                  color:'rgba(255,255,255,0.25)', margin:'0 0 6px' }}>Per Response</p>
                <p style={{ fontSize:48, fontWeight:800, color:gold, margin:'0 0 4px',
                  fontFamily:font, lineHeight:1 }}>${price.toFixed(2)}</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>per verified citizen response</p>
              </div>

              {/* Line items */}
              <div style={{ padding:'16px 20px' }}>
                {[
                  {label:'Target responses', val:form.target_responses},
                  {label:'Rate per response', val:'$'+price.toFixed(2)},
                ].map(function(row,i){
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between',
                      padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>{row.label}</span>
                      <span style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.8)'}}>{row.val}</span>
                    </div>
                  );
                })}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 4px' }}>
                  <span style={{fontSize:15,fontWeight:700,color:'#fff'}}>Estimated Total</span>
                  <span style={{fontSize:15,fontWeight:800,color:gold}}>${total}</span>
                </div>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', margin:'6px 0 0', lineHeight:1.6 }}>
                  Invoiced on actual verified responses. Final cost may vary.
                </p>
              </div>
            </div>

            {/* Pricing guide */}
            <div style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:18,
              overflow:'hidden', marginBottom:16 }}>
              <div style={{ padding:'14px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.8,
                  color:'rgba(255,255,255,0.3)', margin:0 }}>Pricing Guide</p>
              </div>
              <div style={{ padding:'12px 20px 16px' }}>
                {[
                  {label:'General Audience', desc:'No filters',    price:'$3.50', color:'#34d399', active:active.length===0&&!hasGeo},
                  {label:'Basic Targeting',  desc:'1–2 filters',   price:'$4.50', color:gold,      active:active.length>=1&&active.length<=2},
                  {label:'Refined Targeting',desc:'3–4 filters',   price:'$5.50', color:'#60a5fa', active:active.length>=3&&active.length<=4},
                  {label:'Precision',        desc:'5+ filters',    price:'$7.00', color:'#a78bfa', active:active.length>=5},
                ].map(function(t,i){
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'9px 10px', borderRadius:10, marginBottom:4,
                      background: t.active?'rgba(255,255,255,0.06)':'transparent',
                      border: t.active?'1px solid rgba(255,255,255,0.08)':'1px solid transparent',
                      transition:'all 0.2s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%',
                          background: t.active?t.color:'rgba(255,255,255,0.15)' }} />
                        <div>
                          <span style={{ fontSize:12, fontWeight:t.active?700:400,
                            color:t.active?'#fff':'rgba(255,255,255,0.35)' }}>{t.label}</span>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginLeft:6 }}>{t.desc}</span>
                        </div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700,
                        color:t.active?t.color:'rgba(255,255,255,0.2)' }}>{t.price}</span>
                    </div>
                  );
                })}
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'9px 10px', borderRadius:10,
                  background: hasGeo?'rgba(255,255,255,0.06)':'transparent',
                  border: hasGeo?'1px solid rgba(255,255,255,0.08)':'1px solid transparent',
                  marginTop:4, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13 }}>📍</span>
                    <div>
                      <span style={{ fontSize:12, fontWeight:hasGeo?700:400,
                        color:hasGeo?'#fff':'rgba(255,255,255,0.35)' }}>Geo Micro-Target</span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginLeft:6 }}>City</span>
                    </div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700,
                    color:hasGeo?goldL:'rgba(255,255,255,0.2)' }}>+$1.00</span>
                </div>
              </div>
            </div>

            {/* Trust note */}
            <div style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)',
              borderRadius:14, padding:'14px 16px' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'#34d399', margin:'0 0 6px' }}>✅ 100% Verified Responses</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0, lineHeight:1.6 }}>
                Every response comes from a real citizen verified through Didit identity verification. No bots, no duplicates.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
