"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const error = await signIn(email, password);
    setBusy(false);
    if (error) {
      setErr("Неверный email или пароль");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="container-narrow" style={{ padding: "48px 20px" }}>
      <div className="card card-pad" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 className="h2" style={{ marginBottom: 4 }}>Вход</h1>
        <p className="soft" style={{ marginBottom: 20 }}>Рады видеть снова 👋</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Пароль</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <div className="badge badge-declined">{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Входим…" : "Войти"}
          </button>
        </form>
        <p className="soft" style={{ marginTop: 16, fontSize: "0.9rem", textAlign: "center" }}>
          Нет аккаунта? <Link href={`/register?next=${encodeURIComponent(next)}`} className="link">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
