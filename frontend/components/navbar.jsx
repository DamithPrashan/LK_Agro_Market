import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/context/AuthContext";
import notificationIcon from "../assests/png/notification.png";
import logo from "../../src/assets/logo.png";
import "./navbar.css";

const profileImageUrl = (path) => !path || path.startsWith("http") || path.startsWith("/") ? path : `/${path}`;

export default function Navbar() {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const updateHeight = () => document.documentElement.style.setProperty("--navbar-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/backend/get_notifications.php", { credentials: "include" });
        const data = await response.json();
        if (data.success) {
          const nextNotifications = data.notifications || [];
          setNotifications(nextNotifications);
          setUnreadCount(nextNotifications.filter((notification) => notification.unread).length);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 10000);
    return () => window.clearInterval(interval);
  }, [user]);

  const handleLanguageChange = async (language) => {
    await i18n.changeLanguage(language);
    localStorage.setItem("preferredLanguage", language);
    if (!user) return;

    const dbLanguage = language === "si" ? "sinhala" : language === "ta" ? "tamil" : "english";
    login({ ...user, language: dbLanguage });
    try {
      await fetch("/backend/Apis/update_language.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language }),
      });
    } catch (error) {
      console.error("Failed to sync language to database:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/backend/mark_notifications_read.php", { method: "POST", credentials: "include" });
      const data = await response.json();
      if (data.success) {
        setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    let target = notification.link || notification.notif_data?.link;
    const complaintId = notification.notif_data?.complaint_id || notification.notif_data?.complaintId || notification.notif_data?.id;
    const title = notification.title?.toLowerCase() || "";
    const isComplaintNotification = ["farmerResponded", "complaintResolved", "complaintSubmitted"].includes(notification.notif_type)
      || title.includes("farmer responded") || title.includes("dispute") || title.includes("complaint");

    if (user?.role === "buyer" && isComplaintNotification) target = complaintId ? `/buyer/complaints?tab=farmer_response&id=${complaintId}` : "/buyer/complaints?tab=farmer_response";
    if (user?.role === "farmer" && isComplaintNotification) target = "/farmer/complaints";
    if (user?.role === "admin" && complaintId) target = `/admin/complaint/${complaintId}`;
    if (target?.includes("/farmer-response")) target = target.replace("/farmer-response", "/buyer/complaints?tab=farmer_response");

    if (!target) return;
    if (target.startsWith("http")) window.location.assign(target);
    else navigate(target.startsWith("/") ? target : `/${target}`);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const locale = i18n.language === "si" ? "si-LK" : i18n.language === "ta" ? "ta-LK" : "en-US";
    const date = new Date(dateString.replace(/-/g, "/"));
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleString(locale);
  };

  const localizeNotificationData = (data = {}) => {
    if (!data.cropName) return data;
    const cropKey = data.cropName.toLowerCase().trim().replace(/\s+/g, "");
    const translationKeys = { greenbeans: "greenBeans", ladiesfinger: "ladiesFinger" };
    const key = translationKeys[cropKey] || cropKey;
    const translated = t(`crops.${key}`);
    return { ...data, cropName: translated === `crops.${key}` ? data.cropName : translated };
  };

  const roleKey = user?.role === "farmer" ? "navbar.farmer" : user?.role === "admin" ? "navbar.admin" : "navbar.buyer";
  const initials = (user?.name || "U").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  return (
    <header ref={headerRef} className="application-topbar">
      <Link className="application-topbar__brand" to="/" aria-label="LK Agro Market home">
        <img src={logo} alt="" />
        <span>LK Agro Market</span>
      </Link>

      <div className="application-topbar__controls">
        {user && (
          <>
            <div className="application-topbar__notification">
              <button className="application-topbar__bell" type="button" onClick={() => setShowNotifications((open) => !open)} aria-label={t("navbar.notifications")} aria-expanded={showNotifications}>
                <img src={notificationIcon} alt="" />
                {unreadCount > 0 && <span className="application-topbar__badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="application-topbar__notification-menu">
                  <div className="application-topbar__notification-header">
                    <h3>{t("navbar.notifications")}</h3>
                    <button className="application-topbar__mark-read" type="button" onClick={handleMarkAllRead}>{t("navbar.markAllRead")}</button>
                  </div>
                  <div className="application-topbar__notification-body">
                    {notifications.length === 0 ? <div className="application-topbar__notification-empty">{t("navbar.noNotifications")}</div> : notifications.map((notification) => (
                      <div className="application-topbar__notification-item" key={notification.id} onClick={() => handleNotificationClick(notification)}>
                        <span className="application-topbar__status-dot" />
                        <div className="application-topbar__notification-copy">
                          <h4>{notification.notif_type ? t(`notifications.title.${notification.notif_type}`) : notification.title}</h4>
                          <p>{notification.notif_type && notification.notif_type !== "warningIssued" ? t(`notifications.${notification.notif_type}`, localizeNotificationData(notification.notif_data)) : notification.desc}</p>
                          <time>{formatTime(notification.created_at)}</time>
                        </div>
                        {notification.unread && <span className="application-topbar__unread-dot" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="application-topbar__separator" aria-hidden="true" />
          </>
        )}

        <div className="application-topbar__languages" aria-label="Language">
          <button type="button" className={`application-topbar__language ${currentLanguage === "en" ? "is-active" : ""}`} onClick={() => handleLanguageChange("en")}>EN</button>
          <button type="button" className={`application-topbar__language ${currentLanguage === "si" ? "is-active" : ""}`} onClick={() => handleLanguageChange("si")}>සිං</button>
          <button type="button" className={`application-topbar__language ${currentLanguage === "ta" ? "is-active" : ""}`} onClick={() => handleLanguageChange("ta")}>தமிழ்</button>
        </div>

        {user && (
          <Link className="application-topbar__account" to="/profile">
            <span className="application-topbar__identity">{user.name} - {t(roleKey)}</span>
            <span className="application-topbar__avatar">
              {user.profile_image ? <img src={profileImageUrl(user.profile_image)} alt={user.name || t("navbar.profile")} /> : initials}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
