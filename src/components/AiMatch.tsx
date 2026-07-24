"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import TeamBuilder from "@/components/TeamBuilder";
import { useLang } from "@/lib/lang";
import type { Profession, Specialist } from "@/lib/types";

type Pick_ = { id: string; reason: string };

// ИИ-подбор команды на той: описал задачу — получил готовый состав
export default function AiMatch({ professions }: { professions: Profession[] }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [enabled, setEnabled] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState("");
  const [picks, setPicks] = useState<Pick_[]>([]);
  const [cards, setCards] = useState<Specialist[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => {});
  }, []);

  // Достаём бюджет из текста запроса («150 000 ₸», «500к», «бюджет 300000»)
  function parseBudget(text: string): number | null {
    const t = text.toLowerCase();
    let m = t.replace(/\s/g, "").match(/(\d+)(к|тыс)/);
    if (m) return parseInt(m[1], 10) * 1000;
    m = t.match(/бюджет[^\d]*([\d\s]{4,})/) || t.match(/([\d\s]{4,})\s*(₸|тг|тенге)/);
    if (m) { const n = parseInt(m[1].replace(/\s/g, ""), 10); if (n >= 1000) return n; }
    return null;
  }

  const runQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setBudget(parseBudget(query));
    setBusy(true); setErr(null); setIntro(""); setPicks([]); setCards([]);
    try {
      const r = await fetch("/api/ai/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "error");
      setIntro(d.intro ?? "");
      setPicks(d.picks ?? []);
      const ids = (d.picks ?? []).map((p: Pick_) => p.id);
      if (ids.length) {
        const { data } = await sb
          .from("specialists")
          .select("id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count")
          .in("id", ids);
        const list = (data as unknown as Specialist[]) ?? [];
        list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        setCards(list);
      }
    } catch {
      setErr(t("Не получилось подобрать — попробуйте ещё раз."));
    }
    setBusy(false);
  }, [sb, t]);

  function run(e: React.FormEvent) { e.preventDefault(); runQuery(q); }

  // Автозапуск: пришли из калькулятора с готовым запросом
  useEffect(() => {
    if (!enabled) return;
    try {
      const pre = sessionStorage.getItem("komek_ai_query");
      if (pre) { sessionStorage.removeItem("komek_ai_query"); setQ(pre); runQuery(pre); }
    } catch { /* ignore */ }
  }, [enabled, runQuery]);

  if (!enabled) return null;

  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  const reasonById: Record<string, string> = {};
  for (const p of picks) reasonById[p.id] = p.reason;

  return (
    <section className="container" style={{ padding: "36px 22px 0" }}>
      <div className="card card-pad" style={{ background: "linear-gradient(135deg, var(--surface) 60%, #f3ecff)" }}>
        <h2 className="h2" style={{ fontSize: "1.25rem", marginBottom: 4 }}>✨ {t("ИИ-подбор команды")}</h2>
        <p className="soft" style={{ marginBottom: 12, fontSize: "0.92rem" }}>
          {t("Напишите, что за праздник и сколько денег — соберём команду. Или нажмите готовый пример ниже.")}
        </p>
        <form onSubmit={run} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder={t("Например: свадьба на 150 гостей, бюджет 500 000 ₸")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: "1 1 320px" }}
          />
          <button className="btn btn-primary" disabled={busy || !q.trim()}>
            {busy ? t("Подбираем…") : t("Подобрать")}
          </button>
        </form>

        {/* Готовые примеры — клик сразу подбирает */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
          <span className="muted" style={{ fontSize: "0.82rem", alignSelf: "center" }}>{t("Примеры:")}</span>
          {[
            t("Тамада на той, бюджет 150 000 ₸"),
            t("Фотограф и видео на свадьбу"),
            t("Команда на той на 100 гостей, бюджет 500 000 ₸"),
            t("Аниматор на детский праздник"),
          ].map((ex) => (
            <button key={ex} type="button" disabled={busy} className="chip" style={{ fontSize: "0.82rem" }}
              onClick={() => { setQ(ex); runQuery(ex); }}>
              {ex}
            </button>
          ))}
        </div>

        {err && <div className="badge badge-declined" style={{ marginTop: 12 }}>{err}</div>}
        {intro && <p style={{ marginTop: 14, marginBottom: 0, lineHeight: 1.55 }}>{intro}</p>}
        {cards.length > 0 && (
          <TeamBuilder key={cards.map((c) => c.id).join(",")} initial={cards} professions={profMap} reasonById={reasonById} budget={budget} />
        )}
      </div>
    </section>
  );
}
