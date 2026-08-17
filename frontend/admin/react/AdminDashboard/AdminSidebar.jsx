import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  FiGrid,
  FiShield,
  FiAlertTriangle,
  FiUsers,
  FiDownload,
  FiSettings,
  FiLogOut,
  FiTruck,
} from "react-icons/fi";

export default function AdminSidebar() {

  const navigate = useNavigate();
  const location = useLocation();


  const menuItems = [
    {
      label: "Admin Dashboard",
      icon: <FiGrid />,
      path: "/admin",
    },

    {
      label: "Farmer Verification",
      icon: <FiShield />,
      path: "/admin/farmer-verification",
    },

    {
      label: "Complaint Management",
      icon: <FiAlertTriangle />,
      path: "/admin/complaints",
    },

    {
      label: "User Management",
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
            LK Agro Market
          </h2>

          <p>
            Enterprise Admin
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
          className="admin-export-btn"
        >

          <FiDownload />

          <span>
            Export Reports
          </span>

        </button>


        <div className="admin-sidebar-divider" />


        <button
          type="button"
          className="admin-bottom-link"
        >

          <FiSettings />

          <span>
            Settings
          </span>

        </button>


        <button
          type="button"
          className="admin-bottom-link logout"
          onClick={handleLogout}
        >

          <FiLogOut />

          <span>
            Logout
          </span>

        </button>


      </div>

    </aside>
  );
}