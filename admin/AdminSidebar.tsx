import { Link } from "react-router-dom";

export const AdminSidebar = () => {
  return (
    <aside
      style={{
        width: "220px",
        borderRight: "1px solid #ccc",
        padding: "1rem",
      }}
    >
      <h2>Admin Panel</h2>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <Link to="/admin/products">Products</Link>

        <Link to="/admin/orders">Orders</Link>
      </nav>
    </aside>
  );
};
