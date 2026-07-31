import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../buyer/csss/farmerResponse.css";

function FarmerResponse() {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Maps your real complaint_status enum values to farmer-friendly labels
    const STATUS_LABELS = {
        pending: t("farmer.statusUnderReview"),
        under_review: t("farmer.statusAwaitingAdmin"),
        resolved: t("farmer.statusResolved"),
        rejected: t("farmer.statusRejected"),
    };

    // Support the complaint ID coming from a route param (/farmer/complaints/:complaintId)
    // or from navigation state, same pattern used elsewhere in this app (see CropDetail.jsx).
    const complaintId = params.complaintId || location.state?.complaintId;

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [response, setResponse] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState("");

    const fetchComplaint = () => {
        if (!complaintId) {
            setLoadError(t("errors.failedLoadDetails"));
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError("");

        fetch(`/backend/get_complaints.php?complaint_id=${complaintId}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.complaints && data.complaints.length > 0) {
                    setComplaint(data.complaints[0]);
                } else {
                    setLoadError(data.message || t("errors.failedLoadDetails"));
                }
            })
            .catch((err) => {
                console.error("Error fetching complaint:", err);
                setLoadError(t("errors.failedLoadDetails"));
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchComplaint();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complaintId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!response.trim()) {
            setSubmitMsg(t("farmer.writeResponseAlert"));
            return;
        }

        setSubmitting(true);
        setSubmitMsg("");

        try {
            const res = await fetch("/backend/farmer_respond.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    complaint_id: complaintId,
                    response: response.trim(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSubmitMsg(t("farmer.responseSubmittedAlert"));
                fetchComplaint(); // refresh so status/response reflect what was just saved
            } else {
                setSubmitMsg(data.message || t("errors.submissionFailed"));
            }
        } catch (err) {
            console.error("Error submitting response:", err);
            setSubmitMsg(t("errors.connectionFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="farmer-dashboard">
                <div className="response-card">
                    <p>{t("loadingStates.loadingDetails")}</p>
                </div>
            </div>
        );
    }

    if (loadError || !complaint) {
        return (
            <div className="farmer-dashboard">
                <div className="response-card">
                    <p>{loadError || t("errors.failedLoadDetails")}</p>
                    <button className="submit-btn" onClick={() => navigate("/farmer")}>
                        {t("buttons.back")}
                    </button>
                </div>
            </div>
        );
    }

    // Once the farmer has responded (status moved past 'pending'), lock the
    // form and show what was submitted, instead of allowing re-submission.
    const alreadyResponded = complaint.complaint_status !== "pending";
    const statusLabel =
        STATUS_LABELS[complaint.complaint_status] || complaint.complaint_status;

    return (
        <div className="farmer-dashboard">
            <div className="response-card">
                <div className="response-header">
                    <div>
                        <h2>
                            {t("farmer.openComplaintTitle", { id: complaint.complaint_id, crop: complaint.crop_name ? ` — ${complaint.crop_name}` : "" })}
                        </h2>

                        <p>
                            {t("farmer.buyerSays", { buyer: complaint.submitted_by_name || "Buyer" })}
                            <span className="buyer-text">"{complaint.description}"</span>
                        </p>
                    </div>

                    <span className="status-tag">{statusLabel}</span>
                </div>

                {alreadyResponded ? (
                    <div>
                        <label>{t("farmer.yourResponse")}</label>
                        <p className="buyer-text">
                            {complaint.farmer_response || "—"}
                        </p>

                        {complaint.resolution && (
                            <>
                                <label>{t("farmer.adminResolution")}</label>
                                <p className="buyer-text">{complaint.resolution}</p>
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label>{t("farmer.yourResponse")}</label>

                        <textarea
                            className="response-textarea"
                            rows="4"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder={t("farmer.explainResponsePlaceholder")}
                            disabled={submitting}
                        />

                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? t("btnSubmitting", "Submitting...") : t("buttons.submitResponse")}
                        </button>

                        {submitMsg && <p>{submitMsg}</p>}
                    </form>
                )}
            </div>
        </div>
    );
}

export default FarmerResponse;

