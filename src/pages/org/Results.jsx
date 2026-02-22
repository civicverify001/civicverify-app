// src/pages/org/Results.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#C5960C', '#0B2545', '#22863A', '#B8352E', '#7c3aed', '#0891b2', '#c2410c', '#4f46e5'];
const LIKERT_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B2545] text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-medium opacity-60 mb-0.5">{label}</p>
      {payload.map((e, i) => <p key={i}>{e.name}: <span className="font-bold">{e.value}</span></p>)}
    </div>
  );
}

function downloadCSV(data, filename) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    try {
      const [{ data: surveyData }, { data: respData }] = await Promise.all([
        supabase.from('surveys').select('*').eq('id', id).single(),
        supabase.from('responses').select('*, users(state, age_range)').eq('survey_id', id),
      ]);
      setSurvey(surveyData);
      setResponses(respData || []);
      setRespondents((respData || []).map((r) => r.users).filter(Boolean));
    } catch (err) {
      console.error('Results error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getQuestionData(q) {
    const answers = responses.map((r) => r.answers?.[q.id]).filter((a) => a !== undefined && a !== null);

    if (q.type === 'likert') {
      const counts = [0, 0, 0, 0, 0];
      answers.forEach((a) => { if (a >= 1 && a <= 5) counts[a - 1]++; });
      const avg = answers.length > 0 ? (answers.reduce((s, a) => s + a, 0) / answers.length).toFixed(2) : '—';
      return {
        chartData: (q.labels || LIKERT_LABELS).map((l, i) => ({ label: l, count: counts[i], value: i + 1 })),
        avg,
        total: answers.length,
      };
    }

    if (q.type === 'multiple_choice') {
      const counts = {};
      answers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
      return {
        chartData: (q.options || []).map((o) => ({ label: o, count: counts[o] || 0 })),
        total: answers.length,
      };
    }

    if (q.type === 'yes_no') {
      const yes = answers.filter((a) => a === 'Yes').length;
      const no = answers.filter((a) => a === 'No').length;
      return {
        chartData: [{ label: 'Yes', count: yes }, { label: 'No', count: no }],
        total: answers.length,
        yesPct: answers.length > 0 ? Math.round((yes / answers.length) * 100) : 0,
      };
    }

    if (q.type === 'text') {
      return { textResponses: answers, total: answers.length };
    }

    return { total: 0 };
  }

  function handleExportCSV() {
    const rows = responses.map((r) => {
      const flat = { response_id: r.id, submitted_at: r.submitted_at };
      (survey?.questions || []).forEach((q, i) => {
        flat[`Q${i + 1}_${q.text?.slice(0, 30)}`] = r.answers?.[q.id] ?? '';
      });
      if (r.users) { flat.state = r.users.state; flat.age_range = r.users.age_range; }
      return flat;
    });
    downloadCSV(rows, `${survey?.title?.replace(/\s+/g, '_') || 'survey'}_results.csv`);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  if (!survey) return (
    <div className="text-center py-16">
      <p className="text-sm text-[#0B2545]/35">Survey not found</p>
      <button onClick={() => navigate('/org/surveys')} className="text-sm font-semibold text-[#C5960C] mt-2 hover:underline">← Back</button>
    </div>
  );

  const questions = survey.questions || [];
  const pct = survey.target_responses ? Math.round((responses.length / survey.target_responses) * 100) : null;

  // Demographics breakdown
  const stateMap = {};
  const ageMap = {};
  respondents.forEach((u) => {
    if (u.state) stateMap[u.state] = (stateMap[u.state] || 0) + 1;
    if (u.age_range) ageMap[u.age_range] = (ageMap[u.age_range] || 0) + 1;
  });
  const stateDist = Object.entries(stateMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, c]) => ({ state: s, count: c }));
  const ageDist = Object.entries(ageMap).map(([a, c]) => ({ range: a, count: c }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/org/surveys')} className="text-sm text-[#0B2545]/35 hover:text-[#0B2545] mb-2 transition-colors">← Back to My Surveys</button>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h1>
          {survey.description && <p className="text-sm text-[#0B2545]/40 mt-1">{survey.description}</p>}
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2545] hover:bg-[#0B2545]/90 text-white text-sm font-semibold rounded-lg transition-colors self-start shrink-0">
          ⬇ Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Responses', value: responses.length },
          { label: 'Target', value: survey.target_responses?.toLocaleString() || '—' },
          { label: 'Completion', value: pct !== null ? `${pct}%` : '—' },
          { label: 'Questions', value: questions.length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#0B2545]/5 p-4 text-center">
            <p className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{s.value}</p>
            <p className="text-[10px] text-[#0B2545]/30 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-question results */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider">Per-Question Results</h2>
        {questions.map((q, i) => {
          const result = getQuestionData(q);
          return (
            <div key={q.id} className="bg-white rounded-xl border border-[#0B2545]/5 p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-[#0B2545]">
                  <span className="text-[#0B2545]/20 mr-1.5">Q{i + 1}.</span>
                  {q.text}
                </p>
                <span className="text-[10px] text-[#0B2545]/25 shrink-0 ml-3">{result.total} responses</span>
              </div>

              {/* Likert */}
              {q.type === 'likert' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-[#0B2545]/30">Average:</span>
                    <span className="text-lg font-bold text-[#C5960C]">{result.avg}</span>
                    <span className="text-xs text-[#0B2545]/20">/ 5</span>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0B254508" />
                      <XAxis dataKey="value" tick={{ fontSize: 11, fill: '#0B254550' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" fill="#C5960C" radius={[4, 4, 0, 0]} name="Responses" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-[9px] text-[#0B2545]/25 mt-1 px-2">
                    {result.chartData.map((d) => <span key={d.label} className="text-center flex-1">{d.label}</span>)}
                  </div>
                </div>
              )}

              {/* Multiple Choice */}
              {q.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {result.chartData.map((d, j) => {
                    const barPct = result.total > 0 ? Math.round((d.count / result.total) * 100) : 0;
                    return (
                      <div key={j}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#0B2545]/60">{d.label}</span>
                          <span className="text-[#0B2545]/35 tabular-nums">{d.count} ({barPct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#0B2545]/[0.04] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: COLORS[j % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Yes/No */}
              {q.type === 'yes_no' && (
                <div className="flex items-center gap-6">
                  <PieChart width={100} height={100}>
                    <Pie data={result.chartData} cx={50} cy={50} innerRadius={30} outerRadius={45} dataKey="count" paddingAngle={3}>
                      <Cell fill="#22863A" /><Cell fill="#B8352E" />
                    </Pie>
                  </PieChart>
                  <div className="space-y-2">
                    {result.chartData.map((d, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: j === 0 ? '#22863A' : '#B8352E' }} />
                        <span className="text-[#0B2545]/60">{d.label}: <strong>{d.count}</strong></span>
                        <span className="text-[#0B2545]/25">({result.total > 0 ? Math.round((d.count / result.total) * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text responses */}
              {q.type === 'text' && result.textResponses && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.textResponses.map((t, j) => (
                    <div key={j} className="px-3 py-2 bg-[#F5F1EC]/30 rounded-lg text-sm text-[#0B2545]/60 border border-[#0B2545]/5">
                      "{t}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Demographics */}
      {(stateDist.length > 0 || ageDist.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stateDist.length > 0 && (
            <div className="bg-white rounded-xl border border-[#0B2545]/5 p-5">
              <h3 className="font-semibold text-[#0B2545] mb-4" style={{ fontFamily: 'Libre Baskerville, serif' }}>Respondents by State</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stateDist} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="state" type="category" tick={{ fontSize: 11, fill: '#0B254570' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#0B2545" radius={[0, 4, 4, 0]} name="Respondents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {ageDist.length > 0 && (
            <div className="bg-white rounded-xl border border-[#0B2545]/5 p-5">
              <h3 className="font-semibold text-[#0B2545] mb-4" style={{ fontFamily: 'Libre Baskerville, serif' }}>Respondents by Age</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ageDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B254508" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#C5960C" radius={[4, 4, 0, 0]} name="Respondents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
