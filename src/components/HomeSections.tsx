"use client";

import Catalog from "@/components/Catalog";
import ServiceGrid from "@/components/ServiceGrid";
import RecentlyViewed from "@/components/RecentlyViewed";
import SeasonalPicks from "@/components/SeasonalPicks";
import TopSpecialists from "@/components/TopSpecialists";
import AiMatch from "@/components/AiMatch";
import SpecialistFeed from "@/components/SpecialistFeed";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import type { Profession, Specialist } from "@/lib/types";

// Разграничение ролей на главной:
//  специалист — своё рабочее место (заказы с биржи + кабинет);
//  заказчик и гость — витрина и каталог.
export default function HomeSections({
  professions, initialSpecialists, initialCount, month,
}: {
  professions: Profession[]; initialSpecialists: Specialist[]; initialCount: number; month: number;
}) {
  const { role, loading } = useAuth();
  const { t } = useLang();

  if (!loading && role === "specialist") {
    return <SpecialistFeed professions={professions} />;
  }

  return (
    <>
      <ServiceGrid />
      <TopSpecialists professions={professions} />
      <SeasonalPicks professions={professions} month={month} />
      <AiMatch professions={professions} />
      <RecentlyViewed professions={professions} />

      <section id="catalog" className="container" style={{ padding: "40px 22px 0" }}>
        <div style={{ marginBottom: 22 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{t("Каталог специалистов")}</h2>
          <p className="soft">{t("Выберите раздел, специальность или просто напишите, что нужно.")}</p>
        </div>
        <Catalog professions={professions} initialSpecialists={initialSpecialists} initialCount={initialCount} />
      </section>
    </>
  );
}
