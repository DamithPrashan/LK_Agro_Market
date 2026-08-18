import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CultivationAdForm } from "./CultivationAdForm";
import { emptyCultivationAd, validateCultivationAd } from "./cultivationAdUtils";
import "../csss/CultivationAds.css";

export default function AddCultivationAd() {
  const { t } = useTranslation();
  const text = (key, fallback, values = {}) => key.startsWith("districts.")
    ? t(key, { defaultValue: fallback, ...values })
    : t(`farmer.cultivationAds.${key}`, { defaultValue: fallback, ...values });
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyCultivationAd);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const error = validateCultivationAd(form, photos);
    if (error) return alert(text(`validation.${error}`, "Please check the entered details."));
    const body = new FormData(); Object.entries(form).forEach(([key, value]) => body.append(key, value)); photos.forEach((photo) => body.append("photos[]", photo));
    setSubmitting(true);
    try {
      const response = await fetch("/backend/Apis/farmer/cultivationAds/createCultivationAd.php", { method: "POST", credentials: "include", body });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      alert(text("createdSuccess", "Cultivation opportunity created successfully."));
      navigate("/farmer/cultivation-opportunities");
    } catch (error) { alert(error.message || text("saveFailed", "Unable to save cultivation opportunity.")); }
    finally { setSubmitting(false); }
  };
  return <section className="cultivation-page"><header className="cultivation-hero"><span>{text("futureLabel", "Future Cultivation Opportunity")}</span><h1>{text("addTitle", "Add Cultivation Ad")}</h1><p>{text("explanation", "Advertise a crop you are willing and able to cultivate based on future buyer demand.")}</p></header><div className="cultivation-panel"><CultivationAdForm {...{ form, setForm, photos, setPhotos, submitting, onSubmit: submit, onCancel: () => navigate("/farmer/cultivation-opportunities"), t: text }} /></div></section>;
}
