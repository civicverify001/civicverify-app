// src/pages/org/Results.jsx — Polished
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#C5960C', '#0B2545', '#22863A', '#6366f1', '#B8352E', '#ec4899', '#14b8a6', '#f59e0b'];

export default function OrgResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('surveys').select('*').eq('id', id).single(),
      supabase.from('responses').select('*').eq('survey_id', id),
    ]).then(([{ data: s }, { data: r }]) => {
      setSurvey(s);
      setResponses(r || []);
      setLoading(false);
    });
  }, [id]);

  function getChartData(q) {
    if (q.type === 'multiple_choice' || q.type === 'checkbox') {
      const counts = {};
      (q.options || []).forEach(o => counts[o] = 0);
      responses.forEach(r => {
        const a = r.answers?.[q.id];
        if (Array.isArray(a)) a.forEach(v => counts[v] = (counts[v] || 0) + 1);
        else if (a) counts[a] = (counts[a] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }
    if (q.type === 'rating') {
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      responses.forEach(r => { const a = r.answers?.[q.id]; if (a) counts[a] = (counts[a] || 0) + 1; });
      return Object.entries(counts).map(([rating, count]) => ({ rating, count }));
    }
    return null;
  }

  function exportCSV() {
    if (!survey || !responses.length) return;
    const qs = survey.questions || [];
    const headers = ['Response ID', 'Submitted At', ...qs.map(q => q.text)];
    const rows = responses.map(r => [r.id, new Date(r.created_at).toLocaleString(), ...qs.map(q => { const a = r.answers?.[q.id]; return Array.isArray(a) ? a.join('; ') : String(a || ''); })]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${survey.title}_results.csv`; a.click();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!survey) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mx-auto mb-5">⚠️</div>
      <p className="text-lg font-semibold text-[#0B2545]/30">Survey not found</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/org/surveys')} className="text-sm text-[#0B2545]/30 hover:text-[#0B2545]/60 transition-colors mb-2 flex items-center gap-1">← Back to My Surveys</button>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">{responses.length} responses</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#0B2545]">{responses.length}</p>
          <p className="text-[11px] text-[#0B2545]/30 font-semibold mt-1">Total Responses</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#0B2545]">{(survey.questions || []).length}</p>
          <p className="text-[11px] text-[#0B2545]/30 font-semibold mt-1">Questions</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-[#0B2545]">
            {survey.target_responses ? `${Math.round((responses.length / survey.target_responses) * 100)}%` : '—'}
          </p>
          <p className="text-[11px] text-[#0B2545]/30 font-semibold mt-1">Completion Rate</p>
        </div>
      </div>

      {/* Question Results */}
      {(survey.questions || []).map((q, i) => {
        const chartData = getChartData(q);
        return (
          <div key={q.id || i} className="bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#0B2545]/[0.04] bg-[#0B2545]/[0.01]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#C5960C]/10 text-[#C5960C] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <h3 className="text-sm font-bold text-[#0B2545]">{q.text}</h3>
              </div>
            </div>
            <div className="p-6">
              {chartData && (q.type === 'multiple_choice' || q.type === 'checkbox') && (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#0B254560' }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {chartData.map((_, j) => <Cell key={j} fill={CHART_COLORS[j % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {chartData && q.type === 'rating' && (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="rating" tick={{ fontSize: 12, fill: '#0B254560' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="count" fill="#C5960C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {q.type === 'text' && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {responses.filter(r => r.answers?.[q.id]).length > 0 ? responses.filter(r => r.answers?.[q.id]).map((r, j) => (
                    <div key={j} className="p-3 rounded-xl bg-[#0B2545]/[0.02] text-sm text-[#0B2545]/60 leading-relaxed">
                      "{r.answers[q.id]}"
                    </div>
                  )) : (
                    <p className="text-sm text-[#0B2545]/25 text-center py-6">No text responses yet</p>
                  )}
                </div>
              )}
              {!chartData && q.type !== 'text' && (
                <p className="text-sm text-[#0B2545]/25 text-center py-6">No responses for this question yet</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
