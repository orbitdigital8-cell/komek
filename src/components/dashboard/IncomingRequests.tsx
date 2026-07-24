"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useUnread } from "@/lib/useUnread";
import { useLang } from "@/lib/lang";
import Chat from "@/components/Chat";
import { STATUS_BADGE, STATUS_LABEL, type ContactRequest, type RequestStatus } from "@/lib/types";

export default function IncomingRequests({ specialistId, onChange }: { specialistId: string; onChange: () => void }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [rows, setRows] = useState<ContactRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const { unread, refresh: refreshUnread } = useUnread(rows.map((r) => r.id));

  useEffect(() => { if (!openChat) refreshUnread(); }, [openChat, refreshUnread]);

  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [{ data }, { data: busyData }] = await Promise.all([
      sb.from("contact_requests").select("*").eq("specialist_id", specialistId).order("created_at", { ascending: false }),
      sb.from("specialist_busy").select("busy_date").eq("specialist_id", specialistId).gte("busy_date", today),
    ]);
    setRows((data as ContactRequest[]) ?? []);
    setBusyDates(new Set(((busyData as { busy_date: string }[]) ?? []).map((b) => b.busy_date)));
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

  if (!ready) return <div className="muted">{t("Загрузка…")}</div>;
  if (rows.length === 0) return <div className="card card-pad" style={{ color: "var(--text-mute)" }}>{t("Пока нет заявок на связь.")}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.id} className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: "1.05rem" }}>{r.client_name || t("Заказчик")}</strong>
              <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>
                  {r.event_date ? `📅 ${r.event_date}` : t("Дата не указана")}
                  {r.status === "accepted" && r.client_phone ? ` · 📞 ${r.client_phone}` : ""}
                </span>
                {/* Конфликт: дата заявки уже занята (и это не её собственная бронь) */}
                {r.event_date && busyDates.has(r.event_date) && r.status !== "booked" && r.status !== "completed" && (
                  <span className="badge badge-declined">⚠ {t("эта дата уже занята")}</span>
                )}
              </div>
              {r.message && <p className="soft" style={{ fontSize: "0.9rem", marginTop: 8, marginBottom: 0 }}>{r.message}</p>}
            </div>
            <span className={`badge ${STATUS_BADGE[r.status]}`} style={{ height: "fit-content" }}>{t(STATUS_LABEL[r.status])}</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {r.status === "pending" && (
              <>
                <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "accepted")}>{t("✓ Подтвердить и открыть контакты")}</button>
                <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "declined")}>{t("Отклонить")}</button>
              </>
            )}
            {r.status === "accepted" && (
              <button
                className="btn btn-primary btn-sm"
                disabled={busyId === r.id}
                onClick={() => {
                  // Защита от двойной брони: дата уже занята → просим подтвердить
                  if (r.event_date && busyDates.has(r.event_date) && !window.confirm(t("Эта дата уже отмечена занятой. Всё равно забронировать?"))) return;
                  setStatus(r.id, "booked");
                }}
              >
                {t("📅 Забронировать")}{r.event_date ? ` · ${r.event_date}` : ""}
              </button>
            )}
            {r.status === "booked" && (
              <>
                <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "completed")}>{t("✓ Заказ выполнен")}</button>
                <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "accepted")}>{t("Отменить бронь")}</button>
              </>
            )}
            {r.status === "completed" && <span className="badge badge-completed">{t("✓ Заказ выполнен")}</span>}
            {r.status === "declined" && (
              <button className="btn btn-ghost btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r.id, "pending")}>{t("↺ Вернуть в ожидание")}</button>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => setOpenChat(openChat === r.id ? null : r.id)}>
              {openChat === r.id ? t("Скрыть чат") : t("💬 Чат с заказчиком")}
              {unread.has(r.id) && openChat !== r.id && <span className="pill-count" style={{ marginLeft: 6 }}>{t("новое")}</span>}
            </button>
          </div>

          {openChat === r.id && (
            <div style={{ marginTop: 12 }}>
              <Chat requestId={r.id} peerName={r.client_name} senderRole="specialist" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
