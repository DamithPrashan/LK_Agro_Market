import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Navbar from "../../components/navbar.jsx";
import Footer from "../../components/footer.jsx";

import StatCard from "./AdminDashboard/StatCard.jsx";
import DashboardCharts from "./AdminDashboard/DashboardCharts.jsx";
import RatingCard from "./AdminDashboard/RatingCard.jsx";
import CalendarSection from "./AdminDashboard/CalendarSection.jsx";
import { useAuth } from "../../../src/context/AuthContext";

import "../csss/AdminDashboard/admin.css";

const complaintStatusKeyMap = {
  "pending": "orders.status.pending",
  "resolved": "farmer.statusResolved",
  "dismissed": "buttons.dismiss"
};

function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [welcomeMsg, setWelcomeMsg] = useState("Welcome");
    const [complaints, setComplaints] = useState([]);

    useEffect(() => {
        if (user) {
            const key = `hasLoggedIn_${user.id}`;
            if (localStorage.getItem(key)) {
                setWelcomeMsg(t("admin.dashboard.welcomeBack", { name: user.name }));
            } else {
                setWelcomeMsg(t("admin.dashboard.welcome", { name: user.name }));
                localStorage.setItem(key, "true");
            }
        }
    }, [user, t]);
    const [stats, setStats] = useState({
        farmers: "0",
        buyers: "0",
        orders: "0",
        complaints: "0",
        pendingVerification: []
    });

    useEffect(() => {
        fetch("/backend/Apis/admin/dashboardStats.php")
            .then(res => res.json())
            .then(data => {
                setStats(data);
            })
            .catch(err => {
                console.error(err);
            });
            // complaint page parts

        fetch("/backend/get_complaints_list.php")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.complaints) {
                    setComplaints(data.complaints);
                }
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (

        <div className="dashboard">

            <div className="dashboard-header">

                <h1>{welcomeMsg}</h1>

                <p>
                    {t("admin.dashboard.monitorActivity")}
                </p>

            </div>


            <div className="stats-container">

                <StatCard
                    title={t("admin.dashboard.stats.farmers")}
                    value={stats.farmers ?? "0"}
                />

                <StatCard
                    title={t("admin.dashboard.stats.buyers")}
                    value={stats.buyers ?? "0"}
                />

                <StatCard
                    title={t("admin.dashboard.stats.orders")}
                    value={stats.orders ?? "0"}
                />

                <StatCard
                    title={t("admin.dashboard.stats.complaints")}
                    value={stats.complaints ?? "0"}
                />

            </div>


            <div className="chart-row">

                <DashboardCharts />

                <CalendarSection />

            </div>


            <div className="rating-section">

                <RatingCard
                    title={t("admin.dashboard.stats.farmerRatings")}
                    rating="4.8"
                />

                <RatingCard
                    title={t("admin.dashboard.stats.buyerRatings")}
                    rating="4.6"
                />

            </div>

            {/* pending farmers and complaints */}

            <div className="dashboard-card">

                <h2>
                    {t("admin.dashboard.pendingVerifications")}
                </h2>

                <table>

                    <thead>

                        <tr>

                            <th>{t("admin.verifications.tableFarmer")}</th>
                            <th>{t("forms.district")}</th>
                            <th>{t("verification.nic")}</th>
                            <th>{t("admin.verifications.tableAction")}</th>

                        </tr>

                    </thead>

                    <tbody>

                        {stats.pendingVerification && stats.pendingVerification.length > 0 ? (
                            stats.pendingVerification.map((pv, index) => (
                                <tr key={pv.verification_id || index}>
                                    <td>{pv.farmer_name}</td>
                                    <td>{pv.farm_location || pv.farmer_district}</td>
                                    <td>{pv.nic_number}</td>
                                    <td>
                                        <button>{t("admin.buttons.verify")}</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", color: "#666" }}>
                                    {t("emptyStates.noPendingVerifications")}
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>



            <div className="dashboard-card">

                <h2>
                    {t("admin.dashboard.openComplaints")}
                </h2>

                <table>

                    <thead>

                        <tr>

                            <th>{t("admin.complaints.tableId")}</th>
                            <th>{t("admin.complaints.tableBuyer")}</th>
                            <th>{t("admin.complaints.tableReason")}</th>
                            <th>{t("admin.complaints.tableStatus")}</th>

                        </tr>

                    </thead>

                    <tbody>
                        {complaints.length > 0 ? (
                            complaints.map((comp) => (
                                <tr 
                                    key={comp.complaint_id} 
                                    onClick={() => navigate(`/admin/complaint/${comp.complaint_id}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <td>#{comp.complaint_id}</td>
                                    <td>{comp.buyer_name}</td>
                                    <td>{comp.reason} ({comp.crop_name})</td>
                                    <td>
                                        <span className={`status ${comp.status === 'resolved' || comp.status === 'dismissed' ? 'resolved' : 'pending'}`}>
                                            {t(complaintStatusKeyMap[comp.status] || comp.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", color: "#666" }}>
                                    {t("emptyStates.noComplaints")}
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

            </div>

            <div className="dashboard-card">

                <h2>
                    {t("admin.dashboard.preordersByDistrict")}
                </h2>

                <div className="district">

                    <span className="district-name">
                        Badulla
                    </span>

                    <div className="bar">
                        <div className="fill fill1"></div>
                    </div>

                    <span className="district-value">
                        18
                    </span>

                </div>


                <div className="district">

                    <span className="district-name">
                        Kandy
                    </span>

                    <div className="bar">
                        <div className="fill fill2"></div>
                    </div>

                    <span className="district-value">
                        11
                    </span>

                </div>


                <div className="district">

                    <span className="district-name">
                        Colombo
                    </span>

                    <div className="bar">
                        <div className="fill fill3"></div>
                    </div>

                    <span className="district-value">
                        8
                    </span>

                </div>


                <div className="district">

                    <span className="district-name">
                        Galle
                    </span>

                    <div className="bar">
                        <div className="fill fill4"></div>
                    </div>

                    <span className="district-value">
                        4
                    </span>

                </div>

            </div>


            <div className="dashboard-card">

                <h2>{t("admin.dashboard.userManagement")}</h2>

                <table>

                    <thead>

                        <tr>
                            <th>{t("forms.fullName")}</th>
                            <th>{t("admin.users.role")}</th>
                            <th>{t("admin.users.status")}</th>
                            <th>{t("admin.users.action")}</th>
                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td>R.M.S.T Randeniya</td>
                            <td>{t("register.roleFarmer")}</td>
                            <td>{t("admin.users.statusActive")}</td>
                            <td>

                                <button>{t("admin.buttons.view")}</button>

                            </td>

                        </tr>

                        <tr>

                            <td>Kumari Perera</td>
                            <td>{t("register.roleBuyer")}</td>
                            <td>{t("admin.users.statusActive")}</td>
                            <td>

                                <button>{t("admin.buttons.view")}</button>

                            </td>

                        </tr>

                        <tr>

                            <td>Nimal Silva</td>
                            <td>{t("register.roleFarmer")}</td>
                            <td>{t("admin.users.statusActive")}</td>
                            <td>

                                <button>{t("admin.buttons.view")}</button>

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

            <footer />

        </div>


    )

}

export default AdminDashboard