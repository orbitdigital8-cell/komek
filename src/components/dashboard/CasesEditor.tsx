"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { formatDate, type PortfolioCase } from "@/lib/types";

type Draft = { title: string; description: string; date: string; photos: string[]; videos: string[] };
const EMPTY: Draft = { title: "", description: "", date: "", photos: [], videos: [] };

// Портфолио-примеры работ: альбомы «Свадьба Айгерим и Армана» с фото и видео.
// adminSpecialistId — режим отладки: чтение/запись через админский API (обход RLS).
export default function CasesEditor({ specialistId, userId, adminSpecialistId }: { specialistId: string; userId: string; adminSpecialistId?: string }) {
  const sb = supabaseBrowser();
  const { t } = useLang();
  const [rows, setRows] = useState<PortfolioCase[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null); // null = добавление нового
  const [busy, setBusy] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (adminSpecialistId) {
      const r = await fetch("/api/admin/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list", specialistId: adminSpecialistId }) });
      const d = await r.json();
      setRows((d.cases as PortfolioCase[]) ?? []);
      return;
    }
    const { data } = await sb.from("portfolio_cases").select("*").eq("specialist_id", specialistId).order("sort_order");
    setRows((data as PortfolioCase[]) ?? []);
  }, [sb, specialistId, adminSpecialistId]);

  useEffect(() => { load(); }, [load]);

  async function uploadOne(file: File): Promise<string | null> {
    if (adminSpecialistId) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("specialistId", adminSpecialistId);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await r.json();
      return r.ok ? (j.url as string) : null;
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file);
    return error ? null : sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  async function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setBusy(true);
    for (const file of files) {
      const url = await uploadOne(file);
      if (url) setDraft((d) => ({ ...d, photos: [...d.photos, url] }));
    }
    setBusy(false);
    e.target.value = "";
  }

  async function onVideos(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const url = await uploadOne(file);
    if (url) setDraft((d) => ({ ...d, videos: [...d.videos, url] }));
    setBusy(false);
    e.target.value = "";
  }

  function startEdit(c: PortfolioCase) {
    setEditId(c.id);
    setDraft({ title: c.title, description: c.description, date: c.event_date ?? "", photos: c.photos ?? [], videos: c.videos ?? [] });
    window.scrollTo({ top: window.scrollY, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditId(null);
    setDraft(EMPTY);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setBusy(true);
    const payload = { title: draft.title.trim(), description: draft.description.trim(), photos: draft.photos, videos: draft.videos, event_date: draft.date || null };

    if (adminSpecialistId) {
      const action = editId ? "update_case" : "add_case";
      await fetch("/api/admin/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, specialistId: adminSpecialistId, id: editId, sort_order: rows.length, ...payload }) });
    } else if (editId) {
      await sb.from("portfolio_cases").update(payload).eq("id", editId);
    } else {
      await sb.from("portfolio_cases").insert({ specialist_id: specialistId, sort_order: rows.length, ...payload });
    }
    cancelEdit();
    setBusy(false);
    load();
  }

  async function remove(id: string) {
    if (adminSpecialistId) {
      await fetch("/api/admin/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "del_case", specialistId: adminSpecialistId, id }) });
    } else {
      await sb.from("portfolio_cases").delete().eq("id", id);
    }
    if (editId === id) cancelEdit();
    load();
  }

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Примеры работ")}</h3>
      <p className="soft" style={{ fontSize: "0.85rem", margin: 0 }}>
        {t("Расскажите о конкретных мероприятиях: «Той на 200 гостей, ресторан X» — с фото. Реальные примеры продают лучше слов.")}
      </p>

      {/* Существующие примеры */}
      {rows.map((c) => (
        <div key={c.id} style={{ padding: "10px 12px", borderRadius: 10, background: editId === c.id ? "var(--surface)" : "var(--surface-2)", border: editId === c.id ? "1px solid var(--brand)" : "1px solid transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong>{c.title}</strong>
            {c.event_date && <span className="muted" style={{ fontSize: "0.82rem" }}>{formatDate(c.event_date, true)}</span>}
            <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <button type="button" className="btn btn-outline btn-sm" style={{ padding: "3px 9px" }} onClick={() => startEdit(c)}>✏ {t("Изменить")}</button>
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "3px 9px" }} onClick={() => remove(c.id)}>×</button>
            </span>
          </div>
          {c.description && <p className="soft" style={{ fontSize: "0.85rem", margin: "6px 0 0" }}>{c.description}</p>}
          {(c.photos.length > 0 || c.videos?.length > 0) && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {c.photos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={u} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6 }} />
              ))}
              {(c.videos ?? []).map((u, i) => (
                <span key={i} style={{ width: 72, height: 54, borderRadius: 6, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>▶</span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Форма добавления / редактирования */}
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
        {editId && <span className="badge badge-soft" style={{ alignSelf: "flex-start" }}>✏ {t("Редактирование примера")}</span>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="input" placeholder={t("Название (Той на 200 гостей)")} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={{ flex: "2 1 200px" }} />
          <input className="input" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} style={{ flex: "0 1 150px" }} />
        </div>
        <input className="input" placeholder={t("Что делали, чем гордитесь")} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />

        {/* Превью медиа черновика с удалением */}
        {(draft.photos.length > 0 || draft.videos.length > 0) && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {draft.photos.map((u, i) => (
              <span key={`p${i}`} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6 }} />
                <button type="button" onClick={() => setDraft((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: 11 }}>×</button>
              </span>
            ))}
            {draft.videos.map((u, i) => (
              <span key={`v${i}`} style={{ position: "relative" }}>
                <span style={{ width: 72, height: 54, borderRadius: 6, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>▶</span>
                <button type="button" onClick={() => setDraft((d) => ({ ...d, videos: d.videos.filter((_, j) => j !== i) }))} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: 11 }}>×</button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => photoInput.current?.click()} disabled={busy}>📷 {t("+ Фото")}</button>
          <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
          <button type="button" className="btn btn-outline btn-sm" onClick={() => videoInput.current?.click()} disabled={busy}>🎬 {t("+ Видео")}</button>
          <input ref={videoInput} type="file" accept="video/*" hidden onChange={onVideos} />
          <button className="btn btn-primary btn-sm" disabled={busy || !draft.title.trim()}>
            {busy ? t("Сохраняем…") : editId ? t("Сохранить изменения") : t("Добавить пример")}
          </button>
          {editId && <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>{t("Отмена")}</button>}
        </div>
      </form>
    </div>
  );
}
