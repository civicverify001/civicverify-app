// src/components/CookieConsent.jsx — GA4 Cookie Consent Banner
import { useState, useEffect } from 'react';

var C = { navy: '#0B2545', gold: '#C5960C' };

export default function CookieConsent() {
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    // Only show if user hasn't made a choice yet
    var consent = localStorage.getItem('cv_cookie_consent');
    if (!consent) {
      // Disable GA4 until consent is given
      window['ga-disable-G-0F5SGY8KJH'] = true;
      setVisible(true);
    } else if (consent === 'accepted') {
      // Re-enable GA4
      window['ga-disable-G-0F5SGY8KJH'] = false;
    } else {
      // Declined — keep GA4 disabled
      window['ga-disable-G-0F5SGY8KJH'] = true;
    }
  }, []);

  function handleAccept() {
    localStorage.setItem('cv_cookie_consent', 'accepted');
    localStorage.setItem('cv_cookie_consent_date', new Date().toISOString());
    window['ga-disable-G-0F5SGY8KJH'] = false;
    // Reload gtag if it was blocked
    if (window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    setVisible(false);
  }

  function handleDecline() {
    localStorage.setItem('cv_cookie_consent', 'declined');
    localStorage.setItem('cv_cookie_consent_date', new Date().toISOString());
    window['ga-disable-G-0F5SGY8KJH'] = true;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(11,37,69,0.97)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(197,150,12,0.3)',
      padding: '16px 20px',
      fontFamily: 'DM Sans,-apple-system,sans-serif',
      animation: 'slideUp 0.3s ease'
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Icon */}
        <div style={{ fontSize: 20, flexShrink: 0 }}>{'\uD83C\uDF6A'}</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ fontSize: 14, color: '#fff', margin: '0 0 4px', fontWeight: 600 }}>We value your privacy</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
            CivicVerify uses cookies for essential site functionality and analytics (Google Analytics) to improve your experience.
            We do not use cookies for advertising. See our{' '}
            <a href="/privacy" style={{ color: C.gold, textDecoration: 'underline' }}>Privacy Policy</a> for details.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={handleDecline} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600,
            background: 'transparent', color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            cursor: 'pointer', transition: 'all 0.2s'
          }}>Decline Analytics</button>
          <button onClick={handleAccept} style={{
            padding: '10px 24px', fontSize: 13, fontWeight: 600,
            background: C.gold, color: '#fff',
            border: 'none', borderRadius: 8,
            cursor: 'pointer', transition: 'all 0.2s'
          }}>Accept All</button>
        </div>
      </div>
    </div>
  );
}
