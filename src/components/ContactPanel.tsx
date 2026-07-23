"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import BrandIcon from "@/components/BrandIcon";
import { useLang } from "@/lib/lang";
import { priceLabelL } from "@/lib/i18n";
import { socialHref, SOCIAL_META, STATUS_LABEL, type ContactRequest, type Social, type SpecialistContacts, type Specialist } from "@/lib/types";

export default function ContactPanel({ specialist, busyDates = [] }: { specialist: Specialist; busyDates?: string[] }) {
  const sb = supabaseBrowser();
  const { user, name, loading: authLoading } = useAuth();
  const { lang, t } = useLang();

  const [req, setReq] = useState<ContactRequest | null>(null);
  const [contacts, setContacts] = useState<SpecialistContacts | null>(null);
  const [gatedSocials, setGatedSocials] = useState<Social[]>([]);
  const [ready, setReady] = useState(false);

  // форма запроса
  const [form, setForm] = useState({ client_name: "", client_phone: "", event_date: "", message: "" });
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isOwner = !!user && user.id === specialist.owner_id;

  const loadContacts = useCallback(
    async (specialistId: string) => {
      const { data } = await sb.from("specialist_contacts").select("*").eq("specialist_id", specialistId).maybeSingle();
      setContacts((data as SpecialistContacts) ?? null);
      // Соцсети: RLS вернёт публичные + скрытые (раз доступ есть). Показываем скрытые.
      const { data: soc } = await sb.from("specialist_socials").select("*").eq("specialist_id", specialistId).order("sort_order");
      setGatedSocials(((soc as Social[]) ?? []).filter((x) => !x.is_public));
    },
    [sb],
  );

  const loadState = useCallback(async () => {
    if (!user) {
      setReady(true);
      return;
    }
    const { data } = await sb
      .from("contact_requests")
      .select("*")
      .eq("specialist_id", specialist.id)
      .eq("client_id", user.id)
      .maybeSingle();
    const r = (data as ContactRequest) ?? null;
    setReq(r);
    if (r?.status === "accepted" || isOwner) await loadContacts(specialist.id);
    setReady(true);
  }, [sb, user, specialist.id, isOwner, loadContacts]);

  useEffect(() => {
    if (!authLoading) loadState();
  }, [authLoading, loadState]);

  useEffect(() => {
    if (user && !form.client_name && name) setForm((f) => ({ ...f, client_name: name }));
  }, [user, name, form.client_name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSending(true);
    setErr(null);
    const { data, error } = await sb
      .from("contact_requests")
      .insert({
        specialist_id: specialist.id,
        client_id: user.id,
        client_name: form.client_name,
        client_phone: form.client_phone,
        event_date: form.event_date || null,
        message: form.message,
      })
      .select("*")
      .single();
    setSending(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const r = data as ContactRequest;
    setReq(r);
    if (r.status === "accepted") await loadContacts(specialist.id);
  }

  // ---- Верхняя плашка карточки: цена/рейтинг ----
  const priceBlock = (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
      <span className="muted" style={{ fontSize: "0.85rem" }}>{t("Стоимость")}</span>
      <strong style={{ fontSize: "1.3rem", color: "var(--brand)" }}>{priceLabelL(specialist.price_from, lang)}</strong>
    </div>
  );

  function body() {
    if (authLoading || !ready) return <div className="muted">{t("Загрузка…")}</div>;

    if (isOwner) {
      return (
        <>
          <ContactsList contacts={contacts} own />
          <GatedSocials socials={gatedSocials} />
          <Link href="/dashboard" className="btn btn-outline btn-block" style={{ marginTop: 12 }}>
            {t("Редактировать анкету")}
          </Link>
        </>
      );
    }

    // Контакты открыты
    if (req?.status === "accepted") {
      return (
        <>
          <div className="badge badge-accepted" style={{ marginBottom: 12 }}>✓ {t(STATUS_LABEL.accepted)}</div>
          <ContactsList contacts={contacts} />
          <GatedSocials socials={gatedSocials} />
        </>
      );
    }

    if (req?.status === "pending") {
      return (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>⏳</div>
          <div className="badge badge-pending" style={{ marginBottom: 10 }}>{t(STATUS_LABEL.pending)}</div>
          <p className="soft" style={{ fontSize: "0.9rem" }}>
            {t("Запрос отправлен. Как только специалист подтвердит, здесь появятся его контакты — вы увидите их и в разделе «Мои запросы».")}
          </p>
        </div>
      );
    }

    if (req?.status === "declined") {
      return (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div className="badge badge-declined" style={{ marginBottom: 10 }}>{t(STATUS_LABEL.declined)}</div>
          <p className="soft" style={{ fontSize: "0.9rem" }}>{t("К сожалению, специалист отклонил запрос на связь.")}</p>
        </div>
      );
    }

    // Не авторизован
    if (!user) {
      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🔒</div>
          <p className="soft" style={{ fontSize: "0.92rem", marginBottom: 14 }}>
            {t("Контакты откроются после того, как специалист подтвердит ваш запрос. Войдите, чтобы отправить его.")}
          </p>
          <Link href={`/login?next=/s/${specialist.id}`} className="btn btn-primary btn-block" style={{ marginBottom: 8 }}>
            {t("Войти")}
          </Link>
          <Link href={`/register?next=/s/${specialist.id}`} className="btn btn-outline btn-block">
            {t("Зарегистрироваться")}
          </Link>
        </div>
      );
    }

    // Форма запроса
    return (
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="soft" style={{ fontSize: "0.9rem", margin: 0 }}>
          {t("Оставьте запрос — специалист подтвердит и откроет контакты.")}
        </p>
        <div className="field">
          <label className="label">{t("Ваше имя")}</label>
          <input className="input" required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">{t("Телефон для связи")}</label>
          <input className="input" required placeholder="+7 ___ ___ __ __" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">{t("Дата мероприятия")}</label>
          <input className="input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          {form.event_date && busyDates.includes(form.event_date) && (
            <span className="badge badge-declined" style={{ marginTop: 4 }}>{t("⚠ Специалист занят в этот день — можно уточнить в сообщении")}</span>
          )}
          {form.event_date && !busyDates.includes(form.event_date) && (
            <span className="badge badge-accepted" style={{ marginTop: 4 }}>{t("✓ В этот день специалист свободен")}</span>
          )}
        </div>
        <div className="field">
          <label className="label">{t("Сообщение")}</label>
          <textarea className="textarea" placeholder={t("Коротко о мероприятии: где, во сколько, что нужно")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        {err && <div className="badge badge-declined">{err}</div>}
        <button className="btn btn-primary btn-block" disabled={sending}>
          {sending ? t("Отправляем…") : t("Отправить запрос")}
        </button>
      </form>
    );
  }

  return (
    <div className="card card-pad" style={{ position: "sticky", top: 84 }}>
      {priceBlock}
      <hr className="divider" style={{ margin: "12px 0 16px" }} />
      {body()}
    </div>
  );
}

function GatedSocials({ socials }: { socials: Social[] }) {
  if (socials.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {socials.map((s) => {
        const meta = SOCIAL_META[s.type] ?? { label: s.type };
        return (
          <a key={s.id} href={socialHref(s.type, s.value)} target="_blank" rel="noreferrer" className="chip" style={{ cursor: "pointer", gap: 8 }}>
            <BrandIcon type={s.type} size={16} /> {meta.label}
          </a>
        );
      })}
    </div>
  );
}

function ContactsList({ contacts, own }: { contacts: SpecialistContacts | null; own?: boolean }) {
  const { t } = useLang();
  if (!contacts) return <div className="muted">{t("Контакты не заполнены.")}</div>;
  const rows: { type: string; label: string; value: string; href?: string }[] = [];
  if (contacts.phone) rows.push({ type: "phone", label: t("Телефон"), value: contacts.phone, href: `tel:${contacts.phone.replace(/\s/g, "")}` });
  if (contacts.whatsapp) rows.push({ type: "whatsapp", label: "WhatsApp", value: contacts.whatsapp, href: `https://wa.me/${contacts.whatsapp.replace(/[^\d]/g, "")}` });
  if (contacts.telegram) rows.push({ type: "telegram", label: "Telegram", value: contacts.telegram, href: `https://t.me/${contacts.telegram.replace(/^@/, "")}` });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {own && <div className="muted" style={{ fontSize: "0.82rem", marginBottom: 2 }}>{t("Ваши контакты (видны заказчику после подтверждения):")}</div>}
      {rows.length === 0 && <div className="muted">{t("Контакты не заполнены.")}</div>}
      {rows.map((r) => (
        <a
          key={r.label}
          href={r.href}
          target="_blank"
          rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}
        >
          <span style={{ color: "var(--brand)", display: "inline-flex" }}><BrandIcon type={r.type} size={20} /></span>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span className="muted" style={{ fontSize: "0.76rem" }}>{r.label}</span>
            <strong style={{ fontSize: "0.95rem" }}>{r.value}</strong>
          </span>
        </a>
      ))}
    </div>
  );
}
