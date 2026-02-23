// src/pages/org/Billing.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#22863A', bg: '#F0FFF4' },
  completed: { label: 'Completed', color: '#0B2545', bg: '#EEF2FF' },
  pending_review: { label: 'Pending', color: '#C5960C', bg: '#FFFBF0' },
  rejected:  { label: 'Rejected',  color: '#B8352E', bg: '#FFF5F5' },
};

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.06)', padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.3)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || C.navy, margin: '0 0 4px', fontFamily: font }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function Billing() {
  var auth = useAuth(); var user = auth.user;
  var navigate = useNavigate();
  var [surveys, setSurveys] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!user) return;
    (async function() {
      var { data } = await supabase
        .from('surveys')
        .select('id, title, status, created_at, target_responses, estimated_cost, demographic_filters')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      setSurveys(data || []);
      setLoading(false);
    })();
  }, [user]);

  var totalEstimated = surveys.reduce(function(sum, s) { return sum + (Number(s.estimated_cost) || 0); }, 0);
  var activeCost = surveys.filter(function(s) { return s.status === 'active'; }).reduce(function(sum, s) { return sum + (Number(s.estimated_cost) || 0); }, 0);
  var completedCost = surveys.filter(function(s) { return s.status === 'completed'; }).reduce(function(sum, s) { return sum + (Number(s.estimated_cost) || 0); }, 0);

  function getRate(s) {
    var df = s.demographic_filters;
    if (!df) return null;
    return df.price_per_response || null;
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Billing</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Estimated costs based on your survey requests</p>
      </div>

      {/* Notice */}
      <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>Invoicing upon completion</p>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: 0 }}>Costs shown are estimates based on target responses. You are only billed for verified responses received when a survey completes. Final invoices are sent by email.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <SummaryCard label="Total Estimated" value={'$' + totalEstimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sub={surveys.length + ' survey' + (surveys.length !== 1 ? 's' : '')} color={C.navy} />
        <SummaryCard label="Currently Active" value={'$' + activeCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sub="In progress" color={C.green} />
        <SummaryCard label="Completed" value={'$' + completedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sub="Invoiced" color="#6366f1" />
      </div>

      {/* Survey breakdown */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(11,37,69,0.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: 0 }}>Survey Cost Breakdown</h2>
        </div>

        {surveys.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)', margin: '0 0 12px' }}>No surveys yet</p>
            <button onClick={function() { navigate('/org/request-survey'); }} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Request a Survey</button>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 120px', gap: 0, padding: '10px 24px', borderBottom: '1px solid rgba(11,37,69,0.04)', background: 'rgba(11,37,69,0.01)' }}>
              {['Survey', 'Status', 'Rate/Response', 'Target', 'Est. Total'].map(function(h) {
                return <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(11,37,69,0.25)' }}>{h}</span>;
              })}
            </div>
            {surveys.map(function(s, i) {
              var cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending_review;
              var rate = getRate(s);
              var tier = s.demographic_filters && s.demographic_filters.tier;
              return (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 120px', gap: 0, padding: '16px 24px', borderBottom: i < surveys.length - 1 ? '1px solid rgba(11,37,69,0.03)' : 'none', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>{s.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)', margin: 0 }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{tier ? ' · ' + tier : ''}</p>
                  </div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{rate ? '$' + rate.toFixed(2) : '—'}</span>
                  <span style={{ fontSize: 13, color: 'rgba(11,37,69,0.5)' }}>{s.target_responses ? s.target_responses.toLocaleString() : '—'}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: s.estimated_cost ? C.gold : 'rgba(11,37,69,0.25)' }}>{s.estimated_cost ? '$' + Number(s.estimated_cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pricing reference */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24, marginTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>Pricing Reference</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50/response' },
            { tier: 'Basic Targeting', desc: '1–2 demographic filters', price: '$4.50/response' },
            { tier: 'Refined Targeting', desc: '3–4 demographic filters', price: '$5.50/response' },
            { tier: 'Precision Targeting', desc: '5+ demographic filters', price: '$7.00/response' },
          ].map(function(t) {
            return (
              <div key={t.tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(245,241,236,0.4)', borderRadius: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>{t.tier}</p>
                  <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.35)', margin: 0 }}>{t.desc}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.gold }}>{t.price}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.25)', margin: '12px 0 0' }}>Geographic city/ZIP targeting adds +$1.00/response</p>
      </div>
    </div>
  );
}
