import "../../commonPages/csss/HomePage/Testimonials.css";

import { FaStar } from "react-icons/fa";

import farmer1 from "../../../src/assets/farmer1.png";
import buyer1 from "../../../src/assets/buyer1.png";

const testimonials = [
  {
    id: 1,
    name: "Kamal Perera",
    role: "Verified Farmer",
    image: farmer1,
    review:
      "LK Agro Market has changed my life. I get fair prices and secure payments.",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Commercial Buyer",
    image: buyer1,
    review:
      "The quality and reliability are unmatched. My restaurant chain finally has a stable supply.",
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials-container">

        <div className="testimonials-header">
          <h2>What Our Users Say</h2>
        </div>

        <div className="testimonials-grid">

          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.id}>

              <div className="testimonial-stars">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>

              <p className="testimonial-review">
                “{item.review}”
              </p>

              <div className="testimonial-divider"></div>

              <div className="testimonial-user">

                <img
                  src={item.image}
                  alt={item.name}
                />

                <div className="testimonial-user-text">
                  <h3>{item.name}</h3>
                  <span>{item.role}</span>
                </div>

              </div>

            </article>
          ))}

        </div>
      </div>
    </section>
  );
}