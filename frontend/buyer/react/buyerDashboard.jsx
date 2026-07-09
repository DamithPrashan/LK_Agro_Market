import { useState, useEffect } from "react";
import "../../buyer/csss/buyerDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [welcomeMsg, setWelcomeMsg] = useState("Hello 👋");
  const [location, setLocation] = useState("Colombo");
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const key = `hasLoggedIn_${user.id}`;
      if (localStorage.getItem(key)) {
        setWelcomeMsg(`Welcome Back ${user.name} 👋`);
      } else {
        setWelcomeMsg(`Welcome ${user.name} 👋`);
        localStorage.setItem(key, "true");
      }
    }
  }, [user]);

  const quickLinks = [
    { label: "🥦 Browse Crops", key: "browse" },
    { label: "🚜 Find Farmers", key: "farmers" },
    { label: "📦 My Reservations", key: "reservations" },
    { label: "❤️ Wishlist", key: "wishlist" },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/backend/get_buyer_dashboard.php", {
          credentials: "include"
        });
        const data = await response.json();
        if (data.success) {
          setBuyerName(data.buyerName);
          setLocation(data.location);
          setStats(data.stats);
          setRecentActivities(data.recentActivities);
        } else {
          console.error("Dashboard fetch failed: ", data.message);
        }
      } catch (err) {
        console.error("Failed to load buyer dashboard details: ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#1a5c2d", fontSize: "18px", fontWeight: "bold" }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* NAVBAR
      <header className="navbar"> */}
      {/* <div className="logo">🌱 LK Agro Market</div> */}

      {/* <nav>
          <ul>
            <li>Dashboard</li>
            <li>Products</li>
            <li>Reservations</li>
            <li>Profile</li>
          </ul>
        </nav> */}


      {/* </header> */}

      {/* HERO */}
      <section className="hero">
        <div>
          <h1>{welcomeMsg}</h1>
          <p>Discover fresh vegetables, fruits and connect with trusted farmers.</p>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-container">
        <div className="stat-card">
          <h2>{stats.pending}</h2>
          <p>Pending Reservations</p>
        </div>

        <div className="stat-card">
          <h2>{stats.active}</h2>
          <p>Active Reservations</p>
        </div>

        <div className="stat-card">
          <h2>{stats.completed}</h2>
          <p>Completed Orders</p>
        </div>
      </section>

      {/* LOCATION BANNER */}
      <section className="location-banner">
        <div>
          📍 Farmers near <strong>{location}</strong> have fresh products today.
        </div>
        <button>Explore Nearby</button>
      </section>

      {/* QUICK LINKS */}
      <section className="quick-links">
        <h2>Quick Actions</h2>

        <div className="quick-grid">
          {quickLinks.map((q, i) => (
            <div
              className="quick-card"
              key={i}
              onClick={() => {
                if (q.key === "browse") {
                  navigate("/browse");
                } else if (q.key === "farmers") {
                  navigate("/farmers");
                } else if (q.key === "reservations") {
                  navigate("/buyer/BuyerOrderHistory");
                } else if (q.key === "wishlist") {
                  navigate("/wishlist");
                }
              }}
            >
              {q.label}
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="content-grid">

        {/* RECENT ACTIVITY */}
        <div className="content-box">
          <h2>Recent Activity</h2>
          <ul>
            {recentActivities.map((item, i) => (
              <li key={i}>✅ {item}</li>
            ))}
          </ul>
        </div>

        {/* INFO BOX */}
        <div className="content-box">
          <h2>Buyer Insights</h2>
          <p>
            Track your reservations, manage orders, and explore fresh farm produce
            directly from trusted farmers in your area.
          </p>

          <button className="secondary-btn"
            onClick={() => navigate("/buyer/BuyerOrderHistory")}
          >
            View Full Order History
          </button>


        </div>

      </section>



    </div>
  );
}