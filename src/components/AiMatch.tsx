"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import SpecialistCard from "@/components/SpecialistCard";
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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => {});
  }, []);

  if (!enabled) return null;

  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true); setErr(null); setIntro(""); setPicks([]); setCards([]);
    try {
      const r = await fetch("/api/ai/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
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
  }

  const reasonById: Record<string, string> = {};
  for (const p of picks) reasonById[p.id] = p.reason;

  return (
    <section className="container" style={{ padding: "36px 22px 0" }}>
      <div className="card card-pad" style={{ background: "linear-gradient(135deg, var(--surface) 60%, #f3ecff)" }}>
        <h2 className="h2" style={{ fontSize: "1.25rem", marginBottom: 4 }}>✨ {t("ИИ-подбор команды")}</h2>
        <p className="soft" style={{ marginBottom: 12, fontSize: "0.92rem" }}>
          {t("Опишите событие своими словами — соберём подходящую команду из каталога.")}
        </p>
        <form onSubmit={run} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder={t("Например: кыз узату на 80 гостей в Шымкенте, бюджет 500 000 ₸")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: "1 1 320px" }}
          />
          <button className="btn btn-primary" disabled={busy || !q.trim()}>
            {busy ? t("Подбираем…") : t("Подобрать")}
          </button>
        </form>

        {err && <div className="badge badge-declined" style={{ marginTop: 12 }}>{err}</div>}
        {intro && <p style={{ marginTop: 14, marginBottom: 0, lineHeight: 1.55 }}>{intro}</p>}
        {cards.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginTop: 16 }}>
            {cards.map((s) => (
              <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <SpecialistCard s={s} prof={profMap[s.profession]} />
                {reasonById[s.id] && <span className="muted" style={{ fontSize: "0.82rem", padding: "0 4px" }}>💡 {reasonById[s.id]}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
