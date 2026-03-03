// src/components/ShareButton.jsx
// Universal share component for surveys, debates, community posts, profiles
import { useState, useEffect, useRef } from 'react';

var C = { navy: '#0B2545', gold: '#C5960C', green: '#16a34a' };

export default function ShareButton({ type, id, title, style, size }) {
  var [open, setOpen] = useState(false);
  var [copied, setCopied] = useState(false);
  var ref = useRef(null);
  size = size || 'md';

  var base = window.location.origin;
  var urlMap = {
    survey: base + '/citizen/surveys/' + id,
    poll: base + '/citizen/surveys/' + id,
    debate: base + '/citizen/debates/' + id,
    post: base + '/citizen/community?post=' + id,
    profile: base + '/citizen/profile/' + id,
    general: base,
  };
  var shareUrl = urlMap[type] || base;
  var shareText = title
    ? title + ' \u2014 CivicVerify'
    : 'Check out CivicVerify \u2014 where verified citizens shape civic decisions';

  useEffect(function() {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, [open]);

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title: shareText, url: shareUrl }).catch(function() {});
      setOpen(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl).then(function() {
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2000);
    });
  }

  function handleTwitter() {
    var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl);
    window.open(url, '_blank', 'width=600,height=400');
    setOpen(false);
  }

  function handleFacebook() {
    var url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl);
    window.open(url, '_blank', 'width=600,height=400');
    setOpen(false);
  }

  function handleSMS() {
    var body = shareText + ' ' + shareUrl;
    window.open('sms:?body=' + encodeURIComponent(body));
    setOpen(false);
  }

  function handleShare() {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      handleNativeShare();
    } else {
      setOpen(!open);
    }
  }

  var isSm = size === 'sm';

  var btnStyle = Object.assign({
    display: 'inline-flex', alignItems: 'center', gap: isSm ? 4 : 6,
    padding: isSm ? '5px 10px' : '7px 14px',
    background: 'rgba(11,37,69,0.04)',
    border: '1px solid rgba(11,37,69,0.08)',
    borderRadius: isSm ? 7 : 9,
    fontSize: isSm ? 11 : 12,
    fontWeight: 600, color: 'rgba(11,37,69,0.5)',
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.15s', position: 'relative',
  }, style || {});

  var shareIcon = (
    <svg width={isSm ? 12 : 14} height={isSm ? 12 : 14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="4" cy="8" r="2.5"/><line x1="6.2" y1="9.1" x2="9.8" y2="10.9"/><line x1="6.2" y1="6.9" x2="9.8" y2="5.1"/>
    </svg>
  );

  var options = [
    { label: copied ? 'Copied!' : 'Copy Link', icon: copied ? '\u2705' : '\uD83D\uDD17', action: handleCopyLink, highlight: copied },
    { label: 'X / Twitter', icon: '\uD83D\uDC26', action: handleTwitter },
    { label: 'Facebook', icon: '\uD83D\uDCF1', action: handleFacebook },
    { label: 'SMS / Text', icon: '\uD83D\uDCAC', action: handleSMS },
  ];

  if (navigator.share) {
    options.push({ label: 'More...', icon: '\u00B7\u00B7\u00B7', action: handleNativeShare });
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={handleShare} style={btnStyle}>
        {shareIcon}
        {!isSm && <span>Share</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 100,
          background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.08)',
          boxShadow: '0 8px 32px rgba(11,37,69,0.12), 0 2px 8px rgba(11,37,69,0.06)',
          padding: '6px', minWidth: 180, animation: 'shareIn 0.15s ease',
        }}>
          <style>{'@keyframes shareIn{from{opacity:0;transform:translateY(-4px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}'}</style>

          <div style={{
            padding: '8px 10px', marginBottom: 4, borderRadius: 8,
            background: 'rgba(11,37,69,0.03)', border: '1px solid rgba(11,37,69,0.05)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,37,69,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Share link</p>
            <p style={{ fontSize: 11, color: C.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</p>
          </div>

          {options.map(function(opt, i) {
            return (
              <button key={i} onClick={opt.action} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 10px', border: 'none', borderRadius: 8,
                background: opt.highlight ? 'rgba(22,163,74,0.06)' : 'transparent',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                fontSize: 13, fontWeight: 500, color: opt.highlight ? C.green : C.navy,
                textAlign: 'left', transition: 'background 0.1s',
              }}>
                <span style={{ width: 20, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
