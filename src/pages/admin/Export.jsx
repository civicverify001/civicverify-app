// src/pages/admin/Export.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
const SERIF = 'Libre Baskerville, Georgia, serif';

const STATUS_CFG = {
  active:         { label: 'Active',         color: '#22863A', bg: '#F0FFF4' },
  completed:      { label: 'Completed',       color: '#6366f1', bg: '#EEF2FF' },
  pending_review: { label: 'Pending Review',  color: '#C5960C', bg: '#FFFBF0' },
  draft:          { label: 'Draft',           color: '#6B7280', bg: '#F9FAFB' },
  closed:         { label: 'Closed',          color: '#6B7280', bg: '#F9FAFB' },
  rejected:       { label: 'Rejected',        color: '#B8352E', bg: '#FFF5F5' },
};

// Load a script only once
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      // Script tag exists but may still be loading — wait for it
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing._loaded) return resolve();
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s._loaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function AdminExport() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // { id, type }
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('surveys')
      .select('*, organizations(org_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSurveys(data || []); setLoading(false); });
  }, []);

  const filtered = surveys.filter(s =>
    !search || (s.title || '').toLowerCase().includes(search.toLowerCase())
  );

  async function fetchData(survey) {
    const { data: responses } = await supabase
      .from('responses').select('*').eq('survey_id', survey.id)
      .order('created_at', { ascending: true });
    return { survey, responses: responses || [], orgName: survey.organizations?.org_name || 'CivicVerify' };
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  async function exportExcel(survey) {
    setBusy({ id: survey.id, type: 'excel' });
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
      const { responses, orgName } = await fetchData(survey);
      const questions = survey.questions || [];
      const wb = XLSX.utils.book_new();
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const completion = survey.target_responses
        ? `${Math.round(responses.length / survey.target_responses * 100)}%` : '\u2014';

      // Sheet 1 — Summary
      const sumRows = [
        ['CIVICVERIFY \u2014 SURVEY REPORT', '', '', ''],
        ['', '', '', ''],
        ['Survey Title',        survey.title || '',                    '', ''],
        ['Organization',        orgName,                               '', ''],
        ['Status',              (survey.status || '').replace(/_/g,' ').toUpperCase(), '', ''],
        ['Description',         survey.description || '\u2014',        '', ''],
        ['Target Responses',    survey.target_responses || '\u2014',   '', ''],
        ['Responses Collected', responses.length,                      '', ''],
        ['Completion %',        completion,                            '', ''],
        ['Created',             survey.created_at ? survey.created_at.slice(0, 10) : '\u2014', '', ''],
        ['Report Generated',    date,                                  '', ''],
        ['', '', '', ''],
        ['DEMOGRAPHIC TARGETING', '', '', ''],
      ];
      const demoFields = [
        ['State', 'target_state'], ['Race / Ethnicity', 'target_race'], ['Sex', 'target_sex'],
        ['Min Age', 'target_age_min'], ['Max Age', 'target_age_max'], ['Education', 'target_education'],
        ['Employment', 'target_employment'], ['Income', 'target_income'], ['Party', 'target_party'],
        ['Housing', 'target_housing'], ['Registered Voter', 'target_voter_registered'], ['Veteran', 'target_veteran'],
      ];
      let hasDemo = false;
      demoFields.forEach(([lbl, field]) => {
        if (survey[field]) { sumRows.push([lbl, survey[field], '', '']); hasDemo = true; }
      });
      if (!hasDemo) sumRows.push(['', 'No targeting \u2014 open to all citizens', '', '']);

      const ws1 = XLSX.utils.aoa_to_sheet(sumRows);
      ws1['!cols'] = [{ wch: 24 }, { wch: 42 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Sheet 2 — Question Results
      const qRows = [
        ['QUESTION RESULTS', '', '', '', ''],
        ['Survey: ' + (survey.title || ''), '', '', '', ''],
        ['', '', '', '', ''],
      ];
      questions.forEach((q, qi) => {
        qRows.push([`Q${qi + 1}: ${q.text || ''}`, '', '', '', '']);
        qRows.push([`Type: ${(q.type || '').replace(/_/g, ' ')}`, `Required: ${q.required ? 'Yes' : 'No'}`, '', '', '']);

        const answers = [];
        responses.forEach(r => {
          (r.answers || []).forEach(a => { if (a.question_id === q.id) answers.push(a.answer); });
        });

        if (['multiple_choice', 'checkbox', 'rating'].includes(q.type)) {
          const opts = q.type === 'rating' ? ['1','2','3','4','5'] : (q.options || []);
          const counts = {};
          answers.forEach(a => {
            if (Array.isArray(a)) a.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
            else counts[String(a)] = (counts[String(a)] || 0) + 1;
          });
          const total = answers.length || 1;
          qRows.push(['Option', 'Count', 'Percentage', 'Distribution', '']);
          opts.forEach(opt => {
            const cnt = counts[String(opt)] || 0;
            const pct = ((cnt / total) * 100).toFixed(1);
            qRows.push([String(opt), cnt, pct + '%', '\u2588'.repeat(Math.max(0, Math.floor(pct / 5))), '']);
          });
          qRows.push(['Total Responses', answers.length, '', '', '']);
        } else if (q.type === 'yes_no') {
          const yes = answers.filter(a => a === 'Yes' || a === true || a === 'true').length;
          qRows.push(['Yes', yes, answers.length ? `${Math.round(yes/answers.length*100)}%` : '0%', '', '']);
          qRows.push(['No', answers.length - yes, answers.length ? `${Math.round((answers.length-yes)/answers.length*100)}%` : '0%', '', '']);
          qRows.push(['Total', answers.length, '', '', '']);
        } else {
          qRows.push([`Open-ended (${answers.length} responses):`, '', '', '', '']);
          answers.forEach((a, i) => qRows.push([`  ${i + 1}.`, String(a), '', '', '']));
        }
        qRows.push(['', '', '', '', '']);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(qRows);
      ws2['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 26 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Question Results');

      // Sheet 3 — Raw Responses
      if (responses.length > 0 && questions.length > 0) {
        const headers = ['#', 'Submitted', ...questions.map((q, i) => `Q${i+1}: ${(q.text||'').slice(0,40)}`)];
        const rawRows = [headers];
        responses.forEach((r, ri) => {
          const ansMap = {};
          (r.answers || []).forEach(a => { ansMap[a.question_id] = a.answer; });
          rawRows.push([
            ri + 1,
            r.created_at ? r.created_at.slice(0, 10) : '',
            ...questions.map(q => {
              const val = ansMap[q.id];
              return Array.isArray(val) ? val.join(', ') : String(val || '');
            }),
          ]);
        });
        const ws3 = XLSX.utils.aoa_to_sheet(rawRows);
        ws3['!cols'] = [{ wch: 6 }, { wch: 12 }, ...questions.map(() => ({ wch: 30 }))];
        XLSX.utils.book_append_sheet(wb, ws3, 'Raw Responses');
      }

      const safe = (survey.title || 'survey').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      XLSX.writeFile(wb, `CivicVerify_${safe}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error('Excel error:', e);
      alert('Excel export failed: ' + e.message);
    }
    setBusy(null);
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  async function exportPDF(survey) {
    setBusy({ id: survey.id, type: 'pdf' });
    try {
      const { responses, orgName } = await fetchData(survey);
      const questions = survey.questions || [];

      // Load jsPDF
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      // Load autotable — check if it's actually attached to jsPDF instances
      const testDoc = new window.jspdf.jsPDF();
      if (typeof testDoc.autoTable !== 'function') {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      const W = 215.9, PH = 279.4, ML = 15, MR = 15;
      const NAVY = [11, 37, 69], GOLD = [197, 150, 12], LIGHT = [240, 244, 248];
      let y = 15;

      function newPage() { doc.addPage(); y = 15; }
      function checkBreak(h) { if (y + h > PH - 20) newPage(); }

      function sectionHeader(title) {
        checkBreak(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...NAVY);
        doc.text(title, ML, y); y += 3;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.8);
        doc.line(ML, y, W - MR, y); y += 6;
      }

      // ── Cover header
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, 34, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('CIVICVERIFY \u2014 SURVEY REPORT', ML, 13);
      doc.setFontSize(12); doc.setTextColor(...GOLD);
      doc.text(survey.title || 'Untitled Survey', ML, 23, { maxWidth: W - ML - MR - 40 });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(170, 170, 170);
      const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Generated ${genDate}`, W - MR, 30, { align: 'right' });
      y = 44;

      // ── Survey Overview
      sectionHeader('SURVEY OVERVIEW');
      const completion = survey.target_responses
        ? `${Math.round(responses.length / survey.target_responses * 100)}%` : '\u2014';
      doc.autoTable({
        startY: y,
        body: [
          ['Organization', orgName, 'Status', (survey.status || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())],
          ['Responses', `${responses.length}${survey.target_responses ? ' / ' + survey.target_responses : ''}`, 'Completion', completion],
          ['Questions', String(questions.length), 'Created', survey.created_at ? survey.created_at.slice(0,10) : '\u2014'],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: NAVY, cellWidth: 35 },
          1: { cellWidth: 65 },
          2: { fontStyle: 'bold', textColor: NAVY, cellWidth: 35 },
          3: { cellWidth: 65 },
        },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: ML, right: MR },
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── Audience Targeting
      const demoFields = [
        ['State', survey.target_state], ['Race', survey.target_race], ['Sex', survey.target_sex],
        ['Min Age', survey.target_age_min], ['Max Age', survey.target_age_max],
        ['Education', survey.target_education], ['Employment', survey.target_employment],
        ['Income', survey.target_income], ['Party', survey.target_party],
        ['Housing', survey.target_housing], ['Registered Voter', survey.target_voter_registered],
        ['Veteran', survey.target_veteran],
      ].filter(([, v]) => v != null && v !== '' && v !== false);

      sectionHeader('AUDIENCE TARGETING');
      if (demoFields.length > 0) {
        const rows = [];
        for (let i = 0; i < demoFields.length; i += 2) {
          rows.push([demoFields[i][0], String(demoFields[i][1]), demoFields[i+1]?.[0] || '', String(demoFields[i+1]?.[1] || '')]);
        }
        doc.autoTable({
          startY: y, body: rows, theme: 'plain',
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', textColor: NAVY, cellWidth: 35 },
            1: { cellWidth: 65 },
            2: { fontStyle: 'bold', textColor: NAVY, cellWidth: 35 },
            3: { cellWidth: 65 },
          },
          alternateRowStyles: { fillColor: LIGHT },
          margin: { left: ML, right: MR },
        });
        y = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(9); doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('No demographic targeting \u2014 open to all citizens.', ML, y);
        y += 10;
      }

      // ── Question Results
      doc.addPage(); y = 15;
      sectionHeader('QUESTION RESULTS');

      questions.forEach((q, qi) => {
        checkBreak(28);

        // Question header bar
        doc.setFillColor(...NAVY);
        doc.rect(ML, y - 4, W - ML - MR, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(`Q${qi+1}: ${q.text || ''}`, ML + 3, y + 2, { maxWidth: W - ML - MR - 6 });
        y += 10;

        const answers = [];
        responses.forEach(r => {
          (r.answers || []).forEach(a => { if (a.question_id === q.id) answers.push(a.answer); });
        });

        if (['multiple_choice', 'checkbox', 'rating'].includes(q.type)) {
          const opts = q.type === 'rating' ? ['1','2','3','4','5'] : (q.options || []);
          const counts = {};
          answers.forEach(a => {
            if (Array.isArray(a)) a.forEach(v => { counts[String(v)] = (counts[String(v)] || 0) + 1; });
            else counts[String(a)] = (counts[String(a)] || 0) + 1;
          });
          const total = answers.length || 1;
          const tblBody = opts.map(opt => {
            const cnt = counts[String(opt)] || 0;
            return [String(opt), String(cnt), `${(cnt/total*100).toFixed(1)}%`];
          });

          doc.autoTable({
            startY: y + 2,
            head: [['Option', 'Responses', '%']],
            body: tblBody,
            theme: 'striped',
            headStyles: { fillColor: [232,236,240], textColor: NAVY, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8.5, cellPadding: 2.5 },
            alternateRowStyles: { fillColor: LIGHT },
            columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 35, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' } },
            foot: [[`Total: ${answers.length} response${answers.length !== 1 ? 's' : ''}`, '', '']],
            footStyles: { fontStyle: 'bold', textColor: NAVY, fontSize: 8 },
            margin: { left: ML, right: MR },
          });
          y = doc.lastAutoTable.finalY + 8;

        } else if (q.type === 'yes_no') {
          const yes = answers.filter(a => a === 'Yes' || a === true || a === 'true').length;
          const no = answers.length - yes;
          const total = answers.length || 1;
          doc.autoTable({
            startY: y + 2,
            head: [['Answer', 'Count', '%']],
            body: [
              ['Yes', String(yes), `${(yes/total*100).toFixed(1)}%`],
              ['No', String(no), `${(no/total*100).toFixed(1)}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [232,236,240], textColor: NAVY, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8.5, cellPadding: 2.5 },
            alternateRowStyles: { fillColor: LIGHT },
            columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 35, halign: 'center' }, 2: { cellWidth: 35, halign: 'center' } },
            foot: [[`Total: ${answers.length} response${answers.length !== 1 ? 's' : ''}`, '', '']],
            footStyles: { fontStyle: 'bold', textColor: NAVY, fontSize: 8 },
            margin: { left: ML, right: MR },
          });
          y = doc.lastAutoTable.finalY + 8;

        } else if (q.type === 'rating') {
          // already handled above
        } else {
          // Text
          y += 3;
          doc.setFontSize(8); doc.setFont('helvetica', 'italic');
          doc.setTextColor(130, 130, 130);
          doc.text(`Open-ended \u2014 ${answers.length} response${answers.length !== 1 ? 's' : ''}`, ML, y);
          y += 5;
          doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
          answers.slice(0, 15).forEach((a, i) => {
            checkBreak(8);
            const lines = doc.splitTextToSize(`${i+1}. ${String(a)}`, W - ML - MR - 4);
            doc.text(lines, ML + 3, y);
            y += lines.length * 4.5 + 1;
          });
          if (answers.length > 15) {
            doc.setFont('helvetica', 'italic'); doc.setTextColor(160, 160, 160);
            doc.text(`...and ${answers.length - 15} more responses (see Excel export for full data)`, ML + 3, y);
            y += 6;
          }
          y += 4;
        }
      });

      // ── Footer on every page
      const total = doc.internal.getNumberOfPages();
      for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFillColor(...NAVY);
        doc.rect(0, PH - 11, W, 11, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.setTextColor(170, 170, 170);
        doc.text(`CivicVerify \u00b7 civicverify.org \u00b7 Confidential \u2014 Prepared for ${orgName}`, ML, PH - 5);
        doc.text(`Page ${p} of ${total}`, W - MR, PH - 5, { align: 'right' });
      }

      const safe = (survey.title || 'survey').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      doc.save(`CivicVerify_${safe}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF export failed: ' + e.message);
    }
    setBusy(null);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(197,150,12,0.2)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: SERIF }}>Export Reports</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Download professional Excel or PDF survey reports to share with clients</p>
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(197,150,12,0.06)', border: '1px solid rgba(197,150,12,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>&#128202;</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>Professional client reports</p>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Excel includes Summary, Question Results, and Raw Responses tabs. PDF is formatted for client presentation.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3, fontSize: 14 }}>&#128269;</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search surveys..."
          style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }}
        />
      </div>

      {/* Survey list */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)', margin: 0 }}>No surveys found</p>
          </div>
        ) : filtered.map(s => {
          const cfg = STATUS_CFG[s.status] || STATUS_CFG.draft;
          const qs = s.questions || [];
          const isBusy = busy?.id === s.id;

          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 6px rgba(11,37,69,0.04)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, fontFamily: SERIF }}>{s.title}</h3>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap' }}>{cfg.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>&#127970; {s.organizations?.org_name || 'Admin'}</span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>&#128203; {qs.length} question{qs.length !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>&#128101; {(s.response_count || 0).toLocaleString()}{s.target_responses ? ` / ${s.target_responses.toLocaleString()}` : ''} responses</span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>&#128197; {new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => exportExcel(s)}
                  disabled={!!busy}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#217346', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: (isBusy && busy.type === 'excel') ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                  {(isBusy && busy.type === 'excel') ? '&#9203; Generating...' : '&#128202; Excel'}
                </button>
                <button
                  onClick={() => exportPDF(s)}
                  disabled={!!busy}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: C.red, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: (isBusy && busy.type === 'pdf') ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                  {(isBusy && busy.type === 'pdf') ? '&#9203; Generating...' : '&#128196; PDF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { icon: '&#128202;', title: 'Excel Report (.xlsx)', color: '#217346',
            items: ['Summary sheet with survey overview', 'Demographic targeting details', 'Per-question breakdown with response counts', 'Visual distribution bars', 'Full raw responses tab for data analysis'] },
          { icon: '&#128196;', title: 'PDF Report (.pdf)', color: C.red,
            items: ['Branded CivicVerify header', 'Survey overview & targeting section', 'Per-question results with tables', 'Page numbers and footer on every page', 'Ready to email directly to clients'] },
        ].map(fmt => (
          <div key={fmt.title} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }} dangerouslySetInnerHTML={{ __html: fmt.icon }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: fmt.color, margin: 0 }}>{fmt.title}</h3>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              {fmt.items.map(item => (
                <li key={item} style={{ fontSize: 12, color: 'rgba(11,37,69,0.55)', marginBottom: 5 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
