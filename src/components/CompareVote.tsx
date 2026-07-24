"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang";

// Совместный выбор: близкие отмечают, кто им нравится в присланной подборке.
// Голоса — локально (у каждого свои), это подсказка «за кого больше сердечек».
export default function CompareVote({ specialists }: { specialists: { id: string; name: string }[] }) {
  const { t } = useLang();
  const key = "komek_vote_" + specialists.map((s) => s.id).join("_").slice(0, 60);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { setLiked(new Set(JSON.parse(localStorage.getItem(key) ?? "[]"))); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setLiked((cur) => {
      const n = new Set(cur);
      n.has(id) ? n.delete(id) : n.add(id);
      try { localStorage.setItem(key, JSON.stringify([...n])); } catch { /* ignore */ }
      return n;
    });
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 20, background: "linear-gradient(135deg, var(--surface) 60%, #fdeef2)" }}>
      <strong style={{ fontSize: "0.98rem" }}>👨‍👩‍👧 {t("Выбираем вместе")}</strong>
      <p className="soft" style={{ fontSize: "0.86rem", margin: "4px 0 10px" }}>
        {t("Нажмите ❤ у тех, кто нравится вам — так проще договориться семьёй.")}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {specialists.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className="chip"
            style={{ cursor: "pointer", gap: 6, background: liked.has(s.id) ? "var(--brand)" : undefined, color: liked.has(s.id) ? "#fff" : undefined, borderColor: liked.has(s.id) ? "var(--brand)" : undefined }}
          >
            {liked.has(s.id) ? "❤️" : "🤍"} {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
