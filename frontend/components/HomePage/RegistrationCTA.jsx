import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaSeedling, FaShoppingBasket } from "react-icons/fa";
import { useAuth } from "../../../src/context/AuthContext";
import "../../commonPages/csss/HomePage/RegistrationCTA.css";

export default function RegistrationCTA() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  if (user) return null;

  const options = [
    { role: "farmer", icon: <FaSeedling />, title: "farmerCtaTitle", description: "farmerCtaDescription", action: "registerFarmer" },
    { role: "buyer", icon: <FaShoppingBasket />, title: "buyerCtaTitle", description: "buyerCtaDescription", action: "registerBuyer" },
  ];

  return (
    <section className="registration-cta" aria-labelledby="registration-cta-title">
      <div className="registration-cta-container">
        <header className="registration-cta-header">
          <h2 id="registration-cta-title">{t("homepage.registrationTitle")}</h2>
          <p>{t("homepage.registrationSubtitle")}</p>
        </header>
        <div className="registration-options">
          {options.map((option) => (
            <article className={`registration-option registration-option-${option.role}`} key={option.role}>
              <div className="registration-option-icon" aria-hidden="true">{option.icon}</div>
              <h3>{t(`homepage.${option.title}`)}</h3>
              <p>{t(`homepage.${option.description}`)}</p>
              <button type="button" onClick={() => navigate(`/register?role=${option.role}`)}>{t(`homepage.${option.action}`)}</button>
            </article>
          ))}
        </div>
        <p className="registration-sign-in">
          {t("homepage.alreadyRegistered")} {" "}
          <button type="button" onClick={() => navigate("/login")}>{t("homepage.signIn")}</button>
        </p>
      </div>
    </section>
  );
}
