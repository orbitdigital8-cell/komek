"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  read: boolean;
  created_at: string;
}

const ICON: Record<string, string> = {
  request: "📨", message: "💬", openrequest: "🔔", pick: "🎉", info: "•",
};

// Колокольчик уведомлений: события из личного кабинета (in-app), realtime.
export default function NotifBell() {
  const sb = supabaseBrowser();
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) { setItems([]); return; }
    const { data } = await sb.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setItems((data as Notif[]) ?? []);
  }, [sb, user]);

  useEffect(() => { load(); }, [load]);

  // Мгновенно: новое уведомление → в список
  useEffect(() => {
    if (!user) return;
    const ch = sb
      .channel(`notif-bell:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((cur) => [payload.new as Notif, ...cur].slice(0, 20)))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, user]);

  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function openItem(n: Notif) {
    setOpen(false);
    if (!n.read) {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      sb.from("notifications").update({ read: true }).eq("id", n.id).then(() => {});
    }
    // url может содержать абсолютный домен — берём путь
    try { router.push(new URL(n.url, window.location.origin).pathname); } catch { router.push("/"); }
  }

  async function markAll() {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    setItems((cur) => cur.map((x) => ({ ...x, read: true })));
    await sb.from("notifications").update({ read: true }).in("id", ids);
  }

  if (!user) return null;

  function ago(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return t("только что");
    if (m < 60) return `${m} ${t("мин")}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${t("ч")}`;
    return `${Math.floor(h / 24)} ${t("дн")}`;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} aria-label={t("Уведомления")} className="btn btn-ghost btn-sm"
        style={{ position: "relative", padding: "6px 9px", fontSize: "1.1rem", lineHeight: 1 }}>
        🔔
        {unread > 0 && (
          <span className="pill-count" style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, fontSize: "0.66rem", padding: "0 4px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, width: 300, maxHeight: 420, overflowY: "auto",
          background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)" }}>
            <strong style={{ fontSize: "0.9rem" }}>{t("Уведомления")}</strong>
            {unread > 0 && <button onClick={markAll} className="link" style={{ fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer" }}>{t("Прочитать всё")}</button>}
          </div>
          {items.length === 0 ? (
            <div className="muted" style={{ padding: "18px 13px", fontSize: "0.88rem", textAlign: "center" }}>{t("Нет новых уведомлений")}</div>
          ) : (
            items.map((n) => (
              <button key={n.id} onClick={() => openItem(n)} style={{
                display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "11px 13px", border: "none",
                borderBottom: "1px solid var(--border)", cursor: "pointer", background: n.read ? "transparent" : "var(--surface-2)",
              }}>
                <span style={{ fontSize: "1.1rem", lineHeight: 1.2 }}>{ICON[n.type] ?? "•"}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontWeight: n.read ? 500 : 700, fontSize: "0.88rem" }}>{n.title}</span>
                  {n.body && <span className="soft" style={{ display: "block", fontSize: "0.82rem", marginTop: 2 }}>{n.body}</span>}
                  <span className="muted" style={{ fontSize: "0.72rem" }}>{ago(n.created_at)}</span>
                </span>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flex: "none", marginTop: 5 }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
