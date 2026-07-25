import Link from "next/link";
import { cookies } from "next/headers";
import Stars from "@/components/Stars";
import CompareVote from "@/components/CompareVote";
import { supabaseServer } from "@/lib/supabase/server";
import { makeT, priceLabelL, profName, yearsLabel, type Lang } from "@/lib/i18n";
import type { Profession, Specialist } from "@/lib/types";

export const dynamic = "force-dynamic";

// Публичная страница сравнения — для шаринга подборки с семьёй/друзьями
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids: idsRaw } = await searchParams;
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
  const ids = (idsRaw ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 8);

  if (!ids.length) {
    return (
      <div className="container-narrow" style={{ padding: "48px 22px", textAlign: "center" }}>
        <h1 className="h2">{t("Подборка пуста")}</h1>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 12 }}>{t("В каталог")}</Link>
      </div>
    );
  }

  const sb = await supabaseServer();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: sp }, { data: profs }, { data: busy }] = await Promise.all([
    sb.from("specialists").select("*").in("id", ids),
    sb.from("professions").select("*"),
    sb.from("specialist_busy").select("specialist_id, busy_date").in("specialist_id", ids).gte("busy_date", today),
  ]);
  const list = ((sp as Specialist[]) ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  const profMap: Record<string, Profession> = {};
  for (const p of (profs as Profession[]) ?? []) profMap[p.id] = p;
  const busyCount: Record<string, number> = {};
  for (const b of (busy as { specialist_id: string }[]) ?? []) busyCount[b.specialist_id] = (busyCount[b.specialist_id] ?? 0) + 1;

  const label = (text: string) => (
    <div style={{ padding: "12px 14px", fontWeight: 650, color: "var(--text-soft)", fontSize: "0.86rem", position: "sticky", left: 0, background: "var(--surface-2)", zIndex: 1 }}>{text}</div>
  );
  const cell = (content: React.ReactNode, i: number) => (
    <div key={i} style={{ padding: "12px 14px", background: "var(--surface)" }}>{content}</div>
  );
  const row = (labelText: string, render: (s: Specialist) => React.ReactNode) => (
    <>
      {label(labelText)}
      {list.map((s, i) => cell(render(s), i))}
    </>
  );

  return (
    <div className="container" style={{ padding: "28px 22px 40px" }}>
      <h1 className="h2" style={{ marginBottom: 6 }}>{t("Подборка специалистов")}</h1>
      <p className="soft" style={{ marginBottom: 20 }}>{t("Этой подборкой с вами поделились. Отметьте, кто нравится — и обсудите выбор вместе.")}</p>

      <CompareVote specialists={list.map((s) => ({ id: s.id, name: s.name }))} />


      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)" }}>
        <div className="compare-grid" style={{ display: "grid", gridTemplateColumns: `160px repeat(${list.length}, minmax(210px, 1fr))`, minWidth: "fit-content", ...({ "--n": list.length } as React.CSSProperties) }}>
          {label("")}
          {list.map((s) => (
            <div key={s.id} style={{ padding: "16px 14px", textAlign: "center", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.avatar_url} alt={s.name} className="avatar" style={{ width: 64, height: 64, margin: "0 auto 8px" }} />
              <Link href={`/s/${s.id}`} className="link" style={{ fontSize: "0.98rem" }}>{s.name}</Link>
            </div>
          ))}

          {row(t("Специальность"), (s) => <span className="badge badge-soft">{profMap[s.profession]?.emoji} {profName(profMap[s.profession], lang) || s.profession}</span>)}
          {row(t("Рейтинг"), (s) => <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Stars rating={s.rating} />{s.review_count > 0 && <span className="muted" style={{ fontSize: "0.78rem" }}>({s.review_count})</span>}</span>)}
          {row(t("Цена"), (s) => <strong style={{ color: "var(--brand)" }}>{priceLabelL(s.price_from, lang)}</strong>)}
          {row(t("Стаж"), (s) => <span>{yearsLabel(s.experience_years, lang)}</span>)}
          {row(t("Город"), (s) => <span>📍 {t(s.city)}</span>)}
          {row(t("Видео-визитка"), (s) => (s.video_url ? <span style={{ color: "var(--good)" }}>▶ {t("есть")}</span> : <span className="muted">—</span>))}
          {row(t("Занятость"), (s) => (busyCount[s.id] ? <span style={{ color: "var(--bad)" }}>{busyCount[s.id]} {t("занятых дат")}</span> : <span style={{ color: "var(--good)" }}>{t("свободен")}</span>))}

          {label("")}
          {list.map((s) => (
            <div key={s.id} style={{ padding: "14px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
              <Link href={`/s/${s.id}`} className="btn btn-primary btn-sm btn-block">{t("Открыть и запросить")}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
