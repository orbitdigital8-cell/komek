"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import type { SpecialistPackage } from "@/lib/types";

// Пакеты услуг: «Базовый / Стандарт / Всё включено» с ценой и описанием
export default function PackagesEditor({ specialistId }: { specialistId: string }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [rows, setRows] = useState<SpecialistPackage[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("specialist_packages").select("*").eq("specialist_id", specialistId).order("sort_order");
    setRows((data as SpecialistPackage[]) ?? []);
  }, [sb, specialistId]);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setBusy(true);
    await sb.from("specialist_packages").insert({
      specialist_id: specialistId,
      name: name.trim(),
      price: parseInt(price, 10),
      description: desc.trim(),
      sort_order: rows.length,
    });
    setName(""); setPrice(""); setDesc("");
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    await sb.from("specialist_packages").delete().eq("id", id);
    load();
  }

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Пакеты услуг")}</h3>
      <p className="soft" style={{ fontSize: "0.85rem", margin: 0 }}>
        {t("Готовые тарифы снимают главный вопрос клиента «а что по цене». Например: Базовый / Стандарт / Всё включено.")}
      </p>

      {rows.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
          <strong>{p.name}</strong>
          <span style={{ color: "var(--brand)", fontWeight: 700 }}>{p.price.toLocaleString("ru-RU")} ₸</span>
          {p.description && <span className="muted" style={{ fontSize: "0.85rem", flexBasis: "100%" }}>{p.description}</span>}
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: "3px 9px" }} onClick={() => remove(p.id)}>×</button>
        </div>
      ))}

      <form onSubmit={add} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="input" placeholder={t("Название (Стандарт)")} value={name} onChange={(e) => setName(e.target.value)} style={{ flex: "1 1 140px" }} />
        <input className="input" type="number" min={0} placeholder={t("Цена, ₸")} value={price} onChange={(e) => setPrice(e.target.value)} style={{ flex: "0 1 120px" }} />
        <input className="input" placeholder={t("Что входит (кратко)")} value={desc} onChange={(e) => setDesc(e.target.value)} style={{ flex: "2 1 200px" }} />
        <button className="btn btn-outline btn-sm" disabled={busy || !name.trim() || !price}>{t("Добавить пакет")}</button>
      </form>
    </div>
  );
}
