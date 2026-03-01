// src/pages/org/MySurveys.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';
var gold = '#C5960C';
var goldLight = '#F0B429';
var navy = '#0B2545';
var blueMid = '#1e3a6e';

var STATUS = {
  pending_review: { label: 'Under Review', dot: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', bar: 'linear-gradient(90deg,#8b5cf6,#ec4899)' },
  active:         { label: 'Live Now',     dot: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.3)',  bar: 'linear-gradient(90deg,#34d399,#10b981)' },
  completed:      { label: 'Completed',    dot: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.3)',  bar: 'linear-gradient(90deg,#3b82f6,#6366f1)' },
  rejected:       { label: 'Needs Changes',dot: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', bar: '#f87171' },
  draft:          { label: 'Draft',        dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)',bar: '#94a3b8' },
  closed:         { label: 'Closed',       dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)',bar: '#94a3b8' },
};

var TABS = [
  { k: 'all',            l: 'All' },
  { k: 'pending_review', l: 'Under Review' },
  { k: 'active',         l: 'Live' },
  { k: 'completed',      l: 'Completed' },
  { k: 'rejected',       l: 'Needs Changes' },
];

function StatusPill({ status }) {
  var s = STATUS[status] || STATUS.draft;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px',
      borderRadius:30, background: s.bg, border:'1px solid '+s.border,
      fontSize:11, fontWeight:700, color:'#fff', letterSpacing:0.5, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: s.dot, flexShrink:0,
        boxShadow: status==='active' ? '0 0 0 3px '+s.dot+'40' : 'none',
        animation: status==='active' ? 'livepulse 2s infinite' : 'none' }} />
      {s.label}
    </span>
  );
}

function ArcProgress({ value, max, color }) {
  var r = 22, sw = 3.5;
  var circ = 2 * Math.PI * r;
  var pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ position:'relative', width:54, height:54, flexShrink:0 }}>
      <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={String(pct*circ)+' '+String(circ)} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 4px '+color+'80)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:11, fontWeight:800, color:'#fff' }}>{Math.round(pct*100)}%</span>
      </div>
    </div>
  );
}

function HowItWorks() {
  var steps = [
    { n:'1', icon:'📋', title:'Submit a Request', desc:'Describe your survey topic, target audience, and response goals.' },
    { n:'2', icon:'🔍', title:'Admin Review',     desc:'Our team reviews your request within 1-2 business days.' },
    { n:'3', icon:'🗳️', title:'Citizens Respond', desc:'Verified citizens matching your criteria complete your survey.' },
    { n:'4', icon:'📊', title:'View Results',     desc:'Access real-time analytics and export your verified data.' },
  ];
  return (
    <div style={{ background:'linear-gradient(140deg,'+navy+','+blueMid+')', borderRadius:16,
      border:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }}>
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
          color:'rgba(255,255,255,0.35)', margin:0 }}>How It Works</p>
      </div>
      <div style={{ padding:'16px 20px', display:'grid', gap:14 }}>
        {steps.map(function(s) {
          return (
            <div key={s.n} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,'+gold+','+goldLight+')',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:800, color:'#fff', boxShadow:'0 2px 8px rgba(197,150,12,0.3)' }}>
                {s.n}
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:'0 0 2px' }}>{s.icon} {s.title}</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:0, lineHeight:1.5 }}>{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions({ navigate }) {
  var actions = [
    { icon:'✏️', label:'New Survey Request',    desc:'Commission a new civic survey',    color:gold,      path:'/org/request' },
    { icon:'💳', label:'Billing & Credits',     desc:'Manage your plan and payments',    color:'#60a5fa', path:'/org/billing' },
    { icon:'⚙️', label:'Organisation Profile',  desc:'Update your details and logo',     color:'#a78bfa', path:'/org/profile' },
  ];
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(11,37,69,0.08)',
      boxShadow:'0 2px 12px rgba(11,37,69,0.06)', overflow:'hidden' }}>
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid rgba(11,37,69,0.06)' }}>
        <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
          color:'rgba(11,37,69,0.35)', margin:0 }}>Quick Actions</p>
      </div>
      <div style={{ padding:'10px 12px', display:'grid', gap:4 }}>
        {actions.map(function(a, i) {
          return (
            <button key={i} onClick={function(){ navigate(a.path); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                background:'transparent', border:'none', borderRadius:10, cursor:'pointer',
                textAlign:'left', width:'100%' }}
              onMouseEnter={function(e){ e.currentTarget.style.background='rgba(11,37,69,0.04)'; }}
              onMouseLeave={function(e){ e.currentTarget.style.background='transparent'; }}>
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                background:a.color+'18', border:'1px solid '+a.color+'30',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {a.icon}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:navy, margin:0 }}>{a.label}</p>
                <p style={{ fontSize:11, color:'rgba(11,37,69,0.4)', margin:0 }}>{a.desc}</p>
              </div>
              <span style={{ color:'rgba(11,37,69,0.25)', fontSize:18, lineHeight:1 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Tips() {
  var tips = [
    { icon:'🎯', text:'Narrow targeting gets higher quality responses from the exact demographic you need.' },
    { icon:'📝', text:'Keep surveys under 10 questions — completion rates drop sharply beyond that.' },
    { icon:'⚡', text:'Active surveys are shown to verified citizens first — submit early for faster results.' },
  ];
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(11,37,69,0.08)',
      boxShadow:'0 2px 12px rgba(11,37,69,0.06)', overflow:'hidden' }}>
      <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid rgba(11,37,69,0.06)' }}>
        <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
          color:'rgba(11,37,69,0.35)', margin:0 }}>💡 Tips for Better Results</p>
      </div>
      <div style={{ padding:'14px 20px', display:'grid', gap:12 }}>
        {tips.map(function(t, i) {
          return (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{t.icon}</span>
              <p style={{ fontSize:12, color:'rgba(11,37,69,0.55)', margin:0, lineHeight:1.6 }}>{t.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResponseSummary({ surveys }) {
  var totalTarget = surveys.reduce(function(a,s){ return a+(s.target_responses||0); }, 0);
  var totalResp   = surveys.reduce(function(a,s){ return a+(s.response_count||0); }, 0);
  var pct = totalTarget > 0 ? Math.min(100, Math.round((totalResp/totalTarget)*100)) : 0;
  var active    = surveys.filter(function(s){ return s.status==='active'; }).length;
  var completed = surveys.filter(function(s){ return s.status==='completed'; }).length;

  return (
    <div style={{ background:'linear-gradient(140deg,'+navy+','+blueMid+')', borderRadius:16,
      border:'1px solid rgba(255,255,255,0.07)', padding:'20px' }}>
      <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
        color:'rgba(255,255,255,0.35)', margin:'0 0 16px' }}>Overall Progress</p>
      <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:16 }}>
        <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="36" cy="36" r="28" fill="none"
              stroke="url(#rg)" strokeWidth="5"
              strokeDasharray={String(pct/100*2*Math.PI*28)+' '+String(2*Math.PI*28)}
              strokeLinecap="round" style={{ transition:'stroke-dasharray 1.2s ease' }} />
            <defs>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gold} />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{pct}%</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize:24, fontWeight:800, color:'#fff', margin:'0 0 2px', fontFamily:font }}>
            {totalResp.toLocaleString()}
          </p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:0 }}>
            of {totalTarget.toLocaleString()} target responses
          </p>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { label:'Live Surveys', val: active,    color:'#34d399' },
          { label:'Completed',    val: completed, color:'#60a5fa' },
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 12px',
              border:'1px solid '+s.color+'20' }}>
              <p style={{ fontSize:20, fontWeight:800, color:s.color, margin:0, fontFamily:font }}>{s.val}</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', margin:0, textTransform:'uppercase', letterSpacing:0.8 }}>{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ navigate, tab, search }) {
  if (search || tab !== 'all') {
    return (
      <div style={{ background:'linear-gradient(140deg,'+blueMid+','+navy+')',
        border:'1px solid rgba(255,255,255,0.07)', borderRadius:20,
        padding:'60px 32px', textAlign:'center', animation:'fadeUp 0.4s ease' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <h3 style={{ fontSize:20, fontWeight:700, color:'#fff', margin:'0 0 8px', fontFamily:font }}>No matching surveys</h3>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>Try adjusting your search or filter.</p>
      </div>
    );
  }
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ background:'linear-gradient(140deg,'+navy+','+blueMid+')',
        border:'1px solid rgba(255,255,255,0.07)', borderRadius:20,
        padding:'48px 32px', textAlign:'center', marginBottom:20 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📋</div>
        <h3 style={{ fontSize:24, fontWeight:700, color:'#fff', margin:'0 0 10px', fontFamily:font }}>
          Commission Your First Survey
        </h3>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:'0 0 28px',
          maxWidth:420, marginLeft:'auto', marginRight:'auto', lineHeight:1.7 }}>
          Get authentic, verified public opinion from real citizens. No bots, no fake accounts — just genuine civic data.
        </p>
        <button onClick={function(){ navigate('/org/request'); }}
          style={{ padding:'14px 32px', background:'linear-gradient(135deg,'+gold+','+goldLight+')',
            color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer',
            boxShadow:'0 4px 20px rgba(197,150,12,0.4)' }}>
          📋 Request Your First Survey →
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { icon:'✅', title:'Identity Verified',  desc:'Every response comes from a real, Didit-verified citizen — not a bot or duplicate.' },
          { icon:'🎯', title:'Precise Targeting',  desc:'Filter by age, location, party, employment, income, and dozens more demographics.' },
          { icon:'📊', title:'Real-Time Results',  desc:'Watch responses come in live and export your data in any format you need.' },
        ].map(function(f, i) {
          return (
            <div key={i} style={{ background:'#fff', borderRadius:14, padding:'20px',
              border:'1px solid rgba(11,37,69,0.08)', boxShadow:'0 2px 8px rgba(11,37,69,0.04)' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{f.icon}</div>
              <h4 style={{ fontSize:14, fontWeight:700, color:navy, margin:'0 0 6px' }}>{f.title}</h4>
              <p style={{ fontSize:12, color:'rgba(11,37,69,0.5)', margin:0, lineHeight:1.6 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MySurveys() {
  var navigate = useNavigate();
  var { user } = useAuth();
  var [surveys, setSurveys] = useState([]);
  var [loading, setLoading] = useState(true);
  var [tab, setTab] = useState('all');
  var [search, setSearch] = useState('');
  var [expanded, setExpanded] = useState(null);

  useEffect(function() {
    if (!user) return;
    supabase.from('surveys').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
      .then(function(r) { setSurveys(r.data || []); setLoading(false); });
  }, [user]);

  var counts = surveys.reduce(function(a, s) { a[s.status] = (a[s.status]||0)+1; return a; }, {});
  var totalResp = surveys.reduce(function(a, s) { return a + (s.response_count||0); }, 0);

  var filtered = surveys.filter(function(s) {
    if (tab !== 'all' && s.status !== tab) return false;
    if (search && !(s.title||'').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300, fontFamily:sans }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(197,150,12,0.2)', borderTopColor:gold, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontSize:13, color:'rgba(11,37,69,0.4)', margin:0 }}>Loading your surveys...</p>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:sans, margin:'0 -24px', paddingBottom:40 }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
        @keyframes livepulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        .ms-btn { transition:all 0.2s ease; cursor:pointer; }
        .ms-btn:hover { transform:translateY(-1px); filter:brightness(1.08); }
        .ms-tab { transition:all 0.15s ease; cursor:pointer; }
        .ms-tab:not(.active):hover { background:rgba(11,37,69,0.07) !important; color:#0B2545 !important; }
        .ms-card { transition:transform 0.2s ease,box-shadow 0.2s ease; }
        .ms-card:hover { transform:translateY(-2px); box-shadow:0 16px 48px rgba(0,0,0,0.35) !important; }
        @media(max-width:960px){
          .ms-layout { flex-direction:column !important; }
          .ms-sidebar { width:100% !important; }
          .ms-hero-inner { flex-direction:column !important; align-items:flex-start !important; }
          .ms-feat-grid { grid-template-columns:1fr !important; }
        }
        @media(max-width:600px){
          .ms-hero { padding:24px 20px !important; }
          .ms-body { padding:20px 16px 0 !important; }
          .ms-controls { flex-direction:column !important; }
          .ms-tabs { flex-wrap:wrap !important; }
          .card-body { flex-direction:column !important; }
          .ms-feat-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* HERO */}
      <div style={{ background:'linear-gradient(140deg,'+navy+' 0%,'+blueMid+' 60%,#0f3060 100%)',
        borderBottom:'3px solid '+gold, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, pointerEvents:'none' }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            {[50,80,110,140].map(function(r,i){
              return <circle key={i} cx="140" cy="140" r={r} fill="none"
                stroke={i%2===0?gold:'#60a5fa'} strokeWidth="0.7" style={{opacity:0.1-i*0.015}} />;
            })}
          </svg>
        </div>
        <div className="ms-hero" style={{ padding:'36px 40px', position:'relative', zIndex:1 }}>
          <div className="ms-hero-inner" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, marginBottom: surveys.length>0 ? 24 : 0 }}>
            <div>
              <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:700, color:'#fff', margin:'0 0 5px', fontFamily:font }}>My Surveys</h1>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>Track and manage all your commissioned surveys</p>
            </div>
            <button className="ms-btn" onClick={function(){ navigate('/org/request'); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 22px',
                background:'linear-gradient(135deg,'+gold+','+goldLight+')', color:'#fff', border:'none',
                borderRadius:12, fontSize:14, fontWeight:700, boxShadow:'0 4px 16px rgba(197,150,12,0.35)',
                whiteSpace:'nowrap' }}>
              + New Survey Request
            </button>
          </div>
          {surveys.length > 0 && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { label:'Total Surveys',   val: surveys.length,              icon:'📋', color:gold },
                { label:'Live Now',        val: counts['active']||0,         icon:'🟢', color:'#34d399' },
                { label:'Total Responses', val: totalResp.toLocaleString(),  icon:'👥', color:'#60a5fa' },
                { label:'Completed',       val: counts['completed']||0,      icon:'✅', color:'#a78bfa' },
                { label:'Under Review',    val: counts['pending_review']||0, icon:'🔍', color:'#fbbf24' },
              ].map(function(stat, i) {
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10,
                    background:'rgba(255,255,255,0.07)', border:'1px solid '+stat.color+'25',
                    borderRadius:12, padding:'10px 16px', backdropFilter:'blur(4px)' }}>
                    <span style={{ fontSize:14 }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontSize:18, fontWeight:800, color:stat.color, fontFamily:font, lineHeight:1 }}>{stat.val}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:1 }}>{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="ms-body" style={{ padding:'28px 32px 0', maxWidth:1300, margin:'0 auto' }}>
        <div className="ms-layout" style={{ display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* LEFT: surveys */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Controls */}
            <div className="ms-controls" style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:'1', minWidth:200 }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.4 }}>🔍</span>
                <input value={search} onChange={function(e){ setSearch(e.target.value); }} placeholder="Search surveys..."
                  style={{ width:'100%', padding:'11px 14px 11px 38px', fontSize:13, boxSizing:'border-box',
                    background:'#fff', border:'1px solid rgba(11,37,69,0.18)',
                    borderRadius:12, outline:'none', fontFamily:sans, color:navy,
                    boxShadow:'0 1px 4px rgba(11,37,69,0.06)' }} />
              </div>
              <div className="ms-tabs" style={{ display:'flex', background:'rgba(11,37,69,0.05)',
                border:'1px solid rgba(11,37,69,0.12)', borderRadius:12, padding:4, gap:2 }}>
                {TABS.map(function(t) {
                  var isA = tab === t.k;
                  var cnt = t.k==='all' ? surveys.length : (counts[t.k]||0);
                  return (
                    <button key={t.k} className={'ms-tab'+(isA?' active':'')}
                      onClick={function(){ setTab(t.k); }}
                      style={{ padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                        border:'none',
                        background: isA ? 'linear-gradient(135deg,'+gold+','+goldLight+')' : 'transparent',
                        color: isA ? '#fff' : 'rgba(11,37,69,0.65)',
                        boxShadow: isA ? '0 2px 8px rgba(197,150,12,0.3)' : 'none' }}>
                      {t.l} <span style={{ opacity: isA ? 0.75 : 0.5, marginLeft:3 }}>{cnt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List or empty */}
            {filtered.length === 0 ? (
              <EmptyState navigate={navigate} tab={tab} search={search} />
            ) : (
              <div style={{ display:'grid', gap:14 }}>
                {filtered.map(function(s, idx) {
                  var st = STATUS[s.status] || STATUS.draft;
                  var resp = s.response_count || 0;
                  var target = s.target_responses || 0;
                  var pct = target > 0 ? Math.min(100, Math.round((resp/target)*100)) : null;
                  var qCount = Array.isArray(s.questions) ? s.questions.length : 0;
                  var isOpen = expanded === s.id;
                  var fCount = [s.target_state,s.target_race,s.target_sex,s.target_education,
                    s.target_employment,s.target_income,s.target_party,s.target_housing,
                    s.target_voter_registered,s.target_veteran,s.target_age_min,s.target_age_max].filter(Boolean).length;

                  return (
                    <div key={s.id} className="ms-card"
                      style={{ background:'linear-gradient(140deg,#0d2040,'+navy+')',
                        border:'1px solid '+st.border, borderRadius:18, overflow:'hidden',
                        boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                        animation:'fadeUp 0.35s ease both', animationDelay:idx*50+'ms' }}>
                      <div style={{ height:3, background:st.bar }} />
                      <div style={{ padding:'22px 26px' }}>
                        <div className="card-body" style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
                          {target > 0 && <ArcProgress value={resp} max={target} color={st.dot} />}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                              <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', margin:0, fontFamily:font, lineHeight:1.3 }}>{s.title}</h3>
                              <StatusPill status={s.status} />
                            </div>
                            {s.description && (
                              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:'0 0 12px', lineHeight:1.6 }}>{s.description}</p>
                            )}
                            <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
                              {[
                                { icon:'📅', text: new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) },
                                target>0 ? { icon:'👥', text:resp.toLocaleString()+' / '+target.toLocaleString()+' responses' } : null,
                                qCount>0 ? { icon:'📋', text:qCount+' question'+(qCount!==1?'s':'') } : null,
                                fCount>0 ? { icon:'🎯', text:fCount+' filter'+(fCount!==1?'s':'') } : null,
                              ].filter(Boolean).map(function(m, i) {
                                return (
                                  <span key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                                    <span style={{opacity:0.7}}>{m.icon}</span>{m.text}
                                  </span>
                                );
                              })}
                            </div>
                            {s.status==='rejected' && s.rejection_reason && (
                              <div style={{ marginTop:14, padding:'12px 16px',
                                background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:10 }}>
                                <p style={{ fontSize:12, fontWeight:700, color:'#f87171', margin:'0 0 4px' }}>⚠ Feedback from CivicVerify</p>
                                <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.6 }}>{s.rejection_reason}</p>
                              </div>
                            )}
                            {s.status==='active' && target>0 && (
                              <div style={{ marginTop:16 }}>
                                <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                                  <div style={{ height:'100%', borderRadius:3,
                                    background: pct>=100 ? '#34d399' : 'linear-gradient(90deg,'+gold+',#34d399)',
                                    width:pct+'%', transition:'width 1s ease',
                                    boxShadow: pct>=100 ? '0 0 8px #34d39980' : '0 0 8px '+gold+'80' }} />
                                </div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{resp.toLocaleString()} collected</span>
                                  <span style={{ fontSize:11, fontWeight:700, color: pct>=100 ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
                                    {pct>=100 ? '✓ Goal reached!' : (target-resp).toLocaleString()+' remaining'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Footer */}
                      <div style={{ padding:'12px 26px', borderTop:'1px solid rgba(255,255,255,0.05)',
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        background:'rgba(0,0,0,0.15)' }}>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.15)', fontFamily:'monospace' }}>
                          ID: {s.id.slice(0,8)}…
                        </span>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          {qCount > 0 && (
                            <button className="ms-btn" onClick={function(){ setExpanded(isOpen?null:s.id); }}
                              style={{ padding:'7px 14px', borderRadius:8,
                                border:'1px solid rgba(255,255,255,0.15)',
                                background: isOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                                color:'rgba(255,255,255,0.85)', fontSize:12, fontWeight:600 }}>
                              {isOpen ? '▲ Hide' : '▼ Questions'}
                            </button>
                          )}
                          {(s.status==='active'||s.status==='completed') && (
                            <button className="ms-btn" onClick={function(){ navigate('/org/results/'+s.id); }}
                              style={{ padding:'7px 18px', borderRadius:8, border:'none',
                                background:'linear-gradient(135deg,'+gold+','+goldLight+')',
                                color:'#fff', fontSize:12, fontWeight:700,
                                boxShadow:'0 2px 8px rgba(197,150,12,0.3)' }}>
                              View Results →
                            </button>
                          )}
                          {s.status==='rejected' && (
                            <button className="ms-btn" onClick={function(){ navigate('/org/request'); }}
                              style={{ padding:'7px 18px', borderRadius:8,
                                background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
                                color:'#fff', fontSize:12, fontWeight:700 }}>
                              Submit New Request →
                            </button>
                          )}
                          {s.status==='pending_review' && (
                            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(167,139,250,0.85)' }}>
                              <div style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa', animation:'livepulse 2s infinite' }} />
                              Review in progress
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Expandable questions */}
                      {isOpen && (
                        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',
                          background:'rgba(0,0,0,0.2)', padding:'20px 26px', animation:'fadeUp 0.25s ease' }}>
                          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
                            color:'rgba(255,255,255,0.25)', margin:'0 0 14px' }}>Survey Questions</p>
                          <div style={{ display:'grid', gap:8 }}>
                            {(s.questions||[]).map(function(q, qi) {
                              var icon = {multiple_choice:'◉',checkbox:'☑',text:'✏️',rating:'★'}[q.type]||'•';
                              return (
                                <div key={q.id||qi} style={{ display:'flex', gap:12, alignItems:'flex-start',
                                  padding:'12px 16px', background:'rgba(255,255,255,0.04)',
                                  borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                                  <span style={{ fontSize:13, color:gold, flexShrink:0, marginTop:1 }}>{icon}</span>
                                  <div style={{ flex:1 }}>
                                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', margin:'0 0 4px', fontWeight:500 }}>Q{qi+1}. {q.text}</p>
                                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'capitalize' }}>
                                        {(q.type||'').replace('_',' ')}
                                      </span>
                                      {q.required && <span style={{ fontSize:10, color:'#f87171', fontWeight:600 }}>Required</span>}
                                      {Array.isArray(q.options)&&q.options.length>0 && (
                                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>{q.options.join(' · ')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {fCount > 0 && (
                            <div style={{ marginTop:14, padding:'14px 16px',
                              background:'rgba(197,150,12,0.06)', borderRadius:10,
                              border:'1px solid rgba(197,150,12,0.15)' }}>
                              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
                                color:'rgba(255,255,255,0.25)', margin:'0 0 10px' }}>Audience Targeting</p>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                {[s.target_state,s.target_county,s.target_city,s.target_race,s.target_sex,
                                  s.target_education,s.target_employment,s.target_income,s.target_party,s.target_housing,
                                  s.target_age_min?'Age '+s.target_age_min+'+':null,
                                  s.target_age_max?'Under '+s.target_age_max:null,
                                  s.target_voter_registered==='Yes'?'Registered Voter':null,
                                  s.target_veteran==='Yes'?'Veteran':null,
                                ].filter(Boolean).map(function(tag, i) {
                                  return (
                                    <span key={i} style={{ padding:'4px 12px',
                                      background:'rgba(255,255,255,0.07)', border:'1px solid rgba(197,150,12,0.2)',
                                      borderRadius:20, fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.75)' }}>
                                      {tag}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="ms-sidebar" style={{ width:300, flexShrink:0, display:'grid', gap:16 }}>
            {surveys.length > 0 && <ResponseSummary surveys={surveys} />}
            <QuickActions navigate={navigate} />
            <HowItWorks />
            <Tips />
          </div>

        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <div style={{ marginTop:48, borderTop:'1px solid rgba(11,37,69,0.08)', background:'#fff' }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'32px 32px 24px' }}>

          {/* Top row: 3 columns */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32, marginBottom:28 }}>

            {/* About */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:8,
                  background:'linear-gradient(135deg,'+navy+','+blueMid+')',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🗳️</div>
                <span style={{ fontSize:14, fontWeight:700, color:navy, fontFamily:font }}>CivicVerify</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(11,37,69,0.45)', margin:0, lineHeight:1.7 }}>
                Authentic civic data from identity-verified citizens. No bots, no duplicates — just real public opinion reaching the people who need it.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
                color:'rgba(11,37,69,0.35)', margin:'0 0 12px' }}>Quick Links</p>
              <div style={{ display:'grid', gap:6 }}>
                {[
                  { label:'Request a Survey', path:'/org/request', icon:'📋' },
                  { label:'Billing & Credits', path:'/org/billing', icon:'💳' },
                  { label:'Organisation Profile', path:'/org/profile', icon:'⚙️' },
                  { label:'Dashboard', path:'/org', icon:'📊' },
                ].map(function(l, i) {
                  return (
                    <button key={i} onClick={function(){ navigate(l.path); }}
                      style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none',
                        cursor:'pointer', padding:0, textAlign:'left' }}>
                      <span style={{ fontSize:12 }}>{l.icon}</span>
                      <span style={{ fontSize:12, color:'rgba(11,37,69,0.55)', fontFamily:sans,
                        textDecoration:'none' }}
                        onMouseEnter={function(e){ e.target.style.color=gold; }}
                        onMouseLeave={function(e){ e.target.style.color='rgba(11,37,69,0.55)'; }}>
                        {l.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform stats */}
            <div>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5,
                color:'rgba(11,37,69,0.35)', margin:'0 0 12px' }}>Platform Highlights</p>
              <div style={{ display:'grid', gap:8 }}>
                {[
                  { icon:'✅', label:'100% Identity Verified', desc:'Every respondent verified via Didit' },
                  { icon:'🔒', label:'Privacy First', desc:'Data retained only as long as needed' },
                  { icon:'⚡', label:'Real-Time Results', desc:'Live response tracking as data comes in' },
                ].map(function(f, i) {
                  return (
                    <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{f.icon}</span>
                      <div>
                        <p style={{ fontSize:12, fontWeight:700, color:navy, margin:0 }}>{f.label}</p>
                        <p style={{ fontSize:11, color:'rgba(11,37,69,0.4)', margin:0 }}>{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:'1px solid rgba(11,37,69,0.07)', paddingTop:16,
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <p style={{ fontSize:11, color:'rgba(11,37,69,0.3)', margin:0 }}>
              © {new Date().getFullYear()} CivicVerify. Bridging citizens and policymakers through verified data.
            </p>
            <div style={{ display:'flex', gap:16 }}>
              {['Privacy Policy','Terms of Service','Contact Support'].map(function(l, i) {
                return (
                  <span key={i} style={{ fontSize:11, color:'rgba(11,37,69,0.35)', cursor:'pointer' }}
                    onMouseEnter={function(e){ e.target.style.color=gold; }}
                    onMouseLeave={function(e){ e.target.style.color='rgba(11,37,69,0.35)'; }}>
                    {l}
                  </span>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
