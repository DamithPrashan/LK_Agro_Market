/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import "../../buyer/csss/Browse.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useCrops } from "../../../src/context/CropContext";
import { useAuth } from "../../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt, FaFire } from "react-icons/fa";
import "../../commonPages/csss/HomePage/FeaturedCrops.css";
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
import CultivationBrowse from "./CultivationBrowse.jsx";
import "../csss/CultivationMarketplace.css";


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
  const location = useLocation();
  const { t } = useTranslation();
  const [marketTab, setMarketTab] = useState(() => new URLSearchParams(location.search).get("tab") === "cultivation" ? "cultivation" : "crops");

  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });

  const { crops, loading, fetchCrops } = useCrops();
  const { user } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState(null); // 'guest' | 'farmer'

  // Parse initial search query from URL
  const [searchQuery, setSearchQuery] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get("search") || location.state?.searchQuery || "";
  });

  // Keep search query updated if URL parameters or state changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get("search") || location.state?.searchQuery || "";
    setSearchQuery(q);
  }, [location.search, location.state]);

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
    navigate("/browse", { replace: true });
    fetchListings(defaultFilters, "");
  };


  return (
    <div className="layout-wrapper">
      <div className="main-layout">
        {/* MAIN CONTENT */}
        <main className="content-area">
          <div className="page-header">
            <h1>{t("sidebar.browseCrops")}</h1>
            <p>{t("browse.subtitle")}</p>
          </div>

          <div className="marketplace-tabs" role="tablist" aria-label={t("buyer.cultivation.marketplaceTabs")}>
            <button className={marketTab === "crops" ? "active" : ""} onClick={() => setMarketTab("crops")}>{t("buyer.cultivation.availableCrops")}</button>
            <button className={marketTab === "cultivation" ? "active" : ""} onClick={() => setMarketTab("cultivation")}>{t("buyer.cultivation.opportunities")}</button>
          </div>

          {marketTab === "cultivation" ? <CultivationBrowse /> : <>

          {/* SEARCH BAR */}
          <div className="search-section">
            <input
              type="text"
              placeholder={t("browse.searchPlaceholder")}
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="dropdown"
              value={filters.district}
              onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
            >
              <option value="All Districts">{t("forms.selectDistrict")}</option>
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
              <option value="All Crops">{t("forms.selectCategory")}</option>
              <option value="Tomato">{t("crops.tomato")}</option>
              <option value="Carrot">{t("crops.carrot")}</option>
              <option value="Leeks">{t("crops.leeks")}</option>
              <option value="Capsicum">{t("crops.capsicum")}</option>
              <option value="Potato">{t("crops.potato")}</option>
              <option value="Green Beans">{t("crops.greenBeans")}</option>
              <option value="Cucumber">{t("crops.cucumber")}</option>
              <option value="Beetroot">{t("crops.beetroot")}</option>
              <option value="Radish">{t("crops.radish")}</option>
              <option value="Cabbage">{t("crops.cabbage")}</option>
              <option value="Beans">{t("crops.beans")}</option>
              <option value="Brinjal">{t("crops.brinjal")}</option>
              <option value="Avocado">{t("crops.avocado")}</option>
              <option value="Grapes">{t("crops.grapes")}</option>
              <option value="Pineapple">{t("crops.pineapple")}</option>
              <option value="Pumpkin">{t("crops.pumpkin")}</option>
              <option value="Banana">{t("crops.banana")}</option>
              <option value="Ladies Finger">{t("crops.ladiesFinger")}</option>
              <option value="Lemon">{t("crops.lemon")}</option>
              <option value="Mango">{t("crops.mango")}</option>
              <option value="Onion">{t("crops.onion")}</option>
              <option value="Watermelon">{t("crops.watermelon")}</option>
              <option value="Corn">{t("crops.corn")}</option>
            </select>
          </div>

          {/* ADVANCED FILTERS PANEL (Always Visible) */}
          <div className="advanced-filters-panel">
            <div className="filter-group">
              <label>{t("forms.priceRange")}</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder={t("forms.min")}
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  className={`small-input ${filters.priceMin && filters.priceMax && parseFloat(filters.priceMin) > parseFloat(filters.priceMax) ? "input-error" : ""}`}
                />
                <span className="price-sep">-</span>
                <input
                  type="number"
                  placeholder={t("forms.max")}
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  className={`small-input ${filters.priceMin && filters.priceMax && parseFloat(filters.priceMin) > parseFloat(filters.priceMax) ? "input-error" : ""}`}
                />
              </div>
              {filters.priceMin && filters.priceMax && parseFloat(filters.priceMin) > parseFloat(filters.priceMax) && (
                <span className="error-text">{t("errors.minPriceExceeds")}</span>
              )}
            </div>

            <div className="filter-group harvest-date-group">
              <label>{t("forms.harvestDateWindow")}</label>
              <div className="date-range-inputs">
                <input
                  type="date"
                  value={filters.harvestFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, harvestFrom: e.target.value }))}
                  className="date-input"
                  placeholder={t("forms.min")}
                />
                <span className="date-sep">{t("browse.dateSeparator")}</span>
                <input
                  type="date"
                  value={filters.harvestTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, harvestTo: e.target.value }))}
                  className="date-input"
                  placeholder={t("forms.max")}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>{t("forms.sortBy")}</label>
              <select
                className="dropdown-sort"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              >
                <option value="">{t("forms.sortDefault")}</option>
                <option value="price_asc">{t("forms.sortPriceAsc")}</option>
                <option value="price_desc">{t("forms.sortPriceDesc")}</option>
                <option value="rating_desc">{t("forms.sortRatingDesc")}</option>
                <option value="harvest_desc">{t("forms.sortHarvestDesc")}</option>
              </select>
            </div>

            {/* FILTER BUTTON */}
            <div className="filter-group reset-group">
              <button
                className="apply-filters-btn"
                onClick={handleApplyFilters}
              >
                {t("buttons.filter")}
              </button>
            </div>

            {/* RESET FILTERS BUTTON */}
            <div className="filter-group reset-group">
              <button
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                {t("buttons.resetFilters")}
              </button>
            </div>
          </div>

          {/* INFO BANNER */}
          <div className="info-banner">
            {t("browse.showingCropsNear", { district: filters.district === "All" || filters.district === "All Districts" ? t("browse.allSriLanka") : filters.district })}. <span style={{ textDecoration: "underline", cursor: "pointer", color: "#1a5c2d", marginLeft: "4px" }} onClick={() => navigate("/buyer/mapsearch")}>{t("browse.useMapSearch")}</span>
          </div>

          {/* STATS */}
          <div className="stats-row">
            <div className="stat-box">
              <h2>{stats.pending}</h2>
              <p>{t("stats.pendingOrders")}</p>
            </div>
            <div className="stat-box">
              <h2>{stats.active}</h2>
              <p>{t("stats.activeReservations")}</p>
            </div>
            <div className="stat-box">
              <h2>{stats.completed}</h2>
              <p>{t("stats.completedOrders")}</p>
            </div>
          </div>

          {/* CROP GRID */}
          {loading ? (
            <div className="loading-state">{t("loadingStates.loadingCrops")}</div>
          ) : crops.length === 0 ? (
            <div className="empty-state">{t("emptyStates.noCropsMatching")}</div>
          ) : (
            <div className="crop-grid">
              {crops.map((crop) => (
                <article
                  className="featured-card"
                  key={crop.id}
                  onClick={() => navigate(`/crop/${crop.id}`)}
                  style={{ cursor: "pointer", display: "flex", flexDirection: "column", height: "100%" }}
                >
                  <div className="featured-image-wrap">
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
                        {t("emptyStates.outOfStock")}
                      </span>
                    )}
                    {parseInt(crop.is_trending) === 1 && (
                      <div className="featured-verified">
                        <FaFire />
                        <span>Trending</span>
                      </div>
                    )}
                    {(() => {
                      if (crop.image_url) {
                        let imgUrl = crop.image_url;
                        if (!imgUrl.startsWith("http") && !imgUrl.startsWith("/")) {
                          imgUrl = "/backend/" + imgUrl;
                        }
                        return <img src={imgUrl} alt={crop.name} />;
                      }
                      const capitalized = crop.name ? crop.name.charAt(0).toUpperCase() + crop.name.slice(1).toLowerCase() : "";
                      const localImg = imageMap[capitalized] || imageMap[crop.name];
                      if (localImg) {
                        return <img src={localImg} alt={crop.name} />;
                      } else {
                        return (
                          <div className={`crop-image-area ${getBgClass(crop.name)}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="crop-icon">🌱</span>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  <div className="featured-card-body" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <h3>{crop.name}</h3>

                    <div className="featured-meta crop-card-meta">
                      <div className="featured-location">
                        <FaMapMarkerAlt />
                        <span>{crop.district || "Sri Lanka"}</span>
                      </div>
                      
                      <div className="featured-quantity crop-card-farmer">
                        {parseInt(crop.is_verified) === 1 && <span className="verified-tick" style={{ background: '#eaf5ec', color: '#27ae60', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                        <span>{crop.farmer_name}</span>
                      </div>
                    </div>

                    <div className="meta-info crop-card-details">
                      <span>
                        {t("browse.available")} {parseFloat(crop.qty) <= 0 ? (
                          <span style={{ color: "#e74c3c", fontWeight: "bold" }}>{t("emptyStates.outOfStock")}</span>
                        ) : (
                          `${parseFloat(crop.qty).toFixed(0)} kg`
                        )}
                      </span>
                      <span>
                        {t("browse.harvestLabel")} {crop.harvest}
                      </span>
                    </div>

                    <div className="rating crop-card-rating">
                      {"★".repeat(Math.round(parseFloat(crop.rating) || 5))}
                      {"☆".repeat(5 - Math.round(parseFloat(crop.rating) || 5))}
                      <span className="rating-num" style={{ fontSize: "11px", color: "#7f8c8d", marginLeft: "5px" }}>({parseFloat(crop.rating).toFixed(1)})</span>
                    </div>

                    <div className="featured-divider crop-card-divider"></div>

                    <div className="crop-card-footer">
                      <div className="featured-price">
                        <span className="featured-price-main">Rs. {parseFloat(crop.price).toFixed(0)}</span>
                        <span className="featured-price-unit">/kg</span>
                      </div>
                      
                      <div className="crop-card-action">
                        {parseFloat(crop.qty) <= 0 ? (
                          <button
                            className="pre-order-btn out-of-stock-btn"
                            disabled
                            style={{
                              background: "#95a5a6",
                              color: "white",
                              cursor: "not-allowed",
                              boxShadow: "none",
                              padding: "8px 12px",
                              fontSize: "13px"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {t("emptyStates.outOfStock")}
                          </button>
                        ) : (
                          <button
                            className="pre-order-btn"
                            style={{ padding: "8px 12px", fontSize: "13px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) {
                                setAuthModalType('guest');
                                setShowAuthModal(true);
                              } else if (user.role === 'farmer') {
                                setAuthModalType('farmer');
                                setShowAuthModal(true);
                              } else {
                                navigate(`/crop/${crop.id}`);
                              }
                            }}
                          >
                            {t("sidebar.preOrder")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          </>}
        </main>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <style>{`
            @keyframes modalFadeScale {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .modal-animated {
              animation: modalFadeScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          
          <div className="card modal-animated" style={{ 
            maxWidth: "420px", 
            width: "90%", 
            textAlign: "center", 
            position: "relative",
            padding: "35px 25px",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            {/* SVG Shopping Basket Icon */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
              <div style={{ background: "var(--g-50)", padding: "16px", borderRadius: "50%", display: "inline-flex" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--g-800)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
            </div>

            {authModalType === 'guest' ? (
              <>
                <h2 style={{ marginBottom: "12px", color: "var(--t-1)", fontSize: "22px", fontWeight: "700" }}>
                  {t("auth.loginRequired", "Login Required")}
                </h2>
                <p style={{ marginBottom: "28px", color: "var(--t-2)", fontSize: "15px", lineHeight: "1.5" }}>
                  {t("auth.buyerRegisterPrompt", "You have to register as a buyer to make a pre order.")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                  <button className="btn btn-primary btn-lg btn-full" onClick={() => {
                    setShowAuthModal(false);
                    navigate("/register?role=buyer");
                  }}>
                    {t("buttons.registerBuyer", "Register as Buyer")}
                  </button>
                  <button className="btn btn-ghost" style={{ border: "none", background: "transparent" }} onClick={() => setShowAuthModal(false)}>
                    {t("buttons.cancel", "Cancel")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: "12px", color: "var(--t-1)", fontSize: "22px", fontWeight: "700" }}>
                  {t("auth.accessDenied", "Access Denied")}
                </h2>
                <p style={{ marginBottom: "28px", color: "var(--t-2)", fontSize: "15px", lineHeight: "1.5" }}>
                  {t("auth.farmerPreOrderPrompt", "Pre-orders are for buyers only. If you wish to purchase crops, please register a buyer account.")}
                </p>
                <button className="btn btn-primary btn-lg btn-full" onClick={() => setShowAuthModal(false)}>
                  {t("buttons.close", "Close")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
