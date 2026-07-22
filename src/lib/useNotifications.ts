"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// Сводка для шапки: новые заявки (специалисту) + непрочитанные сообщения.
export function useNotifications() {
  const sb = supabaseBrowser();
  const { user, role } = useAuth();
  const [pending, setPending] = useState(0);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!user) { setPending(0); setUnread(0); return; }
    let requestIds: string[] = [];
    let pend = 0;

    if (role === "specialist") {
      const { data: sp } = await sb.from("specialists").select("id").eq("owner_id", user.id).maybeSingle();
      if (sp) {
        const { data: reqs } = await sb.from("contact_requests").select("id, status").eq("specialist_id", (sp as { id: string }).id);
        const list = (reqs as { id: string; status: string }[]) ?? [];
        requestIds = list.map((r) => r.id);
        pend = list.filter((r) => r.status === "pending").length;
      }
    } else {
      const { data: reqs } = await sb.from("contact_requests").select("id").eq("client_id", user.id);
      requestIds = ((reqs as { id: string }[]) ?? []).map((r) => r.id);
    }
    setPending(pend);

    if (requestIds.length) {
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
      setUnread(s.size);
    } else {
      setUnread(0);
    }
  }, [sb, user, role]);

  useEffect(() => {
    load();
    if (!user) return;
    // Моментально: новое сообщение или заявка → пересчёт (RLS отдаёт только мои строки)
    const ch = sb
      .channel(`notif:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_requests" }, () => load())
      .subscribe();
    // Подстраховка на случай пропущенного события
    const t = setInterval(load, 30000);
    return () => { sb.removeChannel(ch); clearInterval(t); };
  }, [sb, user, load]);

  return { pending, unread, total: pending + unread, refresh: load };
}
