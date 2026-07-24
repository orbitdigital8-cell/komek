"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

// Вторая CTA на главной зависит от того, кто смотрит:
// гость — «стать специалистом», заказчик — «подать заявку», специалист — «моя анкета».
export default function HeroActions() {
  const { user, loading } = useAuth();
  const { t } = useLang();

  // Гостю показываем призыв стать специалистом; вошедшим действия уже есть в шапке —
  // не дублируем, оставляем только «Смотреть каталог».
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
