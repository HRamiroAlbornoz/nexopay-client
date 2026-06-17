import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../../components/admin/AdminSidebar";

export const AdminLayout = () => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <AdminSidebar />

      <main
        style={{
          flex: 1,
          padding: "1rem",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};
