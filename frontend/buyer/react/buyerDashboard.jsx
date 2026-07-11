import { useState, useEffect, useCallback } from "react";
import "../../buyer/csss/buyerDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [location, setLocation] = useState("Colombo");
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "";
  const isReturningUser = user
    ? !!localStorage.getItem(`hasLoggedIn_${user.id}`)
    : false;

  useEffect(() => {
    if (user && !localStorage.getItem(`hasLoggedIn_${user.id}`)) {
      localStorage.setItem(`hasLoggedIn_${user.id}`, "true");
    }
  }, [user]);

  const quickLinks = [
    { label: "Browse Crops", icon: "🥦", key: "browse", path: "/browse" },
    { label: "Find Farmers", icon: "🚜", key: "farmers", path: "/farmers" },
    { label: "My Reservations", icon: "📦", key: "reservations", path: "/buyer/BuyerOrderHistory" },
    { label: "Wishlist", icon: "❤️", key: "wishlist", path: "/wishlist" },
  ];

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/backend/get_buyer_dashboard.php", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setLocation(data.location);
        setStats(data.stats);
        setRecentActivities(data.recentActivities || []);
      } else {
        setError(data.message || "Couldn't load your dashboard right now.");
      }
    } catch (err) {
      console.error("Failed to load buyer dashboard details:", err);
      setError("Couldn't connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickLinkKeyDown = (e, path) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(path);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <section className="hero hero-skeleton">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </section>
        <section className="stats-container">
          {[1, 2, 3].map((i) => (
            <div className="stat-card skeleton-card" key={i}>
              <div className="skeleton skeleton-number" />
              <div className="skeleton skeleton-label" />
            </div>
          ))}
        </section>
        <section className="quick-links">
          <div className="quick-grid">
            {[1, 2, 3, 4].map((i) => (
              <div className="quick-card skeleton-card" key={i}>
                <div className="skeleton skeleton-quick" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-box">
          <span className="error-icon">⚠️</span>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="secondary-btn" onClick={fetchDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* HERO */}
      <section className="hero">
        <div>
          <h1>
            {getTimeGreeting()}
            {firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p>
            {isReturningUser
              ? "Welcome back! Here's what's happening with your reservations."
              : "Discover fresh vegetables, fruits and connect with trusted farmers."}
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-container">
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <h2>{stats.pending}</h2>
          <p>Pending Reservations</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <h2>{stats.active}</h2>
          <p>Active Reservations</p>
        </div>

        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <h2>{stats.completed}</h2>
          <p>Completed Orders</p>
        </div>
      </section>

      {/* LOCATION BANNER */}
      <section className="location-banner">
        <div>
          📍 Farmers near <strong>{location}</strong> have fresh products today.
        </div>
        <button onClick={() => navigate("/browse")}>Explore Nearby</button>
      </section>

      {/* QUICK LINKS */}
      <section className="quick-links">
        <h2>Quick Actions</h2>

        <div className="quick-grid">
          {quickLinks.map((q) => (
            <div
              className="quick-card"
              key={q.key}
              role="button"
              tabIndex={0}
              aria-label={q.label}
              onClick={() => navigate(q.path)}
              onKeyDown={(e) => handleQuickLinkKeyDown(e, q.path)}
            >
              <span className="quick-icon">{q.icon}</span>
              <span className="quick-label">{q.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="content-grid">
        {/* RECENT ACTIVITY */}
        <div className="content-box">
          <h2>Recent Activity</h2>
          {recentActivities.length > 0 ? (
            <ul>
              {recentActivities.map((item, i) => (
                <li key={i}>✅ {item}</li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🌱</span>
              <p>No recent activity yet. Start browsing crops to get going!</p>
              <button className="secondary-btn" onClick={() => navigate("/browse")}>
                Browse Crops
              </button>
            </div>
          )}
        </div>

        {/* INFO BOX */}
        <div className="content-box">
          <h2>Buyer Insights</h2>
          <p>
            Track your reservations, manage orders, and explore fresh farm produce
            directly from trusted farmers in your area.
          </p>

          <button
            className="secondary-btn"
            onClick={() => navigate("/buyer/BuyerOrderHistory")}
          >
            View Full Order History
          </button>
        </div>
      </section>
    </div>
  );
}