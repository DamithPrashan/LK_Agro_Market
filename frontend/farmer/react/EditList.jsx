import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../csss/EditList.css";
import { useAuth } from "../../../src/context/AuthContext";
import { DISTRICTS } from "../../../src/constants/districts";

function EditList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    crop_id: state?.crop_id || "",
    cropName: state?.cropName || "",
    category: state?.category || "",
    quantity: state?.quantity || "",
    location: state?.location || "",
    harvestDate: state?.harvestDate || "",
    price: state?.price || "",
    stage: state?.stage || "planted",
  });

  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (step === 2 && formData.cropName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingSuggestion(true);
      const userDistrict = user?.district || "";
      fetch(`/backend/Apis/analytics/get_price_suggestion.php?crop_name=${encodeURIComponent(formData.cropName)}&district=${encodeURIComponent(userDistrict)}`, {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          setLoadingSuggestion(false);
          if (data.success) {
            setSuggestion(data);
          } else {
            setSuggestion(null);
          }
        })
        .catch((err) => {
          setLoadingSuggestion(false);
          setSuggestion(null);
          console.error("Error fetching price suggestion:", err);
        });
    }
  }, [step, formData.cropName, user?.district]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateListing = async () => {
    try {
      const response = await fetch("/backend/Apis/farmer/crops/updateCrop.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          crop_id: formData.crop_id,
          cropName: formData.cropName,
          category: formData.category,
          quantity: formData.quantity,
          location: formData.location,
          price: formData.price,
          growthStage: formData.stage,
          harvestDate: formData.harvestDate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(t("farmer.listingUpdatedSuccess", "Listing Updated Successfully!"));
        navigate("/farmer/listings");
      } else if (response.status === 409) {
        // Listing is locked because it has active orders
        alert(t("farmer.editBlockedActiveOrders", result.message));
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert(t("errors.submissionFailed"));
    }
  };


  return (
    <div className="add-listing-container">

      <div className="listing-card">
        <h2>{t("farmer.editListingTitle", "Edit Listing")}</h2>

        {/* STEP CIRCLES + LABELS PAIRED TOGETHER */}
        <div className="edit-steps">
          <div className={`edit-step ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <div className="edit-circle">1</div>
            <span>{t("farmer.cropDetailsTab")}</span>
          </div>
          <div className={`edit-step ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <div className="edit-circle">2</div>
            <span>{t("farmer.pricingTab")}</span>
          </div>
          <div className={`edit-step ${step === 3 ? "active" : ""}`}>
            <div className="edit-circle">3</div>
            <span>{t("farmer.reviewTab")}</span>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="form-section">
            <h3>{t("farmer.cropDetailsTab")}</h3>

            <label className="field-label">{t("forms.cropName", "Crop Name")}</label>
            <input
              type="text"
              name="cropName"
              placeholder={t("farmer.cropNamePlaceholder")}
              value={formData.cropName}
              onChange={handleChange}
            />

            <label className="field-label">{t("farmer.growthStageLabel")}</label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
            >
              <option value="">{t("farmer.selectGrowthStage")}</option>
              <option value="planted">{t("farmer.stagePlanted")}</option>
              <option value="growing">{t("farmer.stageGrowing")}</option>
              <option value="ready_for_harvest">{t("farmer.stageReadyForHarvest")}</option>
              <option value="harvested">{t("farmer.stageHarvested")}</option>
            </select>

            <label className="field-label">{t("listing.categoryLabel")}</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">{t("farmer.selectCategory")}</option>
              <option value="Vegetable">{t("farmer.categoryVegetable")}</option>
              <option value="Fruit">{t("farmer.categoryFruit")}</option>
              <option value="Grain">{t("farmer.categoryGrain")}</option>
              <option value="Other">{t("farmer.categoryOther")}</option>
            </select>

            <label className="field-label">{t("forms.district", "District")}</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
            >
              <option value="">{t("forms.selectDistrict")}</option>
              {DISTRICTS.map((d) => (
                <option key={d.key} value={d.value}>
                  {t(`districts.${d.key}`)}
                </option>
              ))}
            </select>

            <label className="field-label">{t("farmer.harvestDateLabel")}</label>
            <input
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
            />

            <label className="field-label">{t("farmer.quantityLabel")}</label>
            <input
              type="number"
              name="quantity"
              placeholder={t("farmer.quantityPlaceholder")}
              value={formData.quantity}
              onChange={handleChange}
            />

            <div className="btn-group">
              <button className="back-btn" onClick={() => navigate(-1)}>
                {t("buttons.cancel")}
              </button>

              <button className="next-btn" onClick={nextStep}>
                {t("buttons.next")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="form-section">
            <h3>{t("farmer.pricingTab")}</h3>

            <label className="field-label">{t("farmer.priceLabel")}</label>
            <input
              type="number"
              name="price"
              placeholder={t("farmer.pricePlaceholder")}
              value={formData.price}
              onChange={handleChange}
            />

            {loadingSuggestion && <p className="suggestion-loading">{t("farmer.loadingPriceSuggestion")}</p>}

            {!loadingSuggestion && suggestion && suggestion.suggested_price !== null && (
              <div className="price-suggestion-box">
                {suggestion.basis === 'district' ? (
                  <>
                    <p className="suggestion-info">
                      ℹ {t("farmer.suggestedPriceLabel")}: <strong>{t("farmer.rsPrefix")} {Number(suggestion.suggested_price).toLocaleString()} {t("farmer.kgSuffix")}</strong>
                    </p>
                    <p className="suggestion-subtext">
                      {t("farmer.basedOnDistrict", { count: suggestion.sample_count })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="suggestion-info">
                      {t("farmer.nationalAverage", { price: Number(suggestion.suggested_price).toLocaleString() })}
                    </p>
                    <p className="suggestion-subtext">
                      {t("farmer.basedOnNational", { count: suggestion.sample_count })}
                    </p>
                  </>
                )}
                <div className="suggestion-actions">
                  <button
                    type="button"
                    className="use-suggestion-btn"
                    onClick={() => setFormData(prev => ({ ...prev, price: suggestion.suggested_price }))}
                  >
                    {t("farmer.btnUseAveragePrice", "Use Suggested Price")}
                  </button>
                </div>
              </div>
            )}

            {!loadingSuggestion && (!suggestion || suggestion.suggested_price === null) && (
              <div className="price-suggestion-box" style={{ background: '#f5f5f5', borderColor: '#ddd' }}>
                <p className="suggestion-info" style={{ color: '#666' }}>
                  ℹ {t("farmer.noPricingData", { cropName: formData.cropName || t("farmer.thisCropLabel", "this crop") })}
                </p>
              </div>
            )}

            <div className="btn-group">
              <button className="back-btn" onClick={prevStep}>
                {t("buttons.back")}
              </button>

              <button className="next-btn" onClick={nextStep}>
                {t("buttons.next")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="form-section">
            <h3>{t("farmer.reviewCropDetailsHeading")}</h3>

            <div className="review-box">
              <p><b>{t("farmer.cropLabel")}:</b> {formData.cropName}</p>
              <p><b>{t("listing.categoryLabel")}:</b> {t(`farmer.category${formData.category === "Other" ? "Other" : formData.category}`, formData.category)}</p>
              <p><b>{t("farmer.quantityLabel")}:</b> {formData.quantity}{t("farmer.kgSuffix")}</p>
              <p><b>{t("forms.location")}:</b> {t(`districts.${DISTRICTS.find(d => d.value === formData.location)?.key || formData.location}`, formData.location)}</p>
              <p><b>{t("farmer.growthStageLabel")}:</b> {t(`farmer.stage${formData.stage?.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("") || formData.stage}`, formData.stage)}</p>
              <p><b>{t("farmer.harvestDateLabel")}:</b> {formData.harvestDate}</p>
              <p><b>{t("farmer.priceLabel")}:</b> {t("farmer.rsPrefix")}{formData.price}</p>
            </div>

            <div className="btn-group">
              <button className="back-btn" onClick={prevStep}>
                {t("buttons.back")}
              </button>

              <button className="submit-btn" onClick={updateListing}>
                {t("buttons.updateListing", "Update Listing")}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default EditList;

