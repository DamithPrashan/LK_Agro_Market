import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaFire, FaMapMarkerAlt } from "react-icons/fa";

import "../../commonPages/csss/HomePage/FeaturedCrops.css";

const uploadedImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  if (path.startsWith("backend/")) return `/${path}`;
  return `/backend/${path}`;
};

function TrendingImage({ crop }) {
  const [src, setSrc] = useState(uploadedImageUrl(crop.preview_image));
  if (!src) return <div className="featured-neutral-image" aria-label={crop.crop_name}>🌱</div>;
  return <img src={src} alt={crop.crop_name} onError={() => setSrc(null)} />;
}

export default function FeaturedCrops() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrendingCrops = async () => {
      try {
        const response = await fetch("/backend/Apis/get_weekly_trending_crops.php");
        const result = await response.json();
        if (result.success) setCrops((result.data || []).slice(0, 10));
      } catch (error) {
        console.error("Failed to load trending crops:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTrendingCrops();
  }, []);

  return (
    <section className="featured-crops home-anchor">
      <div className="featured-container">
        <div className="featured-header">
          <div><h2>{t("homepage.trendingTitle")}</h2><p>{t("homepage.trendingSubtitle")}</p></div>
          <button className="featured-browse-more" onClick={() => navigate("/browse")}>{t("homepage.browseMore")} →</button>
        </div>

        {loading ? <p>{t("homepage.loading")}</p> : crops.length === 0 ? <p>{t("homepage.noOpportunities")}</p> : (
          <div className="featured-grid home-card-scroller">
            {crops.map((crop) => (
              <article
                className={`featured-card ${crop.crop_id ? "featured-card-clickable" : ""}`}
                key={`${crop.crop_name}-${crop.district}`}
                role={crop.crop_id ? "link" : undefined}
                tabIndex={crop.crop_id ? 0 : undefined}
                onClick={() => crop.crop_id && navigate(`/crop/${crop.crop_id}`)}
                onKeyDown={(event) => {
                  if (crop.crop_id && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    navigate(`/crop/${crop.crop_id}`);
                  }
                }}
              >
                <div className="featured-image-wrap">
                  <TrendingImage crop={crop} />
                  <div className="featured-verified"><FaFire /><span>{t("homepage.trendingBadge")}</span></div>
                </div>
                <div className="featured-card-body">
                  <h3>{crop.crop_name}</h3>
                  <div className="featured-meta"><div className="featured-location"><FaMapMarkerAlt /><span>{crop.district}</span></div></div>
                  <div className="featured-divider" />
                  <div className="featured-price">
                    {Number(crop.average_price) > 0 ? <><span className="featured-price-main">Rs. {Number(crop.average_price).toLocaleString()}</span><span className="featured-price-unit">/kg</span></> : <span className="featured-price-unavailable">{t("homepage.priceUnavailable")}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
