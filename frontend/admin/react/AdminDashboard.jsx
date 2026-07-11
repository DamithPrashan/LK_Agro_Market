import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navbar.jsx";
import Footer from "../../components/footer.jsx";

import StatCard from "./AdminDashboard/StatCard.jsx";
import DashboardCharts from "./AdminDashboard/DashboardCharts.jsx";
import RatingCard from "./AdminDashboard/RatingCard.jsx";
import CalendarSection from "./AdminDashboard/CalendarSection.jsx";
import { useAuth } from "../../../src/context/AuthContext";

import "../csss/AdminDashboard/admin.css";

function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [welcomeMsg, setWelcomeMsg] = useState("Welcome");
    const [complaints, setComplaints] = useState([]);

    useEffect(() => {
        if (user) {
            const key = `hasLoggedIn_${user.id}`;
            if (localStorage.getItem(key)) {
                setWelcomeMsg(`Welcome Back ${user.name} 👋`);
            } else {
                setWelcomeMsg(`Welcome ${user.name} 👋`);
                localStorage.setItem(key, "true");
            }
        }
    }, [user]);
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
                    Monitor LK Agro Market activity
                </p>

            </div>


            <div className="stats-container">

                <StatCard
                    title="Farmers"
                    value={stats.farmers ?? "0"}
                />

                <StatCard
                    title="Buyers"
                    value={stats.buyers ?? "0"}
                />

                <StatCard
                    title="Orders"
                    value={stats.orders ?? "0"}
                />

                <StatCard
                    title="Complaints"
                    value={stats.complaints ?? "0"}
                />

            </div>


            <div className="chart-row">

                <DashboardCharts />

                <CalendarSection />

            </div>


            <div className="rating-section">

                <RatingCard
                    title="Farmer Ratings"
                    rating="4.8"
                />

                <RatingCard
                    title="Buyer Ratings"
                    rating="4.6"
                />

            </div>

            {/* pending farmers and complaints */}

            <div className="dashboard-card">

                <h2>
                    Pending Farmer Verifications
                </h2>

                <table>

                    <thead>

                        <tr>

                            <th>Farmer</th>
                            <th>District</th>
                            <th>NIC</th>
                            <th>Action</th>

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
                                        <button>Verify</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", color: "#666" }}>
                                    No pending farmer verifications
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>



            <div className="dashboard-card">

                <h2>
                    Open Complaints
                </h2>

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Buyer</th>
                            <th>Reason</th>
                            <th>Status</th>

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
                                            {comp.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", color: "#666" }}>
                                    No complaints found
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

            </div>

            <div className="dashboard-card">

                <h2>
                    Pre-orders by District
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

                <h2>User Management</h2>

                <table>

                    <thead>

                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td>R.M.S.T Randeniya</td>
                            <td>Farmer</td>
                            <td>Active</td>
                            <td>

                                <button>View</button>

                            </td>

                        </tr>

                        <tr>

                            <td>Kumari Perera</td>
                            <td>Buyer</td>
                            <td>Active</td>
                            <td>

                                <button>View</button>

                            </td>

                        </tr>

                        <tr>

                            <td>Nimal Silva</td>
                            <td>Farmer</td>
                            <td>Active</td>
                            <td>

                                <button>View</button>

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