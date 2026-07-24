import React from "react";
import "../csss/dashBoard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    FaTimes,
    FaSeedling,
    FaClipboardList,
    FaExclamationCircle,
    FaCheck,
} from "react-icons/fa";
import DemandForecast from "./demandForecast";
import { useAuth } from "../../../src/context/AuthContext";
import HeroCarousel from "../../components/HeroCarousel/HeroCarousel";
import farmer1 from "../../assests/png/buyer1.jpg";
import farmer2 from "../../assests/png/buyer2.jpg";
import farmer3 from "../../assests/png/buyer3.jpg";

function DashBoard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myCrops, setCrops] = useState([]);
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
            })
            .catch((err) => console.error("Error fetching crops:", err));
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

    return (
        <div className="dashboard">
            <div className="content">
                {/* Header */}
                <section className="hero" style={{ marginBottom: "28px" }}>
                    <HeroCarousel images={[farmer1, farmer2, farmer3]}>
                        <h1>{welcomeMsg}</h1>
                        <p>Here's what's happening with your farm today.</p>
                    </HeroCarousel>
                </section>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card green" onClick={() => navigate("/farmer/listings")}>
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

                    <div className="stat-card blue" onClick={() => navigate("/farmer/orders")}>
                        <div className="stat-icon">
                            <FaClipboardList />
                        </div>
                        <div className="stat-body">
                            <h4>Pending Orders</h4>
                            <h2>{incomingOrders.length}</h2>
                            <p>View all orders</p>
                        </div>
                    </div>

                    <div className="stat-card red" onClick={() => navigate("/complaints")}>
                        <div className="stat-icon">
                            <FaExclamationCircle />
                        </div>
                        <div className="stat-body">
                            <h4>Complaints</h4>
                            <h2>0</h2>
                            <p>View complaints</p>
                        </div>
                    </div>
                </div>

                <DemandForecast />

                {/* Orders */}
                <div className="orders-section-container" style={{ marginTop: "25px" }}>
                    <div className="section orders-section">
                        <h3>Incoming Orders</h3>
                        {incomingOrders.length > 0 ? (
                            <div className="orders-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "15px" }}>
                                {incomingOrders.map((order) => (
                                    <div className="order-card" key={order.id} style={{ marginTop: 0 }}>
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
                                ))}
                            </div>
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

