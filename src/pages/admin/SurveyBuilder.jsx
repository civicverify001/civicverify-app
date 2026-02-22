// src/pages/admin/SurveyBuilder.jsx — Full demographic audience targeting
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

var US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
var RACE_OPTIONS = ['White','Black or African American','Hispanic or Latino','Asian','American Indian or Alaska Native','Native Hawaiian or Pacific Islander','Two or More Races','Other'];
var SEX_OPTIONS = ['Male','Female','Non-binary'];
var EDUCATION_OPTIONS = ['Less than High School','High School Diploma / GED','Some College','Associate Degree','Bachelor Degree','Master Degree','Doctoral / Professional Degree'];
var EMPLOYMENT_OPTIONS = ['Employed Full-Time','Employed Part-Time','Self-Employed','Unemployed','Retired','Student','Homemaker','Unable to Work'];
var INCOME_OPTIONS = ['Under $25,000','$25,000 - $49,999','$50,000 - $74,999','$75,000 - $99,999','$100,000 - $149,999','$150,000+'];
var MARITAL_OPTIONS = ['Single','Married','Divorced','Widowed','Separated','Domestic Partnership'];
var PARTY_OPTIONS = ['Democrat','Republican','Independent','Libertarian','Green Party','Other'];
var HOUSING_OPTIONS = ['Homeowner','Renter','Other'];
var VOTER_OPTIONS = ['Yes','No'];
var VETERAN_OPTIONS = ['Yes','No'];

var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: '#0B2545', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' };
var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });
var labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 };

var qTypes = { multiple_choice: { icon: '\uD83D\uDD18', label: 'Multiple Choice' }, checkbox: { icon: '\u2611\uFE0F', label: 'Checkbox' }, text: { icon: '\uD83D\uDCDD', label: 'Text' }, rating: { icon: '\u2B50', label: 'Rating' } };

export default function SurveyBuilder() {
  var navigate = useNavigate();
  var [form, setForm] = useState({
    title: '', description: '', status: 'draft',
    target_state: '', target_county: '', target_city: '', target_zip: '',
    target_race: '', target_sex: '', target_education: '', target_employment: '', target_income: '',
    target_marital: '', target_party: '', target_voter_registered: '', target_veteran: '', target_housing: '',
    target_age_min: '', target_age_max: '', target_responses: ''
  });
  var [questions, setQuestions] = useState([]);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');

  function update(f,v){ setForm(function(p){ return Object.assign({},p,{[f]:v}); }); setError(''); }

  function addQuestion(type) { setQuestions(function(p){ return p.concat([{ id:'q'+Date.now(), type:type, text:'', required:true, options: type==='multiple_choice'||type==='checkbox'?['','']:[] }]); }); }
  function updateQuestion(i,f,v){ setQuestions(function(p){ return p.map(function(q,j){ if(j!==i)return q; return Object.assign({},q,{[f]:v}); }); }); }
  function updateOption(qi,oi,v){ setQuestions(function(p){ return p.map(function(q,j){ if(j!==qi)return q; var o=q.options.slice(); o[oi]=v; return Object.assign({},q,{options:o}); }); }); }
  function addOption(qi){ setQuestions(function(p){ return p.map(function(q,j){ if(j!==qi)return q; return Object.assign({},q,{options:q.options.concat([''])}); }); }); }
  function removeOption(qi,oi){ setQuestions(function(p){ return p.map(function(q,j){ if(j!==qi)return q; return Object.assign({},q,{options:q.options.filter(function(_,k){return k!==oi;})}); }); }); }
  function removeQuestion(i){ setQuestions(function(p){ return p.filter(function(_,j){return j!==i;}); }); }
  function moveQuestion(i,d){ setQuestions(function(p){ var a=p.slice(); var n=i+d; if(n<0||n>=a.length)return a; var t=a[i]; a[i]=a[n]; a[n]=t; return a; }); }

  async function handleSave(status) {
    if (!form.title.trim()) return setError('Title required');
    if (questions.length===0) return setError('Add at least one question');
    for (var i=0;i<questions.length;i++) { if(!questions[i].text.trim()) return setError('Q'+(i+1)+' needs text'); if((questions[i].type==='multiple_choice'||questions[i].type==='checkbox')&&questions[i].options.filter(function(o){return o.trim()}).length<2) return setError('Q'+(i+1)+' needs 2+ options'); }
    setSaving(true);
    var d = {
      title: form.title.trim(), description: form.description.trim()||null, status: status,
      questions: questions.map(function(q){ return {id:q.id,type:q.type,text:q.text.trim(),required:q.required,options:q.options.filter(function(o){return o.trim()})}; }),
      target_state: form.target_state||null, target_county: form.target_county.trim()||null, target_city: form.target_city.trim()||null, target_zip: form.target_zip.trim()||null,
      target_race: form.target_race||null, target_sex: form.target_sex||null,
      target_education: form.target_education||null, target_employment: form.target_employment||null,
      target_income: form.target_income||null, target_marital: form.target_marital||null,
      target_party: form.target_party||null, target_voter_registered: form.target_voter_registered||null,
      target_veteran: form.target_veteran||null, target_housing: form.target_housing||null,
      target_age_min: form.target_age_min?parseInt(form.target_age_min):null, target_age_max: form.target_age_max?parseInt(form.target_age_max):null,
      target_responses: form.target_responses?parseInt(form.target_responses):null, response_count: 0
    };
    var r = await supabase.from('surveys').insert(d);
    setSaving(false);
    if (r.error) return setError(r.error.message);
    navigate('/admin/surveys');
  }

  // Count active filters
  var filterCount = [form.target_state,form.target_county,form.target_city,form.target_zip,form.target_race,form.target_sex,form.target_education,form.target_employment,form.target_income,form.target_marital,form.target_party,form.target_voter_registered,form.target_veteran,form.target_housing,form.target_age_min,form.target_age_max].filter(Boolean).length;

  function Sel(props){ return <select value={props.value} onChange={function(e){update(props.field,e.target.value)}} style={selectStyle}><option value="">{props.ph||'All'}</option>{props.opts.map(function(o){return <option key={o} value={o}>{o}</option>;})}</select>; }

  return (
    <div style={{ maxWidth: 780, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, color:C.navy, margin:'0 0 4px', fontFamily:font }}>Create Survey</h1>
          <p style={{ fontSize:14, color:'rgba(11,37,69,0.35)', margin:0 }}>Build polls with precise audience targeting</p>
        </div>
        <button onClick={function(){navigate('/admin/surveys')}} style={{ padding:'8px 16px', background:'rgba(11,37,69,0.05)', border:'none', borderRadius:8, fontSize:13, fontWeight:600, color:'rgba(11,37,69,0.4)', cursor:'pointer' }}>{'\u2190'} Back</button>
      </div>

      {error ? <div style={{ background:C.red+'08', border:'1px solid '+C.red+'20', borderRadius:10, padding:'10px 14px', marginBottom:16 }}><p style={{ fontSize:13, color:C.red, margin:0 }}>{'\u26A0'} {error}</p></div> : null}

      {/* Survey Details */}
      <div style={{ background:'#fff', borderRadius:14, padding:24, border:'1px solid rgba(11,37,69,0.06)', marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>{'\uD83D\uDCCB'} Survey Details</h2>
        <div style={{ marginBottom:14 }}><label style={labelStyle}>Title <span style={{color:C.red}}>*</span></label><input value={form.title} onChange={function(e){update('title',e.target.value)}} placeholder="e.g., Community Budget Priorities 2026" style={inputStyle} /></div>
        <div><label style={labelStyle}>Description</label><textarea value={form.description} onChange={function(e){update('description',e.target.value)}} placeholder="Brief description..." rows={3} style={Object.assign({},inputStyle,{resize:'vertical',lineHeight:1.6})} /></div>
      </div>

      {/* Audience Targeting */}
      <div style={{ background:'#fff', borderRadius:14, padding:24, border:'1px solid rgba(11,37,69,0.06)', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:0 }}>{'\uD83C\uDFAF'} Audience Targeting</h2>
          {filterCount > 0 ? <span style={{ fontSize:11, fontWeight:700, color:C.gold, background:C.gold+'15', padding:'4px 10px', borderRadius:20 }}>{filterCount} filter{filterCount!==1?'s':''} active</span> : null}
        </div>
        <p style={{ fontSize:12, color:'rgba(11,37,69,0.25)', margin:'0 0 20px' }}>Leave blank to target all citizens</p>

        {/* Location */}
        <p style={{ fontSize:11, fontWeight:700, color:'rgba(11,37,69,0.2)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 10px' }}>{'\uD83D\uDCCD'} Location</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <div><label style={labelStyle}>State</label><Sel value={form.target_state} field="target_state" opts={US_STATES} ph="All States" /></div>
          <div><label style={labelStyle}>County</label><input value={form.target_county} onChange={function(e){update('target_county',e.target.value)}} placeholder="Any county" style={inputStyle} /></div>
          <div><label style={labelStyle}>City</label><input value={form.target_city} onChange={function(e){update('target_city',e.target.value)}} placeholder="Any city" style={inputStyle} /></div>
          <div><label style={labelStyle}>ZIP Code</label><input value={form.target_zip} onChange={function(e){update('target_zip',e.target.value.replace(/\D/g,'').slice(0,5))}} placeholder="Any ZIP" maxLength={5} style={inputStyle} /></div>
        </div>

        {/* Demographics */}
        <p style={{ fontSize:11, fontWeight:700, color:'rgba(11,37,69,0.2)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 10px' }}>{'\uD83D\uDC64'} Demographics</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <div><label style={labelStyle}>Race / Ethnicity</label><Sel value={form.target_race} field="target_race" opts={RACE_OPTIONS} /></div>
          <div><label style={labelStyle}>Sex</label><Sel value={form.target_sex} field="target_sex" opts={SEX_OPTIONS} /></div>
          <div><label style={labelStyle}>Min Age</label><input type="number" value={form.target_age_min} onChange={function(e){update('target_age_min',e.target.value)}} placeholder="e.g., 18" style={inputStyle} /></div>
          <div><label style={labelStyle}>Max Age</label><input type="number" value={form.target_age_max} onChange={function(e){update('target_age_max',e.target.value)}} placeholder="e.g., 65" style={inputStyle} /></div>
        </div>

        {/* Socioeconomic */}
        <p style={{ fontSize:11, fontWeight:700, color:'rgba(11,37,69,0.2)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 10px' }}>{'\uD83C\uDFE2'} Socioeconomic</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <div><label style={labelStyle}>Education</label><Sel value={form.target_education} field="target_education" opts={EDUCATION_OPTIONS} /></div>
          <div><label style={labelStyle}>Employment</label><Sel value={form.target_employment} field="target_employment" opts={EMPLOYMENT_OPTIONS} /></div>
          <div><label style={labelStyle}>Income</label><Sel value={form.target_income} field="target_income" opts={INCOME_OPTIONS} /></div>
          <div><label style={labelStyle}>Housing</label><Sel value={form.target_housing} field="target_housing" opts={HOUSING_OPTIONS} /></div>
        </div>

        {/* Political */}
        <p style={{ fontSize:11, fontWeight:700, color:'rgba(11,37,69,0.2)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 10px' }}>{'\uD83C\uDDFA\uD83C\uDDF8'} Political</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          <div><label style={labelStyle}>Party Affiliation</label><Sel value={form.target_party} field="target_party" opts={PARTY_OPTIONS} /></div>
          <div><label style={labelStyle}>Registered Voter</label><Sel value={form.target_voter_registered} field="target_voter_registered" opts={VOTER_OPTIONS} /></div>
          <div><label style={labelStyle}>Veteran</label><Sel value={form.target_veteran} field="target_veteran" opts={VETERAN_OPTIONS} /></div>
          <div><label style={labelStyle}>Marital Status</label><Sel value={form.target_marital} field="target_marital" opts={MARITAL_OPTIONS} /></div>
        </div>

        <div style={{ marginBottom: 0 }}><label style={labelStyle}>Target Responses</label><input type="number" value={form.target_responses} onChange={function(e){update('target_responses',e.target.value)}} placeholder="e.g., 500" style={inputStyle} /></div>

        {filterCount > 0 ? <div style={{ marginTop:16, padding:'12px 14px', background:C.gold+'06', borderRadius:8, border:'1px solid '+C.gold+'15' }}>
          <p style={{ fontSize:12, color:'rgba(11,37,69,0.45)', margin:0 }}>{'\uD83C\uDFAF'} Targeting: <strong style={{color:C.navy}}>
            {[form.target_state,form.target_county,form.target_city,form.target_race,form.target_sex,form.target_education,form.target_employment,form.target_income,form.target_party,form.target_housing,form.target_age_min?'Age '+form.target_age_min+'+':'',form.target_age_max?'Under '+form.target_age_max:'',form.target_voter_registered==='Yes'?'Voters':'',form.target_veteran==='Yes'?'Veterans':''].filter(Boolean).join(', ')||'All Citizens'}
          </strong></p>
        </div> : null}
      </div>

      {/* Questions */}
      <div style={{ background:'#fff', borderRadius:14, padding:24, border:'1px solid rgba(11,37,69,0.06)', marginBottom:20 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:C.navy, margin:'0 0 16px' }}>{'\u2753'} Questions ({questions.length})</h2>
        {questions.map(function(q,qi) {
          var qt = qTypes[q.type]||qTypes.text;
          return <div key={q.id} style={{ border:'1px solid rgba(11,37,69,0.06)', borderRadius:12, padding:20, marginBottom:16, background:'rgba(245,241,236,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(11,37,69,0.3)' }}>{qt.icon} Q{qi+1} — {qt.label}</span>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={function(){moveQuestion(qi,-1)}} disabled={qi===0} style={{ width:28,height:28,border:'none',borderRadius:6,background:'rgba(11,37,69,0.04)',cursor:'pointer',fontSize:12,opacity:qi===0?0.3:1 }}>{'\u25B2'}</button>
                <button onClick={function(){moveQuestion(qi,1)}} disabled={qi===questions.length-1} style={{ width:28,height:28,border:'none',borderRadius:6,background:'rgba(11,37,69,0.04)',cursor:'pointer',fontSize:12,opacity:qi===questions.length-1?0.3:1 }}>{'\u25BC'}</button>
                <button onClick={function(){removeQuestion(qi)}} style={{ width:28,height:28,border:'none',borderRadius:6,background:C.red+'08',cursor:'pointer',fontSize:12,color:C.red }}>{'\u2715'}</button>
              </div>
            </div>
            <input value={q.text} onChange={function(e){updateQuestion(qi,'text',e.target.value)}} placeholder="Enter your question..." style={Object.assign({},inputStyle,{marginBottom:10})} />
            <label style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:'rgba(11,37,69,0.35)',marginBottom:10,cursor:'pointer' }}><input type="checkbox" checked={q.required} onChange={function(e){updateQuestion(qi,'required',e.target.checked)}} style={{accentColor:C.gold}} /> Required</label>
            {(q.type==='multiple_choice'||q.type==='checkbox') ? <div>
              {q.options.map(function(opt,oi){ return <div key={oi} style={{ display:'flex',gap:8,marginBottom:6 }}>
                <span style={{ width:24,height:36,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'rgba(11,37,69,0.2)' }}>{q.type==='multiple_choice'?'\u25CB':'\u25A1'}</span>
                <input value={opt} onChange={function(e){updateOption(qi,oi,e.target.value)}} placeholder={'Option '+(oi+1)} style={Object.assign({},inputStyle,{padding:'8px 12px',fontSize:13})} />
                {q.options.length>2?<button onClick={function(){removeOption(qi,oi)}} style={{ width:36,height:36,border:'none',borderRadius:8,background:'rgba(11,37,69,0.03)',cursor:'pointer',fontSize:11,color:'rgba(11,37,69,0.25)' }}>{'\u2715'}</button>:null}
              </div>; })}
              <button onClick={function(){addOption(qi)}} style={{ fontSize:12,fontWeight:600,color:C.gold,border:'none',background:'none',cursor:'pointer',marginTop:4,padding:'4px 0' }}>+ Add Option</button>
            </div> : null}
          </div>;
        })}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginTop:8 }}>
          {Object.entries(qTypes).map(function(e){ var k=e[0],v=e[1]; return <button key={k} onClick={function(){addQuestion(k)}} style={{ padding:'12px 8px',borderRadius:10,border:'2px dashed rgba(11,37,69,0.08)',background:'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}><span style={{fontSize:20}}>{v.icon}</span><span style={{fontSize:11,fontWeight:600,color:'rgba(11,37,69,0.35)'}}>{v.label}</span></button>; })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:12 }}>
        <button onClick={function(){handleSave('draft')}} disabled={saving} style={{ flex:1, padding:14, background:'rgba(11,37,69,0.05)', color:'rgba(11,37,69,0.5)', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', opacity:saving?0.5:1 }}>{saving?'...':'Save Draft'}</button>
        <button onClick={function(){handleSave('active')}} disabled={saving} style={{ flex:2, padding:14, background:C.gold, color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', opacity:saving?0.5:1, boxShadow:'0 4px 16px rgba(197,150,12,0.2)' }}>{saving?'Publishing...':'Publish Survey \u2192'}</button>
      </div>
    </div>
  );
}
