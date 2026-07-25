"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import { profName, priceLabelL } from "@/lib/i18n";
import SpecialistCard from "@/components/SpecialistCard";
import type { Profession, Specialist } from "@/lib/types";

const CARD_COLS =
  "id, profession, name, city, tagline, price_from, experience_years, rating, review_count, tags, gallery, avatar_url, video_url, verified, response_minutes, response_count, last_seen, orders_count";

// Конструктор команды: убрать участника, заменить на другого (дешевле/дороже),
// видеть итоговый бюджет. Начальный состав — из ИИ-подбора.
export default function TeamBuilder({ initial, professions, reasonById, budget }: {
  initial: Specialist[];
  professions: Record<string, Profession>;
  reasonById: Record<string, string>;
  budget?: number | null;
}) {
  const sb = supabaseBrowser();
  const { user, role, name } = useAuth();
  const router = useRouter();
  const { lang, t } = useLang();
  const [team, setTeam] = useState<Specialist[]>(initial);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [alts, setAlts] = useState<Specialist[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);

  const total = team.reduce((s, x) => s + (x.price_from ?? 0), 0);
  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₸";
  const replacingMember = team.find((m) => m.id === replacing) ?? null;
  const over = budget && total > budget ? total - budget : 0; // превышение бюджета

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

  // Запросить контакты у всей команды — по одному запросу каждому специалисту
  async function requestAll() {
    if (!user) { router.push("/login?next=/match"); return; }
    setSending(true);
    let ok = 0;
    for (const m of team) {
      const { error } = await sb.from("contact_requests").upsert(
        { specialist_id: m.id, client_id: user.id, client_name: name || "Заказчик", client_phone: "", message: t("Собираю команду на той через ИИ-подбор Kömek.") },
        { onConflict: "specialist_id,client_id" },
      ).select("id").single();
      if (!error) {
        ok++;
        // уведомление специалисту (все его каналы + кабинет)
        const { data } = await sb.from("contact_requests").select("id").eq("specialist_id", m.id).eq("client_id", user.id).maybeSingle();
        if (data) fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "request", id: (data as { id: string }).id }) }).catch(() => {});
      }
    }
    setSent(ok);
    setSending(false);
  }

  if (team.length === 0) {
    return <div className="card card-pad muted" style={{ marginTop: 16 }}>{t("Команда пуста — уберите фильтры или запросите подбор заново.")}</div>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Итоговая панель бюджета */}
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14, background: "linear-gradient(135deg, var(--surface) 60%, #eef7ee)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <strong style={{ fontSize: "1.05rem" }}>{t("Ваша команда")}: {team.length}</strong>
            <div className="soft" style={{ fontSize: "0.85rem" }}>{t("Можно убрать или заменить любого — бюджет пересчитается")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted" style={{ fontSize: "0.8rem" }}>{budget ? `${t("Ваш бюджет")}: ${fmt(budget)}` : t("Итого от")}</div>
            <strong style={{ fontSize: "1.4rem", color: over > 0 ? "var(--bad)" : "var(--brand)" }}>{fmt(total)}</strong>
          </div>
        </div>

        {/* Превышение бюджета — понятная подсказка что делать */}
        {over > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, background: "#fdecea", color: "#a5352c" }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <span style={{ fontSize: "0.88rem", lineHeight: 1.45 }}>
              {t("Дороже вашего бюджета на")} <strong>{fmt(over)}</strong>. {t("Уберите кого-то (✕) или замените (⇄) на специалиста подешевле — сумма пересчитается.")}
            </span>
          </div>
        )}
        {/* Специалисту эта кнопка не нужна — он не заказывает команду */}
        {role !== "specialist" && (
          sent > 0 ? (
            <div className="badge badge-accepted" style={{ alignSelf: "flex-start" }}>
              ✓ {t("Запросы отправлены")}: {sent}. {t("Ответы — в разделе «Мои запросы».")}
            </div>
          ) : (
            <button className="btn btn-primary cta-wide" disabled={sending || team.length === 0} onClick={requestAll} style={{ alignSelf: "flex-start" }}>
              {sending ? t("Отправляем…") : `📨 ${t("Запросить контакты у всей команды")}`}
            </button>
          )
        )}
      </div>

      {/* Карточки-плитки, как в каталоге, + действия под каждой */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {team.map((m) => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SpecialistCard s={m} prof={professions[m.profession]} />
            {reasonById[m.id] && <span className="muted" style={{ fontSize: "0.82rem", padding: "0 4px" }}>💡 {reasonById[m.id]}</span>}
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openReplace(m)}>⇄ {t("Заменить")}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => remove(m.id)} title={t("Убрать")}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Модалка замены — тот же профиль, выбор по цене и рейтингу */}
      {replacingMember && (
        <div onClick={() => setReplacing(null)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} className="card card-pad" style={{ width: "min(480px, 100%)", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <strong>⇄ {t("Заменить")}: {profName(professions[replacingMember.profession], lang)}</strong>
              <button className="btn btn-ghost btn-sm" onClick={() => setReplacing(null)}>✕</button>
            </div>
            <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 10 }}>{t("Замена — тот же профиль, выберите по цене и рейтингу:")}</div>
            {loadingAlts ? (
              <div className="muted">{t("Загрузка…")}</div>
            ) : alts.length === 0 ? (
              <div className="muted">{t("Других специалистов этой профессии не найдено.")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {alts.map((a) => (
                  <button key={a.id} onClick={() => replaceWith(replacingMember.id, a)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", textAlign: "left" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.avatar_url} alt="" className="avatar" style={{ width: 40, height: 40 }} />
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
        </div>
      )}
    </div>
  );
}
