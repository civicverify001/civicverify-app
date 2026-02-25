// fix-landing.js — Run with: node fix-landing.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'public', 'Landing.jsx');
let c = fs.readFileSync(file, 'utf8');

// === FIX 1: Encoding artifacts ===
c = c.replace(/ΓÇö/g, '\u2014');
c = c.replace(/┬╖/g, '\u00b7');

// === FIX 2: Hero trust badges — replace dangerouslySetInnerHTML ===
const oldTrust = `].map(function (x, i) {
                    return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span dangerouslySetInnerHTML={{ __html: x.icon }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)', fontFamily: body, letterSpacing: '0.02em' }}>{x.t}</span></div>;
                  })}`;
const newTrust = `].map(function (x, i) {
                    var icons = [
                      <svg key="i0" width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/></svg>,
                      <svg key="i1" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/></svg>,
                      <svg key="i2" width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/></svg>,
                    ];
                    return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icons[i]}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)', fontFamily: body, letterSpacing: '0.02em' }}>{x.t}</span></div>;
                  })}`;
c = c.replace(oldTrust, newTrust);

// Remove the icon properties from trust badge data (they had HTML strings)
c = c.replace(
  /\{ t: 'Identity Verified', icon: '<svg[^']*>' \}/,
  "{ t: 'Identity Verified' }"
);
c = c.replace(
  /\{ t: 'Real Citizens Only', icon: '<svg[^']*>' \}/,
  "{ t: 'Real Citizens Only' }"
);
c = c.replace(
  /\{ t: 'End-to-End Encrypted', icon: '<svg[^']*>' \}/,
  "{ t: 'End-to-End Encrypted' }"
);

// === FIX 3: How It Works steps — replace dangerouslySetInnerHTML ===
// Replace the icon data + rendering
c = c.replace(
  /color: '#60a5fa', icon: '<svg[^']*>' \}/,
  "color: '#60a5fa' }"
);
c = c.replace(
  /color: '#34d399', icon: '<svg[^']*>' \}/,
  "color: '#34d399' }"
);
c = c.replace(
  /color: '#c084fc', icon: '<svg[^']*>' \}/,
  "color: '#c084fc' }"
);
c = c.replace(
  `border: '1px solid ' + item.color + '15' }} dangerouslySetInnerHTML={{ __html: item.icon }} />`,
  `border: '1px solid ' + item.color + '15' }}>
                      {i === 0 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="#60a5fa" strokeWidth="2"/><path d="M22 21v-2a4 4 0 00-3-3.87" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/></svg>}
                      {i === 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="18" height="18" rx="3" stroke="#34d399" strokeWidth="2"/></svg>}
                      {i === 2 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                    </div>`
);

// === FIX 4: Org features — replace dangerouslySetInnerHTML ===
c = c.replace(
  /\{ t: 'Targeted Surveys'[^}]*icon: '[^']*' \}/,
  "{ t: 'Targeted Surveys', d: 'Reach citizens by age, location, and demographics' }"
);
c = c.replace(
  /\{ t: 'Real-Time Analytics'[^}]*icon: '[^']*' \}/,
  "{ t: 'Real-Time Analytics', d: 'Watch responses come in with live dashboards' }"
);
c = c.replace(
  /\{ t: 'Verified Respondents'[^}]*icon: '[^']*' \}/,
  "{ t: 'Verified Respondents', d: 'Every response from an identity-verified citizen' }"
);
c = c.replace(
  /\{ t: 'Export & Report'[^}]*icon: '[^']*' \}/,
  "{ t: 'Export & Report', d: 'Download data in CSV\\/PDF for analysis' }"
);
c = c.replace(
  `alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: item.icon }} />`,
  `alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i === 0 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={C.gold} strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke={C.gold} strokeWidth="2" opacity="0.5"/><circle cx="12" cy="12" r="2" fill={C.gold}/></svg>}
                        {i === 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/></svg>}
                        {i === 2 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={C.gold} strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {i === 3 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={C.gold} strokeWidth="2"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/></svg>}
                      </div>`
);

// === FIX 5: Footer company links — make them clickable ===
c = c.replace(
  `{['About', 'Privacy', 'Terms', 'Contact'].map(function (t) { return <span key={t} style={{ display: 'block', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.35)', fontFamily: body }}>{t}</span>; })}`,
  `{[{ t: 'About', a: '/about' }, { t: 'Privacy', a: '/privacy' }, { t: 'Terms', a: '/terms' }, { t: 'Contact', a: '/contact' }].map(function (link) { return <button key={link.t} onClick={function () { navigate(link.a); }} style={{ display: 'block', background: 'none', border: 'none', padding: '4px 0', fontSize: 13, color: 'rgba(11,37,69,0.4)', cursor: 'pointer', fontFamily: body }}>{link.t}</button>; })}`
);

// === Verify fixes ===
const dshCount = (c.match(/dangerouslySetInnerHTML/g) || []).length;
const badStroke = (c.match(/stroke-width/g) || []).length;
const goodStroke = (c.match(/strokeWidth/g) || []).length;
const badEnc = (c.match(/ΓÇö/g) || []).length;

fs.writeFileSync(file, c, 'utf8');

console.log('✅ Landing.jsx fixed!');
console.log(`   dangerouslySetInnerHTML remaining: ${dshCount} (should be 0)`);
console.log(`   stroke-width (HTML) remaining: ${badStroke} (should be 0)`);
console.log(`   strokeWidth (JSX) count: ${goodStroke}`);
console.log(`   Encoding artifacts remaining: ${badEnc} (should be 0)`);
