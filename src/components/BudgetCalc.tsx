"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import { profName } from "@/lib/i18n";
import type { Profession } from "@/lib/types";

// Калькулятор сметы тоя: выбор специалистов + число гостей → ориентировочная стоимость
export default function BudgetCalc({ professions, avg }: { professions: Profession[]; avg: Record<string, number> }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set(["tamada", "photographer", "singer"]));
  const [guests, setGuests] = useState(100);

  // «Найти под этот бюджет» → ИИ-подбор с готовым запросом из выбора калькулятора
  function goToAi() {
    const names = [...sel].map((id) => profName(professions.find((p) => p.id === id), lang)).filter(Boolean).join(", ");
    const query = `Нужны: ${names}. Гостей: ${guests}. Бюджет: ${total.toLocaleString("ru-RU")} ₸.`;
    try { sessionStorage.setItem("komek_ai_query", query); } catch { /* ignore */ }
    router.push("/match");
  }

  // Только профессии, для которых есть средняя цена
  const list = useMemo(() => professions.filter((p) => avg[p.id] > 0), [professions, avg]);

  function toggle(id: string) {
    setSel((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const items = [...sel].map((id) => ({ id, prof: professions.find((p) => p.id === id), price: avg[id] || 0 })).filter((x) => x.prof);
  const total = items.reduce((s, x) => s + x.price, 0);
  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 20 }} className="profile-grid">
      <div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="label">{t("Число гостей")}: <strong>{guests}</strong></label>
          <input type="range" min={20} max={400} step={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {list.map((p) => (
            <button key={p.id} className={`chip ${sel.has(p.id) ? "chip-active" : ""}`} onClick={() => toggle(p.id)}>
              {p.emoji} {profName(p, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Смета */}
      <div className="card card-pad" style={{ position: "sticky", top: 84, alignSelf: "start" }}>
        <h3 className="h2" style={{ fontSize: "1.1rem", marginTop: 0 }}>{t("Примерная смета")}</h3>
        {items.length === 0 ? (
          <div className="muted">{t("Выберите специалистов слева.")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((x) => (
              <div key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: "0.9rem" }}>
                <span className="soft">{x.prof!.emoji} {profName(x.prof!, lang)}</span>
                <span>{fmt(x.price)}</span>
              </div>
            ))}
            <hr className="divider" style={{ margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
              <span>{t("Итого от")}</span>
              <span style={{ color: "var(--brand)" }}>{fmt(total)}</span>
            </div>
            <p className="muted" style={{ fontSize: "0.76rem", marginTop: 6 }}>
              {t("Это ориентир по средним ценам. Точную стоимость уточняйте у специалистов.")}
            </p>
            <button onClick={goToAi} className="btn btn-primary btn-block" style={{ marginTop: 8 }}>✨ {t("Подобрать команду ИИ")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
