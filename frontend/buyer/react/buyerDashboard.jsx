import "../../buyer/csss/buyerDashboard.css";
import { useNavigate } from "react-router-dom";

export default function BuyerDashboard() {
  const buyerName = "Nadeeshi";
const navigate = useNavigate();
  const stats = {
    pending: 12,
    active: 7,
    completed: 45,
  };

  const location = "Colombo";

  const recentActivities = [
    "Reserved 10kg Tomatoes",
    "New Corn listing available",
    "Order delivered successfully",
  ];

  const quickLinks = [
    { label: "🥦 Browse Crops", key: "browse" },
    { label: "🚜 Find Farmers", key: "farmers" },
    { label: "📦 My Reservations", key: "reservations" },
    { label: "❤️ Wishlist", key: "wishlist" },
  ];

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
          <h1>Welcome Back {buyerName} 👋</h1>
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
            <div className="quick-card" key={i}>
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