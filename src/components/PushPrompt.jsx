// src/components/PushPrompt.jsx
// Shows a banner asking users to enable browser push notifications
// Add this to CitizenLayout.jsx above <Outlet />
//
// Usage: <PushPrompt userId={user?.id} />

import { useState, useEffect } from 'react';
import { isPushSupported, getPushPermission, subscribeToPush } from '../utils/pushNotifications';

var C = { navy: '#0B2545', gold: '#C5960C' };

export default function PushPrompt({ userId }) {
  var [show, setShow] = useState(false);
  var [subscribing, setSubscribing] = useState(false);

  useEffect(function () {
    // Only show if: push is supported, permission not yet asked, and not dismissed recently
    if (!isPushSupported()) return;
    if (getPushPermission() !== 'default') return;

    // Don't show if dismissed in last 7 days
    var dismissed = localStorage.getItem('push_prompt_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Show after 3 second delay (don't bombard on first load)
    var timer = setTimeout(function () { setShow(true); }, 3000);
    return function () { clearTimeout(timer); };
  }, []);

  async function handleEnable() {
    if (!userId) return;
    setSubscribing(true);
    try {
      await subscribeToPush(userId);
    } catch (e) {
      console.error('Push subscribe error:', e);
    }
    setSubscribing(false);
    setShow(false);
    localStorage.setItem('push_prompt_dismissed', String(Date.now()));
  }

  function handleDismiss() {
    localStorage.setItem('push_prompt_dismissed', String(Date.now()));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #1a3a6a 100%)',
      borderRadius: 14, padding: '16px 20px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 14,
      animation: 'slideDown 0.3s ease',
      boxShadow: '0 4px 16px rgba(11,37,69,0.15)',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px', fontFamily: "'DM Sans', sans-serif" }}>
          Enable notifications?
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Get notified about new followers, comments, debate invites, and survey results.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={handleDismiss}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
          Later
        </button>
        <button onClick={handleEnable} disabled={subscribing}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: C.gold, fontSize: 12, fontWeight: 700, color: '#fff',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            opacity: subscribing ? 0.6 : 1,
          }}>
          {subscribing ? 'Enabling...' : 'Enable'}
        </button>
      </div>

      <style>{'\
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }\
      '}</style>
    </div>
  );
}
