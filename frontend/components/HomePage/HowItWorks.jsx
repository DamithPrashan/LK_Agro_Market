import "../../commonPages/csss/HomePage/HowItWorks.css";

import {
  FaClipboardList,
  FaShoppingCart,
  FaCreditCard,
  FaTruck,
} from "react-icons/fa";

const steps = [
  {
    id: 1,
    icon: <FaClipboardList />,
    title: "Farmer Lists Crops",
    description:
      "Farmers upload their upcoming harvest details.",
  },
  {
    id: 2,
    icon: <FaShoppingCart />,
    title: "Buyer Places Pre-Order",
    description:
      "Secure your supply in advance with transparent pricing.",
  },
  {
    id: 3,
    icon: <FaCreditCard />,
    title: "Secure Online Payment",
    description:
      "Transactions are protected through a secure payment process.",
  },
  {
    id: 4,
    icon: <FaTruck />,
    title: "Collection and Delivery",
    description:
      "Coordinated collection and delivery from farmer to buyer.",
  },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-container">

        <div className="how-header">
          <h2>How It Works</h2>

          <p>
            A simple, transparent process connecting farmers directly
            with buyers.
          </p>
        </div>

        <div className="how-steps">

          <div
            className="how-connector-line"
            aria-hidden="true"
          ></div>

          {steps.map((step) => (
            <article className="how-card" key={step.id}>

              <div className="how-icon">
                {step.icon}
              </div>

              <h3>{step.title}</h3>

              <p>{step.description}</p>

            </article>
          ))}

        </div>
      </div>
    </section>
  );
}