// src/pages/admin/Analytics.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#C5960C', '#0B2545', '#B8352E', '#22863A', '#7c3aed', '#0891b2', '#c2410c', '#4f46e5'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B2545] text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-medium opacity-60 mb-0.5">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>{e.name}: <span className="font-bold text-white">{e.value.toLocaleString()}</span></p>
      ))}
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-[#0B2545]/5 p-5 ${className}`}>
      <h3 className="font-semibold text-[#0B2545] mb-4" style={{ fontFamily: 'Libre Baskerville, serif' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState({
    stateBreakdown: [], ageBreakdown: [], verificationTrend: [],
    surveyCompletion: [], responsesByWeek: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    try {
      const [{ data: users }, { data: surveys }, { data: responses }] = await Promise.all([
        supabase.from('users').select('state, age_range, is_verified, created_at, role').eq('role', 'citizen'),
        supabase.from('surveys').select('id, title, status, target_responses, response_count, created_at'),
        supabase.from('responses').select('survey_id, created_at'),
      ]);

      // State breakdown
      const stateMap = {};
      (users || []).forEach((u) => { if (u.state) stateMap[u.state] = (stateMap[u.state] || 0) + 1; });
      const stateBreakdown = Object.entries(stateMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([state, count]) => ({ state, count }));

      // Age breakdown
      const ageMap = {};
      (users || []).forEach((u) => { if (u.age_range) ageMap[u.age_range] = (ageMap[u.age_range] || 0) + 1; });
      const ageBreakdown = Object.entries(ageMap).map(([range, count]) => ({ range, count }));

      // Verification trend (by week)
      const vWeeks = {};
      (users || []).forEach((u) => {
        const d = new Date(u.created_at);
        const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
        const k = ws.toISOString().split('T')[0];
        if (!vWeeks[k]) vWeeks[k] = { total: 0, verified: 0 };
        vWeeks[k].total++;
        if (u.is_verified) vWeeks[k].verified++;
      });
      const verificationTrend = Object.entries(vWeeks).slice(-12).map(([w, v]) => ({
        week: new Date(w).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: v.total,
        verified: v.verified,
        rate: v.total > 0 ? Math.round((v.verified / v.total) * 100) : 0,
      }));

      // Survey completion rates
      const surveyCompletion = (surveys || [])
        .filter((s) => s.status === 'active' || s.status === 'closed')
        .slice(0, 8)
        .map((s) => ({
          title: s.title?.length > 25 ? s.title.slice(0, 25) + '…' : s.title,
          responses: s.response_count || 0,
          target: s.target_responses || 0,
          pct: s.target_responses ? Math.round(((s.response_count || 0) / s.target_responses) * 100) : 0,
        }));

      // Responses by week
      const rWeeks = {};
      (responses || []).forEach((r) => {
        const d = new Date(r.created_at);
        const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
        const k = ws.toISOString().split('T')[0];
        rWeeks[k] = (rWeeks[k] || 0) + 1;
      });
      const responsesByWeek = Object.entries(rWeeks).slice(-12).map(([w, c]) => ({
        week: new Date(w).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        responses: c,
      }));

      setData({ stateBreakdown, ageBreakdown, verificationTrend, surveyCompletion, responsesByWeek });
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Analytics</h1>
        <p className="text-sm text-[#0B2545]/40 mt-1">Platform demographics, trends, and engagement data</p>
      </div>

      {/* Row 1: Responses trend + verification trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Weekly Responses">
          {data.responsesByWeek.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.responsesByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0B254508" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="responses" fill="#C5960C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-[#0B2545]/25 text-center py-16">No response data yet</p>}
        </Card>

        <Card title="Verification Trend">
          {data.verificationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.verificationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0B254508" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="total" stroke="#0B2545" strokeWidth={2} dot={false} name="Signups" />
                <Line type="monotone" dataKey="verified" stroke="#22863A" strokeWidth={2} dot={false} name="Verified" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-[#0B2545]/25 text-center py-16">No data yet</p>}
        </Card>
      </div>

      {/* Row 2: Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Citizens by State (Top 10)">
          {data.stateBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.stateBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#0B254508" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 11, fill: '#0B254570' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#0B2545" radius={[0, 4, 4, 0]} name="Citizens" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-[#0B2545]/25 text-center py-16">No state data — citizens need to set their state</p>}
        </Card>

        <Card title="Age Distribution">
          {data.ageBreakdown.length > 0 ? (
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie data={data.ageBreakdown} cx={80} cy={80} outerRadius={70} innerRadius={40} dataKey="count" paddingAngle={2}>
                  {data.ageBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
              <div className="space-y-2">
                {data.ageBreakdown.map((d, i) => (
                  <div key={d.range} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[#0B2545]/50">{d.range}</span>
                    <span className="font-bold text-[#0B2545]/70 ml-auto">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-[#0B2545]/25 text-center py-16">No age data yet</p>}
        </Card>
      </div>

      {/* Row 3: Survey Completion */}
      <Card title="Survey Completion Rates">
        {data.surveyCompletion.length > 0 ? (
          <div className="space-y-3">
            {data.surveyCompletion.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#0B2545]/60 font-medium">{s.title}</span>
                  <span className="text-[#0B2545]/35 tabular-nums">
                    {s.responses.toLocaleString()}{s.target > 0 && ` / ${s.target.toLocaleString()}`}
                    {s.target > 0 && <span className="ml-1 font-semibold text-[#0B2545]/50">({s.pct}%)</span>}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#0B2545]/[0.04] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(s.pct || 10, 100)}%`,
                      background: `linear-gradient(90deg, #C5960C, ${s.pct >= 100 ? '#22863A' : '#C5960C99'})`,
                    }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-[#0B2545]/25 text-center py-8">No survey data yet</p>}
      </Card>
    </div>
  );
}
