"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";

// Кнопка «✨ ИИ-подбор» в шапке — для заказчика/гостя, когда ИИ подключён.
export default function AiNavLink() {
  const { role } = useAuth();
  const { t } = useLang();
  const [on, setOn] = useState(false);

  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then((d) => setOn(!!d.enabled)).catch(() => {});
  }, []);

  if (!on || role === "specialist") return null;
  return (
    <Link href="/match" className="btn btn-ghost btn-sm" style={{ color: "var(--brand)", fontWeight: 700 }}>
      ✨ {t("ИИ-подбор")}
    </Link>
  );
}
