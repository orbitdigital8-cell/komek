"use client";

import Link from "next/link";
import Stars from "@/components/Stars";
import ShortlistButton from "@/components/ShortlistButton";
import { useLang } from "@/lib/lang";
import { expLabel, priceLabelL, profName } from "@/lib/i18n";
import { isFastResponder, loyaltyLevel, onlineStatus, type Profession, type Specialist } from "@/lib/types";

export default function SpecialistCard({
  s,
  prof,
}: {
  s: Specialist;
  prof?: Profession;
}) {
  const { lang, t } = useLang();
  const cover = s.gallery[0] || s.avatar_url;
  const status = onlineStatus(s.last_seen, lang);
  const level = loyaltyLevel(s.orders_count);
  return (
    <Link href={`/s/${s.id}`} className="card lift spec-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="card-media" style={{ position: "relative", aspectRatio: "4 / 3", background: "var(--surface-2)", overflow: "hidden" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-img" src={cover} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {/* Мягкая подложка снизу — для глубины и читаемости бейджей */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(28,24,48,.28), transparent 42%)", pointerEvents: "none" }} />
        <span
          className="badge"
          style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,253,249,.9)", color: "var(--brand)", fontWeight: 700, boxShadow: "var(--shadow-sm)", backdropFilter: "blur(6px)" }}
        >
          {prof?.emoji} {profName(prof, lang) || s.profession}
        </span>
        {s.video_url && (
          <span
            className="badge"
            style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(28,24,48,.6)", color: "#fff", backdropFilter: "blur(6px)" }}
          >
            ▶ {t("Видео")}
          </span>
        )}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <ShortlistButton id={s.id} />
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <strong style={{ fontSize: "1.05rem", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {s.name}
            {s.verified && <span title={t("Проверен")} style={{ color: "#2a5bd7", fontSize: 13 }}>✔</span>}
            {level && <span title={t(level.label)} style={{ fontSize: 13 }}>{level.emoji}</span>}
          </strong>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Stars rating={s.rating} />
            {s.review_count > 0 && <span className="muted" style={{ fontSize: "0.78rem" }}>({s.review_count})</span>}
          </span>
        </div>
        <div className="muted" style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span>📍 {t(s.city)} · {expLabel(s.experience_years, lang)}</span>
          {status?.online ? (
            <span style={{ color: "var(--good)", fontWeight: 700, fontSize: "0.78rem" }}>● {t("онлайн")}</span>
          ) : isFastResponder(s) ? (
            <span title={t("Отвечает быстро")} style={{ color: "var(--good)", fontWeight: 700, fontSize: "0.78rem" }}>⚡ {t("быстрый ответ")}</span>
          ) : null}
        </div>
        <p className="soft" style={{ fontSize: "0.9rem", margin: "2px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {t(s.tagline)}
        </p>
        {s.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
            {s.tags.slice(0, 3).map((tg) => (
              <span key={tg} style={{ fontSize: "0.72rem", color: "var(--text-mute)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 999 }}>
                #{t(tg)}
              </span>
            ))}
          </div>
        )}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong style={{ color: "var(--brand)", fontSize: "1.02rem" }}>{priceLabelL(s.price_from, lang)}</strong>
          <span className="card-cta" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {t("Смотреть")} <span className="card-cta-arrow">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
