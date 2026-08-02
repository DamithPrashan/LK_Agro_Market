import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../csss/OrderManagement.css";
import RatingStars from "../../components/ratingStars";
import ReviewModal from "../../components/ReviewModal";
import { useAuth } from "../../../src/context/AuthContext";
import MessageModal from "../../components/MessageModal";

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
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("All");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeChatOrder, setActiveChatOrder] = useState(null);

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

                        {/* Buyer review preview */}
                        {order.buyer_rating !== null && (
                            <div style={{ marginTop: "12px", padding: "10px", background: "#f9f9f9", borderRadius: "8px", borderLeft: "4px solid #f1c40f" }}>
                                <p className="label" style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--t-3)" }}>
                                    {t("ratings.buyerReview", "Buyer Review Received")}
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                    <RatingStars value={order.buyer_rating} readOnly size={16} />
                                    {order.buyer_comment && (
                                        <span style={{ fontSize: "12px", color: "var(--t-2)", fontStyle: "italic" }}>
                                            "{order.buyer_comment.length > 60 ? order.buyer_comment.slice(0, 60) + "..." : order.buyer_comment}"
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="action-buttons" style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                            <button 
                                className="message-buyer-btn"
                                style={{
                                    background: "#1a5c2d",
                                    border: "none",
                                    color: "#ffffff",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "background 0.2s"
                                }}
                                onClick={() => {
                                    setActiveChatOrder(order);
                                    setIsChatOpen(true);
                                }}
                            >
                                💬 {t("btn_message_buyer")}
                                {order.unreadMessages > 0 && (
                                    <span style={{
                                        position: "absolute",
                                        top: "-8px",
                                        right: "-8px",
                                        background: "#e74c3c",
                                        color: "white",
                                        borderRadius: "50%",
                                        padding: "2px 6px",
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        zIndex: 5
                                    }}>
                                        {order.unreadMessages}
                                    </span>
                                )}
                            </button>

                            <button 
                                className="about-buyer-btn"
                                style={{
                                    background: "#f1f2f6",
                                    border: "1px solid #ced6e0",
                                    color: "#2f3542",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "background 0.2s"
                                }}
                                onClick={() => setSelectedBuyer({
                                    userId: order.buyer_user_id,
                                    userName: order.buyer,
                                    userLocation: order.buyer_location,
                                    userRole: "buyer"
                                })}
                            >
                                👤 {t("buttons.aboutBuyer", "About Buyer")}
                            </button>

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

            {selectedBuyer && (
                <ReviewModal
                    userId={selectedBuyer.userId}
                    userName={selectedBuyer.userName}
                    userLocation={selectedBuyer.userLocation}
                    userRole={selectedBuyer.userRole}
                    onClose={() => setSelectedBuyer(null)}
                />
            )}

            {isChatOpen && activeChatOrder && (
                <MessageModal
                    isOpen={isChatOpen}
                    onClose={() => {
                        setIsChatOpen(false);
                        setActiveChatOrder(null);
                        fetchOrders();
                    }}
                    reservationId={activeChatOrder.db_id}
                    currentUserId={user?.id}
                    otherUserName={activeChatOrder.buyer}
                    otherUserRole="buyer"
                    cropName={activeChatOrder.crop}
                />
            )}
        </div>
    );
}

export default OrderManagement;