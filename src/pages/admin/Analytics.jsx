// src/pages/admin/Analytics.jsx — Polished
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const GOLD = '#C5960C';
const NAVY = '#0B2545';
const CHART_COLORS = ['#C5960C', '#0B2545', '#22863A', '#6366f1', '#B8352E', '#ec4899', '#14b8a6', '#f59e0b'];

function ChartCard({ title, children, span = 1 }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden shadow-sm ${span === 2 ? 'lg:col-span-2' : ''}`}>
      <div className="px-6 py-4 border-b border-[#0B2545]/[0.04]">
        <h3 className="text-sm font-bold text-[#0B2545]">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyChart({ icon, message }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#0B2545]/[0.03] flex items-center justify-center text-xl mb-3">{icon}</div>
      <p className="text-sm text-[#0B2545]/25">{message}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [users, setUsers] = useState([]);
  const [responses, setResponses] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('*'),
      supabase.from('responses').select('*'),
      supabase.from('surveys').select('*'),
    ]).then(([u, r, s]) => {
      setUsers(u.data || []);
      setResponses(r.data || []);
      setSurveys(s.data || []);
      setLoading(false);
    });
  }, []);

  // Weekly responses
  const weeklyData = (() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - i * 7);
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const count = responses.filter(r => { const d = new Date(r.created_at); return d >= start && d < end; }).length;
      weeks.push({ week: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), responses: count });
    }
    return weeks;
  })();

  // Verification trend
  const verificationData = (() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7);
      const signups = users.filter(u => new Date(u.created_at) <= d).length;
      const verified = users.filter(u => u.is_verified && new Date(u.created_at) <= d).length;
      weeks.push({ week: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Signups: signups, Verified: verified });
    }
    return weeks;
  })();

  // State distribution
  const stateData = (() => {
    const map = {};
    users.forEach(u => { if (u.state) map[u.state] = (map[u.state] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([state, count]) => ({ state, count }));
  })();

  // Age distribution
  const ageData = (() => {
    const buckets = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 };
    users.forEach(u => {
      if (!u.date_of_birth) return;
      const age = Math.floor((Date.now() - new Date(u.date_of_birth)) / 31557600000);
      if (age < 25) buckets['18-24']++;
      else if (age < 35) buckets['25-34']++;
      else if (age < 45) buckets['35-44']++;
      else if (age < 55) buckets['45-54']++;
      else if (age < 65) buckets['55-64']++;
      else buckets['65+']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  })();

  // Survey completion
  const completionData = surveys.filter(s => s.target_responses).map(s => ({
    name: (s.title || '').substring(0, 20),
    target: s.target_responses,
    actual: s.response_count || 0,
  }));

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Analytics</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">Platform demographics, trends, and engagement data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Weekly Responses">
          {responses.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}><XAxis dataKey="week" tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} /><Bar dataKey="responses" fill={GOLD} radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart icon="📊" message="No response data yet" />}
        </ChartCard>

        <ChartCard title="Verification Trend">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={verificationData}><XAxis dataKey="week" tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} /><Line type="monotone" dataKey="Signups" stroke={NAVY} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: NAVY }} /><Line type="monotone" dataKey="Verified" stroke="#22863A" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 0, fill: '#22863A' }} /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <span className="flex items-center gap-2 text-xs text-[#0B2545]/40"><span className="w-3 h-1 rounded bg-[#0B2545]" /> Signups</span>
            <span className="flex items-center gap-2 text-xs text-[#0B2545]/40"><span className="w-3 h-1 rounded bg-[#22863A]" /> Verified</span>
          </div>
        </ChartCard>

        <ChartCard title="Citizens by State (Top 10)">
          {stateData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} layout="vertical"><XAxis type="number" tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: '#0B254560' }} axisLine={false} tickLine={false} width={80} /><Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} /><Bar dataKey="count" fill={NAVY} radius={[0, 6, 6, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart icon="📍" message="No state data — citizens need to set their state" />}
        </ChartCard>

        <ChartCard title="Age Distribution">
          {ageData.some(d => d.count > 0) ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}><XAxis dataKey="range" tick={{ fontSize: 11, fill: '#0B254540' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} /><Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart icon="🎂" message="No age data yet" />}
        </ChartCard>

        <ChartCard title="Survey Completion Rates" span={2}>
          {completionData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#0B254540' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: '#0B254530' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} /><Bar dataKey="target" fill="#E5E7EB" radius={[6, 6, 0, 0]} /><Bar dataKey="actual" fill={GOLD} radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyChart icon="📈" message="No survey data yet" />}
        </ChartCard>
      </div>
    </div>
  );
}
