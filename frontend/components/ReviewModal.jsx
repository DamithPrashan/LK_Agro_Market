import { useState, useEffect } from "react";
import RatingStars from "./ratingStars";
import ReviewList from "./reviewList";
import { useTranslation } from "react-i18next";

export default function ReviewModal({ userId, userName, userRole, userLocation, onClose }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/backend/Apis/get_ratings.php?user_id=${userId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.summary);
          setReviews(data.reviews);
        } else {
          setError(data.message || "Failed to load reviews.");
        }
      })
      .catch(() => {
        setError(t("errors.networkXamppError", "Network error. Make sure XAMPP is running."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, t]);

  if (!userId) return null;

  const initials = (userName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Role translation mapping
  const roleLabel =
    userRole === "farmer"
      ? t("profile.roleFarmer", "Farmer")
      : userRole === "buyer"
      ? t("profile.roleBuyer", "Buyer")
      : userRole;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={s.closeBtn} onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* User Info Header */}
        <div style={s.header}>
          <div style={s.avatar}>{initials}</div>
          <div style={s.userInfo}>
            <h2 style={s.name}>{userName}</h2>
            <div style={s.meta}>
              <span style={s.roleBadge}>{roleLabel}</span>
              {userLocation && <span style={s.location}>📍 {userLocation}</span>}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={s.body}>
          {loading ? (
            <div style={s.loading}>{t("ratings.loading", "Loading...")}</div>
          ) : error ? (
            <div style={s.error}>{error}</div>
          ) : (
            <div style={s.grid}>
              {/* Summary Block */}
              <div style={s.summaryCard}>
                <div style={s.scoreBig}>
                  <span style={s.scoreNum}>{summary ? summary.average.toFixed(1) : "0.0"}</span>
                  {summary && <RatingStars value={Math.round(summary.average)} readOnly size={18} />}
                  <span style={s.scoreTotal}>
                    {summary ? summary.total : 0} {t(summary?.total === 1 ? "ratings.review" : "ratings.reviews", "Reviews")}
                  </span>
                </div>

                {/* Star Breakdown Bars */}
                {summary && (
                  <div style={s.breakdown}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = summary.breakdown[star] ?? 0;
                      const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                      return (
                        <div key={star} style={s.barRow}>
                          <span style={s.barLabel}>{star}★</span>
                          <div style={s.barTrack}>
                            <div style={{ ...s.barFill, width: `${pct}%` }} />
                          </div>
                          <span style={s.barCount}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scrollable Reviews List */}
              <div style={s.listContainer}>
                <h3 style={s.listHeading}>{t("ratings.reviewsReceived", "Reviews Received")}</h3>
                <div style={s.scrollList}>
                  <ReviewList reviews={reviews} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1100,
    animation: "fadeIn 0.25s ease-out",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "750px",
    maxHeight: "90vh",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    animation: "slideUp 0.3s ease-out",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "var(--s-100, #f1f2f6)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--t-2, #2f3542)",
    fontWeight: "bold",
    transition: "background 0.2s, transform 0.2s",
    zIndex: 10,
    outline: "none",
  },
  header: {
    padding: "24px",
    borderBottom: "1px solid var(--s-100, #f1f2f6)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(135deg, var(--g-50, #f4f9f4), #ffffff)",
  },
  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "var(--g-600, #1a5c2d)",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    fontWeight: "bold",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(26, 92, 45, 0.2)",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  name: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--t-1, #1e272e)",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  roleBadge: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    padding: "3px 8px",
    borderRadius: "12px",
    backgroundColor: "var(--g-100, #e2f0e2)",
    color: "var(--g-800, #0f3d1b)",
  },
  location: {
    fontSize: "12px",
    color: "var(--t-3, #747d8c)",
  },
  body: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "14px",
    color: "var(--t-3, #747d8c)",
  },
  error: {
    textAlign: "center",
    padding: "40px",
    fontSize: "14px",
    color: "var(--r-600, #ea2027)",
    fontWeight: 500,
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "flex-start",
  },
  // Mobile responsive grid layout (defined inline styles)
  // Inside useEffect / media query logic or clean desktop grid layout:
  // (We'll format layout cleanly for both desktop and mobile via media styles below or inline standard CSS fallback)
  summaryCard: {
    backgroundColor: "var(--s-50, #f8f9fa)",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid var(--s-100, #f1f2f6)",
    flex: "1 1 240px",
  },
  scoreBig: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginBottom: "16px",
  },
  scoreNum: {
    fontSize: "44px",
    fontWeight: 800,
    color: "var(--t-1, #1e272e)",
    lineHeight: 1,
  },
  scoreTotal: {
    fontSize: "12px",
    color: "var(--t-3, #747d8c)",
    marginTop: "2px",
  },
  breakdown: {
    width: "100%",
    maxWidth: "240px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
  },
  barLabel: {
    width: "24px",
    color: "var(--t-2, #2f3542)",
    fontWeight: 600,
  },
  barTrack: {
    flex: 1,
    height: "6px",
    backgroundColor: "var(--s-200, #dfe4ea)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "var(--star, #f1c40f)",
    borderRadius: "3px",
  },
  barCount: {
    width: "20px",
    textAlign: "right",
    color: "var(--t-3, #747d8c)",
    fontWeight: 500,
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: "2 1 400px",
  },
  listHeading: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--t-2, #2f3542)",
    borderBottom: "2px solid var(--g-100, #e2f0e2)",
    paddingBottom: "8px",
  },
  scrollList: {
    maxHeight: "300px",
    overflowY: "auto",
    paddingRight: "8px",
  },
};
