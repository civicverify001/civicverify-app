// src/pages/org/OrgLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C' };
var font = 'Libre Baskerville, Georgia, serif';

var links = [
  { to: '/org',         icon: '📊', label: 'Dashboard',      end: true },
  { to: '/org/surveys', icon: '📋', label: 'My Surveys'              },
  { to: '/org/request', icon: '➕', label: 'Request Survey'          },
  { to: '/org/billing', icon: '💳', label: 'Billing'                 },
  { to: '/org/profile', icon: '⚙️', label: 'Profile'                 },
];

export default function OrgLayout() {
  var [open, setOpen] = useState(false);
  var navigate = useNavigate();
  var { profile } = useAuth();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  var activeStyle  = { background: 'rgba(197,150,12,0.12)', color: '#C5960C', fontWeight: 700 };
  var normalStyle  = { color: 'rgba(255,255,255,0.5)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Mobile overlay */}
      {open && (
        <div onClick={function(){ setOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* ── Sidebar ── */}
      <aside className="cv-org-sidebar" style={{
        width: 200, flexShrink: 0,
        background: 'linear-gradient(180deg, #0B2545 0%, #0d2e55 100%)',
        position: 'fixed', top: 0, bottom: 0, left: open ? 0 : -200,
        zIndex: 50, display: 'flex', flexDirection: 'column',
        transition: 'left 0.3s ease', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={function(){ navigate('/'); }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: C.gold,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>CV</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>
              Civic<span style={{ color: C.gold }}>Verify</span>
            </span>
          </div>
          {/* Close — mobile only */}
          <button onClick={function(){ setOpen(false); }} className="cv-org-close"
            style={{ display: 'none', width: 30, height: 30, borderRadius: 7,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Org badge */}
        <div style={{ margin: '0 12px 12px', padding: '7px 12px',
          background: 'rgba(197,150,12,0.1)', border: '1px solid rgba(197,150,12,0.2)',
          borderRadius: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', margin: '0 0 1px' }}>ORGANIZATION</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.gold, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.org_name || profile?.full_name || '…'}
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px' }}>
          {links.map(function(link) {
            return (
              <NavLink key={link.to} to={link.to} end={link.end || false}
                onClick={function(){ setOpen(false); }}
                style={function(p) {
                  return Object.assign({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', borderRadius: 10, marginBottom: 3,
                    textDecoration: 'none', fontSize: 13, transition: 'all 0.2s',
                  }, p.isActive ? activeStyle : normalStyle);
                }}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{link.icon}</span>
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: '0 0 2px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name || '…'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email || ''}
            </p>
          </div>
          <button onClick={logout}
            style={{ width: '100%', padding: '9px', background: 'rgba(184,53,46,0.1)',
              border: 'none', borderRadius: 8, color: '#ef4444',
              fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, marginLeft: 0, minWidth: 0, overflow: 'hidden' }} className="cv-org-main">

        {/* Mobile header */}
        <header className="cv-org-mobile-header" style={{
          display: 'none', position: 'sticky', top: 0, zIndex: 30,
          background: C.navy, padding: '12px 16px',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(197,150,12,0.3)',
        }}>
          <button onClick={function(){ setOpen(true); }}
            style={{ width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>
            Civic<span style={{ color: C.gold }}>Verify</span>
          </span>
          <div style={{ width: 40 }} />
        </header>

        {/* ── THE FIX: no maxWidth, no padding, pages control their own layout ── */}
        <div style={{ padding: 0 }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .cv-org-sidebar      { left: 0 !important; }
          .cv-org-main         { margin-left: 200px !important; }
          .cv-org-mobile-header{ display: none !important; }
        }
        @media (max-width: 768px) {
          .cv-org-mobile-header{ display: flex !important; }
          .cv-org-close        { display: flex !important; }
          .cv-org-main         { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
