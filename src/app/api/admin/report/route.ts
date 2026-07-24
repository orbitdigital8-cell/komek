import { NextResponse } from "next/server";
import { supabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Смена статуса жалобы (решена / вернуть в новые) — только для локальной отладки
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const { id, status } = await req.json();
  if (!id || !["new", "resolved"].includes(status)) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { error } = await sb.from("reports").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
