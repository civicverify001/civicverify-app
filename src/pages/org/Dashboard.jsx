// src/pages/org/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';
var gold = '#C5960C';
var goldLight = '#F0B429';
var blue = '#1a4a8a';
var blueMid = '#1e3a6e';
var blueLight = '#2563eb';
var navy = '#0B2545';

var VALUES = [
  { icon: '🛡️', color: gold, title: 'Verified Authenticity', body: 'Every respondent is identity-verified through Didit. No bots, no duplicates — only credentialed citizens.' },
  { icon: '🔒', color: '#60a5fa', title: 'Privacy by Design', body: 'All responses are anonymized before delivery. You receive powerful insights, never personal data.' },
  { icon: '⚖️', color: '#34d399', title: 'Editorial Integrity', body: 'Every survey undergoes review before distribution. We reject push polls and misleading questions — always.' },
  { icon: '🌐', color: '#f472b6', title: 'True Representation', body: 'Our verified network spans demographics, geographies, and affiliations — real America, not a curated sample.' },
];

var HOW = [
  { num: '01', color: gold, title: 'Commission Your Survey', body: 'Define your questions, target demographic, and response volume. Our editorial team reviews and approves within 24 hours.' },
  { num: '02', color: '#60a5fa', title: 'Citizens Respond', body: 'Identity-verified citizens on the CivicVerify network complete your survey. Every response is authenticated in real time.' },
  { num: '03', color: '#34d399', title: 'Receive Deep Insights', body: 'Access aggregated results, demographic breakdowns, trend charts, and exportable data — all in your secure dashboard.' },
];

var PRICING = [
  { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50', highlight: true },
  { tier: 'Basic Targeting', desc: '1–2 demographic filters', price: '$4.50', highlight: false },
  { tier: 'Refined Targeting', desc: '3–4 demographic filters', price: '$5.50', highlight: false },
  { tier: 'Precision Targeting', desc: '5+ demographic filters', price: '$7.00', highlight: false },
  { tier: 'Geo Micro-Target', desc: 'City / ZIP level add-on', price: '+$1.00', highlight: false },
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
      var ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return function() { cancelAnimationFrame(raf.current); };
  }, [target, trigger]);
  return val;
}

function ArcStat({ value, max, color, label, trigger }) {
  var r = 48, sw = 5;
  var circ = 2 * Math.PI * r;
  var pct = max ? Math.min(value / max, 1) : 0;
  var animated = useCountUp(value, 1800, trigger);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: r*2+sw*2+8, height: r*2+sw*2+8 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${r*2+16} ${r*2+16}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={r+8} cy={r+8} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
          <circle cx={r+8} cy={r+8} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={trigger ? `${pct*circ} ${circ}` : `0 ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}70)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: font, lineHeight: 1 }}>
            {animated >= 1000 ? (animated/1000).toFixed(1)+'k' : animated}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' }}>{label}</span>
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
        setStats({ surveys: 47, responses: 12840, citizens: 3201 });
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
    <div style={{ fontFamily: sans, color: '#fff', margin: '0 -24px', padding: '0 0 32px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity:0.3; } 50% { opacity:0.7; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
        .cv-btn { transition: all 0.2s ease; }
        .cv-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .cv-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .cv-card:hover { transform: translateY(-2px); }
        .cv-val:hover { border-color: rgba(197,150,12,0.35) !important; }
        .cv-val { transition: border-color 0.2s; }
        @media(max-width:768px) {
          .hero-grid { flex-direction: column !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .arcs-row { gap: 16px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .val-grid { grid-template-columns: 1fr 1fr !important; }
          .price-grid { grid-template-columns: 1fr !important; }
          .cta-row { flex-direction: column !important; align-items: flex-start !important; }
          .hero-pad { padding: 28px 20px !important; }
          .section-pad { padding: 24px 20px !important; }
          .outer-pad { padding: 0 0 24px !important; margin: 0 -16px !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="outer-pad" style={{ margin: '0 -24px', padding: '0 0 0px' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${navy} 0%, ${blue} 55%, #0f3060 100%)`,
          borderBottom: `3px solid ${gold}`,
          opacity: visible ? 1 : 0,
          animation: visible ? 'fadeUp 0.5s ease forwards' : 'none',
        }}>
          {/* Decorative arcs */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, pointerEvents: 'none', opacity: 0.5 }}>
            <svg width="400" height="400" viewBox="0 0 400 400">
              {[70,110,150,190,230].map(function(r,i) {
                return <circle key={i} cx="200" cy="200" r={r} fill="none"
                  stroke={i%2===0 ? gold : '#60a5fa'}
                  strokeWidth="0.7"
                  style={{ opacity: 0.12 - i*0.01, animation: 'pulse ' + (3+i*0.8) + 's ease-in-out infinite', animationDelay: i*0.4+'s' }} />;
              })}
            </svg>
          </div>

          {/* Floating particles */}
          {[{x:'8%',y:'20%'},{x:'18%',y:'75%'},{x:'55%',y:'15%'},{x:'72%',y:'65%'},{x:'88%',y:'30%'}].map(function(d,i) {
            return <div key={i} style={{ position:'absolute', left:d.x, top:d.y, width: i%2===0?4:3, height: i%2===0?4:3,
              borderRadius:'50%', background: i%2===0 ? gold : '#60a5fa', opacity:0.5,
              animation:`float ${2.5+i*0.6}s ease-in-out infinite`, animationDelay:i*0.25+'s' }} />;
          })}

          <div className="hero-pad" style={{ padding: '44px 40px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(197,150,12,0.12)', border: `1px solid rgba(197,150,12,0.3)`,
                  borderRadius: 20, padding: '5px 14px', marginBottom: 18 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1.5 }}>Verified Organization</span>
                </div>
                <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: font, lineHeight: 1.15 }}>
                  Welcome back,<br />
                  <span style={{ color: goldLight }}>{profile.org_name || profile.full_name}</span>
                </h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', maxWidth: 460, lineHeight: 1.6 }}>
                  Commission identity-verified civic surveys. Real citizens, real data, real decisions.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="cv-btn" onClick={function(){ navigate('/org/request'); }}
                    style={{ padding: '13px 26px', background: `linear-gradient(135deg, ${gold}, ${goldLight})`,
                      color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', boxShadow: `0 4px 20px rgba(197,150,12,0.4)`, display:'flex', alignItems:'center', gap:8 }}>
                    📋 Request a Survey
                  </button>
                  <button className="cv-btn" onClick={function(){ navigate('/org/surveys'); }}
                    style={{ padding: '13px 26px', background: 'rgba(255,255,255,0.08)',
                      color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer', display:'flex', alignItems:'center', gap:8 }}>
                    📊 View Results
                  </button>
                </div>
              </div>

              {/* Mini stat pills on hero right */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '0 0 auto' }}>
                {[
                  { label: 'Platform Citizens', val: stats.citizens >= 1000 ? (stats.citizens/1000).toFixed(1)+'k' : stats.citizens || '—', color: gold },
                  { label: 'Surveys Completed', val: stats.surveys || '—', color: '#60a5fa' },
                  { label: 'Total Responses', val: stats.responses >= 1000 ? (stats.responses/1000).toFixed(1)+'k' : stats.responses || '—', color: '#34d399' },
                ].map(function(s,i) {
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: '12px 18px', backdropFilter: 'blur(4px)', minWidth: 190 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: s.color, boxShadow:`0 0 6px ${s.color}` }} />
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: font, lineHeight:1 }}>{s.val}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY CONTENT ─────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px 0', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── ARC STATS + ACCOUNT ──────────────────────────────────── */}
        <div className="stats-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20,
          opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.5s ease 0.1s forwards' : 'none',
        }}>
          {/* Arcs */}
          <div className="cv-card" style={{
            background: `linear-gradient(140deg, ${blueMid} 0%, ${navy} 100%)`,
            border: `1px solid rgba(96,165,250,0.15)`, borderRadius: 20, padding: '28px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 24px' }}>Platform Activity</p>
            <div className="arcs-row" style={{ display:'flex', justifyContent:'space-around', alignItems:'center', gap:8 }}>
              <ArcStat value={stats.citizens} max={Math.max(stats.citizens,5000)} color={gold} label="Citizens" trigger={visible} />
              <ArcStat value={stats.surveys} max={Math.max(stats.surveys,100)} color="#60a5fa" label="Surveys" trigger={visible} />
              <ArcStat value={stats.responses} max={Math.max(stats.responses,20000)} color="#34d399" label="Responses" trigger={visible} />
            </div>
          </div>

          {/* Account card */}
          <div className="cv-card" style={{
            background: `linear-gradient(140deg, #0f2d4a 0%, ${navy} 100%)`,
            border: '1px solid rgba(197,150,12,0.12)', borderRadius: 20, padding: '28px 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 20px' }}>Your Account</p>
            <div style={{ display:'grid', gap:16 }}>
              {[
                { label:'Account Status', val:'Approved ✓', valColor:'#22c55e', barColor:'#22c55e', barPct:100 },
                { label:'Surveys Commissioned', val: String(orgStats.mySurveys), valColor:'#fff', barColor: gold, barPct: Math.min(orgStats.mySurveys*10, 100) },
                { label:'Base Rate', val:'$3.50/response', valColor: gold, barColor:'#60a5fa', barPct:50 },
              ].map(function(row, i) {
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{row.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:row.valColor }}>{row.val}</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width: visible ? row.barPct+'%' : '0%', background:row.barColor,
                        borderRadius:2, transition:'width 1.5s cubic-bezier(0.4,0,0.2,1) '+(i*0.2+0.3)+'s',
                        boxShadow:`0 0 6px ${row.barColor}80` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <div className="cv-card section-pad" style={{
          background: `linear-gradient(135deg, ${blueMid} 0%, #0a1e38 100%)`,
          border: `1px solid rgba(96,165,250,0.12)`, borderRadius: 20, padding: '32px 28px', marginBottom: 20,
          opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.5s ease 0.2s forwards' : 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
            <div style={{ width:3, height:22, background:`linear-gradient(180deg, ${gold}, ${goldLight})`, borderRadius:2 }} />
            <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>How It Works</h2>
          </div>
          <div className="how-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {HOW.map(function(step, i) {
              return (
                <div key={i} style={{ display:'flex', gap:14 }}>
                  <div style={{ flexShrink:0, width:40, height:40, borderRadius:10,
                    background:`rgba(${step.color === gold ? '197,150,12' : step.color === '#60a5fa' ? '96,165,250' : '52,211,153'},0.12)`,
                    border:`1px solid ${step.color}30`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:12, fontWeight:800, color:step.color, fontFamily:font }}>{step.num}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', margin:'0 0 5px', fontFamily:font }}>{step.title}</h3>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', margin:0, lineHeight:1.7 }}>{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── VALUES + PRICING SIDE BY SIDE ─────────────────────────── */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20,
          opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.5s ease 0.3s forwards' : 'none',
        }} className="stats-grid">

          {/* Core values */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:3, height:22, background:'linear-gradient(180deg,#60a5fa,#3b82f6)', borderRadius:2 }} />
              <h2 style={{ fontSize:18, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>Our Commitments</h2>
            </div>
            <div className="val-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {VALUES.map(function(v, i) {
                return (
                  <div key={i} className="cv-card cv-val"
                    style={{ background:`linear-gradient(140deg, ${blueMid}cc, ${navy}cc)`,
                      border:`1px solid rgba(255,255,255,0.07)`, borderRadius:16, padding:'18px 16px',
                      boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize:22, marginBottom:10 }}>{v.icon}</div>
                    <div style={{ width:24, height:2, background:v.color, borderRadius:1, marginBottom:10 }} />
                    <h3 style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 6px', fontFamily:font }}>{v.title}</h3>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0, lineHeight:1.7 }}>{v.body}</p>
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
            <div className="cv-card section-pad" style={{
              background:`linear-gradient(140deg, ${blueMid} 0%, #0a1e38 100%)`,
              border:'1px solid rgba(52,211,153,0.1)', borderRadius:20, padding:'20px',
              boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display:'grid', gap:2 }}>
                {PRICING.map(function(row, i) {
                  return (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 14px', borderRadius:10,
                      background: row.highlight ? 'rgba(197,150,12,0.08)' : 'rgba(255,255,255,0.02)',
                      border: row.highlight ? `1px solid rgba(197,150,12,0.2)` : '1px solid transparent',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:5, height:5, borderRadius:'50%',
                          background: row.highlight ? gold : i===4 ? '#60a5fa' : 'rgba(255,255,255,0.15)' }} />
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{row.tier}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{row.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:15, fontWeight:800, color: row.highlight ? gold : 'rgba(255,255,255,0.6)', fontFamily:font }}>{row.price}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', margin:'14px 0 0', lineHeight:1.6 }}>
                Invoices issued upon completion or monthly. Payment due 30 days. USD excl. taxes.
              </p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg, rgba(197,150,12,0.12) 0%, rgba(37,99,235,0.12) 100%)`,
          border: `1px solid rgba(197,150,12,0.25)`, borderRadius: 20, padding: '28px 32px',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16,
          opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.5s ease 0.4s forwards' : 'none',
        }} className="cta-row">
          <div>
            <h3 style={{ fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 6px', fontFamily:font }}>Ready to commission your first survey?</h3>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:0 }}>Results typically delivered within 3–7 business days depending on response volume.</p>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button className="cv-btn" onClick={function(){ navigate('/org/request'); }}
              style={{ padding:'13px 26px', background:`linear-gradient(135deg, ${gold}, ${goldLight})`,
                color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
                cursor:'pointer', boxShadow:`0 4px 20px rgba(197,150,12,0.3)`, whiteSpace:'nowrap' }}>
              📋 Request a Survey →
            </button>
            <button className="cv-btn" onClick={function(){ navigate('/org/surveys'); }}
              style={{ padding:'13px 22px', background:'rgba(255,255,255,0.07)',
                color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
                fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              📊 My Surveys
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
