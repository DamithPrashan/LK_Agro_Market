import React, { useEffect, useMemo, useState } from "react";

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

const positiveCriteria = [
  "Identity and NIC information are valid.",
  "Farm location information is clear and consistent.",
  "Submitted farming/crop evidence is sufficient.",
  "Registration information is complete and accurate.",
  "Overall submitted information is trustworthy.",
];

const negativeCriteria = [
  "Identity/NIC information could not be verified.",
  "Farm location information is unclear or inconsistent.",
  "Farming/crop evidence is insufficient.",
  "Registration information is incomplete or inaccurate.",
  "Submitted information is not sufficiently trustworthy.",
];

export default function FarmerVerification() {
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
          data.message || "Unable to load verification requests.",
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
    fetchRequests();
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
        throw new Error(data.message || "Unable to load verification details.");
      }

      setSelectedFarmer(data.verification);

      setDecision("");

      setSelectedCriteria([]);

      setFeedback(data.verification.feedback || "");
    } catch (error) {
      console.error("Verification detail error:", error);

      alert(error.message || "Unable to load verification details.");
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
      setSubmitError("Select Accept or Reject.");

      return;
    }

    if (selectedCriteria.length === 0) {
      setSubmitError(
        decision === "accept"
          ? "Select at least one verification criterion."
          : "Select at least one rejection reason.",
      );

      return;
    }

    if (!feedback.trim()) {
      setSubmitError("Please provide feedback to the farmer.");

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
        throw new Error(data.message || "Verification submission failed.");
      }

      alert(data.message);

      closeModal();

      await fetchRequests();
    } catch (error) {
      console.error("Submit verification error:", error);

      setSubmitError(error.message || "Verification submission failed.");
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

    return path.startsWith("/") ? path : `/${path}`;
  };

  return (
    <div className="verification-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <section className="verification-header">
        <h1>Farmer Verification</h1>

        <p>Manage and review farmer verification requests.</p>
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
            Pending ({counts.pending})
          </button>

          <button
            type="button"
            className={activeTab === "approved" ? "active" : ""}
            onClick={() => handleTabChange("approved")}
          >
            Accepted ({counts.approved})
          </button>

          <button
            type="button"
            className={activeTab === "rejected" ? "active" : ""}
            onClick={() => handleTabChange("rejected")}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        <div className="verification-filter-wrap">
          <button
            type="button"
            className="verification-filter-btn"
            onClick={() => setShowFilter((value) => !value)}
          >
            <FiFilter />
            Filter
          </button>

          {showFilter && (
            <div className="verification-filter-menu">
              <label>District</label>

              <select
                value={districtFilter}
                onChange={(event) => {
                  setDistrictFilter(event.target.value);

                  setCurrentPage(1);
                }}
              >
                <option value="all">All Districts</option>

                {districts.map((district) => (
                  <option value={district} key={district}>
                    {district}
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
                <th>Farmer</th>

                <th>District</th>

                <th>NIC Number</th>

                <th>Submitted Date</th>

                <th>Status</th>

                <th className="action-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="verification-empty">
                    Loading verification requests...
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

                    <td>{farmer.district}</td>

                    <td>{farmer.nic}</td>

                    <td>{farmer.submittedDate}</td>

                    <td>
                      <span className={`verification-status ${farmer.status}`}>
                        {farmer.status === "approved"
                          ? "Accepted"
                          : farmer.status.charAt(0).toUpperCase() +
                            farmer.status.slice(1)}
                      </span>
                    </td>

                    {/* ONLY VIEW BUTTON */}

                    <td className="action-column">
                      <button
                        type="button"
                        className="verification-view-btn"
                        onClick={() => handleView(farmer.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="verification-empty">
                    No {activeTab} verification requests found.
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
            Loading farmer details...
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
                <h2>Farmer Verification</h2>

                <p>Review submitted farmer details and evidence.</p>
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
                <h3>Registration Details</h3>

                <div className="verification-detail-grid">
                  <div>
                    <span>Full Name</span>

                    <strong>{selectedFarmer.name}</strong>
                  </div>

                  <div>
                    <span>Email</span>

                    <strong>{selectedFarmer.email}</strong>
                  </div>

                  <div>
                    <span>Phone</span>

                    <strong>{selectedFarmer.phone}</strong>
                  </div>

                  <div>
                    <span>District</span>

                    <strong>{selectedFarmer.district}</strong>
                  </div>

                  <div>
                    <span>Language</span>

                    <strong>{selectedFarmer.language}</strong>
                  </div>

                  <div>
                    <span>NIC Number</span>

                    <strong>{selectedFarmer.nic}</strong>
                  </div>

                  <div>
                    <span>Farm Location</span>

                    <strong>{selectedFarmer.farmLocation}</strong>
                  </div>

                  <div>
                    <span>Registered Date</span>

                    <strong>{selectedFarmer.registeredDate}</strong>
                  </div>
                </div>
              </section>

              {/* =================================
                  EVIDENCE
              ================================= */}

              <section className="verification-detail-section">
                <h3>Verification Documents</h3>

                <div className="verification-document-grid">
                  {/* NIC IMAGE */}

                  <div className="verification-document-card">
                    <FiImage />

                    <div>
                      <strong>NIC Image</strong>

                      <span>Identity document</span>
                    </div>

                    {selectedFarmer.nicImage ? (
                      <a
                        href={fileUrl(selectedFarmer.nicImage)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <span>Not available</span>
                    )}
                  </div>

                  {/* FARM EVIDENCE */}

                  <div className="verification-document-card">
                    <FiFileText />

                    <div>
                      <strong>Farm Evidence</strong>

                      <span>Submitted farming evidence</span>
                    </div>

                    {selectedFarmer.evidenceFile ? (
                      <a
                        href={fileUrl(selectedFarmer.evidenceFile)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <span>Not available</span>
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
                    <h3>Verification Decision</h3>

                    <div className="verification-decision-buttons">
                      <button
                        type="button"
                        className={
                          decision === "accept" ? "accept active" : "accept"
                        }
                        onClick={() => chooseDecision("accept")}
                      >
                        <FiCheckCircle />
                        Accept
                      </button>

                      <button
                        type="button"
                        className={
                          decision === "reject" ? "reject active" : "reject"
                        }
                        onClick={() => chooseDecision("reject")}
                      >
                        <FiXCircle />
                        Reject
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
                          ? "Trust Rating Criteria"
                          : "Rejection Reasons"}
                      </h3>

                      {decision === "accept" && (
                        <div className="verification-star-preview">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={star <= rating ? "filled" : ""}
                            />
                          ))}

                          <span>{rating}/5</span>
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

                            <span>{criterion}</span>
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
                      <h3>Feedback to Farmer</h3>

                      <textarea
                        className="verification-feedback"
                        value={feedback}
                        placeholder="Enter feedback that will be shown to the farmer..."
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
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="verification-modal-submit"
                      onClick={handleSubmit}
                      disabled={submitting || !decision}
                    >
                      {submitting ? "Submitting..." : "Submit Decision"}
                    </button>
                  </div>
                </>
              )}

              {/* =================================
                  ALREADY REVIEWED
              ================================= */}

              {selectedFarmer.status !== "pending" && (
                <section className="verification-detail-section">
                  <h3>Verification Result</h3>

                  <p>
                    Status:{" "}
                    <strong>
                      {selectedFarmer.status === "approved"
                        ? "Accepted"
                        : "Rejected"}
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

                      <span>{selectedFarmer.rating || 0}/5</span>
                    </div>
                  )}

                  <p>
                    Feedback:{" "}
                    {selectedFarmer.feedback || "No feedback provided."}
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
