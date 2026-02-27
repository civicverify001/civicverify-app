// src/pages/citizen/CitizenLayout.jsx — Phase 7: UI Polish
import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ErrorBoundary, ToastProvider } from '../../components/UIPolish';

var C = { navy: '#0B2545', gold: '#C5960C' };
var font = 'Libre Baskerville, Georgia, serif';

var links = [
  { to: '/citizen', icon: '📊', label: 'Dashboard', end: true },
  { to: '/citizen/surveys', icon: '📋', label: 'Surveys' },
  { to: '/citizen/community', icon: '💬', label: 'Community' },
  { to: '/citizen/debates', icon: '🏛', label: 'Debates' },
  { to: '/citizen/verify', icon: '✓', label: 'Verify ID' },
  { to: '/citizen/impact', icon: '🚀', label: 'My Impact' },
  { to: '/citizen/account', icon: '⚙️', label: 'Account' },
];

export default function CitizenLayout() {
  var [open, setOpen] = useState(false);
  var [notifications, setNotifications] = useState(0);
  var navigate = useNavigate();
  var location = useLocation();
  var auth = useAuth();
  var profile = auth.profile;

  // Close mobile sidebar on route change
  useEffect(function() { setOpen(false); }, [location.pathname]);

  // Load notification count
  useEffect(function() {
    if (!profile) return;
    async function loadNotifs() {
      var { count: debateCount } = await supabase.from('debates')
        .select('id', { count: 'exact', head: true })
        .eq('opponent_id', profile.id)
        .eq('status', 'pending');
      setNotifications(debateCount || 0);
    }
    loadNotifs();
    var interval = setInterval(loadNotifs, 30000);
    return function() { clearInterval(interval); };
  }, [profile]);

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', background: '#FAFAF8' }}>
        {/* Mobile overlay */}
        {open && (
          <div onClick={function(){ setOpen(false); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,69,0.5)', backdropFilter: 'blur(4px)', zIndex: 40, animation: 'cv-fadeIn 0.2s ease' }}
          />
        )}

        {/* Sidebar */}
        <aside className="cv-sidebar" style={{
          width: 260, background: 'linear-gradient(180deg, #0B2545 0%, #0a1f3a 100%)',
          position: 'fixed', top: 0, bottom: 0, left: open ? 0 : -260, zIndex: 50,
          display: 'flex', flexDirection: 'column', transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.04)',
        }}>
          {/* Logo */}
          <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){ navigate('/'); }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, ' + C.gold + ', #a07a0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(197,150,12,0.3)' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: 0.5 }}>CV</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="cv-notif-bell" onClick={function(){ navigate('/citizen/debates'); }} title="Notifications">
                🔔
                {notifications > 0 && <span className="cv-notif-badge" />}
              </button>
              <button onClick={function(){ setOpen(false); }} className="cv-close-btn" style={{ display: 'none', width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '0 16px 8px' }} />

          {/* Nav */}
          <nav style={{ flex: 1, padding: '4px 12px' }}>
            {links.map(function(link) {
              return (
                <NavLink key={link.to} to={link.to} end={link.end || false}
                  className={function(p) { return 'cv-nav-link' + (p.isActive ? ' active' : ''); }}>
                  <span className="cv-nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                  {link.to === '/citizen/debates' && notifications > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#fff', background: '#ef4444', padding: '2px 7px', borderRadius: 10, minWidth: 18, textAlign: 'center', lineHeight: '16px' }}>{notifications}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: profile && profile.avatar_url ? 'url(' + profile.avatar_url + ') center/cover' : 'linear-gradient(135deg, ' + C.gold + ', #a07a0a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                  border: '2px solid rgba(197,150,12,0.3)',
                }}>
                  {(!profile || !profile.avatar_url) && ((profile && profile.full_name ? profile.full_name : '?').charAt(0).toUpperCase())}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.full_name : '...'}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.email : ''}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: profile && profile.is_verified ? '#34d399' : '#fbbf24', boxShadow: profile && profile.is_verified ? '0 0 6px rgba(52,211,153,0.4)' : 'none' }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: profile && profile.is_verified ? '#34d399' : '#fbbf24' }}>
                  {profile && profile.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
            <button onClick={logout} className="cv-logout-btn" style={{
              width: '100%', marginTop: 8, padding: '10px 16px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.08)',
              borderRadius: 10, color: '#ef4444', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
            }}>Sign Out</button>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, marginLeft: 0, minHeight: '100vh' }} className="cv-main">
          {/* Mobile header */}
          <header className="cv-mobile-header" style={{
            display: 'none', position: 'sticky', top: 0, zIndex: 30,
            background: 'linear-gradient(135deg, #0B2545, #0a1f3a)',
            padding: '10px 16px', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button onClick={function(){ setOpen(true); }} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
            <button className="cv-notif-bell" onClick={function(){ navigate('/citizen/debates'); }} style={{ width: 40, height: 40 }}>
              🔔{notifications > 0 && <span className="cv-notif-badge" />}
            </button>
          </header>

          <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
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
            .cv-main > div { padding: 16px 14px !important; }\
          }\
          .cv-logout-btn:hover { background: rgba(239,68,68,0.12) !important; }\
        '}</style>
      </div>
    </ToastProvider>
  );
}

