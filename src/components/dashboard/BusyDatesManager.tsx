"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDate, type BusyDate } from "@/lib/types";

export default function BusyDatesManager({ specialistId }: { specialistId: string }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<BusyDate[]>([]);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
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

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setBusy(true);
    await sb.from("specialist_busy").upsert(
      { specialist_id: specialistId, busy_date: date, note },
      { onConflict: "specialist_id,busy_date" },
    );
    setDate("");
    setNote("");
    setBusy(false);
    load();
  }

  async function remove(d: string) {
    await sb.from("specialist_busy").delete().eq("specialist_id", specialistId).eq("busy_date", d);
    load();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }} className="editor-grid">
      <div className="card card-pad">
        <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>Отметить занятый день</h3>
        <p className="soft" style={{ fontSize: "0.85rem" }}>Заказчик увидит эти даты и поймёт, свободны ли вы на нужный день.</p>
        <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <div className="field">
            <label className="label">Дата</label>
            <input className="input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Заметка (необязательно)</label>
            <input className="input" placeholder="той / свадьба / выезд" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy || !date}>Добавить дату</button>
        </form>
      </div>

      <div className="card card-pad">
        <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>Занятые даты</h3>
        {!ready ? (
          <div className="muted">Загрузка…</div>
        ) : rows.length === 0 ? (
          <div className="muted">Пока нет занятых дат — вы свободны.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {rows.map((r) => (
              <div key={r.busy_date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
                <span>
                  <strong>{formatDate(r.busy_date, true)}</strong>
                  {r.note && <span className="muted" style={{ marginLeft: 8, fontSize: "0.85rem" }}>· {r.note}</span>}
                </span>
                <button onClick={() => remove(r.busy_date)} className="btn btn-ghost btn-sm" style={{ padding: "3px 9px" }}>Убрать</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
