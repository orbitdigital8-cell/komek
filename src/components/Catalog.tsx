"use client";

import { useEffect, useMemo, useState } from "react";
import SpecialistCard from "@/components/SpecialistCard";
import { type Profession, type Segment, type Specialist } from "@/lib/types";

type SegFilter = Segment | "all";

export default function Catalog({
  professions,
  specialists,
}: {
  professions: Profession[];
  specialists: Specialist[];
}) {
  const [seg, setSeg] = useState<SegFilter>("all");
  const [prof, setProf] = useState<string | null>(null);
  const [city, setCity] = useState<string>("");
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [sort, setSort] = useState<"pop" | "new" | "cheap" | "exp">("pop");
  const [minRating, setMinRating] = useState(0);
  const PAGE = 48;
  const [limit, setLimit] = useState(PAGE);

  const profMap = useMemo(() => {
    const m: Record<string, Profession> = {};
    for (const p of professions) m[p.id] = p;
    return m;
  }, [professions]);

  const cities = useMemo(
    () => Array.from(new Set(specialists.map((s) => s.city))).sort(),
    [specialists],
  );

  // Профессии, показываемые чипами — зависят от выбранного раздела
  const visibleProfs = useMemo(
    () => (seg === "all" ? professions : professions.filter((p) => p.segment === seg)),
    [professions, seg],
  );

  // Пул тегов текущего раздела — источник подсказок для поиска
  const tagPool = useMemo(() => {
    const set = new Set<string>();
    for (const s of specialists) {
      if (seg !== "all" && profMap[s.profession]?.segment !== seg) continue;
      s.tags?.forEach((t) => set.add(t));
    }
    return Array.from(set);
  }, [specialists, seg, profMap]);

  // Подсказки: теги, похожие на введённый запрос
  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 1) return [];
    return tagPool
      .filter((t) => t.toLowerCase().includes(needle) && t.toLowerCase() !== needle)
      .slice(0, 6);
  }, [q, tagPool]);

  function pickSegment(next: SegFilter) {
    setSeg(next);
    if (prof && next !== "all" && profMap[prof]?.segment !== next) setProf(null);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = specialists.filter((s) => {
      const p = profMap[s.profession];
      if (seg !== "all" && p?.segment !== seg) return false;
      if (prof && s.profession !== prof) return false;
      if (city && s.city !== city) return false;
      if (minRating && s.rating < minRating) return false;
      if (needle) {
        const hay = `${s.name} ${s.tagline} ${p?.label ?? ""} ${(s.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    const byPrice = (v: number | null) => (v == null ? Number.POSITIVE_INFINITY : v);
    const sorted = [...list];
    if (sort === "pop") sorted.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
    else if (sort === "new") sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    else if (sort === "cheap") sorted.sort((a, b) => byPrice(a.price_from) - byPrice(b.price_from));
    else if (sort === "exp") sorted.sort((a, b) => byPrice(b.price_from) - byPrice(a.price_from));
    return sorted;
  }, [specialists, seg, prof, city, q, minRating, sort, profMap]);

  // Сбрасываем показанное количество при смене фильтров
  useEffect(() => { setLimit(PAGE); }, [seg, prof, city, q, minRating, sort]);

  const segTabs: { key: SegFilter; label: string; emoji: string }[] = [
    { key: "all", label: "Все", emoji: "✦" },
    { key: "toi", label: "Для тоя", emoji: "🎉" },
    { key: "general", label: "Бытовые", emoji: "🏠" },
  ];

  return (
    <div>
      {/* Верхний переключатель разделов */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--surface-2)", borderRadius: 999, marginBottom: 16 }}>
        {segTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => pickSegment(t.key)}
            className="btn btn-sm"
            style={{
              background: seg === t.key ? "var(--surface)" : "transparent",
              color: seg === t.key ? "var(--brand)" : "var(--text-soft)",
              boxShadow: seg === t.key ? "var(--shadow-sm)" : "none",
              fontWeight: 700,
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Фильтр по профессии — переносится по строкам, без горизонтальной прокрутки */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button className={`chip ${!prof ? "chip-active" : ""}`} onClick={() => setProf(null)}>
          Все специальности
        </button>
        {visibleProfs.map((p) => (
          <button key={p.id} className={`chip ${prof === p.id ? "chip-active" : ""}`} onClick={() => setProf(p.id)}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      {/* Поиск (с подсказками по тегам) + город + сортировка */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <input
            className="input"
            placeholder="Что нужно? Например: тамада на казахском, фотограф с дроном…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ width: "100%" }}
          />
          {focused && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 30,
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow)",
                overflow: "hidden",
              }}
            >
              {suggestions.map((t) => (
                <button
                  key={t}
                  onMouseDown={(e) => { e.preventDefault(); setQ(t); setFocused(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 13px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "0.92rem",
                    color: "var(--text)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="muted">🔎</span> {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <select className="select" value={city} onChange={(e) => setCity(e.target.value)} style={{ flex: "0 1 170px" }}>
          <option value="">Все города</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="select" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} style={{ flex: "0 1 150px" }}>
          <option value={0}>Любой рейтинг</option>
          <option value={4}>★ 4.0 и выше</option>
          <option value={4.5}>★ 4.5 и выше</option>
          <option value={4.8}>★ 4.8 и выше</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ flex: "0 1 190px" }}>
          <option value="pop">Популярные</option>
          <option value="new">Новые</option>
          <option value="cheap">Сначала дешевле</option>
          <option value="exp">Сначала дороже</option>
        </select>
      </div>

      <div className="muted" style={{ fontSize: "0.9rem", marginBottom: 14 }}>
        Найдено: {filtered.length}
      </div>

      {filtered.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-mute)" }}>
          Ничего не найдено. Попробуйте изменить фильтры.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
            {filtered.slice(0, limit).map((s) => (
              <SpecialistCard key={s.id} s={s} prof={profMap[s.profession]} />
            ))}
          </div>
          {filtered.length > limit && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button className="btn btn-outline" onClick={() => setLimit((l) => l + PAGE)}>
                Показать ещё ({filtered.length - limit})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
