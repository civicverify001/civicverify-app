// src/pages/citizen/Impact.jsx — Polished
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const TIERS = [
  { name: 'New Citizen', min: 0, color: '#9CA3AF', icon: '🌱' },
  { name: 'Active Voice', min: 5, color: '#C5960C', icon: '🗣️' },
  { name: 'Civic Champion', min: 15, color: '#22863A', icon: '🏆' },
  { name: 'Trusted Leader', min: 30, color: '#6366f1', icon: '⭐' },
];

export default function CitizenImpact() {
  const { profile } = useAuth();
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('responses').select('*', { count: 'exact', head: true }).eq('user_id', profile?.id)
      .then(({ count }) => { setResponseCount(count || 0); setLoading(false); });
  }, [profile]);

  const trustScore = profile?.trust_score || responseCount;
  const currentTier = [...TIERS].reverse().find(t => trustScore >= t.min) || TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];
  const progress = nextTier ? ((trustScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Your Impact</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">Track your civic engagement journey</p>
      </div>

      {/* Score Card */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-8 shadow-sm text-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#C5960C]/10 to-[#C5960C]/5 flex items-center justify-center text-5xl mx-auto mb-4">{currentTier.icon}</div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 mb-1">Trust Score</p>
        <p className="text-5xl font-bold text-[#0B2545]">{trustScore}</p>
        <p className="text-sm font-semibold mt-2" style={{ color: currentTier.color }}>{currentTier.name}</p>

        {nextTier && (
          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs text-[#0B2545]/30 mb-2">
              <span>{currentTier.name}</span>
              <span>{nextTier.name}</span>
            </div>
            <div className="w-full h-3 bg-[#0B2545]/[0.04] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(progress, 100)}%`, background: currentTier.color }} />
            </div>
            <p className="text-xs text-[#0B2545]/25 mt-2">{nextTier.min - trustScore} more to reach {nextTier.name}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#0B2545]">{responseCount}</p>
          <p className="text-[11px] text-[#0B2545]/30 font-semibold mt-1">Surveys Completed</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#0B2545]">{profile?.is_verified ? '✓' : '✕'}</p>
          <p className="text-[11px] text-[#0B2545]/30 font-semibold mt-1">Verified Status</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-5 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#0B2545]">{Math.floor((Date.now() - new Date(profile?.created_at)) / 86400000)}</p>
          <p className="text-[11px] text-[#0B2545]/30 font-semibold mt-1">Days Active</p>
        </div>
      </div>

      {/* Tier Roadmap */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#0B2545] mb-5">Tier Roadmap</h3>
        <div className="space-y-4">
          {TIERS.map((tier, i) => {
            const reached = trustScore >= tier.min;
            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${reached ? 'bg-[#C5960C]/[0.03]' : 'opacity-40'}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${tier.color}15` }}>{tier.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#0B2545]">{tier.name}</p>
                  <p className="text-xs text-[#0B2545]/30">{tier.min}+ trust score required</p>
                </div>
                {reached && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Achieved</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
