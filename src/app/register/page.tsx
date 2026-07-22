"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

function RegisterForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";
  const initialRole: Role = params.get("role") === "specialist" ? "specialist" : "client";

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setErr("Пароль минимум 6 символов");
      return;
    }
    setBusy(true);
    setErr(null);
    const error = await signUp(email, password, name, role);
    setBusy(false);
    if (error) {
      setErr(error.includes("already") ? "Такой email уже зарегистрирован" : error);
      return;
    }
    // Специалист идёт заполнять анкету, заказчик — куда шёл или в каталог
    const dest = role === "specialist" ? "/dashboard" : next || "/";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="container-narrow" style={{ padding: "48px 20px" }}>
      <div className="card card-pad" style={{ maxWidth: 460, margin: "0 auto" }}>
        <h1 className="h2" style={{ marginBottom: 4 }}>Регистрация</h1>
        <p className="soft" style={{ marginBottom: 18 }}>Выберите, как будете пользоваться платформой.</p>

        {/* Выбор роли */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <RoleCard
            active={role === "client"}
            onClick={() => setRole("client")}
            emoji="🔎"
            title="Я ищу"
            desc="Найти и заказать специалиста"
          />
          <RoleCard
            active={role === "specialist"}
            onClick={() => setRole("specialist")}
            emoji="⭐"
            title="Я специалист"
            desc="Разместить свою анкету"
          />
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label className="label">{role === "specialist" ? "Имя или название" : "Ваше имя"}</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Пароль</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <div className="badge badge-declined">{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Создаём…" : "Создать аккаунт"}
          </button>
        </form>
        <p className="soft" style={{ marginTop: 16, fontSize: "0.9rem", textAlign: "center" }}>
          Уже есть аккаунт? <Link href="/login" className="link">Войти</Link>
        </p>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, emoji, title, desc }: { active: boolean; onClick: () => void; emoji: string; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        borderColor: active ? "var(--brand)" : "var(--border)",
        boxShadow: active ? "var(--ring)" : "var(--shadow-sm)",
        background: active ? "var(--brand-soft)" : "var(--surface)",
      }}
    >
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <strong style={{ display: "block", marginTop: 4 }}>{title}</strong>
      <span className="muted" style={{ fontSize: "0.82rem" }}>{desc}</span>
    </button>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
