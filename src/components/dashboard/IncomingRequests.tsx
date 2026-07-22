"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useUnread } from "@/lib/useUnread";
import Chat from "@/components/Chat";
import { STATUS_BADGE, STATUS_LABEL, type ContactRequest, type RequestStatus } from "@/lib/types";

export default function IncomingRequests({ specialistId, onChange }: { specialistId: string; onChange: () => void }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<ContactRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const { unread, refresh: refreshUnread } = useUnread(rows.map((r) => r.id));

  useEffect(() => { if (!openChat) refreshUnread(); }, [openChat, refreshUnread]);

  const load = useCallback(async () => {
    const { data } = await sb
      .from("contact_requests")
      .select("*")
      .eq("specialist_id", specialistId)
      .order("created_at", { ascending: false });
    setRows((data as ContactRequest[]) ?? []);
    setReady(true);
  }, [sb, specialistId]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: RequestStatus) {
    setBusyId(id);
    await sb.from("contact_requests").update({ status }).eq("id", id);
    setBusyId(null);
    await load();
    onChange();
  }

  if (!ready) return <div className="muted">Загрузка…</div>;
  if (rows.length === 0) return <div className="card card-pad" style={{ color: "var(--text-mute)" }}>Пока нет заявок на связь.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.id} className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: "1.05rem" }}>{r.client_name || "Заказчик"}</strong>
              <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>
                {r.event_date ? `📅 ${r.event_date}` : "Дата не указана"}
                {r.status === "accepted" && r.client_phone ? ` · 📞 ${r.client_phone}` : ""}
              </div>
              {r.message && <p className="soft" style={{ fontSize: "0.9rem", marginTop: 8, marginBottom: 0 }}>{r.message}</p>}
            </div>
            <span className={`badge ${STATUS_BADGE[r.status]}`} style={{ height: "fit-content" }}>{STATUS_LABEL[r.status]}</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {r.status === "pending" && (
              <>
                <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "accepted")}>✓ Подтвердить и открыть контакты</button>
                <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "declined")}>Отклонить</button>
              </>
            )}
            {r.status === "accepted" && (
              <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "booked")}>📅 Забронировать{r.event_date ? ` на ${r.event_date}` : ""}</button>
            )}
            {r.status === "booked" && (
              <>
                <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "completed")}>✓ Заказ выполнен</button>
                <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "accepted")}>Отменить бронь</button>
              </>
            )}
            {r.status === "completed" && <span className="badge badge-completed">✓ Заказ выполнен</span>}
            {r.status === "declined" && (
              <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "pending")}>↺ Вернуть в ожидание</button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => setOpenChat(openChat === r.id ? null : r.id)}>
              {openChat === r.id ? "Скрыть чат" : "💬 Чат с заказчиком"}
              {unread.has(r.id) && openChat !== r.id && <span className="pill-count" style={{ marginLeft: 6 }}>новое</span>}
            </button>
          </div>

          {openChat === r.id && (
            <div style={{ marginTop: 12 }}>
              <Chat requestId={r.id} peerName={r.client_name} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
