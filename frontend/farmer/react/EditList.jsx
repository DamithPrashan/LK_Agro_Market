import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../csss/EditList.css";

function EditList() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    cropName: state?.cropName || "",
    category: state?.category || "",
    quantity: state?.quantity || "",
    harvestDate: state?.harvestDate || "",
    price: state?.price || "",
    stage: state?.stage || "Flowering",
  });

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

  const updateListing = () => {
    alert("Listing Updated Successfully!");
    navigate("/");
  };

  return (
    <div className="add-listing-container">

      <div className="listing-card">
        <h2>Edit Listing</h2>

        {/* STEP CIRCLES */}
        <div className="stepper">
          <div className={`step ${step >= 1 ? "active-step" : ""}`}>1</div>
          <div className={`step ${step >= 2 ? "active-step" : ""}`}>2</div>
          <div className={`step ${step >= 3 ? "active-step" : ""}`}>3</div>
        </div>

        {/* STEP LABELS */}
        <div className="step-labels">
          <span className={step >= 1 ? "active-label" : ""}>Crop Details</span>
          <span className={step >= 2 ? "active-label" : ""}>Pricing</span>
          <span className={step >= 3 ? "active-label" : ""}>Review</span>
        </div>

        {/* STEP 1 */}
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

            <input
              type="text"
              name="stage"
              placeholder="Growth Stage"
              value={formData.stage}
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
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
            />

            <input
              type="number"
              name="quantity"
              placeholder="Quantity (kg)"
              value={formData.quantity}
              onChange={handleChange}
            />

            <div className="btn-group">
              <button className="back-btn" onClick={() => navigate(-1)}>
                Cancel
              </button>

              <button className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="form-section">
            <h3>Pricing</h3>

            <input
              type="number"
              name="price"
              placeholder="Price Per Kg"
              value={formData.price}
              onChange={handleChange}
            />

            <div className="btn-group">
              <button className="back-btn" onClick={prevStep}>
                Back
              </button>

              <button className="next-btn" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="form-section">
            <h3>Review Listing</h3>

            <div className="review-box">
              <p><b>Crop:</b> {formData.cropName}</p>
              <p><b>Category:</b> {formData.category}</p>
              <p><b>Quantity:</b> {formData.quantity} kg</p>
              <p><b>Growth Stage:</b> {formData.stage}</p>
              <p><b>Harvest Date:</b> {formData.harvestDate}</p>
              <p><b>Price:</b> Rs. {formData.price}</p>
            </div>

            <div className="btn-group">
              <button className="back-btn" onClick={prevStep}>
                Back
              </button>

              <button className="submit-btn" onClick={updateListing}>
                Update Listing
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default EditList;