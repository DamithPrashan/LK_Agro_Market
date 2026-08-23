import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../csss/OrderManagement.css";
import RatingStars from "../../components/ratingStars";
import ReviewModal from "../../components/ReviewModal";
import { useAuth } from "../../../src/context/AuthContext";
import MessageModal from "../../components/MessageModal";
import { readJsonResponse } from "../../utils/readJsonResponse";

const statusKeyMap = {
    "Ready":     "orders.status.ready",
    "ready":     "orders.status.ready",
    "Pending":   "orders.status.pending",
    "pending":   "orders.status.pending",
    "Accepted":  "orders.status.accepted",
    "accepted":  "orders.status.accepted",
    "Declined":  "orders.status.declined",
    "declined":  "orders.status.declined",
    "cancelled": "orders.status.declined",
    "Completed": "orders.status.completed",
    "completed": "orders.status.completed"
};

const tabKeyMap = {
    "All":       "orders.tabAll",
    "Pending":   "orders.status.pending",
    "Accepted":  "orders.status.accepted",
    "Ready":     "orders.status.ready",
    "Completed": "orders.status.completed"
};

const lifecycleKeyMap = {
    pending:            "orders.status.pending",
    waiting_advance:    "orderPresentation.waitingBuyerAdvance",
    advance_paid:       "orderPresentation.advancePaid",
    waiting_final:      "orderPresentation.waitingFinalPayment",
    ready_to_complete:  "orderPresentation.readyToComplete",
    completed:          "orders.status.completed",
    cancelled:          "orderPresentation.cancelled"
};

/** Map payment UI string -> CSS modifier class */
function paymentClass(paymentUI) {
    if (paymentUI === "Paid (Full)") return "paid";
    if (paymentUI === "Paid (1/3)")  return "partial";
    return "unpaid";
}

/** Map payment UI string -> i18n key */
function paymentI18nKey(paymentUI) {
    if (paymentUI === "Paid (Full)") return "orders.paymentPaid";
    if (paymentUI === "Paid (1/3)")  return "orders.paymentPartial";
    return "orders.paymentUnpaid";
}

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
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [readyOrder, setReadyOrder] = useState(null);
    const [collectionDate, setCollectionDate] = useState("");

    const fetchOrders = async () => {
        try {
            const res = await fetch("/backend/get_farmer_orders.php", {
                credentials: "include"
            });
            const data = await readJsonResponse(res, t("errors.failedFetchOrders"));
            if (data.success) {
                setOrders(data.orders);
            } else {
                setError(data.message);
            }
        } catch {
            setError(t("errors.failedFetchOrders"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders();
        // fetchOrders intentionally reloads only on mount; action handlers refresh explicitly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAction = async (orderId, action, confirmedCollectionDate = null) => {
        if (updatingOrderId !== null) return false;
        setUpdatingOrderId(orderId);
        try {
            const res = await fetch("/backend/update_order_status.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: orderId,
                    action: action,
                    ...(confirmedCollectionDate ? { collection_date: confirmedCollectionDate } : {})
                }),
                credentials: "include"
            });
            const data = await readJsonResponse(res, t("errors.submissionFailed"));
            if (data.success) {
                alert(data.message);
                fetchOrders();
                return true;
            } else {
                alert(data.message);
                return false;
            }
        } catch {
            alert(t("errors.submissionFailed"));
            return false;
        } finally {
            setUpdatingOrderId(null);
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
            <div className="orders">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                        const statusClass = order.status.toLowerCase();
                        const badgeLabel = t(
                            lifecycleKeyMap[order.lifecycle_status] ||
                            statusKeyMap[order.status] ||
                            `orders.tab${order.status}`,
                            order.status
                        ).toUpperCase();
                        const pClass = paymentClass(order.payment);

                        return (
                            <div className={`order-card ${statusClass}`} key={order.id}>

                                {/* ── Header ── */}
                                <div className="order-header">
                                    <h3>
                                        {order.crop}
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--g-600)" }}>
                                            {order.reservation_source === "cultivation"
                                                ? t("orderPresentation.cultivationOrder")
                                                : t("orderPresentation.availableCrop")}
                                        </span>
                                    </h3>
                                    <span className={`status-badge ${statusClass}`}>{badgeLabel}</span>
                                </div>

                                {/* ── Body ── */}
                                <div className="order-body">
                                    <p>{t("farmer.orderCardTitle", { id: order.id })}</p>
                                    <p>{t("farmer.buyerLabel")}: {order.buyer}</p>
                                    <p>{t("farmer.quantityLabel")}: {order.quantity}</p>
                                    <p>{t("orderPresentation.unitPrice")}: Rs. {Number(order.unit_price).toLocaleString()}</p>
                                    <p>{t("farmer.totalLabel", "Total")}: Rs. {Number(order.total_amount).toLocaleString()}</p>
                                    <p>{t("farmer.collectionDateLabel")}: {order.date || t("growingPeriod.toBeConfirmed")}</p>

                                    {/* Growing-period extra details */}
                                    {order.reservation_source === "cultivation" && order.timing_model === "growing_period" && <>
                                        <p>{t("growingPeriod.plannedStart")}: {order.planned_start_date || "—"}</p>
                                        <p>{t("growingPeriod.label")}: ~{order.agreed_growing_period_days} {t("growingPeriod.units.days")}</p>
                                        <p>{t("growingPeriod.actualStart")}: {order.cultivation_started_at ? String(order.cultivation_started_at).slice(0, 10) : t("growingPeriod.notStarted")}</p>
                                        {order.planned_start_date && !order.cultivation_started_at && new Date().toISOString().slice(0, 10) > order.planned_start_date && (
                                            <p>{t("growingPeriod.startDelayed")}</p>
                                        )}
                                        {order.estimated_harvest_date && (
                                            <p>{t("growingPeriod.estimatedHarvest")}: {order.estimated_harvest_date}</p>
                                        )}
                                    </>}

                                    {/* Buyer review preview */}
                                    {order.buyer_rating !== null && (
                                        <div className="buyer-review-strip">
                                            <p style={{ margin: "0 0 4px 0", color: "var(--t-3)" }}>
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
                                </div>

                                {/* ── Footer ── */}
                                <div className="order-footer">
                                    <div className="footer-top-row">
                                        {/* Payment badge (left) */}
                                        <span className={`payment-badge ${pClass}`}>
                                            {t(paymentI18nKey(order.payment)).toUpperCase()}
                                        </span>

                                        {/* Secondary Actions (right) */}
                                        <div className="secondary-actions">
                                            <button
                                                className="secondary-btn message-buyer-btn"
                                                style={{ position: "relative" }}
                                                onClick={() => {
                                                    setActiveChatOrder(order);
                                                    setIsChatOpen(true);
                                                }}
                                            >
                                                💬 {t("btn_message_buyer")}
                                                {order.unreadMessages > 0 && (
                                                    <span style={{
                                                        position: "absolute", top: "-8px", right: "-8px",
                                                        background: "#e74c3c", color: "white", borderRadius: "50%",
                                                        padding: "2px 6px", fontSize: "10px", fontWeight: "bold", zIndex: 5
                                                    }}>
                                                        {order.unreadMessages}
                                                    </span>
                                                )}
                                            </button>

                                            <button
                                                className="secondary-btn about-buyer-btn"
                                                onClick={() => setSelectedBuyer({
                                                    userId: order.buyer_user_id,
                                                    userName: order.buyer,
                                                    userLocation: order.buyer_location,
                                                    userRole: "buyer"
                                                })}
                                            >
                                                👤 {t("buttons.aboutBuyer", "About Buyer")}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Primary Action buttons (bottom row) */}
                                    {(order.status === "Pending" ||
                                        (order.status === "Accepted" && order.payment === "Paid (1/3)" && (order.reservation_source !== "cultivation" || order.timing_model !== "growing_period" || (order.cultivation_started_at && order.estimated_harvest_date))) ||
                                        (order.status === "Ready" && order.payment === "Paid (Full)")) && (
                                        <div className="footer-bottom-row">
                                            {order.status === "Pending" && (
                                                <>
                                                    <button className="accept-btn" disabled={updatingOrderId === order.db_id} onClick={() => handleAction(order.db_id, "accept")}>
                                                        {t("buttons.accept")}
                                                    </button>
                                                    <button className="decline-btn" disabled={updatingOrderId === order.db_id} onClick={() => handleAction(order.db_id, "decline")}>
                                                        {t("buttons.decline")}
                                                    </button>
                                                </>
                                            )}

                                            {order.status === "Accepted" && order.payment === "Paid (1/3)" &&
                                                (order.reservation_source !== "cultivation" || order.timing_model !== "growing_period" || (order.cultivation_started_at && order.estimated_harvest_date)) && (
                                                <button
                                                    className="ready-btn"
                                                    disabled={updatingOrderId === order.db_id}
                                                    onClick={() =>
                                                        order.reservation_source === "cultivation" && order.timing_model === "growing_period"
                                                            ? (setReadyOrder(order), setCollectionDate(""))
                                                            : handleAction(order.db_id, "ready")
                                                    }
                                                >
                                                    {t("buttons.markReady")}
                                                </button>
                                            )}

                                            {order.status === "Ready" && order.payment === "Paid (Full)" && (
                                                <button className="complete-btn" disabled={updatingOrderId === order.db_id} onClick={() => handleAction(order.db_id, "complete")}>
                                                    {t("orderPresentation.complete")}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ color: "#7f8c8d", textAlign: "center", fontStyle: "italic", padding: "40px", gridColumn: "1/-1" }}>
                        {t("farmer.noOrdersCategory")}
                    </p>
                )}
            </div>

            {/* Modals */}
            {selectedBuyer && (
                <ReviewModal
                    userId={selectedBuyer.userId}
                    userName={selectedBuyer.userName}
                    userLocation={selectedBuyer.userLocation}
                    userRole={selectedBuyer.userRole}
                    onClose={() => setSelectedBuyer(null)}
                />
            )}

            {readyOrder && (
                <div className="collection-date-modal" role="dialog" aria-modal="true" aria-labelledby="collection-date-title">
                    <div className="collection-date-panel">
                        <h3 id="collection-date-title">{t("growingPeriod.confirmCollectionDate")}</h3>
                        <p>{t("growingPeriod.startedOn")}: {String(readyOrder.cultivation_started_at).slice(0, 10)}</p>
                        <p>{t("growingPeriod.estimatedHarvest")}: {readyOrder.estimated_harvest_date}</p>
                        <p>{t("growingPeriod.label")}: ~{readyOrder.agreed_growing_period_days} {t("growingPeriod.units.days")}</p>
                        <label>
                            {t("growingPeriod.collectionDate")}
                            <input type="date" min={readyOrder.estimated_harvest_date} value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
                        </label>
                        <div className="collection-date-actions">
                            <button type="button" onClick={() => { setReadyOrder(null); setCollectionDate(""); }}>{t("buttons.cancel")}</button>
                            <button
                                type="button"
                                className="ready-btn"
                                disabled={!collectionDate || updatingOrderId !== null}
                                onClick={async () => { if (await handleAction(readyOrder.db_id, "ready", collectionDate)) { setReadyOrder(null); setCollectionDate(""); } }}
                            >
                                {t("growingPeriod.confirmAndMarkReady")}
                            </button>
                        </div>
                    </div>
                </div>
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
