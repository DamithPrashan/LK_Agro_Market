import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import DemandForecast from "./demandForecast";
import { useAuth } from "../../../src/context/AuthContext";

function DashBoard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myCrops, setCrops] = useState([]);
    const [showOrdersMenu, setShowOrdersMenu] = useState(false);
    const [welcomeMsg, setWelcomeMsg] = useState("Hello 👋");
    const [incomingOrders, setIncomingOrders] = useState([]);

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
    const fetchCrops = () => {
        fetch("/backend/getCrops.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                setCrops(data);
            });
    };

    const fetchIncomingOrders = () => {
        fetch("/backend/get_farmer_orders.php", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setIncomingOrders(data.orders.filter(o => o.status === "Pending"));
                }
            })
            .catch((err) => console.error("Error fetching incoming orders:", err));
    };

    const handleOrderAction = async (orderId, action) => {
        try {
            const res = await fetch("/backend/update_order_status.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    order_id: orderId,
                    action: action
                }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchIncomingOrders();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Error updating order status.");
        }
    };

    useEffect(() => {
        fetchCrops();
        fetchIncomingOrders();
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
                    <h1>{welcomeMsg}</h1>
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
                                Add Crop
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
                        {incomingOrders.length > 0 ? (
                            incomingOrders.map((order) => (
                                <div className="order-card" key={order.id}>
                                    <p><b>Buyer :</b> {order.buyer}</p>
                                    <p><b>Crop :</b> {order.crop}</p>
                                    <p><b>Quantity :</b> {order.quantity}</p>
                                    <p><b>Collection :</b> {order.date}</p>

                                    <div className="buttons">
                                        <button className="accept" onClick={() => handleOrderAction(order.db_id, 'accept')}>Accept</button>
                                        <button className="decline" onClick={() => handleOrderAction(order.db_id, 'decline')}>Decline</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: "#7f8c8d", fontStyle: "italic", padding: "10px" }}>No new incoming orders.</p>
                        )}
                    </div>

                </div>

            </div>

        </div>
    );
}

export default DashBoard;