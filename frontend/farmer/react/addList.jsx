import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../csss/addList.css";
import { useAuth } from "../../../src/context/AuthContext";
import { DISTRICTS } from "../../../src/constants/districts";
import { getDistrictLabel } from "../../../src/constants/districtUtils";

function AddListing() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        cropName: "",
        category: "",
        quantity: "",
        location: "",
        growthStage: "",
        harvestDate: "",
        price: "",
        photos: [null, null, null], // Initialize an array with 3 spots
    });

    const [suggestion, setSuggestion] = useState(null);
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);

    useEffect(() => {
        if (step === 2 && formData.cropName) {
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

    // Refs to programmatically trigger hidden file inputs
    const fileInputRefs = [useRef(null), useRef(null), useRef(null)];

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    // Update photo at a specific slot index
    const handleFileChangeSlot = (e, index) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFormData((prev) => {
                const updatedPhotos = [...prev.photos];
                updatedPhotos[index] = selectedFile; // Save file to its explicit box slot
                return { ...prev, photos: updatedPhotos };
            });
        }
    };

    const triggerFileInput = (index) => {
        fileInputRefs[index].current.click();
    };

    const handleSubmit = async () => {
        const data = new FormData();

        data.append("cropName", formData.cropName);
        data.append("category", formData.category);
        data.append("quantity", formData.quantity);
        data.append("location", formData.location);
        data.append("growthStage", formData.growthStage);
        data.append("harvestDate", formData.harvestDate);
        data.append("price", formData.price);

        // Filter out null slots and append to payload
        formData.photos.forEach((photo) => {
            if (photo) {
                data.append("photos[]", photo);
            }
        });

        // NOTE: Since you are uploading files via multipart/form-data, 
        // we must not use JSON headers in fetch or PHP's php://input.
        const response = await fetch("/backend/Apis/farmer/crops/addCrop.php", {
            method: "POST",
            body: data,
            credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
            alert(t("farmer.cropSubmittedSuccess"));
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="add-listing-container">
            <div className="listing-card">
                <h2>{t("farmer.addNewCropTitle")}</h2>

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

                {step === 1 && (
                    <div className="form-section">
                        <h3>{t("farmer.cropDetailsTab")}</h3>

                        <input
                            type="text"
                            name="cropName"
                            placeholder={t("farmer.cropNamePlaceholder")}
                            value={formData.cropName}
                            onChange={handleChange}
                        />

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

                        <input
                            type="number"
                            name="quantity"
                            placeholder={t("farmer.quantityPlaceholder")}
                            value={formData.quantity}
                            onChange={handleChange}
                        />

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

                        <select
                            name="growthStage"
                            value={formData.growthStage}
                            onChange={handleChange}
                        >
                            <option value="">{t("farmer.selectGrowthStage")}</option>
                            <option value="planted">{t("farmer.stagePlanted")}</option>
                            <option value="growing">{t("farmer.stageGrowing")}</option>
                            <option value="ready_for_harvest">{t("farmer.stageReadyForHarvest")}</option>
                            <option value="harvested">{t("farmer.stageHarvested")}</option>
                        </select>

                        <input
                            type="text"
                            placeholder={t("farmer.harvestDatePlaceholder")}
                            onFocus={(e) => (e.target.type = "date")}
                            onBlur={(e) => {
                                if (!e.target.value) e.target.type = "text";
                            }}
                            name="harvestDate"
                            value={formData.harvestDate}
                            onChange={handleChange}
                        />

                        <div className="upload-section">
                            <label>{t("farmer.uploadPhotosLabel")}</label>

                            <div className="photo-boxes">
                                {[0, 1, 2].map((index) => (
                                    <div
                                        className="photo-box"
                                        key={index}
                                        onClick={() => triggerFileInput(index)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {formData.photos[index] ? (
                                            <img
                                                src={URL.createObjectURL(formData.photos[index])}
                                                alt=""
                                                className="preview-image"
                                            />
                                        ) : (
                                            "+"
                                        )}
                                        {/* Hidden inputs connected programmatically to their box layout */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRefs[index]}
                                            onChange={(e) => handleFileChangeSlot(e, index)}
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="btn-group">
                            <button
                                className="next-btn"
                                onClick={() => setStep(2)}
                            >
                                {t("buttons.next")}
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => navigate("/farmer")}
                            >
                                {t("buttons.back")}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-section">
                        <h3>{t("farmer.pricingInfoHeading")}</h3>

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
                                        {t("farmer.btnUseAveragePrice")}
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
                            <button
                                className="next-btn"
                                onClick={() => setStep(3)}
                            >
                                {t("buttons.next")}
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => setStep(1)}
                            >
                                {t("buttons.back")}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-section">
                        <h3>{t("farmer.reviewCropDetailsHeading")}</h3>

                        <div className="review-box">
                            <p><strong>{t("farmer.cropLabel")}:</strong> {formData.cropName}</p>
                            <p><strong>{t("listing.categoryLabel")}:</strong> {t(`farmer.category${formData.category}`, formData.category)}</p>
                            <p><strong>{t("farmer.quantityLabel")}:</strong> {formData.quantity}{t("farmer.kgSuffix")}</p>
                            <p><strong>{t("forms.location")}:</strong> {getDistrictLabel(t, formData.location)}</p>
                            <p><strong>{t("farmer.growthStageLabel")}:</strong> {t(`farmer.stage${(formData.growthStage || "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`, formData.growthStage)}</p>
                            <p><strong>{t("farmer.harvestDateLabel")}:</strong> {formData.harvestDate}</p>
                            <p><strong>{t("farmer.priceLabel")}:</strong> {t("farmer.rsPrefix")}{formData.price}</p>
                            <p><strong>{t("farmer.uploadedPhotosLabel")}:</strong> {formData.photos.filter(Boolean).length}</p>
                        </div>

                        <div className="btn-group">
                            <button
                                className="submit-btn"
                                onClick={handleSubmit}
                            >
                                {t("buttons.submitCrop")}
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => setStep(2)}
                            >
                                {t("buttons.back")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddListing;

