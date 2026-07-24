import React, { useState, useEffect } from "react";
import "../../buyer/csss/Browse.css";
import { useNavigate } from "react-router-dom";
import { useCrops } from "../../../src/context/CropContext";
import tomatoImg from "../../assests/png/tomato.jpg";
import carrotImg from "../../assests/png/carrot.jpg";
import leeksImg from "../../assests/png/leeks.jpg";
import capsicumImg from "../../assests/png/capsicum.jpg";
import potatoImg from "../../assests/png/potato.jpg";
import greenBeansImg from "../../assests/png/beans.jpg";
import avocadoImg from "../../assests/png/avacado.jpg";
import beetrootImg from "../../assests/png/beatroot.jpg";
import grapesImg from "../../assests/png/grapes.jpg";
import pineappleImg from "../../assests/png/pineapple.jpg";
import pumpkinImg from "../../assests/png/pumpkin.jpg";
import bananaImg from "../../assests/png/banana.jpg";
import cabbageImg from "../../assests/png/cabbage.jpg";
import ladiesFingerImg from "../../assests/png/ladiesfinger.jpg";
import lemonImg from "../../assests/png/lemon.jpg";
import mangoImg from "../../assests/png/mango.jpg";
import onionImg from "../../assests/png/onion.jpg";
import watermelonImg from "../../assests/png/watermelon.jpg";
import brinjalImg from "../../assests/png/brinjal.jpg";
import cornImg from "../../assests/png/corn.jpg";

// Static local assets fallback map
const imageMap = {
  "Tomato": tomatoImg,
  "Carrot": carrotImg,
  "Leeks": leeksImg,
  "Capsicum": capsicumImg,
  "Potato": potatoImg,
  "Green Beans": greenBeansImg,
  "Avocado": avocadoImg,
  "Beetroot": beetrootImg,
  "Grapes": grapesImg,
  "Pineapple": pineappleImg,
  "Pumpkin": pumpkinImg,
  "Banana": bananaImg,
  "Cabbage": cabbageImg,
  "Ladies Finger": ladiesFingerImg,
  "Lemon": lemonImg,
  "Mango": mangoImg,
  "Onion": onionImg,
  "Watermelon": watermelonImg,
  "Brinjal": brinjalImg,
  "Corn": cornImg
};

export default function Browse() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });

  const { crops, loading, fetchCrops } = useCrops();
  const [searchQuery, setSearchQuery] = useState("");

  // Consolidated advanced filters state
  const [filters, setFilters] = useState({
    district: "All Districts",
    cropType: "All Crops",
    priceMin: "",
    priceMax: "",
    harvestFrom: "",
    harvestTo: "",
    isVerified: false,
    sortBy: ""
  });

  // Dynamic backgrounds helper
  const getBgClass = (cropName) => {
    if (!cropName) return "bg-blue";
    const name = cropName.toLowerCase();
    if (name.includes("tomato") || name.includes("pumpkin") || name.includes("mango")) return "bg-orange";
    if (name.includes("carrot") || name.includes("banana") || name.includes("pineapple") || name.includes("corn") || name.includes("lemon")) return "bg-yellow";
    if (name.includes("leeks") || name.includes("cabbage") || name.includes("watermelon") || name.includes("green beans") || name.includes("beans") || name.includes("ladies finger") || name.includes("avocado")) return "bg-green";
    if (name.includes("capsicum") || name.includes("beetroot")) return "bg-pink";
    if (name.includes("potato") || name.includes("brinjal") || name.includes("grapes")) return "bg-purple";
    return "bg-blue";
  };

  // Wrapper for existing calls to fetchListings
  const fetchListings = (customFilters = filters, customSearch = searchQuery) => {
    fetchCrops(customFilters, customSearch);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/backend/get_buyer_dashboard.php", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.stats) {
        setStats({
          pending: data.stats.pending || 0,
          active: data.stats.active || 0,
          completed: data.stats.completed || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats: ", err);
    }
  };

  // Fetch listings on initial mount and when tab/window gains focus
  useEffect(() => {
    fetchCrops(filters, searchQuery);
    fetchStats();

    const handleFocus = () => {
      fetchCrops(filters, searchQuery);
      fetchStats();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, fetchCrops]);

  const handleApplyFilters = () => {
    fetchListings(filters, searchQuery);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      district: "All Districts",
      cropType: "All Crops",
      priceMin: "",
      priceMax: "",
      harvestFrom: "",
      harvestTo: "",
      isVerified: false,
      sortBy: ""
    };
    setFilters(defaultFilters);
    setSearchQuery("");
    fetchListings(defaultFilters, "");
  };


  return (
    <div className="layout-wrapper">
      {/* TOP NAVBAR */}
      {/* <header className="top-navbar">
        <div className="logo">LK AGRO MARKET</div>
        <nav className="top-nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/farmer")}>Farmer</span>
          <span className="active" onClick={() => navigate("/browse")}>Browse</span>
          <span onClick={() => navigate("/pre-order")}>Pre-Order</span>
          <span onClick={() => navigate("/payment")}>Payment</span>
          <span onClick={() => navigate("/map-search")}>Map Search</span>
          <span onClick={() => navigate("/complaints")}>Complaints</span>
          <span onClick={() => navigate("/ratings")}>Ratings</span>
          <span onClick={() => navigate("/admin")}>Admin</span>
          <span onClick={() => navigate("/register")}>Register</span>
        </nav>
        <div className="top-nav-actions">
          <button className="lang-btn">EN</button>
          <button className="icon-btn">👤</button>
          <button className="lang-btn tamil">தமிழ் <span className="badge">3</span></button>
          <span className="user-name">Randeniya</span>
        </div>
      </header> */}

      <div className="main-layout">
        {/* SIDEBAR */}
        {/* <aside className="sidebar">
          <div className="nav-group">
            <p className="nav-title">NAVIGATION</p>
            <ul>
              <li onClick={() => navigate("/dashboard")}>Dashboard</li>
              <li onClick={() => navigate("/farmer-home")}>Farmer Home</li>
              <li className="active" onClick={() => navigate("/browse")}>Browse Crops</li>
              <li onClick={() => navigate("/pre-order")}>Pre-Order</li>
              <li onClick={() => navigate("/payment")}>Payment</li>
              <li onClick={() => navigate("/map")}>Map Search</li>
              <li onClick={() => navigate("/complaints")}>Complaints</li>
              <li onClick={() => navigate("/ratings")}>Ratings</li>
              <li onClick={() => navigate("/admin-panel")}>Admin Panel</li>
              <li onClick={() => navigate("/login")}>Register / Login</li>
            </ul>
          </div>

          <div className="sidebar-profile">
            <div className="avatar">RR</div>
            <div className="profile-info">
              <strong>R.M.S.T. Randeniya</strong>
              <span>Farmer <span className="verified-badge">✓ Verified</span></span>
            </div>
          </div>
        </aside> */}

        {/* MAIN CONTENT */}
        <main className="content-area">
          <div className="page-header">
            <h1>Browse Crops</h1>
            <p>Fresh produce from verified Sri Lankan farmers</p>
          </div>

          {/* SEARCH BAR */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search crops, farmers, districts..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="dropdown"
              value={filters.district}
              onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
            >
              <option value="All">All Districts</option>
              <option>Badulla</option>
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
              <option>Matara</option>
              <option>Jaffna</option>
              <option>Anuradhapura</option>
              <option>Kurunegala</option>
              <option>Trincomalee</option>
              <option>Batticaloa</option>
              <option>Ratnapura</option>
              <option>Kegalle</option>
              <option>Nuwara Eliya</option>
              <option>Polonnaruwa</option>
              <option>Monaragala</option>
              <option>Hambantota</option>
              <option>Kalutara</option>
              <option>Puttalam</option>
              <option>Vavuniya</option>
              <option>Ampara</option>
            </select>
            <select
              className="dropdown"
              value={filters.cropType}
              onChange={(e) => setFilters(prev => ({ ...prev, cropType: e.target.value }))}
            >
              <option>All Crops</option>
              <option>Tomato</option>
              <option>Carrot</option>
              <option>Leeks</option>
              <option>Capsicum</option>
              <option>Potato</option>
              <option>Green Beans</option>
              <option>Cucumber</option>
              <option>Beetroot</option>
              <option>Radish</option>
              <option>Cabbage</option>
              <option>Beans</option>
              <option>Brinjal</option>
              <option>Avocado</option>
              <option>Grapes</option>
              <option>Pineapple</option>
              <option>Pumpkin</option>
              <option>Banana</option>
              <option>Ladies Finger</option>
              <option>Lemon</option>
              <option>Mango</option>
              <option>Onion</option>
              <option>Watermelon</option>
              <option>Corn</option>
            </select>
          </div>

          {/* ADVANCED FILTERS PANEL (Always Visible) */}
          <div className="advanced-filters-panel">
            <div className="filter-group">
              <label>Price Range (Rs.)</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  className={`small-input ${filters.priceMin && filters.priceMax && parseFloat(filters.priceMin) > parseFloat(filters.priceMax) ? "input-error" : ""}`}
                />
                <span className="price-sep">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  className={`small-input ${filters.priceMin && filters.priceMax && parseFloat(filters.priceMin) > parseFloat(filters.priceMax) ? "input-error" : ""}`}
                />
              </div>
              {filters.priceMin && filters.priceMax && parseFloat(filters.priceMin) > parseFloat(filters.priceMax) && (
                <span className="error-text">Min price cannot exceed Max price</span>
              )}
            </div>

            <div className="filter-group harvest-date-group">
              <label>Harvest Date Window</label>
              <div className="date-range-inputs">
                <input
                  type="date"
                  value={filters.harvestFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, harvestFrom: e.target.value }))}
                  className="date-input"
                  placeholder="From"
                />
                <span className="date-sep">to</span>
                <input
                  type="date"
                  value={filters.harvestTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, harvestTo: e.target.value }))}
                  className="date-input"
                  placeholder="To"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                className="dropdown-sort"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="">Default (Soonest Harvest)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Rating: High to Low</option>
                <option value="harvest_desc">Harvest: Newest to Oldest</option>
              </select>
            </div>

            

            {/* FILTER BUTTON */}
            <div className="filter-group reset-group">
              <button
                className="apply-filters-btn"
                onClick={handleApplyFilters}
              >
                Filter
              </button>
            </div>

            {/* RESET FILTERS BUTTON */}
            <div className="filter-group reset-group">
              <button
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* INFO BANNER */}
          <div className="info-banner">
            Showing crops near <strong>{filters.district === "All" || filters.district === "All Districts" ? "All of Sri Lanka" : filters.district}</strong>. <a href="#">Use Map Search</a> to find farms on a map.
          </div>

          {/* STATS */}
          <div className="stats-row">
            <div className="stat-box">
              <h2>{stats.pending}</h2>
              <p>Pending Orders</p>
            </div>
            <div className="stat-box">
              <h2>{stats.active}</h2>
              <p>Active Reservations</p>
            </div>
            <div className="stat-box">
              <h2>{stats.completed}</h2>
              <p>Completed Orders</p>
            </div>
          </div>

          {/* CROP GRID */}
          {loading ? (
            <div className="loading-state">Loading fresh crops...</div>
          ) : crops.length === 0 ? (
            <div className="empty-state">No crops found matching your filters.</div>
          ) : (
            <div className="crop-grid">
              {crops.map((crop) => (
                <div
                  className="crop-card"
                  key={crop.id}
                  onClick={() => navigate(`/crop/${crop.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className={`crop-image-area ${getBgClass(crop.name)}`} style={{ position: "relative" }}>
                    {parseFloat(crop.qty) <= 0 && (
                      <span className="out-of-stock-badge" style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "#e74c3c",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        zIndex: 10,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}>
                        Out of Stock
                      </span>
                    )}
                    {(() => {
                      if (crop.image_url) {
                        let imgUrl = crop.image_url;
                        if (!imgUrl.startsWith("http") && !imgUrl.startsWith("/")) {
                          imgUrl = "/backend/" + imgUrl;
                        }
                        return <img src={imgUrl} alt={crop.name} className="crop-image" />;
                      }
                      const capitalized = crop.name ? crop.name.charAt(0).toUpperCase() + crop.name.slice(1).toLowerCase() : "";
                      const localImg = imageMap[capitalized] || imageMap[crop.name];
                      if (localImg) {
                        return <img src={localImg} alt={crop.name} className="crop-image" />;
                      } else {
                        return <span className="crop-icon">🌱</span>;
                      }
                    })()}
                  </div>
                  <div className="crop-details">
                    <h3>{crop.name}</h3>
                    <p className="farm-name">
                      {crop.farmer_name} {parseInt(crop.is_verified) === 1 && <span className="verified-tick">✓</span>}
                    </p>
                    <p className="price">
                      <strong>Rs {parseFloat(crop.price).toFixed(0)}</strong>/kg
                    </p>
                    <p className="meta-info">
                      Available: {parseFloat(crop.qty) <= 0 ? (
                        <span style={{ color: "#e74c3c", fontWeight: "bold" }}>Out of Stock</span>
                      ) : (
                        `${parseFloat(crop.qty).toFixed(0)} kg`
                      )} • Harvest {crop.harvest}
                    </p>
                    <div className="rating">
                      {"★".repeat(Math.round(parseFloat(crop.rating) || 5))}
                      {"☆".repeat(5 - Math.round(parseFloat(crop.rating) || 5))}
                      <span className="rating-num">({parseFloat(crop.rating).toFixed(1)})</span>
                    </div>
                    {parseFloat(crop.qty) <= 0 ? (
                      <button
                        className="pre-order-btn out-of-stock-btn"
                        disabled
                        style={{
                          background: "#95a5a6",
                          color: "white",
                          cursor: "not-allowed",
                          boxShadow: "none"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Out of Stock
                      </button>
                    ) : (
                      <button
                        className="pre-order-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/crop/${crop.id}`);
                        }}
                      >
                        Pre-Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}