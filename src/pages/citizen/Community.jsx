import { useState, useEffect, useRef } from "react";
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
  poll:     "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
};

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
};

const initials = (name) =>
  (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

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

const TOPICS = [
  { tag: "LocalGovernment", n: "1.2k" },
  { tag: "ClimatePolicy", n: "847" },
  { tag: "PublicTransit", n: "623" },
  { tag: "Education", n: "510" },
  { tag: "Healthcare", n: "489" },
  { tag: "HousingCrisis", n: "391" },
];

const Skeleton = () => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + T.border, padding: "18px 20px" }}>
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f1f5f9" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "35%", marginBottom: 8 }} />
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "100%", marginBottom: 6 }} />
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "70%" }} />
      </div>
    </div>
  </div>
);

const Composer = ({ user, onPost }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const MAX = 280;
  const post = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    await onPost(text.trim());
    setText("");
    setBusy(false);
  };
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + T.border, boxShadow: "0 2px 12px rgba(11,37,69,0.06)", overflow: "hidden" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, " + T.navy + " 0%, " + T.gold + " 100%)" }} />
      <div style={{ padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar name={user?.full_name} size={40} verified={user?.identity_verified} />
          <div style={{ flex: 1 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
              placeholder="Share a civic thought with verified citizens..."
              rows={2}
              style={{
                width: "100%", resize: "none", border: "none", outline: "none",
                fontFamily: T.sans, fontSize: 14, lineHeight: 1.6,
                color: T.ink, background: "transparent", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid " + T.border }}>
              <Ico d={ICONS.poll} size={15} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: T.sans, color: (MAX - text.length) < 40 ? "#e53e3e" : T.muted }}>
                  {MAX - text.length}
                </span>
                <button onClick={post} disabled={!text.trim() || busy} style={{
                  padding: "7px 18px", borderRadius: 20, border: "none",
                  background: text.trim() ? T.navy : "#f1f5f9",
                  color: text.trim() ? T.gold : T.muted,
                  fontFamily: T.sans, fontSize: 12, fontWeight: 700,
                  cursor: text.trim() ? "pointer" : "default", transition: "all 0.15s",
                }}>
                  {busy ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, onLike, onComment }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState("");
  const [hovered, setHovered] = useState(false);

  const toggleLike = async () => {
    setLiked((l) => !l);
    setLikes((l) => l + (liked ? -1 : 1));
    await onLike(post.id);
  };

  const submitReply = async () => {
    if (!reply.trim()) return;
    await onComment(post.id, reply.trim());
    setReply("");
    setShowReply(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid " + (hovered ? T.gold + "33" : T.border),
        boxShadow: hovered ? "0 4px 20px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.2s", overflow: "hidden", padding: "18px 20px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Avatar name={post.author_name} size={42} verified={post.author_verified} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.navy }}>
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

      <p style={{ fontFamily: T.sans, fontSize: 14, lineHeight: 1.65, color: T.ink, margin: "0 0 14px" }}>
        {post.content}
      </p>

      {post.linked_survey && (
        <div style={{ borderRadius: 10, padding: "12px 14px", marginBottom: 14, background: T.cream, border: "1px solid " + T.gold + "30" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Ico d={ICONS.poll} size={13} />
            <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.navy }}>{post.linked_survey.title}</span>
          </div>
          {(post.linked_survey.top_result || []).map((opt, i) => (
            <div key={i} style={{ position: "relative", marginBottom: 5 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: T.gold + (i === 0 ? "28" : "14"), width: opt.pct + "%" }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "4px 10px" }}>
                <span style={{ fontFamily: T.sans, fontSize: 12, color: T.ink }}>{opt.label}</span>
                <span style={{ fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: T.gold }}>{opt.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={toggleLike} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: liked ? "#e53e3e" : T.muted, transition: "color 0.15s", padding: 0 }}>
          <Ico d={ICONS.heart} size={15} fill={liked ? "#e53e3e" : "none"} />
          {likes > 0 ? likes : ""}
        </button>
        <button onClick={() => setShowReply(!showReply)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: showReply ? T.navy : T.muted, transition: "color 0.15s", padding: 0 }}>
          <Ico d={ICONS.chat} size={15} />
          {post.comments_count > 0 ? post.comments_count : ""}
        </button>
      </div>

      {showReply && (
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitReply()}
            placeholder="Write a reply..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: "1px solid " + T.border, background: T.cream, fontFamily: T.sans, fontSize: 13, color: T.ink, outline: "none" }}
          />
          <button onClick={submitReply} disabled={!reply.trim()} style={{ width: 34, height: 34, borderRadius: "50%", background: T.navy, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, opacity: reply.trim() ? 1 : 0.4 }}>
            <Ico d={ICONS.send} size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

const RoomCard = ({ survey, onEnter }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onEnter(survey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left", background: "#fff",
        borderRadius: 16, border: "1px solid " + (hovered ? T.gold + "44" : T.border),
        boxShadow: hovered ? "0 4px 20px rgba(11,37,69,0.1)" : "0 1px 6px rgba(11,37,69,0.05)",
        padding: "18px 20px", cursor: "pointer",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.2s", display: "block",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px " + T.navy + "30" }}>
          <Ico d={ICONS.hash} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 14, color: T.navy, margin: 0, lineHeight: 1.4 }}>
              {survey.title}
            </p>
            {survey.message_count > 0 && (
              <span style={{ flexShrink: 0, minWidth: 22, height: 22, borderRadius: 11, background: T.gold, color: "#fff", fontFamily: T.sans, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>
                {survey.message_count > 99 ? "99+" : survey.message_count}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 11, color: T.muted }}>
              <Ico d={ICONS.users} size={11} /> {survey.participant_count || 0} participants
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 11, color: "#16a34a", fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Live
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const ChatRoom = ({ survey, currentUser, onBack }) => {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("room-" + survey.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "survey_chat_messages", filter: "survey_id=eq." + survey.id },
        (p) => { setMsgs((prev) => [...prev, p.new]); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [survey.id]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("survey_chat_messages")
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "#fff", borderBottom: "1px solid " + T.border, flexShrink: 0, boxShadow: "0 1px 4px rgba(11,37,69,0.05)" }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 10, background: T.cream, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.navy }}>
          <Ico d={ICONS.back} size={16} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, " + T.navy + " 0%, " + T.navyMid + " 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ico d={ICONS.hash} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 14, color: T.navy, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{survey.title}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            <span style={{ fontFamily: T.sans, fontSize: 11, color: T.muted }}>{survey.participant_count || 0} participants</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: T.cream, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + T.gold, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted }}>Start the conversation</p>
          </div>
        ) : msgs.map((msg) => {
          const isMe = msg.user_id === currentUser?.id;
          const name = msg.users?.full_name || "Citizen";
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
              {!isMe && <Avatar name={name} size={30} verified={msg.users?.identity_verified} />}
              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 3 }}>
                {!isMe && <span style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 600, color: T.navy, paddingLeft: 2 }}>{name}</span>}
                <div style={{ padding: "9px 14px", background: isMe ? T.navy : "#fff", color: isMe ? T.cream : T.ink, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontFamily: T.sans, fontSize: 13, lineHeight: 1.5, boxShadow: "0 1px 4px rgba(11,37,69,0.08)", border: isMe ? "none" : "1px solid " + T.border }}>
                  {msg.content}
                </div>
                <span style={{ fontFamily: T.sans, fontSize: 10, color: T.muted, padding: "0 2px" }}>{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 10, padding: "12px 16px", background: "#fff", borderTop: "1px solid " + T.border, flexShrink: 0 }}>
        <Avatar name={currentUser?.full_name} size={34} verified={currentUser?.identity_verified} />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} placeholder="Message the room..." style={{ flex: 1, padding: "9px 14px", borderRadius: 20, border: "1px solid " + T.border, background: T.cream, fontFamily: T.sans, fontSize: 13, color: T.ink, outline: "none" }} />
        <button onClick={send} disabled={!text.trim()} style={{ width: 38, height: 38, borderRadius: "50%", background: T.navy, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.gold, opacity: text.trim() ? 1 : 0.35, transition: "opacity 0.15s", flexShrink: 0 }}>
          <Ico d={ICONS.send} size={14} />
        </button>
      </div>
    </div>
  );
};

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
      .select("id, content, created_at, likes_count, comments_count, survey_tag, linked_survey_data, users:user_id(full_name, identity_verified)")
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

  const handlePost = async (content) => {
    const { data, error } = await supabase.from("community_posts").insert({ user_id: user.id, content, likes_count: 0, comments_count: 0 }).select("id, content, created_at, likes_count, comments_count, users:user_id(full_name, identity_verified)").single();
    if (!error && data) setPosts((prev) => [{ ...data, author_name: data.users?.full_name, author_verified: data.users?.identity_verified }, ...prev]);
  };

  const handleLike = async (id) => {
    await supabase.from("community_posts").update({ likes_count: supabase.rpc("increment", { x: 1 }) }).eq("id", id);
  };

  const handleComment = async (postId, content) => {
    await supabase.from("community_post_comments").insert({ post_id: postId, user_id: user.id, content });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
  };

  if (activeRoom) {
    return (
      <div style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
        <style>{"@keyframes spin { to { transform: rotate(360deg) } }"}</style>
        <ChatRoom survey={activeRoom} currentUser={currentUser} onBack={() => setActiveRoom(null)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", fontFamily: T.sans }}>
      <style>{"@keyframes spin { to { transform: rotate(360deg) } }"}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: T.serif, fontWeight: 700, fontSize: 28, color: T.navy, margin: "0 0 4px", lineHeight: 1.2 }}>
              Community
            </h1>
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>
              Verified civic voices — discuss, react, and engage.
            </p>
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 20, background: T.navy + "08", border: "1px solid " + T.border, fontFamily: T.sans, fontSize: 11, color: T.navy, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={ICONS.users} size={11} />
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
              <button key={t.tag} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "#fff", border: "1px solid " + T.border, fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.navy, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(11,37,69,0.06)" }}>
                <Ico d={ICONS.hash} size={10} />
                {t.tag}
                <span style={{ fontSize: 10, color: T.muted, fontWeight: 400 }}>{t.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, padding: 4, background: T.navy + "08", borderRadius: 14, border: "1px solid " + T.border }}>
        {[
          { id: "feed", label: "Feed", icon: ICONS.chat },
          { id: "rooms", label: "Survey Rooms", icon: ICONS.hash, count: surveys.length },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "9px 12px", borderRadius: 10, border: "none", cursor: "pointer",
            fontFamily: T.sans, fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            background: tab === t.id ? "#fff" : "transparent",
            color: tab === t.id ? T.navy : T.muted,
            boxShadow: tab === t.id ? "0 1px 6px rgba(11,37,69,0.1)" : "none",
          }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Composer user={currentUser} onPost={handlePost} />
          {loading ? [1, 2, 3].map((i) => <Skeleton key={i} />) :
            posts.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + T.border, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <p style={{ fontFamily: T.sans, fontWeight: 600, color: T.navy, margin: "0 0 4px" }}>No posts yet</p>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Be the first to share a civic thought.</p>
              </div>
            ) : (
              <>
                {posts.map((p) => <PostCard key={p.id} post={p} onLike={handleLike} onComment={handleComment} />)}
                {hasMore && (
                  <button onClick={() => fetchPosts(page + 1)} style={{ width: "100%", padding: "12px", background: "#fff", border: "1px solid " + T.border, borderRadius: 12, fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.navy, cursor: "pointer" }}>
                    Load more
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
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + T.border, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <p style={{ fontFamily: T.sans, fontWeight: 600, color: T.navy, margin: "0 0 4px" }}>No active survey rooms</p>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.muted, margin: 0 }}>Check back when surveys go live.</p>
              </div>
            ) : surveys.map((s) => <RoomCard key={s.id} survey={s} onEnter={setActiveRoom} />)
          }
        </div>
      )}
    </div>
  );
}
