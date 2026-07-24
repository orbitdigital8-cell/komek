import { cookies } from "next/headers";
import Catalog from "@/components/Catalog";
import RecentlyViewed from "@/components/RecentlyViewed";
import SeasonalPicks from "@/components/SeasonalPicks";
import TopSpecialists from "@/components/TopSpecialists";
import HeroActions from "@/components/HeroActions";
import AiMatch from "@/components/AiMatch";
import { supabaseServer } from "@/lib/supabase/server";
import { makeT, type Lang } from "@/lib/i18n";
import type { Profession, Specialist } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
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

        <div className="container" style={{ position: "relative", padding: "64px 22px 52px", textAlign: "center" }}>
          <span className="badge badge-soft" style={{ marginBottom: 18, padding: "7px 16px", fontSize: "0.82rem" }}>
            ✦ {t("Kömek — нужный специалист под любой случай")}
          </span>
          <h1 className="h1" style={{ maxWidth: 860, margin: "0 auto 18px" }}>
            {lang === "kk" ? (
              <>
                <span className="gradient-text">Тойға, мерекеге</span> және үйге маман табыңыз
              </>
            ) : (
              <>
                Найдите специалиста для <span className="gradient-text">тоя, праздника</span> и дома
              </>
            )}
          </h1>
          <p className="lead" style={{ maxWidth: 600, margin: "0 auto 28px" }}>
            {t("Тамада, ведущие, артисты, фотографы — для праздника. Няни, домработницы и водители — для дома. Смотрите видео-визитки и портфолио, связывайтесь напрямую.")}
          </p>
          <HeroActions />

          {/* мини-доверие */}
          <div style={{ display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", marginTop: 34, color: "var(--text-soft)", fontSize: "0.9rem", fontWeight: 600 }}>
            <span>🎯 {t("20+ специальностей")}</span>
            <span>⭐ {t("Отзывы от реальных клиентов")}</span>
            <span>🔒 {t("Контакты — после подтверждения")}</span>
          </div>
        </div>
      </section>

      {/* Топ специалистов — витрина лучших сразу под hero */}
      <TopSpecialists professions={(professions as Profession[]) ?? []} />

      {/* Сезонная подборка — ловим сезонный спрос */}
      <SeasonalPicks professions={(professions as Profession[]) ?? []} month={new Date().getMonth()} />

      {/* ИИ-подбор команды (виден при наличии ANTHROPIC_API_KEY) */}
      <AiMatch professions={(professions as Profession[]) ?? []} />

      {/* Недавно просмотренные */}
      <RecentlyViewed professions={(professions as Profession[]) ?? []} />

      {/* Каталог */}
      <section id="catalog" className="container" style={{ padding: "40px 22px 0" }}>
        <div style={{ marginBottom: 22 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{t("Каталог специалистов")}</h2>
          <p className="soft">{t("Выберите раздел, специальность или просто напишите, что нужно.")}</p>
        </div>
        <Catalog
          professions={(professions as Profession[]) ?? []}
          initialSpecialists={(specialists as unknown as Specialist[]) ?? []}
          initialCount={count ?? 0}
        />
      </section>
    </>
  );
}
