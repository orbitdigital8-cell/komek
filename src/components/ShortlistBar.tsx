"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShortlist } from "@/lib/shortlist";
import { useLang } from "@/lib/lang";

export default function ShortlistBar() {
  const { ids, ready, clear } = useShortlist();
  const { t } = useLang();
  const pathname = usePathname();

  // Не показываем на самой странице избранного и пока пусто
  if (!ready || ids.length === 0 || pathname === "/shortlist") return null;

  const onProfile = pathname?.startsWith("/s/");

  return (
    <div
      className={`shortlist-bar${onProfile ? " on-profile" : ""}`}
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 20,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 12px 10px 18px",
        borderRadius: 999,
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <span style={{ fontWeight: 650, fontSize: "0.92rem" }}>
        {t("❤️ В избранном:")} {ids.length}
      </span>
      <button onClick={clear} className="btn btn-ghost btn-sm">{t("Очистить")}</button>
      <Link href="/shortlist" className="btn btn-primary btn-sm">
        {t("Сравнить →")}
      </Link>
    </div>
  );
}
