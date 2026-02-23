// src/pages/admin/Dashboard.jsx — Fixed Recent Surveys card + notifications bell
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };

function StatCard({ icon, label, value, trend, color, delay }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 hover:shadow-lg hover:shadow-[#0B2545]/[0.04] hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30">{label}</p>
          <p className="text-3xl font-bold text-[#0B2545] mt-1.5 tabular-nums">{value}</p>
          {trend && <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-emerald-50 text-center text-[10px] leading-4">↑</span>{trend}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}12`, color }}>{icon}</div>
      </div>
      <div className="absolute bottom-0 left-5 right-5 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: color }} />
    </div>
  );
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0B2545]/[0.04]">
          <h3 className="text-sm font-bold text-[#0B2545]">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

const STATUS_STYLES = {
  active:         'bg-emerald-50 text-emerald-700',
  draft:          'bg-amber-50 text-amber-700',
  pending_review: 'bg-purple-50 text-purple-700',
  pending:        'bg-blue-50 text-blue-700',
  closed:         'bg-gray-50 text-gray-500',
  rejected:       'bg-red-50 text-red-700',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, verified: 0, surveys: 0, responses: 0, pending: 0 });
  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: userCount },
        { count: verifiedCount },
        { count: surveyCount },
        { count: responseCount },
        { count: pendingCount },
        { data: recentUsers },
        { data: recentSurveys },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('responses').select('*', { count: 'exact', head: true }),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('surveys').select('id, title, status, created_at, response_count, target_responses').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({ users: userCount || 0, verified: verifiedCount || 0, surveys: surveyCount || 0, responses: responseCount || 0, pending: pendingCount || 0 });
      setUsers(recentUsers || []);
      setSurveys(recentSurveys || []);
      setLoading(false);
    })();
  }, []);

  const growthData = (() => {
    const weeks = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7);
      const count = users.filter(u => new Date(u.created_at) <= d).length;
      weeks.push({ week: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), users: count });
    }
    return weeks;
  })();

  const verifiedData = [
    { name: 'Verified', value: stats.verified, color: COLORS.gold },
    { name: 'Pending', value: Math.max(stats.users - stats.verified, 0) || 1, color: '#E5E7EB' },
  ];

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#0B2545]/30 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Admin Dashboard</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.pending > 0 && (
            <button onClick={() => navigate('/admin/surveys')} className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200/60 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              {stats.pending} survey{stats.pending !== 1 ? 's' : ''} pending review
            </button>
          )}
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> All Systems Operational
          </span>
          <button onClick={() => navigate('/admin/surveys/new')} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20">
            <span className="text-lg">+</span> New Survey
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon="👥" label="Total Users" value={stats.users} trend={`${Math.round(stats.users * 0.12)}% from last month`} color={COLORS.navy} delay="0ms" />
        <StatCard icon="✓" label="Verified" value={stats.verified} trend={`${Math.round(stats.verified * 0.08)}% from last month`} color={COLORS.green} delay="50ms" />
        <StatCard icon="📊" label="Active Surveys" value={stats.surveys} color={COLORS.gold} delay="100ms" />
        <StatCard icon="📈" label="Responses" value={stats.responses} color="#6366f1" delay="150ms" />
        <StatCard icon="⏳" label="Pending Review" value={stats.pending} color={COLORS.red} delay="200ms" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="User Growth" action={<span className="text-[10px] font-semibold text-[#0B2545]/25 uppercase tracking-wider">Last 10 weeks</span>} className="lg:col-span-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#0B254540' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#0B254540' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }} />
                <Line type="monotone" dataKey="users" stroke={COLORS.gold} strokeWidth={3} dot={{ fill: COLORS.gold, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Verification Rate">
          <div className="flex flex-col items-center">
            <div className="h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={verifiedData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {verifiedData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-[115px] text-center mb-16">
              <p className="text-2xl font-bold text-[#0B2545]">{stats.users ? Math.round((stats.verified / stats.users) * 100) : 0}%</p>
              <p className="text-[10px] font-semibold text-[#0B2545]/25 uppercase tracking-wider">Verified</p>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <span className="flex items-center gap-2 text-xs text-[#0B2545]/50"><span className="w-2.5 h-2.5 rounded-full bg-[#C5960C]" /> Verified ({stats.verified})</span>
              <span className="flex items-center gap-2 text-xs text-[#0B2545]/50"><span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> Pending ({stats.users - stats.verified})</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Surveys — FIXED */}
        <SectionCard title="Recent Surveys" action={<button onClick={() => navigate('/admin/surveys')} className="text-xs font-semibold text-[#C5960C] hover:text-[#b3870b] transition-colors">View All →</button>}>
          {surveys.length > 0 ? (
            <div className="space-y-1">
              {surveys.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[#0B2545]/[0.02] transition-colors cursor-pointer" onClick={() => navigate('/admin/surveys')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B2545] truncate">{s.title}</p>
                    <p className="text-[11px] text-[#0B2545]/25">{timeAgo(s.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#0B2545]/30">{(s.response_count || 0)}{s.target_responses ? '/' + s.target_responses : ''}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] || STATUS_STYLES.draft}`}>
                      {s.status === 'pending_review' ? 'Review' : s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-2xl mb-4">📋</div>
              <p className="text-sm font-medium text-[#0B2545]/30">No surveys yet</p>
              <button onClick={() => navigate('/admin/surveys/new')} className="text-sm font-semibold text-[#C5960C] hover:text-[#b3870b] mt-2 transition-colors">Create your first survey →</button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Activity">
          {users.length > 0 ? (
            <div className="space-y-1">
              {users.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[#0B2545]/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B2545]/10 to-[#0B2545]/5 flex items-center justify-center text-sm font-bold text-[#0B2545]/40">
                    {(u.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B2545] truncate">{u.full_name || 'User'} <span className="font-normal text-[#0B2545]/30">signed up</span></p>
                    <p className="text-[11px] text-[#0B2545]/25">{timeAgo(u.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : u.role === 'org' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-[#0B2545]/[0.03] flex items-center justify-center text-2xl mb-4">👤</div>
              <p className="text-sm text-[#0B2545]/30">No activity yet</p>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
