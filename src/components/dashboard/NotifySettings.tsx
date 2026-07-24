"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { pushSupported, subscribePush, unsubscribePush } from "@/lib/push";

// Настройки уведомлений специалиста: браузер (Web Push) + Telegram
export default function NotifySettings({ userId }: { userId: string }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [webOn, setWebOn] = useState(false);
  const [tgOn, setTgOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const tgBot = process.env.NEXT_PUBLIC_TELEGRAM_BOT;

  const load = useCallback(async () => {
    const { data } = await sb.from("notification_prefs").select("web_enabled, tg_enabled").eq("user_id", userId).maybeSingle();
    setWebOn(!!data?.web_enabled);
    setTgOn(!!data?.tg_enabled);
  }, [sb, userId]);

  useEffect(() => { load(); }, [load]);

  async function enableWeb() {
    setBusy(true); setMsg(null);
    const sub = await subscribePush();
    if (!sub) { setMsg(t("Браузер не разрешил уведомления.")); setBusy(false); return; }
    await sb.from("notification_prefs").upsert(
      { user_id: userId, web_push: sub, web_enabled: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    setWebOn(true); setBusy(false);
  }

  async function disableWeb() {
    setBusy(true);
    await unsubscribePush();
    await sb.from("notification_prefs").upsert({ user_id: userId, web_enabled: false, web_push: null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setWebOn(false); setBusy(false);
  }

  async function testPush() {
    setMsg(null);
    const r = await fetch("/api/push/test", { method: "POST" });
    setMsg(r.ok ? t("Отправили тестовое уведомление ✓") : t("Не получилось — включите канал."));
  }

  async function connectTelegram() {
    setBusy(true);
    const code = crypto.randomUUID().slice(0, 8);
    await sb.from("telegram_links").insert({ code, user_id: userId });
    setBusy(false);
    if (tgBot) window.open(`https://t.me/${tgBot}?start=${code}`, "_blank");
    else setMsg(t("Telegram-бот ещё не настроен администратором."));
  }

  async function disableTg() {
    await sb.from("notification_prefs").upsert({ user_id: userId, tg_enabled: false, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setTgOn(false);
  }

  const dot = (on: boolean) => (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: on ? "var(--good)" : "var(--border-strong)", marginRight: 6 }} />
  );

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
      <div>
        <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>🔔 {t("Уведомления о заявках")}</h3>
        <p className="soft" style={{ fontSize: "0.85rem", margin: "4px 0 0" }}>
          {t("Не пропускайте заявки — включите уведомления, и они придут, даже когда сайт закрыт.")}
        </p>
      </div>

      {/* Браузер */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
        <span style={{ flex: 1, minWidth: 160 }}>{dot(webOn)}<strong>{t("В браузере")}</strong> <span className="muted" style={{ fontSize: "0.82rem" }}>· {t("бесплатно, для всех")}</span></span>
        {!pushSupported() ? (
          <span className="muted" style={{ fontSize: "0.82rem" }}>{t("Не поддерживается этим браузером")}</span>
        ) : webOn ? (
          <>
            <button className="btn btn-outline btn-sm" onClick={testPush}>{t("Проверить")}</button>
            <button className="btn btn-ghost btn-sm" onClick={disableWeb} disabled={busy}>{t("Выключить")}</button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={enableWeb} disabled={busy}>{t("Включить")}</button>
        )}
      </div>

      {/* Telegram */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
        <span style={{ flex: 1, minWidth: 160 }}>{dot(tgOn)}<strong>Telegram</strong> <span className="muted" style={{ fontSize: "0.82rem" }}>· {t("кому удобнее")}</span></span>
        {tgOn ? (
          <button className="btn btn-ghost btn-sm" onClick={disableTg}>{t("Отключить")}</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={connectTelegram} disabled={busy}>{t("Подключить Telegram")}</button>
        )}
      </div>

      {msg && <span className="badge badge-soft">{msg}</span>}
    </div>
  );
}
