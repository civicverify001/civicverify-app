// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const C = { navy: '#0B2545', gold: '#C5960C', red: '#B8352E', green: '#22863A', cream: '#F5F1EC' };

function StatCard({ label, value, change, icon, color = C.gold }) {
  const up = change >= 0;
  return (
    <div className="bg-white rounded-xl border border-[#0B2545]/5 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/35 mb-1.5">{label}</p>
          <p className="text-[28px] font-bold text-[#0B2545] tracking-tight leading-none" style={{ fontFamily: 'Libre Baskerville, serif' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${up ? 'text-[#22863A]' : 'text-[#B8352E]'}`}>
              <span>{up ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: color + '12', color }}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500 animate-pulse' },
    draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B2545] text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-medium opacity-60 mb-0.5">{label}</p>
      {payload.map((e, i) => (
        <p key={i}>{e.name}: <span className="font-bold">{e.value.toLocaleString()}</span></p>
      ))}
    </div>
  );
}

function ActivityItem({ icon, color, message, time }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: color + '10', color }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#0B2545]/75 leading-relaxed">{message}</p>
        <p className="text-[11px] text-[#0B2545]/25 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, verified: 0, activeSurveys: 0, totalResponses: 0, pendingReview: 0 });
  const [surveys, setSurveys] = useState([]);
  const [activity, setActivity] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel('admin-dash-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, fetchAll)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function fetchAll() {
    try {
      const [uAll, uVer, sActive, sReview, rAll, sList] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('responses').select('*', { count: 'exact', head: true }),
        supabase.from('surveys').select('*').order('created_at', { ascending: false }).limit(8),
      ]);
      setStats({
        users: uAll.count || 0, verified: uVer.count || 0, activeSurveys: sActive.count || 0,
        totalResponses: rAll.count || 0, pendingReview: sReview.count || 0,
      });
      setSurveys(sList.data || []);
      const { data: allUsers } = await supabase.from('users').select('created_at').order('created_at', { ascending: true });
      if (allUsers?.length) {
        const weeks = {};
        allUsers.forEach((u) => {
          const d = new Date(u.created_at);
          const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
          const k = ws.toISOString().split('T')[0];
          weeks[k] = (weeks[k] || 0) + 1;
        });
        setUserGrowth(Object.entries(weeks).slice(-10).map(([w, c]) => ({
          week: new Date(w).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), signups: c,
        })));
      }
      const [{ data: recentU }, { data: recentR }] = await Promise.all([
        supabase.from('users').select('full_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('responses').select('created_at, survey_id, surveys(title)').order('created_at', { ascending: false }).limit(5),
      ]);
      const items = [];
      recentU?.forEach((u) => items.push({ icon: '👤', color: C.navy, message: `${u.full_name || 'New user'} signed up`, time: timeAgo(u.created_at), date: new Date(u.created_at) }));
      recentR?.forEach((r) => items.push({ icon: '📋', color: C.gold, message: `Response submitted for "${r.surveys?.title || 'survey'}"`, time: timeAgo(r.created_at), date: new Date(r.created_at) }));
      items.sort((a, b) => b.date - a.date);
      setActivity(items.slice(0, 8));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const vRate = stats.users > 0 ? Math.round((stats.verified / stats.users) * 100) : 0;
  const donut = [
    { name: 'Verified', value: stats.verified || 0 },
    { name: 'Unverified', value: Math.max((stats.users - stats.verified), 0) || 1 },
  ];

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Admin Dashboard</h1>
          <p className="text-sm text-[#0B2545]/40 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-700">All Systems Operational</span>
          </div>
          <button onClick={() => navigate('/admin/surveys/new')} className="flex items-center gap-2 px-4 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            <span className="text-lg leading-none">+</span> New Survey
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats.users} change={12} color={C.navy} icon="👥" />
        <StatCard label="Verified" value={stats.verified} change={8} color={C.gold} icon="✓" />
        <StatCard label="Active Surveys" value={stats.activeSurveys} change={0} color={C.red} icon="📊" />
        <StatCard label="Responses" value={stats.totalResponses} change={23} color={C.green} icon="📝" />
        <StatCard label="Pending Review" value={stats.pendingReview} color="#7c3aed" icon="⏳" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#0B2545]/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>User Growth</h3>
            <span className="text-[11px] text-[#0B2545]/30 font-medium">Last 10 weeks</span>
          </div>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowth}>
                <defs><linearGradient id="gGrowth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.2} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0B254508" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#0B254550' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#0B254550' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="signups" stroke={C.gold} strokeWidth={2} fill="url(#gGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (<div className="flex items-center justify-center h-[200px] text-sm text-[#0B2545]/25">Signups will appear here as users join</div>)}
        </div>
        <div className="bg-white rounded-xl border border-[#0B2545]/5 p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-[#0B2545] self-start mb-4" style={{ fontFamily: 'Libre Baskerville, serif' }}>Verification Rate</h3>
          <div className="relative">
            <PieChart width={150} height={150}>
              <Pie data={donut} cx={75} cy={75} innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                <Cell fill={C.gold} /><Cell fill="#0B254510" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>{vRate}%</span>
              <span className="text-[9px] uppercase tracking-wider text-[#0B2545]/30 font-semibold">Verified</span>
            </div>
          </div>
          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-[#0B2545]/50"><span className="w-2.5 h-2.5 rounded-full bg-[#C5960C]" /> Verified ({stats.verified})</div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#0B2545]/50"><span className="w-2.5 h-2.5 rounded-full bg-[#0B2545]/10" /> Pending ({stats.users - stats.verified})</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0B2545]/5">
            <h3 className="font-semibold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Recent Surveys</h3>
            <button onClick={() => navigate('/admin/surveys')} className="text-[11px] font-semibold text-[#C5960C] hover:text-[#b3870b] transition-colors">View All →</button>
          </div>
          {surveys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[10px] uppercase tracking-[0.15em] text-[#0B2545]/25 font-semibold border-b border-[#0B2545]/5"><th className="px-5 py-2.5">Title</th><th className="px-5 py-2.5">Status</th><th className="px-5 py-2.5">Responses</th><th className="px-5 py-2.5">Created</th></tr></thead>
                <tbody>
                  {surveys.slice(0, 5).map((s) => (
                    <tr key={s.id} className="border-b border-[#0B2545]/5 last:border-0 hover:bg-[#C5960C]/[0.015] cursor-pointer transition-colors" onClick={() => navigate(`/admin/surveys/${s.id}/edit`)}>
                      <td className="px-5 py-3 font-medium text-[#0B2545]">{s.title}</td>
                      <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-3 text-[#0B2545]/50 tabular-nums">{(s.response_count || 0).toLocaleString()}{s.target_responses && <span className="text-[#0B2545]/20"> / {s.target_responses}</span>}</td>
                      <td className="px-5 py-3 text-[#0B2545]/35">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-[#0B2545]/25 mb-2">No surveys yet</p>
              <button onClick={() => navigate('/admin/surveys/new')} className="text-sm font-semibold text-[#C5960C] hover:underline">Create your first survey →</button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#0B2545]/5 p-5">
          <h3 className="font-semibold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Recent Activity</h3>
          {activity.length > 0 ? (
            <div className="divide-y divide-[#0B2545]/5">{activity.map((item, i) => <ActivityItem key={i} {...item} />)}</div>
          ) : (<p className="text-sm text-[#0B2545]/25 text-center py-12">Activity will appear here as users join and take surveys</p>)}
        </div>
      </div>
    </div>
  );
}
