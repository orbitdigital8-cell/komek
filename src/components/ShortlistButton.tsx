"use client";

import { useShortlist } from "@/lib/shortlist";
import { useLang } from "@/lib/lang";

export default function ShortlistButton({ id, variant = "icon" }: { id: string; variant?: "icon" | "button" }) {
  const { has, toggle, ready } = useShortlist();
  const { t } = useLang();
  const active = ready && has(id);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  }

  if (variant === "button") {
    return (
      <button onClick={onClick} className={`btn ${active ? "btn-primary" : "btn-outline"}`} aria-pressed={active}>
        {active ? `❤ ${t("В избранном")}` : `🤍 ${t("В избранное")}`}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={active ? "Убрать из избранного" : "В избранное"}
      title={active ? "Убрать из избранного" : "В избранное"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,253,249,0.92)",
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
        transition: "transform .12s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {active ? "❤️" : "🤍"}
    </button>
  );
}
