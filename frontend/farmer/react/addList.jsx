import React, { useState } from "react";
import "../csss/addList.css";

function AddListing() {
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        cropName: "",
        category: "",
        quantity: "",
        growthStage: "",
        harvestDate: "",
        price: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // const handleSubmit = () => {
    //     alert("Listing Submitted Successfully!");
    //     console.log(formData);
    // };
    const handleSubmit = async () => {
        try {
            const response = await fetch(
                "/backend/addCrop.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                    credentials: "include",
                }
            );

            const result = await response.json();

            if (result.success) {
                alert("Listing Submitted Successfully!");
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="add-listing-container">
            <div className="listing-card">
                <h2>Add New Listing</h2>

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
                            type="date"
                            name="harvestDate"
                            value={formData.harvestDate}
                            onChange={handleChange}
                        />

                        <div className="upload-section">
                            <label>Upload Photos</label>

                            <div className="photo-boxes">
                                <div className="photo-box">+</div>
                                <div className="photo-box">+</div>
                                <div className="photo-box">+</div>
                            </div>

                            <input type="file" multiple />
                        </div>

                        <button
                            className="next-btn"
                            onClick={() => setStep(2)}
                        >
                            Next
                        </button>
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
                                className="back-btn"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </button>

                            <button
                                className="next-btn"
                                onClick={() => setStep(3)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-section">
                        <h3>Review Listing</h3>

                        <div className="review-box">
                            <p><strong>Crop Name:</strong> {formData.cropName}</p>
                            <p><strong>Category:</strong> {formData.category}</p>
                            <p><strong>Quantity:</strong> {formData.quantity} Kg</p>
                            <p><strong>Growth Stage:</strong> {formData.growthStage}</p>
                            <p><strong>Harvest Date:</strong> {formData.harvestDate}</p>
                            <p><strong>Price:</strong> Rs. {formData.price}</p>
                        </div>

                        <div className="btn-group">
                            <button
                                className="back-btn"
                                onClick={() => setStep(2)}
                            >
                                Back
                            </button>

                            <button
                                className="submit-btn"
                                onClick={handleSubmit}
                            >
                                Submit Listing
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddListing;