import { useState, useEffect } from 'react';
import { isPushSupported, getPushPermission, subscribeToPush } from '../utils/pushNotifications';

var C = { navy: '#0B2545', gold: '#C5960C' };

export default function PushPrompt({ userId }) {
  var [show, setShow] = useState(false);
  var [subscribing, setSubscribing] = useState(false);

  useEffect(function () {
    if (!isPushSupported()) return;
    if (getPushPermission() !== 'default') return;
    try {
      var dismissed = localStorage.getItem('push_prompt_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;
    } catch (e) {}
    var timer = setTimeout(function () { setShow(true); }, 3000);
    return function () { clearTimeout(timer); };
  }, []);

  function dismiss() {
    try { localStorage.setItem('push_prompt_dismissed', String(Date.now())); } catch (e) {}
    setShow(false);
  }

  async function handleEnable() {
    if (!userId) return;
    setSubscribing(true);
    var timeout = setTimeout(function () { setSubscribing(false); dismiss(); }, 5000);
    try { await subscribeToPush(userId); } catch (e) { console.error('Push error:', e); }
    clearTimeout(timeout);
    setSubscribing(false);
    dismiss();
  }

  if (!show) return null;

  return (
    <div style={{ background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #1a3a6a 100%)', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 16px rgba(11,37,69,0.15)' }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>Enable notifications?</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Get notified about new followers, comments, debate invites, and survey results.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={dismiss} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Later</button>
        <button onClick={handleEnable} disabled={subscribing} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.gold, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: subscribing ? 0.6 : 1 }}>{subscribing ? 'Enabling...' : 'Enable'}</button>
      </div>
    </div>
  );
}
