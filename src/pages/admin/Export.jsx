// src/pages/admin/Export.jsx — Professional Excel + PDF survey reports
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
const font = 'Libre Baskerville, Georgia, serif';

const STATUS_CFG = {
  active:         { label: 'Active',         color: '#22863A', bg: '#F0FFF4' },
  completed:      { label: 'Completed',       color: '#6366f1', bg: '#EEF2FF' },
  pending_review: { label: 'Pending Review',  color: '#C5960C', bg: '#FFFBF0' },
  draft:          { label: 'Draft',           color: '#6B7280', bg: '#F9FAFB' },
  closed:         { label: 'Closed',          color: '#6B7280', bg: '#F9FAFB' },
  rejected:       { label: 'Rejected',        color: '#B8352E', bg: '#FFF5F5' },
};

export default function AdminExport() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(null); // 'excel' | 'pdf'
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('surveys')
      .select('*, organizations(org_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSurveys(data || []); setLoading(false); });
  }, []);

  const filtered = surveys.filter(s =>
    !search || s.title?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Fetch full survey data + responses ─────────────────────────────────────
  async function fetchReportData(survey) {
    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', survey.id)
      .order('created_at', { ascending: true });
    return {
      survey,
      responses: responses || [],
      org_name: survey.organizations?.org_name || 'CivicVerify',
    };
  }

  // ── Excel Export ───────────────────────────────────────────────────────────
  async function exportExcel(survey) {
    setExporting('excel');
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
      const data = await fetchReportData(survey);
      const responses = data.responses;
      const questions = survey.questions || [];
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Summary ──
      const summaryRows = [
        ['CIVICVERIFY — SURVEY REPORT', '', '', ''],
        ['', '', '', ''],
        ['Survey Title', survey.title || '', '', ''],
        ['Organization', data.org_name, '', ''],
        ['Status', (survey.status || '').replace(/_/g, ' ').toUpperCase(), '', ''],
        ['Description', survey.description || '—', '', ''],
        ['Target Responses', survey.target_responses || '—', '', ''],
        ['Responses Collected', responses.length, '', ''],
        ['Completion %', survey.target_responses ? `${Math.round(responses.length / survey.target_responses * 100)}%` : '—', '', ''],
        ['Created', survey.created_at ? survey.created_at.slice(0, 10) : '—', '', ''],
        ['Report Generated', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), '', ''],
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
        if (survey[field]) { summaryRows.push([lbl, survey[field], '', '']); hasDemo = true; }
      });
      if (!hasDemo) summaryRows.push(['', 'No targeting — open to all citizens', '', '']);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 24 }, { wch: 40 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // ── Sheet 2: Question Results ──
      const qRows = [
        ['QUESTION RESULTS', '', '', '', ''],
        ['Survey: ' + survey.title, '', '', '', ''],
        ['', '', '', '', ''],
      ];

      questions.forEach((q, qi) => {
        qRows.push([`Q${qi + 1}: ${q.text || ''}`, '', '', '', '']);
        qRows.push([`Type: ${(q.type || '').replace(/_/g, ' ')}`, `Required: ${q.required ? 'Yes' : 'No'}`, '', '', '']);

        const answers = [];
        responses.forEach(r => {
          (r.answers || []).forEach(a => {
            if (a.question_id === q.id) answers.push(a.answer);
          });
        });

        if (q.type === 'multiple_choice' || q.type === 'checkbox' || q.type === 'rating') {
          const opts = q.type === 'rating' ? ['1','2','3','4','5'] : (q.options || []);
          const counts = {};
          answers.forEach(a => {
            if (Array.isArray(a)) a.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
            else counts[String(a)] = (counts[String(a)] || 0) + 1;
          });
          const total = answers.length || 1;
          qRows.push(['Option', 'Count', 'Percentage', 'Bar', '']);
          opts.forEach(opt => {
            const cnt = counts[String(opt)] || 0;
            const pct = ((cnt / total) * 100).toFixed(1);
            qRows.push([String(opt), cnt, pct + '%', '█'.repeat(Math.floor(pct / 5)), '']);
          });
          qRows.push(['Total Responses', answers.length, '', '', '']);
        } else {
          qRows.push(['Open-ended Responses:', '', '', '', '']);
          answers.forEach((a, i) => qRows.push([`${i + 1}.`, String(a), '', '', '']));
        }
        qRows.push(['', '', '', '', '']);
      });

      const wsQ = XLSX.utils.aoa_to_sheet(qRows);
      wsQ['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsQ, 'Question Results');

      // ── Sheet 3: Raw Responses ──
      if (responses.length > 0 && questions.length > 0) {
        const headers = ['#', 'Submitted', ...questions.map((q, i) => `Q${i + 1}: ${(q.text || '').slice(0, 40)}`)];
        const rawRows = [headers];
        responses.forEach((r, ri) => {
          const ansMap = {};
          (r.answers || []).forEach(a => { ansMap[a.question_id] = a.answer; });
          const row = [
            ri + 1,
            r.created_at ? r.created_at.slice(0, 10) : '',
            ...questions.map(q => {
              const val = ansMap[q.id];
              return Array.isArray(val) ? val.join(', ') : String(val || '');
            }),
          ];
          rawRows.push(row);
        });
        const wsRaw = XLSX.utils.aoa_to_sheet(rawRows);
        const cols = [{ wch: 6 }, { wch: 12 }, ...questions.map(() => ({ wch: 30 }))];
        wsRaw['!cols'] = cols;
        XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw Responses');
      }

      const safe = (survey.title || 'survey').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      XLSX.writeFile(wb, `CivicVerify_${safe}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + e.message);
    }
    setExporting(null);
  }

  // ── PDF Export ─────────────────────────────────────────────────────────────
  async function exportPDF(survey) {
    setExporting('pdf');
    try {
      const data = await fetchReportData(survey);
      const responses = data.responses;
      const questions = survey.questions || [];

      // Load jsPDF from CDN
      await new Promise((resolve, reject) => {
        if (window.jspdf) return resolve();
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      await new Promise((resolve, reject) => {
        if (window.jspdf?.jsPDF) return resolve();
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      const W = 215.9, L = 279.4;
      const ML = 15, MR = 15, MT = 15;
      let y = MT;

      const NAVY_R = [11, 37, 69], GOLD_R = [197, 150, 12], LIGHT_R = [240, 244, 248];

      function hex2rgb(h) {
        const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
        return [r, g, b];
      }

      function addPage() {
        doc.addPage();
        y = MT;
      }

      function checkPageBreak(needed) {
        if (y + needed > L - 20) addPage();
      }

      // ── Header banner ──
      doc.setFillColor(...NAVY_R);
      doc.rect(0, 0, W, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('SURVEY REPORT', ML, 13);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GOLD_R);
      doc.text(survey.title || 'Untitled Survey', ML, 23, { maxWidth: W - ML - MR - 50 });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`, W - MR, 28, { align: 'right' });
      y = 40;

      // ── Overview section ──
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY_R);
      doc.text('SURVEY OVERVIEW', ML, y); y += 4;
      doc.setDrawColor(...GOLD_R); doc.setLineWidth(0.8);
      doc.line(ML, y, W - MR, y); y += 6;

      const overviewData = [
        ['Organization', data.org_name, 'Status', (survey.status || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())],
        ['Responses', `${responses.length} / ${survey.target_responses || '—'}`, 'Completion', survey.target_responses ? `${Math.round(responses.length/survey.target_responses*100)}%` : '—'],
        ['Questions', String(questions.length), 'Created', survey.created_at?.slice(0,10) || '—'],
      ];
      if (survey.description) overviewData.push(['Description', survey.description, '', '']);

      doc.autoTable({
        startY: y,
        body: overviewData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: NAVY_R, cellWidth: 35 },
          1: { cellWidth: 65 },
          2: { fontStyle: 'bold', textColor: NAVY_R, cellWidth: 35 },
          3: { cellWidth: 65 },
        },
        alternateRowStyles: { fillColor: LIGHT_R },
        margin: { left: ML, right: MR },
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── Demographic targeting ──
      const demoFields = [
        ['State', survey.target_state], ['Race', survey.target_race], ['Sex', survey.target_sex],
        ['Min Age', survey.target_age_min], ['Max Age', survey.target_age_max],
        ['Education', survey.target_education], ['Employment', survey.target_employment],
        ['Income', survey.target_income], ['Party', survey.target_party],
        ['Housing', survey.target_housing], ['Registered Voter', survey.target_voter_registered], ['Veteran', survey.target_veteran],
      ].filter(([, v]) => v);

      checkPageBreak(20);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY_R);
      doc.text('AUDIENCE TARGETING', ML, y); y += 4;
      doc.setDrawColor(...GOLD_R);
      doc.line(ML, y, W - MR, y); y += 6;

      if (demoFields.length > 0) {
        const demoRows = [];
        for (let i = 0; i < demoFields.length; i += 2) {
          demoRows.push([demoFields[i][0], demoFields[i][1], demoFields[i+1]?.[0] || '', demoFields[i+1]?.[1] || '']);
        }
        doc.autoTable({
          startY: y,
          body: demoRows,
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { fontStyle: 'bold', textColor: NAVY_R, cellWidth: 35 },
            1: { cellWidth: 65 },
            2: { fontStyle: 'bold', textColor: NAVY_R, cellWidth: 35 },
            3: { cellWidth: 65 },
          },
          alternateRowStyles: { fillColor: LIGHT_R },
          margin: { left: ML, right: MR },
        });
        y = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(9); doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('No demographic targeting — open to all citizens.', ML, y);
        y += 10;
      }

      // ── Question Results ──
      doc.addPage(); y = MT;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY_R);
      doc.text('QUESTION RESULTS', ML, y); y += 4;
      doc.setDrawColor(...GOLD_R); doc.setLineWidth(0.8);
      doc.line(ML, y, W - MR, y); y += 8;

      questions.forEach((q, qi) => {
        checkPageBreak(30);

        // Question header bar
        doc.setFillColor(...NAVY_R);
        doc.rect(ML, y - 4, W - ML - MR, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(`Q${qi+1}: ${q.text || ''}`, ML + 3, y + 1, { maxWidth: W - ML - MR - 6 });
        y += 9;

        const answers = [];
        responses.forEach(r => {
          (r.answers || []).forEach(a => {
            if (a.question_id === q.id) answers.push(a.answer);
          });
        });

        if (q.type === 'multiple_choice' || q.type === 'checkbox' || q.type === 'rating') {
          const opts = q.type === 'rating' ? ['1','2','3','4','5'] : (q.options || []);
          const counts = {};
          answers.forEach(a => {
            if (Array.isArray(a)) a.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
            else counts[String(a)] = (counts[String(a)] || 0) + 1;
          });
          const total = answers.length || 1;
          const tblData = opts.map(opt => {
            const cnt = counts[String(opt)] || 0;
            const pct = (cnt / total * 100).toFixed(1);
            return [String(opt), String(cnt), pct + '%'];
          });

          doc.autoTable({
            startY: y + 2,
            head: [['Option', 'Responses', 'Percentage']],
            body: tblData,
            theme: 'striped',
            headStyles: { fillColor: [232, 236, 240], textColor: NAVY_R, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8, cellPadding: 2.5 },
            alternateRowStyles: { fillColor: LIGHT_R },
            columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' } },
            foot: [[`Total: ${answers.length} responses`, '', '']],
            footStyles: { fontStyle: 'bold', textColor: NAVY_R, fontSize: 8 },
            margin: { left: ML, right: MR },
          });
          y = doc.lastAutoTable.finalY + 8;

        } else if (q.type === 'text') {
          y += 4;
          doc.setFontSize(8); doc.setFont('helvetica', 'italic');
          doc.setTextColor(120, 120, 120);
          doc.text(`Open-ended — ${answers.length} responses`, ML, y); y += 5;
          doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50);
          answers.slice(0, 12).forEach((a, i) => {
            checkPageBreak(8);
            const lines = doc.splitTextToSize(`${i+1}. ${String(a)}`, W - ML - MR - 6);
            doc.text(lines, ML + 4, y);
            y += lines.length * 4.5 + 1;
          });
          if (answers.length > 12) {
            doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
            doc.text(`... and ${answers.length - 12} more (see Excel export)`, ML + 4, y);
            y += 6;
          }
          y += 4;
        }
      });

      // ── Footer on every page ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...NAVY_R);
        doc.rect(0, L - 12, W, 12, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 180);
        doc.text(`CivicVerify · civicverify.org · Confidential — Prepared for ${data.org_name}`, ML, L - 5);
        doc.text(`Page ${p} of ${totalPages}`, W - MR, L - 5, { align: 'right' });
      }

      const safe = (survey.title || 'survey').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      doc.save(`CivicVerify_${safe}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF export failed: ' + e.message);
    }
    setExporting(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-[3px] border-[#C5960C] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Export Reports</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Download professional Excel or PDF survey reports to share with clients</p>
      </div>

      {/* Info banner */}
      <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📊</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>Professional client reports</p>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Excel includes Summary, Question Results, and Raw Responses tabs. PDF is formatted for client presentation.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search surveys..."
          style={{ width: '100%', padding: '10px 14px 10px 36px', fontSize: 13, border: '1px solid rgba(11,37,69,0.08)', borderRadius: 10, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }}
        />
      </div>

      {/* Survey list */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)' }}>No surveys found</p>
          </div>
        ) : filtered.map(s => {
          const cfg = STATUS_CFG[s.status] || STATUS_CFG.draft;
          const questions = s.questions || [];
          const isLoading = exporting && selected === s.id;

          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0, fontFamily: font, truncate: true }}>{s.title}</h3>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap' }}>{cfg.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                    🏢 {s.organizations?.org_name || 'Admin'}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                    📋 {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                    👥 {(s.response_count || 0).toLocaleString()}{s.target_responses ? ` / ${s.target_responses.toLocaleString()}` : ''} responses
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(11,37,69,0.35)' }}>
                    📅 {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Export buttons */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => { setSelected(s.id); exportExcel(s); }}
                  disabled={isLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: '#217346', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading && exporting === 'excel' ? 0.6 : 1,
                    whiteSpace: 'nowrap'
                  }}>
                  {isLoading && exporting === 'excel' ? '⏳' : '📊'} Excel
                </button>
                <button
                  onClick={() => { setSelected(s.id); exportPDF(s); }}
                  disabled={isLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: C.red, color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading && exporting === 'pdf' ? 0.6 : 1,
                    whiteSpace: 'nowrap'
                  }}>
                  {isLoading && exporting === 'pdf' ? '⏳' : '📄'} PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 28 }}>
        {[
          {
            icon: '📊', title: 'Excel Report (.xlsx)', color: '#217346',
            items: ['Summary sheet with survey overview', 'Demographic targeting details', 'Per-question breakdown with response counts', 'Visual distribution bars', 'Full raw responses tab for data analysis'],
          },
          {
            icon: '📄', title: 'PDF Report (.pdf)', color: C.red,
            items: ['Professional branded layout', 'Executive summary page', 'Audience targeting section', 'Per-question results with tables', 'Ready to email directly to clients'],
          },
        ].map(fmt => (
          <div key={fmt.title} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{fmt.icon}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: fmt.color, margin: 0 }}>{fmt.title}</h3>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
              {fmt.items.map(item => (
                <li key={item} style={{ fontSize: 12, color: 'rgba(11,37,69,0.55)', marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
