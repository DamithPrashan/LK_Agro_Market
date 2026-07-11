import React, { useState, useEffect } from "react";
import "../csss/OrderManagement.css";

function OrderManagement() {
    const [activeTab, setActiveTab] = useState("All");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/backend/get_farmer_orders.php", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to fetch orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (orderId, action) => {
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
                fetchOrders();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Error updating order status.");
        }
    };

    const filteredOrders =
        activeTab === "All"
            ? orders
            : orders.filter((order) => order.status === activeTab);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px", color: "#1a5c2d", fontSize: "18px", fontWeight: "bold" }}>
                Loading Orders...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "100px", color: "#e74c3c", fontSize: "18px", fontWeight: "bold" }}>
                Error: {error}
            </div>
        );
    }

    return (
        <div className="order-management">
            <h2 className="page-title">My Orders</h2>

            {/* Tabs */}
            <div className="tabs">
                {["All", "Pending", "Accepted", "Ready", "Completed"].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? "active-tab" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Orders */}
            {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                    <div className="order-card" key={order.id}>
                        <div className="order-header">
                            <h3>Order {order.id}</h3>
                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="order-details">
                            <div>
                                <p className="label">Buyer</p>
                                <p>{order.buyer}</p>
                            </div>

                            <div>
                                <p className="label">Crop</p>
                                <p>{order.crop}</p>
                            </div>

                            <div>
                                <p className="label">Quantity</p>
                                <p>{order.quantity}</p>
                            </div>

                            <div>
                                <p className="label">Collection Date</p>
                                <p>{order.date}</p>
                            </div>

                            <div>
                                <p className="label">Payment</p>
                                <span className={`payment-badge ${order.payment === "Paid (Full)" ? "payment-completed" : ""}`}>
                                    {order.payment}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="action-buttons">
                            {order.status === "Pending" && (
                                <>
                                    <button className="accept-btn" onClick={() => handleAction(order.db_id, 'accept')}>
                                        Accept
                                    </button>
                                    <button className="decline-btn" onClick={() => handleAction(order.db_id, 'decline')}>
                                        Decline
                                    </button>
                                </>
                            )}

                            {order.status === "Accepted" && (
                                <button className="ready-btn" onClick={() => handleAction(order.db_id, 'ready')}>
                                    Mark Ready
                                </button>
                            )}

                            {order.status === "Ready" && (
                                <button className="complete-btn" onClick={() => handleAction(order.db_id, 'complete')}>
                                    Completed
                                </button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: "#7f8c8d", textAlign: "center", fontStyle: "italic", padding: "20px" }}>
                    No orders found in this category.
                </p>
            )}
        </div>
    );
}

export default OrderManagement;