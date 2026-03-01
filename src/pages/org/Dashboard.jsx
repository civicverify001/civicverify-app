// src/pages/org/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';
var gold = '#C5960C';
var goldLight = '#F0B429';
var navy = '#0B2545';
var blueMid = '#1e3a6e';
var blue = '#1a4a8a';

var VALUES = [
  { icon: '🛡️', accent: '#F0B429', bg: 'linear-gradient(140deg, #1a1500, #0a1628)', border: 'rgba(240,180,41,0.25)', title: 'Verified Authenticity', body: 'Every respondent is identity-verified through Didit. No bots, no duplicates — only credentialed citizens.' },
  { icon: '🔒', accent: '#60a5fa', bg: 'linear-gradient(140deg, #001533, #0a1628)', border: 'rgba(96,165,250,0.25)', title: 'Privacy by Design', body: 'All responses are anonymized before delivery. You receive powerful insights, never personal data.' },
  { icon: '⚖️', accent: '#34d399', bg: 'linear-gradient(140deg, #001a10, #0a1628)', border: 'rgba(52,211,153,0.25)', title: 'Editorial Integrity', body: 'Every survey undergoes review before distribution. We reject push polls and misleading questions.' },
  { icon: '🌐', accent: '#f472b6', bg: 'linear-gradient(140deg, #1a0015, #0a1628)', border: 'rgba(244,114,182,0.25)', title: 'True Representation', body: 'Our verified network spans demographics, geographies, and affiliations — real America, not a curated sample.' },
];

var HOW = [
  { num: '01', color: gold, title: 'Commission Your Survey', body: 'Define your questions, target demographic, and response volume. Our editorial team reviews and approves within 24 hours.' },
  { num: '02', color: '#60a5fa', title: 'Citizens Respond', body: 'Identity-verified citizens on the CivicVerify network complete your survey. Every response is authenticated in real time.' },
  { num: '03', color: '#34d399', title: 'Receive Deep Insights', body: 'Access aggregated results, demographic breakdowns, trend charts, and exportable data — all in your secure dashboard.' },
];

var PRICING = [
  { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50', highlight: true },
  { tier: 'Basic Targeting', desc: '1–2 demographic filters', price: '$4.50' },
  { tier: 'Refined Targeting', desc: '3–4 demographic filters', price: '$5.50' },
  { tier: 'Precision Targeting', desc: '5+ demographic filters', price: '$7.00' },
  { tier: 'Geo Micro-Target', desc: 'City / ZIP level add-on', price: '+$1.00', accent: '#60a5fa' },
];

function useCountUp(target, duration, trigger) {
  var [val, setVal] = useState(0);
  var raf = useRef(null);
  useEffect(function() {
    if (!trigger || !target) return;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return function() { cancelAnimationFrame(raf.current); };
  }, [target, trigger]);
  return val;
}

function ArcStat({ value, max, color, label, trigger, onStart }) {
  var r = 48, sw = 5;
  var circ = 2 * Math.PI * r;
  var pct = (value && max) ? Math.min(value / max, 1) : 0;
  var animated = useCountUp(value, 1800, trigger);
  var isEmpty = !value || value === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: r*2+sw*2+8, height: r*2+sw*2+8 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${r*2+16} ${r*2+16}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={r+8} cy={r+8} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
          {!isEmpty && (
            <circle cx={r+8} cy={r+8} r={r} fill="none" stroke={color} strokeWidth={sw}
              strokeDasharray={trigger ? `${pct*circ} ${circ}` : `0 ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}70)` }} />
          )}
          {isEmpty && (
            <circle cx={r+8} cy={r+8} r={r} fill="none" stroke={color} strokeWidth={sw}
              strokeDasharray={`${0.06*circ} ${circ}`} strokeLinecap="round" style={{ opacity: 0.3 }} />
          )}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {isEmpty ? (
            <>
              <span style={{ fontSize: 18, lineHeight: 1 }}>✨</span>
              <span style={{ fontSize: 9, color: color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center', maxWidth: 60 }}>Get started</span>
            </>
          ) : (
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: font, lineHeight: 1 }}>
              {animated >= 1000 ? (animated/1000).toFixed(1)+'k' : animated}
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</div>
        {isEmpty && onStart && (
          <button onClick={onStart}
            style={{ marginTop: 4, fontSize: 9, color: color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', padding: 0 }}>
            Request now
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrgDashboard() {
  var navigate = useNavigate();
  var { profile } = useAuth();
  var [stats, setStats] = useState({ surveys: 0, responses: 0, citizens: 0 });
  var [orgStats, setOrgStats] = useState({ mySurveys: 0 });
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    var t = setTimeout(function() { setVisible(true); }, 80);
    return function() { clearTimeout(t); };
  }, []);

  useEffect(function() {
    if (!profile) return;
    async function load() {
      try {
        var [sRes, rRes, cRes, myS] = await Promise.all([
          supabase.from('surveys').select('id', { count: 'exact', head: true }),
          supabase.from('survey_responses').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'citizen'),
          supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('org_id', profile.id),
        ]);
        setStats({ surveys: sRes.count || 0, responses: rRes.count || 0, citizens: cRes.count || 0 });
        setOrgStats({ mySurveys: myS.count || 0 });
      } catch (e) {
        setStats({ surveys: 0, responses: 0, citizens: 0 });
      }
    }
    load();
  }, [profile]);

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid ' + gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: sans, color: '#fff', margin: '0 -24px', paddingBottom: 32 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:0.25;} 50%{opacity:0.55;} }
        @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-7px);} }
        .cv-btn { transition: all 0.2s ease; cursor: pointer; }
        .cv-btn:hover { transform: translateY(-2px); filter: brightness(1.12); }
        .cv-card { transition: transform 0.2s ease; }
        .cv-card:hover { transform: translateY(-2px); }
        @media(max-width:900px) {
          .two-col { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .hero-inner { flex-direction: column !important; }
          .hero-pills { flex-direction: row !important; flex-wrap: wrap; }
          .hero-pad { padding: 28px 20px !important; }
          .body-pad { padding: 20px 16px 0 !important; }
          .arcs-row { gap: 12px !important; }
          .cta-inner { flex-direction: column !important; align-items: flex-start !important; }
          .val-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:480px) {
          .val-grid { grid-template-columns: 1fr !important; }
          .hero-pills { flex-direction: column !important; }
          .arcs-row { gap: 8px !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(140deg, ${navy} 0%, ${blue} 60%, #0f3060 100%)`,
        borderBottom: `3px solid ${gold}`,
        opacity: visible ? 1 : 0,
        animation: visible ? 'fadeUp 0.5s ease forwards' : 'none',
      }}>
        {/* Rings */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 480, height: 480, pointerEvents: 'none' }}>
          <svg width="480" height="480" viewBox="0 0 480 480">
            {[70,110,150,190,230,270].map(function(r, i) {
              return <circle key={i} cx="240" cy="240" r={r} fill="none"
                stroke={i % 2 === 0 ? gold : '#60a5fa'} strokeWidth="0.8"
                style={{ opacity: 0.1 - i*0.012, animation: `pulse ${3+i*0.7}s ease-in-out infinite`, animationDelay: i*0.35+'s' }} />;
            })}
          </svg>
        </div>
        {/* Particles */}
        {[{x:'7%',y:'22%',c:gold},{x:'20%',y:'78%',c:'#60a5fa'},{x:'48%',y:'12%',c:gold},{x:'65%',y:'70%',c:'#34d399'},{x:'85%',y:'28%',c:'#f472b6'}].map(function(d,i){
          return <div key={i} style={{ position:'absolute', left:d.x, top:d.y, width:3+i%2, height:3+i%2,
            borderRadius:'50%', background:d.c, opacity:0.5,
            animation:`float ${2.4+i*0.5}s ease-in-out infinite`, animationDelay:i*0.2+'s' }} />;
        })}

        <div className="hero-pad" style={{ padding:'44px 40px', position:'relative', zIndex:1 }}>
          <div className="hero-inner" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:28 }}>
            {/* Left */}
            <div style={{ flex:'1 1 360px', minWidth:0 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8,
                background:'rgba(197,150,12,0.12)', border:`1px solid rgba(197,150,12,0.3)`,
                borderRadius:20, padding:'5px 14px', marginBottom:18 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e' }} />
                <span style={{ fontSize:11, fontWeight:700, color:gold, textTransform:'uppercase', letterSpacing:1.5 }}>Verified Organization</span>
              </div>
              <h1 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:700, color:'#fff', margin:'0 0 8px', fontFamily:font, lineHeight:1.15 }}>
                Welcome back,<br />
                <span style={{ color:goldLight }}>{profile.org_name || profile.full_name}</span>
              </h1>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', margin:'0 0 28px', maxWidth:460, lineHeight:1.65 }}>
                Commission identity-verified civic surveys. Real citizens, real data, real decisions.
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button className="cv-btn" onClick={function(){ navigate('/org/request'); }}
                  style={{ padding:'13px 26px', background:`linear-gradient(135deg, ${gold}, ${goldLight})`,
                    color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
                    boxShadow:`0 4px 20px rgba(197,150,12,0.4)`, display:'flex', alignItems:'center', gap:8 }}>
                  📋 Request a Survey
                </button>
                <button className="cv-btn" onClick={function(){ navigate('/org/surveys'); }}
                  style={{ padding:'13px 26px', background:'rgba(255,255,255,0.09)',
                    color:'#fff', border:'1px solid rgba(255,255,255,0.18)', borderRadius:12,
                    fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  📊 View Results
                </button>
              </div>
            </div>

            {/* Right — stat pills */}
            <div className="hero-pills" style={{ display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
              {[
                { label:'Platform Citizens', val: stats.citizens >= 1000 ? (stats.citizens/1000).toFixed(1)+'k' : stats.citizens || '—', color:gold, icon:'👥' },
                { label:'Surveys Completed', val: stats.surveys || '—', color:'#60a5fa', icon:'📋' },
                { label:'Total Responses', val: stats.responses >= 1000 ? (stats.responses/1000).toFixed(1)+'k' : stats.responses || '—', color:'#34d399', icon:'✅' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14,
                    background:'rgba(255,255,255,0.06)', border:`1px solid ${s.color}25`,
                    borderRadius:14, padding:'13px 20px', backdropFilter:'blur(8px)', minWidth:200 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:font, lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="body-pad" style={{ padding:'24px 32px 0', maxWidth:1400, margin:'0 auto' }}>

        {/* ── STATS + ACCOUNT ── */}
        <div className="two-col" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18,
          opacity:visible?1:0, animation:visible?'fadeUp 0.5s ease 0.1s forwards':'none',
        }}>
          {/* Arc card */}
          <div className="cv-card" style={{
            background:`linear-gradient(140deg, ${blueMid}, ${navy})`,
            border:'1px solid rgba(96,165,250,0.15)', borderRadius:20, padding:'28px 24px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 24px' }}>Platform Activity</p>
            <div className="arcs-row" style={{ display:'flex', justifyContent:'space-around', alignItems:'center', gap:8 }}>
              <ArcStat value={stats.citizens} max={Math.max(stats.citizens,5000)} color={gold} label="Citizens" trigger={visible} onStart={function(){ navigate('/org/request'); }} />
              <ArcStat value={stats.surveys} max={Math.max(stats.surveys,100)} color="#60a5fa" label="Surveys" trigger={visible} onStart={function(){ navigate('/org/request'); }} />
              <ArcStat value={stats.responses} max={Math.max(stats.responses,20000)} color="#34d399" label="Responses" trigger={visible} onStart={function(){ navigate('/org/request'); }} />
            </div>
          </div>

          {/* Account card */}
          <div className="cv-card" style={{
            background:`linear-gradient(140deg, #0f2d4a, ${navy})`,
            border:`1px solid rgba(197,150,12,0.15)`, borderRadius:20, padding:'28px 24px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 22px' }}>Your Account</p>
            <div style={{ display:'grid', gap:18 }}>
              {[
                { label:'Account Status', val:'Approved ✓', valColor:'#22c55e', barColor:'#22c55e', barPct:100 },
                { label:'Surveys Commissioned', val: String(orgStats.mySurveys), valColor:'#fff', barColor:gold, barPct: Math.min(orgStats.mySurveys*10,100) },
                { label:'Base Rate', val:'$3.50/response', valColor:gold, barColor:'#60a5fa', barPct:50 },
              ].map(function(row, i) {
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{row.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:row.valColor,
                        ...(row.label==='Account Status' ? { background:'rgba(34,197,94,0.12)', padding:'2px 10px', borderRadius:10 } : {}) }}>
                        {row.val}
                      </span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width: visible ? row.barPct+'%' : '0%', background:row.barColor,
                        borderRadius:2, transition:`width 1.5s cubic-bezier(0.4,0,0.2,1) ${i*0.2+0.3}s`,
                        boxShadow:`0 0 6px ${row.barColor}80` }} />
                    </div>
                  </div>
                );
              })}
              {orgStats.mySurveys === 0 && (
                <div style={{ marginTop:4, padding:'12px 14px', background:'rgba(197,150,12,0.07)',
                  border:'1px dashed rgba(197,150,12,0.25)', borderRadius:10, textAlign:'center' }}>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:'0 0 8px' }}>No surveys yet — commission your first one</p>
                  <button className="cv-btn" onClick={function(){ navigate('/org/request'); }}
                    style={{ padding:'7px 16px', background:`linear-gradient(135deg,${gold},${goldLight})`,
                      color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700 }}>
                    Get Started →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="cv-card" style={{
          background:`linear-gradient(135deg, ${blueMid}, #0a1e38)`,
          border:'1px solid rgba(96,165,250,0.12)', borderRadius:20, padding:'32px 28px', marginBottom:18,
          opacity:visible?1:0, animation:visible?'fadeUp 0.5s ease 0.2s forwards':'none',
          boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
            <div style={{ width:3, height:22, background:`linear-gradient(180deg,${gold},${goldLight})`, borderRadius:2 }} />
            <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>How It Works</h2>
          </div>
          <div className="how-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {HOW.map(function(step, i) {
              return (
                <div key={i} style={{ display:'flex', gap:14 }}>
                  <div style={{ flexShrink:0, width:42, height:42, borderRadius:11,
                    background:`${step.color}15`, border:`1px solid ${step.color}35`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:13, fontWeight:800, color:step.color, fontFamily:font }}>{step.num}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', margin:'0 0 5px', fontFamily:font }}>{step.title}</h3>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', margin:0, lineHeight:1.75 }}>{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── VALUES + PRICING ── */}
        <div className="two-col" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18,
          opacity:visible?1:0, animation:visible?'fadeUp 0.5s ease 0.3s forwards':'none',
        }}>
          {/* Values */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:22, background:'linear-gradient(180deg,#60a5fa,#3b82f6)', borderRadius:2 }} />
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>Our Commitments</h2>
            </div>
            <div className="val-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {VALUES.map(function(v, i) {
                return (
                  <div key={i} className="cv-card" style={{
                    background: v.bg,
                    border:`1px solid ${v.border}`,
                    borderRadius:16, padding:'20px 18px',
                    boxShadow:`0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 ${v.border}`,
                  }}>
                    <div style={{ fontSize:26, marginBottom:10 }}>{v.icon}</div>
                    <div style={{ width:28, height:3, background:v.accent, borderRadius:2, marginBottom:10, boxShadow:`0 0 8px ${v.accent}80` }} />
                    <h3 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 7px', fontFamily:font }}>{v.title}</h3>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', margin:0, lineHeight:1.75 }}>{v.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:22, background:'linear-gradient(180deg,#34d399,#10b981)', borderRadius:2 }} />
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>Pricing Schedule</h2>
            </div>
            <div className="cv-card" style={{
              background:`linear-gradient(140deg, ${blueMid}, #0a1e38)`,
              border:'1px solid rgba(52,211,153,0.12)', borderRadius:20, padding:'20px',
              boxShadow:'0 8px 32px rgba(0,0,0,0.2)', height:'calc(100% - 38px)', boxSizing:'border-box',
            }}>
              <div style={{ display:'grid', gap:3 }}>
                {PRICING.map(function(row, i) {
                  return (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'11px 14px', borderRadius:10,
                      background: row.highlight ? 'rgba(197,150,12,0.1)' : 'rgba(255,255,255,0.025)',
                      border: row.highlight ? `1px solid rgba(197,150,12,0.25)` : '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                          background: row.highlight ? gold : row.accent || 'rgba(255,255,255,0.15)',
                          boxShadow: row.highlight ? `0 0 6px ${gold}` : row.accent ? `0 0 4px ${row.accent}` : 'none' }} />
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color: row.highlight ? '#fff' : 'rgba(255,255,255,0.8)' }}>{row.tier}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{row.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:15, fontWeight:800, fontFamily:font,
                        color: row.highlight ? gold : 'rgba(255,255,255,0.55)' }}>{row.price}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', margin:'14px 0 0', lineHeight:1.7 }}>
                Invoices issued upon completion or monthly. Payment due 30 days. USD excl. taxes.
              </p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div style={{
          background:`linear-gradient(135deg, #0a1e38 0%, ${blueMid} 50%, #0d2545 100%)`,
          border:`1px solid rgba(197,150,12,0.3)`,
          borderRadius:20, padding:'32px',
          boxShadow:`0 0 0 1px rgba(197,150,12,0.08), 0 16px 48px rgba(0,0,0,0.4)`,
          opacity:visible?1:0, animation:visible?'fadeUp 0.5s ease 0.4s forwards':'none',
        }}>
          <div className="cta-inner" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 300px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:12,
                background:'rgba(197,150,12,0.1)', border:'1px solid rgba(197,150,12,0.2)',
                borderRadius:20, padding:'4px 12px' }}>
                <span style={{ fontSize:11 }}>🚀</span>
                <span style={{ fontSize:10, fontWeight:700, color:gold, textTransform:'uppercase', letterSpacing:1.2 }}>Ready to launch</span>
              </div>
              <h3 style={{ fontSize:22, fontWeight:700, color:'#fff', margin:'0 0 8px', fontFamily:font }}>Commission your first survey today</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0, lineHeight:1.65 }}>
                Results typically delivered within 3–7 business days.<br />
                Our editorial team reviews every submission before distribution.
              </p>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', flexShrink:0 }}>
              <button className="cv-btn" onClick={function(){ navigate('/org/request'); }}
                style={{ padding:'14px 28px', background:`linear-gradient(135deg, ${gold}, ${goldLight})`,
                  color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
                  boxShadow:`0 4px 24px rgba(197,150,12,0.4)`, whiteSpace:'nowrap' }}>
                📋 Request a Survey →
              </button>
              <button className="cv-btn" onClick={function(){ navigate('/org/surveys'); }}
                style={{ padding:'14px 22px', background:'rgba(255,255,255,0.08)',
                  color:'rgba(255,255,255,0.85)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12,
                  fontSize:14, fontWeight:600, whiteSpace:'nowrap' }}>
                📊 My Surveys
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
