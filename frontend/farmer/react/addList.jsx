import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../csss/addList.css";
import { useAuth } from "../../../src/context/AuthContext";

function AddListing() {
    const { user } = useAuth();
    const navigate = useNavigate();
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
            fetch(`/backend/get_price_suggestion.php?crop_name=${encodeURIComponent(formData.cropName)}&district=${encodeURIComponent(userDistrict)}`, {
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
        const response = await fetch("/backend/addCrop.php", {
            method: "POST",
            body: data,
            credentials: "include"
        });

        const result = await response.json();

        if (result.success) {
            alert("Crop Submitted Successfully!");
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="add-listing-container">
            <div className="listing-card">
                <h2>Add New Crop</h2>

                <div className="edit-steps">
                    <div className={`edit-step ${step === 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
                        <div className="edit-circle">1</div>
                        <span>Crop Details</span>
                    </div>
                    <div className={`edit-step ${step === 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
                        <div className="edit-circle">2</div>
                        <span>Pricing</span>
                    </div>
                    <div className={`edit-step ${step === 3 ? "active" : ""}`}>
                        <div className="edit-circle">3</div>
                        <span>Review</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="form-section">
                        <h3>Crop Details</h3>

                        <input
                            type="text"
                            name="cropName"
                            placeholder="Crop Name"
                            value={formData.cropName}
                            onChange={handleChange}
                        />

                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="">Select Category</option>
                            <option value="Vegetable">Vegetable</option>
                            <option value="Fruit">Fruit</option>
                            <option value="Grain">Grain</option>
                        </select>

                        <input
                            type="number"
                            name="quantity"
                            placeholder="Quantity (kg)"
                            value={formData.quantity}
                            onChange={handleChange}
                        />

                        <select
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                        >
                            <option value="">Select District</option>
                            <option value="Ampara">Ampara</option>
                            <option value="Anuradhapura">Anuradhapura</option>
                            <option value="Badulla">Badulla</option>
                            <option value="Batticaloa">Batticaloa</option>
                            <option value="Colombo">Colombo</option>
                            <option value="Galle">Galle</option>
                            <option value="Gampaha">Gampaha</option>
                            <option value="Hambantota">Hambantota</option>
                            <option value="Jaffna">Jaffna</option>
                            <option value="Kalutara">Kalutara</option>
                            <option value="Kandy">Kandy</option>
                            <option value="Kegalle">Kegalle</option>
                            <option value="Kilinochchi">Kilinochchi</option>
                            <option value="Kurunegala">Kurunegala</option>
                            <option value="Mannar">Mannar</option>
                            <option value="Matale">Matale</option>
                            <option value="Matara">Matara</option>
                            <option value="Monaragala">Monaragala</option>
                            <option value="Mullaitivu">Mullaitivu</option>
                            <option value="Nuwara Eliya">Nuwara Eliya</option>
                            <option value="Polonnaruwa">Polonnaruwa</option>
                            <option value="Puttalam">Puttalam</option>
                            <option value="Ratnapura">Ratnapura</option>
                            <option value="Trincomalee">Trincomalee</option>
                            <option value="Vavuniya">Vavuniya</option>
                        </select>

                        <select
                            name="growthStage"
                            value={formData.growthStage}
                            onChange={handleChange}
                        >
                            <option value="">Select Growth Stage</option>
                            <option value="planted">Planted</option>
                            <option value="growing">Growing</option>
                            <option value="ready_for_harvest">Ready for Harvest</option>
                            <option value="harvested">Harvested</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Harvest Date"
                            onFocus={(e) => (e.target.type = "date")}
                            onBlur={(e) => {
                                if (!e.target.value) e.target.type = "text";
                            }}
                            name="harvestDate"
                            value={formData.harvestDate}
                            onChange={handleChange}
                        />

                        <div className="upload-section">
                            <label>Upload Photos (Max 3)</label>

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
                                Next
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => navigate("/farmer")}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-section">
                        <h3>Pricing Information</h3>

                        <input
                            type="number"
                            name="price"
                            placeholder="Price Per Kg"
                            value={formData.price}
                            onChange={handleChange}
                        />

                        {loadingSuggestion && <p className="suggestion-loading">Loading price suggestion...</p>}

                        {!loadingSuggestion && suggestion && suggestion.suggested_price !== null && (
                            <div className="price-suggestion-box">
                                {suggestion.basis === 'district' ? (
                                    <>
                                        <p className="suggestion-info">
                                            ℹ Suggested price: <strong>Rs. {suggestion.suggested_price} / kg</strong>
                                        </p>
                                        <p className="suggestion-subtext">
                                            Based on {suggestion.sample_count} similar listings in your district.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="suggestion-info">
                                            No local data yet. National average for this crop: <strong>Rs. {suggestion.suggested_price} / kg</strong>
                                        </p>
                                        <p className="suggestion-subtext">
                                            Based on {suggestion.sample_count} listings across Sri Lanka.
                                        </p>
                                    </>
                                )}
                                <div className="suggestion-actions">
                                    <button
                                        type="button"
                                        className="use-suggestion-btn"
                                        onClick={() => setFormData(prev => ({ ...prev, price: suggestion.suggested_price }))}
                                    >
                                        Use Average Price
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loadingSuggestion && (!suggestion || suggestion.suggested_price === null) && (
                            <div className="price-suggestion-box" style={{ background: '#f5f5f5', borderColor: '#ddd' }}>
                                <p className="suggestion-info" style={{ color: '#666' }}>
                                    ℹ No historical pricing data available for "{formData.cropName || 'this crop'}".
                                </p>
                            </div>
                        )}

                        <div className="btn-group">
                            <button
                                className="next-btn"
                                onClick={() => setStep(3)}
                            >
                                Next
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-section">
                        <h3>Review Crop Details</h3>

                        <div className="review-box">
                            <p><strong>Crop Name:</strong> {formData.cropName}</p>
                            <p><strong>Category:</strong> {formData.category}</p>
                            <p><strong>Quantity:</strong> {formData.quantity} Kg</p>
                            <p><strong>Location:</strong> {formData.location}</p>
                            <p><strong>Growth Stage:</strong> {formData.growthStage}</p>
                            <p><strong>Harvest Date:</strong> {formData.harvestDate}</p>
                            <p><strong>Price:</strong> Rs. {formData.price}</p>
                            <p><strong>Uploaded Photos:</strong> {formData.photos.filter(Boolean).length}</p>
                        </div>

                        <div className="btn-group">
                            <button
                                className="submit-btn"
                                onClick={handleSubmit}
                            >
                                Submit Crop
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => setStep(2)}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddListing;
