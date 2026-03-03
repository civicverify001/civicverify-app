import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/useAuth";

const T = {
  navy:    "#0B2545",
  navyMid: "#122e56",
  gold:    "#C5960C",
  cream:   "#F5F1EC",
  ink:     "#1a2942",
  muted:   "#64748b",
  border:  "rgba(11,37,69,0.08)",
  serif:   "'Libre Baskerville', Georgia, serif",
  sans:    "'DM Sans', system-ui, sans-serif",
};

const Ico = ({ d, size = 16, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  heart:    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  chat:     "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  send:     "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  shield:   "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  hash:     "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  trending: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  users:    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  back:     "M15 18l-6-6 6-6",
  image:    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  x:        "M6 18L18 6M6 6l12 12",
  smile:    "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  poll:     "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  bookmark: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
  userPlus: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m13 8l4-4m0 0l4 4m-4-4v12M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  mail:     "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  at:       "M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9",
  plus:     "M12 4v16m8-8H4",
  trash:    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
};

const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡"],
  "Gestures": ["👍","👎","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👋","🤚","🖐","✋","🖖","🤜","🤛","✊","👊","🙌","👏","🤲","🙏","✍️","💪","🦾"],
  "Nature": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜"],
  "Symbols": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☯️","🕊️","🌈","⭐","🌟","💫","✨","🎉","🎊","🏆"],
};

const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "👏", "🤔"];

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
};

const initials = (name) =>
  (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 38, verified = false, onClick, url }) => (
  <div style={{ position: "relative", width: size, height: size, flexShrink: 0, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
    {url ? (
      <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid " + T.gold + "33" }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)", border: "2px solid " + T.gold + "33", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.serif, fontWeight: 700, fontSize: size * 0.33, color: T.gold }}>
        {initials(name)}
      </div>
    )}
    {verified && (
      <div style={{ position: "absolute", bottom: -1, right: -1, width: size * 0.38, height: size * 0.38, borderRadius: "50%", background: T.navy, border: "1.5px solid " + T.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.shield} size={size * 0.2} />
      </div>
    )}
  </div>
);

const VerifiedBadge = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, background: T.gold + "18", border: "1px solid " + T.gold + "44", fontSize: 10, fontWeight: 700, color: T.gold, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: "0.05em" }}>
    <Ico d={ICONS.shield} size={9} />
    Verified
  </span>
);

// ── @Mention Autocomplete ─────────────────────────────────────────────────────
const MentionAutocomplete = ({ query, onSelect }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc("search_users_by_name", { search_query: query, lim: 6 });
      setResults(data || []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!query || (results.length === 0 && !loading)) return null;

  return (
    <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, background: "#fff", borderRadius: 12, border: "1px solid " + T.border, boxShadow: "0 -4px 20px rgba(11,37,69,0.12)", zIndex: 100, maxHeight: 220, overflowY: "auto", marginBottom: 4 }}>
      {loading ? (
        <div style={{ padding: "12px 16px", fontSize: 12, color: T.muted }}>Searching...</div>
      ) : results.map((u) => (
        <button key={u.id} onClick={() => onSelect(u)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, textAlign: "left", borderBottom: "1px solid " + T.border }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.cream; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          <Avatar name={u.full_name} size={28} verified={u.identity_verified} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{u.full_name}</div>
            {u.identity_verified && <span style={{ fontSize: 10, color: T.gold }}>✓ Verified</span>}
          </div>
        </button>
      ))}
    </div>
  );
};

// ── Emoji Picker ──────────────────────────────────────────────────────────────
const EmojiPicker = ({ onSelect, onClose, anchorRef }) => {
  const [cat, setCat] = useState("Smileys");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (pickerRef.current && anchorRef?.current) {
      const anchor = anchorRef.current.getBoundingClientRect();
      const pw = 300, ph = 290;
      let left = anchor.left;
      let top = anchor.top - ph - 8;
      if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
      if (left < 12) left = 12;
      if (top < 12) top = anchor.bottom + 8;
      pickerRef.current.style.top = top + "px";
      pickerRef.current.style.left = left + "px";
      pickerRef.current.style.visibility = "visible";
    }
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) && anchorRef?.current && !anchorRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, []);

  const picker = (
    <div ref={pickerRef} style={{ position: "fixed", top: -9999, left: -9999, visibility: "hidden", width: 300, background: "#fff", borderRadius: 16, border: "1px solid " + T.border, boxShadow: "0 8px 32px rgba(11,37,69,0.18)", zIndex: 9999, overflow: "hidden" }}>
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid " + T.border, padding: "8px 8px 0" }}>
        {Object.keys(EMOJI_CATEGORIES).map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{ flexShrink: 0, padding: "4px 10px 8px", background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: cat === c ? T.navy : T.muted, borderBottom: cat === c ? "2px solid " + T.gold : "2px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap" }}>{c}</button>
        ))}
      </div>
      <div style={{ padding: 10, maxHeight: 200, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 2 }}>
        {EMOJI_CATEGORIES[cat].map((e) => (
          <button key={e} onClick={() => onSelect(e)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}
            onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; }}
            onMouseLeave={(el) => { el.currentTarget.style.background = "none"; }}
          >{e}</button>
        ))}
      </div>
    </div>
  );
  return createPortal(picker, document.body);
};

// ── Reaction Bar ──────────────────────────────────────────────────────────────
const ReactionBar = ({ reactions, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const grouped = (reactions || []).reduce((a, r) => { a[r.emoji] = (a[r.emoji] || 0) + 1; return a; }, {});
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {Object.entries(grouped).map(([emoji, count]) => (
        <button key={emoji} onClick={() => onReact(emoji)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, border: "1px solid " + T.border, background: T.cream, cursor: "pointer", fontSize: 14, fontFamily: T.sans, fontWeight: 600, color: T.navy, transition: "all 0.15s" }}>
          {emoji} <span style={{ fontSize: 11 }}>{count}</span>
        </button>
      ))}
      <button onClick={() => setShowPicker(!showPicker)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px dashed " + T.border, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>+</button>
      {showPicker && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 50, background: "#fff", borderRadius: 12, padding: 8, border: "1px solid " + T.border, boxShadow: "0 4px 20px rgba(11,37,69,0.12)", display: "flex", gap: 4 }}>
          {REACTION_EMOJIS.map((e) => (
            <button key={e} onClick={() => { onReact(e); setShowPicker(false); }} style={{ width: 36, height: 36, fontSize: 20, background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}
              onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; }}
              onMouseLeave={(el) => { el.currentTarget.style.background = "none"; }}
            >{e}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Search Bar ────────────────────────────────────────────────────────────────
const SearchBar = ({ navigate }) => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("posts");
  const [results, setResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setUserResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      if (mode === "posts") {
        const { data } = await supabase.rpc("search_community_posts", { search_query: query, lim: 10 });
        setResults(data || []);
      } else {
        const { data } = await supabase.rpc("search_users_by_name", { search_query: query, lim: 10 });
        setUserResults(data || []);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, mode]);

  return (
    <div ref={wrapRef} style={{ position: "relative", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 16, border: focused ? "2px solid " + T.gold + "66" : "1px solid " + T.border, padding: focused ? "11px 15px" : "12px 16px", transition: "all 0.2s", boxShadow: focused ? "0 4px 20px rgba(197,150,12,0.1)" : "0 1px 6px rgba(11,37,69,0.05)" }}>
        <Ico d={ICONS.search} size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} placeholder="Search posts or find people..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: T.sans, fontSize: 14, color: T.ink }} />
        {query && <button onClick={() => { setQuery(""); setResults([]); setUserResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 0 }}><Ico d={ICONS.x} size={14} /></button>}
        <div style={{ display: "flex", gap: 2, padding: 2, background: T.navy + "06", borderRadius: 8 }}>
          {["posts", "people"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 11, fontWeight: 600, background: mode === m ? "#fff" : "transparent", color: mode === m ? T.navy : T.muted, boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>{m === "posts" ? "Posts" : "People"}</button>
          ))}
        </div>
      </div>
      {focused && query.trim() && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", borderRadius: 14, border: "1px solid " + T.border, boxShadow: "0 8px 32px rgba(11,37,69,0.12)", zIndex: 90, maxHeight: 320, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: T.muted }}>Searching...</div>
          ) : mode === "posts" ? (
            results.length === 0 ? <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: T.muted }}>No posts found</div>
            : results.map((p) => (
              <div key={p.id} onClick={() => { setFocused(false); setQuery(""); }} style={{ padding: "12px 16px", borderBottom: "1px solid " + T.border, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <p style={{ fontSize: 13, color: T.ink, margin: 0, lineHeight: 1.5 }}>{p.content?.slice(0, 120)}{p.content?.length > 120 ? "..." : ""}</p>
                <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(p.created_at)}</span>
              </div>
            ))
          ) : (
            userResults.length === 0 ? <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: T.muted }}>No people found</div>
            : userResults.map((u) => (
              <div key={u.id} onClick={() => { navigate("/citizen/profile/" + u.id); setFocused(false); setQuery(""); }} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid " + T.border, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <Avatar name={u.full_name} size={32} verified={u.identity_verified} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{u.full_name}</div>
                  {u.identity_verified && <span style={{ fontSize: 10, color: T.gold }}>✓ Verified Citizen</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Follow Button ─────────────────────────────────────────────────────────────
const FollowButton = ({ targetUserId, currentUserId, followingSet, onToggle }) => {
  const [busy, setBusy] = useState(false);
  const isFollowing = followingSet.has(targetUserId);
  if (targetUserId === currentUserId) return null;
  const toggle = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    if (isFollowing) {
      await supabase.from("user_follows").delete().eq("follower_id", currentUserId).eq("following_id", targetUserId);
      onToggle(targetUserId, false);
    } else {
      await supabase.from("user_follows").upsert({ follower_id: currentUserId, following_id: targetUserId }, { onConflict: "follower_id,following_id" });
      onToggle(targetUserId, true);
    }
    setBusy(false);
  };
  return (
    <button onClick={toggle} disabled={busy} style={{ padding: "3px 10px", borderRadius: 14, fontSize: 11, fontWeight: 700, fontFamily: T.sans, cursor: "pointer", transition: "all 0.15s", background: isFollowing ? "transparent" : T.navy, color: isFollowing ? T.muted : T.gold, border: isFollowing ? "1px solid " + T.border : "1px solid " + T.navy }}>
      {busy ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
};

// ── Bookmark Button ───────────────────────────────────────────────────────────
const BookmarkBtn = ({ postId, isBookmarked, onToggle }) => {
  const [busy, setBusy] = useState(false);
  return (
    <button onClick={async (e) => { e.stopPropagation(); if (busy) return; setBusy(true); await onToggle(postId, !isBookmarked); setBusy(false); }} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: isBookmarked ? T.gold + "15" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isBookmarked ? T.gold : T.muted, transition: "all 0.15s" }}>
      <Ico d={ICONS.bookmark} size={14} fill={isBookmarked ? T.gold : "none"} />
    </button>
  );
};

// ── Post Composer ─────────────────────────────────────────────────────────────
const Composer = ({ user, onPost, navigate }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionMap, setMentionMap] = useState({});
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const MAX = 280;

  const handleTextChange = (e) => {
    const val = e.target.value.slice(0, MAX);
    setText(val);
    const cursor = e.target.selectionStart;
    const beforeCursor = val.slice(0, cursor);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    setMentionQuery(atMatch ? atMatch[1] : null);
  };

  const insertMention = (u) => {
    const cursor = textRef.current?.selectionStart || text.length;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const atIdx = before.lastIndexOf("@");
    const newText = before.slice(0, atIdx) + "@" + u.full_name + " " + after;
    setText(newText.slice(0, MAX));
    setMentionQuery(null);
    setMentionMap((prev) => ({ ...prev, [u.full_name]: u.id }));
    setTimeout(() => textRef.current?.focus(), 0);
  };

  const insertEmoji = (emoji) => {
    const el = textRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart;
    const next = text.slice(0, start) + emoji + text.slice(el.selectionEnd);
    setText(next.slice(0, MAX));
    setShowEmoji(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const pickImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const post = async () => {
    if ((!text.trim() && !imageFile) || busy) return;
    setBusy(true);
    let imageUrl = null;
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split(".").pop();
      const path = "community/" + Date.now() + "." + ext;
      const { error: upErr } = await supabase.storage.from("community-images").upload(path, imageFile, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(path);
        imageUrl = urlData?.publicUrl;
      }
      setUploading(false);
    }
    await onPost(text.trim(), imageUrl, Object.values(mentionMap), mentionMap);
    setText(""); setImageFile(null); setImagePreview(null); setMentionMap({});
    setBusy(false);
  };

  const left = MAX - text.length;
  const hasContent = text.trim() || imageFile;

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, boxShadow: "0 2px 16px rgba(11,37,69,0.08)", overflow: "visible" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, " + T.navy + " 0%, " + T.gold + " 100%)", borderRadius: "20px 20px 0 0" }} />
      <div style={{ padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar name={user?.full_name} size={42} verified={user?.identity_verified} url={user?.avatar_url} onClick={() => navigate("/citizen/profile/" + user?.id)} />
          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <textarea ref={textRef} value={text} onChange={handleTextChange} placeholder="What's on your civic mind? Use @name to mention someone..." rows={3} style={{ width: "100%", resize: "none", border: "none", outline: "none", fontFamily: T.sans, fontSize: 15, lineHeight: 1.6, color: T.ink, background: "transparent", boxSizing: "border-box" }} />
            {mentionQuery !== null && <MentionAutocomplete query={mentionQuery} onSelect={insertMention} />}
            {imagePreview && (
              <div style={{ position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden", display: "inline-block" }}>
                <img src={imagePreview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 12, display: "block" }} />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Ico d={ICONS.x} size={12} />
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid " + T.border }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => fileRef.current?.click()} style={{ width: 34, height: 34, borderRadius: 10, background: "none", border: "1px solid " + T.border, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}><Ico d={ICONS.image} size={16} /></button>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
                <div style={{ position: "relative" }}>
                  <button ref={emojiButtonRef} onClick={() => setShowEmoji(!showEmoji)} style={{ width: 34, height: 34, borderRadius: 10, background: showEmoji ? T.cream : "none", border: "1px solid " + (showEmoji ? T.gold + "44" : T.border), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>😊</button>
                  {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} anchorRef={emojiButtonRef} />}
                </div>
                {["❤️","👍","🔥","🎉"].map((e) => (
                  <button key={e} onClick={() => insertEmoji(e)} style={{ width: 30, height: 30, fontSize: 16, background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}
                    onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; }}
                    onMouseLeave={(el) => { el.currentTarget.style.background = "none"; }}
                  >{e}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: T.sans, fontWeight: 500, color: left < 40 ? "#e53e3e" : T.muted }}>{left}</span>
                <button onClick={post} disabled={!hasContent || busy} style={{ padding: "8px 20px", borderRadius: 20, border: "none", background: hasContent ? "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)" : "#f1f5f9", color: hasContent ? T.gold : T.muted, fontFamily: T.sans, fontSize: 13, fontWeight: 700, cursor: hasContent ? "pointer" : "default", transition: "all 0.2s" }}>
                  {uploading ? "Uploading..." : busy ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Poll Composer ─────────────────────────────────────────────────────────────
const PollComposer = ({ user, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => { if (options.length < 6) setOptions((o) => [...o, ""]); };
  const removeOption = (i) => { if (options.length > 2) setOptions((o) => o.filter((_, idx) => idx !== i)); };
  const updateOption = (i, val) => setOptions((o) => o.map((v, idx) => idx === i ? val : v));

  const submit = async () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) { setError("Question is required"); return; }
    if (opts.length < 2) { setError("Add at least 2 options"); return; }
    // Content filter
    var blocked = ["fuck","shit","ass","bitch","damn","dick","porn","sex","nazi","kill","hate","nigger","faggot","slut","whore","cunt","retard"];
    var allText = (q + " " + opts.join(" ")).toLowerCase();
    var found = blocked.find(function(w) { return allText.includes(w); });
    if (found) { setError("Your poll contains inappropriate language. Please revise."); return; }
    setBusy(true);
    await onCreate(q, opts);
    setQuestion(""); setOptions(["", ""]); setError(""); setOpen(false);
    setBusy(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: "100%", padding: "14px 20px", background: "#fff", borderRadius: 20, border: "1px dashed " + T.gold + "66", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.navy, transition: "all 0.2s", boxShadow: "0 1px 6px rgba(11,37,69,0.04)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.cream; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.gold + "66"; e.currentTarget.style.background = "#fff"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: T.gold + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico d={ICONS.poll} size={18} />
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 700, color: T.navy }}>Create a Poll</div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 400 }}>Ask your community a quick question</div>
      </div>
    </button>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.gold + "44", boxShadow: "0 4px 24px rgba(197,150,12,0.1)", overflow: "hidden" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, " + T.gold + " 0%, " + T.navy + " 100%)" }} />
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={user?.full_name} size={36} verified={user?.identity_verified} url={user?.avatar_url} />
            <div>
              <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 13, color: T.navy }}>New Poll</div>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>Ask the community</div>
            </div>
          </div>
          <button onClick={() => { setOpen(false); setError(""); }} style={{ width: 28, height: 28, borderRadius: 8, background: T.navy + "08", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
            <Ico d={ICONS.x} size={14} />
          </button>
        </div>

        <textarea value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 200))} placeholder="Ask a civic question... e.g. Should our city invest more in public transit?" rows={2} style={{ width: "100%", resize: "none", border: "none", outline: "none", background: T.cream, borderRadius: 12, padding: "12px 14px", fontFamily: T.sans, fontSize: 15, color: T.ink, lineHeight: 1.6, boxSizing: "border-box", marginBottom: 14 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {options.map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid " + T.border, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 700, color: T.muted }}>{i + 1}</span>
              </div>
              <input value={opt} onChange={(e) => updateOption(i, e.target.value.slice(0, 80))} placeholder={"Option " + (i + 1)} style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid " + T.border, background: "#fff", fontFamily: T.sans, fontSize: 13, color: T.ink, outline: "none" }}
                onFocus={(e) => { e.target.style.borderColor = T.gold + "88"; }}
                onBlur={(e) => { e.target.style.borderColor = T.border; }}
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fee2e2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e53e3e" }}>
                  <Ico d={ICONS.x} size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {options.length < 6 && (
          <button onClick={addOption} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px dashed " + T.border, background: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 14 }}>
            <Ico d={ICONS.plus} size={13} /> Add option
          </button>
        )}

        {error && <p style={{ fontSize: 12, color: "#e53e3e", margin: "0 0 12px", fontFamily: T.sans }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => { setOpen(false); setError(""); }} style={{ padding: "9px 20px", borderRadius: 12, border: "1px solid " + T.border, background: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.muted }}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{ padding: "9px 24px", borderRadius: 12, border: "none", background: question.trim() ? T.navy : "#f1f5f9", color: question.trim() ? T.gold : T.muted, cursor: question.trim() ? "pointer" : "default", fontFamily: T.sans, fontSize: 13, fontWeight: 700 }}>
            {busy ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Poll Card ─────────────────────────────────────────────────────────────────
const PollCard = ({ poll, currentUserId, onVote, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const myVote = poll.my_vote_index;
  const hasVoted = myVote !== null && myVote !== undefined;
  const totalVotes = (poll.vote_counts || []).reduce((a, b) => a + b, 0);

  const vote = async (i) => {
    if (hasVoted) return;
    await onVote(poll.id, i);
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: "#fff", borderRadius: 20, border: "1px solid " + (hovered ? T.gold + "33" : T.border), boxShadow: hovered ? "0 6px 24px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)", transition: "all 0.2s", overflow: "hidden" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, " + T.gold + "44, " + T.navy + "44)" }} />
      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <Avatar name={poll.author_name} size={40} verified={poll.author_verified} url={poll.author_avatar} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.navy }}>{poll.author_name || "Citizen"}</span>
          {poll.author_verified && <VerifiedBadge />}
              <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted, marginLeft: "auto" }}>{timeAgo(poll.created_at)}</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, background: T.gold + "12", border: "1px solid " + T.gold + "33" }}>
              <Ico d={ICONS.poll} size={9} />
              <span style={{ fontFamily: T.sans, fontSize: 10, fontWeight: 700, color: T.gold }}>POLL</span>
            </div>
          </div>
          {currentUserId === poll.user_id && (
            <button onClick={() => onDelete(poll.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#e53e3e"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.muted; }}
            >
              <Ico d={ICONS.trash} size={14} />
            </button>
          )}
        </div>

        {/* Question */}
        <p style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 700, color: T.navy, margin: "0 0 14px", lineHeight: 1.45 }}>{poll.question}</p>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(poll.options || []).map((opt, i) => {
            const count = poll.vote_counts?.[i] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyVote = hasVoted && myVote === i;

            return (
              <button key={i} onClick={() => vote(i)} disabled={hasVoted} style={{ position: "relative", width: "100%", padding: "11px 14px", borderRadius: 12, border: "2px solid " + (isMyVote ? T.gold : hasVoted ? T.border : T.border), background: "none", cursor: hasVoted ? "default" : "pointer", textAlign: "left", overflow: "hidden", transition: "all 0.2s" }}
                onMouseEnter={(e) => { if (!hasVoted) { e.currentTarget.style.borderColor = T.gold + "66"; e.currentTarget.style.background = T.gold + "06"; } }}
                onMouseLeave={(e) => { if (!hasVoted) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "none"; } }}
              >
                {/* Progress bar fill */}
                {hasVoted && (
                  <div style={{ position: "absolute", inset: 0, width: pct + "%", background: isMyVote ? T.gold + "18" : T.navy + "06", transition: "width 0.6s ease", borderRadius: 10 }} />
                )}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (isMyVote ? T.gold : T.border), background: isMyVote ? T.gold : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isMyVote && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: isMyVote ? 700 : 400, color: isMyVote ? T.navy : T.ink }}>{opt}</span>
                  </div>
                  {hasVoted && (
                    <span style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: isMyVote ? T.gold : T.muted, flexShrink: 0 }}>{pct}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: T.muted }}>{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          {!hasVoted && <span style={{ fontFamily: T.sans, fontSize: 12, color: T.gold, fontWeight: 600 }}>• Tap to vote</span>}
          {hasVoted && <span style={{ fontFamily: T.sans, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>• Voted ✓</span>}
        </div>
      </div>
    </div>
  );
};

// ── Comment Row ───────────────────────────────────────────────────────────────
const CommentRow = ({ c, navigate }) => (
  <div style={{ display: "flex", gap: 10, paddingLeft: 4 }}>
    <Avatar name={c.users?.full_name || "?"} size={28} verified={c.users?.identity_verified} onClick={() => c.user_id && navigate("/citizen/profile/" + c.user_id)} />
    <div style={{ flex: 1, minWidth: 0, paddingBottom: 10 }}>
      <div style={{ background: T.cream, borderRadius: "12px 12px 12px 3px", padding: "7px 12px", border: "1px solid " + T.border, display: "inline-block", maxWidth: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <span onClick={() => c.user_id && navigate("/citizen/profile/" + c.user_id)} style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 12, color: T.navy, cursor: "pointer" }}>{c.users?.full_name || "Citizen"}</span>
          {c.users?.username && <span style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>@{c.users.username}</span>}
          {c.users?.identity_verified && <span style={{ fontSize: 9, fontWeight: 700, color: T.gold }}>✓</span>}
          <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted, marginLeft: 2 }}>· {timeAgo(c.created_at)}</span>
        </div>
        {c.content && <p style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, margin: 0, lineHeight: 1.5 }}>{c.content}</p>}
        {c.image_url && <img src={c.image_url} alt="reply" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, marginTop: c.content ? 6 : 0, display: "block" }} />}
      </div>
    </div>
  </div>
);

// ── Comments List ─────────────────────────────────────────────────────────────
const CommentsList = ({ comments, navigate }) => {
  const [expanded, setExpanded] = useState(false);
  const SHOW = 3;
  const hiddenCount = Math.max(0, comments.length - SHOW);
  const latest = comments.slice(-SHOW);
  const older = comments.slice(0, -SHOW);
  if (comments.length === 0) return null;
  return (
    <div style={{ borderLeft: "2px solid " + T.gold + "33", marginLeft: 14, paddingLeft: 8, marginBottom: 4 }}>
      {hiddenCount > 0 && (
        <>
          <button onClick={() => setExpanded((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0 8px", background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.navy + "99" }}>
            <span style={{ fontSize: 13, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
            {expanded ? "Hide older replies" : "View " + hiddenCount + " more " + (hiddenCount === 1 ? "reply" : "replies")}
          </button>
          <div style={{ overflow: "hidden", maxHeight: expanded ? older.length * 120 + "px" : "0px", transition: "max-height 0.35s ease" }}>
            {older.map((c) => <CommentRow key={c.id} c={c} navigate={navigate} />)}
          </div>
        </>
      )}
      {latest.map((c) => <CommentRow key={c.id} c={c} navigate={navigate} />)}
    </div>
  );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onLike, onComment, onReact, currentUserId, followingSet, onFollowToggle, bookmarkSet, onBookmarkToggle, navigate }) => {
  const [liked, setLiked] = useState(post.my_vote === "like");
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [disliked, setDisliked] = useState(post.my_vote === "dislike");
  const [dislikes, setDislikes] = useState(post.dislikes_count || 0);
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState("");
  const [showEmojiReply, setShowEmojiReply] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionMap, setMentionMap] = useState({});
  const replyRef = useRef(null);
  const replyFileRef = useRef(null);
  const replyEmojiRef = useRef(null);
  const authorUserId = post.user_id || post.users?.id;
  const isBookmarked = bookmarkSet.has(post.id);

  const toggleLike = async () => {
    const next = !liked;
    if (disliked) { setDisliked(false); setDislikes((d) => d - 1); }
    setLiked(next); setLikes((l) => l + (next ? 1 : -1));
    await onLike(post.id, "like", next, disliked);
  };

  const toggleDislike = async () => {
    const next = !disliked;
    if (liked) { setLiked(false); setLikes((l) => l - 1); }
    setDisliked(next); setDislikes((d) => d + (next ? 1 : -1));
    await onLike(post.id, "dislike", next, liked);
  };

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase.from("community_post_comments").select("id, content, created_at, image_url, user_id, users:user_id(full_name, identity_verified, username)").eq("post_id", post.id).order("created_at", { ascending: true });
    setComments(data || []);
    setLoadingComments(false);
  };

  const toggleReplies = () => {
    const next = !showReply;
    setShowReply(next);
    if (next && comments.length === 0) loadComments();
  };

  const handleReplyChange = (e) => {
    const val = e.target.value;
    setReply(val);
    const before = val.slice(0, e.target.selectionStart);
    const atMatch = before.match(/@(\w*)$/);
    setMentionQuery(atMatch ? atMatch[1] : null);
  };

  const insertReplyMention = (u) => {
    const cursor = replyRef.current?.selectionStart || reply.length;
    const before = reply.slice(0, cursor);
    const after = reply.slice(cursor);
    const atIdx = before.lastIndexOf("@");
    setReply(before.slice(0, atIdx) + "@" + u.full_name + " " + after);
    setMentionQuery(null);
    setMentionMap((prev) => ({ ...prev, [u.full_name]: u.id }));
    setTimeout(() => replyRef.current?.focus(), 0);
  };

  const submitReply = async () => {
    if (!reply.trim() && !replyImageFile) return;
    let imageUrl = null;
    if (replyImageFile) {
      const ext = replyImageFile.name.split(".").pop();
      const path = "community/" + Date.now() + "-reply." + ext;
      const { error: upErr } = await supabase.storage.from("community-images").upload(path, replyImageFile, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(path);
        imageUrl = urlData?.publicUrl;
      }
    }
    const saved = await onComment(post.id, reply.trim(), imageUrl);
    const newComment = saved || { id: Date.now(), content: reply.trim(), image_url: imageUrl, created_at: new Date().toISOString(), users: { full_name: post._currentUserName, identity_verified: post._currentUserVerified } };
    setComments((prev) => [...prev, newComment]);
    setCommentCount((c) => c + 1);
    setReply(""); setReplyImageFile(null); setReplyImagePreview(null); setMentionMap({});
  };

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: "#fff", borderRadius: 20, border: "1px solid " + (hovered ? T.gold + "33" : T.border), boxShadow: hovered ? "0 6px 24px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)", transform: hovered ? "translateY(-2px)" : "none", transition: "all 0.2s", overflow: "hidden" }}>
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <Avatar name={post.author_name} size={44} verified={post.author_verified} url={post.author_avatar} onClick={() => authorUserId && navigate("/citizen/profile/" + authorUserId)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
              <span onClick={() => authorUserId && navigate("/citizen/profile/" + authorUserId)} style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 15, color: T.navy, cursor: "pointer" }}>{post.author_name || "Anonymous Citizen"}</span>
              {post.author_username && <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>@{post.author_username}</span>}
              {post.author_verified && <VerifiedBadge />}
              {currentUserId && authorUserId && <FollowButton targetUserId={authorUserId} currentUserId={currentUserId} followingSet={followingSet} onToggle={onFollowToggle} />}
              {post.survey_tag && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, background: T.navy + "08", border: "1px solid " + T.border, fontSize: 10, color: T.muted, fontFamily: T.sans }}><Ico d={ICONS.hash} size={8} /> {post.survey_tag}</span>}
            </div>
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>{timeAgo(post.created_at)}</span>
          </div>
          <BookmarkBtn postId={post.id} isBookmarked={isBookmarked} onToggle={onBookmarkToggle} />
        </div>
        {post.content && <p style={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.65, color: T.ink, margin: "0 0 12px" }}>{post.content}</p>}
        {post.image_url && <div style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden" }}><img src={post.image_url} alt="post" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} /></div>}
        {(post.reactions && post.reactions.length > 0) && <div style={{ marginBottom: 10 }}><ReactionBar reactions={post.reactions} onReact={(emoji) => onReact(post.id, emoji)} /></div>}
        <div style={{ paddingTop: 10, borderTop: "1px solid " + T.border }}>
          {(likes > 0 || commentCount > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid " + T.border }}>
              {likes > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: T.muted }}><span style={{ fontSize: 14 }}>❤️</span> <strong style={{ color: T.ink }}>{likes}</strong> {likes === 1 ? "like" : "likes"}</span>}
              {commentCount > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: T.muted }}><span style={{ fontSize: 14 }}>💬</span> <strong style={{ color: T.ink }}>{commentCount}</strong> {commentCount === 1 ? "reply" : "replies"}</span>}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={toggleLike} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: liked ? "#fee2e2" : "none", border: "1px solid " + (liked ? "#fca5a5" : T.border), cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: liked ? "#e53e3e" : T.muted, transition: "all 0.15s" }}>
              <span style={{ fontSize: 15 }}>👍</span><span>{likes > 0 ? likes : ""}</span>
            </button>
            <button onClick={toggleDislike} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: disliked ? "#fef3c7" : "none", border: "1px solid " + (disliked ? "#fcd34d" : T.border), cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: disliked ? "#d97706" : T.muted, transition: "all 0.15s" }}>
              <span style={{ fontSize: 15 }}>👎</span><span>{dislikes > 0 ? dislikes : ""}</span>
            </button>
            <button onClick={toggleReplies} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: showReply ? T.navy + "08" : "none", border: "1px solid " + (showReply ? T.navy + "22" : T.border), cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: showReply ? T.navy : T.muted, transition: "all 0.15s" }}>
              <Ico d={ICONS.chat} size={14} />{commentCount > 0 ? commentCount : "Reply"}
            </button>
            <button onClick={function() { var url = window.location.origin + '/citizen/community?post=' + post.id; if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { navigator.share({ title: 'CivicVerify Post', url: url }); } else { navigator.clipboard.writeText(url); alert('Link copied!'); } }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 20, background: "rgba(197,150,12,0.08)", border: "1px solid rgba(197,150,12,0.25)", cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: "#C5960C", transition: "all 0.15s" }}>&#x1F517;</button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
              {["❤️","🔥","😂"].map((e) => (
                <button key={e} onClick={() => onReact(post.id, e)} style={{ width: 30, height: 30, fontSize: 15, background: "none", border: "none", cursor: "pointer", borderRadius: 8, transition: "all 0.15s" }}
                  onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; el.currentTarget.style.transform = "scale(1.2)"; }}
                  onMouseLeave={(el) => { el.currentTarget.style.background = "none"; el.currentTarget.style.transform = "none"; }}
                >{e}</button>
              ))}
            </div>
          </div>
        </div>
        {showReply && (
          <div style={{ marginTop: 14 }}>
            {loadingComments ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid " + T.gold, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /></div>
            ) : <CommentsList comments={comments} navigate={navigate} />}
          </div>
        )}
        {showReply && (
          <div style={{ marginTop: 4, background: T.cream, borderRadius: 16, border: "1px solid " + T.border, padding: "12px 14px", position: "relative" }}>
            {mentionQuery !== null && <MentionAutocomplete query={mentionQuery} onSelect={insertReplyMention} />}
            <textarea ref={replyRef} value={reply} onChange={handleReplyChange} onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && submitReply()} placeholder="Write a reply... use @name to mention" rows={2} style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.6, boxSizing: "border-box" }} />
            {replyImagePreview && (
              <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
                <img src={replyImagePreview} alt="preview" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 10, display: "block" }} />
                <button onClick={() => { setReplyImageFile(null); setReplyImagePreview(null); }} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Ico d={ICONS.x} size={10} /></button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid " + T.border }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => replyFileRef.current?.click()} style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", border: "1px solid " + T.border, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}><Ico d={ICONS.image} size={14} /></button>
                <input ref={replyFileRef} type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0]; if (!file) return;
                  setReplyImageFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => setReplyImagePreview(ev.target.result);
                  reader.readAsDataURL(file);
                }} style={{ display: "none" }} />
                {["❤️","👍","🔥","😂"].map((e) => (
                  <button key={e} onClick={() => { setReply((r) => r + e); replyRef.current?.focus(); }} style={{ width: 28, height: 28, fontSize: 14, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>{e}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted }}>Ctrl+Enter</span>
                <button onClick={submitReply} disabled={!reply.trim() && !replyImageFile} style={{ padding: "6px 16px", borderRadius: 20, background: (reply.trim() || replyImageFile) ? T.navy : "#e2e8f0", color: (reply.trim() || replyImageFile) ? T.gold : T.muted, border: "none", cursor: (reply.trim() || replyImageFile) ? "pointer" : "default", fontFamily: T.sans, fontSize: 12, fontWeight: 700 }}>Reply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Room Card ─────────────────────────────────────────────────────────────────
const RoomCard = ({ survey, onEnter }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={() => onEnter(survey)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ width: "100%", textAlign: "left", background: "#fff", borderRadius: 20, border: "1px solid " + (hovered ? T.gold + "44" : T.border), boxShadow: hovered ? "0 6px 24px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)", padding: "18px 20px", cursor: "pointer", transform: hovered ? "translateY(-2px)" : "none", transition: "all 0.2s", display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico d={ICONS.hash} size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 15, color: T.navy, margin: 0, lineHeight: 1.4 }}>{survey.title}</p>
            {survey.message_count > 0 && <span style={{ flexShrink: 0, minWidth: 24, height: 24, borderRadius: 12, background: T.gold, color: "#fff", fontFamily: T.sans, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>{survey.message_count > 99 ? "99+" : survey.message_count}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: T.muted }}><Ico d={ICONS.users} size={11} /> {survey.participant_count || 0} participants</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: "#16a34a", fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulse 2s infinite" }} />Live</span>
          </div>
        </div>
      </div>
    </button>
  );
};

// ── Chat Room ─────────────────────────────────────────────────────────────────
const ChatRoom = ({ survey, currentUser, onBack }) => {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const chatEmojiRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
    const ch = supabase.channel("room-" + survey.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "survey_chat_messages", filter: "survey_id=eq." + survey.id }, (p) => { setMsgs((prev) => [...prev, p.new]); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [survey.id]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("survey_chat_messages").select("id, content, created_at, user_id, users:user_id(full_name, identity_verified, username)").eq("survey_id", survey.id).order("created_at", { ascending: true }).limit(100);
    setMsgs(data || []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
  };

  const send = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    await supabase.from("survey_chat_messages").insert({ survey_id: survey.id, user_id: currentUser.id, content: msg });
  };

  return (
    <>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 12, background: "#fff", flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: T.cream, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.navy }}><Ico d={ICONS.back} size={16} /></button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 15, color: T.navy, margin: 0 }}>{survey.title}</p>
          <span style={{ fontFamily: T.sans, fontSize: 11, color: "#16a34a", fontWeight: 600 }}>● Live</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10, background: T.cream }}>
        {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + T.gold, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /></div>
          : msgs.map((msg) => {
            const isMe = msg.user_id === currentUser?.id;
            const name = msg.users?.full_name || "Citizen";
            return (
              <div key={msg.id} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                {!isMe && <Avatar name={name} size={32} verified={msg.users?.identity_verified} onClick={() => navigate("/citizen/profile/" + msg.user_id)} />}
                <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>
                  {!isMe && <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.navy, paddingLeft: 4, cursor: "pointer" }} onClick={() => navigate("/citizen/profile/" + msg.user_id)}>{name}{msg.users?.username && <span style={{ color: T.muted, fontWeight: 500, marginLeft: 4 }}>@{msg.users.username}</span>}</span>}
                  <div style={{ padding: "10px 14px", background: isMe ? T.navy : "#fff", color: isMe ? T.cream : T.ink, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontFamily: T.sans, fontSize: 14, lineHeight: 1.5, boxShadow: "0 1px 4px rgba(11,37,69,0.08)", border: isMe ? "none" : "1px solid " + T.border }}>{msg.content}</div>
                  <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted, padding: "0 4px" }}>{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>
      <div style={{ background: "#fff", borderTop: "1px solid " + T.border, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, padding: "10px 14px", alignItems: "flex-end" }}>
          <Avatar name={currentUser?.full_name} size={34} verified={currentUser?.identity_verified} />
          <div style={{ flex: 1, position: "relative" }}>
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} placeholder="Message the room..." style={{ width: "100%", padding: "10px 44px 10px 14px", borderRadius: 20, border: "1px solid " + T.border, background: T.cream, fontFamily: T.sans, fontSize: 13, color: T.ink, outline: "none", boxSizing: "border-box" }} />
            <button ref={chatEmojiRef} onClick={() => setShowEmoji(!showEmoji)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>😊</button>
            {showEmoji && <EmojiPicker onSelect={(emoji) => { setText((t) => t + emoji); setShowEmoji(false); inputRef.current?.focus(); }} onClose={() => setShowEmoji(false)} anchorRef={chatEmojiRef} />}
          </div>
          <button onClick={send} disabled={!text.trim()} style={{ width: 40, height: 40, borderRadius: "50%", background: T.navy, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, opacity: text.trim() ? 1 : 0.35, transition: "all 0.15s", flexShrink: 0 }}>
            <Ico d={ICONS.send} size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

const Skeleton = () => (
  <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, padding: "18px 20px" }}>
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "30%", marginBottom: 10 }} />
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "100%", marginBottom: 6 }} />
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "65%" }} />
      </div>
    </div>
  </div>
);

const TOPICS = [
  { tag: "LocalGovernment", n: "1.2k" }, { tag: "ClimatePolicy", n: "847" },
  { tag: "PublicTransit", n: "623" }, { tag: "Education", n: "510" },
  { tag: "Healthcare", n: "489" }, { tag: "HousingCrisis", n: "391" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [bookmarkSet, setBookmarkSet] = useState(new Set());
  const PAGE = 15;
  const initRef = useRef(false);

  useEffect(() => {
    if (user?.id && !initRef.current) {
      initRef.current = true;
      init();
    }
  }, [user?.id]);

  // Fetch polls when tab switches to polls
  useEffect(() => {
    if (tab === "polls" && polls.length === 0) fetchPolls();
  }, [tab]);

  const init = async () => {
    setLoading(true);
    await fetchProfile();
    await fetchFollowing();
    await fetchBookmarks().catch(() => {});
    await Promise.all([fetchPosts(0), fetchSurveys()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from("users").select("id, full_name, identity_verified, avatar_url, username").eq("id", user.id).single();
    setCurrentUser(data);
  };

  const fetchFollowing = async () => {
    const { data } = await supabase.from("user_follows").select("following_id").eq("follower_id", user.id);
    setFollowingSet(new Set((data || []).map((f) => f.following_id)));
  };

  const fetchBookmarks = async () => {
    const { data } = await supabase.from("community_bookmarks").select("post_id").eq("user_id", user.id);
    setBookmarkSet(new Set((data || []).map((b) => b.post_id)));
  };

  const fetchPolls = async () => {
    setPollsLoading(true);
    try {
      // Fetch polls with author info
      const { data: pollData, error } = await supabase
        .from("community_polls")
        .select("id, question, options, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) { console.warn("fetchPolls error:", error.message); setPolls([]); setPollsLoading(false); return; }

      if (!pollData?.length) { setPolls([]); setPollsLoading(false); return; }
      // Fetch authors separately (avoids PostgREST schema cache issue)
      const userIds = [...new Set(pollData.map((p) => p.user_id).filter(Boolean))];
      let userMap = {};
      if (userIds.length) {
        const { data: userData } = await supabase.from("users").select("id, full_name, identity_verified, avatar_url").in("id", userIds);
        (userData || []).forEach((u) => { userMap[u.id] = u; });
      }

      const pollIds = pollData.map((p) => p.id);

      // Fetch all votes for these polls
      const { data: allVotes } = await supabase
        .from("community_poll_votes")
        .select("poll_id, option_index, user_id")
        .in("poll_id", pollIds);

      const shaped = pollData.map((p) => {
        const pvotes = (allVotes || []).filter((v) => v.poll_id === p.id);
        const vote_counts = (p.options || []).map((_, i) => pvotes.filter((v) => v.option_index === i).length);
        const myVote = pvotes.find((v) => v.user_id === user.id);
        return {
          ...p,
          author_name: userMap[p.user_id]?.full_name,
            author_verified: userMap[p.user_id]?.identity_verified,
            author_avatar: userMap[p.user_id]?.avatar_url,
          vote_counts,
          my_vote_index: myVote ? myVote.option_index : null,
        };
      });
      setPolls(shaped);
    } catch (e) { console.warn("fetchPolls error:", e); setPolls([]); }
    setPollsLoading(false);
  };

  const handleCreatePoll = async (question, options) => {
    const { data, error } = await supabase
      .from("community_polls")
      .insert({ user_id: user.id, question, options })
      .select("id, question, options, created_at, user_id")
      .single();
    if (error) { console.error("createPoll error:", error); return; }
    if (data) {
      const newPoll = { ...data, author_name: currentUser?.full_name, author_verified: currentUser?.identity_verified, author_avatar: currentUser?.avatar_url, vote_counts: (data.options || []).map(() => 0), my_vote_index: null };
      setPolls((prev) => [newPoll, ...prev]);
    }
  };

  const handleVotePoll = async (pollId, optionIndex) => {
    const { error } = await supabase.from("community_poll_votes").insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
    if (error) { console.error("vote error:", error); return; }
    setPolls((prev) => prev.map((p) => {
      if (p.id !== pollId) return p;
      const vote_counts = [...(p.vote_counts || [])];
      vote_counts[optionIndex] = (vote_counts[optionIndex] || 0) + 1;
      return { ...p, vote_counts, my_vote_index: optionIndex };
    }));
  };

  const handleDeletePoll = async (pollId) => {
    await supabase.from("community_polls").delete().eq("id", pollId);
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  };

  const handleFollowToggle = (targetId, nowFollowing) => {
    setFollowingSet((prev) => { const next = new Set(prev); if (nowFollowing) next.add(targetId); else next.delete(targetId); return next; });
  };

  const handleBookmarkToggle = async (postId, nowBookmarked) => {
    if (nowBookmarked) await supabase.from("community_bookmarks").insert({ user_id: user.id, post_id: postId });
    else await supabase.from("community_bookmarks").delete().eq("user_id", user.id).eq("post_id", postId);
    setBookmarkSet((prev) => { const next = new Set(prev); if (nowBookmarked) next.add(postId); else next.delete(postId); return next; });
  };

  const fetchPosts = async (p) => {
    const from = p * PAGE;
    const { data } = await supabase.from("community_posts").select("id, content, created_at, likes_count, dislikes_count, comments_count, survey_tag, image_url, linked_survey_data, user_id, users:user_id(full_name, identity_verified, avatar_url, username)").order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    const ids = (data || []).map((x) => x.id);
    let myVotes = {};
    if (ids.length && user?.id) {
      const { data: votes } = await supabase.from("community_post_likes").select("post_id, type").eq("user_id", user.id).in("post_id", ids);
      (votes || []).forEach((v) => { myVotes[v.post_id] = v.type; });
    }
    const shaped = (data || []).map((x) => ({ ...x, author_name: x.users?.full_name, author_verified: x.users?.identity_verified, author_username: x.users?.username, author_avatar: x.users?.avatar_url, linked_survey: x.linked_survey_data, my_vote: myVotes[x.id] || null }));
    if (p === 0) setPosts(shaped); else setPosts((prev) => [...prev, ...shaped]);
    setHasMore((data || []).length === PAGE);
    setPage(p);
  };

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase.from("surveys").select("id, title, status").eq("status", "active").order("created_at", { ascending: false }).limit(20);
      if (error) { setSurveys([]); return; }
      if (!data?.length) { setSurveys([]); return; }
      const ids = data.map((s) => s.id);
      const { data: counts } = await supabase.from("survey_chat_messages").select("survey_id").in("survey_id", ids);
      const cmap = (counts || []).reduce((a, r) => { a[r.survey_id] = (a[r.survey_id] || 0) + 1; return a; }, {});
      setSurveys(data.map((s) => ({ ...s, participant_count: 0, message_count: cmap[s.id] || 0 })));
    } catch (e) { setSurveys([]); }
  };

  const handlePost = async (content, imageUrl, mentionIds, mentionMap) => {
    const { data, error } = await supabase.from("community_posts").insert({ user_id: user.id, content, image_url: imageUrl, likes_count: 0, comments_count: 0 }).select("id, content, created_at, likes_count, comments_count, image_url, user_id, users:user_id(full_name, identity_verified, avatar_url, username)").single();
    if (error) { console.error("post error:", error); return; }
    if (data) setPosts((prev) => [{ ...data, author_name: data.users?.full_name, author_verified: data.users?.identity_verified, author_username: data.users?.username, author_avatar: data.users?.avatar_url }, ...prev]);
  };

  const handleLike = async (postId, type, active, removingOpposite) => {
    if (!user?.id) return;
    if (!active) await supabase.from("community_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    else await supabase.from("community_post_likes").upsert({ post_id: postId, user_id: user.id, type }, { onConflict: "post_id,user_id" });
    await supabase.rpc("sync_post_like_counts", { p_post_id: postId });
  };

  const handleComment = async (postId, content, imageUrl) => {
    const insertData = { post_id: postId, user_id: user.id, content: content || null };
    if (imageUrl) insertData.image_url = imageUrl;
    const { data, error } = await supabase.from("community_post_comments").insert(insertData).select("id, content, created_at, image_url, user_id, users:user_id(full_name, identity_verified, username)").single();
    if (error) { console.error("Comment save error:", error); return null; }
    await supabase.rpc("increment_comment_count", { post_id: postId });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    return data;
  };

  const handleReact = async (postId, emoji) => {
    await supabase.from("community_post_reactions").insert({ post_id: postId, user_id: user.id, emoji }).select();
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reactions: [...(p.reactions || []), { emoji, user_id: user.id }] } : p));
  };

  if (activeRoom) {
    return (
      <div style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
        <style>{"@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }"}</style>
        <ChatRoom survey={activeRoom} currentUser={currentUser} onBack={() => setActiveRoom(null)} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.sans }}>
      <style>{"@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }"}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 30, color: T.navy, margin: "0 0 4px", lineHeight: 1.2 }}>Community</h1>
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Verified civic voices — discuss, react, and engage.</p>
          </div>
          <div style={{ padding: "7px 14px", borderRadius: 20, background: T.navy + "08", border: "1px solid " + T.border, fontFamily: T.sans, fontSize: 12, color: T.navy, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={ICONS.users} size={12} />
            {surveys.length} Live Rooms
          </div>
        </div>
        <div style={{ height: 3, marginTop: 16, borderRadius: 2, background: "linear-gradient(90deg, " + T.navy + " 0%, " + T.gold + " 60%, transparent 100%)" }} />
      </div>

      {/* Search */}
      <SearchBar navigate={navigate} />

      {/* Trending */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Ico d={ICONS.trending} size={13} />
          <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Trending</span>
        </div>
        <div style={{ overflowX: "auto", paddingBottom: 2 }}>
          <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
            {TOPICS.map((t) => (
              <button key={t.tag} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "#fff", border: "1px solid " + T.border, fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.navy, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(11,37,69,0.06)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.gold + "66"; e.currentTarget.style.background = T.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#fff"; }}
              >
                <Ico d={ICONS.hash} size={10} />
                {t.tag}
                <span style={{ fontSize: 10, color: T.muted, fontWeight: 400 }}>{t.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs — now 3 */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, padding: 4, background: T.navy + "08", borderRadius: 16, border: "1px solid " + T.border }}>
        {[
          { id: "feed", label: "Feed", icon: ICONS.chat },
          { id: "polls", label: "Polls", icon: ICONS.poll, count: polls.length || undefined },
          { id: "rooms", label: "Survey Rooms", icon: ICONS.hash, count: surveys.length },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, transition: "all 0.2s", background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? T.navy : T.muted, boxShadow: tab === t.id ? "0 1px 6px rgba(11,37,69,0.1)" : "none" }}>
            <Ico d={t.icon} size={14} />
            {t.label}
            {t.count > 0 && (
              <span style={{ padding: "1px 7px", borderRadius: 10, background: tab === t.id ? T.gold + "22" : T.navy + "10", color: tab === t.id ? T.gold : T.muted, fontSize: 10, fontWeight: 700 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      {tab === "feed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Composer user={currentUser} onPost={handlePost} navigate={navigate} />
          {loading ? [1, 2, 3].map((i) => <Skeleton key={i} />) :
            posts.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.navy, margin: "0 0 6px" }}>No posts yet</p>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Be the first to share a civic thought with your community.</p>
              </div>
            ) : (
              <>
                {posts.map((p) => (
                  <PostCard key={p.id}
                    post={{...p, _currentUserName: currentUser?.full_name, _currentUserVerified: currentUser?.identity_verified}}
                    onLike={handleLike} onComment={handleComment} onReact={handleReact}
                    currentUserId={user?.id} followingSet={followingSet} onFollowToggle={handleFollowToggle}
                    bookmarkSet={bookmarkSet} onBookmarkToggle={handleBookmarkToggle}
                    navigate={navigate}
                  />
                ))}
                {hasMore && (
                  <button onClick={() => fetchPosts(page + 1)} style={{ width: "100%", padding: "13px", background: "#fff", border: "1px solid " + T.border, borderRadius: 14, fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.navy, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.cream; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >Load more posts</button>
                )}
              </>
            )
          }
        </div>
      )}

      {/* Polls */}
      {tab === "polls" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <PollComposer user={currentUser} onCreate={handleCreatePoll} />
          {pollsLoading ? [1, 2, 3].map((i) => <Skeleton key={i} />) :
            polls.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <p style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.navy, margin: "0 0 6px" }}>No polls yet</p>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Create the first poll and ask your community!</p>
              </div>
            ) : polls.map((p) => (
              <PollCard key={p.id} poll={p} currentUserId={user?.id} onVote={handleVotePoll} onDelete={handleDeletePoll} />
            ))
          }
        </div>
      )}

      {/* Rooms */}
      {tab === "rooms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? [1, 2, 3].map((i) => <Skeleton key={i} />) :
            surveys.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.navy, margin: "0 0 6px" }}>No active rooms</p>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Check back when surveys go live.</p>
              </div>
            ) : surveys.map((s) => <RoomCard key={s.id} survey={s} onEnter={setActiveRoom} />)
          }
        </div>
      )}
    </div>
  );
}
