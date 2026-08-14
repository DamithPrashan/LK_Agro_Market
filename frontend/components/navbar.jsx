import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import "./navbar.css";
import notificationIcon from '../assests/png/notification.png';
import logo from '../../src/assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLanguageChange = async (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("preferredLanguage", langCode);

    if (user) {
      const dbLanguage = langCode === "si" ? "sinhala" : (langCode === "ta" ? "tamil" : "english");
      login({ ...user, language: dbLanguage });

      try {
        await fetch("/backend/Apis/update_language.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ language: langCode }),
        });
      } catch (err) {
        console.error("Failed to sync language to database:", err);
      }
    }
  };

  const Logout = async () => {
    await logout();
    navigate("/");
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const response = await fetch('/backend/get_notifications.php');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter(n => n.unread).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const fetchUnreadMsgCount = async () => {
    if (!user) {
      setUnreadMsgCount(0);
      return;
    }
    try {
      const response = await fetch('/backend/Apis/get_unread_count.php', {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success) {
        setUnreadMsgCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread message count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadMsgCount();
    const interval = setInterval(fetchUnreadMsgCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMessageIconClick = () => {
    if (!user) return;
    if (user.role === "buyer") {
      navigate("/buyer/buyerorderhistory");
    } else if (user.role === "farmer") {
      navigate("/farmer/orders");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/backend/mark_notifications_read.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);

    let targetLink = notif.link;
    if (!targetLink && notif.notif_data && notif.notif_data.link) {
      targetLink = notif.notif_data.link;
    }

    const cId = notif.notif_data?.complaint_id || notif.notif_data?.complaintId || notif.notif_data?.id;

    if (user?.role === "buyer") {
      if (
        notif.notif_type === "farmerResponded" ||
        notif.notif_type === "complaintResolved" ||
        notif.notif_type === "complaintSubmitted" ||
        (notif.title && (notif.title.toLowerCase().includes("farmer responded") || notif.title.toLowerCase().includes("dispute") || notif.title.toLowerCase().includes("complaint")))
      ) {
        targetLink = cId 
          ? `/buyer/complaints?tab=farmer_response&id=${cId}`
          : `/buyer/complaints?tab=farmer_response`;
      }
    } else if (user?.role === "farmer") {
      if (
        notif.notif_type === "complaintSubmitted" ||
        notif.notif_type === "complaintResolved" ||
        (notif.title && (notif.title.toLowerCase().includes("dispute") || notif.title.toLowerCase().includes("complaint")))
      ) {
        targetLink = "/farmer/complaints";
      }
    } else if (user?.role === "admin") {
      if (cId) {
        targetLink = `/admin/complaint/${cId}`;
      }
    }

    if (!targetLink && cId) {
      if (user?.role === "buyer") {
        targetLink = `/buyer/complaints?tab=farmer_response&id=${cId}`;
      } else if (user?.role === "farmer") {
        targetLink = `/farmer/complaints`;
      } else if (user?.role === "admin") {
        targetLink = `/admin/complaint/${cId}`;
      }
    }

    // Safety rewrite if any legacy link points to /farmer-response
    if (targetLink && targetLink.includes("/farmer-response")) {
      targetLink = targetLink.replace("/farmer-response", "/buyer/complaints?tab=farmer_response");
    }

    if (targetLink) {
      if (targetLink.startsWith("/")) {
        navigate(targetLink);
      } else if (targetLink.startsWith("http")) {
        window.location.href = targetLink;
      } else {
        navigate("/" + targetLink);
      }
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.replace(/-/g, '/'));
      const locale = i18n.language === 'en' ? 'en-US' : (i18n.language === 'si' ? 'si-LK' : 'ta-LK');
      return date.toLocaleString(locale);
    } catch (e) {
      return dateStr;
    }
  };

  const getLocalizedCropName = (cropName) => {
    if (!cropName) return '';
    const nameMap = {
      'tomato': 'tomato',
      'carrot': 'carrot',
      'leeks': 'leeks',
      'capsicum': 'capsicum',
      'potato': 'potato',
      'green beans': 'greenBeans',
      'greenbeans': 'greenBeans',
      'cucumber': 'cucumber',
      'beetroot': 'beetroot',
      'radish': 'radish',
      'cabbage': 'cabbage',
      'beans': 'beans',
      'brinjal': 'brinjal',
      'avocado': 'avocado',
      'grapes': 'grapes',
      'pineapple': 'pineapple',
      'pumpkin': 'pumpkin',
      'banana': 'banana',
      'ladies finger': 'ladiesFinger',
      'ladiesfinger': 'ladiesFinger',
      'lemon': 'lemon',
      'mango': 'mango',
      'onion': 'onion',
      'watermelon': 'watermelon',
      'corn': 'corn'
    };
    const key = cropName.toLowerCase().trim();
    const mappedKey = nameMap[key] || key;
    const lookupKey = `crops.${mappedKey}`;
    const translated = t(lookupKey);
    return translated !== lookupKey ? translated : cropName;
  };

  const getLocalizedData = (data) => {
    if (!data) return {};
    const localized = { ...data };
    if (localized.cropName) {
      localized.cropName = getLocalizedCropName(localized.cropName);
    }
    return localized;
  };

  return (
    <header className={`app-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="app-brand">
        <img src={logo} alt="Logo" />
      </div>

      <nav className="app-nav">
        <div className="nav-links">
          {/* Default navbar (not logged in) */}
          {!user && (
            <>
              <NavLink to="/" end>{t("navbar.home")}</NavLink>
              <NavLink to="/browse">{t("navbar.browse")}</NavLink>
              <NavLink to="/ratings">{t("navbar.ratings")}</NavLink>
              <NavLink to="/register">{t("navbar.register")}</NavLink>
              <NavLink to="/login">{t("navbar.login")}</NavLink>
            </>
          )}

          {/* Farmer navbar */}
          {user?.role === "farmer" && (
            <>
              <NavLink to="/">{t("navbar.home")}</NavLink>
              <NavLink to="/farmer">{t("navbar.farmer")}</NavLink>
              <NavLink to="/profile">{t("navbar.profile")}</NavLink>
            </>
          )}

          {/* Buyer navbar */}
          {user?.role === "buyer" && (
            <>
              <NavLink to="/">{t("navbar.home")}</NavLink>
              <NavLink to="/browse">{t("navbar.browse")}</NavLink>
              <NavLink to="/buyer">{t("navbar.buyer")}</NavLink>
            </>
          )}

          {/* Admin navbar */}
          {user?.role === "admin" && (
            <>
              <NavLink to="/">{t("navbar.home")}</NavLink>
              <NavLink to="/admin">{t("navbar.admin")}</NavLink>
              <NavLink to="/profile">{t("navbar.profile")}</NavLink>
            </>
          )}
        </div>

        <div className="nav-right">
          <div className="language-buttons">
            <button className={`En-button ${i18n.language === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </button>

            <button className={`Si-button ${i18n.language === "si" ? "active" : ""}`}
              onClick={() => handleLanguageChange("si")}
            >
              සිං
            </button>

            <button className={`Ta-button ${i18n.language === "ta" ? "active" : ""}`}
              onClick={() => handleLanguageChange("ta")}
            >
              தமிழ்
            </button>
          </div>

          {/* --- MESSAGE BADGE & ICON --- */}
          {user && (
            <button
              className="notification-btn message-nav-btn"
              onClick={handleMessageIconClick}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.4rem",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
                marginRight: "10px",
                transition: "transform 0.2s"
              }}
              title="Messages"
            >
              💬
              {unreadMsgCount > 0 && (
                <span 
                  className="badge" 
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    lineHeight: 1,
                    minWidth: "16px",
                    textAlign: "center"
                  }}
                >
                  {unreadMsgCount}
                </span>
              )}
            </button>
          )}

          {/* --- NOTIFICATION POPUP CONTAINER --- */}
          <div className="notification-container" style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <img src={notificationIcon} alt="Notification" />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="dropdown-header">
                  <h3>{t("navbar.notifications")}</h3>
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>{t("navbar.markAllRead")}</button>
                </div>

                <div className="dropdown-body">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>{t("navbar.noNotifications")}</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="notification-item"
                        onClick={() => handleNotificationClick(notif)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className={`status-icon ${notif.type}`}></div>
                        <div className="notif-content">
                          <h4>{notif.notif_type ? t('notifications.title.' + notif.notif_type) : notif.title}</h4>
                          <p>{notif.notif_type ? t('notifications.' + notif.notif_type, getLocalizedData(notif.notif_data)) : notif.desc}</p>
                          <span className="time">{formatTime(notif.created_at)}</span>
                        </div>
                        {notif.unread && <span className={`unread-dot ${notif.type}`}></span>}
                      </div>
                    ))
                  )}
                </div>

                <div className="dropdown-footer">
                  <a href="/notifications">{t("navbar.viewAllNotifications")}</a>
                </div>
              </div>
            )}
          </div>

          <div className="logPerson">
            {user ? (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div 
                  className="navbar-profile-trigger" 
                  onClick={() => navigate("/profile")} 
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                >
                  <div className="navbar-avatar">
                    {user.profile_image ? (
                      <img 
                        src={user.profile_image.startsWith("http") || user.profile_image.startsWith("/") ? user.profile_image : "/" + user.profile_image} 
                        alt="Profile" 
                        className="navbar-avatar-img"
                      />
                    ) : (
                      <span className="navbar-avatar-text">
                        {(user.name || "U").split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="navbar-username" style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>
                    {user.name}
                  </span>
                </div>
                <button className="log-btn" onClick={Logout} style={{ background: "var(--r-600)", color: "#fff", borderColor: "var(--r-600)" }}>{t("navbar.logout")}</button>
              </div>
            ) : (
              <NavLink to="/login" className="log-btn" style={{ display: "inline-block", padding: "8px 14px", textAlign: "center", lineHeight: "22px" }}>{t("navbar.signIn")}</NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;