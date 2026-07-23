"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SpecialistCard from "@/components/SpecialistCard";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { profName } from "@/lib/i18n";
import { type Profession, type Segment, type Specialist } from "@/lib/types";

type SegFilter = Segment | "all";

// Поля карточки — без тяжёлого «about» в выдаче
const CARD_COLS =
  "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count";

const PAGE = 48;

export default function Catalog({
  professions,
  initialSpecialists,
  initialCount,
}: {
  professions: Profession[];
  initialSpecialists: Specialist[];
  initialCount: number;
}) {
  const sb = supabaseBrowser();
  const { lang, t } = useLang();
  const [seg, setSeg] = useState<SegFilter>("all");
  const [prof, setProf] = useState<string | null>(null);
  const [city, setCity] = useState<string>("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState(""); // отложенный (debounce) текст поиска
  const [date, setDate] = useState(""); // фильтр «свободен на дату»
  const [focused, setFocused] = useState(false);
  const [sort, setSort] = useState<"pop" | "new" | "cheap" | "exp">("pop");
  const [minRating, setMinRating] = useState(0);
  const [limit, setLimit] = useState(PAGE);

  // Данные с сервера (пагинация и фильтры — на стороне Supabase)
  const [rows, setRows] = useState<Specialist[]>(initialSpecialists);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Лёгкие справочники для фильтров/подсказок: города и пул тегов
  const [cities, setCities] = useState<string[]>([]);
  const [tagPool, setTagPool] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await sb.from("specialists").select("city, tags").eq("published", true);
      const cs = new Set<string>();
      const tg = new Set<string>();
      for (const r of (data as { city: string; tags: string[] }[]) ?? []) {
        cs.add(r.city);
        r.tags?.forEach((x) => tg.add(x));
      }
      setCities(Array.from(cs).sort());
      setTagPool(Array.from(tg));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profMap = useMemo(() => {
    const m: Record<string, Profession> = {};
    for (const p of professions) m[p.id] = p;
    return m;
  }, [professions]);

  const visibleProfs = useMemo(
    () => (seg === "all" ? professions : professions.filter((p) => p.segment === seg)),
    [professions, seg],
  );

  // Подсказки: теги, похожие на введённый запрос
  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 1) return [];
    return tagPool
      .filter((x) => x.toLowerCase().includes(needle) && x.toLowerCase() !== needle)
      .slice(0, 6);
  }, [q, tagPool]);

  function pickSegment(next: SegFilter) {
    setSeg(next);
    if (prof && next !== "all" && profMap[prof]?.segment !== next) setProf(null);
  }

  // Debounce поиска, чтобы не дёргать сервер на каждый символ
  useEffect(() => {
    const id = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Сбрасываем страницу при смене фильтров
  useEffect(() => { setLimit(PAGE); }, [seg, prof, city, dq, minRating, sort, date]);

  // Первый рендер уже пришёл с сервера — не перезапрашиваем те же данные
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) { didInit.current = true; return; }
    let cancelled = false;
    (async () => {
      setLoading(true);

      // «Свободен на дату»: исключаем занятых в выбранный день
      let busyIds: string[] = [];
      if (date) {
        const { data: busy } = await sb.from("specialist_busy").select("specialist_id").eq("busy_date", date);
        busyIds = ((busy as { specialist_id: string }[]) ?? []).map((b) => b.specialist_id);
      }

      let query = sb.from("specialists").select(CARD_COLS, { count: "exact" }).eq("published", true);

      const profIds = prof ? [prof] : seg !== "all" ? professions.filter((p) => p.segment === seg).map((p) => p.id) : null;
      if (profIds) query = query.in("profession", profIds);
      if (city) query = query.eq("city", city);
      if (minRating) query = query.gte("rating", minRating);

      const needle = dq.trim().toLowerCase();
      if (needle) {
        const esc = needle.replace(/[%_,()]/g, " ").trim(); // спецсимволы PostgREST-фильтра
        const ors = [`name.ilike.%${esc}%`, `tagline.ilike.%${esc}%`, `about.ilike.%${esc}%`];
        // Совпадение по названию профессии (рус/каз) → фильтр по profession
        const profMatch = professions
          .filter((p) => `${p.label} ${p.label_kk ?? ""}`.toLowerCase().includes(needle))
          .map((p) => p.id);
        if (profMatch.length) ors.push(`profession.in.(${profMatch.join(",")})`);
        query = query.or(ors.join(","));
      }

      if (busyIds.length) query = query.not("id", "in", `(${busyIds.join(",")})`);

      if (sort === "pop") query = query.order("rating", { ascending: false }).order("review_count", { ascending: false });
      else if (sort === "new") query = query.order("created_at", { ascending: false });
      else if (sort === "cheap") query = query.order("price_from", { ascending: true, nullsFirst: false });
      else query = query.order("price_from", { ascending: false, nullsFirst: false });

      const { data, count: total } = await query.range(0, limit - 1);
      if (cancelled) return;
      setRows((data as unknown as Specialist[]) ?? []);
      setCount(total ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, prof, city, dq, minRating, sort, date, limit]);

  const segTabs: { key: SegFilter; label: string; emoji: string }[] = [
    { key: "all", label: t("Все"), emoji: "✦" },
    { key: "toi", label: t("Для тоя"), emoji: "🎉" },
    { key: "general", label: t("Бытовые"), emoji: "🏠" },
  ];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Верхний переключатель разделов */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--surface-2)", borderRadius: 999, marginBottom: 16 }}>
        {segTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => pickSegment(s.key)}
            className="btn btn-sm"
            style={{
              background: seg === s.key ? "var(--surface)" : "transparent",
              color: seg === s.key ? "var(--brand)" : "var(--text-soft)",
              boxShadow: seg === s.key ? "var(--shadow-sm)" : "none",
              fontWeight: 700,
            }}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Фильтр по профессии — переносится по строкам, без горизонтальной прокрутки */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <button className={`chip ${!prof ? "chip-active" : ""}`} onClick={() => setProf(null)}>
          {t("Все специальности")}
        </button>
        {visibleProfs.map((p) => (
          <button key={p.id} className={`chip ${prof === p.id ? "chip-active" : ""}`} onClick={() => setProf(p.id)}>
            {p.emoji} {profName(p, lang)}
          </button>
        ))}
      </div>

      {/* Поиск (с подсказками по тегам) + город + рейтинг + сортировка */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <input
            className="input"
            placeholder={t("Что нужно? Например: тамада на казахском, фотограф с дроном…")}
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
              {suggestions.map((sg) => (
                <button
                  key={sg}
                  onMouseDown={(e) => { e.preventDefault(); setQ(sg); setFocused(false); }}
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
                  <span className="muted">🔎</span> {t(sg)}
                </button>
              ))}
            </div>
          )}
        </div>
        <select className="select" value={city} onChange={(e) => setCity(e.target.value)} style={{ flex: "0 1 170px" }}>
          <option value="">{t("Все города")}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {t(c)}
            </option>
          ))}
        </select>
        <select className="select" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} style={{ flex: "0 1 150px" }}>
          <option value={0}>{t("Любой рейтинг")}</option>
          <option value={4}>{t("★ 4.0 и выше")}</option>
          <option value={4.5}>{t("★ 4.5 и выше")}</option>
          <option value={4.8}>{t("★ 4.8 и выше")}</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ flex: "0 1 190px" }}>
          <option value="pop">{t("Популярные")}</option>
          <option value="new">{t("Новые")}</option>
          <option value="cheap">{t("Сначала дешевле")}</option>
          <option value="exp">{t("Сначала дороже")}</option>
        </select>
      </div>

      {/* Свободен на дату */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <span className="soft" style={{ fontSize: "0.9rem", fontWeight: 600 }}>📅 {t("Свободны на дату:")}</span>
        <input
          className="input"
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ flex: "0 1 170px", padding: "8px 12px" }}
        />
        {date && (
          <button className="btn btn-ghost btn-sm" onClick={() => setDate("")}>
            ✕ {t("Сбросить дату")}
          </button>
        )}
        {date && (
          <span className="badge badge-accepted">{t("Показаны только свободные в этот день")}</span>
        )}
      </div>

      <div className="muted" style={{ fontSize: "0.9rem", marginBottom: 14 }}>
        {t("Найдено:")} {count}{loading ? " …" : ""}
      </div>

      {rows.length === 0 && !loading ? (
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--text-mute)" }}>
          {t("Ничего не найдено. Попробуйте изменить фильтры.")}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18, opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            {rows.map((s) => (
              <SpecialistCard key={s.id} s={s} prof={profMap[s.profession]} />
            ))}
          </div>
          {count > rows.length && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button className="btn btn-outline" disabled={loading} onClick={() => setLimit((l) => l + PAGE)}>
                {t("Показать ещё")} ({count - rows.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
