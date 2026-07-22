import { NextResponse } from "next/server";
import { supabaseAdmin, adminEnabled } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!adminEnabled()) return NextResponse.json({ error: "disabled" }, { status: 403 });
  const sb = supabaseAdmin();

  const [professions, specialists, requests, reviews, profiles, busy, contacts, socials] = await Promise.all([
    sb.from("professions").select("*").order("sort_order"),
    sb.from("specialists").select("*").order("created_at", { ascending: false }),
    sb.from("contact_requests").select("*").order("created_at", { ascending: false }),
    sb.from("reviews").select("*").order("created_at", { ascending: false }),
    sb.from("profiles").select("*"),
    sb.from("specialist_busy").select("*"),
    sb.from("specialist_contacts").select("*"),
    sb.from("specialist_socials").select("*"),
  ]);

  return NextResponse.json({
    professions: professions.data ?? [],
    specialists: specialists.data ?? [],
    requests: requests.data ?? [],
    reviews: reviews.data ?? [],
    profiles: profiles.data ?? [],
    busy: busy.data ?? [],
    contacts: contacts.data ?? [],
    socials: socials.data ?? [],
  });
}
