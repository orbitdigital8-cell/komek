import { adminEnabled } from "@/lib/supabase/admin";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!adminEnabled()) {
    return (
      <div className="container-narrow" style={{ padding: "48px 22px", textAlign: "center" }}>
        <div className="card card-pad">
          <div style={{ fontSize: 34 }}>🔒</div>
          <h1 className="h2" style={{ margin: "8px 0" }}>Админ-панель отключена</h1>
          <p className="soft">Установите <code>ADMIN_DEBUG=1</code> в <code>.env.local</code> и перезапустите dev-сервер.</p>
        </div>
      </div>
    );
  }
  return <AdminPanel />;
}
