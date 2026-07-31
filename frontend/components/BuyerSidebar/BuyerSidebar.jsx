import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { FaClipboardList, FaExclamationTriangle, FaStar, FaHistory, FaUserCircle, FaTachometerAlt, FaMapMarkedAlt } from "react-icons/fa";
import "./BuyerSidebar.css";

export default function BuyerSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const currentPath = location.pathname.toLowerCase();

  const menuItems = [
    {
      label: t("sidebar.dashboard"),
      path: "/buyer/dashboard",
      icon: <FaTachometerAlt className="sidebar-icon" />,
      active: currentPath === "/buyer/dashboard" || currentPath === "/buyer" || currentPath === "/buyer/"
    },
    {
      label: t("sidebar.preOrder"),
      path: "/buyer/preorder",
      icon: <FaClipboardList className="sidebar-icon" />,
      active: currentPath === "/buyer/preorder" || currentPath === "/buyer/pre-order"
    },
    {
      label: t("sidebar.complaints"),
      path: "/buyer/complaints",
      icon: <FaExclamationTriangle className="sidebar-icon" />,
      active: currentPath === "/buyer/complaints"
    },
    {
      label: t("sidebar.ratings"),
      path: "/buyer/ratings",
      icon: <FaStar className="sidebar-icon" />,
      active: currentPath === "/buyer/ratings"
    },
    {
      label: t("sidebar.viewOrderHistory"),
      path: "/buyer/buyerorderhistory",
      icon: <FaHistory className="sidebar-icon" />,
      active: currentPath === "/buyer/buyerorderhistory"
    },
    {
      label: t("sidebar.mapSearch"),
      path: "/buyer/mapsearch",
      icon: <FaMapMarkedAlt className="sidebar-icon" />,
      active: currentPath === "/buyer/mapsearch"
    }
  ];

  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <aside className="buyer-sidebar">
      <div className="sidebar-nav-group">
        <p className="sidebar-nav-title">{t("sidebar.buyerPanel")}</p>
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`sidebar-menu-item ${item.active ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              {item.icon}
              <span className="sidebar-nav-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="sidebar-profile-footer"
        onClick={() => navigate("/profile")}
        title={t("sidebar.profile")}
      >
        <div className={`sidebar-avatar-circle ${currentPath === "/profile" ? "active-avatar" : ""}`} style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {user?.profile_image ? (
            <img 
              src={user.profile_image.startsWith("http") || user.profile_image.startsWith("/") ? user.profile_image : "/" + user.profile_image} 
              alt="Profile" 
              className="sidebar-avatar-img"
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
            />
          ) : user?.name ? (
            <span className="avatar-text">{getInitials()}</span>
          ) : (
            <FaUserCircle className="avatar-icon" />
          )}
        </div>
        <div className="sidebar-profile-info">
          <span className={`sidebar-profile-label ${currentPath === "/profile" ? "active-text" : ""}`}>{t("sidebar.profile")}</span>
        </div>
      </div>
    </aside>
  );
}