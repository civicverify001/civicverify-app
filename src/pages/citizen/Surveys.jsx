// src/pages/citizen/Surveys.jsx — Polished
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export default function CitizenSurveys() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [tab, setTab] = useState('available');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: surveyData }, { data: responseData }] = await Promise.all([
        supabase.from('surveys').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('responses').select('survey_id').eq('user_id', profile?.id),
      ]);
      const completedIds = (responseData || []).map(r => r.survey_id);
      setCompleted(completedIds);
      setSurveys(surveyData || []);
      setLoading(false);
    })();
  }, [profile]);

  const available = surveys.filter(s => !completed.includes(s.id));
  const done = surveys.filter(s => completed.includes(s.id));
  const list = tab === 'available' ? available : done;

  if (!profile?.is_verified) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-[#C5960C]/5 flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
        <h2 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Verification Required</h2>
        <p className="text-sm text-[#0B2545]/40 mt-3 max-w-sm mx-auto leading-relaxed">To ensure authentic civic participation, you need to verify your identity before accessing surveys.</p>
        <button onClick={() => navigate('/citizen/verify')} className="mt-6 px-6 py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 transition-all duration-200">Verify My Identity →</button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Surveys</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">Make your voice heard on issues that matter</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#0B2545]/[0.06] p-1 w-fit shadow-sm">
        <button onClick={() => setTab('available')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === 'available' ? 'bg-[#0B2545] text-white shadow-sm' : 'text-[#0B2545]/40 hover:text-[#0B2545]/70'}`}>
          Available <span className="ml-1 opacity-50">{available.length}</span>
        </button>
        <button onClick={() => setTab('completed')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === 'completed' ? 'bg-[#0B2545] text-white shadow-sm' : 'text-[#0B2545]/40 hover:text-[#0B2545]/70'}`}>
          Completed <span className="ml-1 opacity-50">{done.length}</span>
        </button>
      </div>

      {/* Survey Cards */}
      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm hover:shadow-lg hover:shadow-[#0B2545]/[0.04] hover:-translate-y-0.5 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${tab === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#C5960C]/10 text-[#C5960C]'}`}>
                  {tab === 'completed' ? '✓ Completed' : `📝 ${(s.questions || []).length} questions`}
                </span>
                {s.urgency === 'urgent' && <span className="w-2 h-2 bg-[#B8352E] rounded-full animate-pulse" />}
              </div>
              <h3 className="text-lg font-bold text-[#0B2545] group-hover:text-[#C5960C] transition-colors">{s.title}</h3>
              {s.description && <p className="text-sm text-[#0B2545]/35 mt-1.5 line-clamp-2 leading-relaxed">{s.description}</p>}
              <div className="flex items-center gap-3 mt-4 text-[11px] text-[#0B2545]/25">
                <span>📅 {new Date(s.created_at).toLocaleDateString()}</span>
                {s.target_state && <span>📍 {s.target_state}</span>}
              </div>
              {tab === 'available' && (
                <button onClick={() => navigate(`/citizen/surveys/${s.id}`)} className="mt-4 w-full py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20">
                  Take Survey →
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] py-20 flex flex-col items-center text-center shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#C5960C]/5 flex items-center justify-center text-3xl mb-5">{tab === 'available' ? '📋' : '✅'}</div>
          <p className="text-base font-semibold text-[#0B2545]/25">{tab === 'available' ? 'No surveys available right now' : 'No completed surveys yet'}</p>
          <p className="text-sm text-[#0B2545]/20 mt-1">{tab === 'available' ? 'Check back soon for new surveys' : 'Start by taking your first survey'}</p>
        </div>
      )}
    </div>
  );
}
