// src/pages/org/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

function StatusBadge({ status }) {
  const map = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    closed: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[status] || map.draft}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState({ active: 0, totalResponses: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  async function fetchData() {
    try {
      // Get org record
      const { data: orgData } = await supabase.from('organizations').select('*').eq('user_id', user.id).single();
      setOrg(orgData);

      if (orgData) {
        // Get org's surveys
        const { data: surveyData } = await supabase
          .from('surveys')
          .select('*')
          .eq('org_id', orgData.id)
          .order('created_at', { ascending: false });

        setSurveys(surveyData || []);

        const active = (surveyData || []).filter((s) => s.status === 'active').length;
        const pending = (surveyData || []).filter((s) => s.status === 'pending').length;
        const total = (surveyData || []).reduce((sum, s) => sum + (s.response_count || 0), 0);
        setStats({ active, totalResponses: total, pending });
      }
    } catch (err) {
      console.error('Org dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>
            {org?.org_name ? `Welcome, ${org.org_name}` : 'Organization Dashboard'}
          </h1>
          <p className="text-sm text-[#0B2545]/40 mt-1">
            {org?.tier ? `${org.tier.charAt(0).toUpperCase() + org.tier.slice(1)} tier` : 'Manage your surveys and view results'}
          </p>
        </div>
        <button onClick={() => navigate('/org/request')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm self-start">
          <span className="text-lg leading-none">+</span> Request New Survey
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Surveys', value: stats.active, icon: '📊', color: '#22863A' },
          { label: 'Total Responses', value: stats.totalResponses, icon: '📝', color: '#C5960C' },
          { label: 'Pending Review', value: stats.pending, icon: '⏳', color: '#0B2545' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#0B2545]/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/35 mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                  {s.value.toLocaleString()}
                </p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Surveys */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#0B2545]/5">
          <h3 className="font-semibold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Your Surveys</h3>
          <button onClick={() => navigate('/org/surveys')}
            className="text-[11px] font-semibold text-[#C5960C] hover:text-[#b3870b] transition-colors">View All →</button>
        </div>
        {surveys.length > 0 ? (
          <div className="divide-y divide-[#0B2545]/5">
            {surveys.slice(0, 5).map((s) => (
              <div key={s.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#C5960C]/[0.01] transition-colors cursor-pointer"
                onClick={() => s.status !== 'draft' && s.status !== 'pending' ? navigate(`/org/surveys/${s.id}/results`) : null}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0B2545]">{s.title}</p>
                  <p className="text-[11px] text-[#0B2545]/25 mt-0.5">
                    {(s.response_count || 0).toLocaleString()} responses
                    {s.target_responses && ` of ${s.target_responses.toLocaleString()} target`}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-[#0B2545]/25 mb-3">No surveys yet</p>
            <button onClick={() => navigate('/org/request')}
              className="text-sm font-semibold text-[#C5960C] hover:underline">Request your first survey →</button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Request Survey', desc: 'Submit a new survey for review', icon: '📋', to: '/org/request' },
          { label: 'View Results', desc: 'Analyze your survey data', icon: '📊', to: '/org/surveys' },
          { label: 'Billing', desc: 'Manage payment & invoices', icon: '💳', to: '/org/billing' },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.to)}
            className="bg-white rounded-xl border border-[#0B2545]/5 p-5 text-left hover:border-[#C5960C]/20 hover:shadow-sm transition-all">
            <span className="text-2xl">{a.icon}</span>
            <p className="text-sm font-semibold text-[#0B2545] mt-2">{a.label}</p>
            <p className="text-[11px] text-[#0B2545]/30 mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
