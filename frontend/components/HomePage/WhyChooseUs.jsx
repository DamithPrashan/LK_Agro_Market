import "../../commonPages/csss/HomePage/WhyChooseUs.css";

import {
  FaUserCheck,
  FaBalanceScale,
  FaLeaf,
} from "react-icons/fa";

import farmerImage from "../../../src/assets/farmer1.png";

const features = [
  {
    icon: <FaUserCheck />,
    title: "Verified Farmers",
    description:
      "Every farmer is verified to ensure trusted sellers and quality produce.",
    color: "green",
  },
  {
    icon: <FaBalanceScale />,
    title: "Fair Pricing",
    description:
      "Transparent pricing benefits both farmers and buyers without unnecessary middlemen.",
    color: "orange",
  },
  {
    icon: <FaLeaf />,
    title: "Sustainable Agriculture",
    description:
      "Supporting local farmers while promoting environmentally responsible farming practices.",
    color: "light",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="why-choose-us">

      <div className="why-container">

        <div className="why-left">

          <div className="why-header">
            <h2>Why Choose Us</h2>

            <p>
              Building trust between farmers and buyers through
              transparency, technology and fair trade.
            </p>
          </div>

          <div className="why-list">

            {features.map((item, index) => (

              <article className="why-card" key={index}>

                <div className={`why-icon ${item.color}`}>
                  {item.icon}
                </div>

                <div className="why-text">
                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </div>

              </article>

            ))}

          </div>

        </div>

        <div className="why-right">

          <img
            src={farmerImage}
            alt="Farmer"
          />

        </div>

      </div>

    </section>
  );
}