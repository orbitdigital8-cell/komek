"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { formatDate, type PortfolioCase } from "@/lib/types";

// Портфолио-кейсы: альбомы «Свадьба Айгерим и Армана» с фото
export default function CasesEditor({ specialistId, userId }: { specialistId: string; userId: string }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [rows, setRows] = useState<PortfolioCase[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("portfolio_cases").select("*").eq("specialist_id", specialistId).order("sort_order");
    setRows((data as PortfolioCase[]) ?? []);
  }, [sb, specialistId]);

  useEffect(() => { load(); }, [load]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setBusy(true);
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("media").upload(path, file);
      if (!error) setPhotos((p) => [...p, sb.storage.from("media").getPublicUrl(path).data.publicUrl]);
    }
    setBusy(false);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await sb.from("portfolio_cases").insert({
      specialist_id: specialistId,
      title: title.trim(),
      description: desc.trim(),
      photos,
      event_date: date || null,
      sort_order: rows.length,
    });
    setTitle(""); setDesc(""); setDate(""); setPhotos([]);
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    await sb.from("portfolio_cases").delete().eq("id", id);
    load();
  }

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Примеры работ")}</h3>
      <p className="soft" style={{ fontSize: "0.85rem", margin: 0 }}>
        {t("Расскажите о конкретных мероприятиях: «Той на 200 гостей, ресторан X» — с фото. Реальные примеры продают лучше слов.")}
      </p>

      {rows.map((c) => (
        <div key={c.id} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong>{c.title}</strong>
            {c.event_date && <span className="muted" style={{ fontSize: "0.82rem" }}>{formatDate(c.event_date, true)}</span>}
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: "3px 9px" }} onClick={() => remove(c.id)}>×</button>
          </div>
          {c.description && <p className="soft" style={{ fontSize: "0.85rem", margin: "6px 0 0" }}>{c.description}</p>}
          {c.photos.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {c.photos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={u} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6 }} />
              ))}
            </div>
          )}
        </div>
      ))}

      <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="input" placeholder={t("Название (Той на 200 гостей)")} value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: "2 1 200px" }} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: "0 1 150px" }} />
        </div>
        <input className="input" placeholder={t("Что делали, чем гордитесь")} value={desc} onChange={(e) => setDesc(e.target.value)} />
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {photos.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6 }} />
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInput.current?.click()} disabled={busy}>{t("+ Фото")}</button>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={onPick} />
          <button className="btn btn-primary btn-sm" disabled={busy || !title.trim()}>{t("Добавить пример")}</button>
        </div>
      </form>
    </div>
  );
}
