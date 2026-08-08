import { useNavigate } from "react-router-dom";
import "../../commonPages/csss/HomePage/CTA.css";

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta">

      <div className="cta-container">

        <h2>
          Ready to Source Fresh Produce
          <br />
          Directly from Farmers?
        </h2>

        <p>
          Join thousands of farmers and buyers building
          Sri Lanka's trusted agricultural marketplace.
        </p>

        <div className="cta-buttons">

          <button className="cta-primary" onClick={() => navigate("/browse")}>
            Browse Marketplace
          </button>

          <button className="cta-secondary" onClick={() => navigate("/register")}>
            Join With Us
          </button>

        </div>

      </div>

    </section>
  );
}