"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { formatDate, type BusyDate } from "@/lib/types";

const KOMEK_NOTE = "бронь через Kömek"; // такие даты управляются бронированием, руками не снимаются

export default function BusyDatesManager({ specialistId }: { specialistId: string }) {
  const sb = supabaseBrowser();
  const { lang, t } = useLang();
  const [rows, setRows] = useState<BusyDate[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const { data } = await sb
      .from("specialist_busy")
      .select("specialist_id, busy_date, note")
      .eq("specialist_id", specialistId)
      .gte("busy_date", today)
      .order("busy_date");
    setRows((data as BusyDate[]) ?? []);
    setReady(true);
  }, [sb, specialistId, today]);

  useEffect(() => { load(); }, [load]);

  const byDate = useMemo(() => {
    const m = new Map<string, BusyDate>();
    for (const r of rows) m.set(r.busy_date, r);
    return m;
  }, [rows]);

  // Клик по дню: свободен → занят; занят вручную → снова свободен; бронь Kömek — не трогаем
  async function toggle(date: string) {
    const cur = byDate.get(date);
    if (cur?.note === KOMEK_NOTE) return;
    setBusy(true);
    if (cur) {
      await sb.from("specialist_busy").delete().eq("specialist_id", specialistId).eq("busy_date", date);
    } else {
      await sb.from("specialist_busy").upsert(
        { specialist_id: specialistId, busy_date: date, note: note.trim() },
        { onConflict: "specialist_id,busy_date" },
      );
    }
    setBusy(false);
    load();
  }

  async function copyIcs() {
    await navigator.clipboard.writeText(`${window.location.origin}/api/ical/${specialistId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ---- Календарная сетка месяца ----
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthName = base.toLocaleDateString(lang === "kk" ? "kk-KZ" : "ru-RU", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Пн = 0
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(Date.UTC(year, month, i + 1));
      return d.toISOString().slice(0, 10);
    }),
  ];
  const weekdays = lang === "kk" ? ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жк"] : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  if (!ready) return <div className="muted">{t("Загрузка…")}</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: 16 }} className="editor-grid">
      {/* Календарь: занятость отмечается одним нажатием */}
      <div className="card card-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>📅 {t("Календарь занятости")}</h3>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn btn-outline btn-sm" disabled={monthOffset === 0} onClick={() => setMonthOffset((m) => m - 1)}>‹</button>
            <button className="btn btn-outline btn-sm" onClick={() => setMonthOffset((m) => m + 1)}>›</button>
          </div>
        </div>
        <p className="soft" style={{ fontSize: "0.85rem", margin: "6px 0 12px" }}>
          {t("Нажмите на день, чтобы отметить его занятым или снова свободным. Брони через Kömek закрываются автоматически.")}
        </p>
        <strong style={{ textTransform: "capitalize", display: "block", marginBottom: 8 }}>{monthName}</strong>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {weekdays.map((w) => (
            <div key={w} className="muted" style={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 700, padding: "2px 0" }}>{w}</div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} />;
            const past = date < today;
            const cur = byDate.get(date);
            const isKomek = cur?.note === KOMEK_NOTE;
            const bg = past ? "transparent" : isKomek ? "var(--brand)" : cur ? "#e8564f" : "var(--surface-2)";
            const color = past ? "var(--text-mute)" : cur ? "#fff" : "var(--text)";
            return (
              <button
                key={date}
                disabled={past || busy || isKomek}
                onClick={() => toggle(date)}
                title={isKomek ? t("Бронь через Kömek — снимается отменой брони в заявках") : cur?.note || ""}
                style={{
                  aspectRatio: "1", borderRadius: 8, border: "1px solid var(--border)", cursor: past || isKomek ? "default" : "pointer",
                  background: bg, color, fontWeight: 600, fontSize: "0.85rem", opacity: past ? 0.45 : 1,
                }}
              >
                {Number(date.slice(8))}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, fontSize: "0.78rem" }} className="muted">
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "var(--surface-2)", border: "1px solid var(--border)", marginRight: 5 }} />{t("свободен")}</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#e8564f", marginRight: 5 }} />{t("занят (вручную)")}</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "var(--brand)", marginRight: 5 }} />{t("бронь через Kömek")}</span>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="label">{t("Заметка для новых отметок (необязательно)")}</label>
          <input className="input" placeholder={t("той / свадьба / выезд")} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      {/* Список + подписка в личный календарь */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card card-pad">
          <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>{t("Занятые даты")}</h3>
          {rows.length === 0 ? (
            <div className="muted">{t("Пока нет занятых дат — вы свободны.")}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {rows.map((r) => (
                <div key={r.busy_date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <span>
                    <strong>{formatDate(r.busy_date, true)}</strong>
                    {r.note && (
                      <span className={r.note === KOMEK_NOTE ? "badge badge-booked" : "muted"} style={{ marginLeft: 8, fontSize: "0.8rem" }}>
                        {r.note === KOMEK_NOTE ? `✓ ${t("бронь через Kömek")}` : `· ${r.note}`}
                      </span>
                    )}
                  </span>
                  {r.note !== KOMEK_NOTE && (
                    <button onClick={() => toggle(r.busy_date)} className="btn btn-ghost btn-sm" style={{ padding: "3px 9px" }}>{t("Убрать")}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>🗓 {t("Синхронизация с вашим календарём")}</h3>
          <p className="soft" style={{ fontSize: "0.85rem" }}>
            {t("Подпишитесь на занятость Kömek в Google / Apple календаре — брони будут появляться там автоматически. Скопируйте ссылку и добавьте её в календарь («По URL»).")}
          </p>
          <button className="btn btn-outline btn-sm" onClick={copyIcs}>
            {copied ? `✓ ${t("Ссылка скопирована")}` : `🔗 ${t("Скопировать ссылку календаря")}`}
          </button>
        </div>
      </div>
    </div>
  );
}
