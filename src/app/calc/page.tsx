import { cookies } from "next/headers";
import type { Metadata } from "next";
import ToiWizard from "@/components/ToiWizard";
import BudgetCalc from "@/components/BudgetCalc";
import { supabaseServer } from "@/lib/supabase/server";
import { makeT, type Lang } from "@/lib/i18n";
import type { Profession } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Конструктор тоя — смета по шагам | Kömek",
  description: "Соберите свой той по шагам: тамада, музыка, звук, фото, декор и торт. По каждому этапу укажите бюджет — покажем итоговую смету и подберём команду.",
};

export default async function CalcPage() {
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
  const sb = await supabaseServer();

  const [{ data: profs }, { data: prices }] = await Promise.all([
    sb.from("professions").select("*").order("sort_order"),
    sb.from("specialists").select("profession, price_from").eq("published", true).not("price_from", "is", null),
  ]);

  // Средняя цена «от» по каждой профессии
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const r of (prices as { profession: string; price_from: number }[]) ?? []) {
    (acc[r.profession] ??= { sum: 0, n: 0 });
    acc[r.profession].sum += r.price_from;
    acc[r.profession].n += 1;
  }
  const avg: Record<string, number> = {};
  for (const [k, v] of Object.entries(acc)) avg[k] = Math.round(v.sum / v.n / 1000) * 1000;

  return (
    <div className="container-narrow" style={{ padding: "36px 20px" }}>
      <h1 className="h1" style={{ fontSize: "2rem", marginBottom: 6 }}>🎉 {t("Конструктор тоя")}</h1>
      <p className="lead" style={{ marginBottom: 24 }}>
        {t("Соберите свой той по шагам: тамада, музыка, звук, фото, декор… По каждому этапу укажите бюджет — в конце покажем смету и подберём команду.")}
      </p>

      {/* Главное: пошаговый конструктор */}
      <ToiWizard professions={(profs as Profession[]) ?? []} avg={avg} />

      {/* Альтернатива: быстрый выбор списком для тех, кто уже знает, кто нужен */}
      <div style={{ marginTop: 40 }}>
        <h2 className="h2" style={{ fontSize: "1.25rem", marginBottom: 4 }}>{t("Или выберите сразу списком")}</h2>
        <p className="soft" style={{ marginBottom: 16 }}>{t("Уже знаете, кто нужен? Отметьте специалистов — покажем примерную смету.")}</p>
        <BudgetCalc professions={(profs as Profession[]) ?? []} avg={avg} />
      </div>
    </div>
  );
}
