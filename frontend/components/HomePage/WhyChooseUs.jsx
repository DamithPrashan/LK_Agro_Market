import "../../commonPages/csss/HomePage/WhyChooseUs.css";
import { useTranslation } from "react-i18next";

import {
  FaUserCheck,
  FaBalanceScale,
  FaLeaf,
} from "react-icons/fa";

import farmerImage from "../../../src/assets/farmer1.png";

const featureIcons = [
  {
    icon: <FaUserCheck />,
    color: "green",
  },
  {
    icon: <FaBalanceScale />,
    color: "orange",
  },
  {
    icon: <FaLeaf />,
    color: "light",
  },
];

export default function WhyChooseUs() {
  const { t } = useTranslation();
  const features = featureIcons.map((feature, index) => ({ ...feature, title: t(`homepage.whyFeature${index + 1}Title`), description: t(`homepage.whyFeature${index + 1}Text`) }));
  return (
    <section className="why-choose-us">

      <div className="why-container">

        <div className="why-left">

          <div className="why-header">
            <h2>{t("homepage.whyTitle")}</h2>

            <p>
              {t("homepage.whySubtitle")}
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
            alt={t("homepage.farmerImageAlt")}
          />

        </div>

      </div>

    </section>
  );
}
