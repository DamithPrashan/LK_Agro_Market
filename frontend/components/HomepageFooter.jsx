import { useTranslation } from "react-i18next";
import { FaEnvelope, FaPhoneAlt, FaSeedling } from "react-icons/fa";
import potato from "../../src/assets/potato.png";
import tomato from "../../src/assets/tomato.png";
import cabbage from "../../src/assets/cabbage.png";
import carrot from "../../src/assets/carrot.png";
import "./HomepageFooter.css";

export default function HomepageFooter() {
  const { t } = useTranslation(); const year = new Date().getFullYear();
  const link = (id, label) => <li><a href={`/#${id}`}>› {label}</a></li>;
  return <footer className="home-footer-wrap"><div className="home-footer-panel"><div className="home-footer-grid">
    <section className="home-footer-brand"><h2><FaSeedling /> <span>LK Agro<br />Market</span></h2><p>{t("homepage.footerTagline")}</p></section>
    <section><h3>{t("homepage.links")}</h3><ul>{link("home",t("navbar.home"))}{link("preorder",t("homepage.preorderNav"))}{link("market",t("homepage.marketNav"))}{link("about",t("homepage.aboutNav"))}</ul></section>
    <section><h3>{t("homepage.contact")}</h3><a className="home-contact" href="mailto:support@lkagromarket.lk"><FaEnvelope /> support@lkagromarket.lk</a><a className="home-contact" href="tel:+94778569475"><FaPhoneAlt /> 0778569475</a></section>
    <section><h3>{t("homepage.gallery")}</h3><div className="home-footer-gallery">{[potato,tomato,cabbage,carrot].map((src) => <img key={src} src={src} alt="" />)}</div></section>
  </div><div className="home-footer-bottom">© {year} LK Agro Market. {t("footer.copyright")}</div></div></footer>;
}
