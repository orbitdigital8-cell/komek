"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import { profName } from "@/lib/i18n";
import type { Profession } from "@/lib/types";

// Пошаговый конструктор тоя: клиент идёт по этапам, по каждому — нужен/пропустить + бюджет.
// В конце — смета и переход к ИИ-подбору по указанным бюджетам.
type Step = { prof: string; hint: string };
const STEPS: Step[] = [
  { prof: "tamada", hint: "Ведёт весь той — душа праздника" },
  { prof: "singer", hint: "Живой вокал для гостей" },
  { prof: "musician", hint: "Домбра, скрипка, живая музыка" },
  { prof: "sound", hint: "Аппаратура, микрофоны, свет" },
  { prof: "photographer", hint: "Фото на память" },
  { prof: "videographer", hint: "Видео и клип дня" },
  { prof: "decorator", hint: "Оформление зала и фотозоны" },
  { prof: "dancer", hint: "Танцевальное шоу, номера" },
  { prof: "animator", hint: "Если на тое есть дети" },
  { prof: "pyro", hint: "Салют и холодные фонтаны" },
  { prof: "visagiste", hint: "Образ и макияж" },
  { prof: "cake", hint: "Той-торт и сладкий стол" },
];

type Pick = { on: boolean; budget: number };

export default function ToiWizard({ professions, avg }: { professions: Profession[]; avg: Record<string, number> }) {
  const router = useRouter();
  const { lang, t } = useLang();
  const [step, setStep] = useState(0); // 0 — город/гости; 1..N — этапы; N+1 — смета
  const [city, setCity] = useState("Алматы");
  const [guests, setGuests] = useState(100);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [budgetInput, setBudgetInput] = useState("");

  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;

  const total = STEPS.length;
  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₸";
  const chosen = STEPS.filter((s) => picks[s.prof]?.on);
  const sum = chosen.reduce((acc, s) => acc + (picks[s.prof].budget || avg[s.prof] || 0), 0);

  function addStep(withBudget: boolean) {
    const cur = STEPS[step - 1];
    const b = withBudget && budgetInput ? parseInt(budgetInput, 10) : 0; // 0 = «любой»
    setPicks((p) => ({ ...p, [cur.prof]: { on: true, budget: b } }));
    setBudgetInput("");
    setStep(step + 1);
  }
  function skipStep() {
    const cur = STEPS[step - 1];
    setPicks((p) => ({ ...p, [cur.prof]: { on: false, budget: 0 } }));
    setBudgetInput("");
    setStep(step + 1);
  }
  function back() {
    setBudgetInput("");
    setStep(Math.max(0, step - 1));
  }

  function toAiMatch() {
    const parts = chosen.map((s) => {
      const b = picks[s.prof].budget;
      return `${profName(profMap[s.prof], lang)}${b ? ` (до ${b.toLocaleString("ru-RU")} ₸)` : ""}`;
    });
    const query = `Той в ${city} на ${guests} гостей. Нужны: ${parts.join(", ")}. Подбери по каждому в рамках бюджета.`;
    try { sessionStorage.setItem("komek_ai_query", query); } catch { /* ignore */ }
    router.push("/match");
  }

  // ---- Экран 0: город и гости ----
  if (step === 0) {
    return (
      <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 6 }}>{t("Шаг")} 1</div>
        <h2 className="h2" style={{ fontSize: "1.3rem", marginTop: 0 }}>{t("Где и на сколько гостей той?")}</h2>
        <div className="field" style={{ marginTop: 12 }}>
          <label className="label">{t("Город")}</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">{t("Число гостей")}: <strong>{guests}</strong></label>
          <input type="range" min={20} max={400} step={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={() => setStep(1)}>{t("Начать сборку тоя")} →</button>
      </div>
    );
  }

  // ---- Финал: смета ----
  if (step > total) {
    return (
      <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
        <h2 className="h2" style={{ fontSize: "1.3rem", marginTop: 0 }}>🧾 {t("Ваш той")}: {t(city)}, {guests} {t("гостей")}</h2>
        {chosen.length === 0 ? (
          <div className="muted" style={{ margin: "10px 0" }}>{t("Вы ничего не выбрали. Вернитесь и отметьте, кто нужен.")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
            {chosen.map((s) => (
              <div key={s.prof} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span className="soft">{profMap[s.prof]?.emoji} {profName(profMap[s.prof], lang)}</span>
                <strong>{picks[s.prof].budget ? fmt(picks[s.prof].budget) : `~${fmt(avg[s.prof] || 0)}`}</strong>
              </div>
            ))}
            <hr className="divider" style={{ margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
              <span>{t("Итого от")}</span>
              <span style={{ color: "var(--brand)", fontSize: "1.2rem" }}>{fmt(sum)}</span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← {t("Изменить")}</button>
          {chosen.length > 0 && <button className="btn btn-primary" onClick={toAiMatch}>✨ {t("Собрать команду под этот той")}</button>}
        </div>
      </div>
    );
  }

  // ---- Этап категории ----
  const cur = STEPS[step - 1];
  const p = profMap[cur.prof];
  const avgPrice = avg[cur.prof];
  return (
    <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* прогресс */}
      <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 6 }}>{t("Шаг")} {step + 1} / {total + 1}</div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${((step + 1) / (total + 1)) * 100}%`, height: "100%", background: "var(--brand)", transition: "width .3s" }} />
      </div>

      <div style={{ fontSize: 34 }}>{p?.emoji}</div>
      <h2 className="h2" style={{ fontSize: "1.35rem", margin: "4px 0 2px" }}>{profName(p, lang)}</h2>
      <p className="soft" style={{ margin: "0 0 14px" }}>{t(cur.hint)}</p>

      <div className="field">
        <label className="label">{t("Ваш бюджет на эту услугу (необязательно)")}</label>
        <input className="input" type="number" min={0} placeholder={avgPrice ? `${t("В среднем")} ~${fmt(avgPrice)}` : t("Например: 100000")} value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
        <span className="muted" style={{ fontSize: "0.78rem", marginTop: 4, display: "inline-block" }}>{t("Пусто — подберём по средней цене")}</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={() => addStep(true)}>✓ {t("Нужен, добавить")}</button>
        <button className="btn btn-outline" onClick={skipStep}>{t("Пропустить")}</button>
        {step > 1 && <button className="btn btn-ghost btn-sm" onClick={back} style={{ marginLeft: "auto" }}>← {t("Назад")}</button>}
      </div>
    </div>
  );
}
