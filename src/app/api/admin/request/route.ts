import { NextResponse } from "next/server";
import { supabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Отладочное действие: сменить статус заявки от имени админа (в обход RLS).
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const { id, status } = await req.json();
  if (!id || !["pending", "accepted", "declined"].includes(status)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { error } = await sb.from("contact_requests").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
