import { NextResponse } from "next/server";
import { supabaseAdmin, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Отладка: сохранить анкету выбранного специалиста в обход RLS.
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const body = await req.json();
  const specialistId: string = body.specialistId;
  if (!specialistId) return NextResponse.json({ error: "no id" }, { status: 400 });

  const sb = supabaseAdmin();
  const p = body.profile ?? {};
  // белый список редактируемых полей (owner_id/is_demo/id не трогаем)
  const profile = {
    profession: p.profession,
    name: p.name,
    city: p.city,
    tagline: p.tagline,
    about: p.about,
    price_from: p.price_from,
    experience_years: p.experience_years,
    avatar_url: p.avatar_url,
    video_url: p.video_url,
    work_link: p.work_link,
    gallery: p.gallery,
    tags: p.tags,
    attributes: p.attributes,
    published: p.published,
  };

  const upd = await sb.from("specialists").update(profile).eq("id", specialistId);
  if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });

  if (body.contacts) {
    const c = await sb.from("specialist_contacts").upsert({ specialist_id: specialistId, ...body.contacts }, { onConflict: "specialist_id" });
    if (c.error) return NextResponse.json({ error: c.error.message }, { status: 500 });
  }

  if (Array.isArray(body.socials)) {
    await sb.from("specialist_socials").delete().eq("specialist_id", specialistId);
    const rows = body.socials
      .filter((s: { value: string }) => s.value?.trim())
      .map((s: { type: string; value: string; is_public: boolean }, i: number) => ({ specialist_id: specialistId, type: s.type, value: s.value.trim(), is_public: s.is_public, sort_order: i }));
    if (rows.length) {
      const sErr = await sb.from("specialist_socials").insert(rows);
      if (sErr.error) return NextResponse.json({ error: sErr.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
