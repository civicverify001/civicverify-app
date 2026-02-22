// src/pages/admin/Export.jsx
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

const DATA_TYPES = [
  { key: 'users',     label: 'Users',     icon: '👥', description: 'All user profiles, roles, verification status' },
  { key: 'surveys',   label: 'Surveys',   icon: '📋', description: 'All surveys with questions and metadata' },
  { key: 'responses', label: 'Responses', icon: '📝', description: 'All survey responses with answers' },
  { key: 'orgs',      label: 'Organizations', icon: '🏢', description: 'Organization profiles and tiers' },
];

function downloadFile(content, filename, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(data) {
  if (!data?.length) return '';
  const flattenObj = (obj, prefix = '') => {
    const result = {};
    for (const [k, v] of Object.entries(obj || {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(result, flattenObj(v, key));
      } else if (Array.isArray(v)) {
        result[key] = JSON.stringify(v);
      } else {
        result[key] = v;
      }
    }
    return result;
  };
  const flat = data.map((d) => flattenObj(d));
  const headers = [...new Set(flat.flatMap(Object.keys))];
  const rows = flat.map((r) => headers.map((h) => {
    const val = r[h];
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export default function Export() {
  const [selected, setSelected] = useState('users');
  const [format, setFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  async function handleExport() {
    setExporting(true);
    try {
      const table = selected === 'orgs' ? 'organizations' : selected;
      let query = supabase.from(table).select('*').order('created_at', { ascending: false });

      if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
      if (dateTo) query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString());

      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) { alert('No data found for the selected criteria.'); return; }

      const timestamp = new Date().toISOString().split('T')[0];
      if (format === 'csv') {
        downloadFile(toCSV(data), `civicverify_${selected}_${timestamp}.csv`);
      } else {
        downloadFile(JSON.stringify(data, null, 2), `civicverify_${selected}_${timestamp}.json`, 'application/json');
      }

      setLastExport({ type: selected, count: data.length, time: new Date().toLocaleTimeString() });
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  }

  const typeInfo = DATA_TYPES.find((t) => t.key === selected);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545]" style={{ fontFamily: 'Libre Baskerville, serif' }}>Export Data</h1>
        <p className="text-sm text-[#0B2545]/40 mt-1">Download platform data as CSV or JSON</p>
      </div>

      {/* Data Type Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DATA_TYPES.map((t) => (
          <button key={t.key} onClick={() => setSelected(t.key)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selected === t.key
                ? 'border-[#C5960C]/30 bg-[#C5960C]/[0.03] shadow-sm ring-1 ring-[#C5960C]/10'
                : 'border-[#0B2545]/5 bg-white hover:border-[#0B2545]/10'
            }`}>
            <span className="text-2xl">{t.icon}</span>
            <p className="text-sm font-semibold text-[#0B2545] mt-2">{t.label}</p>
            <p className="text-[10px] text-[#0B2545]/30 mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-[#0B2545]/5 p-6 space-y-5">
        <h3 className="font-semibold text-[#0B2545] text-sm">Export Settings</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">Format</label>
            <div className="flex bg-[#F5F1EC]/50 rounded-lg p-1 border border-[#0B2545]/5">
              {['csv', 'json'].map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    format === f ? 'bg-white text-[#0B2545] shadow-sm' : 'text-[#0B2545]/35'
                  }`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#0B2545]/40 uppercase tracking-wider mb-1.5">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F5F1EC]/40 border border-[#0B2545]/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5960C]/20 transition-all" />
          </div>
        </div>

        <button onClick={handleExport} disabled={exporting}
          className="w-full py-3 bg-[#C5960C] hover:bg-[#b3870b] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {exporting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Exporting...</>
          ) : (
            <>⬇ Export {typeInfo?.label} as {format.toUpperCase()}</>
          )}
        </button>

        {lastExport && (
          <div className="flex items-center gap-2 text-xs text-[#22863A] bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            <span>✓</span>
            <span>Exported {lastExport.count} {lastExport.type} records at {lastExport.time}</span>
          </div>
        )}
      </div>
    </div>
  );
}
