import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCalendarAlt, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";
import { readCultivationResponse } from "./cultivationApi.js";
import "../csss/CultivationAudit.css";

const imageUrl = (path) => path ? (path.startsWith("/") ? path : `/${path}`) : null;
const safeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export default function CultivationBrowse() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState("harvest");

  useEffect(() => {
    let active = true;
    fetch("/backend/Apis/buyer/cultivationAds/getCultivationAds.php")
      .then(readCultivationResponse)
      .then((result) => active && setAds(result.data.ads))
      .catch((caught) => active && setError(caught.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const districts = useMemo(() => [...new Set(ads.map((ad) => ad.district))].sort(), [ads]);
  const visibleAds = useMemo(() => ads
    .filter((ad) => district === "all" || ad.district === district)
    .filter((ad) => `${ad.crop_name} ${ad.farmer_name} ${ad.district}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sort === "price"
      ? Number(a.estimated_unit_price) - Number(b.estimated_unit_price)
      : String(a.expected_harvest_date ?? a.growing_period_days ?? "").localeCompare(String(b.expected_harvest_date ?? b.growing_period_days ?? ""))), [ads, district, search, sort]);

  if (loading) return <div className="cultivation-market-state">{t("buyer.cultivation.loading")}</div>;
  if (error) return <div className="cultivation-market-state error">{error}</div>;

  return <>
    <div className="cultivation-market-filters">
      <input aria-label={t("cultivationAudit.searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("cultivationAudit.searchPlaceholder")} />
      <select aria-label={t("cultivationAudit.districtFilter")} value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">{t("cultivationAudit.allDistricts")}</option>{districts.map((item) => <option key={item}>{item}</option>)}</select>
      <select aria-label={t("cultivationAudit.sortLabel")} value={sort} onChange={(event) => setSort(event.target.value)}><option value="harvest">{t("cultivationAudit.sortHarvest")}</option><option value="price">{t("cultivationAudit.sortPrice")}</option></select>
    </div>
    {!visibleAds.length ? <div className="cultivation-market-state">{t("buyer.cultivation.empty")}</div> : <div className="cultivation-market-grid">{visibleAds.map((ad) => {
      const capacity = Math.max(0, safeNumber(ad.capacity_quantity));
      const committed = Math.min(capacity, Math.max(0, safeNumber(ad.committed_quantity)));
      const remaining = Math.min(capacity, Math.max(0, safeNumber(ad.remaining_capacity)));
      const progress = Math.min(100, Math.max(0, capacity ? committed / capacity * 100 : 0));
      return <article className="cultivation-market-card" key={ad.cultivation_ad_id}>
        <div className="cultivation-market-image">{ad.preview_image ? <img src={imageUrl(ad.preview_image)} alt={ad.crop_name} /> : <span>🌱</span>}<b>{t("buyer.cultivation.futureOpportunity")}</b></div>
        <div className="cultivation-market-body">
          <section className="cultivation-card-details">
            <div className="cultivation-card-farmer">
              <FaUserCircle aria-hidden="true" />
              <div><strong>{ad.farmer_name}</strong>{Number(ad.verified_status) === 1 && <span>{t("buyerDashboard.verifiedFarmer")}</span>}</div>
            </div>
            <div className="cultivation-card-row"><FaMapMarkerAlt aria-hidden="true" /><span>{ad.district}</span></div>
            <div className="cultivation-card-row"><FaCalendarAlt aria-hidden="true" /><span>{t(ad.timing_model === "growing_period" ? "growingPeriod.label" : "buyer.cultivation.expectedHarvest")}: <strong>{ad.timing_model === "growing_period" ? `${ad.growing_period_days} ${t("growingPeriod.units.days")}` : ad.expected_harvest_date}</strong></span></div>
            {ad.timing_model === "growing_period" && <div className="cultivation-card-row"><span>{ad.cultivation_started_at ? `${t("growingPeriod.cultivationStarted")}: ${String(ad.cultivation_started_at).slice(0, 10)}` : t("growingPeriod.cultivationNotStarted")}{ad.estimated_harvest_date && ` · ${t("growingPeriod.estimatedHarvest")}: ${ad.estimated_harvest_date}`}</span></div>}
            <div className="cultivation-card-divider" />
            <div className="cultivation-card-capacity">
              <span>{t("buyer.cultivation.capacity")}<strong>{capacity} {ad.unit}</strong></span>
              <span>{t("buyer.cultivation.remaining")}<strong>{remaining} {ad.unit}</strong></span>
            </div>
            <div className="cultivation-market-progress"><div><i style={{ width: `${progress}%` }} /></div><small>{committed} / {capacity} {ad.unit} {t("buyer.cultivation.committed")}</small></div>
          </section>
          <div className="cultivation-card-divider" />
          <section className="cultivation-card-bottom">
            <div className="cultivation-card-price"><span>{t("buyer.cultivation.estimatedPrice")}</span><strong>Rs. {safeNumber(ad.estimated_unit_price).toFixed(2)} <small>/ {ad.unit}</small></strong></div>
            <button type="button" onClick={() => navigate(`/cultivation-opportunity/${ad.cultivation_ad_id}`)}>{t("buyer.cultivation.viewPreorder")}</button>
          </section>
        </div>
      </article>;
    })}</div>}
  </>;
}
