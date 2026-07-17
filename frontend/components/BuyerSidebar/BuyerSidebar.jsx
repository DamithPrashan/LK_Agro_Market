import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";
import { FaClipboardList, FaExclamationTriangle, FaStar, FaHistory, FaUserCircle } from "react-icons/fa";
import "./BuyerSidebar.css";

export default function BuyerSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  const menuItems = [
    {
      label: "Pre-Order",
      path: "/preorder",
      icon: <FaClipboardList className="sidebar-icon" />,
      active: currentPath === "/preorder" || currentPath === "/pre-order"
    },
    {
      label: "Complaints",
      path: "/complaints",
      icon: <FaExclamationTriangle className="sidebar-icon" />,
      active: currentPath === "/complaints"
    },
    {
      label: "Ratings",
      path: "/ratings",
      icon: <FaStar className="sidebar-icon" />,
      active: currentPath === "/ratings"
    },
    {
      label: "View Order History",
      path: "/buyer/buyerorderhistory",
      icon: <FaHistory className="sidebar-icon" />,
      active: currentPath === "/buyer/buyerorderhistory"
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
        <p className="sidebar-nav-title">BUYER PANEL</p>
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
