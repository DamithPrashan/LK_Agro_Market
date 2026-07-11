import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    FaBars,
    FaTimes,
    FaSeedling,
    FaClipboardList,
    FaExclamationCircle,
    FaPlus,
    FaPen,
    FaTrashAlt,
    FaCheck,
    FaBoxOpen,
} from "react-icons/fa";
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
                setWelcomeMsg(`Welcome back, ${user.name} 👋`);
            } else {
                setWelcomeMsg(`Welcome, ${user.name} 👋`);
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
                    setIncomingOrders(data.orders.filter((o) => o.status === "Pending"));
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
                    action: action,
                }),
                credentials: "include",
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
            {/* Overlay behind the slide-in menu, click to close */}
            {showOrdersMenu && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setShowOrdersMenu(false)}
                />
            )}

            <div className={`orders-sidebar ${showOrdersMenu ? "open" : ""}`}>
                <div className="sidebar-top">
                    <span className="sidebar-title">Quick Menu</span>
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setShowOrdersMenu(false)}
                        aria-label="Close menu"
                    >
                        <FaTimes />
                    </button>
                </div>
                <ul>
                    <li
                        className="orders-btn"
                        onClick={() => navigate("/farmer/orders")}
                    >
                        <FaClipboardList />
                        My Orders
                    </li>
                </ul>
            </div>

            <div className="content">
                {/* Top bar */}
                <div className="menu-bar">
                    <button
                        className="menu-btn"
                        onClick={() => setShowOrdersMenu(!showOrdersMenu)}
                        aria-label="Open menu"
                    >
                        <FaBars />
                    </button>
                </div>

                {/* Header */}
                <div className="page-header">
                    <h1>{welcomeMsg}</h1>
                    <p>Here&apos;s what&apos;s happening with your farm today.</p>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card green">
                        <div className="stat-icon">
                            <FaSeedling />
                        </div>
                        <div className="stat-body">
                            <h4>Active Listings</h4>
                            <h2>
                                {
                                    myCrops.filter((c) => c.crop_status === "active")
                                        .length
                                }
                            </h2>
                            <p>View all listings</p>
                        </div>
                    </div>

                    <div className="stat-card blue">
                        <div className="stat-icon">
                            <FaClipboardList />
                        </div>
                        <div className="stat-body">
                            <h4>Pending Orders</h4>
                            <h2>{incomingOrders.length}</h2>
                            <p>View all orders</p>
                        </div>
                    </div>

                    <div className="stat-card red">
                        <div className="stat-icon">
                            <FaExclamationCircle />
                        </div>
                        <div className="stat-body">
                            <h4>Complaints</h4>
                            <h2>1</h2>
                            <p>View complaints</p>
                        </div>
                    </div>
                </div>

                <DemandForecast />

                {/* Listings + Orders */}
                <div className="bottom-grid">
                    {/* Listings */}
                    <div className="section">
                        <div className="section-header">
                            <h3>My Listings</h3>

                            <button
                                className="add-btn"
                                onClick={() => navigate("/farmer/add-listing")}
                            >
                                <FaPlus />
                                Add Crop
                            </button>
                        </div>

                        {myCrops.length > 0 ? (
                            <div className="table-wrap">
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
                                                <td data-label="Crop">{crop.crop_name}</td>
                                                <td data-label="Category">{crop.category}</td>
                                                <td data-label="Quantity">{crop.quantity} kg</td>
                                                <td data-label="Price / Kg">
                                                    Rs.{crop.price_per_unit}
                                                </td>
                                                <td data-label="Harvest Date">
                                                    {crop.harvest_date}
                                                </td>

                                                <td data-label="Status">
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

                                                <td data-label="Action">
                                                    <div className="row-actions">
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
                                                            <FaPen /> Edit
                                                        </button>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => deleteCrop(crop.crop_id)}
                                                        >
                                                            <FaTrashAlt /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <FaBoxOpen />
                                <p>You don&apos;t have any crop listings yet.</p>
                                <button
                                    className="add-btn"
                                    onClick={() => navigate("/farmer/add-listing")}
                                >
                                    <FaPlus /> Add your first crop
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Orders */}
                    <div className="section orders-section">
                        <h3>Incoming Orders</h3>
                        {incomingOrders.length > 0 ? (
                            incomingOrders.map((order) => (
                                <div className="order-card" key={order.id}>
                                    <div className="order-card-header">
                                        <span className="order-buyer">{order.buyer}</span>
                                        <span className="order-badge">Pending</span>
                                    </div>
                                    <p>
                                        <b>Crop</b> {order.crop}
                                    </p>
                                    <p>
                                        <b>Quantity</b> {order.quantity}
                                    </p>
                                    <p>
                                        <b>Collection</b> {order.date}
                                    </p>

                                    <div className="buttons">
                                        <button
                                            className="accept"
                                            onClick={() =>
                                                handleOrderAction(order.db_id, "accept")
                                            }
                                        >
                                            <FaCheck /> Accept
                                        </button>
                                        <button
                                            className="decline"
                                            onClick={() =>
                                                handleOrderAction(order.db_id, "decline")
                                            }
                                        >
                                            <FaTimes /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state small">
                                <FaClipboardList />
                                <p>No new incoming orders right now.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashBoard;
