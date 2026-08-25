import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import RequireRole from "../../../../src/components/RequireRole";

import "../../csss/AdminDashboard/admin.css";

export default function AdminLayout() {
  return (
    <RequireRole role="admin">
      <div className="admin-shell">

        <AdminSidebar />

        <main className="admin-main">
          <Outlet />
        </main>

      </div>
    </RequireRole>
  );
}
