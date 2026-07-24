import { NextResponse } from "next/server";
import { supabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Пакеты услуг и примеры работ для режима отладки (обход RLS через service_role).
// action: list | add_package | del_package | add_case | del_case
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const b = await req.json();
  const sb = supabaseAdmin();
  const sid = b.specialistId as string;
  if (!sid) return NextResponse.json({ error: "no specialistId" }, { status: 400 });

  if (b.action === "list") {
    const [{ data: packages }, { data: cases }] = await Promise.all([
      sb.from("specialist_packages").select("*").eq("specialist_id", sid).order("sort_order"),
      sb.from("portfolio_cases").select("*").eq("specialist_id", sid).order("sort_order"),
    ]);
    return NextResponse.json({ packages: packages ?? [], cases: cases ?? [] });
  }

  if (b.action === "add_package") {
    const { error } = await sb.from("specialist_packages").insert({
      specialist_id: sid, name: b.name, price: b.price, description: b.description ?? "", sort_order: b.sort_order ?? 0,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "del_package") {
    await sb.from("specialist_packages").delete().eq("id", b.id);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "add_case") {
    const { error } = await sb.from("portfolio_cases").insert({
      specialist_id: sid, title: b.title, description: b.description ?? "", photos: b.photos ?? [], videos: b.videos ?? [], event_date: b.event_date || null, sort_order: b.sort_order ?? 0,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "update_case") {
    const { error } = await sb.from("portfolio_cases")
      .update({ title: b.title, description: b.description ?? "", photos: b.photos ?? [], videos: b.videos ?? [], event_date: b.event_date || null })
      .eq("id", b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (b.action === "del_case") {
    await sb.from("portfolio_cases").delete().eq("id", b.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
