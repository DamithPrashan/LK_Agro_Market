import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../../farmer/csss/dashBoard.css";

function FarmerComplaints() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [responses, setResponses] = useState({});
  const [evidenceFiles, setEvidenceFiles] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [statusMsgs, setStatusMsgs] = useState({});

  const fetchOpenComplaints = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/backend/farmer_respond.php", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.data || []);
      } else {
        setErrorMsg(data.error || data.message || "Failed to load complaints.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenComplaints();
  }, []);

  const handleResponseTextChange = (id, text) => {
    setResponses((prev) => ({ ...prev, [id]: text }));
  };

  const handleFileChange = (id, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }
    setEvidenceFiles((prev) => ({ ...prev, [id]: file }));
  };

  const handleSubmit = async (e, complaintId) => {
    e.preventDefault();
    const responseText = responses[complaintId] || "";

    if (!responseText.trim() || responseText.trim().length < 10) {
      setStatusMsgs((prev) => ({
        ...prev,
        [complaintId]: { text: "Response text is required (minimum 10 characters).", ok: false }
      }));
      return;
    }

    setSubmittingId(complaintId);
    setStatusMsgs((prev) => ({ ...prev, [complaintId]: { text: "", ok: false } }));

    const formData = new FormData();
    formData.append("complaint_id", complaintId);
    formData.append("response_text", responseText.trim());
    if (evidenceFiles[complaintId]) {
      formData.append("evidence", evidenceFiles[complaintId]);
    }

    try {
      const res = await fetch("/backend/farmer_respond.php", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsgs((prev) => ({
          ...prev,
          [complaintId]: { text: data.message || "Response submitted successfully.", ok: true }
        }));
        // Remove complaint from open list after 1 sec
        setTimeout(() => {
          setComplaints((prev) => prev.filter((c) => c.complaint_id !== complaintId));
        }, 1000);
      } else {
        setStatusMsgs((prev) => ({
          ...prev,
          [complaintId]: { text: data.error || data.message || "Submission failed.", ok: false }
        }));
      }
    } catch (err) {
      console.error(err);
      setStatusMsgs((prev) => ({
        ...prev,
        [complaintId]: { text: "Network error. Please try again.", ok: false }
      }));
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="content">
          <div className="page-header">
            <h1>{t("farmerDashboard.openComplaints", "Open Complaints")}</h1>
            <p>Loading active disputes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="content">
        <div className="page-header">
          <h1>{t("farmerDashboard.openComplaints", "Open Complaints")}</h1>
          <p>Review and respond to buyer disputes regarding crop reservations.</p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: "14px",
              borderRadius: "8px",
              marginBottom: "20px",
              background: "#fbeae8",
              color: "#c0392b",
              border: "1px solid #f5c2c2",
              fontWeight: "600"
            }}
          >
            {errorMsg}
          </div>
        )}

        {complaints.length === 0 ? (
          <div
            className="empty-state"
            style={{
              background: "#ffffff",
              border: "1px dashed #e4e8e1",
              borderRadius: "16px",
              padding: "50px 20px"
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
            <h3>No open complaints right now.</h3>
            <p style={{ color: "#5b6b60" }}>All crop disputes have been addressed.</p>
          </div>
        ) : (
          complaints.map((c) => {
            const isSubmitting = submittingId === c.complaint_id;
            const statusMsg = statusMsgs[c.complaint_id];

            return (
              <div
                key={c.complaint_id}
                className="section"
                style={{
                  marginBottom: "24px",
                  borderRadius: "16px",
                  border: "1px solid #e4e8e1",
                  boxShadow: "0 1px 2px rgba(31, 42, 36, 0.04)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    borderBottom: "1px dashed #e4e8e1",
                    paddingBottom: "14px",
                    marginBottom: "16px"
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      Dispute #{c.complaint_id} — Order #{c.reservation_id} ({c.crop_name})
                    </h3>
                  </div>
                  <span
                    style={{
                      background: "#fdf3dd",
                      color: "#a97300",
                      fontSize: "12px",
                      fontWeight: "700",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      textTransform: "uppercase"
                    }}
                  >
                    Submitted
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    marginBottom: "16px",
                    fontSize: "14px"
                  }}
                >
                  <div>
                    <strong>Buyer Name:</strong> {c.buyer_name}
                  </div>
                  <div>
                    <strong>Buyer Email:</strong> {c.buyer_email}
                  </div>
                  <div>
                    <strong>Submitted On:</strong> {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>

                <div
                  style={{
                    background: "#f6f8f3",
                    borderLeft: "4px solid #c0392b",
                    padding: "14px 16px",
                    borderRadius: "6px",
                    marginBottom: "20px"
                  }}
                >
                  <p style={{ margin: "4px 0" }}>
                    <strong>Reason:</strong>{" "}
                    <span style={{ color: "#c0392b", fontWeight: "700" }}>{c.reason}</span>
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Buyer Description:</strong> "{c.description}"
                  </p>
                  {c.evidence_file && (
                    <a
                      href={`/${c.evidence_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        color: "#145a32",
                        fontWeight: "600",
                        textDecoration: "underline",
                        fontSize: "13px"
                      }}
                    >
                      📷 View Buyer Evidence File
                    </a>
                  )}
                </div>

                <form onSubmit={(e) => handleSubmit(e, c.complaint_id)}>
                  {statusMsg && statusMsg.text && (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "6px",
                        marginBottom: "14px",
                        fontSize: "14px",
                        fontWeight: "600",
                        background: statusMsg.ok ? "#eaf7ec" : "#fbeae8",
                        color: statusMsg.ok ? "#145a32" : "#c0392b",
                        border: statusMsg.ok ? "1px solid #cce5d3" : "1px solid #f5c2c2"
                      }}
                    >
                      {statusMsg.text}
                    </div>
                  )}

                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                      textTransform: "uppercase"
                    }}
                  >
                    Your Response <span style={{ color: "red" }}>*</span>
                  </label>
                  <textarea
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #e4e8e1",
                      fontSize: "14px",
                      marginBottom: "14px"
                    }}
                    value={responses[c.complaint_id] || ""}
                    onChange={(e) => handleResponseTextChange(c.complaint_id, e.target.value)}
                    placeholder="Explain your response clearly (min 10 characters)..."
                    disabled={isSubmitting}
                    required
                    minLength={10}
                  />

                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "#5b6b60"
                      }}
                    >
                      Attach Supporting Evidence (Optional - JPG, PNG, PDF &le; 5MB)
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(c.complaint_id, e.target.files[0])}
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    className="add-btn"
                    disabled={isSubmitting}
                    style={{
                      background: "#145a32",
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Response"}
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default FarmerComplaints;
