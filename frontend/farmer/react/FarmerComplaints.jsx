import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../src/context/AuthContext";
import FileInputButton from "../../components/FileInputButton";
import "../../farmer/csss/dashBoard.css";
import "../../buyer/csss/Complaints.css";

const formatDate = (value, locale, fallback) => value ? new Date(value).toLocaleString(locale) : fallback;

const deadlineText = (deadline, overdue, t) => {
  if (!deadline) return t("farmerComplaints.respondWithin48");
  if (overdue) return t("farmerComplaints.responseOverdue");
  const milliseconds = new Date(deadline).getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(milliseconds / 3600000));
  return t("farmerComplaints.hoursRemaining", { count: hours });
};

export default function FarmerComplaints() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language === "si" ? "si-LK" : i18n.language === "ta" ? "ta-LK" : "en-LK";
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState({});
  const [evidenceFiles, setEvidenceFiles] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [messages, setMessages] = useState({});

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/backend/farmer_respond.php", { credentials: "include" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || body.message || t("farmerComplaints.loadFailed"));
      setComplaints((body.data || []).filter((complaint) => complaint.status === "awaiting_farmer_response"));
    } catch (requestError) {
      setError(requestError.message || t("farmerComplaints.networkError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleFile = (complaintId, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      setMessages((current) => ({ ...current, [complaintId]: { ok: false, text: t("farmerComplaints.evidenceSize") } }));
      return;
    }
    setEvidenceFiles((current) => ({ ...current, [complaintId]: file }));
  };

  const submitResponse = async (event, complaintId) => {
    event.preventDefault();
    const responseText = (responses[complaintId] || "").trim();
    if (responseText.length < 10) {
      setMessages((current) => ({ ...current, [complaintId]: { ok: false, text: t("farmerComplaints.responseLength") } }));
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
      if (!response.ok || !body.success) throw new Error(body.error || body.message || t("farmerComplaints.submitFailed"));
      setComplaints((current) => current.filter((complaint) => complaint.complaint_id !== complaintId));
    } catch (requestError) {
      setMessages((current) => ({ ...current, [complaintId]: { ok: false, text: requestError.message } }));
    } finally {
      setSubmittingId(null);
    }
  };

  return <div className="dashboard farmer-complaint-page"><div className="content">
    <div className="page-header"><h1>{t("farmerComplaints.title")}</h1><p>{t("farmerComplaints.subtitle")}</p></div>
    {error && <div className="complaint-feedback error">{error}</div>}
    {loading ? <div className="complaint-empty-calm">{t("farmerComplaints.loading")}</div> : complaints.length === 0 ? <div className="complaint-empty-calm"><h3>{t("farmerComplaints.empty")}</h3></div> : <div className="farmer-action-list">
      {complaints.map((complaint) => {
        const submitting = submittingId === complaint.complaint_id;
        const feedback = messages[complaint.complaint_id];
        return <article className="farmer-action-card" key={complaint.complaint_id}>
          <span className={`farmer-complaint-source ${complaint.reservation_source === "cultivation" ? "cultivation" : "crop"}`}>{t(complaint.reservation_source === "cultivation" ? "complaints.cultivationOrder" : "complaints.availableCrop")}</span>
          <header><h2>{t("complaints.disputeNumber", { id: complaint.complaint_id })} — {complaint.crop_name}</h2><span className={`farmer-action-pill ${complaint.is_overdue ? "overdue" : ""}`}>{complaint.is_overdue ? t("farmerComplaints.responseOverdue") : t("farmerComplaints.actionRequired")}</span></header>
          <div className="farmer-action-meta">
            <span><strong>{t("farmerComplaints.order")}</strong>#{complaint.reservation_id}</span>
            <span><strong>{t("complaints.farmerLabel")}</strong>{complaint.farmer_name || user?.name || t("farmerComplaints.notAvailable")}</span>
            <span><strong>{t("farmerComplaints.submitted")}</strong>{formatDate(complaint.created_at, locale, t("farmerComplaints.notAvailable"))}</span>
          </div>
          <section className="calm-complaint-description"><h3>{complaint.reason === "Harvest Delay" ? t("complaints.harvestDelay") : complaint.reason}</h3><p>{complaint.description}</p>{complaint.evidence_file && <a className="evidence-attachment" href={`/${complaint.evidence_file}`} target="_blank" rel="noreferrer">{t("farmerComplaints.viewBuyerEvidence")}</a>}</section>
          <section className={`farmer-action-panel ${complaint.is_overdue ? "overdue" : ""}`}><strong>{complaint.is_overdue ? t("farmerComplaints.responseOverdue") : t("farmerComplaints.adminInstruction")}</strong><p>{complaint.admin_notes || t("farmerComplaints.defaultInstruction")}</p><div className="farmer-complaint-deadline"><span><b>{t("farmerComplaints.requested")}</b>{formatDate(complaint.farmer_response_requested_at, locale, t("farmerComplaints.notAvailable"))}</span><span><b>{t("farmerComplaints.deadline")}</b>{formatDate(complaint.farmer_response_deadline, locale, t("farmerComplaints.notAvailable"))}</span><span><b>{t("farmerComplaints.timeRemaining")}</b>{deadlineText(complaint.farmer_response_deadline, complaint.is_overdue, t)}</span></div>{complaint.is_overdue && <span>{t("farmerComplaints.overdueGuidance")}</span>}</section>
          <form className="farmer-response-form" onSubmit={(event) => submitResponse(event, complaint.complaint_id)}>
            {feedback?.text && <div className={`complaint-feedback ${feedback.ok ? "success" : "error"}`}>{feedback.text}</div>}
            <label htmlFor={`complaint-response-${complaint.complaint_id}`}>{t("farmerComplaints.yourResponse")}</label>
            <textarea id={`complaint-response-${complaint.complaint_id}`} rows="4" required minLength="10" disabled={submitting} value={responses[complaint.complaint_id] || ""} onChange={(event) => setResponses((current) => ({ ...current, [complaint.complaint_id]: event.target.value }))} placeholder={t("farmerComplaints.responsePlaceholder")} />
            <div style={{ marginBottom: 12 }}>
              <label className="farmer-evidence-label" style={{ display: 'block', marginBottom: 8 }}>{t("farmerComplaints.supportingEvidence")}</label>
              <FileInputButton id={`complaint-evidence-${complaint.complaint_id}`} accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" disabled={submitting} onChange={(files) => handleFile(complaint.complaint_id, files[0])} files={evidence[complaint.complaint_id] ? [evidence[complaint.complaint_id]] : []} />
            </div>
            <button type="submit" disabled={submitting}>{submitting ? t("farmerComplaints.submitting") : t("farmerComplaints.submitResponse")}</button>
          </form>
        </article>;
      })}
    </div>}
  </div></div>;
}
