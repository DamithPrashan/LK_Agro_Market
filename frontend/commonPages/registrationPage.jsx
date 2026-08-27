import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useForm } from "../../src/hooks/useForm";
import FarmerVerificationForm from "../components/FarmerVerificationForm";
import { DISTRICTS } from "../../src/constants/districts";
import { FiShield, FiLock, FiGlobe, FiCheck } from "react-icons/fi";
import logo from "../../src/assets/logo.png";
import bgImage from "../../src/assets/registration-bg.jpg";
import "./csss/registrationPage.css";

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = "errors.fullNameReq";

  // Clean contact number and validate
  const cleanContact = v.contact.trim().replace(/[\s-]/g, "");
  if (!cleanContact) {
    e.contact = "errors.contactNumReq";
  } else if (!/^\+94\d{9}$/.test(cleanContact)) {
    e.contact = "errors.contactNumFormat";
  }

  // Validate Gmail
  if (!v.email.trim()) {
    e.email = "errors.emailAddressReq";
  } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(v.email)) {
    e.email = "errors.emailAddressGmail";
  }

  if (!v.district) e.district = "errors.selectDistrictReq";
  if (v.password.length < 8) e.password = "errors.passwordMinLen";
  if (v.password !== v.confirm) e.confirm = "errors.passwordsDoNotMatch";
  return e;
}

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const [role, setRole] = useState(requestedRole === "buyer" ? "buyer" : "farmer");
  const [step, setStep] = useState(1);
  const [apiErr, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [nicFile, setNicFile] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);

  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { name: "", contact: "", email: "", district: "", language: "sinhala", password: "", confirm: "", nic: "", farm_location: "" },
    validate
  );

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(1);
    setApiErr("");
  };

  const handleNextStep = () => {
    if (validateAll()) {
      setStep(2);
      setApiErr("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    const maxFileSize = 3 * 1024 * 1024;
    const oversizedFile = [nicFile, evidenceFile].find(
      (file) => file && file.size > maxFileSize
    );

    if (oversizedFile) {
      setApiErr(`${oversizedFile.name} is too large. Each image must be 3 MB or smaller.`);
      return;
    }

    setLoading(true);
    setApiErr("");

    const body = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (k === "contact") {
        body.append(k, v.trim().replace(/[\s-]/g, ""));
      } else {
        body.append(k, v);
      }
    });
    body.append("role", role);
    if (nicFile) body.append("nic_image", nicFile);
    if (evidenceFile) body.append("evidence", evidenceFile);

    try {
      const res = await fetch("/backend/Apis/register.php",
        { method: "POST", body, credentials: "include" });
      const data = await res.json();
      if (data.success) {
        if (role === "farmer" && data.verification_required) {
          setApiErr("");
          setShowSuccessModal(true);
        } else {
          login(data.user);
          navigate("/buyer");
        }
      } else {
        setApiErr(data.message || t("errors.submissionFailed"));
      }
    } catch {
      setApiErr(t("errors.networkXamppError"));
    } finally {
      setLoading(false);
    }
  };

  // Reusable field renderer function
  const renderField = (label, name, type = "text", placeholder = "", hint = "") => (
    <div className="field" key={name}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        value={values[name]} onChange={handleChange} onBlur={handleBlur}
        className={touched[name] && errors[name] ? "error" : ""}
      />
      {touched[name] && errors[name] && <p className="err-msg">{t(errors[name])}</p>}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );

  return (
    <div className="register-page-wrapper">
      {/* LEFT SIDE - BRANDING & VISUAL SECTION */}
      <div
        className="register-left-side"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="register-hero-overlay" />

        {/* Top Branding / Logo */}
        <div className="brand-header">
          <img src={logo} alt="LK Agro Market" className="brand-logo-img" />
          <div className="brand-title-wrap">
            <span className="brand-name">LK Agro Market</span>
            <span className="brand-badge">Sri Lanka</span>
          </div>
        </div>

        {/* Bottom Marketing Content */}
        <div className="hero-content-bottom">
          <h2 className="hero-headline">
            Fresh crops.<br />
            <span className="highlight-text">Direct from Sri Lankan farms.</span>
          </h2>
          <p className="hero-description">
            Connect directly with verified farmers. Browse and pre-order fresh crops with confidence. No unnecessary middlemen.
          </p>

          <div className="hero-benefits">
            <div className="benefit-item">
              <div className="benefit-icon-box">
                <FiShield />
              </div>
              <span>Verified farmer system</span>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <FiLock />
              </div>
              <span>Secure payment process</span>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <FiGlobe />
              </div>
              <span>Sinhala · Tamil · English support</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - EXISTING REGISTRATION FORM */}
      <div className="register-right-side">
        <div className="register-form-card">
          <div className="form-header">
            <h1 className="form-title">{t("register.header")}</h1>
            <p className="form-subtitle">{t("register.subtitle")}</p>
          </div>

          {/* Role selector - Fixed Vertical Position */}
          <div className="role-grid">
            {["farmer", "buyer"].map((r) => (
              <button
                key={r} type="button"
                onClick={() => handleRoleSelect(r)}
                className={`role-btn ${role === r ? "active" : ""}`}
              >
                <span className="role-emoji">{r === "farmer" ? "🌾" : "🛒"}</span>
                <div className="role-text-wrap">
                  <span className="role-label">{r === "farmer" ? t("register.roleFarmer") : t("register.roleBuyer")}</span>
                  <span className="role-sub">
                    {r === "farmer" ? t("register.roleFarmerSub") : t("register.roleBuyerSub")}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Progress Indicator for Farmers - Fixed Vertical Position */}
          {role === "farmer" && (
            <div className="step-progress-bar">
              <div className={`step-pill ${step >= 1 ? "active" : ""}`}>
                <span className="step-num">1</span>
                <span className="step-text">Personal Details</span>
              </div>
              <div className="step-line" />
              <div className={`step-pill ${step >= 2 ? "active" : ""}`}>
                <span className="step-num">2</span>
                <span className="step-text">Farmer Verification</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="step-form-area">
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div>
                <div className="grid-2">
                  {renderField(t("forms.fullName"), "name", "text", "R.M.S.T. Randeniya")}
                  {renderField(t("forms.contactNumber"), "contact", "text", "+94 71 234 5678")}
                </div>
                <div className="grid-2">
                  {renderField(t("forms.emailAddress"), "email", "email", t("login.emailPlaceholder"))}
                  <div className="field">
                    <label htmlFor="district">{t("forms.district")}</label>
                    <select
                      id="district" name="district" value={values.district}
                      onChange={handleChange} onBlur={handleBlur}
                      className={touched.district && errors.district ? "error" : ""}
                    >
                      <option value="">{t("forms.selectDistrict")}</option>
                      {DISTRICTS.map((d) => (
                        <option key={d.key} value={d.value}>
                          {t(`districts.${d.key}`)}
                        </option>
                      ))}
                    </select>
                    {touched.district && errors.district && <p className="err-msg">{t(errors.district)}</p>}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="language">{t("forms.preferredLanguage")}</label>
                    <select id="language" name="language" value={values.language} onChange={handleChange}>
                      <option value="sinhala">සිංහල (Sinhala)</option>
                      <option value="tamil">தமிழ் (Tamil)</option>
                      <option value="english">English</option>
                    </select>
                  </div>
                  {renderField(t("forms.password"), "password", "password", "", t("auth.minPasswordHint"))}
                </div>
                <div className="grid-2">
                  {renderField(t("forms.confirmPassword"), "confirm", "password")}
                </div>

                {role === "farmer" ? (
                  <button
                    className="btn btn-primary btn-lg btn-full"
                    type="button"
                    onClick={handleNextStep}
                  >
                    Next: Verification →
                  </button>
                ) : (
                  <>
                    {apiErr && <div className="info-red">{apiErr}</div>}
                    <button
                      className="btn btn-primary btn-lg btn-full"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? t("register.btnCreating") : t("register.btnCreate")}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* STEP 2: Farmer Verification (Farmer only) */}
            {step === 2 && role === "farmer" && (
              <div>
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

                {apiErr && <div className="info-red">{apiErr}</div>}

                <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-lg"
                    onClick={() => setStep(1)}
                    style={{ flex: 1 }}
                  >
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2 }}
                  >
                    {loading ? t("register.btnCreating") : t("register.btnCreate")}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="form-footer">
            <p className="foot-text">
              {t("register.footText")}{" "}
              <Link to="/login" className="foot-link">{t("register.footLink")}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* FARMER REGISTRATION SUCCESS MODAL POPUP */}
      {showSuccessModal && (
        <div
          className="registration-modal-overlay"
          onClick={() => {
            setShowSuccessModal(false);
            navigate("/login");
          }}
        >
          <div
            className="registration-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Success Section */}
            <div className="modal-success-header">
              <div className="modal-icon-badge modal-icon-success">
                <FiCheck className="modal-icon-svg" />
              </div>
              <h2 className="modal-success-title">Registration successful.</h2>
            </div>

            {/* 2. Information / Verification Section */}
            <div className="modal-info-box">
              <div className="modal-info-icon-wrap">
                <span className="modal-info-badge">!</span>
              </div>
              <p className="modal-info-text">
                Your farmer verification request is now under review. You can log in after admin approval.
              </p>
            </div>

            {/* 3. Action Button */}
            <button
              type="button"
              className="btn btn-primary btn-lg btn-full modal-confirm-btn"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/login");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
