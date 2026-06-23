import React from "react";
import "../../buyer/csss/Complaints.css";

function ComplaintPage() {
  return (
    <div className="dashboard">
      <div className="content">

        {/* Header */}
        <div className="page-header">
          <h1>Complaint & Dispute Resolution</h1>
          <p>Fair resolution for every transaction</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className="tab active">Submit Complaint</button>
          <button className="tab">Farmer Response</button>
        </div>

        {/* Complaint Form */}
        <div className="complaint-card">

          <div className="card-top">
            <h3>SUBMIT A COMPLAINT</h3>
            <span className="buyer-tag">Buyer View</span>
          </div>

          <div className="order-info">
            <strong>Order #2035</strong> — 80kg Leeks — Completed May 25 — Rs 7,200
          </div>

          <label>Complaint Reason</label>

          <select className="input-field">
            <option>Crop quality does not match listing</option>
            <option>Late Delivery</option>
            <option>Wrong Quantity</option>
            <option>Damaged Product</option>
          </select>

          <label>Description</label>

          <textarea
            className="input-field"
            rows="5"
            defaultValue="Received leeks were wilted and not fresh as described. Weight was also short by about 8 kg."
          />

          <label>Evidence Photo (Optional)</label>

          <div className="upload-box">
            📷 Upload photo evidence
          </div>

          <button className="submit-btn">
            Submit Complaint
          </button>

        </div>

        {/* Flow Section */}
        <div className="flow-card">
          <h3>DISPUTE RESOLUTION FLOW</h3>

          <div className="flow">

            <div className="flow-step active-step">
              Buyer Submits
            </div>

            <span>→</span>

            <div className="flow-step">
              Admin Notified
            </div>

            <span>→</span>

            <div className="flow-step">
              Farmer Responds
            </div>

            <span>→</span>

            <div className="flow-step">
              Admin Reviews
            </div>

            <span>→</span>

            <div className="flow-step">
              Resolved
            </div>

          </div>
        </div>

        {/* Admin Section */}
        <div className="admin-card">

          <div className="admin-top">
            <h3>ADMIN - RESOLVE COMPLAINT #C019</h3>

            <span className="evidence-tag">
              Evidence Received
            </span>
          </div>

          <div className="evidence-box">
            <p><strong>Buyer:</strong> Wilted leeks, 8kg short.</p>
            <p><strong>Farmer:</strong> Produce was fresh at collection.</p>
            <p><strong>Evidence:</strong> 1 photo uploaded by buyer.</p>
          </div>

          <label>Admin Notes</label>

          <textarea
            className="input-field"
            rows="4"
            defaultValue="Photo evidence supports quality issue. Recommend partial refund of Rs.720."
          />

          <div className="action-buttons">

            <button className="refund-btn">
              Resolve - Refund
            </button>

            <button className="delivery-btn">
              Resolve - Re-delivery
            </button>

            <button className="dismiss-btn">
              Dismiss
            </button>

          </div>

        </div>

        {/* Footer Space */}
        {/* <div className="footer-space"></div> */}

      </div>
    </div>
  );
}

export default ComplaintPage;