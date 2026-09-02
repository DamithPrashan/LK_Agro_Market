import { useState, useEffect, useCallback } from "react";
import "../../buyer/csss/buyerDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import HeroCarousel from "../../components/HeroCarousel/HeroCarousel";
import PlatformFeedbackModal from "../../components/PlatformFeedbackModal";


export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [location, setLocation] = useState("Colombo");
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0, complaints: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Platform Feedback State
  const [showPlatformFeedback, setShowPlatformFeedback] = useState(false);
  const [feedbackOrderId, setFeedbackOrderId] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState("");

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
    { label: "My Reservations", icon: "📦", key: "reservations", path: "/buyer/BuyerOrderHistory" },
    { label: "Pre-Order", icon: "📝", key: "preorder", path: "/preorder" },
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
        setError(data.message || t("errors.dashboardLoadFailed"));
      }
    } catch (err) {
      console.error("Failed to load buyer dashboard details:", err);
      setError(t("errors.connectionFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Check Platform Review Eligibility
  useEffect(() => {
    if (!user) return;
    const checkFeedbackEligibility = async () => {
      try {
        const response = await fetch("/backend/Apis/buyer/check_platform_review_eligibility.php", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && data.eligible && data.order_id) {
          const dismissedKey = `platform_review_dismissed_${user.id}_${data.order_id}`;
          if (!localStorage.getItem(dismissedKey)) {
            setFeedbackOrderId(data.order_id);
            setShowPlatformFeedback(true);
          }
        }
      } catch (err) {
        console.error("Platform feedback check error:", err);
      }
    };
    checkFeedbackEligibility();
  }, [user]);

  const handleCloseFeedbackModal = () => {
    if (user && feedbackOrderId) {
      localStorage.setItem(`platform_review_dismissed_${user.id}_${feedbackOrderId}`, "true");
    }
    setShowPlatformFeedback(false);
  };

  const handleFeedbackSubmitSuccess = (msg) => {
    if (user && feedbackOrderId) {
      localStorage.setItem(`platform_review_dismissed_${user.id}_${feedbackOrderId}`, "true");
    }
    setFeedbackToast(msg || "Thank you for your review!");
    setTimeout(() => setFeedbackToast(""), 5000);
  };

  const getCropNameTranslated = (cropName) => {
    if (!cropName) return "";
    const key = cropName.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) return "";
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
    const translated = t(`crops.${key}`);
    return translated && !translated.startsWith("crops.") ? translated : cropName;
  };

  const renderActivityMessage = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;

    const { type, qty, unit, crop } = item;
    const translatedCrop = crop ? getCropNameTranslated(crop) : "";

    switch (type) {
      case "reservation_created":
      case "reservation_pending":
        return t("buyerDashboard.activity.reservation_created", {
          qty: qty,
          unit: unit || "kg",
          crop: translatedCrop,
          defaultValue: `Reserved ${qty}${unit || "kg"} ${translatedCrop || crop}`
        });
      case "reservation_confirmed":
        return t("buyerDashboard.activity.reservation_confirmed", {
          qty: qty,
          unit: unit || "kg",
          crop: translatedCrop,
          defaultValue: `Reservation for ${qty}${unit || "kg"} ${translatedCrop || crop} confirmed`
        });
      case "reservation_cancelled":
        return t("buyerDashboard.activity.reservation_cancelled", {
          qty: qty,
          unit: unit || "kg",
          crop: translatedCrop,
          defaultValue: `Cancelled reservation for ${qty}${unit || "kg"} ${translatedCrop || crop}`
        });
      case "order_completed":
      case "order_delivered":
        return t("buyerDashboard.activity.order_completed", {
          qty: qty,
          unit: unit || "kg",
          crop: translatedCrop,
          defaultValue: `Order for ${qty}${unit || "kg"} ${translatedCrop || crop} delivered successfully`
        });
      case "new_listing_available":
        return t("buyerDashboard.activity.new_listing_available", {
          crop: translatedCrop,
          defaultValue: `New ${translatedCrop || crop} listing available`
        });
      case "browse_crops_hint":
        return t("buyerDashboard.activity.browse_crops_hint", {
          defaultValue: "Browse crops to start reserving fresh products"
        });
      case "explore_farmers_hint":
        return t("buyerDashboard.activity.explore_farmers_hint", {
          defaultValue: "Explore nearby farmers in your district"
        });
      case "track_stages_hint":
        return t("buyerDashboard.activity.track_stages_hint", {
          defaultValue: "Keep track of crop growth stages dynamically"
        });
      default:
        return item.message || type;
    }
  };

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
          <h2>{t("errors.genericError")}</h2>
          <p>{error}</p>
          <button className="secondary-btn" onClick={fetchDashboard}>
            {t("buttons.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* HERO */}
      <section className="hero">
        <HeroCarousel>
          <h1>
            {t("buyerDashboard.welcomeBack", { name: firstName })}
          </h1>
          <p>
            {isReturningUser
              ? t("buyerDashboard.subtitleReturning")
              : t("buyerDashboard.subtitleNew")}
          </p>
        </HeroCarousel>
      </section>

      {/* STATS */}
      <section className="stats-container">
        <div className="stat-card yellow">
          <span className="stat-icon">⏳</span>
          <h2>{stats.pending}</h2>
          <p>{t("stats.pendingReservations")}</p>
        </div>

        <div className="stat-card blue">
          <span className="stat-icon">🔄</span>
          <h2>{stats.active}</h2>
          <p>{t("stats.activeReservations")}</p>
        </div>

        <div className="stat-card green">
          <span className="stat-icon">✅</span>
          <h2>{stats.completed}</h2>
          <p>{t("stats.completedOrders")}</p>
        </div>

        <div className="stat-card red">
          <span className="stat-icon">⚠️</span>
          <h2>{stats.complaints}</h2>
          <p>{t("stats.openComplaints")}</p>
        </div>
      </section>

      {/* LOCATION BANNER */}
      <section className="location-banner">
        <div>
          {t("buyerDashboard.locationBanner", { location: location })}
        </div>
        <button onClick={() => navigate("/buyer/mapsearch")}>{t("buyerDashboard.exploreNearby")}</button>
      </section>


      {/* QUICK LINKS */}
      {/* <section className="quick-links">
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
      </section> */}

      {/* CONTENT GRID */}
      <section className="content-grid">
        {/* RECENT ACTIVITY */}
        <div className="content-box">
          <h2>{t("buyerDashboard.recentActivity", "Recent Activity")}</h2>
          {recentActivities.length > 0 ? (
            <ul>
              {recentActivities.map((item, i) => (
                <li key={i}>✅ {renderActivityMessage(item)}</li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🌱</span>
              <p>{t("emptyStates.noActivity")}</p>
              <button className="secondary-btn" onClick={() => navigate("/browse")}>
                {t("sidebar.browseCrops")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FEEDBACK SUCCESS TOAST */}
      {feedbackToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#166534",
          color: "#ffffff",
          padding: "14px 24px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(22, 101, 52, 0.3)",
          fontWeight: "600",
          zIndex: 1300,
          animation: "pfFadeIn 0.3s ease-out"
        }}>
          ✅ {feedbackToast}
        </div>
      )}

      {/* PLATFORM FEEDBACK POPUP MODAL */}
      {showPlatformFeedback && (
        <PlatformFeedbackModal
          orderId={feedbackOrderId}
          onClose={handleCloseFeedbackModal}
          onSubmitSuccess={handleFeedbackSubmitSuccess}
        />
      )}
    </div>
  );
}