import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../csss/Complaints.css";

function ComplaintPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("Crop quality does not match listing");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", ok: false });

  // Fetch completed/active orders of the logged-in buyer
  useEffect(() => {
    const fetchOrders = async () => {
      setFetchLoading(true);
      try {
        const response = await fetch("/backend/get_buyer_complaint_orders.php");
        const data = await response.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
          // Set default selected order if orders exist
          if (data.orders.length > 0) {
            setSelectedOrderId(data.orders[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
      setUploadMsg(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setMsg({ text: "Please select an order to file a complaint against.", ok: false });
      return;
    }
    if (!description.trim()) {
      setMsg({ text: "Please describe the issue in detail.", ok: false });
      return;
    }

    setLoading(true);
    setMsg({ text: "", ok: false });

    const formData = new FormData();
    formData.append("order_id", selectedOrderId);
    formData.append("reason", reason);
    formData.append("description", description);
    if (evidenceFile) {
      formData.append("evidence", evidenceFile);
    }

    try {
      const response = await fetch("/backend/submit_complaint.php", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setMsg({ text: data.message, ok: true });
        setDescription("");
        setEvidenceFile(null);
        setUploadMsg("");
      } else {
        setMsg({ text: data.message || "Submission failed. Please try again.", ok: false });
      }
    } catch (err) {
      setMsg({ text: "Network error. Make sure XAMPP is running.", ok: false });
    } finally {
      setLoading(false);
    }
  };

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
          <button
            className="tab"
            onClick={() => navigate("/farmer-response")}
          >
            Farmer Response
          </button>
        </div>

        {/* Complaint Form */}
        <div className="complaint-card">
          <form onSubmit={handleSubmit}>
            <div className="card-top">
              <h3>SUBMIT A COMPLAINT</h3>
              <span className="buyer-tag">Buyer View</span>
            </div>

            {msg.text && (
              <div style={{
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: "600",
                background: msg.ok ? "#eaf5ec" : "#fce4e4",
                color: msg.ok ? "#2d6a4f" : "#c0392b",
                border: msg.ok ? "1px solid #cce5d3" : "1px solid #f5c2c2"
              }}>
                {msg.text}
              </div>
            )}

            <label>Select Your Order</label>
            {fetchLoading ? (
              <div style={{ padding: "10px 0", fontSize: "14px", color: "#666" }}>Loading your orders...</div>
            ) : (
              <select
                className="input-field"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                required
              >
                <option value="">-- Select Order --</option>
                {orders.length === 0 ? (
                  <option value="" disabled>No eligible orders found</option>
                ) : (
                  orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderId} - {ord.cropName} - {ord.date}
                    </option>
                  ))
                )}
              </select>
            )}

            <label>Complaint Reason</label>
            <select
              className="input-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option>Crop quality does not match listing</option>
              <option>Late Delivery</option>
              <option>Wrong Quantity</option>
              <option>Damaged Product</option>
            </select>

            <label>Description</label>
            <textarea
              className="input-field"
              rows="5"
              placeholder="Please describe the issue in detail, including any quality problems, quantity differences, delivery issues, or other concerns related to your order."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <label>Evidence Photo (Optional)</label>
            <div className="upload-box">
              <label htmlFor="photo-upload" className="upload-area" style={{ cursor: "pointer" }}>
                {uploadMsg ? `Selected File: ${uploadMsg}` : "Click here to upload photo evidence"}
              </label>

              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
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

        {/* Admin Section Demo View */}
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
            rows="5"
            placeholder="Please describe the issue in detail, including any quality problems, quantity differences, delivery issues, or other concerns related to your order."
            readOnly
            defaultValue="Admin reviews the uploaded dispute photos and buyer/farmer description to issue refunds or redelivery."
          />
          <div className="action-buttons">
            <button className="refund-btn" onClick={() => alert("Refund option selected by Admin")}>
              Resolve - Refund
            </button>
            <button className="delivery-btn" onClick={() => alert("Re-delivery option selected by Admin")}>
              Resolve - Re-delivery
            </button>
            <button className="dismiss-btn" onClick={() => alert("Dispute dismissed by Admin")}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintPage;