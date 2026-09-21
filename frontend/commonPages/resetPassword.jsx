import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import bgImage from "../../src/assets/login-bg.jpg";
import logo from "../../src/assets/logo.png";
import "./csss/loginPage.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });
  const [resetCompleted, setResetCompleted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      setMessage({ text: "Invalid or missing reset token. Please request a new link.", ok: false });
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage({ text: "Please fill in all password fields.", ok: false });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long.", ok: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", ok: false });
      return;
    }

    setLoading(true);
    setMessage({ text: "", ok: false });

    try {
      const res = await fetch("/backend/Apis/auth/reset_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          new_password: newPassword,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ text: "✅ " + data.message, ok: true });
        setResetCompleted(true);
      } else {
        setMessage({ text: data.message || "Failed to reset password.", ok: false });
      }
    } catch {
      setMessage({ text: "Network error. Make sure XAMPP is running.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-page-overlay" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src={logo} alt="LK Agro Market" className="login-logo-img" />
            <span>LK Agro Market</span>
          </div>
          <h1 className="login-title">Set New Password</h1>
          <p className="login-subtitle">
            Enter a new password for <strong>{email || "your account"}</strong>
          </p>
        </div>

        {(!email || !token) ? (
          <div>
            <div className="info-red" style={{ marginBottom: 14 }}>
              ⚠️ Invalid password reset link. Please check your email or request a new reset link.
            </div>
            <Link to="/forgot-password" className="login-submit-btn" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
              Request New Link
            </Link>
          </div>
        ) : resetCompleted ? (
          <div>
            <div className="info-green" style={{ marginBottom: 20 }}>
              {message.text}
            </div>
            <button
              className="login-submit-btn"
              type="button"
              onClick={() => navigate("/login")}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                placeholder="At least 6 characters"
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                placeholder="Re-enter new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {message.text && (
              <div className={message.ok ? "info-green" : "info-red"} style={{ marginBottom: 14 }}>
                {message.text}
              </div>
            )}

            <button className="login-submit-btn" type="submit" disabled={loading}>
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}

        <hr className="login-divider" />
        <p className="login-footer-text">
          Remembered your password?{" "}
          <Link to="/login" className="login-footer-link">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
