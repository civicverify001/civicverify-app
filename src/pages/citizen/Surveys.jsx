// src/pages/citizen/Surveys.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

function UrgencyTag({ urgency }) {
  if (!urgency || urgency === 'normal') return null;
  const s = urgency === 'urgent' ? 'bg-[#B8352E]/10 text-[#B8352E] border-[#B8352E]/20' : 'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s}`}>{urgency}</span>;
}

function SurveyCard({ survey, completed, onTake }) {
  const pct = survey.target_responses ? Math.min(Math.round(((survey.response_count || 0) / survey.target_responses) * 100), 100) : null;
  return (
    <div className={`bg-white rounded-xl border transition-all hover:shadow-md ${survey.urgency === 'urgent' ? 'border-[#B8352E]/15' : 'border-[#0B2545]/5'}`}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3"><UrgencyTag urgency={survey.urgency} /><span className="text-[10px] font-medium text-[#0B2545]/25 uppercase tracking-wider">{survey.type === '10Q' ? '10 Questions' : survey.type === 'custom' ? 'Custom' : '5 Questions'}</span></div>
        <h3 className="text-base font-bold text-[#0B2545] leading-snug mb-1.5" style={{ fontFamily: 'Libre Baskerville, serif' }}>{survey.title}</h3>
        {survey.description && <p className="text-sm text-[#0B2545]/45 line-clamp-2 mb-4">{survey.description}</p>}
        {pct !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-[11px] text-[#0B2545]/30 mb-1"><span>{(survey.response_count || 0).toLocaleString()} responses</span><span>{pct}% of target</span></div>
            <div className="h-1.5 rounded-full bg-[#0B2545]/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#C5960C] to-[#C5960C]/70 transition-all duration-700" style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        {completed ? <div className="flex items-center gap-2 text-sm font-medium text-[#22863A]"><span>✓</span> Completed</div> : (
          <button onClick={() => onTake(survey.id)} className="w-full py-2.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">Take Survey</button>
        )}
      </div>
    </div>
  );
}

export default function CitizenSurveys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('available');

  useEffect(() => { if (user) fetchData(); }, [user]);

  async function fetchData() {
    try {
      const { data: prof } = await supabase.from('users').select('state, age_range, is_verified').eq('id', user.id).single();
      setProfile(prof);
      const { data: surveyList } = await supabase.from('surveys').select('*').eq('status', 'active').order('urgency', { ascending: true }).order('created_at', { ascending: false });
      const { data: responses } = await supabase.from('responses').select('survey_id').eq('user_id', user.id);
      const doneIds = new Set((responses || []).map((r) => r.survey_id));
      setCompletedIds(doneIds);
      const matched = (surveyList || []).filter((s) => {
        const f = s.demographic_filters;
        if (!f) return true;
        if (f.states?.length > 0 && prof?.state && !f.states.includes(prof.state)) return false;
        if (f.age_ranges?.length > 0 && prof?.age_range && !f.age_ranges.includes(prof.age_range)) return false;
        return true;
      });
      setSurveys(matched);
    } catch (err) { console.error('Error fetching surveys:', err); } finally { setLoading(false); }
  }

  const displayed = surveys.filter((s) => { if (filter === 'available') return !completedIds.has(s.id); if (filter === 'completed') return completedIds.has(s.id); return true; });
  const availableCount = surveys.filter((s) => !completedIds.has(s.id)).length;
  const completedCount = surveys.filter((s) => completedIds.has(s.id)).length;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  if (profile && !profile.is_verified) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#C5960C]/10 flex items-center justify-center text-3xl mx-auto mb-5">🔒</div>
        <h2 className="text-xl font-bold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>Verification Required</h2>
        <p className="text-sm text-[#0B2545]/50 mb-6 leading-relaxed">To ensure authentic civic data, all survey participants must verify their identity. It's free, takes under 2 minutes, and your ID is deleted after verification.</p>
        <button onClick={() => navigate('/citizen/verify')} className="px-6 py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-lg transition-colors shadow-sm">Verify My Identity →</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Surveys</h1><p className="text-sm text-[#0B2545]/40 mt-1">{availableCount} available survey{availableCount !== 1 ? 's' : ''} matching your profile</p></div>
      <div className="flex bg-white rounded-lg border border-[#0B2545]/8 p-1 w-fit">
        {[{ key: 'available', label: 'Available', count: availableCount }, { key: 'completed', label: 'Completed', count: completedCount }, { key: 'all', label: 'All', count: surveys.length }].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === f.key ? 'bg-[#0B2545] text-white shadow-sm' : 'text-[#0B2545]/40 hover:text-[#0B2545]/60'}`}>{f.label} <span className="ml-1 opacity-60">({f.count})</span></button>
        ))}
      </div>
      {displayed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((s) => <SurveyCard key={s.id} survey={s} completed={completedIds.has(s.id)} onTake={(id) => navigate(`/citizen/surveys/${id}`)} />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#0B2545]/5 p-16 text-center">
          <p className="text-2xl mb-2">{filter === 'completed' ? '📋' : '🎉'}</p>
          <p className="text-sm text-[#0B2545]/35">{filter === 'completed' ? "You haven't completed any surveys yet" : filter === 'available' ? "You've completed all available surveys — check back soon!" : 'No surveys available right now'}</p>
        </div>
      )}
    </div>
  );
}
