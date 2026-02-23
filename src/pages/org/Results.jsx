// src/pages/org/Results.jsx — Premium redesign
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadialBarChart, RadialBar,
} from 'recharts';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#2D9B5A' };
var PALETTE = ['#0B2545','#C5960C','#2D9B5A','#4A7FBD','#D15F3E','#6B5EA8','#5A8FA0','#E8A838'];
var font = 'Libre Baskerville, Georgia, serif';

function pct(n, t) { return t ? Math.round(n / t * 100) : 0; }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.3)', margin: '0 0 8px' }}>{label}</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: C.navy, margin: '0 0 4px', fontFamily: font, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 24, opacity: 0.15 }}>{icon}</span>}
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  var d = payload[0];
  return (
    <div style={{ background: C.navy, borderRadius: 10, padding: '10px 14px', border: 'none', boxShadow: '0 8px 24px rgba(11,37,69,0.2)' }}>
      <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{d.payload.fullName || d.payload.name}</p>
      <p style={{ color: C.gold, fontSize: 12, margin: 0 }}>{d.value} responses · {d.payload.pct}%</p>
    </div>
  );
}

// ── Multiple Choice Chart ─────────────────────────────────────────────────────
function MCChart({ question, answers }) {
  var opts = question.options || [];
  var total = answers.length || 1;
  var data = opts.map(function(opt, i) {
    var cnt = answers.filter(function(a) { return a === opt; }).length;
    return { name: opt.length > 24 ? opt.slice(0, 22) + '…' : opt, fullName: opt, count: cnt, pct: pct(cnt, total), fill: PALETTE[i % PALETTE.length] };
  });
  var maxCount = Math.max(...data.map(function(d) { return d.count; }), 1);

  return (
    <div>
      {/* Visual bars (custom, not recharts) */}
      <div style={{ display: 'grid', gap: 10 }}>
        {data.map(function(d, i) {
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: d.fill, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>{d.fullName}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: d.count > 0 ? C.navy : 'rgba(11,37,69,0.25)' }}>
                  {d.count > 0 ? d.count + ' (' + d.pct + '%)' : '—'}
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(11,37,69,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: d.fill,
                  width: (d.count / maxCount * 100) + '%',
                  opacity: d.count === 0 ? 0.15 : 1,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '12px 0 0', textAlign: 'right' }}>
        {answers.length} total response{answers.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ── Rating Chart ──────────────────────────────────────────────────────────────
function RatingChart({ answers, scale = 5 }) {
  var total = answers.length || 1;
  var avg = answers.length > 0
    ? (answers.reduce(function(s, a) { return s + Number(a); }, 0) / answers.length).toFixed(1)
    : null;
  var buckets = Array.from({ length: scale }, function(_, i) {
    var v = i + 1;
    var cnt = answers.filter(function(a) { return Number(a) === v; }).length;
    return { name: v + ' ★', value: v, count: cnt, pct: pct(cnt, total) };
  });

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Big average */}
      <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(197,150,12,0.05)', borderRadius: 16, border: '1px solid rgba(197,150,12,0.12)' }}>
        <p style={{ fontSize: 48, fontWeight: 800, color: C.gold, margin: 0, fontFamily: font, lineHeight: 1 }}>{avg || '—'}</p>
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: '4px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>avg / {scale}</p>
      </div>
      {/* Star breakdown */}
      <div style={{ flex: 1, minWidth: 200 }}>
        {[...buckets].reverse().map(function(b) {
          return (
            <div key={b.value} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', width: 28, textAlign: 'right', fontWeight: 600 }}>{b.value}★</span>
              <div style={{ flex: 1, height: 7, background: 'rgba(11,37,69,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,' + C.gold + ',' + C.green + ')', width: b.pct + '%', transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', width: 32, fontWeight: 600 }}>{b.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Yes/No Chart ──────────────────────────────────────────────────────────────
function YesNoChart({ answers }) {
  var yes = answers.filter(function(a) { return a === 'Yes' || a === true || a === 'true'; }).length;
  var no = answers.length - yes;
  var total = answers.length || 1;
  var data = [{ name: 'Yes', value: yes, fill: C.green }, { name: 'No', value: no, fill: C.red }];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ width: 130, height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {data.map(function(d, i) { return <Cell key={i} fill={d.fill} />; })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {data.map(function(d) {
          return (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1 }}>{pct(d.value, total)}%</p>
                <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '2px 0 0' }}>{d.name} · {d.value} votes</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Text Responses ────────────────────────────────────────────────────────────
function TextResponses({ answers }) {
  var [showAll, setShowAll] = useState(false);
  var visible = showAll ? answers : answers.slice(0, 5);
  if (!answers.length) return <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', fontStyle: 'italic' }}>No responses yet.</p>;
  return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {visible.map(function(a, i) {
          return (
            <div key={i} style={{ padding: '11px 14px', background: 'rgba(245,241,236,0.6)', borderRadius: 10, border: '1px solid rgba(11,37,69,0.06)', fontSize: 13, color: C.navy, lineHeight: 1.5, fontStyle: 'italic' }}>
              "{a}"
            </div>
          );
        })}
      </div>
      {answers.length > 5 && (
        <button onClick={function() { setShowAll(!showAll); }}
          style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
          {showAll ? '▲ Show less' : '▼ Show all ' + answers.length + ' responses'}
        </button>
      )}
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ question, idx, answers }) {
  var typeLabel = { multiple_choice: 'Multiple Choice', rating: 'Rating Scale', text: 'Open-ended', yes_no: 'Yes / No', checkbox: 'Checkbox' };
  var typeIcon  = { multiple_choice: '◉', rating: '★', text: '✏️', yes_no: '✓✗', checkbox: '☑' };
  var responded = answers.filter(function(a) { return a !== null && a !== undefined && a !== ''; }).length;

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(11,37,69,0.04)', animation: 'rfade 0.4s ease both', animationDelay: idx * 60 + 'ms' }}>
      {/* Question header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(11,37,69,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: C.navy, color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>Q{idx + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.3)' }}>
                {typeIcon[question.type] || '?'} {typeLabel[question.type] || question.type}
                {question.required && <span style={{ color: C.red, marginLeft: 6 }}>Required</span>}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1.4 }}>{question.text}</h3>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: responded > 0 ? C.navy : 'rgba(11,37,69,0.2)', margin: 0, fontFamily: font }}>{responded}</p>
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '2px 0 0', fontWeight: 600 }}>response{responded !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
      {/* Chart area */}
      <div style={{ padding: '18px 24px' }}>
        {question.type === 'multiple_choice' || question.type === 'checkbox' ? <MCChart question={question} answers={answers} /> : null}
        {question.type === 'rating' ? <RatingChart answers={answers} scale={question.scale || 5} /> : null}
        {question.type === 'yes_no' ? <YesNoChart answers={answers} /> : null}
        {question.type === 'text' ? <TextResponses answers={answers} /> : null}
        {!['multiple_choice','checkbox','rating','yes_no','text'].includes(question.type) && (
          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)' }}>Chart not available for this question type.</p>
        )}
      </div>
    </div>
  );
}

// ── Demographic Bar ───────────────────────────────────────────────────────────
function DemoBar({ label, value, total, color }) {
  var p = pct(value, total);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{p}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(11,37,69,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: p + '%', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Results() {
  var { id: surveyId } = useParams();
  var auth = useAuth(); var user = auth.user;
  var navigate = useNavigate();
  var [survey, setSurvey] = useState(null);
  var [responses, setResponses] = useState([]);
  var [respondents, setRespondents] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  useEffect(function() {
    if (!user || !surveyId) return;
    (async function() {
      try {
        var { data: sv, error: svErr } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
        if (svErr) throw new Error('Survey not found.');
        setSurvey(sv);

        var { data: resp } = await supabase.from('responses').select('*').eq('survey_id', surveyId);
        setResponses(resp || []);

        if (resp && resp.length > 0) {
          var ids = [...new Set((resp || []).map(function(r) { return r.user_id; }).filter(Boolean))];
          if (ids.length > 0) {
            var { data: users } = await supabase.from('users').select('id,date_of_birth,sex,race,education,employment,income,political_party,voter_registered,veteran_status,housing,state').in('id', ids);
            setRespondents(users || []);
          }
        }
      } catch(e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [user, surveyId]);

  function getAnswers(questionId, questionIdx) {
    return responses.map(function(r) {
      try {
        var ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
        if (Array.isArray(ans)) {
          // Try by index first, then by question_id match
          var byId = ans.find(function(a) { return a && a.question_id === questionId; });
          return byId ? byId.answer : ans[questionIdx];
        }
        return ans?.[questionIdx];
      } catch { return null; }
    }).filter(function(a) { return a !== null && a !== undefined && a !== ''; });
  }

  function exportCSV() {
    var questions = survey.questions || [];
    var headers = ['Response ID', 'Submitted', ...questions.map(function(q, i) { return 'Q' + (i+1) + ': ' + q.text; })];
    var rows = responses.map(function(r) {
      var ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers || [];
      return [r.id, r.created_at?.slice(0,10), ...questions.map(function(q, i) {
        var a = Array.isArray(ans) ? (ans.find(function(x) { return x?.question_id === q.id; })?.answer ?? ans[i]) : '';
        return JSON.stringify(a ?? '');
      })];
    });
    var csv = [headers, ...rows].map(function(row) {
      return row.map(function(c) { return '"' + String(c).replace(/"/g,'""') + '"'; }).join(',');
    }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = (survey.title || 'survey').replace(/\s+/g,'_') + '_results.csv';
    a.click();
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(197,150,12,0.2)', borderTopColor: C.gold, borderRadius: '50%', animation: 'rspin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: 0, fontFamily: 'DM Sans, sans-serif' }}>Loading results...</p>
        <style>{'@keyframes rspin{to{transform:rotate(360deg)}} @keyframes rfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <p style={{ color: 'rgba(11,37,69,0.5)', marginBottom: 12 }}>{error}</p>
      <button onClick={function() { navigate('/org/surveys'); }} style={{ fontSize: 13, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>← Back to My Surveys</button>
    </div>
  );

  var questions = survey?.questions || [];
  var respCount = responses.length;
  var target = survey?.target_responses || 0;
  var compPct = target > 0 ? Math.min(100, Math.round(respCount / target * 100)) : null;
  var avgTime = (function() {
    var times = responses.filter(function(r) { return r.duration_seconds; }).map(function(r) { return r.duration_seconds; });
    if (!times.length) return null;
    var avg = Math.round(times.reduce(function(a,b) { return a+b; }, 0) / times.length);
    return avg < 60 ? avg + 's' : Math.floor(avg/60) + 'm ' + (avg%60) + 's';
  })();

  // Demo data
  function buildDemo(key) {
    var counts = {};
    respondents.forEach(function(r) { var v = r[key] || 'Unknown'; counts[v] = (counts[v]||0)+1; });
    return Object.entries(counts).sort(function(a,b) { return b[1]-a[1]; }).slice(0,5).map(function(e) { return { name: e[0], value: e[1] }; });
  }
  var demoSections = [
    { title: 'Top States', data: buildDemo('state') },
    { title: 'Political Party', data: buildDemo('political_party') },
    { title: 'Sex', data: buildDemo('sex') },
  ].filter(function(s) { return s.data.length > 0; });

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 920 }}>
      <style>{'@keyframes rspin{to{transform:rotate(360deg)}} @keyframes rfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .rv-btn:hover{opacity:0.85!important;transform:translateY(-1px)!important}'}</style>

      {/* Back */}
      <button onClick={function() { navigate('/org/surveys'); }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(11,37,69,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: 'inherit', fontWeight: 600, transition: 'color 0.15s' }}>
        ← My Surveys
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 6px', fontFamily: font }}>{survey.title}</h1>
          {survey.description && <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.45)', margin: '0 0 4px', lineHeight: 1.5 }}>{survey.description}</p>}
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: 0 }}>Submitted {fmtDate(survey.created_at)}</p>
        </div>
        <button className="rv-btn" onClick={exportCSV} disabled={!respCount}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: respCount > 0 ? C.navy : 'rgba(11,37,69,0.1)', color: respCount > 0 ? '#fff' : 'rgba(11,37,69,0.3)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: respCount > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Responses" value={respCount.toLocaleString()} sub={target ? 'of ' + target.toLocaleString() + ' target' : 'No target set'} accent={C.gold} icon="👥" />
        <StatCard label="Completion" value={compPct != null ? compPct + '%' : '—'} sub={compPct != null ? (compPct >= 100 ? '✓ Goal reached' : 'In progress') : 'No target'} accent={compPct >= 100 ? C.green : C.gold} icon="🎯" />
        <StatCard label="Questions" value={questions.length} sub={questions.length + ' question' + (questions.length !== 1 ? 's' : '')} accent={C.navy} icon="📋" />
        <StatCard label="Avg. Time" value={avgTime || '—'} sub={avgTime ? 'per response' : 'Not tracked'} accent="#6366f1" icon="⏱" />
      </div>

      {/* Progress section */}
      {target > 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(11,37,69,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.navy, margin: '0 0 2px' }}>Response Progress</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>
                {respCount.toLocaleString()} collected · {(target - respCount).toLocaleString()} remaining
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: compPct >= 100 ? C.green : C.gold, margin: 0, fontFamily: font }}>{compPct}%</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 10, background: 'rgba(11,37,69,0.05)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 5, background: compPct >= 100 ? 'linear-gradient(90deg,' + C.green + ',' + C.gold + ')' : 'linear-gradient(90deg,' + C.gold + ',#E8A838)', width: compPct + '%', transition: 'width 1s ease', boxShadow: compPct > 0 ? '0 0 12px rgba(197,150,12,0.4)' : 'none' }} />
          </div>
          {compPct >= 100 && (
            <p style={{ fontSize: 12, color: C.green, fontWeight: 700, margin: '8px 0 0' }}>✓ Survey target has been reached!</p>
          )}
        </div>
      )}

      {/* No responses empty state */}
      {respCount === 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', padding: '56px 32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.navy, margin: '0 0 8px', fontFamily: font }}>No responses yet</p>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>
            {survey.status === 'pending_review'
              ? 'Your survey is awaiting admin review before going live.'
              : 'Results will appear here as citizens complete your survey.'}
          </p>
        </div>
      )}

      {/* Question results */}
      {respCount > 0 && questions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>Question Breakdown</h2>
            <span style={{ padding: '3px 10px', background: 'rgba(11,37,69,0.06)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'rgba(11,37,69,0.4)' }}>{questions.length} questions</span>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {questions.map(function(q, i) {
              return <QuestionCard key={q.id || i} question={q} idx={i} answers={getAnswers(q.id, i)} />;
            })}
          </div>
        </div>
      )}

      {/* Demographics */}
      {demoSections.length > 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: '0 0 16px', fontFamily: font }}>Respondent Demographics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {demoSections.map(function(sec) {
              return (
                <div key={sec.title} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.3)', margin: '0 0 14px' }}>{sec.title}</p>
                  {sec.data.map(function(d, i) {
                    return <DemoBar key={d.name} label={d.name} value={d.value} total={respondents.length} color={PALETTE[i]} />;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
