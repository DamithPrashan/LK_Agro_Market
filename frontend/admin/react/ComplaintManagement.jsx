import React, { useMemo, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiArrowUp,
  FiMinus,
  FiSearch,
  FiCalendar,
  FiFilter,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import "../csss/AdminDashboard/admin.css";


const complaintData = [
  {
    id: "C-4029",
    buyer: "John Doe Traders",
    buyerInitials: "JD",
    crop: "Robusta Coffee (Lot 8A)",
    reason: "Quality Dispute",
    date: "Oct 24, 2023",
    status: "open",
    priority: "high",
  },
  {
    id: "C-4028",
    buyer: "Sarah Mills Ltd.",
    buyerInitials: "SM",
    crop: "Organic Cardamom",
    reason: "Short Delivery",
    date: "Oct 23, 2023",
    status: "open",
    priority: "normal",
  },
  {
    id: "C-4025",
    buyer: "Global Traders Inc.",
    buyerInitials: "GT",
    crop: "Black Pepper",
    reason: "Payment Delay",
    date: "Oct 20, 2023",
    status: "resolved",
    priority: "normal",
  },
  {
    id: "C-4024",
    buyer: "Green Valley Foods",
    buyerInitials: "GV",
    crop: "Tomato",
    reason: "Incorrect Quantity",
    date: "Oct 18, 2023",
    status: "dismissed",
    priority: "normal",
  },
];


export default function ComplaintManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;


  const counts = useMemo(() => {
    return {
      open: complaintData.filter(
        (item) => item.status === "open"
      ).length,

      resolved: complaintData.filter(
        (item) => item.status === "resolved"
      ).length,

      dismissed: complaintData.filter(
        (item) => item.status === "dismissed"
      ).length,
    };
  }, []);


  const filteredComplaints = useMemo(() => {
    return complaintData.filter((item) => {
      const tabMatch =
        activeTab === "all" ||
        item.status === activeTab;

      const statusMatch =
        statusFilter === "all" ||
        item.status === statusFilter;

      const searchText =
        search.toLowerCase().trim();

      const searchMatch =
        searchText === "" ||
        item.id.toLowerCase().includes(searchText) ||
        item.buyer.toLowerCase().includes(searchText) ||
        item.crop.toLowerCase().includes(searchText) ||
        item.reason.toLowerCase().includes(searchText);

      return (
        tabMatch &&
        statusMatch &&
        searchMatch
      );
    });
  }, [
    activeTab,
    statusFilter,
    search,
  ]);


  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredComplaints.length /
        itemsPerPage
    )
  );


  const startIndex =
    (currentPage - 1) *
    itemsPerPage;


  const currentItems =
    filteredComplaints.slice(
      startIndex,
      startIndex + itemsPerPage
    );


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };


  const handleView = (complaint) => {
    console.log(
      "View complaint:",
      complaint
    );

    // backend/router later
  };


  const priorityComplaint =
    complaintData.find(
      (item) =>
        item.priority === "high" &&
        item.status === "open"
    );


  return (
    <div className="complaint-page">

      {/* =============================
          HEADER
      ============================== */}

      <section className="complaint-header">

        <h1>
          Complaint Management
        </h1>

        <p>
          Review and manage marketplace complaints.
        </p>

      </section>


      {/* =============================
          STATUS OVERVIEW
      ============================== */}

      <section className="complaint-overview">

        <div className="complaint-stat-grid">


          <article className="complaint-stat-card">

            <div className="complaint-stat-top">

              <span>
                OPEN
              </span>

              <FiAlertCircle className="complaint-stat-symbol open" />

            </div>

            <strong>
              {counts.open}
            </strong>

            <div className="complaint-stat-trend open">
              <FiArrowUp />
              2 since yesterday
            </div>

          </article>


          <article className="complaint-stat-card">

            <div className="complaint-stat-top">

              <span>
                RESOLVED
              </span>

              <FiCheckCircle className="complaint-stat-symbol resolved" />

            </div>

            <strong>
              {counts.resolved}
            </strong>

            <div className="complaint-stat-trend resolved">
              <FiArrowUp />
              5 this week
            </div>

          </article>


          <article className="complaint-stat-card">

            <div className="complaint-stat-top">

              <span>
                DISMISSED
              </span>

              <FiXCircle className="complaint-stat-symbol dismissed" />

            </div>

            <strong>
              {counts.dismissed}
            </strong>

            <div className="complaint-stat-trend dismissed">
              <FiMinus />
              No change
            </div>

          </article>

        </div>


        {/* Priority Actions */}

        <article className="complaint-priority-card">

          <h2>
            Priority Actions
          </h2>

          {priorityComplaint ? (

            <>

              <div className="complaint-alert-box">

                <FiAlertTriangle />

                <div>

                  <strong>
                    High Severity Alert
                  </strong>

                  <p>
                    Complaint #{priorityComplaint.id} requires
                    immediate admin review.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  handleView(
                    priorityComplaint
                  )
                }
              >
                Review Priority Items
              </button>

            </>

          ) : (

            <p className="complaint-no-priority">
              No priority complaints.
            </p>

          )}

        </article>

      </section>


      {/* =============================
          MANAGEMENT CARD
      ============================== */}

      <section className="complaint-management-card">


        {/* TOOLBAR */}

        <div className="complaint-toolbar">


          {/* Status tabs */}

          <div className="complaint-tabs">

            <button
              className={
                activeTab === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleTabChange("all")
              }
            >
              All Complaints
            </button>


            <button
              className={
                activeTab === "open"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleTabChange("open")
              }
            >
              Open ({counts.open})
            </button>


            <button
              className={
                activeTab === "resolved"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleTabChange("resolved")
              }
            >
              Resolved ({counts.resolved})
            </button>


            <button
              className={
                activeTab === "dismissed"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleTabChange("dismissed")
              }
            >
              Dismissed ({counts.dismissed})
            </button>

          </div>


          {/* Filters */}

          <div className="complaint-filters">


            <div className="complaint-search-box">

              <FiSearch />

              <input
                type="text"
                placeholder="Filter by ID, Buyer..."
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );

                  setCurrentPage(1);
                }}
              />

            </div>


            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value
                );

                setCurrentPage(1);
              }}
            >

              <option value="all">
                All Statuses
              </option>

              <option value="open">
                Open
              </option>

              <option value="resolved">
                Resolved
              </option>

              <option value="dismissed">
                Dismissed
              </option>

            </select>


            <button
              type="button"
              className="complaint-date-btn"
            >
              <FiCalendar />
              Last 30 Days
            </button>


            <button
              type="button"
              className="complaint-filter-btn"
            >
              <FiFilter />
            </button>

          </div>

        </div>


        {/* TABLE */}

        <div className="complaint-table-scroll">

          <table className="complaint-table">

            <thead>

              <tr>

                <th>
                  Complaint ID
                </th>

                <th>
                  Buyer
                </th>

                <th>
                  Related Crop
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Date
                </th>

                <th>
                  Status
                </th>

                <th className="complaint-action-heading">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {currentItems.length > 0 ? (

                currentItems.map(
                  (complaint) => (

                    <tr key={complaint.id}>


                      <td className="complaint-id">
                        #{complaint.id}
                      </td>


                      <td>

                        <div className="complaint-buyer">

                          <div
                            className={`complaint-buyer-avatar ${complaint.status}`}
                          >
                            {
                              complaint.buyerInitials
                            }
                          </div>

                          <span>
                            {
                              complaint.buyer
                            }
                          </span>

                        </div>

                      </td>


                      <td className="complaint-muted">
                        {complaint.crop}
                      </td>


                      <td>
                        {complaint.reason}
                      </td>


                      <td className="complaint-muted">
                        {complaint.date}
                      </td>


                      <td>

                        <span
                          className={`complaint-status ${complaint.status}`}
                        >
                          <span />

                          {complaint.status
                            .charAt(0)
                            .toUpperCase() +
                            complaint.status.slice(
                              1
                            )}
                        </span>

                      </td>


                      <td className="complaint-action-cell">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              complaint
                            )
                          }
                        >

                          {complaint.status ===
                          "resolved"
                            ? "View Log"
                            : "View Details"}

                        </button>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="complaint-empty"
                  >
                    No complaints found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* PAGINATION */}

        <div className="complaint-pagination">

          <span>

            Showing{" "}

            {filteredComplaints.length === 0
              ? 0
              : startIndex + 1}

            {"-"}        

            {Math.min(
              startIndex +
                itemsPerPage,
              filteredComplaints.length
            )}

            {" "}of{" "}

            {filteredComplaints.length}

            {" "}complaints

          </span>


          <div className="complaint-pages">

            <button
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
            >
              <FiChevronLeft />
            </button>


            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            ).map((page) => (

              <button
                key={page}
                className={
                  page === currentPage
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCurrentPage(
                    page
                  )
                }
              >
                {page}
              </button>

            ))}


            <button
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              <FiChevronRight />
            </button>

          </div>

        </div>


      </section>

    </div>
  );
}
