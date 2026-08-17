import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../csss/Complaints.css";

function ComplaintPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: "submit" or "farmer_response"
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    urlTab === "farmer_response" || urlTab === "responses" ? "farmer_response" : "submit"
  );

  const highlightedId = searchParams.get("id") ? parseInt(searchParams.get("id"), 10) : null;

  // Sync tab state from URL params
  useEffect(() => {
    if (urlTab === "farmer_response" || urlTab === "responses") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("farmer_response");
    } else if (urlTab === "submit") {
      setActiveTab("submit");
    }
  }, [urlTab]);

  // Form State
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("Crop quality does not match listing");
  const [description, setDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchOrdersLoading, setFetchOrdersLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", ok: false });

  // Buyer Complaints List State
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState("");

  // Fetch completed/active orders of the logged-in buyer for submission
  useEffect(() => {
    const fetchOrders = async () => {
      setFetchOrdersLoading(true);
      try {
        const response = await fetch("/backend/get_buyer_complaint_orders.php", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
          if (data.orders.length > 0) {
            setSelectedOrderId(data.orders[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setFetchOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Fetch real buyer complaints from backend
  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    setComplaintsError("");
    try {
      const response = await fetch("/backend/get_buyer_complaints.php", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.complaints) {
        setComplaints(data.complaints);
      } else {
        setComplaintsError(data.message || t("complaints.failedLoadComplaints"));
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
      setComplaintsError(t("complaints.failedLoadComplaints"));
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComplaints();
    // The initial complaint history load intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle deep-link scrolling to a specific complaint card
  useEffect(() => {
    if (activeTab === "farmer_response" && highlightedId && complaints.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`complaint-card-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, highlightedId, complaints]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabName);
    if (tabName !== "farmer_response") {
      newParams.delete("id");
    }
    setSearchParams(newParams);
    if (tabName === "farmer_response") {
      fetchComplaints();
    }
  };

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
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setMsg({ text: data.message, ok: true });
        setDescription("");
        setEvidenceFile(null);
        setUploadMsg("");
        fetchComplaints(); // Refresh complaints in background
      } else {
        setMsg({ text: data.message || t("errors.submissionFailed"), ok: false });
      }
    } catch {
      setMsg({ text: t("errors.networkXamppError"), ok: false });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.replace(/-/g, "/"));
      const locale = i18n.language === "en" ? "en-US" : (i18n.language === "si" ? "si-LK" : "ta-LK");
      return d.toLocaleString(locale);
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "submitted") return <span className="status-badge submitted">Pending Admin Review</span>;
    if (s === "awaiting_farmer_response") return <span className="status-badge awaiting-farmer">Farmer Action Requested</span>;
    if (s === "resolved") return <span className="status-badge resolved">Resolved</span>;
    if (s === "dismissed") return <span className="status-badge dismissed">Dismissed</span>;
    if (s === "submitted" || s === "pending") {
      return <span className="status-badge submitted">⏳ {t("complaints.statusSubmitted")}</span>;
    } else if (s === "farmer_responded" || s === "under_review") {
      return <span className="status-badge farmer_responded">💬 {t("complaints.statusFarmerResponded")}</span>;
    } else if (s === "resolved") {
      return <span className="status-badge resolved">✅ {t("complaints.statusResolved")}</span>;
    } else if (s === "rejected" || s === "dismissed") {
      return <span className="status-badge rejected">❌ {t("complaints.statusRejected")}</span>;
    }
    return <span className="status-badge">{status}</span>;
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
          <button
            className={`tab ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => handleTabChange("submit")}
          >
            {t("complaints.submitComplaintTab")}
          </button>
          <button
            className={`tab ${activeTab === "farmer_response" ? "active" : ""}`}
            onClick={() => handleTabChange("farmer_response")}
          >
            {t("complaints.farmerResponseTab")}
          </button>
        </div>

        {/* TAB 1: SUBMIT COMPLAINT */}
        {activeTab === "submit" && (
          <>
            {/* Complaint Form */}
            <div className="complaint-card">
              <form onSubmit={handleSubmit}>
                <div className="card-top">
                  <h3>{t("complaints.submitHeading")}</h3>
                  <span className="buyer-tag">{t("complaints.buyerView")}</span>
                </div>

                {msg.text && (
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      marginBottom: "20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: msg.ok ? "#eaf5ec" : "#fce4e4",
                      color: msg.ok ? "#2d6a4f" : "#c0392b",
                      border: msg.ok ? "1px solid #cce5d3" : "1px solid #f5c2c2",
                    }}
                  >
                    {msg.text}
                  </div>
                )}

                <label>{t("complaints.selectOrderLabel")}</label>
                {fetchOrdersLoading ? (
                  <div style={{ padding: "10px 0", fontSize: "14px", color: "#666" }}>
                    {t("orders.loadingOrders")}
                  </div>
                ) : (
                  <select
                    className="input-field"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    required
                  >
                    <option value="">{t("forms.selectOrderPlaceholder")}</option>
                    {orders.length === 0 ? (
                      <option value="" disabled>
                        {t("emptyStates.noEligibleOrders")}
                      </option>
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
          </>
        )}

        {/* TAB 2: FARMER RESPONSE & DISPUTE STATUS */}
        {activeTab === "farmer_response" && (
          <div className="complaints-list-container">
            {complaintsLoading && (
              <div className="complaints-loading">
                <p>{t("complaints.loadingComplaints")}</p>
              </div>
            )}

            {complaintsError && (
              <div className="complaints-error">
                <p style={{ color: "#c0392b", fontWeight: "600", marginBottom: "12px" }}>{complaintsError}</p>
                <button className="submit-btn" onClick={fetchComplaints}>
                  {t("buttons.retry", "Retry")}
                </button>
              </div>
            )}

            {!complaintsLoading && !complaintsError && complaints.length === 0 && (
              <div className="empty-state-card">
                <div className="empty-icon">📋</div>
                <h3>{t("complaints.noComplaintsYet")}</h3>
                <p>{t("complaints.noComplaintsDesc")}</p>
                <button
                  className="switch-tab-btn"
                  onClick={() => handleTabChange("submit")}
                >
                  {t("complaints.submitComplaintBtn")}
                </button>
              </div>
            )}

            {!complaintsLoading && !complaintsError && complaints.length > 0 && (
              complaints.map((c) => {
                const isHighlighted = highlightedId === c.id;

                return (
                  <div
                    key={c.id}
                    id={`complaint-card-${c.id}`}
                    className={`complaint-item-card ${isHighlighted ? "highlighted" : ""}`}
                  >
                    {/* Header */}
                    <div className="complaint-item-header">
                      <div className="complaint-item-title">
                        <h3>
                          {t("complaints.disputeNumber", { id: c.id })} — {c.crop_name}
                          {isHighlighted && (
                            <span className="highlight-badge">
                              {t("complaints.selectedDisputeBadge")}
                            </span>
                          )}
                        </h3>
                        <div className="complaint-meta-info">
                          <span>
                            <strong>{t("complaints.orderNumber", { id: c.reservation_id })}</strong>
                          </span>
                          <span>
                            <strong>{t("complaints.farmerLabel")}:</strong> {c.farmer_name || "Farmer"}
                          </span>
                          <span>
                            {t("complaints.submittedOn", { date: formatDate(c.created_at) })}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(c.status)}</div>
                    </div>

                    {/* Buyer's Issue Description */}
                    <div className="dispute-section-box buyer-issue-box">
                      <div className="reason-row">{c.reason}</div>
                      <div className="desc-row">"{c.description}"</div>
                      {c.evidence_file && (
                        <a
                          href={c.evidence_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="evidence-attachment"
                        >
                          📷 {t("complaints.evidenceBuyer")}
                        </a>
                      )}
                    </div>

                    {c.status === "submitted" && (
                      <div className="buyer-complaint-state pending-review-state">
                        <strong>Pending Admin Review</strong>
                        <p>Your complaint has been submitted and is waiting for administrator review.</p>
                      </div>
                    )}

                    {/* Farmer response is shown only after resolution. */}
                    {c.status === "resolved" && c.farmer_response ? (
                      <div className="dispute-section-box farmer-response-box">
                        <div className="box-header">
                          <span>{t("complaints.farmerResponseHeading")}</span>
                          {c.farmer_responded_at && (
                            <span style={{ fontSize: "12px", fontWeight: "normal", color: "#166534" }}>
                              {t("complaints.respondedOn", { date: formatDate(c.farmer_responded_at) })}
                            </span>
                          )}
                        </div>
                        <div className="response-text">{c.farmer_response}</div>
                        {c.farmer_evidence_file && (
                          <a
                            href={c.farmer_evidence_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-attachment"
                          >
                            📷 {t("complaints.evidenceFarmer")}
                          </a>
                        )}
                      </div>
                    ) : c.status === "awaiting_farmer_response" ? (
                      <div className="waiting-response-box">
                        <span className="waiting-icon">⏳</span>
                        <div>
                          <strong>Farmer Action Requested</strong>
                          <p>The administrator has requested a response from the farmer. You will be notified when the farmer responds.</p>
                          {c.farmer_response_deadline && <span>Farmer response due by: {formatDate(c.farmer_response_deadline)}</span>}
                        </div>
                      </div>
                    ) : null}

                    {/* Admin Resolution (if resolved or rejected) */}
                    {(c.status === "resolved" || c.status === "dismissed") && (
                      <div className="dispute-section-box admin-resolution-box">
                        <div className="box-header">
                          <span>{c.status === "dismissed" ? "Dismissed" : "Resolved"}</span>
                          {c.resolution_action && (
                            <span className="admin-action-tag">
                              {t("complaints.resolutionActionLabel")}: {c.resolution_action}
                            </span>
                          )}
                        </div>
                        {c.status === "dismissed" && <p>This complaint was reviewed and closed by the administrator.</p>}
                        {c.admin_notes && (
                          <div className="admin-notes-text">
                            <strong>{t("complaints.adminNotesLabel")}:</strong> {c.admin_notes}
                          </div>
                        )}
                        {c.resolved_at && (
                          <div className="resolution-date">{c.status === "dismissed" ? "Dismissed" : "Resolved"} on {formatDate(c.resolved_at)}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintPage;
