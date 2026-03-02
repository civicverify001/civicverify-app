import CanonicalUrl from '../../components/CanonicalUrl'

// Inside return(), first line:
<CanonicalUrl />
// src/pages/public/OrgPending.jsx
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

export default function OrgPending() {
  var navigate = useNavigate();
  var { profile } = useAuth();

  // If they're already approved, send them to org dashboard
  useEffect(function() {
    if (profile && profile.org_status === 'approved') {
      navigate('/org');
    }
    if (profile && profile.org_status === 'rejected') {
      navigate('/org-rejected');
    }
  }, [profile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  var isRejected = profile && profile.org_status === 'rejected';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: sans }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, ' + C.navy + ', #1a3a6a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.gold, fontFamily: font }}>CV</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.navy, fontFamily: font }}>CivicVerify</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(11,37,69,0.1)', padding: '48px 40px' }}>

          {/* Icon */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(197,150,12,0.08)', border: '2px solid rgba(197,150,12,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
            🏛️
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.navy, margin: '0 0 12px', fontFamily: font }}>
            Application Under Review
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(11,37,69,0.55)', margin: '0 0 32px', lineHeight: 1.7 }}>
            Thank you for registering with CivicVerify. Our team is reviewing your organization's application and documents. You'll receive an email once a decision has been made.
          </p>

          {/* Status steps */}
          <div style={{ background: 'rgba(11,37,69,0.02)', borderRadius: 14, padding: '20px 24px', marginBottom: 32, textAlign: 'left', border: '1px solid rgba(11,37,69,0.06)' }}>
            {[
              { icon: '✅', label: 'Application submitted', done: true },
              { icon: '🔍', label: 'Under admin review', done: true, active: true },
              { icon: '📧', label: 'Decision notification sent', done: false },
              { icon: '🚀', label: 'Access granted to platform', done: false },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(11,37,69,0.04)' : 'none' }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: s.active ? 700 : 500, color: s.done ? C.navy : 'rgba(11,37,69,0.3)' }}>
                    {s.label}
                    {s.active && <span style={{ fontSize: 11, color: C.gold, marginLeft: 8, fontWeight: 700 }}>← YOU ARE HERE</span>}
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.4)', margin: '0 0 24px' }}>
            Typical review time: <strong style={{ color: C.navy }}>1–3 business days</strong>
          </p>

          <button onClick={handleSignOut}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1.5px solid rgba(11,37,69,0.12)', background: '#fafbfc', color: C.navy, fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(11,37,69,0.4)' }}>
          Questions? <a href="mailto:support@civicverify.org" style={{ color: C.gold, fontWeight: 600, textDecoration: 'none' }}>Contact support</a>
        </p>
      </div>
    </div>
  );
}
