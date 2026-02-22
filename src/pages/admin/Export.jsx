// src/pages/admin/Export.jsx — Polished
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

const DATASETS = [
  { key: 'users', label: 'Users', icon: '👥', desc: 'All user profiles, roles, and verification status', table: 'users' },
  { key: 'surveys', label: 'Surveys', icon: '📋', desc: 'All surveys with questions and metadata', table: 'surveys' },
  { key: 'responses', label: 'Responses', icon: '📊', desc: 'All survey responses with answers', table: 'responses' },
  { key: 'organizations', label: 'Organizations', icon: '🏢', desc: 'Organization profiles and tiers', table: 'organizations' },
];

export default function AdminExport() {
  const [selected, setSelected] = useState('users');
  const [format, setFormat] = useState('csv');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    let query = supabase.from(DATASETS.find(d => d.key === selected).table).select('*');
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate + 'T23:59:59');
    const { data, error } = await query;
    setExporting(false);
    if (error || !data?.length) return alert(error?.message || 'No data to export');

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selected}_export.json`; a.click();
    } else {
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selected}_export.csv`; a.click();
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Export Data</h1>
        <p className="text-sm text-[#0B2545]/35 mt-1">Download platform data as CSV or JSON</p>
      </div>

      {/* Dataset Selection */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 mb-3">Select Dataset</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DATASETS.map(d => (
            <button key={d.key} onClick={() => setSelected(d.key)}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
                selected === d.key
                  ? 'border-[#C5960C] bg-[#C5960C]/[0.03] shadow-md shadow-[#C5960C]/10'
                  : 'border-[#0B2545]/[0.05] bg-white hover:border-[#0B2545]/10 hover:shadow-sm'
              }`}>
              <span className="text-2xl block mb-2">{d.icon}</span>
              <p className={`text-sm font-bold transition-colors ${selected === d.key ? 'text-[#C5960C]' : 'text-[#0B2545]/70 group-hover:text-[#0B2545]'}`}>{d.label}</p>
              <p className="text-[11px] text-[#0B2545]/30 mt-1 leading-relaxed">{d.desc}</p>
              {selected === d.key && <div className="absolute top-3 right-3 w-5 h-5 bg-[#C5960C] rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Export Settings */}
      <div className="bg-white rounded-2xl border border-[#0B2545]/[0.04] p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#0B2545]">Export Settings</h3>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">Format</label>
          <div className="flex gap-2">
            {['csv', 'json'].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  format === f ? 'bg-[#0B2545] text-white shadow-sm' : 'bg-[#0B2545]/[0.04] text-[#0B2545]/40 hover:bg-[#0B2545]/[0.08] hover:text-[#0B2545]/60'
                }`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0B2545]/30 block mb-2">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full text-sm text-[#0B2545] bg-[#0B2545]/[0.02] rounded-xl px-4 py-3 border border-[#0B2545]/[0.06] focus:border-[#C5960C]/40 focus:ring-2 focus:ring-[#C5960C]/10 outline-none transition-all" />
          </div>
        </div>
      </div>

      <button onClick={handleExport} disabled={exporting}
        className="w-full py-3.5 bg-[#C5960C] hover:bg-[#b3870b] text-white font-semibold rounded-xl shadow-sm hover:shadow-md hover:shadow-[#C5960C]/20 transition-all duration-200 disabled:opacity-50 text-sm">
        {exporting ? (
          <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Exporting...</span>
        ) : (
          `⬇ Export ${DATASETS.find(d => d.key === selected)?.label} as ${format.toUpperCase()}`
        )}
      </button>
    </div>
  );
}
