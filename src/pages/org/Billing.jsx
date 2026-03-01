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
var mid   = '#1e3a6e';

var STATUS_CFG = {
  active:         { label:'Live Now',       dot:'#34d399', bg:'rgba(52,211,153,0.15)',  border:'rgba(52,211,153,0.3)' },
  completed:      { label:'Completed',      dot:'#60a5fa', bg:'rgba(96,165,250,0.15)',  border:'rgba(96,165,250,0.3)' },
  pending_review: { label:'Under Review',   dot:'#a78bfa', bg:'rgba(167,139,250,0.15)',border:'rgba(167,139,250,0.3)' },
  rejected:       { label:'Needs Changes',  dot:'#f87171', bg:'rgba(248,113,113,0.15)',border:'rgba(248,113,113,0.3)' },
  draft:          { label:'Draft',          dot:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.2)' },
  closed:         { label:'Closed',         dot:'#94a3b8', bg:'rgba(148,163,184,0.1)', border:'rgba(148,163,184,0.2)' },
};

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function getCost(s) {
  if (s.estimated_cost && Number(s.estimated_cost)>0) return Number(s.estimated_cost);
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
      fontSize:11, fontWeight:700, color:'#fff', letterSpacing:0.5, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot, flexShrink:0,
        animation:status==='active'?'pulse 2s infinite':'none',
        boxShadow:status==='active'?'0 0 0 3px '+c.dot+'40':'none' }} />
      {c.label}
    </span>
  );
}

export default function Billing() {
  var { user } = useAuth();
  var navigate  = useNavigate();
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
      setSurveys(data||[]);
      setLoading(false);
    })();
  }, [user]);

  var totalEst     = surveys.reduce(function(a,s){ return a+getCost(s); }, 0);
  var activeCost   = surveys.filter(function(s){ return s.status==='active'; }).reduce(function(a,s){ return a+getCost(s); }, 0);
  var completedCost= surveys.filter(function(s){ return s.status==='completed'; }).reduce(function(a,s){ return a+getCost(s); }, 0);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(197,150,12,0.2)',
        borderTopColor:gold, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:sans, color:'#fff', margin:'0 -24px', paddingBottom:40 }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none} }
        @keyframes pulse   { 0%,100%{opacity:1}50%{opacity:0.4} }
        .bl-card  { transition:transform 0.2s ease,box-shadow 0.2s ease; }
        .bl-card:hover { transform:translateY(-2px); box-shadow:0 16px 40px rgba(0,0,0,0.35)!important; }
        .bl-btn   { transition:all 0.2s ease; cursor:pointer; }
        .bl-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
        @media(max-width:900px){ .bl-stats{grid-template-columns:1fr 1fr!important} .bl-pricegrid{grid-template-columns:1fr!important} }
        @media(max-width:600px){ .bl-hero{padding:20px 16px!important} .bl-body{padding:16px!important} .bl-stats{grid-template-columns:1fr!important} .bl-costrow{grid-template-columns:1fr!important} }
      `}</style>

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="bl-hero" style={{ background:'linear-gradient(140deg,'+navy+' 0%,'+mid+' 60%,#0f3060 100%)',
        borderBottom:'3px solid '+gold, padding:'32px 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:240, height:240, pointerEvents:'none' }}>
          <svg width="240" height="240" viewBox="0 0 240 240">
            {[40,75,110].map(function(r,i){
              return <circle key={i} cx="120" cy="120" r={r} fill="none"
                stroke={i%2===0?gold:'#60a5fa'} strokeWidth="0.6" style={{opacity:0.12-i*0.02}} />;
            })}
          </svg>
        </div>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:24 }}>
            <div>
              <h1 style={{ fontSize:'clamp(22px,3vw,30px)', fontWeight:700, color:'#fff',
                margin:'0 0 6px', fontFamily:font }}>Billing</h1>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>
                Survey progress and estimated costs
              </p>
            </div>
            <button className="bl-btn" onClick={function(){ navigate('/org/request'); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 20px',
                background:'linear-gradient(135deg,'+gold+','+goldL+')',
                color:'#fff', border:'none', borderRadius:12, fontSize:13,
                fontWeight:700, boxShadow:'0 4px 16px rgba(197,150,12,0.35)', whiteSpace:'nowrap' }}>
              + New Survey Request
            </button>
          </div>

          {/* Summary stat pills */}
          <div className="bl-stats" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Total Estimated', value:fmt(totalEst), sub:surveys.length+' survey'+(surveys.length!==1?'s':''), icon:'📋', color:gold },
              { label:'Currently Active', value:fmt(activeCost), sub:'In progress', icon:'🟢', color:'#34d399' },
              { label:'Completed', value:fmt(completedCost), sub:'Invoiced', icon:'✅', color:'#60a5fa' },
            ].map(function(stat,i){
              return (
                <div key={i} style={{ background:'rgba(255,255,255,0.07)',
                  border:'1px solid '+stat.color+'25', borderRadius:16,
                  padding:'18px 20px', backdropFilter:'blur(4px)',
                  animation:'fadeUp 0.4s ease both', animationDelay:i*80+'ms' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:16 }}>{stat.icon}</span>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:1.8, color:'rgba(255,255,255,0.35)', margin:0 }}>{stat.label}</p>
                  </div>
                  <p style={{ fontSize:28, fontWeight:800, color:stat.color, margin:'0 0 4px', fontFamily:font, lineHeight:1 }}>{stat.value}</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>{stat.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="bl-body" style={{ padding:'28px 40px 0', maxWidth:1100, margin:'0 auto' }}>

        {/* Info banner */}
        <div style={{ background:'rgba(197,150,12,0.1)', border:'1px solid rgba(197,150,12,0.2)',
          borderRadius:14, padding:'14px 18px', marginBottom:24,
          display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>ℹ️</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 3px' }}>Invoicing upon completion</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', margin:0, lineHeight:1.6 }}>
              You are only billed for verified responses received. Final invoices are sent by email upon survey completion.
            </p>
          </div>
        </div>

        {/* Survey cards */}
        {surveys.length === 0 ? (
          <div style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
            border:'1px solid rgba(255,255,255,0.07)', borderRadius:20,
            padding:'64px 32px', textAlign:'center', animation:'fadeUp 0.4s ease' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>💳</div>
            <h3 style={{ fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 10px', fontFamily:font }}>No surveys yet</h3>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.35)', margin:'0 0 24px' }}>
              Your billing history will appear here once you commission a survey.
            </p>
            <button className="bl-btn" onClick={function(){ navigate('/org/request'); }}
              style={{ padding:'12px 28px', background:'linear-gradient(135deg,'+gold+','+goldL+')',
                color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
                boxShadow:'0 4px 16px rgba(197,150,12,0.35)' }}>
              Request Your First Survey →
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gap:16, marginBottom:28 }}>
            {surveys.map(function(s, idx) {
              var cfg      = STATUS_CFG[s.status] || STATUS_CFG.draft;
              var cost     = getCost(s);
              var rate     = getRate(s);
              var tier     = s.demographic_filters?.tier || null;
              var responses= s.response_count || 0;
              var target   = s.target_responses || 0;
              var pct      = target>0 ? Math.min(100, Math.round((responses/target)*100)) : null;
              var accrued  = rate ? rate*responses : null;

              return (
                <div key={s.id} className="bl-card"
                  style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
                    border:'1px solid '+cfg.border, borderRadius:18, overflow:'hidden',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                    animation:'fadeUp 0.35s ease both', animationDelay:idx*60+'ms' }}>

                  {/* Coloured accent bar */}
                  <div style={{ height:3, background:cfg.dot }} />

                  <div style={{ padding:'22px 26px' }}>
                    {/* Title row */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                      gap:12, marginBottom:16, flexWrap:'wrap' }}>
                      <div>
                        <h3 style={{ fontSize:17, fontWeight:700, color:'#fff',
                          margin:'0 0 4px', fontFamily:font }}>{s.title}</h3>
                        <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>
                          {new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                          {tier ? ' · '+tier : ''}
                        </p>
                      </div>
                      <StatusPill status={s.status} />
                    </div>

                    {/* Progress bar */}
                    {target > 0 && (
                      <div style={{ marginBottom:20 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>Response Progress</span>
                          <span style={{ fontSize:12, fontWeight:700,
                            color: pct>=100?'#34d399':'rgba(255,255,255,0.7)' }}>
                            {responses.toLocaleString()} / {target.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:4,
                            width:pct+'%', transition:'width 0.8s ease',
                            background: pct>=100
                              ? 'linear-gradient(90deg,#34d399,#10b981)'
                              : 'linear-gradient(90deg,'+gold+','+goldL+')',
                            boxShadow: pct>=100?'0 0 8px #34d39960':'0 0 8px '+gold+'60' }} />
                        </div>
                        {pct>=100 && (
                          <p style={{ fontSize:11, color:'#34d399', margin:'6px 0 0', fontWeight:700 }}>✓ Target reached!</p>
                        )}
                      </div>
                    )}

                    {/* Cost cards */}
                    <div className="bl-costrow" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                      {[
                        { label:'Rate / Response', value: rate?'$'+rate.toFixed(2):'—', color:rate?gold:null, icon:'💰' },
                        { label:'Estimated Total',  value: cost>0?fmt(cost):'—',        color:cost>0?goldL:null, icon:'📊' },
                        { label:'Accrued So Far',   value: accrued?fmt(accrued):'—',    color:accrued?'#34d399':null, icon:'📈' },
                      ].map(function(item,i){
                        return (
                          <div key={i} style={{ padding:'14px 16px',
                            background:'rgba(255,255,255,0.05)',
                            border:'1px solid rgba(255,255,255,0.07)',
                            borderRadius:12 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                              <span style={{ fontSize:12 }}>{item.icon}</span>
                              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
                                letterSpacing:1.5, color:'rgba(255,255,255,0.25)', margin:0 }}>{item.label}</p>
                            </div>
                            <p style={{ fontSize:22, fontWeight:800, margin:0,
                              color:item.color||'rgba(255,255,255,0.2)',
                              fontFamily:font, lineHeight:1 }}>{item.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  {(s.status==='active'||s.status==='completed') && (
                    <div style={{ padding:'12px 26px', borderTop:'1px solid rgba(255,255,255,0.05)',
                      background:'rgba(0,0,0,0.15)', display:'flex', justifyContent:'flex-end' }}>
                      <button className="bl-btn" onClick={function(){ navigate('/org/results/'+s.id); }}
                        style={{ padding:'7px 18px', background:'linear-gradient(135deg,'+gold+','+goldL+')',
                          color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700,
                          boxShadow:'0 2px 8px rgba(197,150,12,0.3)' }}>
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
        <div style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
          border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)',
            display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,'+gold+','+goldL+')',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, boxShadow:'0 2px 8px rgba(197,150,12,0.3)', flexShrink:0 }}>💳</div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0, fontFamily:font }}>Pricing Reference</h2>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0 }}>Per verified citizen response</p>
            </div>
          </div>
          <div style={{ padding:'20px 24px' }}>
            <div className="bl-pricegrid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:12 }}>
              {[
                { tier:'General Audience',   desc:'No demographic filters',  price:'$3.50', color:'#34d399' },
                { tier:'Basic Targeting',     desc:'1–2 demographic filters', price:'$4.50', color:gold },
                { tier:'Refined Targeting',   desc:'3–4 demographic filters', price:'$5.50', color:'#60a5fa' },
                { tier:'Precision Targeting', desc:'5+ demographic filters',  price:'$7.00', color:'#a78bfa' },
              ].map(function(t,i){
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'14px 16px',
                    background:'rgba(255,255,255,0.05)',
                    border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:t.color, flexShrink:0 }} />
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>{t.tier}</p>
                        <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:0 }}>{t.desc}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:15, fontWeight:800, color:t.color, fontFamily:font }}>{t.price}</span>
                  </div>
                );
              })}
            </div>
            {/* Geo add-on */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'12px 16px', background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:15 }}>📍</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>Geo Micro-Targeting</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', margin:0 }}>City / ZIP level targeting add-on</p>
                </div>
              </div>
              <span style={{ fontSize:15, fontWeight:800, color:goldL, fontFamily:font }}>+$1.00</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
