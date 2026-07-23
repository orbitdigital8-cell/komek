import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SpecialistCard from "@/components/SpecialistCard";
import { supabaseServer } from "@/lib/supabase/server";
import { makeT, profName, type Lang } from "@/lib/i18n";
import type { Profession, Specialist } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { prof: string };
type Search = { city?: string };

// SEO-метаданные: «Тамада в Алматы — анкеты, цены, отзывы | Kömek»
export async function generateMetadata({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }): Promise<Metadata> {
  const { prof } = await params;
  const { city } = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from("professions").select("*").eq("id", prof).maybeSingle();
  const p = data as Profession | null;
  if (!p) return {};
  const where = city ? ` в ${city}` : " в Казахстане";
  return {
    title: `${p.label}${where} — анкеты, цены, отзывы | Kömek`,
    description: `${p.label}${where}: проверенные анкеты с фото, видео-визитками, отзывами и ценами. Контакты открываются после подтверждения специалистом.`,
  };
}

export default async function ProfessionPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const { prof } = await params;
  const { city } = await searchParams;
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
  const sb = await supabaseServer();

  const { data: profData } = await sb.from("professions").select("*").eq("id", prof).maybeSingle();
  const p = profData as Profession | null;
  if (!p) notFound();

  let q = sb
    .from("specialists")
    .select(
      "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count",
      { count: "exact" },
    )
    .eq("published", true)
    .eq("profession", prof)
    .order("rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(60);
  if (city) q = q.eq("city", city);
  const { data: spData, count } = await q;
  const list = (spData as unknown as Specialist[]) ?? [];

  // Города для перелинковки
  const { data: cityData } = await sb.from("specialists").select("city").eq("published", true).eq("profession", prof);
  const cities = Array.from(new Set(((cityData as { city: string }[]) ?? []).map((r) => r.city))).sort().slice(0, 12);

  const title = `${p.emoji} ${profName(p, lang)}${city ? ` — ${t(city)}` : ""}`;

  return (
    <div className="container" style={{ padding: "32px 22px 40px" }}>
      <Link href="/" className="link" style={{ fontSize: "0.9rem" }}>← {t("Каталог")}</Link>
      <h1 className="h2" style={{ margin: "10px 0 4px" }}>{title}</h1>
      <p className="soft" style={{ marginBottom: 16 }}>
        {t("Найдено:")} {count ?? list.length} · {t("Контакты — после подтверждения")}
      </p>

      {cities.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
          <Link href={`/c/${prof}`} className={`chip ${!city ? "chip-active" : ""}`}>{t("Все города")}</Link>
          {cities.map((c) => (
            <Link key={c} href={`/c/${prof}?city=${encodeURIComponent(c)}`} className={`chip ${city === c ? "chip-active" : ""}`}>
              {t(c)}
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-mute)" }}>
          {t("Ничего не найдено. Попробуйте изменить фильтры.")}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          {list.map((s) => (
            <SpecialistCard key={s.id} s={s} prof={p ?? undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
