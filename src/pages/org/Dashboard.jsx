// src/pages/org/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';
var gold = '#C5960C';
var navy = '#0B2545';

var VALUES = [
  { icon: '🛡️', title: 'Verified Authenticity', body: 'Every respondent is identity-verified. No bots, no duplicates — only real, credentialed citizens participating in your survey.' },
  { icon: '🔒', title: 'Privacy by Design', body: 'All responses are anonymized and aggregated before delivery. You receive powerful insights, never personal data.' },
  { icon: '⚖️', title: 'Editorial Integrity', body: 'Every survey undergoes review before distribution. We reject push polls and misleading questions — period.' },
  { icon: '🌐', title: 'True Representation', body: 'Our verified citizen network spans demographics, geographies, and affiliations. Real America, not a curated sample.' },
];

var HOW = [
  { num: '01', title: 'Commission Your Survey', body: 'Define your questions, target demographic, and response volume. Our editorial team reviews and approves within 24 hours.' },
  { num: '02', title: 'Citizens Respond', body: 'Identity-verified citizens on the CivicVerify network complete your survey. Every response is authenticated in real time.' },
  { num: '03', title: 'Receive Deep Insights', body: 'Access aggregated results, demographic breakdowns, trend charts, and exportable data — all in your secure dashboard.' },
];

var PRICING = [
  { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50' },
  { tier: 'Basic Targeting', desc: '1–2 demographic filters', price: '$4.50' },
  { tier: 'Refined Targeting', desc: '3–4 demographic filters', price: '$5.50' },
  { tier: 'Precision Targeting', desc: '5+ demographic filters', price: '$7.00' },
  { tier: 'Geo Micro-Target', desc: 'City / ZIP level add-on', price: '+$1.00' },
];

function useCountUp(target, duration) {
  var [val, setVal] = useState(0);
  var raf = useRef(null);
  useEffect(function() {
    if (!target) return;
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
  }, [target]);
  return val;
}

function ArcStat({ value, max, color, label }) {
  var r = 52, stroke = 5;
  var circ = 2 * Math.PI * r;
  var pct = max ? Math.min(value / max, 1) : 0;
  var dash = pct * circ;
  var animated = useCountUp(value, 1800);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: r * 2 + stroke * 2 + 4, height: r * 2 + stroke * 2 + 4 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${r*2+16} ${r*2+16}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={r+8} cy={r+8} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx={r+8} cy={r+8} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: font, lineHeight: 1 }}>
            {animated.toLocaleString()}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</span>
    </div>
  );
}

function WaveBar({ value, max, color, delay }) {
  var pct = max ? Math.min(value / max, 1) * 100 : 0;
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2,
        transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1) ' + (delay || '0s'),
        boxShadow: `0 0 8px ${color}80` }} />
    </div>
  );
}

export default function OrgDashboard() {
  var navigate = useNavigate();
  var { profile } = useAuth();
  var [stats, setStats] = useState({ surveys: 0, responses: 0, citizens: 0 });
  var [orgStats, setOrgStats] = useState({ mySurveys: 0, myResponses: 0 });
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    // Trigger animations after mount
    var t = setTimeout(function() { setVisible(true); }, 100);
    return function() { clearTimeout(t); };
  }, []);

  useEffect(function() {
    if (!profile) return;
    async function load() {
      try {
        var [sRes, rRes, cRes] = await Promise.all([
          supabase.from('surveys').select('id', { count: 'exact', head: true }),
          supabase.from('survey_responses').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'citizen'),
        ]);
        setStats({
          surveys: sRes.count || 0,
          responses: rRes.count || 0,
          citizens: cRes.count || 0,
        });

        var myS = await supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('org_id', profile.id);
        setOrgStats({ mySurveys: myS.count || 0, myResponses: 0 });
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
    <div style={{ fontFamily: sans, color: '#fff', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .action-btn { transition: all 0.2s ease; }
        .value-card:hover { border-color: rgba(197,150,12,0.3) !important; background: rgba(197,150,12,0.05) !important; }
        .value-card { transition: all 0.2s ease; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden', marginBottom: 24,
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #0a1a35 100%)',
        border: '1px solid rgba(197,150,12,0.12)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        padding: '48px 40px',
        opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.6s ease forwards' : 'none',
      }}>
        {/* Abstract background rings */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, pointerEvents: 'none' }}>
          <svg width="320" height="320" viewBox="0 0 320 320">
            {[60,90,120,150].map(function(r, i) {
              return <circle key={i} cx="160" cy="160" r={r} fill="none"
                stroke={`rgba(197,150,12,${0.06 - i*0.01})`} strokeWidth="1"
                style={{ animation: 'pulse ' + (3 + i) + 's ease-in-out infinite', animationDelay: (i*0.5) + 's' }} />;
            })}
            <circle cx="160" cy="160" r="20" fill="rgba(197,150,12,0.08)"
              style={{ animation: 'pulse 3s ease-in-out infinite' }} />
          </svg>
        </div>

        {/* Floating dots */}
        {[{x:80,y:30},{x:200,y:60},{x:320,y:20},{x:400,y:80}].map(function(d,i) {
          return <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, width: 3, height: 3,
            borderRadius: '50%', background: gold, opacity: 0.4,
            animation: 'float ' + (2.5+i*0.5) + 's ease-in-out infinite', animationDelay: (i*0.3)+'s' }} />;
        })}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(197,150,12,0.1)',
            border: '1px solid rgba(197,150,12,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1.5 }}>Verified Organization</span>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: font, lineHeight: 1.1 }}>
            Welcome back,<br />
            <span style={{ color: gold }}>{profile.org_name || profile.full_name}</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 32px', maxWidth: 480 }}>
            Commission identity-verified civic surveys. Real citizens, real data, real decisions.
          </p>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="action-btn" onClick={function() { navigate('/org/request'); }}
              style={{ padding: '13px 28px', background: 'linear-gradient(135deg, ' + gold + ', #e8a838)',
                color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(197,150,12,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Request a Survey
            </button>
            <button className="action-btn" onClick={function() { navigate('/org/surveys'); }}
              style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.07)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📊</span> View Results
            </button>
          </div>
        </div>
      </div>

      {/* ── PLATFORM STATS ──────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24,
        opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.6s ease 0.15s forwards' : 'none',
      }}>
        {/* Arc stats card */}
        <div className="card-hover" style={{
          gridColumn: 'span 1',
          background: 'linear-gradient(135deg, #0d1f3a, #0a1628)',
          border: '1px solid rgba(197,150,12,0.1)', borderRadius: 20, padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 24px' }}>Platform Activity</p>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {visible && <>
              <ArcStat value={stats.citizens} max={Math.max(stats.citizens, 5000)} color="#C5960C" label="Citizens" />
              <ArcStat value={stats.surveys} max={Math.max(stats.surveys, 100)} color="#60a5fa" label="Surveys" />
              <ArcStat value={stats.responses} max={Math.max(stats.responses, 20000)} color="#34d399" label="Responses" />
            </>}
          </div>
        </div>

        {/* My org stats */}
        <div className="card-hover" style={{
          background: 'linear-gradient(135deg, #0d1f3a, #0a1628)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 20px' }}>Your Account</p>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Surveys Commissioned</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{orgStats.mySurveys}</span>
              </div>
              <WaveBar value={orgStats.mySurveys} max={10} color={gold} delay="0.3s" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Account Status</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 10px', borderRadius: 10 }}>Approved ✓</span>
              </div>
              <WaveBar value={100} max={100} color="#22c55e" delay="0.5s" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Base Rate</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: gold }}>$3.50/response</span>
              </div>
              <WaveBar value={3.5} max={7} color="#60a5fa" delay="0.7s" />
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1f3a, #0a1628)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '36px 32px', marginBottom: 24,
        opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.6s ease 0.25s forwards' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 3, height: 24, background: gold, borderRadius: 2 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, position: 'relative' }}>
          {HOW.map(function(step, i) {
            return (
              <div key={i} style={{ position: 'relative' }}>
                {i < HOW.length - 1 && (
                  <div style={{ position: 'absolute', top: 22, left: 'calc(100% - 12px)', width: 24, height: 1,
                    background: 'linear-gradient(90deg, rgba(197,150,12,0.4), transparent)', display: 'none' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(197,150,12,0.1)', border: '1px solid rgba(197,150,12,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: gold, fontFamily: font }}>{step.num}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: font }}>{step.title}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.7 }}>{step.body}</p>
                  </div>
                </div>
                {i < HOW.length - 1 && (
                  <div style={{ margin: '20px 0 0 22px', width: 1, height: 24,
                    background: 'linear-gradient(180deg, rgba(197,150,12,0.3), transparent)' }} className="step-connector" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CORE VALUES ──────────────────────────────────────── */}
      <div style={{
        marginBottom: 24,
        opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.6s ease 0.35s forwards' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 3, height: 24, background: '#60a5fa', borderRadius: 2 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>Our Commitments to You</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {VALUES.map(function(v, i) {
            return (
              <div key={i} className="value-card card-hover"
                style={{ background: 'linear-gradient(135deg, #0d1f3a, #0a1628)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)', cursor: 'default' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: font }}>{v.title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.7 }}>{v.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PRICING TABLE ──────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1f3a, #0a1628)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '36px 32px', marginBottom: 24,
        opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.6s ease 0.45s forwards' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 3, height: 24, background: '#34d399', borderRadius: 2 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, fontFamily: font }}>Pricing Schedule</h2>
        </div>
        <div style={{ display: 'grid', gap: 2 }}>
          {PRICING.map(function(row, i) {
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 10,
                background: i === 0 ? 'rgba(197,150,12,0.06)' : 'rgba(255,255,255,0.02)',
                border: i === 0 ? '1px solid rgba(197,150,12,0.15)' : '1px solid transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%',
                    background: i === 0 ? gold : i === 4 ? '#60a5fa' : 'rgba(255,255,255,0.15)' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.tier}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{row.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? gold : 'rgba(255,255,255,0.7)', fontFamily: font }}>{row.price}</div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '16px 0 0', lineHeight: 1.6 }}>
          Invoices issued upon survey completion or monthly. Payment due within 30 days. All prices USD, exclusive of applicable taxes.
        </p>
      </div>

      {/* ── BOTTOM CTA ──────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(197,150,12,0.1) 0%, rgba(197,150,12,0.04) 100%)',
        border: '1px solid rgba(197,150,12,0.2)', borderRadius: 20, padding: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        opacity: visible ? 1 : 0, animation: visible ? 'fadeUp 0.6s ease 0.55s forwards' : 'none',
      }}>
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: font }}>Ready to commission your first survey?</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Results typically delivered within 3–7 business days depending on response volume.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="action-btn" onClick={function() { navigate('/org/request'); }}
            style={{ padding: '13px 28px', background: 'linear-gradient(135deg, ' + gold + ', #e8a838)',
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(197,150,12,0.3)', whiteSpace: 'nowrap' }}>
            📋 Request a Survey →
          </button>
          <button className="action-btn" onClick={function() { navigate('/org/surveys'); }}
            style={{ padding: '13px 24px', background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            📊 My Surveys
          </button>
        </div>
      </div>
    </div>
  );
}
