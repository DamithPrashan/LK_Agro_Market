import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../buyer/csss/Complaints.css";
import { useAuth } from "../../../src/context/AuthContext";

function ResolveComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        setError(data.message || "Failed to load complaint details.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error loading complaint details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchComplaintDetails();
    } else if (user) {
      setError("Unauthorized access. Admin role required.");
      setLoading(false);
    }
  }, [id, user]);

  const handleResolveAction = async (action) => {
    setResolving(true);
    setMsg({ text: "", ok: false });

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
          admin_notes: adminNotes.trim()
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setMsg({ text: data.message, ok: true });
        fetchComplaintDetails(); // Refresh to update status and notes
      } else {
        setMsg({ text: data.message || "Resolution action failed.", ok: false });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error submitting resolution.", ok: false });
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
    if (stepIdx < currentIdx) return "flow-step completed-step"; // styled similar to active or completed
    return "flow-step";
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="content" style={{ textAlign: "center", padding: "50px 0" }}>
          <h2>Loading complaint details...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="content" style={{ textAlign: "center", padding: "50px 0", color: "#c0392b" }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button className="submit-btn" style={{ width: "auto", marginTop: "20px" }} onClick={() => navigate("/admin")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isResolved = ["resolved", "dismissed"].includes(complaint.dbStatus.toLowerCase());

  return (
    <div className="dashboard">
      <div className="content">
        
        {/* Header */}
        <div className="page-header">
          <h1>Dispute Resolution Control Panel</h1>
          <p>Review and resolve transaction issues</p>
          <button className="tab" style={{ cursor: "pointer", border: "1px solid #ccc", padding: "5px 15px", borderRadius: "5px", background: "#f9f9f9" }} onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Stepper Flow */}
        <div className="flow-card">
          <h3>DISPUTE RESOLUTION FLOW</h3>
          <div className="flow">
            <div className={getStepClass("submitted")}>Buyer Submits</div>
            <span>→</span>
            <div className={getStepClass("admin_notified")}>Admin Notified</div>
            <span>→</span>
            <div className={getStepClass("farmer_responded")}>Farmer Responds</div>
            <span>→</span>
            <div className={getStepClass("under_review")}>Admin Reviews</div>
            <span>→</span>
            <div className={getStepClass("resolved")}>Resolved</div>
          </div>
        </div>

        {/* Complaint Detail Card */}
        <div className="complaint-card">
          <div className="card-top">
            <h3>RESOLVE COMPLAINT #{complaint.id}</h3>
            <span className="evidence-tag" style={{ background: isResolved ? "#eaf5ec" : "#fff3cd", color: isResolved ? "#2d6a4f" : "#856404", border: isResolved ? "1px solid #cce5d3" : "1px solid #ffeeba" }}>
              Status: {complaint.dbStatus.toUpperCase()}
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
              <p><strong>Order ID:</strong> {complaint.orderId}</p>
              <p><strong>Crop Item:</strong> {complaint.cropName}</p>
              <p><strong>Filing Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Buyer Name:</strong> {complaint.buyerName} ({complaint.buyerEmail})</p>
              <p><strong>Farmer Name:</strong> {complaint.farmerName} ({complaint.farmerEmail})</p>
              <p><strong>Dispute Reason:</strong> <span style={{ color: "#c0392b", fontWeight: "600" }}>{complaint.reason}</span></p>
            </div>
          </div>

          {/* Core Quotes Panel */}
          <div className="evidence-box" style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "8px", padding: "20px", marginBottom: "25px" }}>
            <h4 style={{ marginTop: 0, borderBottom: "1px solid #dee2e6", paddingBottom: "8px" }}>Statements & Description</h4>
            <p><strong>Buyer Statement:</strong> <span style={{ color: "#495057", fontStyle: "italic" }}>"{complaint.description}"</span></p>
            <p><strong>Farmer Statement:</strong> {complaint.farmerResponse ? (
              <span style={{ color: "#495057", fontStyle: "italic" }}>"{complaint.farmerResponse}"</span>
            ) : (
              <span style={{ color: "#7f8c8d", fontStyle: "italic" }}>Awaiting farmer response...</span>
            )}</p>
            
            <p style={{ marginBottom: 0 }}><strong>Evidence File:</strong> {complaint.evidenceFile ? (
              <a href={complaint.evidenceFile} target="_blank" rel="noopener noreferrer" style={{ color: "#1a5c2d", fontWeight: "600", textDecoration: "underline" }}>
                View Uploaded Photo Evidence
              </a>
            ) : (
              <span style={{ color: "#7f8c8d" }}>No files uploaded</span>
            )}</p>
          </div>

          {/* Admin Input Notes */}
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Admin Notes</label>
          <textarea
            className="input-field"
            rows="5"
            placeholder="Document resolution details, terms of refund, or why this dispute was dismissed."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            disabled={isResolved || resolving}
            style={{ width: "100%", padding: "12px", border: "1px solid #ced4da", borderRadius: "6px", marginBottom: "25px" }}
          />

          {/* Controls */}
          {isResolved ? (
            <div style={{ background: "#e9ecef", color: "#495057", padding: "15px", borderRadius: "6px", textAlign: "center", fontWeight: "600" }}>
              Complaint Resolved via: {complaint.resolutionAction ? complaint.resolutionAction.toUpperCase() : "N/A"}
            </div>
          ) : (
            <div className="action-buttons" style={{ display: "flex", gap: "10px" }}>
              <button 
                className="refund-btn" 
                onClick={() => handleResolveAction("refund")}
                disabled={resolving}
                style={{ flex: 1, padding: "12px", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                Resolve - Refund
              </button>
              <button 
                className="delivery-btn" 
                onClick={() => handleResolveAction("re-delivery")}
                disabled={resolving}
                style={{ flex: 1, padding: "12px", background: "#f39c12", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                Resolve - Re-delivery
              </button>
              <button 
                className="dismiss-btn" 
                onClick={() => handleResolveAction("dismiss")}
                disabled={resolving}
                style={{ flex: 1, padding: "12px", background: "#7f8c8d", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
              >
                Dismiss Complaint
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ResolveComplaint;
