import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./navbar.css";
import notificationIcon from '../assests/png/notification.png'; 

const Navbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Reservation Accepted', desc: 'Your order #1001 has been accepted.', time: '2 minutes ago', type: 'success', unread: true },
    { id: 2, title: 'New Order Received', desc: 'You have received a new order request.', time: '1 hour ago', type: 'info', unread: true },
    { id: 3, title: 'Payment Confirmed', desc: 'Payment received for order #998.', time: 'Yesterday', type: 'warning', unread: true }
  ];

  return (
    <header className="app-header">
      <div className="app-brand">
        LK AGRO MARKET
      </div>

      <nav className="app-nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/farmer">Farmer</NavLink>
        <NavLink to="/browse">Browse</NavLink>
        <NavLink to="/preorder">Pre-Order</NavLink>
        <NavLink to="/payment">Payment</NavLink>
        <NavLink to="/buyer">Buyer</NavLink>
        <NavLink to="/complaints">Complaints</NavLink>
        <NavLink to="/ratings">Ratings</NavLink>
        <NavLink to="/admin">Admin</NavLink>
        <NavLink to="/register">Register</NavLink>
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/profile">Profile</NavLink>

       <div className="language-buttons">

<button className="En-button"
onClick={()=>setLanguage("en")}
>
EN
</button>

<button className="Si-button"
onClick={()=>setLanguage("si")}
>
සිං
</button>

<button className="Ta-button"
onClick={()=>setLanguage("ta")}
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
            <span className="badge">3</span>
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="mark-read-btn">Mark all read</button>
              </div>

              <div className="dropdown-body">
                {notifications.map((notif) => (
                  <div key={notif.id} className="notification-item">
                    <div className={`status-icon ${notif.type}`}></div>
                    <div className="notif-content">
                      <h4>{notif.title}</h4>
                      <p>{notif.desc}</p>
                      <span className="time">{notif.time}</span>
                    </div>
                    {notif.unread && <span className={`unread-dot ${notif.type}`}></span>}
                  </div>
                ))}
              </div>

              <div className="dropdown-footer">
                <a href="/notifications">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        <div className="logPerson">
          <button className="log-btn">Randeniya</button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;