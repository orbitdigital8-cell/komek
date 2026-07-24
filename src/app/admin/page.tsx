import { requireAdmin } from "@/lib/supabase/admin";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await requireAdmin())) {
    return (
      <div className="container-narrow" style={{ padding: "48px 22px", textAlign: "center" }}>
        <div className="card card-pad">
          <div style={{ fontSize: 34 }}>🔒</div>
          <h1 className="h2" style={{ margin: "8px 0" }}>Доступ только для администратора</h1>
          <p className="soft">Войдите под учётной записью с ролью <code>admin</code>.</p>
        </div>
      </div>
    );
  }
  return <AdminPanel />;
}
