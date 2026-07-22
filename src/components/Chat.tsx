"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Message } from "@/lib/types";

// adminSenderId:
//   undefined      — обычный режим (авторизованный участник, RLS + realtime)
//   string | null  — режим отладки: читаем/пишем через админский API от имени персоны
//                    (null = у персоны нет аккаунта, напр. демо-специалист → только чтение)
export default function Chat({ requestId, peerName, adminSenderId }: { requestId: string; peerName?: string; adminSenderId?: string | null }) {
  const sb = supabaseBrowser();
  const { user } = useAuth();
  const adminMode = adminSenderId !== undefined;
  const meId = adminMode ? adminSenderId : user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
    });
  }, []);

  const markRead = useCallback(() => {
    if (adminMode || !user) return;
    sb.from("thread_reads").upsert({ user_id: user.id, request_id: requestId, last_read_at: new Date().toISOString() }, { onConflict: "user_id,request_id" }).then(() => {});
  }, [adminMode, sb, user, requestId]);

  const fetchAdmin = useCallback(async () => {
    const r = await fetch(`/api/admin/messages?request_id=${requestId}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setMessages((d.messages as Message[]) ?? []);
    scrollDown();
  }, [requestId, scrollDown]);

  useEffect(() => {
    if (adminMode) {
      fetchAdmin();
      const t = setInterval(fetchAdmin, 4000); // лёгкий polling вместо realtime
      return () => clearInterval(t);
    }

    let alive = true;
    sb.from("messages").select("*").eq("request_id", requestId).order("created_at").then(({ data }) => {
      if (!alive) return;
      setMessages((data as Message[]) ?? []);
      scrollDown();
      markRead();
    });
    const channel = sb
      .channel(`messages:${requestId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        scrollDown();
        markRead();
      })
      .subscribe();
    return () => { alive = false; sb.removeChannel(channel); };
  }, [adminMode, sb, requestId, scrollDown, markRead, fetchAdmin]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !meId) return;
    setSending(true);
    if (adminMode) {
      const r = await fetch("/api/admin/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request_id: requestId, sender_id: meId, body }) });
      setSending(false);
      if (r.ok) { setText(""); fetchAdmin(); }
      return;
    }
    const { data, error } = await sb.from("messages").insert({ request_id: requestId, sender_id: meId, body }).select("*").single();
    setSending(false);
    if (!error && data) {
      const m = data as Message;
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
      setText("");
      scrollDown();
    }
  }

  const canSend = !!meId;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface)" }}>
      <div ref={boxRef} style={{ maxHeight: 260, minHeight: 120, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "var(--surface-2)" }}>
        {messages.length === 0 ? (
          <div className="muted" style={{ margin: "auto", fontSize: "0.86rem", textAlign: "center" }}>
            Сообщений пока нет. Напишите первым{peerName ? ` — ${peerName} ответит здесь` : ""}.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div style={{
                  padding: "8px 12px",
                  borderRadius: 14,
                  borderBottomRightRadius: mine ? 4 : 14,
                  borderBottomLeftRadius: mine ? 14 : 4,
                  background: mine ? "var(--brand)" : "var(--surface)",
                  color: mine ? "#fff" : "var(--text)",
                  border: mine ? "none" : "1px solid var(--border)",
                  fontSize: "0.92rem", lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {m.body}
                </div>
                <div className="muted" style={{ fontSize: "0.68rem", textAlign: mine ? "right" : "left", marginTop: 2 }}>
                  {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid var(--border)" }}>
        <input className="input" placeholder={canSend ? "Сообщение…" : "У этой персоны нет аккаунта — только чтение"} value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} disabled={!canSend} />
        <button className="btn btn-primary btn-sm" disabled={sending || !text.trim() || !canSend}>Отправить</button>
      </form>
    </div>
  );
}
