import { cookies } from "next/headers";
import Hero from "@/components/Hero";
import HomeSections from "@/components/HomeSections";
import { supabaseServer } from "@/lib/supabase/server";
import { type Lang } from "@/lib/i18n";
import type { Profession, Specialist } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const sb = await supabaseServer();
  // Первая страница каталога — с сервера; дальше клиент запрашивает сам (серверная пагинация).
  const [{ data: professions }, { data: specialists, count }] = await Promise.all([
    sb.from("professions").select("*").order("sort_order"),
    sb
      .from("specialists")
      .select(
        "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count",
        { count: "exact" },
      )
      .eq("published", true)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .range(0, 47),
  ]);

  return (
    <>
      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #f4ebda 0%, var(--bg) 78%)", borderBottom: "1px solid var(--border)" }}>
        {/* декоративные свечения */}
        <div aria-hidden style={{ position: "absolute", top: -120, left: "12%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(147,51,234,.22), transparent 68%)", filter: "blur(20px)" }} />
        <div aria-hidden style={{ position: "absolute", top: -60, right: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(194,155,69,.32), transparent 68%)", filter: "blur(18px)" }} />

        <Hero lang={lang} />
      </section>

      {/* Ниже — контент по роли: заказчику витрина+каталог, специалисту его заказы */}
      <HomeSections
        professions={(professions as Profession[]) ?? []}
        initialSpecialists={(specialists as unknown as Specialist[]) ?? []}
        initialCount={count ?? 0}
        month={new Date().getMonth()}
      />
    </>
  );
}
