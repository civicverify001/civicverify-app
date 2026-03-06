// src/pages/admin/AdminLayout.jsx — Mobile-responsive with hamburger menu
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C' };
var font = 'Libre Baskerville, Georgia, serif';

var links = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/surveys', icon: '📋', label: 'Surveys' },
  { to: '/admin/surveys/new', icon: '+', label: 'Create Survey' },
  { to: '/admin/review', icon: '🔍', label: 'Review Queue' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/moderation', icon: '🛡️', label: 'Moderation' },
  { to: '/admin/community', icon: '💬', label: 'Community' },
  { to: '/admin/reels', icon: '🎬', label: 'Reels' },
  { to: '/admin/debates', icon: '⚔️', label: 'Debates' },
  { to: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { to: '/admin/export', icon: '📥', label: 'Export' },
  { to: '/admin/org-review', icon: '🏢', label: 'Org Review' },
  { to: '/admin/blog', icon: '✏️', label: 'Blog' },
];

export default function AdminLayout() {
  var [open, setOpen] = useState(false);
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  var activeStyle = { background: 'rgba(197,150,12,0.12)', color: '#C5960C', fontWeight: 700 };
  var normalStyle = { color: 'rgba(255,255,255,0.5)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {open && <div onClick={function(){setOpen(false)}} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />}

      <aside style={{
        width: 260, background: 'linear-gradient(180deg, #0B2545 0%, #0d2e55 100%)', position: 'fixed', top: 0, bottom: 0, left: open ? 0 : -260, zIndex: 50,
        display: 'flex', flexDirection: 'column', transition: 'left 0.3s ease', overflowY: 'auto'
      }} className="cv-sidebar">
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>CV</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
          </div>
          <button onClick={function(){setOpen(false)}} className="cv-close-btn" style={{ display: 'none', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>{'\u2715'}</button>
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: C.gold + '15', padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1.5 }}>Admin Panel</span>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {links.map(function(link) {
            return (
              <NavLink key={link.to} to={link.to} end={link.end || false} onClick={function(){setOpen(false)}}
                style={function(p) {
                  return Object.assign({
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, marginBottom: 4,
                    textDecoration: 'none', fontSize: 14, transition: 'all 0.2s'
                  }, p.isActive ? activeStyle : normalStyle);
                }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{link.icon}</span>
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.full_name : '...'}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.email : ''}</p>
          </div>
          <button onClick={logout} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'rgba(184,53,46,0.1)', border: 'none', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </aside>

      {/* Main content — overflowY: auto fixes mouse scroll on desktop */}
      <div style={{ flex: 1, marginLeft: 0, minHeight: '100vh', overflowY: 'auto' }} className="cv-main">
        <header className="cv-mobile-header" style={{ display: 'none', position: 'sticky', top: 0, zIndex: 30, background: C.navy, padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={function(){setOpen(true)}} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2630'}</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
          <div style={{ width: 40 }} />
        </header>

        <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>

      <style>{'\
        @media (min-width: 769px) {\
          .cv-sidebar { left: 0 !important; }\
          .cv-main { margin-left: 260px !important; }\
          .cv-mobile-header { display: none !important; }\
        }\
        @media (max-width: 768px) {\
          .cv-mobile-header { display: flex !important; }\
          .cv-close-btn { display: flex !important; }\
          .cv-main { margin-left: 0 !important; }\
        }\
      '}</style>
    </div>
  );
}
