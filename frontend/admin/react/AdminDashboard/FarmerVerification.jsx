import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiFileText,
  FiImage,
  FiCheckCircle,
  FiXCircle,
  FiStar,
} from "react-icons/fi";

import "../../csss/AdminDashboard/admin.css";
import "../../csss/AdminDashboard/farmerVerification.css";
import { getDistrictLabel } from "../../../../src/constants/districtUtils";

const positiveCriteria = [
  "identity_valid",
  "farm_location_valid",
  "evidence_sufficient",
  "registration_complete",
  "information_trustworthy",
];

const negativeCriteria = [
  "identity_invalid",
  "farm_location_unclear",
  "evidence_insufficient",
  "registration_incomplete",
  "information_untrustworthy",
];

export default function FarmerVerification() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("pending");

  const [currentPage, setCurrentPage] = useState(1);

  const [showFilter, setShowFilter] = useState(false);

  const [districtFilter, setDistrictFilter] = useState("all");

  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [decision, setDecision] = useState("");

  const [selectedCriteria, setSelectedCriteria] = useState([]);

  const [feedback, setFeedback] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");

  /* =========================================
     10 REQUESTS PER PAGE
  ========================================= */

  const itemsPerPage = 10;

  /* =========================================
     FETCH REQUESTS
  ========================================= */

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/backend/Apis/admin/farmerVerification/getVerificationRequests.php",
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          t("admin.verifications.errors.loadRequests", { defaultValue: data.message }),
        );
      }

      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (error) {
      console.error("Farmer verification fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================
     COUNTS
  ========================================= */

  const counts = useMemo(() => {
    return {
      pending: requests.filter((item) => item.status === "pending").length,

      approved: requests.filter((item) => item.status === "approved").length,

      rejected: requests.filter((item) => item.status === "rejected").length,
    };
  }, [requests]);

  /* =========================================
     DISTRICTS
  ========================================= */

  const districts = useMemo(() => {
    return [...new Set(requests.map((item) => item.district).filter(Boolean))];
  }, [requests]);

  /* =========================================
     FILTER
  ========================================= */

  const filteredData = useMemo(() => {
    return requests.filter((item) => {
      const statusMatch = item.status === activeTab;

      const districtMatch =
        districtFilter === "all" || item.district === districtFilter;

      return statusMatch && districtMatch;
    });
  }, [requests, activeTab, districtFilter]);

  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentItems = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  /* =========================================
     TAB
  ========================================= */

  const handleTabChange = (status) => {
    setActiveTab(status);

    setCurrentPage(1);
  };

  /* =========================================
     OPEN DETAILS
  ========================================= */

  const handleView = async (verificationId) => {
    try {
      setDetailsLoading(true);

      setSubmitError("");

      const response = await fetch(
        `/backend/Apis/admin/farmerVerification/getVerificationDetails.php?id=${verificationId}`,
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(t("admin.verifications.errors.loadDetails", { defaultValue: data.message }));
      }

      setSelectedFarmer(data.verification);

      setDecision("");

      setSelectedCriteria([]);

      setFeedback(data.verification.feedback || "");
    } catch (error) {
      console.error("Verification detail error:", error);

      alert(error.message || t("admin.verifications.errors.loadDetails"));
    } finally {
      setDetailsLoading(false);
    }
  };

  /* =========================================
     CLOSE MODAL
  ========================================= */

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setSelectedFarmer(null);

    setDecision("");

    setSelectedCriteria([]);

    setFeedback("");

    setSubmitError("");
  };

  /* =========================================
     DECISION
  ========================================= */

  const chooseDecision = (newDecision) => {
    setDecision(newDecision);

    setSelectedCriteria([]);

    setSubmitError("");
  };

  /* =========================================
     CRITERION
  ========================================= */

  const toggleCriterion = (criterion) => {
    setSelectedCriteria((previous) => {
      if (previous.includes(criterion)) {
        return previous.filter((item) => item !== criterion);
      }

      return [...previous, criterion];
    });
  };

  /* =========================================
     STAR RATING
  ========================================= */

  const rating = decision === "accept" ? selectedCriteria.length : 0;

  /* =========================================
     SUBMIT
  ========================================= */

  const handleSubmit = async () => {
    if (!selectedFarmer) {
      return;
    }

    if (!decision) {
      setSubmitError(t("admin.verifications.errors.selectDecision"));

      return;
    }

    if (selectedCriteria.length === 0) {
      setSubmitError(
        decision === "accept"
          ? t("admin.verifications.errors.selectCriterion")
          : t("admin.verifications.errors.selectReason"),
      );

      return;
    }

    if (!feedback.trim()) {
      setSubmitError(t("admin.verifications.errors.feedbackRequired"));

      return;
    }

    try {
      setSubmitting(true);

      setSubmitError("");

      const response = await fetch(
        "/backend/Apis/admin/farmerVerification/submitVerification.php",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            verification_id: selectedFarmer.id,

            decision,

            criteria: selectedCriteria,

            feedback: feedback.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(t("admin.verifications.errors.submitFailed", { defaultValue: data.message }));
      }

      alert(t(decision === "accept" ? "admin.verifications.approvedSuccess" : "admin.verifications.rejectedSuccess"));

      closeModal();

      await fetchRequests();
    } catch (error) {
      console.error("Submit verification error:", error);

      setSubmitError(error.message || t("admin.verifications.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================
     FILE URL
  ========================================= */

  const fileUrl = (path) => {
    if (!path) {
      return null;
    }

    if (path.startsWith("http")) {
      return path;
    }

    // Sensitive files (NIC scans, farm evidence) must go through the
    // authenticated PHP proxy — direct Apache access is blocked by .htaccess.
    const normalised = path.startsWith("/") ? path.slice(1) : path;
    if (
      normalised.startsWith("backend/uploads/NIC/") ||
      normalised.startsWith("backend/uploads/FarmEvidence/")
    ) {
      return `/backend/Apis/serve_file.php?path=${encodeURIComponent(normalised)}`;
    }

    return path.startsWith("/") ? path : `/${path}`;
  };

  return (
    <div className="verification-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <section className="verification-header">
        <h1>{t("admin.verifications.title")}</h1>

        <p>{t("admin.verifications.subtitle")}</p>
      </section>

      {/* =====================================
          TOOLBAR
      ===================================== */}

      <section className="verification-toolbar">
        <div className="verification-tabs">
          <button
            type="button"
            className={activeTab === "pending" ? "active" : ""}
            onClick={() => handleTabChange("pending")}
          >
            {t("admin.verifications.pending")} ({counts.pending})
          </button>

          <button
            type="button"
            className={activeTab === "approved" ? "active" : ""}
            onClick={() => handleTabChange("approved")}
          >
            {t("admin.verifications.accepted")} ({counts.approved})
          </button>

          <button
            type="button"
            className={activeTab === "rejected" ? "active" : ""}
            onClick={() => handleTabChange("rejected")}
          >
            {t("admin.verifications.rejected")} ({counts.rejected})
          </button>
        </div>

        <div className="verification-filter-wrap">
          <button
            type="button"
            className="verification-filter-btn"
            onClick={() => setShowFilter((value) => !value)}
          >
            <FiFilter />
            {t("admin.common.filter")}
          </button>

          {showFilter && (
            <div className="verification-filter-menu">
              <label>{t("admin.common.district")}</label>

              <select
                value={districtFilter}
                onChange={(event) => {
                  setDistrictFilter(event.target.value);

                  setCurrentPage(1);
                }}
              >
                <option value="all">{t("admin.verifications.allDistricts")}</option>

                {districts.map((district) => (
                  <option value={district} key={district}>
                    {getDistrictLabel(t, district)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          TABLE
      ===================================== */}

      <section className="verification-table-card">
        <div className="verification-table-wrapper">
          <table className="verification-table">
            <thead>
              <tr>
                <th>{t("admin.verifications.farmer")}</th>

                <th>{t("admin.common.district")}</th>

                <th>{t("admin.verifications.nicNumber")}</th>

                <th>{t("admin.verifications.submittedDate")}</th>

                <th>{t("admin.common.status")}</th>

                <th className="action-column">{t("admin.common.action")}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="verification-empty">
                    {t("admin.verifications.loadingRequests")}
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((farmer) => (
                  <tr key={farmer.id}>
                    <td>
                      <div className="verification-farmer">
                        <div className="verification-avatar">
                          {farmer.avatar ? (
                            <img
                              src={fileUrl(farmer.avatar)}
                              alt={farmer.name}
                            />
                          ) : (
                            farmer.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                          )}
                        </div>

                        <div>
                          <strong>{farmer.name}</strong>

                          <span>{farmer.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{getDistrictLabel(t, farmer.district)}</td>

                    <td>{farmer.nic}</td>

                    <td>{farmer.submittedDate}</td>

                    <td>
                      <span className={`verification-status ${farmer.status}`}>
                        {farmer.status === "approved"
                          ? t("admin.verifications.accepted")
                          : t(`admin.verifications.${farmer.status}`, { defaultValue: farmer.status })}
                      </span>
                    </td>

                    {/* ONLY VIEW BUTTON */}

                    <td className="action-column">
                      <button
                        type="button"
                        className="verification-view-btn"
                        onClick={() => handleView(farmer.id)}
                      >
                        {t("admin.common.view")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="verification-empty">
                    {t("admin.verifications.empty", { status: t(`admin.verifications.${activeTab === "approved" ? "accepted" : activeTab}`) })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =================================
            PAGINATION
        ================================= */}

        <div className="verification-pagination">
          <p>
            Showing {filteredData.length === 0 ? 0 : startIndex + 1}
            {"-"}
            {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} requests
          </p>

          <div className="verification-pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <FiChevronLeft />
            </button>

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                type="button"
                key={page}
                className={currentPage === page ? "active" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================
          LOADING DETAILS
      ===================================== */}

      {detailsLoading && (
        <div className="verification-modal-backdrop">
          <div className="verification-loading-modal">
            {t("admin.verifications.loadingDetails")}
          </div>
        </div>
      )}

      {/* =====================================
          VERIFICATION MODAL
      ===================================== */}

      {selectedFarmer && !detailsLoading && (
        <div className="verification-modal-backdrop">
          <div className="verification-review-modal">
            {/* HEADER */}

            <div className="verification-modal-header">
              <div>
                <h2>{t("admin.verifications.title")}</h2>

                <p>{t("admin.verifications.reviewSubtitle")}</p>
              </div>

              <button type="button" onClick={closeModal}>
                <FiX />
              </button>
            </div>

            <div className="verification-modal-body">
              {/* =================================
                  REGISTRATION DETAILS
              ================================= */}

              <section className="verification-detail-section">
                <h3>{t("admin.verifications.registrationDetails")}</h3>

                <div className="verification-detail-grid">
                  <div>
                    <span>{t("admin.verifications.fullName")}</span>

                    <strong>{selectedFarmer.name}</strong>
                  </div>

                  <div>
                    <span>{t("admin.verifications.email")}</span>

                    <strong>{selectedFarmer.email}</strong>
                  </div>

                  <div>
                    <span>{t("admin.verifications.phone")}</span>

                    <strong>{selectedFarmer.phone}</strong>
                  </div>

                  <div>
                    <span>{t("admin.common.district")}</span>

                    <strong>{getDistrictLabel(t, selectedFarmer.district)}</strong>
                  </div>

                  <div>
                    <span>{t("admin.verifications.language")}</span>

                    <strong>{selectedFarmer.language}</strong>
                  </div>

                  <div>
                    <span>{t("admin.verifications.nicNumber")}</span>

                    <strong>{selectedFarmer.nic}</strong>
                  </div>

                  <div>
                    <span>{t("admin.verifications.farmLocation")}</span>

                    <strong>{selectedFarmer.farmLocation}</strong>
                  </div>

                  <div>
                    <span>{t("admin.verifications.registeredDate")}</span>

                    <strong>{selectedFarmer.registeredDate}</strong>
                  </div>
                </div>
              </section>

              {/* =================================
                  EVIDENCE
              ================================= */}

              <section className="verification-detail-section">
                <h3>{t("admin.verifications.documents")}</h3>

                <div className="verification-document-grid">
                  {/* NIC IMAGE */}

                  <div className="verification-document-card">
                    <FiImage />

                    <div>
                      <strong>{t("admin.verifications.nicImage")}</strong>

                      <span>{t("admin.verifications.identityDocument")}</span>
                    </div>

                    {selectedFarmer.nicImage ? (
                      <a
                        href={fileUrl(selectedFarmer.nicImage)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("admin.common.view")}
                      </a>
                    ) : (
                      <span>{t("admin.common.notAvailable")}</span>
                    )}
                  </div>

                  {/* FARM EVIDENCE */}

                  <div className="verification-document-card">
                    <FiFileText />

                    <div>
                      <strong>{t("admin.verifications.farmEvidence")}</strong>

                      <span>{t("admin.verifications.submittedEvidence")}</span>
                    </div>

                    {selectedFarmer.evidenceFile ? (
                      <a
                        href={fileUrl(selectedFarmer.evidenceFile)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("admin.common.view")}
                      </a>
                    ) : (
                      <span>{t("admin.common.notAvailable")}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* =================================
                  PENDING DECISION
              ================================= */}

              {selectedFarmer.status === "pending" && (
                <>
                  <section className="verification-detail-section">
                    <h3>{t("admin.verifications.decision")}</h3>

                    <div className="verification-decision-buttons">
                      <button
                        type="button"
                        className={
                          decision === "accept" ? "accept active" : "accept"
                        }
                        onClick={() => chooseDecision("accept")}
                      >
                        <FiCheckCircle />
                        {t("admin.verifications.accept")}
                      </button>

                      <button
                        type="button"
                        className={
                          decision === "reject" ? "reject active" : "reject"
                        }
                        onClick={() => chooseDecision("reject")}
                      >
                        <FiXCircle />
                        {t("admin.verifications.reject")}
                      </button>
                    </div>
                  </section>

                  {/* =================================
                      CRITERIA
                  ================================= */}

                  {decision && (
                    <section className="verification-detail-section">
                      <h3>
                        {decision === "accept"
                          ? t("admin.verifications.trustCriteria")
                          : t("admin.verifications.rejectionReasons")}
                      </h3>

                      {decision === "accept" && (
                        <div className="verification-star-preview">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={star <= rating ? "filled" : ""}
                            />
                          ))}

                          <span>
                            {t("admin.verifications.initialFarmerRating", "Initial Rating:")} {rating}/5
                          </span>
                        </div>
                      )}

                      <div className="verification-criteria-list">
                        {(decision === "accept"
                          ? positiveCriteria
                          : negativeCriteria
                        ).map((criterion, index) => (
                          <label
                            key={criterion}
                            className="verification-criterion"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCriteria.includes(criterion)}
                              onChange={() => toggleCriterion(criterion)}
                            />

                            <span className="verification-criterion-number">
                              {decision === "accept"
                                ? `${index + 1} ★`
                                : index + 1}
                            </span>

                            <span>{t(`admin.verifications.criteria.${decision === "accept" ? "positive" : "negative"}.${criterion}`)}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* =================================
                      FEEDBACK
                  ================================= */}

                  {decision && (
                    <section className="verification-detail-section">
                      <h3>{t("admin.verifications.feedback")}</h3>

                      <textarea
                        className="verification-feedback"
                        value={feedback}
                        placeholder={t("admin.verifications.feedbackPlaceholder")}
                        maxLength={500}
                        rows={4}
                        onChange={(event) => setFeedback(event.target.value)}
                      />
                    </section>
                  )}

                  {/* ERROR */}

                  {submitError && (
                    <p className="verification-submit-error">{submitError}</p>
                  )}

                  {/* =================================
                      FOOTER
                  ================================= */}

                  <div className="verification-modal-footer">
                    <button
                      type="button"
                      className="verification-modal-cancel"
                      onClick={closeModal}
                      disabled={submitting}
                    >
                      {t("admin.common.cancel")}
                    </button>

                    <button
                      type="button"
                      className="verification-modal-submit"
                      onClick={handleSubmit}
                      disabled={submitting || !decision}
                    >
                      {submitting ? t("admin.common.submitting") : t("admin.verifications.submitDecision")}
                    </button>
                  </div>
                </>
              )}

              {/* =================================
                  ALREADY REVIEWED
              ================================= */}

              {selectedFarmer.status !== "pending" && (
                <section className="verification-detail-section">
                  <h3>{t("admin.verifications.result")}</h3>

                  <p>
                    {t("admin.common.status")}:{" "}
                    <strong>
                      {selectedFarmer.status === "approved"
                        ? t("admin.verifications.accepted")
                        : t("admin.verifications.rejected")}
                    </strong>
                  </p>

                  {selectedFarmer.status === "approved" && (
                    <div className="verification-star-preview">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          className={
                            star <= Number(selectedFarmer.rating || 0)
                              ? "filled"
                              : ""
                          }
                        />
                      ))}

                      <span>
                        {t("admin.verifications.initialFarmerRating", "Initial Rating:")} {selectedFarmer.rating || 0}/5
                      </span>
                    </div>
                  )}

                  <p>
                    {t("admin.verifications.feedback")}:{" "}
                    {selectedFarmer.feedback || t("admin.verifications.noFeedback")}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
