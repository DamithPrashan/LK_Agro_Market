import { useEffect, useState } from "react";
import "../../farmer/csss/dashBoard.css";
import "../../buyer/csss/Complaints.css";

const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not available";

const deadlineText = (deadline, overdue) => {
  if (!deadline) return "Respond within 48 hours";
  if (overdue) return "Response overdue";
  const milliseconds = new Date(deadline).getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(milliseconds / 3600000));
  return `${hours} hour${hours === 1 ? "" : "s"} remaining`;
};

export default function FarmerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState({});
  const [evidenceFiles, setEvidenceFiles] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [messages, setMessages] = useState({});

  const loadComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/backend/farmer_respond.php", { credentials: "include" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || body.message || "Failed to load complaints.");
      setComplaints((body.data || []).filter((complaint) => complaint.status === "awaiting_farmer_response"));
    } catch (requestError) {
      setError(requestError.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleFile = (complaintId, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      setMessages((current) => ({ ...current, [complaintId]: { ok: false, text: "Evidence must be 5MB or smaller." } }));
      return;
    }
    setEvidenceFiles((current) => ({ ...current, [complaintId]: file }));
  };

  const submitResponse = async (event, complaintId) => {
    event.preventDefault();
    const responseText = (responses[complaintId] || "").trim();
    if (responseText.length < 10) {
      setMessages((current) => ({ ...current, [complaintId]: { ok: false, text: "Response must contain at least 10 characters." } }));
      return;
    }

    const formData = new FormData();
    formData.append("complaint_id", complaintId);
    formData.append("response_text", responseText);
    if (evidenceFiles[complaintId]) formData.append("evidence", evidenceFiles[complaintId]);
    setSubmittingId(complaintId);
    setMessages((current) => ({ ...current, [complaintId]: null }));

    try {
      const response = await fetch("/backend/farmer_respond.php", { method: "POST", credentials: "include", body: formData });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || body.message || "Submission failed.");
      setComplaints((current) => current.filter((complaint) => complaint.complaint_id !== complaintId));
    } catch (requestError) {
      setMessages((current) => ({ ...current, [complaintId]: { ok: false, text: requestError.message } }));
    } finally {
      setSubmittingId(null);
    }
  };

  return <div className="dashboard farmer-complaint-page"><div className="content">
    <div className="page-header"><h1>Complaint Actions</h1><p>Review complaints requiring your response</p></div>
    {error && <div className="complaint-feedback error">{error}</div>}
    {loading ? <div className="complaint-empty-calm">Loading complaints requiring action...</div> : complaints.length === 0 ? <div className="complaint-empty-calm"><h3>No complaints require your action right now.</h3></div> : <div className="farmer-action-list">
      {complaints.map((complaint) => {
        const submitting = submittingId === complaint.complaint_id;
        const feedback = messages[complaint.complaint_id];
        return <article className="farmer-action-card" key={complaint.complaint_id}>
          <header><div><span className="complaint-card-kicker">Complaint #{complaint.complaint_id}</span><h2>{complaint.reason}</h2></div><span className={`farmer-action-pill ${complaint.is_overdue ? "overdue" : ""}`}>{complaint.is_overdue ? "Response Overdue" : "Action Required"}</span></header>
          <div className="farmer-action-meta">
            <span><strong>Crop</strong>{complaint.crop_name}</span>
            <span><strong>Order</strong>#{complaint.reservation_id}</span>
            <span><strong>Submitted</strong>{formatDate(complaint.created_at)}</span>
            <span><strong>Requested</strong>{formatDate(complaint.farmer_response_requested_at)}</span>
            <span><strong>Deadline</strong>{formatDate(complaint.farmer_response_deadline)}</span>
            <span><strong>Time remaining</strong>{deadlineText(complaint.farmer_response_deadline, complaint.is_overdue)}</span>
          </div>
          <section className="calm-complaint-description"><h3>Buyer Complaint</h3><p>{complaint.description}</p>{complaint.evidence_file && <a className="evidence-attachment" href={`/${complaint.evidence_file}`} target="_blank" rel="noreferrer">View Buyer Evidence</a>}</section>
          <section className={`farmer-action-panel ${complaint.is_overdue ? "overdue" : ""}`}><strong>{complaint.is_overdue ? "Response overdue" : "Administrator instruction"}</strong><p>{complaint.admin_notes || "Please review this complaint and respond within the 48-hour period."}</p>{complaint.is_overdue && <span>You may still respond. Further account action is handled manually by an administrator.</span>}</section>
          <form className="farmer-response-form" onSubmit={(event) => submitResponse(event, complaint.complaint_id)}>
            {feedback?.text && <div className={`complaint-feedback ${feedback.ok ? "success" : "error"}`}>{feedback.text}</div>}
            <label>Your Response</label>
            <textarea rows="4" required minLength="10" disabled={submitting} value={responses[complaint.complaint_id] || ""} onChange={(event) => setResponses((current) => ({ ...current, [complaint.complaint_id]: event.target.value }))} placeholder="Explain your response clearly..." />
            <label className="farmer-evidence-label">Supporting Evidence (optional, JPG/PNG/PDF, maximum 5MB)<input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" disabled={submitting} onChange={(event) => handleFile(complaint.complaint_id, event.target.files[0])} /></label>
            <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Response"}</button>
          </form>
        </article>;
      })}
    </div>}
  </div></div>;
}
