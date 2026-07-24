"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/useNotifications";
import { useLang } from "@/lib/lang";

// Колокольчик уведомлений в шапке: новые заявки + непрочитанные сообщения.
export default function NotifBell() {
  const { role } = useAuth();
  const { pending, unread, total } = useNotifications();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const cabinet = role === "specialist" ? "/dashboard" : "/requests";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("Уведомления")}
        className="btn btn-ghost btn-sm"
        style={{ position: "relative", padding: "6px 9px", fontSize: "1.1rem", lineHeight: 1 }}
      >
        🔔
        {total > 0 && (
          <span className="pill-count" style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, fontSize: "0.66rem", padding: "0 4px" }}>
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, width: 260,
            background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow)", overflow: "hidden",
          }}
        >
          <div style={{ padding: "10px 13px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.9rem" }}>
            {t("Уведомления")}
          </div>
          {total === 0 ? (
            <div className="muted" style={{ padding: "16px 13px", fontSize: "0.88rem", textAlign: "center" }}>
              {t("Нет новых уведомлений")}
            </div>
          ) : (
            <>
              {role === "specialist" && pending > 0 && (
                <Link href="/dashboard" onClick={() => setOpen(false)} className="notif-row" style={rowStyle}>
                  📨 <span>{t("Новые заявки на связь")}</span> <span className="pill-count" style={{ marginLeft: "auto" }}>{pending}</span>
                </Link>
              )}
              {unread > 0 && (
                <Link href={cabinet} onClick={() => setOpen(false)} className="notif-row" style={rowStyle}>
                  💬 <span>{t("Непрочитанные сообщения")}</span> <span className="pill-count" style={{ marginLeft: "auto" }}>{unread}</span>
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, padding: "11px 13px",
  fontSize: "0.88rem", color: "var(--text)", textDecoration: "none", borderBottom: "1px solid var(--border)",
};
