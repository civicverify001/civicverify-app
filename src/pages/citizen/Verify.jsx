// src/pages/citizen/Verify.jsx
// ID Verification page — Didit integration with status display
// The actual Didit redirect URL will need to be configured once you have API keys.

import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const STEPS = [
  { icon: '📱', title: 'Scan your ID', description: 'Take a photo of your government-issued ID' },
  { icon: '🤳', title: 'Take a selfie', description: 'A quick selfie to match your ID photo' },
  { icon: '✅', title: 'Get verified', description: 'Usually takes under 60 seconds' },
];

export default function Verify() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  async function fetchProfile() {
    const { data } = await supabase.from('users').select('is_verified, didit_session_id, full_name').eq('id', user.id).single();
    setProfile(data);
    setLoading(false);
  }

  async function startVerification() {
    setStarting(true);
    try {
      // TODO: Replace with actual Didit API call
      // 1. Call your Supabase Edge Function or backend to create a Didit session
      // 2. Get the redirect URL back
      // 3. Redirect user to Didit hosted flow
      //
      // For now, we'll simulate storing a session ID and show instructions:
      //
      // const response = await fetch('YOUR_EDGE_FUNCTION_URL/create-didit-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ user_id: user.id, email: user.email }),
      // });
      // const { session_url, session_id } = await response.json();
      // await supabase.from('users').update({ didit_session_id: session_id }).eq('id', user.id);
      // window.location.href = session_url;

      alert(
        'Didit integration coming soon!\n\n' +
        'To test verification, go to Supabase SQL Editor and run:\n' +
        `UPDATE public.users SET is_verified = true WHERE id = '${user.id}';`
      );
    } catch (err) {
      console.error('Verification start error:', err);
      alert('Failed to start verification. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#C5960C] border-t-transparent rounded-full animate-spin" /></div>;

  // Already verified
  if (profile?.is_verified) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-[#22863A]/10 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0B2545] mb-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>
          Identity Verified
        </h1>
        <p className="text-sm text-[#0B2545]/45 mb-6">
          Your identity has been verified. You have full access to all surveys on the platform.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Privacy Guarantee</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Your ID document was deleted after verification. Only your demographic category (state, age range) is stored — never your personal identification data.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not yet verified
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#C5960C]/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>
          Verify Your Identity
        </h1>
        <p className="text-sm text-[#0B2545]/45 mt-2 max-w-md mx-auto leading-relaxed">
          To ensure authentic civic data, all survey participants must verify their identity.
          It's free, fast, and your privacy is protected.
        </p>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 p-6">
        <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider mb-4">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-3xl mb-3">{step.icon}</div>
              <p className="text-sm font-semibold text-[#0B2545] mb-1">{step.title}</p>
              <p className="text-xs text-[#0B2545]/35">{step.description}</p>
              {i < STEPS.length - 1 && (
                <span className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 text-[#0B2545]/15 text-lg">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy assurance */}
      <div className="bg-[#0B2545]/[0.02] rounded-xl border border-[#0B2545]/5 p-6 space-y-3">
        <h3 className="text-xs font-semibold text-[#0B2545]/35 uppercase tracking-wider">Your Privacy Is Protected</h3>
        {[
          { icon: '🗑️', text: 'Your ID is verified then immediately deleted — we never store your document' },
          { icon: '🔒', text: 'Only your demographic category (state, age range) is kept for survey matching' },
          { icon: '👤', text: 'Survey responses are completely anonymous — no one can trace answers back to you' },
          { icon: '🛡️', text: 'Powered by Didit — trusted by governments and institutions worldwide' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
            <p className="text-sm text-[#0B2545]/55">{item.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <button onClick={startVerification} disabled={starting}
          className="px-8 py-3.5 bg-[#C5960C] hover:bg-[#b3870b] text-white text-base font-semibold rounded-xl transition-colors shadow-md disabled:opacity-50 inline-flex items-center gap-2">
          {starting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting...</>
          ) : (
            <>🔐 Verify with Didit — Free & Fast</>
          )}
        </button>
        <p className="text-[11px] text-[#0B2545]/25 mt-3">Takes under 2 minutes · No cost to you</p>
      </div>
    </div>
  );
}
