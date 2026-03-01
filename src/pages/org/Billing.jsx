// src/pages/org/Billing.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font  = 'Libre Baskerville, Georgia, serif';
var sans  = 'DM Sans, system-ui, sans-serif';
var gold  = '#C5960C';
var goldL = '#F0B429';
var navy  = '#0B2545';
var bg    = '#f0f3f8';
var card  = '#ffffff';
var bdr   = 'rgba(11,37,69,0.08)';
var txt   = '#0B2545';
var muted = 'rgba(11,37,69,0.42)';
var faint = 'rgba(11,37,69,0.28)';

var STATUS_CFG = {
  active:         { label:'Live Now',      dot:'#16a34a', bg:'rgba(22,163,74,0.1)',   border:'rgba(22,163,74,0.25)',   text:'#15803d' },
  completed:      { label:'Completed',     dot:'#2563eb', bg:'rgba(37,99,235,0.1)',   border:'rgba(37,99,235,0.25)',   text:'#1d4ed8' },
  pending_review: { label:'Under Review',  dot:'#7c3aed', bg:'rgba(124,58,237,0.1)',  border:'rgba(124,58,237,0.25)',  text:'#6d28d9' },
  rejected:       { label:'Needs Changes', dot:'#dc2626', bg:'rgba(220,38,38,0.08)',  border:'rgba(220,38,38,0.25)',   text:'#b91c1c' },
  draft:          { label:'Draft',         dot:'#64748b', bg:'rgba(100,116,139,0.08)',border:'rgba(100,116,139,0.2)',  text:'#475569' },
  closed:         { label:'Closed',        dot:'#64748b', bg:'rgba(100,116,139,0.08)',border:'rgba(100,116,139,0.2)',  text:'#475569' },
};

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function getCost(s) {
  if (s.estimated_cost && Number(s.estimated_cost) > 0) return Number(s.estimated_cost);
  if (s.demographic_filters?.estimated_total) return Number(s.demographic_filters.estimated_total);
  if (s.demographic_filters?.price_per_response && s.target_responses)
    return Number(s.demographic_filters.price_per_response) * Number(s.target_responses);
  return 0;
}
function getRate(s) {
  return s.demographic_filters?.price_per_response ? Number(s.demographic_filters.price_per_response) : null;
}

function StatusPill({ status }) {
  var c = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
      borderRadius:30, background:c.bg, border:'1px solid '+c.border,
      fontSize:11, fontWeight:700, color:c.text, letterSpacing:0.4, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, flexShrink:0,
        animation: status==='active' ? 'livepulse 2s infinite' : 'none',
        boxShadow: status==='active' ? '0 0 0 3px '+c.dot+'30' : 'none' }} />
      {c.label}
    </span>
  );
}

export default function Billing() {
  var { user } = useAuth();
  var navigate = useNavigate();
  var [surveys, setSurveys] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!user) return;
    (async function() {
      var { data } = await supabase
        .from('surveys')
        .select('id,title,status,created_at,target_responses,estimated_cost,demographic_filters,response_count')
        .eq('created_by', user.id)
        .order('created_at', { ascending:false });
      setSurveys(data || []);
      setLoading(false);
    })();
  }, [user]);

  var totalEst      = surveys.reduce(function(a,s){ return a + getCost(s); }, 0);
  var activeCost    = surveys.filter(function(s){ return s.status==='active'; })
                             .reduce(function(a,s){ return a + getCost(s); }, 0);
  var completedCost = surveys.filter(function(s){ return s.status==='completed'; })
                             .reduce(function(a,s){ return a + getCost(s); }, 0);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(197,150,12,0.2)',
        borderTopColor:gold, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:sans, background:bg, margin:'0 -24px -24px', paddingBottom:48, minHeight:'100vh', width:'calc(100% + 48px)' }}>
      <style>{`
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none} }
        @keyframes livepulse{ 0%,100%{opacity:1}50%{opacity:0.35} }
        .bl-card   { transition:box-shadow 0.2s,transform 0.2s; }
        .bl-card:hover { box-shadow:0 8px 28px rgba(11,37,69,0.11)!important; transform:translateY(-2px); }
        .bl-action { transition:all 0.15s; cursor:pointer; }
        .bl-action:hover{ filter:brightness(1.08); transform:translateY(-1px); }
        @media(max-width:900px){ .bl-stats{grid-template-columns:1fr 1fr!important} .bl-pgrid{grid-template-columns:1fr!important} }
        @media(max-width:600px){ .bl-hero{padding:20px 16px!important} .bl-body{padding:16px!important} .bl-stats{grid-template-columns:1fr!important} .bl-cmetrics{grid-template-columns:1fr!important} }
      `}</style>

      {/* ── DARK NAVY HERO ───────────────────────────── */}
      <div className="bl-hero" style={{
        background:'linear-gradient(135deg,'+navy+' 0%,#1a3a6e 60%,#0f3060 100%)',
        borderBottom:'3px solid '+gold,
        padding:'32px 40px', position:'relative', overflow:'hidden' }}>

        <svg style={{ position:'absolute', top:-50, right:-50, pointerEvents:'none', opacity:0.15 }}
          width="240" height="240" viewBox="0 0 240 240">
          {[40,75,110].map(function(r,i){
            return <circle key={i} cx="120" cy="120" r={r} fill="none"
              stroke={i%2===0?gold:'#60a5fa'} strokeWidth="0.8" />;
          })}
        </svg>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
            flexWrap:'wrap', gap:16, marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:700, color:'#fff',
                margin:'0 0 5px', fontFamily:font }}>Billing</h1>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', margin:0 }}>
                Survey progress and estimated costs
              </p>
            </div>
            <button className="bl-action" onClick={function(){ navigate('/org/request'); }}
              style={{ padding:'11px 22px', background:'linear-gradient(135deg,'+gold+','+goldL+')',
                color:'#fff', border:'none', borderRadius:12, fontSize:13, fontWeight:700,
                boxShadow:'0 4px 16px rgba(197,150,12,0.4)', whiteSpace:'nowrap' }}>
              + New Survey Request
            </button>
          </div>

          {/* Hero stats - white-on-dark */}
          <div className="bl-stats" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Total Estimated', value:fmt(totalEst),      sub:surveys.length+' survey'+(surveys.length!==1?'s':''), icon:'💰', accent:goldL },
              { label:'Currently Active',value:fmt(activeCost),    sub:'In progress',   icon:'🟢', accent:'#4ade80' },
              { label:'Completed',       value:fmt(completedCost), sub:'Invoiced',      icon:'✅', accent:'#93c5fd' },
            ].map(function(s,i){
              return (
                <div key={i} style={{ background:'rgba(255,255,255,0.09)',
                  border:'1px solid rgba(255,255,255,0.13)', borderRadius:14,
                  padding:'18px 20px',
                  animation:'fadeUp 0.4s ease both', animationDelay:i*70+'ms' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                    <span style={{ fontSize:15 }}>{s.icon}</span>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:1.8, color:'rgba(255,255,255,0.38)', margin:0 }}>{s.label}</p>
                  </div>
                  <p style={{ fontSize:26, fontWeight:800, color:s.accent,
                    margin:'0 0 4px', fontFamily:font, lineHeight:1 }}>{s.value}</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0 }}>{s.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── LIGHT BODY ───────────────────────────────── */}
      <div className="bl-body" style={{ padding:'28px 40px 0' }}>

        {/* Info banner — white card with gold left border */}
        <div style={{ background:card, border:'1px solid '+bdr, borderLeft:'4px solid '+gold,
          borderRadius:12, padding:'14px 18px', marginBottom:24,
          display:'flex', gap:12, alignItems:'flex-start',
          boxShadow:'0 2px 8px rgba(11,37,69,0.05)' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>ℹ️</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:txt, margin:'0 0 3px' }}>Invoicing upon completion</p>
            <p style={{ fontSize:12, color:muted, margin:0, lineHeight:1.6 }}>
              You are only billed for verified responses received. Final invoices are sent by email upon survey completion.
            </p>
          </div>
        </div>

        {/* Survey cards */}
        {surveys.length === 0 ? (
          <div style={{ background:card, border:'1px solid '+bdr, borderRadius:20,
            padding:'60px 32px', textAlign:'center', animation:'fadeUp 0.4s ease',
            boxShadow:'0 2px 12px rgba(11,37,69,0.05)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>💳</div>
            <h3 style={{ fontSize:20, fontWeight:700, color:txt, margin:'0 0 10px', fontFamily:font }}>No surveys yet</h3>
            <p style={{ fontSize:14, color:muted, margin:'0 0 24px' }}>
              Your billing history will appear here once you commission a survey.
            </p>
            <button className="bl-action" onClick={function(){ navigate('/org/request'); }}
              style={{ padding:'12px 28px', background:'linear-gradient(135deg,'+gold+','+goldL+')',
                color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
                boxShadow:'0 4px 16px rgba(197,150,12,0.3)' }}>
              Request Your First Survey →
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gap:14, marginBottom:24 }}>
            {surveys.map(function(s, idx) {
              var cfg       = STATUS_CFG[s.status] || STATUS_CFG.draft;
              var cost      = getCost(s);
              var rate      = getRate(s);
              var tier      = s.demographic_filters?.tier || null;
              var responses = s.response_count || 0;
              var target    = s.target_responses || 0;
              var pct       = target > 0 ? Math.min(100, Math.round((responses/target)*100)) : null;
              var accrued   = rate ? rate * responses : null;

              return (
                <div key={s.id} className="bl-card"
                  style={{ background:card, border:'1px solid '+bdr,
                    borderRadius:16, overflow:'hidden',
                    boxShadow:'0 2px 12px rgba(11,37,69,0.06)',
                    animation:'fadeUp 0.35s ease both', animationDelay:idx*60+'ms' }}>

                  {/* Status colour top bar */}
                  <div style={{ height:4, background:cfg.dot }} />

                  <div style={{ padding:'20px 24px' }}>
                    {/* Title + status pill */}
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'flex-start', gap:12, marginBottom:14, flexWrap:'wrap' }}>
                      <div>
                        <h3 style={{ fontSize:16, fontWeight:700, color:txt,
                          margin:'0 0 4px', fontFamily:font }}>{s.title}</h3>
                        <p style={{ fontSize:12, color:faint, margin:0 }}>
                          {new Date(s.created_at).toLocaleDateString('en-US',
                            {month:'short',day:'numeric',year:'numeric'})}
                          {tier ? ' · '+tier : ''}
                        </p>
                      </div>
                      <StatusPill status={s.status} />
                    </div>

                    {/* Progress bar */}
                    {target > 0 && (
                      <div style={{ marginBottom:18 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:muted }}>Response Progress</span>
                          <span style={{ fontSize:12, fontWeight:700,
                            color: pct>=100?'#16a34a':txt }}>
                            {responses.toLocaleString()} / {target.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height:8, background:'rgba(11,37,69,0.07)',
                          borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:4, width:pct+'%',
                            transition:'width 0.8s ease',
                            background: pct>=100
                              ? 'linear-gradient(90deg,#16a34a,#4ade80)'
                              : 'linear-gradient(90deg,'+gold+','+goldL+')' }} />
                        </div>
                        {pct >= 100 && (
                          <p style={{ fontSize:11, color:'#16a34a', margin:'5px 0 0', fontWeight:700 }}>✓ Target reached!</p>
                        )}
                      </div>
                    )}

                    {/* Three cost metric boxes */}
                    <div className="bl-cmetrics" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                      {[
                        { label:'Rate / Response', value:rate?'$'+rate.toFixed(2):'—', accent:rate?gold:null         },
                        { label:'Estimated Total',  value:cost>0?fmt(cost):'—',          accent:cost>0?navy:null       },
                        { label:'Accrued So Far',   value:accrued?fmt(accrued):'—',       accent:accrued?'#16a34a':null },
                      ].map(function(item,i){
                        return (
                          <div key={i} style={{ padding:'14px 16px',
                            background:'rgba(11,37,69,0.03)',
                            border:'1px solid rgba(11,37,69,0.07)',
                            borderRadius:12 }}>
                            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                              letterSpacing:1.5, color:faint, margin:'0 0 8px' }}>{item.label}</p>
                            <p style={{ fontSize:22, fontWeight:800, margin:0, lineHeight:1,
                              fontFamily:font,
                              color:item.accent||'rgba(11,37,69,0.2)' }}>{item.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card footer */}
                  {(s.status==='active' || s.status==='completed') && (
                    <div style={{ padding:'11px 24px', borderTop:'1px solid '+bdr,
                      background:'rgba(11,37,69,0.02)', display:'flex', justifyContent:'flex-end' }}>
                      <button className="bl-action" onClick={function(){ navigate('/org/results/'+s.id); }}
                        style={{ padding:'7px 18px',
                          background:'linear-gradient(135deg,'+gold+','+goldL+')',
                          color:'#fff', border:'none', borderRadius:8,
                          fontSize:12, fontWeight:700,
                          boxShadow:'0 2px 8px rgba(197,150,12,0.25)' }}>
                        View Results →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pricing reference */}
        <div style={{ background:card, border:'1px solid '+bdr, borderRadius:16,
          overflow:'hidden', boxShadow:'0 2px 12px rgba(11,37,69,0.06)' }}>

          <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid '+bdr,
            display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
              background:'linear-gradient(135deg,'+gold+','+goldL+')',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, boxShadow:'0 2px 8px rgba(197,150,12,0.25)' }}>💳</div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:txt, margin:0, fontFamily:font }}>Pricing Reference</h2>
              <p style={{ fontSize:12, color:muted, margin:0 }}>Per verified citizen response</p>
            </div>
          </div>

          <div style={{ padding:'18px 24px' }}>
            <div className="bl-pgrid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:10 }}>
              {[
                { tier:'General Audience',   desc:'No demographic filters',  price:'$3.50', color:'#16a34a' },
                { tier:'Basic Targeting',     desc:'1–2 demographic filters', price:'$4.50', color:gold },
                { tier:'Refined Targeting',   desc:'3–4 demographic filters', price:'$5.50', color:'#2563eb' },
                { tier:'Precision Targeting', desc:'5+ demographic filters',  price:'$7.00', color:'#7c3aed' },
              ].map(function(t,i){
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'13px 16px',
                    background:'rgba(11,37,69,0.03)',
                    border:'1px solid rgba(11,37,69,0.07)', borderRadius:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:t.color, flexShrink:0 }} />
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:txt, margin:'0 0 2px' }}>{t.tier}</p>
                        <p style={{ fontSize:11, color:faint, margin:0 }}>{t.desc}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:15, fontWeight:800, color:t.color, fontFamily:font }}>{t.price}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'12px 16px', background:'rgba(11,37,69,0.03)',
              border:'1px solid rgba(11,37,69,0.07)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:15 }}>📍</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:txt, margin:'0 0 2px' }}>Geo Micro-Targeting</p>
                  <p style={{ fontSize:11, color:faint, margin:0 }}>City / ZIP level targeting add-on</p>
                </div>
              </div>
              <span style={{ fontSize:15, fontWeight:800, color:gold, fontFamily:font }}>+$1.00</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
