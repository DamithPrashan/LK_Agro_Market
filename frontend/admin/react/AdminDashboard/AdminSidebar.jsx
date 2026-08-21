import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  FiGrid,
  FiShield,
  FiAlertTriangle,
  FiUsers,
  FiUser,
  FiLogOut,
  FiTruck,
} from "react-icons/fi";

export default function AdminSidebar() {

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();


  const menuItems = [
    {
      label: t("admin.sidebar.dashboard"),
      icon: <FiGrid />,
      path: "/admin",
    },

    {
      label: t("admin.sidebar.verification"),
      icon: <FiShield />,
      path: "/admin/farmer-verification",
    },

    {
      label: t("admin.sidebar.complaints"),
      icon: <FiAlertTriangle />,
      path: "/admin/complaints",
    },

    {
      label: t("admin.sidebar.users"),
      icon: <FiUsers />,
      path: "/admin/users",
    },
  ];


  const isActive = (path) => {

    if (path === "/admin") {
      return location.pathname === "/admin";
    }

    return location.pathname.startsWith(path);
  };


  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/login");
  };


  return (

    <aside className="admin-sidebar">


      {/* =========================
          BRAND
      ========================= */}

      <div className="admin-sidebar-brand">

        <div className="admin-sidebar-logo">
          <FiTruck />
        </div>

        <div>

          <h2>
            {t("admin.sidebar.brand")}
          </h2>

          <p>
            {t("admin.sidebar.enterpriseAdmin")}
          </p>

        </div>

      </div>


      {/* =========================
          NAVIGATION
      ========================= */}

      <nav className="admin-sidebar-nav">

        {menuItems.map((item) => (

          <button
            key={item.path}
            type="button"
            className={`admin-nav-item ${
              isActive(item.path)
                ? "active"
                : ""
            }`}
            onClick={() =>
              navigate(item.path)
            }
          >

            <span className="admin-nav-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>

          </button>

        ))}

      </nav>


      {/* =========================
          BOTTOM
      ========================= */}

      <div className="admin-sidebar-bottom">


        <button
          type="button"
          className={`admin-profile-btn ${isActive("/profile") ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >

          <FiUser />

          <span>
            {t("admin.sidebar.profile")}
          </span>

        </button>


        <div className="admin-sidebar-divider" />


        <button
          type="button"
          className="admin-bottom-link logout"
          onClick={handleLogout}
        >

          <FiLogOut />

          <span>
            {t("admin.sidebar.logout")}
          </span>

        </button>


      </div>

    </aside>
  );
}
