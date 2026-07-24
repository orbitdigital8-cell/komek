"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

// CTA на главной зависит от роли: гость — каталог + «стать специалистом»,
// заказчик — каталог, специалист — его кабинет (каталог для него скрыт).
export default function HeroActions() {
  const { user, role, loading } = useAuth();
  const { t } = useLang();

  if (!loading && role === "specialist") {
    return (
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/dashboard" className="btn btn-primary">{t("Мой кабинет")}</Link>
        <Link href="/orders" className="btn btn-outline">{t("Заказы на бирже")}</Link>
      </div>
    );
  }

  const second = !loading && !user
    ? <Link href="/register?role=specialist" className="btn btn-outline">{t("Я специалист — разместить анкету")}</Link>
    : null;

  return (
    <>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="#catalog" className="btn btn-primary">{t("Смотреть каталог")}</a>
        {second}
      </div>
      <div style={{ marginTop: 14 }}>
        <Link href="/how" className="link" style={{ fontSize: "0.92rem" }}>{t("Как это работает")} →</Link>
      </div>
    </>
  );
}
