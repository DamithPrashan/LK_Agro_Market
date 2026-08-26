import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import bgImage from "../../src/assets/login-bg.jpg";
import "./csss/loginPage.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: "Please enter your email address.", ok: false });
      return;
    }
    setLoading(true);
    setMessage({ text: "", ok: false });
    try {
      const res = await fetch("/backend/Apis/forgot_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "✅ Password reset instructions sent to your email.", ok: true });
        setEmail("");
      } else {
        setMessage({ text: data.message || "Email not found.", ok: false });
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
          <div className="login-logo">🌿 LK Agro Market</div>
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Enter your email to receive recovery instructions</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="you@email.com"
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
            {loading ? "Sending instructions…" : "Send Reset Instructions"}
          </button>
        </form>

        <hr className="login-divider" />
        <p className="login-footer-text">
          Remembered your password?{" "}
          <Link to="/login" className="login-footer-link">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

