import { useTranslation } from "react-i18next";
import "../../csss/AdminDashboard/rating.css";

function RatingCard({title,rating}){
  const { t } = useTranslation();

  return(
    <div className="rating-card">
      <h3 className="rating-title">
        {title}
      </h3>

      <h1 className="rating-value">
        {rating}
      </h1>

      <div className="stars">
        ★★★★★
      </div>

      <p className="rating-text">
        {t("admin.dashboard.stats.averageUserRating")}
      </p>
    </div>
  )
}

export default RatingCard;