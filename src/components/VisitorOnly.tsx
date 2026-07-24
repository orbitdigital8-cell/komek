"use client";

import { useAuth } from "@/lib/auth";

// Показывает содержимое только заказчику/гостю. Специалисту — скрывает
// (например, блок «Похожие специалисты» = конкуренты, ему не нужен).
export default function VisitorOnly({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  if (!loading && role === "specialist") return null;
  return <>{children}</>;
}
