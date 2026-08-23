import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCheckCircle, FaMapMarkerAlt, FaSeedling } from "react-icons/fa";
import "../../commonPages/csss/HomePage/FutureCultivation.css";

const imageUrl = (path) => path && (path.startsWith("http") || path.startsWith("/") ? path : `/${path}`);
const periodLabel = (days, t) => {
  const value = Number(days);
  if (!value) return t("homepage.notAvailable");
  if (value % 30 === 0) return t("homepage.periodMonths", { count: value / 30 });
  if (value % 7 === 0) return t("homepage.periodWeeks", { count: value / 7 });
  return t("homepage.periodDays", { count: value });
};

export default function FutureCultivation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/backend/Apis/buyer/cultivationAds/getCultivationAds.php?limit=10")
      .then((response) => response.json())
      .then((result) => result.success && setAds((result.data?.ads || []).slice(0, 10)))
      .catch((error) => console.error("Failed to load cultivation opportunities:", error))
      .finally(() => setLoading(false));
  }, []);

  return <section className="future-cultivation home-anchor" id="preorder"><div className="future-container">
    <header className="future-header"><h2>{t("homepage.futureTitle")}</h2><p>{t("homepage.futureSubtitle")}</p></header>
    {loading ? <p className="future-status">{t("homepage.loading")}</p> : ads.length === 0 ? <p className="future-status">{t("homepage.noOpportunities")}</p> :
      <div className="home-card-scroller" aria-label={t("homepage.futureTitle")}>{ads.map((ad) => {
        const capacity = Number(ad.capacity_quantity) || 0;
        const committed = Number(ad.committed_quantity) || 0;
        const remaining = Math.max(Number(ad.remaining_capacity) || 0, 0);
        const progress = capacity > 0 ? Math.min((committed / capacity) * 100, 100) : 0;
        return <article className="future-card" key={ad.cultivation_ad_id}>
          <div className="future-image"><img src={imageUrl(ad.preview_image)} alt={ad.crop_name} /><span><FaSeedling /> {t("homepage.opportunityBadge")}</span></div>
          <div className="future-body"><h3>{ad.crop_name}</h3>
            <div className="future-farmer"><span className="future-avatar">{ad.farmer_name?.charAt(0) || "F"}</span><div><strong>{ad.farmer_name}</strong>{Number(ad.verified_status) === 1 && <small><FaCheckCircle /> {t("homepage.verifiedFarmer")}</small>}</div></div>
            <p className="future-meta"><FaMapMarkerAlt /> {ad.district}</p>
            <p className="future-meta"><span className="future-meta-icon">▣</span>{ad.timing_model === "growing_period" ? t("homepage.growingPeriod", { period: periodLabel(ad.growing_period_days, t) }) : t("homepage.expectedHarvest", { date: ad.expected_harvest_date })}</p>
            <div className="future-divider" /><div className="future-capacity"><span>{t("homepage.capacity")}<strong>{capacity.toLocaleString()} {ad.unit}</strong></span><span>{t("homepage.remaining")}<strong>{remaining.toLocaleString()} {ad.unit}</strong></span></div>
            <div className="future-progress"><span style={{ width: `${progress}%` }} /></div><small className="future-committed">{t("homepage.committed", { committed: committed.toLocaleString(), capacity: capacity.toLocaleString(), unit: ad.unit })}</small>
            <div className="future-divider" /><div className="future-footer"><span>{t("homepage.estimatedPrice")}<strong>Rs. {Number(ad.estimated_unit_price).toLocaleString()} / {ad.unit}</strong></span><button onClick={() => navigate(`/cultivation-opportunity/${ad.cultivation_ad_id}`)}>{t("homepage.viewPreorder")}</button></div>
          </div></article>;
      })}</div>}
  </div></section>;
}
