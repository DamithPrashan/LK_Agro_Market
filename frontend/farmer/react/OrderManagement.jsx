import React, { useState } from "react";
import "../csss/OrderManagement.css";

function OrderManagement() {
    const [activeTab, setActiveTab] = useState("All");

    const orders = [
        {
            id: "#1001",
            buyer: "ABC Hotel",
            crop: "Tomato",
            quantity: "50 kg",
            date: "2026-08-10",
            status: "Pending",
            payment: "Paid (1/3)",
        },
        {
            id: "#1002",
            buyer: "XYZ Restaurant",
            crop: "Carrot",
            quantity: "100 kg",
            date: "2026-07-28",
            status: "Accepted",
            payment: "Paid (1/3)",
        },
        {
            id: "#1003",
            buyer: "Green Supermarket",
            crop: "Beans",
            quantity: "70 kg",
            date: "2026-07-30",
            status: "Ready",
            payment: "Paid (Full)",
        },
        {
            id: "#1003",
            buyer: "Green Supermarket",
            crop: "Beans",
            quantity: "70 kg",
            date: "2026-07-30",
            status: "Completed",
            payment: "Completed",
        }
    ];

    const filteredOrders =
        activeTab === "All"
            ? orders
            : orders.filter((order) => order.status === activeTab);

    return (
        <div className="order-management">

            <h2 className="page-title">My Orders</h2>

            {/* Tabs */}

            <div className="tabs">

                {["All", "Pending", "Accepted", "Ready", "Completed"].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? "active-tab" : ""
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}

            </div>

            {/* Orders */}

            {filteredOrders.map((order) => (
                <div className="order-card" key={order.id}>

                    <div className="order-header">

                        <h3>Order {order.id}</h3>

                        <span
                            className={`status-badge ${order.status.toLowerCase()
                                }`}
                        >
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

                            <span className="payment-badge">
                                {order.payment}
                            </span>
                        </div>

                    </div>

                    {/* Actions */}

                    <div className="action-buttons">

                        {order.status === "Pending" && (
                            <>
                                <button className="accept-btn">
                                    Accept
                                </button>

                                <button className="partial-btn">
                                    Propose Partial
                                </button>

                                <button className="decline-btn">
                                    Decline
                                </button>
                            </>
                        )}

                        {order.status === "Accepted" && (
                            <button className="ready-btn">
                                Mark Ready
                            </button>
                        )}

                        {order.status === "Ready" && (
                            <button className="complete-btn">
                                Completed
                            </button>
                        )}

                    </div>

                </div>
            ))}
        </div>

    );
    <span
        className={`payment-badge ${order.payment === "Completed"
                ? "payment-completed"
                : ""
            }`}
    >
        {order.payment}
    </span>
}

export default OrderManagement;