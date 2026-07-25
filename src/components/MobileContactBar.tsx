"use client";

import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

// Закреплённая снизу кнопка связи на мобильном — чтобы гость сразу видел,
// как связаться со специалистом, не прокручивая до сайдбара внизу страницы.
export default function MobileContactBar({ ownerId }: { ownerId: string | null }) {
  const { user, loading } = useAuth();
  const { t } = useLang();

  // Владельцу своей анкеты кнопка не нужна
  if (!loading && user && ownerId && user.id === ownerId) return null;

  const scrollToPanel = () => {
    document.getElementById("contact-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="mobile-contact-bar-spacer" />
      <div className="mobile-contact-bar">
        <button className="btn btn-primary btn-block" onClick={scrollToPanel}>
          {user ? `📩 ${t("Связаться со специалистом")}` : `🔒 ${t("Войти, чтобы связаться")}`}
        </button>
      </div>
    </>
  );
}
