import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../csss/EditList.css";
import { useAuth } from "../../../src/context/AuthContext";

function EditList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

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
      const response = await fetch("/backend/updateCrop.php", {
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
        alert("Listing Updated Successfully!");
        navigate("/");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Update failed.");
    }
  };

  return (
    <div className="add-listing-container">

      <div className="listing-card">
        <h2>Edit Listing</h2>

        {/* STEP CIRCLES + LABELS PAIRED TOGETHER */}
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
                    Use Suggested Price
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
              <p><b>Location:</b> {formData.location}</p>
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
