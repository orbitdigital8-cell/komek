"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { profName, priceLabelL } from "@/lib/i18n";
import Stars from "@/components/Stars";
import { loyaltyLevel, type Profession, type Specialist } from "@/lib/types";

const CARD_COLS =
  "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count";

// Конструктор команды: убрать участника, заменить на другого (дешевле/дороже),
// видеть итоговый бюджет. Начальный состав — из ИИ-подбора.
export default function TeamBuilder({ initial, professions, reasonById }: {
  initial: Specialist[];
  professions: Record<string, Profession>;
  reasonById: Record<string, string>;
}) {
  const sb = supabaseBrowser();
  const { lang, t } = useLang();
  const [team, setTeam] = useState<Specialist[]>(initial);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [alts, setAlts] = useState<Specialist[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const total = team.reduce((s, x) => s + (x.price_from ?? 0), 0);
  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

  function remove(id: string) {
    setTeam((cur) => cur.filter((x) => x.id !== id));
    if (replacing === id) setReplacing(null);
  }

  async function openReplace(member: Specialist) {
    if (replacing === member.id) { setReplacing(null); return; }
    setReplacing(member.id);
    setLoadingAlts(true);
    const inTeam = team.map((x) => x.id);
    const { data } = await sb
      .from("specialists")
      .select(CARD_COLS)
      .eq("published", true)
      .eq("profession", member.profession)
      .not("id", "in", `(${inTeam.join(",")})`)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(8);
    setAlts((data as unknown as Specialist[]) ?? []);
    setLoadingAlts(false);
  }

  function replaceWith(oldId: string, next: Specialist) {
    setTeam((cur) => cur.map((x) => (x.id === oldId ? next : x)));
    setReplacing(null);
    setAlts([]);
  }

  if (team.length === 0) {
    return <div className="card card-pad muted" style={{ marginTop: 16 }}>{t("Команда пуста — уберите фильтры или запросите подбор заново.")}</div>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Итоговая панель бюджета */}
      <div className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14, background: "linear-gradient(135deg, var(--surface) 60%, #eef7ee)" }}>
        <div>
          <strong style={{ fontSize: "1.05rem" }}>{t("Ваша команда")}: {team.length}</strong>
          <div className="soft" style={{ fontSize: "0.85rem" }}>{t("Можно убрать или заменить любого — бюджет пересчитается")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="muted" style={{ fontSize: "0.8rem" }}>{t("Итого от")}</div>
          <strong style={{ fontSize: "1.4rem", color: "var(--brand)" }}>{fmt(total)}</strong>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {team.map((m) => {
          const p = professions[m.profession];
          const lvl = loyaltyLevel(m.orders_count);
          return (
            <div key={m.id} className="card card-pad">
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.avatar_url} alt="" className="avatar" style={{ width: 52, height: 52 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-soft">{p?.emoji} {profName(p, lang)}</span>
                    <Link href={`/s/${m.id}`} className="link" style={{ fontWeight: 700 }}>{m.name}</Link>
                    {lvl && <span title={t(lvl.label)}>{lvl.emoji}</span>}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Stars rating={m.rating} />{m.review_count > 0 && <span className="muted" style={{ fontSize: "0.76rem" }}>({m.review_count})</span>}</span>
                  </div>
                  <div className="soft" style={{ fontSize: "0.85rem", marginTop: 2 }}>📍 {t(m.city)} · <strong style={{ color: "var(--brand)" }}>{priceLabelL(m.price_from, lang)}</strong></div>
                  {reasonById[m.id] && <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>💡 {reasonById[m.id]}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openReplace(m)}>⇄ {t("Заменить")}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(m.id)} title={t("Убрать")}>✕</button>
                </div>
              </div>

              {/* Альтернативы для замены — той же профессии */}
              {replacing === m.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 8 }}>{t("Замена — тот же профиль, выберите по цене и рейтингу:")}</div>
                  {loadingAlts ? (
                    <div className="muted">{t("Загрузка…")}</div>
                  ) : alts.length === 0 ? (
                    <div className="muted">{t("Других специалистов этой профессии не найдено.")}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {alts.map((a) => (
                        <button key={a.id} onClick={() => replaceWith(m.id, a)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", textAlign: "left" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.avatar_url} alt="" className="avatar" style={{ width: 38, height: 38 }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontWeight: 600, fontSize: "0.9rem" }}>{a.name}</span>
                            <span className="muted" style={{ fontSize: "0.78rem" }}>📍 {t(a.city)} · ★ {a.rating.toFixed(1)} ({a.review_count})</span>
                          </span>
                          <strong style={{ color: "var(--brand)", fontSize: "0.9rem", whiteSpace: "nowrap" }}>{priceLabelL(a.price_from, lang)}</strong>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
