import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import "./navbar.css";
import notificationIcon from '../assests/png/notification.png';
import logo from '../../src/assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.replace(/-/g, '/'));
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <header className="app-header">
      <div className="app-brand">
        <img src={logo} alt="Logo" />
      </div>

      <nav className="app-nav">

        <div className="nav-links">

          {/* Default navbar (not logged in) */}

          {!user && (
            <>
              <NavLink to="/" end>Home</NavLink>
              <NavLink to="/browse">Browse</NavLink>
              <NavLink to="/ratings">Ratings</NavLink>

              <NavLink to="/register">
                Register
              </NavLink>

              <NavLink to="/login">
                Login
              </NavLink>
            </>
          )}


          {/* Farmer navbar */}

          {user?.role === "farmer" && (
            <>
              <NavLink to="/">
                Home
              </NavLink>

              {/* <NavLink to="/preorder">
                Pre-Order
              </NavLink> */}

              {/* <NavLink to="/complaints">
                Complaints
              </NavLink> */}

              {/* <NavLink to="/ratings">
                Ratings
              </NavLink> */}

              <NavLink to="/farmer">
                Farmer
              </NavLink>

              <NavLink to="/profile">
                Profile
              </NavLink>
            </>
          )}

          {/* Buyer navbar */}

          {user?.role === "buyer" && (
            <>
              <NavLink to="/">
                Home
              </NavLink>
              <NavLink to="/browse">
                Browse
              </NavLink>

              {/* <NavLink to="/preorder">
                Pre-Order
              </NavLink>

              <NavLink to="/complaints">
                Complaints
              </NavLink>

              <NavLink to="/ratings">
                Ratings
              </NavLink> */}

              <NavLink to="/buyer">
                Buyer
              </NavLink>

              {/* <NavLink to="/profile">
                Profile
              </NavLink> */}
            </>
          )}


          {/* Admin navbar */}

          {user?.role === "admin" && (
            <>
              <NavLink to="/">
                Home
              </NavLink>

              <NavLink to="/admin">
                Admin
              </NavLink>

              <NavLink to="/profile">
                Profile
              </NavLink>
            </>
          )}

        </div>

        <div className="nav-right">

          <div className="language-buttons">

            <button className="En-button"
              onClick={() => setLanguage("en")}
            >
              EN
            </button>

            <button className="Si-button"
              onClick={() => setLanguage("si")}
            >
              සිං
            </button>

            <button className="Ta-button"
              onClick={() => setLanguage("ta")}
            >
              தமிழ்
            </button>

          </div>

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
                  <h3>Notifications</h3>
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>Mark all read</button>
                </div>

                <div className="dropdown-body">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="notification-item">
                        <div className={`status-icon ${notif.type}`}></div>
                        <div className="notif-content">
                          <h4>{notif.title}</h4>
                          <p>{notif.desc}</p>
                          <span className="time">{formatTime(notif.created_at)}</span>
                        </div>
                        {notif.unread && <span className={`unread-dot ${notif.type}`}></span>}
                      </div>
                    ))
                  )}
                </div>

                <div className="dropdown-footer">
                  <a href="/notifications">View all notifications</a>
                </div>
              </div>
            )}
          </div>

          <div className="logPerson">
            {user ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="log-btn" style={{ fontWeight: 600 }}>{user.name}</button>
                <button className="log-btn" onClick={Logout} style={{ background: "var(--r-600)", color: "#fff", borderColor: "var(--r-600)" }}>Logout</button>
              </div>
            ) : (
              <NavLink to="/login" className="log-btn" style={{ display: "inline-block", padding: "8px 14px", textAlign: "center", lineHeight: "22px" }}>Sign in</NavLink>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
};

export default Navbar;