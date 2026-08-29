import { useState, useEffect } from "react";
import "../../commonPages/csss/HomePage/Testimonials.css";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";

export default function Testimonials() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/backend/Apis/get_platform_reviews.php")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const formatted = data.reviews.map((r, index) => {
            let avatar = null;
            if (r.profile_image && typeof r.profile_image === "string" && r.profile_image.trim() !== "") {
              avatar = r.profile_image.startsWith("http") || r.profile_image.startsWith("/")
                ? r.profile_image
                : "/" + r.profile_image;
            }
            return {
              id: r.id || index + 10,
              name: r.name || "Verified Buyer",
              location: r.location || "Sri Lanka",
              rating: parseInt(r.rating, 10) || 5,
              review: r.comment,
              date: r.date,
              image: avatar,
            };
          });
          setItems(formatted);
        } else {
          setItems([]);
        }
      })
      .catch((err) => {
        console.warn("Unable to load marketplace feedback:", err);
        setItems([]);
      });
  }, []);

  return (
    <section className="testimonials">
      <div className="testimonials-container">

        <div className="testimonials-header">
          <h2>{t("homepage.testimonialsTitle")}</h2>
        </div>

        <div className="testimonials-grid">

          {items.length === 0 ? (
            <p className="testimonial-empty">
              {t("homepage.noMarketplaceFeedback", "No marketplace feedback is available yet.")}
            </p>
          ) : items.map((item) => (
            <article className="testimonial-card" key={item.id}>

              <div className="testimonial-stars">
                {[...Array(item.rating || 5)].map((_, i) => (
                  <FaStar key={i} color="#f1c40f" />
                ))}
              </div>

              <p className="testimonial-review">
                “{item.review}”
              </p>

              <div className="testimonial-divider"></div>

              <div className="testimonial-user">

                {item.image && <img src={item.image} alt={item.name} />}

                <div className="testimonial-user-text">
                  <h3>{item.name}</h3>
                  <span>{item.roleKey ? t(item.roleKey) : (item.location || t("profile.roleBuyer"))}</span>
                </div>

              </div>

            </article>
          ))}

        </div>
      </div>
    </section>
  );
}

