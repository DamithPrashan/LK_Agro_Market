import { useTranslation } from "react-i18next";

import {
  FaStar,
  FaStarHalfAlt,
} from "react-icons/fa";

export default function RatingCard({
  title,
  rating,
  reviews,
  distribution,
  type = "farmer",
}) {
  const { t } = useTranslation();

  return (
    <article className="admin-panel admin-rating-card">
      <div className="admin-rating-main">
        <h3>{title}</h3>

        <strong>
          {Number(rating).toFixed(1)}
        </strong>

        <div className="admin-rating-stars">
          <FaStar />
          <FaStar />
          <FaStar />
          <FaStar />
          <FaStarHalfAlt />
        </div>

        <p>
          {t(
            "admin.dashboard.stats.averageUserRating"
          )}
        </p>

        <span>
          {t("admin.dashboard.reviewCount", { count: reviews })}
        </span>
      </div>

      <div className="admin-rating-bars">
        {[5, 4, 3, 2, 1].map(
          (star, index) => (
            <div
              className="admin-rating-row"
              key={star}
            >
              <span>{star}</span>

              <FaStar />

              <div className="admin-rating-track">
                <div
                  className={`admin-rating-fill ${type}`}
                  style={{
                    width: `${
                      distribution[index] || 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )
        )}
      </div>
    </article>
  );
}
