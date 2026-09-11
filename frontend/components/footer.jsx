import React from "react";
import { useTranslation } from "react-i18next";
import "./footer.css";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>LK Agro Market</h3>
          <p>{t("footer.tagline")}</p>
        </div>

        <div className="footer-section">
          <h3>{t("footer.quickLinks")}</h3>
          <ul>
            <li><a href="/">{t("navbar.home")}</a></li>
            <li><a href="/browse">{t("sidebar.browseCrops")}</a></li>
            <li><a href="/preorder">{t("sidebar.preOrder")}</a></li>
            <li><a href="/payment">{t("footer.payments")}</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t("footer.support")}</h3>
          <ul>
            <li><a href="/complaints">{t("sidebar.complaints")}</a></li>
            <li><a href="/ratings">{t("navbar.ratings")}</a></li>
            <li><a href="/admin">{t("navbar.admin")}</a></li>
            <li><a href="/register">{t("navbar.register")}</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>{t("footer.contactUs")}</h3>
          <p>{t("footer.emailLabel")} info@lkagromarket.com</p>
          <p>{t("footer.phoneLabel")} +94 77 123 4567</p>
          <p>{t("footer.location")}</p>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {currentYear} LK Agro Market. {t("footer.copyright")}
      </div>
    </footer>
  );
};

export default Footer;
