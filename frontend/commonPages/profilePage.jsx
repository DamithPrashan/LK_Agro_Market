import { useState } from "react";
import { useAuth } from "../../src/context/AuthContext";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Matara",
  "Nuwara Eliya","Polonnaruwa","Ratnapura","Trincomalee",
];

export default function Profile() {
  const { user, login }       = useAuth();
  const [name, setName]       = useState(user?.name     ?? "");
  const [contact, setContact] = useState(user?.contact  ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [language, setLanguage] = useState(user?.language ?? "sinhala");
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text:"", ok:false });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg({ text:"", ok:false });
    try {
      const res  = await fetch("/backend/Apis/update_profile.php", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ name, contact, district, language }),
        credentials:"include",
      });
      const data = await res.json();
      if (data.success) {
        login({ ...user, name, contact, district, language });
        setMsg({ text:"✅ Profile updated successfully.", ok:true });
      } else {
        setMsg({ text: data.message || "Update failed.", ok:false });
      }
    } catch {
      setMsg({ text:"Network error. Make sure XAMPP is running.", ok:false });
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || "U")
    .split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      
      <main style={s.page}>
        <h1 style={s.heading}>My Profile</h1>

        {/* Profile header */}
        <div className="card" style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14, background:"var(--g-50)", borderColor:"var(--g-100)" }}>
          <div style={s.avatar}>{initials}</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{user?.name}</div>
            <div style={{ fontSize:12, color:"var(--t-3)", marginTop:2 }}>
              {user?.role === "farmer" ? "🌾 Farmer" : user?.role === "admin" ? "🛡 Admin" : "🛒 Buyer"} · {user?.district}
            </div>
            {user?.verified && (
              <span className="badge badge-green" style={{ marginTop:6, display:"inline-flex" }}>✓ Verified Farmer</span>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="card" style={{ marginBottom:14 }}>
          <p className="section-label">Edit Details</p>
          <form onSubmit={handleSave}>
            <div className="grid-2">
              <div className="field">
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Contact Number</label>
                <input value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>District</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Preferred Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="sinhala">සිංහල (Sinhala)</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
            {msg.text && (
              <div className={msg.ok ? "info-green" : "info-red"} style={{ marginBottom:12 }}>{msg.text}</div>
            )}
            <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Verification status — farmers only */}
        {user?.role === "farmer" && (
          <div className="card" style={{ borderColor:"var(--g-100)" }}>
            <p className="section-label">Verification Status</p>
            {[
              { label:"NIC Verified",            done: user.verified },
              { label:"Farm Location Confirmed", done: user.verified },
              { label:"Crop Evidence Submitted", done: user.verified },
            ].map(({ label, done }) => (
              <div key={label} style={s.verifyRow}>
                <span style={{ fontSize:18, color: done ? "var(--g-600)" : "var(--s-200)" }}>
                  {done ? "✓" : "○"}
                </span>
                <span style={{ fontSize:13, color: done ? "var(--t-1)" : "var(--t-3)" }}>
                  {label}
                </span>
                {done
                  ? <span className="badge badge-green" style={{ marginLeft:"auto" }}>Complete</span>
                  : <span className="badge badge-amber" style={{ marginLeft:"auto" }}>Pending</span>
                }
              </div>
            ))}
          </div>
        )}
      </main>
      
    </div>
  );
}

const s = {
  page:      { flex:1, maxWidth:640, margin:"0 auto", padding:"28px 18px", width:"100%" },
  heading:   { fontSize:20, fontWeight:700, color:"var(--t-1)", marginBottom:18 },
  avatar:    { width:52, height:52, borderRadius:"50%", background:"var(--g-600)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, flexShrink:0 },
  verifyRow: { display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid var(--s-100)" },
};