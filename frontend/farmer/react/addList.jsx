import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../csss/addList.css";

function AddListing() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        cropName: "",
        category: "",
        quantity: "",
        growthStage: "",
        harvestDate: "",
        price: "",
        photos: [null, null, null], // Initialize an array with 3 spots
    });

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

                <div className="stepper">
                    <div className={`step ${step >= 1 ? "active-step" : ""}`}>1</div>
                    <div className={`step ${step >= 2 ? "active-step" : ""}`}>2</div>
                    <div className={`step ${step >= 3 ? "active-step" : ""}`}>3</div>
                </div>

                <div className="step-labels">
                    <span>Crop Details</span>
                    <span>Pricing</span>
                    <span>Review</span>
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

                        <div className="suggestion-box">
                            <p>Suggested Market Price</p>
                            <h4>Rs. 250 / Kg</h4>
                        </div>

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