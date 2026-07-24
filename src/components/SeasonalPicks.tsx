"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import SpecialistCard from "@/components/SpecialistCard";
import { useLang } from "@/lib/lang";
import type { Profession, Specialist } from "@/lib/types";

const CARD_COLS =
  "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count";

// Сезон по месяцу: определяет заголовок и набор востребованных профессий
function season(month: number): { key: string; title: string; emoji: string; profs: string[] } {
  // 0=янв. Пик тоев в КЗ: лето (июнь-авг) и золотая осень (сен-окт)
  if (month >= 5 && month <= 7) return { key: "summer", title: "Топ на летний сезон тоев", emoji: "☀️", profs: ["tamada", "photographer", "decorator", "singer", "pyro"] };
  if (month >= 8 && month <= 9) return { key: "autumn", title: "Успейте на осенний сезон свадеб", emoji: "🍂", profs: ["tamada", "videographer", "decorator", "cake", "showman"] };
  if (month >= 10 || month <= 1) return { key: "winter", title: "Готовимся к зимним торжествам", emoji: "❄️", profs: ["host", "singer", "animator", "photographer", "cake"] };
  return { key: "spring", title: "Планируете весенний той?", emoji: "🌸", profs: ["tamada", "decorator", "visagiste", "photographer", "musician"] };
}

export default function SeasonalPicks({ professions, month }: { professions: Profession[]; month: number }) {
  const sb = supabaseBrowser();
  const { lang, t } = useLang();
  const [rows, setRows] = useState<Specialist[]>([]);
  const s = season(month);

  useEffect(() => {
    (async () => {
      const { data } = await sb
        .from("specialists")
        .select(CARD_COLS)
        .eq("published", true)
        .in("profession", s.profs)
        .order("rating", { ascending: false })
        .order("review_count", { ascending: false })
        .limit(8);
      setRows((data as unknown as Specialist[]) ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.key]);

  if (!rows.length) return null;
  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  return (
    <section className="container" style={{ padding: "36px 22px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 className="h2" style={{ fontSize: "1.35rem", margin: 0 }}>{s.emoji} {t(s.title)}</h2>
        <Link href="#catalog" className="link" style={{ fontSize: "0.9rem" }}>{t("Весь каталог")} →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
        {rows.slice(0, 4).map((sp) => (
          <SpecialistCard key={sp.id} s={sp} prof={profMap[sp.profession]} />
        ))}
      </div>
    </section>
  );
}
