import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../csss/OrderManagement.css";

const statusKeyMap = {
    "Ready": "orders.status.ready",
    "ready": "orders.status.ready",
    "Pending": "orders.status.pending",
    "pending": "orders.status.pending",
    "Accepted": "orders.status.accepted",
    "accepted": "orders.status.accepted",
    "Declined": "orders.status.declined",
    "declined": "orders.status.declined",
    "cancelled": "orders.status.declined",
    "Completed": "orders.status.completed",
    "completed": "orders.status.completed"
};

const tabKeyMap = {
    "All": "orders.tabAll",
    "Pending": "orders.status.pending",
    "Accepted": "orders.status.accepted",
    "Ready": "orders.status.ready",
    "Completed": "orders.status.completed"
};

function OrderManagement() {
    const { t } = useTranslation();
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
            setError(t("errors.failedFetchOrders"));
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
            alert(t("errors.submissionFailed"));
        }
    };

    const filteredOrders =
        activeTab === "All"
            ? orders
            : orders.filter((order) => order.status === activeTab);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px", color: "#1a5c2d", fontSize: "18px", fontWeight: "bold" }}>
                {t("farmer.loadingOrders")}
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "100px", color: "#e74c3c", fontSize: "18px", fontWeight: "bold" }}>
                {t("errors.genericError")}: {error}
            </div>
        );
    }

    return (
        <div className="order-management">
            <h2 className="page-title">{t("farmer.ordersTitle")}</h2>

            {/* Tabs */}
            <div className="tabs">
                {["All", "Pending", "Accepted", "Ready", "Completed"].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? "active-tab" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {t(tabKeyMap[tab] || `orders.tab${tab}`, tab)}
                    </button>
                ))}
            </div>

            {/* Orders */}
            {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                    <div className="order-card" key={order.id}>
                        <div className="order-header">
                            <h3>{t("farmer.orderCardTitle", { id: order.id })}</h3>
                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                {t(statusKeyMap[order.status] || `orders.tab${order.status}`, order.status)}
                            </span>
                        </div>

                        <div className="order-details">
                            <div>
                                <p className="label">{t("farmer.buyerLabel")}</p>
                                <p>{order.buyer}</p>
                            </div>

                            <div>
                                <p className="label">{t("farmer.cropLabel")}</p>
                                <p>{order.crop}</p>
                            </div>

                            <div>
                                <p className="label">{t("farmer.quantityLabel")}</p>
                                <p>{order.quantity}</p>
                            </div>

                            <div>
                                <p className="label">{t("farmer.collectionDateLabel")}</p>
                                <p>{order.date}</p>
                            </div>

                            <div>
                                <p className="label">{t("farmer.paymentLabel")}</p>
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
                                        {t("buttons.accept")}
                                    </button>
                                    <button className="decline-btn" onClick={() => handleAction(order.db_id, 'decline')}>
                                        {t("buttons.decline")}
                                    </button>
                                </>
                            )}

                            {order.status === "Accepted" && (
                                <button className="ready-btn" onClick={() => handleAction(order.db_id, 'ready')}>
                                    {t("buttons.markReady")}
                                </button>
                            )}

                            {order.status === "Ready" && (
                                <button className="complete-btn" onClick={() => handleAction(order.db_id, 'complete')}>
                                    {t("buttons.completePayment", "Completed")}
                                </button>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p style={{ color: "#7f8c8d", textAlign: "center", fontStyle: "italic", padding: "20px" }}>
                    {t("farmer.noOrdersCategory")}
                </p>
            )}
        </div>
    );
}

export default OrderManagement;