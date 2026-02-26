// src/hooks/useNotifications.js
// Shared notification hook — used by CitizenLayout so the bell appears on every page
import { useState, useEffect, useRef, useCallback } from "react";

export function useNotifications(supabase, userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const notifs = [];
      const lastRead = localStorage.getItem("cv_notif_read_" + userId) || "1970-01-01T00:00:00Z";

      // 1. Replies on my posts
      try {
        const { data: myPostIds } = await supabase
          .from("community_posts").select("id").eq("user_id", userId);
        const ids = (myPostIds || []).map((p) => p.id);
        if (ids.length > 0) {
          // Try community_post_comments first (correct table), fallback to comments
          let replies = null;
          const { data: r1, error: e1 } = await supabase
            .from("community_post_comments")
            .select("id, post_id, content, created_at, user_id, users:user_id(full_name)")
            .in("post_id", ids)
            .neq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (!e1) replies = r1;
          else {
            const { data: r2 } = await supabase
              .from("comments")
              .select("id, post_id, content, created_at, user_id, users:user_id(full_name)")
              .in("post_id", ids)
              .neq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(20);
            replies = r2;
          }
          (replies || []).forEach((r) => {
            notifs.push({
              id: "reply_" + r.id,
              type: "reply",
              post_id: r.post_id,
              actor_name: r.users?.full_name || "Someone",
              preview: (r.content || "").slice(0, 80),
              created_at: r.created_at,
              read: r.created_at <= lastRead,
            });
          });
        }
      } catch (e) { /* table might not exist */ }

      // 2. Reactions on my posts
      try {
        const { data: myPostIds } = await supabase
          .from("community_posts").select("id").eq("user_id", userId);
        const ids = (myPostIds || []).map((p) => p.id);
        if (ids.length > 0) {
          const { data: reactions } = await supabase
            .from("community_post_likes")
            .select("id, post_id, type, created_at, user_id, users:user_id(full_name)")
            .in("post_id", ids)
            .neq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);
          (reactions || []).forEach((r) => {
            notifs.push({
              id: "react_" + r.id,
              type: "reaction",
              post_id: r.post_id,
              actor_name: r.users?.full_name || "Someone",
              emoji: r.type === "like" ? "👍" : r.type === "dislike" ? "👎" : r.type,
              created_at: r.created_at,
              read: r.created_at <= lastRead,
            });
          });
        }
      } catch (e) {}

      // 3. New followers
      try {
        const { data: followers } = await supabase
          .from("user_follows")
          .select("id, follower_id, created_at, users:follower_id(full_name)")
          .eq("following_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);
        (followers || []).forEach((f) => {
          notifs.push({
            id: "follow_" + f.id,
            type: "follow",
            actor_name: f.users?.full_name || "Someone",
            created_at: f.created_at,
            read: f.created_at <= lastRead,
          });
        });
      } catch (e) { /* follows table may not exist */ }

      // Sort newest first, cap at 30
      notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(notifs.slice(0, 30));
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (e) {
      console.error("Notifications fetch error:", e);
    }
    setLoading(false);
  }, [supabase, userId]);

  // Fetch on mount + poll every 60s
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalRef.current);
  }, [userId, fetchNotifications]);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    localStorage.setItem("cv_notif_read_" + userId, new Date().toISOString());
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications };
}

