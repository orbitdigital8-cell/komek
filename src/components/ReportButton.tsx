"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

const REASONS = ["Недостоверная информация", "Спам или мошенничество", "Оскорбительный контент", "Другое"];

export default function ReportButton({ specialistId }: { specialistId: string }) {
  const sb = supabaseBrowser();
  const { user } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await sb.from("reports").insert({
      specialist_id: specialistId,
      reporter_id: user?.id ?? null,
      reason,
      details: details.trim(),
    });
    setBusy(false);
    if (!error) { setDone(true); setOpen(false); }
  }

  if (done) return <span className="muted" style={{ fontSize: "0.85rem" }}>✓ {t("Жалоба отправлена. Мы проверим анкету.")}</span>;

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" style={{ color: "var(--text-mute)" }} onClick={() => setOpen(true)}>
        ⚑ {t("Пожаловаться на анкету")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}>
      <strong style={{ fontSize: "0.95rem" }}>⚑ {t("Пожаловаться на анкету")}</strong>
      <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
        {REASONS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
      </select>
      <textarea
        className="textarea"
        style={{ minHeight: 70 }}
        placeholder={t("Расскажите подробнее (необязательно)")}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" disabled={busy}>{t("Отправить жалобу")}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>{t("Отмена")}</button>
      </div>
    </form>
  );
}
