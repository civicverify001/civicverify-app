// src/components/NotificationBell.jsx
// Global notification bell — uses fixed positioning so the panel
// never gets clipped by parent overflow (sidebar, headers, etc.)
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";

var C = { navy: "#0B2545", gold: "#C5960C", cream: "#F5F1EC", muted: "#64748b", border: "rgba(11,37,69,0.08)", sans: "'DM Sans', system-ui, sans-serif" };

var bellPath = "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";

function timeAgo(ts) {
  var s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

function NotifIcon({ type, emoji }) {
  var bg = type === "reply" ? "#3b82f618" : type === "reaction" ? "#f59e0b18" : type === "follow" ? "#10b98118" : C.navy + "10";
  var icon = type === "reply" ? "💬" : type === "reaction" ? (emoji || "❤️") : type === "follow" ? "👤" : "🔔";
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
      {icon}
    </div>
  );
}

function NotifMessage({ n }) {
  var msg = n.type === "reply" ? "replied to your post"
    : n.type === "reaction" ? ("reacted " + (n.emoji || "❤️") + " to your post")
    : n.type === "follow" ? "started following you"
    : (n.message || "interacted with your content");
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: C.sans, fontSize: 13, color: C.navy, margin: 0, lineHeight: 1.4 }}>
        <strong>{n.actor_name || "Someone"}</strong>{" "}{msg}
      </p>
      {n.preview && (
        <p style={{ fontFamily: C.sans, fontSize: 11, color: C.muted, margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          "{n.preview}"
        </p>
      )}
      <span style={{ fontFamily: C.sans, fontSize: 10, color: C.muted + "aa", marginTop: 3, display: "block" }}>{timeAgo(n.created_at)}</span>
    </div>
  );
}

/* ── The Panel (rendered via portal to escape any overflow clipping) ──── */
function NotifPanel({ notifications, unread, onClose, onClickNotif, onViewAll, btnRect }) {
  var panelRef = useRef(null);

  // Calculate position: appear below the bell button, smart left/right
  var panelWidth = Math.min(380, window.innerWidth - 24);
  var top = btnRect.bottom + 10;
  var left = btnRect.left;

  // If panel would overflow right edge, shift left
  if (left + panelWidth > window.innerWidth - 12) {
    left = window.innerWidth - panelWidth - 12;
  }
  // If panel would overflow left edge, shift right
  if (left < 12) left = 12;

  // Close on click outside
  useEffect(function () {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    // Small delay so the toggle click doesn't immediately close
    var t = setTimeout(function () { document.addEventListener("mousedown", handler); }, 50);
    return function () { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, []);

  var panel = (
    <div ref={panelRef} style={{
      position: "fixed", top: top, left: left, zIndex: 9999,
      width: panelWidth, maxHeight: Math.min(460, window.innerHeight - top - 20),
      background: "#fff", borderRadius: 16,
      border: "1px solid " + C.border, boxShadow: "0 12px 48px rgba(11,37,69,0.22)",
      display: "flex", flexDirection: "column",
      animation: "cvNotifFadeIn 0.15s ease", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 15, color: C.navy }}>Notifications</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {unread.length > 0 && (
            <span style={{ fontFamily: C.sans, fontSize: 11, color: C.gold, fontWeight: 600 }}>{unread.length} new</span>
          )}
          <button onClick={onClose} style={{
            width: 24, height: 24, borderRadius: 6, background: "none", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: C.muted, fontSize: 16, transition: "color 0.15s",
          }}
            onMouseEnter={function (e) { e.currentTarget.style.color = C.navy; }}
            onMouseLeave={function (e) { e.currentTarget.style.color = C.muted; }}
          >✕</button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "44px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <p style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 600, color: C.navy, margin: "0 0 4px" }}>All caught up!</p>
            <p style={{ fontFamily: C.sans, fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>When someone replies, reacts, or follows you, you'll see it here.</p>
          </div>
        ) : notifications.map(function (n, i) {
          return (
            <button key={n.id || i} onClick={function () { onClickNotif(n); }} style={{
              width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
              padding: "11px 16px", background: n.read ? "transparent" : C.gold + "08",
              border: "none", borderBottom: "1px solid " + C.border,
              cursor: "pointer", textAlign: "left", transition: "background 0.15s",
            }}
              onMouseEnter={function (e) { e.currentTarget.style.background = C.cream; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = n.read ? "transparent" : C.gold + "08"; }}
            >
              <NotifIcon type={n.type} emoji={n.emoji} />
              <NotifMessage n={n} />
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, flexShrink: 0, marginTop: 6 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding: "10px 16px", borderTop: "1px solid " + C.border, flexShrink: 0 }}>
          <button onClick={onViewAll} style={{
            width: "100%", padding: "9px", borderRadius: 10, border: "none",
            background: C.navy + "08", cursor: "pointer",
            fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.navy,
            transition: "all 0.15s",
          }}
            onMouseEnter={function (e) { e.currentTarget.style.background = C.navy + "12"; }}
            onMouseLeave={function (e) { e.currentTarget.style.background = C.navy + "08"; }}
          >
            View all in Community →
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}

/* ── Main Bell Component ─────────────────────────────────────────────── */
export default function NotificationBell({ notifications, unreadCount, markAllRead, theme }) {
  theme = theme || "dark";

  var [open, setOpen] = useState(false);
  var [btnRect, setBtnRect] = useState(null);
  var btnRef = useRef(null);
  var navigate = useNavigate();
  var location = useLocation();

  // Close on route change
  useEffect(function () { setOpen(false); }, [location.pathname]);

  function toggle() {
    if (!open && btnRef.current) {
      setBtnRect(btnRef.current.getBoundingClientRect());
      markAllRead();
    }
    setOpen(function (prev) { return !prev; });
  }

  function handleClose() { setOpen(false); }

  function handleClick(n) {
    markAllRead();
    setOpen(false);
    if (n.post_id) {
      var isCommunity = location.pathname.includes("/community");
      if (!isCommunity) {
        navigate("/citizen/community", { state: { scrollToPost: n.post_id } });
      } else {
        setTimeout(function () {
          var el = document.getElementById("post-" + n.post_id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.style.transition = "box-shadow 0.3s, border-color 0.3s";
            el.style.boxShadow = "0 0 0 3px " + C.gold + "44";
            el.style.borderColor = C.gold;
            setTimeout(function () { el.style.boxShadow = ""; el.style.borderColor = ""; }, 2000);
          }
        }, 200);
      }
    } else if (n.type === "follow") {
      navigate("/citizen/community");
    }
  }

  function handleViewAll() { setOpen(false); navigate("/citizen/community"); }

  var unread = notifications.filter(function (n) { return !n.read; });

  // Theme styles
  var isDark = theme === "dark";
  var btnBg = open
    ? (isDark ? "rgba(255,255,255,0.15)" : C.gold + "12")
    : (isDark ? "rgba(255,255,255,0.08)" : "#fff");
  var btnBorder = open
    ? C.gold + "44"
    : (isDark ? "rgba(255,255,255,0.1)" : C.border);
  var btnColor = open ? C.gold : (isDark ? "rgba(255,255,255,0.7)" : C.navy);
  var badgeBorder = isDark ? C.navy : "#fff";
  var hoverBg = isDark ? "rgba(255,255,255,0.12)" : C.cream;
  var hoverColor = isDark ? "#fff" : C.navy;
  var defaultBg = isDark ? "rgba(255,255,255,0.08)" : "#fff";
  var defaultColor = isDark ? "rgba(255,255,255,0.7)" : C.navy;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <style>{"\
        @keyframes cvBellShake { 0%,100%{transform:rotate(0)} 15%{transform:rotate(12deg)} 30%{transform:rotate(-10deg)} 45%{transform:rotate(6deg)} 60%{transform:rotate(-4deg)} 75%{transform:rotate(2deg)} }\
        @keyframes cvNotifFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }\
      "}</style>

      <button ref={btnRef} onClick={toggle} style={{
        width: 40, height: 40, borderRadius: 12, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: btnBg, border: "1px solid " + btnBorder, color: btnColor,
        position: "relative", transition: "all 0.2s",
      }}
        onMouseEnter={function (e) { if (!open) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverColor; } }}
        onMouseLeave={function (e) { if (!open) { e.currentTarget.style.background = defaultBg; e.currentTarget.style.color = defaultColor; } }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ display: "block", animation: unreadCount > 0 ? "cvBellShake 0.6s ease" : "none" }}>
          <path d={bellPath} />
        </svg>

        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: "#e53e3e", color: "#fff",
            fontFamily: C.sans, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", border: "2px solid " + badgeBorder,
            animation: "cvNotifFadeIn 0.2s ease",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && btnRect && (
        <NotifPanel
          notifications={notifications}
          unread={unread}
          onClose={handleClose}
          onClickNotif={handleClick}
          onViewAll={handleViewAll}
          btnRect={btnRect}
        />
      )}
    </div>
  );
}

