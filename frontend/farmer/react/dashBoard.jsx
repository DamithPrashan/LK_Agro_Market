import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";
// import tomatoImg from "../assets/tomato.jpg";
// import carrotImg from "../assets/carrot.jpg";
// import cabbageImg from "../assets/cabbage.jpg"; 

function App() {
    const navigate = useNavigate();
    return (
        <div className="dashboard">

            {/* Navbar */}


            <div className="main-content">

                {/* Content */}
                <section className="content">

                    <div className="page-header">
                        <h1>Farmer Dashboard</h1>
                        <p>Welcome back, Randeniya - Badulla District</p>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">

                        <div className="card">
                            <h2>4</h2>
                            <p>Active Listings</p>
                        </div>

                        <div className="card">
                            <h2>7</h2>
                            <p>Pending Orders</p>
                        </div>

                        <div className="card">
                            <h2>Rs 42,500</h2>
                            <p>This Month</p>
                        </div>

                        <div className="card">
                            <h2>4.8 ★</h2>
                            <p>My Rating</p>
                        </div>

                    </div>

                    {/* Forecast */}
                    <div className="section">
                        <div className="section-header">
                            <h3>CROP DEMAND FORECASTING MODULE</h3>
                        </div>

                        <div className="forecast-grid">

                            <div className="forecast-card">
                                <h4>🍅 Tomato</h4>
                                <p>340 kg Forecast</p>
                            </div>

                            <div className="forecast-card">
                                <h4>🥕 Carrot</h4>
                                <p>210 kg Forecast</p>
                            </div>

                            <div className="forecast-card purple">
                                <h4>🥬 Cabbage</h4>
                                <p>High Demand</p>
                            </div>

                        </div>
                    </div>

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
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Harvest Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td>🍅 Tomato</td>
                                    <td>250 kg</td>
                                    <td>Rs 85/kg</td>
                                    <td>20 Jun</td>
                                    <td><span className="status active-status">Active</span></td>
                                </tr>

                                <tr>
                                    <td>🥕 Carrot</td>
                                    <td>180 kg</td>
                                    <td>Rs 65/kg</td>
                                    <td>28 Jun</td>
                                    <td><span className="status active-status">Active</span></td>
                                </tr>

                                <tr>
                                    <td>🥬 Leeks</td>
                                    <td>120 kg</td>
                                    <td>Rs 90/kg</td>
                                    <td>05 Jul</td>
                                    <td><span className="status pending-status">Pending</span></td>
                                </tr>
                            </tbody>
                        </table>

                    </div>

                    {/* Orders */}
                    <div className="section">

                        <div className="section-header">
                            <h3>INCOMING PRE-ORDER REQUESTS</h3>
                        </div>

                        <div className="order-card">
                            <h4>Order #2041 - Hotel Ella Inn</h4>
                            <p>Tomato - 60kg - Rs 5,100</p>

                            <div className="buttons">
                                <button className="accept">Accept</button>
                                <button className="partial">Partial</button>
                                <button className="decline">Decline</button>
                            </div>
                        </div>

                    </div>

                </section>
            </div>
        </div>
    );
}

export default App;