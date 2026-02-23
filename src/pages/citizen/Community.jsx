import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
};

// Emoji sets
const EMOJI_CATEGORIES = {
  "Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡"],
  "Gestures": ["👍","👎","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👋","🤚","🖐","✋","🖖","🤜","🤛","✊","👊","🙌","👏","🤲","🙏","✍️","💪","🦾"],
  "People": ["👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","👴","👵","🧓","👮","🕵️","💂","🥷","👷","🫅","🤴","👸","👰","🤵","🦸","🦹","🧙","🧚","🧛","🧜","🧝"],
  "Nature": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜"],
  "Food": ["🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🫒","🍆","🥔","🥕","🌽","🌶️","🫑","🧄","🧅","🥜","🌰","🍞","🥐","🧆","🧇","🥞","🧈"],
  "Activities": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥊","🥋","🎽","⛷️","🏂","🪂","🏋️","🤸","⛹️","🤺","🤼","🤽","🤾","🏌️","🏇","🧘"],
  "Travel": ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🚲","🛴","🛹","🛼","🚁","🛸","✈️","🚀","🛶","⛵","🚤","🛥️","🛳️"],
  "Objects": ["💡","🔦","🕯️","🪔","🧱","💎","🔮","🪄","🎭","📺","📷","📸","🎸","🎹","🥁","🎷","🎺","🎻","🪕","📱","💻","🖥️","🖨️","⌨️","🖱️","📝","📖","📚","📰"],
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
const Avatar = ({ name, size = 38, verified = false }) => (
  <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)",
      border: "2px solid " + T.gold + "33",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: T.serif, fontWeight: 700, fontSize: size * 0.33, color: T.gold,
    }}>
      {initials(name)}
    </div>
    {verified && (
      <div style={{
        position: "absolute", bottom: -1, right: -1,
        width: size * 0.38, height: size * 0.38, borderRadius: "50%",
        background: T.navy, border: "1.5px solid " + T.gold,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Ico d={ICONS.shield} size={size * 0.2} />
      </div>
    )}
  </div>
);

const VerifiedBadge = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "2px 7px", borderRadius: 20,
    background: T.gold + "18", border: "1px solid " + T.gold + "44",
    fontSize: 10, fontWeight: 700, color: T.gold,
    fontFamily: T.sans, textTransform: "uppercase", letterSpacing: "0.05em",
  }}>
    <Ico d={ICONS.shield} size={9} />
    Verified
  </span>
);

// ── Emoji Picker ──────────────────────────────────────────────────────────────
const EmojiPicker = ({ onSelect, onClose, anchorRef }) => {
  const [cat, setCat] = useState("Smileys");
  const pickerRef = useRef(null);

  useEffect(() => {
    // Position via direct DOM — no state, no re-render, never moves
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
    // Close on outside click — delay 100ms so opening click doesn't immediately close
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, []); // runs ONCE on mount only

  const picker = (
    <div ref={pickerRef} style={{
      position: "fixed", top: -9999, left: -9999, visibility: "hidden",
      width: 300, background: "#fff", borderRadius: 16,
      border: "1px solid " + T.border,
      boxShadow: "0 8px 32px rgba(11,37,69,0.18)",
      zIndex: 9999, overflow: "hidden",
    }}>
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid " + T.border, padding: "8px 8px 0" }}>
        {Object.keys(EMOJI_CATEGORIES).map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{
            flexShrink: 0, padding: "4px 10px 8px", background: "none", border: "none",
            cursor: "pointer", fontFamily: T.sans, fontSize: 11, fontWeight: 600,
            color: cat === c ? T.navy : T.muted,
            borderBottom: cat === c ? "2px solid " + T.gold : "2px solid transparent",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}>{c}</button>
        ))}
      </div>
      <div style={{ padding: 10, maxHeight: 200, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 2 }}>
        {EMOJI_CATEGORIES[cat].map((e) => (
          <button key={e} onClick={() => onSelect(e)} style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, background: "none", border: "none", cursor: "pointer", borderRadius: 8,
          }}
            onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; }}
            onMouseLeave={(el) => { el.currentTarget.style.background = "none"; }}
          >{e}</button>
        ))}
      </div>
    </div>
  );

  // Portal: renders on document.body — completely outside parent tree
  // Parent re-renders (typing) CANNOT affect this component
  return createPortal(picker, document.body);
};

// ── Reaction Bar ──────────────────────────────────────────────────────────────
const ReactionBar = ({ reactions, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  const grouped = (reactions || []).reduce((a, r) => {
    a[r.emoji] = (a[r.emoji] || 0) + 1; return a;
  }, {});

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {Object.entries(grouped).map(([emoji, count]) => (
        <button key={emoji} onClick={() => onReact(emoji)} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 20, border: "1px solid " + T.border,
          background: T.cream, cursor: "pointer", fontSize: 14,
          fontFamily: T.sans, fontWeight: 600, color: T.navy, fontSize: 12,
          transition: "all 0.15s",
        }}>
          {emoji} <span style={{ fontSize: 11 }}>{count}</span>
        </button>
      ))}
      <button onClick={() => setShowPicker(!showPicker)} style={{
        width: 28, height: 28, borderRadius: "50%", border: "1px dashed " + T.border,
        background: "none", cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", color: T.muted, fontSize: 14, transition: "all 0.15s",
      }}>+</button>
      {showPicker && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "#fff", borderRadius: 12, padding: 8, border: "1px solid " + T.border,
          boxShadow: "0 4px 20px rgba(11,37,69,0.12)", display: "flex", gap: 4 }}>
          {REACTION_EMOJIS.map((e) => (
            <button key={e} onClick={() => { onReact(e); setShowPicker(false); }} style={{
              width: 36, height: 36, fontSize: 20, background: "none", border: "none",
              cursor: "pointer", borderRadius: 8, transition: "background 0.1s",
            }}
              onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; }}
              onMouseLeave={(el) => { el.currentTarget.style.background = "none"; }}
            >{e}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Post Composer ─────────────────────────────────────────────────────────────
const Composer = ({ user, onPost }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const MAX = 280;

  const insertEmoji = (emoji) => {
    const el = textRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next.slice(0, MAX));
    setShowEmoji(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const pickImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => { setImageFile(null); setImagePreview(null); };

  const post = async () => {
    if ((!text.trim() && !imageFile) || busy) return;
    setBusy(true);
    let imageUrl = null;
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split(".").pop();
      const path = "community/" + Date.now() + "." + ext;
      const { data: upData, error: upErr } = await supabase.storage
        .from("community-images").upload(path, imageFile, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(path);
        imageUrl = urlData?.publicUrl;
      }
      setUploading(false);
    }
    await onPost(text.trim(), imageUrl);
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setBusy(false);
  };

  const left = MAX - text.length;
  const hasContent = text.trim() || imageFile;

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, boxShadow: "0 2px 16px rgba(11,37,69,0.08)", overflow: "visible" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, " + T.navy + " 0%, " + T.gold + " 100%)", borderRadius: "20px 20px 0 0" }} />
      <div style={{ padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar name={user?.full_name} size={42} verified={user?.identity_verified} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
              placeholder="What's on your civic mind? Share a thought, ask a question..."
              rows={3}
              style={{
                width: "100%", resize: "none", border: "none", outline: "none",
                fontFamily: T.sans, fontSize: 15, lineHeight: 1.6,
                color: T.ink, background: "transparent", boxSizing: "border-box",
              }}
            />

            {/* Image preview */}
            {imagePreview && (
              <div style={{ position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden", display: "inline-block" }}>
                <img src={imagePreview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 12, display: "block" }} />
                <button onClick={removeImage} style={{
                  position: "absolute", top: 6, right: 6, width: 24, height: 24,
                  borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                }}>
                  <Ico d={ICONS.x} size={12} />
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid " + T.border }}>
              <div style={{ display: "flex", gap: 4, position: "relative" }}>
                {/* Image upload */}
                <button onClick={() => fileRef.current?.click()} style={{
                  width: 34, height: 34, borderRadius: 10, background: "none",
                  border: "1px solid " + T.border, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", color: T.muted,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.cream; e.currentTarget.style.color = T.navy; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.muted; }}
                >
                  <Ico d={ICONS.image} size={16} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />

                {/* Emoji */}
                <div style={{ position: "relative" }}>
                  <button ref={emojiButtonRef} onClick={() => setShowEmoji(!showEmoji)} style={{
                    width: 34, height: 34, borderRadius: 10, background: showEmoji ? T.cream : "none",
                    border: "1px solid " + (showEmoji ? T.gold + "44" : T.border),
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: showEmoji ? T.gold : T.muted, fontSize: 16, transition: "all 0.15s",
                  }}>😊</button>
                  {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} anchorRef={emojiButtonRef} />}
                </div>

                {/* Quick emojis */}
                <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
                  {["❤️","👍","🔥","🎉"].map((e) => (
                    <button key={e} onClick={() => insertEmoji(e)} style={{
                      width: 30, height: 30, fontSize: 16, background: "none", border: "none",
                      cursor: "pointer", borderRadius: 8, transition: "background 0.1s",
                    }}
                      onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; }}
                      onMouseLeave={(el) => { el.currentTarget.style.background = "none"; }}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: T.sans, fontWeight: 500, color: left < 40 ? "#e53e3e" : T.muted }}>
                  {left}
                </span>
                <button onClick={post} disabled={!hasContent || busy} style={{
                  padding: "8px 20px", borderRadius: 20, border: "none",
                  background: hasContent ? "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)" : "#f1f5f9",
                  color: hasContent ? T.gold : T.muted,
                  fontFamily: T.sans, fontSize: 13, fontWeight: 700,
                  cursor: hasContent ? "pointer" : "default", transition: "all 0.2s",
                  boxShadow: hasContent ? "0 2px 8px " + T.navy + "40" : "none",
                }}>
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

// ── Single comment row ────────────────────────────────────────────────────────
const CommentRow = ({ c }) => (
  <div style={{ display: "flex", gap: 10, paddingLeft: 4 }}>
    <Avatar name={c.users?.full_name || "?"} size={28} verified={c.users?.identity_verified} />
    <div style={{ flex: 1, minWidth: 0, paddingBottom: 10 }}>
      <div style={{
        background: T.cream, borderRadius: "12px 12px 12px 3px",
        padding: "7px 12px", border: "1px solid " + T.border,
        display: "inline-block", maxWidth: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 12, color: T.navy }}>
            {c.users?.full_name || "Citizen"}
          </span>
          {c.users?.identity_verified && (
            <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, fontFamily: T.sans }}>✓</span>
          )}
          <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted, marginLeft: 2 }}>
            · {timeAgo(c.created_at)}
          </span>
        </div>
        {c.content && (
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, margin: 0, lineHeight: 1.5 }}>{c.content}</p>
        )}
        {c.image_url && (
          <img src={c.image_url} alt="reply" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, marginTop: c.content ? 6 : 0, display: "block" }} />
        )}
      </div>
    </div>
  </div>
);

// ── Comments List with smooth slide expand ────────────────────────────────────
const CommentsList = ({ comments }) => {
  const [expanded, setExpanded] = useState(false);
  const SHOW = 3;
  const hiddenCount = Math.max(0, comments.length - SHOW);
  const latest = comments.slice(-SHOW); // always show the 3 most recent
  const older = comments.slice(0, -SHOW); // the rest hidden by default

  if (comments.length === 0) return null;

  return (
    <div style={{ borderLeft: "2px solid " + T.gold + "33", marginLeft: 14, paddingLeft: 8, marginBottom: 4 }}>
      {/* Older replies — slide open */}
      {hiddenCount > 0 && (
        <>
          <button onClick={() => setExpanded((v) => !v)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "4px 0 8px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.navy + "99",
          }}>
            <span style={{ fontSize: 13, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
            {expanded ? "Hide older replies" : "View " + hiddenCount + " more " + (hiddenCount === 1 ? "reply" : "replies")}
          </button>
          {/* Slide wrapper using max-height transition */}
          <div style={{
            overflow: "hidden",
            maxHeight: expanded ? older.length * 120 + "px" : "0px",
            transition: "max-height 0.35s ease",
          }}>
            {older.map((c) => <CommentRow key={c.id} c={c} />)}
          </div>
        </>
      )}
      {/* Always-visible latest replies */}
      {latest.map((c) => <CommentRow key={c.id} c={c} />)}
    </div>
  );
};

// ── Reply Box (isolated to prevent parent re-renders moving the emoji picker) ─
const ReplyBox = ({ postId, onComment }) => {
  const [reply, setReply] = useState("");
  const [showEmojiReply, setShowEmojiReply] = useState(false);
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const replyRef = useRef(null);
  const replyFileRef = useRef(null);
  const replyEmojiRef = useRef(null);

  const insertReplyEmoji = (emoji) => {
    setReply((r) => r + emoji);
    setShowEmojiReply(false);
    replyRef.current?.focus();
  };

  const submitReply = async () => {
    if (!reply.trim() && !replyImageFile) return;
    let imageUrl = null;
    if (replyImageFile) {
      const ext = replyImageFile.name.split(".").pop();
      const path = "community/" + Date.now() + "-reply." + ext;
      const { error: upErr } = await supabase.storage
        .from("community-images").upload(path, replyImageFile, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(path);
        imageUrl = urlData?.publicUrl;
      }
    }
    await onComment(postId, reply.trim(), imageUrl);
    setReply("");
    setReplyImageFile(null);
    setReplyImagePreview(null);
  };

  return (
    <div style={{ marginTop: 12, background: T.cream, borderRadius: 16, border: "1px solid " + T.border, padding: "12px 14px" }}>
      <textarea
        ref={replyRef}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && submitReply()}
        placeholder="Write a thoughtful reply..."
        rows={2}
        style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.6, boxSizing: "border-box" }}
      />
      {replyImagePreview && (
        <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
          <img src={replyImagePreview} alt="preview" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 10, display: "block" }} />
          <button onClick={() => { setReplyImageFile(null); setReplyImagePreview(null); }} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Ico d={ICONS.x} size={10} />
          </button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid " + T.border }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => replyFileRef.current?.click()} style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", border: "1px solid " + T.border, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
            <Ico d={ICONS.image} size={14} />
          </button>
          <input ref={replyFileRef} type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files[0]; if (!file) return;
            setReplyImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setReplyImagePreview(ev.target.result);
            reader.readAsDataURL(file);
          }} style={{ display: "none" }} />
          <div style={{ position: "relative" }}>
            <button ref={replyEmojiRef} onClick={() => setShowEmojiReply((v) => !v)} style={{ width: 30, height: 30, borderRadius: 8, background: showEmojiReply ? T.navy + "10" : "#fff", border: "1px solid " + (showEmojiReply ? T.gold + "44" : T.border), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>😊</button>
            {showEmojiReply && <EmojiPicker onSelect={insertReplyEmoji} onClose={() => setShowEmojiReply(false)} anchorRef={replyEmojiRef} />}
          </div>
          {["❤️","👍","🔥","😂"].map((e) => (
            <button key={e} onClick={() => insertReplyEmoji(e)} style={{ width: 28, height: 28, fontSize: 14, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>{e}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted }}>Ctrl+Enter</span>
          <button onClick={submitReply} disabled={!reply.trim() && !replyImageFile} style={{ padding: "6px 16px", borderRadius: 20, background: (reply.trim() || replyImageFile) ? T.navy : "#e2e8f0", color: (reply.trim() || replyImageFile) ? T.gold : T.muted, border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700, transition: "all 0.15s" }}>
            Reply
          </button>
        </div>
      </div>
    </div>
  );
};
const PostCard = ({ post, onLike, onComment, onReact }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [disliked, setDisliked] = useState(false);
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
  const replyRef = useRef(null);
  const replyFileRef = useRef(null);
  const replyEmojiRef = useRef(null);

  const toggleLike = async () => {
    if (disliked) { setDisliked(false); setDislikes((d) => d - 1); }
    setLiked((l) => !l);
    setLikes((l) => l + (liked ? -1 : 1));
    await onLike(post.id);
  };

  const toggleDislike = async () => {
    if (liked) { setLiked(false); setLikes((l) => l - 1); }
    setDisliked((d) => !d);
    setDislikes((d) => d + (disliked ? -1 : 1));
  };

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("community_post_comments")
      .select("id, content, created_at, image_url, users:user_id(full_name, identity_verified)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setLoadingComments(false);
  };

  const toggleReplies = () => {
    const next = !showReply;
    setShowReply(next);
    if (next && comments.length === 0) loadComments();
  };

  const submitReply = async () => {
    if (!reply.trim() && !replyImageFile) return;
    let imageUrl = null;
    if (replyImageFile) {
      const ext = replyImageFile.name.split(".").pop();
      const path = "community/" + Date.now() + "-reply." + ext;
      const { error: upErr } = await supabase.storage
        .from("community-images").upload(path, replyImageFile, { cacheControl: "3600", upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(path);
        imageUrl = urlData?.publicUrl;
      }
    }
    const saved = await onComment(post.id, reply.trim(), imageUrl);
    const newComment = saved || {
      id: Date.now(),
      content: reply.trim(),
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      users: { full_name: post._currentUserName, identity_verified: post._currentUserVerified },
    };
    setComments((prev) => [...prev, newComment]);
    setCommentCount((c) => c + 1);
    setReply("");
    setReplyImageFile(null);
    setReplyImagePreview(null);
  };

  const insertReplyEmoji = (emoji) => {
    setReply((r) => r + emoji);
    setShowEmojiReply(false);
    replyRef.current?.focus();
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 20,
        border: "1px solid " + (hovered ? T.gold + "33" : T.border),
        boxShadow: hovered ? "0 6px 24px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.2s", overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px 14px" }}>
        {/* Author */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <Avatar name={post.author_name} size={44} verified={post.author_verified} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
              <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 15, color: T.navy }}>
                {post.author_name || "Anonymous Citizen"}
              </span>
              {post.author_verified && <VerifiedBadge />}
              {post.survey_tag && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, background: T.navy + "08", border: "1px solid " + T.border, fontSize: 10, color: T.muted, fontFamily: T.sans }}>
                  <Ico d={ICONS.hash} size={8} /> {post.survey_tag}
                </span>
              )}
            </div>
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p style={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.65, color: T.ink, margin: "0 0 12px" }}>
            {post.content}
          </p>
        )}

        {/* Image */}
        {post.image_url && (
          <div style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden" }}>
            <img src={post.image_url} alt="post" style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} />
          </div>
        )}

        {/* Reactions */}
        {(post.reactions && post.reactions.length > 0) && (
          <div style={{ marginBottom: 10 }}>
            <ReactionBar reactions={post.reactions} onReact={(emoji) => onReact(post.id, emoji)} />
          </div>
        )}

        {/* Action bar */}
        <div style={{ paddingTop: 10, borderTop: "1px solid " + T.border }}>
          {/* Stats row */}
          {(likes > 0 || commentCount > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid " + T.border }}>
              {likes > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: T.muted }}>
                  <span style={{ fontSize: 14 }}>❤️</span> <strong style={{ color: T.ink }}>{likes}</strong> {likes === 1 ? "like" : "likes"}
                </span>
              )}
              {commentCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: T.muted }}>
                  <span style={{ fontSize: 14 }}>💬</span> <strong style={{ color: T.ink }}>{commentCount}</strong> {commentCount === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          )}
          {/* Buttons row */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Thumbs up */}
            <button onClick={toggleLike} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
              borderRadius: 20, background: liked ? "#fee2e2" : "none",
              border: "1px solid " + (liked ? "#fca5a5" : T.border),
              cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700,
              color: liked ? "#e53e3e" : T.muted, transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15 }}>{liked ? "👍" : "👍"}</span>
              <span>{likes > 0 ? likes : ""}</span>
            </button>

            {/* Thumbs down */}
            <button onClick={toggleDislike} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
              borderRadius: 20, background: disliked ? "#fef3c7" : "none",
              border: "1px solid " + (disliked ? "#fcd34d" : T.border),
              cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700,
              color: disliked ? "#d97706" : T.muted, transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15 }}>👎</span>
              <span>{dislikes > 0 ? dislikes : ""}</span>
            </button>

            {/* Reply */}
            <button onClick={toggleReplies} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
              borderRadius: 20, background: showReply ? T.navy + "08" : "none",
              border: "1px solid " + (showReply ? T.navy + "22" : T.border),
              cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 700,
              color: showReply ? T.navy : T.muted, transition: "all 0.15s",
            }}>
              <Ico d={ICONS.chat} size={14} />
              {commentCount > 0 ? commentCount : "Reply"}
            </button>

            {/* Quick emoji reactions */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
              {["❤️","🔥","😂"].map((e) => (
                <button key={e} onClick={() => onReact(post.id, e)} style={{
                  width: 30, height: 30, fontSize: 15, background: "none", border: "none",
                  cursor: "pointer", borderRadius: 8, transition: "all 0.15s",
                }}
                  onMouseEnter={(el) => { el.currentTarget.style.background = T.cream; el.currentTarget.style.transform = "scale(1.2)"; }}
                  onMouseLeave={(el) => { el.currentTarget.style.background = "none"; el.currentTarget.style.transform = "none"; }}
                >{e}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Comments + Reply box */}
        {showReply && (
          <div style={{ marginTop: 14 }}>
            {/* Existing comments — show 4, expand rest */}
            {loadingComments ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid " + T.gold, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : (
              <CommentsList comments={comments} />
            )}
          </div>
        )}
        {/* Reply composer */}
        {showReply && (
          <div style={{ marginTop: 4, background: T.cream, borderRadius: 16, border: "1px solid " + T.border, padding: "12px 14px" }}>
            <textarea
              ref={replyRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && submitReply()}
              placeholder="Write a thoughtful reply..."
              rows={2}
              style={{ width: "100%", resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.6, boxSizing: "border-box" }}
            />
            {/* Reply image preview */}
            {replyImagePreview && (
              <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
                <img src={replyImagePreview} alt="preview" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 10, display: "block" }} />
                <button onClick={() => { setReplyImageFile(null); setReplyImagePreview(null); }} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Ico d={ICONS.x} size={10} />
                </button>
              </div>
            )}
            {/* Reply toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid " + T.border }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {/* Image upload */}
                <button onClick={() => replyFileRef.current?.click()} style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", border: "1px solid " + T.border, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
                  <Ico d={ICONS.image} size={14} />
                </button>
                <input ref={replyFileRef} type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0]; if (!file) return;
                  setReplyImageFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => setReplyImagePreview(ev.target.result);
                  reader.readAsDataURL(file);
                }} style={{ display: "none" }} />
                {/* Emoji picker */}
                <div style={{ position: "relative" }}>
                  <button ref={replyEmojiRef} onClick={() => setShowEmojiReply(!showEmojiReply)} style={{ width: 30, height: 30, borderRadius: 8, background: showEmojiReply ? T.navy + "10" : "#fff", border: "1px solid " + (showEmojiReply ? T.gold + "44" : T.border), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>😊</button>
                  {showEmojiReply && <EmojiPicker onSelect={insertReplyEmoji} onClose={() => setShowEmojiReply(false)} anchorRef={replyEmojiRef} />}
                </div>
                {/* Quick emojis */}
                {["❤️","👍","🔥","😂"].map((e) => (
                  <button key={e} onClick={() => insertReplyEmoji(e)} style={{ width: 28, height: 28, fontSize: 14, background: "none", border: "none", cursor: "pointer", borderRadius: 6 }}>{e}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted }}>Ctrl+Enter to send</span>
                <button onClick={submitReply} disabled={!reply.trim() && !replyImageFile} style={{ padding: "6px 16px", borderRadius: 20, background: (reply.trim() || replyImageFile) ? T.navy : "#e2e8f0", color: (reply.trim() || replyImageFile) ? T.gold : T.muted, border: "none", cursor: (reply.trim() || replyImageFile) ? "pointer" : "default", fontFamily: T.sans, fontSize: 12, fontWeight: 700, transition: "all 0.15s" }}>
                  Reply
                </button>
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
    <button onClick={() => onEnter(survey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left", background: "#fff",
        borderRadius: 20, border: "1px solid " + (hovered ? T.gold + "44" : T.border),
        boxShadow: hovered ? "0 6px 24px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)",
        padding: "18px 20px", cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.2s", display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px " + T.navy + "30" }}>
          <Ico d={ICONS.hash} size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 15, color: T.navy, margin: 0, lineHeight: 1.4 }}>{survey.title}</p>
            {survey.message_count > 0 && (
              <span style={{ flexShrink: 0, minWidth: 24, height: 24, borderRadius: 12, background: T.gold, color: "#fff", fontFamily: T.sans, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>
                {survey.message_count > 99 ? "99+" : survey.message_count}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: T.muted }}>
              <Ico d={ICONS.users} size={11} /> {survey.participant_count || 0} participants
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulse 2s infinite" }} />
              Live
            </span>
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

  useEffect(() => {
    load();
    const ch = supabase.channel("room-" + survey.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "survey_chat_messages", filter: "survey_id=eq." + survey.id },
        (p) => { setMsgs((prev) => [...prev, p.new]); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [survey.id]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("survey_chat_messages")
      .select("id, content, created_at, user_id, users:user_id(full_name, identity_verified)")
      .eq("survey_id", survey.id).order("created_at", { ascending: true }).limit(100);
    setMsgs(data || []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
  };

  const send = async () => {
    if (!text.trim()) return;
    const msg = text.trim(); setText("");
    await supabase.from("survey_chat_messages").insert({ survey_id: survey.id, user_id: currentUser.id, content: msg });
  };

  const insertEmoji = (emoji) => {
    setText((t) => t + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "#fff", borderBottom: "1px solid " + T.border, flexShrink: 0, boxShadow: "0 1px 4px rgba(11,37,69,0.05)" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: T.cream, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.navy }}>
          <Ico d={ICONS.back} size={16} />
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ico d={ICONS.hash} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 14, color: T.navy, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{survey.title}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>{survey.participant_count || 0} participants</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", background: T.cream, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + T.gold, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <p style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 15, color: T.navy, margin: "0 0 4px" }}>Start the conversation!</p>
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Be the first to share your thoughts on this survey.</p>
          </div>
        ) : msgs.map((msg) => {
          const isMe = msg.user_id === currentUser?.id;
          const name = msg.users?.full_name || "Citizen";
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
              {!isMe && <Avatar name={name} size={32} verified={msg.users?.identity_verified} />}
              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>
                {!isMe && <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.navy, paddingLeft: 4 }}>{name}</span>}
                <div style={{ padding: "10px 14px", background: isMe ? T.navy : "#fff", color: isMe ? T.cream : T.ink, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontFamily: T.sans, fontSize: 14, lineHeight: 1.5, boxShadow: "0 1px 4px rgba(11,37,69,0.08)", border: isMe ? "none" : "1px solid " + T.border }}>
                  {msg.content}
                </div>
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
              <button ref={chatEmojiRef} onClick={() => setShowEmoji(!showEmoji)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>
                😊
              </button>
              {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} anchorRef={chatEmojiRef} />}
            </div>
          <button onClick={send} disabled={!text.trim()} style={{ width: 40, height: 40, borderRadius: "50%", background: T.navy, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, opacity: text.trim() ? 1 : 0.35, transition: "all 0.15s", flexShrink: 0, boxShadow: text.trim() ? "0 2px 8px " + T.navy + "40" : "none" }}>
            <Ico d={ICONS.send} size={14} />
          </button>
        </div>
      </div>
    </div>
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
  const [tab, setTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 15;

  useEffect(() => { if (user?.id) init(); }, [user?.id]);

  const init = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchPosts(0), fetchSurveys()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase.from("users").select("id, full_name, identity_verified").eq("id", user.id).single();
    setCurrentUser(data);
  };

  const fetchPosts = async (p) => {
    const from = p * PAGE;
    const { data } = await supabase
      .from("community_posts")
      .select("id, content, created_at, likes_count, comments_count, survey_tag, image_url, linked_survey_data, users:user_id(full_name, identity_verified)")
      .order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    const shaped = (data || []).map((x) => ({ ...x, author_name: x.users?.full_name, author_verified: x.users?.identity_verified, linked_survey: x.linked_survey_data }));
    if (p === 0) setPosts(shaped); else setPosts((prev) => [...prev, ...shaped]);
    setHasMore((data || []).length === PAGE);
    setPage(p);
  };

  const fetchSurveys = async () => {
    const { data } = await supabase.from("surveys").select("id, title, status, participant_count:survey_responses(count)").eq("status", "active").order("created_at", { ascending: false }).limit(20);
    if (!data?.length) { setSurveys([]); return; }
    const ids = data.map((s) => s.id);
    const { data: counts } = await supabase.from("survey_chat_messages").select("survey_id").in("survey_id", ids);
    const cmap = (counts || []).reduce((a, r) => { a[r.survey_id] = (a[r.survey_id] || 0) + 1; return a; }, {});
    setSurveys(data.map((s) => ({ ...s, participant_count: s.participant_count?.[0]?.count || 0, message_count: cmap[s.id] || 0 })));
  };

  const handlePost = async (content, imageUrl) => {
    const { data, error } = await supabase.from("community_posts")
      .insert({ user_id: user.id, content, image_url: imageUrl, likes_count: 0, comments_count: 0 })
      .select("id, content, created_at, likes_count, comments_count, image_url, users:user_id(full_name, identity_verified)").single();
    if (!error && data) setPosts((prev) => [{ ...data, author_name: data.users?.full_name, author_verified: data.users?.identity_verified }, ...prev]);
  };

  const handleLike = async (id) => {
    await supabase.from("community_posts").update({ likes_count: supabase.rpc("increment", { x: 1 }) }).eq("id", id);
  };

  const handleComment = async (postId, content, imageUrl) => {
    const insertData = { post_id: postId, user_id: user.id, content: content || null };
    if (imageUrl) insertData.image_url = imageUrl;
    const { data, error } = await supabase
      .from("community_post_comments")
      .insert(insertData)
      .select("id, content, created_at, image_url, users:user_id(full_name, identity_verified)")
      .single();
    if (error) { console.error("Comment save error:", error); return null; }
    // Increment count in DB so it persists on refresh
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
    <div style={{ maxWidth: 680, margin: "0 auto", fontFamily: T.sans }}>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, padding: 4, background: T.navy + "08", borderRadius: 16, border: "1px solid " + T.border }}>
        {[
          { id: "feed", label: "Feed", icon: ICONS.chat },
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
          <Composer user={currentUser} onPost={handlePost} />
          {loading ? [1, 2, 3].map((i) => <Skeleton key={i} />) :
            posts.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 20, border: "1px solid " + T.border, padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 16, color: T.navy, margin: "0 0 6px" }}>No posts yet</p>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Be the first to share a civic thought with your community.</p>
              </div>
            ) : (
              <>
                {posts.map((p) => <PostCard key={p.id} post={{...p, _currentUserName: currentUser?.full_name, _currentUserVerified: currentUser?.identity_verified}} onLike={handleLike} onComment={handleComment} onReact={handleReact} />)}
                {hasMore && (
                  <button onClick={() => fetchPosts(page + 1)} style={{ width: "100%", padding: "13px", background: "#fff", border: "1px solid " + T.border, borderRadius: 14, fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.navy, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.cream; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                  >
                    Load more posts
                  </button>
                )}
              </>
            )
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
