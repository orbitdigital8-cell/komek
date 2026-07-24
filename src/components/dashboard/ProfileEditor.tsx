"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import BrandIcon from "@/components/BrandIcon";
import { fieldsFor } from "@/lib/fields";
import { useLang } from "@/lib/lang";
import { profName } from "@/lib/i18n";
import { SOCIAL_META, SOCIAL_ORDER, type Profession, type Social, type Specialist, type SpecialistContacts } from "@/lib/types";

type AttrVal = string | number | boolean;

interface Props {
  userId: string;
  professions: Profession[];
  specialist: Specialist | null;
  contacts: SpecialistContacts | null;
  socials: Social[];
  onSaved: () => void;
  // Режим отладки: сохранять/загружать через админский API для чужой анкеты
  adminSpecialistId?: string;
}

type SocialDraft = { type: string; value: string; is_public: boolean };

export default function ProfileEditor({ userId, professions, specialist, contacts, socials, onSaved, adminSpecialistId }: Props) {
  const sb = supabaseBrowser();
  const { lang, t } = useLang();

  const [f, setF] = useState({
    profession: specialist?.profession ?? professions[0]?.id ?? "",
    name: specialist?.name ?? "",
    city: specialist?.city ?? "Алматы",
    tagline: specialist?.tagline ?? "",
    about: specialist?.about ?? "",
    price_from: specialist?.price_from?.toString() ?? "",
    experience_years: specialist?.experience_years?.toString() ?? "0",
    avatar_url: specialist?.avatar_url ?? "",
    video_url: specialist?.video_url ?? "",
    work_link: specialist?.work_link ?? "",
    published: specialist?.published ?? true,
  });
  const [gallery, setGallery] = useState<string[]>(specialist?.gallery ?? []);
  const [tags, setTags] = useState<string[]>(specialist?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [attrs, setAttrs] = useState<Record<string, AttrVal>>(specialist?.attributes ?? {});
  const attrFields = fieldsFor(f.profession);
  const [c, setC] = useState({
    phone: contacts?.phone ?? "",
    whatsapp: contacts?.whatsapp ?? "",
    telegram: contacts?.telegram ?? "",
  });
  const [soc, setSoc] = useState<SocialDraft[]>(
    socials.map((s) => ({ type: s.type, value: s.value, is_public: s.is_public })),
  );

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [aiOn, setAiOn] = useState(false);
  const [aiBusy, setAiBusy] = useState<"" | "assist" | "translate">("");
  const [kk, setKk] = useState({ tagline_kk: specialist?.tagline_kk ?? "", about_kk: specialist?.about_kk ?? "" });
  const [modWarn, setModWarn] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then((d) => setAiOn(!!d.enabled)).catch(() => {});
  }, []);

  // ✨ ИИ-помощник: улучшает слоган, «о себе» и предлагает теги
  async function aiAssist() {
    setAiBusy("assist");
    try {
      const r = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: professions.find((p) => p.id === f.profession)?.label ?? f.profession,
          name: f.name, city: f.city, tagline: f.tagline, about: f.about,
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setF((s) => ({ ...s, tagline: d.tagline ?? s.tagline, about: d.about ?? s.about }));
        if (Array.isArray(d.tags)) setTags((cur) => Array.from(new Set([...cur, ...d.tags])).slice(0, 8));
      }
    } catch { /* ignore */ }
    setAiBusy("");
  }

  // 🇰🇿 ИИ-перевод анкеты на казахский (сохранится вместе с анкетой)
  async function aiTranslate() {
    setAiBusy("translate");
    try {
      const r = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagline: f.tagline, about: f.about }),
      });
      const d = await r.json();
      if (r.ok) setKk({ tagline_kk: d.tagline_kk ?? "", about_kk: d.about_kk ?? "" });
    } catch { /* ignore */ }
    setAiBusy("");
  }

  function movePhoto(i: number, dir: -1 | 1) {
    setGallery((g) => {
      const j = i + dir;
      if (j < 0 || j >= g.length) return g;
      const next = [...g];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function upload(file: File): Promise<string | null> {
    // В режиме отладки грузим через админский API (service_role)
    if (adminSpecialistId) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("specialistId", adminSpecialistId);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) { setMsg({ ok: false, text: `Ошибка загрузки: ${j.error}` }); return null; }
      return j.url as string;
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file, { upsert: false });
    if (error) {
      setMsg({ ok: false, text: `Ошибка загрузки: ${error.message}` });
      return null;
    }
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await upload(file);
    setUploading(false);
    if (url) setF((s) => ({ ...s, avatar_url: url }));
  }

  async function onGalleryPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const url = await upload(file);
      if (url) setGallery((g) => [...g, url]);
    }
    setUploading(false);
  }

  async function onVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await upload(file);
    setUploading(false);
    if (url) setF((s) => ({ ...s, video_url: url }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const payload = {
      owner_id: userId,
      profession: f.profession,
      name: f.name,
      city: f.city,
      tagline: f.tagline,
      about: f.about,
      price_from: f.price_from ? parseInt(f.price_from, 10) : null,
      experience_years: parseInt(f.experience_years || "0", 10),
      avatar_url: f.avatar_url,
      video_url: f.video_url,
      work_link: f.work_link,
      gallery,
      tags,
      attributes: attrs,
      published: f.published,
      tagline_kk: kk.tagline_kk,
      about_kk: kk.about_kk,
    };

    // Мягкая ИИ-модерация (не блокирует сохранение)
    if (aiOn) {
      fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${f.tagline}\n${f.about}` }),
      })
        .then((r) => r.json())
        .then((d) => setModWarn(d.ok === false ? d.reason ?? "Проверьте текст анкеты" : null))
        .catch(() => {});
    }

    // Режим отладки: всё сохранение — через админский API (обход RLS)
    if (adminSpecialistId) {
      const r = await fetch("/api/admin/specialist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialistId: adminSpecialistId, profile: payload, contacts: c, socials: soc }),
      });
      const j = await r.json();
      setBusy(false);
      if (!r.ok) { setMsg({ ok: false, text: j.error ?? "Ошибка" }); return; }
      setMsg({ ok: true, text: "Анкета сохранена ✓" });
      onSaved();
      return;
    }

    let specialistId = specialist?.id;
    if (specialistId) {
      const { error } = await sb.from("specialists").update(payload).eq("id", specialistId);
      if (error) { setBusy(false); setMsg({ ok: false, text: error.message }); return; }
    } else {
      const { data, error } = await sb.from("specialists").insert(payload).select("id").single();
      if (error) { setBusy(false); setMsg({ ok: false, text: error.message }); return; }
      specialistId = (data as { id: string }).id;
    }

    const { error: cErr } = await sb
      .from("specialist_contacts")
      .upsert({ specialist_id: specialistId, ...c }, { onConflict: "specialist_id" });
    if (cErr) { setBusy(false); setMsg({ ok: false, text: cErr.message }); return; }

    // Соцсети заменяем целиком (проще, чем точечная синхронизация)
    await sb.from("specialist_socials").delete().eq("specialist_id", specialistId);
    const socRows = soc
      .filter((s) => s.value.trim())
      .map((s, i) => ({ specialist_id: specialistId, type: s.type, value: s.value.trim(), is_public: s.is_public, sort_order: i }));
    if (socRows.length) {
      const { error: sErr } = await sb.from("specialist_socials").insert(socRows);
      if (sErr) { setBusy(false); setMsg({ ok: false, text: sErr.message }); return; }
    }

    setBusy(false);
    setMsg({ ok: true, text: "Анкета сохранена ✓" });
    onSaved();
  }

  // Заполненность анкеты: чем полнее — тем живее выглядит в каталоге
  const completeness = (() => {
    const items: { ok: boolean; hint: string; w: number }[] = [
      { ok: !!f.name.trim(), hint: "Укажите имя", w: 10 },
      { ok: !!f.city.trim(), hint: "Укажите город", w: 5 },
      { ok: !!f.tagline.trim(), hint: "Добавьте короткое описание", w: 10 },
      { ok: f.about.trim().length >= 80, hint: "Расскажите о себе подробнее", w: 10 },
      { ok: !!f.price_from, hint: "Укажите цену", w: 5 },
      { ok: !!f.avatar_url, hint: "Загрузите главное фото", w: 10 },
      { ok: gallery.length >= 3, hint: "Добавьте 3+ фото в галерею", w: 15 },
      { ok: !!f.video_url, hint: "Добавьте видео-визитку", w: 15 },
      { ok: tags.length >= 3, hint: "Добавьте 3+ тега", w: 5 },
      { ok: !!(c.phone.trim() || c.whatsapp.trim()), hint: "Заполните контакты", w: 10 },
      { ok: soc.some((s) => s.value.trim()), hint: "Добавьте соцсеть", w: 5 },
    ];
    const total = items.reduce((sum, i) => sum + i.w, 0);
    const got = items.reduce((sum, i) => sum + (i.ok ? i.w : 0), 0);
    const missing = items.filter((i) => !i.ok).sort((a, b) => b.w - a.w).slice(0, 2);
    return { pct: Math.round((got / total) * 100), missing };
  })();

  return (
    <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }} className="editor-grid">
      {/* Заполненность анкеты */}
      <div className="card card-pad" style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: "0.95rem" }}>{t("Заполненность анкеты")}: {completeness.pct}%</strong>
          {completeness.pct === 100 && <span className="badge badge-accepted">✓ {t("Анкета заполнена полностью")}</span>}
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
          <div style={{ width: `${completeness.pct}%`, height: "100%", borderRadius: 999, background: completeness.pct >= 80 ? "var(--good)" : "var(--brand)", transition: "width .3s" }} />
        </div>
        {completeness.missing.length > 0 && (
          <div className="muted" style={{ fontSize: "0.85rem", display: "flex", gap: 14, flexWrap: "wrap" }}>
            {completeness.missing.map((m) => (
              <span key={m.hint}>→ {t(m.hint)} <span style={{ color: "var(--brand)", fontWeight: 700 }}>+{m.w}%</span></span>
            ))}
          </div>
        )}
      </div>

      {/* Основное */}
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Основное")}</h3>

        <div className="field">
          <label className="label">{t("Профессия")}</label>
          <select className="select" value={f.profession} onChange={(e) => setF({ ...f, profession: e.target.value })}>
            {professions.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {profName(p, lang)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">{t("Имя / название")}</label>
          <input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="label">{t("Город")}</label>
            <input className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          </div>
          <div className="field">
            <label className="label">{t("Стаж (лет)")}</label>
            <input className="input" type="number" min={0} value={f.experience_years} onChange={(e) => setF({ ...f, experience_years: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label className="label">{t("Цена от (₸) — пусто = договорная")}</label>
          <input className="input" type="number" min={0} value={f.price_from} onChange={(e) => setF({ ...f, price_from: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">{t("Короткое описание")}</label>
          <input className="input" maxLength={120} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">{t("Подробно о себе")}</label>
          <textarea className="textarea" value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} />
        </div>

        {/* ИИ-инструменты (бесплатный ИИ платформы — доступен всегда) */}
        {aiOn && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              {f.about.trim().length >= 40 ? t("ИИ отполирует ваше описание и подберёт теги — бесплатно.") : t("Не знаете, что писать? ИИ красиво заполнит «о себе» по вашей профессии — бесплатно.")}
            </span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary btn-sm" disabled={aiBusy !== ""} onClick={aiAssist}>
                {aiBusy === "assist" ? t("Пишем…") : f.about.trim().length >= 40 ? `✨ ${t("Улучшить описание (ИИ)")}` : `✨ ${t("Заполнить о себе (ИИ)")}`}
              </button>
              <button type="button" className="btn btn-outline btn-sm" disabled={aiBusy !== "" || !f.about.trim()} onClick={aiTranslate}>
                {aiBusy === "translate" ? t("Переводим…") : `🇰🇿 ${t("Перевести на казахский (ИИ)")}`}
              </button>
            </div>
            {(kk.tagline_kk || kk.about_kk) && (
              <>
                <input className="input" placeholder="Слоган (қазақша)" value={kk.tagline_kk} onChange={(e) => setKk({ ...kk, tagline_kk: e.target.value })} />
                <textarea className="textarea" style={{ minHeight: 70 }} placeholder="Өзіңіз туралы (қазақша)" value={kk.about_kk} onChange={(e) => setKk({ ...kk, about_kk: e.target.value })} />
              </>
            )}
            {modWarn && <span className="badge badge-pending">⚠ {t("ИИ-модерация")}: {modWarn}</span>}
          </div>
        )}
        <div className="field">
          <label className="label">{t("Теги (по ним вас найдут в фильтре)")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {tags.map((t) => (
              <span key={t} className="chip" style={{ cursor: "default", fontSize: "0.82rem" }}>
                #{t}
                <span onClick={() => setTags((g) => g.filter((x) => x !== t))} style={{ cursor: "pointer", marginLeft: 2 }}>×</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder={t("Например: на казахском")}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = tagInput.trim();
                  if (v && !tags.includes(v)) setTags((g) => [...g, v]);
                  setTagInput("");
                }
              }}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { const v = tagInput.trim(); if (v && !tags.includes(v)) setTags((g) => [...g, v]); setTagInput(""); }}
            >
              {t("Добавить")}
            </button>
          </div>
        </div>

        {attrFields.length > 0 && (
          <div className="field">
            <label className="label">{t("Детали")} ({profName(professions.find((p) => p.id === f.profession), lang)})</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {attrFields.map((fld) => (
                <div key={fld.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {fld.type === "bool" ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 0" }}>
                      <input type="checkbox" checked={!!attrs[fld.key]} onChange={(e) => setAttrs((a) => ({ ...a, [fld.key]: e.target.checked }))} />
                      <span className="soft">{t(fld.label)}</span>
                    </label>
                  ) : fld.type === "select" ? (
                    <>
                      <span className="label" style={{ fontSize: "0.8rem" }}>{t(fld.label)}</span>
                      <select className="select" value={String(attrs[fld.key] ?? "")} onChange={(e) => setAttrs((a) => ({ ...a, [fld.key]: e.target.value }))}>
                        <option value="">—</option>
                        {fld.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <span className="label" style={{ fontSize: "0.8rem" }}>{t(fld.label)}</span>
                      <input
                        className="input"
                        type={fld.type === "number" ? "number" : "text"}
                        placeholder={fld.placeholder}
                        value={String(attrs[fld.key] ?? "")}
                        onChange={(e) => setAttrs((a) => ({ ...a, [fld.key]: fld.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value }))}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
          <span className="soft">{t("Показывать анкету в каталоге")}</span>
        </label>
      </div>

      {/* Медиа + контакты */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Фото и видео")}</h3>

          {/* Аватар */}
          <div className="field">
            <label className="label">{t("Главное фото")}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.avatar_url || "https://picsum.photos/seed/placeholder/200"} alt="" className="avatar" style={{ width: 60, height: 60 }} />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => avatarInput.current?.click()}>{t("Загрузить")}</button>
              <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onAvatarPick} />
            </div>
          </div>

          {/* Галерея с перемещением фото */}
          <div className="field">
            <label className="label">{t("Галерея работ")}</label>
            <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 8px" }}>{t("Первое фото — обложка в каталоге. Меняйте порядок стрелками.")}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {gallery.map((url, i) => (
                <div key={url + i} style={{ width: 96, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ position: "relative", width: 96, height: 72, borderRadius: 8, overflow: "hidden", border: i === 0 ? "2px solid var(--brand)" : "1px solid var(--border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {i === 0 && (
                      <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--brand)", color: "#fff", fontSize: 9, fontWeight: 700, textAlign: "center", padding: "1px 0" }}>{t("ОБЛОЖКА")}</span>
                    )}
                    <button type="button" onClick={() => setGallery((g) => g.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer", fontSize: 11, lineHeight: 1 }}>×</button>
                  </div>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}
                      className="btn btn-outline btn-sm" style={{ padding: "2px 8px", opacity: i === 0 ? 0.4 : 1 }}>←</button>
                    <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === gallery.length - 1}
                      className="btn btn-outline btn-sm" style={{ padding: "2px 8px", opacity: i === gallery.length - 1 ? 0.4 : 1 }}>→</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => galleryInput.current?.click()}>{t("+ Добавить фото")}</button>
            <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={onGalleryPick} />
          </div>

          {/* Видео-визитка: загрузка файлом или ссылка */}
          <div className="field">
            <label className="label">{t("Видео-визитка")}</label>
            {f.video_url ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="badge badge-accepted">{t("✓ Видео добавлено")}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, video_url: "" })}>{t("Убрать")}</button>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: "0.78rem", margin: "0 0 8px" }}>{t("Пока не добавлено. Загрузите файл или вставьте ссылку.")}</p>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => videoInput.current?.click()}>{t("⬆ Загрузить видео")}</button>
              <span className="muted" style={{ fontSize: "0.8rem" }}>{t("или")}</span>
            </div>
            <input ref={videoInput} type="file" accept="video/*" hidden onChange={onVideoPick} />
            <input className="input" placeholder={t("Ссылка YouTube или mp4")} value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} />
          </div>

          {uploading && <div className="badge badge-soft">{t("Загрузка файла…")}</div>}
        </div>

        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Соцсети и ссылки")}</h3>
          <p className="soft" style={{ fontSize: "0.85rem", margin: 0 }}>
            {t("Галочка «всем» — ссылка видна каждому (портфолио). Без галочки — откроется только после подтверждения запроса.")}
          </p>
          {soc.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "var(--brand)", display: "inline-flex", flex: "none" }}><BrandIcon type={s.type} size={18} /></span>
              <select
                className="select"
                value={s.type}
                onChange={(e) => setSoc((arr) => arr.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
                style={{ flex: "0 0 140px" }}
              >
                {SOCIAL_ORDER.map((t) => (
                  <option key={t} value={t}>{SOCIAL_META[t].label}</option>
                ))}
              </select>
              <input
                className="input"
                placeholder={t("@ник или ссылка")}
                value={s.value}
                onChange={(e) => setSoc((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                style={{ flex: "1 1 120px" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                <input
                  type="checkbox"
                  checked={s.is_public}
                  onChange={(e) => setSoc((arr) => arr.map((x, j) => (j === i ? { ...x, is_public: e.target.checked } : x)))}
                />
                {t("всем")}
              </label>
              <button type="button" onClick={() => setSoc((arr) => arr.filter((_, j) => j !== i))}
                className="btn btn-ghost btn-sm" style={{ padding: "4px 9px" }}>×</button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ alignSelf: "flex-start" }}
            onClick={() => setSoc((arr) => [...arr, { type: "instagram", value: "", is_public: true }])}
          >
            {t("+ Добавить соцсеть")}
          </button>
        </div>

        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 className="h2" style={{ fontSize: "1.1rem", margin: 0 }}>{t("Контакты для связи")}</h3>
          <p className="soft" style={{ fontSize: "0.85rem", margin: 0 }}>{t("Телефон и мессенджеры откроются заказчику только после того, как вы подтвердите его запрос.")}</p>
          <div className="field"><label className="label">{t("Телефон")}</label><input className="input" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></div>
          <div className="field"><label className="label">WhatsApp</label><input className="input" value={c.whatsapp} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} /></div>
          <div className="field"><label className="label">Telegram</label><input className="input" placeholder="@username" value={c.telegram} onChange={(e) => setC({ ...c, telegram: e.target.value })} /></div>
        </div>
      </div>

      {/* Сохранение */}
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 14 }}>
        <button className="btn btn-primary" disabled={busy || uploading}>{busy ? t("Сохраняем…") : t("Сохранить анкету")}</button>
        {msg && <span className={`badge ${msg.ok ? "badge-accepted" : "badge-declined"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
