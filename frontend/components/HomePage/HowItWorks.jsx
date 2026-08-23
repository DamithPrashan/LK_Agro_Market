import "../../commonPages/csss/HomePage/HowItWorks.css";
import { useTranslation } from "react-i18next";

import {
  FaClipboardList,
  FaShoppingCart,
  FaCreditCard,
  FaTruck,
} from "react-icons/fa";

const stepIcons = [
  {
    id: 1,
    icon: <FaClipboardList />,
  },
  {
    id: 2,
    icon: <FaShoppingCart />,
  },
  {
    id: 3,
    icon: <FaCreditCard />,
  },
  {
    id: 4,
    icon: <FaTruck />,
  },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  const steps = stepIcons.map((step, index) => ({ ...step, title: t(`homepage.howStep${index + 1}Title`), description: t(`homepage.howStep${index + 1}Text`) }));
  return (
    <section className="how-it-works">
      <div className="how-container">

        <div className="how-header">
          <h2>{t("homepage.howTitle")}</h2>

          <p>
            {t("homepage.howSubtitle")}
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
