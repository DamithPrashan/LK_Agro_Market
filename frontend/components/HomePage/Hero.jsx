import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      label: "Verified Farmers",
      type: "green",
    },

    {
      icon: <FaBoxOpen />,
      value: `${homeStats.activeListings}+`,
      label: "Active Crop Listings",
      type: "gold",
    },

    {
      icon: <FaMapMarkedAlt />,
      value: homeStats.districtsCovered,
      label: "Districts Covered",
      type: "green",
    },

    {
      icon: <FaThumbsUp />,
      value: `${homeStats.buyerSatisfaction}%`,
      label: "Buyer Satisfaction",
      type: "gold",
    },
  ];

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="hero-overlay"></div>

      <div className="hero-container">
        <div className="hero-content">
          <h1>Connecting Sri Lankan Farmers Directly with Buyers</h1>

          <p>
            Experience a secure, transparent agricultural marketplace. Pre-order
            fresh crops, access real-time demand forecasting, and ensure fair
            pricing for everyone.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-btn-primary"
              onClick={() => navigate("/browse")}
            >
              Browse Marketplace
              <FaArrowRight />
            </button>

            <button
              className="hero-btn-secondary"
              onClick={() => navigate("/register")}
            >
              Join With Us
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
