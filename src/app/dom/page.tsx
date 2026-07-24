import { cookies } from "next/headers";
import type { Metadata } from "next";
import HomeWizard from "@/components/HomeWizard";
import { supabaseServer } from "@/lib/supabase/server";
import { makeT, type Lang } from "@/lib/i18n";
import type { Profession } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Услуги для дома — няня, домработница, повар, водитель | Kömek",
  description: "Подберём помощника для дома по шагам: кто нужен, как часто и на какой бюджет. Няня, домработница, повар на выезд, водитель — с отзывами и видео-визитками.",
};

export default async function DomPage() {
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
  const sb = await supabaseServer();

  const [{ data: profs }, { data: prices }] = await Promise.all([
    sb.from("professions").select("*").order("sort_order"),
    sb.from("specialists").select("profession, price_from").eq("published", true).not("price_from", "is", null),
  ]);

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
      <h1 className="h1" style={{ fontSize: "2rem", marginBottom: 6 }}>🏠 {t("Услуги для дома")}</h1>
      <p className="lead" style={{ marginBottom: 24 }}>
        {t("Няня, домработница, повар, водитель — подберём под вашу задачу по шагам: кто нужен, как часто и на какой бюджет.")}
      </p>
      <HomeWizard professions={(profs as Profession[]) ?? []} avg={avg} />
    </div>
  );
}
