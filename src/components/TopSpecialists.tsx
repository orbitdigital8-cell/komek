"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import SpecialistCard from "@/components/SpecialistCard";
import { useLang } from "@/lib/lang";
import type { Profession, Specialist } from "@/lib/types";

const CARD_COLS =
  "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count";

// Топ специалистов: заслуженные (много выполненных заказов) + высокий рейтинг.
// Разные профессии — чтобы витрина была разнообразной.
export default function TopSpecialists({ professions }: { professions: Profession[] }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [rows, setRows] = useState<Specialist[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb
        .from("specialists")
        .select(CARD_COLS)
        .eq("published", true)
        .gte("rating", 4.7)
        .order("orders_count", { ascending: false })
        .order("rating", { ascending: false })
        .order("review_count", { ascending: false })
        .limit(40);
      // По одному лучшему на профессию — для разнообразия витрины
      const seen = new Set<string>();
      const top: Specialist[] = [];
      for (const s of (data as unknown as Specialist[]) ?? []) {
        if (seen.has(s.profession)) continue;
        seen.add(s.profession);
        top.push(s);
        if (top.length >= 4) break;
      }
      setRows(top);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rows.length) return null;
  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  return (
    <section className="container" style={{ padding: "36px 22px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 className="h2" style={{ fontSize: "1.35rem", margin: 0 }}>⭐ {t("Топ специалистов Kömek")}</h2>
        <a href="#catalog" className="link" style={{ fontSize: "0.9rem" }}>{t("Весь каталог")} →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
        {rows.map((s) => (
          <SpecialistCard key={s.id} s={s} prof={profMap[s.profession]} />
        ))}
      </div>
    </section>
  );
}
