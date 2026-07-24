"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang";

// «Что вам нужно?» — направления платформы. Той-подбор здесь одна из плиток,
// а не фундамент: рядом равноправно стоят услуги для дома и весь каталог.
const TILES = [
  { href: "/calc", emoji: "🎉", title: "Праздник и той", desc: "Тамада, музыка, фото, декор — соберём команду по шагам", accent: "rgba(147,51,234,.14)" },
  { href: "/dom", emoji: "🏠", title: "Услуги для дома", desc: "Няня, домработница, повар, водитель — подберём под задачу", accent: "rgba(194,155,69,.16)" },
  { href: "#catalog", emoji: "🔎", title: "Весь каталог", desc: "Смотреть всех специалистов, фильтры и сравнение", accent: "rgba(20,160,120,.14)" },
  { href: "/orders", emoji: "📝", title: "Разместить заявку", desc: "Опишите задачу — свободные специалисты откликнутся сами", accent: "rgba(59,130,246,.14)" },
];

export default function ServiceGrid() {
  const { t } = useLang();
  return (
    <section id="services" className="container" style={{ padding: "40px 22px 0", scrollMarginTop: 80 }}>
      <h2 className="h2" style={{ marginBottom: 4 }}>{t("Что вам нужно?")}</h2>
      <p className="soft" style={{ marginBottom: 20 }}>{t("Выберите направление — проведём по шагам и подберём нужных специалистов.")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
        {TILES.map((tile) => (
          <Link key={tile.href} href={tile.href} className="card" style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 8, textDecoration: "none", background: `linear-gradient(160deg, ${tile.accent}, transparent 70%)` }}>
            <span style={{ fontSize: 34 }}>{tile.emoji}</span>
            <strong style={{ fontSize: "1.08rem" }}>{t(tile.title)}</strong>
            <span className="soft" style={{ fontSize: "0.9rem" }}>{t(tile.desc)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
