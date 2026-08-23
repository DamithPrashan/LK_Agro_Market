import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../../commonPages/csss/HomePage/Hero.css";
import heroBg from "../../../src/assets/hero-bg.png";

import {
  FaShieldAlt,
  FaBoxOpen,
  FaMapMarkedAlt,
  FaThumbsUp,
  FaArrowRight,
} from "react-icons/fa";

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [homeStats, setHomeStats] = useState({
    verifiedFarmers: 0,
    activeListings: 0,
    districtsCovered: 0,
    buyerSatisfaction: 98,
  });

  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/Apis/get_home_stats.php",
        );

        const result = await response.json();

        if (result.success) {
          setHomeStats(result.data);
        }
      } catch (error) {
        console.error("Failed to load homepage statistics:", error);
      }
    };

    fetchHomeStats();
  }, []);

  const stats = [
    {
      icon: <FaShieldAlt />,
      value: `${homeStats.verifiedFarmers}+`,
      label: t("homepage.heroVerified"),
      type: "green",
    },

    {
      icon: <FaBoxOpen />,
      value: `${homeStats.activeListings}+`,
      label: t("homepage.heroListings"),
      type: "gold",
    },

    {
      icon: <FaMapMarkedAlt />,
      value: homeStats.districtsCovered,
      label: t("homepage.heroDistricts"),
      type: "green",
    },

    {
      icon: <FaThumbsUp />,
      value: `${homeStats.buyerSatisfaction}%`,
      label: t("homepage.heroSatisfaction"),
      type: "gold",
    },
  ];

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="hero-overlay"></div>

      <div className="hero-container">
        <div className="hero-content">
          <h1>{t("homepage.heroTitle")}</h1>

          <p>
            {t("homepage.heroSubtitle")}
          </p>

          <div className="hero-buttons">
            <button
              className="hero-btn-primary"
              onClick={() => navigate("/browse")}
            >
              {t("homepage.browseMarketplace")}
              <FaArrowRight />
            </button>

            <button
              className="hero-btn-secondary"
              onClick={() => navigate("/register")}
            >
              {t("homepage.joinUs")}
            </button>

          </div>
        </div>

        <div className="hero-stats-area">
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div className={`hero-card hero-card-${index + 1}`} key={index}>
                <div className={`hero-card-icon hero-card-icon-${stat.type}`}>
                  {stat.icon}
                </div>

                <h3>{stat.value}</h3>

                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
