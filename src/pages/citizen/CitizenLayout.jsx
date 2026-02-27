// src/pages/citizen/CitizenLayout.jsx — Fixed: bell shows notifications dropdown
import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ErrorBoundary, ToastProvider } from '../../components/UIPolish';

var C = { navy: '#0B2545', gold: '#C5960C' };
var font = 'Libre Baskerville, Georgia, serif';

var links = [
  { to: '/citizen', icon: '\uD83D\uDCCA', label: 'Dashboard', end: true },
  { to: '/citizen/surveys', icon: '\uD83D\uDCCB', label: 'Surveys' },
  { to: '/citizen/community', icon: '\uD83D\uDCAC', label: 'Community' },
  { to: '/citizen/debates', icon: '\uD83C\uDFDB', label: 'Debates' },
  { to: '/citizen/verify', icon: '\u2713', label: 'Verify ID' },
  { to: '/citizen/impact', icon: '\uD83D\uDE80', label: 'My Impact' },
  { to: '/citizen/account', icon: '\u2699\uFE0F', label: 'Account' },
];

function timeAgo(iso) {
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'now';
  if (d < 3600) return Math.floor(d / 60) + 'm';
  if (d < 86400) return Math.floor(d / 3600) + 'h';
  return Math.floor(d / 86400) + 'd';
}

export default function CitizenLayout() {
  var [open, setOpen] = useState(false);
  var [bellOpen, setBellOpen] = useState(false);
  var [notifList, setNotifList] = useState([]);
  var [unreadCount, setUnreadCount] = useState(0);
  var bellRef = useRef(null);
  var navigate = useNavigate();
  var location = useLocation();
  var auth = useAuth();
  var profile = auth.profile;

  var activeStyle = { background: 'rgba(197,150,12,0.12)', color: '#C5960C', fontWeight: 700 };
  var normalStyle = { color: 'rgba(255,255,255,0.5)' };

  useEffect(function() { setOpen(false); setBellOpen(false); }, [location.pathname]);

  useEffect(function() {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  useEffect(function() {
    if (!profile) return;
    loadNotifications();
    var interval = setInterval(loadNotifications, 20000);
    return function() { clearInterval(interval); };
  }, [profile]);

  async function loadNotifications() {
    if (!profile) return;
    var { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(15);

    var { count: debateCount } = await supabase.from('debates')
      .select('id', { count: 'exact', head: true })
      .eq('opponent_id', profile.id)
      .eq('status', 'pending');

    var allNotifs = notifs || [];
    var unread = allNotifs.filter(function(n) { return !n.is_read; }).length + (debateCount || 0);
    setNotifList(allNotifs);
    setUnreadCount(unread);
  }

  async function markAllRead() {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setNotifList(function(prev) { return prev.map(function(n) { return Object.assign({}, n, { is_read: true }); }); });
    setUnreadCount(0);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  var notifIcons = { follow: '\uD83D\uDC64', mention: '@', reply: '\uD83D\uDCAC', like: '\u2764\uFE0F', debate_invite: '\uD83C\uDFDB', poll: '\uD83D\uDCCA' };

  function renderDropdown() {
    return (
      <div style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 8,
        width: 320, maxHeight: 400, overflowY: 'auto',
        background: '#fff', borderRadius: 14, border: '1px solid rgba(11,37,69,0.08)',
        boxShadow: '0 12px 40px rgba(11,37,69,0.15)', zIndex: 100,
      }}>
        <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Notifications</span>
          {unreadCount > 0 && (
            <button onClick={function(e) { e.stopPropagation(); markAllRead(); }}
              style={{ fontSize: 11, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>
        {notifList.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, margin: '0 0 8px' }}>{'\uD83D\uDD14'}</p>
            <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)', margin: 0 }}>No notifications yet</p>
            <p style={{ fontSize: 11, color: 'rgba(11,37,69,0.2)', margin: '4px 0 0' }}>Follows, mentions and replies appear here</p>
          </div>
        ) : (
          <div>
            {notifList.map(function(n) {
              return (
                <div key={n.id}
                  onClick={function() { if (n.link) { navigate(n.link); setBellOpen(false); } }}
                  style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: n.is_read ? 'transparent' : 'rgba(197,150,12,0.03)',
                    borderBottom: '1px solid rgba(11,37,69,0.04)',
                    cursor: n.link ? 'pointer' : 'default',
                  }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{notifIcons[n.type] || '\uD83D\uDD14'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.4, fontWeight: n.is_read ? 400 : 600 }}>
                      {n.content || 'New notification'}
                    </p>
                    <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: 6 }} />}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(11,37,69,0.06)', textAlign: 'center' }}>
          <button onClick={function() { navigate('/citizen'); setBellOpen(false); }}
            style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
            View all on Dashboard
          </button>
        </div>
      </div>
    );
  }

  function renderBell(btnStyle) {
    return (
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button onClick={function(e) { e.stopPropagation(); setBellOpen(!bellOpen); }}
          style={Object.assign({ position: 'relative', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }, btnStyle)}>
          {'\uD83D\uDD14'}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 16, height: 16, borderRadius: 8,
              background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', border: '2px solid ' + C.navy,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {bellOpen && renderDropdown()}
      </div>
    );
  }

  return (
    <ToastProvider>
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
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {renderBell({ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 14 })}
              <button onClick={function(){setOpen(false)}} className="cv-close-btn" style={{ display: 'none', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>{'\u2715'}</button>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '8px 12px' }}>
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
                  <span style={{ flex: 1 }}>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.full_name : '...'}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.email : ''}</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: profile && profile.is_verified ? '#34d399' : '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>
                {profile && profile.is_verified ? '\u25CF VERIFIED' : '\u25CB UNVERIFIED'}
              </span>
            </div>
            <button onClick={logout} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'rgba(184,53,46,0.1)', border: 'none', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
          </div>
        </aside>

        <div style={{ flex: 1, marginLeft: 0, overflowX: 'hidden' }} className="cv-main">
          <header className="cv-mobile-header" style={{ display: 'none', position: 'sticky', top: 0, zIndex: 30, background: C.navy, padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={function(){setOpen(true)}} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2630'}</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
            {renderBell({ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 16 })}
          </header>

          <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
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
          }\
        '}</style>
      </div>
    </ToastProvider>
  );
}

