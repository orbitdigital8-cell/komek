import { cookies } from "next/headers";
import type { Metadata } from "next";
import AiMatch from "@/components/AiMatch";
import { supabaseServer } from "@/lib/supabase/server";
import { makeT, type Lang } from "@/lib/i18n";
import type { Profession } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ИИ-подбор команды на той | Kömek",
  description: "Опишите событие своими словами — ИИ соберёт подходящую команду специалистов из каталога Kömek.",
};

export default async function MatchPage() {
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);
  const sb = await supabaseServer();
  const { data: profs } = await sb.from("professions").select("*").order("sort_order");

  return (
    <div className="container-narrow" style={{ padding: "20px 20px 0" }}>
      <AiMatch professions={(profs as Profession[]) ?? []} />
      <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", marginTop: 20 }}>
        {t("ИИ подбирает из реальных анкет каталога. Контакты открываются после подтверждения специалистом.")}
      </p>
    </div>
  );
}
