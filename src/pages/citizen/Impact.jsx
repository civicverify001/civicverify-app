// src/pages/citizen/Impact.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

function getTrustLevel(score) {
  if (score >= 25) return { label: 'Champion', emoji: '🏆', next: null, pct: 100 };
  if (score >= 11) return { label: 'Trusted', emoji: '⭐', next: 25, pct: Math.round(((score - 11) / 14) * 100) };
  if (score >= 3) return { label: 'Active', emoji: '🔵', next: 11, pct: Math.round(((score - 3) / 8) * 100) };
  return { label: 'New', emoji: '🟢', next: 3, pct: Math.round((score / 3) * 100) };
}

export default function Impact() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [completedSurveys, setCompletedSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  async function fetchData() {
    try {
      const [{ data: prof }, { data: responses }] = await Promise.all([
        supabase.from('users').select('full_name, trust_score, is_verified, created_at').eq('id', user.id).single(),
        supabase.from('responses').select('submitted_at, surveys(id, title, status, response_count, target_responses)').eq('user_id', user.id).order('submitted_at', { ascending: false }),
      ]);
      setProfile(prof);
      setCompletedSurveys(responses || []);
    } catch (err) {
      console.error('Impact fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  const trust = getTrustLevel(profile?.trust_score || 0);
  const totalContributed = completedSurveys.reduce((sum, r) => sum + (r.surveys?.response_count || 0), 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Your Impact</h1>
        <p className="text-sm text-[#0B2545]/40 mt-1">See how your voice is shaping civic decisions</p>
      </div>

      {/* Trust Score Card */}
      <div className="bg-[#0B2545] rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider mb-1">Civic Trust Level</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{trust.emoji}</span>
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Libre Baskerville, serif' }}>{trust.label}</p>
                <p className="text-white/40 text-sm">Score: {profile?.trust_score || 0} points</p>
              </div>
            </div>
            {trust.next && (
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-[11px] text-white/30 mb-1">
                  <span>Progress to next level</span>
                  <span>{trust.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#C5960C] transition-all duration-700" style={{ width: `${trust.pct}%` }} />
                </div>
                <p className="text-[10px] text-white/20 mt-1">Complete more surveys to reach {trust.next} points</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ fontFamily: 'Libre Baskerville, serif' }}>{completedSurveys.length}</p>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mt-0.5">Surveys Taken</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ fontFamily: 'Libre Baskerville, serif' }}>{totalContributed.toLocaleString()}</p>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mt-0.5">Total Responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* How trust score works */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 p-5">
        <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider mb-3">Trust Level Tiers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '🟢', label: 'New', range: '0–2', desc: 'Getting started' },
            { emoji: '🔵', label: 'Active', range: '3–10', desc: 'Regular participant' },
            { emoji: '⭐', label: 'Trusted', range: '11–24', desc: 'Consistent contributor' },
            { emoji: '🏆', label: 'Champion', range: '25+', desc: 'Civic leader' },
          ].map((tier) => (
            <div key={tier.label} className={`p-3 rounded-lg text-center border ${
              trust.label === tier.label ? 'border-[#C5960C]/30 bg-[#C5960C]/[0.03]' : 'border-[#0B2545]/5'
            }`}>
              <span className="text-xl">{tier.emoji}</span>
              <p className="text-xs font-semibold text-[#0B2545] mt-1">{tier.label}</p>
              <p className="text-[10px] text-[#0B2545]/25">{tier.range} pts</p>
              <p className="text-[10px] text-[#0B2545]/35 mt-0.5">{tier.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Surveys Contributed To */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#0B2545]/5">
          <h3 className="font-semibold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>
            Surveys You've Contributed To
          </h3>
        </div>
        {completedSurveys.length > 0 ? (
          <div className="divide-y divide-[#0B2545]/5">
            {completedSurveys.map((r, i) => {
              const s = r.surveys;
              const pct = s?.target_responses ? Math.round(((s.response_count || 0) / s.target_responses) * 100) : null;
              return (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C5960C]/10 flex items-center justify-center text-lg shrink-0">
                    {s?.status === 'closed' ? '✅' : '📊'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B2545]">{s?.title || 'Survey'}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-[#0B2545]/25">
                        Submitted {new Date(r.submitted_at).toLocaleDateString()}
                      </span>
                      {pct !== null && (
                        <span className="text-[10px] text-[#0B2545]/25">{(s.response_count || 0).toLocaleString()} responses ({pct}%)</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    s?.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {s?.status === 'closed' ? 'Closed' : 'Active'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-[#0B2545]/25">Take your first survey to see your impact here</p>
          </div>
        )}
      </div>
    </div>
  );
}
