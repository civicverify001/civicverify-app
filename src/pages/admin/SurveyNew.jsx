// src/pages/admin/SurveyNew.jsx — Enhanced with State/County/City/ZIP targeting
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

var US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

var AGE_RANGES = ['All Ages', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export default function SurveyNew() {
  var navigate = useNavigate();
  var [form, setForm] = useState({
    title: '', description: '', status: 'draft',
    target_age: '', target_state: '', target_county: '', target_city: '', target_zip: '',
    target_responses: ''
  });
  var [questions, setQuestions] = useState([]);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');

  function update(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
    setError('');
  }

  function addQuestion(type) {
    setQuestions(function(prev) {
      return prev.concat([{
        id: 'q' + Date.now(),
        type: type,
        text: '',
        required: true,
        options: type === 'multiple_choice' || type === 'checkbox' ? ['', ''] : []
      }]);
    });
  }

  function updateQuestion(idx, field, value) {
    setQuestions(function(prev) { return prev.map(function(q, i) { if (i !== idx) return q; return Object.assign({}, q, { [field]: value }); }); });
  }

  function updateOption(qIdx, oIdx, value) {
    setQuestions(function(prev) {
      return prev.map(function(q, i) {
        if (i !== qIdx) return q;
        var opts = q.options.slice();
        opts[oIdx] = value;
        return Object.assign({}, q, { options: opts });
      });
    });
  }

  function addOption(qIdx) {
    setQuestions(function(prev) {
      return prev.map(function(q, i) {
        if (i !== qIdx) return q;
        return Object.assign({}, q, { options: q.options.concat(['']) });
      });
    });
  }

  function removeOption(qIdx, oIdx) {
    setQuestions(function(prev) {
      return prev.map(function(q, i) {
        if (i !== qIdx) return q;
        return Object.assign({}, q, { options: q.options.filter(function(_, j) { return j !== oIdx; }) });
      });
    });
  }

  function removeQuestion(idx) {
    setQuestions(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
  }

  function moveQuestion(idx, dir) {
    setQuestions(function(prev) {
      var arr = prev.slice();
      var newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      var temp = arr[idx]; arr[idx] = arr[newIdx]; arr[newIdx] = temp;
      return arr;
    });
  }

  async function handleSave(status) {
    if (!form.title.trim()) return setError('Survey title is required');
    if (questions.length === 0) return setError('Add at least one question');
    for (var i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) return setError('Question ' + (i + 1) + ' needs text');
      if ((questions[i].type === 'multiple_choice' || questions[i].type === 'checkbox') && questions[i].options.filter(function(o){return o.trim()}).length < 2) {
        return setError('Question ' + (i + 1) + ' needs at least 2 options');
      }
    }

    setSaving(true);
    var surveyData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: status,
      questions: questions.map(function(q) {
        return {
          id: q.id, type: q.type, text: q.text.trim(), required: q.required,
          options: q.options.filter(function(o) { return o.trim(); })
        };
      }),
      target_age: form.target_age || null,
      target_state: form.target_state || null,
      target_county: form.target_county.trim() || null,
      target_city: form.target_city.trim() || null,
      target_zip: form.target_zip.trim() || null,
      target_responses: form.target_responses ? parseInt(form.target_responses) : null,
      response_count: 0
    };

    var { error: err } = await supabase.from('surveys').insert(surveyData);
    setSaving(false);
    if (err) return setError(err.message);
    navigate('/admin/surveys');
  }

  var inputStyle = { width: '100%', padding: '12px 16px', fontSize: 14, border: '1px solid rgba(11,37,69,0.1)', borderRadius: 10, outline: 'none', color: C.navy, background: '#fff', fontFamily: 'inherit' };
  var selectStyle = Object.assign({}, inputStyle, { appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath d=\'M2 4l4 4 4-4\' fill=\'none\' stroke=\'%230B2545\' stroke-width=\'1.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 });

  function Label({ text, required }) {
    return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.35)', marginBottom: 6 }}>{text} {required ? <span style={{ color: C.red }}>*</span> : null}</label>;
  }

  var qTypes = { multiple_choice: { icon: '\uD83D\uDD18', label: 'Multiple Choice' }, checkbox: { icon: '\u2611\uFE0F', label: 'Checkbox' }, text: { icon: '\uD83D\uDCDD', label: 'Text' }, rating: { icon: '\u2B50', label: 'Rating' } };

  return (
    <div style={{ maxWidth: 760, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Create Survey</h1>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Build a new civic poll with audience targeting</p>
        </div>
        <button onClick={function(){navigate('/admin/surveys')}} style={{ padding: '8px 16px', background: 'rgba(11,37,69,0.05)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'rgba(11,37,69,0.4)', cursor: 'pointer' }}>{'\u2190'} Back</button>
      </div>

      {error ? (
        <div style={{ background: C.red + '08', border: '1px solid ' + C.red + '20', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{'\u26A0'} {error}</p>
        </div>
      ) : null}

      {/* Basic Info */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>{'\uD83D\uDCCB'} Survey Details</h2>
        <div style={{ marginBottom: 14 }}>
          <Label text="Title" required />
          <input value={form.title} onChange={function(e){update('title', e.target.value)}} placeholder="e.g., Community Budget Priorities 2026" style={inputStyle} />
        </div>
        <div>
          <Label text="Description" />
          <textarea value={form.description} onChange={function(e){update('description', e.target.value)}} placeholder="Brief description of this survey..." rows={3}
            style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
        </div>
      </div>

      {/* Audience Targeting */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 4px' }}>{'\uD83C\uDFAF'} Audience Targeting</h2>
        <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.25)', margin: '0 0 16px' }}>Leave blank to show to all citizens</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Label text="Target Age Range" />
            <select value={form.target_age} onChange={function(e){update('target_age', e.target.value)}} style={selectStyle}>
              <option value="">All Ages</option>
              {AGE_RANGES.filter(function(a){return a !== 'All Ages'}).map(function(a) { return <option key={a} value={a}>{a}</option>; })}
            </select>
          </div>
          <div>
            <Label text="Target State" />
            <select value={form.target_state} onChange={function(e){update('target_state', e.target.value)}} style={selectStyle}>
              <option value="">All States</option>
              {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
            </select>
          </div>
          <div>
            <Label text="Target County" />
            <input value={form.target_county} onChange={function(e){update('target_county', e.target.value)}} placeholder="e.g., Marion County" style={inputStyle} />
          </div>
          <div>
            <Label text="Target City" />
            <input value={form.target_city} onChange={function(e){update('target_city', e.target.value)}} placeholder="e.g., Indianapolis" style={inputStyle} />
          </div>
          <div>
            <Label text="Target ZIP Code" />
            <input value={form.target_zip} onChange={function(e){update('target_zip', e.target.value.replace(/\D/g, '').slice(0,5))}} placeholder="e.g., 46201" maxLength={5} style={inputStyle} />
          </div>
          <div>
            <Label text="Target Responses" />
            <input type="number" value={form.target_responses} onChange={function(e){update('target_responses', e.target.value)}} placeholder="e.g., 500" style={inputStyle} />
          </div>
        </div>

        {(form.target_state || form.target_county || form.target_city || form.target_zip) ? (
          <div style={{ marginTop: 12, padding: '10px 14px', background: C.gold + '06', borderRadius: 8, border: '1px solid ' + C.gold + '15' }}>
            <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: 0 }}>
              {'\uD83D\uDCCD'} This poll will be shown to citizens in: <strong style={{ color: C.navy }}>
              {[form.target_city, form.target_county, form.target_state, form.target_zip].filter(Boolean).join(', ')}
              </strong>
            </p>
          </div>
        ) : null}
      </div>

      {/* Questions */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>{'\u2753'} Questions ({questions.length})</h2>

        {questions.map(function(q, qIdx) {
          var qType = qTypes[q.type] || qTypes.text;
          return (
            <div key={q.id} style={{ border: '1px solid rgba(11,37,69,0.06)', borderRadius: 12, padding: 20, marginBottom: 16, background: 'rgba(245,241,236,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.3)' }}>{qType.icon} Q{qIdx + 1} — {qType.label}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={function(){moveQuestion(qIdx, -1)}} disabled={qIdx === 0} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'rgba(11,37,69,0.04)', cursor: 'pointer', fontSize: 12, opacity: qIdx === 0 ? 0.3 : 1 }}>{'\u25B2'}</button>
                  <button onClick={function(){moveQuestion(qIdx, 1)}} disabled={qIdx === questions.length - 1} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'rgba(11,37,69,0.04)', cursor: 'pointer', fontSize: 12, opacity: qIdx === questions.length - 1 ? 0.3 : 1 }}>{'\u25BC'}</button>
                  <button onClick={function(){removeQuestion(qIdx)}} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: C.red + '08', cursor: 'pointer', fontSize: 12, color: C.red }}>{'\u2715'}</button>
                </div>
              </div>

              <input value={q.text} onChange={function(e){updateQuestion(qIdx, 'text', e.target.value)}} placeholder="Enter your question..." style={Object.assign({}, inputStyle, { marginBottom: 10 })} />

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(11,37,69,0.35)', marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={q.required} onChange={function(e){updateQuestion(qIdx, 'required', e.target.checked)}} style={{ accentColor: C.gold }} />
                Required
              </label>

              {(q.type === 'multiple_choice' || q.type === 'checkbox') ? (
                <div>
                  {q.options.map(function(opt, oIdx) {
                    return (
                      <div key={oIdx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ width: 24, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(11,37,69,0.2)' }}>{q.type === 'multiple_choice' ? '\u25CB' : '\u25A1'}</span>
                        <input value={opt} onChange={function(e){updateOption(qIdx, oIdx, e.target.value)}} placeholder={'Option ' + (oIdx + 1)} style={Object.assign({}, inputStyle, { padding: '8px 12px', fontSize: 13 })} />
                        {q.options.length > 2 ? <button onClick={function(){removeOption(qIdx, oIdx)}} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, background: 'rgba(11,37,69,0.03)', cursor: 'pointer', fontSize: 11, color: 'rgba(11,37,69,0.25)' }}>{'\u2715'}</button> : null}
                      </div>
                    );
                  })}
                  <button onClick={function(){addOption(qIdx)}} style={{ fontSize: 12, fontWeight: 600, color: C.gold, border: 'none', background: 'none', cursor: 'pointer', marginTop: 4, padding: '4px 0' }}>+ Add Option</button>
                </div>
              ) : null}
            </div>
          );
        })}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
          {Object.entries(qTypes).map(function(entry) {
            var key = entry[0], val = entry[1];
            return (
              <button key={key} onClick={function(){addQuestion(key)}}
                style={{ padding: '12px 8px', borderRadius: 10, border: '2px dashed rgba(11,37,69,0.08)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
                <span style={{ fontSize: 20 }}>{val.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(11,37,69,0.35)' }}>{val.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={function(){handleSave('draft')}} disabled={saving}
          style={{ flex: 1, padding: 14, background: 'rgba(11,37,69,0.05)', color: 'rgba(11,37,69,0.5)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          {saving ? '...' : 'Save as Draft'}
        </button>
        <button onClick={function(){handleSave('active')}} disabled={saving}
          style={{ flex: 2, padding: 14, background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1, boxShadow: '0 4px 16px rgba(197,150,12,0.2)' }}>
          {saving ? 'Publishing...' : 'Publish Survey \u2192'}
        </button>
      </div>
    </div>
  );
}
