import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { FaClipboardList, FaPlus, FaSeedling, FaUserCircle, FaTachometerAlt, FaExclamationTriangle, FaStar, FaLeaf } from "react-icons/fa";
import "./FarmerSidebar.css";

export default function FarmerSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const currentPath = location.pathname.toLowerCase();

  const menuItems = [
    {
      label: t("sidebar.dashboard"),
      path: "/farmer/dashboard",
      icon: <FaTachometerAlt className="sidebar-icon" />,
      active: currentPath === "/farmer/dashboard" || currentPath === "/farmer" || currentPath === "/farmer/"
    },
    {
      label: t("sidebar.myOrders"),
      path: "/farmer/orders",
      icon: <FaClipboardList className="sidebar-icon" />,
      active: currentPath === "/farmer/orders"
    },
    {
      label: t("sidebar.addListing"),
      path: "/farmer/add-listing",
      icon: <FaPlus className="sidebar-icon" />,
      active: currentPath === "/farmer/add-listing"
    },
    {
      label: t("sidebar.myListings"),
      path: "/farmer/listings",
      icon: <FaSeedling className="sidebar-icon" />,
      active: currentPath === "/farmer/listings"
    },
    {
      label: t("sidebar.addCultivationAd"),
      path: "/farmer/add-cultivation-ad",
      icon: <FaPlus className="sidebar-icon" />,
      active: currentPath === "/farmer/add-cultivation-ad"
    },
    {
      label: t("sidebar.cultivationOpportunities"),
      path: "/farmer/cultivation-opportunities",
      icon: <FaLeaf className="sidebar-icon" />,
      active: currentPath === "/farmer/cultivation-opportunities" || currentPath.startsWith("/farmer/edit-cultivation-ad/")
    },
    {
      label: t("sidebar.complaints"),
      path: "/farmer/complaints",
      icon: <FaExclamationTriangle className="sidebar-icon" />,
      active: currentPath === "/farmer/complaints"
    },
    {
      label: t("sidebar.ratings"),
      path: "/farmer/ratings",
      icon: <FaStar className="sidebar-icon" />,
      active: currentPath === "/farmer/ratings"
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
    <aside className="farmer-sidebar">
      <div className="sidebar-nav-group">
        <p className="sidebar-nav-title">{t("sidebar.farmerPanel")}</p>
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

