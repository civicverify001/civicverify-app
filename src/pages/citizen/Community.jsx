import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../hooks/useAuth";

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, className = "" }) => {
  const icons = {
    verified: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    heart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    heartFilled: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    ),
    comment: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    trending: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    hash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    poll: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    image: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
        <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    dot: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <circle cx="12" cy="12" r="5"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name = "?", size = 36, verified = false }) => {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = [
    ["#0B2545", "#C5960C"],
    ["#1a3a5c", "#e8b44e"],
    ["#0d3346", "#c5960c"],
    ["#162d4a", "#d4a832"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [bg, accent] = colors[idx];

  return (
    <div className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-bold text-white"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${bg} 0%, ${accent}44 100%)`,
          border: `2px solid ${accent}44`,
          fontSize: size * 0.35,
        }}
      >
        {initials}
      </div>
      {verified && (
        <div
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
          style={{
            width: size * 0.38,
            height: size * 0.38,
            background: "#0B2545",
            border: "1.5px solid #C5960C",
          }}
        >
          <Icon name="verified" size={size * 0.22} className="text-[#C5960C]" />
        </div>
      )}
    </div>
  );
};

// ─── Timestamp ────────────────────────────────────────────────────────────────
const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

// ─── Trending Topics ──────────────────────────────────────────────────────────
const TrendingBar = ({ topics }) => (
  <div className="overflow-x-auto scrollbar-hide">
    <div className="flex gap-2 pb-1 min-w-max">
      {topics.map((t) => (
        <button
          key={t.tag}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
          style={{
            background: "rgba(11,37,69,0.06)",
            color: "#0B2545",
            border: "1px solid rgba(197,150,12,0.2)",
          }}
        >
          <Icon name="hash" size={10} className="text-[#C5960C]" />
          {t.tag}
          <span className="text-[10px] opacity-50 font-normal">{t.count}</span>
        </button>
      ))}
    </div>
  </div>
);

// ─── Post Composer ────────────────────────────────────────────────────────────
const PostComposer = ({ user, onPost }) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const maxLen = 280;

  const handlePost = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await onPost(text.trim());
    setText("");
    setSubmitting(false);
  };

  const remaining = maxLen - text.length;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#fff", border: "1px solid rgba(11,37,69,0.08)" }}
    >
      <div className="flex gap-3">
        <Avatar name={user?.full_name || "You"} size={40} verified={user?.identity_verified} />
        <div className="flex-1 min-w-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLen))}
            placeholder="Share a civic thought or ask your community…"
            rows={2}
            className="w-full resize-none text-sm outline-none placeholder-gray-400 bg-transparent"
            style={{ color: "#0B2545", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-[#C5960C] transition-colors">
                <Icon name="image" size={16} />
              </button>
              <button className="text-gray-400 hover:text-[#C5960C] transition-colors">
                <Icon name="poll" size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs tabular-nums"
                style={{ color: remaining < 40 ? "#e53e3e" : "#a0aec0" }}
              >
                {remaining}
              </span>
              <button
                onClick={handlePost}
                disabled={!text.trim() || submitting}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
                style={{
                  background: text.trim() ? "#0B2545" : "transparent",
                  color: text.trim() ? "#C5960C" : "#a0aec0",
                  border: "1.5px solid",
                  borderColor: text.trim() ? "#0B2545" : "#e2e8f0",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Feed Post Card ───────────────────────────────────────────────────────────
const PostCard = ({ post, currentUserId, onLike, onComment }) => {
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((l) => l + (next ? 1 : -1));
    await onLike(post.id, next);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await onComment(post.id, replyText.trim());
    setReplyText("");
    setShowReply(false);
  };

  return (
    <div
      className="rounded-2xl p-4 transition-all hover:shadow-sm"
      style={{ background: "#fff", border: "1px solid rgba(11,37,69,0.07)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={post.author_name || "Citizen"} size={40} verified={post.author_verified} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "#0B2545", fontFamily: "'DM Sans', sans-serif" }}>
              {post.author_name || "Anonymous Citizen"}
            </span>
            {post.author_verified && (
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(197,150,12,0.1)", color: "#9a7209", border: "1px solid rgba(197,150,12,0.2)" }}
              >
                <Icon name="verified" size={10} />
                Verified
              </span>
            )}
            {post.survey_tag && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(11,37,69,0.06)", color: "#0B2545" }}
              >
                <Icon name="hash" size={9} className="inline mr-0.5" />
                {post.survey_tag}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: "#2d3748", fontFamily: "'DM Sans', sans-serif" }}>
        {post.content}
      </p>

      {/* Linked survey result snippet */}
      {post.linked_survey && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{ background: "rgba(11,37,69,0.03)", border: "1px solid rgba(11,37,69,0.08)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon name="poll" size={14} className="text-[#C5960C]" />
            <span className="text-xs font-medium" style={{ color: "#0B2545" }}>{post.linked_survey.title}</span>
          </div>
          {post.linked_survey.top_result && (
            <div className="space-y-1">
              {post.linked_survey.top_result.map((opt, i) => (
                <div key={i} className="relative">
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{ background: `rgba(197,150,12,${0.12 + i * 0.04})`, width: `${opt.pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-2.5 py-1">
                    <span className="text-xs" style={{ color: "#0B2545" }}>{opt.label}</span>
                    <span className="text-xs font-semibold" style={{ color: "#C5960C" }}>{opt.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-xs transition-all group"
          style={{ color: liked ? "#e53e3e" : "#a0aec0" }}
        >
          <Icon name={liked ? "heartFilled" : "heart"} size={15} />
          <span className="group-hover:text-red-400 transition-colors">{likes > 0 ? likes : ""}</span>
        </button>
        <button
          onClick={() => setShowReply(!showReply)}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: showReply ? "#0B2545" : "#a0aec0" }}
        >
          <Icon name="comment" size={15} />
          <span>{post.comments_count > 0 ? post.comments_count : ""}</span>
        </button>
      </div>

      {/* Inline reply */}
      {showReply && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            placeholder="Reply…"
            className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
            style={{
              background: "rgba(11,37,69,0.04)",
              border: "1px solid rgba(11,37,69,0.08)",
              color: "#0B2545",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
            style={{ background: "#0B2545", color: "#C5960C" }}
          >
            <Icon name="send" size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Chat Room ────────────────────────────────────────────────────────────────
const ChatRoom = ({ survey, currentUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`survey-chat-${survey.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "survey_chat_messages", filter: `survey_id=eq.${survey.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [survey.id]);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("survey_chat_messages")
      .select(`id, content, created_at, user_id, users:user_id(full_name, identity_verified)`)
      .eq("survey_id", survey.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
  };

  const send = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    await supabase.from("survey_chat_messages").insert({
      survey_id: survey.id,
      user_id: currentUser.id,
      content: msg,
    });
  };

  const grouped = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Header */}
      <div
        className="flex items-center gap-3 p-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(11,37,69,0.08)", background: "#fff" }}
      >
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-[#0B2545] transition-colors p-1 rounded-lg hover:bg-gray-50"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(197,150,12,0.12)" }}
          >
            <Icon name="hash" size={14} className="text-[#C5960C]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "#0B2545", fontFamily: "'Libre Baskerville', serif" }}>
              {survey.title}
            </p>
            <div className="flex items-center gap-1.5">
              <Icon name="dot" size={8} className="text-green-400" />
              <span className="text-xs text-gray-400">{survey.participant_count || 0} participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0" style={{ background: "rgba(245,241,236,0.4)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 rounded-full border-2 border-[#C5960C] border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Icon name="comment" size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Start the conversation about this survey</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 px-2">{date === new Date().toDateString() ? "Today" : date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-3">
                {msgs.map((msg) => {
                  const isMe = msg.user_id === currentUser?.id;
                  const name = msg.users?.full_name || "Citizen";
                  const verified = msg.users?.identity_verified;
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      {!isMe && <Avatar name={name} size={32} verified={verified} />}
                      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {!isMe && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium" style={{ color: "#0B2545" }}>{name}</span>
                            {verified && <Icon name="verified" size={10} className="text-[#C5960C]" />}
                          </div>
                        )}
                        <div
                          className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                          style={{
                            background: isMe ? "#0B2545" : "#fff",
                            color: isMe ? "#F5F1EC" : "#2d3748",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            border: isMe ? "none" : "1px solid rgba(11,37,69,0.07)",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 flex gap-2 flex-shrink-0 border-t"
        style={{ background: "#fff", borderColor: "rgba(11,37,69,0.08)" }}
      >
        <Avatar name={currentUser?.full_name || "You"} size={32} verified={currentUser?.identity_verified} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Message the room…"
          className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
          style={{
            background: "rgba(11,37,69,0.04)",
            border: "1px solid rgba(11,37,69,0.08)",
            color: "#0B2545",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: "#0B2545", color: "#C5960C" }}
        >
          <Icon name="send" size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Survey Room List ─────────────────────────────────────────────────────────
const SurveyRooms = ({ surveys, onEnter }) => (
  <div className="space-y-3">
    {surveys.length === 0 && (
      <div className="text-center py-12 text-gray-400 text-sm">No active survey rooms right now.</div>
    )}
    {surveys.map((s) => (
      <button
        key={s.id}
        onClick={() => onEnter(s)}
        className="w-full text-left rounded-2xl p-4 transition-all hover:shadow-sm group"
        style={{ background: "#fff", border: "1px solid rgba(11,37,69,0.07)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ background: "rgba(11,37,69,0.05)" }}
          >
            <Icon name="hash" size={18} className="text-[#C5960C]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm leading-snug" style={{ color: "#0B2545", fontFamily: "'Libre Baskerville', serif" }}>
                {s.title}
              </p>
              {s.message_count > 0 && (
                <span
                  className="flex-shrink-0 min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5"
                  style={{ background: "#C5960C", color: "#fff" }}
                >
                  {s.message_count > 99 ? "99+" : s.message_count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Icon name="users" size={11} />
                {s.participant_count || 0} participants
              </span>
              {s.last_message && (
                <span className="text-xs text-gray-400 truncate">
                  {s.last_message}
                </span>
              )}
              {s.status === "active" && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "#16a34a" }}>
                  <Icon name="dot" size={8} className="text-green-400" />
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    ))}
  </div>
);

// ─── Main Community Page ──────────────────────────────────────────────────────
export default function Community() {
  const { user } = useAuth();
  const [tab, setTab] = useState("feed"); // "feed" | "rooms"
  const [posts, setPosts] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 15;

  const trendingTopics = [
    { tag: "LocalGovernment", count: "1.2k" },
    { tag: "ClimatePolicy", count: "847" },
    { tag: "PublicTransit", count: "623" },
    { tag: "Education", count: "510" },
    { tag: "Healthcare", count: "489" },
    { tag: "HousingCrisis", count: "391" },
  ];

  useEffect(() => {
    if (user?.id) loadAll();
  }, [user?.id]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadPosts(0), loadSurveys()]);
    setLoading(false);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, full_name, identity_verified, role")
      .eq("id", user.id)
      .single();
    setCurrentUser(data);
  };

  const loadPosts = async (pageNum) => {
    const from = pageNum * PAGE_SIZE;
    const { data } = await supabase
      .from("community_posts")
      .select(`
        id, content, created_at, likes_count, comments_count,
        survey_tag, linked_survey_data,
        users:user_id(full_name, identity_verified)
      `)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const shaped = (data || []).map((p) => ({
      ...p,
      author_name: p.users?.full_name,
      author_verified: p.users?.identity_verified,
      linked_survey: p.linked_survey_data,
    }));

    if (pageNum === 0) setPosts(shaped);
    else setPosts((prev) => [...prev, ...shaped]);
    setHasMore((data || []).length === PAGE_SIZE);
    setPage(pageNum);
  };

  const loadSurveys = async () => {
    const { data } = await supabase
      .from("surveys")
      .select("id, title, status, participant_count:survey_responses(count)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get message counts
    if (data?.length) {
      const ids = data.map((s) => s.id);
      const { data: counts } = await supabase
        .from("survey_chat_messages")
        .select("survey_id")
        .in("survey_id", ids);

      const countMap = (counts || []).reduce((acc, r) => {
        acc[r.survey_id] = (acc[r.survey_id] || 0) + 1;
        return acc;
      }, {});

      setSurveys(
        (data || []).map((s) => ({
          ...s,
          participant_count: s.participant_count?.[0]?.count || 0,
          message_count: countMap[s.id] || 0,
        }))
      );
    } else {
      setSurveys(data || []);
    }
  };

  const handlePost = async (content) => {
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, content, likes_count: 0, comments_count: 0 })
      .select("id, content, created_at, likes_count, comments_count, users:user_id(full_name, identity_verified)")
      .single();
    if (!error && data) {
      setPosts((prev) => [
        { ...data, author_name: data.users?.full_name, author_verified: data.users?.identity_verified },
        ...prev,
      ]);
    }
  };

  const handleLike = async (postId, liked) => {
    await supabase
      .from("community_posts")
      .update({ likes_count: supabase.rpc("increment", { x: liked ? 1 : -1 }) })
      .eq("id", postId);
  };

  const handleComment = async (postId, content) => {
    await supabase.from("community_post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content,
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      )
    );
  };

  // If in a chat room
  if (activeRoom) {
    return (
      <div className="h-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <ChatRoom survey={activeRoom} currentUser={currentUser} onBack={() => setActiveRoom(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "#0B2545", fontFamily: "'Libre Baskerville', serif" }}
        >
          Community
        </h1>
        <p className="text-sm text-gray-500">
          Verified civic voices — discuss, react, and engage.
        </p>
      </div>

      {/* Trending */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="trending" size={13} className="text-[#C5960C]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Trending</span>
        </div>
        <TrendingBar topics={trendingTopics} />
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-xl"
        style={{ background: "rgba(11,37,69,0.05)" }}
      >
        {[
          { id: "feed", label: "Feed", icon: "comment" },
          { id: "rooms", label: "Survey Rooms", icon: "hash" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? "#0B2545" : "#94a3b8",
              boxShadow: tab === t.id ? "0 1px 4px rgba(11,37,69,0.1)" : "none",
            }}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
            {t.id === "rooms" && surveys.length > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(197,150,12,0.15)", color: "#9a7209" }}
              >
                {surveys.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {tab === "feed" && (
        <div className="space-y-4">
          <PostComposer user={currentUser} onPost={handlePost} />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 animate-pulse"
                  style={{ background: "#fff", border: "1px solid rgba(11,37,69,0.07)" }}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: "#fff", border: "1px solid rgba(11,37,69,0.07)" }}
            >
              <Icon name="comment" size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500 mb-1">No posts yet</p>
              <p className="text-xs text-gray-400">Be the first to share a civic thought.</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              ))}
              {hasMore && (
                <button
                  onClick={() => loadPosts(page + 1)}
                  className="w-full py-3 text-sm font-medium rounded-xl transition-all hover:opacity-80"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(11,37,69,0.08)",
                    color: "#0B2545",
                  }}
                >
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Rooms Tab */}
      {tab === "rooms" && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 animate-pulse"
                  style={{ background: "#fff", border: "1px solid rgba(11,37,69,0.07)" }}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SurveyRooms surveys={surveys} onEnter={setActiveRoom} />
          )}
        </div>
      )}
    </div>
  );
}
