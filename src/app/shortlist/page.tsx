"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useShortlist } from "@/lib/shortlist";
import { useLang } from "@/lib/lang";
import { priceLabelL, profName, yearsLabel } from "@/lib/i18n";
import Stars from "@/components/Stars";
import type { Profession, Specialist } from "@/lib/types";

export default function ShortlistPage() {
  const sb = supabaseBrowser();
  const { lang, t } = useLang();
  const { ids, ready, remove, clear } = useShortlist();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [profMap, setProfMap] = useState<Record<string, Profession>>({});
  const [busyCount, setBusyCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (ids.length === 0) {
      setSpecialists([]);
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: sp }, { data: profs }, { data: busy }] = await Promise.all([
      sb.from("specialists").select("*").in("id", ids),
      sb.from("professions").select("*"),
      sb.from("specialist_busy").select("specialist_id, busy_date").in("specialist_id", ids).gte("busy_date", today),
    ]);
    const list = (sp as Specialist[]) ?? [];
    // сохраняем порядок добавления
    list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    setSpecialists(list);
    const pm: Record<string, Profession> = {};
    for (const p of (profs as Profession[]) ?? []) pm[p.id] = p;
    setProfMap(pm);
    const bc: Record<string, number> = {};
    for (const b of (busy as { specialist_id: string }[]) ?? []) bc[b.specialist_id] = (bc[b.specialist_id] ?? 0) + 1;
    setBusyCount(bc);
    setLoading(false);
  }, [sb, ids]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const cols = specialists.length;
  const gridCols = useMemo(() => `160px repeat(${cols}, minmax(210px, 1fr))`, [cols]);

  if (!ready || loading) return <div className="container" style={{ padding: 48 }} />;

  if (ids.length === 0 || specialists.length === 0) {
    return (
      <div className="container-narrow" style={{ padding: "48px 22px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>❤️</div>
        <h1 className="h2" style={{ marginBottom: 8 }}>{t("Избранное пусто")}</h1>
        <p className="soft" style={{ marginBottom: 18 }}>
          {t("Добавляйте специалистов кнопкой ❤ в каталоге — здесь их можно сравнить бок о бок и выбрать лучшего.")}
        </p>
        <Link href="/" className="btn btn-primary">{t("В каталог")}</Link>
      </div>
    );
  }

  // Ячейка-значение
  const cell = (content: React.ReactNode, i: number) => (
    <div key={i} style={{ padding: "12px 14px", background: "var(--surface)" }}>{content}</div>
  );
  const label = (text: string) => (
    <div style={{ padding: "12px 14px", fontWeight: 650, color: "var(--text-soft)", fontSize: "0.86rem", position: "sticky", left: 0, background: "var(--surface-2)", zIndex: 1 }}>{text}</div>
  );

  return (
    <div className="container" style={{ padding: "28px 22px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <h1 className="h2" style={{ margin: 0 }}>{t("Избранное и сравнение")}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <ShareButton ids={ids} />
          <button onClick={clear} className="btn btn-ghost btn-sm">{t("Очистить всё")}</button>
        </div>
      </div>
      <p className="soft" style={{ marginBottom: 20 }}>{t("Сравните выбранных специалистов и выберите лучшего.")}</p>

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)" }}>
        <div style={{ display: "grid", gridTemplateColumns: gridCols, minWidth: "fit-content" }}>
          {/* Шапка: карточки специалистов */}
          {label("")}
          {specialists.map((s, i) => (
            <div key={s.id} style={{ padding: "16px 14px", textAlign: "center", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => remove(s.id)} title={t("Убрать")} style={{ position: "absolute", top: -6, right: 4, border: "none", background: "var(--surface-2)", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", color: "var(--text-mute)" }}>×</button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.avatar_url} alt={s.name} className="avatar" style={{ width: 64, height: 64, margin: "0 auto 8px" }} />
              </div>
              <Link href={`/s/${s.id}`} className="link" style={{ fontSize: "0.98rem" }}>{s.name}</Link>
            </div>
          ))}

          {/* Строки-характеристики */}
          {row(t("Специальность"), specialists, (s) => <span className="badge badge-soft">{profMap[s.profession]?.emoji} {profName(profMap[s.profession], lang) || s.profession}</span>, label, cell)}
          {row(t("Рейтинг"), specialists, (s) => <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Stars rating={s.rating} />{s.review_count > 0 && <span className="muted" style={{ fontSize: "0.78rem" }}>({s.review_count})</span>}</span>, label, cell)}
          {row(t("Цена"), specialists, (s) => <strong style={{ color: "var(--brand)" }}>{priceLabelL(s.price_from, lang)}</strong>, label, cell)}
          {row(t("Стаж"), specialists, (s) => <span>{yearsLabel(s.experience_years, lang)}</span>, label, cell)}
          {row(t("Город"), specialists, (s) => <span>📍 {t(s.city)}</span>, label, cell)}
          {row(t("Видео-визитка"), specialists, (s) => (s.video_url ? <span style={{ color: "var(--good)" }}>▶ {t("есть")}</span> : <span className="muted">—</span>), label, cell)}
          {row(t("Занятость"), specialists, (s) => (busyCount[s.id] ? <span style={{ color: "var(--bad)" }}>{busyCount[s.id]} {t("занятых дат")}</span> : <span style={{ color: "var(--good)" }}>{t("свободен")}</span>), label, cell)}
          {row(t("Особенности"), specialists, (s) => (
            <span style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {s.tags.slice(0, 4).map((tg) => (
                <span key={tg} style={{ fontSize: "0.72rem", color: "var(--text-mute)", background: "var(--surface-2)", padding: "2px 8px", borderRadius: 999 }}>#{t(tg)}</span>
              ))}
            </span>
          ), label, cell)}

          {/* Действия */}
          {label("")}
          {specialists.map((s) => (
            <div key={s.id} style={{ padding: "14px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
              <Link href={`/s/${s.id}`} className="btn btn-primary btn-sm btn-block">{t("Открыть и запросить")}</Link>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link href="/" className="link">{t("← Добавить ещё из каталога")}</Link>
      </div>
    </div>
  );
}

// Поделиться подборкой: системный share на телефоне, иначе — копия ссылки
function ShareButton({ ids }: { ids: string[] }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/compare?ids=${ids.join(",")}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Kömek", url }); return; } catch { /* отменили */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={share} className="btn btn-outline btn-sm">
      {copied ? `✓ ${t("Ссылка скопирована")}` : `🔗 ${t("Поделиться подборкой")}`}
    </button>
  );
}

// Хелпер строки сравнения: подпись + ячейка на каждого специалиста
function row(
  labelText: string,
  specialists: Specialist[],
  render: (s: Specialist) => React.ReactNode,
  label: (t: string) => React.ReactNode,
  cell: (c: React.ReactNode, i: number) => React.ReactNode,
) {
  return (
    <>
      {label(labelText)}
      {specialists.map((s, i) => cell(render(s), i))}
    </>
  );
}
