import React, { useState, useEffect } from "react";
import "../../buyer/csss/Browse.css";
import { useNavigate } from "react-router-dom";
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

  const stats = {
    pending: 2,
    active: 3,
    completed: 8,
  };

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch listings function
  const fetchListings = async (customFilters = filters, customSearch = searchQuery) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (customSearch) queryParams.append("search_query", customSearch);
      if (customFilters.district && customFilters.district !== "All" && customFilters.district !== "All Districts") {
        queryParams.append("district", customFilters.district);
      }
      if (customFilters.cropType && customFilters.cropType !== "All Crops") {
        queryParams.append("crop_type", customFilters.cropType);
      }

      // Validate and apply Price Min / Max (Min Price should not exceed Max Price)
      const isPriceRangeValid = !(
        customFilters.priceMin &&
        customFilters.priceMax &&
        parseFloat(customFilters.priceMin) > parseFloat(customFilters.priceMax)
      );

      if (isPriceRangeValid) {
        if (customFilters.priceMin) queryParams.append("minPrice", customFilters.priceMin);
        if (customFilters.priceMax) queryParams.append("maxPrice", customFilters.priceMax);
      }

      if (customFilters.harvestFrom) queryParams.append("harvestFrom", customFilters.harvestFrom);
      if (customFilters.harvestTo) queryParams.append("harvestTo", customFilters.harvestTo);
      if (customFilters.isVerified) queryParams.append("is_verified", "true");
      if (customFilters.sortBy) queryParams.append("sort_by", customFilters.sortBy);

      const response = await fetch(`/backend/get_listings.php?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success && data.listings) {
        setCrops(data.listings);
      } else {
        console.error("API Error: ", data.message);
        setCrops([]);
      }
    } catch (err) {
      console.error("Fetch failed: ", err);
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch listings once on initial mount
  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

              <div className="filter-group toggle-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.isVerified}
                    onChange={(e) => setFilters(prev => ({ ...prev, isVerified: e.target.checked }))}
                  />
                  Verified Farmers Only
                </label>
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
                  <div className={`crop-image-area ${getBgClass(crop.name)}`}>
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
                      {parseFloat(crop.qty).toFixed(0)} kg • Harvest {crop.harvest}
                    </p>
                    <div className="rating">
                      {"★".repeat(Math.round(parseFloat(crop.rating) || 5))}
                      {"☆".repeat(5 - Math.round(parseFloat(crop.rating) || 5))}
                      <span className="rating-num">({parseFloat(crop.rating).toFixed(1)})</span>
                    </div>
                    <button 
                      className="pre-order-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/preorder`, { state: { cropId: crop.id } });
                      }}
                    >
                      Pre-Order
                    </button>
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