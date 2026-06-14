import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";

function DashBoard() {
    const navigate = useNavigate();

    return (
        <div className="dashboard">

            <div className="content">

                {/* Header */}
                <div className="page-header">
                    <h1>Hello, Randeniya 👋</h1>
                    <p>Here's what's happening with your farm today.</p>
                </div>

                {/* Stats */}
                <div className="stats-grid">

                    <div className="stat-card green">
                        <h4>Active Listings</h4>
                        <h2>12</h2>
                        <p>View all listings</p>
                    </div>

                    <div className="stat-card blue">
                        <h4>Pending Orders</h4>
                        <h2>5</h2>
                        <p>View all orders</p>
                    </div>

                    <div className="stat-card yellow">
                        <h4>Revenue (This Month)</h4>
                        <h2>Rs. 25,000</h2>
                        <p>View details</p>
                    </div>

                    <div className="stat-card red">
                        <h4>Complaints</h4>
                        <h2>1</h2>
                        <p>View complaints</p>
                    </div>

                </div>

                {/* Forecast */}
                <div className="section">
                    <h3>DEMAND FORECAST (Next 30 Days)</h3>

                    <div className="forecast-grid">

                        <div className="forecast-card">
                            <div className="crop-icon">🍅</div>
                            <h4>Tomato</h4>
                            <p className="high">Demand : High</p>
                            <small>250 kg Reserved</small>
                        </div>

                        <div className="forecast-card">
                            <div className="crop-icon">🥕</div>
                            <h4>Carrot</h4>
                            <p className="medium">Demand : Medium</p>
                            <small>120 kg Reserved</small>
                        </div>

                        <div className="forecast-card">
                            <div className="crop-icon">🫘</div>
                            <h4>Beans</h4>
                            <p className="low">Demand : Low</p>
                            <small>80 kg Reserved</small>
                        </div>

                    </div>
                </div>

                {/* Listings + Orders */}
                <div className="bottom-grid">

                    {/* Listings */}
                    <div className="section">

                        <div className="section-header">
                            <h3>MY LISTINGS</h3>

                            <button
                                className="add-btn"
                                onClick={() => navigate("/farmer/add-listing")}
                            >
                                Add Listing
                            </button>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Crop</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Price / Kg</th>
                                    <th>Harvest Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                <tr>
                                    <td>Tomato</td>
                                    <td>Vegetable</td>
                                    <td>200 kg</td>
                                    <td>Rs.250</td>
                                    <td>2026-08-01</td>

                                    <td>
                                        <span className="status active-status">
                                            Active
                                        </span>
                                    </td>

                                    <td>
                                        <button className="edit-btn">Edit</button>
                                        <button className="delete-btn">Delete</button>
                                    </td>
                                </tr>

                                <tr>
                                    <td>Beans</td>
                                    <td>Vegetable</td>
                                    <td>150 kg</td>
                                    <td>Rs.300</td>
                                    <td>2026-07-25</td>

                                    <td>
                                        <span className="status active-status">
                                            Active
                                        </span>
                                    </td>

                                    <td>
                                        <button className="edit-btn">Edit</button>
                                        <button className="delete-btn">Delete</button>
                                    </td>
                                </tr>

                                <tr>
                                    <td>Carrot</td>
                                    <td>Vegetable</td>
                                    <td>100 kg</td>
                                    <td>Rs.180</td>
                                    <td>2026-07-30</td>

                                    <td>
                                        <span className="status sold-status">
                                            Sold Out
                                        </span>
                                    </td>

                                    <td>
                                        <button className="edit-btn">Edit</button>
                                        <button className="delete-btn">Delete</button>
                                    </td>
                                </tr>

                            </tbody>
                        </table>

                    </div>

                    {/* Orders */}
                    <div className="section orders-section">

                        <h3>INCOMING ORDERS</h3>

                        <div className="order-card">
                            <p><b>Buyer :</b> ABC Hotel</p>
                            <p><b>Crop :</b> Tomato</p>
                            <p><b>Quantity :</b> 50 kg</p>
                            <p><b>Collection :</b> 2026-08-10</p>

                            <div className="buttons">
                                <button className="accept">Accept</button>
                                <button className="partial">Partial</button>
                                <button className="decline">Decline</button>
                            </div>
                        </div>

                        <div className="order-card">
                            <p><b>Buyer :</b> XYZ Restaurant</p>
                            <p><b>Crop :</b> Carrot</p>
                            <p><b>Quantity :</b> 30 kg</p>
                            <p><b>Collection :</b> 2026-07-28</p>

                            <div className="buttons">
                                <button className="accept">Accept</button>
                                <button className="partial">Partial</button>
                                <button className="decline">Decline</button>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default DashBoard;