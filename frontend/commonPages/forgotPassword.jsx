import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main style={s.page}>
        <div className="card" style={s.card}>
          <div style={s.header}>
            <div style={s.logo}>🌿 LK Agro Market</div>
            <h1 style={s.title}>Reset Password</h1>
            <p style={s.sub}>Enter your email to receive recovery instructions</p>
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

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
              {loading ? "Sending instructions…" : "Send Reset Instructions"}
            </button>
          </form>

          <hr className="divider" />
          <p style={s.foot}>
            Remembered your password?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>Back to Sign In</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const s = {
  page: { flex: 1, background: "var(--page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px" },
  card: { width: "100%", maxWidth: 420 },
  header: { textAlign: "center", marginBottom: 24 },
  logo: { fontSize: 18, fontWeight: 700, color: "var(--g-800)", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { fontSize: 12, color: "var(--t-3)" },
  foot: { textAlign: "center", fontSize: 12, color: "var(--t-3)" },
};
