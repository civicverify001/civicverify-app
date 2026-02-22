// src/pages/citizen/Verify.jsx — Polished
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function CitizenVerify() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (profile?.is_verified) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
        <h2 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Already Verified</h2>
        <p className="text-sm text-[#0B2545]/40 mt-3">Your identity has been confirmed. You have full access to all surveys.</p>
        <button onClick={() => navigate('/citizen/surveys')} className="mt-6 px-6 py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200">Browse Surveys →</button>
      </div>
    );
  }

  const steps = [
    { icon: '📱', title: 'Start Verification', desc: 'Click the button below to begin the secure verification process' },
    { icon: '🪪', title: 'Verify Your Identity', desc: 'Follow the prompts to confirm your identity through our partner Didit' },
    { icon: '✅', title: 'Access Granted', desc: 'Once verified, you\'ll have full access to participate in civic surveys' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[#C5960C]/10 flex items-center justify-center text-3xl mx-auto mb-5">🔐</div>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Verify Your Identity</h1>
        <p className="text-sm text-[#0B2545]/40 mt-2 max-w-md mx-auto leading-relaxed">CivicVerify uses identity verification to ensure every voice is authentic. This is a one-time process.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-8 shadow-sm">
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#C5960C]/5 flex items-center justify-center text-xl flex-shrink-0">{step.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#C5960C] bg-[#C5960C]/10 px-2 py-0.5 rounded-full">Step {i + 1}</span>
                </div>
                <h3 className="text-sm font-bold text-[#0B2545]">{step.title}</h3>
                <p className="text-sm text-[#0B2545]/40 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-[#0B2545]/[0.04]">
          <button className="w-full py-3.5 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 transition-all duration-200 text-sm">
            Begin Verification with Didit →
          </button>
          <p className="text-[11px] text-[#0B2545]/25 text-center mt-3">🔒 Your data is encrypted and never shared with third parties</p>
        </div>
      </div>
    </div>
  );
}
