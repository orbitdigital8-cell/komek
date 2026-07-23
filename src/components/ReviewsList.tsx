"use client";

import { useLang } from "@/lib/lang";
import type { Review } from "@/lib/types";

function stars(n: number) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  const { lang, t } = useLang();
  if (reviews.length === 0) {
    return (
      <div className="card card-pad" style={{ color: "var(--text-mute)" }}>
        {t("Пока нет отзывов. Оставить отзыв может заказчик, чей запрос специалист подтвердил.")}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {reviews.map((r) => (
        <div key={r.id} className="card card-pad">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <strong>{r.author_name || t("Заказчик")}</strong>
            <span style={{ color: "var(--accent)", letterSpacing: 1 }}>{stars(r.rating)}</span>
          </div>
          {r.text && <p className="soft" style={{ fontSize: "0.92rem", margin: "8px 0 0" }}>{r.text}</p>}
          <div className="muted" style={{ fontSize: "0.76rem", marginTop: 8 }}>
            {new Date(r.created_at).toLocaleDateString(lang === "kk" ? "kk-KZ" : "ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      ))}
    </div>
  );
}
