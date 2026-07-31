import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../csss/Complaints.css";

function ComplaintPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      setMsg({ text: t("errors.selectOrderComplaint"), ok: false });
      return;
    }
    if (!description.trim()) {
      setMsg({ text: t("errors.describeIssueDetail"), ok: false });
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
        setMsg({ text: data.message || t("errors.submissionFailed"), ok: false });
      }
    } catch (err) {
      setMsg({ text: t("errors.networkXamppError"), ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="content">

        {/* Header */}
        <div className="page-header">
          <h1>{t("complaints.title")}</h1>
          <p>{t("complaints.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className="tab active">{t("complaints.submitComplaintTab")}</button>
          <button
            className="tab"
            onClick={() => navigate("/farmer-response")}
          >
            {t("complaints.farmerResponseTab")}
          </button>
        </div>

        {/* Complaint Form */}
        <div className="complaint-card">
          <form onSubmit={handleSubmit}>
            <div className="card-top">
              <h3>{t("complaints.submitHeading")}</h3>
              <span className="buyer-tag">{t("complaints.buyerView")}</span>
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

            <label>{t("complaints.selectOrderLabel")}</label>
            {fetchLoading ? (
              <div style={{ padding: "10px 0", fontSize: "14px", color: "#666" }}>{t("orders.loadingOrders")}</div>
            ) : (
              <select
                className="input-field"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                required
              >
                <option value="">{t("forms.selectOrderPlaceholder")}</option>
                {orders.length === 0 ? (
                  <option value="" disabled>{t("emptyStates.noEligibleOrders")}</option>
                ) : (
                  orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderId} - {ord.cropName} - {ord.date}
                    </option>
                  ))
                )}
              </select>
            )}

            <label>{t("complaints.reasonLabel")}</label>
            <select
              className="input-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Crop quality does not match listing">{t("complaints.reasonOption1")}</option>
              <option value="Late Delivery">{t("complaints.reasonOption2")}</option>
              <option value="Wrong Quantity">{t("complaints.reasonOption3")}</option>
              <option value="Damaged Product">{t("complaints.reasonOption4")}</option>
            </select>

            <label>{t("forms.description")}</label>
            <textarea
              className="input-field"
              rows="5"
              placeholder={t("complaints.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <label>{t("complaints.evidenceLabel")}</label>
            <div className="upload-box">
              <label htmlFor="photo-upload" className="upload-area" style={{ cursor: "pointer" }}>
                {uploadMsg ? t("forms.selectedFile", { filename: uploadMsg }) : t("complaints.evidenceClick")}
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
              {loading ? t("btnSubmitting", "Submitting...") : t("buttons.submitComplaint")}
            </button>
          </form>
        </div>

        {/* Flow Section */}
        <div className="flow-card">
          <h3>{t("complaints.flowHeading")}</h3>

          <div className="flow">
            <div className="flow-step active-step">
              {t("complaints.flowStep1")}
            </div>
            <span>→</span>
            <div className="flow-step">
              {t("complaints.flowStep2")}
            </div>
            <span>→</span>
            <div className="flow-step">
              {t("complaints.flowStep3")}
            </div>
            <span>→</span>
            <div className="flow-step">
              {t("complaints.flowStep4")}
            </div>
            <span>→</span>
            <div className="flow-step">
              {t("complaints.flowStep5")}
            </div>
          </div>
        </div>

        {/* Admin Section Demo View */}
        <div className="admin-card">
          <div className="admin-top">
            <h3>{t("complaints.adminResolveTitle", { id: "019" })}</h3>
            <span className="evidence-tag">
              {t("complaints.evidenceReceived")}
            </span>
          </div>

          <div className="evidence-box">
            <p><strong>Buyer:</strong> Wilted leeks, 8kg short.</p>
            <p><strong>Farmer:</strong> Produce was fresh at collection.</p>
            <p><strong>Evidence:</strong> 1 photo uploaded by buyer.</p>
          </div>

          <label>{t("complaints.adminNotes")}</label>
          <textarea
            className="input-field"
            rows="5"
            placeholder={t("complaints.descriptionPlaceholder")}
            readOnly
            defaultValue={t("complaints.adminNotesPlaceholder")}
          />
          <div className="action-buttons">
            <button className="refund-btn" onClick={() => alert("Refund option selected by Admin")}>
              {t("buttons.refund")}
            </button>
            <button className="delivery-btn" onClick={() => alert("Re-delivery option selected by Admin")}>
              {t("buttons.redelivery")}
            </button>
            <button className="dismiss-btn" onClick={() => alert("Dispute dismissed by Admin")}>
              {t("buttons.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintPage;