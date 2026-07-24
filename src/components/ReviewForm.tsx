"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/lang";
import type { Review } from "@/lib/types";

export default function ReviewForm({ specialistId, defaultName }: { specialistId: string; defaultName: string }) {
  const sb = supabaseBrowser();
  const { user, name } = useAuth();
  const { t } = useLang();
  const [existing, setExisting] = useState<Review | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  async function onVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file);
    if (!error) setVideo(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  }

  async function onPhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setBusy(true);
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("media").upload(path, file);
      if (!error) setPhotos((p) => [...p, sb.storage.from("media").getPublicUrl(path).data.publicUrl]);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (!user) return;
    sb.from("reviews").select("*").eq("specialist_id", specialistId).eq("client_id", user.id).maybeSingle()
      .then(({ data }) => {
        const r = (data as Review) ?? null;
        if (r) { setExisting(r); setRating(r.rating); setText(r.text); }
      });
  }, [sb, user, specialistId]);

  async function submit() {
    if (!user) return;
    setBusy(true);
    const { error } = await sb.from("reviews").upsert(
      { specialist_id: specialistId, client_id: user.id, author_name: name || defaultName, rating, text, photos, video },
      { onConflict: "specialist_id,client_id" },
    );
    setBusy(false);
    if (!error) { setDone(true); setOpen(false); setExisting({ ...(existing ?? {} as Review), rating, text } as Review); }
  }

  if (done || existing) {
    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <span className="badge badge-accepted">✓ {t("Ваш отзыв:")} {"★".repeat(existing?.rating ?? rating)}</span>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => { setDone(false); setExisting(null); setOpen(true); }}>
          {t("Изменить")}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <button className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>{t("⭐ Оставить отзыв")}</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 4, fontSize: 26, cursor: "pointer" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            style={{ color: n <= (hover || rating) ? "var(--accent)" : "var(--border-strong)", lineHeight: 1 }}
          >
            ★
          </span>
        ))}
      </div>
      <textarea className="textarea" placeholder={t("Как прошло? Что понравилось?")} value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 72 }} />
      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {photos.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={u} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6 }} />
          ))}
        </div>
      )}
      {video && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="badge badge-accepted">🎬 {t("Видео-отзыв добавлен")}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVideo("")}>{t("Убрать")}</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => fileInput.current?.click()}>📷 {t("+ Фото с мероприятия")}</button>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={onPhotoPick} />
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => videoInput.current?.click()}>🎬 {t("+ Видео-отзыв")}</button>
        <input ref={videoInput} type="file" accept="video/*" hidden onChange={onVideoPick} />
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{busy ? t("Отправляем…") : t("Опубликовать отзыв")}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>{t("Отмена")}</button>
      </div>
    </div>
  );
}
