import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { makeT, type Lang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Как это работает | Kömek",
  description: "Как найти специалиста на той или для дома: запрос, подтверждение, контакты, бронь. Почему контакты открываются только после подтверждения.",
};

export default async function HowPage() {
  const lang: Lang = (await cookies()).get("lang")?.value === "kk" ? "kk" : "ru";
  const t = makeT(lang);

  const clientSteps = [
    { icon: "🔎", title: t("Найдите и сравните"), text: t("Каталог открыт без регистрации: фото, видео-визитки, цены, отзывы, занятость по датам. Добавляйте в избранное ❤ и сравнивайте.") },
    { icon: "✉️", title: t("Отправьте запрос"), text: t("Выберите специалиста и отправьте запрос с датой и описанием. Или разместите заявку — свободные специалисты откликнутся сами.") },
    { icon: "🤝", title: t("Специалист подтверждает"), text: t("Обсудить детали можно сразу в чате. Как только специалист подтвердит запрос — откроются его телефон, WhatsApp и соцсети.") },
    { icon: "🎉", title: t("Бронь и отзыв"), text: t("Специалист бронирует вашу дату — она закрывается в его календаре. После события оставьте отзыв — он поможет другим.") },
  ];

  const specialistSteps = [
    { icon: "📋", title: t("Заполните анкету"), text: t("Фото, видео-визитка, цены, пакеты услуг, кейсы. Чем полнее анкета — тем выше доверие и больше заявок.") },
    { icon: "🔔", title: t("Получайте заявки"), text: t("Клиенты пишут вам сами — из каталога или через заявки на бирже. Спам исключён: запрос могут отправить только зарегистрированные.") },
    { icon: "✅", title: t("Подтверждайте и бронируйте"), text: t("Вы сами решаете, кому открыть контакты. Подтвердили → обсудили → забронировали дату. Календарь занятости ведётся автоматически.") },
  ];

  return (
    <div className="container-narrow" style={{ padding: "40px 20px" }}>
      <h1 className="h1" style={{ fontSize: "2rem", marginBottom: 8 }}>{t("Как это работает")}</h1>
      <p className="lead" style={{ marginBottom: 28 }}>
        {t("Kömek соединяет заказчиков и специалистов напрямую — без посредников и переплат.")}
      </p>

      {/* Ключевая идея — почему контакты скрыты */}
      <div className="card card-pad" style={{ marginBottom: 32, background: "linear-gradient(135deg, var(--surface) 55%, #f3ecff)", display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ fontSize: 34 }}>🔒</div>
        <div>
          <strong style={{ fontSize: "1.05rem" }}>{t("Почему контакты открываются после подтверждения?")}</strong>
          <p className="soft" style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
            {t("Это защита обеих сторон. Специалистов не заваливают спамом и случайными звонками — к ним приходят только реальные заказчики с датой и запросом. А вы уверены, что специалист видел вашу дату и готов работать. До подтверждения всегда доступен чат.")}
          </p>
        </div>
      </div>

      <h2 className="h2" style={{ fontSize: "1.3rem", marginBottom: 14 }}>👰 {t("Я ищу специалиста")}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, marginBottom: 34 }}>
        {clientSteps.map((s, i) => (
          <div key={i} className="card card-pad">
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <strong style={{ display: "block", margin: "8px 0 6px" }}>{i + 1}. {s.title}</strong>
            <p className="soft" style={{ fontSize: "0.9rem", margin: 0, lineHeight: 1.55 }}>{s.text}</p>
          </div>
        ))}
      </div>

      <h2 className="h2" style={{ fontSize: "1.3rem", marginBottom: 14 }}>⭐ {t("Я специалист")}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, marginBottom: 34 }}>
        {specialistSteps.map((s, i) => (
          <div key={i} className="card card-pad">
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <strong style={{ display: "block", margin: "8px 0 6px" }}>{i + 1}. {s.title}</strong>
            <p className="soft" style={{ fontSize: "0.9rem", margin: 0, lineHeight: 1.55 }}>{s.text}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" className="btn btn-primary">{t("Смотреть каталог")}</Link>
        <Link href="/orders" className="btn btn-outline">{t("Подать заявку")}</Link>
        <Link href="/register?role=specialist" className="btn btn-outline">{t("Я специалист — разместить анкету")}</Link>
      </div>
    </div>
  );
}
