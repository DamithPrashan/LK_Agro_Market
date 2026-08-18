import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { readCultivationResponse } from "./cultivationApi.js";
import "../csss/CultivationAudit.css";

const imageUrl = (path) => path ? (path.startsWith("/") ? path : `/${path}`) : null;

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
      : String(a.expected_harvest_date).localeCompare(String(b.expected_harvest_date))), [ads, district, search, sort]);

  if (loading) return <div className="cultivation-market-state">{t("buyer.cultivation.loading")}</div>;
  if (error) return <div className="cultivation-market-state error">{error}</div>;

  return <>
    <div className="cultivation-market-filters">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("cultivationAudit.searchPlaceholder")} />
      <select value={district} onChange={(event) => setDistrict(event.target.value)}><option value="all">{t("cultivationAudit.allDistricts")}</option>{districts.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="harvest">{t("cultivationAudit.sortHarvest")}</option><option value="price">{t("cultivationAudit.sortPrice")}</option></select>
    </div>
    {!visibleAds.length ? <div className="cultivation-market-state">{t("buyer.cultivation.empty")}</div> : <div className="cultivation-market-grid">{visibleAds.map((ad) => {
      const capacity = Number(ad.capacity_quantity);
      const committed = Number(ad.committed_quantity);
      const remaining = Math.max(0, Number(ad.remaining_capacity));
      const progress = Math.min(100, Math.max(0, capacity ? committed / capacity * 100 : 0));
      return <article className="cultivation-market-card" key={ad.cultivation_ad_id}>
        <div className="cultivation-market-image">{ad.preview_image ? <img src={imageUrl(ad.preview_image)} alt={ad.crop_name} /> : <span>🌱</span>}<b>{t("buyer.cultivation.futureOpportunity")}</b></div>
        <div className="cultivation-market-body"><h2>{ad.crop_name}</h2><p className="cultivation-farmer">{Number(ad.verified_status) === 1 && <span>✓</span>} {ad.farmer_name} · {ad.district}</p>
          <div className="cultivation-market-facts"><span>{t("buyer.cultivation.capacity")}<strong>{capacity} {ad.unit}</strong></span><span>{t("buyer.cultivation.remaining")}<strong>{remaining} {ad.unit}</strong></span><span>{t("buyer.cultivation.estimatedPrice")}<strong>Rs. {Number(ad.estimated_unit_price).toFixed(2)} / {ad.unit}</strong></span><span>{t("buyer.cultivation.expectedHarvest")}<strong>{ad.expected_harvest_date}</strong></span></div>
          <div className="cultivation-market-progress"><div><i style={{ width: `${progress}%` }} /></div><small>{committed} / {capacity} {ad.unit} {t("buyer.cultivation.committed")}</small></div>
          <button onClick={() => navigate(`/cultivation-opportunity/${ad.cultivation_ad_id}`)}>{t("buyer.cultivation.viewPreorder")}</button>
        </div>
      </article>;
    })}</div>}
  </>;
}
