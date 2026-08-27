import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { FaBars, FaTimes, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";
import notificationIcon from "../assests/png/notification.png";
import logo from "../../src/assets/logo.png";
import "./HomepageNavbar.css";

export default function HomepageNavbar() {
  const headerRef = useRef(null); const location = useLocation(); const navigate = useNavigate();
  const { user, login, logout } = useAuth(); const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false); const [showNotifications, setShowNotifications] = useState(false); const [notifications, setNotifications] = useState([]);
  useEffect(() => { const update = () => headerRef.current && document.documentElement.style.setProperty("--navbar-height", `${Math.ceil(headerRef.current.getBoundingClientRect().height)}px`); update(); const observer = new ResizeObserver(update); if (headerRef.current) observer.observe(headerRef.current); window.addEventListener("resize", update); return () => { observer.disconnect(); window.removeEventListener("resize", update); }; }, []);
  useEffect(() => { if (!user) return; const load = async () => { try { const response = await fetch("/backend/get_notifications.php"); const data = await response.json(); if (data.success) setNotifications(data.notifications || []); } catch (error) { console.error("Error fetching notifications:", error); } }; load(); const interval = setInterval(load, 10000); return () => clearInterval(interval); }, [user]);
  const changeLanguage = async (language) => { await i18n.changeLanguage(language); localStorage.setItem("preferredLanguage", language); if (!user) return; login({ ...user, language: language === "si" ? "sinhala" : language === "ta" ? "tamil" : "english" }); try { await fetch("/backend/Apis/update_language.php", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ language }) }); } catch (error) { console.error("Failed to sync language:", error); } };
  const goToSection = (event, id) => { event.preventDefault(); setMenuOpen(false); if (location.pathname !== "/") { navigate(`/#${id}`); setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50); } else { window.history.replaceState(null, "", `#${id}`); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); } };
  const unreadCount = notifications.filter((item) => item.unread).length;
  const markAllRead = async () => { try { const response = await fetch("/backend/mark_notifications_read.php", { method: "POST" }); const data = await response.json(); if (data.success) setNotifications((items) => items.map((item) => ({ ...item, unread: false }))); } catch (error) { console.error("Error marking notifications as read:", error); } };
  const openNotification = (item) => { setShowNotifications(false); const target = item.link || item.notif_data?.link; if (target) target.startsWith("http") ? window.location.assign(target) : navigate(target.startsWith("/") ? target : `/${target}`); };
  const role = user?.role?.toLowerCase();
  const dashboardPath = role === "farmer" ? "/farmer/dashboard" : role === "admin" ? "/admin" : "/buyer/dashboard";
  const roleKey = role === "farmer" ? "navbar.farmer" : role === "admin" ? "navbar.admin" : "navbar.buyer";
  const initials = (user?.name || "U").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const profileImage = user?.profile_image && (user.profile_image.startsWith("http") || user.profile_image.startsWith("/")) ? user.profile_image : user?.profile_image ? `/${user.profile_image}` : null;
  const handleLogout = async () => { await logout(); navigate("/"); };
  return <header ref={headerRef} className="home-navbar"><button className="home-navbar-brand" onClick={() => navigate("/")} aria-label="LK Agro Market home"><img src={logo} alt="" /><span>LK Agro Market</span></button>
    {!user && <><button className="home-mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label={t("homepage.menu")}>{menuOpen ? <FaTimes /> : <FaBars />}</button><nav className={`home-nav-links ${menuOpen ? "open" : ""}`}>{[["home", t("navbar.home")],["preorder",t("homepage.preorderNav")],["market",t("homepage.marketNav")],["about",t("homepage.aboutNav")]].map(([id,label]) => <a key={id} href={`#${id}`} onClick={(event) => goToSection(event,id)}>{label}</a>)}</nav></>}
    <div className="home-nav-right"><div className="home-languages"><button className={i18n.language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button><button className={i18n.language === "si" ? "active" : ""} onClick={() => changeLanguage("si")}>සිං</button><button className={i18n.language === "ta" ? "active" : ""} onClick={() => changeLanguage("ta")}>தமிழ்</button></div>
      {!user && <button type="button" className="home-sign-in" onClick={() => navigate("/login")}>{t("homepage.signIn")}</button>}
      {user && <div className="home-notifications"><button className="home-bell" onClick={() => setShowNotifications((open) => !open)} aria-label={t("navbar.notifications")}><img src={notificationIcon} alt="" />{unreadCount > 0 && <span>{unreadCount}</span>}</button>{showNotifications && <div className="home-notification-dropdown"><header><h3>{t("navbar.notifications")}</h3><button onClick={markAllRead}>{t("navbar.markAllRead")}</button></header><div>{notifications.length ? notifications.map((item) => <button className="home-notification-item" key={item.id} onClick={() => openNotification(item)}><strong>{item.title}</strong><small>{item.desc}</small></button>) : <p>{t("navbar.noNotifications")}</p>}</div></div>}</div>}
      {user && <button type="button" className="home-auth-action" onClick={() => navigate(dashboardPath)} title={t("sidebar.dashboard")}><FaTachometerAlt aria-hidden="true" /><span>{t("sidebar.dashboard")}</span></button>}
      {user && <button type="button" className="home-account" onClick={() => navigate("/profile")} title={t("navbar.profile")}><span className="home-account-identity">{user.name} - {t(roleKey)}</span><span className="home-account-avatar">{profileImage ? <img src={profileImage} alt={user.name || t("navbar.profile")} /> : initials}</span></button>}
      {user && <button type="button" className="home-auth-action home-logout" onClick={handleLogout} title={t("navbar.logout")}><FaSignOutAlt aria-hidden="true" /><span>{t("navbar.logout")}</span></button>}
    </div></header>;
}
