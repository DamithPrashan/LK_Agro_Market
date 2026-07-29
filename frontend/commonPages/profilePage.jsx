import { useState } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Matara",
  "Nuwara Eliya","Polonnaruwa","Ratnapura","Trincomalee",
];

export default function Profile() {
  const { user, login }       = useAuth();
  const { t }                 = useTranslation();
  const [name, setName]       = useState(user?.name     ?? "");
  const [contact, setContact] = useState(user?.contact  ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [language, setLanguage] = useState(user?.language ?? "sinhala");
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
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
        setMsg({ text: t("profile.successAlert"), ok:true });
      } else {
        setMsg({ text: data.message || t("profile.failedAlert"), ok:false });
      }
    } catch {
      setMsg({ text: t("errors.networkXamppError"), ok:false });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_image", file);

    setUploading(true);
    setMsg({ text: "", ok: false });

    try {
      const res = await fetch("/backend/Apis/upload_profile_image.php", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        login({ ...user, profile_image: data.profile_image });
        setMsg({ text: t("profile.uploadSuccess"), ok: true });
      } else {
        setMsg({ text: data.message || t("profile.uploadFailed"), ok: false });
      }
    } catch (err) {
      setMsg({ text: t("errors.networkXamppError"), ok: false });
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!window.confirm(t("confirmations.deletePhoto", "Are you sure you want to remove your profile photo?"))) {
      return;
    }

    setUploading(true);
    setMsg({ text: "", ok: false });

    try {
      const res = await fetch("/backend/Apis/upload_profile_image.php?action=delete", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        login({ ...user, profile_image: null });
        setMsg({ text: t("profile.removeSuccess", "Profile photo removed successfully."), ok: true });
      } else {
        setMsg({ text: data.message || t("profile.uploadFailed"), ok: false });
      }
    } catch (err) {
      setMsg({ text: t("errors.networkXamppError"), ok: false });
    } finally {
      setUploading(false);
    }
  };

  const initials = (user?.name || "U")
    .split(" ").map((n) => n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      
      <main style={s.page}>
        <h1 style={s.heading}>{t("profile.title")}</h1>

        {/* Profile header */}
        <div className="card" style={{ display:"flex", gap:20, alignItems:"center", marginBottom:14, background:"var(--g-50)", borderColor:"var(--g-100)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative" }}>
              <div style={s.avatar}>
                {user?.profile_image ? (
                  <img
                    src={user.profile_image.startsWith("http") || user.profile_image.startsWith("/") ? user.profile_image : "/" + user.profile_image}
                    alt="Profile"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  initials
                )}
              </div>
              <label htmlFor="profile-upload" style={s.uploadLabel} title={t("profile.changePhoto")}>
                📷
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                style={{ display: "none" }}
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            {user?.profile_image && (
              <button
                onClick={handleImageDelete}
                disabled={uploading}
                style={s.removeBtn}
              >
                {t("profile.removePhoto")}
              </button>
            )}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{user?.name}</div>
            <div style={{ fontSize:12, color:"var(--t-3)", marginTop:2 }}>
              {user?.role === "farmer" ? t("profile.roleFarmer") : user?.role === "admin" ? t("profile.roleAdmin") : t("profile.roleBuyer")} · {user?.district}
            </div>
            {user?.verified && (
              <span className="badge badge-green" style={{ marginTop:6, display:"inline-flex" }}>{t("profile.verifiedBadge")}</span>
            )}
          </div>
        </div>

        {/* Edit form */}
        <div className="card" style={{ marginBottom:14 }}>
          <p className="section-label">{t("profile.editDetails")}</p>
          <form onSubmit={handleSave}>
            <div className="grid-2">
              <div className="field">
                <label>{t("forms.fullName")}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>{t("forms.contactNumber")}</label>
                <input value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label>{t("forms.district", "District")}</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>{t("forms.preferredLanguage")}</label>
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
              {saving ? t("profile.btnSaving") : t("profile.btnSave")}
            </button>
          </form>
        </div>

        {/* Verification status — farmers only */}
        {user?.role === "farmer" && (
          <div className="card" style={{ borderColor:"var(--g-100)" }}>
            <p className="section-label">{t("profile.statusHeading")}</p>
            {[
              { label: t("profile.nicVerified"),            done: user.verified },
              { label: t("profile.farmLocationConfirmed"), done: user.verified },
              { label: t("profile.cropEvidenceSubmitted"), done: user.verified },
            ].map(({ label, done }) => (
              <div key={label} style={s.verifyRow}>
                <span style={{ fontSize:18, color: done ? "var(--g-600)" : "var(--s-200)" }}>
                  {done ? "✓" : "○"}
                </span>
                <span style={{ fontSize:13, color: done ? "var(--t-1)" : "var(--t-3)" }}>
                  {label}
                </span>
                {done
                  ? <span className="badge badge-green" style={{ marginLeft:"auto" }}>{t("profile.badgeComplete")}</span>
                  : <span className="badge badge-amber" style={{ marginLeft:"auto" }}>{t("profile.badgePending")}</span>
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
  avatar:    { width:64, height:64, borderRadius:"50%", background:"var(--g-600)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, flexShrink:0, position: "relative", overflow: "hidden" },
  verifyRow: { display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid var(--s-100)" },
  uploadLabel: { position: "absolute", bottom: -2, right: -2, background: "var(--g-600)", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" },
  removeBtn: { background: "transparent", border: "none", color: "var(--r-600)", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: "2px 6px", borderRadius: 4, transition: "0.2s" },
};