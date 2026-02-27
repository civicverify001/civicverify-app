// src/pages/citizen/CitizenLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

var links = [
  { to: '/citizen', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', label: 'Dashboard', end: true },
  { to: '/citizen/surveys', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Surveys' },
  { to: '/citizen/community', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Community' },
  { to: '/citizen/debates', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Debates' },
  { to: '/citizen/messages', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Messages' },
  { to: '/citizen/verify', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Verify ID' },
  { to: '/citizen/impact', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', label: 'My Impact' },
  { to: '/citizen/account', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Account' },
];

function Ico({ d, size }) {
  size = size || 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Avatar({ name, url, size, verified }) {
  size = size || 36;
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  if (url) {
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + C.gold + '33' }} />
        {verified && (
          <span style={{ position: 'absolute', bottom: -1, right: -1, width: size * 0.33, height: size * 0.33, borderRadius: '50%', background: '#16a34a', border: '2px solid ' + C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: size * 0.18, fontWeight: 800 }}>✓</span>
          </span>
        )}
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, ' + C.navy + ' 0%, #122e56 100%)', border: '2px solid ' + C.gold + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontSize: size * 0.33, fontWeight: 700, color: C.gold }}>
        {initials}
      </div>
      {verified && (
        <span style={{ position: 'absolute', bottom: -1, right: -1, width: size * 0.33, height: size * 0.33, borderRadius: '50%', background: '#16a34a', border: '2px solid ' + C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: size * 0.18, fontWeight: 800 }}>✓</span>
        </span>
      )}
    </div>
  );
}

function NotificationBell({ userId }) {
  var [count, setCount] = useState(0);
  var [open, setOpen] = useState(false);
  var [notifs, setNotifs] = useState([]);
  var ref = useRef(null);
  var navigate = useNavigate();

  useEffect(function() {
    if (userId) fetchCount();
    var interval = setInterval(function() { if (userId) fetchCount(); }, 30000);
    return function() { clearInterval(interval); };
  }, [userId]);

  useEffect(function() {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return function() { document.removeEventListener('mousedown', close); };
  }, []);

  async function fetchCount() {
    var { count: c } = await supabase.from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('is_read', false);
    setCount(c || 0);
  }

  async function openPanel() {
    setOpen(!open);
    if (!open) {
      var { data } = await supabase.from('notifications')
        .select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(20);
      setNotifs(data || []);
    }
  }

  async function markRead(n) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setCount(function(c) { return Math.max(0, c - 1); });
    setNotifs(function(prev) { return prev.map(function(x) { return x.id === n.id ? Object.assign({}, x, { is_read: true }) : x; }); });
    if (n.link) { navigate(n.link); setOpen(false); }
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setCount(0);
    setNotifs(function(prev) { return prev.map(function(x) { return Object.assign({}, x, { is_read: true }); }); });
  }

  function timeAgo(ts) {
    var s = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    return Math.floor(s / 86400) + 'd';
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={openPanel} style={{
        width: 38, height: 38, borderRadius: 10, border: 'none',
        background: open ? 'rgba(197,150,12,0.15)' : 'rgba(255,255,255,0.06)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: open ? C.gold : 'rgba(255,255,255,0.5)', transition: 'all 0.2s', position: 'relative',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16,
            borderRadius: 8, background: '#ef4444', color: '#fff',
            fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '0 4px', fontFamily: sans,
          }}>{count > 99 ? '99+' : count}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0, width: 320,
          background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(11,37,69,0.15)',
          border: '1px solid rgba(11,37,69,0.08)', zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(11,37,69,0.06)' }}>
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: C.navy }}>Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, fontWeight: 600, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 24, margin: '0 0 4px' }}>🔔</p>
                <p style={{ fontSize: 13, color: 'rgba(11,37,69,0.35)' }}>No notifications yet</p>
              </div>
            ) : notifs.map(function(n) {
              return (
                <div key={n.id} onClick={function() { markRead(n); }}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 10,
                    background: n.is_read ? '#fff' : 'rgba(197,150,12,0.04)',
                    borderBottom: '1px solid rgba(11,37,69,0.04)',
                    transition: 'background 0.15s',
                  }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                    background: n.is_read ? 'transparent' : C.gold,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.4, fontWeight: n.is_read ? 400 : 600 }}>
                      {n.content || n.message || 'Notification'}
                    </p>
                    <span style={{ fontSize: 11, color: 'rgba(11,37,69,0.3)' }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CitizenLayout() {
  var [open, setOpen] = useState(false);
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;
  var user = auth.user;
  var [unreadDMs, setUnreadDMs] = useState(0);

  useEffect(function() {
    if (user) fetchUnreadDMs();
  }, [user]);

  async function fetchUnreadDMs() {
    var { count } = await supabase.from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id).eq('is_read', false);
    setUnreadDMs(count || 0);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  var activeStyle = { background: 'rgba(197,150,12,0.12)', color: C.gold, fontWeight: 700 };
  var normalStyle = { color: 'rgba(255,255,255,0.45)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: sans }}>
      {/* Mobile overlay */}
      {open && <div onClick={function(){setOpen(false)}} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'linear-gradient(180deg, #0B2545 0%, #0d2e55 100%)',
        position: 'fixed', top: 0, bottom: 0, left: open ? 0 : -260, zIndex: 50,
        display: 'flex', flexDirection: 'column', transition: 'left 0.3s ease', overflowY: 'auto',
      }} className="cv-sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, ' + C.gold + ' 0%, #a37d0a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11, fontFamily: font }}>CV</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
          </div>
          <button onClick={function(){setOpen(false)}} className="cv-close-btn" style={{
            display: 'none', width: 30, height: 30, borderRadius: 8,
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: 16, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          }}>{'\u2715'}</button>
        </div>

        {/* Notification bell in sidebar */}
        <div style={{ padding: '0 16px 12px' }}>
          <NotificationBell userId={user?.id} />
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '4px 10px' }}>
          {links.map(function(link) {
            var isMessages = link.label === 'Messages';
            return (
              <NavLink key={link.to} to={link.to} end={link.end || false} onClick={function(){setOpen(false)}}
                style={function(p) {
                  return Object.assign({
                    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
                    borderRadius: 10, marginBottom: 2, textDecoration: 'none', fontSize: 13,
                    transition: 'all 0.2s', position: 'relative',
                  }, p.isActive ? activeStyle : normalStyle);
                }}>
                <span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico d={link.icon} size={17} />
                </span>
                <span>{link.label}</span>
                {isMessages && unreadDMs > 0 && (
                  <span style={{
                    marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9,
                    background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                  }}>{unreadDMs}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div onClick={function() { navigate('/citizen/account'); setOpen(false); }}
            style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', transition: 'background 0.15s' }}
            onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
            <Avatar name={profile?.full_name} url={profile?.avatar_url} size={34} verified={profile?.identity_verified || profile?.is_verified} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile ? profile.full_name : '...'}
              </p>
              <span style={{ fontSize: 10, fontWeight: 700, color: (profile && (profile.is_verified || profile.identity_verified)) ? '#34d399' : '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {(profile && (profile.is_verified || profile.identity_verified)) ? '● VERIFIED' : '○ UNVERIFIED'}
              </span>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', marginTop: 6, padding: '9px', background: 'rgba(239,68,68,0.08)',
            border: 'none', borderRadius: 8, color: '#ef4444', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
            onMouseEnter={function(e) { e.target.style.background = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={function(e) { e.target.style.background = 'rgba(239,68,68,0.08)'; }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 0, minWidth: 0 }} className="cv-main">
        {/* Mobile header */}
        <header className="cv-mobile-header" style={{
          display: 'none', position: 'sticky', top: 0, zIndex: 30,
          background: C.navy, padding: '10px 14px', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(11,37,69,0.15)',
        }}>
          <button onClick={function(){setOpen(true)}} style={{
            width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
            border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>☰</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>
            Civic<span style={{ color: C.gold }}>Verify</span>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <NotificationBell userId={user?.id} />
            <Avatar name={profile?.full_name} url={profile?.avatar_url} size={32} verified={profile?.identity_verified || profile?.is_verified} />
          </div>
        </header>

        <div style={{ padding: '28px 20px', maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>

      <style>{'\
        @media (min-width: 769px) {\
          .cv-sidebar { left: 0 !important; }\
          .cv-main { margin-left: 240px !important; }\
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
