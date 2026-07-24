"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import SpecialistCard from "@/components/SpecialistCard";
import { useLang } from "@/lib/lang";
import type { Profession, Specialist } from "@/lib/types";

const KEY = "komek_recent";

// «Вы недавно смотрели» — на главной, из localStorage
export default function RecentlyViewed({ professions }: { professions: Profession[] }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [rows, setRows] = useState<Specialist[]>([]);

  useEffect(() => {
    (async () => {
      let ids: string[] = [];
      try { ids = JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { /* ignore */ }
      if (!ids.length) return;
      const { data } = await sb
        .from("specialists")
        .select("id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count")
        .in("id", ids.slice(0, 4))
        .eq("published", true);
      const list = (data as unknown as Specialist[]) ?? [];
      list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      setRows(list);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rows.length) return null;
  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  return (
    <section className="container" style={{ padding: "28px 22px 0" }}>
      <h2 className="h2" style={{ fontSize: "1.25rem", marginBottom: 12 }}>{t("Вы недавно смотрели")}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
        {rows.map((s) => (
          <SpecialistCard key={s.id} s={s} prof={profMap[s.profession]} />
        ))}
      </div>
    </section>
  );
}
