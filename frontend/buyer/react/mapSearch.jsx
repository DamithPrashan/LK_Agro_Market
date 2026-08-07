import React, { useState, useEffect, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt, FaFilter, FaCalendarAlt, FaStar, FaRegStar, FaLeaf, FaTimes } from "react-icons/fa";
import "../csss/mapSearch.css";

// Sri Lanka Adjacency Map for Distance Calculation
const ADJACENCY_MAP = {
  "Colombo": ["Gampaha", "Kalutara", "Kegalle", "Ratnapura"],
  "Gampaha": ["Colombo", "Kalutara", "Kegalle", "Kurunegala", "Puttalam"],
  "Kalutara": ["Colombo", "Galle", "Ratnapura"],
  "Kandy": ["Matale", "Nuwara Eliya", "Kegalle", "Kurunegala", "Badulla"],
  "Matale": ["Kandy", "Anuradhapura", "Polonnaruwa", "Kurunegala", "Badulla", "Ampara"],
  "Nuwara Eliya": ["Kandy", "Badulla", "Ratnapura", "Kegalle"],
  "Galle": ["Kalutara", "Matara", "Ratnapura"],
  "Matara": ["Galle", "Hambantota", "Ratnapura"],
  "Hambantota": ["Matara", "Ratnapura", "Moneragala", "Ampara"],
  "Jaffna": ["Kilinochchi"],
  "Kilinochchi": ["Jaffna", "Mannar", "Mullaitivu"],
  "Mannar": ["Kilinochchi", "Vavuniya", "Anuradhapura", "Puttalam"],
  "Vavuniya": ["Mannar", "Mullaitivu", "Anuradhapura", "Trincomalee"],
  "Mullaitivu": ["Kilinochchi", "Vavuniya", "Trincomalee", "Mannar"],
  "Batticaloa": ["Polonnaruwa", "Ampara", "Trincomalee"],
  "Ampara": ["Batticaloa", "Badulla", "Moneragala", "Hambantota"],
  "Trincomalee": ["Anuradhapura", "Polonnaruwa", "Batticaloa", "Mullaitivu", "Vavuniya"],
  "Kurunegala": ["Gampaha", "Kegalle", "Kandy", "Matale", "Anuradhapura", "Puttalam"],
  "Puttalam": ["Gampaha", "Kurunegala", "Anuradhapura", "Mannar"],
  "Anuradhapura": ["Puttalam", "Kurunegala", "Matale", "Polonnaruwa", "Trincomalee", "Vavuniya", "Mannar"],
  "Polonnaruwa": ["Anuradhapura", "Matale", "Trincomalee", "Batticaloa"],
  "Badulla": ["Moneragala", "Ampara", "Kandy", "Nuwara Eliya", "Matale"],
  "Moneragala": ["Badulla", "Ampara", "Hambantota", "Ratnapura"],
  "Ratnapura": ["Kegalle", "Nuwara Eliya", "Badulla", "Moneragala", "Hambantota", "Matara", "Galle", "Kalutara", "Colombo"],
  "Kegalle": ["Colombo", "Gampaha", "Kurunegala", "Kandy", "Nuwara Eliya", "Ratnapura"]
};

// Center coordinate lookup for the 25 districts
const DISTRICT_COORDS = {
  "Colombo": [6.9271, 79.8612],
  "Gampaha": [7.0873, 79.9926],
  "Kalutara": [6.5854, 79.9607],
  "Kandy": [7.2906, 80.6337],
  "Matale": [7.4684, 80.6234],
  "Nuwara Eliya": [6.9497, 80.7891],
  "Galle": [6.0535, 80.2210],
  "Matara": [5.9549, 80.5550],
  "Hambantota": [6.1248, 81.1185],
  "Jaffna": [9.6615, 80.0255],
  "Kilinochchi": [9.3803, 80.3982],
  "Mannar": [8.9810, 79.9044],
  "Vavuniya": [8.7542, 80.4982],
  "Mullaitivu": [9.2673, 80.8143],
  "Batticaloa": [7.7170, 81.7000],
  "Ampara": [7.2955, 81.6747],
  "Trincomalee": [8.5874, 81.2152],
  "Kurunegala": [7.4863, 80.3647],
  "Puttalam": [8.0330, 79.8270],
  "Anuradhapura": [8.3114, 80.4037],
  "Polonnaruwa": [7.9397, 81.0006],
  "Badulla": [6.9934, 81.0550],
  "Moneragala": [6.8724, 81.3507],
  "Ratnapura": [6.6828, 80.3992],
  "Kegalle": [7.2513, 80.3464]
};

// Sri Lanka Districts list for dropdown
const DISTRICTS = Object.keys(DISTRICT_COORDS).sort();

// Crop categories
const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Spices"];

// Custom Leaflet DivIcons for Green (Verified) and Blue (Unverified) markers
const createCustomIcon = (color, emoji) => {
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; position: relative;">
             ${emoji}
             <div style="position: absolute; bottom: -5px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid ${color};"></div>
           </div>`,
    className: "custom-pin",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

export default function MapSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Filters State
  const [district, setDistrict] = useState("All Districts");
  const [cropType, setCropType] = useState("All Crops");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [harvestBefore, setHarvestBefore] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Map state
  const [farmers, setFarmers] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Farmers Data based on filters
  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (district !== "All Districts") params.append("district", district);
      if (cropType !== "All Crops") params.append("crop_type", cropType);
      params.append("min_price", "0");
      params.append("max_price", maxPrice.toString());
      if (harvestBefore) params.append("harvest_before", harvestBefore);
      if (verifiedOnly) params.append("verified_only", "1");

      const response = await fetch(`/backend/Apis/get_map_farmers.php?${params.toString()}`, {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success) {
        setFarmers(data.farmers || []);
      }
    } catch (err) {
      console.error("Failed to load map farmers details:", err);
    } finally {
      setLoading(false);
    }
  }, [district, cropType, maxPrice, harvestBefore, verifiedOnly]);

  // Fetch Seasonal Crop Calendar
  const fetchCalendar = useCallback(async () => {
    try {
      const response = await fetch("/backend/Apis/get_harvest_calendar.php?days=60", {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success) {
        setCalendarItems(data.calendar || []);
      }
    } catch (err) {
      console.error("Failed to load harvest calendar details:", err);
    }
  }, []);

  useEffect(() => {
    fetchFarmers();
    fetchCalendar();
  }, [fetchFarmers, fetchCalendar]);

  const handleSearch = () => {
    fetchFarmers();
  };

  const handleReset = () => {
    setDistrict("All Districts");
    setCropType("All Crops");
    setMaxPrice(1000);
    setHarvestBefore("");
    setVerifiedOnly(false);
  };

  // Distance calculations: Near / Moderate / Far
  const getDistanceLabel = useCallback((farmerDistrict) => {
    const userDistrict = user?.district || "Colombo";
    if (farmerDistrict === userDistrict) {
      return { text: t("mapSearch.near", "Near"), className: "near" };
    }
    const adjacent = ADJACENCY_MAP[userDistrict] || [];
    if (adjacent.includes(farmerDistrict)) {
      return { text: t("mapSearch.moderate", "Moderate"), className: "moderate" };
    }
    return { text: t("mapSearch.far", "Far"), className: "far" };
  }, [user, t]);

  // Generate heatmap coordinates and counts of active crops per district
  const districtHeatmapData = useMemo(() => {
    const counts = {};
    // Seed counts for all districts
    Object.keys(DISTRICT_COORDS).forEach(d => {
      counts[d] = 0;
    });

    // Populate counts based on all farmers (without filter restriction on location)
    farmers.forEach(f => {
      const d = f.location;
      if (counts[d] !== undefined) {
        counts[d] += f.active_crop_count;
      }
    });

    return Object.keys(DISTRICT_COORDS).map(d => {
      const count = counts[d];
      let color = "#9e9e9e"; // Grey
      if (count >= 5) {
        color = "#1b5e20"; // Dark Green
      } else if (count > 0) {
        color = "#4caf50"; // Light Green
      }

      return {
        name: d,
        coordinates: DISTRICT_COORDS[d],
        count: count,
        color: color
      };
    });
  }, [farmers]);

  // Group harvest calendar items
  const groupedCalendar = useMemo(() => {
    const today = new Date();
    const thisWeek = [];
    const nextWeek = [];
    const thisMonth = [];

    calendarItems.forEach(item => {
      const hDate = new Date(item.harvest_date);
      const diffTime = hDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        thisWeek.push(item);
      } else if (diffDays <= 14) {
        nextWeek.push(item);
      } else {
        thisMonth.push(item);
      }
    });

    return { thisWeek, nextWeek, thisMonth };
  }, [calendarItems]);

  const renderStars = (rating) => {
    const rounded = Math.round(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rounded) {
        stars.push(<FaStar key={i} />);
      } else {
        stars.push(<FaRegStar key={i} />);
      }
    }
    return stars;
  };

  return (
    <div className="map-search-container">
      {/* HEADER */}
      <header className="map-header">
        <h1>{t("mapSearch.title", "Farmer Map Discovery")}</h1>
        <p>{t("mapSearch.subtitle", "Find verified farms, check crop availability, and plan pre-orders directly from the map.")}</p>
      </header>

      {/* FILTER PANEL */}
      <section className="filter-panel">
        <div className="filter-row">
          {/* District Dropdown */}
          <div className="filter-group">
            <label htmlFor="district-select">{t("mapSearch.district", "District")}</label>
            <select
              id="district-select"
              className="filter-control"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="All Districts">{t("browse.allSriLanka", "All Sri Lanka")}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Crop Type Dropdown */}
          <div className="filter-group">
            <label htmlFor="crop-category-select">{t("mapSearch.cropType", "Crop Category")}</label>
            <select
              id="crop-category-select"
              className="filter-control"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
            >
              <option value="All Crops">{t("sidebar.browseCrops", "All Crops")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div className="filter-group range-slider-container">
            <div className="range-values">
              <label>{t("mapSearch.priceRange", "Max Price")}</label>
              <span>Rs {maxPrice} /kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              className="range-slider"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            />
          </div>

          {/* Harvest Date Picker */}
          <div className="filter-group">
            <label htmlFor="harvest-date-select">{t("mapSearch.harvestDate", "Harvest Before")}</label>
            <input
              id="harvest-date-select"
              type="date"
              className="filter-control"
              value={harvestBefore}
              onChange={(e) => setHarvestBefore(e.target.value)}
            />
          </div>

          {/* Verified Toggle */}
          <div className="filter-group checkbox-group">
            <label className="switch-container">
              <input
                type="checkbox"
                className="switch-input"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span className="switch-label"></span>
              <span>{t("mapSearch.verifiedOnly", "Verified Only")}</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="filter-actions">
            <button className="btn-secondary" onClick={handleReset}>
              {t("mapSearch.reset", "Reset")}
            </button>
            <button className="btn-primary" onClick={handleSearch}>
              <FaFilter /> {t("mapSearch.search", "Apply Filters")}
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE MAP */}
      <section className="map-section">
        <div className="map-overlay-controls">
          <button
            className={`heatmap-toggle-btn ${showHeatmap ? "active" : ""}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            <FaLeaf /> {t("mapSearch.showHeatmap", "Show Crop Heatmap")}
          </button>
        </div>

        <div className="map-container-wrapper">
          <MapContainer
            center={[7.8731, 80.7718]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Farmer Pins */}
            {!showHeatmap &&
              farmers.map((farmer) => {
                const isVerified = farmer.verified_status === 1;
                const markerColor = isVerified ? "#1a5c2d" : "#1976d2";
                const emoji = isVerified ? "🌾" : "👨‍🌾";
                const icon = createCustomIcon(markerColor, emoji);

                return (
                  <Marker
                    key={farmer.farmer_id}
                    position={[farmer.latitude, farmer.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <div className="popup-farmer-info">
                        <div className="popup-farmer-header">
                          <div className="popup-farmer-title">
                            <span className="popup-farmer-name">{farmer.farmer_name}</span>
                            {isVerified ? (
                              <span className="badge-verified">✓ {t("mapSearch.verifiedBadge", "Verified")}</span>
                            ) : (
                              <span className="badge-unverified">{t("buyerDashboard.standardListing", "Standard")}</span>
                            )}
                          </div>
                          <span className="popup-farmer-location">📍 {farmer.location}</span>
                        </div>

                        <div className="popup-crops-section">
                          <span className="popup-crops-title">{t("mapSearch.activeCrops", "Active Crops")}</span>
                          <ul className="popup-crops-list">
                            {farmer.crops.map((crop) => (
                              <li key={crop.crop_id} className="popup-crop-item">
                                <span
                                  style={{ textDecoration: "underline", cursor: "pointer", color: "#1a5c2d", fontWeight: "600" }}
                                  onClick={() => navigate(`/crop/${crop.crop_id}`)}
                                >
                                  {crop.crop_name}
                                </span>
                                <span className="popup-crop-price">Rs {crop.price_per_unit}/kg</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {farmer.crops.length > 0 && (
                          <div className="popup-action">
                            <button
                              className="popup-action-btn"
                              onClick={() => navigate(`/browse?search=${encodeURIComponent(farmer.farmer_name)}`)}
                            >
                              {t("mapSearch.viewListings", "View Listings")}
                            </button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Render Heatmap Overlay Circles */}
            {showHeatmap &&
              districtHeatmapData.map((d) => (
                <Circle
                  key={d.name}
                  center={d.coordinates}
                  radius={20000} // 20km circle radius
                  pathOptions={{
                    fillColor: d.color,
                    color: d.color,
                    weight: 1,
                    fillOpacity: d.count > 0 ? 0.45 : 0.15
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
                      <strong style={{ fontSize: "1rem" }}>{d.name}</strong>
                      <div style={{ marginTop: "6px", fontSize: "0.85rem", color: "#475569" }}>
                        {d.count} {t("mapSearch.activeListings", "active listings")}
                      </div>
                    </div>
                  </Popup>
                </Circle>
              ))}
          </MapContainer>
        </div>
      </section>

      {/* FARMER CARDS AND CALENDAR */}
      <div className="map-content-grid">
        {/* FARMER CARDS LIST */}
        <section className="farmer-list-section">
          <h2 className="section-title">{t("home.farmersStat", "Farmers Near You")}</h2>
          {loading ? (
            <div className="calendar-empty">{t("loadingStates.loadingCrops", "Loading farms...")}</div>
          ) : farmers.length === 0 ? (
            <div className="empty-results">
              <div className="empty-results-icon">🚜</div>
              <h3>{t("mapSearch.noFarmers", "No Farmers Found")}</h3>
              <p>{t("emptyStates.noCropsMatching", "Try adjusting your price range or district filters.")}</p>
            </div>
          ) : (
            <div className="farmer-cards-grid">
              {farmers.map((farmer) => {
                const distance = getDistanceLabel(farmer.location);
                const isVerified = farmer.verified_status === 1;

                return (
                  <div
                    key={farmer.farmer_id}
                    className={`farmer-card ${isVerified ? "verified" : ""}`}
                    onClick={() => {
                      navigate(`/browse?search=${encodeURIComponent(farmer.farmer_name)}`);
                    }}
                  >
                    <div className="card-header">
                      <div className="card-name-row">
                        <span className="card-name">{farmer.farmer_name}</span>
                        {isVerified ? (
                          <span className="badge-verified">✓ {t("mapSearch.verifiedBadge", "Verified")}</span>
                        ) : (
                          <span className="badge-unverified">{t("buyerDashboard.standardListing", "Standard")}</span>
                        )}
                      </div>
                      <div className="card-meta-row">
                        <span>📍 {farmer.location}</span>
                        <span className={`distance-label ${distance.className}`}>{distance.text}</span>
                      </div>
                      <div className="card-rating-row">
                        {renderStars(farmer.rating_average)}
                        <span className="card-rating-count">
                          ({farmer.rating_average.toFixed(1)} • {farmer.rating_count} {t("buyerDashboard.reviews", "reviews")})
                        </span>
                      </div>
                    </div>

                    <div className="card-crops-container">
                      <span className="card-crops-title">{t("mapSearch.activeCrops", "Active Crops")}</span>
                      <div className="card-crops-badges">
                        {farmer.crops.slice(0, 3).map((crop) => (
                          <div key={crop.crop_id} className="crop-badge-price">
                            <span className="crop-badge-name">{crop.crop_name}</span>
                            <span className="crop-badge-val">Rs {crop.price_per_unit}</span>
                          </div>
                        ))}
                        {farmer.crops.length > 3 && (
                          <div className="crop-badge-price" style={{ backgroundColor: "#e2e8f0" }}>
                            <span className="crop-badge-name" style={{ color: "#475569" }}>
                              +{farmer.crops.length - 3} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-listings-count">
                      <span>{farmer.active_crop_count} {t("home.listingsStat", "Listings")}</span>
                    </div>

                    {farmer.crops.length > 0 && (
                      <button
                        className="card-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/browse?search=${encodeURIComponent(farmer.farmer_name)}`);
                        }}
                      >
                        {t("mapSearch.viewListings", "View Listings")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* HARVEST CALENDAR */}
        <section className="calendar-section">
          <div className="calendar-header">
            <h2>
              <FaCalendarAlt style={{ color: "#1a5c2d" }} />
              {t("mapSearch.calendarTitle", "Seasonal Crop Calendar")}
            </h2>
            <p>{t("mapSearch.calendarSubtitle", "Upcoming harvests in the next 60 days. Secure crop bookings early.")}</p>
          </div>

          <div className="calendar-body">
            {/* THIS WEEK */}
            <div className="calendar-group">
              <span className="calendar-group-title">{t("mapSearch.thisWeek", "This Week")}</span>
              <div className="calendar-items-list">
                {groupedCalendar.thisWeek.length === 0 ? (
                  <div className="calendar-empty">{t("emptyStates.noActivity", "No harvests scheduled")}</div>
                ) : (
                  groupedCalendar.thisWeek.map((item) => (
                    <div
                      key={item.crop_id}
                      className="calendar-item-card"
                      onClick={() => navigate(`/crop/${item.crop_id}`)}
                    >
                      <div className="calendar-item-header">
                        <span className="calendar-item-name">{item.crop_name}</span>
                        <span className="calendar-item-price">Rs {item.price_per_unit}/kg</span>
                      </div>
                      <div className="calendar-item-details">
                        <span className="calendar-item-farmer">{item.farmer_name} ({item.district})</span>
                        <span className="calendar-item-date">{item.harvest_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* NEXT WEEK */}
            <div className="calendar-group">
              <span className="calendar-group-title">{t("mapSearch.nextWeek", "Next Week")}</span>
              <div className="calendar-items-list">
                {groupedCalendar.nextWeek.length === 0 ? (
                  <div className="calendar-empty">{t("emptyStates.noActivity", "No harvests scheduled")}</div>
                ) : (
                  groupedCalendar.nextWeek.map((item) => (
                    <div
                      key={item.crop_id}
                      className="calendar-item-card"
                      onClick={() => navigate(`/crop/${item.crop_id}`)}
                    >
                      <div className="calendar-item-header">
                        <span className="calendar-item-name">{item.crop_name}</span>
                        <span className="calendar-item-price">Rs {item.price_per_unit}/kg</span>
                      </div>
                      <div className="calendar-item-details">
                        <span className="calendar-item-farmer">{item.farmer_name} ({item.district})</span>
                        <span className="calendar-item-date">{item.harvest_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* THIS MONTH / UPCOMING */}
            <div className="calendar-group">
              <span className="calendar-group-title">{t("mapSearch.thisMonth", "Upcoming")}</span>
              <div className="calendar-items-list">
                {groupedCalendar.thisMonth.length === 0 ? (
                  <div className="calendar-empty">{t("emptyStates.noActivity", "No harvests scheduled")}</div>
                ) : (
                  groupedCalendar.thisMonth.map((item) => (
                    <div
                      key={item.crop_id}
                      className="calendar-item-card"
                      onClick={() => navigate(`/crop/${item.crop_id}`)}
                    >
                      <div className="calendar-item-header">
                        <span className="calendar-item-name">{item.crop_name}</span>
                        <span className="calendar-item-price">Rs {item.price_per_unit}/kg</span>
                      </div>
                      <div className="calendar-item-details">
                        <span className="calendar-item-farmer">{item.farmer_name} ({item.district})</span>
                        <span className="calendar-item-date">{item.harvest_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
