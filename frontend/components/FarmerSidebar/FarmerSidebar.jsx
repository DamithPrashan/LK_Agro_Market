import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";
import { FaClipboardList, FaPlus, FaSeedling, FaUserCircle, FaTachometerAlt, FaExclamationTriangle, FaStar } from "react-icons/fa";
import "./FarmerSidebar.css";

export default function FarmerSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/farmer/dashboard",
      icon: <FaTachometerAlt className="sidebar-icon" />,
      active: currentPath === "/farmer/dashboard" || currentPath === "/farmer" || currentPath === "/farmer/"
    },
    {
      label: "My Orders",
      path: "/farmer/orders",
      icon: <FaClipboardList className="sidebar-icon" />,
      active: currentPath === "/farmer/orders"
    },
    {
      label: "Add Listing",
      path: "/farmer/add-listing",
      icon: <FaPlus className="sidebar-icon" />,
      active: currentPath === "/farmer/add-listing"
    },
    {
      label: "My Listings",
      path: "/farmer/listings",
      icon: <FaSeedling className="sidebar-icon" />,
      active: currentPath === "/farmer/listings"
    },
    {
      label: "Complaints",
      path: "/farmer/complaints",
      icon: <FaExclamationTriangle className="sidebar-icon" />,
      active: currentPath === "/farmer/complaints"
    },
    {
      label: "Ratings",
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
        <p className="sidebar-nav-title">FARMER PANEL</p>
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
        title="Profile"
      >
        <div className={`sidebar-avatar-circle ${currentPath === "/profile" ? "active-avatar" : ""}`}>
          {user?.name ? (
            <span className="avatar-text">{getInitials()}</span>
          ) : (
            <FaUserCircle className="avatar-icon" />
          )}
        </div>
        <div className="sidebar-profile-info">
          <span className={`sidebar-profile-label ${currentPath === "/profile" ? "active-text" : ""}`}>Profile</span>
        </div>
      </div>
    </aside>
  );
}
