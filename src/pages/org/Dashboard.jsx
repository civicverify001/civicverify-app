// src/pages/org/Dashboard.jsx — Polished
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('surveys').select('*').eq('org_id', profile?.org_id).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { setSurveys(data || []); setLoading(false); });
  }, [profile]);

  const active = surveys.filter(s => s.status === 'active').length;
  const totalResponses = surveys.reduce((a, s) => a + (s.response_count || 0), 0);
  const pending = surveys.filter(s => s.status === 'pending').length;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Organization Dashboard</h1>
          <p className="text-sm text-[#0B2545]/35 mt-1">Welcome back, {profile?.full_name || 'Organization'}</p>
        </div>
        <button onClick={() => navigate('/org/request')} className="flex items-center gap-2 px-5 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 self-start">
          <span className="text-lg">+</span> Request Survey
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📊', label: 'Active Surveys', value: active, color: '#22863A' },
          { icon: '📈', label: 'Total Responses', value: totalResponses, color: '#C5960C' },
          { icon: '⏳', label: 'Pending Review', value: pending, color: '#6366f1' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30">{s.label}</p>
                <p className="text-3xl font-bold text-[#0B2545] mt-1.5">{s.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{ background: `${s.color}12` }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '📋', label: 'Request a Survey', desc: 'Submit a new survey for review', to: '/org/request' },
          { icon: '📊', label: 'View My Surveys', desc: 'Track status and responses', to: '/org/surveys' },
          { icon: '📈', label: 'View Results', desc: 'Analyze survey data', to: '/org/surveys' },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.to)}
            className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <span className="text-2xl block mb-3">{a.icon}</span>
            <p className="text-sm font-bold text-[#0B2545] group-hover:text-[#C5960C] transition-colors">{a.label}</p>
            <p className="text-xs text-[#0B2545]/30 mt-1">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* Recent Surveys */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0B2545]/[0.04]">
          <h3 className="text-sm font-bold text-[#0B2545]">Recent Surveys</h3>
          <button onClick={() => navigate('/org/surveys')} className="text-xs font-semibold text-[#C5960C] hover:text-[#b3870b] transition-colors">View All →</button>
        </div>
        {surveys.length > 0 ? (
          <div className="divide-y divide-[#0B2545]/[0.03]">
            {surveys.slice(0, 5).map(s => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#C5960C]/[0.015] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#0B2545]">{s.title}</p>
                  <p className="text-[11px] text-[#0B2545]/25 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold tabular-nums text-[#0B2545]/40">{s.response_count || 0} responses</span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    s.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    s.status === 'pending' ? 'bg-blue-50 text-blue-700' :
                    s.status === 'closed' ? 'bg-gray-50 text-gray-500' :
                    'bg-amber-50 text-amber-700'
                  }`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-2xl mb-4">📋</div>
            <p className="text-sm font-medium text-[#0B2545]/25">No surveys yet</p>
            <button onClick={() => navigate('/org/request')} className="text-sm font-semibold text-[#C5960C] mt-2">Request your first survey →</button>
          </div>
        )}
      </div>
    </div>
  );
}
