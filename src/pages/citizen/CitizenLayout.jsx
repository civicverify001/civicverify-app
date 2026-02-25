// src/pages/citizen/CitizenLayout.jsx — Mobile-responsive with hamburger menu + notification bell
import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

var C = { navy: '#0B2545', gold: '#C5960C', cream: '#F5F1EC' };
var font = 'Libre Baskerville, Georgia, serif';
var sans = 'DM Sans, system-ui, sans-serif';

var links = [
  { to: '/citizen', icon: '\uD83D\uDCCA', label: 'Dashboard', end: true },
  { to: '/citizen/surveys', icon: '\u2630', label: 'Surveys' },
  { to: '/citizen/community', icon: '\uD83D\uDCAC', label: 'Community' },
  { to: '/citizen/verify', icon: '\u2713', label: 'Verify ID' },
  { to: '/citizen/impact', icon: '\uD83D\uDE80', label: 'My Impact' },
  { to: '/citizen/account', icon: '\u2699\uFE0F', label: 'Account' },
];

function timeAgo(ts) {
  var s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function NotificationBell({ userId }) {
  var [notifications, setNotifications] = useState([]);
  var [unreadCount, setUnreadCount] = useState(0);
  var [showDropdown, setShowDropdown] = useState(false);
  var [loading, setLoading] = useState(false);
  var dropRef = useRef(null);

  useEffect(function () {
    if (userId) fetchCount();
    var interval = setInterval(function () { if (userId) fetchCount(); }, 30000);
    return function () { clearInterval(interval); };
  }, [userId]);

  useEffect(function () {
    if (!showDropdown) return;
    function close(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', close);
    return function () { document.removeEventListener('mousedown', close); };
  }, [showDropdown]);

  async function fetchCount() {
    var result = await supabase
      .from('community_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    setUnreadCount(result.count || 0);
  }

  async function fetchNotifications() {
    setLoading(true);
    var result = await supabase
      .from('community_notifications')
      .select('id, type, title, body, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(result.data || []);
    setLoading(false);
  }

  async function toggleDropdown() {
    var next = !showDropdown;
    setShowDropdown(next);
    if (next) {
      fetchNotifications();
    }
  }

  async function markAllRead() {
    await supabase.rpc('mark_notifications_read', { p_user_id: userId });
    setUnreadCount(0);
    setNotifications(function (prev) { return prev.map(function (n) { return Object.assign({}, n, { read: true }); }); });
  }

  async function clearAll() {
    await supabase.from('community_notifications').delete().eq('user_id', userId);
    setNotifications([]);
    setUnreadCount(0);
  }

  var iconMap = { reply: '💬', like: '❤️', new_survey: '📋', badge_earned: '🏆' };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button onClick={toggleDropdown} style={{
        width: 40, height: 40, borderRadius: 10, background: showDropdown ? 'rgba(197,150,12,0.15)' : 'rgba(255,255,255,0.08)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', transition: 'all 0.2s',
      }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={showDropdown ? C.gold : 'rgba(255,255,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8,
            background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            fontFamily: sans, animation: 'pulse 2s ease infinite',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, maxWidth: 'calc(100vw - 32px)', maxHeight: 440,
          background: '#fff', borderRadius: 16, border: '1px solid rgba(11,37,69,0.1)',
          boxShadow: '0 12px 40px rgba(11,37,69,0.2)', zIndex: 100, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(11,37,69,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.navy }}>Notifications</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: sans, fontSize: 11, fontWeight: 600, color: C.gold }}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: sans, fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid ' + C.gold, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
                <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 4px' }}>All caught up!</p>
                <p style={{ fontFamily: sans, fontSize: 12, color: '#94a3b8', margin: 0 }}>You have no notifications right now.</p>
              </div>
            ) : notifications.map(function (n) {
              return (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(11,37,69,0.04)',
                  background: n.read ? '#fff' : 'rgba(197,150,12,0.04)',
                  display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={function (e) { e.currentTarget.style.background = C.cream; }}
                  onMouseLeave={function (e) { e.currentTarget.style.background = n.read ? '#fff' : 'rgba(197,150,12,0.04)'; }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{iconMap[n.type] || '📌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: sans, fontSize: 13, fontWeight: n.read ? 400 : 600, color: C.navy, margin: '0 0 2px', lineHeight: 1.4 }}>{n.title}</p>
                    {n.body && <p style={{ fontFamily: sans, fontSize: 12, color: '#94a3b8', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>}
                    <span style={{ fontFamily: sans, fontSize: 10, color: '#94a3b8' }}>{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: 6 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{'@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }'}</style>
    </div>
  );
}

export default function CitizenLayout() {
  var [open, setOpen] = useState(false);
  var navigate = useNavigate();
  var auth = useAuth();
  var profile = auth.profile;
  var user = auth.user;

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  var isVerified = profile && (profile.is_verified || profile.identity_verified);
  var activeStyle = { background: 'rgba(197,150,12,0.12)', color: '#C5960C', fontWeight: 700 };
  var normalStyle = { color: 'rgba(255,255,255,0.5)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Mobile overlay */}
      {open && <div onClick={function(){setOpen(false)}} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />}

      {/* Sidebar */}
      <aside style={{
        width: 260, background: 'linear-gradient(180deg, #0B2545 0%, #0d2e55 100%)', position: 'fixed', top: 0, bottom: 0, left: open ? 0 : -260, zIndex: 50,
        display: 'flex', flexDirection: 'column', transition: 'left 0.3s ease', overflowY: 'auto'
      }} className="cv-sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={function(){navigate('/')}}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>CV</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
          </div>
          {/* Close button - mobile only */}
          <button onClick={function(){setOpen(false)}} className="cv-close-btn" style={{ display: 'none', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>{'\u2715'}</button>
        </div>

        {/* Nav links */}
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
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.full_name : '...'}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile ? profile.email : ''}</p>
            <span style={{ fontSize: 10, fontWeight: 700, color: isVerified ? '#34d399' : '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>
              {isVerified ? '\u25CF VERIFIED' : '\u25CB UNVERIFIED'}
            </span>
          </div>
          <button onClick={logout} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'rgba(184,53,46,0.1)', border: 'none', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 0 }} className="cv-main">
        {/* Mobile header */}
        <header className="cv-mobile-header" style={{ display: 'none', position: 'sticky', top: 0, zIndex: 30, background: C.navy, padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={function(){setOpen(true)}} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2630'}</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: font }}>Civic<span style={{ color: C.gold }}>Verify</span></span>
          <NotificationBell userId={user?.id} />
        </header>

        {/* Desktop notification bar */}
        <div className="cv-desktop-topbar" style={{ display: 'none', padding: '12px 24px', justifyContent: 'flex-end', background: C.navy, position: 'sticky', top: 0, zIndex: 30 }}>
          <NotificationBell userId={user?.id} />
        </div>

        <div className="cv-content-area" style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>

      {/* Responsive styles */}
      <style>{'\
        @media (min-width: 769px) {\
          .cv-sidebar { left: 0 !important; }\
          .cv-main { margin-left: 260px !important; }\
          .cv-mobile-header { display: none !important; }\
          .cv-desktop-topbar { display: flex !important; }\
        }\
        @media (max-width: 768px) {\
          .cv-mobile-header { display: flex !important; }\
          .cv-close-btn { display: flex !important; }\
          .cv-main { margin-left: 0 !important; }\
          .cv-desktop-topbar { display: none !important; }\
          .cv-content-area { padding: 20px 16px !important; }\
        }\
        @media (max-width: 420px) {\
          .cv-content-area { padding: 16px 12px !important; }\
        }\
      '}</style>
    </div>
  );
}
