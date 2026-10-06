import React, { useState, useRef, useEffect, useMemo } from "react";
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

    const getInitialDistrict = () => {
        const raw = user?.district || user?.location || "";
        if (!raw) return "";
        const found = DISTRICTS.find(
            (d) => d.value.toLowerCase() === String(raw).trim().toLowerCase()
        );
        return found ? found.value : raw;
    };

    const [formData, setFormData] = useState({
        cropName: "",
        category: "",
        quantity: "",
        location: getInitialDistrict(),
        growthStage: "",
        harvestDate: "",
        price: "",
        photos: [null, null, null],
    });

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);

    useEffect(() => {
        const initial = getInitialDistrict();
        if (initial && !formData.location) {
            setFormData((prev) => ({
                ...prev,
                location: initial
            }));
        }
    }, [user?.district, user?.location]);

    // Check if Step 1 (Crop Details) is completed
    const isStep1Complete = useMemo(() => {
        return Boolean(
            formData.cropName.trim() &&
            formData.category.trim() &&
            formData.quantity &&
            Number(formData.quantity) > 0 &&
            formData.location.trim() &&
            formData.growthStage.trim() &&
            formData.harvestDate.trim()
        );
    }, [formData]);

    // Check if Step 2 (Pricing) is completed
    const isStep2Complete = useMemo(() => {
        return Boolean(isStep1Complete && formData.price && Number(formData.price) > 0);
    }, [isStep1Complete, formData.price]);

    // Automatically fetch price suggestion once Step 1 is complete and cropName is known
    useEffect(() => {
        if (isStep1Complete && formData.cropName) {
            setLoadingSuggestion(true);
            const districtToUse = formData.location || user?.district || "";
            fetch(`/backend/Apis/analytics/get_price_suggestion.php?crop_name=${encodeURIComponent(formData.cropName)}&district=${encodeURIComponent(districtToUse)}`, {
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
        } else {
            setSuggestion(null);
        }
    }, [isStep1Complete, formData.cropName, formData.location, user?.district]);

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
                updatedPhotos[index] = selectedFile;
                return { ...prev, photos: updatedPhotos };
            });
        }
    };

    const triggerFileInput = (index) => {
        fileInputRefs[index].current.click();
    };

    const handleRemovePhoto = (e, index) => {
        e.stopPropagation();
        setFormData((prev) => {
            const updated = [...prev.photos];
            updated[index] = null;
            return { ...prev, photos: updated };
        });
        if (fileInputRefs[index].current) {
            fileInputRefs[index].current.value = "";
        }
    };

    const handleOpenReview = (e) => {
        e.preventDefault();
        if (!isStep1Complete) {
            alert(t("forms.completeStep1First", "Please complete all required fields in Step 1 (Crop Details) first."));
            return;
        }
        if (!isStep2Complete) {
            alert(t("forms.enterValidPrice", "Please enter a valid price per kg in Step 2."));
            return;
        }
        setShowReviewModal(true);
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        const data = new FormData();
        data.append("cropName", formData.cropName.trim());
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

        try {
            const response = await fetch("/backend/Apis/farmer/crops/addCrop.php", {
                method: "POST",
                body: data,
                credentials: "include"
            });

            const result = await response.json();

            if (result.success) {
                alert(t("farmer.cropSubmittedSuccess"));
                setShowReviewModal(false);
                navigate("/farmer");
            } else {
                alert(result.message || t("errors.submissionFailed", "Failed to submit crop."));
            }
        } catch (err) {
            console.error("Error submitting crop:", err);
            alert(t("errors.genericError", "An unexpected error occurred. Please try again."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-listing-container">
            <div className="listing-card">
                <h2>{t("farmer.addNewCropTitle")}</h2>

                {/* Combined Progress Stepper Header */}
                <div className="combined-stepper">
                    <div className={`stepper-node ${isStep1Complete ? "completed" : "active"}`}>
                        <div className="stepper-badge">{isStep1Complete ? "✓" : "1"}</div>
                        <div className="stepper-info">
                            <span className="stepper-label">{t("farmer.cropDetailsTab")}</span>
                            <small className="stepper-status">
                                {isStep1Complete ? t("forms.completed", "Completed") : t("forms.inProgress", "Step 1")}
                            </small>
                        </div>
                    </div>

                    <div className={`stepper-connector ${isStep1Complete ? "completed" : ""}`} />

                    <div className={`stepper-node ${isStep2Complete ? "completed" : isStep1Complete ? "active" : "locked"}`}>
                        <div className="stepper-badge">
                            {isStep2Complete ? "✓" : isStep1Complete ? "2" : "🔒"}
                        </div>
                        <div className="stepper-info">
                            <span className="stepper-label">{t("farmer.pricingTab")}</span>
                            <small className="stepper-status">
                                {!isStep1Complete ? t("forms.locked", "Locked") : (isStep2Complete ? t("forms.ready", "Ready") : t("forms.inProgress", "Step 2"))}
                            </small>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleOpenReview} noValidate>
                    {/* ════════════════════════════════════════════
                        STEP 1: CROP DETAILS (Section 1)
                       ════════════════════════════════════════════ */}
                    <section className="form-section step-section">
                        <div className="section-header">
                            <div className="section-title-wrap">
                                <span className="section-step-pill">1</span>
                                <h3>{t("farmer.cropDetailsTab")}</h3>
                            </div>
                            {isStep1Complete ? (
                                <span className="status-indicator done">✓ {t("forms.completed", "Ready")}</span>
                            ) : (
                                <span className="status-indicator pending">{t("forms.requiredNotice", "All fields required")}</span>
                            )}
                        </div>

                        <div className="form-grid">
                            <div className="field-group">
                                <label>{t("forms.cropName", "Crop Name")} <span className="req">*</span></label>
                                <input
                                    type="text"
                                    name="cropName"
                                    placeholder={t("farmer.cropNamePlaceholder")}
                                    value={formData.cropName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label>{t("listing.categoryLabel", "Category")} <span className="req">*</span></label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">{t("farmer.selectCategory")}</option>
                                    <option value="Vegetable">{t("farmer.categoryVegetable")}</option>
                                    <option value="Fruit">{t("farmer.categoryFruit")}</option>
                                    <option value="Grain">{t("farmer.categoryGrain")}</option>
                                    <option value="Other">{t("farmer.categoryOther")}</option>
                                </select>
                            </div>

                            <div className="field-group">
                                <label>{t("farmer.quantityLabel", "Quantity")} ({t("farmer.kgSuffix", "kg")}) <span className="req">*</span></label>
                                <input
                                    type="number"
                                    name="quantity"
                                    min="0.1"
                                    step="any"
                                    placeholder={t("farmer.quantityPlaceholder")}
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="field-group">
                                <label>{t("forms.location", "Location / District")} <span className="req">*</span></label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">{t("forms.selectDistrict")}</option>
                                    {DISTRICTS.map((d) => (
                                        <option key={d.key} value={d.value}>
                                            {t(`districts.${d.key}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field-group">
                                <label>{t("farmer.growthStageLabel", "Growth Stage")} <span className="req">*</span></label>
                                <select
                                    name="growthStage"
                                    value={formData.growthStage}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">{t("farmer.selectGrowthStage")}</option>
                                    <option value="planted">{t("farmer.stagePlanted")}</option>
                                    <option value="growing">{t("farmer.stageGrowing")}</option>
                                    <option value="ready_for_harvest">{t("farmer.stageReadyForHarvest")}</option>
                                    <option value="harvested">{t("farmer.stageHarvested")}</option>
                                </select>
                            </div>

                            <div className="field-group">
                                <label>{t("farmer.harvestDateLabel", "Expected Harvest Date")} <span className="req">*</span></label>
                                <input
                                    type="date"
                                    name="harvestDate"
                                    value={formData.harvestDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Upload Photos */}
                        <div className="upload-section">
                            <label className="upload-label">
                                {t("farmer.uploadPhotosLabel")}
                                <span className="optional-tag">({t("forms.optional", "Optional")})</span>
                            </label>

                            <div className="photo-boxes">
                                {[0, 1, 2].map((index) => (
                                    <div
                                        className={`photo-box ${formData.photos[index] ? "has-photo" : ""}`}
                                        key={index}
                                        onClick={() => triggerFileInput(index)}
                                        title={formData.photos[index] ? t("buttons.changePhoto", "Change Photo") : t("buttons.addPhoto", "Add Photo")}
                                    >
                                        {formData.photos[index] ? (
                                            <>
                                                <img
                                                    src={URL.createObjectURL(formData.photos[index])}
                                                    alt="Crop Preview"
                                                    className="preview-image"
                                                />
                                                <button
                                                    type="button"
                                                    className="photo-remove-btn"
                                                    onClick={(e) => handleRemovePhoto(e, index)}
                                                    title={t("buttons.remove", "Remove")}
                                                >
                                                    ×
                                                </button>
                                            </>
                                        ) : (
                                            <div className="photo-placeholder">
                                                <span className="plus-icon">+</span>
                                                <small>{t("buttons.addPhoto", "Photo")} {index + 1}</small>
                                            </div>
                                        )}
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
                    </section>

                    {/* ════════════════════════════════════════════
                        STEP 2: PRICING INFORMATION (Section 2 - Blocked until Step 1 complete)
                       ════════════════════════════════════════════ */}
                    <section className={`form-section step-section ${!isStep1Complete ? "step-blocked" : "step-unlocked"}`}>
                        <div className="section-header">
                            <div className="section-title-wrap">
                                <span className={`section-step-pill ${!isStep1Complete ? "pill-locked" : "pill-active"}`}>
                                    {!isStep1Complete ? "🔒" : "2"}
                                </span>
                                <h3>{t("farmer.pricingInfoHeading")}</h3>
                            </div>
                            {!isStep1Complete ? (
                                <span className="status-indicator locked-text">
                                    🔒 {t("forms.blockedUntilStep1", "Blocked until Step 1 is completed")}
                                </span>
                            ) : isStep2Complete ? (
                                <span className="status-indicator done">✓ {t("forms.ready", "Ready")}</span>
                            ) : (
                                <span className="status-indicator pending">{t("forms.enterPrice", "Enter price per kg")}</span>
                            )}
                        </div>

                        {!isStep1Complete && (
                            <div className="blocked-overlay-banner">
                                <span className="lock-icon" aria-hidden="true">🔒</span>
                                <div>
                                    <strong>{t("forms.step2LockedTitle", "Step 2 is currently locked")}</strong>
                                    <p>{t("forms.step2LockedDesc", "Please fill in all required crop details above (Name, Category, Quantity, Location, Stage, and Harvest Date) to unlock pricing and market analytics.")}</p>
                                </div>
                            </div>
                        )}

                        <div className="pricing-content-wrap">
                            <div className="field-group">
                                <label>{t("farmer.priceLabel", "Price per Kg")} ({t("farmer.rsPrefix", "Rs. ")}) <span className="req">*</span></label>
                                <input
                                    type="number"
                                    name="price"
                                    min="0.01"
                                    step="any"
                                    placeholder={t("farmer.pricePlaceholder")}
                                    value={formData.price}
                                    onChange={handleChange}
                                    disabled={!isStep1Complete}
                                    required
                                />
                            </div>

                            {/* Price Suggestion Box */}
                            {loadingSuggestion && (
                                <p className="suggestion-loading">{t("farmer.loadingPriceSuggestion")}</p>
                            )}

                            {!loadingSuggestion && isStep1Complete && suggestion && suggestion.suggested_price !== null && (
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
                                            disabled={!isStep1Complete}
                                        >
                                            {t("farmer.btnUseAveragePrice")}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!loadingSuggestion && isStep1Complete && (!suggestion || suggestion.suggested_price === null) && (
                                <div className="price-suggestion-box neutral">
                                    <p className="suggestion-info neutral-text">
                                        ℹ {t("farmer.noPricingData", { cropName: formData.cropName || t("farmer.thisCropLabel", "this crop") })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ════════════════════════════════════════════
                        FORM FOOTER BUTTONS
                       ════════════════════════════════════════════ */}
                    <div className="btn-group main-btn-group">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate("/farmer")}
                        >
                            {t("buttons.back", "Back to Dashboard")}
                        </button>

                        <button
                            type="submit"
                            className="review-trigger-btn"
                            disabled={!isStep1Complete || !isStep2Complete}
                        >
                            {t("farmer.reviewCropDetailsHeading", "Review Crop Details")} →
                        </button>
                    </div>
                </form>
            </div>

            {/* ════════════════════════════════════════════
                REVIEW CROP DETAILS POP-UP MODAL
               ════════════════════════════════════════════ */}
            {showReviewModal && (
                <div className="review-modal-backdrop" onClick={() => !submitting && setShowReviewModal(false)}>
                    <div className="review-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="review-modal-header">
                            <div>
                                <span className="review-modal-eyebrow">{t("farmer.addNewCropTitle", "Add New Crop")}</span>
                                <h3>{t("farmer.reviewCropDetailsHeading")}</h3>
                            </div>
                            <button
                                type="button"
                                className="review-close-x"
                                onClick={() => !submitting && setShowReviewModal(false)}
                                disabled={submitting}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="review-modal-body">
                            <p className="review-subtitle">
                                {t("forms.reviewSubtitle", "Please verify your crop listing details before confirming publication to the marketplace.")}
                            </p>

                            <div className="review-details-grid">
                                <div className="review-item">
                                    <span className="review-label">{t("farmer.cropLabel", "Crop Name")}</span>
                                    <strong className="review-value highlight">{formData.cropName}</strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("listing.categoryLabel", "Category")}</span>
                                    <strong className="review-value">
                                        {t(`farmer.category${formData.category}`, formData.category)}
                                    </strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("farmer.quantityLabel", "Quantity")}</span>
                                    <strong className="review-value">
                                        {formData.quantity} {t("farmer.kgSuffix", "kg")}
                                    </strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("farmer.priceLabel", "Price / Kg")}</span>
                                    <strong className="review-value price-text">
                                        {t("farmer.rsPrefix", "Rs. ")}{Number(formData.price).toLocaleString()}
                                    </strong>
                                </div>

                                <div className="review-item full-span total-calc-item">
                                    <span className="review-label">{t("farmer.totalExpectedValue", "Total Estimated Batch Value")}</span>
                                    <strong className="review-value total-value">
                                        {t("farmer.rsPrefix", "Rs. ")}
                                        {Number(Number(formData.quantity) * Number(formData.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("forms.location", "Location")}</span>
                                    <strong className="review-value">
                                        {getDistrictLabel(t, formData.location)}
                                    </strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("farmer.growthStageLabel", "Growth Stage")}</span>
                                    <strong className="review-value">
                                        {t(`farmer.stage${(formData.growthStage || "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`, formData.growthStage)}
                                    </strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("farmer.harvestDateLabel", "Harvest Date")}</span>
                                    <strong className="review-value">{formData.harvestDate}</strong>
                                </div>

                                <div className="review-item">
                                    <span className="review-label">{t("farmer.uploadedPhotosLabel", "Photos Attached")}</span>
                                    <strong className="review-value">
                                        {formData.photos.filter(Boolean).length} / 3
                                    </strong>
                                </div>
                            </div>

                            {/* Photo Previews in Review Modal */}
                            {formData.photos.some(Boolean) ? (
                                <div className="review-photos-section">
                                    <span className="review-photos-title">{t("forms.photoPreviews", "Photo Previews")}:</span>
                                    <div className="review-photo-strip">
                                        {formData.photos.map((photo, i) => photo && (
                                            <div className="review-photo-thumb" key={i}>
                                                <img src={URL.createObjectURL(photo)} alt={`Upload ${i + 1}`} />
                                                <span>#{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="review-no-photos">
                                    <small>{t("forms.noPhotosAttached", "No photos attached. A standard produce icon will be used.")}</small>
                                </div>
                            )}
                        </div>

                        <div className="review-modal-footer">
                            <button
                                type="button"
                                className="modal-edit-btn"
                                onClick={() => setShowReviewModal(false)}
                                disabled={submitting}
                            >
                                ← {t("buttons.editDetails", "Edit Details")}
                            </button>

                            <button
                                type="button"
                                className="modal-confirm-btn"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? t("buttons.submitting", "Publishing Crop...") : `✓ ${t("buttons.submitCrop")}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddListing;
