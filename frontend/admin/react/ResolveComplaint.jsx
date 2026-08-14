import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../buyer/csss/Complaints.css";
import { useAuth } from "../../../src/context/AuthContext";

function ResolveComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [adminNotes, setAdminNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/backend/get_complaint_details.php?complaint_id=${id}`, {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        setAdminNotes(data.complaint.adminNotes || "");
      } else {
        setError(data.message || data.error || t("admin.errors.failedLoadComplaint"));
      }
    } catch (err) {
      console.error(err);
      setError(t("admin.errors.networkErrorComplaint"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchComplaintDetails();
    } else if (user) {
      setError(t("admin.errors.unauthorizedAdmin"));
      setLoading(false);
    }
  }, [id, user]);

  const handleResolveAction = async (action) => {
    if (!adminNotes.trim()) {
      setMsg({ 
        text: t("admin.complaints.notesRequired", "Admin notes are required before taking action."), 
        ok: false 
      });
      return;
    }

    setResolving(true);
    setMsg({ text: "", ok: false });

    const resolutionStatus = (action === "dismiss" || action === "dismissed") ? "rejected" : "resolved";

    try {
      const response = await fetch("/backend/resolve_complaint.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          complaint_id: parseInt(id),
          action: action,
          resolution_action: action,
          resolution_status: resolutionStatus,
          admin_notes: adminNotes.trim()
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setMsg({ text: data.message || t("admin.complaints.actionSuccess", "Resolution updated successfully."), ok: true });
        fetchComplaintDetails(); // Refresh to update status and notes
      } else {
        setMsg({ text: data.message || data.error || t("admin.errors.resolutionFailed"), ok: false });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: t("admin.errors.networkErrorSubmit"), ok: false });
    } finally {
      setResolving(false);
    }
  };

  const getStepClass = (stepName) => {
    if (!complaint) return "flow-step";
    const steps = ["submitted", "admin_notified", "farmer_responded", "under_review", "resolved"];
    const currentIdx = steps.indexOf(complaint.status);
    const stepIdx = steps.indexOf(stepName);
    if (stepIdx === currentIdx) return "flow-step active-step";
    if (stepIdx < currentIdx) return "flow-step completed-step";
    return "flow-step";
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="content" style={{ textAlign: "center", padding: "50px 0" }}>
          <h2>{t("admin.complaints.loadingDetails", "Loading complaint details...")}</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="content" style={{ textAlign: "center", padding: "50px 0", color: "#c0392b" }}>
          <h2>{t("admin.errors.error", "Error")}</h2>
          <p>{error}</p>
          <button className="submit-btn" style={{ width: "auto", marginTop: "20px" }} onClick={() => navigate("/admin")}>
            {t("admin.complaints.btnBackDashboard", "Back to Dashboard")}
          </button>
        </div>
      </div>
    );
  }

  const statusLower = (complaint.dbStatus || "").toLowerCase();
  const isResolved = ["resolved", "dismissed", "rejected"].includes(statusLower);
  const isRejected = ["rejected", "dismissed"].includes(statusLower);
  const isResolvedStatus = statusLower === "resolved";

  return (
    <div className="dashboard">
      <div className="content">
        
        {/* Header */}
        <div className="page-header">
          <h1>{t("admin.complaints.panelTitle")}</h1>
          <p>{t("admin.complaints.panelSub")}</p>
          <button className="tab" style={{ cursor: "pointer", border: "1px solid #ccc", padding: "5px 15px", borderRadius: "5px", background: "#f9f9f9" }} onClick={() => navigate("/admin")}>
            ← {t("admin.complaints.btnBackDashboard", "Back to Dashboard")}
          </button>
        </div>

        {/* Stepper Flow */}
        <div className="flow-card">
          <h3>{t("admin.complaints.flowTitle")}</h3>
          <div className="flow">
            <div className={getStepClass("submitted")}>{t("admin.complaints.flowBuyerSubmits")}</div>
            <span>→</span>
            <div className={getStepClass("admin_notified")}>{t("admin.complaints.flowAdminNotified")}</div>
            <span>→</span>
            <div className={getStepClass("farmer_responded")}>{t("admin.complaints.flowFarmerResponds")}</div>
            <span>→</span>
            <div className={getStepClass("under_review")}>{t("admin.complaints.flowAdminReviews")}</div>
            <span>→</span>
            <div className={getStepClass("resolved")}>{t("admin.complaints.flowResolved")}</div>
          </div>
        </div>

        {/* Complaint Detail Card */}
        <div className="complaint-card">
          <div className="card-top">
            <h3>{t("admin.complaints.resolveComplaintTitle", { id: complaint.id })}</h3>
            <span className="evidence-tag" style={{ 
              background: isResolvedStatus ? "#eaf5ec" : (isRejected ? "#fce4e4" : "#fff3cd"), 
              color: isResolvedStatus ? "#2d6a4f" : (isRejected ? "#c0392b" : "#856404"), 
              border: isResolvedStatus ? "1px solid #cce5d3" : (isRejected ? "1px solid #f5c2c2" : "1px solid #ffeeba") 
            }}>
              {t("admin.complaints.statusLabel", { status: (complaint.dbStatus || "").toUpperCase() })}
            </span>
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

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
            <div>
              <p><strong>{t("admin.complaints.orderIdLabel")}</strong> {complaint.orderId}</p>
              <p><strong>{t("admin.complaints.cropItemLabel")}</strong> {complaint.cropName}</p>
              <p><strong>{t("admin.complaints.filingDateLabel")}</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>{t("admin.complaints.buyerNameLabel")}</strong> {complaint.buyerName} ({complaint.buyerEmail})</p>
              <p><strong>{t("admin.complaints.farmerNameLabel")}</strong> {complaint.farmerName} ({complaint.farmerEmail})</p>
              <p><strong>{t("admin.complaints.disputeReasonLabel")}</strong> <span style={{ color: "#c0392b", fontWeight: "600" }}>{complaint.reason}</span></p>
            </div>
          </div>

          {/* Core Quotes Panel */}
          <div className="evidence-box" style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "8px", padding: "20px", marginBottom: "25px" }}>
            <h4 style={{ marginTop: 0, borderBottom: "1px solid #dee2e6", paddingBottom: "8px" }}>{t("admin.complaints.statementsHeader")}</h4>
            <p><strong>{t("admin.complaints.buyerStatementLabel")}</strong> <span style={{ color: "#495057", fontStyle: "italic" }}>"{complaint.description}"</span></p>
            <p><strong>{t("admin.complaints.farmerStatementLabel")}</strong> {complaint.farmerResponse ? (
              <span style={{ color: "#495057", fontStyle: "italic" }}>"{complaint.farmerResponse}"</span>
            ) : (
              <span style={{ color: "#7f8c8d", fontStyle: "italic" }}>{t("admin.complaints.awaitingFarmerResponse")}</span>
            )}</p>
            
            <p style={{ marginBottom: 0 }}><strong>{t("admin.complaints.evidenceFileLabel")}</strong> {complaint.evidenceFile ? (
              <a href={complaint.evidenceFile} target="_blank" rel="noopener noreferrer" style={{ color: "#1a5c2d", fontWeight: "600", textDecoration: "underline" }}>
                {t("admin.complaints.viewEvidenceLink")}
              </a>
            ) : (
              <span style={{ color: "#7f8c8d" }}>{t("admin.complaints.noFilesUploaded")}</span>
            )}</p>
          </div>

          {/* Admin Input Notes */}
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>{t("admin.complaints.adminNotesLabel")}</label>
          <textarea
            className="input-field"
            rows="5"
            placeholder={t("admin.complaints.adminNotesPlaceholder")}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            disabled={isResolved || resolving}
            style={{ width: "100%", padding: "12px", border: "1px solid #ced4da", borderRadius: "6px", marginBottom: "25px" }}
          />

          {/* Controls */}
          {isResolved ? (
            <div style={{ background: "#e9ecef", color: "#495057", padding: "15px", borderRadius: "6px", textAlign: "center", fontWeight: "600" }}>
              {t("admin.complaints.complaintResolvedVia", { action: (complaint.resolutionAction || complaint.dbStatus || "N/A").toUpperCase() })}
            </div>
          ) : (
            <div className="action-buttons" style={{ display: "flex", gap: "10px" }}>
              <button 
                className="refund-btn" 
                onClick={() => handleResolveAction("refund")}
                disabled={resolving}
                style={{ flex: 1, padding: "12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                {t("admin.complaints.btnRefund")}
              </button>
              <button 
                className="delivery-btn" 
                onClick={() => handleResolveAction("re-delivery")}
                disabled={resolving}
                style={{ flex: 1, padding: "12px", background: "#f39c12", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                {t("admin.complaints.btnRedelivery")}
              </button>
              <button 
                className="dismiss-btn" 
                onClick={() => handleResolveAction("dismiss")}
                disabled={resolving}
                style={{ flex: 1, padding: "12px", background: "#7f8c8d", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                {t("admin.complaints.btnDismiss")}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ResolveComplaint;
