import { NextResponse } from "next/server";
import { supabaseAdmin, adminEnabled } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Действия биржи заявок в режиме отладки персон (обход RLS через service_role).
// action: create | bid | close | pick
export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const body = await req.json();
  const sb = supabaseAdmin();

  if (body.action === "create") {
    const { error } = await sb.from("open_requests").insert({
      client_id: body.clientId ?? null,
      client_name: body.clientName ?? "Заказчик",
      professions: body.professions,
      city: body.city,
      event_date: body.eventDate || null,
      budget: body.budget || null,
      details: body.details ?? "",
      is_demo: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "bid") {
    const { error } = await sb.from("open_request_bids").upsert(
      { request_id: body.requestId, specialist_id: body.specialistId, price: body.price || null, message: body.message ?? "" },
      { onConflict: "request_id,specialist_id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "close") {
    const { error } = await sb.from("open_requests").update({ status: "closed" }).eq("id", body.requestId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "pick") {
    // Клиент выбрал отклик → создаём обычный запрос на связь (дальше — привычный поток)
    const { error } = await sb.from("contact_requests").insert({
      specialist_id: body.specialistId,
      client_id: body.clientId,
      client_name: body.clientName ?? "Заказчик",
      client_phone: "",
      event_date: body.eventDate || null,
      message: body.message ?? "Выбрал(а) ваш отклик на бирже заказов.",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
