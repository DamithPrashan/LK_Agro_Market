import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
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
        setError(data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.log(error);
      setError("Network error. Make sure XAMPP is running.");
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
            <h1 style={s.title}>Welcome back</h1>
            <p style={s.sub}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email" type="email" value={email} autoComplete="email"
                placeholder="you@email.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div style={s.pwWrap}>
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
                  style={s.eyeBtn}
                  onClick={() => setShowPw((p) => !p)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: 4 }}>
                <Link to="/forgot-password" style={{ fontSize: 11 }}>Forgot password?</Link>
              </div>
            </div>

            {error && <div className="info-red" style={{ marginBottom: 14 }}>{error}</div>}

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <hr className="divider" />
          <p style={s.foot}>
            New to LK Agro Market?{" "}
            <Link to="/register" style={{ fontWeight: 600 }}>Create a free account</Link>
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
  pwWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, color: "var(--t-3)" },
  foot: { textAlign: "center", fontSize: 12, color: "var(--t-3)" },
};