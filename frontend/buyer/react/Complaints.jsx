import React from "react";
import "../../buyer/csss/complaints.css";

export default function ComplaintPage() {
  return (
    <div className="complaint-layout">

      <div className="complaint-content">

        <div className="page-header">
          <h2>Complaint & Dispute Resolution</h2>
          <p>Fair resolution for every transaction</p>
        </div>

        <div className="tabs">
          <button className="active">Submit Complaint</button>
          <button>Farmer Response</button>
        </div>

        <div className="complaint-card">

          <div className="card-title">
            <h3>SUBMIT A COMPLAINT</h3>

            <span className="buyer-tag">
              Buyer View
            </span>
          </div>

          <div className="order-box">
            <strong>Order #2035</strong> — 80 kg Leeks —
            Completed May 25 — Rs 7,200
          </div>

          <div className="form-group">

            <label>Complaint Reason</label>

            <select>

              <option>
                Crop quality does not match listing
              </option>

              <option>
                Wrong quantity
              </option>

              <option>
                Late delivery
              </option>

              <option>
                Payment issue
              </option>

            </select>

          </div>

          <div className="form-group">

            <label>Description</label>

            <textarea
              rows="6"
              defaultValue="Received leeks were wilted and not fresh as described. Weight was also short by about 8 kg."
            />

          </div>

          <div className="form-group">

            <label>
              Evidence Photo
              <span className="optional">
                (optional)
              </span>
            </label>

            <div className="upload-box">

              <input type="file" />

              <p>Upload photo evidence</p>

            </div>

          </div>

          <button className="submit-btn">
            Submit Complaint
          </button>

        </div>

      </div>

    </div>
  );
}