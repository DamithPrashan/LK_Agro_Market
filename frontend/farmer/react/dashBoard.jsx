import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import DemandForecast from "./demandForecast";

function DashBoard() {
    const navigate = useNavigate();
    const [myCrops, setCrops] = useState([]);
    const [showOrdersMenu, setShowOrdersMenu] = useState(false);
    const fetchCrops = () => {
        fetch("/backend/getCrops.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                setCrops(data);
            });
    };

    useEffect(() => {
        fetchCrops();
    }, []);
    const deleteCrop = async (cropId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this listing?"
        );

        if (!confirmDelete) return;

        try {

            const response = await fetch("/backend/deleteCrop.php", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                credentials: "include",

                body: JSON.stringify({
                    crop_id: cropId,
                }),

            });

            const result = await response.json();

            if (result.success) {

                alert(result.message);

                fetchCrops();

            } else {

                alert(result.message);

            }

        } catch (error) {

            console.log(error);

        }

    };
    return (

        <div className="dashboard">
            {showOrdersMenu && (
                <div className="orders-sidebar">

                    <ul>
                        <li className="orders-btn"
                            onClick={() => navigate("/farmer/orders")}>My Orders</li>

                    </ul>
                </div>
            )}
            <div className="content">

                <div>

                    <button
                        className="menu-btn"
                        onClick={() => setShowOrdersMenu(!showOrdersMenu)}
                    >
                        <FaBars />
                    </button>

                </div>

                {/* Header */}
                <div className="page-header">
                    <h1>Hello, Randeniya 👋</h1>
                    <p>Here's what's happening with your farm today.</p>
                </div>

                <div>

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
                <DemandForecast />

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
                                {myCrops.map((crop) => (
                                    <tr key={crop.crop_id}>
                                        <td>{crop.crop_name}</td>
                                        <td>{crop.category}</td>
                                        <td>{crop.quantity} kg</td>
                                        <td>Rs.{crop.price_per_unit}</td>
                                        <td>{crop.harvest_date}</td>

                                        <td>
                                            <span
                                                className={
                                                    crop.crop_status === "active"
                                                        ? "status active-status"
                                                        : "status sold-status"
                                                }
                                            >
                                                {crop.crop_status}
                                            </span>
                                        </td>

                                        <td>

                                            <button
                                                className="edit-btn"
                                                onClick={() =>
                                                    navigate("/farmer/edit-listing", {
                                                        state: {
                                                            crop_id: crop.crop_id,
                                                            cropName: crop.crop_name,
                                                            category: crop.category,
                                                            quantity: crop.quantity,
                                                            harvestDate: crop.harvest_date,
                                                            price: crop.price_per_unit,
                                                            stage: crop.growth_stage,
                                                        },
                                                    })
                                                }
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteCrop(crop.crop_id)}
                                            >
                                                Delete
                                            </button>

                                        </td>
                                    </tr>
                                ))}
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