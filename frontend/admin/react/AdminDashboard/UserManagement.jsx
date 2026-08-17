import React, { useMemo, useState } from "react";

import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import "../../csss/AdminDashboard/admin.css";


const userData = [
  {
    id: 1,
    name: "Sunil Perera",
    email: "sunil.p@email.com",
    role: "farmer",
    district: "Anuradhapura",
    joinedDate: "Oct 12, 2023",
    status: "active",
    avatar: null,
  },
  {
    id: 2,
    name: "Cargills FoodCity",
    email: "purchasing@cargills.lk",
    role: "buyer",
    district: "Colombo",
    joinedDate: "Sep 05, 2023",
    status: "active",
    avatar: null,
  },
  {
    id: 3,
    name: "Nimali Silva",
    email: "nimali.s@agrotrade.lk",
    role: "buyer",
    district: "Kurunegala",
    joinedDate: "Nov 22, 2023",
    status: "inactive",
    avatar: null,
  },
  {
    id: 4,
    name: "Kamal Appuhamy",
    email: "kamal.a@email.com",
    role: "farmer",
    district: "Polonnaruwa",
    joinedDate: "Jan 15, 2024",
    status: "active",
    avatar: null,
  },
];


export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 4;


  const filteredUsers = useMemo(() => {
    return userData.filter((user) => {
      const searchText =
        search.trim().toLowerCase();

      const searchMatch =
        searchText === "" ||
        user.name
          .toLowerCase()
          .includes(searchText) ||
        user.email
          .toLowerCase()
          .includes(searchText) ||
        user.district
          .toLowerCase()
          .includes(searchText);

      const roleMatch =
        roleFilter === "all" ||
        user.role === roleFilter;

      const statusMatch =
        statusFilter === "all" ||
        user.status === statusFilter;

      return (
        searchMatch &&
        roleMatch &&
        statusMatch
      );
    });
  }, [
    search,
    roleFilter,
    statusFilter,
  ]);


  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length /
        itemsPerPage
    )
  );


  const startIndex =
    (currentPage - 1) *
    itemsPerPage;


  const currentUsers =
    filteredUsers.slice(
      startIndex,
      startIndex + itemsPerPage
    );


  const handleAddUser = () => {
    console.log("Add user");
  };


  const handleRemoveUser = (user) => {
    console.log(
      "Remove user:",
      user
    );
  };


  const handleWarnUser = (user) => {
    console.log(
      "Issue warning:",
      user
    );
  };


  return (
    <div className="user-management-page">

      {/* =========================
          HEADER
      ========================= */}

      <section className="user-management-header">

        <div>
          <h1>
            User Management
          </h1>

          <p>
            Manage farmers, buyers, and marketplace accounts.
          </p>
        </div>

        <button
          type="button"
          className="user-add-btn"
          onClick={handleAddUser}
        >
          <FiPlus />
          Add User
        </button>

      </section>


      {/* =========================
          FILTER BAR
      ========================= */}

      <section className="user-filter-card">

        <div className="user-search-box">

          <FiSearch />

          <input
            type="text"
            placeholder="Search users by name, email..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setCurrentPage(1);
            }}
          />

        </div>


        <div className="user-filter-group">


          <div className="user-filter-item">

            <label>
              Role:
            </label>

            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(
                  event.target.value
                );

                setCurrentPage(1);
              }}
            >
              <option value="all">
                All Roles
              </option>

              <option value="farmer">
                Farmers
              </option>

              <option value="buyer">
                Buyers
              </option>
            </select>

          </div>


          <div className="user-filter-item">

            <label>
              Status:
            </label>

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
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

          </div>

        </div>

      </section>


      {/* =========================
          TABLE CARD
      ========================= */}

      <section className="user-table-card">

        <div className="user-table-scroll">

          <table className="user-management-table">

            <thead>

              <tr>

                <th>
                  User
                </th>

                <th>
                  Role
                </th>

                <th>
                  District
                </th>

                <th>
                  Joined Date
                </th>

                <th>
                  Status
                </th>

                <th className="user-action-heading">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {currentUsers.length > 0 ? (

                currentUsers.map(
                  (user) => (

                    <tr key={user.id}>


                      {/* USER */}

                      <td>

                        <div className="user-info">

                          <div
                            className={`user-management-avatar ${user.role}`}
                          >

                            {user.avatar ? (

                              <img
                                src={
                                  user.avatar
                                }
                                alt={
                                  user.name
                                }
                              />

                            ) : (

                              user.name
                                .split(" ")
                                .map(
                                  (word) =>
                                    word[0]
                                )
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()

                            )}

                          </div>


                          <div>

                            <strong>
                              {user.name}
                            </strong>

                            <span>
                              {user.email}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* ROLE */}

                      <td>

                        <span
                          className={`user-role-badge ${user.role}`}
                        >
                          {user.role ===
                          "farmer"
                            ? "Farmer"
                            : "Buyer"}
                        </span>

                      </td>


                      <td className="user-muted">
                        {user.district}
                      </td>


                      <td className="user-muted">
                        {user.joinedDate}
                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`user-status-badge ${user.status}`}
                        >
                          <span />

                          {user.status ===
                          "active"
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>


                      {/* ACTION */}

                      <td className="user-action-cell">

                        <div className="user-actions">

                          <button
                            type="button"
                            className="user-delete-btn"
                            title="Remove User"
                            onClick={() =>
                              handleRemoveUser(
                                user
                              )
                            }
                          >
                            <FiTrash2 />
                          </button>


                          <button
                            type="button"
                            className="user-warning-btn"
                            title="Issue Warning"
                            onClick={() =>
                              handleWarnUser(
                                user
                              )
                            }
                          >
                            <FiAlertTriangle />
                          </button>

                        </div>

                      </td>


                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="6"
                    className="user-empty"
                  >
                    No users found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =========================
            PAGINATION
        ========================= */}

        <div className="user-pagination">

          <p>

            Showing{" "}

            {filteredUsers.length === 0
              ? 0
              : startIndex + 1}

            {" "}to{" "}

            {Math.min(
              startIndex +
                itemsPerPage,
              filteredUsers.length
            )}

            {" "}of{" "}

            {filteredUsers.length}

            {" "}entries

          </p>


          <div className="user-pages">

            <button
              type="button"
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
                type="button"
                key={page}
                className={
                  currentPage === page
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
              type="button"
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