// src/pages/org/Results.jsx — Premium with Excel + PDF download reports
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#2D9B5A' };
var PALETTE = ['#0B2545','#C5960C','#2D9B5A','#4A7FBD','#D15F3E','#6B5EA8','#5A8FA0','#E8A838'];
var font = 'Libre Baskerville, Georgia, serif';

function pct(n, t) { return t ? Math.round(n / t * 100) : 0; }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    var s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.3)', margin: '0 0 8px' }}>{label}</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: C.navy, margin: '0 0 4px', fontFamily: font, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 22, opacity: 0.18 }}>{icon}</span>}
      </div>
    </div>
  );
}

function MCChart({ question, answers }) {
  var opts = question.options || [];
  var total = answers.length || 1;
  var data = opts.map(function(opt, i) {
    var cnt = answers.filter(function(a) { return a === opt; }).length;
    return { name: opt, count: cnt, p: pct(cnt, total), fill: PALETTE[i % PALETTE.length] };
  });
  var maxCount = Math.max.apply(null, data.map(function(d) { return d.count; }).concat([1]));
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.map(function(d, i) {
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: d.fill, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: d.count > 0 ? C.navy : 'rgba(11,37,69,0.25)' }}>
                {d.count > 0 ? d.count + ' (' + d.p + '%)' : '\u2014'}
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(11,37,69,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: d.fill, width: (d.count / maxCount * 100) + '%', opacity: d.count === 0 ? 0.15 : 1, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '4px 0 0', textAlign: 'right' }}>{answers.length} total response{answers.length !== 1 ? 's' : ''}</p>
    </div>
  );
}

function RatingChart({ answers, scale }) {
  if (!scale) scale = 5;
  var total = answers.length || 1;
  var avg = answers.length > 0 ? (answers.reduce(function(s, a) { return s + Number(a); }, 0) / answers.length).toFixed(1) : null;
  var buckets = [];
  for (var v = scale; v >= 1; v--) {
    var cnt = answers.filter(function(a) { return Number(a) === v; }).length;
    buckets.push({ value: v, count: cnt, p: pct(cnt, total) });
  }
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(197,150,12,0.05)', borderRadius: 16, border: '1px solid rgba(197,150,12,0.12)' }}>
        <p style={{ fontSize: 48, fontWeight: 800, color: C.gold, margin: 0, fontFamily: font, lineHeight: 1 }}>{avg || '\u2014'}</p>
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: '4px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>avg / {scale}</p>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        {buckets.map(function(b) {
          return (
            <div key={b.value} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', width: 28, textAlign: 'right', fontWeight: 600 }}>{b.value}\u2605</span>
              <div style={{ flex: 1, height: 7, background: 'rgba(11,37,69,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,' + C.gold + ',' + C.green + ')', width: b.p + '%', transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.4)', width: 32, fontWeight: 600 }}>{b.p}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YesNoChart({ answers }) {
  var yes = answers.filter(function(a) { return a === 'Yes' || a === true || a === 'true'; }).length;
  var no = answers.length - yes;
  var total = answers.length || 1;
  var data = [{ name: 'Yes', value: yes, fill: C.green }, { name: 'No', value: no, fill: C.red }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ width: 130, height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {data.map(function(d, i) { return <Cell key={i} fill={d.fill} />; })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {data.map(function(d) {
          return (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1 }}>{pct(d.value, total)}%</p>
                <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.4)', margin: '2px 0 0' }}>{d.name} \u00b7 {d.value} votes</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextResponses({ answers }) {
  var shown = useState(false);
  var showAll = shown[0]; var setShowAll = shown[1];
  var visible = showAll ? answers : answers.slice(0, 5);
  if (!answers.length) return <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.3)', fontStyle: 'italic' }}>No responses yet.</p>;
  return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {visible.map(function(a, i) {
          return <div key={i} style={{ padding: '11px 14px', background: 'rgba(245,241,236,0.6)', borderRadius: 10, border: '1px solid rgba(11,37,69,0.06)', fontSize: 13, color: C.navy, lineHeight: 1.5, fontStyle: 'italic' }}>"{a}"</div>;
        })}
      </div>
      {answers.length > 5 && (
        <button onClick={function() { setShowAll(!showAll); }} style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
          {showAll ? '\u25b2 Show less' : '\u25bc Show all ' + answers.length + ' responses'}
        </button>
      )}
    </div>
  );
}

function QuestionCard({ question, idx, answers }) {
  var typeLabel = { multiple_choice: 'Multiple Choice', rating: 'Rating Scale', text: 'Open-ended', yes_no: 'Yes / No', checkbox: 'Checkbox' };
  var typeIcon = { multiple_choice: '\u25c9', rating: '\u2605', text: '\u270f', yes_no: '\u2713\u2717', checkbox: '\u2611' };
  var responded = answers.filter(function(a) { return a !== null && a !== undefined && a !== ''; }).length;
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(11,37,69,0.04)', animation: 'rfade 0.4s ease both', animationDelay: idx * 60 + 'ms' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(11,37,69,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: C.navy, color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>Q{idx + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.3)' }}>
                {typeIcon[question.type] || '?'} {typeLabel[question.type] || question.type}
                {question.required && <span style={{ color: C.red, marginLeft: 6 }}>Required</span>}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, lineHeight: 1.4 }}>{question.text}</h3>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: responded > 0 ? C.navy : 'rgba(11,37,69,0.2)', margin: 0, fontFamily: font }}>{responded}</p>
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: '2px 0 0', fontWeight: 600 }}>response{responded !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '18px 24px' }}>
        {(question.type === 'multiple_choice' || question.type === 'checkbox') && <MCChart question={question} answers={answers} />}
        {question.type === 'rating' && <RatingChart answers={answers} scale={question.scale || 5} />}
        {question.type === 'yes_no' && <YesNoChart answers={answers} />}
        {question.type === 'text' && <TextResponses answers={answers} />}
      </div>
    </div>
  );
}

function DemoBar({ label, value, total, color }) {
  var p = pct(value, total);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.6)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{p}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(11,37,69,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: p + '%', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function ReportDropdown({ onExcel, onPDF, loading }) {
  var openState = useState(false);
  var open = openState[0]; var setOpen = openState[1];
  var ref = useRef(null);
  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return function() { document.removeEventListener('mousedown', handler); };
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={function() { setOpen(!open); }} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: loading ? 'rgba(197,150,12,0.6)' : C.gold, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(197,150,12,0.3)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        {loading
          ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'rspin 0.8s linear infinite' }} /> Generating report...</>
          : <>\uD83D\uDCC4 Download Report <span style={{ opacity: 0.65, fontSize: 10 }}>{open ? '\u25b2' : '\u25bc'}</span></>
        }
      </button>
      {open && !loading && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.08)', boxShadow: '0 16px 48px rgba(11,37,69,0.16)', zIndex: 60, overflow: 'hidden', minWidth: 230 }}>
          <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(11,37,69,0.3)', margin: 0 }}>Select format</p>
          </div>
          {[
            { icon: '\uD83D\uDCCA', label: 'Excel Report (.xlsx)', desc: 'Data tables, color coding & charts', fn: onExcel },
            { icon: '\uD83D\uDCD1', label: 'PDF Report (.pdf)', desc: 'Branded report, ready to share', fn: onPDF },
          ].map(function(item, i) {
            return (
              <button key={i} onClick={function() { setOpen(false); item.fn(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i === 0 ? '1px solid rgba(11,37,69,0.05)' : 'none' }}
                onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(11,37,69,0.02)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function generateExcel(survey, responses, respondents, getAnswersFn) {
  await loadScript('https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js');
  var XLSX = window.XLSX;
  var wb = XLSX.utils.book_new();
  var questions = survey.questions || [];
  var respCount = responses.length;
  var target = survey.target_responses || 0;
  var compPct = target > 0 ? Math.min(100, Math.round(respCount / target * 100)) : 0;

  var navyFill  = { patternType: 'solid', fgColor: { rgb: '0B2545' } };
  var goldFill  = { patternType: 'solid', fgColor: { rgb: 'C5960C' } };
  var lightFill = { patternType: 'solid', fgColor: { rgb: 'F5F1EC' } };
  var greenFill = { patternType: 'solid', fgColor: { rgb: 'E8F8EE' } };
  var redFill   = { patternType: 'solid', fgColor: { rgb: 'FDE8E8' } };
  var whiteFill = { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } };
  var altFill   = { patternType: 'solid', fgColor: { rgb: 'F8FAFF' } };
  var headFill  = { patternType: 'solid', fgColor: { rgb: 'E8EEF7' } };
  var goldLight = { patternType: 'solid', fgColor: { rgb: 'FFF8E8' } };

  var bwh = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Arial' };
  var bna = { bold: true, color: { rgb: '0B2545' }, sz: 11, name: 'Arial' };
  var bgo = { bold: true, color: { rgb: 'C5960C' }, sz: 11, name: 'Arial' };
  var bsm = { bold: true, color: { rgb: '0B2545' }, sz: 9,  name: 'Arial' };
  var nor = { color: { rgb: '333355' }, sz: 10, name: 'Arial' };
  var sml = { color: { rgb: '666688' }, sz: 9,  name: 'Arial' };
  var cen = { horizontal: 'center', vertical: 'center', wrapText: true };
  var lft = { horizontal: 'left',   vertical: 'center', wrapText: true };
  var thn = { bottom: { style: 'thin', color: { rgb: 'DDEEFF' } }, right: { style: 'thin', color: { rgb: 'DDEEFF' } } };

  function c(v, f, fi, al, bo) {
    return { v: v, t: typeof v === 'number' ? 'n' : 's', s: { font: f || nor, fill: fi || whiteFill, alignment: al || lft, border: bo || thn } };
  }

  // ── Summary Sheet ────────────────────────────────────────────────────────────
  var ss = [];
  ss.push([c('', bwh, navyFill), c('CIVICVERIFY \u2014 SURVEY RESULTS REPORT', { bold:true, color:{rgb:'C5960C'}, sz:18, name:'Arial' }, navyFill, cen), c('',bwh,navyFill), c('',bwh,navyFill), c('',bwh,navyFill)]);
  ss.push([c('', bwh, navyFill), c(survey.title || 'Survey Report', { bold:true, color:{rgb:'FFFFFF'}, sz:14, name:'Arial' }, navyFill, cen), c('',bwh,navyFill), c('',bwh,navyFill), c('',bwh,navyFill)]);
  ss.push([c('', sml, navyFill), c('Generated: ' + fmtDate(new Date().toISOString()), { italic:true, color:{rgb:'AABBCC'}, sz:9, name:'Arial' }, navyFill, cen), c('',sml,navyFill), c('',sml,navyFill), c('',sml,navyFill)]);
  ss.push([]);

  ss.push([c('\u2003SURVEY OVERVIEW', bgo, lightFill), c('',bgo,lightFill), c('',bgo,lightFill), c('',bgo,lightFill), c('',bgo,lightFill)]);
  ss.push([c('Field', bna, headFill), c('Value', bna, headFill), c('', bna, headFill), c('', bna, headFill), c('',bna,headFill)]);
  [
    ['Survey Title', survey.title || '\u2014'],
    ['Submitted', fmtDate(survey.created_at)],
    ['Status', (survey.status||'unknown').replace(/_/g,' ')],
    ['Total Responses', respCount],
    ['Target Responses', target || '\u2014'],
    ['Completion', target > 0 ? compPct + '%' : 'No target set'],
    ['Questions', questions.length],
  ].forEach(function(r, i) {
    var f = i % 2 === 0 ? whiteFill : altFill;
    ss.push([c(r[0], bsm, f), c(r[1], nor, f), c('',nor,f), c('',nor,f), c('',nor,f)]);
  });
  ss.push([]);

  if (target > 0) {
    ss.push([c('\u2003RESPONSE PROGRESS', bgo, lightFill), c('',bgo,lightFill), c('',bgo,lightFill), c('',bgo,lightFill), c('',bgo,lightFill)]);
    var barLen = 30;
    var filled = Math.round(compPct / 100 * barLen);
    var bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barLen - filled);
    ss.push([c('Progress Bar', bsm, whiteFill), c(bar, { color:{rgb: compPct>=100 ? '2D9B5A' : 'C5960C'}, sz:10, name:'Courier New' }, whiteFill)]);
    ss.push([c('Collected', bsm, altFill), c(respCount + ' of ' + target + ' responses (' + compPct + '%)', nor, altFill)]);
    ss.push([c('Remaining', bsm, whiteFill), c(Math.max(0, target - respCount) + ' responses left', nor, whiteFill)]);
    ss.push([]);
  }

  if (survey.demographic_filters) {
    var entries = Object.entries(survey.demographic_filters).filter(function(e) { return e[1] && (Array.isArray(e[1]) ? e[1].length > 0 : true); });
    if (entries.length > 0) {
      ss.push([c('\u2003TARGETING CRITERIA', bgo, lightFill), c('',bgo,lightFill), c('',bgo,lightFill), c('',bgo,lightFill), c('',bgo,lightFill)]);
      ss.push([c('Filter', bna, headFill), c('Values', bna, headFill), c('',bna,headFill), c('',bna,headFill), c('',bna,headFill)]);
      entries.forEach(function(e, i) {
        var f = i % 2 === 0 ? whiteFill : altFill;
        ss.push([c(e[0].replace(/_/g,' '), bsm, f), c(Array.isArray(e[1]) ? e[1].join(', ') : String(e[1]), nor, f), c('',nor,f), c('',nor,f), c('',nor,f)]);
      });
    }
  }

  var sumSh = XLSX.utils.aoa_to_sheet(ss);
  sumSh['!merges'] = [
    {s:{r:0,c:1},e:{r:0,c:4}}, {s:{r:1,c:1},e:{r:1,c:4}}, {s:{r:2,c:1},e:{r:2,c:4}},
  ];
  sumSh['!cols'] = [{wch:3},{wch:30},{wch:30},{wch:20},{wch:15}];
  sumSh['!rows'] = [{hpt:40},{hpt:28},{hpt:18}];
  XLSX.utils.book_append_sheet(wb, sumSh, 'Summary');

  // ── Question Results Sheet ───────────────────────────────────────────────────
  var qrs = [];
  qrs.push([c('QUESTION RESULTS', { bold:true, color:{rgb:'FFFFFF'}, sz:16, name:'Arial' }, navyFill, cen), c('',bwh,navyFill), c('',bwh,navyFill), c('',bwh,navyFill), c('',bwh,navyFill)]);
  qrs.push([c(survey.title || '', { bold:true, color:{rgb:'C5960C'}, sz:12, name:'Arial' }, navyFill, cen), c('',bwh,navyFill), c('',bwh,navyFill), c('',bwh,navyFill), c('',bwh,navyFill)]);
  qrs.push([]);

  questions.forEach(function(q, qi) {
    var answers = getAnswersFn(q.id, qi);
    var responded = answers.filter(function(a) { return a !== null && a !== undefined && a !== ''; }).length;
    var qTotal = responded || 1;

    qrs.push([c('Q' + (qi+1), { bold:true, color:{rgb:'FFFFFF'}, sz:12, name:'Arial' }, goldFill, cen), c(q.text || '', { bold:true, color:{rgb:'FFFFFF'}, sz:11, name:'Arial' }, goldFill), c('',bwh,goldFill), c('',bwh,goldFill), c('',bwh,goldFill)]);
    qrs.push([c('Type: ' + (q.type||'').replace(/_/g,' '), { italic:true, color:{rgb:'666688'}, sz:9, name:'Arial' }, goldLight), c(responded + ' responses', { italic:true, color:{rgb:'666688'}, sz:9, name:'Arial' }, goldLight), c('',sml,goldLight), c('',sml,goldLight), c('',sml,goldLight)]);

    if (q.type === 'multiple_choice' || q.type === 'checkbox') {
      qrs.push([c('Option', bna, headFill), c('Responses', bna, headFill, cen), c('Share', bna, headFill, cen), c('Visual Distribution', bna, headFill), c('',bna,headFill)]);
      (q.options || []).forEach(function(opt, oi) {
        var cnt = answers.filter(function(a) { return a === opt; }).length;
        var p2 = Math.round(cnt / qTotal * 100);
        var b2 = '\u25a0'.repeat(Math.round(p2/100*20)) + '\u25a1'.repeat(20-Math.round(p2/100*20));
        var rf = oi % 2 === 0 ? whiteFill : altFill;
        qrs.push([c(opt, nor, rf), c(cnt, { bold: cnt>0, color:{rgb: cnt>0 ? '0B2545' : '999999'}, sz:10, name:'Arial' }, rf, cen), c(p2 + '%', { bold: p2>0, color:{rgb: p2>0 ? 'C5960C' : 'AAAAAA'}, sz:10, name:'Arial' }, rf, cen), c(b2, { color:{rgb: p2>0 ? '0B2545' : 'CCCCCC'}, sz:9, name:'Courier New' }, rf), c('',nor,rf)]);
      });
    } else if (q.type === 'rating') {
      var scale = q.scale || 5;
      var avg2 = answers.length > 0 ? (answers.reduce(function(s,a){return s+Number(a);},0)/answers.length).toFixed(2) : '\u2014';
      qrs.push([c('Rating', bna, headFill), c('Count', bna, headFill, cen), c('%', bna, headFill, cen), c('Distribution', bna, headFill), c('',bna,headFill)]);
      for (var rv = scale; rv >= 1; rv--) {
        var rCnt = answers.filter(function(a){return Number(a)===rv;}).length;
        var rPct = Math.round(rCnt/qTotal*100);
        var stars = '\u2605'.repeat(rv) + '\u2606'.repeat(scale-rv);
        var bbar = '\u25a0'.repeat(Math.round(rPct/100*20)) + '\u25a1'.repeat(20-Math.round(rPct/100*20));
        var rf2 = (scale-rv) % 2 === 0 ? whiteFill : altFill;
        qrs.push([c(stars + ' (' + rv + '/' + scale + ')', nor, rf2), c(rCnt, {bold:rCnt>0, color:{rgb:'0B2545'}, sz:10, name:'Arial'}, rf2, cen), c(rPct+'%', {color:{rgb:rPct>0?'C5960C':'AAAAAA'}, sz:10, name:'Arial'}, rf2, cen), c(bbar, {color:{rgb:rPct>0?'0B2545':'CCCCCC'}, sz:9, name:'Courier New'}, rf2), c('',nor,rf2)]);
      }
      qrs.push([c('AVERAGE SCORE', {bold:true, color:{rgb:'2D9B5A'}, sz:11, name:'Arial'}, greenFill), c(avg2, {bold:true, color:{rgb:'2D9B5A'}, sz:14, name:'Arial'}, greenFill, cen), c('out of ' + scale, {italic:true, color:{rgb:'2D9B5A'}, sz:10, name:'Arial'}, greenFill), c('',nor,greenFill), c('',nor,greenFill)]);
    } else if (q.type === 'yes_no') {
      var yes3 = answers.filter(function(a){return a==='Yes'||a===true||a==='true';}).length;
      var no3 = responded - yes3;
      qrs.push([c('YES', {bold:true, color:{rgb:'2D9B5A'}, sz:14, name:'Arial'}, greenFill), c(yes3, {bold:true, color:{rgb:'2D9B5A'}, sz:14, name:'Arial'}, greenFill, cen), c(Math.round(yes3/qTotal*100)+'%', {bold:true, color:{rgb:'2D9B5A'}, sz:14, name:'Arial'}, greenFill, cen), c('',nor,greenFill), c('',nor,greenFill)]);
      qrs.push([c('NO', {bold:true, color:{rgb:'B8352E'}, sz:14, name:'Arial'}, redFill), c(no3, {bold:true, color:{rgb:'B8352E'}, sz:14, name:'Arial'}, redFill, cen), c(Math.round(no3/qTotal*100)+'%', {bold:true, color:{rgb:'B8352E'}, sz:14, name:'Arial'}, redFill, cen), c('',nor,redFill), c('',nor,redFill)]);
    } else if (q.type === 'text') {
      answers.slice(0,20).forEach(function(ans, ai) {
        var rf3 = ai % 2 === 0 ? whiteFill : altFill;
        qrs.push([c('#'+(ai+1), sml, rf3, cen), c(String(ans), nor, rf3), c('',nor,rf3), c('',nor,rf3), c('',nor,rf3)]);
      });
    }
    qrs.push([]); qrs.push([]);
  });

  var qSheet = XLSX.utils.aoa_to_sheet(qrs);
  qSheet['!merges'] = [{s:{r:0,c:0},e:{r:0,c:4}}, {s:{r:1,c:0},e:{r:1,c:4}}];
  qSheet['!cols'] = [{wch:32},{wch:12},{wch:12},{wch:28},{wch:10}];
  qSheet['!rows'] = [{hpt:36},{hpt:26}];
  XLSX.utils.book_append_sheet(wb, qSheet, 'Question Results');

  // ── Raw Data Sheet ───────────────────────────────────────────────────────────
  var rawHdrs = [c('Response ID', bna, headFill), c('Date', bna, headFill)].concat(
    questions.map(function(q, i) { return c('Q'+(i+1)+': '+q.text, bna, headFill); })
  );
  var rawRows = [rawHdrs];
  responses.forEach(function(r, ri) {
    var ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers || [];
    var rf = ri % 2 === 0 ? whiteFill : altFill;
    rawRows.push(
      [c(r.id ? r.id.slice(0,8)+'...' : '\u2014', {color:{rgb:'999999'}, sz:8, name:'Courier New'}, rf),
       c(r.created_at ? r.created_at.slice(0,10) : '\u2014', nor, rf)].concat(
        questions.map(function(q, qi) {
          var a = Array.isArray(ans) ? (ans.find(function(x){return x&&x.question_id===q.id;}) || ans[qi]) : '';
          return c(String(typeof a === 'object' ? JSON.stringify(a) : a ?? ''), nor, rf);
        })
      )
    );
  });
  var rawSheet = XLSX.utils.aoa_to_sheet(rawRows);
  rawSheet['!cols'] = [{wch:14},{wch:12}].concat(questions.map(function(){return {wch:28};}));
  XLSX.utils.book_append_sheet(wb, rawSheet, 'Raw Responses');

  XLSX.writeFile(wb, 'CivicVerify_' + (survey.title||'Report').replace(/\s+/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.xlsx');
}

async function generatePDF(survey, responses, respondents, getAnswersFn) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  var W = doc.internal.pageSize.getWidth();
  var H = doc.internal.pageSize.getHeight();
  var m = 48;
  var questions = survey.questions || [];
  var respCount = responses.length;
  var target = survey.target_responses || 0;
  var compPct = target > 0 ? Math.min(100, Math.round(respCount / target * 100)) : 0;
  var NAVY = [11,37,69]; var GOLD = [197,150,12]; var GREEN = [45,155,90]; var RED = [184,53,46]; var CREAM = [245,241,236]; var LBLUE = [235,243,255];
  var pageN = 0;

  function header(first) {
    pageN++;
    doc.setFillColor.apply(doc, NAVY); doc.rect(0, 0, W, first ? 115 : 46, 'F');
    doc.setFillColor.apply(doc, GOLD); doc.rect(0, first ? 115 : 46, W, 3, 'F');
    if (first) {
      doc.setFont('helvetica','bold'); doc.setFontSize(11);
      doc.setTextColor.apply(doc, GOLD); doc.text('CIVIC', m, 34);
      var cw = doc.getTextWidth('CIVIC');
      doc.setTextColor(255,255,255); doc.text('VERIFY', m+cw+2, 34);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(170,185,210); doc.text('Verified Civic Intelligence Platform', m, 47);
      doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(255,255,255);
      var title = survey.title || 'Survey Report';
      if (doc.getTextWidth(title) > W - m*2) { doc.setFontSize(15); }
      doc.text(title, m, 82);
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(165,180,205);
      doc.text('Survey Results Report  \u00b7  Generated ' + fmtDate(new Date().toISOString()), m, 99);
    } else {
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor.apply(doc, GOLD); doc.text('CIVICVERIFY', m, 24);
      doc.setFont('helvetica','normal'); doc.setTextColor(200,210,230); doc.text('  \u00b7  ' + (survey.title||''), m + doc.getTextWidth('CIVICVERIFY') + 2, 24);
      doc.setTextColor(155,170,195); doc.text('Page ' + pageN, W-m, 24, { align:'right' });
    }
  }

  function footer() {
    doc.setFillColor.apply(doc, CREAM); doc.rect(0, H-28, W, 28, 'F');
    doc.setFillColor.apply(doc, GOLD); doc.rect(0, H-28, W, 1.5, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(130,135,155);
    doc.text('CivicVerify \u00b7 Verified Civic Intelligence \u00b7 civicverify.org', m, H-10);
    doc.text('Confidential \u2014 For authorized recipients only', W-m, H-10, { align:'right' });
  }

  function secHead(text, y) {
    doc.setFillColor.apply(doc, CREAM); doc.roundedRect(m, y-13, W-m*2, 20, 4, 4, 'F');
    doc.setFillColor.apply(doc, GOLD); doc.rect(m, y-13, 4, 20, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor.apply(doc, NAVY);
    doc.text(text, m+12, y+0.5);
    return y+18;
  }

  // Cover page
  header(true); footer();
  var y = 142;

  // 4 stat cards
  var cards = [
    { l:'TOTAL RESPONSES', v:String(respCount), s:target?'of '+target+' target':'no target', col:NAVY },
    { l:'COMPLETION', v:target>0?compPct+'%':'\u2014', s:compPct>=100?'\u2713 Goal reached!':'In progress', col:compPct>=100?GREEN:GOLD },
    { l:'QUESTIONS', v:String(questions.length), s:questions.length+' questions', col:NAVY },
    { l:'STATUS', v:(survey.status||'').replace(/_/g,' ').slice(0,8).toUpperCase(), s:survey.status?.replace(/_/g,' ')||'', col:NAVY },
  ];
  var cW = (W - m*2 - 18) / 4;
  cards.forEach(function(cd, ci) {
    var cx = m + ci*(cW+6);
    doc.setFillColor(255,255,255); doc.roundedRect(cx, y, cW, 72, 6, 6, 'F');
    doc.setDrawColor(215,225,242); doc.setLineWidth(0.5); doc.roundedRect(cx, y, cW, 72, 6, 6, 'S');
    doc.setFillColor.apply(doc, cd.col); doc.roundedRect(cx, y, cW, 3.5, 2, 2, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(130,150,185);
    doc.text(cd.l, cx+cW/2, y+18, { align:'center' });
    doc.setFont('helvetica','bold'); doc.setFontSize(24); doc.setTextColor.apply(doc, cd.col);
    doc.text(cd.v, cx+cW/2, y+44, { align:'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(155,165,185);
    doc.text(cd.s, cx+cW/2, y+60, { align:'center', maxWidth: cW-8 });
  });
  y += 92;

  if (target > 0) {
    y = secHead('Response Progress', y+14);
    y += 6;
    doc.setFillColor(225,232,248); doc.roundedRect(m, y, W-m*2, 14, 7, 7, 'F');
    var fw = Math.max(14, compPct/100*(W-m*2));
    doc.setFillColor.apply(doc, compPct>=100 ? GREEN : GOLD); doc.roundedRect(m, y, fw, 14, 7, 7, 'F');
    if (fw > 40) { doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255); doc.text(compPct+'%', m+fw-18, y+9.5); }
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor.apply(doc, NAVY);
    doc.text(respCount+' collected', m, y+28); doc.text(Math.max(0,target-respCount)+' remaining', W-m, y+28, {align:'right'});
    y += 44;
  }

  y = secHead('Survey Details', y+14);
  doc.autoTable({
    startY: y+4, margin: {left:m, right:m}, head: [],
    body: [
      ['Submitted', fmtDate(survey.created_at)],
      ['Description', survey.description||'\u2014'],
      ['Status', (survey.status||'').replace(/_/g,' ')],
      ['Questions', questions.length + ' question'+(questions.length!==1?'s':'')],
      ['Target', target > 0 ? target+' responses' : 'None set'],
    ],
    columnStyles: { 0:{ fontStyle:'bold', fillColor:LBLUE, textColor:NAVY, cellWidth:130 }, 1:{ textColor:NAVY } },
    styles: { font:'helvetica', fontSize:9.5, cellPadding:7, lineColor:[215,226,245], lineWidth:0.5 },
    alternateRowStyles: { fillColor:[250,252,255] },
    didDrawPage: function() { header(false); footer(); }
  });

  // Question pages
  questions.forEach(function(q, qi) {
    doc.addPage(); header(false); footer();
    var y2 = 72;
    var answers = getAnswersFn(q.id, qi);
    var responded = answers.filter(function(a){return a!==null&&a!==undefined&&a!=='';}).length;
    var qTotal = responded || 1;
    var typeLabels = {multiple_choice:'Multiple Choice',rating:'Rating Scale',text:'Open-ended',yes_no:'Yes / No',checkbox:'Checkbox'};

    // Q badge
    doc.setFillColor.apply(doc, GOLD); doc.roundedRect(m, y2, 30, 22, 4, 4, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(255,255,255);
    doc.text('Q'+(qi+1), m+15, y2+15, {align:'center'});
    // Type chip
    doc.setFillColor.apply(doc, CREAM); doc.roundedRect(m+36, y2, 115, 22, 4, 4, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor.apply(doc, NAVY);
    doc.text(typeLabels[q.type]||q.type||'', m+36+57.5, y2+14.5, {align:'center'});
    // Response count
    doc.setFillColor.apply(doc, LBLUE); doc.roundedRect(W-m-96, y2, 96, 22, 4, 4, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor.apply(doc, NAVY);
    doc.text(responded+' response'+(responded!==1?'s':''), W-m-48, y2+14.5, {align:'center'});
    y2 += 34;

    doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor.apply(doc, NAVY);
    var lines = doc.splitTextToSize(q.text||'', W-m*2);
    doc.text(lines, m, y2);
    y2 += lines.length * 19 + 10;
    doc.setDrawColor.apply(doc, GOLD); doc.setLineWidth(1.5); doc.line(m, y2, W-m, y2);
    y2 += 16;

    if (q.type === 'multiple_choice' || q.type === 'checkbox') {
      var tData = (q.options||[]).map(function(opt, oi) {
        var cnt = answers.filter(function(a){return a===opt;}).length;
        var p2 = Math.round(cnt/qTotal*100);
        var bar = '\u25a0'.repeat(Math.round(p2/100*16)) + '\u25a1'.repeat(16-Math.round(p2/100*16));
        return [opt, cnt, p2+'%', bar];
      }).sort(function(a,b){return b[1]-a[1];});
      doc.autoTable({
        startY:y2, margin:{left:m,right:m},
        head:[['Answer Option','Count','Share','Distribution']],
        body:tData,
        headStyles:{fillColor:NAVY,textColor:[255,255,255],fontStyle:'bold',fontSize:9.5},
        columnStyles:{0:{textColor:NAVY,cellWidth:210},1:{halign:'center',fontStyle:'bold',textColor:NAVY,cellWidth:50},2:{halign:'center',textColor:[197,150,12],fontStyle:'bold',cellWidth:55},3:{font:'courier',fontSize:8,textColor:[80,100,145]}},
        styles:{font:'helvetica',fontSize:9.5,cellPadding:8,lineColor:[215,228,248],lineWidth:0.5},
        alternateRowStyles:{fillColor:[248,251,255]},
        didParseCell: function(d) { if(d.section==='body'&&d.column.index===1&&d.cell.raw>0) d.cell.styles.fillColor=[230,248,238]; },
        didDrawPage: function() { header(false); footer(); }
      });

      // Bar chart
      var chartY = doc.lastAutoTable.finalY + 20;
      if (chartY < H - 140) {
        var sorted = (q.options||[]).map(function(opt, oi) {
          var cnt = answers.filter(function(a){return a===opt;}).length;
          return { name:opt, cnt:cnt, pct:Math.round(cnt/qTotal*100), hex:PALETTE[oi%PALETTE.length] };
        }).sort(function(a,b){return b.cnt-a.cnt;}).slice(0,7);
        var maxC = Math.max.apply(null, sorted.map(function(o){return o.cnt;}).concat([1]));
        var cW2 = W - m*2 - 130;
        sorted.forEach(function(od, bi) {
          var bY = chartY + bi * 24;
          if (bY > H - 80) return;
          var hex = od.hex.replace('#','');
          var r2=parseInt(hex.slice(0,2),16), g2=parseInt(hex.slice(2,4),16), b2=parseInt(hex.slice(4,6),16);
          doc.setFillColor(r2,g2,b2);
          var bw = Math.max(4, (od.cnt/maxC)*cW2);
          doc.roundedRect(m+125, bY, bw, 16, 3, 3, 'F');
          doc.setFillColor(r2,g2,b2,0.08);
          doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor.apply(doc, NAVY);
          var nm = od.name.length > 18 ? od.name.slice(0,16)+'\u2026' : od.name;
          doc.text(nm, m, bY+11, {maxWidth:120});
          doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(r2,g2,b2);
          doc.text(od.cnt+' ('+od.pct+'%)', m+125+bw+6, bY+11);
        });
      }

    } else if (q.type === 'rating') {
      var scale = q.scale||5;
      var avg3 = answers.length > 0 ? (answers.reduce(function(s,a){return s+Number(a);},0)/answers.length).toFixed(1) : '\u2014';
      doc.setFillColor.apply(doc, CREAM); doc.roundedRect(m, y2, 120, 74, 8, 8, 'F');
      doc.setFillColor.apply(doc, GOLD); doc.roundedRect(m, y2, 120, 4, 4, 4, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(40); doc.setTextColor.apply(doc, GOLD);
      doc.text(avg3, m+60, y2+48, {align:'center'});
      doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(155,165,185);
      doc.text('AVERAGE / '+scale, m+60, y2+64, {align:'center'});

      var sbX = m+138; var sbW = W-m-sbX;
      for (var rv = scale; rv >= 1; rv--) {
        var rCnt = answers.filter(function(a){return Number(a)===rv;}).length;
        var rPct = Math.round(rCnt/qTotal*100);
        var bY2 = y2 + (scale-rv)*17;
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor.apply(doc, NAVY);
        doc.text(rv+'\u2605', sbX-24, bY2+9.5, {align:'right'});
        doc.setFillColor(225,232,245); doc.roundedRect(sbX, bY2, sbW-56, 11, 5, 5, 'F');
        if (rPct > 0) { doc.setFillColor.apply(doc, GOLD); doc.roundedRect(sbX, bY2, Math.max(11,rPct/100*(sbW-56)), 11, 5, 5, 'F'); }
        doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor.apply(doc, NAVY);
        doc.text(rPct+'%', sbX+sbW-48, bY2+8);
      }

    } else if (q.type === 'yes_no') {
      var yes4 = answers.filter(function(a){return a==='Yes'||a===true||a==='true';}).length;
      var no4 = responded - yes4;
      var half = (W-m*2-16)/2;
      [[yes4,GREEN,'YES'],[no4,RED,'NO']].forEach(function(row, ri) {
        var rx = m + ri*(half+16);
        var lightC = ri===0 ? [230,248,236] : [252,233,232];
        doc.setFillColor.apply(doc, lightC); doc.roundedRect(rx, y2, half, 84, 8, 8, 'F');
        doc.setFillColor.apply(doc, row[1]); doc.roundedRect(rx, y2, half, 4, 4, 4, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(38); doc.setTextColor.apply(doc, row[1]);
        doc.text(Math.round(row[0]/qTotal*100)+'%', rx+half/2, y2+50, {align:'center'});
        doc.setFontSize(11); doc.text(row[2], rx+half/2, y2+68, {align:'center'});
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, row[1]);
        doc.text(row[0]+' votes', rx+half/2, y2+80, {align:'center'});
      });

    } else if (q.type === 'text') {
      doc.autoTable({
        startY:y2, margin:{left:m,right:m},
        head:[['#','Response']],
        body: answers.slice(0,25).map(function(a,i){return [i+1,a];}),
        headStyles:{fillColor:NAVY,textColor:[255,255,255],fontStyle:'bold',fontSize:9},
        columnStyles:{0:{cellWidth:32,halign:'center',textColor:[155,165,185]},1:{textColor:NAVY,fontStyle:'italic'}},
        styles:{font:'helvetica',fontSize:9,cellPadding:7},
        alternateRowStyles:{fillColor:[250,252,255]},
        didDrawPage: function() { header(false); footer(); }
      });
    }
  });

  // Demographics page
  if (respondents.length > 0) {
    doc.addPage(); header(false); footer();
    var dy = 72;
    doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.setTextColor.apply(doc, NAVY);
    doc.text('Respondent Demographics', m, dy); dy += 26;

    function bDemo(key) {
      var co = {}; respondents.forEach(function(r){ var v=r[key]||'Unknown'; co[v]=(co[v]||0)+1; });
      return Object.entries(co).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
    }

    [['By State','state'],['By Political Party','political_party'],['By Sex','sex']].forEach(function(ds) {
      var data = bDemo(ds[1]);
      if (!data.length) return;
      if (dy > H - 200) { doc.addPage(); header(false); footer(); dy = 72; }
      dy = secHead(ds[0], dy+10); dy += 8;
      data.forEach(function(e, i) {
        var dn = e[0]; var dv = e[1]; var dp = Math.round(dv/respondents.length*100);
        var rowH = 23; var rowY = dy + i*rowH;
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, NAVY);
        doc.text(dn, m, rowY+11);
        doc.setFillColor(220,230,248); doc.roundedRect(m+140, rowY, W-m*2-180, 13, 6, 6, 'F');
        var bw3 = Math.max(6, dp/100*(W-m*2-180));
        var hex = PALETTE[i].replace('#','');
        doc.setFillColor(parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16));
        doc.roundedRect(m+140, rowY, bw3, 13, 6, 6, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor.apply(doc, NAVY);
        doc.text(dp+'%', W-m, rowY+9.5, {align:'right'});
      });
      dy += data.length * 23 + 28;
    });
  }

  doc.save('CivicVerify_' + (survey.title||'Report').replace(/\s+/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.pdf');
}

export default function Results() {
  var { id: surveyId } = useParams();
  var auth = useAuth(); var user = auth.user;
  var navigate = useNavigate();
  var [survey, setSurvey] = useState(null);
  var [responses, setResponses] = useState([]);
  var [respondents, setRespondents] = useState([]);
  var [loading, setLoading] = useState(true);
  var [repLoading, setRepLoading] = useState(false);
  var [error, setError] = useState(null);

  useEffect(function() {
    if (!user || !surveyId) return;
    (async function() {
      try {
        var { data: sv, error: svErr } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
        if (svErr) throw new Error('Survey not found.');
        setSurvey(sv);
        var { data: resp } = await supabase.from('responses').select('*').eq('survey_id', surveyId);
        setResponses(resp || []);
        if (resp && resp.length > 0) {
          var ids = [...new Set((resp||[]).map(function(r){return r.user_id;}).filter(Boolean))];
          if (ids.length > 0) {
            var { data: users } = await supabase.from('users').select('id,date_of_birth,sex,race,education,employment,income,political_party,voter_registered,veteran_status,housing,state').in('id', ids);
            setRespondents(users || []);
          }
        }
      } catch(e) { setError(e.message); }
      setLoading(false);
    })();
  }, [user, surveyId]);

  function getAnswers(questionId, questionIdx) {
    return responses.map(function(r) {
      try {
        var ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
        if (Array.isArray(ans)) {
          var byId = ans.find(function(a){return a&&a.question_id===questionId;});
          return byId ? byId.answer : ans[questionIdx];
        }
        return ans?.[questionIdx];
      } catch { return null; }
    }).filter(function(a){return a!==null&&a!==undefined&&a!=='';});
  }

  async function handleExcel() {
    setRepLoading(true);
    try { await generateExcel(survey, responses, respondents, getAnswers); }
    catch(e) { console.error(e); alert('Could not generate Excel report. Please try again.'); }
    setRepLoading(false);
  }

  async function handlePDF() {
    setRepLoading(true);
    try { await generatePDF(survey, responses, respondents, getAnswers); }
    catch(e) { console.error(e); alert('Could not generate PDF report. Please try again.'); }
    setRepLoading(false);
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(197,150,12,0.2)', borderTopColor:'#C5960C', borderRadius:'50%', animation:'rspin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontSize:13, color:'rgba(11,37,69,0.3)', margin:0 }}>Loading results...</p>
        <style>{'@keyframes rspin{to{transform:rotate(360deg)}} @keyframes rfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign:'center', padding:'48px 24px' }}>
      <p style={{ color:'rgba(11,37,69,0.5)', marginBottom:12 }}>{error}</p>
      <button onClick={function(){navigate('/org/surveys');}} style={{ fontSize:13, color:'#C5960C', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>\u2190 Back to My Surveys</button>
    </div>
  );

  var questions = survey?.questions || [];
  var respCount = responses.length;
  var target = survey?.target_responses || 0;
  var compPct = target > 0 ? Math.min(100, Math.round(respCount/target*100)) : null;
  var avgTime = (function() {
    var times = responses.filter(function(r){return r.duration_seconds;}).map(function(r){return r.duration_seconds;});
    if (!times.length) return null;
    var avg = Math.round(times.reduce(function(a,b){return a+b;},0)/times.length);
    return avg < 60 ? avg+'s' : Math.floor(avg/60)+'m '+(avg%60)+'s';
  })();

  function buildDemo(key) {
    var co = {}; respondents.forEach(function(r){var v=r[key]||'Unknown';co[v]=(co[v]||0)+1;});
    return Object.entries(co).sort(function(a,b){return b[1]-a[1];}).slice(0,5).map(function(e){return {name:e[0],value:e[1]};});
  }
  var demoSecs = [
    {title:'Top States', data:buildDemo('state')},
    {title:'Political Party', data:buildDemo('political_party')},
    {title:'Sex', data:buildDemo('sex')},
  ].filter(function(s){return s.data.length>0;});

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', maxWidth:920 }}>
      <style>{'@keyframes rspin{to{transform:rotate(360deg)}} @keyframes rfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>

      <button onClick={function(){navigate('/org/surveys');}}
        style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(11,37,69,0.4)', background:'none', border:'none', cursor:'pointer', marginBottom:24, padding:0, fontFamily:'inherit', fontWeight:600 }}>
        \u2190 My Surveys
      </button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:28 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:28, fontWeight:700, color:'#0B2545', margin:'0 0 6px', fontFamily:font }}>{survey.title}</h1>
          {survey.description && <p style={{ fontSize:14, color:'rgba(11,37,69,0.45)', margin:'0 0 4px', lineHeight:1.5 }}>{survey.description}</p>}
          <p style={{ fontSize:12, color:'rgba(11,37,69,0.3)', margin:0 }}>Submitted {fmtDate(survey.created_at)}</p>
        </div>
        <ReportDropdown onExcel={handleExcel} onPDF={handlePDF} loading={repLoading} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Total Responses" value={respCount.toLocaleString()} sub={target?'of '+target.toLocaleString()+' target':'No target set'} accent="#C5960C" icon="\uD83D\uDC65" />
        <StatCard label="Completion" value={compPct!=null?compPct+'%':'\u2014'} sub={compPct!=null?(compPct>=100?'\u2713 Goal reached':'In progress'):'No target'} accent={compPct>=100?'#2D9B5A':'#C5960C'} icon="\uD83C\uDFAF" />
        <StatCard label="Questions" value={questions.length} sub={questions.length+' question'+(questions.length!==1?'s':'')} accent="#0B2545" icon="\uD83D\uDCCB" />
        <StatCard label="Avg. Time" value={avgTime||'\u2014'} sub={avgTime?'per response':'Not tracked'} accent="#6366f1" icon="\u23F1" />
      </div>

      {target > 0 && (
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid rgba(11,37,69,0.06)', padding:'20px 24px', marginBottom:24, boxShadow:'0 2px 8px rgba(11,37,69,0.04)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:'#0B2545', margin:'0 0 2px' }}>Response Progress</p>
              <p style={{ fontSize:12, color:'rgba(11,37,69,0.35)', margin:0 }}>{respCount.toLocaleString()} collected \u00b7 {Math.max(0,target-respCount).toLocaleString()} remaining</p>
            </div>
            <p style={{ fontSize:28, fontWeight:800, color:compPct>=100?'#2D9B5A':'#C5960C', margin:0, fontFamily:font }}>{compPct}%</p>
          </div>
          <div style={{ width:'100%', height:10, background:'rgba(11,37,69,0.05)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:5, background:compPct>=100?'linear-gradient(90deg,#2D9B5A,#C5960C)':'linear-gradient(90deg,#C5960C,#E8A838)', width:compPct+'%', transition:'width 1s ease', boxShadow:compPct>0?'0 0 12px rgba(197,150,12,0.4)':'none' }} />
          </div>
          {compPct >= 100 && <p style={{ fontSize:12, color:'#2D9B5A', fontWeight:700, margin:'8px 0 0' }}>\u2713 Survey target has been reached!</p>}
        </div>
      )}

      {respCount === 0 && (
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid rgba(11,37,69,0.06)', padding:'56px 32px', textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>\uD83D\uDCCA</div>
          <p style={{ fontSize:18, fontWeight:700, color:'#0B2545', margin:'0 0 8px', fontFamily:font }}>No responses yet</p>
          <p style={{ fontSize:14, color:'rgba(11,37,69,0.4)', margin:0 }}>{survey.status==='pending_review'?'Your survey is awaiting admin review before going live.':'Results will appear here as citizens complete your survey.'}</p>
        </div>
      )}

      {respCount > 0 && questions.length > 0 && (
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#0B2545', margin:0, fontFamily:font }}>Question Breakdown</h2>
            <span style={{ padding:'3px 10px', background:'rgba(11,37,69,0.06)', borderRadius:20, fontSize:12, fontWeight:700, color:'rgba(11,37,69,0.4)' }}>{questions.length} questions</span>
          </div>
          <div style={{ display:'grid', gap:16 }}>
            {questions.map(function(q, i) { return <QuestionCard key={q.id||i} question={q} idx={i} answers={getAnswers(q.id, i)} />; })}
          </div>
        </div>
      )}

      {demoSecs.length > 0 && (
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#0B2545', margin:'0 0 16px', fontFamily:font }}>Respondent Demographics</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {demoSecs.map(function(sec) {
              return (
                <div key={sec.title} style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(11,37,69,0.06)', padding:'20px 22px' }}>
                  <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, color:'rgba(11,37,69,0.3)', margin:'0 0 14px' }}>{sec.title}</p>
                  {sec.data.map(function(d, i) { return <DemoBar key={d.name} label={d.name} value={d.value} total={respondents.length} color={PALETTE[i]} />; })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
