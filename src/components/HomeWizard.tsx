"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import { profName } from "@/lib/i18n";
import type { Profession } from "@/lib/types";

// Пошаговый подбор для дома: кто нужен → как часто → город и бюджет → подбор.
// Той-подбор — отдельная ветка; это его «домашний» аналог.
const HOME_PROFS = ["nanny", "housekeeper", "cook", "driver"];

const FREQ: { key: string; label: string; hint: string }[] = [
  { key: "разово", label: "Разово", hint: "На один раз или мероприятие" },
  { key: "регулярно", label: "Несколько раз в неделю", hint: "Приходящий помощник по графику" },
  { key: "постоянно", label: "Постоянно, полный день", hint: "На весь день или с проживанием" },
];

export default function HomeWizard({ professions, avg }: { professions: Profession[]; avg: Record<string, number> }) {
  const router = useRouter();
  const { lang, t } = useLang();
  const [step, setStep] = useState(0); // 0 — кто; 1 — как часто; 2 — город/бюджет; 3 — итог
  const [who, setWho] = useState<Set<string>>(new Set());
  const [freq, setFreq] = useState("регулярно");
  const [city, setCity] = useState("Алматы");
  const [budget, setBudget] = useState("");

  const profMap: Record<string, Profession> = {};
  for (const p of professions) profMap[p.id] = p;
  const list = HOME_PROFS.map((id) => profMap[id]).filter(Boolean);
  const chosen = [...who];
  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

  function toggle(id: string) {
    setWho((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toMatch() {
    const names = chosen.map((id) => profName(profMap[id], lang)).join(", ");
    const freqText = FREQ.find((f) => f.key === freq)?.label ?? freq;
    const b = budget ? ` Бюджет до ${parseInt(budget, 10).toLocaleString("ru-RU")} ₸.` : "";
    const query = `Нужны для дома: ${names}. Город ${city}. Формат: ${freqText}.${b}`;
    try { sessionStorage.setItem("komek_ai_query", query); } catch { /* ignore */ }
    router.push("/match");
  }

  // ---- Шаг 0: кто нужен ----
  if (step === 0) {
    return (
      <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 6 }}>{t("Шаг")} 1 / 3</div>
        <h2 className="h2" style={{ fontSize: "1.3rem", marginTop: 0 }}>{t("Кто нужен для дома?")}</h2>
        <p className="soft" style={{ margin: "4px 0 14px" }}>{t("Можно выбрать несколько.")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((p) => (
            <button key={p.id} type="button" onClick={() => toggle(p.id)}
              className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", textAlign: "left", cursor: "pointer", borderColor: who.has(p.id) ? "var(--brand)" : undefined, borderWidth: who.has(p.id) ? 2 : 1 }}>
              <span style={{ fontSize: 26 }}>{p.emoji}</span>
              <span style={{ flex: 1 }}>
                <strong style={{ display: "block" }}>{profName(p, lang)}</strong>
                {avg[p.id] > 0 && <span className="muted" style={{ fontSize: "0.8rem" }}>{t("от")} {fmt(avg[p.id])}</span>}
              </span>
              <span style={{ fontSize: 18, color: who.has(p.id) ? "var(--brand)" : "var(--text-mute)" }}>{who.has(p.id) ? "✓" : "+"}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={chosen.length === 0} onClick={() => setStep(1)}>{t("Далее")} →</button>
      </div>
    );
  }

  // ---- Шаг 1: как часто ----
  if (step === 1) {
    return (
      <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 6 }}>{t("Шаг")} 2 / 3</div>
        <h2 className="h2" style={{ fontSize: "1.3rem", marginTop: 0 }}>{t("Как часто нужна помощь?")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {FREQ.map((f) => (
            <button key={f.key} type="button" onClick={() => setFreq(f.key)}
              className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", textAlign: "left", cursor: "pointer", borderColor: freq === f.key ? "var(--brand)" : undefined, borderWidth: freq === f.key ? 2 : 1 }}>
              <span style={{ flex: 1 }}>
                <strong style={{ display: "block" }}>{t(f.label)}</strong>
                <span className="muted" style={{ fontSize: "0.8rem" }}>{t(f.hint)}</span>
              </span>
              <span style={{ fontSize: 18, color: freq === f.key ? "var(--brand)" : "var(--text-mute)" }}>{freq === f.key ? "●" : "○"}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>← {t("Назад")}</button>
          <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setStep(2)}>{t("Далее")} →</button>
        </div>
      </div>
    );
  }

  // ---- Шаг 2: город и бюджет ----
  if (step === 2) {
    return (
      <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 6 }}>{t("Шаг")} 3 / 3</div>
        <h2 className="h2" style={{ fontSize: "1.3rem", marginTop: 0 }}>{t("Город и бюджет")}</h2>
        <div className="field" style={{ marginTop: 12 }}>
          <label className="label">{t("Город")}</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">{t("Бюджет (необязательно)")}</label>
          <input className="input" type="number" min={0} placeholder={t("Например: 150000")} value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← {t("Назад")}</button>
          <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setStep(3)}>{t("Готово")} →</button>
        </div>
      </div>
    );
  }

  // ---- Итог ----
  return (
    <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 className="h2" style={{ fontSize: "1.3rem", marginTop: 0 }}>🏠 {t("Ваш запрос для дома")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span className="soft">{t("Кто нужен")}</span><strong>{chosen.map((id) => profName(profMap[id], lang)).join(", ")}</strong></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span className="soft">{t("Формат")}</span><strong>{t(FREQ.find((f) => f.key === freq)?.label ?? freq)}</strong></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span className="soft">{t("Город")}</span><strong>{t(city)}</strong></div>
        {budget && <div style={{ display: "flex", justifyContent: "space-between" }}><span className="soft">{t("Бюджет до")}</span><strong>{fmt(parseInt(budget, 10))}</strong></div>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>← {t("Изменить")}</button>
        <button className="btn btn-primary" onClick={toMatch}>✨ {t("Подобрать специалистов")}</button>
      </div>
    </div>
  );
}
