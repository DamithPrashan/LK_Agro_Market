import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import { useForm } from "../../src/hooks/useForm";
import FarmerVerificationForm from "../components/farmerVerificationForm";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala",
  "Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya",
  "Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya",
];

function validate(v) {
  const e = {};
  if (!v.name.trim())                         e.name     = "Full name is required.";
  if (!v.contact.trim())                      e.contact  = "Contact number is required.";
  if (!/\S+@\S+\.\S+/.test(v.email))         e.email    = "Enter a valid email address.";
  if (!v.district)                            e.district = "Please select your district.";
  if (v.password.length < 8)                  e.password = "Password must be at least 8 characters.";
  if (v.password !== v.confirm)               e.confirm  = "Passwords do not match.";
  return e;
}

export default function RegistrationPage() {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const [role, setRole]         = useState("farmer");
  const [apiErr, setApiErr]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [nicFile, setNicFile]         = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);

  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { name:"", contact:"", email:"", district:"", language:"sinhala", password:"", confirm:"", nic:"", farm_location:"" },
    validate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    setApiErr("");

    const body = new FormData();
    Object.entries(values).forEach(([k, v]) => body.append(k, v));
    body.append("role", role);
    if (nicFile)      body.append("nic_image", nicFile);
    if (evidenceFile) body.append("evidence",  evidenceFile);

    try {
      const res  = await fetch("/backend/Apis/register.php",
        { method: "POST", body, credentials: "include" });
      const data = await res.json();
      if (data.success) {
        login(data.user);
        navigate(role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard");
      } else {
        setApiErr(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setApiErr("Network error. Make sure XAMPP is running.");
    } finally {
      setLoading(false);
    }
  };

  // Reusable field renderer
  const Field = ({ label, name, type = "text", placeholder, hint }) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        value={values[name]} onChange={handleChange} onBlur={handleBlur}
        className={touched[name] && errors[name] ? "error" : ""}
      />
      {touched[name] && errors[name] && <p className="err-msg">{errors[name]}</p>}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      <main style={s.page}>
        <div className="card" style={s.card}>
          <div style={s.header}>
            <div style={s.logo}>🌿 LK Agro Market</div>
            <h1 style={s.title}>Create your account</h1>
            <p style={s.sub}>Join Sri Lanka's direct farm-to-buyer platform</p>
          </div>

          {/* Role selector */}
          <div style={s.roleGrid}>
            {["farmer", "buyer"].map((r) => (
              <button
                key={r} type="button"
                onClick={() => setRole(r)}
                style={{ ...s.roleBtn, ...(role === r ? s.roleActive : {}) }}
              >
                <span style={{ fontSize: 28 }}>{r === "farmer" ? "🌾" : "🛒"}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r === "farmer" ? "Farmer" : "Buyer"}</span>
                <span style={{ fontSize: 11, color: "var(--t-3)" }}>
                  {r === "farmer" ? "List and sell crops" : "Browse and order crops"}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <p className="section-label">Personal information</p>
            <div className="grid-2">
              <Field label="Full Name"       name="name"    placeholder="R.M.S.T. Randeniya" />
              <Field label="Contact Number"  name="contact" placeholder="+94 71 234 5678" />
            </div>
            <Field label="Email Address" name="email" type="email" placeholder="you@email.com" />
            <div className="grid-2">
              <div className="field">
                <label htmlFor="district">District</label>
                <select
                  id="district" name="district" value={values.district}
                  onChange={handleChange} onBlur={handleBlur}
                  className={touched.district && errors.district ? "error" : ""}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
                {touched.district && errors.district && <p className="err-msg">{errors.district}</p>}
              </div>
              <div className="field">
                <label htmlFor="language">Preferred Language</label>
                <select id="language" name="language" value={values.language} onChange={handleChange}>
                  <option value="sinhala">සිංහල (Sinhala)</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <Field label="Password"         name="password" type="password" hint="Min 8 characters" />
              <Field label="Confirm Password" name="confirm"  type="password" />
            </div>

            {/* Farmer verification — rendered from its own component */}
            {role === "farmer" && (
              <FarmerVerificationForm
                nic={values.nic}
                farm_location={values.farm_location}
                onChange={handleChange}
                onBlur={handleBlur}
                onNicFile={setNicFile}
                onEvidenceFile={setEvidenceFile}
                nicFile={nicFile}
                evidenceFile={evidenceFile}
              />
            )}

            {apiErr && <div className="info-red">{apiErr}</div>}

            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={s.foot}>
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 600 }}>Sign in here</Link>
          </p>
        </div>
      </main>
      
    </div>
  );
}

const s = {
  page:      { flex: 1, background: "var(--page)", display: "flex", justifyContent: "center", padding: "28px 16px" },
  card:      { width: "100%", maxWidth: 540, alignSelf: "flex-start" },
  header:    { textAlign: "center", marginBottom: 22 },
  logo:      { fontSize: 18, fontWeight: 700, color: "var(--g-800)", marginBottom: 8 },
  title:     { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub:       { fontSize: 12, color: "var(--t-3)" },
  roleGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  roleBtn:   { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 10px", borderRadius: "var(--r-lg)", border: "2px solid var(--s-200)", background: "var(--white)", cursor: "pointer", transition: "all .15s" },
  roleActive:{ borderColor: "var(--g-600)", background: "var(--g-50)" },
  foot:      { textAlign: "center", fontSize: 12, color: "var(--t-3)", marginTop: 16 },
};