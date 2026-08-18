import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CultivationAdForm } from "./CultivationAdForm";
import { emptyCultivationAd, validateCultivationAd } from "./cultivationAdUtils";
import { readCultivationResponse } from "../../buyer/react/cultivationApi.js";
import "../csss/CultivationAds.css";

export default function EditCultivationAd() {
  const { id } = useParams(); const navigate = useNavigate(); const { t } = useTranslation();
  const text = (key, fallback, values = {}) => key.startsWith("districts.")
    ? t(key, { defaultValue: fallback, ...values })
    : t(`farmer.cultivationAds.${key}`, { defaultValue: fallback, ...values });
  const [form, setForm] = useState(emptyCultivationAd); const [photos, setPhotos] = useState([]); const [existingPhotos, setExistingPhotos] = useState([]); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [loadError, setLoadError] = useState("");
  useEffect(() => { fetch(`/backend/Apis/farmer/cultivationAds/getCultivationAdDetails.php?id=${encodeURIComponent(id)}`, { credentials: "include" }).then(readCultivationResponse).then((result) => { const ad = result.data.ad; setForm(Object.fromEntries(Object.keys(emptyCultivationAd).map((key) => [key, ad[key] ?? emptyCultivationAd[key]]))); setExistingPhotos(ad.photos || []); }).catch((error) => setLoadError(error.message)).finally(() => setLoading(false)); }, [id]);
  const submit = async (event) => { event.preventDefault(); if(submitting)return; const error = validateCultivationAd(form, photos, existingPhotos.length); if (error) return alert(text(`validation.${error}`, "Please check the entered details.")); const body = new FormData(); body.append("cultivation_ad_id", id); Object.entries(form).forEach(([key, value]) => body.append(key, value)); photos.forEach((photo) => body.append("photos[]", photo)); setSubmitting(true); try { const response = await fetch("/backend/Apis/farmer/cultivationAds/updateCultivationAd.php", { method: "POST", credentials: "include", body }); await readCultivationResponse(response); alert(text("updated", "Cultivation opportunity updated successfully.")); navigate("/farmer/cultivation-opportunities"); } catch (error) { alert(error.message); } finally { setSubmitting(false); } };
  if (loading) return <div className="cultivation-state">{text("loading", "Loading...")}</div>;
  if (loadError) return <div className="cultivation-state cultivation-error">{loadError}</div>;
  return <section className="cultivation-page"><header className="cultivation-hero"><span>{text("futureLabel", "Future Cultivation Opportunity")}</span><h1>{text("editTitle", "Edit Cultivation Ad")}</h1></header><div className="cultivation-panel"><CultivationAdForm {...{ form, setForm, photos, setPhotos, existingPhotos, submitting, onSubmit: submit, onCancel: () => navigate("/farmer/cultivation-opportunities"), t: text }} /></div></section>;
}
