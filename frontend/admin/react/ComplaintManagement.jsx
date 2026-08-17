import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiFileText,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";
import "../csss/AdminDashboard/admin.css";

const OPEN_STATUSES = ["submitted", "awaiting_farmer_response"];
const initials = (name = "") => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const niceText = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatAge = (t, hours) => hours < 1 ? t("admin.complaints.ageLessHour") : hours < 24 ? t("admin.complaints.ageHours", { count: Math.floor(hours) }) : t("admin.complaints.ageDays", { count: Math.floor(hours / 24) });
const formatDate = (value, locale) => value ? new Date(value).toLocaleString(locale) : null;

function EvidenceCard({ label, file, owner }) {
  const { t } = useTranslation();
  return <div className="complaint-evidence-card">
    <FiFileText />
    <div><strong>{label}</strong><span>{file ? t("admin.complaints.evidenceSupplied", { owner }) : t("admin.common.notProvided")}</span></div>
    {file && <a href={file} target="_blank" rel="noreferrer"><FiExternalLink /> {t("admin.common.open")}</a>}
  </div>;
}

function ComplaintReviewModal({ item, onClose, onUpdated }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "si" ? "si-LK" : i18n.language === "ta" ? "ta-LK" : "en-US";
  const statusLabel = (status) => t(`admin.complaints.status.${status}`, { defaultValue: niceText(status) });
  const [details, setDetails] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/backend/get_complaint_details.php?complaint_id=${item.complaint_id}`, { credentials: "include" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(t("admin.complaints.errors.loadDetails", { defaultValue: body.message }));
        setDetails(body.complaint);
        setNotes(body.complaint.adminNotes || "");
      })
      .catch((error) => setMessage(error.message));
  }, [item.complaint_id, t]);

  const takeAction = async (action) => {
    if (!notes.trim()) {
      setMessage(t("admin.complaints.notesRequired"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/backend/resolve_complaint.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: item.complaint_id,
          action,
          resolution_action: action,
          resolution_status: action === "dismiss" ? "dismissed" : "awaiting_farmer_response",
          admin_notes: notes.trim(),
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(t("admin.complaints.errors.actionFailed", { defaultValue: body.message }));
      await onUpdated();
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const isOpen = OPEN_STATUSES.includes(item.workflow_status);
  const canRequestFarmer = item.workflow_status === "submitted";

  return <div className="complaint-modal-backdrop">
    <section className="complaint-review-modal" role="dialog" aria-modal="true" aria-label={t("admin.complaints.reviewTitle")}>
      <header><div><h2>{t("admin.complaints.reviewTitle")}</h2><p>{t("admin.complaints.reviewSubtitle")}</p></div><button type="button" className="complaint-modal-close" aria-label={t("admin.common.close")} onClick={onClose}>×</button></header>
      {!details ? <p className="complaint-modal-loading">{message || t("admin.complaints.loadingDetails")}</p> : <>
        <section className="complaint-summary-section">
          <div className="complaint-summary-heading">
            <div><small>{t("admin.complaints.summary")}</small><h3>{details.reason}</h3><span>{t(`admin.complaints.categories.${item.category}`)}</span></div>
            <span className={`complaint-status ${details.dbStatus}`}><i />{statusLabel(details.dbStatus)}</span>
          </div>
          <div className="complaint-summary-meta">
            <div><small>{t("admin.common.priority")}</small><span className={`complaint-priority ${item.priority}`}>{t(`admin.complaints.priority.${item.priority}`)}</span></div>
            <div><small>{t("admin.complaints.submitted")}</small><strong>{formatDate(details.createdAt, locale)}</strong></div>
            <div><small>{t("admin.complaints.elapsed")}</small><strong>{formatAge(t, item.age_hours)}</strong></div>
            {details.farmerResponseDeadline && <div><small>{t("admin.complaints.responseDeadline")}</small><strong>{formatDate(details.farmerResponseDeadline, locale)}</strong>{details.isOverdue && <span className="complaint-overdue-badge">{t("admin.complaints.overdue")}</span>}</div>}
          </div>
        </section>

        <section className="complaint-description-section"><h3>{t("admin.complaints.description")}</h3><p>{details.description}</p></section>

        <section className="complaint-evidence-grid">
          <EvidenceCard label={t("admin.complaints.buyerEvidence")} file={details.evidenceFile} owner={t("admin.complaints.buyer")} />
          <EvidenceCard label={t("admin.complaints.farmerEvidence")} file={details.farmerEvidenceFile} owner={t("admin.complaints.farmer")} />
        </section>

        {details.dbStatus === "awaiting_farmer_response" && <section className={`complaint-response-state ${details.isOverdue ? "overdue" : ""}`}>
          <h3>{t("admin.complaints.actionRequiredFarmer")}</h3>
          <div><span>{t("admin.complaints.requested")}: {formatDate(details.farmerResponseRequestedAt, locale)}</span><span>{t("admin.complaints.deadline")}: {formatDate(details.farmerResponseDeadline, locale)}</span><strong>{details.isOverdue ? t("admin.complaints.overdueAttention") : t("admin.complaints.responseWindow")}</strong></div>
        </section>}

        {details.farmerResponse && <section className="complaint-modal-section"><h3>{t("admin.complaints.farmerResponse")}</h3><p>{details.farmerResponse}</p><small>{t("admin.complaints.respondedAt", { date: formatDate(details.farmerRespondedAt, locale) })}</small></section>}

        <section className="complaint-party-grid">
          <div><small>{t("admin.complaints.buyer")}</small><strong>{details.buyerName}</strong><span>{details.buyerEmail}</span></div>
          <div><small>{t("admin.complaints.farmer")}</small><strong>{details.farmerName}</strong><span>{details.farmerEmail}</span></div>
        </section>

        <section className="complaint-related-order"><h3>{t("admin.complaints.relatedOrder")}</h3><span><strong>{details.orderId}</strong> · {details.cropName} · {details.quantityRequested} kg · {niceText(details.transactionStatus)}</span></section>
        <section className="complaint-admin-decision">
          <h3>{t("admin.complaints.adminDecision")}</h3>
          <label className="complaint-notes"><span>{t("admin.complaints.adminNote")}</span><textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} disabled={!isOpen || busy} placeholder={t("admin.complaints.adminNotePlaceholder")} /></label>
        </section>
        {message && <p className="complaint-modal-error">{message}</p>}
        {isOpen ? <footer><button type="button" className="complaint-dismiss-action" disabled={busy} onClick={() => takeAction("dismiss")}>{t("admin.complaints.dismissComplaint")}</button>{canRequestFarmer && <button type="button" className="complaint-farmer-action" disabled={busy} onClick={() => takeAction("request_farmer_response")}>{t("admin.complaints.requestFarmerResponse")}</button>}</footer> : <p className="complaint-closed-note">{t("admin.complaints.readOnly", { status: statusLabel(item.workflow_status) })}</p>}
      </>}
    </section>
  </div>;
}

export default function ComplaintManagement() {
  const { t } = useTranslation();
  const statusLabel = (status) => t(`admin.complaints.status.${status}`, { defaultValue: niceText(status) });
  const [complaints, setComplaints] = useState([]);
  const [weekly, setWeekly] = useState({ open: 0, resolved: 0, dismissed: 0 });
  const [activeTab, setActiveTab] = useState("submitted");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const itemsPerPage = 10;

  const loadComplaints = useCallback(async () => {
    try {
      const response = await fetch("/backend/get_complaints.php?limit=100", { credentials: "include" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(t("admin.complaints.errors.load", { defaultValue: body.message || body.error }));
      setComplaints(body.data || []);
      setWeekly(body.weekly_stats || { open: 0, resolved: 0, dismissed: 0 });
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComplaints();
  }, [loadComplaints]);

  const counts = useMemo(() => ({
    open: complaints.filter((complaint) => OPEN_STATUSES.includes(complaint.workflow_status)).length,
    submitted: complaints.filter((complaint) => complaint.workflow_status === "submitted").length,
    awaiting_farmer_response: complaints.filter((complaint) => complaint.workflow_status === "awaiting_farmer_response").length,
    resolved: complaints.filter((complaint) => complaint.workflow_status === "resolved").length,
    dismissed: complaints.filter((complaint) => complaint.workflow_status === "dismissed").length,
  }), [complaints]);

  const priorityComplaint = complaints.find((complaint) => OPEN_STATUSES.includes(complaint.workflow_status));
  const filtered = complaints.filter((complaint) => {
    const term = search.trim().toLowerCase();
    const tabMatches = complaint.workflow_status === activeTab;
    const searchMatches = !term || [complaint.buyer_name, complaint.crop_name, complaint.reason, complaint.category].some((value) => String(value || "").toLowerCase().includes(term));
    return tabMatches && searchMatches;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);
  const changeTab = (tab) => { setActiveTab(tab); setCurrentPage(1); };

  return <div className="complaint-page">
    <section className="complaint-header"><h1>{t("admin.complaints.title")}</h1><p>{t("admin.complaints.subtitle")}</p></section>
    {error && <p className="complaint-modal-error">{error}</p>}
    <section className="complaint-overview">
      <div className="complaint-stat-grid">{[
        { key: "open", label: t("admin.complaints.openedThisWeek"), icon: <FiAlertCircle /> },
        { key: "resolved", label: t("admin.complaints.resolvedThisWeek"), icon: <FiCheckCircle /> },
        { key: "dismissed", label: t("admin.complaints.dismissedThisWeek"), icon: <FiXCircle /> },
      ].map((card) => <article className="complaint-stat-card" key={card.key}><div className="complaint-stat-top"><span>{card.label}</span><span className={`complaint-stat-symbol ${card.key}`}>{card.icon}</span></div><strong>{weekly[card.key]}</strong><div className={`complaint-stat-trend ${card.key}`}>{t("admin.complaints.countThisWeek", { count: weekly[card.key] })}</div></article>)}</div>
      <article className="complaint-priority-card"><h2>{t("admin.complaints.priorityAction")}</h2>{priorityComplaint ? <><div className="complaint-alert-box"><FiAlertTriangle /><div><strong>{t("admin.complaints.immediateAttention")}</strong><p>{t("admin.complaints.priorityDescription", { category: t(`admin.complaints.categories.${priorityComplaint.category}`), age: formatAge(t, priorityComplaint.age_hours), overdue: priorityComplaint.is_overdue ? t("admin.complaints.deadlineOverdueSuffix") : "" })}</p></div></div><button type="button" onClick={() => setSelected(priorityComplaint)}>{t("admin.complaints.reviewComplaint")}</button></> : <p className="complaint-no-priority">{t("admin.complaints.noPriority")}</p>}</article>
    </section>

    <section className="complaint-management-card">
      <div className="complaint-toolbar"><div className="complaint-tabs">{[["submitted", counts.submitted], ["awaiting_farmer_response", counts.awaiting_farmer_response], ["resolved", counts.resolved], ["dismissed", counts.dismissed]].map(([key, count]) => <button key={key} className={activeTab === key ? "active" : ""} onClick={() => changeTab(key)}>{statusLabel(key)} ({count})</button>)}</div><div className="complaint-filters"><div className="complaint-search-box"><FiSearch /><input value={search} placeholder={t("admin.complaints.searchPlaceholder")} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></div></div></div>
      <div className="complaint-table-scroll"><table className="complaint-table"><colgroup><col /><col /><col /><col /><col /><col /><col /></colgroup><thead><tr><th>{t("admin.complaints.complaintId")}</th><th>{t("admin.complaints.buyer")}</th><th>{t("admin.complaints.relatedCrop")}</th><th>{t("admin.complaints.categoryReason")}</th><th>{t("admin.common.priority")}</th><th>{t("admin.common.status")}</th><th>{t("admin.common.action")}</th></tr></thead><tbody>{currentItems.length ? currentItems.map((complaint) => <tr key={complaint.complaint_id}><td className="complaint-id">#{complaint.complaint_id}</td><td><div className="complaint-buyer"><div className={`complaint-buyer-avatar ${complaint.status}`}>{initials(complaint.buyer_name)}</div><span>{complaint.buyer_name}</span></div></td><td className="complaint-muted">{complaint.crop_name}</td><td><strong>{t(`admin.complaints.categories.${complaint.category}`)}</strong><br /><span className="complaint-muted">{complaint.reason}</span></td><td><span className={`complaint-priority ${complaint.priority}`}>{t(`admin.complaints.priority.${complaint.priority}`)}</span>{complaint.is_overdue && <span className="complaint-overdue-badge">{t("admin.complaints.overdue")}</span>}</td><td><span className={`complaint-status ${complaint.workflow_status}`}><i />{statusLabel(complaint.workflow_status)}</span></td><td className="complaint-action-cell"><button type="button" onClick={() => setSelected(complaint)}>{t("admin.common.view")}</button></td></tr>) : <tr><td colSpan="7" className="complaint-empty">{t("admin.complaints.empty")}</td></tr>}</tbody></table></div>
      <div className="complaint-pagination"><p>{t("admin.complaints.pagination", { from: filtered.length ? startIndex + 1 : 0, to: Math.min(startIndex + itemsPerPage, filtered.length), total: filtered.length })}</p><div className="complaint-pages"><button type="button" aria-label={t("admin.common.previousPage")} disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><FiChevronLeft /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={currentPage === page ? "active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>)}<button type="button" aria-label={t("admin.common.nextPage")} disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><FiChevronRight /></button></div></div>
    </section>
    {selected && <ComplaintReviewModal item={selected} onClose={() => setSelected(null)} onUpdated={loadComplaints} />}
  </div>;
}
