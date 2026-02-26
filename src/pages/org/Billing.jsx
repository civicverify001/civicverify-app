// src/pages/org/Billing.jsx — with survey progress + correct cost display
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC', red: '#B8352E', green: '#22863A' };
var font = 'Libre Baskerville, Georgia, serif';

const STATUS_CONFIG = {
  active:         { label: 'Active',        color: '#22863A', bg: '#F0FFF4' },
  completed:      { label: 'Completed',     color: '#6366f1', bg: '#EEF2FF' },
  pending_review: { label: 'Pending Review',color: '#C5960C', bg: '#FFFBF0' },
  rejected:       { label: 'Rejected',      color: '#B8352E', bg: '#FFF5F5' },
  draft:          { label: 'Draft',         color: '#6B7280', bg: '#F9FAFB' },
  closed:         { label: 'Closed',        color: '#6B7280', bg: '#F9FAFB' },
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

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        .select('id, title, status, created_at, target_responses, estimated_cost, demographic_filters, response_count')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      setSurveys(data || []);
      setLoading(false);
    })();
  }, [user]);

  var totalEst = surveys.reduce(function(s, r) { return s + getCost(r); }, 0);
  var activeCost = surveys.filter(function(s) { return s.status === 'active'; }).reduce(function(s, r) { return s + getCost(r); }, 0);
  var completedCost = surveys.filter(function(s) { return s.status === 'completed'; }).reduce(function(s, r) { return s + getCost(r); }, 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, border: '3px solid ' + C.gold, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', maxWidth: 900, width: '100%', overflowX: 'hidden' }}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:768px){.cv-billing-cards{grid-template-columns:1fr!important}}'}</style>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.navy, margin: '0 0 4px', fontFamily: font }}>Billing</h1>
        <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.35)', margin: 0 }}>Survey progress and estimated costs</p>
      </div>

      <div style={{ background: C.gold + '08', border: '1px solid ' + C.gold + '20', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>Invoicing upon completion</p>
          <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.45)', margin: 0 }}>You are only billed for verified responses received. Final invoices are sent by email.</p>
        </div>
      </div>

      <div className="cv-billing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <SummaryCard label="Total Estimated" value={fmt(totalEst)} sub={surveys.length + ' survey' + (surveys.length !== 1 ? 's' : '')} color={C.navy} />
        <SummaryCard label="Currently Active" value={fmt(activeCost)} sub="In progress" color={C.green} />
        <SummaryCard label="Completed" value={fmt(completedCost)} sub="Invoiced" color="#6366f1" />
      </div>

      {/* Survey progress cards */}
      <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
        {surveys.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'rgba(11,37,69,0.3)', margin: '0 0 12px' }}>No surveys yet</p>
            <button onClick={function() { navigate('/org/request'); }} style={{ padding: '10px 20px', background: C.gold, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Request a Survey</button>
          </div>
        ) : surveys.map(function(s) {
          var cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.draft;
          var cost = getCost(s);
          var rate = getRate(s);
          var tier = s.demographic_filters?.tier || null;
          var responses = s.response_count || 0;
          var target = s.target_responses || 0;
          var pct = target > 0 ? Math.min(100, Math.round((responses / target) * 100)) : null;
          var accrued = rate ? rate * responses : null;

          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', overflow: 'hidden' }}>
              {/* Top */}
              <div style={{ padding: '20px 24px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: '0 0 3px', fontFamily: font }}>{s.title}</h3>
                    <p style={{ fontSize: 12, color: 'rgba(11,37,69,0.3)', margin: 0 }}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {tier ? ' · ' + tier : ''}
                    </p>
                  </div>
                  <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                </div>

                {/* Progress bar */}
                {target > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(11,37,69,0.4)' }}>Survey Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? C.green : C.navy }}>
                        {responses.toLocaleString()} / {target.toLocaleString()} responses ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'rgba(11,37,69,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, width: pct + '%', background: pct >= 100 ? C.green : C.gold, transition: 'width 0.6s ease' }} />
                    </div>
                    {pct >= 100 && <p style={{ fontSize: 11, color: C.green, margin: '4px 0 0', fontWeight: 600 }}>✓ Target reached!</p>}
                  </div>
                )}

                {/* Cost grid */}
                <div className="cv-billing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Rate / Response', value: rate ? '$' + rate.toFixed(2) : '—', color: rate ? C.gold : null },
                    { label: 'Estimated Total', value: cost > 0 ? fmt(cost) : '—', color: cost > 0 ? C.navy : null },
                    { label: 'Accrued So Far', value: accrued ? fmt(accrued) : '—', color: accrued ? C.green : null },
                  ].map(function(item) {
                    return (
                      <div key={item.label} style={{ padding: '12px 14px', background: 'rgba(245,241,236,0.5)', borderRadius: 10 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(11,37,69,0.25)', margin: '0 0 4px' }}>{item.label}</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: item.color || 'rgba(11,37,69,0.2)', margin: 0 }}>{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer link */}
              {(s.status === 'active' || s.status === 'completed') && (
                <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(11,37,69,0.04)' }}>
                  <button onClick={function() { navigate('/org/results/' + s.id); }} style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    View Survey Results →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pricing reference */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.06)', padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.navy, margin: '0 0 16px' }}>Pricing Reference</h2>
        <div className="cv-billing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { tier: 'General Audience', desc: 'No demographic filters', price: '$3.50/response' },
            { tier: 'Basic Targeting',  desc: '1–2 demographic filters', price: '$4.50/response' },
            { tier: 'Refined Targeting',desc: '3–4 demographic filters', price: '$5.50/response' },
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

