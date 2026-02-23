// src/pages/org/Results.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const NAVY = '#0B2545';
const GOLD = '#C5960C';
const RED = '#B8352E';
const GREEN = '#2D9B5A';
const PALETTE = ['#0B2545','#C5960C','#2D9B5A','#4A7FBD','#D15F3E','#6B5EA8','#5A8FA0','#E8A838'];
const SERIF = 'Libre Baskerville, Georgia, serif';

function pct(n, t) { return t ? Math.round(n / t * 100) : 0; }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.3)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, color: NAVY, margin: '0 0 4px', fontFamily: SERIF, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function MCChart({ question, answers }) {
  const opts = question.options || [];
  const total = answers.length || 1;
  const data = opts.map((opt, i) => {
    const cnt = answers.filter(a => a === opt).length;
    return { name: opt, count: cnt, p: pct(cnt, total), fill: PALETTE[i % PALETTE.length] };
  });
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.fill, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>{d.name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: d.count > 0 ? NAVY : 'rgba(11,37,69,0.25)' }}>
              {d.count > 0 ? `${d.count} (${d.p}%)` : '—'}
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(11,37,69,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: d.fill, width: `${(d.count / maxCount * 100)}%`, opacity: d.count === 0 ? 0.15 : 1, transition: 'width 0.8s ease' }} />
          </div>
        </div>
      ))}
      <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0', textAlign: 'right' }}>
        {answers.length} total response{answers.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function RatingChart({ answers, scale = 5 }) {
  const total = answers.length || 1;
  const avg = answers.length > 0
    ? (answers.reduce((s, a) => s + Number(a), 0) / answers.length).toFixed(1)
    : null;
  const buckets = [];
  for (let v = scale; v >= 1; v--) {
    const cnt = answers.filter(a => Number(a) === v).length;
    buckets.push({ value: v, count: cnt, p: pct(cnt, total) });
  }
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(197,150,12,0.05)', borderRadius: 16, border: '1px solid rgba(197,150,12,0.12)' }}>
        <p style={{ fontSize: 48, fontWeight: 800, color: GOLD, margin: 0, fontFamily: SERIF, lineHeight: 1 }}>{avg || '—'}</p>
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: '4px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>avg / {scale}</p>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        {buckets.map(b => (
          <div key={b.value} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', width: 28, textAlign: 'right', fontWeight: 600 }}>{b.value}★</span>
            <div style={{ flex: 1, height: 7, background: 'rgba(11,37,69,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${GOLD},${GREEN})`, width: `${b.p}%`, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', width: 32, fontWeight: 600 }}>{b.p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YesNoChart({ answers }) {
  const yes = answers.filter(a => a === 'Yes' || a === true || a === 'true').length;
  const no = answers.length - yes;
  const total = answers.length || 1;
  const data = [{ name: 'Yes', value: yes, fill: GREEN }, { name: 'No', value: no, fill: RED }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ width: 130, height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, fontFamily: SERIF, lineHeight: 1 }}>{pct(d.value, total)}%</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '2px 0 0' }}>{d.name} · {d.value} votes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextResponses({ answers }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? answers : answers.slice(0, 5);
  if (!answers.length) return <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', fontStyle: 'italic' }}>No responses yet.</p>;
  return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {visible.map((a, i) => (
          <div key={i} style={{ padding: '11px 14px', background: 'rgba(245,241,236,0.6)', borderRadius: 10, border: '1px solid rgba(11,37,69,0.06)', fontSize: 13, color: NAVY, lineHeight: 1.5, fontStyle: 'italic' }}>
            "{a}"
          </div>
        ))}
      </div>
      {answers.length > 5 && (
        <button onClick={() => setShowAll(!showAll)}
          style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
          {showAll ? 'Show less' : `Show all ${answers.length} responses`}
        </button>
      )}
    </div>
  );
}

function QuestionCard({ question, idx, answers }) {
  const typeLabel = { multiple_choice: 'Multiple Choice', rating: 'Rating Scale', text: 'Open-ended', yes_no: 'Yes / No', checkbox: 'Checkbox' };
  const responded = answers.filter(a => a !== null && a !== undefined && a !== '').length;
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(11,37,69,0.04)', animation: 'rfade 0.4s ease both', animationDelay: `${idx * 60}ms` }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(11,37,69,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: NAVY, color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>Q{idx + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.3)' }}>
                {typeLabel[question.type] || question.type}
                {question.required && <span style={{ color: RED, marginLeft: 6 }}>Required</span>}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0, fontFamily: SERIF, lineHeight: 1.4 }}>{question.text}</h3>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: responded > 0 ? NAVY : 'rgba(11,37,69,0.2)', margin: 0, fontFamily: SERIF }}>{responded}</p>
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '2px 0 0', fontWeight: 600 }}>response{responded !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '18px 24px' }}>
        {(question.type === 'multiple_choice' || question.type === 'checkbox') && <MCChart question={question} answers={answers} />}
        {question.type === 'rating' && <RatingChart answers={answers} scale={question.scale || 5} />}
        {question.type === 'yes_no' && <YesNoChart answers={answers} />}
        {question.type === 'text' && <TextResponses answers={answers} />}
      </div>
    </div>
  );
}

function DemoBar({ label, value, total, color }) {
  const p = pct(value, total);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{p}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(11,37,69,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${p}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function Results() {
  const { id: surveyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !surveyId) return;
    (async () => {
      try {
        const { data: sv, error: svErr } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
        if (svErr) throw new Error('Survey not found.');
        setSurvey(sv);
        const { data: resp } = await supabase.from('responses').select('*').eq('survey_id', surveyId);
        setResponses(resp || []);
        if (resp && resp.length > 0) {
          const ids = [...new Set(resp.map(r => r.user_id).filter(Boolean))];
          if (ids.length > 0) {
            const { data: users } = await supabase
              .from('users')
              .select('id,date_of_birth,sex,race,education,employment,income,political_party,voter_registered,veteran_status,housing,state')
              .in('id', ids);
            setRespondents(users || []);
          }
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, [user, surveyId]);

  function getAnswers(questionId, questionIdx) {
    return responses.map(r => {
      try {
        const ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
        if (Array.isArray(ans)) {
          const byId = ans.find(a => a && a.question_id === questionId);
          return byId ? byId.answer : ans[questionIdx];
        }
        return ans?.[questionIdx];
      } catch { return null; }
    }).filter(a => a !== null && a !== undefined && a !== '');
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(197,150,12,0.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'rspin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', margin: 0 }}>Loading results...</p>
        <style>{'@keyframes rspin{to{transform:rotate(360deg)}} @keyframes rfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '48px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <p style={{ color: 'rgba(11,37,69,0.5)', marginBottom: 12 }}>{error}</p>
      <button onClick={() => navigate('/org/surveys')}
        style={{ fontSize: 13, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Back to My Surveys
      </button>
    </div>
  );

  const questions = survey?.questions || [];
  const respCount = responses.length;
  const target = survey?.target_responses || 0;
  const compPct = target > 0 ? Math.min(100, Math.round(respCount / target * 100)) : null;
  const avgTime = (() => {
    const times = responses.filter(r => r.duration_seconds).map(r => r.duration_seconds);
    if (!times.length) return null;
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    return avg < 60 ? `${avg}s` : `${Math.floor(avg / 60)}m ${avg % 60}s`;
  })();

  function buildDemo(key) {
    const counts = {};
    respondents.forEach(r => { const v = r[key] || 'Unknown'; counts[v] = (counts[v] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }
  const demoSecs = [
    { title: 'Top States', data: buildDemo('state') },
    { title: 'Political Party', data: buildDemo('political_party') },
    { title: 'Sex', data: buildDemo('sex') },
  ].filter(s => s.data.length > 0);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 920 }}>
      <style>{'@keyframes rspin{to{transform:rotate(360deg)}} @keyframes rfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>

      {/* Back link */}
      <button onClick={() => navigate('/org/surveys')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(11,37,69,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: 'inherit', fontWeight: 600 }}>
        &larr; My Surveys
      </button>

      {/* Title — no download button */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 6px', fontFamily: SERIF }}>{survey.title}</h1>
        {survey.description && (
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.45)', margin: '0 0 4px', lineHeight: 1.5 }}>{survey.description}</p>
        )}
        <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: 0 }}>Submitted {fmtDate(survey.created_at)}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total Responses"
          value={respCount.toLocaleString()}
          sub={target ? `of ${target.toLocaleString()} target` : 'No target set'}
          accent={GOLD}
        />
        <StatCard
          label="Completion"
          value={compPct != null ? `${compPct}%` : '—'}
          sub={compPct != null ? (compPct >= 100 ? 'Goal reached' : 'In progress') : 'No target'}
          accent={compPct >= 100 ? GREEN : GOLD}
        />
        <StatCard
          label="Questions"
          value={questions.length}
          sub={`${questions.length} question${questions.length !== 1 ? 's' : ''}`}
          accent={NAVY}
        />
        <StatCard
          label="Avg. Time"
          value={avgTime || '—'}
          sub={avgTime ? 'per response' : 'Not tracked'}
          accent="#6366f1"
        />
      </div>

      {/* Progress bar */}
      {target > 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(11,37,69,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 2px' }}>Response Progress</p>
              <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>
                {respCount.toLocaleString()} collected &middot; {Math.max(0, target - respCount).toLocaleString()} remaining
              </p>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: compPct >= 100 ? GREEN : GOLD, margin: 0, fontFamily: SERIF }}>{compPct}%</p>
          </div>
          <div style={{ width: '100%', height: 10, background: 'rgba(11,37,69,0.05)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              background: compPct >= 100 ? `linear-gradient(90deg,${GREEN},${GOLD})` : `linear-gradient(90deg,${GOLD},#E8A838)`,
              width: `${compPct}%`, transition: 'width 1s ease',
              boxShadow: compPct > 0 ? '0 0 12px rgba(197,150,12,0.4)' : 'none'
            }} />
          </div>
          {compPct >= 100 && (
            <p style={{ fontSize: 12, color: GREEN, fontWeight: 700, margin: '8px 0 0' }}>Survey target has been reached!</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {respCount === 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', padding: '56px 32px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#128202;</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 8px', fontFamily: SERIF }}>No responses yet</p>
          <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.4)', margin: 0 }}>
            {survey.status === 'pending_review'
              ? 'Your survey is awaiting admin review before going live.'
              : 'Results will appear here as citizens complete your survey.'}
          </p>
        </div>
      )}

      {/* Question breakdown */}
      {respCount > 0 && questions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0, fontFamily: SERIF }}>Question Breakdown</h2>
            <span style={{ padding: '3px 10px', background: 'rgba(11,37,69,0.06)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'rgba(11,37,69,0.4)' }}>
              {questions.length} questions
            </span>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {questions.map((q, i) => (
              <QuestionCard key={q.id || i} question={q} idx={i} answers={getAnswers(q.id, i)} />
            ))}
          </div>
        </div>
      )}

      {/* Demographics */}
      {demoSecs.length > 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: '0 0 16px', fontFamily: SERIF }}>
            Respondent Demographics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {demoSecs.map(sec => (
              <div key={sec.title} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.3)', margin: '0 0 14px' }}>{sec.title}</p>
                {sec.data.map((d, i) => (
                  <DemoBar key={d.name} label={d.name} value={d.value} total={respondents.length} color={PALETTE[i]} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
