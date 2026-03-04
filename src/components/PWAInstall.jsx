// src/components/PWAInstall.jsx — Universal install prompt (Android + iOS + Desktop)
import { useState, useEffect } from 'react';

var C = { navy: '#0B2545', gold: '#C5960C', darkGold: '#A67C00', green: '#1A7A3C' };
var sans = "'DM Sans', system-ui, sans-serif";
var serif = "'Libre Baskerville', Georgia, serif";

function detectPlatform() {
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
  var isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  return { isIOS: isIOS, isAndroid: isAndroid, isSafari: isSafari, isChrome: isChrome, isStandalone: isStandalone, isMobile: isIOS || isAndroid };
}

// Share icon SVG for iOS instructions
function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: -4 }}>
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

// Plus icon for iOS "Add to Home Screen"
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: -3 }}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function PWAInstall() {
  var [deferredPrompt, setDeferredPrompt] = useState(null);
  var [showBanner, setShowBanner] = useState(false);
  var [showIOSGuide, setShowIOSGuide] = useState(false);
  var [installed, setInstalled] = useState(false);
  var [platform, setPlatform] = useState({});

  useEffect(function () {
    var p = detectPlatform();
    setPlatform(p);

    // Already installed as PWA
    if (p.isStandalone) { setInstalled(true); return; }

    // Check if user dismissed recently (24 hours)
    var dismissedAt = localStorage.getItem('pwa-dismissed-at');
    if (dismissedAt && (Date.now() - parseInt(dismissedAt)) < 86400000) return;

    // Android/Desktop Chrome — listen for native install prompt
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(function () { setShowBanner(true); }, 4000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari — show custom guide after delay
    if (p.isIOS && !p.isStandalone) {
      setTimeout(function () { setShowBanner(true); }, 4000);
    }

    // Listen for successful install
    window.addEventListener('appinstalled', function () {
      setShowBanner(false);
      setInstalled(true);
    });

    return function () { window.removeEventListener('beforeinstallprompt', handleBeforeInstall); };
  }, []);

  // Native install (Android/Desktop Chrome)
  async function handleNativeInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    var result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }

  // Dismiss for 24 hours
  function handleDismiss() {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-dismissed-at', String(Date.now()));
  }

  // Don't render anything if installed or nothing to show
  if (installed || !showBanner) return null;

  var isIOS = platform.isIOS;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998, padding: '0 12px 12px', pointerEvents: 'none' }}>
      <style>{'\
        @keyframes cvSlideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }\
        @keyframes cvPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }\
        @keyframes cvBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }\
      '}</style>

      {/* Main banner */}
      {!showIOSGuide && (
        <div style={{
          pointerEvents: 'auto',
          background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #122e56 100%)',
          borderRadius: 20, padding: '18px 20px', maxWidth: 440, margin: '0 auto',
          boxShadow: '0 12px 40px rgba(11,37,69,0.35), 0 0 0 1px rgba(197,150,12,0.15)',
          animation: 'cvSlideUp 0.4s ease both',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {/* App icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(197,150,12,0.4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: serif }}>CV</span>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px', fontFamily: sans }}>
              Get CivicVerify App
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: sans }}>
              {isIOS ? 'Add to your home screen for the best experience' : 'Install for faster access & notifications'}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={handleDismiss}
              style={{
                padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: sans,
              }}>
              Later
            </button>
            <button onClick={isIOS ? function () { setShowIOSGuide(true); } : handleNativeInstall}
              style={{
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                fontFamily: sans, boxShadow: '0 4px 12px rgba(197,150,12,0.4)',
                animation: 'cvPulse 2s ease-in-out infinite',
              }}>
              Install
            </button>
          </div>
        </div>
      )}

      {/* iOS step-by-step guide */}
      {showIOSGuide && (
        <div style={{
          pointerEvents: 'auto',
          background: '#fff', borderRadius: 24, padding: 0, maxWidth: 380, margin: '0 auto',
          boxShadow: '0 16px 50px rgba(11,37,69,0.25), 0 0 0 1px rgba(11,37,69,0.06)',
          animation: 'cvSlideUp 0.35s ease both', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '20px 22px 16px',
            background: 'linear-gradient(135deg, ' + C.navy + ', #122e56)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(197,150,12,0.4)',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: serif }}>CV</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 2px', fontFamily: sans }}>
                Install CivicVerify
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: sans }}>
                3 quick steps — takes 10 seconds
              </p>
            </div>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
              ✕
            </button>
          </div>

          {/* Steps */}
          <div style={{ padding: '20px 22px 22px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: C.gold,
              }}>1</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '4px 0 4px', fontFamily: sans }}>
                  Tap the Share button <ShareIcon />
                </p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: 0, lineHeight: 1.5 }}>
                  At the bottom of Safari (or top on iPad)
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: C.gold,
              }}>2</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '4px 0 4px', fontFamily: sans }}>
                  Scroll and tap <PlusIcon /> Add to Home Screen
                </p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: 0, lineHeight: 1.5 }}>
                  You may need to scroll down in the share menu
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: C.gold + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: C.gold,
              }}>3</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '4px 0 4px', fontFamily: sans }}>
                  Tap "Add" to confirm
                </p>
                <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.45)', margin: 0, lineHeight: 1.5 }}>
                  CivicVerify will appear on your home screen like a real app!
                </p>
              </div>
            </div>

            {/* Arrow pointing down to share button */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <div style={{ animation: 'cvBounce 1.5s ease-in-out infinite', display: 'inline-block' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0', fontFamily: sans }}>
                Look for the share button below
              </p>
            </div>

            {/* Dismiss */}
            <button onClick={handleDismiss}
              style={{
                width: '100%', padding: '10px', borderRadius: 10,
                border: '1px solid rgba(11,37,69,0.08)', background: 'rgba(11,37,69,0.03)',
                color: 'rgba(11,37,69,0.4)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: sans, marginTop: 6,
              }}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Install Card (export for use in Dashboard) ─────────────────
export function InstallAppCard() {
  var [platform, setPlatform] = useState({});
  var [deferredPrompt, setDeferredPrompt] = useState(null);
  var [installed, setInstalled] = useState(false);
  var [showSteps, setShowSteps] = useState(false);

  useEffect(function () {
    var p = detectPlatform();
    setPlatform(p);
    if (p.isStandalone) { setInstalled(true); return; }

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return function () { window.removeEventListener('beforeinstallprompt', handleBeforeInstall); };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      var result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    } else if (platform.isIOS) {
      setShowSteps(true);
    }
  }

  // Already installed — show success state
  if (installed) {
    return (
      <div style={{
        background: C.green + '08', borderRadius: 14, padding: '18px 20px',
        border: '1px solid ' + C.green + '20',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>App Installed</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #122e56 100%)',
      borderRadius: 14, padding: '20px', overflow: 'hidden', position: 'relative',
    }}>
      {/* Decorative glow */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: C.gold + '15', filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(197,150,12,0.3)',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: serif }}>CV</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 2px', fontFamily: sans }}>Get the App</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0, fontFamily: sans }}>
              {platform.isIOS ? 'Add to your home screen' : 'Install for quick access'}
            </p>
          </div>
        </div>

        {!showSteps ? (
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {['Faster loading', 'Push notifications', 'Works offline'].map(function (perk) {
                return (
                  <span key={perk} style={{
                    fontSize: 10, fontWeight: 600, color: C.gold, padding: '4px 10px',
                    borderRadius: 8, background: C.gold + '15', fontFamily: sans,
                  }}>
                    ✓ {perk}
                  </span>
                );
              })}
            </div>

            <button onClick={handleInstall}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, ' + C.gold + ', ' + C.darkGold + ')',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: sans, boxShadow: '0 4px 16px rgba(197,150,12,0.35)',
              }}>
              {platform.isIOS ? 'Show Me How' : 'Install Now'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              {[
                { num: '1', text: 'Tap the Share button at the bottom of Safari', icon: ShareIcon },
                { num: '2', text: 'Scroll down and tap "Add to Home Screen"', icon: PlusIcon },
                { num: '3', text: 'Tap "Add" to confirm', icon: null },
              ].map(function (step) {
                return (
                  <div key={step.num} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: C.gold + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: C.gold,
                    }}>{step.num}</span>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: sans, lineHeight: 1.4 }}>
                      {step.text}
                    </p>
                  </div>
                );
              })}
            </div>
            <button onClick={function () { setShowSteps(false); }}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: sans,
              }}>
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
