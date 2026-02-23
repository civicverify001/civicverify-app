// src/pages/org/MySurveys.jsx — Premium client-facing redesign
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#2D9B5A' };

var STATUS = {
  pending_review: { label: 'Under Review',  dot: '#8B5CF6', ring: 'rgba(139,92,246,0.12)', text: '#6D28D9',  desc: 'Being reviewed by our team' },
  active:         { label: 'Live',           dot: '#2D9B5A', ring: 'rgba(45,155,90,0.12)',  text: '#1A6E3C',  desc: 'Collecting responses now' },
  completed:      { label: 'Completed',      dot: '#3B82F6', ring: 'rgba(59,130,246,0.12)', text: '#1D4ED8',  desc: 'Survey has closed' },
  rejected:       { label: 'Needs Changes',  dot: '#B8352E', ring: 'rgba(184,53,46,0.12)',  text: '#B8352E',  desc: 'See rejection reason below' },
  draft:          { label: 'Draft',          dot: '#9CA3AF', ring: 'rgba(156,163,175,0.12)',text: '#6B7280',  desc: 'Not yet submitted' },
  closed:         { label: 'Closed',         dot: '#9CA3AF', ring: 'rgba(156,163,175,0.12)',text: '#6B7280',  desc: 'Survey ended' },
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
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:30, background:s.ring, border:'1px solid '+s.dot+'30', fontSize:12, fontWeight:700, color:s.text, letterSpacing:0.3 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0, boxShadow:status==='active'?'0 0 0 3px '+s.dot+'40':'none', animation:status==='active'?'cvpulse 2s infinite':'none' }} />
      {s.label}
    </span>
  );
}

function CircleProgress({ value, max, size=56, sw=4 }) {
  var pct = max > 0 ? Math.min(1, value / max) : 0;
  var r = (size - sw * 2) / 2;
  var circ = 2 * Math.PI * r;
  var color = pct >= 1 ? C.green : pct > 0.5 ? C.gold : '#94A3B8';
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(11,37,69,0.06)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={pct*circ+' '+circ} strokeLinecap="round" style={{ transition:'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

export default function MySurveys() {
  var navigate = useNavigate();
  var auth = useAuth(); var user = auth.user;
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

  var filtered = surveys.filter(function(s) {
    if (tab !== 'all' && s.status !== tab) return false;
    if (search && !s.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  var counts = surveys.reduce(function(a, s) { a[s.status] = (a[s.status]||0)+1; return a; }, {});
  var totalResp = surveys.reduce(function(a,s){return a+(s.response_count||0);},0);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(197,150,12,0.2)', borderTopColor:C.gold, borderRadius:'50%', animation:'cvspin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontSize:13, color:'rgba(11,37,69,0.3)', margin:0, fontFamily:'DM Sans, sans-serif' }}>Loading your surveys...</p>
      </div>
      <style>{'@keyframes cvspin{to{transform:rotate(360deg)}} @keyframes cvpulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes cvfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', maxWidth:920 }}>
      <style>{'@keyframes cvspin{to{transform:rotate(360deg)}} @keyframes cvpulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes cvfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} .cv-card{transition:all 0.2s ease} .cv-card:hover{transform:translateY(-2px)!important;box-shadow:0 10px 36px rgba(11,37,69,0.09)!important} .cv-tab:hover{background:rgba(11,37,69,0.04)!important;color:rgba(11,37,69,0.7)!important} .cv-btn:hover{opacity:0.88!important;transform:translateY(-1px)!important}'}</style>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:700, color:C.navy, margin:'0 0 6px', fontFamily:'Libre Baskerville, Georgia, serif' }}>My Surveys</h1>
            <p style={{ fontSize:14, color:'rgba(11,37,69,0.4)', margin:0 }}>Track and manage all your survey requests</p>
          </div>
          <button onClick={function(){navigate('/org/request');}}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px', background:C.gold, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(197,150,12,0.25)', letterSpacing:0.2 }}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> New Survey Request
          </button>
        </div>
        {surveys.length > 0 && (
          <div style={{ display:'flex', gap:6, marginTop:20, flexWrap:'wrap' }}>
            {[{l:'Total Surveys',v:surveys.length},{l:'Live Now',v:counts['active']||0,c:C.green},{l:'Total Responses',v:totalResp.toLocaleString()}].map(function(stat,i){
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', background:'#fff', borderRadius:10, border:'1px solid rgba(11,37,69,0.06)' }}>
                  <span style={{ fontSize:20, fontWeight:800, color:stat.c||C.navy, fontFamily:'Libre Baskerville,serif' }}>{stat.v}</span>
                  <span style={{ fontSize:12, color:'rgba(11,37,69,0.4)', fontWeight:600 }}>{stat.l}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1', minWidth:200 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', opacity:0.25 }}>🔍</span>
          <input value={search} onChange={function(e){setSearch(e.target.value);}} placeholder="Search surveys..."
            style={{ width:'100%', padding:'10px 14px 10px 36px', fontSize:13, border:'1px solid rgba(11,37,69,0.08)', borderRadius:10, outline:'none', fontFamily:'inherit', background:'#fff', color:C.navy, boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'flex', background:'#fff', border:'1px solid rgba(11,37,69,0.07)', borderRadius:12, padding:4, gap:2, flexWrap:'wrap' }}>
          {TABS.map(function(t){
            var isA = tab===t.k;
            var cnt = t.k==='all' ? surveys.length : (counts[t.k]||0);
            return (
              <button key={t.k} className="cv-tab"
                onClick={function(){setTab(t.k);}}
                style={{ padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap', background:isA?C.navy:'transparent', color:isA?'#fff':'rgba(11,37,69,0.4)', transition:'all 0.15s' }}>
                {t.l} <span style={{opacity:0.5,marginLeft:2}}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:20, border:'1px solid rgba(11,37,69,0.06)', padding:'64px 32px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <p style={{ fontSize:18, fontWeight:700, color:C.navy, margin:'0 0 8px', fontFamily:'Libre Baskerville,serif' }}>
            {search ? `No results for "${search}"` : 'No surveys yet'}
          </p>
          <p style={{ fontSize:14, color:'rgba(11,37,69,0.35)', margin:'0 0 24px' }}>
            {tab==='all'&&!search ? 'Submit your first survey request to get started' : 'Try adjusting your filters'}
          </p>
          {tab==='all'&&!search && (
            <button onClick={function(){navigate('/org/request');}} style={{ padding:'12px 24px', background:C.gold, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Request Your First Survey →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gap:16 }}>
          {filtered.map(function(s, idx) {
            var st = STATUS[s.status]||STATUS.draft;
            var resp = s.response_count||0;
            var target = s.target_responses||0;
            var pct = target>0 ? Math.min(100, Math.round((resp/target)*100)) : null;
            var qCount = Array.isArray(s.questions) ? s.questions.length : 0;
            var isOpen = expanded===s.id;
            var fCount = [s.target_state,s.target_race,s.target_sex,s.target_education,s.target_employment,s.target_income,s.target_party,s.target_housing,s.target_voter_registered,s.target_veteran,s.target_age_min,s.target_age_max].filter(Boolean).length;

            return (
              <div key={s.id} className="cv-card"
                style={{ background:'#fff', borderRadius:18, border:s.status==='active'?'1.5px solid rgba(45,155,90,0.2)':'1px solid rgba(11,37,69,0.06)', overflow:'hidden', animation:'cvfade 0.35s ease both', animationDelay:idx*40+'ms', boxShadow:s.status==='active'?'0 4px 24px rgba(45,155,90,0.06)':'0 2px 8px rgba(11,37,69,0.04)' }}>

                {/* Accent top bar */}
                {s.status==='active' && <div style={{ height:3, background:'linear-gradient(90deg,'+C.green+','+C.gold+')' }} />}
                {s.status==='pending_review' && <div style={{ height:3, background:'linear-gradient(90deg,#8B5CF6,#EC4899)' }} />}
                {s.status==='rejected' && <div style={{ height:3, background:C.red }} />}

                {/* Body */}
                <div style={{ padding:'22px 26px' }}>
                  <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    {/* Circle progress */}
                    {target > 0 && (
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <CircleProgress value={resp} max={target} size={56} sw={4} />
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:11, fontWeight:800, color:C.navy }}>{pct}%</span>
                        </div>
                      </div>
                    )}

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:8 }}>
                        <h3 style={{ fontSize:17, fontWeight:700, color:C.navy, margin:0, fontFamily:'Libre Baskerville,Georgia,serif', lineHeight:1.3 }}>{s.title}</h3>
                        <StatusPill status={s.status} />
                      </div>

                      {s.description && <p style={{ fontSize:13, color:'rgba(11,37,69,0.45)', margin:'0 0 12px', lineHeight:1.5 }}>{s.description}</p>}

                      {/* Meta */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
                        {[
                          { icon:'📅', text: new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) },
                          target>0 ? { icon:'👥', text: resp.toLocaleString()+' / '+target.toLocaleString()+' responses' } : null,
                          qCount>0 ? { icon:'📋', text: qCount+' question'+(qCount!==1?'s':'') } : null,
                          fCount>0 ? { icon:'🎯', text: fCount+' filter'+(fCount!==1?'s':'') } : null,
                        ].filter(Boolean).map(function(m,i){
                          return <span key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(11,37,69,0.4)' }}><span style={{opacity:0.6}}>{m.icon}</span>{m.text}</span>;
                        })}
                      </div>

                      {/* Rejection reason */}
                      {s.status==='rejected' && s.rejection_reason && (
                        <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(184,53,46,0.05)', border:'1px solid rgba(184,53,46,0.15)', borderRadius:10 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.red, margin:'0 0 3px' }}>⚠ Feedback from CivicVerify</p>
                          <p style={{ fontSize:12, color:'rgba(11,37,69,0.55)', margin:0, lineHeight:1.5 }}>{s.rejection_reason}</p>
                        </div>
                      )}

                      {/* Live progress bar */}
                      {s.status==='active' && target>0 && (
                        <div style={{ marginTop:14 }}>
                          <div style={{ width:'100%', height:6, background:'rgba(11,37,69,0.05)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:3, background:pct>=100?C.green:'linear-gradient(90deg,'+C.gold+','+C.green+')', width:pct+'%', transition:'width 0.8s ease' }} />
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                            <span style={{ fontSize:11, color:'rgba(11,37,69,0.3)' }}>{resp.toLocaleString()} collected</span>
                            <span style={{ fontSize:11, color:pct>=100?C.green:'rgba(11,37,69,0.3)', fontWeight:pct>=100?700:400 }}>
                              {pct>=100 ? '✓ Goal reached!' : (target-resp).toLocaleString()+' remaining'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding:'12px 26px 14px', borderTop:'1px solid rgba(11,37,69,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(245,241,236,0.3)' }}>
                  <span style={{ fontSize:11, color:'rgba(11,37,69,0.2)', fontFamily:'monospace' }}>ID: {s.id.slice(0,8)}…</span>
                  <div style={{ display:'flex', gap:8 }}>
                    {qCount > 0 && (
                      <button className="cv-btn"
                        onClick={function(){setExpanded(isOpen?null:s.id);}}
                        style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(11,37,69,0.1)', background:isOpen?C.navy:'#fff', color:isOpen?'#fff':'rgba(11,37,69,0.5)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                        {isOpen ? '▲ Hide' : '▼ View Questions'}
                      </button>
                    )}
                    {(s.status==='active'||s.status==='completed') && (
                      <button className="cv-btn"
                        onClick={function(){navigate('/org/results/'+s.id);}}
                        style={{ padding:'7px 18px', borderRadius:8, border:'none', background:C.gold, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(197,150,12,0.2)', transition:'all 0.15s' }}>
                        View Results →
                      </button>
                    )}
                    {s.status==='rejected' && (
                      <button className="cv-btn"
                        onClick={function(){navigate('/org/request');}}
                        style={{ padding:'7px 18px', borderRadius:8, border:'none', background:C.navy, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                        Submit New Request →
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable questions */}
                {isOpen && (
                  <div style={{ borderTop:'1px solid rgba(11,37,69,0.06)', background:'rgba(245,241,236,0.35)', padding:'18px 26px' }}>
                    <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'rgba(11,37,69,0.3)', margin:'0 0 12px' }}>Survey Questions</p>
                    <div style={{ display:'grid', gap:8 }}>
                      {(s.questions||[]).map(function(q,qi){
                        var icon = {multiple_choice:'◉',checkbox:'☑',text:'✏️',rating:'★'}[q.type]||'?';
                        return (
                          <div key={q.id||qi} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px', background:'#fff', borderRadius:10, border:'1px solid rgba(11,37,69,0.05)' }}>
                            <span style={{ fontSize:13, color:C.gold, flexShrink:0, marginTop:1 }}>{icon}</span>
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:13, color:C.navy, margin:'0 0 3px', fontWeight:500 }}>Q{qi+1}. {q.text}</p>
                              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                <span style={{ fontSize:10, color:'rgba(11,37,69,0.3)', textTransform:'capitalize' }}>{(q.type||'').replace('_',' ')}</span>
                                {q.required && <span style={{ fontSize:10, color:'rgba(184,53,46,0.7)', fontWeight:600 }}>Required</span>}
                                {Array.isArray(q.options)&&q.options.length>0 && <span style={{ fontSize:10, color:'rgba(11,37,69,0.25)' }}>{q.options.join(' · ')}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Targeting tags */}
                    {fCount > 0 && (
                      <div style={{ marginTop:14, padding:'12px 14px', background:C.gold+'06', borderRadius:10, border:'1px solid '+C.gold+'15' }}>
                        <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, color:'rgba(11,37,69,0.3)', margin:'0 0 8px' }}>Audience Targeting</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {[s.target_state,s.target_county,s.target_city,s.target_race,s.target_sex,s.target_education,s.target_employment,s.target_income,s.target_party,s.target_housing,
                            s.target_age_min?'Age '+s.target_age_min+'+':null, s.target_age_max?'Under '+s.target_age_max:null,
                            s.target_voter_registered==='Yes'?'Registered Voter':null, s.target_veteran==='Yes'?'Veteran':null,
                          ].filter(Boolean).map(function(tag,i){
                            return <span key={i} style={{ padding:'3px 10px', background:'#fff', border:'1px solid rgba(197,150,12,0.2)', borderRadius:20, fontSize:11, fontWeight:600, color:C.navy }}>{tag}</span>;
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

      {filtered.length > 0 && (
        <p style={{ marginTop:20, textAlign:'center', fontSize:12, color:'rgba(11,37,69,0.25)' }}>
          Showing {filtered.length} of {surveys.length} survey{surveys.length!==1?'s':''}
        </p>
      )}
    </div>
  );
}
