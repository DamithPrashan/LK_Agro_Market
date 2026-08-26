import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import bgImage from "../../src/assets/login-bg.jpg";
import "./csss/loginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError(t("errors.enterEmailPassword")); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/backend/Apis/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        login(data.user);
        if (data.user.role === "farmer") navigate("/farmer");
        else if (data.user.role === "buyer") navigate("/buyer");
        else if (data.user.role === "admin") navigate("/admin");
      } else {
        setError(data.message || t("errors.invalidEmailPassword"));
      }
    } catch (error) {
      console.log(error);
      setError(t("errors.networkXamppError"));
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
          <h1 className="login-title">{t("login.header")}</h1>
          <p className="login-subtitle">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">{t("forms.emailAddress")}</label>
            <input
              id="email" type="email" value={email} autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">{t("forms.password")}</label>
            <div className="login-pw-wrap">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPw((p) => !p)}
                aria-label={showPw ? t("login.hidePassword") : t("login.showPassword")}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Link to="/forgot-password" className="login-forgot-link">{t("login.forgotPassword")}</Link>
            </div>
          </div>

          {error && <div className="info-red" style={{ marginBottom: 14 }}>{error}</div>}

          <button className="login-submit-btn" type="submit" disabled={loading}>
            {loading ? t("login.btnSigningIn") : t("login.btnSignIn")}
          </button>
        </form>

        <hr className="login-divider" />
        <p className="login-footer-text">
          {t("login.footText")}{" "}
          <Link to="/register" className="login-footer-link">{t("login.footLink")}</Link>
        </p>
      </div>
    </div>
  );
}

