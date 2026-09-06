import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import bgImage from "../../src/assets/login-bg.jpg";
import "./csss/loginPage.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: t("forgotPassword.enterEmailReq"), ok: false });
      return;
    }
    setLoading(true);
    setMessage({ text: "", ok: false });
    try {
      const res = await fetch("/backend/Apis/auth/forgot_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: t("forgotPassword.instructionsSent"), ok: true });
        setEmail("");
      } else {
        setMessage({ text: data.message ? t(`forgotPassword.${data.message}`, data.message) : t("forgotPassword.emailNotFound"), ok: false });
      }
    } catch {
      setMessage({ text: t("errors.networkXamppError"), ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-page-overlay" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">{t("login.logoTitle")}</div>
          <h1 className="login-title">{t("forgotPassword.title")}</h1>
          <p className="login-subtitle">{t("forgotPassword.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">{t("forgotPassword.emailLabel")}</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder={t("forgotPassword.emailPlaceholder")}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {message.text && (
            <div className={message.ok ? "info-green" : "info-red"} style={{ marginBottom: 14 }}>
              {message.text}
            </div>
          )}

          <button className="login-submit-btn" type="submit" disabled={loading}>
            {loading ? t("forgotPassword.btnSending") : t("forgotPassword.btnSend")}
          </button>
        </form>

        <hr className="login-divider" />
        <p className="login-footer-text">
          {t("forgotPassword.remembered")}{" "}
          <Link to="/login" className="login-footer-link">{t("forgotPassword.backToSignIn")}</Link>
        </p>
      </div>
    </div>
  );
}

