"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// Возвращает множество request_id, где есть непрочитанные сообщения (не от меня).
export function useUnread(requestIds: string[]) {
  const sb = supabaseBrowser();
  const { user } = useAuth();
  const [unread, setUnread] = useState<Set<string>>(new Set());
  const key = requestIds.join(",");

  const load = useCallback(async () => {
    if (!user || requestIds.length === 0) { setUnread(new Set()); return; }
    const [{ data: msgs }, { data: reads }] = await Promise.all([
      sb.from("messages").select("request_id, sender_id, created_at").in("request_id", requestIds),
      sb.from("thread_reads").select("request_id, last_read_at").eq("user_id", user.id),
    ]);
    const readMap = new Map((reads ?? []).map((r: { request_id: string; last_read_at: string }) => [r.request_id, r.last_read_at]));
    const s = new Set<string>();
    for (const m of (msgs ?? []) as { request_id: string; sender_id: string; created_at: string }[]) {
      if (m.sender_id === user.id) continue;
      const lr = readMap.get(m.request_id);
      if (!lr || m.created_at > lr) s.add(m.request_id);
    }
    setUnread(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, user, key]);

  useEffect(() => {
    load();
    if (!user) return;
    const ch = sb
      .channel(`unread:${user.id}:${key}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { sb.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, user, key]);
  return { unread, refresh: load };
}
