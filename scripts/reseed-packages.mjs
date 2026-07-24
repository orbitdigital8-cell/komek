// Перезаписывает демо-пакеты услуг по профессиям в текущей БД (без db reset).
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { PKG_BY_PROF } from "./packages-data.mjs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.SUPABASE_URL_SERVER || env.NEXT_PUBLIC_SUPABASE_URL;
const sb = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Демо-специалисты (owner_id is null) с пакетами
const { data: specs } = await sb.from("specialists").select("id, profession").is("owner_id", null);
const { data: existing } = await sb.from("specialist_packages").select("specialist_id");
const havePkg = new Set((existing ?? []).map((r) => r.specialist_id));

// Удаляем старые демо-пакеты и вставляем новые по профессии
let del = 0, ins = 0;
for (const s of specs ?? []) {
  if (!havePkg.has(s.id)) continue;
  const tiers = PKG_BY_PROF[s.profession];
  await sb.from("specialist_packages").delete().eq("specialist_id", s.id);
  del++;
  if (!tiers) continue;
  const rows = tiers.map(([name, price, description], sort_order) => ({ specialist_id: s.id, name, price, description, sort_order }));
  const { error } = await sb.from("specialist_packages").insert(rows);
  if (!error) ins += rows.length;
}
console.log(`reseed packages: cleared ${del} specialists, inserted ${ins} packages`);
