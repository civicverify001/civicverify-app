// src/pages/org/Dashboard.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

export default function OrgDashboard() {
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  // OrgLayout already handles pending/rejected redirect — only approved orgs reach here
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>
        Welcome, {profile.org_name || profile.full_name}
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: '0 0 24px' }}>
        Commission verified civic data from real citizens
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.25)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>✅ Account Status</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.green, margin: 0, fontFamily: font }}>Approved</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid rgba(11,37,69,0.06)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.25)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>💰 Base Rate</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font }}>$3.50<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(11,37,69,0.3)' }}>/response</span></p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid rgba(11,37,69,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>💳 Pricing Schedule</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(11,37,69,0.06)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'rgba(11,37,69,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Tier</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'rgba(11,37,69,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Filters</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'rgba(11,37,69,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Per Response</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50' },
              { tier: 'Basic Targeting', desc: '1-2 demographic filters', price: '$4.50' },
              { tier: 'Refined Targeting', desc: '3-4 demographic filters', price: '$5.50' },
              { tier: 'Precision Targeting', desc: '5+ demographic filters', price: '$7.00' },
              { tier: 'Geo Micro-Target', desc: 'City or ZIP level add-on', price: '+$1.00' },
            ].map(function(r, i) {
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: C.navy }}>{r.tier}</td>
                  <td style={{ padding: '12px', color: 'rgba(11,37,69,0.4)' }}>{r.desc}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: C.gold }}>{r.price}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={function() { navigate('/org/request'); }}
        style={{ padding: '14px 28px', background: C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(197,150,12,0.2)' }}>
        Request a Survey →
      </button>
    </div>
  );
}
