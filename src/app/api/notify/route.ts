import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyUsers, ownersByProfessions } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP = process.env.NEXT_PUBLIC_APP_URL || "";

// Единая точка отправки уведомлений по событиям. Данные берём из БД по id
// (клиент не передаёт адресатов), поэтому подделать получателя нельзя.
export async function POST(req: Request) {
  const { type, id, fromRole } = await req.json();
  const sb = supabaseAdmin();

  // Новая заявка на связь конкретному специалисту
  if (type === "request") {
    const { data: r } = await sb.from("contact_requests").select("specialist_id, client_name, event_date").eq("id", id).maybeSingle();
    if (!r) return NextResponse.json({ ok: false });
    const { data: s } = await sb.from("specialists").select("owner_id").eq("id", r.specialist_id).maybeSingle();
    if (s?.owner_id) {
      await notifyUsers([s.owner_id], {
        title: "Новая заявка на связь",
        body: `${r.client_name || "Заказчик"}${r.event_date ? ` · ${r.event_date}` : ""} ждёт подтверждения`,
        url: `${APP}/dashboard`,
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Новое сообщение в чате — уведомляем другую сторону
  if (type === "message") {
    const { data: r } = await sb.from("contact_requests").select("specialist_id, client_id, client_name").eq("id", id).maybeSingle();
    if (!r) return NextResponse.json({ ok: false });
    if (fromRole === "client") {
      const { data: s } = await sb.from("specialists").select("owner_id, name").eq("id", r.specialist_id).maybeSingle();
      if (s?.owner_id) await notifyUsers([s.owner_id], { title: "Новое сообщение", body: `${r.client_name || "Заказчик"} написал вам`, url: `${APP}/dashboard` });
    } else {
      const { data: s } = await sb.from("specialists").select("name").eq("id", r.specialist_id).maybeSingle();
      await notifyUsers([r.client_id], { title: "Новое сообщение", body: `${s?.name || "Специалист"} ответил вам`, url: `${APP}/requests` });
    }
    return NextResponse.json({ ok: true });
  }

  // Новая заявка на бирже → всем подходящим специалистам
  if (type === "openrequest") {
    const { data: r } = await sb.from("open_requests").select("professions, city, event_date").eq("id", id).maybeSingle();
    if (!r) return NextResponse.json({ ok: false });
    const owners = await ownersByProfessions(r.professions as string[]);
    if (owners.length) {
      await notifyUsers(owners, {
        title: "Новый заказ на бирже",
        body: `Клиент ищет специалиста${r.city ? ` · ${r.city}` : ""}${r.event_date ? ` · ${r.event_date}` : ""}. Откликнитесь!`,
        url: `${APP}/orders`,
      });
    }
    return NextResponse.json({ ok: true, sent: owners.length });
  }

  // Клиент выбрал отклик специалиста на бирже
  if (type === "pick") {
    const { data: sp } = await sb.from("specialists").select("owner_id").eq("id", id).maybeSingle();
    if (sp?.owner_id) await notifyUsers([sp.owner_id], { title: "Вас выбрали на бирже!", body: "Заказчик выбрал ваш отклик — ждёт связи.", url: `${APP}/dashboard` });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown type" }, { status: 400 });
}
