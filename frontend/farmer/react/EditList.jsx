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
    stage: "Flowering",
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
    <div className="edit-container">

      {/* Progress */}

      <div className="steps">

        <div className={step >= 1 ? "step active" : "step"}>
          <div className="circle">1</div>
          <span>Crop Details</span>
        </div>

        <div className={step >= 2 ? "step active" : "step"}>
          <div className="circle">2</div>
          <span>Pricing</span>
        </div>

        <div className={step >= 3 ? "step active" : "step"}>
          <div className="circle">3</div>
          <span>Review</span>
        </div>

      </div>

      {/* STEP 1 */}

      {step === 1 && (
        <div className="card">

          <h2>Crop Details</h2>

          <div className="grid">

            <div>
              <label>Crop Name</label>
              <input
                type="text"
                name="cropName"
                value={formData.cropName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Growth Stage</label>
              <input
                type="text"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option>Vegetable</option>
                <option>Fruit</option>
                <option>Grain</option>
              </select>
            </div>

            <div>
              <label>Expected Harvest Date</label>
              <input
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Quantity (kg)</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="buttons">
            <button className="cancel-btn" onClick={() => navigate(-1)}>
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
        <div className="card">

          <h2>Pricing</h2>

          <label>Price Per Kg (Rs)</label>

          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
          />

          <div className="buttons">

            <button className="cancel-btn" onClick={prevStep}>
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
        <div className="card">

          <h2>Review Listing</h2>

          <div className="review">

            <p><b>Crop:</b> {formData.cropName}</p>
            <p><b>Category:</b> {formData.category}</p>
            <p><b>Quantity:</b> {formData.quantity} kg</p>
            <p><b>Harvest Date:</b> {formData.harvestDate}</p>
            <p><b>Price:</b> Rs.{formData.price}</p>

          </div>

          <div className="buttons">

            <button className="cancel-btn" onClick={prevStep}>
              Back
            </button>

            <button
              className="update-btn"
              onClick={updateListing}
            >
              Update Listing
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default EditList;